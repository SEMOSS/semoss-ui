import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContextType } from "react";
import type { ConversationTool } from "@/features/messages/types/message";
import { RoomEmailContext } from "@/features/room-email/room-email.context";
import { RoomEmailStore } from "@/features/room-email/room-email-store";
import type { InsightActions } from "@/lib/pixel";
import { ToolCallCard } from "./tool-call-card";

const workbench = vi.hoisted(() => ({
	roomId: "room",
	tools: {} as Record<string, ConversationTool>,
	pendingApprovals: [],
	isOpen: false,
	activeToolId: null,
	getToolDisplayMode: vi.fn(() => "hidden"),
	isToolInline: vi.fn(() => false),
	openWorkbench: vi.fn(),
	openInline: vi.fn(),
	closeTool: vi.fn(),
}));
vi.mock("../tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("../api/use-tool-ui-url", () => ({ useToolUiUrl: () => undefined }));

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
	metadata: { SMSS_MCP_UI: { component: "email-compose" } },
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
		openItem: vi.fn(),
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
				component: "email-compose",
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

it("opens the thread a finished ReadThread read and keeps a failed read's details", async () => {
	const readTool: ConversationTool = {
		id: "read",
		parentMessageId: "answer",
		name: "ReadThread",
		title: "ReadThread",
		arguments: { threadId: "thread-1" },
		status: "COMPLETED",
		output: JSON.stringify({
			threadId: "thread-1",
			source: "email",
			messages: [{ subject: "Plan" }, { subject: "RE: Plan" }],
		}),
	};
	const read = setup(readTool);
	const open = screen.getByRole("button", {
		name: "Open email: ReadThread · RE: Plan",
	});
	expect(open).toHaveTextContent("Open");
	await userEvent.click(open);
	expect(read.room.openItem).toHaveBeenCalledWith({
		kind: "thread",
		threadId: "thread-1",
		source: "email",
		title: "RE: Plan",
	});
	expect(workbench.openWorkbench).not.toHaveBeenCalled();
	read.unmount();
	const failed = setup({
		...readTool,
		status: "FAILED",
		error: "Thread not found.",
	});
	await userEvent.click(
		screen.getByRole("button", {
			name: "ReadThread details in workbench - failed",
		}),
	);
	expect(workbench.openWorkbench).toHaveBeenCalledWith("read");
	expect(failed.room.openItem).not.toHaveBeenCalled();
});

it("names and opens a shown Teams chat or a downloaded file, but not another room's download", async () => {
	const chat = setup({
		id: "show-chat",
		parentMessageId: "answer",
		name: "ShowItem",
		title: "ShowItem",
		arguments: { chatId: "19:chat@thread.v2" },
		status: "COMPLETED",
		output: JSON.stringify({
			shown: true,
			kind: "chat",
			chatId: "19:chat@thread.v2",
			title: "Dana Lee",
			webLink: "https://teams.microsoft.com/l/chat/1",
		}),
	});
	await userEvent.click(
		screen.getByRole("button", {
			name: "Open Teams chat: ShowItem · Dana Lee",
		}),
	);
	expect(chat.room.openItem).toHaveBeenCalledWith({
		kind: "chat",
		chatId: "19:chat@thread.v2",
		title: "Dana Lee",
		webLink: "https://teams.microsoft.com/l/chat/1",
	});
	chat.unmount();
	const download: ConversationTool = {
		id: "download",
		parentMessageId: "answer",
		name: "DownloadDriveFile",
		title: "DownloadDriveFile",
		arguments: {},
		status: "COMPLETED",
		output: JSON.stringify({ filePath: "docs/Q3 report.pdf" }),
	};
	const file = setup(download);
	await userEvent.click(
		screen.getByRole("button", {
			name: "Open file: DownloadDriveFile · Q3 report.pdf",
		}),
	);
	expect(file.room.openItem).toHaveBeenCalledWith({
		kind: "file",
		path: "/docs/Q3 report.pdf",
		name: "Q3 report.pdf",
	});
	file.unmount();
	setup({ ...download, roomId: "child-room" });
	expect(
		screen.getByRole("button", {
			name: "DownloadDriveFile details in workbench",
		}),
	).toBeVisible();
});
