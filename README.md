# karabiner-config-builder

A TypeScript builder for generating `karabiner.json`.

This project is under construction. The API is still being designed, tested, and refined as the builder grows from a personal config tool into something more generally usable.

## Goals

- Keep Karabiner config declarative and readable
- Model the final `karabiner.json` shape with TypeScript
- Generate Karabiner JSON instead of hand-authoring it
- Support profiles, simple modifications, complex rules, layers, and reusable helpers
- Keep the public API generic enough to be useful beyond one personal setup

## Current status

The basic build pipeline is working:

```txt
TypeScript config
  ↓
validate generated Karabiner shape
  ↓
write karabiner.json
```
