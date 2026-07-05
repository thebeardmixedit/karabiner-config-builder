# CLI

The `kcb` CLI manages the full Karabiner config workflow:

```txt
build    generate Karabiner JSON
deploy   write active Karabiner config safely
backup   preserve current Karabiner config
restore  recover from backups
prefs    manage CLI preferences
```

## Install

```sh
npm install -g karabiner-config-builder
```

Verify:

```sh
kcb --help
```

## Default paths

KCB config:

```txt
~/.config/karabiner-config-builder/config.ts
```

KCB preferences:

```txt
~/.config/karabiner-config-builder/prefs.json
```

KCB backups:

```txt
~/.config/karabiner-config-builder/backups/
```

Karabiner active config:

```txt
~/.config/karabiner/karabiner.json
```

## `kcb build`

Generate Karabiner JSON from a TypeScript config.

```sh
kcb build
```

By default, this prints generated JSON to stdout.

Use an explicit config:

```sh
kcb build --config ./config.ts
```

Write generated JSON to a file:

```sh
kcb build --out ./karabiner.json
```

Use both:

```sh
kcb build --config ./config.ts --out ./karabiner.json
```

Options:

```txt
-c, --config <path>  Config file to load
-o, --out <path>     Output path for generated Karabiner JSON
-h, --help           Show help
```

## `kcb deploy`

Generate and deploy Karabiner JSON to Karabiner’s active config path.

```sh
kcb deploy
```

Use an explicit config:

```sh
kcb deploy --config ./config.ts
```

Skip confirmation:

```sh
kcb deploy --force
```

Skip backup:

```sh
kcb deploy --no-backup
```

Use a custom backup directory:

```sh
kcb deploy --backup-dir ~/.dotfiles/backups/karabiner
```

Use a custom backup retention count:

```sh
kcb deploy --max-backups 50
```

Deploy through a symlink target:

```sh
kcb deploy --symlink-from ~/.dotfiles/karabiner/karabiner.json
```

In regular deploy mode, `kcb deploy` writes directly to:

```txt
~/.config/karabiner/karabiner.json
```

If the active Karabiner config is currently a symlink, regular deploy removes the symlink itself and writes a normal file.

In symlink deploy mode, `kcb deploy --symlink-from <path>` writes generated JSON to the symlink target, then replaces Karabiner’s active config path with a symlink to that target.

Options:

```txt
-c, --config <path>    Config file to load
--symlink-from <path>  Write generated config here and symlink Karabiner to it
--backup-dir <path>   Directory where backup folders are stored
--max-backups <count> Maximum number of backups to keep
--no-backup           Skip backup before deploy
--force               Skip deploy confirmation
-h, --help            Show help
```

## `kcb backup`

Back up the active Karabiner config.

```sh
kcb backup
```

Use a custom backup directory:

```sh
kcb backup --backup-dir ~/.dotfiles/backups/karabiner
```

Use a custom backup retention count:

```sh
kcb backup --max-backups 25
```

Options:

```txt
--backup-dir <path>   Directory where backup folders are stored
--max-backups <count> Maximum number of backups to keep, default: 99
-h, --help            Show help
```

Backups preserve whether the active config was a regular file or a symlink.

## `kcb restore`

Restore from the newest backup:

```sh
kcb restore
```

List available backups without restoring:

```sh
kcb restore --list
```

Short form:

```sh
kcb restore -l
```

Pick a backup from a numbered list:

```sh
kcb restore --pick
```

Short form:

```sh
kcb restore -p
```

Restore from a specific backup folder:

```sh
kcb restore ~/.config/karabiner-config-builder/backups/20260704_123456
```

Use a custom backup directory:

```sh
kcb restore --backup-dir ~/.dotfiles/backups/karabiner --list
```

Options:

```txt
-p, --pick          Choose a backup from a numbered list
-l, --list          List available backups without restoring
--backup-dir <path> Directory where backup folders are stored
-h, --help          Show help
```

If the backup was a symlink, restore recreates the symlink. It only restores the symlink target contents if the target is missing, so existing target files are not clobbered.

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
kcb prefs write --max-backups 99 --backup-before-deploy true
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

## Safe test commands

Print generated JSON:

```sh
kcb build --config tests/bind.ts | jq .
```

Write generated JSON to a temp file:

```sh
kcb build --config tests/bind.ts --out /tmp/kcb-test.json
```

Test deploy in a temporary home directory:

```sh
rm -rf /tmp/kcb-home
mkdir -p /tmp/kcb-home

HOME=/tmp/kcb-home kcb deploy \
    --config tests/bind.ts \
    --force
```

Inspect the deployed temp config:

```sh
cat /tmp/kcb-home/.config/karabiner/karabiner.json | jq .
```

## Recommended pre-deploy flow

```sh
kcb build | jq .
kcb backup
kcb deploy
```
