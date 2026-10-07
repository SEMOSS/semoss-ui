import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { ComposerActionControls } from "@/features/rooms/components/room-composer.types";
import type { ThreadSession } from "@/features/thread-assistant/thread-session";
import { AssistantComposer } from "@/features/work-thread/assistant-composer";
import {
	useWorkComposerSession,
	WorkComposerStateProvider,
} from "@/features/work-thread/work-composer-state.context";
import { workSnapshot } from "@/features/work-thread/work-thread.test-fixtures";
import { threadPath } from "@/lib/workspace-paths";
import { NewSessionPage } from "@/pages/new-session.page";
import { WorkThreadPage } from "@/pages/work-thread.page";

const mocks = vi.hoisted(() => ({
	send: vi.fn<ThreadSession["send"]>(),
	retain: vi.fn(),
	release: vi.fn(),
	onSent: vi.fn(),
	actions: {},
}));

vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({
		insightId: "new-chat-submission-test",
		actions: mocks.actions,
	}),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: ({ name }: { name: string }) => <span>{name}</span>,
}));
vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, error: null }),
}));
vi.mock("@/features/work-thread/use-work-panel-actions", () => ({
	useWorkPanelActions: () => [],
}));
vi.mock("@/features/daily-chat/chat-add-to-chat", () => ({
	ChatAddToChat: ({
		onAttachFiles,
		triggerRef,
		triggerId,
		disabled,
	}: ComposerActionControls) => (
		<button
			ref={triggerRef}
			id={triggerId}
			type="button"
			disabled={disabled}
			onClick={onAttachFiles}
		>
			Add to chat
		</button>
	),
}));
vi.mock("@/features/collaboration/components/work-thread", () => ({
	WorkThread: ({
		threadId: suppliedThreadId,
		isNewChat = false,
		onSubmitStart,
	}: {
		threadId?: string;
		isNewChat?: boolean;
		onSubmitStart?: () => void;
	}) => {
		const { threadId: routeThreadId = "" } = useParams();
		const threadId = suppliedThreadId ?? routeThreadId;
		const composer = useWorkComposerSession(threadId);
		const session = {
			insight: { actions: mocks.actions },
			retain: mocks.retain,
			send: mocks.send,
			selectModel: vi.fn(),
		} as unknown as ThreadSession;
		return (
			<main aria-label={isNewChat ? "New chat" : "Conversation"}>
				<output aria-label="Session identity">{threadId}</output>
				<AssistantComposer
					composerSession={composer}
					presentation={isNewChat ? "new-chat" : "standalone"}
					session={session}
					snapshot={workSnapshot()}
					title="New chat"
					attachments={[]}
					context={{
						threadId,
						contextRevision: "r1",
						contextText: "",
					}}
					onSubmitStart={onSubmitStart}
					onSent={mocks.onSent}
				/>
			</main>
		);
	},
}));

function setup() {
	let finish: () => void = () => undefined;
	let fail: (cause: Error) => void = () => undefined;
	const request = new Promise<void>((resolve, reject) => {
		finish = resolve;
		fail = reject;
	});
	mocks.send.mockImplementation(
		(
			_title,
			_context,
			_submission,
			_sourceUid,
			_attachments,
			onSubmitStart,
		) => {
			onSubmitStart?.();
			return request;
		},
	);
	const router = createMemoryRouter(
		[
			{ path: "/new", Component: NewSessionPage },
			{ path: "/thread/:threadId", Component: WorkThreadPage },
			{ path: "/", element: <main>Brief</main> },
		],
		{ initialEntries: ["/", "/new"], initialIndex: 1 },
	);
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<WorkComposerStateProvider>
				<TooltipProvider>
					<RouterProvider router={router} />
				</TooltipProvider>
			</WorkComposerStateProvider>
		</CollaborationSessionProvider>,
	);
	return { router, finish, fail };
}

async function enterText(text: string): Promise<void> {
	const editor = screen.getByRole("textbox");
	await userEvent.setup().click(editor);
	await act(async () => {
		fireEvent.paste(editor, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/html", "text/plain"],
				getData: (type: string) =>
					type === "text/html"
						? `<p>${text}</p>`
						: type === "text/plain"
							? text
							: "",
			},
		});
	});
}

