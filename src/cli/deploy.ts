import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { backup, pruneBackups } from "../backup.js";
import { build } from "../build.js";
import { writeKarabinerConfig } from "../write.js";
import { assertNoUnknownArgs, getOption, hasFlag, parseArgs } from "./args.js";
import { loadPrefs } from "./prefs.js";
import { resolveKarabinerConfigPath, resolvePath } from "./paths.js";
import { isDirectRun } from "./run.js";

export async function runDeployCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "force", "no-backup"],
        options: ["c", "config", "backup-dir", "max-backups", "symlink-from"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "force", "no-backup"],
        options: ["c", "config", "backup-dir", "max-backups", "symlink-from"],
        positionals: 0,
    });

    const prefs = loadPrefs();

    const configPath = getOption(args, "config", "c");
    const activePath = resolveKarabinerConfigPath();
    const symlinkFromPath = getOption(args, "symlink-from");
    const deployTargetPath = symlinkFromPath
        ? resolvePath(symlinkFromPath)
        : activePath;

    const backupDir = getOption(args, "backup-dir") ?? prefs.backupDir;
    const maxBackups = parseMaxBackups(
        getOption(args, "max-backups"),
        prefs.maxBackups,
    );

    const shouldBackup =
        prefs.backupBeforeDeploy && !hasFlag(args, "no-backup");

    const shouldConfirm = prefs.confirmDeploy && !hasFlag(args, "force");

    const result = await build({
        ...(configPath ? { configPath } : {}),
    });

    if (shouldConfirm) {
        const confirmed = await confirmDeploy({
            activePath,
            configPath: result.configPath,
            deployTargetPath,
            symlink: Boolean(symlinkFromPath),
            backup: shouldBackup,
        });

        if (!confirmed) {
            console.log("Deploy cancelled.");
            return;
        }
    }

    if (shouldBackup) {
        backupActiveConfig({
            activePath,
            backupDir,
            maxBackups,
        });
    }

    if (symlinkFromPath) {
        deploySymlink({
            activePath,
            symlinkFromPath: deployTargetPath,
            config: result.config,
        });
    } else {
        deployRegular({
            activePath,
            config: result.config,
        });
    }

    console.log(`Built Karabiner config from: ${result.configPath}`);

    if (symlinkFromPath) {
        console.log("Deployed Karabiner config with symlink:");
        console.log(`${activePath} -> ${deployTargetPath}`);
        return;
    }

    console.log("Deployed Karabiner config:");
    console.log(activePath);
}

interface ConfirmDeployOptions {
    activePath: string;
    configPath: string;
    deployTargetPath: string;
    symlink: boolean;
    backup: boolean;
}

async function confirmDeploy(options: ConfirmDeployOptions): Promise<boolean> {
    console.log("About to deploy Karabiner config:");
    console.log(`Config: ${options.configPath}`);
    console.log(`Active: ${options.activePath}`);

    if (options.symlink) {
        console.log(`Target: ${options.deployTargetPath}`);
        console.log("Mode: symlink deploy");
    } else {
        console.log("Mode: regular deploy");
    }

    console.log(`Backup: ${options.backup ? "yes" : "no"}`);
    console.log("");

    const rl = readline.createInterface({ input, output });

    try {
        const answer = await rl.question("Continue? [y/N] ");
        return answer.trim().toLowerCase() === "y";
    } finally {
        rl.close();
    }
}

interface BackupActiveConfigOptions {
    activePath: string;
    backupDir: string;
    maxBackups: number;
}

function backupActiveConfig(options: BackupActiveConfigOptions): void {
    if (!pathExists(options.activePath)) {
        console.log(
            `No existing Karabiner config found; skipped backup: ${options.activePath}`,
        );
        return;
    }

    const backupResult = backup({
        karabinerConfigPath: options.activePath,
        backupDir: options.backupDir,
    });

    const pruneResult = pruneBackups({
        backupDir: options.backupDir,
        maxBackups: options.maxBackups,
    });

    console.log("Backed up existing Karabiner config:");
    console.log(backupResult.backupPath);
    console.log(`Pruned backups: ${pruneResult.removed.length} removed`);
}

interface DeployRegularOptions {
    activePath: string;
    config: Parameters<typeof writeKarabinerConfig>[0];
}

function deployRegular(options: DeployRegularOptions): void {
    removeActiveSymlink(options.activePath);
    writeKarabinerConfig(options.config, options.activePath);
}

interface DeploySymlinkOptions {
    activePath: string;
    symlinkFromPath: string;
    config: Parameters<typeof writeKarabinerConfig>[0];
}

function deploySymlink(options: DeploySymlinkOptions): void {
    writeKarabinerConfig(options.config, options.symlinkFromPath);
    replaceWithSymlink(options.activePath, options.symlinkFromPath);
}

function replaceWithSymlink(activePath: string, targetPath: string): void {
    fs.mkdirSync(path.dirname(activePath), { recursive: true });
    removeExistingPath(activePath);
    fs.symlinkSync(targetPath, activePath);
}

function removeActiveSymlink(activePath: string): void {
    if (!isSymlink(activePath)) {
        return;
    }

    fs.rmSync(activePath, { force: true });
}

function removeExistingPath(filePath: string): void {
    if (!pathExists(filePath) && !isSymlink(filePath)) {
        return;
    }

    const stats = fs.lstatSync(filePath);

    if (stats.isDirectory() && !stats.isSymbolicLink()) {
        throw new Error(`Refusing to remove directory: ${filePath}`);
    }

    fs.rmSync(filePath, { force: true });
}

function pathExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

function isSymlink(filePath: string): boolean {
    try {
        return fs.lstatSync(filePath).isSymbolicLink();
    } catch {
        return false;
    }
}

function parseMaxBackups(
    value: string | undefined,
    defaultValue: number,
): number {
    if (!value) {
        return defaultValue;
    }

    const maxBackups = Number(value);

    if (!Number.isInteger(maxBackups) || maxBackups < 1) {
        throw new Error("--max-backups must be an integer greater than 0.");
    }

    return maxBackups;
}

function printHelp(): void {
    console.log(`Usage:
  kcb deploy [options]

Options:
  -c, --config <path>    Config file to load
  --symlink-from <path>  Write generated config here and symlink Karabiner to it
  --backup-dir <path>   Directory where backup folders are stored
  --max-backups <count> Maximum number of backups to keep
  --no-backup           Skip backup before deploy
  --force               Skip deploy confirmation
  -h, --help            Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runDeployCommand();
}
