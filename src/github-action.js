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
  core.startGroup(`Validating changelog format`);

  fmt(options);

  console.log('Changelog is valid');
  core.endGroup();
}

function runPullRequest(options) {
  const change_types = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];
  const title = github.context.payload.pull_request.title;

  for (const change_type of change_types) {
    // Check if PR title contains a change type keyword
    if (new RegExp(change_type, "i").test(title)) {
      // Add change to changelog
      core.startGroup('Updating changelog');
      const change_title = `${title} [#${github.context.payload.pull_request.number}](${github.context.payload.pull_request.html_url})`;
      options.type = change_type;

      console.log(`change_title: ${change_title}`);
      console.log(`change_type: ${change_type}`);

      add(change_title, undefined, options);

      console.log(`Done`);
      core.endGroup()
      return;
    }
  }

  // Check if PR title contains release keyword
  if (new RegExp('release', "i").test(title)) {
    const [version] = title.match(semverRegex) ?? [];
    if (version) {
      // Add release to changelog
      core.startGroup(`Adding release ${version} to changelog`);

      release(version, options);

      console.log(`Done`);
      return;
    }
  }
}

async function pushChanges(options) {
  core.startGroup('Pushing changes to repository');

  try {
    await exec.exec('git', ['diff', '--exit-code', '--output', '/dev/null', '--', options.path]);
    console.log('No changes to commit');
    return;
  } catch (error) {
    // Changes to commit
  }

  await exec.exec('git', ['config', 'user.name', 'changelog-manager[bot]']);
  await exec.exec('git', ['config', 'user.email', 'changelog-manager.bot@users.noreply.github.com']);
  await exec.exec('git', ['commit', '-m', 'Update changelog', options.path]);
  await exec.exec('git', ['push', 'origin', `HEAD:${github.context.payload.pull_request.head.ref}`]);

  console.log('Done');
  core.endGroup();
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
