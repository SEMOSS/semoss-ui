import { expect, test } from "vitest";
import type { ResponseMessageStore } from "@/stores/message/response-message.store";
import { groupToolActivity } from "./tool-activity";

test("groups consecutive calls but preserves intervening assistant content", () => {
	const parts = [
		{ type: "TOOL_CALL", toolCall: { id: "first" } },
		{ type: "TOOL_CALL", toolCall: { id: "second" } },
		{
			type: "TEXT",
			text: "I found the document. Next I will summarize it.",
		},
		{ type: "TOOL_CALL", toolCall: { id: "third" } },
		{ type: "THINKING", thinking: "Compare the results" },
		{ type: "TOOL_CALL", toolCall: { id: "fourth" } },
	] as ResponseMessageStore["parts"];
	expect([...groupToolActivity(parts, (id) => id)]).toEqual([
		[0, ["first", "second"]],
		[3, ["third"]],
		[5, ["fourth"]],
	]);
});
