import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { ToolCallStore } from "@semoss/sdk";
import type { RoomUiStore } from "../../features/workbench/room-ui.store";
import { asObservableFake } from "../../testing/observable-fake";
import { ToolsView } from "./tools-view";

// the app's metadata, already read: one object, as a settled query keeps it.
// ToolsView reads it once per render, so its calls count the renders.
const useSessionPixel = vi.hoisted(() => {
	const appInfo = { status: "SUCCESS", data: { project_type: "CODE" } };
	return vi.fn(() => appInfo);
});
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useSessionPixel,
}));
vi.mock("@semoss/shared", () => ({
	isToolViewUri: () => false,
	useToolView: () => undefined,
}));
vi.mock("../../host/chat.context", () => ({
	useChat: () => ({ config: { platformUrl: "" } }),
}));
vi.mock("../../features/chat-tools-ui/tools/chat-tool-kind", () => ({
	isChatToolCall: () => false,
}));
vi.mock("../../features/chat-tools-ui/components/chat-tool-card", () => ({
	ChatToolCard: () => null,
}));
vi.mock("../../features/tool-views/component-tool-view", () => ({
	ComponentToolView: () => null,
}));
vi.mock("./tools-default-view/tools-default-view", () => ({
	ToolsDefaultView: () => <p>Default view</p>,
}));
vi.mock("./tools-server-view", () => ({ ToolsServerView: () => null }));

// past this many reads the fake keeps its last object, so a view that loops
// still ends and fails on the count, rather than hanging the run
const READ_LIMIT = 500;

/**
 * A finished call whose `json` is a new but equal object on every read, as a
 * store that rebuilds it does.
 */
const createFreshJsonTool = (resourceURI: string | undefined) => {
	let reads = 0;
	let last: ToolCallStore["json"] | undefined;
	const tool = asObservableFake({
		status: "SUCCESS",
		response: [{ type: "text", text: "done" }],
		parameters: { city: "Paris" },
		get json(): ToolCallStore["json"] {
			reads += 1;
			if (!last || reads <= READ_LIMIT) {
				last = {
					id: "call-1",
					type: "function",
					name: "weather",
					original_name: "weather",
					description: "The weather in a city",
					arguments: { city: "Paris" },
					_tool_found: true,
					_meta: {
						SMSS_ENGINE_NAME: "Weather",
						SMSS_ENGINE_ID: "app-1",
						SMSS_ENGINE_TYPE: "PROJECT",
						SMSS_PROJECT_NAME: "Weather",
						SMSS_PROJECT_ID: "app-1",
						SMSS_MCP_EXECUTION: "auto",
						SMSS_MCP_UI: resourceURI ? { resourceURI } : undefined,
					},
				};
			}
			return last;
		},
	});
	return { tool, getReads: () => reads };
};

const renderView = (tool: object) => {
	const room = asObservableFake({
		roomId: "room-1",
		getTool: () => tool,
	}) as unknown as RoomUiStore;
	return render(
		<ToolsView room={room} app="app-1" message="msg-1" toolId="call-1" />,
	);
};

const loopErrors = (spy: ReturnType<typeof vi.spyOn>) =>
	spy.mock.calls.filter((args) =>
		args.some((arg) => String(arg).includes("Maximum update depth")),
	);

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	useSessionPixel.mockClear();
});

test("a call whose json is new on every read opens its page once", async () => {
	const consoleError = vi.spyOn(console, "error");
	const { tool, getReads } = createFreshJsonTool("/index.html");

	renderView(tool);

	const frame = await screen.findByTitle("Tool");
	expect(frame.getAttribute("src")).toContain(
		"/public_home/app-1/portals/index.html",
	);
	expect(loopErrors(consoleError)).toEqual([]);
	expect(getReads()).toBeLessThan(READ_LIMIT);
	expect(useSessionPixel.mock.calls.length).toBeLessThan(10);
});

test("a call with no page checks for portals once and settles", async () => {
	const consoleError = vi.spyOn(console, "error");
	const { tool, getReads } = createFreshJsonTool(undefined);
	const fetchPortals = vi.fn(async () => new Response("", { status: 404 }));
	vi.stubGlobal("fetch", fetchPortals);

	renderView(tool);

	expect(await screen.findByText("Default view")).toBeTruthy();
	// a loop here is async, a check per pass, so give it time to show
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(fetchPortals).toHaveBeenCalledTimes(1);
	expect(screen.getByText("Default view")).toBeTruthy();
	expect(loopErrors(consoleError)).toEqual([]);
	expect(getReads()).toBeLessThan(READ_LIMIT);
	expect(useSessionPixel.mock.calls.length).toBeLessThan(10);
});

test("a change to the call's page opens the new one", async () => {
	const first = createFreshJsonTool("/index.html");
	const { rerender } = renderView(first.tool);
	await screen.findByTitle("Tool");

	const second = createFreshJsonTool("/other.html");
	const room = asObservableFake({
		roomId: "room-1",
		getTool: () => second.tool,
	}) as unknown as RoomUiStore;
	rerender(
		<ToolsView room={room} app="app-1" message="msg-1" toolId="call-1" />,
	);

	const frame = await screen.findByTitle("Tool");
	await vi.waitFor(() =>
		expect(frame.getAttribute("src")).toContain("portals/other.html"),
	);
});
