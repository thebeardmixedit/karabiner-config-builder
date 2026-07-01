import type { Condition, Manipulator, To } from "../karabiner";

export type Output = To | To[];

export type Binding = Output | LayerDefinition;

export interface LayerDefinition {
  kind: "layer";
  name: string;
  key: string;
  alone?: Output;
  bindings: Record<string, Binding>;
}

export interface LayerOptions {
  alone?: Output;
  bindings?: Record<string, Binding>;
}

export function layer(
  keyOrName: string,
  options: LayerOptions,
): LayerDefinition {
  return {
    kind: "layer",
    name: keyOrName,
    key: keyOrName,
    bindings: options.bindings ?? {},
    ...(options.alone ? { alone: options.alone } : {}),
  };
}

export function compileLayer(
  definition: LayerDefinition,
  parentVariable?: string,
): Manipulator[] {
  const variableName = getLayerVariableName(definition, parentVariable);
  const manipulators: Manipulator[] = [];

  manipulators.push(
    createLayerActivator(definition, variableName, parentVariable),
  );

  for (const [key, binding] of Object.entries(definition.bindings)) {
    if (isLayerDefinition(binding)) {
      manipulators.push(
        ...compileLayer(
          {
            ...binding,
            key,
          },
          variableName,
        ),
      );

      continue;
    }

    manipulators.push(createLayerBinding(key, binding, variableName));
  }

  return manipulators;
}

function createLayerActivator(
  definition: LayerDefinition,
  variableName: string,
  parentVariable?: string,
): Manipulator {
  const manipulator: Manipulator = {
    type: "basic",
    description: `Enter ${definition.name} layer`,
    from: {
      key_code: definition.key,
    },
    to: [
      {
        set_variable: {
          name: variableName,
          value: 1,
        },
      },
    ],
    to_after_key_up: [
      {
        set_variable: {
          name: variableName,
          value: 0,
        },
      },
    ],
  };

  if (definition.alone) {
    manipulator.to_if_alone = normalizeOutput(definition.alone);
  }

  if (parentVariable) {
    manipulator.conditions = [variableIf(parentVariable, 1)];
  }

  return manipulator;
}

function createLayerBinding(
  key: string,
  output: Output,
  layerVariable: string,
): Manipulator {
  return {
    type: "basic",
    description: `Layer binding: ${key}`,
    from: {
      key_code: key,
    },
    to: normalizeOutput(output),
    conditions: [variableIf(layerVariable, 1)],
  };
}

function normalizeOutput(output: Output): To[] {
  return Array.isArray(output) ? output : [output];
}

function variableIf(name: string, value: string | number | boolean): Condition {
  return {
    type: "variable_if",
    name,
    value,
  };
}

function getLayerVariableName(
  definition: LayerDefinition,
  parentVariable?: string,
): string {
  const name = sanitizeVariablePart(definition.name);

  if (!parentVariable) {
    return `layer_${name}`;
  }

  return `${parentVariable}_${name}`;
}

function sanitizeVariablePart(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_]/g, "_");
}

function isLayerDefinition(binding: Binding): binding is LayerDefinition {
  return (
    typeof binding === "object" &&
    binding !== null &&
    "kind" in binding &&
    binding.kind === "layer"
  );
}
