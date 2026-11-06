import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import type { InsightActions } from "@/lib/pixel";
import type { Topic } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	type MailCheck,
	type MailSyncResult,
	readMailCheck,
	readTopic,
	readWorkUpdates,
	syncMail,
} from "./live-state";
import type { LiveSync } from "./live-sync";
import {
	announceSync,
	claimSync,
	noteSyncStarted,
	onSyncElsewhere,
	sharedLastAttempt,
} from "./shared-sync";
import { WorkUpdatesContext } from "./work-updates.context";

const SENT_SYNC_DELAY_MS = 5000;
// while a sync or its summaries run elsewhere, how often to ask whether they moved on
const WATCH_MS = 4000;
// coming back to the tab re-reads, but not again within this long
const FOCUS_REREAD_MS = 15_000;
const MAIL_CHECK_MS = 60_000;
const CLOCK_CHECK_MS = 15_000;
// a quiet sync (nothing in, nothing closed) skips the full reload, but changes made elsewhere
// (an agent, another tab's edits) still show within this long
const FULL_READ_MAX_AGE_MS = 5 * 60_000;
// a tab return re-reads everything only when this is the last full read's age (or another tab brought mail in)
const RETURN_FULL_READ_MS = 60_000;

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
	// a reload asked for while one is in flight runs right after it
	const queued = useRef(false);
	const syncing = useRef(false);
	// the session load this provider starts from is a full read
	const lastFullRead = useRef(Date.now());
	// another tab brought mail in while this one was hidden
	const stale = useRef(false);
	const hasConnectedMail = state.sources.some(
		(source) =>
			source.id === "email" &&
			source.status === "connected" &&
			!source.isSample,
	);
	const generation = useRef(0);
	const refresh = useCallback(() => {
		if (pending.current) {
			queued.current = true;
			return;
		}
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
							about: memory.about.map((ref) =>
								ref.type === "topic"
									? { ...ref, id: localId(ref.id) }
									: ref,
							),
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
				lastFullRead.current = Date.now();
				stale.current = false;
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
	const refreshTopic = useCallback(
		(topic: { topicId?: string; topic?: string }) => {
			const token = generation.current;
			const before = latest.current.topics;
			void (async () => {
				await sync?.settled();
				const incoming = await readTopic(actions, topic);
				await sync?.settled();
				if (token !== generation.current) return;
				const id = sync?.localId(incoming.id) ?? incoming.id;
				// once: not over the page's copy, and not back after the owner deleted it during the read
				const known = (topics: Topic[]) =>
					topics.some((entry) => entry.id === id);
				if (!known(before) && !known(latest.current.topics))
					dispatch({
						type: "topic.server",
						topic: { ...incoming, id },
					});
			})()
				// a call that failed left no topic to show
				.catch(() => undefined)
				.finally(() => {
					if (token !== generation.current) return;
					// its emails come back on the threads; a reload already running read them too early
					refreshRef.current();
				});
		},
		[actions, dispatch, sync],
	);
	const serverId = useCallback(
		async (id: string): Promise<string> => {
			await sync?.settled();
			return sync?.serverId(id) ?? id;
		},
		[sync],
	);
	const localId = useCallback(
		(id: string): string => sync?.localId(id) ?? id,
		[sync],
	);
	/**
	 * The Refresh button: pull new mail from Microsoft 365 first, then reload Brain and Work. An automatic sync
	 * that brought nothing in only re-reads the sync time, and other tabs hear about it instead of syncing too.
	 */
	const syncNow = useCallback(
		(options?: { automatic?: boolean }) => {
			if (syncing.current) return;
			const automatic = options?.automatic === true;
			const token = generation.current;
			syncing.current = true;
			noteSyncStarted();
			setMail((current) => ({
				...current,
				isSyncing: true,
				syncError: "",
			}));
			syncMail(actions)
				.then(async (result) => {
					if (token !== generation.current) return;
					setMail({
						isSyncing: false,
						lastSync: result,
						syncError: "",
					});
					const quiet =
						result.newMessages === 0 &&
						result.closedByReply === 0 &&
						Object.values(result.outcomes).every((count) => !count);
					if (
						automatic &&
						quiet &&
						Date.now() - lastFullRead.current < FULL_READ_MAX_AGE_MS
					) {
						const lastMailCheck = await readMailCheck(
							actions,
						).catch(() => null);
						if (token !== generation.current) return;
						if (lastMailCheck)
							setStatus((current) => ({
								...current,
								lastMailCheck,
							}));
						announceSync({ quiet: true, lastMailCheck });
						return;
					}
					announceSync({ quiet, lastMailCheck: null });
					refreshRef.current();
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
		},
		[actions],
	);
	// a sync another tab ran: take its time, and reload when it brought something in or this tab's last full read is old
	useEffect(
		() =>
			onSyncElsewhere((done) => {
				if (done.lastMailCheck) {
					const lastMailCheck = done.lastMailCheck;
					setStatus((current) => ({ ...current, lastMailCheck }));
				}
				if (done.quiet) {
					// a quiet sync reloads nothing, so this tab keeps its own full-read age
					if (
						document.visibilityState === "visible" &&
						Date.now() - lastFullRead.current >=
							FULL_READ_MAX_AGE_MS
					)
						refreshRef.current();
					return;
				}
				if (document.visibilityState === "visible") {
					refreshRef.current();
				} else stale.current = true;
			}),
		[],
	);
	// a reply sent from the app reaches Sent Items a moment later; sync it in so the card it answered closes
	useEffect(() => {
		let timer: number | undefined;
		const onSent = () => {
			window.clearTimeout(timer);
			timer = window.setTimeout(
				() => syncNow({ automatic: true }),
				SENT_SYNC_DELAY_MS,
			);
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
		// Graph cannot notify local servers and Teams has no push; keep views current while visible.
		// The clock is shared: whichever visible tab claims it syncs, the rest hear the result.
		const checkMail = () => {
			// a tab still syncing must not claim the minute: the claim would push the clock and block every tab
			if (
				!hasConnectedMail ||
				syncing.current ||
				document.visibilityState !== "visible" ||
				Date.now() - sharedLastAttempt() < MAIL_CHECK_MS
			)
				return false;
			void claimSync(MAIL_CHECK_MS).then((won) => {
				if (won) syncNow({ automatic: true });
			});
			return true;
		};
		const check = () => {
			if (
				document.visibilityState !== "visible" ||
				Date.now() - lastRead.current < FOCUS_REREAD_MS
			)
				return;
			lastRead.current = Date.now();
			if (checkMail()) return;
			if (
				stale.current ||
				Date.now() - lastFullRead.current >= RETURN_FULL_READ_MS
			)
				refresh();
		};
		const initialCheck = window.setTimeout(checkMail, 0);
		// a local check, no server call: catches the shared minute soon after another tab's lapses
		const timer = hasConnectedMail
			? window.setInterval(checkMail, CLOCK_CHECK_MS)
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
		},
		[actions],
	);
	return (
		<WorkUpdatesContext.Provider
			value={{
				...status,
				...mail,
				refresh,
				refreshTopic,
				syncMail: syncNow,
				serverId,
				localId,
			}}
		>
			{children}
		</WorkUpdatesContext.Provider>
	);
}
