import {
    type KarabinerConfig,
    app,
    key,
    layer,
    profile,
    rule,
    setup,
} from "../dist/index.js";

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
