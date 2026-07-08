# karabiner-config-builder

A TypeScript config builder for [Karabiner-Elements](https://karabiner-elements.pqrs.org/).

Write your Karabiner config in TypeScript, generate valid Karabiner JSON, and deploy it safely with backups.

## Why

Karabiner configs can get large fast.

This project lets you author reusable, type-aware keyboard configuration in TypeScript instead of maintaining a giant `karabiner.json` by hand.

## Requirements

- macOS
- Karabiner-Elements
- Node.js 24+
- npm

## Install

Install globally:

```sh
npm install -g karabiner-config-builder
```

Then verify the CLI:

```sh
kcb --help
```

## Initialize a workspace

After installing, initialize a KCB workspace:

```sh
kcb init
```

This creates and registers the default workspace:

```txt
~/.config/karabiner-config-builder/default/
  config.ts
  package.json
  tsconfig.json
  node_modules/
```

It also creates the KCB registry:

```txt
~/.config/karabiner-config-builder/registry.json
```

The registry tracks known config workspaces and the default config.

## Default files

KCB-owned app files live here:

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

Karabiner’s active config remains here:

```txt
~/.config/karabiner/karabiner.json
```

## Minimal config

The default workspace contains:

```txt
~/.config/karabiner-config-builder/default/config.ts
```

Example:

```ts
import { bind, key, profile, rule, setup } from "karabiner-config-builder";

export default setup(
    profile(
        {
            name: "Default",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
        },

        rule("Basic bindings", bind("caps_lock", key("escape"))),
    ),
);
```

Named exports also work:

```ts
export const config = setup(/* ... */);
```

## Basic workflow

Initialize:

```sh
kcb init
```

Check generated JSON without writing anything:

```sh
kcb build
```

Write generated JSON to a file:

```sh
kcb build --output ./karabiner.json
```

Deploy to Karabiner’s active config path:

```sh
kcb deploy
```

Skip deploy confirmation:

```sh
kcb deploy --force
```

Back up the active Karabiner config:

```sh
kcb backup
```

List backups:

```sh
kcb backup list
```

Restore the newest backup:

```sh
kcb backup restore
```

Pick a backup from a numbered list:

```sh
kcb backup restore --pick
```

## Multiple configs

Create a custom workspace:

```sh
kcb init ~/.dotfiles/karabiner-config-builder
```

Create and mark it as default:

```sh
kcb init --default ~/.dotfiles/karabiner-config-builder
```

List registered configs:

```sh
kcb config list
```

Set the default config:

```sh
kcb config default my-config
```

Pick the default config interactively:

```sh
kcb config default --pick
```

Relink registered workspaces to the current installed package:

```sh
kcb config relink
```

Relink one config:

```sh
kcb config relink my-config
```

Pick a config to relink interactively:

```sh
kcb config relink --pick
```

This is useful after reinstalling the global CLI because existing workspaces import `karabiner-config-builder` through their local `node_modules` package bridge.

Build a specific registered config:

```sh
kcb build my-config
```

Deploy a specific registered config:

```sh
kcb deploy my-config
```

Pick a config interactively:

```sh
kcb build --pick
kcb deploy --pick
```

## CLI preferences

Read current CLI preferences:

```sh
kcb prefs read
```

Update backup retention:

```sh
kcb prefs write --max-backups 99
```

Disable deploy confirmation by default:

```sh
kcb prefs write --confirm-deploy false
```

Reset a preference to its default:

```sh
kcb prefs reset --max-backups
```

Reset all preferences:

```sh
kcb prefs reset
```

## Core concepts

- `setup()` creates the full Karabiner config.
- `profile()` creates a Karabiner profile.
- `rule()` groups bindings and layers.
- `bind()` creates a Karabiner basic manipulator.
- `layer()` creates modal key layers.
- Output helpers like `key()`, `shell()`, `script()`, `app()`, and `url()` create actions.
- Condition helpers like `inApp()`, `fromDevice()`, and `variableIs()` scope bindings.

## Example layer

```ts
import { bind, key, layer, rule } from "karabiner-config-builder";

rule(
    "Navigation layer",

    layer("nav", {
        trigger: "caps_lock",
        tapped: key("escape"),

        bindings: [
            bind("h", key("left_arrow")),
            bind("j", key("down_arrow")),
            bind("k", key("up_arrow")),
            bind("l", key("right_arrow")),
        ],
    }),
);
```

Layer bindings use the same `bind()` helper as top-level rules, so modified inputs work inside layers too:

```ts
import { bind, cmd, key, layer } from "karabiner-config-builder";

layer("nav", {
    trigger: "caps_lock",
    tapped: key("escape"),

    bindings: [
        bind("h", key("left_arrow")),
        bind(cmd("h"), key("left_arrow")),
        bind(
            "l",
            key("right_arrow", {
                modifiers: ["left_command"],
            }),
        ),
    ],
});
```

This distinction matters:

```ts
bind(cmd("h"), key("left_arrow"));
```

means:

```txt
layer + command + h -> left_arrow
```

while:

```ts
bind(
    "h",
    key("left_arrow", {
        modifiers: ["left_command"],
    }),
);
```

means:

```txt
layer + h -> command + left_arrow
```

Nested layers go in the `layers` array:

```ts
import { app, bind, key, layer } from "karabiner-config-builder";

layer("main", {
    trigger: "caps_lock",
    tapped: key("escape"),

    bindings: [bind("g", app("com.mitchellh.ghostty"))],

    layers: [
        layer("open", {
            trigger: "o",

            bindings: [
                bind("c", app("com.openai.chat")),
                bind("f", app("com.apple.finder")),
            ],
        }),
    ],
});
```

## Rule-level conditions

Karabiner stores conditions on individual manipulators, not on rules.

The builder supports rule-level conditions as a convenience by applying them to every manipulator generated by that rule.

```ts
import { bind, inApp, key, rule } from "karabiner-config-builder";

rule(
    {
        description: "Pro Tools bindings",
        conditions: [inApp("com.avid.ProTools")],
    },

    bind("m", key("escape")),
    bind("p", key("spacebar")),
);
```

Rule-level conditions are merged with manipulator-level conditions. Compatible list-based conditions are merged and deduped, and obvious impossible condition combinations are rejected.

See [conditions docs](./docs/conditions.md) for details.

## Development

Install dependencies:

```sh
npm install
```

Typecheck:

```sh
npm run check
```

Compile:

```sh
npm run build
```

Run all smoke tests:

```sh
npm run smoke:all
```

Run the CLI from source during development:

```sh
npm run cli -- --help
```

## Documentation

- [CLI reference](./docs/cli.md)
- [API reference](./docs/api.md)
- [Conditions](./docs/conditions.md)
- [Project structure](./docs/project-structure.md)

## Warning

This project writes Karabiner config files.

A bad config can break your keyboard behavior until fixed. Keep backups.

Before deploying a new generated config, inspect the output:

```sh
kcb build | jq .
```

Then deploy when ready:

```sh
kcb deploy
```

## License

MIT
