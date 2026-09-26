import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThreadAssistantView } from "./thread-assistant-view";
import type { ThreadSession } from "./thread-session";

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	stage: vi.fn(),
	loadSnapshot: vi.fn(),
	store: {
		getState: () => ({
			layout: { actions: { loadSnapshot: () => undefined } },
		}),
	},
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, error: null }),
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({
		store: mocks.store,
		isOpen: false,
		openWorkbench: vi.fn(),
		closeWorkbench: vi.fn(),
	}),
}));
vi.mock("@/features/tools/tool-workbench.constants", () => ({
	createToolWorkbenchLayout: () => ({}),
}));
vi.mock("@/features/tools/components/tool-workbench", () => ({
	ToolWorkbench: () => null,
}));
vi.mock("@/features/rooms/components/room-run-status", () => ({
	RoomRunStatus: () => null,
}));
vi.mock("@/features/rooms/components/room-thread", () => ({
	RoomThread: () => <div>Conversation</div>,
}));
vi.mock("@/features/connectors/api/microsoft", () => ({
	stageMailAttachment: mocks.stage,
	downloadStagedAttachment: vi.fn(),
}));
vi.mock("@/features/rooms/components/room-composer", () => ({
	RoomComposer: ({
		isSendDisabled,
		onSend,
	}: {
		isSendDisabled: boolean;
		onSend: (submission: { text: string; files: File[] }) => Promise<void>;
	}) => (
		<button
			type="button"
			disabled={isSendDisabled}
			onClick={() => void onSend({ text: "Plan next steps", files: [] })}
		>
			Ask Assistant
		</button>
	),
}));

function props() {
	return {
		threadId: "thread",
		threadTitle: "Launch",
		contextText: "Selected message only",
		contextRevision: "revision-1",
		isConnected: true,
		session: {
			insight: { insightId: "isolated", actions: {} },
			send: mocks.send,
			selectModel: vi.fn(),
			cancel: vi.fn(),
			reconnect: vi.fn(),
			allowNewRoom: vi.fn(),
		} as unknown as ThreadSession,
		snapshot: {
			isReady: true,
			isLoading: false,
			isPreparing: false,
			error: null,
			association: null,
			modelId: "model-1",
			modelName: "Test model",
			hasUnconfirmedSubmission: false,
			submissionNotice: null,
			isCreationUncertain: false,
			composerResetKey: 0,
			turn: {
				messages: [],
				toolStates: {},
				pendingApprovals: [],
				phase: null,
				isSubmitting: false,
				isRestoring: false,
				isCancelling: false,
				isRunning: false,
				turnError: null,
				transportError: null,
				settlementVersion: 0,
			},
		} satisfies ReturnType<ThreadSession["getSnapshot"]>,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.send.mockResolvedValue(undefined);
});

it("sends the thread context without asking first and only the supplied snapshot", async () => {
	render(<ThreadAssistantView {...props()} />);
	expect(
		screen.queryByRole("checkbox", {
			name: "Include this context in my saved conversation",
		}),
	).toBeNull();
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	await waitFor(() =>
		expect(mocks.send).toHaveBeenCalledWith(
			"Launch",
			{
				threadId: "thread",
				contextRevision: "revision-1",
				contextText: "Selected message only",
			},
			{ text: "Plan next steps", files: [] },
			undefined,
			[],
		),
	);
});

it("allows live model queries on samples and queues native attachment IDs without staging on selection", async () => {
	const attachment = { id: "file-1", name: "brief.pdf", isFile: true };
	render(
		<ThreadAssistantView
			{...props()}
			isConnected={false}
			sourceUid="email-1"
			sourceAttachments={[attachment]}
		/>,
	);
	expect(screen.getByRole("button", { name: "Ask Assistant" })).toBeEnabled();
	fireEvent.click(screen.getByText("Source attachments"));
	fireEvent.click(screen.getByRole("button", { name: "Attach brief.pdf" }));
	expect(mocks.stage).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	await waitFor(() =>
		expect(mocks.send).toHaveBeenCalledWith(
			"Launch",
			expect.anything(),
			{ text: "Plan next steps", files: [] },
			"email-1",
			[attachment],
		),
	);
});

it("clears queued source attachments when context inclusion changes", async () => {
	const input = {
		...props(),
		isConnected: false,
		sourceUid: "email-1",
		sourceAttachments: [{ id: "file-1", name: "brief.pdf", isFile: true }],
	};
	const view = render(<ThreadAssistantView {...input} />);
	fireEvent.click(screen.getByText("Source attachments"));
	fireEvent.click(screen.getByRole("button", { name: "Attach brief.pdf" }));
	view.rerender(
		<ThreadAssistantView {...input} contextRevision="revision-2" />,
	);
	fireEvent.click(screen.getByRole("button", { name: "Ask Assistant" }));
	await waitFor(() =>
		expect(mocks.send).toHaveBeenCalledWith(
			"Launch",
			expect.objectContaining({ contextRevision: "revision-2" }),
			expect.anything(),
			"email-1",
			[],
		),
	);
});
