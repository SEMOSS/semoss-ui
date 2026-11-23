import { act, renderHook } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { testChatOptions } from "../../test/chat-options";
import { useDraftRoom } from "./use-draft-room";

vi.mock("@semoss/i18n", () => ({
	getI18n: () => ({ t: (key: string) => key }),
}));

/** One toolbox the deployment turns on for a new chat. */
const SEARCH = { id: "search", type: "FUNCTION", name: "Search" } as const;

test("the draft survives new options, and takes new defaults the user left alone", () => {
	const panels = {};
	const { result, rerender } = renderHook(
		({ options }) => useDraftRoom(options, panels),
		{ initialProps: { options: testChatOptions() } },
	);
	const draft = result.current;
	expect(draft.options.mcp).toEqual([]);

	// the deployment's settings arrive after the draft was made
	const late = testChatOptions({ newChat: { tools: [SEARCH] } });
	rerender({ options: late });

	expect(result.current).toBe(draft);
	expect(draft.chatOptions).toBe(late);
	expect(draft.options.mcp).toEqual([SEARCH]);
});

test("new defaults leave what the user picked", () => {
	const panels = {};
	const { result, rerender } = renderHook(
		({ options }) => useDraftRoom(options, panels),
		{ initialProps: { options: testChatOptions() } },
	);
	const picked = [{ id: "mine", type: "FUNCTION", name: "Mine" } as const];
	act(() => result.current.setOptions({ mcp: [...picked] }));

	rerender({ options: testChatOptions({ newChat: { tools: [SEARCH] } }) });

	expect(result.current.options.mcp).toEqual(picked);
});
