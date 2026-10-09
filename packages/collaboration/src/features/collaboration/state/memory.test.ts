import { describe, expect, it } from "vitest";
import { createInitialCollaborationState } from "./collaboration.fixtures";
import type { Memory } from "./collaboration.types";
import {
	canDismiss,
	dropTopicMemories,
	guessMemoryKind,
	learnedMemories,
	memoriesAbout,
	moveTopicMemories,
	originLabel,
	refLabel,
	rememberCommand,
	suggestedMemories,
} from "./memory";

function memory(changes: Partial<Memory>): Memory {
	return {
		id: "m1",
		kind: "fact",
		text: "Priya approves budgets",
		state: "active",
		origin: "you",
		confirmed: true,
		pinned: false,
		about: [],
		expiresAt: null,
		replacesId: null,
		source: {},
		createdAt: "2026-10-01T00:00:00Z",
		updatedAt: "2026-10-01T00:00:00Z",
		isSample: false,
		...changes,
	};
}

describe("memory helpers", () => {
	it("reads /remember and nothing else as a memory to save", () => {
		expect(rememberCommand("/remember   Sign emails as Rob \n")).toBe(
			"Sign emails as Rob",
		);
		expect(rememberCommand("/Remember Dana is out Friday")).toBe(
			"Dana is out Friday",
		);
		expect(rememberCommand("Dana prefers calls  /remember ")).toBe(
			"Dana prefers calls",
		);
		expect(rememberCommand("/remember")).toBeNull();
		expect(rememberCommand("please /remember this")).toBeNull();
		expect(rememberCommand("/rememberable")).toBeNull();
		expect(rememberCommand(`/remember ${"x".repeat(600)}`)).toHaveLength(
			500,
		);
	});

	it("treats instructions as preferences and the rest as facts", () => {
		expect(guessMemoryKind("Always cc Dana on Acme emails")).toBe(
			"preference",
		);
		expect(guessMemoryKind("don't book meetings before 10")).toBe(
			"preference",
		);
		expect(guessMemoryKind("Dana's birthday is May 3")).toBe("fact");
		expect(guessMemoryKind("Usually the board meets monthly")).toBe("fact");
	});

	it("lists memories about one thing, suggestions, and what the assistant learned", () => {
		const memories = [
			memory({ id: "a", about: [{ type: "person", id: "p1" }] }),
			memory({
				id: "b",
				state: "suggested",
				origin: "brain",
				confirmed: false,
			}),
			memory({
				id: "c",
				origin: "assistant",
				confirmed: false,
				about: [{ type: "person", id: "p1" }],
			}),
			memory({
				id: "d",
				state: "dismissed",
				about: [{ type: "person", id: "p1" }],
			}),
		];
		expect(
			memoriesAbout(memories, { type: "person", id: "p1" }).map(
				({ id }) => id,
			),
		).toEqual(["a", "c"]);
		expect(suggestedMemories(memories).map(({ id }) => id)).toEqual(["b"]);
		expect(learnedMemories(memories).map(({ id }) => id)).toEqual(["c"]);
	});

	it("only lets what the owner did not write be dismissed", () => {
		expect(canDismiss(memory({}))).toBe(false);
		expect(
			canDismiss(memory({ origin: "assistant", confirmed: false })),
		).toBe(true);
		expect(
			canDismiss(memory({ origin: "assistant", confirmed: true })),
		).toBe(false);
		expect(
			canDismiss(
				memory({ state: "suggested", origin: "you", confirmed: false }),
			),
		).toBe(true);
	});

	it("says who wrote a memory", () => {
		expect(originLabel(memory({}))).toBe("You");
		expect(
			originLabel(memory({ origin: "assistant", confirmed: false })),
		).toBe("Learned in chat");
		expect(
			originLabel(
				memory({
					origin: "brain",
					state: "suggested",
					confirmed: false,
				}),
			),
		).toBe("Brain suggestion");
	});

	it("follows a topic merge and delete the way the server does", () => {
		const memories = [
			memory({ id: "only", about: [{ type: "topic", id: "t-a" }] }),
			memory({
				id: "both",
				about: [
					{ type: "topic", id: "t-a" },
					{ type: "topic", id: "t-b" },
				],
			}),
			memory({
				id: "shared",
				about: [
					{ type: "topic", id: "t-a" },
					{ type: "person", id: "p1" },
				],
			}),
		];
		expect(
			moveTopicMemories(memories, "t-a", "t-b").map(({ about }) => about),
		).toEqual([
			[{ type: "topic", id: "t-b" }],
			[{ type: "topic", id: "t-b" }],
			[
				{ type: "topic", id: "t-b" },
				{ type: "person", id: "p1" },
			],
		]);
		const kept = dropTopicMemories(memories, "t-a");
		expect(kept.map(({ id }) => id)).toEqual(["both", "shared"]);
		expect(kept[1].about).toEqual([{ type: "person", id: "p1" }]);
	});

	it("names what a memory is about from the loaded records", () => {
		const state = createInitialCollaborationState();
		expect(refLabel(state, { type: "topic", id: "t-geng" })).toBe(
			state.topics.find((topic) => topic.id === "t-geng")?.short,
		);
		expect(refLabel(state, { type: "person", id: "nobody" })).toBe(
			"Someone",
		);
	});
});
