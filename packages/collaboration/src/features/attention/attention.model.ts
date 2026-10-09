import { isRequestUserInputAction, parseUserInputRequest } from "@semoss/sdk";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { selectWorkItems } from "@/features/collaboration/state/collaboration.selectors";
import type {
	CollaborationState,
	Memory,
	ReviewEntry,
	WorkItem,
} from "@/features/collaboration/state/collaboration.types";
import type { Delegation } from "@/features/delegations/api/delegations";
import type { AgentAction, AgentRun } from "@/features/rooms/api/agent-run-api";

export type Priority = NonNullable<WorkItem["priority"]>;

/** Priority labels used by pending decisions and topic tasks. */
export const ATTENTION_PRIORITIES = [
	{ id: "P0", label: "Urgent" },
	{ id: "P1", label: "High" },
	{ id: "P2", label: "Normal" },
	{ id: "P3", label: "Low" },
] as const satisfies readonly { id: Priority; label: string }[];

interface AttentionBase {
	id: string;
	title: string;
	detail: string;
	sourceLabel: string;
	topicIds: string[];
	topicStatus: "ready" | "loading" | "error";
	/** Null means no assigned priority and follows ranked tasks. */
	priority: Priority | null;
	due: string | null;
	received: string | null;
	score: number | null;
	isSample: boolean;
}

/** Retain original identities so each source keeps its own review workflow. */
export type AttentionItem = AttentionBase &
	(
		| { kind: "work"; item: WorkItem }
		| {
				kind: "action";
				action: AgentAction | null;
				run: AgentRun | null;
				delegation: Delegation | null;
		  }
		| { kind: "run"; run: AgentRun }
		| { kind: "review"; review: ReviewEntry }
		| { kind: "memory"; memory: Memory }
	);

export interface AttentionRoomAssociation {
	status: "ready" | "loading" | "error";
	threadId?: string | null;
	topicIds?: string[];
}

interface AttentionSources {
	runs: AgentRun[];
	delegations: Delegation[];
	roomSource: (roomId: string) => AttentionRoomAssociation | undefined;
	priorities?: Readonly<Record<string, Priority>>;
}

type TopicAssociation = Pick<AttentionBase, "topicIds" | "topicStatus">;

const CHANNEL_LABELS = {
	email: "Email",
	teams: "Teams",
	calendar: "Calendar",
	room: "Conversation",
	task: "Action",
} as const;

/** Structured questions use the SDK's validated display contract rather than the internal tool name. */
function actionTitle(action: AgentAction): string {
	if (
		isRequestUserInputAction({
			toolName: action.toolName ?? null,
			toolMeta: action.toolMeta,
		})
	) {
		const request = parseUserInputRequest({
			toolArgs: action.editedArgs ?? action.toolArgs ?? null,
		});
		return (
			request?.title?.trim() ||
			request?.questions[0]?.question ||
			"Your input is needed"
		);
	}
	const original = action.toolMeta?.SMSS_ORIGINAL_TOOL_NAME;
	return typeof original === "string" && original.trim()
		? original
		: action.toolName || "Review a pending action";
}

