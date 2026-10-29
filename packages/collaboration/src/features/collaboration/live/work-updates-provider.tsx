import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import type { InsightActions } from "@/lib/pixel";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	type MailCheck,
	type MailSyncResult,
	readMailCheck,
	readTopicGoals,
	readWorkUpdates,
	syncMail,
} from "./live-state";
import type { LiveSync } from "./live-sync";
import { WorkUpdatesContext } from "./work-updates.context";

const SENT_SYNC_DELAY_MS = 5000;
// while a sync or its summaries run elsewhere, how often to ask whether they moved on
const WATCH_MS = 4000;
// coming back to the tab re-reads, but not again within this long
const FOCUS_REREAD_MS = 15_000;
const MAIL_CHECK_MS = 60_000;

/** Ids of records edited locally between two snapshots (or created locally since the first). */
export function changedSince<T extends { id: string }>(before: T[], now: T[]) {
	const prior = new Map(
		before.map((record) => [record.id, JSON.stringify(record)]),
	);
	return now
		.filter((record) => prior.get(record.id) !== JSON.stringify(record))
		.map((record) => record.id);
}

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
		lastMailCheck: null as MailCheck | null,
		error: "",
	});
	const [mail, setMail] = useState({
		isSyncing: false,
		lastSync: null as MailSyncResult | null,
		syncError: "",
	});
	const pending = useRef(false);
	// a reload asked for while one is in flight (a finished sync) runs right after it
	const queued = useRef(false);
	const syncing = useRef(false);
	const lastMailAttempt = useRef(0);
	const hasConnectedMail = state.sources.some(
		(source) =>
			source.id === "email" &&
			source.status === "connected" &&
			!source.isSample,
	);
	const generation = useRef(0);
	const refreshTopicGoal = useCallback(
		(topic: { topicId?: string; topic?: string }, noteId: string) => {
			const token = generation.current;
			const before = latest.current.topics;
			void (async () => {
				await sync?.settled();
				const incoming = await readTopicGoals(actions, topic);
				await sync?.settled();
				if (token !== generation.current) return;
				const localId = sync?.localId ?? ((id: string) => id);
				const topicId = localId(incoming.id);
				const goal = incoming.goals.find(
					(entry) => entry.noteId === noteId,
				);
				if (!goal) return;
				const goalId = localId(goal.noteId);
				dispatch({
					type: "topic.goal.server",
					topicId,
					before: before
						.find((entry) => entry.id === topicId)
						?.goals.find((entry) => entry.noteId === goalId),
					goal: { ...goal, noteId: goalId },
				});
			})().catch((cause: unknown) => {
				if (token === generation.current)
					setStatus((current) => ({
						...current,
						error:
							cause instanceof Error
								? cause.message
								: "Topic goals could not be refreshed.",
					}));
			});
		},
		[actions, dispatch, sync],
	);
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
			.then(async ({ lastMailCheck, ...updates }) => {
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
						// links to a topic made on this page come back with its server id
						threads: updates.threads.map((thread) => ({
							...thread,
							topicLinks: thread.topicLinks.map((link) => ({
								...link,
								topicId: localId(link.topicId),
							})),
						})),
						items: updates.items.map((item) => ({
							...item,
							id: localId(item.id),
							topicIds: item.topicIds.map(localId),
						})),
						memories: updates.memories.map((memory) => ({
							...memory,
							id: localId(memory.id),
						})),
						keepItemIds: changedSince(
							requestedState.items,
							latest.current.items,
						),
						keepMemoryIds: changedSince(
							requestedState.memories,
							latest.current.memories,
						),
						keepThreadIds: changedSince(
							requestedState.threads,
							latest.current.threads,
						),
						keepStepIds: Object.entries(
							latest.current.workspaces,
						).flatMap(([id, workspace]) =>
							changedSince(
								requestedState.workspaces[id]?.steps ?? [],
								workspace.steps,
							),
						),
					},
				});
				setStatus({
					isRefreshing: false,
					lastUpdated: new Date().toISOString(),
					lastMailCheck,
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
				if (token !== generation.current) return;
				pending.current = false;
				if (queued.current) {
					queued.current = false;
					refreshRef.current();
				}
			});
	}, [actions, dispatch, sync]);
	const refreshRef = useRef(refresh);
	refreshRef.current = refresh;
	const serverId = useCallback(
		async (id: string): Promise<string> => {
			await sync?.settled();
			return sync?.serverId(id) ?? id;
		},
		[sync],
	);
	/** The Refresh button: pull new mail from Microsoft 365 first, then reload Brain and Work. */
	const syncNow = useCallback(() => {
		if (syncing.current) return;
		const token = generation.current;
		syncing.current = true;
		lastMailAttempt.current = Date.now();
		setMail((current) => ({ ...current, isSyncing: true, syncError: "" }));
		syncMail(actions)
			.then((result) => {
				if (token !== generation.current) return;
				setMail({ isSyncing: false, lastSync: result, syncError: "" });
				if (pending.current) queued.current = true;
				else refreshRef.current();
			})
			.catch((cause: unknown) => {
				if (token !== generation.current) return;
				setMail((current) => ({
					...current,
					isSyncing: false,
					syncError:
						cause instanceof Error
							? cause.message
							: "New mail could not be checked.",
				}));
			})
			.finally(() => {
				if (token === generation.current) syncing.current = false;
			});
	}, [actions]);
	// a reply sent from the app reaches Sent Items a moment later; sync it in so the card it answered closes
	useEffect(() => {
		let timer: number | undefined;
		const onSent = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(syncNow, SENT_SYNC_DELAY_MS);
		};
		window.addEventListener(MAIL_SENT_EVENT, onSent);
		return () => {
			window.clearTimeout(timer);
			window.removeEventListener(MAIL_SENT_EVENT, onSent);
		};
	}, [syncNow]);
	// the session load has the data but not when mail was last checked
	useEffect(() => {
		let cancelled = false;
		readMailCheck(actions)
			.then((lastMailCheck) => {
				if (!cancelled)
					setStatus((current) =>
						current.lastMailCheck
							? current
							: { ...current, lastMailCheck },
					);
			})
			.catch(() => undefined);
		return () => {
			cancelled = true;
		};
	}, [actions]);
	// Follow a running sync and its summaries with a cheap job check.
	const watched = status.lastMailCheck;
	useEffect(() => {
		if (
			mail.isSyncing ||
			!watched ||
			(watched.status !== "running" && !watched.insightsPending)
		)
			return;
		let cancelled = false;
		let timer: number | undefined;
		const poll = () => {
			timer = window.setTimeout(async () => {
				if (document.visibilityState === "hidden") return poll();
				try {
					const next = await readMailCheck(actions);
					if (cancelled) return;
					if (
						next?.status !== watched.status ||
						next.insightsPending !== watched.insightsPending
					)
						refreshRef.current();
					else poll();
				} catch {
					if (!cancelled) poll();
				}
			}, WATCH_MS);
		};
		poll();
		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [actions, watched, mail.isSyncing]);
	const lastRead = useRef(0);
	useEffect(() => {
		// Graph cannot notify local servers; keep all Collaboration views current while visible.
		const checkMail = () => {
			if (
				!hasConnectedMail ||
				document.visibilityState !== "visible" ||
				Date.now() - lastMailAttempt.current < MAIL_CHECK_MS
			)
				return false;
			syncNow();
			return true;
		};
		const check = () => {
			if (
				document.visibilityState !== "visible" ||
				Date.now() - lastRead.current < FOCUS_REREAD_MS
			)
				return;
			lastRead.current = Date.now();
			if (!checkMail()) refresh();
		};
		const initialCheck = window.setTimeout(checkMail, 0);
		const timer = hasConnectedMail
			? window.setInterval(checkMail, MAIL_CHECK_MS)
			: undefined;
		window.addEventListener("focus", check);
		document.addEventListener("visibilitychange", check);
		return () => {
			window.clearTimeout(initialCheck);
			window.clearInterval(timer);
			window.removeEventListener("focus", check);
			document.removeEventListener("visibilitychange", check);
		};
	}, [refresh, syncNow, hasConnectedMail]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: Changing the insight invalidates its pending requests.
	useEffect(
		() => () => {
			generation.current += 1;
			pending.current = false;
			queued.current = false;
			syncing.current = false;
			lastMailAttempt.current = 0;
		},
		[actions],
	);
	return (
		<WorkUpdatesContext.Provider
			value={{
				...status,
				...mail,
				refresh,
				refreshTopicGoal,
				syncMail: syncNow,
				serverId,
			}}
		>
			{children}
		</WorkUpdatesContext.Provider>
	);
}
