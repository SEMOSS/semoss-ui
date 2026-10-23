import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContextType } from "react";
import type { ConversationTool } from "@/features/messages/types/message";
import { RoomEmailContext } from "@/features/room-email/room-email.context";
import { RoomEmailStore } from "@/features/room-email/room-email-store";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import type { InsightActions } from "@/lib/pixel";
import { ToolCallCard } from "./tool-call-card";

const workbench = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	pendingApprovals: [] as PendingToolApproval[],
	isOpen: false,
	activeToolId: null,
	getToolDisplayMode: vi.fn(() => "hidden"),
	isToolInline: vi.fn(() => false),
	openWorkbench: vi.fn(),
	openInline: vi.fn(),
	closeTool: vi.fn(),
	onApproveTool: vi.fn().mockResolvedValue(undefined),
	onRejectTool: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("../api/use-tool-ui-url", () => ({ useToolUiUrl: () => undefined }));
vi.mock("@/features/delegations/components/attach-room-file", () => ({
	AttachRoomFile: () => null,
}));
vi.mock("@/features/delegations/components/person-picker", () => ({
	PersonPicker: () => null,
}));

const composeTool: ConversationTool = {
	id: "compose",
	parentMessageId: "answer",
	name: "ComposeEmail",
	title: "Compose email",
	arguments: {
		replyTo: "unknown-source",
		subject: "Friday plans",
		message: "Friday works.",
	},
	status: "COMPLETED",
	output: JSON.stringify({ shown: true }),
	metadata: { SMSS_MCP_UI: { resourceURI: "component://email-compose" } },
};

function setup(tool = composeTool, store = new RoomEmailStore()) {
	const room: NonNullable<ContextType<typeof RoomEmailContext>> = {
		store,
		session: {
			insight: {
				insightId: "insight",
				actions: { run: vi.fn() } as unknown as InsightActions,
			},
			retain: vi.fn(() => vi.fn()),
			readEmailAttachment: vi.fn(),
			updateSourceFile: vi.fn(),
		},
		source: null,
		sourceMessages: [],
		isSourceLoading: false,
		sourceError: null,
		reloadSource: vi.fn(),
		hasSourceEmail: false,
		hasSourceChat: false,
		openSource: vi.fn(),
		selectSourceMessage: vi.fn(),
		replyToSource: vi.fn(),
		openDraft: vi.fn(),
		requestSend: vi.fn(),
	};
	workbench.tools = { [tool.id]: tool };
	const content = () => (
		<RoomEmailContext.Provider value={room}>
			<ToolCallCard tool={tool} />
		</RoomEmailContext.Provider>
	);
	return { ...render(content()), room, content };
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
	workbench.isToolInline.mockReturnValue(false);
	workbench.pendingApprovals = [];
});

afterEach(() => vi.unstubAllGlobals());

it("shows unavailable completed drafts as inspectable details instead of an open action", async () => {
	const { room } = setup();
	expect(screen.getByRole("status")).toHaveTextContent("Draft unavailable");
	expect(screen.queryByText("Draft ready")).not.toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: /^Open email draft:/ }),
	).not.toBeInTheDocument();
	const details = screen.getByRole("button", {
		name: "Reply · Friday plans details in workbench",
	});
	expect(details).toHaveAccessibleDescription("Draft unavailable");
	await userEvent.tab();
	expect(details).toHaveFocus();
	await userEvent.keyboard("{Enter}");
	expect(workbench.openWorkbench).toHaveBeenCalledWith("compose");
	expect(room.openDraft).not.toHaveBeenCalled();
});

it("opens the editor once it restores without replacing the focused card", async () => {
	const { room } = setup();
	const details = screen.getByRole("button", {
		name: /Friday plans details/,
	});
	await userEvent.tab();
	workbench.isToolInline.mockReturnValue(true);
	act(() =>
		room.store.requestEmailDraft({
			id: "assistant-draft:compose",
			mode: "reply",
			sourceUid: "included-source",
			subject: "Confirmed plans",
			body: "My edited reply",
		}),
	);
	expect(screen.getByRole("status")).toHaveTextContent("Draft ready");
	const open = screen.getByRole("button", {
		name: "Open email draft: Reply · Confirmed plans",
	});
	expect(open).toBe(details);
	expect(open).toHaveFocus();
	expect(open).not.toHaveAttribute("aria-expanded");
	expect(open).not.toHaveAttribute("aria-controls");
	await userEvent.keyboard("{Enter}");
	expect(room.openDraft).toHaveBeenCalledWith("assistant-draft:compose");
	expect(workbench.openWorkbench).not.toHaveBeenCalled();
});

