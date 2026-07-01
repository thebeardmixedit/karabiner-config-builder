import fs from "node:fs";
import path from "node:path";

import type { KarabinerConfig } from "./karabiner";

const outputPath = path.resolve("karabiner.json");

export function writeKarabinerConfig(config: KarabinerConfig): void {
  const json = `${JSON.stringify(config, null, 2)}\n`;

  fs.writeFileSync(outputPath, json);

  console.log(`Wrote ${outputPath}`);
}
