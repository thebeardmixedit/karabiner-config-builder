import { backup } from "../backup.js";

interface BackupCliOptions {
    backupDir?: string;
}

const options = parseBackupArgs();

const result = backup({
    ...(options.backupDir ? { backupDir: options.backupDir } : {}),
});

if (result.metadata.kind === "symlink") {
    console.log("Backed up symlinked Karabiner config:");
    console.log(`Active: ${result.metadata.activePath}`);
    console.log(`Target: ${result.metadata.targetPath}`);
    console.log(`Backup: ${result.backupPath}`);
} else {
    console.log("Backed up Karabiner config:");
    console.log(`Active: ${result.metadata.activePath}`);
    console.log(`Backup: ${result.backupPath}`);
}

function parseBackupArgs(args = process.argv.slice(2)): BackupCliOptions {
    const options: BackupCliOptions = {};

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];

        if (!argument) {
            continue;
        }

        if (argument === "-h" || argument === "--help") {
            printHelp();
            process.exit(0);
        }

        if (argument === "--backup-dir") {
            const backupDir = args[index + 1];

            if (!backupDir) {
                throw new Error(`${argument} requires a directory path.`);
            }

            options.backupDir = backupDir;
            index += 1;
            continue;
        }

        throw new Error(`Unknown option: ${argument}`);
    }

    return options;
}

function printHelp(): void {
    console.log(`Usage:
  backup
  backup --backup-dir <path>

Options:
  --backup-dir <path>  Directory where backup folders are stored
  -h, --help           Show this help`);
}
