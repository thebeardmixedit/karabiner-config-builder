#!/usr/bin/env node

import { runBuildCommand } from "./build.js";
import { runPrefsCommand } from "./prefs.js";
import { runBackupCommand } from "./backup.js";

const [command, ...commandArgs] = process.argv.slice(2);

if (!command || command === "-h" || command === "--help") {
    printHelp();
    process.exit(0);
}

switch (command) {
    case "build":
        await runBuildCommand(commandArgs);
        break;

    case "prefs":
        runPrefsCommand(commandArgs);
        break;

    case "backup":
        runBackupCommand(commandArgs);
        break;

    default:
        throw new Error(`Unknown command: ${command}`);
}

function printHelp(): void {
    console.log(`Usage:
  kcb <command> [options]

Commands:
  build     Generate Karabiner JSON
  deploy    Generate and deploy Karabiner config
  backup    Backup active Karabiner config
  restore   Restore a Karabiner config backup
  prefs     Read, write, and reset CLI preferences

Options:
  -h, --help  Show this help`);
}
