import type { Condition } from "../../karabiner";

import { createConditionValueKey } from "./value";

interface ListConditionInfo {
    family: string;
    kind: "if" | "unless";
    values: string[];
}

interface VariableConditionInfo {
    kind: "if" | "unless";
    name: string;
    value: ConditionValue;
    valueKey: string;
}

interface EventChangedConditionInfo {
    kind: "if" | "unless";
    value: boolean;
}

type ConditionValue = string | number | boolean;

export function validateConditionConflicts(conditions: Condition[]): void {
    for (let index = 0; index < conditions.length; index += 1) {
        const first = conditions[index];

        if (!first) {
            continue;
        }

        for (
            let otherIndex = index + 1;
            otherIndex < conditions.length;
            otherIndex += 1
        ) {
            const second = conditions[otherIndex];

            if (!second) {
                continue;
            }

            validateVariableConditionConflict(first, second);
            validateEventChangedConditionConflict(first, second);
            validateListConditionConflict(first, second);
        }
    }
}

function validateVariableConditionConflict(
    first: Condition,
    second: Condition,
): void {
    const firstInfo = getVariableConditionInfo(first);
    const secondInfo = getVariableConditionInfo(second);

    if (!firstInfo || !secondInfo) {
        return;
    }

    if (firstInfo.name !== secondInfo.name) {
        return;
    }

    if (
        firstInfo.kind === "if" &&
        secondInfo.kind === "if" &&
        firstInfo.valueKey !== secondInfo.valueKey
    ) {
        throw new Error(
            `Conflicting variable conditions for "${firstInfo.name}": cannot require both ${formatConditionValue(firstInfo.value)} and ${formatConditionValue(secondInfo.value)}.`,
        );
    }

    if (
        firstInfo.kind !== secondInfo.kind &&
        firstInfo.valueKey === secondInfo.valueKey
    ) {
        throw new Error(
            `Conflicting variable conditions for "${firstInfo.name}": cannot require and exclude ${formatConditionValue(firstInfo.value)}.`,
        );
    }
}

function validateEventChangedConditionConflict(
    first: Condition,
    second: Condition,
): void {
    const firstInfo = getEventChangedConditionInfo(first);
    const secondInfo = getEventChangedConditionInfo(second);

    if (!firstInfo || !secondInfo) {
        return;
    }

    if (
        firstInfo.kind === "if" &&
        secondInfo.kind === "if" &&
        firstInfo.value !== secondInfo.value
    ) {
        throw new Error(
            `Conflicting event_changed conditions: cannot require both ${firstInfo.value} and ${secondInfo.value}.`,
        );
    }

    if (
        firstInfo.kind === "unless" &&
        secondInfo.kind === "unless" &&
        firstInfo.value !== secondInfo.value
    ) {
        throw new Error(
            `Conflicting event_changed conditions: cannot exclude both ${firstInfo.value} and ${secondInfo.value}.`,
        );
    }

    if (
        firstInfo.kind !== secondInfo.kind &&
        firstInfo.value === secondInfo.value
    ) {
        throw new Error(
            `Conflicting event_changed conditions: cannot require and exclude ${firstInfo.value}.`,
        );
    }
}

function validateListConditionConflict(
    first: Condition,
    second: Condition,
): void {
    const firstInfo = getListConditionInfo(first);
    const secondInfo = getListConditionInfo(second);

    if (!firstInfo || !secondInfo) {
        return;
    }

    if (firstInfo.family !== secondInfo.family) {
        return;
    }

    if (firstInfo.kind === secondInfo.kind) {
        return;
    }

    const overlap = firstInfo.values.find((value) =>
        secondInfo.values.includes(value),
    );

    if (!overlap) {
        return;
    }

    throw new Error(
        `Conflicting ${firstInfo.family} conditions: ${overlap} is both required and excluded.`,
    );
}

function getVariableConditionInfo(
    condition: Condition,
): VariableConditionInfo | undefined {
    switch (condition.type) {
        case "variable_if":
            return {
                kind: "if",
                name: condition.name,
                value: condition.value,
                valueKey: createConditionValueKey(condition.value),
            };

        case "variable_unless":
            return {
                kind: "unless",
                name: condition.name,
                value: condition.value,
                valueKey: createConditionValueKey(condition.value),
            };

        default:
            return undefined;
    }
}

function getEventChangedConditionInfo(
    condition: Condition,
): EventChangedConditionInfo | undefined {
    switch (condition.type) {
        case "event_changed_if":
            return {
                kind: "if",
                value: condition.value,
            };

        case "event_changed_unless":
            return {
                kind: "unless",
                value: condition.value,
            };

        default:
            return undefined;
    }
}

function getListConditionInfo(
    condition: Condition,
): ListConditionInfo | undefined {
    switch (condition.type) {
        case "frontmost_application_if":
            return {
                family: "frontmost_application",
                kind: "if",
                values: condition.bundle_identifiers ?? [],
            };

        case "frontmost_application_unless":
            return {
                family: "frontmost_application",
                kind: "unless",
                values: condition.bundle_identifiers ?? [],
            };

        case "device_if":
            return {
                family: "device",
                kind: "if",
                values: (condition.identifiers ?? []).map(
                    createConditionValueKey,
                ),
            };

        case "device_unless":
            return {
                family: "device",
                kind: "unless",
                values: (condition.identifiers ?? []).map(
                    createConditionValueKey,
                ),
            };

        case "device_exists_if":
            return {
                family: "device_exists",
                kind: "if",
                values: (condition.identifiers ?? []).map(
                    createConditionValueKey,
                ),
            };

        case "device_exists_unless":
            return {
                family: "device_exists",
                kind: "unless",
                values: (condition.identifiers ?? []).map(
                    createConditionValueKey,
                ),
            };

        case "keyboard_type_if":
            return {
                family: "keyboard_type",
                kind: "if",
                values: condition.keyboard_types ?? [],
            };

        case "keyboard_type_unless":
            return {
                family: "keyboard_type",
                kind: "unless",
                values: condition.keyboard_types ?? [],
            };

        case "input_source_if":
            return {
                family: "input_source",
                kind: "if",
                values: (condition.input_sources ?? []).map(
                    createConditionValueKey,
                ),
            };

        case "input_source_unless":
            return {
                family: "input_source",
                kind: "unless",
                values: (condition.input_sources ?? []).map(
                    createConditionValueKey,
                ),
            };

        default:
            return undefined;
    }
}

function formatConditionValue(value: unknown): string {
    return JSON.stringify(value);
}
