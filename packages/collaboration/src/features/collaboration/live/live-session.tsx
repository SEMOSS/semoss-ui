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
import type { InsightActions } from "@/lib/pixel";
import type { CollaborationState } from "../state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "../state/collaboration-session.context";
import {
	isLiveData,
	loadLiveState,
	loadThreadMessages,
	setLiveData,
} from "./live-state";
import { createLiveSync } from "./live-sync";

/** Sample fixtures by default; with live data on, loads the owner's Collaboration data first. */
export function CollaborationDataProvider({
	children,
}: {
	children: ReactNode;
}) {
	if (!isLiveData())
		return (
			<CollaborationSessionProvider>
				{children}
			</CollaborationSessionProvider>
		);
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
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							setLiveData(false);
							window.location.reload();
						}}
					>
						Use sample data
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
			<LiveThreadMessages actions={actions} />
			{children}
		</CollaborationSessionProvider>
	);
}

/** Reads message text for each open thread once; closing and reopening a thread reads it again. */
function LiveThreadMessages({ actions }: { actions: InsightActions }) {
	const { state, dispatch } = useCollaborationSession();
	const latest = useRef(state);
	latest.current = state;
	const requested = useRef(new Set<string>());
	const { openThreadIds } = state;
	useEffect(() => {
		for (const id of requested.current)
			if (!openThreadIds.includes(id)) requested.current.delete(id);
		for (const id of openThreadIds) {
			if (requested.current.has(id)) continue;
			requested.current.add(id);
			loadThreadMessages(actions, id)
				.then((attach) => {
					const thread = latest.current.threads.find(
						(candidate) => candidate.id === id,
					);
					if (thread) dispatch(attach(thread));
				})
				// no retry until the thread is reopened, so one failure shows one toast
				.catch((cause: unknown) =>
					toast.error(
						`Could not load this thread's messages: ${cause instanceof Error ? cause.message : String(cause)}`,
					),
				);
		}
	}, [actions, dispatch, openThreadIds]);
	return null;
}
