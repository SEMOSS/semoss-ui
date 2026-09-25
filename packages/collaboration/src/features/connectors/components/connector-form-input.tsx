import { useId } from "react";
import { FormInput, FormTextarea, useFormContext } from "@semoss/ui/next";

interface ConnectorFormInputProps {
	/** Schema field rendered through the shared form wrapper. */
	name: string;
	label: string;
	disabled?: boolean;
	multiline?: boolean;
	required?: boolean;
	placeholder?: string;
}

/** Add a persistent error association to the existing shared field wrappers. */
export function ConnectorFormInput({
	name,
	label,
	disabled,
	multiline,
	required,
	placeholder,
}: ConnectorFormInputProps) {
	const id = useId();
	const { getFieldState, formState } = useFormContext();
	const error = getFieldState(name, formState).error?.message;
	const shared = {
		name,
		label,
		disabled,
		required,
		placeholder,
		"aria-describedby": error ? id : undefined,
	};
	return (
		<div className="min-w-0">
			{multiline ? (
				<FormTextarea {...shared} rows={8} />
			) : (
				<FormInput {...shared} />
			)}
			{error && (
				<span id={id} className="sr-only">
					{error}
				</span>
			)}
		</div>
	);
}
