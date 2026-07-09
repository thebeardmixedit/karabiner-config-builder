import type { Condition, Manipulator, Rule } from "../karabiner/index.js";
import { compileLayer, type LayerDefinition } from "./layer.js";
import { mergeConditions } from "./utils/index.js";

export type GroupEntry = Manipulator | LayerDefinition | GroupDefinition;

export interface GroupOptions {
    description: string;
    conditions?: Condition[];
}

export interface GroupDefinition {
    kind: "group";
    description: string;
    conditions: Condition[];
    entries: GroupEntry[];
}

type GroupConfig = string | GroupOptions;

export function group(
    description: string,
    entries: GroupEntry[],
): GroupDefinition;
export function group(
    description: string,
    entry: GroupEntry,
    ...entries: GroupEntry[]
): GroupDefinition;
export function group(
    options: GroupOptions,
    entries: GroupEntry[],
): GroupDefinition;
export function group(
    options: GroupOptions,
    entry: GroupEntry,
    ...entries: GroupEntry[]
): GroupDefinition;
export function group(
    config: GroupConfig,
    entriesOrFirstEntry?: GroupEntry[] | GroupEntry,
    ...remainingEntries: GroupEntry[]
): GroupDefinition {
    const options = normalizeGroupConfig(config);
    const entries = normalizeGroupEntries(
        entriesOrFirstEntry,
        remainingEntries,
    );

    return {
        kind: "group",
        description: options.description,
        conditions: options.conditions ?? [],
        entries,
    };
}

export function compileGroup(definition: GroupDefinition): Rule {
    return {
        description: definition.description,
        manipulators: compileGroupEntries(
            definition.entries,
            definition.conditions,
        ),
    };
}

export function compileGroupEntries(
    entries: GroupEntry[],
    inheritedConditions: Condition[] = [],
): Manipulator[] {
    return entries.flatMap((entry) =>
        compileGroupEntry(entry, inheritedConditions),
    );
}

function compileGroupEntry(
    entry: GroupEntry,
    inheritedConditions: Condition[],
): Manipulator[] {
    if (isGroupDefinition(entry)) {
        return compileGroupEntries(
            entry.entries,
            mergeInheritedConditions(inheritedConditions, entry.conditions),
        );
    }

    if (isLayerDefinition(entry)) {
        return compileLayer(entry).map((manipulator) =>
            applyInheritedConditions(manipulator, inheritedConditions),
        );
    }

    return [applyInheritedConditions(entry, inheritedConditions)];
}

function normalizeGroupConfig(config: GroupConfig): GroupOptions {
    if (typeof config === "string") {
        return {
            description: config,
        };
    }

    return config;
}

function normalizeGroupEntries(
    entriesOrFirstEntry: GroupEntry[] | GroupEntry | undefined,
    remainingEntries: GroupEntry[],
): GroupEntry[] {
    if (!entriesOrFirstEntry) {
        return [];
    }

    if (Array.isArray(entriesOrFirstEntry)) {
        return entriesOrFirstEntry;
    }

    return [entriesOrFirstEntry, ...remainingEntries];
}

function mergeInheritedConditions(
    inheritedConditions: Condition[],
    conditions: Condition[],
): Condition[] {
    if (inheritedConditions.length === 0) {
        return conditions;
    }

    if (conditions.length === 0) {
        return inheritedConditions;
    }

    return mergeConditions(inheritedConditions, conditions);
}

function applyInheritedConditions(
    manipulator: Manipulator,
    inheritedConditions: Condition[],
): Manipulator {
    if (inheritedConditions.length === 0) {
        return manipulator;
    }

    return {
        ...manipulator,
        conditions: mergeConditions(
            inheritedConditions,
            manipulator.conditions ?? [],
        ),
    };
}

function isGroupDefinition(entry: GroupEntry): entry is GroupDefinition {
    return (
        typeof entry === "object" &&
        entry !== null &&
        "kind" in entry &&
        entry.kind === "group"
    );
}

function isLayerDefinition(entry: GroupEntry): entry is LayerDefinition {
    return (
        typeof entry === "object" &&
        entry !== null &&
        "kind" in entry &&
        entry.kind === "layer"
    );
}
