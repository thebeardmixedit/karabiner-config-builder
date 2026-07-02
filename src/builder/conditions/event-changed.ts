import type { Condition } from "../../karabiner";

export function eventChangedIf(value = true): Condition {
    return {
        type: "event_changed_if",
        value,
    };
}

export function eventChangedUnless(value = true): Condition {
    return {
        type: "event_changed_unless",
        value,
    };
}
