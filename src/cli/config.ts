import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";

import {
    assertNoUnknownArgs,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { pickOne } from "./picker.js";
import {
    getConfig,
    getDefaultConfigName,
    listConfigs,
    removeConfig,
    setDefaultConfig,
    type RegisteredConfig,
} from "./registry.js";
import { isDirectRun } from "./run.js";
import { linkWorkspacePackage } from "./package-link.js";

export async function runConfigCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const [command, ...commandArgs] = rawArgs;

    if (!command || command === "-h" || command === "--help") {
        printHelp();
        return;
    }

    switch (command) {
        case "list":
            runConfigListCommand(commandArgs);
            break;

        case "default":
            await runConfigDefaultCommand(commandArgs);
            break;

        case "remove":
            await runConfigRemoveCommand(commandArgs);
            break;

        case "relink":
            await runConfigRelinkCommand(commandArgs);
            break;

        default:
            throw new Error(`Unknown config command: ${command}`);
    }
}

function runConfigListCommand(rawArgs: string[]): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
    });

    if (hasFlag(args, "help", "h")) {
        printConfigListHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        positionals: 0,
    });

    const configs = listConfigs();

    if (configs.length === 0) {
        console.log("No configs registered.");
        return;
    }

    console.log("Registered configs:");
    console.log("");

    for (const config of configs) {
        const marker = configIsDefault(config) ? "*" : " ";
        console.log(`${marker} ${config.name}`);
        console.log(`  Workspace: ${config.workspacePath}`);
        console.log(`  Config:    ${config.configPath}`);
    }
}

async function runConfigDefaultCommand(rawArgs: string[]): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick"],
    });

    if (hasFlag(args, "help", "h")) {
        printConfigDefaultHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick"],
        positionals: 1,
    });

    const pick = hasFlag(args, "pick", "p");
    const configName = getPositional(args, 0);

    if (pick && configName) {
        throw new Error("Use either a config name or --pick, not both.");
    }

    if (!pick && !configName) {
        throw new Error("Config name is required unless --pick is active.");
    }

    const selectedConfig = pick
        ? await pickConfig()
        : setDefaultConfig(requiredConfigName(configName));

    if (pick) {
        setDefaultConfig(selectedConfig.name);
    }

    console.log(`Default config: ${selectedConfig.name}`);
    console.log(selectedConfig.workspacePath);
}

async function runConfigRemoveCommand(rawArgs: string[]): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick", "delete-workspace"],
    });

    if (hasFlag(args, "help", "h")) {
        printConfigRemoveHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick", "delete-workspace"],
        positionals: 1,
    });

    const pick = hasFlag(args, "pick", "p");
    const deleteWorkspace = hasFlag(args, "delete-workspace");
    const configName = getPositional(args, 0);

    if (pick && configName) {
        throw new Error("Use either a config name or --pick, not both.");
    }

    if (!pick && !configName) {
        throw new Error("Config name is required unless --pick is active.");
    }

    const selectedConfig = pick
        ? await pickConfig()
        : getConfigForRemoval(requiredConfigName(configName));

    if (deleteWorkspace) {
        const confirmed = await confirmDeleteWorkspace(selectedConfig);

        if (!confirmed) {
            console.log("Config removal cancelled.");
            return;
        }
    }

    const removedConfig = removeConfig(selectedConfig.name, {
        deleteWorkspace,
    });

    if (deleteWorkspace) {
        console.log("Removed config and deleted workspace:");
    } else {
        console.log("Removed config from registry:");
    }

    console.log(removedConfig.name);
    console.log(removedConfig.workspacePath);
}

async function runConfigRelinkCommand(rawArgs: string[]): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick"],
    });

    if (hasFlag(args, "help", "h")) {
        printConfigRelinkHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick"],
        positionals: 1,
    });

    const pick = hasFlag(args, "pick", "p");
    const configName = getPositional(args, 0);

    if (pick && configName) {
        throw new Error("Use either a config name or --pick, not both.");
    }

    const configs = await getConfigsForRelink({
        pick,
        ...(configName ? { configName } : {}),
    });

    if (configs.length === 0) {
        console.log("No configs registered.");
        return;
    }

    for (const config of configs) {
        try {
            assertWorkspaceCanBeRelinked(config);

            const result = linkWorkspacePackage(config.workspacePath);

            console.log(`Relinked config: ${config.name}`);
            console.log(`  ${result.packageLinkPath}`);
            console.log(`  -> ${result.packageRoot}`);
        } catch (error) {
            console.warn(`Skipped config: ${config.name}`);
            console.warn(`  ${getErrorMessage(error)}`);
        }
    }
}

