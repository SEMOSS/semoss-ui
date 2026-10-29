import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
	ConversationMessagePart,
	ConversationTool,
	ConversationToolStatus,
} from "@/features/messages/types/message";
import type { AgentTurnSnapshot } from "@/features/rooms/api/agent-turn-controller";
import { roomWorkbenchTriggerId } from "@/features/rooms/room-workbench-trigger-id";
import type { RoomSource } from "@/features/rooms/source-import/room-source";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { composeEmailPart } from "@/features/thread-assistant/compose-email.test-fixtures";
import { threadCommand } from "@/features/thread-assistant/thread-context";
import type { InsightActions } from "@/lib/pixel";
import { type RoomEmailSession, useRoomEmail } from "./room-email.context";
import { idleEmailTurn } from "./room-email.test-fixtures";
import { RoomEmailApproval } from "./room-email-approval";
import { RoomEmailProvider } from "./room-email-provider";
import { getRoomEmailContext, getRoomEmailStore } from "./room-email-store";

const workbench = vi.hoisted(() => {
	const selectPanel = vi.fn<(...args: unknown[]) => string>(() => "panel-1");
	const updatePanel = vi.fn();
	return {
		selectPanel,
		updatePanel,
		store: {
			getState: () => ({
				layout: { actions: { selectPanel, updatePanel } },
				events: { actions: { emit: vi.fn() } },
			}),
		},
		openWorkbench: vi.fn(),
		openFile: vi.fn(),
		tools: {} as Record<string, ConversationTool>,
		pendingApprovals: [] as PendingToolApproval[],
		onApproveTool: vi.fn(async () => undefined),
		onRejectTool: vi.fn(async () => undefined),
	};
});
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("./room-email-panel", () => ({
	ROOM_EMAIL_PANEL_TYPE: "collaboration-email-editor",
}));
vi.mock("./room-email-source-panel", () => ({
	ROOM_EMAIL_SOURCE_PANEL_TYPE: "collaboration-email-source",
}));
vi.mock("./room-thread-email-panel", () => ({
	ROOM_THREAD_EMAIL_PANEL_TYPE: "collaboration-thread-email",
}));
vi.mock("./room-teams-chat-panel", () => ({
	ROOM_TEAMS_CHAT_PANEL_TYPE: "collaboration-teams-chat",
}));
const loadEmails = vi.hoisted(() => vi.fn());
vi.mock("./load-room-source-emails", () => ({
	loadRoomSourceEmails: loadEmails,
}));

const source: RoomSource = {
	version: 1,
	threadId: "source",
	title: "Friday plans",
	channel: "email",
	kind: "outlook",
	nativeId: "email",
	file: { fileName: "source.md", fileLocation: "source.md" },
	messages: [
		{
			id: "email",
			fromName: "Sender",
			fromAddress: "sender@example.com",
			at: "2026-10-07T12:00:00Z",
		},
	],
};

function session(): RoomEmailSession {
	return {
		insight: {
			insightId: "insight",
			actions: { run: vi.fn() } as unknown as InsightActions,
		},
		retain: vi.fn(() => vi.fn()),
		readEmailAttachment: vi.fn(),
		updateSourceFile: vi.fn().mockResolvedValue(undefined),
	};
}

function DraftAction() {
	const room = useRoomEmail();
	const draft = room.store.getSnapshot().emailDrafts[0];
	return (
		<button
			type="button"
			disabled={!draft}
			onClick={() => draft && room.openDraft(draft.seed.id)}
		>
			Open draft
		</button>
	);
}

