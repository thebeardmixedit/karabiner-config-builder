import os from "node:os";
import path from "node:path";

export const DEFAULT_CONFIG_PATH = path.join(
    os.homedir(),
    ".config",
    "karabiner-config-builder",
    "config.ts",
);

export const DEFAULT_OUTPUT_PATH = path.resolve(
    process.cwd(),
    "karabiner.json",
);

export const DEFAULT_KARABINER_CONFIG_PATH = path.join(
    os.homedir(),
    ".config",
    "karabiner",
    "karabiner.json",
);

export function resolvePath(filePath: string): string {
    if (filePath === "~") {
        return os.homedir();
    }

    if (filePath.startsWith("~/")) {
        return path.join(os.homedir(), filePath.slice(2));
    }

    return path.resolve(process.cwd(), filePath);
}

export function resolveConfigPath(configPath = DEFAULT_CONFIG_PATH): string {
    return resolvePath(configPath);
}

export function resolveOutputPath(outputPath = DEFAULT_OUTPUT_PATH): string {
    return resolvePath(outputPath);
}

export function resolveKarabinerConfigPath(
    configPath = DEFAULT_KARABINER_CONFIG_PATH,
): string {
    return resolvePath(configPath);
}
