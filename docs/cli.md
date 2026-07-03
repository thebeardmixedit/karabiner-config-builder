# CLI

This document covers build, deploy, backup, and restore commands.

## Typecheck

```sh
npm run check
```

## Build

Build the default config:

```sh
npm run build
```

By default, the builder loads:

```txt
~/.config/karabiner-config-builder/config.ts
```

and writes:

```txt
./karabiner.json
```

Build with an explicit config path:

```sh
npm run build -- --config ./tests/bind.ts
```

Build with an explicit output path:

```sh
npm run build -- --config ./tests/bind.ts --output ./karabiner.json
```

## Test configs

```sh
npm run build:test:bind
npm run build:test:layer
npm run build:test:conditions
```

## Deploy

Deploy writes a generated config to Karabiner’s active config path:

```txt
~/.config/karabiner/karabiner.json
```

Run:

```sh
npm run deploy
```

With an explicit config:

```sh
npm run deploy -- --config ~/.config/karabiner-config-builder/config.ts
```

With an explicit output source:

```sh
npm run deploy -- --output ./karabiner.json
```

## Symlink deploy

You can deploy by generating a config to another path, then symlinking Karabiner’s active config to it:

```sh
npm run deploy -- --symlink-from ~/.config/karabiner-config-builder/karabiner.json
```

Regular deploy will not write through an existing symlink.

If the active Karabiner config path is a symlink, regular deploy removes the symlink and writes a normal file.

## Backup

Create a backup of the active Karabiner config:

```sh
npm run backup
```

Backups are stored in:

```txt
~/.config/karabiner/kcb_backups
```

Use a custom backup directory:

```sh
npm run backup -- --backup-dir ~/.dotfiles/backups/karabiner
```

Backups preserve whether the active config was a regular file or a symlink.

## Restore

Restore from the latest backup:

```sh
npm run restore
```

Restore from the latest backup in a custom backup directory:

```sh
npm run restore -- --backup-dir ~/.dotfiles/backups/karabiner
```

Search available backups:

```sh
npm run restore:search
```

Search available backups in a custom backup directory:

```sh
npm run restore:search -- --backup-dir ~/.dotfiles/backups/karabiner
```

Restore a specific backup path:

```sh
npm run restore -- ~/.config/karabiner/kcb_backups/<backup-name>
```

If the backup was a symlink, restore recreates the symlink.

It only restores the symlink target contents if the target is missing, so existing target files are not clobbered.

## Recommended pre-deploy check

Before deploying a generated config:

```sh
npm run check
npm run build
```
