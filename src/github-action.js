import core from '@actions/core';
import github from '@actions/github';
import exec from '@actions/exec';

import { add } from './add.js';
import { fmt } from './fmt.js';
import { release } from './release.js';

const options = {
  path: core.getInput('path'),
  format: core.getInput('format'),
  encoding: core.getInput('encoding')
};

// Regular expression to match a semantic version
// source: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const semverRegex = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/

function runFmt(options) {
  fmt(options);
  console.log('Changelog is valid');
}

function runPullRequest(options) {
  const change_types = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];
  const title = github.context.payload.pull_request.title;

  for (const change_type of change_types) {
    // Check if PR title contains a change type keyword
    if (new RegExp(change_type, "i").test(title)) {
      // Add change to changelog
      const change_title = `${title} [#${github.context.payload.pull_request.number}](${github.context.payload.pull_request.url})`;
      options.type = change_type;
      add(change_title, undefined, options);
      console.log(`Added pull request ${github.context.payload.pull_request.number} to changelog`);
      return;
    }
  }

  // Check if PR title contains release keyword
  if (new RegExp('release', "i").test(title)) {
    const [version] = title.match(semverRegex) ?? [];
    if (version) {
      // Add release to changelog
      release(version, options);
      console.log(`Added release ${version} to changelog`);
      return;
    }
  }
}

async function pushChanges(options) {
  console.log('Pushing changes');
  const ret = await exec.exec('git', ['diff', '--exit-code', '--output', '/dev/null', '--', options.path]);
  if (ret === 0) {
    console.log('No changes to commit');
    return;
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions']);
  await exec.exec('git', ['config', 'user.email', 'action@github.com']);
  await exec.exec('git', ['commit', '-m', 'Update changelog', options.path]);
  await exec.exec('git', ['push', 'origin', `HEAD:${github.context.payload.head.ref}`]);
  console.log('Pushed changes');
}

try {
  switch (github.context.eventName) {
    case 'push':
      runFmt(options);
      break;
    case 'pull_request':
      runPullRequest(options);
      pushChanges(options);
      break;
  }
} catch (error) {
  core.setFailed(error.message);
}
