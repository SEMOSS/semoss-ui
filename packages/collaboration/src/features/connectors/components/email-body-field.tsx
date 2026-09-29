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
}: {
	label: string;
	required?: boolean;
	disabled?: boolean;
}) {
	const id = useId();
	const { control } = useFormContext<{ body: string }>();
	return (
		<FormField
			control={control}
			name="body"
			render={({ field, fieldState }) => (
				<Field>
					<FieldLabel id={`${id}-label`} htmlFor={id}>
						{label}
					</FieldLabel>
					<EmailEditor
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
