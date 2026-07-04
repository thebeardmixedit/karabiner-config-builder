import type { To } from "../../karabiner/index.js";

export function key(key_code: string): To {
    return {
        key_code,
    };
}
