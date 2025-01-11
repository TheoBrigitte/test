import core from '@actions/core';

import { fmt } from './fmt.js';

const changelogPath = core.getInput('path');
const options = {
  format: core.getInput('format'),
  encoding: core.getInput('encoding')
};

try {
  fmt(changelogPath, options);
  console.log('Changelog is valid');
} catch (error) {
  core.setFailed(error.message);
}
