import {
    type KarabinerConfig,
    bind,
    key,
    profile,
    rule,
    setup,
    shell,
    cmd,
    shift,
    leftCtrl,
} from "../dist/index.js";

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Bind Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
            rules: [
                rule("Bind lifecycle tests", [
                    bind(cmd("spacebar"), key("spacebar"), {
                        description: "Generic command combo test",
                    }),

                    bind(shift(cmd("p")), key("escape"), {
                        description: "Nested combo test",
                    }),

                    bind(leftCtrl("m"), key("mute"), {
                        description: "Side-specific modifier combo test",
                    }),
                    bind("f10", key("escape"), {
                        description: "F10 to Escape",
                    }),

                    bind("f11", key("left_control"), {
                        description: "Hold F11 as Control, tap as Escape",
                        tapped: key("escape"),
                    }),

                    bind(
                        "f12",
                        shell(
                            'osascript -e \'display notification "pressed" with title "KCB"\'',
                        ),
                        {
                            description: "Test tapped, held, and finished",
                            tapped: shell(
                                'osascript -e \'display notification "tapped" with title "KCB"\'',
                            ),
                            held: shell(
                                'osascript -e \'display notification "held" with title "KCB"\'',
                            ),
                            finished: shell(
                                'osascript -e \'display notification "finished" with title "KCB"\'',
                            ),
                        },
                    ),
                ]),
            ],
        }),
    ],
});