/** Resolve only explicit topic/thread links; unavailable metadata is not an unassigned topic. */
export function buildAttentionItems(
	state: CollaborationState,
	{ runs, delegations, roomSource, priorities = {} }: AttentionSources,
): AttentionItem[] {
	const threads = new Map(state.threads.map((thread) => [thread.id, thread]));
	const threadTopics = (id: string): TopicAssociation => {
		const thread = threads.get(id);
		return {
			topicIds: thread?.topicLinks.map((link) => link.topicId) ?? [],
			topicStatus: thread ? "ready" : "error",
		};
	};
	const roomTopics = (roomId?: string | null): TopicAssociation => {
		if (!roomId) return { topicIds: [], topicStatus: "ready" };
		const association = roomSource(roomId);
		return {
			topicIds: [...new Set(association?.topicIds ?? [])],
			topicStatus: association?.status ?? "loading",
		};
	};
	const items: AttentionItem[] = selectWorkItems(state, {
		view: "needs_me",
	}).items.flatMap((item) => {
		const thread = threads.get(item.threadId);
		const actor =
			state.people.find((person) => person.id === item.actorId)?.name ||
			(item.actorId === state.profile.id || item.actorId === "you"
				? "You"
				: item.actorId === "brain"
					? "Brain"
					: item.actorId === "assistant"
						? "Assistant"
						: "");
		return [
			{
				kind: "work" as const,
				id: `work:${item.id}`,
				title: item.title,
				detail:
					item.reasons.join(" · ") ||
					thread?.summary ||
					thread?.subject ||
					"",
				sourceLabel: [actor, CHANNEL_LABELS[item.channel]]
					.filter(Boolean)
					.join(" · "),
				topicIds: [
					...new Set([
						...item.topicIds,
						...(item.linkTopicId ? [item.linkTopicId] : []),
						...(thread?.topicLinks.map((link) => link.topicId) ??
							[]),
					]),
				],
				topicStatus: "ready" as const,
				priority: item.priority,
				due: item.due,
				received: item.received,
				score: item.score,
				isSample: item.isSample,
				item,
			},
		];
	});
	const actionItems = new Map<
		string,
		Extract<AttentionItem, { kind: "action" }>
	>();
	for (const run of runs) {
		if (["COMPLETED", "CANCELLED", "FAILED"].includes(run.status)) continue;
		const common = {
			detail: run.input || run.progress?.activity || "",
			sourceLabel: run.workspaceName || run.executorLabel || "Assistant",
			...roomTopics(run.roomId),
			priority: null,
			due: null,
			received: run.dateCreated ?? null,
			score: null,
			isSample: false,
		};
		for (const action of run.pendingActions) {
			const id = `action:${action.actionId}`;
			actionItems.set(id, {
				...common,
				kind: "action",
				id,
				title: actionTitle(action),
				action,
				run,
				delegation: null,
			});
		}
		if (!run.pendingActions.length && run.status === "INPUT_REQUIRED")
			items.push({
				...common,
				kind: "run",
				id: `run:${run.runId}`,
				title: run.input || "Your input is needed",
				run,
			});
	}
	for (const delegation of delegations) {
		if (delegation.status !== "PENDING") continue;
		const id = `action:${delegation.actionId}`;
		const existing = actionItems.get(id);
		actionItems.set(id, {
			kind: "action",
			id,
			title: delegation.question || "Respond to a request",
			detail: delegation.context || existing?.detail || "",
			sourceLabel:
				delegation.requesterName ||
				existing?.sourceLabel ||
				"A teammate",
			...roomTopics(delegation.roomId || existing?.run?.roomId),
			priority: null,
			due: delegation.dueAt ?? null,
			received: delegation.dateCreated ?? existing?.received ?? null,
			score: null,
			isSample: false,
			action: existing?.action ?? null,
			run: existing?.run ?? null,
			delegation,
		});
	}
	items.push(...actionItems.values());
	for (const review of state.reviews) {
		if (review.status !== "open") continue;
		const topic =
			review.kind === "add_person"
				? review.topicId
				: review.kind === "new_topic"
					? review.refId
					: undefined;
		const topics: TopicAssociation = topic
			? { topicIds: [topic], topicStatus: "ready" }
			: review.refId &&
					["topic_choice", "unassigned"].includes(review.kind)
				? threadTopics(review.refId)
				: { topicIds: [], topicStatus: "ready" };
		items.push({
			kind: "review",
			id: `review:${review.id}`,
			title: review.text,
			detail: review.detail,
			sourceLabel: "Brain",
			...topics,
			priority: null,
			due: null,
			received: review.createdAt ?? null,
			score: null,
			isSample:
				review.isSample ??
				[...state.threads, ...state.topics, ...state.people].some(
					(record) => record.id === review.refId && record.isSample,
				),
			review,
		});
	}
	for (const memory of state.memories) {
		if (memory.state !== "suggested") continue;
		const linkedThreads = new Set(
			memory.about
				.filter((ref) => ref.type === "thread")
				.map((ref) => ref.id),
		);
		if (memory.source.threadId) linkedThreads.add(memory.source.threadId);
		const associations = [...linkedThreads].map(threadTopics);
		if (memory.source.roomId && !memory.source.threadId)
			associations.push(roomTopics(memory.source.roomId));
		items.push({
			kind: "memory",
			id: `memory:${memory.id}`,
			title: memory.text,
			detail: memory.source.label || "Not used until you keep it",
			sourceLabel: "Suggested memory",
			topicIds: [
				...new Set([
					...memory.about
						.filter((ref) => ref.type === "topic")
						.map((ref) => ref.id),
					...associations.flatMap(
						(association) => association.topicIds,
					),
				]),
			],
			topicStatus: associations.some(
				(association) => association.topicStatus === "error",
			)
				? "error"
				: associations.some(
							(association) =>
								association.topicStatus === "loading",
						)
					? "loading"
					: "ready",
			priority: null,
			due: null,
			received: memory.createdAt,
			score: null,
			isSample: memory.isSample,
			memory,
		});
	}
	const loadedTopicIds = new Set(state.topics.map((topic) => topic.id));
	return items.map((item) => ({
		...item,
		topicStatus:
			item.topicStatus === "ready" &&
			item.topicIds.some((topicId) => !loadedTopicIds.has(topicId))
				? "error"
				: item.topicStatus,
		priority:
			item.kind === "work"
				? item.priority
				: (priorities[item.id] ?? null),
	}));
}

/** Missing/invalid dates are ordered predictably rather than producing NaN comparisons. */
function dateValue(value: string | null, fallback: number): number {
	const date = value ? parseTimestampWithUtcDefault(value) : null;
	return date?.isValid() ? date.valueOf() : fallback;
}

/** One immutable priority order for topic-related reviews. */
export function selectAttentionItems(
	items: AttentionItem[],
	{ topicId, search }: { topicId?: string; search?: string } = {},
): AttentionItem[] {
	const query = search?.trim().toLocaleLowerCase();
	return items
		.filter((item) => {
			if (topicId === "__none__") {
				if (item.topicStatus !== "ready" || item.topicIds.length)
					return false;
			} else if (topicId && !item.topicIds.includes(topicId))
				return false;
			return (
				!query ||
				`${item.title} ${item.detail} ${item.sourceLabel}`
					.toLocaleLowerCase()
					.includes(query)
			);
		})
		.sort(
			(first, second) =>
				(first.priority ?? "P4").localeCompare(
					second.priority ?? "P4",
				) ||
				(second.score ?? -1) - (first.score ?? -1) ||
				dateValue(second.received, -Infinity) -
					dateValue(first.received, -Infinity) ||
				first.id.localeCompare(second.id),
		);
}
