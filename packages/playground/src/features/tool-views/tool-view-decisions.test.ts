import { beforeEach, describe, expect, it, vi } from "vitest";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import type { ToolStore } from "@/stores/tool/tool.store";
import { createToolViewDecisions } from "./tool-view-decisions";

vi.mock("@/stores/message/agent-harness", () => ({
	decideAgentToolAction: vi.fn(),
}));

const OUTCOME = {
	userAction: "savedAsDraft",
	summary: "The user saved this email as a draft instead of sending it.",
	result: { draft: true, id: "d1" },
};

const chatTool = () => {
	const message = {
		runMcpToolCall: vi.fn(),
		saveToolExecution: vi.fn(),
	};
	const room = { chatTools: { declineChatTool: vi.fn() } };
	const tool = {
		status: "INITIAL",
		parameters: { to: ["ada@example.com"] },
		pendingAction: null,
		message: message,
		room: room,
	} as unknown as ToolStore;
	return { tool, message, room };
};

describe("createToolViewDecisions", () => {
	beforeEach(() => {
		vi.mocked(decideAgentToolAction).mockReset();
	});

	it("runs a chat call with the user's edits, and saves what they did instead", async () => {
		const { tool, message, room } = chatTool();
		const decisions = createToolViewDecisions(tool);

		await decisions.onApprove({ to: ["grace@example.com"] });
		expect(tool.parameters).toEqual({ to: ["grace@example.com"] });
		expect(message.runMcpToolCall).toHaveBeenCalledWith(tool);

		await decisions.onRespond(OUTCOME);
		expect(message.saveToolExecution).toHaveBeenCalledWith(
			tool,
			JSON.stringify(OUTCOME),
			"success",
			tool.parameters,
		);

		await decisions.onDecline();
		expect(room.chatTools.declineChatTool).toHaveBeenCalledWith(tool);
		expect(decideAgentToolAction).not.toHaveBeenCalled();
	});

	it("leaves a chat call alone once it has run", async () => {
		const { tool, message } = chatTool();
		(tool as { status: string }).status = "SUCCESS";
		const decisions = createToolViewDecisions(tool);
		await decisions.onApprove({ to: [] });
		await decisions.onRespond(OUTCOME);
		expect(message.runMcpToolCall).not.toHaveBeenCalled();
		expect(message.saveToolExecution).not.toHaveBeenCalled();
	});

	it("decides an agent run's pending call", async () => {
		const { tool, message } = chatTool();
		(tool as { pendingAction: unknown }).pendingAction = { actionId: "a" };
		const decisions = createToolViewDecisions(tool);

		await decisions.onApprove({ to: ["grace@example.com"] });
		await decisions.onDecline();
		await decisions.onRespond(OUTCOME);
		expect(vi.mocked(decideAgentToolAction).mock.calls).toEqual([
			[tool, "submit", { to: ["grace@example.com"] }],
			[tool, "reject"],
			[tool, "respond", OUTCOME],
		]);
		expect(message.runMcpToolCall).not.toHaveBeenCalled();
	});
});
