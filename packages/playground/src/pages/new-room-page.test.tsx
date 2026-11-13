import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ROOM_PANEL_COMPONENTS } from "@/components/room/panels/room-panel.components";
import type { RoomInput } from "@/components/room/room-input";
import type { RoomOptionsForm } from "@/components/room/room-options-form";
import {
	forgetSessionNewChat,
	readSessionNewChat,
	writeSessionNewChat,
} from "@/features/new-chat-preferences/new-chat-preferences";
import { RoomStore } from "@/stores/room/room.store";
import { RootStore } from "@/stores/root/root.store";
import { NewRoomPage } from "./new-room-page";

const mocks = vi.hoisted(() => ({
	createRoom: vi.fn(),
	createEmptyRoom: vi.fn(),
	closeRoom: vi.fn().mockResolvedValue(undefined),
	navigate: vi.fn(),
	selectModelById: vi.fn(),
	workspaceStatus: "SUCCESS",
	refreshWorkspace: vi.fn(),
	pixel: (pixel: string) => ({
		status: pixel.includes("GetWorkspace")
			? mocks.workspaceStatus
			: "INITIAL",
		refresh: mocks.refreshWorkspace,
		data: pixel.includes('"alpha"') ? mocks.alpha : null,
	}),
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
const root = {
	theme: {
		...new RootStore().theme,
		featureFlags: { enableAgentHarness: true, modeFollowsAgent: false },
		banner: "",
		landing: "",
	},
};
const chat = {
	...mocks,
	models: { selected: null },
	selectNewChatDefaultModel: vi.fn(),
	setSelectedModel: vi.fn(),
	addOptimisticRoom: vi.fn(),
	removeOptimisticRoom: vi.fn(),
	keys: { roomCounter: 0 },
};
vi.mock("@/features/settings/settings-dialog.context", () => ({
	useSettingsDialog: () => ({ openSettings: vi.fn() }),
}));
vi.mock("react-router", () => ({
	useNavigate: () => mocks.navigate,
	useSearchParams: () => [mocks.searchParams],
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("@/features/connectors/connector-tools", async (original) => ({
	...(await original<
		typeof import("@/features/connectors/connector-tools")
	>()),
	readUserConnectorTools: vi.fn().mockResolvedValue(null),
	syncRoomConnectorTools: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	InsightProvider: ({ children }: { children: ReactNode }) => children,
	// the session's logins, without reading them from a server
	useLogins: () => mocks.logins,
	usePixel: mocks.pixel,
	useSessionPixel: mocks.pixel,
	// a signed in user, with any new chat defaults a test gives them
	useSession: <T,>(selector: (state: typeof mocks.session) => T) =>
		selector(mocks.session),
}));
vi.mock("@/hooks/use-root", () => ({ useRoot: () => ({ root }) }));
vi.mock("@/hooks/use-playground-theme", () => ({
	usePlaygroundTheme: () => root.theme,
}));
vi.mock("@/hooks/use-chat", () => ({ useChat: () => ({ chat }) }));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useTheme: () => ({ theme: "light" }),
}));
vi.mock("@/components/room/panels/room-panel.components", async () => {
	const { ROOM_PANEL_TYPES } = await import("@/stores/room/room-sidebar");
	const { ROOM_CONFIGURATION_PANEL } = await import(
		"@/components/room/panels/room-configuration-panel"
	);
	const { FILE_PANEL_TYPES } = await import("@semoss/panels");
	const { useNextMessageRoom } = await import(
		"@/features/conversation/next-message-room.context"
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
		ROOM_PANEL_COMPONENTS: {
			[ROOM_PANEL_TYPES.GMAIL]: {
				name: "Gmail",
				mount: "keepAlive",
				content: Source,
			},
			[ROOM_PANEL_TYPES.CONFIGURATION]: ROOM_CONFIGURATION_PANEL,
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
vi.mock("@/contexts/file-drag-context", () => ({
	FileDragProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/conversation/drop-highlight", () => ({
	DropHighlight: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/conversation/room-layout", () => ({
	RoomLayout: ({
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
vi.mock("@/components/room/room-options-form", () => ({
	RoomOptionsForm: ({
		options,
		onOptionsChange,
		onDefaultAgentChange,
	}: ComponentProps<typeof RoomOptionsForm>) => (
		<>
			{onDefaultAgentChange && (
				<button
					type="button"
					onClick={() => onDefaultAgentChange(true)}
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
vi.mock("@/components/room/room-input", () => ({
	RoomInput: observer(
		({
			options,
			room,
			onMcpChange,
			onWorkspaceChange,
			onExitAgentHarness,
			onSwitchToAgentHarness,
			onDefaultAgentChange,
			onPrompt,
			workbenchPanels,
		}: ComponentProps<typeof RoomInput>) => (
			<>
				{onDefaultAgentChange && (
					<>
						<button
							type="button"
							onClick={() => {
								onWorkspaceChange?.(null);
								onDefaultAgentChange(true);
							}}
						>
							Pick Default Agent
						</button>
						<button
							type="button"
							onClick={() => {
								onWorkspaceChange?.(null);
								onDefaultAgentChange(false);
							}}
						>
							Pick No Agent
						</button>
					</>
				)}
				<input
					aria-label="Message draft"
					defaultValue="Keep this draft"
				/>
				<output aria-label="Mode">{room.mode}</output>
				<output aria-label="Queued context">
					{room.contextItems.items.map((item) => item.name).join(",")}
				</output>
				<button
					type="button"
					onClick={() =>
						workbenchPanels?.newRoomPanels?.onOpenPanel({
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
					{options.mcp.map((item) => item.id).join(",")}
				</output>
				<button
					type="button"
					onClick={() =>
						onMcpChange?.([
							...options.mcp,
							{ id: "local", type: "VECTOR", name: "Local" },
						])
					}
				>
					Add local
				</button>
				<button
					type="button"
					onClick={() =>
						onWorkspaceChange?.({
							workspace_id: "alpha",
							name: "Alpha",
						})
					}
				>
					Save Alpha
				</button>
				<button type="button" onClick={() => onWorkspaceChange?.(null)}>
					Save default
				</button>
				<button type="button" onClick={onSwitchToAgentHarness}>
					Agent
				</button>
				<button type="button" onClick={onExitAgentHarness}>
					Chat
				</button>
				<button type="button" onClick={() => onPrompt("Hello", [])}>
					Send
				</button>
			</>
		),
	),
}));

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
	root.theme.featureFlags.enableAgentHarness = true;
	root.theme.featureFlags.modeFollowsAgent = false;
	mocks.createRoom.mockResolvedValue({ roomId: "sent" });
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
		name: "studio.openWorkspace",
	});
	if (toggle) fireEvent.click(toggle);
	fireEvent.click(screen.getByRole("button", { name }));
}

/** Open Settings, which prepares the room, and let the preparation settle. */
async function renderWorkspace() {
	const result = render(<NewRoomPage />);
	selectWorkspaceItem("workspacePlaces.settings");
	await waitFor(() => expect(mocks.createEmptyRoom).toHaveBeenCalled());
	await act(async () => {});
	return result;
}

/** Prepare a file-capable room without backend calls in this integration test. */
function createPreparedRoom(): RoomStore {
	return new RoomStore({
		theme: root.theme,
		roomId: "prepared",
		insightId: "insight",
		panelComponents: ROOM_PANEL_COMPONENTS,
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
				mcp: expect.arrayContaining([
					expect.objectContaining({ id: "agent-tool" }),
					expect.objectContaining({ id: "local" }),
				]),
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
		runInAction(() => {
			room.updateRoomOptions = updateRoomOptions;
			room.askMessage = vi
				.fn<RoomStore["askMessage"]>()
				.mockResolvedValue();
		});
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
					mcp: [expect.objectContaining({ id: "agent-tool" })],
				}),
			),
		);
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
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	expect(mocks.refreshWorkspace).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole("button", { name: "Save default" }));
	mocks.workspaceStatus = "SUCCESS";
	rerender(<NewRoomPage />);
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

test("without the harness flag saved agents retain chat behavior", async () => {
	root.theme.featureFlags.enableAgentHarness = false;
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
	root.theme.featureFlags.modeFollowsAgent = true;
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
	root.theme.featureFlags.modeFollowsAgent = true;
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
	root.theme.featureFlags.modeFollowsAgent = true;
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
	expect(room.sidebar.isOpen).toBe(true);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
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
	render(<NewRoomPage />);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
	);
	expect(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	).toBeInTheDocument();
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(room.sidebar.isOpen).toBe(true);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
	);
	expect(room.sidebar.isOpen).toBe(true);
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
	render(<NewRoomPage />);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
	);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	);
	resolvePreparation(room);
	await waitFor(() => expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1));
	await screen.findByRole("button", { name: "studio.openWorkspace" });
	expect(room.sidebar.isOpen).toBe(false);
});

test("Retry after a failed preparation reopens the Workspace in the prepared room", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValueOnce(room);
	render(<NewRoomPage />);
	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
	);
	await screen.findByRole("alert");
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(room.sidebar.isOpen).toBe(true);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(2);
});

test("a new chat's header has its toggle but no title, and its rail lists panels", () => {
	render(<NewRoomPage />);
	const header = screen.getByRole("banner");
	expect(header).not.toHaveTextContent("header.newChat");
	expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
	fireEvent.click(
		screen.getByRole("button", { name: "studio.openWorkspace" }),
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
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
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
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	await screen.findByRole("tab", { name: "room:workspacePlaces.files" });
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(
		screen.getByRole("tab", { name: "room:workspacePlaces.settings" }),
	).toHaveAttribute("aria-selected", "true");
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Keep after retry",
	);
	expect(room.sidebar.isOpen).toBe(true);
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
	runInAction(() => {
		room.updateRoomOptions = vi
			.fn<RoomStore["updateRoomOptions"]>()
			.mockResolvedValue();
		room.askMessage = askMessage;
	});
	render(<NewRoomPage />);
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
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
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
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
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
	render(<NewRoomPage />);
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
	render(<NewRoomPage />);
	await act(async () => {});

	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
		"Default",
	);
});

test("a default agent the user can no longer open gives way to Default Agent", async () => {
	preferAgent("gone");
	render(<NewRoomPage />);

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
	render(<NewRoomPage />);

	await waitFor(() =>
		expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
			"Alpha",
		),
	);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
});

test("with no session chat or user default, the theme's mode and agent apply", async () => {
	const settings = root.theme.defaultRoomSettings;
	root.theme.defaultRoomSettings = {
		...settings,
		mode: "agent",
		agentId: "alpha",
	};
	try {
		render(<NewRoomPage />);

		await waitFor(() =>
			expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
				"Alpha",
			),
		);
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent");
	} finally {
		root.theme.defaultRoomSettings = settings;
	}
});
