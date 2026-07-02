import type { Condition, InputSource } from "../../karabiner";

export function inputSourceIf(input_sources: InputSource[]): Condition {
    return {
        type: "input_source_if",
        input_sources,
    };
}

export function inputSourceUnless(input_sources: InputSource[]): Condition {
    return {
        type: "input_source_unless",
        input_sources,
    };
}
