import type {
	AgentRunItem,
	AgentRunItemEvent,
	AgentRunSnapshot,
	PendingAgentAction,
	SubagentRunSummary,
} from "@semoss/sdk/react";
import type { PlaygroundMessage } from "@/api/rooms";

/**
 * Durable run record as the workbench projects it. The SDK's AgentRunSnapshot
 * only carries a subset of these fields; the rest arrive from subagent
 * summaries, the submit context, or the room's durable messages, and
 * `mergeRecord` merges defined fields only.
 */
export interface WorkbenchRunRecord {
	/** Durable id of the run. */
	runId: string;
	/** Id of the parent run when this run is a delegated subagent. */
	parentRunId?: string | null;
	/** Display alias for a subagent run. */
	alias?: string;
	/** Room the run executed against. */
	roomId?: string;
	/** Workspace the run executed under. */
	workspaceId?: string;
	/** Engine id of the model that served the run. */
	modelId?: string;
	/** Agent harness that executed the run (e.g. "semoss"). */
	harnessType?: string;
	/** Lifecycle status of the run. */
	status?: string;
	/** User prompt that started the run. */
	input?: string;
	/** Durable message id of the persisted input message. */
	inputMessageId?: string;
	/** Final assistant text produced by the run. */
	finalText?: string;
	/** Durable message id of the persisted final output message. */
	finalOutputMessageId?: string;
	/** Backend failure reason for FAILED / CANCELLED runs. */
	errorMessage?: string;
	/** When the run record was created. */
	dateCreated?: string;
	/** When the run started executing. */
	startedAt?: string;
	/** When the run reached a terminal status. */
	completedAt?: string;
	/** Actions awaiting a user decision while INPUT_REQUIRED. */
	pendingActions?: PendingAgentAction[];
	/** Job id mirroring the run id. */
	jobId?: string;
}

/**
 * Whether an agent run status ends the streaming poll loop. Treats
 * INPUT_REQUIRED as terminal because the stream stays idle until the user
 * decides on the pending action.
 *
 * @name isTerminalAgentRunStatus
 * @param status - Run status to test; compared case-insensitively.
 * @return Whether the status is COMPLETED, FAILED, CANCELLED, or
 * INPUT_REQUIRED.
 */
export const isTerminalAgentRunStatus = (status?: string): boolean => {
	const normalized = (status ?? "").trim().toUpperCase();
	return (
		normalized === "COMPLETED" ||
		normalized === "FAILED" ||
		normalized === "CANCELLED" ||
		normalized === "INPUT_REQUIRED"
	);
};

/**
 * Project a durable subagent summary into a workbench run record, collapsing
 * the summary's nullable fields to undefined. Summaries carry no alias — the
 * projection's "Subagent" fallback covers resumed children.
 *
 * @name subagentSummaryToRecord
 * @param summary - Durable subagent summary from GetSubagentRuns.
 * @return The equivalent workbench run record.
 */
export const subagentSummaryToRecord = (
	summary: SubagentRunSummary,
): WorkbenchRunRecord => ({
	runId: summary.runId,
	parentRunId: summary.parentRunId ?? undefined,
	roomId: summary.roomId,
	workspaceId: summary.workspaceId ?? undefined,
	modelId: summary.modelId ?? undefined,
	harnessType: summary.harnessType ?? undefined,
	status: summary.status,
	input: summary.input ?? undefined,
	inputMessageId: summary.inputMessageId ?? undefined,
	finalText: summary.finalText ?? undefined,
	finalOutputMessageId: summary.finalOutputMessageId ?? undefined,
	errorMessage: summary.errorMessage ?? undefined,
	dateCreated: summary.dateCreated ?? undefined,
	startedAt: summary.startedAt ?? undefined,
	completedAt: summary.completedAt ?? undefined,
	jobId: summary.jobId,
});

/** File attached to a run's input message. */
export interface BuildAttachment {
	/** Original name of the uploaded file. */
	fileName: string;
	/** Server-side path of the uploaded file. */
	fileLocation?: string;
	/** Inline base64 content when the file is not uploaded. */
	base64Data?: string;
	/** MIME type of the file. */
	mimeType?: string;
}

/** Assistant text or reasoning entry on a run's feed. */
export interface BuildMessage {
	/** Stream item id, replaced by the durable message id on completion. */
	id: string;
	/** Whether the entry is assistant text or collapsed thinking. */
	kind: "text" | "reasoning";
	/** Accumulated message text. */
	text: string;
	/** When the entry was first seen. */
	timestamp: string;
	/** True once the stream marked the message complete. */
	completed: boolean;
}

