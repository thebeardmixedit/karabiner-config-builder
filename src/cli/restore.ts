import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { restore } from "../restore.js";
import {
    assertNoUnknownArgs,
    getOption,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { resolveBackupDir } from "./paths.js";
import { isDirectRun } from "./run.js";

export async function runRestoreCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick", "l", "list"],
        options: ["backup-dir"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick", "l", "list"],
        options: ["backup-dir"],
        positionals: 1,
    });

    const backupDir = getOption(args, "backup-dir");
    const backupPath = getPositional(args, 0);
    const pick = hasFlag(args, "pick", "p");
    const list = hasFlag(args, "list", "l");

    if (list && pick) {
        throw new Error("Use either --list or --pick, not both.");
    }

    if ((list || pick) && backupPath) {
        throw new Error("Use either a backup path or --list/--pick, not both.");
    }

    if (list) {
        printBackupList(backupDir);
        return;
    }

    const selectedBackupPath = pick ? await pickBackup(backupDir) : backupPath;

    const result = restore({
        ...(selectedBackupPath ? { backupPath: selectedBackupPath } : {}),
        ...(backupDir ? { backupDir } : {}),
    });

    printRestoreResult(result);
}

async function pickBackup(backupDir?: string): Promise<string> {
    const backupPaths = listBackupPaths(backupDir);
    const resolvedBackupDir = resolveBackupDir(backupDir);

    if (backupPaths.length === 0) {
        throw new Error(`No backups found in: ${resolvedBackupDir}`);
    }

    printBackupList(backupDir);
    console.log("");

    const rl = readline.createInterface({ input, output });

    try {
        const answer = await rl.question(
            `Choose a backup to restore [1-${backupPaths.length}]: `,
        );

        const selectedIndex = Number(answer) - 1;

        if (
            !Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= backupPaths.length
        ) {
            throw new Error("No valid backup selected.");
        }

        const selectedBackupPath = backupPaths[selectedIndex];

        if (!selectedBackupPath) {
            throw new Error("No valid backup selected.");
        }

        return selectedBackupPath;
    } finally {
        rl.close();
    }
}

function printBackupList(backupDir?: string): void {
    const backupPaths = listBackupPaths(backupDir);
    const resolvedBackupDir = resolveBackupDir(backupDir);

    if (backupPaths.length === 0) {
        console.log(`No backups found in: ${resolvedBackupDir}`);
        return;
    }

    console.log(`Available backups in: ${resolvedBackupDir}`);
    console.log("");

    backupPaths.forEach((backupPath, index) => {
        console.log(`  ${index + 1}. ${path.basename(backupPath)}`);
        console.log(`     ${backupPath}`);
    });
}

function listBackupPaths(backupDir?: string): string[] {
    const resolvedBackupDir = resolveBackupDir(backupDir);

    if (!fs.existsSync(resolvedBackupDir)) {
        return [];
    }

    return fs
        .readdirSync(resolvedBackupDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(resolvedBackupDir, entry.name))
        .filter(isBackupDirectory)
        .sort(compareBackupPathsNewestFirst);
}

function isBackupDirectory(backupPath: string): boolean {
    const metadataPath = path.join(backupPath, "metadata.json");
    const backupFilePath = path.join(backupPath, "karabiner.json");

    return fs.existsSync(metadataPath) && fs.existsSync(backupFilePath);
}

function compareBackupPathsNewestFirst(first: string, second: string): number {
    return second.localeCompare(first);
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
  kcb restore [backup-path] [options]

Options:
  -p, --pick          Choose a backup from a numbered list
  -l, --list          List available backups without restoring
  --backup-dir <path> Directory where backup folders are stored
  -h, --help          Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runRestoreCommand();
}
