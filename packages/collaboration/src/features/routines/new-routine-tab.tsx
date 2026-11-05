import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Skeleton,
} from "@semoss/ui/next";
import type { CustomRoutine } from "./custom-routine-schema";
import { NewCustomRoutine } from "./new-custom-routine";
import { useSkillCatalog } from "./use-skill-catalog";

interface NewRoutineTabProps {
	/** Receives the saved routine, which then opens in My routines. */
	onCreated: (routine: CustomRoutine) => void;
}

/** The New routine tab: a routine from scratch or from an idea, once the skill catalog is read. */
export function NewRoutineTab({ onCreated }: NewRoutineTabProps) {
	const catalog = useSkillCatalog();
	if (catalog.isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-64 w-full" />
				<output className="sr-only">Loading...</output>
			</div>
		);
	}
	if (!catalog.skills) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Could not start a new routine</AlertTitle>
				<AlertDescription>
					{catalog.error}
					<Button
						type="button"
						variant="outline"
						onClick={catalog.refresh}
					>
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		);
	}
	return <NewCustomRoutine skills={catalog.skills} onCreated={onCreated} />;
}
