import { PillInput, type PillInputProps } from "./pill-input";

export type { PillInputProps as BoundInputProps } from "./pill-input";

/** Thin alias — BoundInput is PillInput. All step forms import BoundInput; this re-export keeps call sites unchanged. */
export function BoundInput(props: PillInputProps) {
	return <PillInput {...props} />;
}
