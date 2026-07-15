import type {
    Condition,
    FromModifiers,
    KeyCode,
    Manipulator,
    Modifier,
    To,
} from "../karabiner/index.js";
import { isKeyCombo, type KeyCombo } from "./modifier.js";
import { allowCapsLock } from "./utils/index.js";

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

const MODIFIER_KEY_CODES = new Set<KeyCode>([
    "caps_lock",
    "left_command",
    "left_control",
    "left_option",
    "left_shift",
    "right_command",
    "right_control",
    "right_option",
    "right_shift",
    "fn",
]);

export function bind(
    from: BindFrom,
    to: Output,
    options: BindOptions = {},
): Manipulator {
    const fromKey = createFrom(from, options);

    const manipulator: Manipulator = {
        type: "basic",
        from: fromKey,
        to: normalizeBindOutput(to, fromKey, options),
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
        return {
            key_code: from,
            modifiers: allowCapsLock(options.modifiers),
        };
    }

    if (options.modifiers) {
        throw new Error(
            "bind() received modifiers in both the modifier and options.modifiers.\n" +
                "Use modifier helpers or options.modifiers, not both.",
        );
    }

    return {
        key_code: from.key_code,
        modifiers: allowCapsLock(from.modifiers),
    };
}

function normalizeBindOutput(
    output: Output,
    from: BindFromKey,
    options: BindOptions,
): To[] {
    const normalizedOutput = normalizeOutput(output);

    if (!options.tapped || !isModifierKeyCode(from.key_code)) {
        return normalizedOutput;
    }

    return normalizedOutput.map((event) =>
        applyLazyModifierOutput(event, from.key_code),
    );
}

function applyLazyModifierOutput(event: To, fromKeyCode: KeyCode): To {
    if (event.key_code !== fromKeyCode) {
        return event;
    }

    if (!isModifierKeyCode(event.key_code)) {
        return event;
    }

    if (event.lazy !== undefined) {
        return event;
    }

    return {
        ...event,
        lazy: true,
    };
}

function normalizeOutput(output: Output): To[] {
    return Array.isArray(output) ? output : [output];
}

function isModifierKeyCode(keyCode: KeyCode | undefined): keyCode is Modifier {
    return keyCode !== undefined && MODIFIER_KEY_CODES.has(keyCode);
}
