import {
	createRoomSession,
	type RoomSession,
} from "@/features/rooms/room-session";

export interface NewChatDraft {
	id: string;
	topicId: string;
	session: RoomSession;
	startedRoomId: string;
	pendingSubmission: Promise<void> | null;
	initialize: () => Promise<void>;
}

const MAX_RETAINED_DRAFTS = 20;
const drafts = new Map<string, NewChatDraft>();
const historyDrafts = new Map<
	string,
	{ scope: string; id: string; isLanding: boolean; topicId: string }
>();
const listeners = new Set<() => void>();
let lifecycleVersion = 0;

function publishDrafts(): void {
	lifecycleVersion++;
	for (const listener of listeners) listener();
}

/** Observe first-send handoffs even when allocation finishes under another route. */
export function subscribeNewChatDrafts(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/** Stable external-store revision for a draft's navigation handoff. */
export function getNewChatDraftVersion(): number {
	return lifecycleVersion;
}

/** Keep every mounted draft busy through allocation, topic linking, and submission. */
export function setNewChatDraftSubmission(
	draft: NewChatDraft,
	submission: Promise<void> | null,
): void {
	draft.pendingSubmission = submission;
	publishDrafts();
}

/** Keep each browser history entry attached to its own bounded in-memory draft. */
export function getHistoryChatDraft(
	scope: string,
	entryKey: string,
	isLanding: boolean,
	requestedId: string,
	prompt: string,
	search: string,
	topicId = "",
): NewChatDraft {
	const historyKey = JSON.stringify([scope, topicId, isLanding, entryKey]);
	let id =
		historyDrafts.get(historyKey)?.id ??
		(!topicId && /^[a-f0-9-]{36}$/.test(requestedId)
			? requestedId
			: crypto.randomUUID());
	if (
		isLanding &&
		drafts.get(JSON.stringify([scope, topicId, id]))?.startedRoomId
	)
		id = crypto.randomUUID();
	historyDrafts.delete(historyKey);
	historyDrafts.set(historyKey, { scope, id, isLanding, topicId });
	for (const [key, entry] of historyDrafts) {
		if (historyDrafts.size <= MAX_RETAINED_DRAFTS * 2) break;
		const draft = drafts.get(
			JSON.stringify([entry.scope, entry.topicId, entry.id]),
		);
		const snapshot = draft?.session.getSnapshot();
		if (
			key === historyKey ||
			draft?.pendingSubmission ||
			snapshot?.contextFiles.length ||
			snapshot?.composerDraft.files.length
		)
			continue;
		historyDrafts.delete(key);
	}
	return getNewChatDraft(scope, id, prompt, search, topicId);
}

/** A started draft belongs to its conversation; every landing alias becomes fresh. */
export function markNewChatDraftStarted(
	scope: string,
	draft: NewChatDraft,
	roomId: string,
): void {
	draft.startedRoomId = roomId;
	for (const [key, entry] of historyDrafts) {
		if (
			entry.scope === scope &&
			entry.id === draft.id &&
			entry.topicId === draft.topicId &&
			entry.isLanding
		)
			historyDrafts.delete(key);
	}
	publishDrafts();
}

/** Retain local drafts across navigation within one account's app session. */
function getNewChatDraft(
	scope: string,
	id: string,
	prompt: string,
	search = "",
	topicId = "",
): NewChatDraft {
	const key = JSON.stringify([scope, topicId, id]);
	const existing = drafts.get(key);
	if (existing) {
		drafts.delete(key);
		drafts.set(key, existing);
		return existing;
	}
	const session = createRoomSession(scope);
	if (prompt)
		session.setComposerDraft({ document: null, text: prompt, files: [] });
	let initializing: Promise<void> | null = null;
	let hasSeededSettings = false;
	const draft: NewChatDraft = {
		id,
		topicId,
		session,
		startedRoomId: "",
		pendingSubmission: null,
		initialize: () => {
			if (initializing) return initializing;
			initializing = (async () => {
				await session.initialize();
				const snapshot = session.getSnapshot();
				if (!snapshot.isReady || hasSeededSettings) return;
				hasSeededSettings = true;
				const preferences = new URLSearchParams(search);
				const agentId = preferences.get("agentId");
				const modelId = preferences.get("model");
				if (agentId || modelId)
					await session.saveSettings("New chat", {
						...snapshot.settings,
						...(agentId ? { agentId } : {}),
						...(modelId ? { modelId } : {}),
					});
			})().finally(() => {
				initializing = null;
			});
			return initializing;
		},
	};
	drafts.set(key, draft);
	for (const [candidateKey, candidate] of drafts) {
		if (candidate === draft || candidate.pendingSubmission) continue;
		if (
			candidate.session.scope === scope &&
			drafts.size <= MAX_RETAINED_DRAFTS
		)
			continue;
		const snapshot = candidate.session.getSnapshot();
		if (snapshot.contextFiles.length || snapshot.composerDraft.files.length)
			continue;
		// Allocated rooms belong to the shared room registry after navigation.
		if (!snapshot.roomId) {
			if (!candidate.session.canEvict({ discardDraft: true })) continue;
			candidate.session.dispose();
		}
		drafts.delete(candidateKey);
	}
	return draft;
}
