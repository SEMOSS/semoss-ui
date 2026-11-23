import {
	type ChatOptions,
	type ResolvedChatOptions,
	resolveChatOptions,
} from "../features/chat/config/chat-options";

/**
 * A host's chat options for a test, with the chat's defaults filled in.
 *
 * @param overrides - The options the test sets.
 * @returns The resolved options.
 */
export const testChatOptions = (
	overrides: Partial<ChatOptions> = {},
): ResolvedChatOptions =>
	resolveChatOptions({
		roomHref: (roomId) => `#/room/${roomId}`,
		...overrides,
	});
