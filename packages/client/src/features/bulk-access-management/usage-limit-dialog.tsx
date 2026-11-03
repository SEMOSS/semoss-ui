import { type ReactNode, useRef, useState } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	findModelUsageLimitProblem,
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	type ModelUsageLimitSource,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";

export interface UsageLimitDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The dialog's title, such as "Usage Limit for Ada" */
	title: string;
	/** What the limit applies to, under the title */
	description?: ReactNode;
	/** Where the limit is set, which decides whose use its rules can count */
	source: ModelUsageLimitSource;
	/** The limit it starts from, or null for no limit defined */
	defaultValue: ModelUsageLimit | null;
	/** Whether the model has known prices, so Cost can be chosen */
	isCostAvailable: boolean;
	/** What applies when no limit is defined, in place of the source's usual words */
	notDefinedHint?: string;
	/** Why the user cannot change the limit; the dialog then only shows it */
	readOnlyReason?: string | null;
	/** The button that uses the limit, such as "Use This Limit" */
	saveLabel?: string;
	/**
	 * Called with the limit, or null for no limit defined. A host that saves it
	 * right away returns the save: the dialog waits for it, and when it is
	 * refused, shows why and stays open.
	 */
	onSave: (usageLimit: ModelUsageLimit | null) => void | Promise<void>;
	/** Called when the dialog closes without using the limit */
	onClose: () => void;
}

/**
 * Edits one usage limit: in Bulk Access Management, a person's, a team's, the
 * model total or the public use limit, or the limit people are added with,
 * which join the staged changes; in the Teams table on a model, a team's
 * limit, which is saved at once. Give it a new key each time it opens so it
 * starts from the limit it is given, with no problems shown. Save stays
 * enabled: a limit that cannot be saved shows its problems when Save is
 * pressed, and is not used.
 */
export const UsageLimitDialog = ({
	open,
	title,
	description,
	source,
	defaultValue,
	isCostAvailable,
	notDefinedHint,
	readOnlyReason = null,
	saveLabel = "Use This Limit",
	onSave,
	onClose,
}: UsageLimitDialogProps) => {
	const [value, setValue] = useState<ModelUsageLimit | null>(defaultValue);
	const [isSaving, setIsSaving] = useState(false);
	// why the host's save was refused, or null
	const [saveError, setSaveError] = useState<string | null>(null);
	// the limit's problems show from the first save they stop
	const [shouldShowProblems, setShouldShowProblems] = useState(false);
	const editorRef = useRef<ModelUsageLimitEditorHandle>(null);
	const problem = findModelUsageLimitProblem(value, {
		source,
		isCostAvailable,
	});

	const handleSave = async () => {
		if (problem) {
			setShouldShowProblems(true);
			editorRef.current?.focusFirstProblem();
			return;
		}
		setSaveError(null);
		const saving = onSave(value);
		// a host that only stages the limit returns nothing to wait for
		if (!(saving instanceof Promise)) {
			return;
		}
		setIsSaving(true);
		try {
			await saving;
		} catch (e) {
			setSaveError(getErrorMessage(e, "Could not save the usage limit"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSaving) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-base leading-6">
						{title}
					</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>
				<ModelUsageLimitEditor
					ref={editorRef}
					defaultValue={defaultValue}
					onChange={setValue}
					source={source}
					isCostAvailable={isCostAvailable}
					notDefinedHint={notDefinedHint}
					readOnlyReason={readOnlyReason}
					shouldShowProblems={shouldShowProblems}
					disabled={isSaving}
				/>
				{saveError ? (
					<Alert variant="destructive">
						<AlertDescription>{saveError}</AlertDescription>
					</Alert>
				) : null}
				<DialogFooter className="items-center">
					{shouldShowProblems && problem && !readOnlyReason ? (
						<span className="me-auto text-destructive text-xs">
							{problem}
						</span>
					) : null}
					<Button
						type="button"
						variant="outline"
						disabled={isSaving}
						onClick={onClose}
					>
						{readOnlyReason ? "Close" : "Cancel"}
					</Button>
					{readOnlyReason ? null : (
						<Button
							type="button"
							disabled={isSaving}
							onClick={handleSave}
						>
							{isSaving ? "Saving..." : saveLabel}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
