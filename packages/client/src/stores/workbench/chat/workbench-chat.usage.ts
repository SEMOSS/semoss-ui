import type { PlaygroundMessage } from "@/api/rooms";

/** Aggregated room token usage shown by the composer's context chip. */
export type RoomUsageStats = {
	/** Tokens in the model's current context window. */
	contextTokens: number;
	/** Total tokens across every message in the room. */
	totalTokens: number;
	/** Total tokens served from prompt cache reads. */
	cacheReadTokens: number;
	/** Total tokens spent creating prompt cache entries. */
	cacheCreationTokens: number;
	/** Total tokens spent on extended thinking. */
	thinkingTokens: number;
	/** Number of messages in the room. */
	messageCount: number;
};

/**
 * Coerce a raw token count into a usable number.
 *
 * @name tokenValue
 * @param value - Raw token count of unknown type.
 * @return The value when it is a finite positive number, otherwise 0.
 */
const tokenValue = (value: unknown): number =>
	typeof value === "number" && Number.isFinite(value) && value > 0
		? value
		: 0;

/**
 * Find the most recent leaf of the message tree — the latest message no
 * other message claims as parent — falling back to the last message.
 *
 * @name getLatestLeaf
 * @param messages - Room messages, oldest first.
 * @return The latest leaf message, or null when the room is empty.
 */
const getLatestLeaf = (
	messages: PlaygroundMessage[],
): PlaygroundMessage | null => {
	const idsWithChildren = new Set(
		messages
			.map((message) => message.parentMessageId)
			.filter((id): id is string => Boolean(id)),
	);

	return (
		[...messages]
			.reverse()
			.find(
				(message) =>
					Boolean(message.messageId) &&
					!idsWithChildren.has(message.messageId as string),
			) ??
		messages.at(-1) ??
		null
	);
};

/**
 * Mirrors Playground's room token counters using the durable message tree:
 * current context walks the parent chain from the latest leaf until two
 * non-zero token counts are seen; the remaining stats sum over all messages.
 *
 * @name calculateRoomUsage
 * @param messages - Room messages, oldest first.
 * @return The aggregated usage stats for the room.
 */
export const calculateRoomUsage = (
	messages: PlaygroundMessage[],
): RoomUsageStats => {
	const byId = new Map(
		messages
			.filter((message) => message.messageId)
			.map((message) => [message.messageId as string, message]),
	);

	let current = getLatestLeaf(messages);
	let contextTokens = 0;
	let nonZeroMessages = 0;
	const visited = new Set<string>();

	while (current && nonZeroMessages < 2) {
		const tokens = tokenValue(current.tokens);
		if (tokens > 0) {
			contextTokens += tokens;
			nonZeroMessages += 1;
		}

		const currentId = current.messageId;
		if (currentId) {
			if (visited.has(currentId)) break;
			visited.add(currentId);
		}
		current = current.parentMessageId
			? (byId.get(current.parentMessageId) ?? null)
			: null;
	}

	return messages.reduce<RoomUsageStats>(
		(usage, message) => ({
			contextTokens: usage.contextTokens,
			totalTokens: usage.totalTokens + tokenValue(message.tokens),
			cacheReadTokens:
				usage.cacheReadTokens + tokenValue(message.cacheReadTokens),
			cacheCreationTokens:
				usage.cacheCreationTokens +
				tokenValue(message.cacheCreationTokens),
			thinkingTokens:
				usage.thinkingTokens + tokenValue(message.thinkingTokens),
			messageCount: usage.messageCount + 1,
		}),
		{
			contextTokens,
			totalTokens: 0,
			cacheReadTokens: 0,
			cacheCreationTokens: 0,
			thinkingTokens: 0,
			messageCount: 0,
		},
	);
};

/**
 * Latest leaf OUTPUT message without tool calls — the compaction anchor.
 *
 * @name findLatestCompactableResponseId
 * @param messages - Room messages, oldest first.
 * @return The anchor message id, or null when no compactable response
 * exists.
 */
export const findLatestCompactableResponseId = (
	messages: PlaygroundMessage[],
): string | null => {
	const idsWithChildren = new Set(
		messages
			.map((message) => message.parentMessageId)
			.filter((id): id is string => Boolean(id)),
	);

	const leafResponse = [...messages]
		.reverse()
		.find(
			(message) =>
				message.io === "OUTPUT" &&
				Boolean(message.messageId) &&
				!idsWithChildren.has(message.messageId as string) &&
				!message.parts?.some((part) => part.type === "TOOL_CALL"),
		);

	return leafResponse?.messageId ?? null;
};
