import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { testChatOptions } from "../../test/chat-options";
import { fakeStore } from "../../test/fake-store";
import type { ResolvedChatOptions } from "../chat/config/chat-options";
import {
	forgetSessionNewChat,
	readSessionNewChat,
	writeSessionNewChat,
} from "../chat/config/new-chat-defaults";
import type { ContextItemsStore } from "../conversation/attachments/context-items.store";
import { useContextItems } from "../conversation/attachments/use-context-items";
import type { RoomInput } from "../conversation/composer/room-input";
import { RoomStore } from "../room/store/room.store";
import type { RoomSettingsForm } from "../room-settings/room-settings-form";
import { DEFAULT_WORKBENCH_PANELS } from "../workbench/panels/default-workbench-panels";
import { NewChat } from "./new-chat";

const mocks = vi.hoisted(() => ({
	createRoom: vi.fn(),
	createEmptyRoom: vi.fn(),
	closeRoom: vi.fn().mockResolvedValue(undefined),
	navigate: vi.fn(),
	selectModelById: vi.fn(),
	workspaceStatus: "SUCCESS",
	refreshWorkspace: vi.fn(),
	pixel: (_pixel: string) =>
		({
			status: "INITIAL",
			refresh: vi.fn(),
			data: null,
		}) as { status: string; refresh: () => void; data: unknown },
	/** The agent's read: alpha is the only agent there is. */
	agentWorkspace: (workspaceId: string | null | undefined) => {
		if (!workspaceId) {
			return {
				workspace: null,
				status: "IDLE",
				error: null,
				refresh: mocks.refreshWorkspace,
			};
		}
		const status =
			mocks.workspaceStatus === "SUCCESS"
				? workspaceId === "alpha"
					? "READY"
					: "ERROR"
				: mocks.workspaceStatus === "ERROR"
					? "ERROR"
					: "LOADING";
		return {
			workspace: status === "READY" ? mocks.alpha : null,
			status,
			error: status === "ERROR" ? new Error("No agent") : null,
			refresh: mocks.refreshWorkspace,
		};
	},
	alpha: null as unknown,
	searchParams: new URLSearchParams(),
	session: {
		status: "AUTHENTICATED",
		user: {
			name: "Tester",
			lastLogin: "login-1",
			meta: {} as Record<string, string[]>,
		},
	},
	// stable, as the SDK's are, so views keep the same logins between renders
	logins: {
		logins: {},
		accountIds: {},
		primaryLogin: null,
		connectorAccess: null,
		availableProviders: [],
		status: "ready" as const,
		refresh: vi.fn(),
		connect: vi.fn(),
		disconnect: vi.fn(),
	},
}));
const alpha = {
	workspace_id: "alpha",
	name: "Alpha",
	system_prompt: "Agent instructions",
	mcp: [
		{ id: "agent-tool", name: "Agent tool", type: "FUNCTION" },
		{ id: "local", name: "Agent handbook", type: "VECTOR" },
	],
	prompts: [],
	config_json: {},
};
mocks.alpha = alpha;
const root: { options: ResolvedChatOptions } = {
	options: testChatOptions({ agentMode: "choice" }),
};
const chat = fakeStore({
	...mocks,
	models: { selected: null },
	selectNewChatDefaultModel: vi.fn(),
	setSelectedModel: vi.fn(),
	addOptimisticRoom: vi.fn(),
	removeOptimisticRoom: vi.fn(),
	keys: { roomCounter: 0 },
	// read when the draft is made, after the panels module below is mocked
	get workbenchPanels() {
		return DEFAULT_WORKBENCH_PANELS;
	},
});
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("../connectors/store/connector-tools", async (original) => ({
	...(await original<typeof import("../connectors/store/connector-tools")>()),
	readUserConnectorTools: vi.fn().mockResolvedValue(null),
	syncRoomConnectorTools: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	InsightProvider: ({ children }: { children: ReactNode }) => children,
	// the session's logins, without reading them from a server
	useLogins: () => mocks.logins,
	usePixel: (pixel: string) => mocks.pixel(pixel),
	useSessionPixel: (pixel: string) => mocks.pixel(pixel),
	// a signed in user, with any new chat defaults a test gives them
	useSession: <T,>(selector: (state: typeof mocks.session) => T) =>
		selector(mocks.session),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	useAgentWorkspace: mocks.agentWorkspace,
}));
vi.mock("../chat/config/chat-config.context", async (original) => ({
	...(await original<typeof import("../chat/config/chat-config.context")>()),
	useChatConfig: () => ({
		options: root.options,
		callbacks: {
			onOpenRoom: (roomId: string) => mocks.navigate(`/room/${roomId}`),
		},
	}),
}));
vi.mock("../chat/provider/chat-session.context", async (original) => ({
	...(await original<
		typeof import("../chat/provider/chat-session.context")
	>()),
	useChatSession: () => ({ chat }),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useTheme: () => ({ theme: "light" }),
}));
vi.mock("../workbench/panels/default-workbench-panels", async () => {
	const { ROOM_PANEL_TYPES } = await import(
		"../room/store/room-workbench-layout"
	);
	const { ROOM_SETTINGS_PANEL } = await import(
		"../room-settings/room-settings-panel"
	);
	const { FILE_PANEL_TYPES } = await import("@semoss/panels");
	const { useNextMessageRoom } = await import(
		"../conversation/attachments/next-message-room.context"
	);
	const Source = () => {
		const draft = useNextMessageRoom();
		return (
			<button
				type="button"
				onClick={() =>
					draft?.contextItems.add({
						name: "email.md",
						path: "email.md",
						service: "gmail",
					})
				}
			>
				Add email to context
			</button>
		);
	};
	return {
		DEFAULT_WORKBENCH_PANELS: {
			[ROOM_PANEL_TYPES.GMAIL]: {
				name: "Gmail",
				mount: "keepAlive",
				content: Source,
			},
			[ROOM_PANEL_TYPES.SETTINGS]: ROOM_SETTINGS_PANEL,
			[ROOM_PANEL_TYPES.ACTIVITY_LOG]: {
				name: "Activity",
				content: () => <p>Activity log</p>,
			},
			[FILE_PANEL_TYPES.FILE_EXPLORER]: {
				name: "Files",
				mount: "keepAlive",
				// one explorer per scope, as the real blueprint dedupes
				matches: (
					a: { mode?: { insightId?: string } },
					b: { mode?: { insightId?: string } },
				) => a.mode?.insightId === b.mode?.insightId,
				content: () => (
					<textarea
						aria-label="File draft"
						defaultValue="Unsaved file"
					/>
				),
			},
		},
	};
});
vi.mock("../conversation/attachments/file-drop.context", () => ({
	FileDropProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../conversation/drop-highlight", () => ({
	DropHighlight: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../room/layout/split-layout", () => ({
	SplitLayout: ({
		children,
		workbench,
		isWorkbenchOpen,
		header,
	}: {
		children: ReactNode;
		workbench: ReactNode;
		isWorkbenchOpen: boolean;
		header: ReactNode;
	}) => (
		<>
			{header}
			{children}
			<div hidden={!isWorkbenchOpen}>{workbench}</div>
		</>
	),
}));
vi.mock("../room-settings/room-settings-form", () => ({
	RoomSettingsForm: ({
		session: { options, onOptionsChange, agent, onDefaultAgentChange },
	}: ComponentProps<typeof RoomSettingsForm>) => (
		<>
			{agent.kind === "savedOrDefault" && (
				<button
					type="button"
					onClick={() => onDefaultAgentChange?.(true)}
				>
					Pick Default Agent in Settings
				</button>
			)}
			<input
				aria-label="Instructions"
				value={options.instructions}
				onChange={(event) =>
					onOptionsChange({ instructions: event.target.value })
				}
			/>
			<button
				type="button"
				onClick={() =>
					onOptionsChange({
						workspace: { workspace_id: "alpha", name: "Alpha" },
					})
				}
			>
				Save Alpha in Settings
			</button>
			<button
				type="button"
				onClick={() =>
					onOptionsChange({
						mcp: options.mcp.filter((item) => item.id !== "local"),
					})
				}
			>
				Remove local
			</button>
		</>
	),
}));
vi.mock("../conversation/composer/room-input", async () => {
	const { useRoomSelector } = await import("../room/store/use-room-selector");
	const { listRoomTools } = await import("../tools/mcp/mcp-utils");
	const { saveAgentOverlay } = await import(
		"../conversation/composer/use-composer-session"
	);
	return {
		RoomInput: ({
			session,
			room,
			onPrompt,
			variant,
		}: ComponentProps<typeof RoomInput>) => {
			const { options } = session;
			const draft = variant.kind === "draft" ? variant : null;
			/** Save the agent picker as the real one does. */
			const save = (
				workspace: { workspace_id: string; name: string } | null,
				isDefaultAgent?: boolean,
			) =>
				saveAgentOverlay(session, {
					mcp: options.mcp,
					workspace,
					isDefaultAgent,
				});
			// the draft's mode and agent tools, read as the real input does
			const mode = useRoomSelector(room, (current) => current.mode);
			const agentTools = useRoomSelector(
				room,
				(current) => current.agentTools,
			);
			return (
				<>
					{session.agent.kind === "savedOrDefault" && (
						<>
							<button
								type="button"
								onClick={() => save(null, true)}
							>
								Pick Default Agent
							</button>
							<button
								type="button"
								onClick={() => save(null, false)}
							>
								Pick No Agent
							</button>
						</>
					)}
					<input
						aria-label="Message draft"
						defaultValue="Keep this draft"
					/>
					<output aria-label="Mode">{mode}</output>
					<QueuedContext store={room.contextItems} />
					<button
						type="button"
						onClick={() =>
							draft?.draftWorkbench.draftPanels.onOpenPanel({
								kind: "connector",
								service: "gmail",
							})
						}
					>
						Open Gmail
					</button>
					<output aria-label="Selected agent">
						{options.workspace?.name ?? "Default"}
					</output>
					<output aria-label="Resources">
						{listRoomTools(options.mcp, agentTools)
							.map((item) => item.id)
							.join(",")}
					</output>
					<button
						type="button"
						onClick={() =>
							session.onOptionsChange({
								mcp: [
									...options.mcp,
									{
										id: "local",
										type: "VECTOR",
										name: "Local",
									},
								],
							})
						}
					>
						Add local
					</button>
					<button
						type="button"
						onClick={() =>
							save({ workspace_id: "alpha", name: "Alpha" })
						}
					>
						Save Alpha
					</button>
					<button type="button" onClick={() => save(null)}>
						Save default
					</button>
					<button
						type="button"
						onClick={draft?.onSwitchToAgentHarness}
					>
						Agent
					</button>
					<button type="button" onClick={draft?.onExitAgentHarness}>
						Chat
					</button>
					<button type="button" onClick={() => onPrompt("Hello", [])}>
						Send
					</button>
				</>
			);
		},
	};
});

