export interface BundleIdPattern {
    kind: "bundle_id_pattern";
    pattern: string;
}

export type BundleIdInput = string | BundleIdPattern;

export function bundleIdPattern(pattern: string): BundleIdPattern {
    return {
        kind: "bundle_id_pattern",
        pattern,
    };
}

export function normalizeBundleIds(bundleIds: BundleIdInput[]): string[] {
    return bundleIds.map(normalizeBundleId);
}

function normalizeBundleId(bundleId: BundleIdInput): string {
    if (isBundleIdPattern(bundleId)) {
        return bundleId.pattern;
    }

    return exactBundleIdPattern(bundleId);
}

function exactBundleIdPattern(bundleId: string): string {
    return `^${escapeRegex(bundleId)}$`;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isBundleIdPattern(value: BundleIdInput): value is BundleIdPattern {
    return (
        typeof value === "object" &&
        value !== null &&
        value.kind === "bundle_id_pattern"
    );
}
