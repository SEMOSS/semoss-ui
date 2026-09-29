import { describe, expect, it } from "vitest";
import type { ConversationMessage } from "@/features/messages/types/message";
import { threadCommand } from "@/features/thread-assistant/thread-context";
import { groupWorkTimeline, workTimeline } from "./work-timeline";

const source = {
	id: "same",
	fromId: "p",
	text: "Source text",
	at: "2026-09-28T10:01:00Z",
};
const assistant = (
	id: string,
	at: string,
	text: string,
): ConversationMessage => ({
	id,
	role: "assistant",
	parts: [{ type: "text", text }],
	createdAt: at,
});
describe("unified Work timeline", () => {
	it("interleaves before grouping and namespaces identical source/assistant ids", () => {
		const messages = [
			assistant("same", "2026-09-28T10:00:00Z", "First"),
			assistant("next", "2026-09-28T10:02:00Z", "Second"),
		];
		const entries = workTimeline([source], messages, "room");
		expect(entries.map((e) => e.id)).toEqual([
			"assistant:room:same",
			"source:same",
			"assistant:room:next",
		]);
	});
	it("retains every underlying identity of a grouped response", () => {
		const entries = workTimeline(
			[],
			[
				assistant("a", "2026-09-28T10:00:00Z", "First"),
				assistant("b", "2026-09-28T10:02:00Z", "Second"),
			],
			"room",
		);
		expect(entries).toHaveLength(1);
		expect(entries[0].ids).toEqual([
			"assistant:room:a",
			"assistant:room:b",
		]);
	});
	it("strips saved context envelopes from the readable request", () => {
		const text = threadCommand(
			{
				threadId: "t",
				contextRevision: "0",
				contextText: "private context",
			},
			"My request",
		);
		const entries = workTimeline(
			[],
			[{ id: "u", role: "user", parts: [{ type: "text", text }] }],
			"room",
		);
		const entry = entries[0];
		expect(
			entry.kind === "assistant" && entry.presentation.parts[0].part,
		).toMatchObject({ text: "My request" });
	});
});

describe("chronological conversation sections", () => {
	it("groups adjacent source entries and assistant prompts/replies without crossing an email", () => {
		const entries = workTimeline(
			[
				{ ...source, id: "initial", at: "2026-09-28T09:59:00Z" },
				{ ...source, id: "initial-next", at: "2026-09-28T09:59:30Z" },
				source,
			],
			[
				{
					id: "prompt",
					role: "user",
					createdAt: "2026-09-28T10:00:00Z",
					parts: [{ type: "text", text: "Help" }],
				},
				assistant("first", "2026-09-28T10:00:30Z", "First answer"),
				assistant("later", "2026-09-28T10:02:00Z", "Later answer"),
			],
			"room",
		);
		const groups = groupWorkTimeline(entries);
		expect(
			groups.map((group) => [group.kind, group.entries.length]),
		).toEqual([
			["source", 2],
			["assistant", 2],
			["source", 1],
			["assistant", 1],
		]);
		expect(groups.flatMap((group) => group.entries)).toEqual(entries);
		expect(groups[0].id).toBe(entries[0].id);
	});
});