/** Tool invocation entry on a run's feed. */
export interface BuildTool {
	/** Tool call id shared by the call and its result. */
	id: string;
	/** Name of the invoked tool. */
	name: string;
	/** Display title of the tool. */
	title?: string;
	/** Description of the tool. */
	description?: string;
	/** Arguments supplied to the call. */
	arguments?: Record<string, unknown>;
	/** Tool metadata forwarded from the tool definition. */
	metadata?: Record<string, unknown>;
	/** Current lifecycle status of the call. */
	status: string;
	/** Stringified tool output once the call completes. */
	output?: string;
	/** Failure reason when the call errored. */
	error?: string;
	/** Wall-clock duration of the call in milliseconds. */
	durationMs?: number;
	/** When the call was first seen. */
	timestamp: string;
}

/** Action awaiting a user decision (approve/reject/respond). */
export type BuildPendingAction = PendingAgentAction;

/** Client-side projection of a durable agent run and its live activity. */
export interface BuildRun {
	/** Durable id of the run. */
	runId: string;
	/** Id of the parent run when this run is a delegated subagent. */
	parentRunId?: string;
	/** Room the run executed against. */
	roomId: string;
	/** Engine id of the model that served the run. */
	modelId?: string;
	/** Agent harness that executed the run (e.g. "semoss"). */
	harnessType?: string;
	/** Lifecycle status of the run. */
	status: string;
	/** User prompt that started the run. */
	input: string;
	/** Files attached to the run's input message. */
	attachments: BuildAttachment[];
	/** Final assistant text produced by the run. */
	finalText?: string;
	/** Backend failure reason for FAILED / CANCELLED runs. */
	errorMessage?: string;
	/** Durable message id of the persisted input message. */
	inputMessageId?: string;
	/** Durable message id of the persisted final output message. */
	finalOutputMessageId?: string;
	/** When the run record was created. */
	dateCreated: string;
	/** When the run started executing. */
	startedAt?: string;
	/** When the run reached a terminal status. */
	completedAt?: string;
	/** Assistant text/reasoning entries on the run's feed. */
	messages: BuildMessage[];
	/** Tool invocation entries on the run's feed. */
	tools: BuildTool[];
	/** Ids of delegated subagent runs. */
	childRunIds: string[];
	/** Display alias for a subagent run. */
	alias?: string;
	/** Short preview of a subagent's final result. */
	resultPreview?: string;
	/** Actions awaiting a user decision while INPUT_REQUIRED. */
	pendingActions: BuildPendingAction[];
	/** Count of stream events evicted before the client read them. */
	droppedEvents: number;
	/** True once the durable record has been merged over the live feed. */
	reconciled: boolean;
}

/** Single-room run store held on the workbench chat slice. */
export interface RunStore {
	/** Every known run (roots and subagents) keyed by run id. */
	runs: Record<string, BuildRun>;
	/** Ordered root run ids for the current room. */
	roomRunIds: string[];
	/** Root run currently streaming, or null when the room is idle. */
	activeRunId: string | null;
}

/**
 * Create an empty run store (no runs, no active run).
 *
 * @name createEmptyRunStore
 * @return A fresh, empty RunStore.
 */
export const createEmptyRunStore = (): RunStore => ({
	runs: {},
	roomRunIds: [],
	activeRunId: null,
});

/**
 * Current time as an ISO-8601 string.
 *
 * @name nowIso
 * @return The current instant in ISO format.
 */
const nowIso = () => new Date().toISOString();

/**
 * Normalize a backend timestamp to ISO-8601 UTC: swaps the date/time space
 * for a "T" and appends "Z" when no timezone is present.
 *
 * @name normalizeTimestamp
 * @param value - Raw timestamp string from the backend.
 * @return The normalized timestamp, or an empty string when absent.
 */
const normalizeTimestamp = (value?: string): string => {
	if (!value) return "";
	if (/[zZ]$/.test(value) || /[+-]\d{2}:?\d{2}$/.test(value)) return value;
	const normalized = value.replace(" ", "T");
	return /^\d{4}-\d{2}-\d{2}T/.test(normalized) ? `${normalized}Z` : value;
};

