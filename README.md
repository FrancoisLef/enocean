# enocean

A new CLI generated with oclif

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/enocean-cli.svg)](https://npmjs.org/package/enocean-cli)
[![Downloads/week](https://img.shields.io/npm/dw/enocean-cli.svg)](https://npmjs.org/package/enocean-cli)

<!-- toc -->
* [enocean](#enocean)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g enocean-cli
$ enocean COMMAND
running command...
$ enocean (--version)
enocean-cli/0.3.1 linux-x64 node-v24.4.1
$ enocean --help [COMMAND]
USAGE
  $ enocean COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`enocean configure`](#enocean-configure)
* [`enocean help [COMMAND]`](#enocean-help-command)
* [`enocean listen`](#enocean-listen)
* [`enocean version`](#enocean-version)

## `enocean configure`

Configure dongle

```
USAGE
  $ enocean configure

DESCRIPTION
  Configure dongle

EXAMPLES
  $ enocean configure --help
```

## `enocean help [COMMAND]`

Display help for enocean.

```
USAGE
  $ enocean help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for enocean.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.29/src/commands/help.ts)_

## `enocean listen`

Listen for telegrams

```
USAGE
  $ enocean listen

DESCRIPTION
  Listen for telegrams

EXAMPLES
  $ enocean listen
```

## `enocean version`

```
USAGE
  $ enocean version [--json] [--verbose]

FLAGS
  --verbose  Show additional information about the CLI.

GLOBAL FLAGS
  --json  Format output as json.

FLAG DESCRIPTIONS
  --verbose  Show additional information about the CLI.

    Additionally shows the architecture, node version, operating system, and versions of plugins that the CLI is using.
```

_See code: [@oclif/plugin-version](https://github.com/oclif/plugin-version/blob/v2.2.32/src/commands/version.ts)_
<!-- commandsstop -->
