import { expect, test } from "vitest";
import type { WorkspaceDetails } from "@semoss/sdk";
import type { MCPConfig, PixelMessage } from "../../../types";
import {
	createRootMessage,
	findActiveModelId,
	mergeAgentIntoRoom,
} from "./room-load";
import { NO_AGENT_TOOLS } from "./room-snapshot";

/** A toolbox. */
const mcp = (id: string) =>
	({ id, type: "MCP", name: id }) as unknown as MCPConfig;

/** An agent, as the SDK reads it. */
const agent = (extra: Partial<WorkspaceDetails> = {}): WorkspaceDetails =>
	({
		name: "agent",
		mcp: [],
		skills: [],
		prompts: [],
		...extra,
	}) as unknown as WorkspaceDetails;

test("without an agent, the options lose their workspace and the room gets nothing", () => {
	const stored = { instructions: "x", workspace: { workspace_id: "" } };
	const merged = mergeAgentIntoRoom(stored, null);
	expect(merged).toEqual({
		options: { instructions: "x" },
		agentTools: NO_AGENT_TOOLS,
		agentGreeting: "",
		defaultModelId: "",
	});
	// the stored options are left as they were
	expect(stored.workspace).toEqual({ workspace_id: "" });
});

test("an agent names itself, lends its prompt, tools, greeting and model", () => {
	const tools = [mcp("agent-tool")];
	const merged = mergeAgentIntoRoom(
		{ instructions: "", workspace: { workspace_id: "agent-1" } },
		agent({
			name: "agent-name",
			display_name: "Agent One",
			system_prompt: "Agent prompt",
			mcp: tools,
			config_json: {
				greeting_enabled: true,
				greeting: "Hello",
				model_id: "model-agent",
			},
		} as Partial<WorkspaceDetails>),
	);
	expect(merged.options).toEqual({
		instructions: "Agent prompt",
		workspace: { workspace_id: "agent-1", name: "Agent One" },
	});
	expect(merged.agentTools).toBe(tools);
	expect(merged.agentGreeting).toBe("Hello");
	expect(merged.defaultModelId).toBe("model-agent");
});

test("the room's own instructions win, and a greeting switched off is not shown", () => {
	const merged = mergeAgentIntoRoom(
		{ instructions: "Room prompt", workspace: { workspace_id: "agent-1" } },
		agent({
			system_prompt: "Agent prompt",
			config_json: { greeting_enabled: false, greeting: "Hidden" },
		} as Partial<WorkspaceDetails>),
	);
	expect(merged.options.instructions).toBe("Room prompt");
	expect(merged.options.workspace).toEqual({
		workspace_id: "agent-1",
		name: "agent",
	});
	expect(merged.agentGreeting).toBe("");
	expect(merged.defaultModelId).toBe("");
});

test("the active model is the last user's message's, else the fallback", () => {
	const message = (io: "INPUT" | "OUTPUT", modelId: string) =>
		({ io, modelId }) as PixelMessage;
	expect(findActiveModelId([], "current")).toBe("current");
	expect(
		findActiveModelId(
			[
				message("INPUT", "old"),
				message("INPUT", "new"),
				message("OUTPUT", "reply"),
			],
			"current",
		),
	).toBe("new");
});

test("the root is a hidden response naming the room's model", () => {
	const root = createRootMessage(
		{
			engine_id: "model-a",
			engine_name: "Model A",
			engine_type: "MODEL",
		},
		"root-key",
	);
	expect(root).toMatchObject({
		key: "root-key",
		type: "ROOT",
		id: "ROOT_PLACEHOLDER_ID",
		visible: false,
		modelId: "model-a",
		parentKey: null,
	});
	expect(createRootMessage(null, "k").modelId).toBe("");
});
