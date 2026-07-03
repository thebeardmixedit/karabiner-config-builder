# karabiner-config-builder

A TypeScript builder for generating `karabiner.json` for Karabiner-Elements.

This project is under construction. The API is still being designed, tested, and refined as the builder grows from a personal config tool into something more generally usable.

## Goals

- Keep Karabiner config declarative and readable
- Model the final `karabiner.json` shape with TypeScript
- Generate Karabiner JSON instead of hand-authoring it
- Support profiles, simple modifications, complex rules, layers, conditions, integrations, and reusable helpers
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
- Symlink-aware backup and restore helpers for the active Karabiner config
- Test configs for live/manual feature testing
- Builder helpers:
    - `setup()`
    - `profile()`
    - `rule()`
    - `remap()`
    - `bind()`
    - `layer()`
- Output helpers:
    - `key()`
    - `shell()` for raw shell commands
    - `script()` for wrapped script execution
    - `app()` for opening apps by bundle identifier
    - `url()`
    - `combine()`
- Condition helpers:
    - `inApp()`
    - `exceptInApp()`
    - `fromDevice()`
    - `exceptFromDevice()`
    - `withDeviceConnected()`
    - `exceptWithDeviceConnected()`
    - `fromKeyboardType()`
    - `exceptFromKeyboardType()`
    - `fromInputSource()`
    - `exceptFromInputSource()`
    - `variableIs()`
    - `exceptVariableIs()`
    - `expressionIsTrue()`
    - `exceptExpressionIsTrue()`
    - `eventChanged()`
    - `exceptEventChanged()`
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

export const config = setup(
    profile(
        {
            name: "Main",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
        },

        rule(
            "Global bindings",

            bind("caps_lock", key("left_control"), {
                description: "Caps Lock as Control, Escape when tapped",
                tapped: key("escape"),
            }),
        ),
    ),
);
```

During local development of this repository, a config outside the repo can import from the local source tree instead:

```ts
import {
    bind,
    key,
    profile,
    rule,
    setup,
} from "path/to/repo/directory/karabiner-config-builder/src/builder";

import type { KarabinerConfig } from "path/to/repo/directory/karabiner-config-builder/src/karabiner";

export const config: KarabinerConfig = setup(
    profile(
        {
            name: "Main",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
        },

        rule(
            "Global bindings",

            bind("f10", key("escape"), {
                description: "F10 to Escape",
            }),
        ),
    ),
);
```

## Setup styles

For a profile-only config, pass profiles directly:

```ts
setup(
    profile(
        {
            name: "Main",
            selected: true,
        },

        rule(
            "Global bindings",

            bind("f10", key("escape")),
        ),
    ),
);
```

For root-level Karabiner options, use the full object form:

```ts
setup({
    global: {
        show_in_menu_bar: false,
    },

    profiles: [
        profile(
            {
                name: "Main",
                selected: true,
            },

            rule(
                "Global bindings",

                bind("f10", key("escape")),
            ),
        ),
    ],
});
```

## Opening apps

Use `app()` to open or focus an application by bundle identifier:

```ts
app("com.mitchellh.ghostty");
app("com.apple.finder");
app("com.avid.ProTools");
```

`app()` generates Karabiner's native `software_function.open_application` output.

By default, apps are opened as frontmost:

```ts
app("com.mitchellh.ghostty");
```

To open an app without forcing it to the foreground, pass `frontmost: false`:

```ts
app("com.mitchellh.ghostty", { frontmost: false });
```

You can find an application's bundle identifier with AppleScript:

```sh
osascript -e 'id of app "Ghostty"'
osascript -e 'id of app "ChatGPT"'
osascript -e 'id of app "Pro Tools"'
```

## Running shell commands and scripts

Use `shell()` when you want to emit a raw Karabiner shell command exactly as written:

```ts
shell('osascript -e \'display notification "pressed" with title "KCB"\'');
```

Use `script()` when you want to run a local utility or script with a more predictable Karabiner-safe shell environment:

```ts
script("~/.dotfiles/bin/convert-wav-to-mp3", {
    shell: "zsh",
    PATH: ["~/.dotfiles/bin"],
    requires: ["lame", "osascript"],
});
```

`script()` wraps the command with:

- a selected shell, currently `"zsh"` or `"bash"`
- a stable `PATH` including common macOS and Homebrew locations
- optional extra `PATH` entries through `PATH`
- optional dependency checks through `requires`
- support for `~` paths via `$HOME`

The `PATH` entries are prepended before the default search paths:

```txt
/opt/homebrew/bin
/usr/local/bin
/usr/bin
/bin
/usr/sbin
/sbin
```

Use `args` to pass arguments to the script:

```ts
script("~/.dotfiles/bin/convert-wav-to-mp3", {
    shell: "zsh",
    PATH: ["~/.dotfiles/bin"],
    requires: ["lame"],
    args: ["~/Desktop/example.wav"],
});
```

## Example layer

```ts
import {
    app,
    key,
    layer,
    profile,
    rule,
    setup,
} from "karabiner-config-builder";

