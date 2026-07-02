import type { Condition, FromModifiers, Manipulator, To } from "../karabiner";

type Output = To | To[];

interface BindOptions {
    description?: string;
    modifiers?: FromModifiers;
    conditions?: Condition[];

    tapped?: Output;
    held?: Output;
    finished?: Output;
}

export function bind(
    from: string,
    to: Output,
    options: BindOptions = {},
): Manipulator {
    const manipulator: Manipulator = {
        type: "basic",
        from: {
            key_code: from,
            ...(options.modifiers ? { modifiers: options.modifiers } : {}),
        },
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

function normalizeOutput(output: Output): To[] {
    return Array.isArray(output) ? output : [output];
}
