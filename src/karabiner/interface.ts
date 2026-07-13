// karabiner.json final output types.
// These types model the generated Karabiner JSON shape, not the higher-level
// builder/DSL API.

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
    [key: string]: JsonValue;
}

export type KeyCode = string;
export type ConsumerKeyCode = string;
export type PointingButton = string;

export type Modifier =
    | "caps_lock"
    | "left_command"
    | "left_control"
    | "left_option"
    | "left_shift"
    | "right_command"
    | "right_control"
    | "right_option"
    | "right_shift"
    | "fn"
    | "command"
    | "control"
    | "option"
    | "shift"
    | "any";

export type KeyboardType = "ansi" | "iso" | "jis";
export type VariableValue = string | number | boolean;

// -----------------------------------------------------------------------------
// Root
// -----------------------------------------------------------------------------

export interface KarabinerConfig {
    global?: GlobalOptions;
    profiles: Profile[];
}

export interface GlobalOptions {
    check_for_updates_on_startup?: boolean;
    show_in_menu_bar?: boolean;
    show_profile_name_in_menu_bar?: boolean;
}

export interface Profile {
    name: string;
    selected?: boolean;

    simple_modifications?: SimpleModification[];
    fn_function_keys?: FnFunctionKey[];

    complex_modifications?: ComplexModifications;

    virtual_hid_keyboard?: VirtualHidKeyboard;
    devices?: Device[];
    parameters?: ProfileParameters;
}

// -----------------------------------------------------------------------------
// Simple modifications
// -----------------------------------------------------------------------------

export interface SimpleModification {
    from: SimpleModificationFrom;
    to: SimpleModificationTo[];
}

export interface SimpleModificationFrom {
    key_code?: KeyCode;
    consumer_key_code?: ConsumerKeyCode;
    pointing_button?: PointingButton;
}

export interface SimpleModificationTo {
    key_code?: KeyCode;
    consumer_key_code?: ConsumerKeyCode;
    pointing_button?: PointingButton;
}

// -----------------------------------------------------------------------------
// Function keys
// -----------------------------------------------------------------------------

export interface FnFunctionKey {
    from: SimpleModificationFrom;
    to: SimpleModificationTo[];
}

// -----------------------------------------------------------------------------
// Complex modifications
// -----------------------------------------------------------------------------

export interface ComplexModifications {
    parameters?: ComplexModificationsParameters;
    rules: Rule[];
}

export interface Rule {
    description: string;
    manipulators: Manipulator[];
}

export type Manipulator =
    | BasicManipulator
    | MouseBasicManipulator
    | MouseMotionToScrollManipulator;

export interface BasicManipulator {
    type: "basic";
    from: From;

    to?: To[];
    to_if_alone?: To[];
    to_if_held_down?: To[];
    to_if_other_key_pressed?: To[];
    to_after_key_up?: To[];

    to_delayed_action?: ToDelayedAction;

    conditions?: Condition[];
    parameters?: ManipulatorParameters;
    description?: string;
}

export interface MouseBasicManipulator {
    type: "mouse_basic";
    from: From;

    to?: To[];
    conditions?: Condition[];
    parameters?: ManipulatorParameters;
    description?: string;
}

export interface MouseMotionToScrollManipulator {
    type: "mouse_motion_to_scroll";
    from?: From;

    options?: {
        speed_multiplier?: number;
        direction?: "vertical" | "horizontal";
    };

    conditions?: Condition[];
    parameters?: ManipulatorParameters;
    description?: string;
}

export interface ToDelayedAction {
    to_if_invoked?: To[];
    to_if_canceled?: To[];
}

// -----------------------------------------------------------------------------
// From event
// -----------------------------------------------------------------------------

export interface From {
    key_code?: KeyCode;
    consumer_key_code?: ConsumerKeyCode;
    pointing_button?: PointingButton;
    any?: "key_code" | "consumer_key_code" | "pointing_button";

    modifiers?: FromModifiers;

    simultaneous?: FromEvent[];
    simultaneous_options?: SimultaneousOptions;

    integer_value?: number;
}

export interface FromEvent {
    key_code?: KeyCode;
    consumer_key_code?: ConsumerKeyCode;
    pointing_button?: PointingButton;
}

export interface FromModifiers {
    mandatory?: Modifier[];
    optional?: Modifier[];
}

export interface SimultaneousOptions {
    key_down_order?: "strict" | "strict_inverse" | "insensitive";
    key_up_order?: "strict" | "strict_inverse" | "insensitive";
    key_up_when?: "any" | "all";

    detect_key_down_uninterruptedly?: boolean;

    to_after_key_up?: To[];
}

// -----------------------------------------------------------------------------
// To event
// -----------------------------------------------------------------------------

export interface To {
    key_code?: KeyCode;
    consumer_key_code?: ConsumerKeyCode;
    pointing_button?: PointingButton;

    shell_command?: string;

    select_input_source?: SelectInputSource;
    set_variable?: SetVariable;
    set_notification_message?: SetNotificationMessage;

    mouse_key?: MouseKey;
    sticky_modifier?: StickyModifier;
    software_function?: SoftwareFunction;

    send_user_command?: string;

