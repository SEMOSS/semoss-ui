import { Pencil, RotateCcw, Save, TriangleAlert } from "lucide-react";
import { useId } from "react";
import { Badge, Button, cn, Spinner } from "@semoss/ui/next";
import { MapTooltip } from "@/features/dependency-map/map-tooltip";

/** Props for {@link DependencySaveControls}. */
interface DependencySaveControlsProps {
	/** How many changes are not saved */
	changeCount: number;
	/** Each change in words, listed when the count is hovered or focused */
	changes: readonly string[];
	/** How many links have a problem that stops the save */
	problemCount: number;
	/** Whether the save is running */
	isSaving: boolean;
	/** Drops every change and keeps editing */
	onReset: () => void;
	/** Saves every change at once */
	onSave: () => void;
	/** Leaves edit mode, asking first when there are changes */
	onDone: () => void;
}

/** A warning tint for changes that are lost unless saved. */
const UNSAVED_TINT_CLASS = "border-warning/50 bg-warning/10";

/** The tint the metamodel page gives a state with nothing to lose yet. */
const EDITING_TINT_CLASS = "border-primary/40 bg-primary/10";

/**
 * The Ontology tab's edit mode in its toolbar, as the database metamodel page
 * has it: a tinted banner saying the dependencies are being edited, with how
 * many changes wait (hover the count for the list) and, once there are
 * some, a warning that they are lost unless saved; Reset to the
 * dependencies as saved; an icon Save, outlined in the primary colour and
 * pulsing while there is something to save; and Done, which leaves edit
 * mode. Save is
 * always named Save; while it is off (nothing to save, names to fix, or a
 * save running) it stays focusable and says why in its tooltip and its
 * accessible description.
 */
export const DependencySaveControls = ({
	changeCount,
	changes,
	problemCount,
	isSaving,
	onReset,
	onSave,
	onDone,
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
			<div
				className={cn(
					"flex flex-wrap items-center gap-2 rounded-md border px-2 py-1 font-medium text-foreground text-xs",
					isReminderShown ? UNSAVED_TINT_CLASS : EDITING_TINT_CLASS,
				)}
			>
				{isReminderShown ? (
					<TriangleAlert
						className="size-3.5 text-warning"
						aria-hidden="true"
					/>
				) : (
					<Pencil
						className="size-3.5 text-primary"
						aria-hidden="true"
					/>
				)}
				Editing Dependencies
				{hasChanges ? (
					<MapTooltip
						label={
							<ul className="flex list-disc flex-col gap-0.5 ps-4 text-start">
								{changes.map((change) => (
									<li key={change}>{change}</li>
								))}
							</ul>
						}
					>
						<Badge asChild variant="secondary">
							{/* a button, so keyboard users can open the list too */}
							<button
								type="button"
								aria-label={`${
									changeCount === 1
										? "1 change"
										: `${changeCount} changes`
								}: ${changes.join("; ")}`}
								className="cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								{changeCount === 1
									? "1 change"
									: `${changeCount} changes`}
							</button>
						</Badge>
					</MapTooltip>
				) : null}
				{isReminderShown ? (
					<span>Save changes or they will be lost.</span>
				) : null}
				{/* only the count is announced as it changes */}
				<output className="sr-only">
					{changeCount === 0
						? ""
						: changeCount === 1
							? "1 unsaved change"
							: `${changeCount} unsaved changes`}
				</output>
			</div>
			{hasChanges ? (
				<MapTooltip label="Reset to Last Saved State">
					<Button
						type="button"
						size="icon-sm"
						variant="outline"
						aria-label="Reset to Last Saved State"
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
							"border-primary text-primary hover:bg-primary/10 hover:text-primary",
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
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={isSaving}
				onClick={onDone}
			>
				Done
			</Button>
		</div>
	);
};