export const config = setup(
    profile(
        {
            name: "Main",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
        },

        rule(
            "Global layers",

            layer("caps_lock", {
                tapped: key("escape"),

                bindings: {
                    g: app("com.mitchellh.ghostty"),

                    o: layer("open", {
                        bindings: {
                            c: app("com.openai.chat"),
                            f: app("com.apple.finder"),
                        },
                    }),
                },
            }),
        ),
    ),
);
```

## Example scripts

```ts
import { bind, profile, rule, script, setup } from "karabiner-config-builder";

export const config = setup({
    global: {
        show_in_menu_bar: false,
    },

    profiles: [
        profile(
            {
                name: "Main",
                virtual_hid_keyboard: {
                    keyboard_type_v2: "ansi",
                },
            },

            rule(
                "macOS Tools",

                bind(
                    "m",
                    script("~/.dotfiles/bin/convert-wav-to-mp3", {
                        shell: "zsh",
                        PATH: ["~/.dotfiles/bin"],
                        requires: ["lame", "osascript"],
                    }),
                    {
                        description: "Convert selected WAV files to MP3",
                        modifiers: {
                            mandatory: ["left_control"],
                        },
                    },
                ),
            ),
        ),
    ],
});
```

## Example conditions

```ts
import {
    bind,
    exceptInApp,
    fromDevice,
    inApp,
    key,
    profile,
    rule,
    setup,
} from "karabiner-config-builder";

const moonlander = {
    vendor_id: 12951,
    product_id: 6519,
    is_keyboard: true,
};

export const config = setup(
    profile(
        {
            name: "Main",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
        },

        rule(
            "Conditional bindings",

            bind("f10", key("escape"), {
                description: "F10 to Escape from Moonlander",
                conditions: [fromDevice(moonlander)],
            }),

            bind("f11", key("escape"), {
                description: "F11 to Escape in Finder, except System Settings",
                conditions: [
                    inApp("com.apple.finder"),
                    exceptInApp("com.apple.SystemSettings"),
                ],
            }),
        ),
    ),
);
```

App conditions accept plain bundle identifiers. The builder converts them to the regular expression format Karabiner expects.

For multiple apps, pass multiple arguments:

```ts
inApp("com.apple.finder", "com.mitchellh.ghostty");

exceptInApp("com.apple.SystemSettings", "com.apple.ActivityMonitor");
```

For an explicit regular expression escape hatch, use `bundleIdPattern()`:

```ts
import { bundleIdPattern, inApp } from "karabiner-config-builder";

inApp(bundleIdPattern("^com\\.avid\\..*$"));
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

Backups are stored as timestamped directories:

```txt
~/.config/karabiner/kcb_backups/
  20260702-021500/
    metadata.json
    karabiner.json
```

Restore the latest backup:

```sh
npm run restore
```

Search backups with `fzf`:

```sh
npm run restore:search
```

Backup and restore preserve whether the active Karabiner config is a regular file or a symlink.

When restoring a symlink backup, the active Karabiner config symlink is recreated. If the original symlink target already exists, its contents are preserved. If the target is missing, it is recreated from the backup contents.

## Test configs

This repository includes test configs for live/manual testing:

```txt
tests/bind.ts
tests/layer.ts
tests/conditions.ts
```

These are not polished examples. They are small configs used to verify builder behavior against Karabiner.

Build them with:

```sh
npm run build:test:bind
npm run build:test:layer
npm run build:test:conditions
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
