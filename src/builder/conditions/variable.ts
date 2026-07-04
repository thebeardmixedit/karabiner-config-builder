import type { Condition, VariableValue } from "../../karabiner/index.js";

export function variableIs(name: string, value: VariableValue): Condition {
    return {
        type: "variable_if",
        name,
        value,
    };
}

export function exceptVariableIs(
    name: string,
    value: VariableValue,
): Condition {
    return {
        type: "variable_unless",
        name,
        value,
    };
}
