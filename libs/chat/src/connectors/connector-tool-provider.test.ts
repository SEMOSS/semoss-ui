import { expect, test } from "vitest";
import type { RoomEngine, RoomToolCall } from "@semoss/sdk";
import { createConnectorToolProvider } from "./connector-tool-provider";

/** A tool call as the room receives it. */
const toolCall = (
	name: string,
	meta?: RoomToolCall["_meta"],
): RoomToolCall => ({
	id: `call-${name}`,
	type: "function",
	name: name,
	arguments: {},
	_tool_found: false,
	original_name: name,
	description: "",
	...(meta ? { _meta: meta } : {}),
});

const room = {} as RoomEngine;

test("a connector call that asks opens inline", () => {
	const call = createConnectorToolProvider().decorateToolCall?.(
		toolCall("room__MicrosoftOutlookSendMail", {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "__room__",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			SMSS_MCP_EXECUTION: "ask",
			SMSS_FUNCTION_NAME: "MicrosoftOutlookSendMail",
		}),
		room,
	);
	expect(call?._meta?.SMSS_MCP_UI).toMatchObject({
		displayLocation: "inline",
		autoOpen: true,
	});
});

test("leaves every other tool call untouched", () => {
	const call = toolCall("SomeProjectTool", {
		SMSS_ENGINE_NAME: "Project",
		SMSS_ENGINE_ID: "project-1",
		SMSS_ENGINE_TYPE: "PROJECT",
		SMSS_PROJECT_NAME: "",
		SMSS_PROJECT_ID: "",
		SMSS_MCP_EXECUTION: "auto",
	});
	expect(createConnectorToolProvider().decorateToolCall?.(call, room)).toBe(
		call,
	);
});
