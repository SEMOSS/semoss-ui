import { expect, test } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import { getPromptHistory } from "./prompt-history";

test("recalls only displayed user text in reverse chronological order", () => {
	const messages = [
		{
			type: "INPUT",
			id: "first",
			parts: [
				{
					type: "TEXT",
					text: "Expanded instructions",
					uiText: "My prompt",
				},
				{ type: "TEXT", text: " continued", uiText: "" },
			],
		},
		{
			type: "OUTPUT",
			id: "response",
			parts: [{ type: "TEXT", text: "Assistant" }],
		},
		{
			type: "INPUT",
			id: "tool",
			parts: [{ type: "TOOL_RESULT", toolResult: {} }],
		},
		{
			type: "INPUT",
			id: "file",
			parts: [{ type: "MEDIA", mediaInfo: {} }],
		},
		{ type: "INPUT", id: "blank", parts: [{ type: "TEXT", text: "  " }] },
		{
			type: "INPUT",
			id: "last",
			parts: [
				{ type: "TEXT", text: "Second prompt" },
				{ type: "MEDIA", mediaInfo: {} },
			],
		},
	] as unknown as RoomStore["history"];
	expect(getPromptHistory(messages)).toEqual([
		{ id: "last", text: "Second prompt" },
		{ id: "first", text: "My prompt continued" },
	]);
	expect(messages[0].id).toBe("first");
});
