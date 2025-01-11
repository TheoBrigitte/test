import { parser } from "keep-a-changelog";
import fs from "fs";

export function fmt(file, options) {
  parser(fs.readFileSync(file, options.encoding));
}
