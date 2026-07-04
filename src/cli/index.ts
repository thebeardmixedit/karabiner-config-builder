#!/usr/bin/env node

import { getPositional, hasFlag, parseArgs } from "./args.js";
import { runBuildCommand } from "./build.js";
import { runPrefsCommand } from "./prefs.js";

const rawArgs = process.argv.slice(2);
const args = parseArgs(rawArgs, {
    flags: ["h", "help"],
});

const command = getPositional(args, 0);

if (!command || hasFlag(args, "help", "h")) {
    printHelp();
    process.exit(0);
}

const commandArgs = rawArgs.slice(1);

switch (command) {
    case "build":
        await runBuildCommand(commandArgs);
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
  build     Generate karabiner.json
  deploy    Generate and deploy Karabiner config
  backup    Backup active Karabiner config
  restore   Restore a Karabiner config backup
  prefs     Read, write, and reset CLI preferences

Options:
  -h, --help  Show this help`);
}
