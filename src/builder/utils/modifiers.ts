import type { FromModifiers, Modifier } from "../../karabiner/index.js";

export function allowCapsLock(modifiers: FromModifiers = {}): FromModifiers {
    const optional = modifiers.optional ?? [];

    if (optional.includes("any") || optional.includes("caps_lock")) {
        return modifiers;
    }

    return {
        ...modifiers,
        optional: [...optional, "caps_lock"] satisfies Modifier[],
    };
}
