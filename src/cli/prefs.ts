import fs from "node:fs";
import path from "node:path";

import { assertNoUnknownArgs, getOption, hasFlag, parseArgs } from "./args.js";
import { DEFAULT_BACKUP_DIR, DEFAULT_PREFS_PATH } from "./paths.js";
import { isDirectRun } from "./run.js";

export interface CliPrefs {
    backupDir: string;
    maxBackups: number;
    backupBeforeDeploy: boolean;
    confirmDeploy: boolean;
}

type PrefKey = keyof CliPrefs;

interface PrefDefinition<T extends PrefKey = PrefKey> {
    key: T;
    flag: string;
    description: string;
    parse(value: string): CliPrefs[T];
    format(value: CliPrefs[T]): string;
}

type PartialCliPrefs = Partial<CliPrefs>;

const DEFAULT_CLI_PREFS: CliPrefs = {
    backupDir: DEFAULT_BACKUP_DIR,
    maxBackups: 99,
    backupBeforeDeploy: true,
    confirmDeploy: true,
};

const PREF_DEFINITIONS = [
    {
        key: "backupDir",
        flag: "backup-dir",
        description: "Directory where backup folders are stored",
        parse: parseString,
        format: formatString,
    },
    {
        key: "maxBackups",
        flag: "max-backups",
        description: "Maximum number of backups to keep",
        parse: parsePositiveInteger,
        format: formatNumber,
    },
    {
        key: "backupBeforeDeploy",
        flag: "backup-before-deploy",
        description: "Whether deploy backs up before writing",
        parse: parseBoolean,
        format: formatBoolean,
    },
    {
        key: "confirmDeploy",
        flag: "confirm-deploy",
        description: "Whether deploy asks for confirmation",
        parse: parseBoolean,
        format: formatBoolean,
    },
] satisfies PrefDefinition[];

const PREF_FLAGS = PREF_DEFINITIONS.map((pref) => pref.flag);

export function runPrefsCommand(rawArgs = process.argv.slice(2)): void {
    const [command, ...commandArgs] = rawArgs;

    if (!command || command === "-h" || command === "--help") {
        printHelp();
        return;
    }

    switch (command) {
        case "read":
            runPrefsReadCommand(commandArgs);
            break;

        case "write":
            runPrefsWriteCommand(commandArgs);
            break;

        case "reset":
            runPrefsResetCommand(commandArgs);
            break;

        default:
            throw new Error(`Unknown prefs command: ${command}`);
    }
}

function runPrefsReadCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", ...PREF_FLAGS],
    });

    if (hasFlag(args, "help", "h")) {
        printPrefsReadHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", ...PREF_FLAGS],
        positionals: 0,
    });

    const selectedPrefs = getSelectedPrefs(args.flags);

    if (selectedPrefs.length > 1) {
        throw new Error("Read one preference at a time, or read all.");
    }

    const prefs = loadPrefs();

    if (selectedPrefs.length === 1) {
        const selectedPref = selectedPrefs[0];

        if (!selectedPref) {
            throw new Error("No preference selected.");
        }

        console.log(formatPrefValue(selectedPref, prefs[selectedPref.key]));
        return;
    }

    console.log(JSON.stringify(prefs, null, 4));
}

function runPrefsWriteCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
        options: PREF_FLAGS,
    });

    if (hasFlag(args, "help", "h")) {
        printPrefsWriteHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        options: PREF_FLAGS,
        positionals: 0,
    });

    const selectedPrefs = getSelectedPrefs(args.options.keys());

    if (selectedPrefs.length === 0) {
        throw new Error("At least one preference is required.");
    }

    const overrides = loadPrefsOverrides();

    for (const pref of selectedPrefs) {
        const rawValue = getOption(args, pref.flag);

        if (rawValue === undefined) {
            throw new Error(`--${pref.flag} requires a value.`);
        }

        setPrefOverride(overrides, pref, rawValue);
    }

    savePrefsOverrides(overrides);

    const prefs = loadPrefs();

    console.log("Updated preferences:");
    console.log(JSON.stringify(prefs, null, 4));
}

function runPrefsResetCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", ...PREF_FLAGS],
    });

    if (hasFlag(args, "help", "h")) {
        printPrefsResetHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", ...PREF_FLAGS],
        positionals: 0,
    });

    const selectedPrefs = getSelectedPrefs(args.flags);

    if (selectedPrefs.length === 0) {
        savePrefsOverrides({});
        console.log("Reset all preferences.");
        return;
    }

    const overrides = loadPrefsOverrides();

    for (const pref of selectedPrefs) {
        delete overrides[pref.key];
    }

    savePrefsOverrides(overrides);

    console.log("Reset preferences:");
    for (const pref of selectedPrefs) {
        console.log(`--${pref.flag}`);
    }
}

export function loadPrefs(): CliPrefs {
    const overrides = loadPrefsOverrides();

    return {
        ...DEFAULT_CLI_PREFS,
        ...overrides,
    };
}

