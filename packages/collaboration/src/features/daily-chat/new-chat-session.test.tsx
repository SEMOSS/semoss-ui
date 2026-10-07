import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useContext, useSyncExternalStore } from "react";
import { createMemoryRouter, useParams } from "react-router";
import { RouterProvider } from "react-router/dom";
import { TooltipProvider } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { RoomSettingsForm } from "@/features/rooms/components/room-settings-form";
import { ROOM_SETTINGS_PANEL_TYPE } from "@/features/rooms/components/room-settings-panel";
import { RoomSettingsPanelContext } from "@/features/rooms/components/room-settings-panel.context";
import type {
	RoomSession,
	RoomSessionSnapshot,
} from "@/features/rooms/room-session";
import type { ComposerSubmission } from "@/features/rooms/types/room";
import type { ThreadChatSettings } from "@/features/thread-assistant/thread-settings";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { roomPath } from "@/lib/workspace-paths";
import { NewSessionPage } from "@/pages/new-session.page";

const mocks = vi.hoisted(() => ({
	scope: "",
	create: vi.fn<() => Promise<string>>(),
	send: vi.fn<(submission: ComposerSubmission) => Promise<void>>(),
	createSession: vi.fn(),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ insightId: mocks.scope, actions: {} }),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: ({ name }: { name: string }) => <span>{name}</span>,
}));
vi.mock("@/features/rooms/room-session", () => ({
	createRoomSession: () => mocks.createSession(),
}));
vi.mock("./daily-chat-header", () => ({
	DailyChatHeader: ({ threadId }: { threadId: string }) => (
		<output aria-label="Draft identity">{threadId}</output>
	),
}));
vi.mock("@/features/dashboard/brief-context-rail", () => ({
	BriefContextRail: () => null,
}));
vi.mock("@/features/work-thread/thread-agent-select", () => ({
	ThreadAgentSelect: ({ onChange }: { onChange: (id: string) => void }) => (
		<button type="button" onClick={() => onChange("chosen-agent")}>
			Choose agent
		</button>
	),
}));

vi.mock("@/features/rooms/api/use-room-model", () => ({
	useRoomModel: () => ({ engine: null, isLoading: false, error: null }),
}));
vi.mock("@/features/agents/api/use-agent-resources", () => ({
	useAgentResources: () => ({
		resources: [],
		isLoading: false,
		error: null,
		hasMore: false,
		next: vi.fn(),
		refresh: vi.fn(),
	}),
}));
vi.mock("@/features/tools/components/tool-workbench", () => ({
	ToolWorkbench: ({
		onOpenSettings,
		onOpenFiles,
	}: {
		onOpenSettings?: () => void;
		onOpenFiles?: () => Promise<void> | void;
	}) => {
		const workbench = useToolWorkbench();
		const settings = useContext(RoomSettingsPanelContext);
		const panels = useSyncExternalStore(
			workbench.store.subscribe,
			() => workbench.store.getState().layout.panels,
		);
		const hasSettings = Object.values(panels).some(
			(panel) => panel.type === ROOM_SETTINGS_PANEL_TYPE,
		);
		return (
			<div>
				<button
					type="button"
					onClick={() => workbench.closeWorkbench()}
				>
					Back to conversation
				</button>
				<button type="button" onClick={onOpenSettings}>
					File settings
				</button>
				<button type="button" onClick={() => void onOpenFiles?.()}>
					Show chat files
				</button>
				<output aria-label="Workbench panels">
					{JSON.stringify(panels)}
				</output>
				{hasSettings && settings && (
					<RoomSettingsForm
						{...settings}
						onCancel={() => undefined}
					/>
				)}
			</div>
		);
	},
}));