async function pickConfig(): Promise<RegisteredConfig> {
    const configs = listConfigs();

    return pickOne({
        title: "Registered configs:",
        items: configs.map((config) => ({
            label: configIsDefault(config) ? `${config.name} *` : config.name,
            detail: config.workspacePath,
            value: config,
        })),
        prompt: `Choose a config [1-${configs.length}]: `,
        emptyMessage: "No configs registered.",
    });
}

function getConfigForRemoval(configName: string): RegisteredConfig {
    const configs = listConfigs();
    const config = configs.find((item) => item.name === configName);

    if (!config) {
        throw new Error(`Unknown config: ${configName}`);
    }

    return config;
}

function configIsDefault(config: RegisteredConfig): boolean {
    return getDefaultConfigName() === config.name;
}

async function confirmDeleteWorkspace(
    config: RegisteredConfig,
): Promise<boolean> {
    console.log("This will remove the config from registry.json and delete:");
    console.log(config.workspacePath);
    console.log("");

    const rl = readline.createInterface({ input, output });

    try {
        const answer = await rl.question("Continue? [y/N] ");
        return answer.trim().toLowerCase() === "y";
    } finally {
        rl.close();
    }
}

function requiredConfigName(configName: string | undefined): string {
    if (!configName) {
        throw new Error("Config name is required.");
    }

    return configName;
}

async function getConfigsForRelink(options: {
    pick: boolean;
    configName?: string;
}): Promise<RegisteredConfig[]> {
    if (options.pick) {
        return [await pickConfig()];
    }

    if (options.configName) {
        return [getConfig(options.configName)];
    }

    return listConfigs();
}

function assertWorkspaceCanBeRelinked(config: RegisteredConfig): void {
    if (!fs.existsSync(config.workspacePath)) {
        throw new Error(`Workspace does not exist: ${config.workspacePath}`);
    }

    if (!fs.statSync(config.workspacePath).isDirectory()) {
        throw new Error(
            `Workspace path is not a directory: ${config.workspacePath}`,
        );
    }

    const requiredFiles = [
        path.join(config.workspacePath, "config.ts"),
        path.join(config.workspacePath, "package.json"),
        path.join(config.workspacePath, "tsconfig.json"),
    ];

    for (const filePath of requiredFiles) {
        if (!fs.existsSync(filePath)) {
            throw new Error(
                `Workspace is missing ${path.basename(filePath)}: ${filePath}`,
            );
        }
    }
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}

function printHelp(): void {
    console.log(`Usage: kcb config <command> [options]

Commands:
  list       List registered configs
  default    Mark a config as default
  remove     Remove a config from the registry
  relink     Relink registered workspaces to the current package install

Options:
  -h, --help  Show this help`);
}

function printConfigListHelp(): void {
    console.log(`Usage:
  kcb config list

Print registered configs to stdout, with default marked.

Options:
  -h, --help  Show this help`);
}

function printConfigDefaultHelp(): void {
    console.log(`Usage:
  kcb config default [options] <config-name>

Arguments:
  config-name       Registered config name

Options:
  -p, --pick        Choose a config from a numbered list
  -h, --help        Show this help`);
}

function printConfigRemoveHelp(): void {
    console.log(`Usage:
  kcb config remove [options] <config-name>

Arguments:
  config-name          Registered config name

Options:
  -p, --pick           Choose a config from a numbered list
  --delete-workspace   Delete associated workspace files
  -h, --help           Show this help`);
}

function printConfigRelinkHelp(): void {
    console.log(`Usage: kcb config relink [options] [config-name]

Relink workspace package bridges to the current karabiner-config-builder install.

Arguments:
  config-name  Registered config name
               If omitted, all registered configs are relinked.

Options:
  -p, --pick   Choose a config from a numbered list
  -h, --help   Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runConfigCommand();
}
