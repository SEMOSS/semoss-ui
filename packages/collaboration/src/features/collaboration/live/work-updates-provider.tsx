import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { MAIL_SENT_EVENT } from "@/features/connectors/api/microsoft";
import { ROOM_TREE_CHANGED } from "@/features/room-tree/room-tree-events";
import type { InsightActions } from "@/lib/pixel";
import type { Thread } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";
import {
	type MailCheck,
	type MailSyncResult,
	type PendingReviewCoverage,
	readWorkUpdates,
	syncMail,
} from "./live-state";
import type { LiveSync } from "./live-sync";
import { WorkUpdatesContext } from "./work-updates.context";

const SENT_SYNC_DELAY_MS = 5000;

/** Ids of records edited locally between two snapshots (or created locally since the first). */
export function changedSince<T extends { id: string }>(
	before: T[],
	now: T[],
): string[] {
	const prior = new Map(
		before.map((record) => [record.id, JSON.stringify(record)]),
	);
	return now
		.filter((record) => prior.get(record.id) !== JSON.stringify(record))
		.map((record) => record.id);
}

/** Compare only saved identities and associations that can change the room tree. */
function roomTreeMappingSignature(threads: Thread[]): string {
	return JSON.stringify(
		threads
			.filter((thread) => thread.roomId || thread.topicLinks.length)
			.sort((left, right) => left.id.localeCompare(right.id))
			.map((thread) => [
				thread.id,
				thread.roomId,
				thread.topicLinks.map((link) => link.topicId).sort(),
			]),
	);
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
		pendingCoverage: null as PendingReviewCoverage | null,
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
	const generation = useRef(0);
	const savedRoomMappings = useRef<string | null>(null);
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
			.then(async ({ lastMailCheck, pendingCoverage, ...updates }) => {
				await sync?.settled();
				if (token !== generation.current) return;
				const localId = sync?.localId ?? ((id: string) => id);
				// A saved deletion during this read must not be resurrected by its older response.
				const removed = (
					key: "memories" | "reviews" | "topics" | "people",
				): Set<string> => {
					const currentIds = new Set(
						latest.current[key].map((record) => record.id),
					);
					return new Set(
						requestedState[key]
							.filter((record) => !currentIds.has(record.id))
							.map((record) => record.id),
					);
				};
				const removedMemoryIds = removed("memories");
				const removedReviewIds = removed("reviews");
				const removedTopicIds = removed("topics");
				const removedPersonIds = removed("people");
				const threads = updates.threads.map((thread) => ({
					...thread,
					topicLinks: thread.topicLinks.map((link) => ({
						...link,
						topicId: localId(link.topicId),
					})),
				}));
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
									linkTopicId: step.linkTopicId
										? localId(step.linkTopicId)
										: undefined,
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
						threads,
						workspaces,
						items: updates.items.map((item) => ({
							...item,
							id: localId(item.id),
							topicIds: item.topicIds.map(localId),
						})),
						memories: updates.memories
							.map((memory) => ({
								...memory,
								id: localId(memory.id),
								about: memory.about.map((ref) => ({
									...ref,
									id: localId(ref.id),
								})),
								replacesId: memory.replacesId
									? localId(memory.replacesId)
									: null,
							}))
							.filter(
								(memory) => !removedMemoryIds.has(memory.id),
							),
						reviews: updates.reviews
							?.map((review) => ({
								...review,
								id: localId(review.id),
								refId: review.refId
									? localId(review.refId)
									: null,
								topicId: review.topicId
									? localId(review.topicId)
									: undefined,
							}))
							.filter(
								(review) => !removedReviewIds.has(review.id),
							),
						topics: updates.topics
							?.map((topic) => ({
								...topic,
								id: localId(topic.id),
								goals: topic.goals.map((goal) => ({
									...goal,
									noteId: localId(goal.noteId),
								})),
								people: topic.people.map((person) => ({
									...person,
									personId: localId(person.personId),
								})),
							}))
							.filter((topic) => !removedTopicIds.has(topic.id)),
						people: updates.people
							?.map((person) => ({
								...person,
								id: localId(person.id),
							}))
							.filter(
								(person) => !removedPersonIds.has(person.id),
							),
						keepItemIds: changedSince(
							requestedState.items,
							latest.current.items,
						),
						keepMemoryIds: changedSince(
							requestedState.memories,
							latest.current.memories,
						),
						keepReviewIds: changedSince(
							requestedState.reviews,
							latest.current.reviews,
						),
						keepTopicIds: changedSince(
							requestedState.topics,
							latest.current.topics,
						),
						keepPersonIds: changedSince(
							requestedState.people,
							latest.current.people,
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
				const mappings = roomTreeMappingSignature(threads);
				const previousMappings =
					savedRoomMappings.current ??
					roomTreeMappingSignature(requestedState.threads);
				savedRoomMappings.current = mappings;
				if (mappings !== previousMappings)
					window.dispatchEvent(new Event(ROOM_TREE_CHANGED));
				setStatus({
					isRefreshing: false,
					lastUpdated: new Date().toISOString(),
					lastMailCheck,
					pendingCoverage: pendingCoverage ?? null,
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
	/** The Refresh button: pull new mail from Microsoft 365 first, then reload Brain and Work. */
	const syncNow = useCallback(() => {
		if (syncing.current) return;
		const token = generation.current;
		syncing.current = true;
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
			queued.current = false;
			syncing.current = false;
			window.clearInterval(timer);
			window.removeEventListener("focus", check);
			document.removeEventListener("visibilitychange", check);
		};
	}, [refresh]);
	return (
		<WorkUpdatesContext.Provider
			value={{ ...status, ...mail, refresh, syncMail: syncNow }}
		>
			{children}
		</WorkUpdatesContext.Provider>
	);
}
