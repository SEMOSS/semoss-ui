import { useEffect, useRef, useState } from "react";
import type { Role } from "@semoss/sdk";
import {
	Button,
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	Markdown,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor } from "@/components/common";
import { EmptyValue, SettingsEntry } from "../engine/engine-metadata-display";

type DescriptionForm = {
	description: string;
	markdown?: string;
};

/** Build the editable form state; `markdown` is only tracked when shown. */
const toForm = (
	metadata: Record<string, unknown>,
	showAbout: boolean,
): DescriptionForm => ({
	description: String(metadata.description || ""),
	...(showAbout ? { markdown: String(metadata.markdown || "") } : {}),
});

export interface CatalogDescriptionSettingsProps {
	/** The entry's current metadata (an engine or project record). */
	metadata: Record<string, unknown>;
	/** User's permission for the entry. */
	permission: Role;
	/**
	 * Persists the edited fields; throw to report a failure. Only the fields
	 * shown are passed, so a hidden About is never overwritten.
	 */
	onSave: (meta: DescriptionForm) => Promise<void>;
	/** Called after a successful save so the parent can refresh. */
	onUpdated?: () => void;
	/** Card description. */
	description: string;
	/** Help text under the Description field. */
	descriptionHelp: string;
	/** Shows the long-form About markdown field, with this help text. */
	aboutHelp?: string;
	/** Prefix for data-testids, e.g. "engine-description-settings". */
	testIdPrefix: string;
}

/**
 * Editable card for a catalog entry's descriptive content: the short catalog
 * description and, optionally, long-form About markdown. Read-only for
 * viewers.
 */
export const CatalogDescriptionSettings = ({
	metadata,
	permission,
	onSave,
	onUpdated,
	description,
	descriptionHelp,
	aboutHelp,
	testIdPrefix,
}: CatalogDescriptionSettingsProps) => {
	const showAbout = aboutHelp !== undefined;
	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState<DescriptionForm>(() =>
		toForm(metadata, showAbout),
	);
	const [initialForm, setInitialForm] = useState<DescriptionForm>(() =>
		toForm(metadata, showAbout),
	);

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

		const nextForm = toForm(metadata, showAbout);
		setForm(nextForm);
		setInitialForm(nextForm);
	}, [metadata, showAbout]);

	/** Drop any unsaved edits and go back to the persisted values. */
	const handleDiscard = () => {
		setForm(initialForm);
	};

	/** Persist the edited content and refresh the entry. */
	const handleSave = async () => {
		try {
			setIsSaving(true);
			await onSave(form);
			setInitialForm(form);
			toast.success("Successfully updated description");
			onUpdated?.();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Error updating description",
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Card>
			<CardHeader className="border-b">
				<CardTitle>Description</CardTitle>
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
						<Field>
							<FieldLabel>Description</FieldLabel>
							<Textarea
								value={form.description}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										description: event.target.value,
									}))
								}
								placeholder="Please provide a description"
								data-testid={`${testIdPrefix}--description`}
							/>
							<FieldDescription>
								{descriptionHelp}
							</FieldDescription>
						</Field>

						{showAbout && (
							<Field>
								<FieldLabel>About</FieldLabel>
								<MarkdownEditor
									className="h-[40vh]"
									value={form.markdown ?? ""}
									onChange={(value) =>
										setForm((prev) => ({
											...prev,
											markdown: value,
										}))
									}
									data-testid={`${testIdPrefix}--markdown`}
								/>
								<FieldDescription>{aboutHelp}</FieldDescription>
							</Field>
						)}
					</FieldGroup>
				) : (
					<div className="flex flex-col gap-6">
						<SettingsEntry label="Description">
							{form.description.trim() !== "" ? (
								<p className="text-muted-foreground text-sm">
									{form.description}
								</p>
							) : (
								<EmptyValue />
							)}
						</SettingsEntry>

						{showAbout && (
							<SettingsEntry label="About">
								{(form.markdown ?? "").trim() !== "" ? (
									<Markdown>{form.markdown ?? ""}</Markdown>
								) : (
									<EmptyValue />
								)}
							</SettingsEntry>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
};
