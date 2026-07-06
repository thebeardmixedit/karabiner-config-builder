import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    assertNoUnknownArgs,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { DEFAULT_WORKSPACE_DIR, resolvePath } from "./paths.js";
import { registerWorkspace } from "./registry.js";
import { isDirectRun } from "./run.js";

interface InitWorkspaceOptions {
    workspaceDir: string;
    makeDefault: boolean;
}

export function runInitCommand(rawArgs = process.argv.slice(2)): void {
    const args = parseArgs(rawArgs, {
        flags: ["h", "help", "d", "default"],
    });

    if (hasFlag(args, "help", "h")) {
        printHelp();
        return;
    }

    assertNoUnknownArgs(args, {
        flags: ["h", "help", "d", "default"],
        positionals: 1,
    });

    const workspaceDir = getPositional(args, 0) ?? DEFAULT_WORKSPACE_DIR;
    const makeDefault = hasFlag(args, "default", "d");

    const result = initWorkspace({
        workspaceDir,
        makeDefault,
    });

    console.log("Initialized Karabiner Config Builder workspace:");
    console.log(result.workspacePath);

    if (result.defaultConfig) {
        console.log(`Default config: ${result.name}`);
    } else {
        console.log(`Registered config: ${result.name}`);
    }
}

export function initWorkspace(options: InitWorkspaceOptions): {
    name: string;
    workspacePath: string;
    configPath: string;
    defaultConfig: boolean;
} {
    const workspacePath = resolvePath(options.workspaceDir);

    createWorkspaceDirectory(workspacePath);
    createConfigFile(workspacePath);
    createPackageJson(workspacePath);
    createTsconfigJson(workspacePath);
    createPackageBridge(workspacePath);

    const config = registerWorkspace(workspacePath, {
        makeDefault: options.makeDefault,
    });

    return {
        name: config.name,
        workspacePath: config.workspacePath,
        configPath: config.configPath,
        defaultConfig: options.makeDefault,
    };
}

function createWorkspaceDirectory(workspacePath: string): void {
    if (fs.existsSync(workspacePath)) {
        const stats = fs.statSync(workspacePath);

        if (!stats.isDirectory()) {
            throw new Error(
                `Workspace path is not a directory: ${workspacePath}`,
            );
        }

        return;
    }

    fs.mkdirSync(workspacePath, {
        recursive: true,
    });
}

function createConfigFile(workspacePath: string): void {
    const configPath = path.join(workspacePath, "config.ts");

    writeFileIfMissing(
        configPath,
        `import {
    bind,
    key,
    profile,
    rule,
    setup,
} from "karabiner-config-builder";

export default setup(
    profile(
        {
            name: "Default",
            selected: true,
            virtual_hid_keyboard: {
                keyboard_type_v2: "ansi",
            },
        },
        rule(
            "Basic bindings",
            bind("caps_lock", key("escape")),
        ),
    ),
);
`,
    );
}

function createPackageJson(workspacePath: string): void {
    const packagePath = path.join(workspacePath, "package.json");

    writeFileIfMissing(
        packagePath,
        `${JSON.stringify(
            {
                private: true,
                type: "module",
                scripts: {
                    build: "kcb build",
                    deploy: "kcb deploy",
                },
            },
            null,
            4,
        )}\n`,
    );
}

function createTsconfigJson(workspacePath: string): void {
    const tsconfigPath = path.join(workspacePath, "tsconfig.json");

    writeFileIfMissing(
        tsconfigPath,
        `${JSON.stringify(
            {
                compilerOptions: {
                    target: "ESNext",
                    module: "NodeNext",
                    moduleResolution: "NodeNext",
                    strict: true,
                    types: ["node"],
                    skipLibCheck: true,
                },
                include: ["config.ts", "**/*.ts"],
            },
            null,
            4,
        )}\n`,
    );
}

function createPackageBridge(workspacePath: string): void {
    const nodeModulesPath = path.join(workspacePath, "node_modules");
    const packageBridgePath = path.join(
        nodeModulesPath,
        "karabiner-config-builder",
    );
    const packageRoot = getPackageRoot();

    fs.mkdirSync(nodeModulesPath, {
        recursive: true,
    });

    if (pathExistsOrSymlink(packageBridgePath)) {
        assertPackageBridge(packageBridgePath, packageRoot);
        return;
    }

    fs.symlinkSync(packageRoot, packageBridgePath, "dir");
}

function assertPackageBridge(
    packageBridgePath: string,
    packageRoot: string,
): void {
    const stats = fs.lstatSync(packageBridgePath);

    if (!stats.isSymbolicLink()) {
        throw new Error(
            `Package bridge already exists and is not a symlink: ${packageBridgePath}`,
        );
    }

    const targetPath = fs.realpathSync(packageBridgePath);
    const expectedPath = fs.realpathSync(packageRoot);

    if (targetPath !== expectedPath) {
        throw new Error(
            `Package bridge points somewhere else: ${packageBridgePath}`,
        );
    }
}

function getPackageRoot(): string {
    const currentFilePath = fileURLToPath(import.meta.url);

    return path.resolve(path.dirname(currentFilePath), "..", "..");
}

function writeFileIfMissing(filePath: string, contents: string): void {
    if (fs.existsSync(filePath)) {
        return;
    }

    fs.writeFileSync(filePath, contents);
}

function pathExistsOrSymlink(filePath: string): boolean {
    try {
        fs.lstatSync(filePath);
        return true;
    } catch {
        return false;
    }
}

function printHelp(): void {
    console.log(`Usage:
  kcb init [options] [workspace-dir]

Arguments:
  workspace-dir       Workspace directory to initialize
                      Default: ~/.config/karabiner-config-builder/default

Options:
  -d, --default       Make initialized workspace the default config
  -h, --help          Show this help`);
}

if (isDirectRun(import.meta.url)) {
    runInitCommand();
}
