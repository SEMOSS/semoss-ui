import { FileText, Paperclip, X } from "lucide-react";
import { useId, useRef } from "react";
import {
	Button,
	Field,
	FieldDescription,
	FieldError,
	FormField,
	Input,
	Small,
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
	const attachButton = useRef<HTMLButtonElement | null>(null);
	return (
		<FormField
			control={control}
			name="files"
			render={({ field, fieldState }) => (
				<Field
					data-invalid={fieldState.invalid}
					className="shrink-0 [&>[data-slot=button]]:w-fit"
				>
					<Button
						ref={(element) => {
							field.ref(element);
							attachButton.current = element;
						}}
						type="button"
						variant="outline"
						className="min-h-11 w-fit gap-2"
						aria-describedby={`${id}-description${fieldState.error ? ` ${id}-error` : ""}`}
						aria-invalid={fieldState.invalid}
						onBlur={field.onBlur}
						disabled={disabled}
						onClick={() => input.current?.click()}
					>
						<Paperclip className="size-4" aria-hidden="true" />
						Attach files
					</Button>
					<Input
						id={id}
						aria-label="Attachments"
						className="hidden"
						tabIndex={-1}
						type="file"
						multiple
						name={field.name}
						ref={(element) => {
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
						Files are uploaded when you save the draft.
					</FieldDescription>
					{field.value.length > 0 && (
						<ul className="space-y-2">
							{field.value.map((attachment, index) => (
								<li
									key={attachment.id}
									className="flex min-w-0 items-center gap-3 rounded-xl border border-border bg-muted/20 p-3"
								>
									<FileText
										className="size-5 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
									<div className="min-w-0 flex-1">
										<Small className="break-words font-medium">
											{attachment.file.name}
										</Small>
										<Small className="text-muted-foreground">
											{Math.ceil(
												attachment.file.size / 1024,
											)}{" "}
											KB
										</Small>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="min-h-11 shrink-0"
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
											attachButton.current?.focus();
										}}
									>
										<X
											className="size-4"
											aria-hidden="true"
										/>
										Remove
									</Button>
								</li>
							))}
						</ul>
					)}
					<output className="text-muted-foreground text-sm">
						{field.value.length
							? `${field.value.length} selected`
							: ""}
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
