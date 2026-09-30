import type { ConversationMessage } from "@/features/messages/types/message";
import { presentThreadInsights, readThreadInsights } from "./thread-insights";

const message = (text: string): ConversationMessage => ({
	id: "result",
	role: "assistant",
	createdAt: "2026-09-30",
	parts: [{ type: "text", text }],
});
const block =
	'```semoss-thread-insights\n{"requestId":"request","summary":"Review is ready.","actionItems":[{"text":"Send the review","due":null}]}\n```';
it("accepts only completed, correlated, valid insight output", () => {
	expect(readThreadInsights([message(block)], "request")).toMatchObject({
		summary: "Review is ready.",
		actionItems: [{ text: "Send the review", due: null }],
	});
	expect(readThreadInsights([message(block)], "other")).toBeNull();
	expect(readThreadInsights([message(block + block)], "request")).toBeNull();
	expect(
		readThreadInsights(
			[message(block.replace('"due":null', '"due":"Friday"'))],
			"request",
		),
	).toBeNull();
	expect(
		readThreadInsights(
			[
				{
					...message(block),
					parts: [{ type: "text", text: block, state: "active" }],
				},
			],
			"request",
		),
	).toBeNull();
});
it("keeps structured insight data out of chat and conversation email", () => {
	const result = presentThreadInsights(
		message(`Done.\n${block}\nNext question?`),
	);
	const text = result.parts
		.flatMap((part) => (part.type === "text" ? [part.text] : []))
		.join("");
	expect(text).toContain("Done.");
	expect(text).toContain("Next question?");
	expect(text).not.toContain("requestId");
	expect(text).not.toContain("semoss-thread-insights");
});
