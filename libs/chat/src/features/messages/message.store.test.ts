import { act, renderHook } from "@testing-library/react";
import { autorun } from "mobx";
import { expect, test, vi } from "vitest";
import type { InputPixelMessage, ResponsePixelMessage } from "../../types";
import type { RoomStore } from "../room/room.store";
import { InputMessageStore } from "./input-message.store";
import { ResponseMessageStore } from "./response-message.store";
import { useMessage } from "./use-message";

const room = { roomId: "room-1", syncTool: vi.fn() } as unknown as RoomStore;

const pixel = {
	visible: true,
	platform_generated: false,
	modelId: "model-1",
	modelType: "OPEN_AI",
	dateCreated: "2026-01-01T00:00:00Z",
	tokens: 0,
	ornaments: {},
	pruneToolsAbove: false,
};

const response = (messageId: string) =>
	new ResponseMessageStore(room, {
		...pixel,
		io: "OUTPUT",
		messageId,
		parts: [],
	} as unknown as ResponsePixelMessage);

const input = (messageId: string) =>
	new InputMessageStore(room, {
		...pixel,
		io: "INPUT",
		type: "INPUT_TEXT",
		messageId,
		parts: [{ type: "TEXT", text: "hi" }],
	} as unknown as InputPixelMessage);

test("streamed text and reasoning join the last part of their kind, as new values", () => {
	const message = response("r1");
	message.savePart({ type: "TEXT", text: "Hel", uiText: "Hel" });
	const first = message.parts;
	message.savePart({ type: "TEXT", text: "lo", uiText: "lo" });
	message.savePart({ type: "THINKING", thinking: "hmm" });

	expect(message.parts).toEqual([
		{ type: "TEXT", text: "Hello", uiText: "Hello" },
		{ type: "THINKING", thinking: "hmm" },
	]);
	// the earlier snapshot is untouched
	expect(first).toEqual([{ type: "TEXT", text: "Hel", uiText: "Hel" }]);
});

test("changing no part keeps the snapshot", () => {
	const message = response("r1");
	message.addPart({ type: "TEXT", text: "a", uiText: "a" });
	const before = message.getSnapshot();
	message.updateParts(
		(part): part is never => false,
		(part) => part,
	);
	message.setIsThinking(false);
	expect(message.getSnapshot()).toBe(before);
});

test("children connect, activate, and reindex when one is removed", () => {
	const root = response("root");
	const a = input("a");
	const b = input("b");
	const c = input("c");
	root.addChild(a);
	root.addChild(b);
	root.addChild(c);
	expect(root.activeChild).toBe(c);
	expect(b.previousSibling).toBe(a);
	expect(b.nextSibling).toBe(c);

	b.activateMessage();
	root.removeChild(a);
	expect(root.children).toEqual([b, c]);
	expect([b.position, c.position]).toEqual([0, 1]);
	expect(a.parent).toBeNull();
	// the active child stays the same message
	expect(root.activeChild).toBe(b);

	root.removeChild(b);
	expect(root.activeChild).toBe(c);
});

test("MobX readers still track it through the adapter", () => {
	const message = response("r1");
	const seen: number[] = [];
	const stop = autorun(() => seen.push(message.parts.length));
	message.addPart({ type: "TEXT", text: "a", uiText: "a" });
	stop();
	expect(seen).toEqual([0, 1]);
});

test("useMessage renders on its own message's changes only", () => {
	const message = response("r1");
	const other = response("r2");
	let renders = 0;
	const { result } = renderHook(() => {
		renders += 1;
		return useMessage(message, (snapshot) => snapshot.parts);
	});

	act(() => other.savePart({ type: "TEXT", text: "x", uiText: "x" }));
	act(() => message.setIsThinking(true));
	expect(renders).toBe(1);

	act(() => message.savePart({ type: "TEXT", text: "y", uiText: "y" }));
	expect(renders).toBe(2);
	expect(result.current).toHaveLength(1);
});
