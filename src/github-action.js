import core from '@actions/core';

import { fmt } from './fmt.js';

const changelogPath = core.getInput('path');
const encoding = core.getInput('encoding');

try {
  fmt(changelogPath, { encoding });
  console.log('Changelog is valid');
} catch (error) {
  core.setFailed(error.message);
}
