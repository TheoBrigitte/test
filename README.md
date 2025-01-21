# Changelog parser

A command line tool to parse and manipulate changelog files.

It uses the [keep a changelog](https://keepachangelog.com) format.

## Features

- Add a new release
- Add a new change to a release
- Format and parse
- Initialize a new changelog file
- List all releases
- Show all changes in a release
- Merge two or more changelog files

## Usage

Default parameters use the `CHANGELOG.md` file in the current directory, this can be changed with the `-f` flag.

### Add a new release

The `release` command adds a new release to the changelog file.

```shell
changelog-parser release -v 1.0.0
```

### Add a new change to a release

The `add` command adds a new change to the changelog file.

```
changelog-parser add -t added -m "New feature"
changelog-parser add -t security -m "Fix security issue"
```

### Format and parse

The `fmt` command parses the changelog file and format it according to the keep a changelog format.

```shell
changelog-parser fmt
```

This command exits with a non-zero status code if the changelog format is invalid.

```shell
changelog-parser fmt --silent || echo "Invalid changelog format"
```

### Initialize a new changelog file

The `init` command initializes a new changelog file.

```shell
changelog-parser init
```

### List all releases

The `list` command lists all releases in the changelog file.

```shell
changelog-parser list
```

### Show all changes in a release

The `show` command shows all changes in a release.

```shell
changelog-parser show 1.0.0
```

### Merge two or more changelog files

The `merge` command merges two or more changelog files.

```shell
changelog-parser merge other/CHANGELOG.md
```
