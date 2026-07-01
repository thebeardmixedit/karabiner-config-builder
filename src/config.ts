import {
    app,
    bind,
    frontmostApplicationUnless,
    key,
    layer,
    profile,
    rule,
    setup,
} from "./builder";

import type { KarabinerConfig } from "./karabiner";

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Moonlander",
            selected: true,

            rules: [
                rule("Conditional bindings", [
                    bind("f18", app("Ghostty"), {
                        description: "Open Ghostty unless already focused",
                        conditions: [
                            frontmostApplicationUnless([
                                "^com\\.mitchellh\\.ghostty$",
                            ]),
                        ],
                    }),

                    layer("caps_lock", {
                        alone: key("escape"),

                        bindings: {
                            g: app("Ghostty"),
                        },
                    }),
                ]),
            ],
        }),
    ],
});
