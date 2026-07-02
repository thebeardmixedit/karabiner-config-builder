import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { restore } from "../restore";
import { resolveBackupDir } from "./paths";

interface RestoreCliOptions {
    backupPath?: string;
    search?: boolean;
}

const options = parseRestoreArgs();

const backupPath = options.search ? searchBackup() : options.backupPath;

const result = restore({
    ...(backupPath ? { backupPath } : {}),
});

if (result.metadata.kind === "symlink") {
    console.log("Restored symlinked Karabiner config:");
    console.log(`${result.restoredPath} -> ${result.restoredTargetPath}`);

    if (result.restoredTargetContents) {
        console.log("Restored missing symlink target from backup contents.");
    } else {
        console.log("Preserved existing symlink target contents.");
    }

    console.log(`Backup: ${result.backupPath}`);
} else {
    console.log("Restored Karabiner config:");
    console.log(result.restoredPath);
    console.log(`Backup: ${result.backupPath}`);
}

function parseRestoreArgs(args = process.argv.slice(2)): RestoreCliOptions {
    const options: RestoreCliOptions = {};

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];

        if (!argument) {
            continue;
        }

        if (argument === "-h" || argument === "--help") {
            printHelp();
            process.exit(0);
        }

        if (argument === "-s" || argument === "--search") {
            options.search = true;
            continue;
        }

        if (argument.startsWith("-")) {
            throw new Error(`Unknown option: ${argument}`);
        }

        if (options.backupPath) {
            throw new Error("Only one backup path can be provided.");
        }

        options.backupPath = argument;
    }

    if (options.search && options.backupPath) {
        throw new Error("Use either a backup path or --search, not both.");
    }

    return options;
}

function searchBackup(): string {
    if (!commandExists("fzf")) {
        throw new Error("fzf is required for --search but was not found.");
    }

    const backupPaths = listBackupPaths();

    if (backupPaths.length === 0) {
        throw new Error(`No backups found in: ${resolveBackupDir()}`);
    }

    const selected = spawnSync("fzf", {
        input: `${backupPaths.join("\n")}\n`,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "inherit"],
    });

    if (selected.status !== 0) {
        throw new Error("No backup selected.");
    }

    const backupPath = selected.stdout.trim();

    if (!backupPath) {
        throw new Error("No backup selected.");
    }

    return backupPath;
}

function listBackupPaths(): string[] {
    const backupDir = resolveBackupDir();

    if (!fs.existsSync(backupDir)) {
        return [];
    }

    return fs
        .readdirSync(backupDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(backupDir, entry.name))
        .sort()
        .reverse();
}

function commandExists(command: string): boolean {
    const result = spawnSync("which", [command], {
        stdio: "ignore",
    });

    return result.status === 0;
}

function printHelp(): void {
    console.log(`Usage:
  restore
  restore <backup-directory>
  restore -s
  restore --search

Options:
  -s, --search   Choose a backup with fzf
  -h, --help     Show this help`);
}
