import type { KeyCode, Modifier, To } from "../../karabiner/index.js";
import { isKeyCombo, type KeyCombo } from "../combo.js";

export interface KeyOptions {
    modifiers?: Modifier[];
    lazy?: boolean;
    repeat?: boolean;
    halt?: boolean;
    holdDownMs?: number;
}

export function key(input: KeyCode | KeyCombo, options: KeyOptions = {}): To {
    if (isKeyCombo(input)) {
        if (options.modifiers) {
            throw new Error(
                "key() received modifiers in both the key combo and options.modifiers.\n" +
                    "Use combo helpers or options.modifiers, not both.",
            );
        }

        return createKeyOutput(input.key_code, {
            ...options,
            ...(input.modifiers.mandatory?.length
                ? { modifiers: input.modifiers.mandatory }
                : {}),
        });
    }

    return createKeyOutput(input, options);
}

function createKeyOutput(key_code: KeyCode, options: KeyOptions = {}): To {
    return {
        key_code,
        ...(options.modifiers ? { modifiers: options.modifiers } : {}),
        ...(options.lazy !== undefined ? { lazy: options.lazy } : {}),
        ...(options.repeat !== undefined ? { repeat: options.repeat } : {}),
        ...(options.halt !== undefined ? { halt: options.halt } : {}),
        ...(options.holdDownMs !== undefined
            ? { hold_down_milliseconds: options.holdDownMs }
            : {}),
    };
}
