import {
    bind,
    deviceExistsUnless,
    deviceIf,
    key,
    profile,
    rule,
    setup,
} from "../src/builder";

import type { KarabinerConfig } from "../src/karabiner";

const moonlander = {
    vendor_id: 12951,
    product_id: 6505,
    is_keyboard: true,
};

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Device Condition Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
            rules: [
                rule("Device condition tests", [
                    bind("f10", key("escape"), {
                        description: "F10 to Escape only from Moonlander",
                        conditions: [deviceIf([moonlander])],
                    }),

                    bind("f11", key("escape"), {
                        description:
                            "F11 to Escape only when Moonlander is not connected",
                        conditions: [deviceExistsUnless([moonlander])],
                    }),
                ]),
            ],
        }),
    ],
});
