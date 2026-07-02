import type { Condition } from "../../karabiner";

export function expressionIf(expression: string): Condition {
    return {
        type: "expression_if",
        expression,
    };
}

export function expressionUnless(expression: string): Condition {
    return {
        type: "expression_unless",
        expression,
    };
}
