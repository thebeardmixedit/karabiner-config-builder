import type { Modifier, To } from "../../karabiner/index.js";

export interface KeyOptions {
    modifiers?: Modifier[];
    lazy?: boolean;
    repeat?: boolean;
    halt?: boolean;
    holdDownMilliseconds?: number;
}

export function key(key_code: string, options: KeyOptions = {}): To {
    return {
        key_code,
        ...(options.modifiers ? { modifiers: options.modifiers } : {}),
        ...(options.lazy !== undefined ? { lazy: options.lazy } : {}),
        ...(options.repeat !== undefined ? { repeat: options.repeat } : {}),
        ...(options.halt !== undefined ? { halt: options.halt } : {}),
        ...(options.holdDownMilliseconds !== undefined
            ? { hold_down_milliseconds: options.holdDownMilliseconds }
            : {}),
    };
}
