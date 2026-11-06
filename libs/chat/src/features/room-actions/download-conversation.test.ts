import { expect, test } from "vitest";
import type { AbstractPixelMessage } from "../../types";
import { formatConversation } from "./download-conversation";

/** A message with only the fields the export reads. */
const message = (
	io: "INPUT" | "OUTPUT",
	parts: AbstractPixelMessage["parts"],
): AbstractPixelMessage =>
	({
		io: io,
		parts: parts,
		dateCreated: "",
	}) as unknown as AbstractPixelMessage;

test("writes each visible turn and the tools a response used", () => {
	expect(
		formatConversation([
			message("INPUT", [
				{ type: "TEXT", text: "Plan a trip", uiText: "" },
			]),
			message("OUTPUT", [
				{ type: "TEXT", text: "Here is a plan", uiText: "" },
				{
					type: "TOOL_CALL",
					toolCall: { name: "search", title: "Web search" },
				} as AbstractPixelMessage["parts"][number],
			]),
		]),
	).toBe(
		"**You:**\n\nPlan a trip\n\n---\n\n**Assistant:**\n\nHere is a plan\n\n*Tools used: Web search*",
	);
});

test("leaves out turns with nothing to show", () => {
	expect(
		formatConversation([message("INPUT", []), message("OUTPUT", [])]),
	).toBe("");
});