function SourceActions() {
	const room = useRoomEmail();
	return (
		<>
			<button
				type="button"
				disabled={room.isSourceLoading}
				onClick={() => room.replyToSource("email")}
			>
				Reply
			</button>
			<button
				type="button"
				onClick={() => room.replyToSource("excluded")}
			>
				Invalid reply
			</button>
			<button
				type="button"
				onClick={() => room.openSource("manual-source-trigger")}
			>
				View email
			</button>
		</>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	workbench.tools = {};
	workbench.pendingApprovals = [];
	loadEmails.mockResolvedValue([
		{
			id: "email",
			fromId: "sender",
			text: "Friday?",
			at: "2026-10-07T12:00:00Z",
		},
	]);
});

it("opens the source email once and reveals an assistant draft only on request", async () => {
	const owner = session();
	const turn = {
		...idleEmailTurn(),
		phase: "completed" as const,
		settlementVersion: 1,
		messages: [
			{
				id: "answer",
				role: "assistant" as const,
				parts: [
					composeEmailPart(
						{ replyTo: "email", message: "Friday works." },
						"compose",
					),
				],
			},
		],
	};
	const view = render(
		<RoomEmailProvider
			session={owner}
			roomId="room"
			source={source}
			turn={turn}
			isReady
		>
			<DraftAction />
		</RoomEmailProvider>,
	);
	expect(getRoomEmailStore(owner).getSnapshot().emailDrafts).toHaveLength(1);
	expect(workbench.selectPanel).toHaveBeenCalledWith(
		"collaboration-email-source",
		{},
		{ name: "Email" },
	);
	expect(workbench.openWorkbench).toHaveBeenCalledOnce();
	expect(workbench.openWorkbench).toHaveBeenLastCalledWith(
		undefined,
		roomWorkbenchTriggerId("room"),
	);
	expect(getRoomEmailContext(owner)).toBeUndefined();
	await userEvent.click(screen.getByRole("button", { name: "Open draft" }));
	expect(workbench.selectPanel).toHaveBeenCalledWith(
		"collaboration-email-editor",
		{ draftId: "assistant-draft:compose" },
		{ name: "Reply draft" },
	);
	expect(workbench.openWorkbench).toHaveBeenCalledTimes(2);
	expect(getRoomEmailContext(owner)?.openEmail).toMatchObject({
		replyTo: "email",
		body: "Friday works.",
	});
	const [draft] = getRoomEmailStore(owner).getSnapshot().emailDrafts;
	act(() =>
		draft.setValues({
			...draft.getSnapshot().values,
			body: "<p>My changes</p>",
		}),
	);
	view.unmount();
	render(
		<RoomEmailProvider
			session={owner}
			roomId="room"
			source={source}
			turn={turn}
			isReady
		>
			<DraftAction />
		</RoomEmailProvider>,
	);
	expect(getRoomEmailContext(owner)?.openEmail?.body).toBe("My changes");
	expect(workbench.openWorkbench).toHaveBeenCalledTimes(3);
	await act(async () => undefined);
});

