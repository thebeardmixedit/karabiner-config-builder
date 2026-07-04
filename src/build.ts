import type { KarabinerConfig } from "./karabiner/index.js";
import { resolveConfigPath, resolveOutputPath } from "./cli/paths.js";
import { validateKarabinerConfig } from "./karabiner/index.js";
import { loadConfig } from "./load.js";
import { writeKarabinerConfig } from "./write.js";

interface BuildOptions {
    configPath?: string;
    outPath?: string;
}

export interface BuildResult {
    configPath: string;
    config: KarabinerConfig;
    json: string;
    outputPath?: string;
}

export async function build(options: BuildOptions = {}): Promise<BuildResult> {
    const configPath = resolveConfigPath(options.configPath);
    const config = await loadConfig(configPath);

    validateKarabinerConfig(config);

    const json = stringifyKarabinerConfig(config);

    if (!options.outPath) {
        return {
            configPath,
            config,
            json,
        };
    }

    const outputPath = resolveOutputPath(options.outPath);

    writeKarabinerConfig(config, outputPath);

    return {
        configPath,
        config,
        json,
        outputPath,
    };
}

function stringifyKarabinerConfig(config: KarabinerConfig): string {
    return `${JSON.stringify(config, null, 2)}\n`;
}
