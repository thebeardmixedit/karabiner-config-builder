import type { To } from "../../karabiner";

export function shell(command: string): To {
    return {
        shell_command: command,
    };
}