function roomSessionFixture() {
	let snapshot: RoomSessionSnapshot = {
		roomId: "",
		title: "New chat",
		options: null,
		source: null,
		contextFiles: [],
		settings: {
			modelId: "model",
			agentId: "",
			instructions: "",
			temperature: null,
			mcp: [],
		},
		agent: null,
		modelId: "model",
		modelName: "Model",
		isReady: true,
		isLoading: false,
		isPreparing: false,
		isSavingSettings: false,
		settingsError: null,
		isLoadingModel: false,
		modelError: null,
		error: null,
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
		composerDraft: { document: null, text: "", files: [] },
		composerResetKey: 0,
		submissionError: "",
		hasUnconfirmedSubmission: false,
		submissionNotice: null,
		isCreationUncertain: false,
	};
	const listeners = new Set<() => void>();
	const update = (patch: Partial<RoomSessionSnapshot>) => {
		snapshot = { ...snapshot, ...patch };
		for (const listener of listeners) listener();
	};
	const session = {
		scope: mocks.scope,
		insight: { actions: {}, insightId: "draft-insight" },
		canEvict: vi.fn(() => true),
		dispose: vi.fn(),
		getSnapshot: () => snapshot,
		subscribe: (listener: () => void) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		retain: vi.fn(() => vi.fn()),
		initialize: vi.fn(async () => undefined),
		setComposerDraft: vi.fn(
			(composerDraft: RoomSessionSnapshot["composerDraft"]) =>
				update({ composerDraft }),
		),
		create: vi.fn(async () => {
			if (snapshot.roomId) return snapshot.roomId;
			update({ isPreparing: true });
			try {
				const roomId = await mocks.create();
				update({ roomId });
				return roomId;
			} finally {
				update({ isPreparing: false });
			}
		}),
		send: vi.fn(async (submission: ComposerSubmission) => {
			update({ isPreparing: true });
			try {
				await mocks.send(submission);
				update({
					composerDraft: { document: null, text: "", files: [] },
					composerResetKey: snapshot.composerResetKey + 1,
				});
			} catch (cause) {
				update({
					submissionError:
						cause instanceof Error ? cause.message : "Send failed",
				});
				throw cause;
			} finally {
				update({ isPreparing: false });
			}
		}),
		saveSettings: vi.fn(
			async (_title: string, settings: ThreadChatSettings) =>
				update({ settings }),
		),
		selectModel: vi.fn(async () => undefined),
		cancel: vi.fn(async () => undefined),
	};
	return session;
}
let sessions: ReturnType<typeof roomSessionFixture>[];

function RoomDestination() {
	const { threadId } = useParams();
	return <output aria-label="Room identity">{threadId}</output>;
}
function setup(navigationState?: unknown, search = "") {
	const router = createMemoryRouter(
		[
			{ path: "/new", Component: NewSessionPage },
			{ path: "/", element: <div>Brief</div> },
			{ path: "/thread/:threadId", Component: RoomDestination },
		],
		{
			initialEntries: [
				"/",
				{ pathname: "/new", search, state: navigationState },
			],
			initialIndex: 1,
		},
	);
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<TooltipProvider>
				<RouterProvider router={router} />
			</TooltipProvider>
		</CollaborationSessionProvider>,
	);
	return router;
}
async function enterText(text: string): Promise<void> {
	const editor = screen.getByRole("textbox");
	await userEvent.setup().click(editor);
	await act(async () => {
		fireEvent.paste(editor, {
			clipboardData: {
				files: [],
				items: [],
				types: ["text/plain"],
				getData: (type: string) => (type === "text/plain" ? text : ""),
			},
		});
	});
}
function submit(): void {
	fireEvent.keyDown(screen.getByRole("textbox"), {
		key: "Enter",
		code: "Enter",
	});
}
function placeWorkbenchDivider(): void {
	// JSDOM has no layout. Keep the divider's global pointer hit area away
	// from user-event's default coordinates so field clicks remain ordinary clicks.
	vi.spyOn(
		screen.getByRole("separator", { name: "Resize workbench" }),
		"getBoundingClientRect",
	).mockReturnValue(new DOMRect(500, 0, 1, 500));
}
async function settleFocus(): Promise<void> {
	await act(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
			),
	);
}
beforeAll(() => {
	vi.stubGlobal("matchMedia", (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
	vi.stubGlobal("DragEvent", class DragEvent extends Event {});
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.releasePointerCapture = vi.fn();
});
beforeEach(() => {
	vi.clearAllMocks();
	mocks.scope = crypto.randomUUID();
	mocks.create.mockResolvedValue("actual-room");
	mocks.send.mockResolvedValue(undefined);
	sessions = [];
	mocks.createSession.mockImplementation(() => {
		const session = roomSessionFixture();
		sessions.push(session);
		return session as unknown as RoomSession;
	});
});

it("keeps a suggested prompt, files, and agent choice local before the first send", async () => {
	const router = setup({ prompt: "Review these notes" });
	expect(screen.getByRole("textbox")).toHaveTextContent("Review these notes");
	const file = new File(["Notes"], "notes.txt", { type: "text/plain" });
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: { files: [file] },
	});
	fireEvent.click(screen.getByRole("button", { name: "Choose agent" }));
	await waitFor(() =>
		expect(sessions[0].getSnapshot().settings.agentId).toBe("chosen-agent"),
	);
	expect(sessions[0].getSnapshot().composerDraft.files).toEqual([file]);
	expect(mocks.create).not.toHaveBeenCalled();
	expect(mocks.send).not.toHaveBeenCalled();
	expect(router.state.location.pathname).toBe("/new");
});

