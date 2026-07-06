import os from "node:os";
import path from "node:path";

export const DEFAULT_KCB_CONFIG_DIR = path.join(
    os.homedir(),
    ".config",
    "karabiner-config-builder",
);

export const DEFAULT_WORKSPACE_DIR = path.join(
    DEFAULT_KCB_CONFIG_DIR,
    "default",
);

export const DEFAULT_CONFIG_PATH = path.join(
    DEFAULT_WORKSPACE_DIR,
    "config.ts",
);

export const DEFAULT_BUILD_DIR = path.join(DEFAULT_KCB_CONFIG_DIR, "build");

export const DEFAULT_BACKUP_DIR = path.join(DEFAULT_KCB_CONFIG_DIR, "backups");

export const DEFAULT_PREFS_PATH = path.join(
    DEFAULT_KCB_CONFIG_DIR,
    "prefs.json",
);

export const DEFAULT_REGISTRY_PATH = path.join(
    DEFAULT_KCB_CONFIG_DIR,
    "registry.json",
);

export const DEFAULT_KARABINER_CONFIG_PATH = path.join(
    os.homedir(),
    ".config",
    "karabiner",
    "karabiner.json",
);

export function createDefaultBuildOutputPath(date = new Date()): string {
    return path.join(
        DEFAULT_BUILD_DIR,
        `kcb_build_${formatBuildTimestamp(date)}.json`,
    );
}

export function resolvePath(filePath: string): string {
    if (filePath === "~") {
        return os.homedir();
    }

    if (filePath.startsWith("~/")) {
        return path.join(os.homedir(), filePath.slice(2));
    }

    return path.resolve(process.cwd(), filePath);
}

export function resolveConfigPath(configPath?: string): string {
    return resolvePath(configPath ?? DEFAULT_CONFIG_PATH);
}

export function resolveOutputPath(outputPath: string): string {
    return resolvePath(outputPath);
}

export function resolveKarabinerConfigPath(configPath?: string): string {
    return resolvePath(configPath ?? DEFAULT_KARABINER_CONFIG_PATH);
}

export function resolveBackupDir(backupDir?: string): string {
    return resolvePath(backupDir ?? DEFAULT_BACKUP_DIR);
}

function formatBuildTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = padDatePart(date.getMonth() + 1);
    const day = padDatePart(date.getDate());
    const hour = padDatePart(date.getHours());
    const minute = padDatePart(date.getMinutes());
    const second = padDatePart(date.getSeconds());

    return `${year}${month}${day}_${hour}${minute}${second}`;
}

function padDatePart(value: number): string {
    return value.toString().padStart(2, "0");
}
