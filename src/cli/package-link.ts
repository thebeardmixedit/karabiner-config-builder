import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface WorkspacePackageLink {
    packageRoot: string;
    packageLinkPath: string;
}

export function linkWorkspacePackage(
    workspacePath: string,
): WorkspacePackageLink {
    const packageRoot = getPackageRoot();
    const nodeModulesPath = path.join(workspacePath, "node_modules");
    const packageLinkPath = path.join(
        nodeModulesPath,
        "karabiner-config-builder",
    );

    fs.mkdirSync(nodeModulesPath, { recursive: true });
    fs.rmSync(packageLinkPath, { recursive: true, force: true });
    fs.symlinkSync(packageRoot, packageLinkPath, "dir");

    return {
        packageRoot,
        packageLinkPath,
    };
}

function getPackageRoot(): string {
    const currentFilePath = fileURLToPath(import.meta.url);

    return path.resolve(path.dirname(currentFilePath), "..", "..");
}
