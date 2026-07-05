import { backup, pruneBackups } from "../backup.js";
import { assertNoUnknownArgs, getOption, hasFlag, parseArgs } from "./args.js";
import { isDirectRun } from "./run.js";

const DEFAULT_MAX_BACKUPS = 99;

export function runBackupCommand(rawArgs = process.argv.slice(2)): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
        options: ["backup-dir", "max-backups"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        options: ["backup-dir", "max-backups"],
        positionals: 0,
    });

    const backupDir = getOption(args, "backup-dir");
    const maxBackups = parseMaxBackups(getOption(args, "max-backups"));

    const backupResult = backup({
        ...(backupDir ? { backupDir } : {}),
    });

    const pruneResult = pruneBackups({
        ...(backupDir ? { backupDir } : {}),
        maxBackups,
    });

    printBackupResult(backupResult);
    printPruneResult(pruneResult);
}

function parseMaxBackups(value: string | undefined): number {
    if (!value) {
        return DEFAULT_MAX_BACKUPS;
    }

    const maxBackups = Number(value);

    if (!Number.isInteger(maxBackups) || maxBackups < 1) {
        throw new Error("--max-backups must be an integer greater than 0.");
    }

    return maxBackups;
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

function printPruneResult(result: ReturnType<typeof pruneBackups>): void {
    if (result.removed.length === 0) {
        console.log(`Pruned backups: 0 removed`);
        return;
    }

    console.log(`Pruned backups: ${result.removed.length} removed`);
}

function printHelp(): void {
    console.log(`Usage:
  kcb backup [options]

Options:
  --backup-dir <path>   Directory where backup folders are stored
  --max-backups <count> Maximum number of backups to keep, default: ${DEFAULT_MAX_BACKUPS}
  -h, --help            Show this help`);
}

if (isDirectRun(import.meta.url)) {
    runBackupCommand();
}
