import { Command } from "commander";
import { Release } from "keep-a-changelog";
import { add } from "./add.js";
import { fmt } from "./fmt.js";
import { init } from "./init.js";
import { listReleases } from "./list.js";
import { merge, mergeMultiple } from "./merge.js";
import { release } from "./release.js";

export function cmd() {
  class rootCommand extends Command {
    createCommand(name) {
      const cmd = new Command(name);
      // Add global options
      cmd.option("-f, --file <file>", "Path to changelog file", "CHANGELOG.md");
      cmd.option("--format <format>", "Changelog format (markdownlint or compact)", "markdownlint");
      cmd.option("--encoding <encoding>", "Encoding format of the changelog file", "UTF-8");
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
    .option("-t, --type <type>", `Change type (allowed values: ${changeTypes})`, "added")
    .action(add);

  program
    .command("fmt")
    .description("Format changelog file")
    .option("-w, --write", "Write formatted changelog back to file", false)
    .option("-s, --silent", "Do not output formatted changelog", false)
    .action(fmt);

  program
    .command("init")
    .description("Initialize a new changelog file")
    .option("--title <title>", "Changelog title", "Changelog")
    .option("--description <description>", "Changelog description")
    .option("--url <url>", "Changelog URL", "https://example.com")
    .option("--initial-version <initial-version>", "Initial release version. Set to '' to skip initial release creation, note that compare links section will not be initialized in this case.", "0.1.0")
    .action(init);

  program
    .command("list-releases")
    .description("List releases in the changelog")
    .action(listReleases);

  program
    .command("merge")
    .description("Merge changes from source changelog into unreleased changes")
    .argument("<source>", "Source changelog file. Can contain a version to start merging from until latest release, e.g. source@1.0.0, if not specified, only latest release will be used")
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
