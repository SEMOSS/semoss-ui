import type { ValidatedRoomMessage } from "@/features/messages/api/message-schemas";
/** Recorded usage is unavailable until a model reports token counts. */
export interface ThreadUsage {
	contextTokens: number | null;
	totalTokens: number | null;
}
/** Match Playground's last cumulative input plus incremental output, on the active branch. */
export function threadUsage(messages: ValidatedRoomMessage[]): ThreadUsage {
	const byId = new Map(
		messages.map((message) => [message.messageId, message]),
	);
	const seen = new Set<string>();
	let current = messages.at(-1);
	let count = 0;
	let contextTokens = 0;
	while (current && !seen.has(current.messageId) && count < 2) {
		seen.add(current.messageId);
		if (typeof current.tokens === "number" && current.tokens > 0) {
			contextTokens += current.tokens;
			count++;
		}
		current = current.parentMessageId
			? byId.get(current.parentMessageId)
			: undefined;
	}
	const recorded = messages.filter(
		(message) => typeof message.tokens === "number",
	);
	return {
		contextTokens: count ? contextTokens : null,
		totalTokens: recorded.length
			? recorded.reduce((sum, message) => sum + (message.tokens ?? 0), 0)
			: null,
	};
}
