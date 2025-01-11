import { Changelog, Release } from "keep-a-changelog";
import fs from "fs";

export function init(file, options) {
  const changelog = new Changelog(options.title, options.description);
  changelog.format = options.format

  const unreleased = new Release();
  changelog.addRelease(unreleased);

  fs.writeFileSync(file, changelog.toString(), { encoding: options.encoding });
}