/** The names queued for a room's next message, as the composer would show them. */
const QueuedContext = ({ store }: { store: ContextItemsStore }) => {
	const names = useContextItems(store, (state) =>
		state.items.map((item) => item.name).join(","),
	);
	return <output aria-label="Queued context">{names}</output>;
};

/** The new chat as the playground's route renders it, from the link's search params. */
const NewChatFromLink = () => (
	<NewChat
		initialPrompt={mocks.searchParams.get("prompt") ?? ""}
		workspaceId={mocks.searchParams.get("workspaceId")}
		knowledgeId={mocks.searchParams.get("knowledgeId")}
	/>
);

beforeEach(() => {
	vi.clearAllMocks();
	vi.stubGlobal("innerWidth", 1440);
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
		new DOMRect(0, 0, 800, 600),
	);
	mocks.workspaceStatus = "SUCCESS";
	mocks.searchParams = new URLSearchParams();
	mocks.session.user.meta = {};
	forgetSessionNewChat();
	root.options = testChatOptions({ agentMode: "choice" });
	mocks.createRoom.mockResolvedValue({
		room: { roomId: "sent" },
		firstMessage: Promise.resolve(null),
	});
	// preparing fails unless a test hands over a room, so sending creates one
	mocks.createEmptyRoom.mockReset().mockRejectedValue(new Error("Offline"));
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

/**
 * Open a panel from the Workspace's rail, opening the Workspace from the
 * header first when it is closed — while it is, the whole pane is hidden, and
 * a role query skips it. A rail entry is a button; its tab is a tab.
 */
function selectWorkspaceItem(name: string) {
	const toggle = screen.queryByRole("button", {
		name: "workbench.openWorkspace",
	});
	if (toggle) fireEvent.click(toggle);
	fireEvent.click(screen.getByRole("button", { name }));
}

/** Open Settings, which prepares the room, and let the preparation settle. */
async function renderWorkspace() {
	const result = render(<NewChatFromLink />);
	selectWorkspaceItem("workspacePlaces.settings");
	await waitFor(() => expect(mocks.createEmptyRoom).toHaveBeenCalled());
	await act(async () => {});
	return result;
}

/** Prepare a file-capable room without backend calls in this integration test. */
function createPreparedRoom(): RoomStore {
	return new RoomStore({
		chatOptions: root.options,
		roomId: "prepared",
		insightId: "insight",
		workbenchPanels: DEFAULT_WORKBENCH_PANELS,
	});
}

test("selecting an agent and changing modes preserves its settings and the composer draft", async () => {
	await renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Add local" }));
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Instructions")).toHaveValue(
			"Agent instructions",
		),
	);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
	expect(screen.getByLabelText("Resources")).toHaveTextContent(
		"agent-tool,local",
	);
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Edited instructions" },
	});
	fireEvent.change(screen.getByLabelText("Message draft"), {
		target: { value: "Keep my typed draft" },
	});
	mocks.selectModelById.mockClear();
	fireEvent.click(screen.getByRole("button", { name: "Agent" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Chat" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("chat"),
	);
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent("Alpha");
	expect(screen.getByLabelText("Resources")).toHaveTextContent(
		"agent-tool,local",
	);
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Edited instructions",
	);
	expect(screen.getByLabelText("Message draft")).toHaveValue(
		"Keep my typed draft",
	);
	expect(mocks.selectModelById).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(mocks.createRoom).toHaveBeenCalledWith(
			"chat",
			"Hello",
			[],
			expect.objectContaining({
				workspace: { workspace_id: "alpha", name: "Alpha" },
				instructions: "Edited instructions",
				harnessType: undefined,
				// the room's own; the backend adds the agent's
				mcp: [expect.objectContaining({ id: "local" })],
			}),
			"alpha",
			undefined,
			expect.any(Function),
		),
	);
});

