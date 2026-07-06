import fs from "node:fs";
import path from "node:path";

import { backup, pruneBackups } from "../backup.js";
import { restore } from "../restore.js";
import {
    assertNoUnknownArgs,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { pickOne } from "./picker.js";
import { loadPrefs } from "./prefs.js";
import { isDirectRun } from "./run.js";

interface ListedBackup {
    name: string;
    path: string;
}

export async function runBackupCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const [command = "create", ...commandArgs] = rawArgs;

    if (command === "-h" || command === "--help") {
        printHelp();

        return;
    }

    switch (command) {
        case "create":
            runBackupCreateCommand(commandArgs);

            break;

        case "list":
            runBackupListCommand(commandArgs);

            break;

        case "restore":
            await runBackupRestoreCommand(commandArgs);

            break;

        case "delete":
            await runBackupDeleteCommand(commandArgs);

            break;

        default:
            throw new Error(`Unknown backup command: ${command}`);
    }
}

function runBackupCreateCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
    });

    if (hasFlag(args, "help", "h")) {
        printBackupCreateHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        positionals: 0,
    });

    const prefs = loadPrefs();

    const backupResult = backup({
        backupDir: prefs.backupDir,
    });

    const pruneResult = pruneBackups({
        backupDir: prefs.backupDir,
        maxBackups: prefs.maxBackups,
    });

    printBackupResult(backupResult);
    console.log(`Pruned backups: ${pruneResult.removed.length} removed`);
}

function runBackupListCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
    });

    if (hasFlag(args, "help", "h")) {
        printBackupListHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        positionals: 0,
    });

    const prefs = loadPrefs();
    printBackupList(prefs.backupDir);
}

async function runBackupRestoreCommand(rawArgs: string[]): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick"],
    });

    if (hasFlag(args, "help", "h")) {
        printBackupRestoreHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick"],
        positionals: 1,
    });

    const prefs = loadPrefs();
    const pick = hasFlag(args, "pick", "p");
    const backupName = getPositional(args, 0);

    if (pick && backupName) {
        throw new Error("Use either a backup name or --pick, not both.");
    }

    const selectedBackup = pick
        ? await pickBackup(prefs.backupDir)
        : backupName
          ? getBackupByName(prefs.backupDir, backupName)
          : undefined;

    const result = restore({
        backupDir: prefs.backupDir,
        ...(selectedBackup ? { backupPath: selectedBackup.path } : {}),
    });

    printRestoreResult(result);
}

async function runBackupDeleteCommand(rawArgs: string[]): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick"],
    });

    if (hasFlag(args, "help", "h")) {
        printBackupDeleteHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick"],
        positionals: 1,
    });

    const prefs = loadPrefs();
    const pick = hasFlag(args, "pick", "p");
    const backupName = getPositional(args, 0);

    if (pick && backupName) {
        throw new Error("Use either a backup name or --pick, not both.");
    }

    if (!pick && !backupName) {
        throw new Error("Backup name is required unless --pick is active.");
    }

    const selectedBackup = pick
        ? await pickBackup(prefs.backupDir)
        : getBackupByName(prefs.backupDir, requiredBackupName(backupName));

    fs.rmSync(selectedBackup.path, {
        recursive: true,
        force: true,
    });

    console.log("Deleted backup:");
    console.log(selectedBackup.name);
    console.log(selectedBackup.path);
}

async function pickBackup(backupDir: string): Promise<ListedBackup> {
    const backups = listBackups(backupDir);

    return pickOne({
        title: "Available backups:",
        items: backups.map((backupItem) => ({
            label: backupItem.name,
            detail: backupItem.path,
            value: backupItem,
        })),
        prompt: `Choose a backup [1-${backups.length}]: `,
        emptyMessage: `No backups found in: ${backupDir}`,
    });
}

