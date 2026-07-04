import type { Condition } from "../../karabiner/index.js";
import { normalizeBundleIds, type BundleIdInput } from "./bundle-id.js";

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
