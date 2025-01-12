import core from '@actions/core';
import github from '@actions/github';
import exec from '@actions/exec';

import { add } from './add.js';
import { fmt } from './fmt.js';
import { release } from './release.js';

function runFmt(write, silent, options) {
  core.startGroup(`Validating changelog format`);
  options.write = write;
  options.silent = silent;

  fmt(options);

  console.log('Changelog is valid');
  core.endGroup();
}

function runAdd(title, description, type, options) {
  // Add change to changelog
  core.startGroup('Updating changelog');
  options.type = type;

  console.log(`title: ${title}`);
  console.log(`description: ${description}`);
  console.log(`type: ${type}`);

  add(title, description, options);

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

  for (const change_type in change_types) {
    // Check if title matches change type
    if (change_types[change_type].test(title)) {
      return change_type;
    }
  }
}

async function pushChanges(options) {
  core.startGroup('Pushing changes to repository');

  const message = core.getInput('commit_message');
  const user_name = core.getInput('commit_username');
  const user_email = core.getInput('commit_email');

  const ref = process.env.GITHUB_REF;
  //const ref = github.context.payload.pull_request.head.ref;

  try {
    await exec.exec('git', ['diff', '--exit-code', '--output', '/dev/null', '--', options.path]);
    console.log('No changes to commit');
    return;
  } catch (error) {
    // Found changes to commit
  }

  await exec.exec('git', ['config', 'user.name', user_name]);
  await exec.exec('git', ['config', 'user.email', user_email]);
  await exec.exec('git', ['commit', '-m', message, options.path]);
  // TODO: find ref somewhere else for other events
  await exec.exec('git', ['push', 'origin', `HEAD:${ref}`]);

  console.log('Done');
  core.endGroup();
}

function handlePullRequest(options) {
  const title = github.context.payload.pull_request.title;

  // TODO: Check for PR status open or reopen

  // Check if PR title contains a change type keyword
  const change_type = getChangeType(title);
  if (change_type) {
    const change_title = `${title} [#${github.context.payload.pull_request.number}](${github.context.payload.pull_request.html_url})`;
    runAdd(change_title, undefined, change_type, options);
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

  console.log(`No change type or release keyword found in PR title: ${title}`);
}

function handleAutoAction(options) {
  switch (github.context.eventName) {
    case 'push':
      runFmt(false, true, options);
      break;
    case 'pull_request':
      handlePullRequest(options);
      break;
  }
}

try {
  const action = core.getInput('action');
  const options = {
    path: core.getInput('path'),
    format: core.getInput('format'),
    encoding: core.getInput('encoding')
  };

  switch (action) {
    case 'auto':
      handleAutoAction(options);
    case 'fmt':
      runFmt(core.getInput('fmt_write'), true, options);
      break;
    case 'add':
      runAdd(core.getInput('add_title'), core.getInput('add_description'), core.getInput('add_type'), options);
      break;
    case 'release':
      runRelease(core.getInput('release_version'), options);
      break;
    default:
      core.setFailed(`Invalid action: ${action}`);
  }

  if (core.getInput('commit')) {
    pushChanges(options);
  }
} catch (error) {
  core.setFailed(error.message);
}
