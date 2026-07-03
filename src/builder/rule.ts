import type { Condition, Manipulator, Rule } from "../karabiner";
import { compileLayer, type LayerDefinition } from "./layer";
import { mergeConditions } from "./utils";

export type RuleEntry = Manipulator | LayerDefinition;

export interface RuleOptions {
    description: string;
    conditions?: Condition[];
}

type RuleConfig = string | RuleOptions;

export function rule(description: string, entries: RuleEntry[]): Rule;
export function rule(
    description: string,
    entry: RuleEntry,
    ...entries: RuleEntry[]
): Rule;
export function rule(options: RuleOptions, entries: RuleEntry[]): Rule;
export function rule(
    options: RuleOptions,
    entry: RuleEntry,
    ...entries: RuleEntry[]
): Rule;
export function rule(
    config: RuleConfig,
    entriesOrFirstEntry: RuleEntry[] | RuleEntry,
    ...remainingEntries: RuleEntry[]
): Rule {
    const options = normalizeRuleConfig(config);
    const entries = normalizeRuleEntries(entriesOrFirstEntry, remainingEntries);

    return {
        description: options.description,
        manipulators: entries
            .flatMap(compileRuleEntry)
            .map((manipulator) => applyRuleOptions(manipulator, options)),
    };
}

function normalizeRuleConfig(config: RuleConfig): RuleOptions {
    if (typeof config === "string") {
        return {
            description: config,
        };
    }

    return config;
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

function applyRuleOptions(
    manipulator: Manipulator,
    options: RuleOptions,
): Manipulator {
    if (!options.conditions || options.conditions.length === 0) {
        return manipulator;
    }

    return {
        ...manipulator,
        conditions: mergeConditions(
            options.conditions,
            manipulator.conditions ?? [],
        ),
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
