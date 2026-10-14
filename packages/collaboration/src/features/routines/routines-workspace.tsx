import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Skeleton,
} from "@semoss/ui/next";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { saveInboxRoutine } from "./inbox-routine-api";
import { InboxRoutineBrief } from "./inbox-routine-brief";
import { InboxRoutineForm } from "./inbox-routine-form";
import { inboxRoutineSchema } from "./inbox-routine-schema";

/** Loads the owner's routine; failed reads never become an editable default. */
export function RoutinesWorkspace() {
	const { actions } = useInsight();
	const result = usePixel<unknown>("WorkGetInboxRoutine();");
	const parsed = inboxRoutineSchema.safeParse(result.data);
	const isLoading =
		result.status === "INITIAL" || result.status === "LOADING";
	const error =
		result.status === "ERROR"
			? result.error?.message || "Your routine could not be loaded."
			: !isLoading && !parsed.success
				? "Your routine settings could not be verified. Please try again."
				: null;
	return (
		<CollaborationPage>
			<div className="mx-auto flex max-w-5xl flex-col gap-6">
				<CollaborationPageHeader
					title="Routines"
					description="Let your assistant take care of the repeat work. Your briefs appear here."
					className="mb-0"
				/>
				{isLoading ? (
					<div className="flex flex-col gap-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-96 w-full" />
						<output className="sr-only">Loading routines…</output>
					</div>
				) : error ? (
					<Alert variant="destructive">
						<AlertTitle>Could not load routines</AlertTitle>
						<AlertDescription>
							{error}
							<Button variant="outline" onClick={result.refresh}>
								Try again
							</Button>
						</AlertDescription>
					</Alert>
				) : parsed.success ? (
					<>
						<InboxRoutineForm
							routine={parsed.data}
							onSave={async (values) => {
								const saved = await saveInboxRoutine(
									actions,
									values,
								);
								result.update(saved);
								return saved;
							}}
						/>
						<InboxRoutineBrief routine={parsed.data} />
					</>
				) : null}
			</div>
		</CollaborationPage>
	);
}
