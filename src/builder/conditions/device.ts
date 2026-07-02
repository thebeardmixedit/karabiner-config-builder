import type { Condition, DeviceIdentifier } from "../../karabiner";

export function deviceIf(identifiers: DeviceIdentifier[]): Condition {
    return {
        type: "device_if",
        identifiers,
    };
}

export function deviceUnless(identifiers: DeviceIdentifier[]): Condition {
    return {
        type: "device_unless",
        identifiers,
    };
}

export function deviceExistsIf(identifiers: DeviceIdentifier[]): Condition {
    return {
        type: "device_exists_if",
        identifiers,
    };
}

export function deviceExistsUnless(identifiers: DeviceIdentifier[]): Condition {
    return {
        type: "device_exists_unless",
        identifiers,
    };
}