/**
 * Render a tool output value as display text: strings pass through, other
 * values are pretty-printed JSON (falling back to String()).
 *
 * @name stringifyOutput
 * @param value - Raw tool output of any shape.
 * @return The display string, or undefined when the value is nullish.
 */
const stringifyOutput = (value: unknown): string | undefined => {
	if (typeof value === "string") return value;
	if (value == null) return undefined;
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
};

/**
 * Create a fresh run projection from a durable record or snapshot, filling
 * client-side defaults (empty feeds, SUBMITTED status, current timestamp).
 *
 * @name createRun
 * @param record - Partial run record; only `runId` is required. May carry
 * pre-resolved input attachments.
 * @return A new BuildRun projection with empty activity feeds.
 */
export const createRun = (
	record: Partial<WorkbenchRunRecord> &
		Pick<WorkbenchRunRecord, "runId"> & {
			attachments?: BuildAttachment[];
		},
): BuildRun => ({
	runId: record.runId,
	parentRunId: record.parentRunId ?? undefined,
	roomId: record.roomId ?? "",
	modelId: record.modelId,
	harnessType: record.harnessType,
	status: record.status ?? "SUBMITTED",
	input: record.input ?? "",
	attachments: record.attachments ?? [],
	finalText: record.finalText,
	errorMessage: record.errorMessage,
	inputMessageId: record.inputMessageId,
	finalOutputMessageId: record.finalOutputMessageId,
	dateCreated: record.dateCreated ?? nowIso(),
	startedAt: record.startedAt,
	completedAt: record.completedAt,
	messages: [],
	tools: [],
	childRunIds: [],
	alias: record.alias,
	pendingActions: record.pendingActions ?? [],
	droppedEvents: 0,
	reconciled: false,
});

/**
 * Deep-enough clone of a run so ported mutation logic can run against a
 * draft without leaking mutations into the previous zustand state.
 *
 * @name cloneRun
 * @param run - Run to clone.
 * @return A copy with fresh arrays and shallow-copied entries.
 */
const cloneRun = (run: BuildRun): BuildRun => ({
	...run,
	attachments: run.attachments.map((attachment) => ({ ...attachment })),
	messages: run.messages.map((message) => ({ ...message })),
	tools: run.tools.map((tool) => ({ ...tool })),
	childRunIds: [...run.childRunIds],
	pendingActions: run.pendingActions.map((action) => ({ ...action })),
});

/**
 * Draft over a runs record: clones each run once on first touch so event
 * application can mutate freely while untouched runs keep their identity.
 *
 * @name createDraft
 * @param runs - Current runs record from the store.
 * @return A draft with the `next` record plus `get`/`set` accessors that
 * copy-on-write individual runs.
 */
const createDraft = (runs: Record<string, BuildRun>) => {
	const next: Record<string, BuildRun> = { ...runs };
	const touched = new Set<string>();

	return {
		next,
		/** Fetch a run for mutation, cloning it on first access. */
		get: (runId: string): BuildRun | undefined => {
			const run = next[runId];
			if (!run) return undefined;
			if (!touched.has(runId)) {
				next[runId] = cloneRun(run);
				touched.add(runId);
			}
			return next[runId];
		},
		/** Insert or replace a run, marking it as already touched. */
		set: (runId: string, run: BuildRun) => {
			next[runId] = run;
			touched.add(runId);
		},
	};
};

/**
 * Merge the defined fields of a durable record or snapshot into a draft run,
 * leaving fields the record omits untouched. Mutates the run in place.
 *
 * @name mergeRecord
 * @param run - Draft run to update.
 * @param record - Durable record or stream snapshot to merge in.
 */
const mergeRecord = (
	run: BuildRun,
	record: Partial<WorkbenchRunRecord>,
): void => {
	if (record.parentRunId != null) run.parentRunId = record.parentRunId;
	if (record.roomId) run.roomId = record.roomId;
	if (record.modelId) run.modelId = record.modelId;
	if (record.harnessType) run.harnessType = record.harnessType;
	if (record.status) run.status = record.status;
	if (record.input) run.input = record.input;
	if (record.finalText != null) run.finalText = record.finalText;
	if (record.errorMessage != null) run.errorMessage = record.errorMessage;
	if (record.inputMessageId) run.inputMessageId = record.inputMessageId;
	if (record.finalOutputMessageId) {
		run.finalOutputMessageId = record.finalOutputMessageId;
	}
	if (record.dateCreated) run.dateCreated = record.dateCreated;
	if (record.startedAt) run.startedAt = record.startedAt;
	if (record.completedAt) run.completedAt = record.completedAt;
	if (record.pendingActions) {
		run.pendingActions = record.pendingActions.map((action) => ({
			...action,
		}));
	}
};

