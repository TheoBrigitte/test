import core from '@actions/core';

import { fmt } from './fmt.js';

const changelogPath = core.getInput('path') || 'CHANGELOG.md';
const encoding = core.getInput('encoding') || 'utf-8';

try {
  fmt(changelogPath, { encoding });
  console.log('Changelog is valid');
} catch (error) {
  core.setFailed(error.message);
}
