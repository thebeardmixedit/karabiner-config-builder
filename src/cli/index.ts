#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runBackupCommand } from "./backup.js";
import { runBuildCommand } from "./build.js";
import { runConfigCommand } from "./config.js";
import { runDeployCommand } from "./deploy.js";
import { runInitCommand } from "./init.js";
import { runPrefsCommand } from "./prefs.js";

interface PackageJson {
    version?: string;
}

const [command, ...commandArgs] = process.argv.slice(2);

if (!command || command === "-h" || command === "--help") {
    printHelp();
    process.exit(0);
}

if (command === "-v" || command === "--version") {
    printVersion();
    process.exit(0);
}

switch (command) {
    case "init":
        runInitCommand(commandArgs);
        break;

    case "config":
        await runConfigCommand(commandArgs);
        break;

    case "build":
        await runBuildCommand(commandArgs);
        break;

    case "deploy":
        await runDeployCommand(commandArgs);
        break;

    case "backup":
        await runBackupCommand(commandArgs);
        break;

    case "prefs":
        runPrefsCommand(commandArgs);
        break;

    default:
        throw new Error(`Unknown command: ${command}`);
}

function printHelp(): void {
    console.log(`Usage:
  kcb <command> [options]

Commands:
  init      Initialize a Karabiner Config Builder workspace
  config    Manage registered configs
  build     Generate Karabiner JSON
  deploy    Generate and deploy Karabiner config
  backup    Manage Karabiner config backups
  prefs     Read, write, and reset CLI preferences

Options:
  -h, --help     Show this help
  -v, --version  Print version`);
}

function printVersion(): void {
    console.log(getPackageVersion());
}

function getPackageVersion(): string {
    const packageJsonPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "..",
        "..",
        "package.json",
    );

    const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf8"),
    ) as PackageJson;

    return packageJson.version ?? "unknown";
}
