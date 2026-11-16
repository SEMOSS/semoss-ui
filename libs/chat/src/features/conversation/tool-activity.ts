import type { ResponseMessageStore } from "@/stores/message/response-message.store";

/** Keep tool runs in transcript order without crossing intervening content. */
export function groupToolActivity<T>(
	parts: ResponseMessageStore["parts"],
	resolveTool: (id: string) => T | undefined,
): Map<number, T[]> {
	const groups = new Map<number, T[]>();
	let current: T[] | null = null;
	parts.forEach((part, index) => {
		if (part.type === "TOOL_CALL") {
			const tool = resolveTool(part.toolCall.id);
			if (!tool) return;
			if (!current) {
				current = [];
				groups.set(index, current);
			}
			current.push(tool);
		} else if (
			(part.type === "TEXT" && part.text) ||
			(part.type === "THINKING" && part.thinking) ||
			part.type === "MEDIA" ||
			part.type === "SUBAGENT"
		) {
			current = null;
		}
	});
	return groups;
}
