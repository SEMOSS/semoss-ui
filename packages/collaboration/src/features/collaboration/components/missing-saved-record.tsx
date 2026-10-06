import { useEffect, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { loadSearchRecord, type SearchKind } from "../api/collaboration-search";
import { useCollaborationSession } from "../state/collaboration-session.context";

/** Fetches an owned route record, with explicit failure and retry states. */
export function MissingSavedRecord({
	kind,
	id,
}: {
	kind: SearchKind;
	id: string;
}) {
	const { actions } = useInsight();
	const { dispatch } = useCollaborationSession();
	const [error, setError] = useState<string | null>(null);
	const [attempt, setAttempt] = useState(0);
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt intentionally restarts the failed read on Retry.
	useEffect(() => {
		let active = true;
		loadSearchRecord(actions, kind, id)
			.then((command) => {
				if (active) dispatch(command);
			})
			.catch((cause: unknown) => {
				if (active)
					setError(
						cause instanceof Error
							? cause.message
							: "Could not load this record.",
					);
			});
		return () => {
			active = false;
		};
	}, [actions, dispatch, kind, id, attempt]);
	if (error)
		return (
			<Alert variant="destructive" className="m-4 w-auto">
				<AlertDescription>
					Could not open this {kind}. {error}
					<Button
						variant="outline"
						onClick={() => {
							setError(null);
							setAttempt((value) => value + 1);
						}}
					>
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		);
	return (
		<output className="p-6 text-muted-foreground">Loading {kind}…</output>
	);
}
