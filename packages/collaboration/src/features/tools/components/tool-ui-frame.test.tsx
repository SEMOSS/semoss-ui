import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { ToolUiFrame } from "./tool-ui-frame";

const callbacks = vi.hoisted(() => ({ approve: vi.fn(), reject: vi.fn() }));
const action = {
	actionId: "action-1",
	toolId: "tool-1",
	runId: "child-run",
	roomId: "child-room",
	parentMessageId: "message-1",
	toolName: "search",
	arguments: { query: "original" },
};
vi.mock("../tool-workbench.context", () => ({
	useToolWorkbench: () => ({
		roomId: "parent-room",
		pendingApprovals: [action],
		onApproveTool: callbacks.approve,
		onRejectTool: callbacks.reject,
	}),
}));
const tool: ConversationTool = {
	id: "tool-1",
	roomId: "child-room",
	parentMessageId: "message-1",
	name: "search",
	title: "Search",
	arguments: action.arguments,
	status: "INPUT_REQUIRED",
};
function dispatch(
	status: "success" | "error" | "cancelled",
	source: Window | null,
) {
	window.dispatchEvent(
		new MessageEvent("message", {
			origin: window.location.origin,
			source,
			data: {
				type: "SMSS_EXEC_TOOL",
				tool: {
					type: "MCP",
					id: tool.id,
					roomId: tool.roomId,
					message: tool.parentMessageId,
					name: tool.name,
					response: status === "error" ? "Frame failed" : "done",
					tool_status: status,
					executedParameters: { query: "edited" },
				},
			},
		}),
	);
}
beforeEach(() => {
	vi.resetAllMocks();
	callbacks.approve.mockResolvedValue(undefined);
	callbacks.reject.mockResolvedValue(undefined);
});
it("routes a matching response once to its pending child action", async () => {
	render(<ToolUiFrame tool={tool} url="/tool" />);
	const frame = screen.getByTitle("Search tool") as HTMLIFrameElement;
	fireEvent.load(frame);
	await act(async () => {
		dispatch("success", frame.contentWindow);
		dispatch("success", frame.contentWindow);
	});
	expect(callbacks.approve).toHaveBeenCalledExactlyOnceWith(action, {
		query: "edited",
	});
	await act(async () => dispatch("success", frame.contentWindow));
	expect(callbacks.approve).toHaveBeenCalledTimes(1);
});
it("keeps a frame failure actionable and never approves it", async () => {
	render(<ToolUiFrame tool={tool} url="/tool" />);
	const frame = screen.getByTitle("Search tool") as HTMLIFrameElement;
	await act(async () => dispatch("error", frame.contentWindow));
	expect(screen.getByRole("alert")).toHaveTextContent("Frame failed");
	expect(callbacks.approve).not.toHaveBeenCalled();
	await act(async () => dispatch("cancelled", frame.contentWindow));
	await waitFor(() => expect(callbacks.reject).toHaveBeenCalledWith(action));
});