it("opens an editable native reply without writing and resumes its edits", async () => {
	const owner = session();
	const props = {
		session: owner,
		roomId: "room",
		source,
		turn: idleEmailTurn(),
		isReady: true,
	};
	const view = render(
		<RoomEmailProvider {...props}>
			<SourceActions />
		</RoomEmailProvider>,
	);
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Reply" })).toBeEnabled(),
	);
	expect(getRoomEmailStore(owner).getSnapshot().emailDrafts).toHaveLength(0);
	await userEvent.click(screen.getByRole("button", { name: "Reply" }));
	const [draft] = getRoomEmailStore(owner).getSnapshot().emailDrafts;
	expect(draft.seed).toMatchObject({
		mode: "reply",
		sourceUid: "email",
		subject: "Friday plans",
	});
	expect(draft.getSnapshot().values.to).toBe("");
	expect(draft.getSnapshot().isSubmitRequested).toBe(false);
	expect(owner.insight.actions.run).not.toHaveBeenCalled();
	act(() =>
		draft.setValues({
			...draft.getSnapshot().values,
			body: "<p>My reply</p>",
		}),
	);
	await userEvent.click(screen.getByRole("button", { name: "View email" }));
	expect(workbench.openWorkbench).toHaveBeenLastCalledWith(
		undefined,
		"manual-source-trigger",
	);
	await userEvent.click(screen.getByRole("button", { name: "Reply" }));
	expect(getRoomEmailStore(owner).getSnapshot().emailDrafts).toEqual([draft]);
	expect(getRoomEmailContext(owner)).toMatchObject({
		selectedSourceMessageId: "email",
		openEmail: { replyTo: "email", body: "My reply" },
	});
	const openCount = workbench.openWorkbench.mock.calls.length;
	view.rerender(
		<RoomEmailProvider
			{...props}
			turn={{ ...props.turn, phase: "streaming" }}
		>
			<SourceActions />
		</RoomEmailProvider>,
	);
	expect(workbench.openWorkbench).toHaveBeenCalledTimes(openCount);
	await userEvent.click(
		screen.getByRole("button", { name: "Invalid reply" }),
	);
	expect(getRoomEmailStore(owner).getSnapshot().emailDrafts).toEqual([draft]);
	expect(getRoomEmailStore(session()).getSnapshot().emailDrafts).toEqual([]);
	view.rerender(
		<RoomEmailProvider {...props} source={{ ...source, messages: [] }}>
			<SourceActions />
		</RoomEmailProvider>,
	);
	expect(getRoomEmailContext(owner)?.selectedSourceMessageId).toBeUndefined();
	expect(getRoomEmailContext(owner)?.openEmail?.body).toBe("My reply");
});

it("requires an explicit Send action and never approves before the editor saves", async () => {
	const owner = session();
	const draft = getRoomEmailStore(owner).requestEmailDraft(
		{
			id: "open",
			mode: "new",
			to: "recipient@example.com",
			subject: "Plans",
			body: "Hello",
		},
		false,
	);
	const approval: PendingToolApproval = {
		toolId: "send",
		parentMessageId: "answer",
		toolName: "SendEmail",
		arguments: { openEmailId: "open" },
	};
	workbench.pendingApprovals = [approval];
	workbench.tools = {
		send: {
			id: "send",
			parentMessageId: "answer",
			name: "SendEmail",
			title: "Send email",
			arguments: approval.arguments,
			status: "INPUT_REQUIRED",
			metadata: { SMSS_MCP_UI: { component: "email-send" } },
		},
	};
	render(
		<RoomEmailProvider
			session={owner}
			roomId="room"
			source={null}
			turn={idleEmailTurn()}
			isReady
		>
			<RoomEmailApproval action={approval} draftId="open" />
		</RoomEmailProvider>,
	);
	expect(draft.getSnapshot().sendApprovalToolId).toBe("send");
	expect(draft.getSnapshot().isSubmitRequested).toBe(false);
	expect(workbench.openWorkbench).not.toHaveBeenCalled();
	await userEvent.click(screen.getByRole("button", { name: /^Send$/ }));
	expect(draft.getSnapshot().isSubmitRequested).toBe(true);
	expect(workbench.openWorkbench).toHaveBeenCalledOnce();
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
});

it("does not expose approval when the requested editor is missing", async () => {
	const action: PendingToolApproval = {
		toolId: "send",
		parentMessageId: "answer",
		toolName: "SendEmail",
		arguments: { openEmailId: "missing" },
	};
	render(
		<RoomEmailProvider
			session={session()}
			roomId="room"
			source={null}
			turn={idleEmailTurn()}
			isReady
		>
			<RoomEmailApproval action={action} draftId="missing" />
		</RoomEmailProvider>,
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"email editor is unavailable",
	);
	expect(
		screen.queryByRole("button", { name: /^Send$/ }),
	).not.toBeInTheDocument();
	await userEvent.click(screen.getByRole("button", { name: "Don't send" }));
	expect(workbench.onRejectTool).toHaveBeenCalledWith(action);
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
});

