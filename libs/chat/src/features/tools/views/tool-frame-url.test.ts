import { describe, expect, it } from "vitest";
import { ROOM_MCP_ID } from "../mcp/mcp-utils";
import {
	resolveSystemAppUrl,
	resolveToolFrameUrl,
	type ToolFrameInput,
	type ToolFrameRoute,
} from "./tool-frame-url";
import type { ToolAppInfo } from "./use-tool-app-info";

/** A tool call, as the resolver reads it. */
type ToolCall = NonNullable<ToolFrameInput["tool"]>;

/** The fields a case changes; its metadata holds only what the case needs. */
type CallOverrides = Omit<Partial<ToolCall>, "_meta"> & {
	_meta?: Partial<NonNullable<ToolCall["_meta"]>>;
};

/**
 * A tool call that asks first.
 *
 * @param overrides - Fields that differ.
 * @returns The call.
 */
const call = (overrides: CallOverrides = {}): ToolCall =>
	({
		id: "call-1",
		type: "function",
		name: "do_thing",
		arguments: {},
		_tool_found: true,
		original_name: "do_thing",
		description: "",
		_meta: { SMSS_MCP_EXECUTION: "ask" },
		...overrides,
	}) as ToolCall;

/** The app's details once read, for a plain project. */
const READ: ToolAppInfo = { status: "SUCCESS", projectType: "" };

/**
 * The resolver's input.
 *
 * @param overrides - Fields that differ from an asking call of app `app-1`.
 * @returns The input.
 */
const input = (overrides: Partial<ToolFrameInput> = {}): ToolFrameInput => ({
	tool: call(),
	app: "app-1",
	hasComponentView: false,
	toolResponse: undefined,
	appInfo: READ,
	platformUrl: "https://platform",
	module: "/Monolith",
	...overrides,
});

/** A connector call written into the room's own toolbox. */
const connectorCall = call({
	name: "delete_file",
	_meta: {
		SMSS_MCP_EXECUTION: "ask",
		SMSS_PROJECT_ID: ROOM_MCP_ID,
		SMSS_FUNCTION_NAME: "MicrosoftOneDriveDeleteFile",
	},
});

/** A work folder call. */
const folderCall = call({ name: "folder_write" });

