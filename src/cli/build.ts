import { build } from "../build";
import { parseArgs } from "./args";

const options = parseArgs();

if (options.symlinkFromPath) {
    throw new Error("-s, --symlink-from can only be used with deploy.");
}

const result = await build({
    ...(options.configPath ? { configPath: options.configPath } : {}),
    ...(options.outPath ? { outPath: options.outPath } : {}),
});

console.log(`Built Karabiner config from: ${result.configPath}`);
console.log(`Wrote Karabiner config to: ${result.outputPath}`);