test("Agent mode survives selecting and removing a saved agent", async () => {
	await renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Add local" }));
	fireEvent.click(screen.getByRole("button", { name: "Agent" }));
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Instructions")).toHaveValue(
			"Agent instructions",
		),
	);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
	fireEvent.click(screen.getByRole("button", { name: "Save default" }));
	expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
		"Default",
	);
	expect(screen.getByLabelText("Resources")).toHaveTextContent(/^local$/);
	expect(screen.getByLabelText("Instructions")).toHaveValue("");
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Current instructions" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(mocks.createRoom).toHaveBeenCalledWith(
			"agent",
			"Hello",
			[],
			expect.objectContaining({
				instructions: "Current instructions",
				harnessType: "semoss",
				workspace: undefined,
			}),
			undefined,
			undefined,
			expect.any(Function),
		),
	);
});

test.each(["chat", "agent"] as const)(
	"a prepared %s room keeps the selected agent and submits the latest draft options",
	async (mode) => {
		const room = createPreparedRoom();
		const updateRoomOptions = vi
			.fn<RoomStore["updateRoomOptions"]>()
			.mockResolvedValue();
		room.updateRoomOptions = updateRoomOptions;
		room.askMessage = vi.fn<RoomStore["askMessage"]>().mockResolvedValue();

		mocks.createEmptyRoom.mockResolvedValue(room);
		await renderWorkspace();
		fireEvent.click(screen.getByRole("button", { name: "Add local" }));
		fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
		await waitFor(() =>
			expect(screen.getByLabelText("Instructions")).toHaveValue(
				"Agent instructions",
			),
		);
		if (mode === "agent")
			fireEvent.click(screen.getByRole("button", { name: "Agent" }));
		fireEvent.change(screen.getByLabelText("Instructions"), {
			target: { value: "Before opening files" },
		});
		selectWorkspaceItem("workspacePlaces.files");
		await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
		expect(screen.getAllByRole("tab")).toHaveLength(2);
		selectWorkspaceItem("workspacePlaces.settings");
		expect(screen.getByLabelText("Instructions")).toHaveValue(
			"Before opening files",
		);
		fireEvent.change(screen.getByLabelText("Instructions"), {
			target: { value: "After opening files" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Remove local" }));
		fireEvent.click(screen.getByRole("button", { name: "Send" }));
		await waitFor(() =>
			expect(updateRoomOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					instructions: "After opening files",
					workspace: { workspace_id: "alpha", name: "Alpha" },
					harnessType: mode === "agent" ? "semoss" : undefined,
					// the room's own, none left; the agent's are its agent tools
					mcp: [],
				}),
			),
		);
		expect(room.agentTools.map((tool) => tool.id)).toEqual([
			"agent-tool",
			"local",
		]);
		expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
		expect(mocks.createRoom).not.toHaveBeenCalled();
		expect(room.mode).toBe(mode);
	},
);

test("a pending agent stays selected in Chat, and removing it ignores its late response", async () => {
	mocks.workspaceStatus = "LOADING";
	// a prepared room, so the only Retry is the agent's
	mocks.createEmptyRoom.mockResolvedValue(createPreparedRoom());
	const { rerender } = await renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Agent" }));
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	fireEvent.click(screen.getByRole("button", { name: "Chat" }));
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent("Alpha");
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(mocks.createRoom).not.toHaveBeenCalled();
	mocks.workspaceStatus = "ERROR";
	fireEvent.click(screen.getByRole("button", { name: "Add local" }));
	// the failed preparation renders its Retry after the rejection settles
	fireEvent.click(
		await screen.findByRole("button", { name: "room:studio.retry" }),
	);
	expect(mocks.refreshWorkspace).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole("button", { name: "Save default" }));
	mocks.workspaceStatus = "SUCCESS";
	rerender(<NewChatFromLink />);
	expect(screen.getByLabelText("Instructions")).toHaveValue("");
	expect(screen.getByLabelText("Resources")).toHaveTextContent(/^local$/);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
});