    modifiers?: Modifier[];
    lazy?: boolean;
    repeat?: boolean;
    halt?: boolean;
    hold_down_milliseconds?: number;

    conditions?: Condition[];

    from_event?: boolean;
}

export interface SelectInputSource {
    language?: string;
    input_source_id?: string;
    input_mode_id?: string;
}

export interface SetVariable {
    name: string;
    value: VariableValue;
    key_up_value?: VariableValue;
    type?: "set";
}

export interface SetNotificationMessage {
    id: string;
    text: string;
}

export interface MouseKey {
    x?: number;
    y?: number;
    vertical_wheel?: number;
    horizontal_wheel?: number;
    speed_multiplier?: number;
}

export type StickyModifier =
    | {
          [K in Modifier]?: "on" | "off" | "toggle";
      }
    | "toggle";

export type SoftwareFunction =
    | {
          cg_event_double_click: {
              button: number;
          };
      }
    | {
          iokit_power_management_sleep_system: Record<string, never>;
      }
    | {
          open_application: {
              bundle_identifier?: string;
              file_path?: string;
              frontmost?: boolean;
          };
      }
    | {
          set_mouse_cursor_position: {
              x: number;
              y: number;
              screen?: number;
          };
      };

// -----------------------------------------------------------------------------
// Conditions
// -----------------------------------------------------------------------------

export type Condition =
    | FrontmostApplicationCondition
    | DeviceCondition
    | KeyboardTypeCondition
    | InputSourceCondition
    | VariableCondition
    | ExpressionCondition
    | EventChangedCondition;

export interface BaseCondition {
    description?: string;
}

export interface FrontmostApplicationCondition extends BaseCondition {
    type: "frontmost_application_if" | "frontmost_application_unless";
    bundle_identifiers?: string[];
    file_paths?: string[];
}

export interface DeviceCondition extends BaseCondition {
    type:
        | "device_if"
        | "device_unless"
        | "device_exists_if"
        | "device_exists_unless";
    identifiers: DeviceIdentifier[];
}

export interface KeyboardTypeCondition extends BaseCondition {
    type: "keyboard_type_if" | "keyboard_type_unless";
    keyboard_types: KeyboardType[];
}

export interface InputSourceCondition extends BaseCondition {
    type: "input_source_if" | "input_source_unless";
    input_sources: InputSource[];
}

export interface InputSource {
    language?: string;
    input_source_id?: string;
    input_mode_id?: string;
}

export interface VariableCondition extends BaseCondition {
    type: "variable_if" | "variable_unless";
    name: string;
    value: VariableValue;
}

export interface ExpressionCondition extends BaseCondition {
    type: "expression_if" | "expression_unless";
    expression: string;
}

export interface EventChangedCondition extends BaseCondition {
    type: "event_changed_if" | "event_changed_unless";
    value: boolean;
}

// -----------------------------------------------------------------------------
// Devices
// -----------------------------------------------------------------------------

export interface Device {
    identifiers: DeviceIdentifier;

    ignore?: boolean;
    manipulate_caps_lock_led?: boolean;
    disable_built_in_keyboard_if_exists?: boolean;
    treat_as_built_in_keyboard?: boolean;

    simple_modifications?: SimpleModification[];
    fn_function_keys?: FnFunctionKey[];

    game_pad_swap_sticks?: boolean;
    mouse_flip_horizontal_wheel?: boolean;
    mouse_flip_vertical_wheel?: boolean;
    mouse_flip_x?: boolean;
    mouse_flip_y?: boolean;
    mouse_swap_wheels?: boolean;
}

export interface DeviceIdentifier {
    vendor_id?: number;
    product_id?: number;
    device_address?: string;
    location_id?: number;

    is_keyboard?: boolean;
    is_pointing_device?: boolean;
    is_game_pad?: boolean;
    is_consumer?: boolean;
    is_touch_bar?: boolean;
    is_built_in_keyboard?: boolean;

    description?: string;
}

// -----------------------------------------------------------------------------
// Parameters
// -----------------------------------------------------------------------------

export interface ComplexModificationsParameters {
    basic_simultaneous_threshold_milliseconds?: number;
    basic_to_delayed_action_delay_milliseconds?: number;
    basic_to_if_alone_timeout_milliseconds?: number;
    basic_to_if_held_down_threshold_milliseconds?: number;
    mouse_motion_to_scroll_speed?: number;
}

export interface ManipulatorParameters {
    "basic.simultaneous_threshold_milliseconds"?: number;
    "basic.to_delayed_action_delay_milliseconds"?: number;
    "basic.to_if_alone_timeout_milliseconds"?: number;
    "basic.to_if_held_down_threshold_milliseconds"?: number;
    "mouse_motion_to_scroll.speed"?: number;
}

export interface ProfileParameters {
    delay_milliseconds_before_open_device?: number;
}

// -----------------------------------------------------------------------------
// Virtual HID keyboard
// -----------------------------------------------------------------------------

export interface VirtualHidKeyboard {
    keyboard_type?: KeyboardType;
    keyboard_type_v2?: KeyboardType;

    caps_lock_delay_milliseconds?: number;
    country_code?: number;

    indicate_sticky_modifier_keys_state?: boolean;
    mouse_key_xy_scale?: number;
}
