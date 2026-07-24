/**
 * Checkbox — adapter over the shared @semoss/ui Checkbox that keeps this app's
 * native-<input type="checkbox"> API (checked + onChange event) so call sites can
 * swap `<input type="checkbox" …>` → `<Checkbox …>` with no handler changes.
 */
import { Checkbox as UICheckbox } from "@semoss/ui/next";

interface CheckboxProps {
	checked?: boolean;
	onChange?: (e: { target: { checked: boolean } }) => void;
	disabled?: boolean;
	className?: string;
	id?: string;
	/** Accepted + ignored so a plain `type="checkbox"` swap type-checks. */
	type?: string;
	"aria-label"?: string;
	title?: string;
}

export function Checkbox({
	checked,
	onChange,
	disabled,
	className,
	id,
	type: _type,
	...rest
}: CheckboxProps) {
	return (
		<UICheckbox
			checked={checked}
			onCheckedChange={(c) =>
				onChange?.({ target: { checked: c === true } })
			}
			disabled={disabled}
			className={className}
			id={id}
			{...rest}
		/>
	);
}
