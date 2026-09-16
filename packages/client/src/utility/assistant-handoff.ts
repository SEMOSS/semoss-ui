/** Key prefix for handoff records parked in localStorage. */
const STORAGE_PREFIX = "semoss-assistant-handoff--";

/**
 * Handoffs older than this are swept. A navigation takes milliseconds, so
 * anything this old belongs to a flow the user abandoned.
 */
const TTL_MS = 5 * 60 * 1000;

/** Query-param name carrying the handoff id to the destination workbench. */
export const ASSISTANT_HANDOFF_PARAM = "assistantHandoff";

/**
 * An agent run started on one page, handed to the workbench that should
 * display it. The run is already executing by the time this is read — the
 * workbench adopts its room and reattaches to its stream rather than sending
 * anything itself.
 */
export interface AssistantHandoff {
	/** The prompt the run was started with, for the timeline's input row. */
	prompt: string;
	/** Room the run is writing its messages to. */
	roomId: string;
	/** The in-flight run to reattach to. */
	runId: string;
}

/** The stored shape: a handoff plus when it was parked. */
interface StoredHandoff extends AssistantHandoff {
	createdAt?: number;
}

/**
 * Handoffs already read in this page load. Without this, React's StrictMode
 * double-invoke (or any remount) would have the second read find nothing,
 * because the first one deleted the record. A real reload clears this map,
 * which is what keeps a handoff genuinely single-use.
 */
const readCache = new Map<string, AssistantHandoff>();

/**
 * Drop handoff records past their TTL. Keeps an abandoned flow — created, never
 * navigated to — from accumulating in the user's storage.
 *
 * @name sweepExpired
 */
const sweepExpired = (): void => {
	const stale: string[] = [];

	for (let index = 0; index < window.localStorage.length; index++) {
		const key = window.localStorage.key(index);
		if (!key?.startsWith(STORAGE_PREFIX)) {
			continue;
		}

		try {
			const raw = window.localStorage.getItem(key);
			const parsed = raw ? (JSON.parse(raw) as StoredHandoff) : null;
			if (!parsed || Date.now() - (parsed.createdAt ?? 0) > TTL_MS) {
				stale.push(key);
			}
		} catch {
			// Unparseable records are stale by definition.
			stale.push(key);
		}
	}

	for (const key of stale) {
		window.localStorage.removeItem(key);
	}
};

/**
 * Park a running agent for whichever workbench the caller is about to navigate
 * to.
 *
 * The payload goes to localStorage rather than the URL for two reasons: a
 * prompt can be long, and a prompt in the URL ends up in browser history and
 * in any link the user shares. Only the opaque id travels in the query string.
 *
 * @name storeAssistantHandoff
 * @param handoff - The room, run and prompt to carry over.
 * @return The id to put in the URL, or an empty string when storage is
 * unavailable (private browsing, quota) — the caller should still navigate.
 */
export const storeAssistantHandoff = (handoff: AssistantHandoff): string => {
	const id = crypto.randomUUID();

	try {
		sweepExpired();
		const stored: StoredHandoff = { ...handoff, createdAt: Date.now() };
		window.localStorage.setItem(
			`${STORAGE_PREFIX}${id}`,
			JSON.stringify(stored),
		);
	} catch (error) {
		console.error(error);
		return "";
	}

	return id;
};

/**
 * Read a handoff and delete it. The record is removed *before* it is parsed, so
 * a corrupt one cannot be re-read on every mount.
 *
 * @name takeAssistantHandoff
 * @param id - Handoff id from the URL, or null.
 * @return The handoff, or null when it is absent, expired or malformed.
 */
export const takeAssistantHandoff = (
	id: string | null,
): AssistantHandoff | null => {
	if (!id) {
		return null;
	}

	const cached = readCache.get(id);
	if (cached) {
		return cached;
	}

	let raw: string | null = null;
	try {
		raw = window.localStorage.getItem(`${STORAGE_PREFIX}${id}`);
		window.localStorage.removeItem(`${STORAGE_PREFIX}${id}`);
	} catch (error) {
		console.error(error);
		return null;
	}

	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as StoredHandoff;
		if (
			typeof parsed.prompt !== "string" ||
			!parsed.prompt.trim() ||
			typeof parsed.roomId !== "string" ||
			!parsed.roomId ||
			typeof parsed.runId !== "string" ||
			!parsed.runId ||
			Date.now() - (parsed.createdAt ?? 0) > TTL_MS
		) {
			return null;
		}

		const handoff: AssistantHandoff = {
			prompt: parsed.prompt,
			roomId: parsed.roomId,
			runId: parsed.runId,
		};
		readCache.set(id, handoff);
		return handoff;
	} catch (error) {
		console.error(error);
		return null;
	}
};
