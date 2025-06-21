enocean
=================

A new CLI generated with oclif


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/enocean.svg)](https://npmjs.org/package/enocean)
[![Downloads/week](https://img.shields.io/npm/dw/enocean.svg)](https://npmjs.org/package/enocean)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g enocean
$ enocean COMMAND
running command...
$ enocean (--version)
enocean/0.0.0 darwin-arm64 node-v20.3.0
$ enocean --help [COMMAND]
USAGE
  $ enocean COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`enocean hello PERSON`](#enocean-hello-person)
* [`enocean hello world`](#enocean-hello-world)
* [`enocean help [COMMAND]`](#enocean-help-command)
* [`enocean plugins`](#enocean-plugins)
* [`enocean plugins add PLUGIN`](#enocean-plugins-add-plugin)
* [`enocean plugins:inspect PLUGIN...`](#enocean-pluginsinspect-plugin)
* [`enocean plugins install PLUGIN`](#enocean-plugins-install-plugin)
* [`enocean plugins link PATH`](#enocean-plugins-link-path)
* [`enocean plugins remove [PLUGIN]`](#enocean-plugins-remove-plugin)
* [`enocean plugins reset`](#enocean-plugins-reset)
* [`enocean plugins uninstall [PLUGIN]`](#enocean-plugins-uninstall-plugin)
* [`enocean plugins unlink [PLUGIN]`](#enocean-plugins-unlink-plugin)
* [`enocean plugins update`](#enocean-plugins-update)

## `enocean hello PERSON`

Say hello

```
USAGE
  $ enocean hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ enocean hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/FrancoisLef/enocean/blob/v0.0.0/src/commands/hello/index.ts)_

## `enocean hello world`

Say hello world

```
USAGE
  $ enocean hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ enocean hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/FrancoisLef/enocean/blob/v0.0.0/src/commands/hello/world.ts)_

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

## `enocean plugins`

List installed plugins.

```
USAGE
  $ enocean plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ enocean plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/index.ts)_

## `enocean plugins add PLUGIN`

Installs a plugin into enocean.

```
USAGE
  $ enocean plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into enocean.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the ENOCEAN_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the ENOCEAN_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ enocean plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ enocean plugins add myplugin

  Install a plugin from a github url.

    $ enocean plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ enocean plugins add someuser/someplugin
```

## `enocean plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ enocean plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ enocean plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/inspect.ts)_

## `enocean plugins install PLUGIN`

Installs a plugin into enocean.

```
USAGE
  $ enocean plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into enocean.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the ENOCEAN_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the ENOCEAN_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ enocean plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ enocean plugins install myplugin

  Install a plugin from a github url.

    $ enocean plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ enocean plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/install.ts)_

## `enocean plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ enocean plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ enocean plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/link.ts)_

## `enocean plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ enocean plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ enocean plugins unlink
  $ enocean plugins remove

EXAMPLES
  $ enocean plugins remove myplugin
```

## `enocean plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ enocean plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/reset.ts)_

## `enocean plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ enocean plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ enocean plugins unlink
  $ enocean plugins remove

EXAMPLES
  $ enocean plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/uninstall.ts)_

## `enocean plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ enocean plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ enocean plugins unlink
  $ enocean plugins remove

EXAMPLES
  $ enocean plugins unlink myplugin
```

## `enocean plugins update`

Update installed plugins.

```
USAGE
  $ enocean plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.41/src/commands/plugins/update.ts)_
<!-- commandsstop -->
