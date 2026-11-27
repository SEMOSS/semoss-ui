import { expect, test } from "vitest";
import type { MCPConfig } from "@semoss/shared";
import { getAgentLabel, isRemovableToolbox, listRoomTools } from "./mcp-utils";

/** A toolbox. */
const tool = (id: string, name = id): MCPConfig => ({
	id,
	name,
	type: "FUNCTION",
});

test("lists the agent's tools first, then the room's whose id is not the agent's", () => {
	const room = [tool("shared", "room copy"), tool("room-only")];
	const agent = [tool("shared", "agent copy"), tool("agent-only")];

	expect(listRoomTools(room, agent)).toEqual([
		tool("shared", "agent copy"),
		tool("agent-only"),
		tool("room-only"),
	]);
	// neither list is changed
	expect(room).toHaveLength(2);
	expect(agent).toHaveLength(2);
});

test("a room tool listed twice is listed once, in its first place with its last entry", () => {
	expect(
		listRoomTools(
			[tool("dup", "first"), tool("a"), tool("dup", "second")],
			[],
		),
	).toEqual([tool("dup", "second"), tool("a")]);
	expect(listRoomTools([], [tool("a")])).toEqual([tool("a")]);
});

test("only the room's own toolbox cannot be removed", () => {
	expect(isRemovableToolbox(tool("a"))).toBe(true);
	expect(isRemovableToolbox({ ...tool("a"), fromRoom: true })).toBe(false);
	expect(isRemovableToolbox({ ...tool("a"), type: "ROOM" })).toBe(false);
});

test("names the saved agent by its name, else its id", () => {
	expect(
		getAgentLabel({
			workspace: { workspace_id: "a1", name: "Sales" },
			isAgentMode: true,
			defaultAgentLabel: "Default Agent",
		}),
	).toBe("Sales");
	expect(
		getAgentLabel({
			workspace: { workspace_id: "a1" },
			isAgentMode: true,
			defaultAgentLabel: "Default Agent",
		}),
	).toBe("a1");
});

test("names Default Agent only for an agent-mode room with no saved agent", () => {
	expect(
		getAgentLabel({
			isAgentMode: true,
			defaultAgentLabel: "Default Agent",
		}),
	).toBe("Default Agent");
	expect(
		getAgentLabel({
			workspace: null,
			isAgentMode: false,
			defaultAgentLabel: "Default Agent",
		}),
	).toBe("");
	expect(getAgentLabel({})).toBe("");
});
