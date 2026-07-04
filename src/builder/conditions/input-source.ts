import type { Condition, InputSource } from "../../karabiner/index.js";

export function fromInputSource(
    inputSource: InputSource,
    ...inputSources: InputSource[]
): Condition {
    return {
        type: "input_source_if",
        input_sources: [inputSource, ...inputSources],
    };
}

export function exceptFromInputSource(
    inputSource: InputSource,
    ...inputSources: InputSource[]
): Condition {
    return {
        type: "input_source_unless",
        input_sources: [inputSource, ...inputSources],
    };
}
