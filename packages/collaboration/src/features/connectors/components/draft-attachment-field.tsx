import { useId, useRef } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	useFormContext,
} from "@semoss/ui/next";

export interface DraftAttachment {
	id: string;
	file: File;
}

interface DraftAttachmentFieldProps {
	/** Prevent selection or removal while files and draft are being saved. */
	disabled: boolean;
}

/**
 * Native multi-file input keeps same-name files separate and supports removal.
 * FormFileDropzone deduplicates by name, which would discard a selected attachment.
 */
export function DraftAttachmentField({ disabled }: DraftAttachmentFieldProps) {
	const { control } = useFormContext<{ files: DraftAttachment[] }>();
	const id = useId();
	const input = useRef<HTMLInputElement | null>(null);
	return (
		<FormField
			control={control}
			name="files"
			render={({ field, fieldState }) => (
				<Field data-invalid={fieldState.invalid}>
					<FieldLabel htmlFor={id}>Attachments</FieldLabel>
					<Input
						id={id}
						type="file"
						multiple
						name={field.name}
						ref={(element) => {
							field.ref(element);
							input.current = element;
						}}
						onBlur={field.onBlur}
						disabled={disabled}
						aria-invalid={fieldState.invalid}
						aria-describedby={`${id}-description${fieldState.error ? ` ${id}-error` : ""}`}
						onChange={(event) => {
							const files = Array.from(event.target.files ?? []);
							field.onChange([
								...field.value,
								...files.map((file) => ({
									id: crypto.randomUUID(),
									file,
								})),
							]);
							event.target.value = "";
						}}
					/>
					<FieldDescription id={`${id}-description`}>
						Selected files are uploaded when you save. Files with
						the same name remain separate.
					</FieldDescription>
					{field.value.length > 0 && (
						<ul className="space-y-2">
							{field.value.map((attachment, index) => (
								<li
									key={attachment.id}
									className="flex flex-wrap items-center gap-2 rounded-md border p-2"
								>
									<span className="min-w-0 flex-1 break-words text-sm">
										{attachment.file.name}
									</span>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										disabled={disabled}
										aria-label={`Remove ${attachment.file.name}, attachment ${index + 1}`}
										onClick={() => {
											field.onChange(
												field.value.filter(
													(item) =>
														item.id !==
														attachment.id,
												),
											);
											input.current?.focus();
										}}
									>
										Remove
									</Button>
								</li>
							))}
						</ul>
					)}
					<output className="text-muted-foreground text-sm">
						{field.value.length} selected
					</output>
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