/**
 * Map a stream item kind to the message feed kind.
 *
 * @name messageKind
 * @param item - Stream item being projected.
 * @return "reasoning" for reasoning items, otherwise "text".
 */
const messageKind = (
	item: Extract<AgentRunItem, { kind: "message" | "reasoning" }>,
): BuildMessage["kind"] => (item.kind === "reasoning" ? "reasoning" : "text");

/**
 * Insert or update a message on a draft run's feed. On completion the entry
 * adopts the durable message id and any stream-id duplicate is dropped.
 * Mutates the run in place.
 *
 * @name upsertMessage
 * @param run - Draft run whose feed to update.
 * @param item - Stream item carrying the message text.
 * @param timestamp - Event timestamp used for new entries.
 * @param completed - Whether the event marked the message complete.
 */
const upsertMessage = (
	run: BuildRun,
	item: Extract<AgentRunItem, { kind: "message" | "reasoning" }>,
	timestamp: string,
	completed: boolean,
): void => {
	const durableId =
		completed && item.kind === "message" ? item.messageId : undefined;
	const text = item.kind === "message" ? item.text : item.summary;
	const existing = run.messages.find(
		(message) =>
			message.id === item.id ||
			(durableId != null && message.id === durableId),
	);
	if (existing) {
		if (text != null) existing.text = text;
		existing.completed = completed || existing.completed;
		if (durableId) {
			existing.id = durableId;
			run.messages = run.messages.filter(
				(message) => message === existing || message.id !== durableId,
			);
		}
		return;
	}
	run.messages.push({
		id: durableId ?? item.id,
		kind: messageKind(item),
		text: text ?? "",
		timestamp,
		completed,
	});
};

/**
 * Insert or update a tool entry on a draft run's feed, preferring fields
 * from the incoming item and falling back to the existing entry. Mutates the
 * run in place.
 *
 * @name upsertTool
 * @param run - Draft run whose feed to update.
 * @param item - Stream item carrying the tool call state.
 * @param timestamp - Event timestamp used when the entry is new.
 */
const upsertTool = (
	run: BuildRun,
	item: Extract<AgentRunItem, { kind: "tool" }>,
	timestamp: string,
): void => {
	const existing = run.tools.find((tool) => tool.id === item.id);
	const next: BuildTool = {
		id: item.id,
		name: item.name ?? existing?.name ?? "Tool",
		title: existing?.title,
		description: existing?.description,
		arguments: item.arguments ?? existing?.arguments,
		metadata: item.metadata ?? existing?.metadata,
		status: item.status ?? existing?.status ?? "QUEUED",
		output: item.output ?? existing?.output,
		error: item.error ?? existing?.error,
		durationMs: item.durationMs ?? existing?.durationMs,
		timestamp: existing?.timestamp || timestamp || nowIso(),
	};
	if (existing) {
		Object.assign(existing, next);
	} else {
		run.tools.push(next);
	}
};

/**
 * Ensure a subagent stream item has a child run projection: creates it when
 * missing, refreshes its status/alias/preview, and links it to the parent.
 *
 * @name ensureChild
 * @param draft - Copy-on-write draft over the runs record.
 * @param parent - Draft parent run that emitted the subagent item.
 * @param item - Subagent stream item.
 * @param timestamp - Event timestamp used when the child is new.
 */
const ensureChild = (
	draft: ReturnType<typeof createDraft>,
	parent: BuildRun,
	item: Extract<AgentRunItem, { kind: "subagent" }>,
	timestamp: string,
): void => {
	const childRunId = item.childRunId ?? item.id;
	let child = draft.get(childRunId);
	if (!child) {
		child = createRun({
			runId: childRunId,
			parentRunId: parent.runId,
			roomId: item.roomId ?? "",
			status: item.status ?? "SUBMITTED",
			dateCreated: timestamp,
		});
		draft.set(childRunId, child);
	}
	child.parentRunId = parent.runId;
	child.alias = item.alias ?? child.alias;
	child.roomId = item.roomId ?? child.roomId;
	child.status = item.status ?? child.status;
	child.resultPreview = item.resultPreview ?? child.resultPreview;
	child.errorMessage = item.error ?? child.errorMessage;
	if (!parent.childRunIds.includes(childRunId)) {
		parent.childRunIds.push(childRunId);
	}
};

