import type { Condition } from "../../karabiner/index.js";

import { createConditionValueKey } from "./value.js";
import { validateConditionConflicts } from "./validate.js";

export function mergeConditions(
    ruleConditions: Condition[],
    manipulatorConditions: Condition[],
): Condition[] {
    const conditions = [...ruleConditions, ...manipulatorConditions];
    const merged: Condition[] = [];

    for (const condition of conditions) {
        const existingIndex = merged.findIndex((existing) =>
            canMergeConditions(existing, condition),
        );

        if (existingIndex === -1) {
            merged.push(condition);
            continue;
        }

        const existing = merged[existingIndex];

        if (!existing) {
            merged.push(condition);
            continue;
        }

        merged[existingIndex] = mergeCondition(existing, condition);
    }

    const deduped = dedupeConditions(merged);

    validateConditionConflicts(deduped);

    return deduped;
}

function canMergeConditions(first: Condition, second: Condition): boolean {
    return first.type === second.type && isListCondition(first);
}

function mergeCondition(first: Condition, second: Condition): Condition {
    switch (first.type) {
        case "frontmost_application_if":
            if (second.type !== "frontmost_application_if") {
                return first;
            }

            return {
                ...first,
                bundle_identifiers: dedupeValues([
                    ...(first.bundle_identifiers ?? []),
                    ...(second.bundle_identifiers ?? []),
                ]),
            };

        case "frontmost_application_unless":
            if (second.type !== "frontmost_application_unless") {
                return first;
            }

            return {
                ...first,
                bundle_identifiers: dedupeValues([
                    ...(first.bundle_identifiers ?? []),
                    ...(second.bundle_identifiers ?? []),
                ]),
            };

        case "device_if":
            if (second.type !== "device_if") {
                return first;
            }

            return {
                ...first,
                identifiers: dedupeByKey(
                    [
                        ...(first.identifiers ?? []),
                        ...(second.identifiers ?? []),
                    ],
                    createConditionValueKey,
                ),
            };

        case "device_unless":
            if (second.type !== "device_unless") {
                return first;
            }

            return {
                ...first,
                identifiers: dedupeByKey(
                    [
                        ...(first.identifiers ?? []),
                        ...(second.identifiers ?? []),
                    ],
                    createConditionValueKey,
                ),
            };

        case "device_exists_if":
            if (second.type !== "device_exists_if") {
                return first;
            }

            return {
                ...first,
                identifiers: dedupeByKey(
                    [
                        ...(first.identifiers ?? []),
                        ...(second.identifiers ?? []),
                    ],
                    createConditionValueKey,
                ),
            };

        case "device_exists_unless":
            if (second.type !== "device_exists_unless") {
                return first;
            }

            return {
                ...first,
                identifiers: dedupeByKey(
                    [
                        ...(first.identifiers ?? []),
                        ...(second.identifiers ?? []),
                    ],
                    createConditionValueKey,
                ),
            };

        case "keyboard_type_if":
            if (second.type !== "keyboard_type_if") {
                return first;
            }

            return {
                ...first,
                keyboard_types: dedupeValues([
                    ...(first.keyboard_types ?? []),
                    ...(second.keyboard_types ?? []),
                ]),
            };

        case "keyboard_type_unless":
            if (second.type !== "keyboard_type_unless") {
                return first;
            }

            return {
                ...first,
                keyboard_types: dedupeValues([
                    ...(first.keyboard_types ?? []),
                    ...(second.keyboard_types ?? []),
                ]),
            };

        case "input_source_if":
            if (second.type !== "input_source_if") {
                return first;
            }

            return {
                ...first,
                input_sources: dedupeByKey(
                    [
                        ...(first.input_sources ?? []),
                        ...(second.input_sources ?? []),
                    ],
                    createConditionValueKey,
                ),
            };

        case "input_source_unless":
            if (second.type !== "input_source_unless") {
                return first;
            }

            return {
                ...first,
                input_sources: dedupeByKey(
                    [
                        ...(first.input_sources ?? []),
                        ...(second.input_sources ?? []),
                    ],
                    createConditionValueKey,
                ),
            };

        default:
            return first;
    }
}

function isListCondition(condition: Condition): boolean {
    switch (condition.type) {
        case "frontmost_application_if":
        case "frontmost_application_unless":
        case "device_if":
        case "device_unless":
        case "device_exists_if":
        case "device_exists_unless":
        case "keyboard_type_if":
        case "keyboard_type_unless":
        case "input_source_if":
        case "input_source_unless":
            return true;

        default:
            return false;
    }
}

function dedupeConditions(conditions: Condition[]): Condition[] {
    return dedupeByKey(conditions, createConditionValueKey);
}

function dedupeValues<T>(values: T[]): T[] {
    return [...new Set(values)];
}

function dedupeByKey<T>(values: T[], createKey: (value: T) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const value of values) {
        const key = createKey(value);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(value);
    }

    return result;
}
