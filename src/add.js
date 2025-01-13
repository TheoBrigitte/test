import { parser, Release, Change } from "keep-a-changelog";
import fs from "fs";

// Add a new change to the changelog
export function add(title, description, options) {
  // Parse changelog file
  const changelog = parser(fs.readFileSync(options.file, options.encoding));
  changelog.format = options.format;

  // Find or create unreleased changes
  let unreleased = changelog.findRelease();
  if (!unreleased) {
    unreleased = new Release();
    changelog.addRelease(unreleased);
  }

  // Add new change to unreleased changes
  const newChange = new Change(title, description);
  unreleased.addChange(options.type, newChange);

  // Save changes to file
  fs.writeFileSync(options.file, changelog.toString());
}