/**
 * Copy the whitelisted tool fields off an untyped update patch. Mutates the
 * tool in place; unknown or wrongly-typed patch keys are ignored.
 *
 * @name applyToolPatch
 * @param tool - Tool entry to update.
 * @param patch - Untyped field patch from an item.updated event.
 */
const applyToolPatch = (
	tool: BuildTool,
	patch: Record<string, unknown>,
): void => {
	if (typeof patch.name === "string") tool.name = patch.name;
	if (typeof patch.status === "string") tool.status = patch.status;
	if (typeof patch.output === "string") tool.output = patch.output;
	if (typeof patch.error === "string") tool.error = patch.error;
	if (typeof patch.durationMs === "number")
		tool.durationMs = patch.durationMs;
	if (patch.arguments && typeof patch.arguments === "object") {
		tool.arguments = patch.arguments as Record<string, unknown>;
	}
	if (patch.metadata && typeof patch.metadata === "object") {
		tool.metadata = patch.metadata as Record<string, unknown>;
	}
};

/**
 * Apply one stream event to a draft run. Unlike agent47's canonical store,
 * `reasoning` items are KEPT (as `kind: "reasoning"` messages) so the UI can
 * render collapsed thinking blocks.
 *
 * @name applyEvent
 * @param draft - Copy-on-write draft over the runs record (for subagents).
 * @param run - Draft run the event belongs to.
 * @param event - Stream event (item started/updated/completed) to apply.
 */
const applyEvent = (
	draft: ReturnType<typeof createDraft>,
	run: BuildRun,
	event: AgentRunItemEvent,
): void => {
	if (event.type === "item.updated") {
		if (event.kind === "message" || event.kind === "reasoning") {
			const existing = run.messages.find(
				(message) => message.id === event.itemId,
			);
			if (existing && event.delta) {
				existing.text += event.delta;
			}
			return;
		}
		if (event.kind === "tool") {
			const existing = run.tools.find((tool) => tool.id === event.itemId);
			if (existing && event.patch) {
				applyToolPatch(existing, event.patch);
			}
			return;
		}
		if (event.kind === "subagent") {
			const child = event.itemId ? draft.get(event.itemId) : undefined;
			if (child && event.patch) {
				if (typeof event.patch.status === "string") {
					child.status = event.patch.status;
				}
				if (typeof event.patch.resultPreview === "string") {
					child.resultPreview = event.patch.resultPreview;
				}
				if (typeof event.patch.error === "string") {
					child.errorMessage = event.patch.error;
				}
			}
		}
		return;
	}

	const item = event.item;
	if (!item) return;
	if (item.kind === "message" || item.kind === "reasoning") {
		upsertMessage(
			run,
			item,
			event.timestamp,
			event.type === "item.completed",
		);
	} else if (item.kind === "tool") {
		upsertTool(run, item, event.timestamp);
	} else if (item.kind === "subagent") {
		ensureChild(draft, run, item, event.timestamp);
	}
};

/**
 * Register a freshly submitted run and mark it active.
 *
 * @name startRun
 * @param store - Current run store.
 * @param payload - New run details: runId, roomId, input prompt, optional
 * attachments, model/harness ids, and initial status.
 * @return The next run store with the run added and set active.
 */
export const startRun = (
	store: RunStore,
	payload: {
		runId: string;
		roomId: string;
		input: string;
		attachments?: BuildAttachment[];
		modelId?: string;
		harnessType?: string;
		status?: string;
	},
): RunStore => {
	const run = createRun({ ...payload, dateCreated: nowIso() });
	return {
		runs: { ...store.runs, [run.runId]: run },
		roomRunIds: store.roomRunIds.includes(run.runId)
			? store.roomRunIds
			: [...store.roomRunIds, run.runId],
		activeRunId: run.runId,
	};
};

/**
 * Merge one streaming poll (snapshot + events) into the store, clearing the
 * active run when it reaches a terminal status.
 *
 * @name applyStreamBatch
 * @param store - Current run store.
 * @param payload - Poll result: runId, run snapshot, new events, and the
 * dropped-event count.
 * @return The next run store with the batch applied.
 */
