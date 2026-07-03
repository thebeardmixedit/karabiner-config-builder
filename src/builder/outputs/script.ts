import type { To } from "../../karabiner";

import { shell } from "./shell";

const DEFAULT_PATH = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
];

type ScriptShell = "bash" | "zsh";

interface ScriptOptions {
    shell?: ScriptShell;
    args?: string[];
    PATH?: string[];
    requires?: string[];
}

export function script(path: string, options: ScriptOptions = {}): To {
    return shell(buildScriptCommand(path, options));
}

function buildScriptCommand(path: string, options: ScriptOptions): string {
    const shellPath = getShellPath(options.shell ?? "zsh");
    const script = buildScriptBody(path, options);

    return `${shellPath} -c ${shellQuote(script)}`;
}

function buildScriptBody(path: string, options: ScriptOptions): string {
    const parts: string[] = [];

    parts.push(createPathExport(options.PATH ?? []));

    for (const requiredCommand of options.requires ?? []) {
        parts.push(createRequireCommand(requiredCommand));
    }

    parts.push(createScriptCall(path, options.args ?? []));

    return parts.join(" ");
}

function createPathExport(pathEntries: string[]): string {
    const paths = [
        ...pathEntries.map(shellPath),
        ...DEFAULT_PATH.map(shellQuote),
        "$PATH",
    ];

    return `export PATH=${paths.join(":")};`;
}

function createRequireCommand(command: string): string {
    return [
        `command -v ${shellQuote(command)} >/dev/null 2>&1`,
        `|| { echo ${shellQuote(`Missing required command: ${command}`)}; exit 1; };`,
    ].join(" ");
}

function createScriptCall(path: string, args: string[]): string {
    return [shellPath(path), ...args.map(shellQuote)].join(" ");
}

function getShellPath(scriptShell: ScriptShell): string {
    if (scriptShell === "bash") {
        return "/bin/bash";
    }

    return "/bin/zsh";
}

function shellPath(path: string): string {
    if (path === "~") {
        return "$HOME";
    }

    if (path.startsWith("~/")) {
        return `$HOME/${shellQuote(path.slice(2))}`;
    }

    return shellQuote(path);
}

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", "'\\''")}'`;
}