it("reuses an unsent draft through Brief navigation and creates an independent New chat", async () => {
	const router = setup();
	const sessionId = screen.getByLabelText("Draft identity").textContent;
	await enterText("Keep this question");
	await act(() => router.navigate("/"));
	await act(() =>
		router.navigate("/new", {
			state: { sessionId, prompt: "Do not reseed" },
		}),
	);
	expect(screen.getByLabelText("Draft identity")).toHaveTextContent(
		sessionId ?? "",
	);
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep this question");
	expect(mocks.createSession).toHaveBeenCalledOnce();
	await act(() => router.navigate("/new", { state: null }));
	expect(screen.getByRole("textbox").textContent).toBe("");
	expect(mocks.createSession).toHaveBeenCalledTimes(2);
	expect(mocks.create).not.toHaveBeenCalled();
});

it("awaits room creation, then opens the actual room while its first message is pending", async () => {
	let allocate: (roomId: string) => void = () => undefined;
	mocks.create.mockImplementation(
		() =>
			new Promise((resolve) => {
				allocate = resolve;
			}),
	);
	let fail: (cause: Error) => void = () => undefined;
	mocks.send.mockImplementation(
		() =>
			new Promise((_resolve, reject) => {
				fail = reject;
			}),
	);
	const router = setup();
	await enterText("Review these notes");
	const file = new File(["Notes"], "notes.txt", { type: "text/plain" });
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: { files: [file] },
	});
	submit();
	expect(router.state.location.pathname).toBe("/new");
	expect(mocks.send).not.toHaveBeenCalled();
	submit();
	expect(mocks.create).toHaveBeenCalledOnce();
	await act(async () => allocate("actual-room"));
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(roomPath("actual-room")),
	);
	expect(mocks.send).toHaveBeenCalledExactlyOnceWith({
		text: "Review these notes",
		files: [file],
	});
	await act(async () => fail(new Error("The file upload failed.")));
	expect(sessions[0].getSnapshot()).toMatchObject({
		composerDraft: { text: "Review these notes", files: [file] },
		submissionError: "The file upload failed.",
	});
	expect(router.state.location.pathname).toBe(roomPath("actual-room"));
});

it("retains the editable draft after failed creation and retries without submitting twice", async () => {
	mocks.create.mockRejectedValueOnce(new Error("Could not create the room."));
	const router = setup({ prompt: "Keep my request" });
	submit();
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Could not create the room.",
		),
	);
	expect(router.state.location.pathname).toBe("/new");
	expect(screen.getByRole("textbox")).toHaveTextContent("Keep my request");
	expect(mocks.send).not.toHaveBeenCalled();
	submit();
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(roomPath("actual-room")),
	);
	expect(mocks.send).toHaveBeenCalledOnce();
});

it("does not navigate when a first send completes after leaving /new", async () => {
	let allocate: (roomId: string) => void = () => undefined;
	mocks.create.mockImplementation(
		() =>
			new Promise((resolve) => {
				allocate = resolve;
			}),
	);
	const router = setup({ prompt: "Plan my week" });
	const sessionId = screen.getByLabelText("Draft identity").textContent;
	submit();
	await act(() => router.navigate("/"));
	await act(async () => allocate("actual-room"));
	expect(router.state.location.pathname).toBe("/");
	expect(mocks.send).toHaveBeenCalledOnce();
	await act(() => router.navigate("/new", { state: { sessionId } }));
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(roomPath("actual-room")),
	);
	expect(mocks.send).toHaveBeenCalledOnce();
});

it("ignores invalid suggested state and does not allocate on empty submission", async () => {
	setup({
		sessionId: "not-a-draft",
		prompt: { value: "Wrong" },
		topicId: "missing",
	});
	expect(screen.getByLabelText("Draft identity").textContent).toMatch(
		/^[a-f0-9-]{36}$/,
	);
	expect(screen.getByRole("textbox").textContent).toBe("");
	await act(async () => submit());
	expect(mocks.create).not.toHaveBeenCalled();
});

it("applies requested agent and model once while preserving later local edits", async () => {
	const router = setup(
		undefined,
		"?agentId=requested-agent&model=requested-model",
	);
	const sessionId = screen.getByLabelText("Draft identity").textContent;
	await waitFor(() =>
		expect(sessions[0].getSnapshot().settings).toMatchObject({
			agentId: "requested-agent",
			modelId: "requested-model",
		}),
	);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Choose agent" }));
	await act(() => router.navigate("/"));
	await act(() =>
		router.navigate("/new?agentId=requested-agent&model=requested-model", {
			state: { sessionId },
		}),
	);
	expect(sessions[0].getSnapshot().settings.agentId).toBe("chosen-agent");
	expect(sessions[0].saveSettings).toHaveBeenCalledTimes(2);
	expect(mocks.create).not.toHaveBeenCalled();
});

