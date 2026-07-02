import type { To } from "../../karabiner";

export function combine(command: To, ...commands: To[]): To[] {
    return [command, ...commands];
}
