import type { To } from "../../karabiner/index.js";

export function shell(command: string): To {
    return {
        shell_command: command,
    };
}
