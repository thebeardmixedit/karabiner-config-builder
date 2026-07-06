import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { backup, pruneBackups } from "../backup.js";
import { build } from "../build.js";
import { writeKarabinerConfig } from "../write.js";
import {
    assertNoUnknownArgs,
    getOption,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { resolveConfigSelection } from "./config-selection.js";
import { loadPrefs } from "./prefs.js";
import { resolveKarabinerConfigPath, resolvePath } from "./paths.js";
import { isDirectRun } from "./run.js";

export async function runDeployCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick", "f", "force", "omit-backup"],
        options: ["s", "symlink-from"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick", "f", "force", "omit-backup"],
        options: ["s", "symlink-from"],
        positionals: 1,
    });

    const prefs = loadPrefs();

    const configName = getPositional(args, 0);
    const pick = hasFlag(args, "pick", "p");
    const activePath = resolveKarabinerConfigPath();
    const symlinkFromPath = getOption(args, "symlink-from", "s");
    const deployTargetPath = symlinkFromPath
        ? resolvePath(symlinkFromPath)
        : activePath;

    const shouldBackup =
        prefs.backupBeforeDeploy && !hasFlag(args, "omit-backup");

    const shouldConfirm = prefs.confirmDeploy && !hasFlag(args, "force", "f");

    const selectedConfig = await resolveConfigSelection({
        ...(configName ? { configName } : {}),
        pick,
    });

    const result = await build({
        configPath: selectedConfig.configPath,
    });

    if (shouldConfirm) {
        const confirmed = await confirmDeploy({
            configName: selectedConfig.name,
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
            backupDir: prefs.backupDir,
            maxBackups: prefs.maxBackups,
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

    console.log(`Deployed config: ${selectedConfig.name}`);
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
    configName: string;
    activePath: string;
    configPath: string;
    deployTargetPath: string;
    symlink: boolean;
    backup: boolean;
}

async function confirmDeploy(options: ConfirmDeployOptions): Promise<boolean> {
    console.log("About to deploy Karabiner config:");
    console.log(`Config name: ${options.configName}`);
    console.log(`Config path: ${options.configPath}`);
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

function printHelp(): void {
    console.log(`Usage:
  kcb deploy [options] [config-name]

Arguments:
  config-name               Registered config name
                            Default: default config from registry.json

Options:
  -p, --pick                Choose a config from a numbered list
  -s, --symlink-from <path> Write generated config here and symlink Karabiner to it
  -f, --force               Skip deploy confirmation
  --omit-backup             Skip backup before deploy
  -h, --help                Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runDeployCommand();
}
