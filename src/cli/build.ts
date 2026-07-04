import { build } from "../build.js";
import { assertNoUnknownArgs, getOption, hasFlag, parseArgs } from "./args.js";
import { isDirectRun } from "./run.js";

export async function runBuildCommand(
    rawArgs = process.argv.slice(2),
): Promise<void> {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help"],
        options: ["c", "config", "o", "out"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help"],
        options: ["c", "config", "o", "out"],
        positionals: 0,
    });

    const configPath = getOption(args, "config", "c");
    const outPath = getOption(args, "out", "o");

    const result = await build({
        ...(configPath ? { configPath } : {}),
        ...(outPath ? { outPath } : {}),
    });

    console.log(`Built Karabiner config from: ${result.configPath}`);
    console.log(`Wrote Karabiner config to: ${result.outputPath}`);
}

function printHelp(): void {
    console.log(`Usage:
  kcb build [options]

Options:
  -c, --config <path>  Config file to load
  -o, --out <path>     Output path for generated karabiner.json
  -h, --help           Show this help`);
}

if (isDirectRun(import.meta.url)) {
    await runBuildCommand();
}
