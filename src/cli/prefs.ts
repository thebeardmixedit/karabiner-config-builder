import fs from "node:fs";
import path from "node:path";

import {
    assertNoUnknownArgs,
    getOption,
    hasFlag,
    parseArgs,
    type ParsedArgs,
} from "./args.js";
import { DEFAULT_BACKUP_DIR, DEFAULT_PREFS_PATH } from "./paths.js";
import { isDirectRun } from "./run.js";

export interface CliPrefs {
    backupDir: string;
    maxBackups: number;
    backupBeforeDeploy: boolean;
    confirmDeploy: boolean;
}

type CliPrefsOverrides = Partial<CliPrefs>;
type PrefKey = keyof CliPrefs;

const PREF_FLAGS = [
    "backup-dir",
    "max-backups",
    "backup-before-deploy",
    "confirm-deploy",
];

const PREF_KEYS: PrefKey[] = [
    "backupDir",
    "maxBackups",
    "backupBeforeDeploy",
    "confirmDeploy",
];

const DEFAULT_CLI_PREFS: CliPrefs = {
    backupDir: DEFAULT_BACKUP_DIR,
    maxBackups: 99,
    backupBeforeDeploy: true,
    confirmDeploy: true,
};

export function loadPrefs(): CliPrefs {
    return {
        ...DEFAULT_CLI_PREFS,
        ...loadPrefsOverrides(),
    };
}

export function runPrefsCommand(rawArgs = process.argv.slice(2)): void {
    const [command, ...commandArgs] = rawArgs;

    if (!command || command === "-h" || command === "--help") {
        printHelp();
        return;
    }

    switch (command) {
        case "read":
            readPrefsCommand(commandArgs);
            return;

        case "write":
            writePrefsCommand(commandArgs);
            return;

        case "reset":
            resetPrefsCommand(commandArgs);
            return;

        default:
            throw new Error(`Unknown prefs command: ${command}`);
    }
}

function readPrefsCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", ...PREF_FLAGS],
    });

    if (hasFlag(args, "help", "h")) {
        printReadHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", ...PREF_FLAGS],
        positionals: 0,
    });

    const prefs = loadPrefs();
    const selectedKeys = getSelectedPrefKeys(args);

    if (selectedKeys.length === 0) {
        console.log(JSON.stringify(prefs, null, 4));
        return;
    }

    if (selectedKeys.length === 1) {
        console.log(
            formatPrefValue(
                getPrefValue(prefs, getOnlySelectedPrefKey(selectedKeys)),
            ),
        );
        return;
    }

    console.log(JSON.stringify(pickPrefs(prefs, selectedKeys), null, 4));
}

function writePrefsCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
        options: PREF_FLAGS,
    });

    if (hasFlag(args, "help", "h")) {
        printWriteHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        options: PREF_FLAGS,
        positionals: 0,
    });

    const updates = getPrefUpdates(args);

    if (updates.length === 0) {
        throw new Error("No preferences provided.");
    }

    const overrides = loadPrefsOverrides();

    for (const update of updates) {
        setPrefOverride(overrides, update.key, update.value);
    }

    savePrefsOverrides(overrides);

    const prefs = loadPrefs();
    const updatedKeys = updates.map((update) => update.key);

    console.log("Updated CLI preferences:");
    console.log(JSON.stringify(pickPrefs(prefs, updatedKeys), null, 4));
}

function resetPrefsCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", ...PREF_FLAGS],
    });

    if (hasFlag(args, "help", "h")) {
        printResetHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", ...PREF_FLAGS],
        positionals: 0,
    });

    const selectedKeys = getSelectedPrefKeys(args);

    if (selectedKeys.length === 0) {
        resetPrefs();
        console.log("Reset all CLI preferences.");
        return;
    }

    const overrides = loadPrefsOverrides();

    for (const key of selectedKeys) {
        deletePrefOverride(overrides, key);
    }

    savePrefsOverrides(overrides);

    const prefs = loadPrefs();

    console.log("Reset CLI preferences:");
    console.log(JSON.stringify(pickPrefs(prefs, selectedKeys), null, 4));
}

interface PrefUpdate {
    key: PrefKey;
    value: string | number | boolean;
}

function getPrefUpdates(args: ParsedArgs): PrefUpdate[] {
    const updates: PrefUpdate[] = [];

    for (const flag of PREF_FLAGS) {
        const value = getOption(args, flag);

        if (value === undefined) {
            continue;
        }

        const key = prefFlagToKey(flag);

        updates.push({
            key,
            value: parsePrefValue(key, value),
        });
    }

    return updates;
}

function getSelectedPrefKeys(args: ParsedArgs): PrefKey[] {
    return PREF_FLAGS.filter((flag) => hasFlag(args, flag)).map(prefFlagToKey);
}

function prefFlagToKey(flag: string): PrefKey {
    switch (flag) {
        case "backup-dir":
            return "backupDir";

        case "max-backups":
            return "maxBackups";

        case "backup-before-deploy":
            return "backupBeforeDeploy";

        case "confirm-deploy":
            return "confirmDeploy";

        default:
            throw new Error(`Unknown preference: --${flag}`);
    }
}

function parsePrefValue(
    key: PrefKey,
    value: string,
): string | number | boolean {
    switch (key) {
        case "backupDir":
            return value;

        case "maxBackups":
            return parseMaxBackups(value);

        case "backupBeforeDeploy":
        case "confirmDeploy":
            return parseBoolean(value);
    }
}

function parseMaxBackups(value: string): number {
    const maxBackups = Number(value);

    if (!Number.isInteger(maxBackups) || maxBackups < 1) {
        throw new Error("--max-backups must be an integer greater than 0.");
    }

    return maxBackups;
}

