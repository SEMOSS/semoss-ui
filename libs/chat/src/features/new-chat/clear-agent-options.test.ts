import { expect, test } from "vitest";
import type { RoomStore } from "../room/store/room.store";
import { clearAgentOptions } from "./clear-agent-options";

test("removing a saved agent strips its defaults while retaining local Knowledge and Tools", () => {
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
		],
	};
	expect(clearAgentOptions(options)).toEqual({
		...options,
		workspace: undefined,
		harnessType: undefined,
		instructions: "",
		predefinedPrompts: [],
	});
	// the knowledge and tools the user added are kept as they are
	expect(clearAgentOptions(options).mcp).toBe(options.mcp);
});
