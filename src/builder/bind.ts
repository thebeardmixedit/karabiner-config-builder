import type { Condition, Manipulator, To } from "../karabiner";

type Output = To | To[];

interface BindOptions {
    conditions?: Condition[];
    description?: string;
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
        },
        to: normalizeOutput(to),
    };

    if (options.description) {
        manipulator.description = options.description;
    }

    if (options.conditions) {
        manipulator.conditions = options.conditions;
    }

    return manipulator;
}

function normalizeOutput(output: Output): To[] {
    return Array.isArray(output) ? output : [output];
}
