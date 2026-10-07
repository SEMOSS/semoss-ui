import type { ConversationMessage } from "../types/message";

/** Calendar boundaries follow the reader's local timezone. */
export function messageCalendarDay(
	value: string | undefined,
): string | undefined {
	if (!value) return undefined;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return undefined;
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Quiet labels for boundaries between days in a conversation. */
export function formatMessageDay(value: string): string {
	const today = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);
	const day = messageCalendarDay(value);
	if (day === messageCalendarDay(today.toISOString())) return "Today";
	if (day === messageCalendarDay(yesterday.toISOString())) return "Yesterday";
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		...(new Date(value).getFullYear() !== today.getFullYear()
			? { year: "numeric" as const }
			: {}),
	}).format(new Date(value));
}

/** Preserve the current locale and omit malformed/missing timestamps. */
export function formatMessageTime(
	value: string | undefined,
	full = false,
): string {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	return new Intl.DateTimeFormat(undefined, {
		...(full
			? ({ year: "numeric", month: "short", day: "numeric" } as const)
			: {}),
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

/** Copy the same text and thinking content as the original message action. */
export function messageText(message: ConversationMessage): string {
	if (message.delegationReply) return message.delegationReply.text ?? "";
	if (message.delegationRequest) return message.delegationRequest.question;
	return message.parts
		.flatMap((part) =>
			part.type === "text" || part.type === "thinking" ? [part.text] : [],
		)
		.join("\n\n");
}

/** Inspectors use source metadata even when tools are visually regrouped. */
export function toolMessageTimestamps(
	messages: ConversationMessage[],
): Record<string, string> {
	const timestamps: Record<string, string> = {};
	for (const message of messages) {
		if (!message.createdAt || !messageCalendarDay(message.createdAt))
			continue;
		for (const part of message.parts) {
			if (part.type === "tool")
				timestamps[part.tool.id] ??= message.createdAt;
		}
	}
	return timestamps;
}
