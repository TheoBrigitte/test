import { parser } from "keep-a-changelog";
import fs from "fs";

export function fmt(file, options) {
  const format = options.format ?? "markdownlint";

  const changelog = parser(fs.readFileSync(file, "UTF-8"));
  changelog.format = format;

  fs.writeFileSync(file, changelog.toString());
}
