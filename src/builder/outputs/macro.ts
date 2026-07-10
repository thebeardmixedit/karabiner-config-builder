import type { To } from "../../karabiner/index.js";

export function macro(command: To, ...commands: To[]): To[] {
    return [command, ...commands];
}
