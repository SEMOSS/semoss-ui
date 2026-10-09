import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useInsight } from "@semoss/sdk/react";
import { Button, toast } from "@semoss/ui/next";
import type { CollaborationState } from "../state/collaboration.types";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { loadLiveState } from "./live-state";
import { createLiveSync } from "./live-sync";
import { ThreadHistoryProvider } from "./thread-history-provider";
import { ThreadInsightsProvider } from "./thread-insights-provider";
import { WorkUpdatesProvider } from "./work-updates-provider";

/** Loads the owner's Collaboration data before rendering the app. */
export function CollaborationDataProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { insightId } = useInsight();
	return (
		<LiveSessionProvider key={insightId}>{children}</LiveSessionProvider>
	);
}

function LiveSessionProvider({ children }: { children: ReactNode }) {
	const { actions } = useInsight();
	const [state, setState] = useState<CollaborationState | null>(null);
	const request = useRef(0);
	const [error, setError] = useState<string | null>(null);
	const load = useCallback(() => {
		const token = ++request.current;
		setState(null);
		setError(null);
		loadLiveState(actions, () => token === request.current)
			.then((value) => {
				if (token === request.current) setState(value);
			})
			.catch((cause: unknown) => {
				if (token === request.current)
					setError(
						cause instanceof Error ? cause.message : String(cause),
					);
			});
	}, [actions]);
	useEffect(() => {
		load();
		return () => {
			request.current++;
		};
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
				Loading your workspace…
			</div>
		);
	return (
		<CollaborationSessionProvider initialState={state} onChange={sync}>
			<WorkUpdatesProvider actions={actions} sync={sync}>
				<ThreadHistoryProvider actions={actions}>
					<ThreadInsightsProvider actions={actions} sync={sync}>
						{children}
					</ThreadInsightsProvider>
				</ThreadHistoryProvider>
			</WorkUpdatesProvider>
		</CollaborationSessionProvider>
	);
}
