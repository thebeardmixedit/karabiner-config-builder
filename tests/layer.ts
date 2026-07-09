import {
    type KarabinerConfig,
    app,
    bind,
    group,
    key,
    layer,
    profile,
    setup,
} from "../dist/index.js";

export const config: KarabinerConfig = setup(
    profile(
        {
            name: "Layer Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
        },

        group(
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
