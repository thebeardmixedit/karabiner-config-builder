import type {
    ComplexModifications,
    ComplexModificationsParameters,
    Device,
    FnFunctionKey,
    Profile,
    Rule,
    SimpleModification,
    VirtualHidKeyboard,
} from "../karabiner";

export interface ProfileOptions {
    name: string;
    selected?: boolean;

    virtual_hid_keyboard?: VirtualHidKeyboard;
    simple_modifications?: SimpleModification[];
    fn_function_keys?: FnFunctionKey[];
    devices?: Device[];

    parameters?: ComplexModificationsParameters;
    rules?: Rule[];
}

export function profile(options: ProfileOptions): Profile {
    const complex_modifications: ComplexModifications = {
        rules: options.rules ?? [],
    };

    if (options.parameters) {
        complex_modifications.parameters = options.parameters;
    }

    const result: Profile = {
        name: options.name,
        complex_modifications,
    };

    if (options.selected !== undefined) {
        result.selected = options.selected;
    }

    if (options.virtual_hid_keyboard) {
        result.virtual_hid_keyboard = options.virtual_hid_keyboard;
    }

    if (options.simple_modifications) {
        result.simple_modifications = options.simple_modifications;
    }

    if (options.fn_function_keys) {
        result.fn_function_keys = options.fn_function_keys;
    }

    if (options.devices) {
        result.devices = options.devices;
    }

    return result;
}