export const applyStreamBatch = (
	store: RunStore,
	payload: {
		runId: string;
		snapshot: AgentRunSnapshot;
		events: AgentRunItemEvent[];
		droppedEvents?: number;
	},
): RunStore => {
	const draft = createDraft(store.runs);
	let run = draft.get(payload.runId);
	if (!run) {
		run = createRun(payload.snapshot);
		draft.set(payload.runId, run);
	}
	mergeRecord(run, payload.snapshot);
	for (const event of payload.events) {
		applyEvent(draft, run, event);
	}
	run.droppedEvents += payload.droppedEvents ?? 0;

	const clearActive =
		isTerminalAgentRunStatus(run.status) && store.activeRunId === run.runId;

	return {
		runs: draft.next,
		roomRunIds: store.roomRunIds,
		activeRunId: clearActive ? null : store.activeRunId,
	};
};

/**
 * Merge a durable GetAgentRun record (and projected activity) into the
 * store, clearing the active run when it reaches a terminal status.
 *
 * @name mergeDurableRun
 * @param store - Current run store.
 * @param payload - Durable record plus optional projected messages, tools,
 * child run ids, alias, result preview, and reconciled flag.
 * @return The next run store with the durable state merged in.
 */
export const mergeDurableRun = (
	store: RunStore,
	payload: {
		record: WorkbenchRunRecord;
		messages?: BuildMessage[];
		tools?: BuildTool[];
		childRunIds?: string[];
		alias?: string;
		resultPreview?: string;
		reconciled?: boolean;
	},
): RunStore => {
	const draft = createDraft(store.runs);
	let run = draft.get(payload.record.runId);
	if (!run) {
		run = createRun(payload.record);
		draft.set(payload.record.runId, run);
	} else {
		mergeRecord(run, payload.record);
	}
	if (payload.messages) {
		run.messages = mergeLoadedMessages(run.messages, payload.messages);
	}
	if (payload.tools) {
		run.tools = mergeLoadedTools(run.tools, payload.tools);
	}
	if (payload.childRunIds) {
		run.childRunIds = Array.from(
			new Set([...run.childRunIds, ...payload.childRunIds]),
		);
	}
	if (payload.alias) run.alias = payload.alias;
	if (payload.resultPreview) run.resultPreview = payload.resultPreview;
	if (payload.reconciled != null) run.reconciled = payload.reconciled;

	const clearActive =
		isTerminalAgentRunStatus(run.status) && store.activeRunId === run.runId;

	return {
		runs: draft.next,
		roomRunIds: store.roomRunIds,
		activeRunId: clearActive ? null : store.activeRunId,
	};
};

/**
 * Rank a tool status by lifecycle progress so merges keep the most advanced
 * state (terminal > INPUT_REQUIRED > RUNNING > QUEUED).
 *
 * @name toolStatusRank
 * @param status - Tool status; compared case-insensitively.
 * @return The rank, 0 (queued/unknown) through 3 (terminal).
 */
const toolStatusRank = (status: string): number => {
	switch (status.toUpperCase()) {
		case "QUEUED":
			return 0;
		case "RUNNING":
			return 1;
		case "INPUT_REQUIRED":
			return 2;
		case "COMPLETED":
		case "FAILED":
		case "CANCELLED":
			return 3;
		default:
			return 0;
	}
};

/**
 * Merge durably loaded messages into the current feed by id, keeping the
 * longer text and the completed flag when both sides know a message.
 *
 * @name mergeLoadedMessages
 * @param current - Messages already on the run's feed.
 * @param loaded - Messages projected from durable storage.
 * @return A new merged message list.
 */
const mergeLoadedMessages = (
	current: BuildMessage[],
	loaded: BuildMessage[],
): BuildMessage[] => {
	const merged = current.map((message) => ({ ...message }));
	for (const message of loaded) {
		const existing = merged.find(
			(candidate) => candidate.id === message.id,
		);
		if (!existing) {
			merged.push({ ...message });
			continue;
		}
		if (message.text.length > existing.text.length) {
			existing.text = message.text;
		}
		existing.completed = existing.completed || message.completed;
	}
	return merged;
};

/**
 * Merge durably loaded tools into the current feed by id, letting a loaded
 * entry overwrite only when its status is at least as advanced.
 *
 * @name mergeLoadedTools
 * @param current - Tools already on the run's feed.
 * @param loaded - Tools projected from durable storage.
 * @return A new merged tool list.
 */
