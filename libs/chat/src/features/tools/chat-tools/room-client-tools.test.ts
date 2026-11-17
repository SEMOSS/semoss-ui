import { describe, expect, it } from "vitest";
import { buildDesktopToolDefinitions } from "./folder-tools";
import {
	CLIENT_TOOLS_GENERATOR,
	mergeRoomClientTools,
} from "./room-client-tools";

const DEFINITIONS = buildDesktopToolDefinitions({
	folderNames: ["notes"],
	executionOf: () => "auto",
});

const CONNECTOR_TOOL = {
	name: "Outlook",
	_meta: {
		SMSS_FUNCTION_NAME: "SendEmail",
		SMSS_MCP_GENERATOR: "PlaygroundConnectors",
	},
};

/** The client tools as the room's file holds them. */
const TOOLS = mergeRoomClientTools(null, DEFINITIONS)?.tools as unknown[];

describe("room client tools", () => {
	it("always ask the server, and say the browser runs them", () => {
		expect(TOOLS[0]).toMatchObject({
			name: "desktop_list",
			_meta: {
				SMSS_FUNCTION_NAME: "desktop_list",
				SMSS_MCP_GENERATOR: CLIENT_TOOLS_GENERATOR,
				SMSS_MCP_EXECUTION: "ask",
				SMSS_CLIENT_TOOL: true,
			},
		});
	});

	it("are added beside the room's other tools", () => {
		const file = mergeRoomClientTools(
			{ tools: [CONNECTOR_TOOL] },
			DEFINITIONS,
		);

		expect(file?.tools).toEqual([CONNECTOR_TOOL, ...TOOLS]);
	});

	it("are replaced without touching the others, and removed with none", () => {
		const withTools = mergeRoomClientTools(
			{ tools: [CONNECTOR_TOOL] },
			DEFINITIONS,
		);

		expect(mergeRoomClientTools(withTools, DEFINITIONS)).toBeNull();
		expect(mergeRoomClientTools(withTools, [])?.tools).toEqual([
			CONNECTOR_TOOL,
		]);
	});

	it("start a file for a room that has none", () => {
		expect(TOOLS).toHaveLength(DEFINITIONS.length);
		expect(mergeRoomClientTools(null, [])).toBeNull();
	});
});
