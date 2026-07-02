import type { Condition, KeyboardType } from "../../karabiner";

export function fromKeyboardType(keyboardTypes: KeyboardType[]): Condition {
    return {
        type: "keyboard_type_if",
        keyboard_types: keyboardTypes,
    };
}

export function exceptFromKeyboardType(
    keyboardTypes: KeyboardType[],
): Condition {
    return {
        type: "keyboard_type_unless",
        keyboard_types: keyboardTypes,
    };
}
