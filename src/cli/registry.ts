import fs from "node:fs";
import path from "node:path";

import { DEFAULT_REGISTRY_PATH, resolvePath } from "./paths.js";

export interface RegisteredConfig {
    name: string;
    workspacePath: string;
    configPath: string;
}

export interface ConfigRegistry {
    defaultConfig?: string;
    configs: Record<string, RegisteredConfig>;
}

export interface RegisterWorkspaceOptions {
    makeDefault?: boolean;
}

export interface RemoveConfigOptions {
    deleteWorkspace?: boolean;
}

export function loadRegistry(): ConfigRegistry {
    if (!fs.existsSync(DEFAULT_REGISTRY_PATH)) {
        return {
            configs: {},
        };
    }

    const raw = fs.readFileSync(DEFAULT_REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return normalizeRegistry(parsed);
}

export function saveRegistry(registry: ConfigRegistry): void {
    const normalized = normalizeRegistry(registry);

    fs.mkdirSync(path.dirname(DEFAULT_REGISTRY_PATH), {
        recursive: true,
    });

    fs.writeFileSync(
        DEFAULT_REGISTRY_PATH,
        `${JSON.stringify(createRegistryJson(normalized), null, 4)}\n`,
    );
}

export function registerWorkspace(
    workspacePath: string,
    options: RegisterWorkspaceOptions = {},
): RegisteredConfig {
    const resolvedWorkspacePath = resolvePath(workspacePath);

    assertValidWorkspace(resolvedWorkspacePath);

    const config = createRegisteredConfig(resolvedWorkspacePath);
    const registry = loadRegistry();
    const existingConfig = registry.configs[config.name];

    if (
        existingConfig &&
        existingConfig.workspacePath !== config.workspacePath
    ) {
        throw new Error(
            `Config name already exists with a different workspace: ${config.name}`,
        );
    }

    registry.configs[config.name] = config;

    if (options.makeDefault === true || !registry.defaultConfig) {
        registry.defaultConfig = config.name;
    }

    saveRegistry(registry);

    return config;
}

export function removeConfig(
    configName: string,
    options: RemoveConfigOptions = {},
): RegisteredConfig {
    const registry = loadRegistry();
    const config = getConfig(configName, registry);

    delete registry.configs[config.name];

    if (registry.defaultConfig === config.name) {
        const nextDefault = getFirstConfigName(registry);

        if (nextDefault) {
            registry.defaultConfig = nextDefault;
        } else {
            delete registry.defaultConfig;
        }
    }

    saveRegistry(registry);

    if (options.deleteWorkspace === true) {
        fs.rmSync(config.workspacePath, {
            recursive: true,
            force: true,
        });
    }

    return config;
}

export function setDefaultConfig(configName: string): RegisteredConfig {
    const registry = loadRegistry();
    const config = getConfig(configName, registry);

    registry.defaultConfig = config.name;
    saveRegistry(registry);

    return config;
}

export function getDefaultConfig(registry = loadRegistry()): RegisteredConfig {
    const configName = registry.defaultConfig;

    if (!configName) {
        throw new Error("No default config is registered.");
    }

    return getConfig(configName, registry);
}

export function getDefaultConfigName(
    registry = loadRegistry(),
): string | undefined {
    return registry.defaultConfig;
}

export function getConfig(
    configName: string,
    registry = loadRegistry(),
): RegisteredConfig {
    const config = registry.configs[configName];

    if (!config) {
        throw new Error(`Unknown config: ${configName}`);
    }

    return config;
}

export function listConfigs(registry = loadRegistry()): RegisteredConfig[] {
    return Object.values(registry.configs).sort(compareConfigs);
}

export function resolveRegisteredConfig(configName?: string): RegisteredConfig {
    if (configName) {
        return getConfig(configName);
    }

    return getDefaultConfig();
}

export function assertValidWorkspace(workspacePath: string): void {
    const configPath = path.join(workspacePath, "config.ts");
    const packagePath = path.join(workspacePath, "package.json");
    const tsconfigPath = path.join(workspacePath, "tsconfig.json");
    const packageBridgePath = path.join(
        workspacePath,
        "node_modules",
        "karabiner-config-builder",
    );

    if (!fs.existsSync(workspacePath)) {
        throw new Error(`Workspace does not exist: ${workspacePath}`);
    }

    if (!fs.statSync(workspacePath).isDirectory()) {
        throw new Error(`Workspace path is not a directory: ${workspacePath}`);
    }

    if (!fs.existsSync(configPath)) {
        throw new Error(`Workspace is missing config.ts: ${configPath}`);
    }

    if (!fs.existsSync(packagePath)) {
        throw new Error(`Workspace is missing package.json: ${packagePath}`);
    }

    if (!fs.existsSync(tsconfigPath)) {
        throw new Error(`Workspace is missing tsconfig.json: ${tsconfigPath}`);
    }

    if (!fs.existsSync(packageBridgePath)) {
        throw new Error(
            `Workspace is missing package bridge: ${packageBridgePath}`,
        );
    }
}

function createRegisteredConfig(workspacePath: string): RegisteredConfig {
    const name = getConfigNameFromWorkspacePath(workspacePath);

    return {
        name,
        workspacePath,
        configPath: path.join(workspacePath, "config.ts"),
    };
}

function getConfigNameFromWorkspacePath(workspacePath: string): string {
    const name = path.basename(workspacePath);

    if (!name) {
        throw new Error(`Invalid workspace path: ${workspacePath}`);
    }

    if (!isValidConfigName(name)) {
        throw new Error(`Invalid config name from workspace path: ${name}`);
    }

    return name;
}

function isValidConfigName(name: string): boolean {
    return /^[a-zA-Z0-9._-]+$/.test(name);
}

function normalizeRegistry(value: unknown): ConfigRegistry {
    if (!isRecord(value)) {
        throw new Error(`Invalid registry file: ${DEFAULT_REGISTRY_PATH}`);
    }

    if (!isRecord(value.configs)) {
        throw new Error("registry.configs must be an object.");
    }

    const configs: Record<string, RegisteredConfig> = {};

    for (const [name, rawConfig] of Object.entries(value.configs)) {
        const config = normalizeRegisteredConfig(name, rawConfig);
        configs[config.name] = config;
    }

    const registry: ConfigRegistry = {
        configs,
    };

    if (value.defaultConfig !== undefined) {
        if (typeof value.defaultConfig !== "string") {
            throw new Error("registry.defaultConfig must be a string.");
        }

        if (!configs[value.defaultConfig]) {
            throw new Error(
                `registry.defaultConfig points to unknown config: ${value.defaultConfig}`,
            );
        }

        registry.defaultConfig = value.defaultConfig;
    }

    return registry;
}

function normalizeRegisteredConfig(
    name: string,
    value: unknown,
): RegisteredConfig {
    if (!isValidConfigName(name)) {
        throw new Error(`Invalid config name: ${name}`);
    }

    if (!isRecord(value)) {
        throw new Error(`registry.configs.${name} must be an object.`);
    }

    if (value.name !== name) {
        throw new Error(`registry.configs.${name}.name must match its key.`);
    }

    if (typeof value.workspacePath !== "string") {
        throw new Error(
            `registry.configs.${name}.workspacePath must be a string.`,
        );
    }

    if (typeof value.configPath !== "string") {
        throw new Error(
            `registry.configs.${name}.configPath must be a string.`,
        );
    }

    const expectedConfigPath = path.join(value.workspacePath, "config.ts");

    if (value.configPath !== expectedConfigPath) {
        throw new Error(
            `registry.configs.${name}.configPath must equal workspacePath/config.ts.`,
        );
    }

    return {
        name,
        workspacePath: value.workspacePath,
        configPath: value.configPath,
    };
}

function createRegistryJson(registry: ConfigRegistry): Record<string, unknown> {
    const configs = Object.fromEntries(
        listConfigs(registry).map((config) => [config.name, config]),
    );

    const result: Record<string, unknown> = {
        configs,
    };

    if (registry.defaultConfig) {
        result.defaultConfig = registry.defaultConfig;
    }

    return result;
}

function compareConfigs(
    first: RegisteredConfig,
    second: RegisteredConfig,
): number {
    return first.name.localeCompare(second.name);
}

function getFirstConfigName(registry: ConfigRegistry): string | undefined {
    const firstConfig = listConfigs(registry)[0];

    return firstConfig?.name;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
