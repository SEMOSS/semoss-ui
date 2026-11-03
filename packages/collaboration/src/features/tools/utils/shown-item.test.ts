import type { ConversationTool } from "@/features/messages/types/message";
import { isOpenableTool, shownItem } from "./shown-item";

function tool(
	name: string,
	output: unknown,
	extra: Partial<ConversationTool> = {},
): ConversationTool {
	return {
		id: name,
		parentMessageId: "answer",
		name,
		title: name,
		arguments: {},
		status: "COMPLETED",
		output: JSON.stringify(output),
		...extra,
	};
}

it("opens what ShowItem returned, by its exact ids and only with safe links and paths", () => {
	expect(
		shownItem(
			tool("ShowItem", {
				shown: true,
				kind: "thread",
				threadId: "th-1",
				source: "email",
				title: "Q3",
				messageId: "graph-1",
			}),
		),
	).toEqual({
		kind: "thread",
		threadId: "th-1",
		source: "email",
		title: "Q3",
		messageId: "graph-1",
	});
	expect(
		shownItem(
			tool("ShowItem", {
				shown: true,
				kind: "chat",
				chatId: "19:chat@thread.v2",
				title: "Dana Lee",
				webLink: "javascript:alert(1)",
			}),
		),
	).toEqual({ kind: "chat", chatId: "19:chat@thread.v2", title: "Dana Lee" });
	expect(
		shownItem(
			tool("ShowItem", {
				shown: true,
				kind: "file",
				path: "/docs/a b.pdf",
			}),
		),
	).toEqual({ kind: "file", path: "/docs/a b.pdf", name: "a b.pdf" });
	for (const output of [
		{ shown: true, kind: "file", path: "/../secret.txt" },
		{ shown: true, kind: "meeting", threadId: "th-1" },
		{ shown: false, kind: "file", path: "/a.pdf" },
		"not an item",
	])
		expect(shownItem(tool("ShowItem", output))).toBeNull();
});

it("opens what a read or a download found, and nothing from a failed call or another room's download", () => {
	expect(
		shownItem(
			tool("ReadThread", {
				threadId: "th-2",
				source: "teams",
				messages: [{ subject: "" }],
			}),
		),
	).toEqual({ kind: "thread", threadId: "th-2", source: "teams", title: "" });
	expect(
		shownItem(
			tool("ReadThread", {
				threadId: "th-3",
				source: "calendar",
				messages: [],
			}),
		),
	).toBeNull();
	// a read that names no source is an email thread, found by the id it was asked for
	expect(
		shownItem(tool("ReadThread", {}, { arguments: { threadId: "th-9" } })),
	).toEqual({ kind: "thread", threadId: "th-9", source: "email", title: "" });
	expect(
		shownItem(
			tool("ListChatMessages", {
				chatId: "19:chat",
				count: 0,
				messages: [],
			}),
		),
	).toEqual({ kind: "chat", chatId: "19:chat", title: "" });
	expect(
		shownItem(
			tool("DownloadMessageAttachment", { filePath: "files\\Q3.xlsx" }),
		),
	).toEqual({ kind: "file", path: "/files/Q3.xlsx", name: "Q3.xlsx" });
	expect(
		shownItem(tool("DownloadAttachment", { filePath: "../escape.pdf" })),
	).toBeNull();
	expect(
		shownItem(
			tool(
				"DownloadDriveFile",
				{ filePath: "a.pdf" },
				{ roomId: "child-room" },
			),
			"room",
		),
	).toBeNull();
	expect(
		shownItem(
			tool(
				"ReadThread",
				{ threadId: "th-2" },
				{ status: "FAILED", error: "Thread not found" },
			),
		),
	).toBeNull();
	expect(isOpenableTool(tool("SearchMail", {}))).toBe(false);
	expect(isOpenableTool(tool("ShowItem", {}))).toBe(true);
});
