import { parser } from "keep-a-changelog";
import fs from "fs";

// Merges changes from source changelog into changelog's unreleased changes.
export function merge(source, options) {
  const s = source.split('@');
  const sourceFile = s[0];
  const fromRelease = s[1]?.replace(/^v/, "");

  // Read and parse changelog files
  const sourceChangelog = parser(fs.readFileSync(sourceFile, "UTF-8"));
  const destinationChangelog = parser(fs.readFileSync(options.path, "UTF-8"));

  // Set format
  sourceChangelog.format = options.format;
  destinationChangelog.format = options.format;

  let changesByCategories;
  if (fromRelease) {
    // Find all changes from source changelog from a specific release
    changesByCategories = changesFromRelease(sourceChangelog, fromRelease);
  } else {
    // Find latest release changes in source changelog
    changesByCategories = sourceChangelog.releases.find((release) =>
      release.date && release.version
    ).changes;
  }

  if (!changesByCategories || changesByCategories.size === 0) {
    throw new Error(`no changes found`);
  }

  // Find unreleased changes in destination changelog
  const unreleased = destinationChangelog.findRelease();

  // Merge changes from source latest release to destination unreleased
  changesByCategories.forEach((changes, type) => {
    changes.forEach((change) => {
      unreleased.addChange(type, change);
    });
  });

  // Write changes to destination changelog
  fs.writeFileSync(options.file, destinationChangelog.toString());
}

// Get all changes from source changelog from a specific release up to the latest release
export function changesFromRelease(sourceChangelog, fromRelease) {
  // Ensure releases are sorted
  sourceChangelog.sortReleases();

  // Find index of fromRelease in source changelog releases
  const fromReleaseIndex = sourceChangelog.releases.findIndex((release) =>
    release.version === fromRelease
  );

  // Find index of latest release in source changelog releases
  // this is to ensure that we only get changes up to the latest release
  // and not any unreleased changes
  const latestIndex = sourceChangelog.releases.findIndex((release) =>
    release.date && release.version
  );

  // Get all changes from source changelog from fromRelease up to the latest release
  // ordered by latest changes first
  let changes = new Map();
  for (let i = latestIndex; i <= fromReleaseIndex; i++) {
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
