#!/usr/bin/env node

import { Command } from 'commander';
import { fmt } from './src/fmt.js';
import { mergeAction } from './src/merge.js';
import { mergeMultiple } from './src/mergeMultiple.js';

class rootCommand extends Command {
  createCommand(name) {
    const cmd = new Command(name);
    cmd.option('--format <format>', 'Changelog format', 'markdownlint');
    cmd.option('--encoding <encoding>', 'Changelog file encoding', 'UTF-8');
    return cmd;
  }
}

const program = new rootCommand();

// Define the main program
program
  .name("changelog-manager")
  .description("Manage changelog files")
  .version("0.1.0")

program
  .command("fmt")
  .description("Format changelog file")
  .argument("<file>", "Changelog file to format")
  .action(fmt);

// Define merge command
program
  .command("merge")
  .description("Merge changes from source changelog into destination changelog unreleased changes")
  .argument("<destination>", "Destination changelog file")
  .argument("<source>", "Source changelog file. Can contain a version to merge from, e.g. source@1.0.0, if not specified, latest release will be used")
  .option("--from-release <version>", "Merge changes from a specific release version up to the latest release")
  .action(mergeAction);

program
  .command("merge-multiple")
  .summary("Merge changes from multiple changelog files into a destination changelog unreleased changes")
  .argument("<destination>", "Destination changelog file")
  .argument("<sources...>", "Multiple source changelog files. Using same format as merge command")
  .action(mergeMultiple);

// Parse and run the program
program.parse();
