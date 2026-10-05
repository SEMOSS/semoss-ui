import { useEffect, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldGroup,
	FieldLabel,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { normalizeTagArray } from "@/utility";
import { BadgeList, SettingsEntry } from "../engine/engine-metadata-display";
import { CatalogTagInput } from "./catalog-tag-input";

const TAG_FIELDS = [
	{ metakey: "tag", label: "Tags" },
	{ metakey: "data classification", label: "Data Classification" },
	{ metakey: "data restrictions", label: "Data Restrictions" },
	{ metakey: "domain", label: "Domain" },
] as const;

type TagsForm = Record<string, string[]>;

/** Build the editable form state from the entry's current metadata. */
const toForm = (metadata: Record<string, unknown>): TagsForm =>
	Object.fromEntries(
		TAG_FIELDS.map((field) => [
			field.metakey,
			normalizeTagArray(
				metadata[field.metakey] as string | string[] | undefined,
			) || [],
		]),
	);

export interface CatalogTagsSettingsProps {
	/** The entry's current metadata (an engine or project record). */
	metadata: Record<string, unknown>;
	/** User's permission for the entry. */
	permission: Role;
	/**
	 * Pixel returning observed values for the given meta keys across the
	 * catalog, offered as typeahead suggestions, e.g. `GetDatabaseMetaValues`.
	 */
	buildMetaValuesPixel: (metaKeys: string[]) => string;
	/** Config meta keys whose `display_values` override the inferred options. */
	metaKeysConfig: { metakey: string; display_values?: string }[];
	/** Persists the edited metadata; throw to report a failure. */
	onSave: (meta: TagsForm) => Promise<void>;
	/** Called after a successful save so the parent can refresh. */
	onUpdated?: () => void;
	/** Card description, e.g. "Organize and classify this model across the catalog." */
	description: string;
	/** Prefix for data-testids, e.g. "engine-tags-settings". */
	testIdPrefix: string;
}

/**
 * Editable card for a catalog entry's organizational metadata (tags, data
 * classification, data restrictions, and domain). Read-only for viewers.
 */
export const CatalogTagsSettings = ({
	metadata,
	permission,
	buildMetaValuesPixel,
	metaKeysConfig,
	onSave,
	onUpdated,
	description,
	testIdPrefix,
}: CatalogTagsSettingsProps) => {
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState<TagsForm>(() => toForm(metadata));
	const [initialForm, setInitialForm] = useState<TagsForm>(() =>
		toForm(metadata),
	);

	const getMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(buildMetaValuesPixel(TAG_FIELDS.map((field) => field.metakey)));

	const isEditable = permission === "OWNER" || permission === "EDIT";
	const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

	// Read through a ref so the resync effect below can check for unsaved work
	// without re-running on every keystroke.
	const isDirtyRef = useRef(isDirty);
	isDirtyRef.current = isDirty;

	useEffect(() => {
		// A refresh triggered elsewhere (a sibling settings card saving) must
		// not overwrite in-progress edits.
		if (isDirtyRef.current) {
			return;
		}

		const nextForm = toForm(metadata);
		setForm(nextForm);
		setInitialForm(nextForm);
	}, [metadata]);

	const filterOptions: Record<string, string[]> = (
		getMetaValues.status === "SUCCESS" ? getMetaValues.data : []
	).reduce<Record<string, string[]>>((prev, current) => {
		if (!prev[current.METAKEY]) {
			prev[current.METAKEY] = [];
		}
		prev[current.METAKEY].push(current.METAVALUE);
		return prev;
	}, {});

	// Config-defined display values override inferred values for consistent
	// option lists.
	for (const metaKey of metaKeysConfig) {
		if (!metaKey.display_values) {
			continue;
		}

		filterOptions[metaKey.metakey] = metaKey.display_values
			.split(",")
			.map((value) => value.trim())
			.filter((value) => value !== "");
	}

	/** Drop any unsaved edits and go back to the persisted values. */
	const handleDiscard = () => {
		setForm(initialForm);
	};

	/** Persist the edited metadata and refresh the entry. */
	const handleSave = async () => {
		try {
			setIsSaving(true);
			await onSave(form);
			setInitialForm(form);
			toast.success("Successfully updated tags");
			onUpdated?.();
		} catch (error) {
			toast.error(getErrorMessage(error, "Error updating tags"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Tags</CardTitle>
				<CardDescription>{description}</CardDescription>
				{/*
				 * CardAction drops into the header's reserved second column and
				 * spans both text rows, so showing it cannot change the card's
				 * height or width.
				 */}
				{isEditable && isDirty && (
					<CardAction className="flex gap-2 self-center">
						<Button
							variant="outline"
							size="sm"
							onClick={handleDiscard}
							disabled={isSaving}
							data-testid={`${testIdPrefix}--cancel-btn`}
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							data-testid={`${testIdPrefix}--save-btn`}
						>
							{isSaving ? <Spinner className="size-4" /> : "Save"}
						</Button>
					</CardAction>
				)}
			</CardHeader>
			<CardContent>
				{isEditable ? (
					<FieldGroup>
						{TAG_FIELDS.map((field) => (
							<Field key={field.metakey}>
								<FieldLabel>{field.label}</FieldLabel>
								<CatalogTagInput
									value={form[field.metakey]}
									onChange={(value) =>
										setForm((prev) => ({
											...prev,
											[field.metakey]: value,
										}))
									}
									placeholder={`Press enter to add ${field.label.toLowerCase()}`}
									testId={`${testIdPrefix}--${field.metakey}`}
									listId={`${testIdPrefix}--${field.metakey}-list`}
									options={filterOptions[field.metakey] || []}
								/>
							</Field>
						))}
					</FieldGroup>
				) : (
					<div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
						{TAG_FIELDS.map((field) => (
							<SettingsEntry
								key={field.metakey}
								label={field.label}
							>
								<BadgeList values={form[field.metakey]} />
							</SettingsEntry>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
