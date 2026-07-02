import type { Condition, KeyboardType } from "../../karabiner";

export function fromKeyboardType(
    keyboardType: KeyboardType,
    ...keyboardTypes: KeyboardType[]
): Condition {
    return {
        type: "keyboard_type_if",
        keyboard_types: [keyboardType, ...keyboardTypes],
    };
}

export function exceptFromKeyboardType(
    keyboardType: KeyboardType,
    ...keyboardTypes: KeyboardType[]
): Condition {
    return {
        type: "keyboard_type_unless",
        keyboard_types: [keyboardType, ...keyboardTypes],
    };
}
