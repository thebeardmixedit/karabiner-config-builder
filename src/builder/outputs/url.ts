import type { To } from "../../karabiner";
import { shell } from "./shell";

export function url(value: string): To {
  return shell(`open '${value}'`);
}
