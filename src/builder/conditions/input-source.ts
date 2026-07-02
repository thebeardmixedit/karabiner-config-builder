import type { Condition, InputSource } from "../../karabiner";

export function fromInputSource(inputSources: InputSource[]): Condition {
    return {
        type: "input_source_if",
        input_sources: inputSources,
    };
}

export function exceptFromInputSource(inputSources: InputSource[]): Condition {
    return {
        type: "input_source_unless",
        input_sources: inputSources,
    };
}
