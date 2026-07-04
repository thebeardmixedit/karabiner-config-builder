import type { Condition } from "../../karabiner/index.js";

export function eventChanged(value = true): Condition {
    return {
        type: "event_changed_if",
        value,
    };
}

export function exceptEventChanged(value = true): Condition {
    return {
        type: "event_changed_unless",
        value,
    };
}