function printBackupList(backupDir: string): void {
    const backups = listBackups(backupDir);

    if (backups.length === 0) {
        console.log(`No backups found in: ${backupDir}`);
        return;
    }

    console.log(`Available backups in: ${backupDir}`);
    console.log("");

    for (const backupItem of backups) {
        console.log(backupItem.name);
        console.log(`  ${backupItem.path}`);
    }
}

function listBackups(backupDir: string): ListedBackup[] {
    if (!fs.existsSync(backupDir)) {
        return [];
    }

    return fs
        .readdirSync(backupDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => ({
            name: entry.name,
            path: path.join(backupDir, entry.name),
        }))
        .filter((backupItem) => isBackupDirectory(backupItem.path))
        .sort(compareBackupsNewestFirst);
}

function getBackupByName(backupDir: string, backupName: string): ListedBackup {
    const backups = listBackups(backupDir);
    const backupItem = backups.find((item) => item.name === backupName);

    if (!backupItem) {
        throw new Error(`Unknown backup: ${backupName}`);
    }

    return backupItem;
}

function isBackupDirectory(backupPath: string): boolean {
    const metadataPath = path.join(backupPath, "metadata.json");
    const backupFilePath = path.join(backupPath, "karabiner.json");

    return fs.existsSync(metadataPath) && fs.existsSync(backupFilePath);
}

function compareBackupsNewestFirst(
    first: ListedBackup,
    second: ListedBackup,
): number {
    return second.name.localeCompare(first.name);
}

function requiredBackupName(backupName: string | undefined): string {
    if (!backupName) {
        throw new Error("Backup name is required.");
    }

    return backupName;
}

function printBackupResult(result: ReturnType<typeof backup>): void {
    if (result.metadata.kind === "symlink") {
        console.log("Backed up symlinked Karabiner config:");
        console.log(`Active: ${result.metadata.activePath}`);
        console.log(`Target: ${result.metadata.targetPath}`);
        console.log(`Backup: ${result.backupPath}`);
        return;
    }

    console.log("Backed up Karabiner config:");
    console.log(`Active: ${result.metadata.activePath}`);
    console.log(`Backup: ${result.backupPath}`);
}

function printRestoreResult(result: ReturnType<typeof restore>): void {
    if (result.metadata.kind === "symlink") {
        console.log("Restored symlinked Karabiner config:");
        console.log(`${result.restoredPath} -> ${result.restoredTargetPath}`);

        if (result.restoredTargetContents) {
            console.log(
                "Restored missing symlink target from backup contents.",
            );
        } else {
            console.log("Preserved existing symlink target contents.");
        }

        console.log(`Backup: ${result.backupPath}`);
        return;
    }

    console.log("Restored Karabiner config:");
    console.log(result.restoredPath);
    console.log(`Backup: ${result.backupPath}`);
}

function printHelp(): void {
    console.log(`Usage:
  kcb backup <command> [options]

Commands:
  create    Create a timestamped backup
  list      List available backups
  restore   Restore a backup
  delete    Delete a backup

Aliases:
  kcb backup    Same as kcb backup create

Options:
  -h, --help    Show this help`);
}

function printBackupCreateHelp(): void {
    console.log(`Usage:
  kcb backup create

Create a timestamped backup of the active Karabiner config.

Options:
  -h, --help    Show this help`);
}

function printBackupListHelp(): void {
    console.log(`Usage:
  kcb backup list

Print available backups to stdout.

Options:
  -h, --help    Show this help`);
}

function printBackupRestoreHelp(): void {
    console.log(`Usage:
  kcb backup restore [options] [backup-name]

Arguments:
  backup-name   Backup timestamp directory name
                Default: latest backup

Options:
  -p, --pick    Choose a backup from a numbered list
  -h, --help    Show this help`);
}

function printBackupDeleteHelp(): void {
    console.log(`Usage:
  kcb backup delete [options] <backup-name>

Arguments:
  backup-name   Backup timestamp directory name

Options:
  -p, --pick    Choose a backup from a numbered list
  -h, --help    Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runBackupCommand();
}
