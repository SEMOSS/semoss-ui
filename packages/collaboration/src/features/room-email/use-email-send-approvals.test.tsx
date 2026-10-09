import { renderHook } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { RoomEmailStore } from "./room-email-store";
import {
	isEditorSend,
	useEmailSendApprovals,
} from "./use-email-send-approvals";

function sendTool(status: ConversationTool["status"]): ConversationTool {
	return {
		id: "send-call",
		parentMessageId: "answer",
		name: "SendEmail",
		title: "Send Email",
		arguments: { openEmailId: "open" },
		status,
		metadata: { SMSS_MCP_UI: { component: "email-send" } },
	};
}

const approval: PendingToolApproval = {
	toolId: "send-call",
	parentMessageId: "answer",
	toolName: "SendEmail",
	arguments: { openEmailId: "open" },
};

it("binds a waiting SendEmail to the email it names and approves with the saved draft", async () => {
	const composer = new RoomEmailStore();
	const draft = composer.requestEmailDraft({ id: "open", mode: "new" });
	const onApproveTool = vi.fn(async () => undefined);
	const workbench = {
		pendingApprovals: [approval],
		tools: { "send-call": sendTool("INPUT_REQUIRED") },
		onApproveTool,
		onRejectTool: vi.fn(async () => undefined),
	};
	const view = renderHook((props) => useEmailSendApprovals(composer, props), {
		initialProps: workbench,
	});
	expect(draft.getSnapshot().sendApprovalToolId).toBe("send-call");
	const settle = vi.spyOn(draft, "settleApprovedSend");
	view.rerender({
		...workbench,
		pendingApprovals: [],
		tools: { "send-call": sendTool("COMPLETED") },
	});
	expect(settle).toHaveBeenCalledWith({ sent: true });
	expect(draft.getSnapshot().sendApprovalToolId).toBeNull();
});

it("counts only a SendEmail naming that editor email as decided on its card", () => {
	const tools = { "send-call": sendTool("INPUT_REQUIRED") };
	expect(isEditorSend(approval, tools, "open")).toBe(true);
	expect(isEditorSend(approval, tools, "other")).toBe(false);
	const other = { ...tools["send-call"], name: "CreateEvent", metadata: {} };
	expect(isEditorSend(approval, { "send-call": other }, "open")).toBe(false);
});
