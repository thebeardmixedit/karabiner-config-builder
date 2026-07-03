# Project Structure

```txt
src/
  builder/
    setup.ts
    profile.ts
    rule.ts
    remap.ts
    bind.ts
    layer.ts
    outputs/
      key.ts
      shell.ts
      script.ts
      app.ts
      url.ts
      combine.ts
      index.ts
    conditions/
      bundle-id.ts
      variable.ts
      frontmost-application.ts
      device.ts
      keyboard-type.ts
      input-source.ts
      expression.ts
      event-changed.ts
      index.ts
    integrations/
      aerospace.ts
      soundflow.ts
      index.ts
    utils/
      merge.ts
      validate.ts
      value.ts
      index.ts
    index.ts

  karabiner/
    interface.ts
    validate.ts
    index.ts

  cli/
    args.ts
    paths.ts
    build.ts
    deploy.ts
    backup.ts
    restore.ts

  build.ts
  backup.ts
  restore.ts
  load.ts
  write.ts
  index.ts
```

## `src/builder`

The builder layer is the public authoring API.

It contains helpers like:

- `setup()`
- `profile()`
- `rule()`
- `bind()`
- `layer()`
- output helpers
- condition helpers
- integration helpers

This layer may provide TypeScript conveniences that do not exist directly in Karabiner JSON.

For example, rule-level conditions are builder sugar. Karabiner itself stores conditions on individual manipulators.

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

The CLI layer contains executable entrypoints for:

- building configs
- deploying configs
- backing up active Karabiner config
- restoring backups

## Root entrypoints

Root files like `build.ts`, `backup.ts`, `restore.ts`, `load.ts`, and `write.ts` contain shared implementation used by the CLI entrypoints.

## Package exports

`src/index.ts` is the package export surface.

```ts
export * from "./builder";
export * from "./karabiner";
```