it("keeps failed compose details and their full error accessible inline", async () => {
	const failure =
		"The source email is not included. Read its exact ID and try again.";
	const view = setup({
		...composeTool,
		status: "FAILED",
		error: failure,
		metadata: {
			SMSS_MCP_UI: {
				resourceURI: "component://email-compose",
				displayLocation: "inline",
			},
		},
	});
	expect(screen.getByRole("status")).toHaveTextContent("Needs attention");
	const details = screen.getByRole("button", {
		name: "Reply · Friday plans details - failed",
	});
	expect(details).toBeEnabled();
	await userEvent.click(details);
	expect(workbench.openInline).toHaveBeenCalledWith("compose");
	expect(view.room.openDraft).not.toHaveBeenCalled();
	workbench.isToolInline.mockReturnValue(true);
	view.rerender(view.content());
	expect(details).toHaveAttribute("aria-expanded", "true");
	expect(
		screen.getByRole("textbox", { name: "Compose email result" }),
	).toHaveValue(failure);
	expect(
		screen.queryByRole("button", { name: /^Open email draft:/ }),
	).not.toBeInTheDocument();
});

it("inspects a failed revision while preserving the existing editor", async () => {
	const store = new RoomEmailStore();
	const draft = store.requestEmailDraft({
		id: "existing",
		mode: "new",
		subject: "My subject",
		body: "My edited email",
	});
	const before = draft.getSnapshot();
	const { room } = setup(
		{
			...composeTool,
			status: "FAILED",
			arguments: {
				openEmailId: "existing",
				message: "Rejected revision",
			},
			error: "The revision could not be applied.",
		},
		store,
	);
	await userEvent.click(
		screen.getByRole("button", {
			name: "Email draft · My subject details in workbench - failed",
		}),
	);
	expect(workbench.openWorkbench).toHaveBeenCalledWith("compose");
	expect(room.openDraft).not.toHaveBeenCalled();
	expect(draft.getSnapshot()).toBe(before);
	expect(store.getSnapshot().emailDrafts).toEqual([draft]);
});

it("selects a renamed delegation submit by URI and approves the edited answer with the keyboard", async () => {
	const tool: ConversationTool = {
		...composeTool,
		name: "renamed",
		status: "INPUT_REQUIRED",
		arguments: { response: "Original answer" },
		metadata: {
			SMSS_DELEGATION_REQUESTER: "Dana",
			SMSS_MCP_UI: {
				resourceURI:
					"component://delegation-submit?response=configuration",
			},
		},
	};
	const action: PendingToolApproval = {
		toolId: tool.id,
		parentMessageId: tool.parentMessageId,
		toolName: tool.name,
		arguments: tool.arguments,
	};
	workbench.pendingApprovals = [action];
	workbench.isToolInline.mockReturnValue(true);
	const view = setup(tool);
	const answer = screen.getByRole("textbox", { name: "Answer to send" });
	expect(answer).toHaveValue("Original answer");
	await userEvent.clear(answer);
	await userEvent.type(answer, "My reviewed answer");
	view.rerender(view.content());
	expect(answer).toHaveFocus();
	expect(answer).toHaveValue("My reviewed answer");
	await userEvent.tab();
	expect(screen.getByRole("button", { name: "Keep working" })).toHaveFocus();
	await userEvent.tab();
	expect(screen.getByRole("button", { name: "Send answer" })).toHaveFocus();
	await userEvent.keyboard("{Enter}");
	expect(workbench.onApproveTool).toHaveBeenCalledWith(action, {
		response: "My reviewed answer",
		files: [],
	});
	expect(workbench.closeTool).toHaveBeenCalledWith(tool.id);
});

it("selects delegation request approval by URI without a workflow kind and preserves rejection", async () => {
	const tool: ConversationTool = {
		...composeTool,
		name: "renamed",
		status: "INPUT_REQUIRED",
		arguments: { assignee: "Dana", question: "Review this" },
		metadata: {
			SMSS_MCP_UI: { resourceURI: "component://delegation-request" },
		},
	};
	const action: PendingToolApproval = {
		toolId: tool.id,
		parentMessageId: tool.parentMessageId,
		toolName: tool.name,
		arguments: tool.arguments,
	};
	workbench.pendingApprovals = [action];
	workbench.isToolInline.mockReturnValue(true);
	setup(tool);
	expect(screen.getByRole("textbox", { name: "Request" })).toHaveValue(
		"Review this",
	);
	await userEvent.click(screen.getByRole("button", { name: "Don't send" }));
	expect(workbench.onRejectTool).toHaveBeenCalledWith(action);
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
});

it.each([
	{
		SMSS_TOOL_KIND: "semoss_submit_delegation",
		SMSS_MCP_UI: { component: "delegation-submit" },
	},
	{ SMSS_MCP_UI: { component: "email-compose" } },
	{ SMSS_MCP_UI: { resourceURI: "component://email/compose" } },
])(
	"uses a generic card for legacy metadata and familiar names: %j",
	async (metadata) => {
		setup({ ...composeTool, metadata });
		expect(
			screen.queryByRole("textbox", { name: "Answer to send" }),
		).not.toBeInTheDocument();
		expect(screen.queryByText("Draft unavailable")).not.toBeInTheDocument();
		await userEvent.click(
			screen.getByRole("button", {
				name: "Compose email details in workbench",
			}),
		);
		expect(workbench.openWorkbench).toHaveBeenCalledWith("compose");
	},
);
