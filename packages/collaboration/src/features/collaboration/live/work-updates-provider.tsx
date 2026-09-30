import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { InsightActions } from "@/lib/pixel";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { readWorkUpdates } from "./live-state";
import type { LiveSync } from "./live-sync";
import { WorkUpdatesContext } from "./work-updates.context";

/** One visible-page refresh owner updates data without replacing mounted editors. */
export function WorkUpdatesProvider({
	actions,
	sync,
	children,
}: {
	actions: InsightActions;
	sync?: LiveSync;
	children: ReactNode;
}) {
	const { dispatch, state } = useCollaborationSession();
	const latest = useRef(state);
	latest.current = state;
	const [status, setStatus] = useState({
		isRefreshing: false,
		lastUpdated: null as string | null,
		error: "",
	});
	const pending = useRef(false);
	const generation = useRef(0);
	const refresh = useCallback(() => {
		if (pending.current) return;
		const token = generation.current;
		const requestedState = latest.current;
		pending.current = true;
		setStatus((current) => ({ ...current, isRefreshing: true }));
		void (async () => {
			await sync?.settled();
			return readWorkUpdates(actions);
		})()
			.then(async (updates) => {
				await sync?.settled();
				if (token !== generation.current) return;
				const localId = sync?.localId ?? ((id: string) => id);
				const workspaces = Object.fromEntries(
					Object.entries(updates.workspaces).map(
						([id, workspace]) => {
							const before = new Set(
								requestedState.workspaces[id]?.steps.map(
									(step) => step.id,
								),
							);
							const current = new Set(
								latest.current.workspaces[id]?.steps.map(
									(step) => step.id,
								),
							);
							const steps = workspace.steps
								.map((step) => ({
									...step,
									id: localId(step.id),
									...(step.itemId
										? { itemId: localId(step.itemId) }
										: {}),
								}))
								.filter(
									(step) =>
										!before.has(step.id) ||
										current.has(step.id),
								);
							return [id, { ...workspace, steps }];
						},
					),
				);
				dispatch({
					type: "live.refresh",
					updates: {
						...updates,
						workspaces,
						items: updates.items.map((item) => ({
							...item,
							id: localId(item.id),
						})),
					},
				});
				setStatus({
					isRefreshing: false,
					lastUpdated: new Date().toISOString(),
					error: "",
				});
			})
			.catch((cause: unknown) => {
				if (token === generation.current)
					setStatus((current) => ({
						...current,
						isRefreshing: false,
						error:
							cause instanceof Error
								? cause.message
								: "Updates are unavailable.",
					}));
			})
			.finally(() => {
				if (token === generation.current) pending.current = false;
			});
	}, [actions, dispatch, sync]);
	useEffect(() => {
		const check = () => {
			if (document.visibilityState === "visible") refresh();
		};
		const timer = window.setInterval(check, 30_000);
		window.addEventListener("focus", check);
		document.addEventListener("visibilitychange", check);
		return () => {
			generation.current += 1;
			pending.current = false;
			window.clearInterval(timer);
			window.removeEventListener("focus", check);
			document.removeEventListener("visibilitychange", check);
		};
	}, [refresh]);
	return (
		<WorkUpdatesContext.Provider value={{ ...status, refresh }}>
			{children}
		</WorkUpdatesContext.Provider>
	);
}
