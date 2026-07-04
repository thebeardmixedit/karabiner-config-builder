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
    outputPath: string;
}

export async function build(options: BuildOptions = {}): Promise<BuildResult> {
    const configPath = resolveConfigPath(options.configPath);
    const outputPath = resolveOutputPath(options.outPath);

    const config = await loadConfig(configPath);

    validateKarabinerConfig(config);
    writeKarabinerConfig(config, outputPath);

    return {
        configPath,
        outputPath,
    };
}
