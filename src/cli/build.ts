import { build } from "../build.js";
import {
    assertNoUnknownArgs,
    getOption,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { resolveConfigSelection } from "./config-selection.js";
import { isDirectRun } from "./run.js";

export async function runBuildCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "p", "pick"],
        options: ["o", "output"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "p", "pick"],
        options: ["o", "output"],
        positionals: 1,
    });

    const configName = getPositional(args, 0);
    const pick = hasFlag(args, "pick", "p");
    const outputPath = getOption(args, "output", "o");

    const selectedConfig = await resolveConfigSelection({
        ...(configName ? { configName } : {}),
        pick,
    });

    const result = await build({
        configPath: selectedConfig.configPath,
        ...(outputPath ? { outPath: outputPath } : {}),
    });

    if (!result.outputPath) {
        process.stdout.write(result.json);
        return;
    }

    console.log(`Built config: ${selectedConfig.name}`);
    console.log(`Built Karabiner config from: ${result.configPath}`);
    console.log(`Wrote Karabiner config to: ${result.outputPath}`);
}

function printHelp(): void {
    console.log(`Usage:
  kcb build [options] [config-name]

Arguments:
  config-name          Registered config name
                       Default: default config from registry.json

Options:
  -p, --pick           Choose a config from a numbered list
  -o, --output <path>  Output path for generated Karabiner JSON
  -h, --help           Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runBuildCommand();
}
