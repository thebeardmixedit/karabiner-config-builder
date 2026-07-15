import type { FromModifiers, KeyCode, Modifier } from "../karabiner/index.js";

export interface KeyCombo {
    kind: "key_combo";
    key_code: KeyCode;
    modifiers: FromModifiers;
}

type ComboInput = KeyCode | KeyCombo;

export function cmd(input: ComboInput): KeyCombo {
    return addModifier(input, "command");
}

export function leftCmd(input: ComboInput): KeyCombo {
    return addModifier(input, "left_command");
}

export function rightCmd(input: ComboInput): KeyCombo {
    return addModifier(input, "right_command");
}

export function ctrl(input: ComboInput): KeyCombo {
    return addModifier(input, "control");
}

export function leftCtrl(input: ComboInput): KeyCombo {
    return addModifier(input, "left_control");
}

export function rightCtrl(input: ComboInput): KeyCombo {
    return addModifier(input, "right_control");
}

export function opt(input: ComboInput): KeyCombo {
    return addModifier(input, "option");
}

export function leftOpt(input: ComboInput): KeyCombo {
    return addModifier(input, "left_option");
}

export function rightOpt(input: ComboInput): KeyCombo {
    return addModifier(input, "right_option");
}

export function shift(input: ComboInput): KeyCombo {
    return addModifier(input, "shift");
}

export function leftShift(input: ComboInput): KeyCombo {
    return addModifier(input, "left_shift");
}

export function rightShift(input: ComboInput): KeyCombo {
    return addModifier(input, "right_shift");
}

export function hyper(input: ComboInput): KeyCombo {
    return addModifiers(input, ["command", "control", "option", "shift"]);
}

export function meh(input: ComboInput): KeyCombo {
    return addModifiers(input, ["control", "option", "shift"]);
}

export function trio(input: ComboInput): KeyCombo {
    return addModifiers(input, ["command", "control", "option"]);
}

export function isKeyCombo(input: ComboInput): input is KeyCombo {
    return (
        typeof input === "object" &&
        input !== null &&
        input.kind === "key_combo"
    );
}

function addModifier(input: ComboInput, modifier: Modifier): KeyCombo {
    return addModifiers(input, [modifier]);
}

function addModifiers(input: ComboInput, modifiers: Modifier[]): KeyCombo {
    if (!isKeyCombo(input)) {
        return createCombo(input, modifiers);
    }

    return {
        ...input,
        modifiers: {
            ...input.modifiers,
            mandatory: dedupeModifiers([
                ...(input.modifiers.mandatory ?? []),
                ...modifiers,
            ]),
        },
    };
}

function createCombo(keyCode: KeyCode, mandatory: Modifier[]): KeyCombo {
    return {
        kind: "key_combo",
        key_code: keyCode,
        modifiers: {
            mandatory: dedupeModifiers(mandatory),
        },
    };
}

function dedupeModifiers(modifiers: Modifier[]): Modifier[] {
    return [...new Set(modifiers)];
}
