import type { To } from "../../karabiner/index.js";

export function combine(command: To, ...commands: To[]): To[] {
    return [command, ...commands];
}