test.each(["chat", "agent"] as const)(
	"selecting an agent in Settings preserves %s mode",
	async (mode) => {
		await renderWorkspace();
		if (mode === "agent")
			fireEvent.click(screen.getByRole("button", { name: "Agent" }));
		fireEvent.click(
			screen.getByRole("button", { name: "Save Alpha in Settings" }),
		);
		await waitFor(() =>
			expect(screen.getByLabelText("Instructions")).toHaveValue(
				"Agent instructions",
			),
		);
		expect(screen.getByLabelText("Mode")).toHaveTextContent(mode);
		expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
			"Alpha",
		);
	},
);

test("without agent mode saved agents retain chat behavior", async () => {
	root.options = testChatOptions({ agentMode: "chat-only" });
	await renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
			"Alpha",
		),
	);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Agent instructions",
	);
});

test("when the agent decides the mode, a chat with an agent runs in agent mode", async () => {
	root.options = testChatOptions({ agentMode: "follows-agent" });
	await renderWorkspace();
	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Instructions")).toHaveValue(
			"Agent instructions",
		),
	);
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Chat" }));
	expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(mocks.createRoom).toHaveBeenCalledWith(
			"agent",
			"Hello",
			[],
			expect.objectContaining({
				harnessType: "semoss",
				workspace: { workspace_id: "alpha", name: "Alpha" },
			}),
			"alpha",
			undefined,
			expect.any(Function),
		),
	);
});

