import type { Manipulator, Rule } from "../karabiner";
import { compileLayer, type LayerDefinition } from "./layer";

export type RuleEntry = Manipulator | LayerDefinition;

export function rule(description: string, entries: RuleEntry[]): Rule;
export function rule(description: string, ...entries: RuleEntry[]): Rule;
export function rule(
    description: string,
    entriesOrFirstEntry: RuleEntry[] | RuleEntry,
    ...remainingEntries: RuleEntry[]
): Rule {
    const entries = normalizeRuleEntries(entriesOrFirstEntry, remainingEntries);

    return {
        description,
        manipulators: entries.flatMap(compileRuleEntry),
    };
}

function normalizeRuleEntries(
    entriesOrFirstEntry: RuleEntry[] | RuleEntry,
    remainingEntries: RuleEntry[],
): RuleEntry[] {
    if (Array.isArray(entriesOrFirstEntry)) {
        return entriesOrFirstEntry;
    }

    return [entriesOrFirstEntry, ...remainingEntries];
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
