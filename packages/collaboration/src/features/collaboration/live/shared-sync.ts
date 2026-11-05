import type { MailCheck } from "./live-state";

// Every open Collaboration tab shares one mail/Teams sync clock: one sync a minute for the browser, not per tab.
const LAST_ATTEMPT_KEY = "collaboration:last-mail-attempt";
const CHANNEL = "collaboration:sync";

export interface SyncDone {
	type: "synced";
	/** Nothing came in, nothing closed: other tabs need no reload. */
	quiet: boolean;
	lastMailCheck: MailCheck | null;
}

/** When any tab last started a sync, in ms; 0 when unknown. */
export function sharedLastAttempt(): number {
	try {
		return Number(window.localStorage.getItem(LAST_ATTEMPT_KEY)) || 0;
	} catch {
		return 0;
	}
}

function markAttempt(at: number): void {
	try {
		window.localStorage.setItem(LAST_ATTEMPT_KEY, String(at));
	} catch {
		// storage off (private mode): each tab keeps its own clock
	}
}

/** Record a sync this tab starts regardless of the clock (the Refresh button). */
export function noteSyncStarted(): void {
	markAttempt(Date.now());
}

/**
 * Claim the next sync when no tab started one within gapMs. A Web Lock makes the check and the write one step,
 * so two tabs waking together do not both sync.
 */
export async function claimSync(gapMs: number): Promise<boolean> {
	const claim = () => {
		const now = Date.now();
		if (now - sharedLastAttempt() < gapMs) return false;
		markAttempt(now);
		return true;
	};
	if (!navigator.locks) return claim();
	return navigator.locks.request(
		LAST_ATTEMPT_KEY,
		{ ifAvailable: true },
		(lock) => (lock ? claim() : false),
	);
}

let channel: BroadcastChannel | null | undefined;
function openChannel(): BroadcastChannel | null {
	if (channel === undefined)
		channel =
			typeof BroadcastChannel === "undefined"
				? null
				: new BroadcastChannel(CHANNEL);
	return channel;
}

/** Tell the other tabs a sync finished. */
export function announceSync(done: Omit<SyncDone, "type">): void {
	openChannel()?.postMessage({ type: "synced", ...done } satisfies SyncDone);
}

/** Hear syncs other tabs finish; returns the unsubscribe. */
export function onSyncElsewhere(
	listener: (done: SyncDone) => void,
): () => void {
	const open = openChannel();
	if (!open) return () => undefined;
	const handle = (event: MessageEvent) => {
		if (event.data?.type === "synced") listener(event.data as SyncDone);
	};
	open.addEventListener("message", handle);
	return () => open.removeEventListener("message", handle);
}