test("when the agent decides the mode, Default Agent runs in agent mode and No Agent removes it", async () => {
	root.options = testChatOptions({ agentMode: "follows-agent" });
	await renderWorkspace();
	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
	fireEvent.click(screen.getByRole("button", { name: "Pick Default Agent" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Pick No Agent" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("chat"),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Pick Default Agent in Settings" }),
	);
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(mocks.createRoom).toHaveBeenCalledWith(
			"agent",
			"Hello",
			[],
			expect.objectContaining({
				harnessType: "semoss",
				workspace: undefined,
			}),
			undefined,
			undefined,
			expect.any(Function),
		),
	);
});

test("when the agent decides the mode, No Agent after a saved agent runs in chat mode", async () => {
	root.options = testChatOptions({ agentMode: "follows-agent" });
	await renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	fireEvent.click(screen.getByRole("button", { name: "Pick No Agent" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("chat"),
	);
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
		"Default",
	);
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(mocks.createRoom).toHaveBeenCalledWith(
			"chat",
			"Hello",
			[],
			expect.objectContaining({
				harnessType: undefined,
				workspace: undefined,
			}),
			undefined,
			undefined,
			expect.any(Function),
		),
	);
});

test("without the flag, No Agent and Default Agent are not separate choices", async () => {
	await renderWorkspace();
	expect(
		screen.queryByRole("button", { name: "Pick Default Agent" }),
	).toBeNull();
	expect(
		screen.queryByRole("button", {
			name: "Pick Default Agent in Settings",
		}),
	).toBeNull();
});

