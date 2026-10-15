import { callPixel, type InsightActions, pixel } from "@/lib/pixel";
import { roomOptionsEnvelopeSchema } from "./room-schemas";

interface WaitForGeneratedRoomNameOptions {
	signal?: AbortSignal;
	maxAttempts?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
}

function wait(delayMs: number, signal?: AbortSignal): Promise<void> {
	if (delayMs <= 0) return Promise.resolve();
	return new Promise((resolve, reject) => {
		const timer = window.setTimeout(() => {
			signal?.removeEventListener("abort", handleAbort);
			resolve();
		}, delayMs);
		function handleAbort() {
			window.clearTimeout(timer);
			reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
		}
		signal?.addEventListener("abort", handleAbort, { once: true });
	});
}

/** Poll the room metadata while RunAgent's background namer does its work. */
export async function waitForGeneratedRoomName(
	actions: InsightActions,
	roomId: string,
	options: WaitForGeneratedRoomNameOptions = {},
): Promise<string | null> {
	const {
		signal,
		maxAttempts = 10,
		initialDelayMs = 500,
		maxDelayMs = 5_000,
	} = options;
	let lastError: unknown;

	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		signal?.throwIfAborted();
		try {
			const envelope = await callPixel(
				actions,
				pixel("GetRoomOptions", { roomId }),
				roomOptionsEnvelopeSchema,
			);
			const name = envelope.ROOM_NAME?.trim();
			if (name) return name;
			lastError = undefined;
		} catch (cause) {
			lastError = cause;
		}
		if (attempt < maxAttempts - 1) {
			const delayMs = Math.min(initialDelayMs * 2 ** attempt, maxDelayMs);
			await wait(delayMs, signal);
		}
	}

	if (lastError) throw lastError;
	return null;
}
