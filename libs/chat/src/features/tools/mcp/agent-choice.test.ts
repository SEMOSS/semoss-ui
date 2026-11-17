import { expect, test } from "vitest";
import { applyAgentOverlaySave } from "./agent-choice";

const mcp = [{ id: "local", name: "Local handbook", type: "VECTOR" as const }];
const alpha = { workspace_id: "alpha", name: "Alpha" };

test("a room's fixed agent keeps its agent whatever the picker saved", () => {
	expect(
		applyAgentOverlaySave(
			{ mcp, workspace: alpha, isDefaultAgent: true },
			{ kind: "fixed" },
		),
	).toEqual({ options: { mcp } });
});

test("a new chat's picker changes the agent, and none clears it", () => {
	const choice = { kind: "saved", withModeChoice: true } as const;
	expect(applyAgentOverlaySave({ mcp, workspace: alpha }, choice)).toEqual({
		options: { mcp, workspace: alpha },
	});
	expect(
		applyAgentOverlaySave(
			{ mcp, workspace: null, isDefaultAgent: true },
			choice,
		),
	).toEqual({ options: { mcp, workspace: undefined } });
});

test("with Default Agent as its own choice, the save reports it", () => {
	expect(
		applyAgentOverlaySave(
			{ mcp, workspace: null, isDefaultAgent: true },
			{ kind: "savedOrDefault", isDefaultAgent: false },
		),
	).toEqual({ options: { mcp, workspace: undefined }, isDefaultAgent: true });
});
