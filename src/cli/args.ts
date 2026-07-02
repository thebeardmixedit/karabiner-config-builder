export interface CliOptions {
    configPath?: string;
    outPath?: string;
    symlinkFromPath?: string;
}

export function parseArgs(args = process.argv.slice(2)): CliOptions {
    const options: CliOptions = {};

    for (let index = 0; index < args.length; index += 1) {
        const argument = args[index];

        if (argument === "-c" || argument === "--config") {
            const configPath = args[index + 1];

            if (!configPath) {
                throw new Error(`${argument} requires a config path.`);
            }

            options.configPath = configPath;
            index += 1;
            continue;
        }

        if (argument === "-o" || argument === "--out") {
            const outPath = args[index + 1];

            if (!outPath) {
                throw new Error(`${argument} requires an output path.`);
            }

            options.outPath = outPath;
            index += 1;
            continue;
        }

        if (argument === "-s" || argument === "--symlink-from") {
            const symlinkFromPath = args[index + 1];

            if (!symlinkFromPath) {
                throw new Error(`${argument} requires a file path.`);
            }

            options.symlinkFromPath = symlinkFromPath;
            index += 1;
            continue;
        }

        throw new Error(`Unknown option: ${argument}`);
    }

    return options;
}
