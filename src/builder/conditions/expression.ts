import type { Condition } from "../../karabiner";

export function expressionIsTrue(expression: string): Condition {
    return {
        type: "expression_if",
        expression,
    };
}

export function exceptExpressionIsTrue(expression: string): Condition {
    return {
        type: "expression_unless",
        expression,
    };
}
