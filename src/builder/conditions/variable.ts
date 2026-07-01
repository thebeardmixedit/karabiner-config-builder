import type { Condition, VariableValue } from "../../karabiner";

export function variableIf(name: string, value: VariableValue): Condition {
    return {
        type: "variable_if",
        name,
        value,
    };
}

export function variableUnless(name: string, value: VariableValue): Condition {
    return {
        type: "variable_unless",
        name,
        value,
    };
}
