import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useInsight } from "@semoss/sdk/react";
import { Button, toast } from "@semoss/ui/next";
import type { CollaborationState } from "../state/collaboration.types";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { loadLiveState } from "./live-state";
import { createLiveSync } from "./live-sync";
import { ThreadHistoryProvider } from "./thread-history-provider";

/** Loads the owner's Collaboration data before rendering the app. */
export function CollaborationDataProvider({
	children,
}: {
	children: ReactNode;
}) {
	return <LiveSessionProvider>{children}</LiveSessionProvider>;
}

function LiveSessionProvider({ children }: { children: ReactNode }) {
	const { actions } = useInsight();
	const [state, setState] = useState<CollaborationState | null>(null);
	const [error, setError] = useState<string | null>(null);
	const load = useCallback(() => {
		setError(null);
		loadLiveState(actions)
			.then(setState)
			.catch((cause: unknown) =>
				setError(
					cause instanceof Error ? cause.message : String(cause),
				),
			);
	}, [actions]);
	useEffect(() => {
		load();
	}, [load]);
	// the page and the server can disagree after a failed save, so offer a reload
	const sync = useMemo(
		() =>
			createLiveSync(actions, (message) =>
				toast.error(`Could not save: ${message}`, {
					action: {
						label: "Reload",
						onClick: () => window.location.reload(),
					},
				}),
			),
		[actions],
	);

	if (error)
		return (
			<div className="mx-auto max-w-lg space-y-3 p-8 text-sm">
				<p className="font-medium">
					Could not load your Collaboration data.
				</p>
				<p className="text-muted-foreground">{error}</p>
				<div className="flex gap-2">
					<Button size="sm" onClick={load}>
						Retry
					</Button>
				</div>
			</div>
		);
	if (!state)
		return (
			<div className="p-8 text-muted-foreground text-sm">
				Loading your Brain and Work data...
			</div>
		);
	return (
		<CollaborationSessionProvider initialState={state} onChange={sync}>
			<ThreadHistoryProvider actions={actions}>
				{children}
			</ThreadHistoryProvider>
		</CollaborationSessionProvider>
	);
}