test("Settings prepares the room, and the toggle closes and reopens it on the same tab", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom.mockResolvedValue(room);
	await renderWorkspace();
	// the prepared room adds Files to the rail and keeps Settings in front
	expect(
		screen.getByRole("tab", { name: "room:workspacePlaces.files" }),
	).toHaveAttribute("aria-selected", "false");
	const settings = screen.getByRole("tab", {
		name: "room:workspacePlaces.settings",
	});
	expect(settings).toHaveAttribute("aria-selected", "true");
	expect(room.workbenchPane.isOpen).toBe(true);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.closeWorkspace" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.openWorkspace" }),
	);
	expect(
		screen.getByRole("tab", { name: "room:workspacePlaces.settings" }),
	).toBe(settings);
	expect(settings).toHaveAttribute("aria-selected", "true");
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
	expect(mocks.createRoom).not.toHaveBeenCalled();
});

test("opening the Workspace on a new chat prepares its room once", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom.mockResolvedValue(room);
	render(<NewChatFromLink />);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.openWorkspace" }),
	);
	expect(
		screen.getByRole("button", { name: "workbench.closeWorkspace" }),
	).toBeInTheDocument();
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(room.workbenchPane.isOpen).toBe(true);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.closeWorkspace" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.openWorkspace" }),
	);
	expect(room.workbenchPane.isOpen).toBe(true);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
});

test("closing the Workspace while the room prepares leaves it closed", async () => {
	const room = createPreparedRoom();
	let resolvePreparation: (room: RoomStore) => void = () => {};
	mocks.createEmptyRoom.mockImplementationOnce(
		() =>
			new Promise<RoomStore>((resolve) => {
				resolvePreparation = resolve;
			}),
	);
	render(<NewChatFromLink />);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.openWorkspace" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.closeWorkspace" }),
	);
	resolvePreparation(room);
	await waitFor(() => expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1));
	await screen.findByRole("button", { name: "workbench.openWorkspace" });
	expect(room.workbenchPane.isOpen).toBe(false);
});

test("Retry after a failed preparation reopens the Workspace in the prepared room", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValueOnce(room);
	render(<NewChatFromLink />);
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.openWorkspace" }),
	);
	await screen.findByRole("alert");
	// the failed preparation renders its Retry after the rejection settles
	fireEvent.click(
		await screen.findByRole("button", { name: "room:studio.retry" }),
	);
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(room.workbenchPane.isOpen).toBe(true);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(2);
});

test("a new chat's header has its toggle but no title, and its rail lists panels", () => {
	render(<NewChatFromLink />);
	const header = screen.getByRole("banner");
	expect(header).not.toHaveTextContent("header.newChat");
	expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.openWorkspace" }),
	);
	const rail = document.querySelector<HTMLElement>("[data-rail]");
	if (!rail) throw new Error("the panel rail did not render");
	expect(
		within(rail).getByRole("button", { name: "workspacePlaces.settings" }),
	).toBeVisible();
	// a draft is not a room yet: no room actions anywhere
	expect(
		screen.queryByRole("button", { name: "sidebar:actions.rename" }),
	).toBeNull();
});

test("reopening keeps Files, and tab changes preserve both the form and editor", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom.mockResolvedValue(room);
	await renderWorkspace();
	selectWorkspaceItem("workspacePlaces.files");
	const files = await screen.findByRole("tab", {
		name: "room:workspacePlaces.files",
	});
	const editor = screen.getByLabelText("File draft");
	fireEvent.change(editor, { target: { value: "Keep file edits" } });
	selectWorkspaceItem("workspacePlaces.settings");
	const instructions = screen.getByLabelText("Instructions");
	fireEvent.change(instructions, { target: { value: "Keep settings" } });
	fireEvent.keyDown(files, { key: "Enter" });
	fireEvent.click(
		screen.getByRole("button", { name: "workbench.closeWorkspace" }),
	);
	// this test's Files blueprint has no matcher, so reopen through Settings
	selectWorkspaceItem("workspacePlaces.settings");
	expect(screen.getByLabelText("Instructions")).toBe(instructions);
	expect(instructions).toHaveValue("Keep settings");
	fireEvent.keyDown(files, { key: "Enter" });
	expect(files).toHaveAttribute("aria-selected", "true");
	expect(screen.getByLabelText("File draft")).toBe(editor);
	expect(editor).toHaveValue("Keep file edits");
	expect(screen.getByLabelText("Message draft")).toHaveValue(
		"Keep this draft",
	);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
});