const mergeLoadedTools = (
	current: BuildTool[],
	loaded: BuildTool[],
): BuildTool[] => {
	const merged = current.map((tool) => ({ ...tool }));
	for (const tool of loaded) {
		const existing = merged.find((candidate) => candidate.id === tool.id);
		if (!existing) {
			merged.push({ ...tool });
			continue;
		}
		if (toolStatusRank(tool.status) >= toolStatusRank(existing.status)) {
			Object.assign(existing, tool);
		}
	}
	return merged;
};

/**
 * Replace the room's run set with a durable projection, merging into any
 * runs a live watcher has already accumulated newer activity for.
 *
 * @name setRoomRuns
 * @param store - Current run store.
 * @param payload - Room id plus the projected runs and ordered root run ids.
 * @return The next run store; the first nonterminal root becomes active.
 */
export const setRoomRuns = (
	store: RunStore,
	payload: { roomId: string; runs: BuildRun[]; roomRunIds: string[] },
): RunStore => {
	const nextRuns = { ...store.runs };
	for (const run of payload.runs) {
		const loadedRun = {
			...cloneRun(run),
			roomId: run.roomId || payload.roomId,
		};
		const current = nextRuns[run.runId];
		if (current) {
			const merged = cloneRun(current);
			const messages = mergeLoadedMessages(
				merged.messages,
				loadedRun.messages,
			);
			const tools = mergeLoadedTools(merged.tools, loadedRun.tools);
			const childRunIds = Array.from(
				new Set([...merged.childRunIds, ...loadedRun.childRunIds]),
			);
			const attachments = loadedRun.attachments.length
				? loadedRun.attachments
				: merged.attachments;
			const droppedEvents = Math.max(
				merged.droppedEvents,
				loadedRun.droppedEvents,
			);
			const reconciled = merged.reconciled || loadedRun.reconciled;
			Object.assign(merged, loadedRun);
			merged.messages = messages;
			merged.tools = tools;
			merged.childRunIds = childRunIds;
			merged.attachments = attachments;
			merged.droppedEvents = droppedEvents;
			merged.reconciled = reconciled;
			nextRuns[run.runId] = merged;
		} else {
			nextRuns[run.runId] = loadedRun;
		}
	}

	const activeRunId =
		payload.roomRunIds.find((runId) => {
			const run = nextRuns[runId];
			return run && !isTerminalAgentRunStatus(run.status);
		}) ?? null;

	return { runs: nextRuns, roomRunIds: payload.roomRunIds, activeRunId };
};

/**
 * Project a durable record into a fresh (already reconciled) run with
 * normalized timestamps and a COMPLETED status fallback.
 *
 * @name createBuildRunFromRecord
 * @param record - Durable run record to project.
 * @return A new BuildRun marked `reconciled: true`.
 */
export const createBuildRunFromRecord = (
	record: WorkbenchRunRecord,
): BuildRun => ({
	...createRun({
		...record,
		status: record.status ?? "COMPLETED",
		dateCreated: normalizeTimestamp(record.dateCreated),
		startedAt: normalizeTimestamp(record.startedAt) || undefined,
		completedAt: normalizeTimestamp(record.completedAt) || undefined,
	}),
	reconciled: true,
});

/**
 * Insert or overwrite a durably loaded tool entry by id. Mutates the list in
 * place.
 *
 * @name upsertDurableTool
 * @param tools - Tool list to update.
 * @param next - Tool entry projected from a durable message part.
 */
const upsertDurableTool = (tools: BuildTool[], next: BuildTool): void => {
	const existing = tools.find((tool) => tool.id === next.id);
	if (existing) Object.assign(existing, next);
	else tools.push(next);
};

/**
 * Attach durable playground message parts (text, media, tool calls/results,
 * thinking) to the runs they belong to. Mutates the provided runs in place —
 * callers pass freshly created projections.
 *
 * @name attachDurableMessages
 * @param runs - Run projections keyed by run id; parts are attached to the
 * run tagged in each message's ornaments (or inferred via tool call ids).
 * @param messages - Durable playground messages to project.
 */
