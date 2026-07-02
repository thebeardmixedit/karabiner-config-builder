import { pathToFileURL } from "node:url";

import type { KarabinerConfig } from "./karabiner";

interface ConfigModule {
    config?: KarabinerConfig;
    default?: KarabinerConfig;
}

export async function loadConfig(configPath: string): Promise<KarabinerConfig> {
    const configModule = (await import(
        pathToFileURL(configPath).href
    )) as ConfigModule;

    const config = configModule.config ?? configModule.default;

    if (!config) {
        throw new Error(
            `Config file must export "config" or a default config: ${configPath}`,
        );
    }

    return config;
}
