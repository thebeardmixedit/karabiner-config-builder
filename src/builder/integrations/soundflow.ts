import type { To } from "../../karabiner/index.js";
import { shell } from "../outputs/index.js";

const DEFAULT_SOUNDFLOW_BIN = "/usr/local/bin/soundflow";

interface SoundFlowOptions {
    bin?: string;
}

export function soundflow(
    commandId: string,
    options: SoundFlowOptions = {},
): To {
    const bin = options.bin ?? DEFAULT_SOUNDFLOW_BIN;

    return shell(`${bin} run '${commandId}'`);
}
