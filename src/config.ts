import { aerospace, bind, profile, rule, setup, soundflow } from "./builder";

import type { KarabinerConfig } from "./karabiner";

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Moonlander",
            selected: true,

            rules: [
                rule("Integration tests", [
                    bind("f18", aerospace("workspace 1")),
                    bind(
                        "f19",
                        soundflow(
                            "user:cm7z8uees0005yb10ynl9wtud:cmquid83z0000y723mhtrsr0j",
                        ),
                    ),
                ]),
            ],
        }),
    ],
});
