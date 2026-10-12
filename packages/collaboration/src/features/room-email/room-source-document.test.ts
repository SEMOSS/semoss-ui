import type { RoomSource } from "@/features/rooms/source-import/room-source";
import {
	sourceImportState,
	sourceMessage,
} from "@/features/rooms/source-import/source-import.test-fixtures";
import { roomSourceDocument } from "./room-source-document";

const source: RoomSource = {
	version: 1,
	threadId: "source-one",
	title: "Budget review",
	channel: "email",
	kind: "brain",
	nativeId: "mail-one",
	file: { fileName: "source.md", fileLocation: "source.md" },
	messages: [{ id: "mail-one", at: "2026-10-01T12:00:00Z" }],
};

it("reconstructs a saved room whose thread is outside the currently loaded Brain list", () => {
	const document = roomSourceDocument(
		source,
		[
			sourceMessage(),
			{
				...sourceMessage(
					"reply",
					"Fresh reply\nFrom: Other sender\nQuoted text",
				),
				fromId: "new-sender",
			},
		],
		null,
	);
	expect(document.messages.map((message) => message.id)).toEqual([
		"mail-one",
		"reply",
	]);
	expect(document.messages[1]?.text).toBe("Fresh reply");
	expect(document.thread.id).toBe(source.threadId);
});

it("retains local participant and keyword exclusions while accepting new permitted senders", () => {
	const state = sourceImportState();
	state.threads[0].participants[0].included = false;
	const document = roomSourceDocument(
		source,
		[
			sourceMessage(),
			{ ...sourceMessage("reply", "Fresh reply"), fromId: "new-sender" },
		],
		state,
	);
	expect(document.messages.map((message) => message.id)).toEqual(["reply"]);
	expect(document.limitations).toContain(
		"Messages excluded from assistant context are not included.",
	);
});

it("refuses a deleted source before generating a replacement file", () => {
	const state = sourceImportState();
	state.deletedSourceIds = ["mail-one"];
	expect(() => roomSourceDocument(source, [sourceMessage()], state)).toThrow(
		"deleted",
	);
});
