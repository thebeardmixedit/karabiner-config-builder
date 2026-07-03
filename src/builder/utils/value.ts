export function createConditionValueKey(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(createConditionValueKey).join(",")}]`;
    }

    if (value && typeof value === "object") {
        return createObjectConditionValueKey(value);
    }

    return JSON.stringify(value);
}

function createObjectConditionValueKey(value: object): string {
    const entries = Object.entries(value)
        .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
        .map(
            ([key, entryValue]) =>
                `${JSON.stringify(key)}:${createConditionValueKey(entryValue)}`,
        );

    return `{${entries.join(",")}}`;
}