export const attachDurableMessages = (
	runs: Record<string, BuildRun>,
	messages: PlaygroundMessage[],
): void => {
	for (const message of messages) {
		const timestamp = normalizeTimestamp(message.dateCreated);
		for (const [partIndex, part] of (message.parts ?? []).entries()) {
			const taggedRunId = message.ornaments?.agentRunId;
			const inferredRun =
				part.type === "TOOL_RESULT" && part.toolResult?.toolCallId
					? Object.values(runs).find((candidate) =>
							candidate.tools.some(
								(tool) =>
									tool.id === part.toolResult?.toolCallId,
							),
						)
					: undefined;
			const run = taggedRunId ? runs[taggedRunId] : inferredRun;
			if (!run) continue;
			const runId = run.runId;

			if (
				part.type === "MEDIA" &&
				message.io === "INPUT" &&
				part.mediaInfo
			) {
				const attachment = part.mediaInfo;
				const key = attachment.fileLocation ?? attachment.fileName;
				if (
					attachment.fileName &&
					!run.attachments.some(
						(existing) =>
							(existing.fileLocation ?? existing.fileName) ===
							key,
					)
				) {
					run.attachments.push(attachment);
				}
				continue;
			}

			if (
				part.type === "TEXT" &&
				message.io === "OUTPUT" &&
				part.text?.trim()
			) {
				const durableMessage: BuildMessage = {
					id: message.messageId ?? `${runId}:message:${partIndex}`,
					kind: "text",
					text: part.text,
					timestamp,
					completed: true,
				};
				if (
					!run.messages.some((item) => item.id === durableMessage.id)
				) {
					run.messages.push(durableMessage);
				}
				continue;
			}

			if (
				part.type === "THINKING" &&
				message.io === "OUTPUT" &&
				part.thinking?.trim()
			) {
				const durableMessage: BuildMessage = {
					id: `${message.messageId ?? runId}:thinking:${partIndex}`,
					kind: "reasoning",
					text: part.thinking,
					timestamp,
					completed: true,
				};
				if (
					!run.messages.some((item) => item.id === durableMessage.id)
				) {
					run.messages.push(durableMessage);
				}
				continue;
			}

			if (part.type === "TOOL_CALL" && part.toolCall) {
				const id =
					part.toolCall.id ??
					`${message.messageId ?? runId}:tool:${partIndex}`;
				upsertDurableTool(run.tools, {
					id,
					name:
						part.toolCall.original_name ??
						part.toolCall.name ??
						"Tool",
					title: part.toolCall.title,
					description: part.toolCall.description,
					arguments: part.toolCall.arguments,
					status: "QUEUED",
					timestamp,
				});
				continue;
			}

			if (part.type === "TOOL_RESULT" && part.toolResult) {
				const id =
					part.toolResult.toolCallId ??
					`${message.messageId ?? runId}:result:${partIndex}`;
				const status = part.toolResult.toolStatus ?? "COMPLETED";
				upsertDurableTool(run.tools, {
					id,
					name:
						part.toolResult.toolName ??
						run.tools.find((tool) => tool.id === id)?.name ??
						"Tool",
					arguments:
						run.tools.find((tool) => tool.id === id)?.arguments ??
						part.toolResult.toolParameterValues,
					status,
					output: stringifyOutput(part.toolResult.output),
					timestamp,
				});
			}
		}
	}
};

/**
 * Project a room's durable records + messages into a full run set: root runs
 * in record order, children sorted by creation date under their parents, and
 * message parts attached to their runs.
 *
 * @name projectDurableRoom
 * @param params - The room's root run `records`, its durable playground
 * `messages`, and `childrenByParent` mapping root run ids to child records.
 * @return The projected runs plus the ordered root run ids.
 */
export const projectDurableRoom = ({
	records,
	messages,
	childrenByParent,
}: {
	records: WorkbenchRunRecord[];
	messages: PlaygroundMessage[];
	childrenByParent: Record<string, WorkbenchRunRecord[]>;
}): { runs: BuildRun[]; roomRunIds: string[] } => {
	const runs: Record<string, BuildRun> = {};
	const roomRunIds: string[] = [];

	for (const record of records) {
		const run = createBuildRunFromRecord(record);
		runs[run.runId] = run;
		roomRunIds.push(run.runId);
	}

	for (const parentRunId of roomRunIds) {
		const children = [...(childrenByParent[parentRunId] ?? [])].sort(
			(a, b) =>
				String(a.dateCreated ?? "").localeCompare(
					String(b.dateCreated ?? ""),
				),
		);
		for (const record of children) {
			const child = createBuildRunFromRecord(record);
			child.parentRunId = parentRunId;
			child.alias = record.alias || "Subagent";
			child.resultPreview = child.resultPreview ?? record.finalText;
			runs[child.runId] = child;
			runs[parentRunId].childRunIds.push(child.runId);
		}
	}

	attachDurableMessages(runs, messages);
	return { runs: Object.values(runs), roomRunIds };
};
