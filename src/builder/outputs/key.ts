import type { To } from "../../karabiner";

export function key(key_code: string): To {
    return {
        key_code,
    };
}
