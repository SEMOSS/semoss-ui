import { fireEvent, render, screen } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { RoomViewProps } from "../types/room";
import { pendingSession } from "../utils/session-from-room";
import { RoomView } from "./room-view";

vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => false,
}));
vi.mock("./room-workspace", () => ({
	RoomWorkspace: () => {
		const workbench = useToolWorkbench();
		return (
			<>
				<output aria-label="Dock visibility">
					{workbench.isOpen ? "open" : "closed"}
				</output>
				<output aria-label="Open panels">
					{
						Object.keys(workbench.store.getState().layout.panels)
							.length
					}
				</output>
				<button
					type="button"
					onClick={() => workbench.openWorkbench("saved-tool")}
				>
					Review tool
				</button>
			</>
		);
	},
}));
const tool: ConversationTool = {
	id: "saved-tool",
	parentMessageId: "assistant-message",
	name: "ComposeEmail",
	title: "Compose email",
	arguments: {},
	status: "COMPLETED",
};
const props: RoomViewProps = {
	agent: {
		name: "Assistant",
		description: "",
		system_prompt: "",
		mcp: [],
		skills: [],
		prompts: [],
	},
	insightId: "isolated-room-insight",
	sessions: [pendingSession("room-one", "", "Source room", "model")],
	agentId: "",
	sessionId: "room-one",
	thread: [
		{
			id: "assistant-message",
			role: "assistant",
			parts: [{ type: "tool", tool }],
		},
	],
	toolStates: {},
	isSending: false,
	isRunning: false,
	isCancelling: false,
	isLoadingHistory: false,
	turnError: null,
	transportError: null,
	pendingApprovals: [],
	phase: null,
	modelId: "model",
	modelName: "Model",
	isModelSaving: false,
	modelError: null,
	roomInstructions: "",
	roomSettings: { instructions: "", mcp: [] },
	onSendMessage: vi.fn(),
	onModelChange: vi.fn(),
	onSaveRoomSettings: vi.fn(),
	onOptimizePrompt: vi.fn(),
	onCancelTurn: vi.fn(),
	onReconnect: vi.fn(),
	onApproveTool: vi.fn(),
	onRejectTool: vi.fn(),
	onNewRoom: vi.fn(),
	onOpenRooms: vi.fn(),
};

it("keeps the workbench closed when entering a room with restored tools and approvals", () => {
	const { rerender } = render(<RoomView {...props} />);
	expect(screen.getByLabelText("Dock visibility")).toHaveTextContent(
		"closed",
	);
	const panelCount = screen.getByLabelText("Open panels").textContent;
	rerender(
		<RoomView
			{...props}
			pendingApprovals={[
				{
					toolId: tool.id,
					parentMessageId: tool.parentMessageId,
					toolName: "SendEmail",
					arguments: { emailDraftId: "draft-one" },
				},
			]}
		/>,
	);
	expect(screen.getByLabelText("Dock visibility")).toHaveTextContent(
		"closed",
	);
	expect(screen.getByLabelText("Open panels")).toHaveTextContent(
		panelCount ?? "",
	);
	fireEvent.click(screen.getByRole("button", { name: "Review tool" }));
	expect(screen.getByLabelText("Dock visibility")).toHaveTextContent("open");
});
