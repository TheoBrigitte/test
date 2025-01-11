import core from '@actions/core';

import { fmt } from './fmt.js';

const options = {
  path: core.getInput('path'),
  format: core.getInput('format'),
  encoding: core.getInput('encoding')
};

try {
  fmt(options);
  console.log('Changelog is valid');
} catch (error) {
  core.setFailed(error.message);
}
