import {
    type KarabinerConfig,
    bind,
    bundleIdPattern,
    eventChanged,
    exceptEventChanged,
    exceptExpressionIsTrue,
    exceptFromDevice,
    exceptFromInputSource,
    exceptFromKeyboardType,
    exceptInApp,
    exceptVariableIs,
    exceptWithDeviceConnected,
    expressionIsTrue,
    fromDevice,
    fromInputSource,
    fromKeyboardType,
    inApp,
    key,
    profile,
    rule,
    setup,
    variableIs,
    withDeviceConnected,
} from "../dist/index.js";

const moonlander = {
    vendor_id: 12951,
    product_id: 6519,
    is_keyboard: true,
};

const fakeKeyboard = {
    vendor_id: 0,
    product_id: 0,
    is_keyboard: true,
};

export const config: KarabinerConfig = setup({
    profiles: [
        profile(
            {
                name: "Condition Test",
                selected: true,
                virtual_hid_keyboard: { keyboard_type_v2: "ansi" },
            },

            rule(
                {
                    description: "Rule-level AND condition tests",
                    conditions: [inApp("com.apple.finder")],
                },

                bind("f14", key("escape"), {
                    description:
                        "Preserves AND behavior across condition families",
                    conditions: [fromKeyboardType("ansi")],
                }),
            ),

            rule(
                "Condition helper tests",

                bind("f10", key("escape"), {
                    description: "Test variable conditions",
                    conditions: [
                        variableIs("condition_test_enabled", 1),
                        exceptVariableIs("condition_test_disabled", 1),
                    ],
                }),

                bind("f11", key("escape"), {
                    description: "Test frontmost application conditions",
                    conditions: [
                        inApp("com.apple.finder", "com.mitchellh.ghostty"),
                        exceptInApp("com.apple.SystemSettings"),
                    ],
                }),

                bind("f12", key("escape"), {
                    description: "Test frontmost application regex condition",
                    modifiers: {
                        mandatory: ["left_option"],
                    },
                    conditions: [inApp(bundleIdPattern("^com\\.avid\\..*$"))],
                }),

                bind("f12", key("escape"), {
                    description: "Test device conditions",
                    conditions: [
                        fromDevice(moonlander),
                        exceptFromDevice(fakeKeyboard),
                    ],
                }),

                bind("f10", key("tab"), {
                    description: "Test connected device conditions",
                    modifiers: {
                        mandatory: ["left_shift"],
                    },
                    conditions: [
                        withDeviceConnected(moonlander),
                        exceptWithDeviceConnected(fakeKeyboard),
                    ],
                }),

                bind("f11", key("tab"), {
                    description: "Test keyboard type conditions",
                    modifiers: {
                        mandatory: ["left_shift"],
                    },
                    conditions: [
                        fromKeyboardType("ansi"),
                        exceptFromKeyboardType("jis"),
                    ],
                }),

                bind("f12", key("tab"), {
                    description: "Test input source conditions",
                    modifiers: {
                        mandatory: ["left_shift"],
                    },
                    conditions: [
                        fromInputSource({
                            language: "en",
                        }),
                        exceptFromInputSource({
                            language: "ja",
                        }),
                    ],
                }),

                bind("f10", key("spacebar"), {
                    description: "Test expression conditions",
                    modifiers: {
                        mandatory: ["left_control"],
                    },
                    conditions: [
                        expressionIsTrue("1 == 1"),
                        exceptExpressionIsTrue("1 == 0"),
                    ],
                }),

                bind("f11", key("spacebar"), {
                    description: "Test event changed conditions",
                    modifiers: {
                        mandatory: ["left_control"],
                    },
                    conditions: [eventChanged(), exceptEventChanged(false)],
                }),
            ),
        ),
    ],
});
