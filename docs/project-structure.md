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
      deploy.ts
      index.ts
      paths.ts
      prefs.ts
      restore.ts
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
fromDevice({ vendor_id: 1234, product_id: 5678 });
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
kcb build
kcb deploy
kcb backup
kcb restore
kcb prefs
```

Each command owns its own help and argument parsing.

Top-level CLI help is intentionally shallow:

```sh
kcb --help
```

Command-level help is handled by the command itself:

```sh
kcb build --help
kcb deploy --help
kcb backup --help
kcb restore --help
kcb prefs --help
```

## Root implementation files

Root files contain shared implementation used by CLI entrypoints.

```txt
src/build.ts
  load config, validate config, optionally write generated JSON

src/backup.ts
  back up active Karabiner config and prune backups

src/restore.ts
  restore Karabiner config from backup folders

src/load.ts
  load TypeScript config files

src/write.ts
  write Karabiner JSON

src/index.ts
  package export surface
```

## Runtime paths

KCB-owned user files live under:

```txt
~/.config/karabiner-config-builder/
```

Current defaults:

```txt
~/.config/karabiner-config-builder/config.ts
~/.config/karabiner-config-builder/prefs.json
~/.config/karabiner-config-builder/backups/
```

Karabiner’s active config path remains:

```txt
~/.config/karabiner/karabiner.json
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

Run smoke tests:

```sh
npm run smoke
npm run smoke:build
npm run smoke:deploy
npm run smoke:backup
npm run smoke:restore
```
