import { config } from "./config";
import { validateKarabinerConfig } from "./karabiner";
import { writeKarabinerConfig } from "./write";

validateKarabinerConfig(config);
writeKarabinerConfig(config);