it("matches ordinary-room context when guarding edits made during a revision", () => {
	const owner = session();
	const draft = getRoomEmailStore(owner).requestEmailDraft({
		id: "open",
		mode: "new",
		body: "Original",
	});
	const openEmail = getRoomEmailContext(owner)?.openEmail;
	draft.setValues({
		...draft.getSnapshot().values,
		body: "<p>My later edits</p>",
	});
	const turn = {
		...idleEmailTurn(),
		phase: "completed" as const,
		settlementVersion: 1,
		messages: [
			{
				id: "user",
				role: "user" as const,
				parts: [
					{
						type: "text" as const,
						text: threadCommand({ openEmail }, "Rewrite it"),
					},
				],
			},
			{
				id: "answer",
				role: "assistant" as const,
				parts: [
					composeEmailPart(
						{ openEmailId: "open", message: "Generated revision" },
						"revise",
					),
				],
			},
		],
	};
	render(
		<RoomEmailProvider
			session={owner}
			roomId="room"
			source={null}
			turn={turn}
			isReady
		>
			<DraftAction />
		</RoomEmailProvider>,
	);
	expect(draft.getSnapshot().values.body).toBe("<p>My later edits</p>");
	expect(screen.getByRole("alert")).toHaveTextContent("your edits were kept");
});

it("shows the thread a finished run read, unless a draft followed or it is the room's own", async () => {
	const owner = session();
	const readThread = (threadId: string): ConversationMessagePart => ({
		type: "tool",
		tool: {
			id: `read-${threadId}`,
			parentMessageId: "answer",
			name: "ReadThread",
			title: "Read Thread",
			arguments: { threadId },
			status: "COMPLETED",
			output: "{}",
		},
	});
	const running = (settlementVersion: number): AgentTurnSnapshot => ({
		...idleEmailTurn(),
		isRunning: true,
		phase: "streaming",
		settlementVersion,
	});
	const finished = (
		settlementVersion: number,
		parts: ConversationMessagePart[],
	): AgentTurnSnapshot => ({
		...idleEmailTurn(),
		phase: "completed",
		settlementVersion,
		messages: [
			{
				id: "ask",
				role: "user",
				parts: [{ type: "text", text: "Find the NVIDIA email" }],
			},
			{ id: "answer", role: "assistant", parts },
		],
	});
	const content = (
		turn: AgentTurnSnapshot,
		roomSource: RoomSource | null = null,
	) => (
		<RoomEmailProvider
			session={owner}
			roomId="room"
			source={roomSource}
			turn={turn}
			isReady
		>
			<span />
		</RoomEmailProvider>
	);
	const threadOpens = () =>
		workbench.selectPanel.mock.calls.filter(
			([type]) => type === "collaboration-thread-email",
		);
	// restored history opens nothing
	const view = render(content(finished(1, [readThread("history")])));
	expect(threadOpens()).toEqual([]);
	// two different threads read: the turn did not single one out
	view.rerender(content(running(1)));
	view.rerender(
		content(finished(2, [readThread("first"), readThread("nvidia")])),
	);
	expect(threadOpens()).toEqual([]);
	view.rerender(content(running(2)));
	view.rerender(
		content(finished(3, [readThread("nvidia"), readThread("nvidia")])),
	);
	expect(threadOpens()).toEqual([
		[
			"collaboration-thread-email",
			{ threadId: "nvidia" },
			{ name: "Email" },
		],
	]);
	expect(workbench.updatePanel).toHaveBeenLastCalledWith("panel-1", {
		config: { threadId: "nvidia", messageId: undefined, source: "email" },
	});
	expect(workbench.openWorkbench).toHaveBeenCalledOnce();
	// the draft written after the read opens instead
	view.rerender(content(running(3)));
	view.rerender(
		content(
			finished(4, [
				readThread("nvidia"),
				composeEmailPart({ subject: "Registered", message: "Done." }),
			]),
		),
	);
	expect(workbench.selectPanel).toHaveBeenLastCalledWith(
		"collaboration-email-editor",
		expect.anything(),
		{ name: "Email draft" },
	);
	expect(threadOpens()).toHaveLength(1);
	// the room's own thread is already in its source reader
	view.rerender(content(running(4), source));
	view.rerender(content(finished(5, [readThread("source")]), source));
	expect(threadOpens()).toHaveLength(1);
	await act(async () => undefined);
});

