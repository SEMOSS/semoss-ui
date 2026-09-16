import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import type { Role } from "@semoss/sdk";
import { AppCatalogAvatar } from "@semoss/shared";
import {
	Badge,
	Button,
	Checkbox,
	Field,
	FieldDescription,
	FieldLabel,
	FileDropzone,
	Input,
	Markdown,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor, NoDetailsEmptyState } from "@/components/common";
import { PROJECT_IMAGE_ACCEPT } from "@/constants";
import { metakeyToLabel, normalizeTagArray } from "@/utility";
import { formatDateToLocal } from "@/utility/date";
import { CatalogTagInput } from "./catalog-tag-input";
import { CatalogTags } from "./catalog-tags";

interface CatalogOverviewForm extends Record<string, unknown> {
	description: string;
	markdown: string;
	tag: string[];
	"data classification": string[];
	"data restrictions": string[];
}

/**
 * Normalize mixed input values into a clean string array.
 *
 * @param value Potentially array, string, or unknown form value.
 * @returns Trimmed string array with empty values removed.
 */
const normalizeArrayValue = (value: unknown): string[] => {
	if (Array.isArray(value)) {
		return normalizeTagArray(
			value
				.map((item) => String(item).trim())
				.filter((item) => item !== ""),
		);
	}

	if (typeof value === "string") {
		const trimmed = value.trim();
		return normalizeTagArray(trimmed === "" ? undefined : trimmed);
	}

	return [];
};

/**
 * Format a read-mode value, adding locale thousands separators when it is a
 * number (contextWindow, maxOutputTokens). Values that are merely numeric
 * strings are only formatted when the metakey declares input_type "number", so
 * ids, years, and version strings keep their raw text.
 *
 * @param value Raw form value.
 * @param isNumericField Whether the metakey is configured as a number input.
 * @returns Display string for the value.
 */
const formatDisplayValue = (value: unknown, isNumericField: boolean) => {
	const text = String(value).trim();

	if (typeof value !== "number" && !(isNumericField && /^\d+$/.test(text))) {
		return text;
	}

	const parsed = typeof value === "number" ? value : Number(text);

	return Number.isFinite(parsed) ? parsed.toLocaleString() : text;
};

/**
 * Shared placeholder for a read-mode field with no value. Every empty field
 * routes through this so the wording and type scale stay identical, including
 * the CatalogTags empty state.
 */
const EmptyValue = () => (
	<div className="text-muted-foreground text-sm">None</div>
);

interface CatalogOverviewProps {
	/** ID of the catalog */
	id: string;
	/** User's permission in the catalog */
	permission: Role;
	/** Keys to show in the overview */
	metaKeys: {
		display_options:
			| "input"
			| "textarea"
			| "markdown"
			| "single-checklist"
			| "multi-checklist"
			| "single-select"
			| "multi-select"
			| "single-typeahead"
			| "multi-typeahead"
			| "select-box";
		display_order: number;
		metakey: string;
		single_multi: string;
		display_values?: string;
		/** Human-authored label; falls back to a formatted metakey when absent */
		display_label?: string;
		/** Reserved: not yet enforced by the edit form */
		read_only?: boolean;
		/** Reserved: not yet applied to the rendered input */
		input_type?: string;
	}[];
	/** Values */
	metaValues: {
		METAKEY: string;
		METAVALUE: string;
		count: number;
	}[];
	/** Associated description */
	description: string;
	/** Associated description */
	markdown: string;
	/** Markdown presentation used for read-only overview content. */
	markdownVariant?: "default" | "document";
	/** Associated tags  */
	tags: string[];
	/** Associated classification  */
	dataClassification: string[];
	/** Associated data restrictions  */
	dataRestrictions: string[];
	/** Metadata */
	metadata: Record<string, unknown>;
	/** Date created (UTC timestamp) */
	dateCreated: string;
	/** Date last edited (UTC timestamp) */
	dateLastEdited: string;
	/** Save the data */
	onSave: (id: string, metadata: Record<string, unknown>) => Promise<void>;
	/**
	 * Custom-image editing. An image is not metadata and saves through its own
	 * endpoint, so catalogs that do not have one (engines) simply omit this.
	 */
	image?: {
		/** Current image URL, already version-stamped by the caller. */
		url: string;
		/** Name driving the generated fallback avatar. */
		fallbackName: string;
		/** Persist a staged change - a File uploads, null resets to default. */
		onChange: (file: File | null) => Promise<void>;
	};
}

