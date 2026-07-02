import fs from "node:fs";
import path from "node:path";

import { build } from "../build";
import { parseArgs } from "./args";
import {
    DEFAULT_OUTPUT_PATH,
    resolveKarabinerConfigPath,
    resolveOutputPath,
    resolvePath,
} from "./paths";

const options = parseArgs();

if (options.outPath && options.symlinkFromPath) {
    throw new Error("Use either --out or --symlink-from, not both.");
}

const karabinerConfigPath = resolveKarabinerConfigPath();

if (options.symlinkFromPath) {
    const symlinkFromPath = resolvePath(options.symlinkFromPath);

    const result = await build({
        ...(options.configPath ? { configPath: options.configPath } : {}),
        outPath: symlinkFromPath,
    });

    symlinkKarabinerConfig(karabinerConfigPath, symlinkFromPath);

    console.log(`Built Karabiner config from: ${result.configPath}`);
    console.log(`Wrote Karabiner config to: ${result.outputPath}`);
    console.log("Deployed Karabiner config with symlink:");
    console.log(`${karabinerConfigPath} -> ${symlinkFromPath}`);
} else {
    const outputPath = resolveOutputPath(
        options.outPath ?? DEFAULT_OUTPUT_PATH,
    );

    const result = await build({
        ...(options.configPath ? { configPath: options.configPath } : {}),
        outPath: outputPath,
    });

    copyKarabinerConfig(outputPath, karabinerConfigPath);

    console.log(`Built Karabiner config from: ${result.configPath}`);
    console.log(`Wrote Karabiner config to: ${result.outputPath}`);
    console.log("Deployed Karabiner config:");
    console.log(karabinerConfigPath);
}

function copyKarabinerConfig(fromPath: string, toPath: string): void {
    if (!fs.existsSync(fromPath)) {
        throw new Error(`Generated config not found: ${fromPath}`);
    }

    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.copyFileSync(fromPath, toPath);
}

function symlinkKarabinerConfig(
    karabinerConfigPath: string,
    symlinkFromPath: string,
): void {
    if (!fs.existsSync(symlinkFromPath)) {
        throw new Error(`Generated config not found: ${symlinkFromPath}`);
    }

    fs.mkdirSync(path.dirname(karabinerConfigPath), { recursive: true });
    fs.rmSync(karabinerConfigPath, { force: true });
    fs.symlinkSync(symlinkFromPath, karabinerConfigPath);
}