it("opens exactly what ShowItem showed, by its returned ids, and nothing a failed call named", () => {
	const owner = session();
	const show = (
		id: string,
		output: Record<string, unknown>,
		status: ConversationToolStatus = "COMPLETED",
	): ConversationMessagePart => ({
		type: "tool",
		tool: {
			id,
			parentMessageId: "answer",
			name: "ShowItem",
			title: "Show Item",
			arguments: {},
			status,
			output: JSON.stringify(output),
		},
	});
	const parts = [
		{
			type: "tool" as const,
			tool: {
				id: "read-other",
				parentMessageId: "answer",
				name: "ReadThread",
				title: "Read Thread",
				arguments: { threadId: "other" },
				status: "COMPLETED" as const,
				output: "{}",
			},
		},
		show("s-email", {
			shown: true,
			kind: "thread",
			threadId: "nvidia",
			source: "email",
			title: "NVIDIA GTC DC",
			messageId: "graph-exact",
		}),
		show("s-file", { shown: true, kind: "file", path: "/docs/report.pdf" }),
		show("s-chat", {
			shown: true,
			kind: "chat",
			chatId: "19:chat@thread.v2",
			title: "Dana Lee",
		}),
		show(
			"s-gone",
			{ shown: true, kind: "file", path: "/gone.pdf" },
			"FAILED",
		),
	];
	const turn = (
		settlementVersion: number,
		isRunning: boolean,
	): AgentTurnSnapshot => ({
		...idleEmailTurn(),
		isRunning,
		phase: isRunning ? "streaming" : "completed",
		settlementVersion,
		messages: isRunning
			? []
			: [
					{
						id: "ask",
						role: "user",
						parts: [{ type: "text", text: "bring that up" }],
					},
					{ id: "answer", role: "assistant", parts },
				],
	});
	const content = (value: AgentTurnSnapshot) => (
		<RoomEmailProvider
			session={owner}
			roomId="room"
			source={null}
			turn={value}
			isReady
		>
			<span />
		</RoomEmailProvider>
	);
	// the same results restored from history open nothing
	const view = render(content(turn(1, false)));
	expect(workbench.selectPanel).not.toHaveBeenCalled();
	expect(workbench.openFile).not.toHaveBeenCalled();
	view.rerender(content(turn(1, true)));
	view.rerender(content(turn(2, false)));
	expect(workbench.selectPanel).toHaveBeenCalledWith(
		"collaboration-thread-email",
		{ threadId: "nvidia" },
		{ name: "Email" },
	);
	expect(workbench.updatePanel).toHaveBeenCalledWith("panel-1", {
		config: {
			threadId: "nvidia",
			messageId: "graph-exact",
			source: "email",
		},
	});
	expect(workbench.openFile).toHaveBeenCalledExactlyOnceWith(
		"/docs/report.pdf",
		"report.pdf",
	);
	expect(workbench.selectPanel).toHaveBeenCalledWith(
		"collaboration-teams-chat",
		{ chatId: "19:chat@thread.v2", title: "Dana Lee", webLink: undefined },
		{ name: "Dana Lee" },
	);
	expect(workbench.selectPanel).not.toHaveBeenCalledWith(
		"collaboration-thread-email",
		{ threadId: "other" },
		expect.anything(),
	);
	expect(workbench.selectPanel).toHaveBeenCalledTimes(2);
});
