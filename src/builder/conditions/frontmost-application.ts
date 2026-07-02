import type { Condition } from "../../karabiner";

import { normalizeBundleIds, type BundleIdInput } from "./bundle-id";

export function inApp(
    bundleId: BundleIdInput,
    ...bundleIds: BundleIdInput[]
): Condition {
    return {
        type: "frontmost_application_if",
        bundle_identifiers: normalizeBundleIds([bundleId, ...bundleIds]),
    };
}

export function exceptInApp(
    bundleId: BundleIdInput,
    ...bundleIds: BundleIdInput[]
): Condition {
    return {
        type: "frontmost_application_unless",
        bundle_identifiers: normalizeBundleIds([bundleId, ...bundleIds]),
    };
}
