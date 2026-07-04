import type { To } from "../../karabiner/index.js";
import { shell } from "./shell.js";

export function url(value: string): To {
    return shell(`open '${value}'`);
}