test("failed preparation keeps draft settings usable, and Retry reopens Settings in the room", async () => {
	const room = createPreparedRoom();
	await renderWorkspace();
	await screen.findByRole("alert");
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Keep after retry" },
	});
	mocks.createEmptyRoom.mockResolvedValueOnce(room);
	// the failed preparation renders its Retry after the rejection settles
	fireEvent.click(
		await screen.findByRole("button", { name: "room:studio.retry" }),
	);
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(
		screen.getByRole("tab", { name: "room:workspacePlaces.settings" }),
	).toHaveAttribute("aria-selected", "true");
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Keep after retry",
	);
	expect(room.workbenchPane.isOpen).toBe(true);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(2);
});

test("connector viewers share the prepared room and transfer draft context before sending", async () => {
	const room = createPreparedRoom();
	let resolvePreparation: (room: RoomStore) => void = () => {};
	mocks.createEmptyRoom.mockImplementationOnce(
		() =>
			new Promise<RoomStore>((resolve) => {
				resolvePreparation = resolve;
			}),
	);
	const askMessage = vi.fn<RoomStore["askMessage"]>().mockResolvedValue();
	room.updateRoomOptions = vi
		.fn<RoomStore["updateRoomOptions"]>()
		.mockResolvedValue();
	room.askMessage = askMessage;

	render(<NewChatFromLink />);
	selectWorkspaceItem("workspacePlaces.settings");
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Keep draft settings" },
	});
	// Settings and both viewer opens share one preparation
	fireEvent.click(screen.getByRole("button", { name: "Open Gmail" }));
	fireEvent.click(screen.getByRole("button", { name: "Open Gmail" }));
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
	resolvePreparation(room);
	await screen.findByRole("tab", { name: "connectors:services.gmail" });
	// Settings and the Files the prepared room adds to the rail, then Gmail
	expect(screen.getAllByRole("tab")).toHaveLength(3);
	fireEvent.click(
		screen.getByRole("button", { name: "Add email to context" }),
	);
	expect(screen.getByLabelText("Queued context")).toHaveTextContent(
		"email.md",
	);
	expect(room.contextItems.items).toHaveLength(0);
	selectWorkspaceItem("workspacePlaces.files");
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
	selectWorkspaceItem("workspacePlaces.settings");
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Keep draft settings",
	);
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() => expect(askMessage).toHaveBeenCalledTimes(1));
	expect(room.contextItems.items.map((item) => item.name)).toEqual([
		"email.md",
	]);
	expect(screen.getByLabelText("Queued context")).toBeEmptyDOMElement();
});

test("retrying failed source preparation reopens the requested viewer", async () => {
	await renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Open Gmail" }));
	await waitFor(() => expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(2));
	mocks.createEmptyRoom.mockResolvedValueOnce(createPreparedRoom());
	// the failed preparation renders its Retry after the rejection settles
	fireEvent.click(
		await screen.findByRole("button", { name: "room:studio.retry" }),
	);
	await screen.findByRole("tab", { name: "connectors:services.gmail" });
	// the prepared room offers Files on its rail without opening it
	expect(
		screen.getByRole("tab", { name: "room:workspacePlaces.files" }),
	).toHaveAttribute("aria-selected", "false");
});

test("Activity prepares the room and opens its log, and Retry after a failure opens it again", async () => {
	await renderWorkspace();
	selectWorkspaceItem("workspacePlaces.activity");
	await waitFor(() => expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(2));
	mocks.createEmptyRoom.mockResolvedValueOnce(createPreparedRoom());
	// the failed preparation renders its Retry after the rejection settles
	fireEvent.click(
		await screen.findByRole("button", { name: "room:studio.retry" }),
	);
	await screen.findByRole("tab", { name: "room:workspacePlaces.activity" });
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(3);
	// the prepared room offers Files on its rail without opening it
	expect(
		screen.getByRole("tab", { name: "room:workspacePlaces.files" }),
	).toHaveAttribute("aria-selected", "false");
});

