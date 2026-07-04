export interface ArgSchema {
    flags?: string[];
    options?: string[];
}

export interface ParsedArgs {
    flags: Set<string>;
    options: Map<string, string>;
    positionals: string[];
}

export function parseArgs(
    args = process.argv.slice(2),
    schema: ArgSchema = {},
): ParsedArgs {
    const parsed: ParsedArgs = {
        flags: new Set(),
        options: new Map(),
        positionals: [],
    };

    const flags = new Set(schema.flags ?? []);
    const options = new Set(schema.options ?? []);

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];

        if (!argument) {
            continue;
        }

        if (argument === "--") {
            parsed.positionals.push(...args.slice(index + 1));
            break;
        }

        if (argument.startsWith("--")) {
            index = parseLongOption(args, index, parsed, flags, options);
            continue;
        }

        if (argument.startsWith("-") && argument.length > 1) {
            index = parseShortOption(args, index, parsed, flags, options);
            continue;
        }

        parsed.positionals.push(argument);
    }

    return parsed;
}

export function hasFlag(
    args: ParsedArgs,
    longName: string,
    shortName?: string,
): boolean {
    return (
        args.flags.has(longName) ||
        (shortName !== undefined && args.flags.has(shortName))
    );
}

export function getOption(
    args: ParsedArgs,
    longName: string,
    shortName?: string,
): string | undefined {
    return (
        args.options.get(longName) ??
        (shortName ? args.options.get(shortName) : undefined)
    );
}

export function getPositional(
    args: ParsedArgs,
    index: number,
): string | undefined {
    return args.positionals[index];
}

export function assertNoUnknownArgs(
    args: ParsedArgs,
    allowed: {
        flags?: string[];
        options?: string[];
        positionals?: number;
    },
): void {
    for (const flag of args.flags) {
        if (!allowed.flags?.includes(flag)) {
            throw new Error(`Unknown option: ${formatOption(flag)}`);
        }
    }

    for (const option of args.options.keys()) {
        if (!allowed.options?.includes(option)) {
            throw new Error(`Unknown option: ${formatOption(option)}`);
        }
    }

    if (
        allowed.positionals !== undefined &&
        args.positionals.length > allowed.positionals
    ) {
        throw new Error("Too many positional arguments.");
    }
}

function parseLongOption(
    args: string[],
    index: number,
    parsed: ParsedArgs,
    flags: Set<string>,
    options: Set<string>,
): number {
    const argument = args[index];

    if (!argument) {
        return index;
    }

    const option = argument.slice(2);
    const equalsIndex = option.indexOf("=");

    if (equalsIndex !== -1) {
        const name = option.slice(0, equalsIndex);
        const value = option.slice(equalsIndex + 1);

        if (!name) {
            throw new Error(`Invalid option: ${argument}`);
        }

        if (flags.has(name)) {
            throw new Error(`${formatOption(name)} does not accept a value.`);
        }

        parsed.options.set(name, value);
        return index;
    }

    const name = option;

    if (!name) {
        throw new Error(`Invalid option: ${argument}`);
    }

    if (flags.has(name)) {
        parsed.flags.add(name);
        return index;
    }

    if (options.has(name)) {
        const value = args[index + 1];

        if (!value || isOptionLike(value)) {
            throw new Error(`${formatOption(name)} requires a value.`);
        }

        parsed.options.set(name, value);
        return index + 1;
    }

    const value = args[index + 1];

    if (value && !isOptionLike(value)) {
        parsed.options.set(name, value);
        return index + 1;
    }

    parsed.flags.add(name);
    return index;
}

function parseShortOption(
    args: string[],
    index: number,
    parsed: ParsedArgs,
    flags: Set<string>,
    options: Set<string>,
): number {
    const argument = args[index];

    if (!argument) {
        return index;
    }

    const shortOptions = argument.slice(1);

    if (shortOptions.length === 0) {
        throw new Error(`Invalid option: ${argument}`);
    }

    if (shortOptions.length > 1) {
        return parseShortOptionGroup(argument, parsed, flags, options, index);
    }

    const name = shortOptions;

    if (flags.has(name)) {
        parsed.flags.add(name);
        return index;
    }

    if (options.has(name)) {
        const value = args[index + 1];

        if (!value || isOptionLike(value)) {
            throw new Error(`${formatOption(name)} requires a value.`);
        }

        parsed.options.set(name, value);
        return index + 1;
    }

    const value = args[index + 1];

    if (value && !isOptionLike(value)) {
        parsed.options.set(name, value);
        return index + 1;
    }

    parsed.flags.add(name);
    return index;
}

function parseShortOptionGroup(
    argument: string,
    parsed: ParsedArgs,
    flags: Set<string>,
    options: Set<string>,
    index: number,
): number {
    const shortOptions = argument.slice(1);

    for (const name of shortOptions) {
        if (options.has(name)) {
            throw new Error(
                `${formatOption(name)} requires a value and cannot be used in a grouped short option.`,
            );
        }

        parsed.flags.add(name);
    }

    return index;
}

function isOptionLike(value: string): boolean {
    return value.startsWith("-") && value !== "-";
}

function formatOption(option: string): string {
    return option.length === 1 ? `-${option}` : `--${option}`;
}
