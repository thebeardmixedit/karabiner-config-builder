import type { GlobalOptions, KarabinerConfig, Profile } from "../karabiner";

export interface SetupOptions {
  global?: GlobalOptions;
  profiles: Profile[];
}

export function setup(options: SetupOptions): KarabinerConfig {
  const config: KarabinerConfig = {
    profiles: options.profiles,
  };

  if (options.global) {
    config.global = options.global;
  }

  return config;
}
