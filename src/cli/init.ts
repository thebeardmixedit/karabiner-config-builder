import fs from "node:fs";
import path from "node:path";

import {
    assertNoUnknownArgs,
    getPositional,
    hasFlag,
    parseArgs,
} from "./args.js";
import { DEFAULT_WORKSPACE_DIR, resolvePath } from "./paths.js";
import { registerWorkspace } from "./registry.js";
import { isDirectRun } from "./run.js";
import { linkWorkspacePackage } from "./package-link.js";

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
    linkWorkspacePackage(workspacePath);

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
    cmd,
    inApp,
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
            "Starter bindings",

            // Basic remap: Caps Lock acts as Escape.
            bind("caps_lock", key("escape")),

            // Modified input: Command + Space outputs F18.
            // F18 is useful as a safe trigger key for app launchers,
            // automation tools, or custom shortcuts.
            bind(cmd("spacebar"), key("f18")),
        ),

        rule(
            {
                description: "Finder bindings",
                conditions: [inApp("com.apple.finder")],
            },

            // App-scoped binding: only active while Finder is frontmost.
            bind("f18", key("spacebar")),
        ),
    ),
);

/*
Example layer:

import { layer } from "karabiner-config-builder";

rule(
    "Navigation layer",
    layer("caps_lock", {
        tapped: key("escape"),
        bindings: {
            h: key("left_arrow"),
            j: key("down_arrow"),
            k: key("up_arrow"),
            l: key("right_arrow"),
        },
    }),
);
*/
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
                    allowImportingTsExtensions: true,
                    noEmit: true,
                },
                include: ["config.ts", "**/*.ts"],
            },
            null,
            4,
        )}\n`,
    );
}

function writeFileIfMissing(filePath: string, contents: string): void {
    if (fs.existsSync(filePath)) {
        return;
    }

    fs.writeFileSync(filePath, contents);
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
