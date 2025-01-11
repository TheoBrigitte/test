import core from '@actions/core';
import github from '@actions/github';

import add from './add.js';
import fmt from './fmt.js';
import release from './release.js';

const options = {
  path: core.getInput('path'),
  format: core.getInput('format'),
  encoding: core.getInput('encoding')
};

const re = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/

console.log(github.context);
try {
  switch (github.context.eventName) {
    case 'push':
      runFmt(options);
      break;
    case 'pull_request':
      runPullRequest(options);
      break;
  }
} catch (error) {
  core.setFailed(error.message);
}

function runFmt(options) {
  fmt(options);
  console.log('Changelog is valid');
}

function runPullRequest(options) {
  const keywords = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];

  for (const keyword of keywords) {
    // Check if PR title contains a change type keyword
    const title = github.context.payload.pull_request.title;
    if (new RegExp(keyword, "i").test(title)) {
      // Add change to changelog
      add(title, undefined, options);
      console.log(`Added change to changelog: ${title}`);
      return;
    }
  }

  // Check if PR title contains a release keyword
  if (new RegExp('release', "i").test(title)) {
    const [version] = title.match(re) ?? [];
    if (version) {
      // Add release to changelog
      release(version, options);
      console.log(`Added release ${version} to changelog`);
      return;
    }
  }
}
