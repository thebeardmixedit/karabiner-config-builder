# CLI

The `kcb` CLI manages the full Karabiner config workflow:

```txt
init      initialize a KCB workspace
config    manage registered config workspaces
build     generate Karabiner JSON
deploy    write active Karabiner config safely
prefs     manage CLI preferences
backup    manage backups
```

## Install

```sh
npm install -g karabiner-config-builder
```

Verify:

```sh
kcb --help
```

## Runtime files

KCB-owned files live under:

```txt
~/.config/karabiner-config-builder/
```

Default structure:

```txt
~/.config/karabiner-config-builder/
  registry.json
  prefs.json
  backups/
  default/
    config.ts
    package.json
    tsconfig.json
    node_modules/
```

Karabiner’s active config remains:

```txt
~/.config/karabiner/karabiner.json
```

## `kcb init`

Initialize a Karabiner Config Builder workspace.

```sh
kcb init
```

Default workspace:

```txt
~/.config/karabiner-config-builder/default
```

Initialize a custom workspace:

```sh
kcb init ~/.dotfiles/karabiner-config-builder
```

Initialize and mark as default:

```sh
kcb init --default ~/.dotfiles/karabiner-config-builder
```

Options:

```txt
-d, --default  Make initialized workspace the default config
-h, --help     Show help
```

Arguments:

```txt
workspace-dir  Workspace directory to initialize
               Default: ~/.config/karabiner-config-builder/default
```

A workspace contains:

```txt
config.ts
package.json
tsconfig.json
node_modules/karabiner-config-builder
```

`config.ts` is the build entrypoint. The workspace directory name becomes the registered config name.

## `kcb config`

Manage registered config workspaces in `registry.json`.

### `kcb config list`

Print registered configs, with the default marked.

```sh
kcb config list
```

### `kcb config default`

Mark a config as default.

```sh
kcb config default my-config
```

Pick from registered configs:

```sh
kcb config default --pick
```

Options:

```txt
-p, --pick  Choose a config from a numbered list
-h, --help  Show help
```

### `kcb config remove`

Remove a config from `registry.json`.

```sh
kcb config remove my-config
```

Pick from registered configs:

```sh
kcb config remove --pick
```

Remove from the registry and delete the associated workspace files:

```sh
kcb config remove my-config --delete-workspace
```

Options:

```txt
-p, --pick          Choose a config from a numbered list
--delete-workspace  Delete associated workspace files
-h, --help          Show help
```

By default, `config remove` removes only the registry entry. It does not delete workspace files unless `--delete-workspace` is passed.

## `kcb build`

Generate Karabiner JSON from a registered config.

```sh
kcb build
```

By default, this builds the default config from `registry.json` and prints generated JSON to stdout.

Build a specific registered config:

```sh
kcb build my-config
```

Pick a config interactively:

```sh
kcb build --pick
```

Write generated JSON to a file:

```sh
kcb build --output ./karabiner.json
```

Build a specific config and write it to a file:

```sh
kcb build my-config --output ./karabiner.json
```

Options:

```txt
-p, --pick           Choose a config from a numbered list
-o, --output <path>  Output path for generated Karabiner JSON
-h, --help           Show help
```

Arguments:

```txt
config-name          Registered config name
                     Default: default config from registry.json
```

## `kcb deploy`

Generate and deploy Karabiner JSON to Karabiner’s active config path.

```sh
kcb deploy
```

Deploy a specific registered config:

```sh
kcb deploy my-config
```

Pick a config interactively:

```sh
kcb deploy --pick
```

Skip confirmation:

```sh
kcb deploy --force
```

Skip backup:

```sh
kcb deploy --omit-backup
```

Deploy through a symlink target:

```sh
kcb deploy my-config --symlink-from ~/.dotfiles/karabiner/karabiner.json
```

In regular deploy mode, `kcb deploy` writes directly to:

```txt
~/.config/karabiner/karabiner.json
```

If the active Karabiner config is currently a symlink, regular deploy removes the symlink itself and writes a normal file.

In symlink deploy mode, `kcb deploy --symlink-from <path>` writes generated JSON to the symlink target, then replaces Karabiner’s active config path with a symlink to that target.

Options:

```txt
-p, --pick                Choose a config from a numbered list
-s, --symlink-from <path> Write generated config here and symlink Karabiner to it
-f, --force               Skip deploy confirmation
--omit-backup             Skip backup before deploy
-h, --help                Show help
```

Arguments:

```txt
config-name               Registered config name
                          Default: default config from registry.json
```

## `kcb prefs`

Manage persistent CLI preferences.

```sh
kcb prefs read
```

Read one preference:

```sh
kcb prefs read --max-backups
```

Write preferences:

```sh
kcb prefs write --max-backups 99
```

```sh
kcb prefs write --backup-before-deploy true
```

Set a custom backup directory:

```sh
kcb prefs write --backup-dir ~/.dotfiles/backups/karabiner
```

Disable deploy confirmation by default:

```sh
kcb prefs write --confirm-deploy false
```

Reset one preference:

```sh
kcb prefs reset --max-backups
```

Reset all preferences:

```sh
kcb prefs reset
```

Current preferences:

```txt
backupDir            Directory where backup folders are stored
maxBackups           Maximum number of backups to keep
backupBeforeDeploy   Whether deploy backs up before writing
confirmDeploy        Whether deploy asks for confirmation
```

`prefs.json` stores only user overrides. Defaults live in code.

## `kcb backup`

Manage backups of Karabiner JSON.

### `kcb backup`

Alias for:

```sh
kcb backup create
```

### `kcb backup create`

Create a timestamped backup of the active Karabiner config.

```sh
kcb backup create
```

Backups are stored in the configured backup directory. The default is:

```txt
~/.config/karabiner-config-builder/backups/
```

### `kcb backup list`

Print available backups.

```sh
kcb backup list
```

### `kcb backup restore`

Restore from the newest backup:

```sh
kcb backup restore
```

Restore a named backup:

```sh
kcb backup restore 20260706_001234
```

Pick a backup from a numbered list:

```sh
kcb backup restore --pick
```

Options:

```txt
-p, --pick  Choose a backup from a numbered list
-h, --help  Show help
```

### `kcb backup delete`

Delete a named backup:

```sh
kcb backup delete 20260706_001234
```

Pick a backup to delete:

```sh
kcb backup delete --pick
```

Options:

```txt
-p, --pick  Choose a backup from a numbered list
-h, --help  Show help
```

## Safe test commands

Initialize a temp workspace:

```sh
rm -rf /tmp/kcb-home /tmp/kcb-workspace
mkdir -p /tmp/kcb-home

HOME=/tmp/kcb-home kcb init /tmp/kcb-workspace
```

Print generated JSON:

```sh
HOME=/tmp/kcb-home kcb build | jq .
```

Write generated JSON to a temp file:

```sh
HOME=/tmp/kcb-home kcb build --output /tmp/kcb-test.json
```

Test deploy in a temporary home directory:

```sh
HOME=/tmp/kcb-home kcb deploy --force --omit-backup
```

Inspect the deployed temp config:

```sh
cat /tmp/kcb-home/.config/karabiner/karabiner.json | jq .
```

## Recommended pre-deploy flow

```sh
kcb init
kcb build | jq .
kcb backup
kcb deploy
```
