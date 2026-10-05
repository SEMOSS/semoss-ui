import { expect, test } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import { clearAgentOptions } from "./clear-agent-options";

test("switching to Chat strips agent defaults while retaining local Knowledge and Tools", () => {
	const options: RoomStore["options"] = {
		instructions: "Agent instructions",
		predefinedPrompts: [
			{
				id: "prompt",
				title: "Prompt",
				context: "Context",
				createdBy: "author",
				dateCreated: "2026-09-29",
				version: 1,
				intent: "",
				tags: [],
				global: false,
			},
		],
		workspace: { workspace_id: "agent", name: "Researcher" },
		harnessType: "semoss",
		mcp: [
			{ id: "local", name: "Handbook", type: "VECTOR" },
			{ id: "tool", name: "Calculator", type: "FUNCTION" },
			{
				id: "inherited",
				name: "Search",
				type: "FUNCTION",
				fromWorkspace: true,
			},
		],
	};
	expect(clearAgentOptions(options)).toEqual({
		...options,
		workspace: undefined,
		harnessType: undefined,
		instructions: "",
		predefinedPrompts: [],
		mcp: options.mcp.slice(0, 2),
	});
	expect(options.mcp).toHaveLength(3);
});
