import { parser } from "keep-a-changelog";
import fs from "fs";

// Initialize a new changelog file
export function listReleases(options) {
  // Read changelog file
  const changelog = parser(fs.readFileSync(options.file, options.encoding));
  changelog.sortReleases();

  const releases = changelog.releases.filter((release) =>
    release.date && release.version
  )

  for (const release of releases) {
    console.log(release.version?.toString());
  }
}
