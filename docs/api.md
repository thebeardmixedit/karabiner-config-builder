# API Reference

This document covers the main builder API.

## `setup()`

`setup()` creates the full Karabiner config.

### Object style

```ts
setup({
    profiles: [
        profile({
            name: "Default",
            rules: [rule("Basic bindings", bind("caps_lock", key("escape")))],
        }),
    ],
});
```

### Array style

```ts
setup([
    profile({
        name: "Default",
        rules: [rule("Basic bindings", bind("caps_lock", key("escape")))],
    }),
]);
```

### Variadic style

```ts
setup(
    profile(
        {
            name: "Default",
        },

        rule("Basic bindings", bind("caps_lock", key("escape"))),
    ),
);
```

## `profile()`

Profiles can be written with a `rules` array:

```ts
profile({
    name: "Default",
    selected: true,
    rules: [rule("Basic bindings", bind("caps_lock", key("escape")))],
});
```

Or with variadic rules:

```ts
profile(
    {
        name: "Default",
        selected: true,
    },

    rule("Basic bindings", bind("caps_lock", key("escape"))),
    rule("App bindings", bind("f18", key("spacebar"))),
);
```

If both `rules` and variadic rules are provided, the builder combines them with `rules` first.

```ts
profile(
    {
        name: "Default",
        rules: [rule("Base rules", bind("caps_lock", key("escape")))],
    },

    rule("Extra rules", bind("f18", key("spacebar"))),
);
```

## `rule()`

Rules can be written with an array of entries:

```ts
rule("Basic bindings", [
    bind("caps_lock", key("escape")),
    bind("f18", key("spacebar")),
]);
```

Or with variadic entries:

```ts
rule(
    "Basic bindings",

    bind("caps_lock", key("escape")),
    bind("f18", key("spacebar")),
);
```

Rules can also accept options:

```ts
rule(
    {
        description: "Pro Tools bindings",
        conditions: [inApp("com.avid.ProTools")],
    },

    bind("m", key("escape")),
);
```

Rule entries can be regular manipulators from `bind()` or generated layer definitions from `layer()`.

## `bind()`

`bind()` creates a Karabiner basic manipulator.

```ts
bind("caps_lock", key("escape"));
```

With options:

```ts
bind("m", key("mute"), {
    description: "Mute",
    modifiers: {
        mandatory: ["left_control"],
    },
});
```

Tap/hold-style bindings are also supported:

```ts
bind("caps_lock", {
    tapped: key("escape"),
    held: key("left_control"),
});
```

You can also run something when the key is released:

```ts
bind("f12", {
    tapped: shell("echo tapped"),
    held: shell("echo held"),
    released: shell("echo released"),
});
```

## Output helpers

### `key()`

Outputs a key code.

```ts
key("escape");
```

With modifiers:

```ts
key("tab", {
    modifiers: ["left_command"],
});
```

### `shell()`

Outputs a raw Karabiner `shell_command`.

```ts
shell("osascript -e 'display notification \"Hello\"'");
```

`shell()` is intentionally raw. Use it when you want to control the exact shell command string Karabiner receives.

### `script()`

Wraps a script path in a Karabiner-friendly shell command.

This is useful because Karabiner runs shell commands in a limited environment that may not include your normal interactive shell `PATH`.

```ts
script("~/.dotfiles/bin/convert-wav-to-mp3", {
    shell: "zsh",
    PATH: ["~/.dotfiles/bin"],
    requires: ["lame", "osascript"],
});
```

Available options:

```ts
script(path, {
    shell: "zsh",
    PATH: ["~/.dotfiles/bin"],
    requires: ["lame"],
    args: ["--verbose"],
});
```

- `shell`: `"zsh"` or `"bash"`. Defaults to `"zsh"`.
- `PATH`: additional path entries to prepend before the default command path.
- `requires`: commands that must exist before the script runs.
- `args`: arguments passed to the script.

The default command path includes:

```txt
/opt/homebrew/bin
/usr/local/bin
/usr/bin
/bin
/usr/sbin
/sbin
$PATH
```

Paths beginning with `~` are expanded through `$HOME`.

### `app()`

Opens or focuses an application by bundle identifier using Karabiner’s native `open_application` software function.

```ts
app("com.mitchellh.ghostty");
```

By default, `frontmost` is `true`.

```ts
app("com.mitchellh.ghostty", {
    frontmost: false,
});
```

To find a bundle identifier locally:

```sh
osascript -e 'id of app "Ghostty"'
```

### `url()`

Opens a URL.

```ts
url("https://karabiner-elements.pqrs.org/");
```

### `combine()`

Combines multiple outputs into one output array.

```ts
combine(key("escape"), shell("echo done"));
```

`combine()` requires at least one output.

## `layer()`

`layer()` creates a modal key layer backed by Karabiner variables.

```ts
layer("caps_lock", {
    tapped: key("escape"),

    bindings: {
        h: key("left_arrow"),
        j: key("down_arrow"),
        k: key("up_arrow"),
        l: key("right_arrow"),
    },
});
```

Use it inside a rule:

```ts
rule(
    "Navigation layer",

    layer("caps_lock", {
        tapped: key("escape"),

        bindings: {
            h: key("left_arrow"),
            j: key("down_arrow"),
            k: key("up_arrow"),
            l: key("right_arrow"),
        },
    }),
);
```

Nested layers are supported:

```ts
rule(
    "App launcher layer",

    layer("caps_lock", {
        tapped: key("escape"),

        bindings: {
            g: app("com.mitchellh.ghostty"),

            o: layer("open", {
                bindings: {
                    c: app("com.openai.chat"),
                    f: app("com.apple.finder"),
                },
            }),
        },
    }),
);
```

## Integrations

### AeroSpace

```ts
aerospace("workspace 1");
```

This outputs a shell command that runs:

```sh
aerospace workspace 1
```

### SoundFlow

```ts
soundflow("my.soundflow.package.command");
```

This outputs a shell command that triggers a SoundFlow command.
