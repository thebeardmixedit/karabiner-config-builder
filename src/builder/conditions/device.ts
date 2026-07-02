import type { Condition, DeviceIdentifier } from "../../karabiner";

export function fromDevice(identifiers: DeviceIdentifier[]): Condition {
    return {
        type: "device_if",
        identifiers,
    };
}

export function exceptFromDevice(identifiers: DeviceIdentifier[]): Condition {
    return {
        type: "device_unless",
        identifiers,
    };
}

export function withDeviceConnected(
    identifiers: DeviceIdentifier[],
): Condition {
    return {
        type: "device_exists_if",
        identifiers,
    };
}

export function exceptWithDeviceConnected(
    identifiers: DeviceIdentifier[],
): Condition {
    return {
        type: "device_exists_unless",
        identifiers,
    };
}
