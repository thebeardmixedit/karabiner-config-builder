import type { Condition } from "../../karabiner";

export function inApp(bundleIdentifiers: string[]): Condition {
    return {
        type: "frontmost_application_if",
        bundle_identifiers: bundleIdentifiers,
    };
}

export function exceptInApp(bundleIdentifiers: string[]): Condition {
    return {
        type: "frontmost_application_unless",
        bundle_identifiers: bundleIdentifiers,
    };
}
