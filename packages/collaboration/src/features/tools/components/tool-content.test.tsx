import { render, screen } from "@testing-library/react";
import type {
	ConversationMessage,
	ConversationTool,
} from "@/features/messages/types/message";
import { toolMessageTimestamps } from "@/features/messages/utils/message-metadata";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { ToolContent } from "./tool-content";

const workbench = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	pendingApprovals: [] as PendingToolApproval[],
	toolCreatedAt: {} as Record<string, string>,
}));
vi.mock("../tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("../api/use-tool-ui-url", () => ({ useToolUiUrl: () => undefined }));

it("shows the original tool timestamp in its inspector, independent of response grouping", () => {
	const tool: ConversationTool = {
		id: "tool",
		parentMessageId: "second",
		name: "Read",
		title: "Read notes",
		arguments: {},
		status: "COMPLETED",
		output: "Done",
	};
	const sources: ConversationMessage[] = [
		{
			id: "first",
			role: "assistant",
			createdAt: "2026-09-24T16:00:00Z",
			parts: [{ type: "text", text: "First response" }],
		},
		{
			id: "second",
			role: "assistant",
			createdAt: "2026-09-24T16:01:00Z",
			parts: [{ type: "tool", tool }],
		},
		{
			id: "duplicate",
			role: "assistant",
			createdAt: "2026-09-24T16:02:00Z",
			parts: [{ type: "tool", tool }],
		},
	];
	workbench.tools = { tool };
	workbench.toolCreatedAt = toolMessageTimestamps(sources);
	const { container, rerender } = render(<ToolContent toolId="tool" />);
	expect(container.querySelector("time")).toHaveAttribute(
		"datetime",
		sources[1].createdAt,
	);
	expect(
		screen.getByRole("textbox", { name: "Read notes result" }),
	).toHaveValue("Done");
	workbench.toolCreatedAt = { tool: "invalid" };
	rerender(<ToolContent toolId="tool" />);
	expect(container.querySelector("time")).toBeNull();
});

it("blocks generic approval for an editor send even when its editor has not restored", () => {
	const tool: ConversationTool = {
		id: "send",
		parentMessageId: "answer",
		name: "SendEmail",
		title: "Send Email",
		arguments: { openEmailId: "missing" },
		status: "INPUT_REQUIRED",
		metadata: { SMSS_MCP_UI: { component: "email-send" } },
	};
	workbench.tools = { send: tool };
	workbench.pendingApprovals = [
		{
			toolId: "send",
			parentMessageId: "answer",
			toolName: "SendEmail",
			arguments: tool.arguments,
		},
	];
	render(<ToolContent toolId="send" />);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"email editor is unavailable",
	);
	expect(
		screen.queryByRole("button", { name: /Approve/ }),
	).not.toBeInTheDocument();
	workbench.pendingApprovals = [];
});
