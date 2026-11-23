import { expect, test } from "vitest";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import type { AbstractPixelMessage } from "../../../types";
import { formatConversationMarkdown } from "./conversation-markdown";

/** A stored message with the given parts. */
const message = (
	io: AbstractPixelMessage["io"],
	parts: AbstractPixelMessage["parts"],
	dateCreated = "",
): AbstractPixelMessage => ({
	io,
	messageId: `${io}-${parts.length}`,
	visible: true,
	platform_generated: false,
	modelId: "model-a",
	modelType: "",
	dateCreated,
	parts,
	tokens: 0,
	ornaments: {},
	pruneToolsAbove: false,
});

/** A text part. */
const text = (value: string) =>
	({ type: "TEXT", text: value, uiText: value }) as const;

/** A tool call part, named by its title or its name. */
const toolCall = (name: string, title?: string) =>
	({
		type: "TOOL_CALL",
		toolCall: { id: name, type: "function", name: name, title: title },
	}) as unknown as AbstractPixelMessage["parts"][number];

test("writes each message under who wrote it, with a rule between them", () => {
	expect(
		formatConversationMarkdown([
			message("INPUT", [text("Hello"), text(" there")]),
			message("OUTPUT", [text("Hi")]),
		]),
	).toBe("**You:**\n\nHello there\n\n---\n\n**Assistant:**\n\nHi");
});

test("adds when a message was written", () => {
	const dateCreated = "2026-11-10 14:30:00";
	const when =
		parseTimestampWithUtcDefault(dateCreated).format("MMM D, YYYY h:mm A");

	expect(
		formatConversationMarkdown([
			message("INPUT", [text("Hello")], dateCreated),
		]),
	).toBe(`**You:**\n*${when}*\n\nHello`);
});

test("lists the tools a reply used, by title, then by name", () => {
	expect(
		formatConversationMarkdown([
			message("OUTPUT", [
				text("Done"),
				toolCall("search_mail", "Search Mail"),
				toolCall("read_file"),
			]),
		]),
	).toBe("**Assistant:**\n\nDone\n\n*Tools used: Search Mail, read_file*");
	// a reply that only called tools still shows
	expect(
		formatConversationMarkdown([
			message("OUTPUT", [toolCall("read_file")]),
		]),
	).toBe("**Assistant:**\n\n\n\n*Tools used: read_file*");
});

test("leaves out messages with nothing to show", () => {
	expect(
		formatConversationMarkdown([
			message("INPUT", []),
			message("OUTPUT", [text("")]),
		]),
	).toBe("");
	expect(formatConversationMarkdown([])).toBe("");
});
