import type { To } from "../../karabiner";
import { shell } from "./shell";

export function app(name: string): To {
  return shell(`open -a '${name}.app'`);
}
