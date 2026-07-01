import type { Condition } from "../../karabiner";

export function frontmostApplicationIf(
    bundle_identifiers: string[],
): Condition {
    return {
        type: "frontmost_application_if",
        bundle_identifiers,
    };
}

export function frontmostApplicationUnless(
    bundle_identifiers: string[],
): Condition {
    return {
        type: "frontmost_application_unless",
        bundle_identifiers,
    };
}
