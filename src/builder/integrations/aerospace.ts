import type { To } from "../../karabiner/index.js";
import { shell } from "../outputs/index.js";

const DEFAULT_AEROSPACE_BIN = "/opt/homebrew/bin/aerospace";

interface AerospaceOptions {
    bin?: string;
}

export function aerospace(command: string, options: AerospaceOptions = {}): To {
    const bin = options.bin ?? DEFAULT_AEROSPACE_BIN;

    return shell(`${bin} ${command}`);
}
