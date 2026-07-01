import type { To } from "../../karabiner";

export function shell(shell_command: string): To {
    return {
        shell_command,
    };
}
