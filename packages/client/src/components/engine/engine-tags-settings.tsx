import { useEffect, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
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
import { CatalogTagInput } from "@/components/catalog";
import { useRootStore } from "@/hooks";
import { normalizeTagArray } from "@/utility";
import { BadgeList, SettingsEntry } from "./engine-metadata-display";

const TAG_FIELDS = [
	{ metakey: "tag", label: "Tags" },
	{ metakey: "data classification", label: "Data Classification" },
	{ metakey: "data restrictions", label: "Data Restrictions" },
	{ metakey: "domain", label: "Domain" },
] as const;

type TagsForm = Record<string, string[]>;

/**
 * Build the editable form state from the engine's current metadata.
 */
const toForm = (engine: Engine): TagsForm =>
	Object.fromEntries(
		TAG_FIELDS.map((field) => [
			field.metakey,
			normalizeTagArray(
				(engine as unknown as Record<string, string | string[]>)[
					field.metakey
				],
			) || [],
		]),
	);

interface EngineTagsSettingsProps {
	/** Current engine */
	engine: Engine;

	/** User's permission for the engine */
	permission: Role;

	/** Called after a successful save so the parent can refresh engine data */
	onUpdated?: () => void;
}

/**
 * Editable card for the engine's organizational metadata (tags, data
 * classification, data restrictions, and domain), saved via
 * SetEngineMetadata.
 */
export const EngineTagsSettings = ({
	engine,
	permission,
	onUpdated,
}: EngineTagsSettingsProps) => {
	const { configStore } = useRootStore();

	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState<TagsForm>(() => toForm(engine));
	const [initialForm, setInitialForm] = useState<TagsForm>(() =>
		toForm(engine),
	);

	// Observed values across the catalog, offered as typeahead suggestions.
	const getMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(
		`META | GetDatabaseMetaValues ( metaKeys = [${TAG_FIELDS.map(
			(field) => `'${field.metakey}'`,
		).join(",")}] ) ;`,
	);

	const isEditable = permission === "OWNER" || permission === "EDIT";
	const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

	// Read through a ref so the resync effect below can check for unsaved work
	// without re-running on every keystroke.
	const isDirtyRef = useRef(isDirty);
	isDirtyRef.current = isDirty;

	useEffect(() => {
		// The fields are always editable now, so a refresh triggered elsewhere
		// (a sibling settings card saving) must not overwrite in-progress edits.
		if (isDirtyRef.current) {
			return;
		}

		const nextForm = toForm(engine);
		setForm(nextForm);
		setInitialForm(nextForm);
	}, [engine]);

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
	// option lists, mirroring the old Overview behavior.
	configStore.store.config.databaseMetaKeys.forEach((metaKey) => {
		if (!metaKey.display_values) {
			return;
		}

		filterOptions[metaKey.metakey] = metaKey.display_values
			.split(",")
			.map((value) => value.trim())
			.filter((value) => value !== "");
	});

	/**
	 * Drop any unsaved edits and go back to the persisted values.
	 */
	const handleDiscard = () => {
		setForm(initialForm);
	};

	/**
	 * Persist the edited metadata and refresh the engine details.
	 */
	const handleSave = async () => {
		try {
			setIsSaving(true);

			const response = await configStore.runPixel(
				`SetEngineMetadata(engine=["${engine.engine_id}"], meta=[${JSON.stringify(
					form,
				)}])`,
			);

			if (response.errors.length > 0) {
				throw new Error(response.errors.join(""));
			}

			setInitialForm(form);
			toast.success("Successfully updated tags");

			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Error updating tags",
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Tags</CardTitle>
				<CardDescription>
					Organize and classify this model across the catalog.
				</CardDescription>
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
							data-testid="engine-tags-settings--cancel-btn"
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							data-testid="engine-tags-settings--save-btn"
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
									testId={`engine-tags-settings--${field.metakey}`}
									listId={`engine-tags-settings--${field.metakey}-list`}
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
