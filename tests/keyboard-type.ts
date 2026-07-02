import {
    bind,
    key,
    keyboardTypeIf,
    profile,
    rule,
    setup,
} from "../src/builder";

import type { KarabinerConfig } from "../src/karabiner";

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Keyboard Type Condition Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
            rules: [
                rule("Keyboard type condition tests", [
                    bind("f10", key("escape"), {
                        description: "F10 to Escape on ANSI keyboards",
                        conditions: [keyboardTypeIf(["ansi"])],
                    }),
                ]),
            ],
        }),
    ],
});
