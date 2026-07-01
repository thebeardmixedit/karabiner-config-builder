import type {
  ConsumerKeyCode,
  KeyCode,
  PointingButton,
  SimpleModification,
  SimpleModificationFrom,
  SimpleModificationTo,
} from "../karabiner";

type RemapInput = KeyCode | SimpleModificationFrom;
type RemapOutput = KeyCode | SimpleModificationTo;

export function remap(from: RemapInput, to: RemapOutput): SimpleModification {
  return {
    from: normalizeFrom(from),
    to: [normalizeTo(to)],
  };
}

function normalizeFrom(from: RemapInput): SimpleModificationFrom {
  if (typeof from === "string") {
    return {
      key_code: from,
    };
  }

  return from;
}

function normalizeTo(to: RemapOutput): SimpleModificationTo {
  if (typeof to === "string") {
    return {
      key_code: to,
    };
  }

  return to;
}
