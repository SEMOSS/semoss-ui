import { useEffect, useRef, useState } from "react";
import type { Engine, Role } from "@semoss/shared";
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
import { useRootStore } from "@/hooks";
import { EmptyValue, SettingsEntry } from "./engine-metadata-display";

interface DescriptionForm {
	description: string;
	markdown: string;
}

/**
 * Build the editable form state from the engine's current metadata.
 */
const toForm = (engine: Engine): DescriptionForm => ({
	description: String(engine.description || ""),
	markdown: String(engine.markdown || ""),
});

interface EngineDescriptionSettingsProps {
	/** Current engine */
	engine: Engine;

	/** User's permission for the engine */
	permission: Role;

	/** Called after a successful save so the parent can refresh engine data */
	onUpdated?: () => void;
}

/**
 * Editable card for the engine's descriptive content: the short catalog
 * description and the long-form About markdown shown on the Overview page.
 */
export const EngineDescriptionSettings = ({
	engine,
	permission,
	onUpdated,
}: EngineDescriptionSettingsProps) => {
	const { configStore } = useRootStore();

	const [isSaving, setIsSaving] = useState(false);
	const [form, setForm] = useState<DescriptionForm>(() => toForm(engine));
	const [initialForm, setInitialForm] = useState<DescriptionForm>(() =>
		toForm(engine),
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

	/**
	 * Drop any unsaved edits and go back to the persisted values.
	 */
	const handleDiscard = () => {
		setForm(initialForm);
	};

	/**
	 * Persist the edited content and refresh the engine details.
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
				<CardDescription>
					The summary and About content shown on the Overview page.
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
							data-testid="engine-description-settings--cancel-btn"
						>
							Discard
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							data-testid="engine-description-settings--save-btn"
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
								data-testid="engine-description-settings--description"
							/>
							<FieldDescription>
								A short summary shown in the catalog and on the
								Overview page.
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel>About</FieldLabel>
							<MarkdownEditor
								className="h-[40vh]"
								value={form.markdown}
								onChange={(value) =>
									setForm((prev) => ({
										...prev,
										markdown: value,
									}))
								}
								data-testid="engine-description-settings--markdown"
							/>
							<FieldDescription>
								Long-form markdown rendered on the Overview
								page.
							</FieldDescription>
						</Field>
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

						<SettingsEntry label="About">
							{form.markdown.trim() !== "" ? (
								<Markdown>{form.markdown}</Markdown>
							) : (
								<EmptyValue />
							)}
						</SettingsEntry>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
