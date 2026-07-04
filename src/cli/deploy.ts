import fs from "node:fs";
import path from "node:path";

import { build } from "../build.js";
import { assertNoUnknownArgs, getOption, hasFlag, parseArgs } from "./args.js";
import {
    DEFAULT_KARABINER_CONFIG_PATH,
    resolveKarabinerConfigPath,
    resolveOutputPath,
    resolvePath,
} from "./paths.js";
import { isDirectRun } from "./run.js";

export async function runDeployCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
        options: ["c", "config", "o", "out", "symlink-from"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        options: ["c", "config", "o", "out", "symlink-from"],
        positionals: 0,
    });

    const configPath = getOption(args, "config", "c");
    const outPath = getOption(args, "out", "o");
    const symlinkFromPath = getOption(args, "symlink-from");

    if (outPath && symlinkFromPath) {
        throw new Error("Use either --out or --symlink-from, not both.");
    }

    const karabinerConfigPath = resolveKarabinerConfigPath();

    if (symlinkFromPath) {
        await deploySymlink({
            ...(configPath ? { configPath } : {}),
            karabinerConfigPath,
            symlinkFromPath,
        });

        return;
    }

    await deployRegular({
        ...(configPath ? { configPath } : {}),
        karabinerConfigPath,
        ...(outPath ? { outPath } : {}),
    });
}

interface DeployRegularOptions {
    configPath?: string;
    karabinerConfigPath: string;
    outPath?: string;
}

async function deployRegular(options: DeployRegularOptions): Promise<void> {
    const outputPath = resolveOutputPath(
        options.outPath ?? DEFAULT_KARABINER_CONFIG_PATH,
    );

    const result = await build({
        ...(options.configPath ? { configPath: options.configPath } : {}),
        outPath: outputPath,
    });

    copyKarabinerConfig(outputPath, options.karabinerConfigPath);

    console.log(`Built Karabiner config from: ${result.configPath}`);
    console.log(`Wrote Karabiner config to: ${result.outputPath}`);
    console.log("Deployed Karabiner config:");
    console.log(options.karabinerConfigPath);
}

interface DeploySymlinkOptions {
    configPath?: string;
    karabinerConfigPath: string;
    symlinkFromPath: string;
}

async function deploySymlink(options: DeploySymlinkOptions): Promise<void> {
    const symlinkFromPath = resolvePath(options.symlinkFromPath);

    const result = await build({
        ...(options.configPath ? { configPath: options.configPath } : {}),
        outPath: symlinkFromPath,
    });

    symlinkKarabinerConfig(options.karabinerConfigPath, symlinkFromPath);

    console.log(`Built Karabiner config from: ${result.configPath}`);
    console.log(`Wrote Karabiner config to: ${result.outputPath}`);
    console.log("Deployed Karabiner config with symlink:");
    console.log(`${options.karabinerConfigPath} -> ${symlinkFromPath}`);
}

function copyKarabinerConfig(fromPath: string, toPath: string): void {
    if (!fs.existsSync(fromPath)) {
        throw new Error(`Generated config not found: ${fromPath}`);
    }

    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    removeExistingPath(toPath);
    fs.copyFileSync(fromPath, toPath);
}

function symlinkKarabinerConfig(
    karabinerConfigPath: string,
    symlinkFromPath: string,
): void {
    if (!fs.existsSync(symlinkFromPath)) {
        throw new Error(`Generated config not found: ${symlinkFromPath}`);
    }

    fs.mkdirSync(path.dirname(karabinerConfigPath), { recursive: true });
    fs.rmSync(karabinerConfigPath, { force: true });
    fs.symlinkSync(symlinkFromPath, karabinerConfigPath);
}

function removeExistingPath(filePath: string): void {
    if (!fs.existsSync(filePath) && !isSymlink(filePath)) {
        return;
    }

    fs.rmSync(filePath, { force: true });
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
  kcb deploy [options]

Options:
  -c, --config <path>       Config file to load
  -o, --out <path>          Generated config output path before deploy
  --symlink-from <path>     Generate config here and symlink Karabiner to it
  -h, --help                Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runDeployCommand();
}
