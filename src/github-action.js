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

function runFmt(options) {
  core.startGroup(`Validating changelog format`);

  fmt(options);

  console.log('Changelog is valid');
  core.endGroup();
}

function runAdd(change_title, change_type, options) {
  // Add change to changelog
  core.startGroup('Updating changelog');
  options.type = change_type;

  console.log(`change_title: ${change_title}`);
  console.log(`change_type: ${change_type}`);

  add(change_title, undefined, options);

  console.log(`Done`);
  core.endGroup()
}

function runRelease(version, options) {
  // Add release to changelog
  core.startGroup(`Adding release ${version} to changelog`);

  release(version, options);

  console.log(`Done`);
  core.endGroup();
}

function getChangeType(title) {
  const change_types = {
    added: /add(s|ed|ing)?\b/i,
    changed: /chang(e(s|d)?|ing)\b/i,
    deprecated: /deprecat(e(s|d)?|ing)\b/i,
    removed: /(remov|delet)(e(s|d)?|ing)\b/i,
    security: /(security|cve)\b/i,
    fixed: /fix\b/i,
  };

  for (const change_type of change_types) {
    // Check if title matches change type
    if (change_types[change_type].test(title)) {
      return change_type;
    }
  }
}

function handlePullRequest(options) {
  const title = github.context.payload.pull_request.title;

  // Check if PR title contains a change type keyword
  const change_type = getChangeType(title);
  if (change_type) {
    const change_title = `${title} [#${github.context.payload.pull_request.number}](${github.context.payload.pull_request.html_url})`;
    runAdd(change_title, change_type, options);
    return;
  }

  // Check if PR title contains release keyword
  if (/release/i.test(title)) {
    // Regular expression to match a semantic version
    // https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
    const semverRegex = /(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?/
    const [version] = title.match(semverRegex) ?? [];
    if (version) {
      runRelease(version, options);
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
    // Found changes to commit
  }

  await exec.exec('git', ['config', 'user.name', 'github-actions[bot]']);
  await exec.exec('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
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
      handlePullRequest(options);
      pushChanges(options);
      break;
  }
} catch (error) {
  core.setFailed(error.message);
}
