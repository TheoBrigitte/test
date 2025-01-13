import { Command } from 'commander';
import { Release } from "keep-a-changelog";
import { add } from './add.js';
import { fmt } from './fmt.js';
import { init } from './init.js';
import { merge } from './merge.js';
import { mergeMultiple } from './mergeMultiple.js';
import { release } from './release.js';

export function cmd() {
  class rootCommand extends Command {
    createCommand(name) {
      const cmd = new Command(name);
      // Add global options
      cmd.option('--format <format>', 'Changelog format', 'markdownlint');
      cmd.option('--encoding <encoding>', 'Encoding format of the changelog file', 'UTF-8');
      cmd.option('-f, --file <path>', 'Path to changelog file', 'CHANGELOG.md');
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
  const changeTypes = Array.from(new Release().changes.keys()).join(", ");
  program
    .command("add")
    .description("Add a new change to the changelog")
    .argument("<title>", "Change title")
    .argument("[description]", "Change description", "")
    .option("--type <type>", `Change type (allowed values: ${changeTypes})`, "added")
    .action(add);

  program
    .command("fmt")
    .description("Format changelog file")
    .option("--write", "Write formatted changelog back to file")
    .option("--silent", "Do not output formatted changelog")
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

  return program;
}
