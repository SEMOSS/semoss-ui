import { Pencil, Plus } from "lucide-react";
import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	Spinner,
} from "@semoss/ui/next";
import { MapOverlayCard } from "@/features/dependency-map/map-overlay-card";

/** Props for {@link DependencyEditBar}. */
interface DependencyEditBarProps {
	/** How many changes are not saved */
	changeCount: number;
	/** How many links have a problem that stops the save */
	problemCount: number;
	/** Whether the save is running */
	isSaving: boolean;
	/** Why the last save was refused, or null */
	saveError: string | null;
	/** Opens the Add Dependency panel */
	onAdd: () => void;
	/** Leaves edit mode, asking first when there are changes */
	onDiscard: () => void;
	/** Saves every change at once */
	onSave: () => void;
}

/**
 * The bar across the top of the Ontology canvas while its dependencies are
 * edited, as the automation canvas shows its draft: what is being edited and
 * how many changes wait, Add Dependency, then Discard and Save. Save stays
 * off with nothing to save or a name to fix, and shows Saving... while it
 * runs. A refused save shows the backend's reason under the bar, and the draft
 * stays.
 */
export const DependencyEditBar = ({
	changeCount,
	problemCount,
	isSaving,
	saveError,
	onAdd,
	onDiscard,
	onSave,
}: DependencyEditBarProps) => (
	<div className="flex w-full max-w-xl flex-col gap-2">
		<MapOverlayCard className="flex flex-wrap items-center gap-2 pl-3">
			<span className="flex min-w-0 items-center gap-2 font-medium text-sm">
				<Pencil className="size-4 text-primary" aria-hidden="true" />
				Editing dependencies
				{changeCount > 0 ? (
					<Badge variant="secondary">
						{changeCount === 1
							? "1 change"
							: `${changeCount} changes`}
					</Badge>
				) : null}
			</span>
			<div className="ml-auto flex items-center gap-2">
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={onAdd}
					disabled={isSaving}
				>
					<Plus aria-hidden="true" />
					Add Dependency
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={onDiscard}
					disabled={isSaving}
				>
					Discard
				</Button>
				<Button
					type="button"
					size="sm"
					onClick={onSave}
					disabled={isSaving || changeCount === 0 || problemCount > 0}
				>
					{isSaving ? <Spinner className="size-4" /> : null}
					{isSaving ? "Saving..." : "Save"}
				</Button>
			</div>
		</MapOverlayCard>
		{problemCount > 0 ? (
			<Alert variant="destructive">
				<AlertDescription>
					{problemCount === 1
						? "1 dependency needs a different name before you can save."
						: `${problemCount} dependencies need different names before you can save.`}
				</AlertDescription>
			</Alert>
		) : saveError ? (
			<Alert variant="destructive">
				<AlertDescription>{saveError}</AlertDescription>
			</Alert>
		) : null}
	</div>
);
