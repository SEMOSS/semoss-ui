import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { ChatOptions } from "../config/chat-options";
import { useCreateChatStore } from "./use-create-chat-store";

const mocks = vi.hoisted(() => ({
	// each read of the session's models
	withInsight: vi.fn(async () => []),
}));

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	Session: {
		getSnapshot: () => ({ user: null }),
		insight: { withInsight: mocks.withInsight },
	},
}));

beforeEach(() => mocks.withInsight.mockClear());

/** Host options with a room link, as every host passes. */
const hostOptions = (overrides: Partial<ChatOptions> = {}): ChatOptions => ({
	roomHref: (roomId) => `#/room/${roomId}`,
	...overrides,
});

test("new host options reach the same store, which reads its models once", () => {
	const { result, rerender } = renderHook(
		({ options }) => useCreateChatStore({ options }),
		{
			initialProps: { options: hostOptions() },
			wrapper: StrictMode,
		},
	);
	const first = result.current;

	// the deployment's settings arrive after the chat started
	rerender({ options: hostOptions({ appName: "Acme" }) });

	expect(result.current).toBe(first);
	// Strict Mode runs the effect twice; the store joins its first read
	expect(mocks.withInsight).toHaveBeenCalledTimes(1);
});

test("a new tools host makes a new store and drops the old one's rooms", () => {
	const options = hostOptions();
	const { result, rerender } = renderHook(
		({ tools }) => useCreateChatStore({ options, tools }),
		{ initialProps: { tools: undefined as never } },
	);
	const first = result.current;
	const dispose = vi.spyOn(first, "dispose");

	rerender({
		tools: {
			owns: () => false,
			list: () => [],
			subscribe: () => () => undefined,
			unavailableMessage: "",
		} as never,
	});

	expect(result.current).not.toBe(first);
	expect(dispose).toHaveBeenCalled();
});
