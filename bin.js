#!/usr/bin/env node

import { Command } from 'commander';
import { Release } from "keep-a-changelog";
import { add } from './src/add.js';
import { fmt } from './src/fmt.js';
import { init } from './src/init.js';
import { merge } from './src/merge.js';
import { mergeMultiple } from './src/mergeMultiple.js';
import { release } from './src/release.js';

class rootCommand extends Command {
  createCommand(name) {
    const cmd = new Command(name);
    // Add global options
    cmd.option('--format <format>', 'Changelog format', 'markdownlint');
    cmd.option('--encoding <encoding>', 'Changelog file encoding', 'UTF-8');
    cmd.option('--path <path>', 'Changelog file path', 'CHANGELOG.md');
    return cmd;
  }
}

const program = new rootCommand();

// Define the main program
program
  .name("changelog-manager")
  .description("Manage changelog files")
  .version("0.1.0")

// Define commands
program
  .command("add")
  .description("Add a new change to the changelog")
  .argument("<title>", "Change title")
  .argument("[description]", "Change description", "")
  .option("--type <type>", "Change type (allowed values: "+ new Release().changes.keys().toArray().join(', ')+")", "added")
  .action(add);

program
  .command("fmt")
  .description("Format changelog file")
  .action(fmt);

program
  .command("init")
  .description("Initialize a new changelog file")
  .option("--title <title>", "Changelog title", "Changelog")
  .option("--description <description>", "Changelog description")
  .option("--url <url>", "Changelog URL", "https://example.com")
  .option("--initial-version <initial-version>", "Initial release version. Set to '' to skip initial release creation, not that compare links section will not be initialized without this.", "0.1.0")
  .action(init);

program
  .command("merge")
  .description("Merge changes from source changelog into unreleased changes")
  .argument("<source>", "Source changelog file. Can contain a version to merge from, e.g. source@1.0.0, if not specified, latest release will be used")
  .option("--from-release <version>", "Merge changes from a specific release version up to the latest release")
  .action(merge);

program
  .command("merge-multiple")
  .summary("Merge changes from multiple changelog files into unreleased changes")
  .argument("<sources...>", "Multiple source changelog files. Using same format as merge command")
  .action(mergeMultiple);

program
  .command("release")
  .description("Release the unreleased changes")
  .argument("<version>", "Release version")
  .action(release);

// Parse and run the program
try {
  program.parse();
} catch (error) {
  if (error instanceof Error) {
    console.error(`Failed: ${error.message}`);
    process.exit(1);
  }
}
