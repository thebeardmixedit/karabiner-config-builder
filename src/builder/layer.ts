import type { Manipulator, To } from "../karabiner/index.js";
import { variableIs } from "./conditions/index.js";

const DEFAULT_LAYER_HOLD_DOWN_MILLISECONDS = 100;

export type LayerOutput = To | To[];

export interface LayerDefinition {
    kind: "layer";
    name: string;
    trigger: string;
    tapped?: LayerOutput;
    bindings: Manipulator[];
    layers: LayerDefinition[];
    holdDownMilliseconds: number;
}

export interface LayerOptions {
    trigger: string;
    tapped?: LayerOutput;
    bindings?: Manipulator[];
    layers?: LayerDefinition[];
    holdDownMilliseconds?: number;
}

export function layer(name: string, options: LayerOptions): LayerDefinition {
    validateLayerName(name);
    validateLayerTrigger(options.trigger);

    return {
        kind: "layer",
        name,
        trigger: options.trigger,
        bindings: options.bindings ?? [],
        layers: options.layers ?? [],
        holdDownMilliseconds:
            options.holdDownMilliseconds ??
            DEFAULT_LAYER_HOLD_DOWN_MILLISECONDS,
        ...(options.tapped ? { tapped: options.tapped } : {}),
    };
}

export function compileLayer(
    definition: LayerDefinition,
    parentVariable?: string,
    parentPath: string[] = [],
): Manipulator[] {
    const variableName = getLayerVariableName(definition, parentVariable);
    const layerPath = [...parentPath, definition.name];

    return [
        createLayerActivator(
            definition,
            variableName,
            layerPath,
            parentVariable,
        ),

        ...definition.bindings.map((binding) =>
            createLayerBinding(binding, variableName, layerPath),
        ),

        ...definition.layers.flatMap((childLayer) =>
            compileLayer(childLayer, variableName, layerPath),
        ),
    ];
}

function createLayerActivator(
    definition: LayerDefinition,
    variableName: string,
    layerPath: string[],
    parentVariable?: string,
): Manipulator {
    const manipulator: Manipulator = {
        type: "basic",
        description: `Activate layer: ${formatLayerPath(layerPath)}`,
        from: {
            key_code: definition.trigger,
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

    if (definition.tapped) {
        manipulator.to_if_alone = applyLayerHoldDownMilliseconds(
            normalizeOutput(definition.tapped),
            definition.holdDownMilliseconds,
        );
    }

    if (parentVariable) {
        manipulator.conditions = [variableIs(parentVariable, 1)];
    }

    return manipulator;
}

function createLayerBinding(
    binding: Manipulator,
    layerVariable: string,
    layerPath: string[],
): Manipulator {
    return {
        ...binding,
        description:
            binding.description ??
            `Run layer binding: ${formatLayerPath(layerPath)}`,
        conditions: [
            ...(binding.conditions ?? []),
            variableIs(layerVariable, 1),
        ],
    };
}

function normalizeOutput(output: LayerOutput): To[] {
    return Array.isArray(output) ? output : [output];
}

function applyLayerHoldDownMilliseconds(
    output: To[],
    holdDownMilliseconds: number,
): To[] {
    if (holdDownMilliseconds <= 0) {
        return output;
    }

    return output.map((event) => {
        if (!isKeyOutput(event)) {
            return event;
        }

        if (event.hold_down_milliseconds !== undefined) {
            return event;
        }

        return {
            ...event,
            hold_down_milliseconds: holdDownMilliseconds,
        };
    });
}

function isKeyOutput(event: To): boolean {
    return (
        event.key_code !== undefined ||
        event.consumer_key_code !== undefined ||
        event.pointing_button !== undefined
    );
}

function formatLayerPath(path: string[]): string {
    return path.join(" > ");
}

function getLayerVariableName(
    definition: LayerDefinition,
    parentVariable?: string,
): string {
    const suffix = toLayerVariableName(definition.name);

    if (!parentVariable) {
        return `layer_${suffix}`;
    }

    return `${parentVariable}_${suffix}`;
}

function toLayerVariableName(value: string): string {
    return value.replaceAll(/[^a-zA-Z0-9_]/g, "_");
}

function validateLayerName(name: string): void {
    if (!name.trim()) {
        throw new Error("Layer name must be a non-empty string.");
    }

    const layerVariableName = toLayerVariableName(name);

    if (!layerVariableName.replaceAll("_", "")) {
        throw new Error(
            `Layer name "${name}" must include at least one letter or number.`,
        );
    }
}

function validateLayerTrigger(trigger: string): void {
    if (!trigger.trim()) {
        throw new Error("Layer trigger must be a non-empty string.");
    }
}
