import {
    type KarabinerConfig,
    bind,
    fromDevice,
    group,
    inApp,
    key,
    layer,
    profile,
    setup,
} from "../dist/index.js";

export const config: KarabinerConfig = setup(
    profile(
        {
            name: "Group Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
        },

        group(
            {
                description: "Keyboard-specific bindings",
                conditions: [
                    fromDevice({
                        is_keyboard: true,
                    }),
                ],
            },

            bind("caps_lock", key("escape")),

            group(
                {
                    description: "Finder bindings",
                    conditions: [inApp("com.apple.finder")],
                },

                bind("h", key("left_arrow")),
                bind("l", key("right_arrow")),
            ),

            group(
                {
                    description: "Layer bindings",
                    conditions: [inApp("com.mitchellh.ghostty")],
                },

                layer("nav", {
                    trigger: "caps_lock",
                    tapped: key("escape"),

                    bindings: [
                        bind("j", key("down_arrow")),
                        bind("k", key("up_arrow")),
                    ],
                }),
            ),
        ),
    ),
);
