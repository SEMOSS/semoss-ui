import { RotateCcw, Save } from "lucide-react";
import { useId } from "react";
import { Button, cn, P, Spinner } from "@semoss/ui/next";
import { MapTooltip } from "@/features/dependency-map/map-tooltip";

/** Props for {@link DependencySaveControls}. */
interface DependencySaveControlsProps {
	/** How many changes are not saved */
	changeCount: number;
	/** How many links have a problem that stops the save */
	problemCount: number;
	/** Whether the save is running */
	isSaving: boolean;
	/** Drops every change and keeps editing */
	onReset: () => void;
	/** Saves every change at once */
	onSave: () => void;
}

/** The tint the metamodel page gives changes that are lost unless saved. */
const UNSAVED_TINT_CLASS = "border-destructive/40 bg-destructive/10";

/**
 * Save for the Ontology tab's edit mode, in the toolbar as the database
 * metamodel page has it: a reminder while changes wait, Reset to the
 * dependencies as saved, and an icon Save that pulses while there is
 * something to save. Save is always named Save; while it is off (nothing to
 * save, names to fix, or a save running) it stays focusable and says why in
 * its tooltip and its accessible description.
 */
export const DependencySaveControls = ({
	changeCount,
	problemCount,
	isSaving,
	onReset,
	onSave,
}: DependencySaveControlsProps) => {
	const hasChanges = changeCount > 0;
	const blockReason = isSaving
		? "Saving..."
		: !hasChanges
			? "No changes to save"
			: problemCount > 0
				? "Fix the names marked in red before saving"
				: null;
	const isReminderShown = hasChanges && !isSaving;
	const description = blockReason ?? "Save changes to the dependencies";
	const descriptionId = useId();

	return (
		<div className="flex flex-wrap items-center justify-end gap-2">
			{isReminderShown ? (
				<div
					className={cn(
						"rounded-md border px-2 py-1",
						UNSAVED_TINT_CLASS,
					)}
				>
					<P className="font-medium text-foreground text-xs">
						Save changes or they will be lost.
					</P>
				</div>
			) : null}
			{hasChanges ? (
				<MapTooltip label="Reset to last saved state">
					<Button
						type="button"
						size="icon-sm"
						variant="outline"
						aria-label="Reset to last saved state"
						disabled={isSaving}
						onClick={onReset}
						data-testid="catalogDependenciesView-reset-btn"
					>
						<RotateCcw aria-hidden="true" />
					</Button>
				</MapTooltip>
			) : null}
			<MapTooltip label={description}>
				{/* aria-disabled rather than disabled, so the button keeps
				    focus and its tooltip while it says why it is off */}
				<Button
					type="button"
					size="icon-sm"
					variant="outline"
					aria-label="Save"
					aria-describedby={descriptionId}
					aria-disabled={blockReason !== null}
					className={cn(
						"aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
						isReminderShown &&
							problemCount === 0 &&
							`${UNSAVED_TINT_CLASS} text-foreground hover:bg-destructive/15`,
					)}
					onClick={() => {
						if (blockReason === null) {
							onSave();
						}
					}}
					data-testid="catalogDependenciesView-save-btn"
				>
					{isSaving ? (
						<Spinner className="size-4" />
					) : (
						<Save
							aria-hidden="true"
							className={cn(
								isReminderShown &&
									problemCount === 0 &&
									"motion-safe:animate-pulse",
							)}
						/>
					)}
				</Button>
			</MapTooltip>
			<span id={descriptionId} className="sr-only">
				{description}
			</span>
		</div>
	);
};
