import { profile, rule, setup } from "./builder";
import type { KarabinerConfig, To } from "./karabiner";

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Validation Test",
            selected: true,

            rules: [
                rule("Empty output", [
                    {
                        type: "basic",
                        from: {
                            key_code: "f18",
                        },
                        to: [{} as To],
                    },
                ]),
            ],
        }),
    ],
});
