import type { Manipulator, Rule } from "../karabiner";

export function rule(description: string, manipulators: Manipulator[]): Rule {
  return {
    description,
    manipulators,
  };
}
