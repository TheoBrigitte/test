const core = require('@actions/core');

import { parser } from "keep-a-changelog";
import fs from "fs";

const changelogPath = core.getInput('path');
const encoding = core.getInput('encoding');

try {
  parser(fs.readFileSync(changelogPath, encoding));
  console.log('Changelog is valid');
} catch (error) {
  core.setFailed(error.message);
}
