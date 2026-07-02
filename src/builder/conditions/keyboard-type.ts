import type { Condition, KeyboardType } from "../../karabiner";

export function keyboardTypeIf(keyboard_types: KeyboardType[]): Condition {
    return {
        type: "keyboard_type_if",
        keyboard_types,
    };
}

export function keyboardTypeUnless(keyboard_types: KeyboardType[]): Condition {
    return {
        type: "keyboard_type_unless",
        keyboard_types,
    };
}
