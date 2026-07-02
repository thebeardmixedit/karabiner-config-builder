import { resolveConfigPath, resolveOutputPath } from "./cli/paths";
import { validateKarabinerConfig } from "./karabiner";
import { loadConfig } from "./load";
import { writeKarabinerConfig } from "./write";

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
