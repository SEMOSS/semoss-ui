import { useEffect, useId, useRef } from "react";
import { CATALOG_IMAGE_ACCEPT } from "@semoss/sdk";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FormField,
	Input,
	useFormContext,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { TwinProfile } from "./api/digital-twin";
import { useImagePreview } from "./use-image-preview";

interface TwinImageFieldProps {
	/** The saved twin's image, shown until another is chosen. */
	imageUrl?: string;
}

/**
 * The twin's image in its profile form: the portrait as it will show, beside
 * the file to replace it with. The file is only uploaded when the form saves.
 */
export function TwinImageField({ imageUrl }: TwinImageFieldProps) {
	const id = useId();
	const form = useFormContext<TwinProfile>();
	const input = useRef<HTMLInputElement | null>(null);
	const name = form.watch("name");
	const image = form.watch("image");
	const preview = useImagePreview(image);
	// a file input cannot be given a value, only emptied: once the form holds no file, neither does it
	useEffect(() => {
		if (!image && input.current) input.current.value = "";
	}, [image]);

	return (
		<FormField
			control={form.control}
			name="image"
			render={({ field, fieldState }) => (
				<Field data-invalid={Boolean(fieldState.error)}>
					<FieldLabel htmlFor={id}>Image</FieldLabel>
					<div className="flex min-w-0 items-center gap-4">
						<AgentAvatar
							agent={{
								name: name.trim() || "Digital Twin",
								avatar: preview || imageUrl,
							}}
							size="lg"
						/>
						<Input
							id={id}
							type="file"
							name={field.name}
							ref={(node) => {
								field.ref(node);
								input.current = node;
							}}
							onBlur={field.onBlur}
							onChange={(event) =>
								field.onChange(event.target.files?.[0] ?? null)
							}
							accept={CATALOG_IMAGE_ACCEPT}
							disabled={form.formState.isSubmitting}
							aria-invalid={Boolean(fieldState.error)}
							aria-describedby={`${id}-hint${fieldState.error ? ` ${id}-error` : ""}`}
							className="min-h-11 w-full min-w-0"
						/>
					</div>
					<FieldDescription id={`${id}-hint`}>
						Optional. A PNG, JPEG or GIF, up to 10 MiB. It is
						uploaded when you save.
					</FieldDescription>
					{fieldState.error?.message && (
						<FieldError id={`${id}-error`}>
							{fieldState.error.message}
						</FieldError>
					)}
				</Field>
			)}
		/>
	);
}
