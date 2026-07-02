import { app, key, layer, profile, rule, setup } from "../src/builder";

import type { KarabinerConfig } from "../src/karabiner";

export const config: KarabinerConfig = setup(
    profile(
        {
            name: "Layer Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
        },

        rule(
            "Layer tests",

            layer("caps_lock", {
                tapped: key("escape"),

                bindings: {
                    g: app("com.mitchellh.ghostty"),

                    o: layer("open", {
                        bindings: {
                            c: app("com.openai.chat"),
                        },
                    }),
                },
            }),
        ),
    ),
);