it("opens welcome Settings in one workbench panel and keeps draft and unsaved settings when hidden", async () => {
	const user = userEvent.setup();
	const router = setup({ prompt: "Keep this request" });
	const file = new File(["Notes"], "notes.txt", { type: "text/plain" });
	fireEvent.change(screen.getByLabelText("Choose attachments"), {
		target: { files: [file] },
	});
	const actions = screen.getByRole("button", {
		name: "Open composer actions",
	});
	await user.click(actions);
	await user.click(screen.getByRole("menuitem", { name: "Settings" }));
	await settleFocus();
	placeWorkbenchDivider();
	expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	const instructions = screen.getByRole("textbox", { name: "Instructions" });
	expect(instructions).not.toBeDisabled();
	await user.type(instructions, "Keep responses concise");
	expect(instructions).toHaveValue("Keep responses concise");
	await user.click(actions);
	await user.click(screen.getByRole("menuitem", { name: "Hide workbench" }));
	await settleFocus();
	await waitFor(() => expect(actions).toHaveFocus());
	await user.keyboard("{Enter}");
	await user.click(screen.getByRole("menuitem", { name: "Open workbench" }));
	await settleFocus();
	placeWorkbenchDivider();
	expect(screen.getByRole("textbox", { name: "Instructions" })).toBe(
		instructions,
	);
	expect(instructions).toHaveValue("Keep responses concise");
	await user.click(screen.getByRole("button", { name: "File settings" }));
	const panels = JSON.parse(
		screen.getByLabelText("Workbench panels").textContent ?? "{}",
	);
	expect(Object.values(panels)).toHaveLength(1);
	await user.click(screen.getByRole("button", { name: "Save settings" }));
	await waitFor(() =>
		expect(sessions[0].getSnapshot().settings.instructions).toBe(
			"Keep responses concise",
		),
	);
	expect(sessions[0].getSnapshot().composerDraft).toMatchObject({
		text: "Keep this request",
		files: [file],
	});
	expect(mocks.create).not.toHaveBeenCalled();
	expect(mocks.send).not.toHaveBeenCalled();
	expect(router.state.location.pathname).toBe("/new");
});

it("allocates only for explicit chat files and reuses that room on the first send", async () => {
	const user = userEvent.setup();
	const router = setup({ prompt: "Use these files" });
	await user.click(
		screen.getByRole("button", { name: "Open composer actions" }),
	);
	await user.click(screen.getByRole("menuitem", { name: "Open workbench" }));
	placeWorkbenchDivider();
	expect(mocks.create).not.toHaveBeenCalled();
	expect(screen.getByLabelText("Workbench panels")).toHaveTextContent("{}");
	await user.click(screen.getByRole("button", { name: "Show chat files" }));
	await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
	await waitFor(() =>
		expect(screen.getByLabelText("Workbench panels")).toHaveTextContent(
			"draft-insight",
		),
	);
	expect(router.state.location.pathname).toBe("/new");
	expect(mocks.send).not.toHaveBeenCalled();
	await user.click(
		screen.getByRole("button", { name: "Open composer actions" }),
	);
	await user.click(screen.getByRole("menuitem", { name: "Hide workbench" }));
	submit();
	await waitFor(() =>
		expect(router.state.location.pathname).toBe(roomPath("actual-room")),
	);
	expect(mocks.create).toHaveBeenCalledOnce();
	expect(mocks.send).toHaveBeenCalledOnce();
});

it("keeps the workbench hidden when a pending file request finishes", async () => {
	let finishCreation!: (roomId: string) => void;
	mocks.create.mockReturnValueOnce(
		new Promise((resolve) => {
			finishCreation = resolve;
		}),
	);
	const user = userEvent.setup();
	const router = setup();
	await user.click(
		screen.getByRole("button", { name: "Open composer actions" }),
	);
	await user.click(screen.getByRole("menuitem", { name: "Open workbench" }));
	placeWorkbenchDivider();
	await user.click(screen.getByRole("button", { name: "Show chat files" }));
	await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
	await user.click(
		screen.getByRole("button", { name: "Back to conversation" }),
	);
	expect(
		screen.queryByRole("complementary", { name: "Workbench" }),
	).not.toBeInTheDocument();
	await act(async () => finishCreation("actual-room"));
	expect(
		screen.queryByRole("complementary", { name: "Workbench" }),
	).not.toBeInTheDocument();
	expect(sessions[0].getSnapshot().roomId).toBe("actual-room");
	expect(router.state.location.pathname).toBe("/new");
	expect(mocks.send).not.toHaveBeenCalled();
});