/** Give the user a default of agent mode with this agent. */
function preferAgent(agentId: string) {
	mocks.session.user.meta = {
		"playground--default-chat-mode": ["agent"],
		"playground--default-chat-agent": [agentId],
	};
}

test("a new chat starts with the user's default mode and agent, and remembers the chat sent", async () => {
	preferAgent("alpha");
	render(<NewChatFromLink />);
	await waitFor(() =>
		expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
			"Alpha",
		),
	);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");

	fireEvent.click(screen.getByRole("button", { name: "Save default" }));
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() => expect(mocks.createRoom).toHaveBeenCalled());
	expect(readSessionNewChat("login-1")).toEqual({
		mode: "agent",
		agentId: "",
	});
});

test("the chat last started in this session beats the user's defaults", async () => {
	preferAgent("alpha");
	writeSessionNewChat("login-1", { mode: "chat", agentId: "" });
	render(<NewChatFromLink />);
	await act(async () => {});

	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
		"Default",
	);
});

test("a default agent the user can no longer open gives way to Default Agent", async () => {
	preferAgent("gone");
	render(<NewChatFromLink />);

	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	await act(async () => {});
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
		"Default",
	);
	expect(
		screen.queryByText("room:settings.agentLoadError"),
	).not.toBeInTheDocument();
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	await waitFor(() =>
		expect(mocks.createRoom).toHaveBeenCalledWith(
			"agent",
			"Hello",
			[],
			expect.objectContaining({ workspace: undefined }),
			undefined,
			undefined,
			expect.any(Function),
		),
	);
});

test("an agent link wins over the user's default agent", async () => {
	preferAgent("gone");
	mocks.searchParams = new URLSearchParams("workspaceId=alpha");
	render(<NewChatFromLink />);

	await waitFor(() =>
		expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
			"Alpha",
		),
	);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
});

test("with no session chat or user default, the host's mode and agent apply", async () => {
	const options = root.options;
	root.options = {
		...options,
		newChat: { ...options.newChat, mode: "agent", agentId: "alpha" },
	};
	try {
		render(<NewChatFromLink />);

		await waitFor(() =>
			expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
				"Alpha",
			),
		);
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
	} finally {
		root.options = options;
	}
});

test("a link's knowledge joins the host's default tools", async () => {
	const pixel = mocks.pixel;
	const options = root.options;
	const engine = [{ engine_id: "kb", engine_name: "Handbook" }];
	mocks.pixel = (request) =>
		request.startsWith("MyEngines")
			? { status: "SUCCESS", refresh: vi.fn(), data: engine }
			: pixel(request);
	root.options = {
		...options,
		newChat: {
			tools: [{ id: "theme-tool", name: "Theme tool", type: "FUNCTION" }],
		},
	};
	mocks.searchParams = new URLSearchParams("knowledgeId=kb");
	try {
		render(<NewChatFromLink />);
		await waitFor(() =>
			expect(screen.getByLabelText("Resources")).toHaveTextContent(
				"theme-tool,kb",
			),
		);
	} finally {
		mocks.pixel = pixel;
		root.options = options;
	}
});

test("options that arrive after the page opens keep the agent the chat starts with", async () => {
	preferAgent("alpha");
	const options = root.options;
	const { rerender } = render(<NewChatFromLink />);
	await waitFor(() =>
		expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
			"Alpha",
		),
	);
	// new options, as from a server theme, rebuild the draft from its defaults
	root.options = { ...options };
	try {
		rerender(<NewChatFromLink />);
		await waitFor(() =>
			expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
				"Alpha",
			),
		);
		expect(screen.getByLabelText("Resources")).toHaveTextContent(
			"agent-tool,local",
		);
		fireEvent.click(screen.getByRole("button", { name: "Send" }));
		await waitFor(() =>
			expect(mocks.createRoom).toHaveBeenCalledWith(
				"agent",
				"Hello",
				[],
				expect.objectContaining({
					workspace: { workspace_id: "alpha", name: "Alpha" },
					instructions: "Agent instructions",
				}),
				"alpha",
				undefined,
				expect.any(Function),
			),
		);
	} finally {
		root.options = options;
	}
});
