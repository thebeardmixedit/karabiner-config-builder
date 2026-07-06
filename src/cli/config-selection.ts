import { pickOne } from "./picker.js";
import {
    getConfig,
    getDefaultConfig,
    listConfigs,
    type RegisteredConfig,
} from "./registry.js";

export interface ResolveConfigSelectionOptions {
    configName?: string;
    pick?: boolean;
}

export async function resolveConfigSelection(
    options: ResolveConfigSelectionOptions = {},
): Promise<RegisteredConfig> {
    if (options.pick && options.configName) {
        throw new Error("Use either a config name or --pick, not both.");
    }

    if (options.pick) {
        return pickConfig();
    }

    if (options.configName) {
        return getConfig(options.configName);
    }

    return getDefaultConfig();
}

export async function pickConfig(): Promise<RegisteredConfig> {
    const configs = listConfigs();

    return pickOne({
        title: "Registered configs:",
        items: configs.map((config) => ({
            label: config.name,
            detail: config.workspacePath,
            value: config,
        })),
        prompt: `Choose a config [1-${configs.length}]: `,
        emptyMessage: "No configs registered.",
    });
}
