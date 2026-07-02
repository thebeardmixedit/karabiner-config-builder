# karabiner-config-builder

A TypeScript builder for generating `karabiner.json` for Karabiner-Elements.

This project is under construction. The API is still being designed, tested, and refined as the builder grows from a personal config tool into something more generally usable.

## Goals

- Keep Karabiner config declarative and readable
- Model the final `karabiner.json` shape with TypeScript
- Generate Karabiner JSON instead of hand-authoring it
- Support profiles, simple modifications, complex rules, layers, conditions, and reusable helpers
- Load a user-owned TypeScript config from a predictable location
- Keep the public API generic enough to be useful beyond one personal setup

## Status

This project is public for development transparency, but it is not ready for general use.

The API is unstable, the CLI shape is early, and the deploy/backup workflow is still being actively tested.

## Requirements

This project currently assumes a macOS development environment with Karabiner-Elements installed.

Required:

- Node.js
- npm
- Karabiner-Elements

Development/runtime tools used by the current scripts:

- `tsx` for running the TypeScript CLI entrypoints
- `typescript` for type checking

Optional:

- `fzf` for interactive backup restore via `npm run restore:search`

The non-interactive restore command does not require `fzf`:

```sh
npm run restore
```

But this command does:

```sh
npm run restore:search
```

If `fzf` is not installed, install it with Homebrew:

```sh
brew install fzf
```

## Current features

- TypeScript config loading
- Generated Karabiner config validation
- JSON output writing
- Configurable build input with `--config`
- Configurable output path with `--out`
- Deploy command for writing to Karabiner's config location
- Optional symlink deploy mode
- Backup and restore helpers for the active Karabiner config
- Test configs for live feature testing
- Builder helpers:
    - `setup()`
    - `profile()`
    - `rule()`
    - `remap()`
    - `bind()`
    - `layer()`
- Output helpers:
    - `key()`
    - `shell()`
    - `app()`
    - `url()`
    - `combine()`
- Condition helpers:
    - `variableIf()`
    - `variableUnless()`
    - `frontmostApplicationIf()`
    - `frontmostApplicationUnless()`
- Integration helpers:
    - `aerospace()`
    - `soundflow()`

## How it works

```txt
TypeScript config
  ↓
load config module
  ↓
build Karabiner config object
  ↓
validate generated Karabiner shape
  ↓
write karabiner.json
  ↓
optionally deploy to Karabiner
```

## Default config location

By default, the builder looks for a user config at:

```txt
~/.config/karabiner-config-builder/config.ts
```

A config file should export either `config` or a default config.

```ts
import { bind, key, profile, rule, setup } from "karabiner-config-builder";

export const config = setup({
    profiles: [
        profile({
            name: "Main",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
            rules: [
                rule("Global bindings", [
                    bind("caps_lock", key("left_control"), {
                        description: "Caps Lock as Control, Escape when tapped",
                        tapped: key("escape"),
                    }),
                ]),
            ],
        }),
    ],
});
```

During local development of this repository, a config outside the repo can import from the local source tree instead:

```ts
import {
    bind,
    key,
    profile,
    rule,
    setup,
} from "path/to/repo/directory/karabiner-config-builder/src/karabiner";

import type { KarabinerConfig } from "path/to/repo/directory/karabiner-config-builder/src/karabiner";

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Main",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
            rules: [
                rule("Global bindings", [
                    bind("f10", key("escape"), {
                        description: "F10 to Escape",
                    }),
                ]),
            ],
        }),
    ],
});
```

## Commands

### Type check

```sh
npm run check
```

### Build using the default config

```sh
npm run build
```

This loads:

```txt
~/.config/karabiner-config-builder/config.ts
```

and writes:

```txt
./karabiner.json
```

### Build using a specific config

```sh
npm run build -- --config tests/bind.ts
```

Short flag:

```sh
npm run build -- -c tests/bind.ts
```

### Build to a specific output path

```sh
npm run build -- --config tests/bind.ts --out ./tmp/karabiner.json
```

### Deploy to Karabiner

```sh
npm run deploy
```

By default, this builds the config and copies the generated JSON to:

```txt
~/.config/karabiner/karabiner.json
```

### Deploy a specific config

```sh
npm run deploy -- --config tests/bind.ts
```

### Deploy using a symlink

```sh
npm run deploy -- --config tests/bind.ts --symlink-from ~/.dotfiles/karabiner/karabiner.json
```

Short flag:

```sh
npm run deploy -- -c tests/bind.ts -s ~/.dotfiles/karabiner/karabiner.json
```

This writes the generated config to the `--symlink-from` path, then links Karabiner's active config to that file:

```txt
~/.config/karabiner/karabiner.json -> ~/.dotfiles/karabiner/karabiner.json
```

## Backup and restore

Before testing a live deploy, create a backup:

```sh
npm run backup
```

Backups are written to:

```txt
~/.config/karabiner/kcb_backups/
```

Restore the latest backup:

```sh
npm run restore
```

Search backups with `fzf`:

```sh
npm run restore:search
```

## Test configs

This repository includes test configs for live/manual testing:

```txt
tests/bind.ts
tests/layer.ts
```

These are not polished examples. They are small configs used to verify builder behavior against Karabiner.

Build them with:

```sh
npm run build:test:bind
npm run build:test:layer
```

Or deploy one directly:

```sh
npm run backup
npm run deploy -- --config tests/bind.ts
```

Restore afterward if needed:

```sh
npm run restore
```

## Warning

This project can overwrite your active Karabiner configuration.

Before running deploy commands, make sure you understand where the generated config will be written. Use `npm run backup` before live testing.

Generated `karabiner.json` is intentionally not committed.

## License

MIT
