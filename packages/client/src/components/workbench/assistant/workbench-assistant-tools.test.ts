import { describe, expect, it } from "vitest";
import type { BuildPendingAction, BuildTool } from "@/stores/workbench";
import { isPendingUserInputTool } from "./workbench-assistant-tools";

const userInputTool = (status: string): BuildTool => ({
	id: "tool-call-1",
	name: "RequestUserInput",
	status,
	timestamp: "2026-08-26T12:00:00Z",
});

const pendingUserInputAction = (
	toolCallId: string | null = "tool-call-1",
): BuildPendingAction => ({
	actionId: "action-1",
	runId: "run-1",
	parentMessageId: "message-1",
	toolCallId,
	toolName: "RequestUserInput",
	toolArgs: { questions: [] },
	editedArgs: null,
	toolMeta: { SMSS_TOOL_KIND: "platform_user_input" },
	hasUi: false,
	uiUrl: null,
	status: "PENDING",
});

describe("isPendingUserInputTool", () => {
	it.each(["QUEUED", "RUNNING", "INPUT_REQUIRED"])(
		"hides a %s user-input tool when its durable action is pending",
		(status) => {
			expect(
				isPendingUserInputTool(userInputTool(status), [
					pendingUserInputAction(),
				]),
			).toBe(true);
		},
	);

	it("keeps the completed tool as conversation history after the action resolves", () => {
		expect(isPendingUserInputTool(userInputTool("COMPLETED"), [])).toBe(
			false,
		);
	});

	it("does not hide an unrelated pending tool call", () => {
		expect(
			isPendingUserInputTool(userInputTool("QUEUED"), [
				pendingUserInputAction("tool-call-2"),
			]),
		).toBe(false);
	});
});
