import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ConversationTool } from "@/features/messages/types/message";
import { deferred } from "@/features/onboarding/topic-review.test-fixtures";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import type { RoomViewProps } from "../types/room";
import { pendingSession } from "../utils/session-from-room";
import { RoomView } from "./room-view";

const refreshTopic = vi.fn();
vi.mock("@/features/collaboration/live/work-updates.context", () => ({
	useWorkUpdates: () => ({ refreshTopic }),
}));
// one stable insight; the room's task read finds no work item for it
const insight = vi.hoisted(() => ({
	actions: {
		run: vi.fn().mockResolvedValue({ pixelReturn: [{ output: {} }] }),
	},
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
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
				<button
					type="button"
					onClick={() =>
						void workbench.onApproveTool(
							{
								toolId: "new-topic",
								parentMessageId: "assistant-message",
								toolName: "EditTopic",
								arguments: {},
							},
							// the model leaves the arguments it does not use blank
							{
								topicId: "",
								topic: "",
								name: "Uber Trip Receipts",
								addEmails: ["AQMk-receipt"],
							},
						)
					}
				>
					Approve new topic
				</button>
				<button
					type="button"
					onClick={() =>
						void workbench.onApproveTool(
							{
								toolId: "send-email",
								parentMessageId: "assistant-message",
								toolName: "SendEmail",
								arguments: {},
							},
							{ openEmailId: "draft-one", name: "Not a topic" },
						)
					}
				>
					Approve send
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

it("shows a topic the assistant made once its approval settles, and nothing for other tools", async () => {
	refreshTopic.mockClear();
	const approval = deferred<void>();
	const approve = vi.fn().mockReturnValue(approval.promise);
	render(<RoomView {...props} onApproveTool={approve} />);
	fireEvent.click(screen.getByRole("button", { name: "Approve new topic" }));
	expect(refreshTopic).not.toHaveBeenCalled();
	await act(async () => approval.resolve());
	expect(refreshTopic).toHaveBeenCalledExactlyOnceWith({
		topicId: undefined,
		topic: "Uber Trip Receipts",
	});

	approve.mockResolvedValue(undefined);
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Approve send" }));
	});
	expect(approve).toHaveBeenCalledTimes(2);
	expect(refreshTopic).toHaveBeenCalledTimes(1);
});

it("keeps the workbench closed when entering a room with restored tools and approvals", async () => {
	const { rerender } = render(<RoomView {...props} />);
	// the room's task read settles first
	await act(async () => undefined);
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
