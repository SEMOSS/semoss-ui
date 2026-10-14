import { useId } from "react";
import {
	Field,
	FieldError,
	FieldLabel,
	FormField,
	useFormContext,
} from "@semoss/ui/next";
import { EmailEditor } from "@/features/email/email-editor";

/** Connect the HTML editor's value, blur and focus target to the existing draft form. */
export function EmailBodyField({
	label,
	required,
	disabled,
	bodyReplacement,
}: {
	label: string;
	required?: boolean;
	disabled?: boolean;
	bodyReplacement?: number;
}) {
	const id = useId();
	const { control } = useFormContext<{ body: string }>();
	return (
		<FormField
			control={control}
			name="body"
			render={({ field, fieldState }) => (
				<Field className="min-w-0 flex-1 shrink-0 gap-0">
					<FieldLabel
						className="sr-only"
						id={`${id}-label`}
						htmlFor={id}
					>
						{label}
					</FieldLabel>
					<EmailEditor
						bodyReplacement={bodyReplacement}
						id={id}
						labelId={`${id}-label`}
						errorId={fieldState.error ? `${id}-error` : undefined}
						value={field.value}
						onChange={field.onChange}
						onBlur={field.onBlur}
						inputRef={field.ref}
						disabled={disabled}
						required={required}
					/>
					{fieldState.error && (
						<FieldError id={`${id}-error`}>
							{fieldState.error.message}
						</FieldError>
					)}
				</Field>
			)}
		/>
	);
}
