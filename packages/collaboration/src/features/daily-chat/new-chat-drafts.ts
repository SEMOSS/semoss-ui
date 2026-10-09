import {
	createRoomSession,
	type RoomSession,
} from "@/features/rooms/room-session";

export interface NewChatDraft {
	id: string;
	session: RoomSession;
	startedRoomId: string;
	pendingSubmission: Promise<void> | null;
	initialize: () => Promise<void>;
}

const MAX_RETAINED_DRAFTS = 20;
const drafts = new Map<string, NewChatDraft>();
const historyDrafts = new Map<
	string,
	{ scope: string; id: string; isLanding: boolean }
>();
const listeners = new Set<() => void>();
let lifecycleVersion = 0;

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

/** Keep each browser history entry attached to its own bounded in-memory draft. */
export function getHistoryChatDraft(
	scope: string,
	entryKey: string,
	isLanding: boolean,
	requestedId: string,
	prompt: string,
	search: string,
): NewChatDraft {
	const historyKey = `${scope}:${isLanding ? "landing" : "new"}:${entryKey}`;
	let id =
		historyDrafts.get(historyKey)?.id ??
		(/^[a-f0-9-]{36}$/.test(requestedId)
			? requestedId
			: crypto.randomUUID());
	if (isLanding && drafts.get(`${scope}:${id}`)?.startedRoomId)
		id = crypto.randomUUID();
	historyDrafts.delete(historyKey);
	historyDrafts.set(historyKey, { scope, id, isLanding });
	for (const [key, entry] of historyDrafts) {
		if (historyDrafts.size <= MAX_RETAINED_DRAFTS * 2) break;
		const snapshot = drafts
			.get(`${entry.scope}:${entry.id}`)
			?.session.getSnapshot();
		if (
			key === historyKey ||
			snapshot?.contextFiles.length ||
			snapshot?.composerDraft.files.length
		)
			continue;
		historyDrafts.delete(key);
	}
	return getNewChatDraft(scope, id, prompt, search);
}

/** A started draft belongs to its conversation; every landing alias becomes fresh. */
export function markNewChatDraftStarted(
	scope: string,
	draft: NewChatDraft,
	roomId: string,
): void {
	draft.startedRoomId = roomId;
	for (const [key, entry] of historyDrafts) {
		if (entry.scope === scope && entry.id === draft.id && entry.isLanding)
			historyDrafts.delete(key);
	}
	lifecycleVersion++;
	for (const listener of listeners) listener();
}

/** Retain local drafts across navigation within one account's app session. */
function getNewChatDraft(
	scope: string,
	id: string,
	prompt: string,
	search = "",
): NewChatDraft {
	const key = `${scope}:${id}`;
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
		if (candidate === draft) continue;
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