function parseBoolean(value: string): boolean {
    if (value === "true") {
        return true;
    }

    if (value === "false") {
        return false;
    }

    throw new Error("Boolean preferences must be true or false.");
}

function loadPrefsOverrides(): CliPrefsOverrides {
    if (!fs.existsSync(DEFAULT_PREFS_PATH)) {
        return {};
    }

    const raw = fs.readFileSync(DEFAULT_PREFS_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return normalizePrefsOverrides(parsed);
}

function normalizePrefsOverrides(value: unknown): CliPrefsOverrides {
    if (!isRecord(value)) {
        throw new Error(`Invalid prefs file: ${DEFAULT_PREFS_PATH}`);
    }

    const prefs: CliPrefsOverrides = {};

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

function savePrefsOverrides(overrides: CliPrefsOverrides): void {
    if (!hasPrefsOverrides(overrides)) {
        resetPrefs();
        return;
    }

    fs.mkdirSync(path.dirname(DEFAULT_PREFS_PATH), { recursive: true });
    fs.writeFileSync(
        DEFAULT_PREFS_PATH,
        `${JSON.stringify(createPrefsJson(overrides), null, 4)}\n`,
    );
}

function resetPrefs(): void {
    if (!fs.existsSync(DEFAULT_PREFS_PATH)) {
        return;
    }

    fs.rmSync(DEFAULT_PREFS_PATH, { force: true });
}

function hasPrefsOverrides(overrides: CliPrefsOverrides): boolean {
    return PREF_KEYS.some(
        (key) => getPrefOverride(overrides, key) !== undefined,
    );
}

function createPrefsJson(
    overrides: CliPrefsOverrides,
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of PREF_KEYS) {
        const value = getPrefOverride(overrides, key);

        if (value !== undefined) {
            result[key] = value;
        }
    }

    return result;
}

function setPrefOverride(
    overrides: CliPrefsOverrides,
    key: PrefKey,
    value: string | number | boolean,
): void {
    switch (key) {
        case "backupDir":
            if (typeof value !== "string") {
                throw new Error("backupDir must be a string.");
            }

            overrides.backupDir = value;
            return;

        case "maxBackups":
            if (typeof value !== "number") {
                throw new Error("maxBackups must be a number.");
            }

            overrides.maxBackups = value;
            return;

        case "backupBeforeDeploy":
            if (typeof value !== "boolean") {
                throw new Error("backupBeforeDeploy must be a boolean.");
            }

            overrides.backupBeforeDeploy = value;
            return;

        case "confirmDeploy":
            if (typeof value !== "boolean") {
                throw new Error("confirmDeploy must be a boolean.");
            }

            overrides.confirmDeploy = value;
            return;
    }
}

function deletePrefOverride(overrides: CliPrefsOverrides, key: PrefKey): void {
    switch (key) {
        case "backupDir":
            delete overrides.backupDir;
            return;

        case "maxBackups":
            delete overrides.maxBackups;
            return;

        case "backupBeforeDeploy":
            delete overrides.backupBeforeDeploy;
            return;

        case "confirmDeploy":
            delete overrides.confirmDeploy;
            return;
    }
}

function getPrefOverride(
    overrides: CliPrefsOverrides,
    key: PrefKey,
): string | number | boolean | undefined {
    switch (key) {
        case "backupDir":
            return overrides.backupDir;

        case "maxBackups":
            return overrides.maxBackups;

        case "backupBeforeDeploy":
            return overrides.backupBeforeDeploy;

        case "confirmDeploy":
            return overrides.confirmDeploy;
    }
}

function getPrefValue(
    prefs: CliPrefs,
    key: PrefKey,
): string | number | boolean {
    switch (key) {
        case "backupDir":
            return prefs.backupDir;

        case "maxBackups":
            return prefs.maxBackups;

        case "backupBeforeDeploy":
            return prefs.backupBeforeDeploy;

        case "confirmDeploy":
            return prefs.confirmDeploy;
    }
}

function pickPrefs(
    prefs: CliPrefs,
    keys: PrefKey[],
): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {};

    for (const key of keys) {
        result[key] = getPrefValue(prefs, key);
    }

    return result;
}

function formatPrefValue(value: string | number | boolean): string {
    return String(value);
}

function getOnlySelectedPrefKey(keys: PrefKey[]): PrefKey {
    const key = keys[0];

    if (!key) {
        throw new Error("No preference selected.");
    }

    return key;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function printHelp(): void {
    console.log(`Usage:
  kcb prefs <command> [options]

Commands:
  read     Print CLI preferences
  write    Write CLI preference overrides
  reset    Reset CLI preferences

Examples:
  kcb prefs read
  kcb prefs read --max-backups
  kcb prefs write --max-backups 99 --backup-before-deploy true
  kcb prefs reset`);
}

function printReadHelp(): void {
    console.log(`Usage:
  kcb prefs read [options]

Options:
  --backup-dir              Print backup directory
  --max-backups             Print max backups
  --backup-before-deploy    Print backup-before-deploy preference
  --confirm-deploy          Print confirm-deploy preference
  -h, --help                Show this help`);
}

function printWriteHelp(): void {
    console.log(`Usage:
  kcb prefs write [options]

Options:
  --backup-dir <path>               Set backup directory
  --max-backups <count>             Set max backups
  --backup-before-deploy <true|false>
  --confirm-deploy <true|false>
  -h, --help                        Show this help`);
}

function printResetHelp(): void {
    console.log(`Usage:
  kcb prefs reset [options]

Options:
  --backup-dir              Reset backup directory
  --max-backups             Reset max backups
  --backup-before-deploy    Reset backup-before-deploy preference
  --confirm-deploy          Reset confirm-deploy preference
  -h, --help                Show this help`);
}

if (isDirectRun(import.meta.url)) {
    runPrefsCommand();
}
