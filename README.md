# karabiner-config-builder

A TypeScript builder for generating `karabiner.json`.

This project is under construction. The API is still being designed, tested, and refined as the builder grows from a personal config tool into something more generally usable.

## Goals

- Keep Karabiner config declarative and readable
- Model the final `karabiner.json` shape with TypeScript
- Generate Karabiner JSON instead of hand-authoring it
- Support profiles, simple modifications, complex rules, layers, and reusable helpers
- Keep the public API generic enough to be useful beyond one personal setup

## Status

This project is public for development transparency, but it is not ready for general use.

The API is unstable, the deploy script is currently tailored to the author's local setup, and generated configs should be reviewed before use.

## Warning

Do not run `npm run deploy` unless you have reviewed `bin/deploy` and understand where it writes files.

```txt
TypeScript config
  ↓
validate generated Karabiner shape
  ↓
write karabiner.json
```
