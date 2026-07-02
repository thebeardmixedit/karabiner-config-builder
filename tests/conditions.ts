import {
    bind,
    deviceExistsIf,
    deviceExistsUnless,
    deviceIf,
    deviceUnless,
    eventChangedIf,
    eventChangedUnless,
    expressionIf,
    expressionUnless,
    frontmostApplicationIf,
    frontmostApplicationUnless,
    inputSourceIf,
    inputSourceUnless,
    key,
    keyboardTypeIf,
    keyboardTypeUnless,
    profile,
    rule,
    setup,
    variableIf,
    variableUnless,
} from "../src/builder";

import type { KarabinerConfig } from "../src/karabiner";

const moonlander = {
    vendor_id: 12951,
    product_id: 6519,
    is_keyboard: true,
};

export const config: KarabinerConfig = setup({
    profiles: [
        profile({
            name: "Condition Test",
            selected: true,
            virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
            rules: [
                rule("Condition helper tests", [
                    bind("f10", key("escape"), {
                        description: "Test variable conditions",
                        conditions: [
                            variableIf("condition_test_enabled", 1),
                            variableUnless("condition_test_disabled", 1),
                        ],
                    }),

                    bind("f11", key("escape"), {
                        description: "Test frontmost application conditions",
                        conditions: [
                            frontmostApplicationIf([
                                "^com\\.apple\\.finder$",
                                "^com\\.mitchellh\\.ghostty$",
                            ]),
                            frontmostApplicationUnless([
                                "^com\\.apple\\.SystemSettings$",
                            ]),
                        ],
                    }),

                    bind("f12", key("escape"), {
                        description: "Test device conditions",
                        conditions: [
                            deviceIf([moonlander]),
                            deviceUnless([
                                {
                                    vendor_id: 0,
                                    product_id: 0,
                                    is_keyboard: true,
                                },
                            ]),
                        ],
                    }),

                    bind("f10", key("tab"), {
                        description: "Test device exists conditions",
                        modifiers: {
                            mandatory: ["left_shift"],
                        },
                        conditions: [
                            deviceExistsIf([moonlander]),
                            deviceExistsUnless([
                                {
                                    vendor_id: 0,
                                    product_id: 0,
                                    is_keyboard: true,
                                },
                            ]),
                        ],
                    }),

                    bind("f11", key("tab"), {
                        description: "Test keyboard type conditions",
                        modifiers: {
                            mandatory: ["left_shift"],
                        },
                        conditions: [
                            keyboardTypeIf(["ansi"]),
                            keyboardTypeUnless(["jis"]),
                        ],
                    }),

                    bind("f12", key("tab"), {
                        description: "Test input source conditions",
                        modifiers: {
                            mandatory: ["left_shift"],
                        },
                        conditions: [
                            inputSourceIf([
                                {
                                    language: "en",
                                },
                            ]),
                            inputSourceUnless([
                                {
                                    language: "ja",
                                },
                            ]),
                        ],
                    }),

                    bind("f10", key("spacebar"), {
                        description: "Test expression conditions",
                        modifiers: {
                            mandatory: ["left_control"],
                        },
                        conditions: [
                            expressionIf("1 == 1"),
                            expressionUnless("1 == 0"),
                        ],
                    }),

                    bind("f11", key("spacebar"), {
                        description: "Test event changed conditions",
                        modifiers: {
                            mandatory: ["left_control"],
                        },
                        conditions: [
                            eventChangedIf(true),
                            eventChangedUnless(false),
                        ],
                    }),
                ]),
            ],
        }),
    ],
});
