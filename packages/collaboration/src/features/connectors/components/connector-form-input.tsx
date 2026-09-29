import { useId } from "react";
import { cn, FormInput, FormTextarea, useFormContext } from "@semoss/ui/next";

interface ConnectorFormInputProps {
	/** Schema field rendered through the shared form wrapper. */
	name: string;
	label: string;
	disabled?: boolean;
	multiline?: boolean;
	required?: boolean;
	placeholder?: string;
	/** Compact, horizontally labelled rows used by mail compose forms. */
	presentation?: "default" | "mail";
}

/** Add a persistent error association to the existing shared field wrappers. */
export function ConnectorFormInput({
	name,
	label,
	disabled,
	multiline,
	required,
	placeholder,
	presentation = "default",
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
		className: cn(
			presentation === "mail" &&
				"flex-row flex-wrap items-center gap-3 [&>[data-slot=field-label]]:w-14 [&>[data-slot=field-label]]:font-normal [&>[data-slot=field-label]]:text-muted-foreground [&>[data-slot=field-label]]:shrink-0 [&>[data-slot=input]]:w-0 [&>[data-slot=input]]:flex-1 [&>[data-slot=input]]:shadow-none [&>[data-slot=input]]:border-0 [&>[data-slot=input]]:bg-transparent [&>[data-slot=input]]:px-2 [&>[data-slot=input]]:font-medium",
		),
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
