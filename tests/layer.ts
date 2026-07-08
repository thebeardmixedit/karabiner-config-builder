import {
    type KarabinerConfig,
    app,
    bind,
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

            layer("main", {
                trigger: "caps_lock",
                tapped: key("escape"),

                bindings: [bind("g", app("com.mitchellh.ghostty"))],

                layers: [
                    layer("open", {
                        trigger: "o",

                        bindings: [bind("c", app("com.openai.chat"))],
                    }),
                ],
            }),
        ),
    ),
);
