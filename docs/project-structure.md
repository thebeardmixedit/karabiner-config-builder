# Project Structure

```txt
karabiner-config-builder/
  src/
    builder/
      conditions/
      integrations/
      outputs/
      utils/
      bind.ts
      combo.ts
      layer.ts
      profile.ts
      remap.ts
      rule.ts
      setup.ts
      index.ts

    karabiner/
      interface.ts
      validate.ts
      index.ts

    cli/
      args.ts
      backup.ts
      build.ts
      config.ts
      config-selection.ts
      deploy.ts
      index.ts
      init.ts
      package-link.ts
      paths.ts
      picker.ts
      prefs.ts
      registry.ts
      run.ts

    backup.ts
    build.ts
    load.ts
    restore.ts
    write.ts
    index.ts

  docs/
    api.md
    cli.md
    conditions.md
    project-structure.md

  tests/
  package.json
  tsconfig.json
```

## `src/builder`

The builder layer is the public authoring API.

It contains helpers like:

- `setup()`
- `profile()`
- `rule()`
- `bind()`
- `layer()`
- key combo helpers
- output helpers
- condition helpers
- integration helpers

This layer may provide TypeScript conveniences that do not exist directly in Karabiner JSON.

For example, rule-level conditions are builder sugar. Karabiner itself stores conditions on individual manipulators.

## `src/builder/conditions`

Condition helpers create Karabiner condition objects.

Examples:

```ts
inApp("com.apple.finder");

fromDevice({
    vendor_id: 1234,
    product_id: 5678,
});

variableIs("layer", 1);
```

See [conditions docs](./conditions.md).

## `src/builder/outputs`

Output helpers create Karabiner `to` events.

Examples:

```ts
key("escape");
shell("echo hello");
script("~/.dotfiles/bin/my-script");
app("com.apple.finder");
url("https://karabiner-elements.pqrs.org/");
```

## `src/builder/integrations`

Integration helpers create output actions for external tools.

Current integrations include:

- AeroSpace
- SoundFlow

## `src/builder/utils`

Builder utilities support higher-level builder behavior.

Current utilities include:

- condition merging
- condition deduping
- conflict detection
- stable value keys for comparing condition values

These utilities are builder-specific. They are separate from final Karabiner JSON validation.

## `src/karabiner`

The Karabiner layer contains TypeScript interfaces and validation for the generated Karabiner config shape.

This layer should represent Karabiner’s JSON structure, not builder-only conveniences.

## `src/cli`

The CLI layer contains command entrypoints for:

```txt
kcb init
kcb config
kcb config relink
kcb build
kcb deploy
kcb prefs
kcb backup
```

Each command owns its own help and argument parsing.

Top-level CLI help is intentionally shallow:

```sh
kcb --help
```

Command-level help is handled by the command itself:

```sh
kcb init --help
kcb config --help
kcb build --help
kcb deploy --help
kcb prefs --help
kcb backup --help
```

## CLI support modules

```txt
src/cli/args.ts              small schema-based argument parser
src/cli/paths.ts             default paths and path resolution helpers
src/cli/registry.ts          config workspace registry loading, saving, validation, and default config management
src/cli/config-selection.ts  shared config resolution for default, named, and picked configs
src/cli/package-link.ts      workspace package bridge creation and relinking
src/cli/picker.ts            dependency-free numbered picker
src/cli/prefs.ts             CLI preference loading, writing, and reset behavior
src/cli/run.ts               direct-run detection for command files
```

## Root implementation files

Root files contain shared implementation used by CLI entrypoints.

```txt
src/build.ts    load config, validate config, optionally write generated JSON
src/backup.ts   back up active Karabiner config and prune backups
src/restore.ts  restore Karabiner config from backup folders
src/load.ts     load TypeScript config files
src/write.ts    write Karabiner JSON
src/index.ts    package export surface
```

`src/restore.ts` remains a root implementation file even though restore is exposed through:

```sh
kcb backup restore
```

## Runtime paths

KCB-owned user files live under:

```txt
~/.config/karabiner-config-builder/
```

Current defaults:

```txt
~/.config/karabiner-config-builder/registry.json
~/.config/karabiner-config-builder/prefs.json
~/.config/karabiner-config-builder/backups/
~/.config/karabiner-config-builder/default/config.ts
```

A default workspace looks like:

```txt
~/.config/karabiner-config-builder/default/
  config.ts
  package.json
  tsconfig.json
  node_modules/
    karabiner-config-builder -> current installed package
```

Workspace configs import `karabiner-config-builder` through the local package bridge at:

```txt
<workspace>/node_modules/karabiner-config-builder
```

After reinstalling the global CLI, registered workspaces can be relinked with:

```sh
kcb config relink
```

Karabiner’s active config path remains:

```txt
~/.config/karabiner/karabiner.json
```

## Registry

Registered KCB workspaces are stored in:

```txt
~/.config/karabiner-config-builder/registry.json
```

Example:

```json
{
    "configs": {
        "default": {
            "name": "default",
            "workspacePath": "/Users/example/.config/karabiner-config-builder/default",
            "configPath": "/Users/example/.config/karabiner-config-builder/default/config.ts"
        }
    },
    "defaultConfig": "default"
}
```

The registry is app-managed state.

It is not a user preference.

## Preferences

User preferences are stored in:

```txt
~/.config/karabiner-config-builder/prefs.json
```

`prefs.json` stores user overrides only. Defaults live in code.

Examples of preferences:

```txt
backupDir
maxBackups
backupBeforeDeploy
confirmDeploy
```

## Package exports

`src/index.ts` is the package export surface.

It should export the public builder API and Karabiner types:

```ts
export * from "./builder/index.js";
export * from "./karabiner/index.js";
```

The compiled package exposes:

```txt
dist/index.js
dist/index.d.ts
```

The CLI binary is:

```txt
dist/cli/index.js
```

and is installed as:

```sh
kcb
```

## Development scripts

Typecheck:

```sh
npm run check
```

Compile:

```sh
npm run build
```

Run CLI from source:

```sh
npm run cli -- --help
```

Run all smoke tests:

```sh
npm run smoke:all
```
