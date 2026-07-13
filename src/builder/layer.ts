import type { Manipulator, To } from "../karabiner/index.js";
import { variableIs } from "./conditions/index.js";

const DEFAULT_LAYER_HOLD_DOWN_MS = 100;

const LETTER_KEYS = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
];

const NUMBER_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const TYPING_KEYS = [
    ...LETTER_KEYS,
    ...NUMBER_KEYS,
    "grave_accent_and_tilde",
    "hyphen",
    "equal_sign",
    "open_bracket",
    "close_bracket",
    "backslash",
    "semicolon",
    "quote",
    "comma",
    "period",
    "slash",
    "spacebar",
    "tab",
    "return_or_enter",
    "delete_or_backspace",
];

export type LayerOutput = To | To[];

export type LayerBlockPreset = "typing" | "letters" | "numbers";
export type LayerBlock = boolean | LayerBlockPreset | string[];

export interface LayerDefinition {
    kind: "layer";
    name: string;
    trigger: string;
    tapped?: LayerOutput;
    bindings: Manipulator[];
    layers: LayerDefinition[];
    block?: LayerBlock;
    holdDownMs: number;
    tapTimeoutMs?: number;
}

export interface LayerOptions {
    trigger: string;
    tapped?: LayerOutput;
    bindings?: Manipulator[];
    layers?: LayerDefinition[];
    block?: LayerBlock;
    holdDownMs?: number;
    tapTimeoutMs?: number;
}

export function layer(name: string, options: LayerOptions): LayerDefinition {
    validateLayerName(name);
    validateLayerTrigger(options.trigger);
    validateTapTimeoutMs(options.tapTimeoutMs);

    return {
        kind: "layer",
        name,
        trigger: options.trigger,
        bindings: options.bindings ?? [],
        layers: options.layers ?? [],
        holdDownMs: options.holdDownMs ?? DEFAULT_LAYER_HOLD_DOWN_MS,
        ...(options.block !== undefined ? { block: options.block } : {}),
        ...(options.tapped ? { tapped: options.tapped } : {}),
        ...(options.tapTimeoutMs !== undefined
            ? { tapTimeoutMs: options.tapTimeoutMs }
            : {}),
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

        ...createLayerBlockers(definition, variableName, layerPath),
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
            definition.holdDownMs,
        );
    }

    if (definition.tapTimeoutMs !== undefined) {
        manipulator.parameters = {
            "basic.to_if_alone_timeout_milliseconds": definition.tapTimeoutMs,
        };
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

function createLayerBlockers(
    definition: LayerDefinition,
    layerVariable: string,
    layerPath: string[],
): Manipulator[] {
    const blockKeys = resolveBlockKeys(definition.block);

    if (blockKeys.length === 0) {
        return [];
    }

    return dedupeKeys(blockKeys)
        .filter((keyCode) => keyCode !== definition.trigger)
        .map((keyCode) =>
            createLayerBlocker(keyCode, layerVariable, layerPath),
        );
}

function createLayerBlocker(
    keyCode: string,
    layerVariable: string,
    layerPath: string[],
): Manipulator {
    return {
        type: "basic",
        description: `Block layer key: ${formatLayerPath([
            ...layerPath,
            keyCode,
        ])}`,
        from: {
            key_code: keyCode,
            modifiers: {
                optional: ["any"],
            },
        },
        to: [
            {
                key_code: "vk_none",
            },
        ],
        conditions: [variableIs(layerVariable, 1)],
    };
}

function resolveBlockKeys(block: LayerBlock | undefined): string[] {
    if (!block) {
        return [];
    }

    if (block === true || block === "typing") {
        return TYPING_KEYS;
    }

    if (block === "letters") {
        return LETTER_KEYS;
    }

    if (block === "numbers") {
        return NUMBER_KEYS;
    }

    return block;
}

function dedupeKeys(keys: string[]): string[] {
    return [...new Set(keys)];
}

function normalizeOutput(output: LayerOutput): To[] {
    return Array.isArray(output) ? output : [output];
}

function applyLayerHoldDownMilliseconds(
    output: To[],
    holdDownMs: number,
): To[] {
    if (holdDownMs <= 0) {
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
            hold_down_milliseconds: holdDownMs,
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

function validateTapTimeoutMs(tapTimeoutMs: number | undefined): void {
    if (tapTimeoutMs !== undefined && tapTimeoutMs < 0) {
        throw new Error("Layer tapTimeoutMs must be zero or greater.");
    }
}