function loadPrefsOverrides(): PartialCliPrefs {
    if (!fs.existsSync(DEFAULT_PREFS_PATH)) {
        return {};
    }

    const raw = fs.readFileSync(DEFAULT_PREFS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return normalizePrefsOverrides(parsed);
}

function savePrefsOverrides(overrides: PartialCliPrefs): void {
    const normalized = normalizePrefsOverrides(overrides);

    fs.mkdirSync(path.dirname(DEFAULT_PREFS_PATH), {
        recursive: true,
    });

    fs.writeFileSync(
        DEFAULT_PREFS_PATH,
        `${JSON.stringify(normalized, null, 4)}\n`,
    );
}

function normalizePrefsOverrides(value: unknown): PartialCliPrefs {
    if (!isRecord(value)) {
        throw new Error(`Invalid prefs file: ${DEFAULT_PREFS_PATH}`);
    }

    const prefs: PartialCliPrefs = {};

    if (value.backupDir !== undefined) {
        if (typeof value.backupDir !== "string") {
            throw new Error("prefs.backupDir must be a string.");
        }

        prefs.backupDir = value.backupDir;
    }

    if (value.maxBackups !== undefined) {
        if (
            typeof value.maxBackups !== "number" ||
            !Number.isInteger(value.maxBackups) ||
            value.maxBackups < 1
        ) {
            throw new Error(
                "prefs.maxBackups must be an integer greater than 0.",
            );
        }

        prefs.maxBackups = value.maxBackups;
    }

    if (value.backupBeforeDeploy !== undefined) {
        if (typeof value.backupBeforeDeploy !== "boolean") {
            throw new Error("prefs.backupBeforeDeploy must be a boolean.");
        }

        prefs.backupBeforeDeploy = value.backupBeforeDeploy;
    }

    if (value.confirmDeploy !== undefined) {
        if (typeof value.confirmDeploy !== "boolean") {
            throw new Error("prefs.confirmDeploy must be a boolean.");
        }

        prefs.confirmDeploy = value.confirmDeploy;
    }

    return prefs;
}

function getSelectedPrefs(flags: Iterable<string>): PrefDefinition[] {
    const selectedFlags = new Set(flags);

    return PREF_DEFINITIONS.filter((pref) => selectedFlags.has(pref.flag));
}

function setPrefOverride(
    prefs: PartialCliPrefs,
    pref: PrefDefinition,
    rawValue: string,
): void {
    switch (pref.key) {
        case "backupDir":
            prefs.backupDir = parseString(rawValue);
            break;

        case "maxBackups":
            prefs.maxBackups = parsePositiveInteger(rawValue);
            break;

        case "backupBeforeDeploy":
            prefs.backupBeforeDeploy = parseBoolean(rawValue);
            break;

        case "confirmDeploy":
            prefs.confirmDeploy = parseBoolean(rawValue);
            break;
    }
}

function formatPrefValue(
    pref: PrefDefinition,
    value: CliPrefs[PrefKey],
): string {
    switch (pref.key) {
        case "backupDir":
            return formatString(value as CliPrefs["backupDir"]);

        case "maxBackups":
            return formatNumber(value as CliPrefs["maxBackups"]);

        case "backupBeforeDeploy":
            return formatBoolean(value as CliPrefs["backupBeforeDeploy"]);

        case "confirmDeploy":
            return formatBoolean(value as CliPrefs["confirmDeploy"]);
    }
}

function parseString(value: string): string {
    return value;
}

function parsePositiveInteger(value: string): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new Error("Preference value must be an integer greater than 0.");
    }

    return parsed;
}

function parseBoolean(value: string): boolean {
    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    throw new Error("Boolean preference value must be true or false.");
}

function formatString(value: string): string {
    return value;
}

function formatNumber(value: number): string {
    return value.toString();
}

function formatBoolean(value: boolean): string {
    return value ? "true" : "false";
}

function printHelp(): void {
    console.log(`Usage:
  kcb prefs <command> [options]

Commands:
  read      Read preferences
  write     Write preferences
  reset     Reset preferences

Options:
  -h, --help  Show this help`);
}

function printPrefsReadHelp(): void {
    console.log(`Usage:
  kcb prefs read [--<pref-name>]

Examples:
  kcb prefs read
  kcb prefs read --max-backups

Preferences:
${formatPrefHelp()}

Options:
  -h, --help  Show this help`);
}

function printPrefsWriteHelp(): void {
    console.log(`Usage:
  kcb prefs write --<pref-name> <value>

Examples:
  kcb prefs write --max-backups 99
  kcb prefs write --backup-before-deploy true
  kcb prefs write --confirm-deploy false

Preferences:
${formatPrefHelp()}

Options:
  -h, --help  Show this help`);
}

function printPrefsResetHelp(): void {
    console.log(`Usage:
  kcb prefs reset [--<pref-name>]

Examples:
  kcb prefs reset
  kcb prefs reset --max-backups

Preferences:
${formatPrefHelp()}

Options:
  -h, --help  Show this help`);
}

function formatPrefHelp(): string {
    return PREF_DEFINITIONS.map((pref) => {
        const defaultValue = DEFAULT_CLI_PREFS[pref.key];

        return `  --${pref.flag.padEnd(22)} ${pref.description}. Default: ${formatPrefValue(pref, defaultValue)}`;
    }).join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

if (isDirectRun(import.meta.url)) {
    runPrefsCommand();
}
