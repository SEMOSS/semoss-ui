import { afterEach, expect, test, vi } from "vitest";
import type { RoomEngine, RoomToolCall } from "@semoss/sdk";
import {
	createDesktopToolProvider,
	DESKTOP_TOOL_NAMES,
} from "./desktop-tool.provider";

const invoke = vi.fn();
const room = {} as RoomEngine;
const call = (name: string, args: Record<string, unknown> = {}) =>
	({
		id: "c1",
		type: "function",
		name: name,
		arguments: args,
		_tool_found: true,
		original_name: name,
		description: "",
	}) as RoomToolCall;

const inDesktopApp = () => {
	(window as unknown as { __TAURI__: unknown }).__TAURI__ = {
		core: { invoke: invoke },
	};
};

afterEach(() => {
	delete (window as unknown as { __TAURI__?: unknown }).__TAURI__;
	invoke.mockReset();
});

test("outside the desktop app it offers no tools", () => {
	expect(createDesktopToolProvider().getTools(room)).toEqual([]);
});

test("in the desktop app it offers its tools, and runs only its own calls", () => {
	inDesktopApp();
	const provider = createDesktopToolProvider();
	expect(provider.getTools(room).map((tool) => tool.name)).toEqual([
		DESKTOP_TOOL_NAMES.NOTIFY,
		DESKTOP_TOOL_NAMES.REVEAL_PATH,
	]);
	expect(provider.canHandle(call(DESKTOP_TOOL_NAMES.NOTIFY))).toBe(true);
	expect(provider.canHandle(call("folder_read"))).toBe(false);
});

test("showing a path asks first; a notification runs on its own", () => {
	const provider = createDesktopToolProvider();
	expect(provider.policy?.(DESKTOP_TOOL_NAMES.REVEAL_PATH, room)).toBe("ask");
	expect(provider.policy?.(DESKTOP_TOOL_NAMES.NOTIFY, room)).toBe("auto");
	const decorated = provider.decorateToolCall?.(
		call(DESKTOP_TOOL_NAMES.REVEAL_PATH),
		room,
	);
	expect(decorated?._meta).toMatchObject({
		SMSS_MCP_EXECUTION: "ask",
		SMSS_CLIENT_TOOL: true,
		SMSS_MCP_UI: { displayLocation: "inline", autoOpen: true },
	});
	const other = call("folder_read");
	expect(provider.decorateToolCall?.(other, room)).toBe(other);
});

test("a call runs its Rust command, and a failure is a result, not a throw", async () => {
	inDesktopApp();
	const provider = createDesktopToolProvider();
	invoke.mockResolvedValueOnce("Shown");
	await expect(
		provider.execute(
			call(DESKTOP_TOOL_NAMES.REVEAL_PATH, { path: "/tmp/a" }),
			room,
		),
	).resolves.toEqual({ output: "Shown" });
	expect(invoke).toHaveBeenCalledWith("desktop_reveal_path", {
		path: "/tmp/a",
	});

	invoke.mockRejectedValueOnce(new Error("No such file"));
	await expect(
		provider.execute(
			call(DESKTOP_TOOL_NAMES.NOTIFY, { title: "Done" }),
			room,
		),
	).resolves.toEqual({ output: "No such file", isError: true });
});
