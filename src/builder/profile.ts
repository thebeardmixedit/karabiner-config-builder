import type {
    ComplexModifications,
    ComplexModificationsParameters,
    Device,
    FnFunctionKey,
    Profile,
    SimpleModification,
    VirtualHidKeyboard,
} from "../karabiner/index.js";
import { compileGroup, type GroupDefinition } from "./group.js";

export interface ProfileOptions {
    name: string;
    selected?: boolean;
    virtual_hid_keyboard?: VirtualHidKeyboard;
    simple_modifications?: SimpleModification[];
    fn_function_keys?: FnFunctionKey[];
    devices?: Device[];
    parameters?: ComplexModificationsParameters;
    groups?: GroupDefinition[];
}

export function profile(options: ProfileOptions): Profile;
export function profile(
    options: ProfileOptions,
    ...groups: GroupDefinition[]
): Profile;
export function profile(
    options: ProfileOptions,
    ...extraGroups: GroupDefinition[]
): Profile {
    const groups = normalizeGroups(options.groups, extraGroups);

    const complex_modifications: ComplexModifications = {
        rules: groups.map(compileGroup),
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

function normalizeGroups(
    optionGroups: GroupDefinition[] | undefined,
    extraGroups: GroupDefinition[],
): GroupDefinition[] {
    return [...(optionGroups ?? []), ...extraGroups];
}
