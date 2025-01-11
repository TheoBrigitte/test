import core from '@actions/core';

import { cmd } from './main.js';

const command = core.getInput('command');
const options = {
  path: core.getInput('path'),
  format: core.getInput('format'),
  encoding: core.getInput('encoding')
};

const args = [
  ...process.argv.slice(0, 2),
  command,
  '--path',
  options.path,
  '--format',
  options.format,
  '--encoding',
  options.encoding
];

let successMessage;
switch (command) {
  case 'fmt':
    successMessage = 'Changelog is valid';
    break;
  case 'release':
    const version = core.getInput('release_version');
    args.push(version);
    successMessage = `Released version ${version}`;
    break;
  default:
    throw new Error(`Unsupported command: ${command}`);
}

try {
  cmd().parse(args);
  console.log(successMessage);
} catch (error) {
  core.setFailed(error.message);
}
