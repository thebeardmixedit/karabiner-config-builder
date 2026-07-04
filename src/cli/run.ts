import { pathToFileURL } from "node:url";

export function isDirectRun(metaUrl: string): boolean {
    const entryPath = process.argv[1];

    if (!entryPath) {
        return false;
    }

    return metaUrl === pathToFileURL(entryPath).href;
}
