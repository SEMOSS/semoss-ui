import { Pencil, Plus } from "lucide-react";
import { Alert, AlertDescription, Badge, Button } from "@semoss/ui/next";
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
	/** Opens the Add Dependency dialog */
	onAdd: () => void;
	/** Leaves edit mode, asking first when there are changes */
	onDone: () => void;
}

/**
 * The bar across the top of the Ontology canvas while its dependencies are
 * edited, as the automation canvas shows its draft: what is being edited and
 * how many changes wait, Add Dependency, and Done, which leaves edit mode and
 * asks first when changes wait. Save is in the toolbar
 * (`DependencySaveControls`). Names to fix, or the backend's reason for a
 * refused save, show under the bar, and the draft stays.
 */
export const DependencyEditBar = ({
	changeCount,
	problemCount,
	isSaving,
	saveError,
	onAdd,
	onDone,
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
					onClick={onDone}
					disabled={isSaving}
				>
					Done
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
