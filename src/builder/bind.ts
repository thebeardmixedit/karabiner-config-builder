import type {
    Condition,
    FromModifiers,
    KeyCode,
    Manipulator,
    To,
} from "../karabiner/index.js";

import { isKeyCombo, type KeyCombo } from "./combo.js";

type Output = To | To[];
type BindFrom = KeyCode | KeyCombo;

interface BindOptions {
    description?: string;
    modifiers?: FromModifiers;
    conditions?: Condition[];

    tapped?: Output;
    held?: Output;
    finished?: Output;
}

interface BindFromKey {
    key_code: KeyCode;
    modifiers?: FromModifiers;
}

export function bind(
    from: BindFrom,
    to: Output,
    options: BindOptions = {},
): Manipulator {
    const manipulator: Manipulator = {
        type: "basic",
        from: createFrom(from, options),
        to: normalizeOutput(to),
    };

    if (options.description) {
        manipulator.description = options.description;
    }

    if (options.conditions) {
        manipulator.conditions = options.conditions;
    }

    if (options.tapped) {
        manipulator.to_if_alone = normalizeOutput(options.tapped);
    }

    if (options.held) {
        manipulator.to_if_held_down = normalizeOutput(options.held);
    }

    if (options.finished) {
        manipulator.to_after_key_up = normalizeOutput(options.finished);
    }

    return manipulator;
}

function createFrom(from: BindFrom, options: BindOptions): BindFromKey {
    if (!isKeyCombo(from)) {
        const result: BindFromKey = {
            key_code: from,
        };

        if (options.modifiers) {
            result.modifiers = options.modifiers;
        }

        return result;
    }

    if (options.modifiers) {
        throw new Error(
            "bind() received modifiers in both the key combo and options.modifiers. Use combo helpers or options.modifiers, not both.",
        );
    }

    return {
        key_code: from.key_code,
        modifiers: from.modifiers,
    };
}

function normalizeOutput(output: Output): To[] {
    return Array.isArray(output) ? output : [output];
}
