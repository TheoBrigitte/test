import { parser } from "keep-a-changelog";
import fs from "fs";

// Merge changes from multiple source changelog files.
export function mergeMultiple(sources, options) {
  sources.forEach((source) => {
    try {
      merge(source, options);
      console.log(`Merged ${source}`);
    } catch (error) {
      console.error(`Failed ${source}: ${error.message}`);
    }
  });
}

// Merges changes from source changelog.
export function merge(source, options) {
  const s = source.split("@");
  const sourceFile = s[0];
  const sourceRelease = s[1]?.replace(/^v/, "") || "latest";

  // Read and parse changelog files
  const sourceChangelog = parser(fs.readFileSync(sourceFile, options.encoding));
  const destinationChangelog = parser(fs.readFileSync(options.file, options.encoding));

  // Set format
  sourceChangelog.format = options.format;
  destinationChangelog.format = options.format;

  // Get changes from sourceChangelog
  const changesByCategories = changesFromRelease(sourceChangelog, sourceRelease, options);
  if (!changesByCategories || changesByCategories.size === 0) {
    throw new Error(`no changes found`);
  }

  // Find destination release in destination changelog
  const destinationVersion = options.into == "unreleased" ? undefined : options.into;
  const destinationRelease = destinationChangelog.findRelease(destinationVersion);
  if (!destinationRelease) {
    throw new Error(`${destinationVersion} release not found`);
  }

  // Merge changes from source to destination changelog
  changesByCategories.forEach((changes, type) => {
    changes.forEach((change) => {
      destinationRelease.addChange(type, change);
    });
  });

  // Write changes to destination changelog
  fs.writeFileSync(options.file, destinationChangelog.toString());
}

// Get changes from source changelog starting at sourceRelease up to the number of releases specified in options.number
export function changesFromRelease(sourceChangelog, sourceRelease, options) {
  // Ensure releases are sorted
  sourceChangelog.sortReleases();

  // Find start index according to sourceRelease
  let startIndex;
  switch (sourceRelease) {
    case "latest":
      startIndex = sourceChangelog.releases.findIndex((release) =>
        release.date && release.version
      );
      break;
    case "unreleased":
      startIndex = sourceChangelog.releases.findIndex((release) =>
        !release.version
      );
      break;
    default:
      startIndex = sourceChangelog.releases.findIndex((release) =>
        release.date && release.version === sourceRelease
      );
  }

  // Compute end index according to options.number
  let endIndex = startIndex + options.number;
  if (options.number < 0) {
    // Set endIndex to oldest release if number is negative
    endIndex = sourceChangelog.releases.length - 1;
  }

  // Collect changes from startIndex up to endIndex ordered by latest changes first
  let changes = new Map();
  for (let i = startIndex; i <= endIndex; i++) {
    const release = sourceChangelog.releases[i];
    release.changes.forEach((change, type) => {
      if (!changes.has(type)) {
        changes.set(type, []);
      }
      changes.get(type).push(...change);
    });
  }

  return changes;
}