export const CatalogOverview = ({
	id,
	permission,
	metaKeys,
	metaValues,
	description,
	markdown,
	markdownVariant = "default",
	tags,
	dataClassification,
	dataRestrictions,
	metadata,
	dateCreated,
	dateLastEdited,
	onSave,
	image,
}: CatalogOverviewProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imageCleared, setImageCleared] = useState(false);
	const [imagePreview, setImagePreview] = useState("");
	const [form, setForm] = useState<CatalogOverviewForm>({
		description: "",
		markdown: "",
		tag: [],
		"data classification": [],
		"data restrictions": [],
	});
	const [initialForm, setInitialForm] = useState<CatalogOverviewForm>({
		description: "",
		markdown: "",
		tag: [],
		"data classification": [],
		"data restrictions": [],
	});

	useEffect(() => {
		if (!id) {
			setForm({
				description: "",
				markdown: "",
				tag: [],
				"data classification": [],
				"data restrictions": [],
			});
			setInitialForm({
				description: "",
				markdown: "",
				tag: [],
				"data classification": [],
				"data restrictions": [],
			});
			return;
		}

		// Seed editable fields with normalized arrays for multi-value metadata.
		const nextForm: CatalogOverviewForm = {
			description: description,
			markdown: markdown,
			tag: tags,
			"data classification": dataClassification,
			"data restrictions": dataRestrictions,
		};

		Object.entries(metadata).forEach(([key, value]) => {
			// Preserve any additional metadata so dynamic keys can render/edit.
			nextForm[key] = value;
		});

		setForm(nextForm);
		setInitialForm(nextForm);
		setIsEditMode(false);
		setImageFile(null);
		setImageCleared(false);
	}, [
		id,
		description,
		markdown,
		tags,
		dataClassification,
		dataRestrictions,
		metadata,
	]);

	// a staged file only exists in the browser, so previewing it needs an object
	// URL that has to be revoked again once it is replaced or goes away
	useEffect(() => {
		if (!imageFile) {
			setImagePreview("");
			return;
		}

		const objectUrl = URL.createObjectURL(imageFile);
		setImagePreview(objectUrl);

		return () => URL.revokeObjectURL(objectUrl);
	}, [imageFile]);

	const isEditable = permission === "OWNER" || permission === "EDIT";
	const isEditing = isEditable && isEditMode;
	const isDirty =
		JSON.stringify(form) !== JSON.stringify(initialForm) ||
		Boolean(imageFile) ||
		imageCleared;
	const markdownClassName =
		markdownVariant === "document"
			? "w-full text-sm leading-relaxed"
			: undefined;

	// Exclude fields already rendered in dedicated sections below.
	const dynamicMetaKeys = metaKeys
		.filter((k) => {
			return (
				k.metakey !== "description" &&
				k.metakey !== "markdown" &&
				k.metakey !== "tag" &&
				k.metakey !== "data classification" &&
				k.metakey !== "data restrictions"
			);
		})
		.sort((a, b) => a.display_order - b.display_order);

	const filterOptions: Record<string, string[]> = metaValues.reduce<
		Record<string, string[]>
	>((prev, current) => {
		if (!prev[current.METAKEY]) {
			prev[current.METAKEY] = [];
		}
		prev[current.METAKEY].push(current.METAVALUE);
		return prev;
	}, {});

	metaKeys.forEach((metaKey) => {
		if (!metaKey.display_values) {
			return;
		}

		// Config-defined display values override inferred values for consistent option lists.
		filterOptions[metaKey.metakey] = metaKey.display_values
			.split(",")
			.map((value) => value.trim())
			.filter((value) => value !== "");
	});

	if (!id) {
		return <div className="text-muted-foreground">No details found</div>;
	}

	/**
	 * Update a single form key with any supported value type.
	 *
	 * @param key Form property key.
	 * @param value New value for the key.
	 */
	const updateForm = (key: string, value: unknown) => {
		setForm((prev) => ({ ...prev, [key]: value }));
	};

	/**
	 * Revert edits and exit edit mode.
	 */
	const handleCancel = () => {
		setForm(initialForm);
		setImageFile(null);
		setImageCleared(false);
		setIsEditMode(false);
	};

	/**
	 * Save edited metadata to the backend and refresh the details.
	 *
	 * @returns Promise that resolves after save flow completes.
	 */
	const handleSubmit = async () => {
		try {
			setIsLoading(true);

			const payloadKeys = [
				"description",
				"markdown",
				"tag",
				"data classification",
				"data restrictions",
				...dynamicMetaKeys.map((meta) => meta.metakey),
			];

			// Only submit tracked editable fields; keep payload scoped and predictable.
			const metadata = payloadKeys.reduce<Record<string, unknown>>(
				(prev, key) => {
					const value = form[key];
					if (value !== undefined) {
						prev[key] = value;
					}
					return prev;
				},
				{},
			);

			// save it
			await onSave(id, metadata);

			// the image is not metadata, so it persists through its own endpoint
			if (image && (imageFile || imageCleared)) {
				await image.onChange(imageFile);
				setImageFile(null);
				setImageCleared(false);
			}

			setInitialForm(form);
			setIsEditMode(false);
			toast.success("Successfully updated details");
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Error updating details",
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Preview of the image as it will look once saved: the staged file, the
	 * stored image, or the generated avatar when it is being reset or the
	 * request 404s because the catalog has no custom image.
	 *
	 * @returns Sized preview tile, or null when images are not supported.
	 */
	const renderImagePreview = () => {
		if (!image) {
			return null;
		}

		const src = imagePreview || (imageCleared ? "" : image.url);

		return (
			<div className="relative size-16 shrink-0 overflow-hidden rounded-lg border bg-card">
				<AppCatalogAvatar
					data-image-fallback=""
					name={image.fallbackName}
					className="absolute inset-0 size-full text-xl"
				/>
				{src ? (
					<img
						// remount on a new src so a previous onError cannot
						// leave this permanently hidden
						key={src}
						src={src}
						alt=""
						className="absolute inset-0 size-full object-contain"
						onLoad={(e) => {
							// a real image loaded - drop the fallback so a
							// transparent image does not show it through
							e.currentTarget.parentElement
								?.querySelector("[data-image-fallback]")
								?.classList.add("hidden");
						}}
						onError={(e) => {
							e.currentTarget.style.display = "none";
						}}
					/>
				) : null}
			</div>
		);
	};

	/**
	 * Image field for the edit form. Staged locally and saved by handleSubmit,
	 * since the image does not travel with the metadata payload.
	 *
	 * @returns Editable image field, or null when images are not supported.
	 */
	const renderImageField = () => {
		if (!image) {
			return null;
		}

		return (
			<Field>
				<FieldLabel>Image</FieldLabel>
				<div className="flex flex-row items-start gap-4">
					{renderImagePreview()}
					<div className="flex min-w-0 flex-1 flex-col items-start gap-2">
						<FileDropzone
							value={imageFile}
							onChange={(value) => {
								const next = Array.isArray(value)
									? (value[0] ?? null)
									: value;
								setImageFile(next);
								if (next) {
									setImageCleared(false);
								}
							}}
							extensions={PROJECT_IMAGE_ACCEPT}
							disabled={isLoading}
							description="Click to browse or drop an image"
							className="w-full"
						/>
						<FieldDescription>
							{imageCleared
								? "The custom image will be removed when you save."
								: `Supported types: ${PROJECT_IMAGE_ACCEPT.join(", ")}`}
						</FieldDescription>
						{!imageCleared && (
							<Button
								variant="ghost"
								size="sm"
								disabled={isLoading}
								onClick={() => {
									setImageFile(null);
									setImageCleared(true);
								}}
								className="text-destructive hover:text-destructive"
								data-testid="catalog-overview--image-reset-btn"
							>
								Reset to default
							</Button>
						)}
					</div>
				</div>
			</Field>
		);
	};

	/**
	 * Render a dynamic metadata field according to configured display type.
	 *
	 * @param metakey Metadata key being rendered.
	 * @param displayOption Rendering mode from metadata configuration.
	 * @param label User-facing label for this field.
	 * @param inputType Configured input type, used to format numeric values.
	 * @returns Field input/display element for current edit mode.
	 */
	const renderDynamicField = (
		metakey: string,
		displayOption: string,
		label: string,
		inputType?: string,
	) => {
		const rawValue = form[metakey];
		// Numeric metadata (contextWindow, maxOutputTokens) arrives as a number, so
		// it has to be stringified or the text inputs render blank in edit mode.
		// Arrays/objects are excluded here; they render through arrayValue instead.
		const textValue =
			rawValue === null ||
			rawValue === undefined ||
			typeof rawValue === "object"
				? ""
				: String(rawValue);
		const arrayValue = normalizeArrayValue(rawValue);
		const options = filterOptions[metakey] || [];

		if (!isEditing) {
			// Read mode honors markdown rendering when requested by metadata config.
			if (displayOption === "markdown") {
				return String(rawValue ?? "").trim() ? (
					<Markdown
						className={markdownClassName}
						variant={markdownVariant}
					>
						{String(rawValue)}
					</Markdown>
				) : (
					<EmptyValue />
				);
			}

			if (Array.isArray(rawValue)) {
				return arrayValue.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{arrayValue.map((tag) => (
							<Badge key={tag} variant="outline">
								{tag}
							</Badge>
						))}
					</div>
				) : (
					<EmptyValue />
				);
			}

			// Covers numbers and booleans too, not just strings, so populated
			// numeric metadata (contextWindow, maxOutputTokens) is not shown as None.
			if (rawValue !== null && rawValue !== undefined) {
				const displayValue = formatDisplayValue(
					rawValue,
					inputType === "number",
				);

				if (displayValue !== "") {
					return <div className="text-sm">{displayValue}</div>;
				}
			}

			return <EmptyValue />;
		}

		if (displayOption === "markdown") {
			return (
				<MarkdownEditor
					className="h-[40vh]"
					value={textValue}
					onChange={(value) => updateForm(metakey, value)}
				/>
			);
		}

		if (displayOption === "textarea") {
			return (
				<Textarea
					value={textValue}
					onChange={(event) =>
						updateForm(metakey, event.target.value)
					}
				/>
			);
		}

		if (displayOption === "select-box") {
			return (
				<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
					{options.map((option) => {
						const checked = arrayValue.includes(option);

						return (
							<div
								key={option}
								className="flex cursor-pointer items-center gap-2"
							>
								<Checkbox
									checked={checked}
									onCheckedChange={(isChecked) => {
										// Keep this defensive branch for checkbox libs that may emit true
										// when clicking an already-selected option.
										if (isChecked === true) {
											if (checked) {
												updateForm(
													metakey,
													arrayValue.filter(
														(item) =>
															item !== option,
													),
												);
												return;
											}

											updateForm(metakey, [
												...arrayValue,
												option,
											]);
											return;
										}

										updateForm(
											metakey,
											arrayValue.filter(
												(item) => item !== option,
											),
										);
									}}
								/>
								<span className="text-sm">{option}</span>
							</div>
						);
					})}
				</div>
			);
		}

		if (
			displayOption === "multi-typeahead" ||
			displayOption === "multi-select" ||
			displayOption === "multi-checklist"
		) {
			return (
				<CatalogTagInput
					value={arrayValue}
					onChange={(value) => updateForm(metakey, value)}
					placeholder={`Press enter to add ${label.toLowerCase()}`}
					listId={`${metakey}-list`}
					options={options}
				/>
			);
		}

		// Numeric fields display separators while editing, but only digits are
		// stored so the save-time positive-integer parse still accepts the value.
		if (inputType === "number") {
			return (
				<Input
					type="text"
					inputMode="numeric"
					value={formatDisplayValue(textValue, true)}
					onChange={(event) =>
						updateForm(
							metakey,
							event.target.value.replace(/[^\d]/g, ""),
						)
					}
				/>
			);
		}

		return (
			<Input
				type="text"
				value={textValue}
				onChange={(event) => updateForm(metakey, event.target.value)}
				list={options.length ? `${metakey}-list` : undefined}
			/>
		);
	};

	const renderMetadataFields = () => {
		return (
			<>
				<Field>
					<FieldLabel>Description</FieldLabel>
					{isEditing ? (
						<Textarea
							value={String(form.description || "")}
							onChange={(event) =>
								updateForm("description", event.target.value)
							}
							placeholder="Please provide a description"
							data-testid="catalog-overview--descriptions"
						/>
					) : (
						<div className="text-muted-foreground text-sm">
							{String(form.description || "")}
						</div>
					)}
				</Field>

				<Field>
					<FieldLabel>Tag(s)</FieldLabel>
					{!isEditing ? (
						<CatalogTags tags={form.tag} />
					) : (
						<CatalogTagInput
							value={form.tag}
							onChange={(value) => updateForm("tag", value)}
							placeholder="Press enter to add tags"
							testId="catalog-overview--tags"
							listId="catalog-overview--tags-list"
							options={filterOptions.tag || []}
						/>
					)}
				</Field>

				<Field>
					<FieldLabel>Data Classification</FieldLabel>
					{!isEditing ? (
						<CatalogTags tags={form["data classification"]} />
					) : (
						<CatalogTagInput
							value={form["data classification"]}
							onChange={(value) =>
								updateForm("data classification", value)
							}
							placeholder="Press enter to add data classification"
							testId="catalog-overview--data-classification"
							listId={`data classification-list`}
							options={filterOptions["data classification"] || []}
						/>
					)}
				</Field>

				<Field>
					<FieldLabel>Data Restrictions</FieldLabel>
					{!isEditing ? (
						<CatalogTags tags={form["data restrictions"]} />
					) : (
						<CatalogTagInput
							value={form["data restrictions"]}
							onChange={(value) =>
								updateForm("data restrictions", value)
							}
							placeholder="Press enter to add data restrictions"
							testId="catalog-overview--data-restrictions"
							listId={`data restrictions-list`}
							options={filterOptions["data restrictions"] || []}
						/>
					)}
				</Field>

				{dynamicMetaKeys.map((meta) => {
					const label =
						meta.display_label || metakeyToLabel(meta.metakey);

					if (
						(meta.display_options === "multi-typeahead" ||
							meta.display_options === "multi-select" ||
							meta.display_options === "multi-checklist") &&
						isEditing
					) {
						return (
							<Field key={meta.metakey}>
								<FieldLabel>{label}</FieldLabel>
								<CatalogTagInput
									value={normalizeArrayValue(
										form[meta.metakey],
									)}
									onChange={(value) =>
										updateForm(meta.metakey, value)
									}
									placeholder={`Press enter to add ${label.toLowerCase()}`}
									listId={`${meta.metakey}-list`}
									options={filterOptions[meta.metakey] || []}
								/>
							</Field>
						);
					}

					return (
						<Field key={meta.metakey}>
							<FieldLabel>{label}</FieldLabel>
							{renderDynamicField(
								meta.metakey,
								meta.display_options,
								label,
								meta.input_type,
							)}
							{/* Only edit-mode inputs reference the datalist. */}
							{isEditing &&
								(filterOptions[meta.metakey] || []).length >
									0 && (
									<datalist id={`${meta.metakey}-list`}>
										{(
											filterOptions[meta.metakey] || []
										).map((option) => (
											<option
												key={option}
												value={option}
											/>
										))}
									</datalist>
								)}
						</Field>
					);
				})}
			</>
		);
	};

	return (
		<div className="group relative z-0">
			{isEditable && !isEditMode ? (
				<div className="absolute top-2 right-2 z-1">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							if (!isEditMode) {
								setIsEditMode(true);
							}
						}}
						disabled={isLoading}
						className="opacity-0 transition-opacity group-hover:opacity-100"
						data-testid="catalog-overview--tags--edit-btn"
					>
						<Pencil className="size-4" />
						Edit
					</Button>
				</div>
			) : null}

			<div className="my-1 border-border border-b pb-2 last:mb-0 last:border-b-0">
				{isEditing ? (
					<div className="space-y-6">
						{renderImageField()}
						<Field>
							<FieldLabel>About</FieldLabel>
							<MarkdownEditor
								className="h-[40vh]"
								value={String(form.markdown || "")}
								onChange={(value) =>
									updateForm("markdown", value)
								}
								data-testid="catalog-overview--markdown"
							/>
						</Field>

						{renderMetadataFields()}

						<div className="flex justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={isLoading}
								data-testid="catalog-overview--cancel-btn"
							>
								Cancel
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={isLoading || !isDirty}
								data-testid="catalog-overview--save-btn"
							>
								{isLoading ? (
									<Spinner className="size-4" />
								) : (
									"Save"
								)}
							</Button>
						</div>
					</div>
				) : (
					<div className="space-y-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(16rem,24rem)] lg:gap-x-8 lg:space-y-0">
						{String(form.markdown || "").trim() ? (
							<div>
								<Field>
									<Markdown
										className={markdownClassName}
										variant={markdownVariant}
									>
										{String(form.markdown)}
									</Markdown>
								</Field>
							</div>
						) : (
							// self-start keeps the placeholder near the top of the row
							// instead of centering it against a tall metadata sidebar.
							<NoDetailsEmptyState
								className="self-start"
								data-testid="catalog-overview--markdown-empty"
							/>
						)}
						<div>
							<div className="space-y-6 lg:rounded-xl lg:border lg:bg-card lg:p-4">
								{image ? (
									<Field>
										<FieldLabel>Image</FieldLabel>
										{renderImagePreview()}
									</Field>
								) : null}
								{renderMetadataFields()}
								{dateCreated && (
									<Field>
										<FieldLabel>Created</FieldLabel>
										<div className="text-muted-foreground text-sm">
											{formatDateToLocal(dateCreated)}
										</div>
									</Field>
								)}
								{dateLastEdited && (
									<Field>
										<FieldLabel>Updated</FieldLabel>
										<div className="text-muted-foreground text-sm">
											{formatDateToLocal(dateLastEdited)}
										</div>
									</Field>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
