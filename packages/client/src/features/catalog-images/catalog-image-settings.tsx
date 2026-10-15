import { ImageIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
	CATALOG_IMAGE_ACCEPT,
	getCatalogImageValidationError,
	uploadEngineImage,
	uploadProjectImage,
} from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	Avatar,
	AvatarFallback,
	AvatarImage,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Form,
	FormActions,
	FormField,
	Input,
	Muted,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import {
	type CatalogImageResource,
	refreshCatalogImage,
	useCatalogImageUrl,
} from "./use-catalog-image";

const schema = z.object({
	image: z
		.instanceof(File)
		.nullable()
		.superRefine((file, ctx) => {
			const message = file
				? getCatalogImageValidationError(file)
				: "Choose an image to upload.";
			if (message) ctx.addIssue({ code: "custom", message });
		}),
});
type ImageValues = z.infer<typeof schema>;

interface CatalogImageSettingsProps {
	/** Resource kind used by the SDK upload function. */
	resource: CatalogImageResource;
	/** Saved resource ID. Mount with this ID as the key when switching records. */
	id: string;
	/** Resource display name. */
	name: string;
	/** Uploads require owner or edit permission; the server verifies this too. */
	canEdit: boolean;
}

/** Preview and explicitly upload a catalog image, preserving failed uploads for retry. */
export function CatalogImageSettings({
	resource,
	id,
	name,
	canEdit,
}: CatalogImageSettingsProps) {
	const inputId = useId();
	const inputRef = useRef<HTMLInputElement | null>(null);
	const uploadPending = useRef(false);
	const savedImageUrl = useCatalogImageUrl(resource, id);
	const [preview, setPreview] = useState("");
	const form = useForm<ImageValues>({
		resolver: zodResolver(schema),
		defaultValues: { image: null },
		mode: "onChange",
	});
	const selectedImage = form.watch("image");
	const { errors, isSubmitting } = form.formState;

	useEffect(() => {
		if (!selectedImage || getCatalogImageValidationError(selectedImage)) {
			setPreview("");
			return;
		}
		const url = URL.createObjectURL(selectedImage);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [selectedImage]);

	const resetSelection = (): void => {
		form.reset({ image: null });
		if (inputRef.current) inputRef.current.value = "";
	};

	const handleSubmit = async ({ image }: ImageValues): Promise<void> => {
		if (!canEdit || !image || uploadPending.current) return;
		uploadPending.current = true;
		try {
			if (resource === "PROJECT") await uploadProjectImage(id, image);
			else await uploadEngineImage(id, image);
		} catch (error: unknown) {
			form.setError("root.server", {
				type: "server",
				message:
					error instanceof Error
						? error.message
						: "Could not upload the image. Please try again.",
			});
			return;
		} finally {
			uploadPending.current = false;
		}
		refreshCatalogImage(resource, id);
		resetSelection();
		toast.success("Catalog image updated");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Image</CardTitle>
				<CardDescription className="break-words">
					Update the image shown for {name} in the catalog.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<Avatar aria-hidden="true" className="size-24 rounded-lg">
					<AvatarImage
						src={preview || savedImageUrl}
						alt=""
						className="object-contain"
					/>
					<AvatarFallback className="rounded-lg">
						<ImageIcon
							aria-hidden="true"
							className="size-8 text-muted-foreground"
						/>
					</AvatarFallback>
				</Avatar>
				{canEdit ? (
					<Form
						form={form}
						onSubmit={handleSubmit}
						noValidate
						aria-label="Catalog image"
						aria-busy={isSubmitting}
						onSubmitCapture={(event) => {
							if (uploadPending.current) {
								event.preventDefault();
								event.stopPropagation();
							}
						}}
						className="space-y-4"
					>
						<FormField
							control={form.control}
							name="image"
							render={({ field, fieldState }) => (
								<Field data-invalid={Boolean(fieldState.error)}>
									<FieldLabel htmlFor={inputId}>
										Choose image
									</FieldLabel>
									<Input
										id={inputId}
										type="file"
										name={field.name}
										ref={(node) => {
											field.ref(node);
											inputRef.current = node;
										}}
										onBlur={field.onBlur}
										onChange={(event) => {
											field.onChange(
												event.target.files?.[0] ?? null,
											);
											form.clearErrors("root");
										}}
										accept={CATALOG_IMAGE_ACCEPT}
										disabled={isSubmitting}
										aria-invalid={Boolean(fieldState.error)}
										aria-describedby={`${inputId}-hint${fieldState.error ? ` ${inputId}-error` : ""}`}
										className="min-h-11 w-full min-w-0"
									/>
									<FieldDescription id={`${inputId}-hint`}>
										PNG, JPEG, or GIF, up to 10 MiB. Choose
										a file, then upload to save it.
									</FieldDescription>
									{fieldState.error?.message && (
										<FieldError id={`${inputId}-error`}>
											{fieldState.error.message}
										</FieldError>
									)}
								</Field>
							)}
						/>
						{errors.root?.server?.message && (
							<Alert variant="destructive">
								<AlertDescription>
									{errors.root.server.message}
								</AlertDescription>
							</Alert>
						)}
						<FormActions
							isSubmitting={isSubmitting}
							submitLabel={
								isSubmitting
									? "Uploading image…"
									: "Upload image"
							}
							onCancel={() => {
								resetSelection();
								inputRef.current?.focus();
							}}
							className="flex-col items-stretch sm:flex-row sm:items-center [&_button]:min-h-11"
						/>
					</Form>
				) : (
					<Muted>
						You need edit permission to change this image.
					</Muted>
				)}
			</CardContent>
		</Card>
	);
}
