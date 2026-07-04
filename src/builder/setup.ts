import type {
    GlobalOptions,
    KarabinerConfig,
    Profile,
} from "../karabiner/index.js";

export interface SetupOptions {
    global?: GlobalOptions;
    profiles: Profile[];
}

export function setup(options: SetupOptions): KarabinerConfig;
export function setup(profiles: Profile[]): KarabinerConfig;
export function setup(
    profile: Profile,
    ...profiles: Profile[]
): KarabinerConfig;
export function setup(
    optionsOrProfilesOrProfile: SetupOptions | Profile[] | Profile,
    ...extraProfiles: Profile[]
): KarabinerConfig {
    if (Array.isArray(optionsOrProfilesOrProfile)) {
        return createConfig({
            profiles: optionsOrProfilesOrProfile,
        });
    }

    if (isProfile(optionsOrProfilesOrProfile)) {
        return createConfig({
            profiles: [optionsOrProfilesOrProfile, ...extraProfiles],
        });
    }

    return createConfig(optionsOrProfilesOrProfile);
}

function createConfig(options: SetupOptions): KarabinerConfig {
    const config: KarabinerConfig = {
        profiles: options.profiles,
    };

    if (options.global) {
        config.global = options.global;
    }

    return config;
}

function isProfile(value: SetupOptions | Profile): value is Profile {
    return (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        "complex_modifications" in value
    );
}
