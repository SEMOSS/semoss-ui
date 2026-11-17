import type { ResponseMessageStore } from "../store/response-message.store";

/**
 * Group a response's consecutive tool calls, in transcript order. A run of
 * tool calls ends at the next visible text, reasoning, media or subagent part,
 * so a group never spans content between its calls.
 *
 * @param parts - The response's parts.
 * @param resolveTool - Finds a call's tool by id; a call it cannot find is left out.
 * @returns Each group keyed by the index of its first part.
 */
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
			// Empty text and reasoning parts are invisible, so they do not split a run.
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
