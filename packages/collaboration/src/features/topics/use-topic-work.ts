import { useCallback, useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { useWorkUpdates } from "@/features/collaboration/live/work-updates.context";
import { changedSince } from "@/features/collaboration/live/work-updates-provider";
import type { WorkItem } from "@/features/collaboration/state/collaboration.types";
import { useCollaborationSession } from "@/features/collaboration/state/collaboration-session.context";
import { readTopic, readTopicItems, readTopicThreads } from "./api/topic-api";

interface TopicWorkState {
	items: WorkItem[];
	isLoading: boolean;
	error: string | null;
	isComplete: boolean;
	refresh: () => void;
}

const identity = (value: string): string => value;

/** Own a bounded topic read while keeping task edits and background refreshes in shared state. */
export function useTopicWork(topicId: string): TopicWorkState {
	const { actions } = useInsight();
	const { state, dispatch } = useCollaborationSession();
	const updates = useWorkUpdates();
	const latest = useRef(state);
	latest.current = state;
	const [revision, setRevision] = useState(0);
	const [read, setRead] = useState({
		requestKey: "",
		isLoading: false,
		error: null as string | null,
		isComplete: false,
	});
	const isSample =
		state.topics.find((topic) => topic.id === topicId)?.isSample === true;
	const settled = updates?.settled;
	const localId = updates?.localId ?? identity;
	const serverId = updates?.serverId ?? identity;
	const refresh = useCallback(() => setRevision((value) => value + 1), []);
	const requestKey = `${topicId}:${revision}:${updates?.lastUpdated ?? ""}`;

	useEffect(() => {
		if (!topicId || isSample) return;
		let cancelled = false;
		setRead({
			requestKey,
			isLoading: true,
			error: null,
			isComplete: false,
		});
		const read = async (): Promise<void> => {
			await settled?.();
			if (cancelled) return;
			const baseline = latest.current;
			const requestedId = serverId(topicId);
			const normalize = (items: WorkItem[]): WorkItem[] =>
				items.map((item) => ({
					...item,
					id: localId(item.id),
					topicIds: item.topicIds.map(localId),
					linkTopicId: item.linkTopicId
						? localId(item.linkTopicId)
						: null,
					assignee: item.assignee ? localId(item.assignee) : null,
				}));
			const publish = (items: WorkItem[], complete: boolean): void => {
				if (cancelled) return;
				dispatch({
					type: "topic.work.received",
					topicId,
					items: normalize(items),
					complete,
					baseline: {
						topicExists: baseline.topics.some(
							(topic) => topic.id === topicId,
						),
						items: baseline.items,
					},
					keepItemIds: changedSince(
						baseline.items,
						latest.current.items,
					),
				});
			};
			const results = await Promise.allSettled([
				readTopicItems(
					actions,
					requestedId,
					(items) => publish(items, false),
					() => cancelled,
				).then(async (items) => {
					await settled?.();
					publish(items, true);
				}),
				readTopic(actions, requestedId).then(async (topic) => {
					await settled?.();
					if (cancelled) return;
					const previousTopic = baseline.topics.find(
						(entry) => entry.id === topicId,
					);
					const currentTopic = latest.current.topics.find(
						(entry) => entry.id === topicId,
					);
					if (previousTopic && !currentTopic) return;
					dispatch({
						type: "topic.context.received",
						topicId,
						baseline: {
							topic: previousTopic ?? null,
							threads: baseline.threads,
						},
						topic: {
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
						},
						threads: [],
						// Task reads can change derived counts without changing the topic's editable details.
						keepTopic:
							Boolean(currentTopic) &&
							JSON.stringify({
								...previousTopic,
								stats: undefined,
							}) !==
								JSON.stringify({
									...currentTopic,
									stats: undefined,
								}),
					});
				}),
				readTopicThreads(actions, requestedId, () => cancelled).then(
					async (threads) => {
						await settled?.();
						if (cancelled) return;
						dispatch({
							type: "topic.context.received",
							topicId,
							completeThreads: true,
							baseline: {
								topic:
									baseline.topics.find(
										(topic) => topic.id === topicId,
									) ?? null,
								threads: baseline.threads,
							},
							threads: threads.map((thread) => ({
								...thread,
								topicLinks: thread.topicLinks.map((link) => ({
									...link,
									topicId: localId(link.topicId),
								})),
							})),
							keepThreadIds: changedSince(
								baseline.threads,
								latest.current.threads,
							),
						});
					},
				),
			]);
			if (cancelled) return;
			const errors = results.flatMap((result) =>
				result.status === "rejected"
					? [
							result.reason instanceof Error
								? result.reason.message
								: "Some topic data could not be loaded.",
						]
					: [],
			);
			setRead({
				requestKey,
				isLoading: false,
				error: errors.length ? errors.join(" ") : null,
				isComplete: errors.length === 0,
			});
		};
		void read().catch((cause: unknown) => {
			if (!cancelled)
				setRead({
					requestKey,
					isLoading: false,
					error:
						cause instanceof Error
							? cause.message
							: "Topic data could not be loaded.",
					isComplete: false,
				});
		});
		return () => {
			cancelled = true;
		};
	}, [
		actions,
		topicId,
		isSample,
		dispatch,
		settled,
		localId,
		serverId,
		requestKey,
	]);

	const isCurrent = read.requestKey === requestKey;
	return {
		items: state.items.filter(
			(item) =>
				item.topicIds.includes(topicId) || item.linkTopicId === topicId,
		),
		isLoading: !isSample && (!isCurrent || read.isLoading),
		error: isCurrent ? read.error : null,
		isComplete: isSample || (isCurrent && read.isComplete),
		refresh,
	};
}
