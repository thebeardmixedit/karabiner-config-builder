import {
  app,
  bind,
  combine,
  key,
  profile,
  remap,
  rule,
  setup,
  shell,
  url,
} from "./builder";

import type { KarabinerConfig } from "./karabiner";

export const config: KarabinerConfig = setup({
  global: {
    show_in_menu_bar: false,
  },

  profiles: [
    profile({
      name: "Moonlander",
      selected: true,

      virtual_hid_keyboard: {
        keyboard_type_v2: "ansi",
      },

      simple_modifications: [remap("caps_lock", "escape")],

      rules: [
        rule("Command tests", [
          bind("f18", app("Ghostty")),
          bind("f19", url("https://chat.openai.com")),
          bind("f20", shell("pmset displaysleepnow")),
          bind("f21", key("escape")),

          bind(
            "f22",
            combine(
              shell("echo 'Opening Ghostty from Karabiner'"),
              app("Ghostty"),
            ),
          ),
        ]),
      ],
    }),
  ],
});
