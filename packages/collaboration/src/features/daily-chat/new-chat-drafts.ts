import {
	createRoomSession,
	type RoomSession,
} from "@/features/rooms/room-session";

interface NewChatDraft {
	id: string;
	session: RoomSession;
	startedRoomId: string;
	initialize: () => Promise<void>;
}

const MAX_RETAINED_DRAFTS = 20;
const drafts = new Map<string, NewChatDraft>();

/** Retain local welcome-page drafts across Brief navigation within one app session. */
export function getNewChatDraft(
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
		// Allocated rooms belong to the shared room registry after navigation.
		if (!candidate.session.getSnapshot().roomId) {
			if (!candidate.session.canEvict({ discardDraft: true })) continue;
			candidate.session.dispose();
		}
		drafts.delete(candidateKey);
	}
	return draft;
}
