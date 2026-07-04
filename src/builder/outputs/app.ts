import type { To } from "../../karabiner/index.js";

interface AppOptions {
    frontmost?: boolean;
}

export function app(bundleId: string, options: AppOptions = {}): To {
    return {
        software_function: {
            open_application: {
                bundle_identifier: bundleId,
                frontmost: options.frontmost ?? true,
            },
        },
    };
}
