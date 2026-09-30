import { z } from "@semoss/ui/next";
import type { ConversationMessage } from "@/features/messages/types/message";

const insightsSchema = z.object({
	requestId: z.string().min(1),
	summary: z.string().trim().min(1),
	actionItems: z.array(
		z.object({
			text: z.string().trim().min(1),
			due: z
				.string()
				.regex(/^\d{4}-\d{2}-\d{2}$/)
				.nullable()
				.default(null),
			ownerId: z.string().optional(),
		}),
	),
});

/** Only a settled, request-correlated assistant result can replace thread insights. */
export function readThreadInsights(
	messages: ConversationMessage[],
	requestId: string,
): z.infer<typeof insightsSchema> | null {
	const text = messages
		.filter(
			(message) =>
				message.role === "assistant" &&
				message.visible !== false &&
				(!message.runStatus || message.runStatus === "COMPLETED") &&
				(!message.live || message.live.phase === "completed") &&
				!message.parts.some(
					(part) => part.type === "text" && part.state === "active",
				),
		)
		.flatMap((message) =>
			message.parts.flatMap((part) =>
				part.type === "text" ? [part.text] : [],
			),
		)
		.join("\n");
	const matches = [
		...text.matchAll(/```semoss-thread-insights\s*\n([\s\S]*?)\n```/g),
	];
	if (matches.length !== 1) return null;
	try {
		const parsed = insightsSchema.safeParse(
			JSON.parse(matches[0]?.[1] ?? ""),
		);
		return parsed.success && parsed.data.requestId === requestId
			? parsed.data
			: null;
	} catch {
		return null;
	}
}

/** Keep machine-readable output out of the ordinary chat, including streaming chunks. */
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
