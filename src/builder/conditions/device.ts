import type { Condition, DeviceIdentifier } from "../../karabiner/index.js";

export function fromDevice(
    identifier: DeviceIdentifier,
    ...identifiers: DeviceIdentifier[]
): Condition {
    return {
        type: "device_if",
        identifiers: [identifier, ...identifiers],
    };
}

export function exceptFromDevice(
    identifier: DeviceIdentifier,
    ...identifiers: DeviceIdentifier[]
): Condition {
    return {
        type: "device_unless",
        identifiers: [identifier, ...identifiers],
    };
}

export function withDeviceConnected(
    identifier: DeviceIdentifier,
    ...identifiers: DeviceIdentifier[]
): Condition {
    return {
        type: "device_exists_if",
        identifiers: [identifier, ...identifiers],
    };
}

export function exceptWithDeviceConnected(
    identifier: DeviceIdentifier,
    ...identifiers: DeviceIdentifier[]
): Condition {
    return {
        type: "device_exists_unless",
        identifiers: [identifier, ...identifiers],
    };
}