beforeAll(() => {
	vi.stubGlobal("DragEvent", class DragEvent extends Event {});
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = vi.fn();
});

beforeEach(() => {
	vi.clearAllMocks();
	mocks.retain.mockReturnValue(mocks.release);
});

it("opens the thread on Enter before completion and retains the same failed draft and files after remount", async () => {
	const { router, fail } = setup();
	await enterText("Review these notes");
	const file = new File(["Meeting notes"], "notes.txt", {
		type: "text/plain",
	});
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: { files: [file] },
	});
	const sessionId =
		screen.getByLabelText("Session identity").textContent ?? "";
	const welcomeEditor = screen.getByRole("textbox");
	expect(router.state.location.pathname).toBe("/new");
	expect(mocks.send).not.toHaveBeenCalled();
	fireEvent.keyDown(welcomeEditor, { key: "Enter", code: "Enter" });
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(threadPath(sessionId)),
	);
	expect(screen.getByRole("main", { name: "Conversation" })).toBeVisible();
	expect(welcomeEditor).not.toBeInTheDocument();
	expect(screen.getByLabelText("Session identity")).toHaveTextContent(
		sessionId,
	);
	expect(screen.getByRole("textbox")).toHaveTextContent("Review these notes");
	expect(screen.getByText("notes.txt")).toBeVisible();
	expect(mocks.send).toHaveBeenCalledOnce();
	expect(mocks.send.mock.calls[0]?.[1].threadId).toBe(sessionId);
	expect(mocks.send.mock.calls[0]?.[2]).toMatchObject({
		text: "Review these notes",
		files: [file],
	});
	expect(mocks.release).not.toHaveBeenCalled();
	fireEvent.keyDown(screen.getByRole("textbox"), {
		key: "Enter",
		code: "Enter",
	});
	expect(mocks.send).toHaveBeenCalledOnce();
	await act(async () => fail(new Error("The file upload failed.")));
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"The file upload failed.",
		),
	);
	expect(router.state.location.pathname).toBe(threadPath(sessionId));
	expect(screen.getByRole("textbox")).toHaveTextContent("Review these notes");
	expect(screen.getByText("notes.txt")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Send message to Assistant" }),
	).toBeEnabled();
	expect(mocks.release).toHaveBeenCalledOnce();
	expect(mocks.onSent).not.toHaveBeenCalled();
});

it("keeps invalid submission on /new with the editable draft", async () => {
	const { router } = setup();
	fireEvent.keyDown(screen.getByRole("textbox"), {
		key: "Enter",
		code: "Enter",
	});
	expect(mocks.send).not.toHaveBeenCalled();
	mocks.send.mockRejectedValueOnce(
		new Error("Choose a model before sending."),
	);
	await enterText("Keep this question");
	fireEvent.click(
		screen.getByRole("button", { name: "Send message to Assistant" }),
	);
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Choose a model before sending.",
		),
	);
	expect(router.state.location.pathname).toBe("/new");
	expect(screen.getByRole("main", { name: "New chat" })).toBeVisible();
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep this question");
	expect(screen.getByRole("textbox")).toHaveFocus();
	expect(mocks.send).toHaveBeenCalledOnce();
	expect(mocks.onSent).not.toHaveBeenCalled();
});

it("does not redirect or resend when completion arrives after leaving the conversation", async () => {
	const { router, finish } = setup();
	await enterText("Plan my week");
	const sessionId =
		screen.getByLabelText("Session identity").textContent ?? "";
	fireEvent.keyDown(screen.getByRole("textbox"), {
		key: "Enter",
		code: "Enter",
	});
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(threadPath(sessionId)),
	);
	await act(() => router.navigate(-1));
	expect(router.state.location.pathname).toBe("/");
	await act(async () => finish());
	expect(router.state.location.pathname).toBe("/");
	expect(screen.getByText("Brief")).toBeVisible();
	expect(mocks.send).toHaveBeenCalledOnce();
	expect(mocks.release).toHaveBeenCalledOnce();
	await act(() => router.navigate("/new", { state: { sessionId } }));
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(threadPath(sessionId)),
	);
	expect(screen.getByRole("main", { name: "Conversation" })).toBeVisible();
	expect(screen.getByRole("textbox").textContent).toBe("");
	expect(mocks.send).toHaveBeenCalledOnce();
});
