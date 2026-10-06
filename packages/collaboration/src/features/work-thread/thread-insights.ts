import type { ConversationMessage } from "@/features/messages/types/message";

/**
 * Summaries used to run as a chat turn that answered with a fenced block. Brain now writes them in the
 * background; rooms that ran the old flow still hold those blocks, so they stay out of the chat.
 */
export function presentThreadInsights(
	message: ConversationMessage,
): ConversationMessage {
	if (message.role !== "assistant") return message;
	let inside = false;
	return {
		...message,
		parts: message.parts.map((part) => {
			if (part.type !== "text") return part;
			let remaining = part.text;
			let text = "";
			while (remaining) {
				if (inside) {
					const end = remaining.indexOf("```");
					if (end < 0) break;
					remaining = remaining.slice(end + 3);
					inside = false;
				} else {
					const start = remaining.indexOf(
						"```semoss-thread-insights",
					);
					if (start < 0) {
						text += remaining;
						break;
					}
					text +=
						remaining.slice(0, start) +
						(part.state === "active" ||
						message.live?.phase === "streaming"
							? "Preparing summary and action items…"
							: "Thread insights prepared. Review their status in Context.");
					remaining = remaining.slice(
						start + "```semoss-thread-insights".length,
					);
					inside = true;
				}
			}
			return { ...part, text };
		}),
	};
}