describe("resolveToolFrameUrl", () => {
	const cases: [string, Partial<ToolFrameInput>, ToolFrameRoute][] = [
		["no call yet", { tool: undefined }, { kind: "none" }],
		// work folder calls
		["a work folder call", { tool: folderCall, app: "" }, { kind: "card" }],
		[
			"a work folder call that names a view keeps its card",
			{ tool: folderCall, hasComponentView: true },
			{ kind: "card" },
		],
		[
			"a call flagged as a client tool",
			{
				tool: call({
					_meta: {
						SMSS_CLIENT_TOOL: true,
						SMSS_MCP_EXECUTION: "ask",
					},
				}),
			},
			{ kind: "card" },
		],
		["a connector call", { tool: connectorCall }, { kind: "card" }],
		// component:// views
		[
			"a component view the playground draws",
			{
				tool: call({
					_meta: {
						SMSS_MCP_UI: {
							resourceURI: "component://mail/compose",
						},
					},
				}),
				hasComponentView: true,
			},
			{ kind: "component", fallback: "form" },
		],
		[
			"a connector call's component view falls back to its card",
			{ tool: connectorCall, hasComponentView: true },
			{ kind: "component", fallback: "card" },
		],
		[
			"a component view the playground does not draw is no page",
			{
				tool: call({
					_meta: {
						SMSS_MCP_EXECUTION: "ask",
						SMSS_MCP_UI: {
							resourceURI: "component://unknown/view",
						},
					},
				}),
			},
			{ kind: "form" },
		],
		// server tools
		[
			"a server tool",
			{ tool: call({ server_tool: true, _meta: undefined }) },
			{ kind: "inspector" },
		],
		// auto calls
		[
			"an auto call that has not finished",
			{ tool: call({ _meta: { SMSS_MCP_EXECUTION: "auto" } }) },
			{ kind: "form" },
		],
		[
			"an auto call with a result goes on to its app",
			{
				tool: call({ _meta: { SMSS_MCP_EXECUTION: "auto" } }),
				toolResponse: "done",
			},
			{ kind: "portal", url: "/Monolith/public_home/app-1/portals/" },
		],
		// system:// apps
		[
			"a system app, before its app is looked up",
			{
				tool: call({
					_meta: {
						SMSS_MCP_EXECUTION: "ask",
						SMSS_MCP_UI: {
							resourceURI: "system://terminal/index.html",
						},
					},
				}),
				appInfo: { status: "INITIAL", projectType: "" },
			},
			{ kind: "frame", url: "../../terminal/dist/index.html" },
		],
		[
			"a system app with no path",
			{
				tool: call({
					_meta: {
						SMSS_MCP_EXECUTION: "ask",
						SMSS_MCP_UI: { resourceURI: "system://terminal" },
					},
				}),
				app: "",
			},
			{ kind: "frame", url: "../../terminal/dist/" },
		],
		[
			"a malformed system URI",
			{
				tool: call({
					_meta: {
						SMSS_MCP_EXECUTION: "ask",
						SMSS_MCP_UI: { resourceURI: "system://bad name/x" },
					},
				}),
			},
			{ kind: "form" },
		],
		// the app behind the call
		["no app to look up", { app: "" }, { kind: "form" }],
		[
			"the app not looked up yet",
			{ appInfo: { status: "INITIAL", projectType: "" } },
			{ kind: "loading" },
		],
		[
			"the app being looked up",
			{ appInfo: { status: "LOADING", projectType: "" } },
			{ kind: "loading" },
		],
		[
			"the app that cannot be read",
			{ appInfo: { status: "ERROR", projectType: "" } },
			{ kind: "form" },
		],
		// portal pages
		[
			"a legacy tool's portal",
			{},
			{ kind: "portal", url: "/Monolith/public_home/app-1/portals/" },
		],
		[
			"a legacy low code app, in the platform",
			{ appInfo: { status: "SUCCESS", projectType: "BLOCKS" } },
			{ kind: "frame", url: "https://platform/#/s/app-1/" },
		],
		[
			"a declared page",
			{
				tool: call({
					_meta: {
						SMSS_MCP_EXECUTION: "ask",
						SMSS_MCP_UI: { resourceURI: "/tools/view.html" },
					},
				}),
			},
			{
				kind: "frame",
				url: "/Monolith/public_home/app-1/portals/tools/view.html",
			},
		],
		[
			"a declared page of a low code app",
			{
				tool: call({
					_meta: {
						SMSS_MCP_EXECUTION: "ask",
						SMSS_MCP_UI: { resourceURI: "/page" },
					},
				}),
				appInfo: { status: "SUCCESS", projectType: "BLOCKS" },
			},
			{ kind: "frame", url: "https://platform/#/s/app-1/page" },
		],
		// the default form
		[
			"a declared UI with no page",
			{
				tool: call({
					_meta: { SMSS_MCP_EXECUTION: "ask", SMSS_MCP_UI: {} },
				}),
			},
			{ kind: "form" },
		],
	];

	it.each(cases)("%s", (_name, overrides, expected) => {
		expect(resolveToolFrameUrl(input(overrides))).toEqual(expected);
	});
});

describe("resolveSystemAppUrl", () => {
	it.each([
		[undefined, null],
		["", null],
		["/page", null],
		["system://automation/run?x=1", "../../automation/dist/run?x=1"],
		["system://terminal", "../../terminal/dist/"],
	])("resolves %s", (uri, expected) => {
		expect(resolveSystemAppUrl(uri)).toBe(expected);
	});
});
