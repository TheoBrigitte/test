import core from "@actions/core";
import github from "@actions/github";
import exec from "@actions/exec";

import { add } from "./add.js";
import { fmt } from "./fmt.js";
import { release } from "./release.js";

// Parse and format changelog file
function runFmt(write, options) {
  core.startGroup(`Validating changelog format`);
  options.write = write;
  options.silent = true;

  fmt(options);

  console.log("Changelog is valid");
  core.endGroup();
}

// Adds a new change to changelog
function runAdd(title, description, type, options) {
  core.startGroup("Updating changelog");
  options.type = type;

  console.log(`title: ${title}`);
  console.log(`description: ${description}`);
  console.log(`type: ${type}`);

  add(title, description, options);

  console.log(`Done`);
  core.endGroup()
}

// Create a new release
function runRelease(version, options) {
  core.startGroup(`Adding release ${version} to changelog`);

  release(version, options);

  console.log(`Done`);
  core.endGroup();
}

// Match change type keyword in title and return change type
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

// Commit and push changes to repository
async function pushChanges(options) {
  core.startGroup("Pushing changes to repository");

  const message = core.getInput("commit_message");
  const user_name = core.getInput("commit_username");
  const user_email = core.getInput("commit_user_email");

  console.log(github.context);
  const ref = github.context.payload.pull_request?.head.ref || github.context.payload.ref;
  if (!ref) {
    throw new Error("No ref found");
  }

  try {
    await exec.exec("git", ["diff", "--exit-code", "--output", "/dev/null", "--", options.file]);
    console.log("No changes to commit");
    return;
  } catch (error) {
    // Found changes to commit
  }

  await exec.exec("git", ["config", "user.name", user_name]);
  await exec.exec("git", ["config", "user.email", user_email]);
  await exec.exec("git", ["commit", "-m", message, options.file]);
  await exec.exec("git", ["push", "origin", `HEAD:${ref}`]);

  console.log("Done");
  core.endGroup();
}

function handlePullRequest(options) {
  const title = github.context.payload.pull_request.title;

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
    case "push":
      // Only parse changelog file
      runFmt(false, options);
      break;
    case "pull_request":
      handlePullRequest(options);
      break;
  }
}

try {
  const action = core.getInput("action");
  const options = {
    file: core.getInput("file"),
    format: core.getInput("format"),
    encoding: core.getInput("encoding")
  };

  switch (action) {
    case "auto":
      handleAutoAction(options);
      break;
    case "fmt":
      runFmt(core.getInput("fmt_write"), options);
      break;
    case "release":
      runRelease(core.getInput("release_version"), options);
      break;
    default:
      core.setFailed(`Invalid action: ${action}`);
      break;
  }

  if (core.getBooleanInput("commit")) {
    pushChanges(options);
  }
} catch (error) {
  core.setFailed(error.message);
}
