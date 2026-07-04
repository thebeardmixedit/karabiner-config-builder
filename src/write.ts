import fs from "node:fs";
import path from "node:path";

import type { KarabinerConfig } from "./karabiner/index.js";

export function writeKarabinerConfig(
    config: KarabinerConfig,
    outputPath: string,
): void {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`);
}
