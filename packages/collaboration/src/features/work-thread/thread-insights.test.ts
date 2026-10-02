import type { ConversationMessage } from "@/features/messages/types/message";
import { presentThreadInsights } from "./thread-insights";

const message = (text: string): ConversationMessage => ({
	id: "result",
	role: "assistant",
	createdAt: "2026-09-30",
	parts: [{ type: "text", text }],
});
const block =
	'```semoss-thread-insights\n{"requestId":"request","summary":"Review is ready.","actionItems":[{"text":"Send the review","due":null}]}\n```';
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
