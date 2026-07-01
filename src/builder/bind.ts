import type { Manipulator, To } from "../karabiner";

export function bind(from: string, to: To | To[]): Manipulator {
    return {
        type: "basic",
        from: {
            key_code: from,
        },
        to: Array.isArray(to) ? to : [to],
    };
}
