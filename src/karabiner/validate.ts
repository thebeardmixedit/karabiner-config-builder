import type {
    From,
    KarabinerConfig,
    Manipulator,
    Profile,
    Rule,
    SimpleModification,
    To,
} from "./interface.js";

export function validateKarabinerConfig(config: KarabinerConfig): void {
    if (config.profiles.length === 0) {
        throw new Error("Karabiner config must include at least one profile.");
    }

    for (const [profileIndex, profile] of config.profiles.entries()) {
        validateProfile(profile, `profiles[${profileIndex}]`);
    }
}

function validateProfile(profile: Profile, path: string): void {
    if (!profile.name.trim()) {
        throw new Error(`${path}.name must be a non-empty string.`);
    }

    if (profile.simple_modifications) {
        for (const [
            index,
            simpleModification,
        ] of profile.simple_modifications.entries()) {
            validateSimpleModification(
                simpleModification,
                `${path}.simple_modifications[${index}]`,
            );
        }
    }

    const rules = profile.complex_modifications?.rules ?? [];

    for (const [ruleIndex, rule] of rules.entries()) {
        validateRule(rule, `${path}.complex_modifications.rules[${ruleIndex}]`);
    }
}

function validateSimpleModification(
    simpleModification: SimpleModification,
    path: string,
): void {
    validateFrom(simpleModification.from, `${path}.from`);

    if (simpleModification.to.length === 0) {
        throw new Error(`${path}.to must include at least one output.`);
    }

    for (const [toIndex, to] of simpleModification.to.entries()) {
        validateSimpleModificationTo(to, `${path}.to[${toIndex}]`);
    }
}

function validateRule(rule: Rule, path: string): void {
    if (!rule.description.trim()) {
        throw new Error(`${path}.description must be a non-empty string.`);
    }

    if (rule.manipulators.length === 0) {
        throw new Error(
            `${path}.manipulators must include at least one manipulator.`,
        );
    }

    for (const [manipulatorIndex, manipulator] of rule.manipulators.entries()) {
        validateManipulator(
            manipulator,
            `${path}.manipulators[${manipulatorIndex}]`,
        );
    }
}

function validateManipulator(manipulator: Manipulator, path: string): void {
    if (!manipulator.type) {
        throw new Error(`${path}.type is required.`);
    }

    if (manipulator.type === "basic") {
        validateFrom(manipulator.from, `${path}.from`);

        validateToArray(manipulator.to, `${path}.to`);
        validateToArray(manipulator.to_if_alone, `${path}.to_if_alone`);
        validateToArray(manipulator.to_if_held_down, `${path}.to_if_held_down`);
        validateToArray(
            manipulator.to_if_other_key_pressed,
            `${path}.to_if_other_key_pressed`,
        );
        validateToArray(manipulator.to_after_key_up, `${path}.to_after_key_up`);
    }
}

function validateFrom(from: From, path: string): void {
    const hasInput =
        from.key_code !== undefined ||
        from.consumer_key_code !== undefined ||
        from.pointing_button !== undefined ||
        from.any !== undefined ||
        from.simultaneous !== undefined;

    if (!hasInput) {
        throw new Error(
            `${path} must include key_code, consumer_key_code, pointing_button, any, or simultaneous.`,
        );
    }
}

function validateToArray(outputs: To[] | undefined, path: string): void {
    if (outputs === undefined) {
        return;
    }

    if (outputs.length === 0) {
        throw new Error(`${path} must not be an empty array.`);
    }

    for (const [index, output] of outputs.entries()) {
        validateTo(output, `${path}[${index}]`);
    }
}

function validateTo(output: To, path: string): void {
    const hasOutput =
        output.key_code !== undefined ||
        output.consumer_key_code !== undefined ||
        output.pointing_button !== undefined ||
        output.shell_command !== undefined ||
        output.select_input_source !== undefined ||
        output.set_variable !== undefined ||
        output.set_notification_message !== undefined ||
        output.mouse_key !== undefined ||
        output.sticky_modifier !== undefined ||
        output.software_function !== undefined ||
        output.send_user_command !== undefined ||
        output.from_event !== undefined;

    if (!hasOutput) {
        throw new Error(`${path} must include at least one output action.`);
    }
}

function validateSimpleModificationTo(
    to: SimpleModification["to"][number],
    path: string,
): void {
    const hasOutput =
        to.key_code !== undefined ||
        to.consumer_key_code !== undefined ||
        to.pointing_button !== undefined;

    if (!hasOutput) {
        throw new Error(
            `${path} must include key_code, consumer_key_code, or pointing_button.`,
        );
    }
}
