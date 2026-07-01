import type { Manipulator, Rule } from "../karabiner";
import { compileLayer, type LayerDefinition } from "./layer";

export type RuleEntry = Manipulator | LayerDefinition;

export function rule(description: string, entries: RuleEntry[]): Rule {
    return {
        description,
        manipulators: entries.flatMap(compileRuleEntry),
    };
}

function compileRuleEntry(entry: RuleEntry): Manipulator[] {
    if (isLayerDefinition(entry)) {
        return compileLayer(entry);
    }

    return [entry];
}

function isLayerDefinition(entry: RuleEntry): entry is LayerDefinition {
    return (
        typeof entry === "object" &&
        entry !== null &&
        "kind" in entry &&
        entry.kind === "layer"
    );
}
