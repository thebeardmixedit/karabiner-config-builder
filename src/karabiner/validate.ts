import type { KarabinerConfig, Manipulator, Profile, Rule } from "./interface";

export function validateKarabinerConfig(config: KarabinerConfig): void {
  if (config.profiles.length === 0) {
    throw new Error("Karabiner config must include at least one profile.");
  }

  for (const profile of config.profiles) {
    validateProfile(profile);
  }
}

function validateProfile(profile: Profile): void {
  if (!profile.name.trim()) {
    throw new Error("Karabiner profile must have a non-empty name.");
  }

  const rules = profile.complex_modifications?.rules ?? [];

  for (const rule of rules) {
    validateRule(rule);
  }
}

function validateRule(rule: Rule): void {
  if (!rule.description.trim()) {
    throw new Error("Karabiner rule must have a non-empty description.");
  }

  if (rule.manipulators.length === 0) {
    throw new Error(`Rule "${rule.description}" must include manipulators.`);
  }

  for (const manipulator of rule.manipulators) {
    validateManipulator(rule.description, manipulator);
  }
}

function validateManipulator(
  ruleDescription: string,
  manipulator: Manipulator,
): void {
  if (!manipulator.type) {
    throw new Error(
      `Rule "${ruleDescription}" includes a manipulator without a type.`,
    );
  }

  if (manipulator.type === "basic" && !manipulator.from) {
    throw new Error(
      `Rule "${ruleDescription}" includes a basic manipulator without "from".`,
    );
  }
}
