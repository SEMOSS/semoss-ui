import {
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
	// stable, as the SDK's are, so views keep the same logins between renders
	logins: {
		logins: {},
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
const root = {
	theme: {
		...new RootStore().theme,
		featureFlags: { enableAgentHarness: true },
		banner: "",
		landing: "",
	},
};
const chat = {
	...mocks,
	models: { selected: null },
	user: { name: "Tester" },
	profileDefaultModelId: "default-model",
	refreshProfileDefaultModel: vi.fn(),
	setSelectedModel: vi.fn(),
	addOptimisticRoom: vi.fn(),
	removeOptimisticRoom: vi.fn(),
	keys: { roomCounter: 0 },
};
vi.mock("react-router", () => ({
	useNavigate: () => mocks.navigate,
	useSearchParams: () => [new URLSearchParams()],
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
	usePixel: (pixel: string) => ({
		status: pixel.includes("GetWorkspace")
			? mocks.workspaceStatus
			: "INITIAL",
		refresh: mocks.refreshWorkspace,
		data: pixel.includes('"alpha"') ? alpha : null,
	}),
}));
vi.mock("@/hooks/use-root", () => ({ useRoot: () => ({ root }) }));
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
vi.mock("@/components/room/room-workspace-creation", () => ({
	SaveWorkspaceDialog: () => <button type="button">Publish</button>,
}));
vi.mock("@/contexts/file-drag-context", () => ({
	FileDragProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/conversation/drop-highlight", () => ({
	DropHighlight: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/conversation/conversation-workspace", () => ({
	ConversationWorkspace: ({
		children,
		panel,
		isOpen,
		onOpenWorkArea,
	}: {
		children: ReactNode;
		panel: ReactNode;
		isOpen: boolean;
		onOpenWorkArea: () => void;
	}) => (
		<>
			{children}
			<button type="button" onClick={onOpenWorkArea}>
				Open Workspace
			</button>
			<div hidden={!isOpen}>{panel}</div>
		</>
	),
}));
vi.mock("@/components/room/room-options-form", () => ({
	RoomOptionsForm: ({
		options,
		onOptionsChange,
	}: ComponentProps<typeof RoomOptionsForm>) => (
		<>
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
			onPrompt,
			onOpenSource,
		}: ComponentProps<typeof RoomInput>) => (
			<>
				<input
					aria-label="Message draft"
					defaultValue="Keep this draft"
				/>
				<output aria-label="Mode">{room.mode}</output>
				<output aria-label="Queued context">
					{room.contextItems.items.map((item) => item.name).join(",")}
				</output>
				<button type="button" onClick={() => onOpenSource?.("gmail")}>
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
						onWorkspaceChange?.(
							{ workspace_id: "alpha", name: "Alpha" },
							true,
						)
					}
				>
					Save Alpha
				</button>
				<button
					type="button"
					onClick={() => onWorkspaceChange?.(null, true)}
				>
					Save default
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
	root.theme.featureFlags.enableAgentHarness = true;
	mocks.createRoom.mockResolvedValue({ roomId: "sent" });
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

/** Start the local workspace through its normal opener. */
function renderWorkspace() {
	const result = render(<NewRoomPage />);
	fireEvent.click(screen.getByRole("button", { name: "Open Workspace" }));
	return result;
}

/** Select a destination from the real workbench File menu. */
function selectWorkspaceItem(name: string) {
	fireEvent.keyDown(screen.getByRole("button", { name: "workbench.file" }), {
		key: "Enter",
	});
	fireEvent.click(screen.getByRole("menuitem", { name }));
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

test("committing an agent and switching back to Chat preserves manual context and the composer draft", async () => {
	renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Add local" }));
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Agent instructions",
	);
	expect(screen.getByLabelText("Resources")).toHaveTextContent(
		"agent-tool,local",
	);
	fireEvent.click(screen.getByRole("button", { name: "Chat" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("chat"),
	);
	expect(screen.getByLabelText("Selected agent")).toHaveTextContent(
		"Default",
	);
	expect(screen.getByLabelText("Resources")).toHaveTextContent(/^local$/);
	expect(screen.getByLabelText("Instructions")).toHaveValue("");
	expect(screen.getByLabelText("Message draft")).toHaveValue(
		"Keep this draft",
	);
	expect(mocks.selectModelById).toHaveBeenCalledWith("default-model");
});

test("default Agent works without a saved agent and normal submission uses current options", async () => {
	renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Save default" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Mode")).toHaveTextContent("agent"),
	);
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
			}),
			undefined,
			undefined,
			expect.any(Function),
		),
	);
});

test("a prepared room keeps Settings docked and submits the latest draft options", async () => {
	const room = createPreparedRoom();
	const updateRoomOptions = vi
		.fn<RoomStore["updateRoomOptions"]>()
		.mockResolvedValue();
	runInAction(() => {
		room.updateRoomOptions = updateRoomOptions;
		room.askMessage = vi.fn<RoomStore["askMessage"]>().mockResolvedValue();
	});
	mocks.createEmptyRoom.mockResolvedValue(room);
	renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Add local" }));
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Before opening files" },
	});
	selectWorkspaceItem("menuFileExplorer.open");
	await screen.findByRole("tab", { name: "room:menuFileExplorer.name" });
	expect(screen.getAllByRole("tab")).toHaveLength(2);
	selectWorkspaceItem("settings.edit");
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
				mcp: [],
			}),
		),
	);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
	expect(mocks.createRoom).not.toHaveBeenCalled();
});

test("a pending agent cannot send, and switching to Chat ignores its late response", async () => {
	mocks.workspaceStatus = "LOADING";
	const { rerender } = renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Save Alpha" }));
	fireEvent.click(screen.getByRole("button", { name: "Send" }));
	expect(mocks.createRoom).not.toHaveBeenCalled();
	mocks.workspaceStatus = "ERROR";
	fireEvent.click(screen.getByRole("button", { name: "Add local" }));
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	expect(mocks.refreshWorkspace).toHaveBeenCalledTimes(1);
	fireEvent.click(screen.getByRole("button", { name: "Chat" }));
	mocks.workspaceStatus = "SUCCESS";
	rerender(<NewRoomPage />);
	expect(screen.getByLabelText("Instructions")).toHaveValue("");
	expect(screen.getByLabelText("Resources")).toHaveTextContent(/^local$/);
	expect(screen.getByLabelText("Mode")).toHaveTextContent("chat");
});

test("without the harness flag saved agents retain chat behavior", async () => {
	root.theme.featureFlags.enableAgentHarness = false;
	renderWorkspace();
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

test("Settings opens locally, deduplicates, and returns when the workspace is empty", () => {
	renderWorkspace();
	const settings = screen.getByRole("tab", {
		name: "room:settings.panelTitle",
	});
	expect(settings).toHaveAttribute("aria-selected", "true");
	expect(
		screen.queryByRole("button", { name: "Publish" }),
	).not.toBeInTheDocument();
	selectWorkspaceItem("settings.edit");
	expect(screen.getAllByRole("tab")).toHaveLength(1);
	expect(screen.getByRole("tab", { name: "room:settings.panelTitle" })).toBe(
		settings,
	);
	fireEvent.click(within(settings).getByRole("button", { name: /close/i }));
	fireEvent.click(screen.getByRole("button", { name: "Open Workspace" }));
	expect(screen.getAllByRole("tab")).toHaveLength(1);
	expect(
		screen.getByRole("tab", { name: "room:settings.panelTitle" }),
	).toHaveAttribute("aria-selected", "true");
	expect(mocks.createEmptyRoom).not.toHaveBeenCalled();
	expect(mocks.createRoom).not.toHaveBeenCalled();
});

test("reopening restores Files and tab changes preserve both the form and editor", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom.mockResolvedValue(room);
	renderWorkspace();
	selectWorkspaceItem("menuFileExplorer.open");
	const files = await screen.findByRole("tab", {
		name: "room:menuFileExplorer.name",
	});
	const editor = screen.getByLabelText("File draft");
	fireEvent.change(editor, { target: { value: "Keep file edits" } });
	selectWorkspaceItem("settings.edit");
	const instructions = screen.getByLabelText("Instructions");
	fireEvent.change(instructions, { target: { value: "Keep settings" } });
	fireEvent.keyDown(files, { key: "Enter" });
	fireEvent.click(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	);
	fireEvent.click(screen.getByRole("button", { name: "Open Workspace" }));
	expect(files).toHaveAttribute("aria-selected", "true");
	expect(screen.getByLabelText("File draft")).toBe(editor);
	expect(editor).toHaveValue("Keep file edits");
	selectWorkspaceItem("settings.edit");
	expect(screen.getByLabelText("Instructions")).toBe(instructions);
	expect(instructions).toHaveValue("Keep settings");
	expect(screen.getByLabelText("Message draft")).toHaveValue(
		"Keep this draft",
	);
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
});

test("failed file preparation keeps draft settings usable and supports retry", async () => {
	const room = createPreparedRoom();
	mocks.createEmptyRoom
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValueOnce(room);
	renderWorkspace();
	selectWorkspaceItem("menuFileExplorer.open");
	await screen.findByRole("alert");
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Keep after retry" },
	});
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	await screen.findByRole("tab", { name: "room:menuFileExplorer.name" });
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	selectWorkspaceItem("settings.edit");
	expect(screen.getByLabelText("Instructions")).toHaveValue(
		"Keep after retry",
	);
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
	renderWorkspace();
	fireEvent.change(screen.getByLabelText("Instructions"), {
		target: { value: "Keep draft settings" },
	});
	fireEvent.click(screen.getByRole("button", { name: "Open Gmail" }));
	fireEvent.click(screen.getByRole("button", { name: "Open Gmail" }));
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
	resolvePreparation(room);
	await screen.findByRole("tab", { name: "connectors:services.gmail" });
	expect(screen.getAllByRole("tab")).toHaveLength(2);
	fireEvent.click(
		screen.getByRole("button", { name: "Add email to context" }),
	);
	expect(screen.getByLabelText("Queued context")).toHaveTextContent(
		"email.md",
	);
	expect(room.contextItems.items).toHaveLength(0);
	selectWorkspaceItem("menuFileExplorer.open");
	await screen.findByRole("tab", { name: "room:menuFileExplorer.name" });
	expect(mocks.createEmptyRoom).toHaveBeenCalledTimes(1);
	selectWorkspaceItem("settings.edit");
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
	mocks.createEmptyRoom
		.mockRejectedValueOnce(new Error("Offline"))
		.mockResolvedValueOnce(createPreparedRoom());
	renderWorkspace();
	fireEvent.click(screen.getByRole("button", { name: "Open Gmail" }));
	await screen.findByRole("alert");
	fireEvent.click(screen.getByRole("button", { name: "room:studio.retry" }));
	await screen.findByRole("tab", { name: "connectors:services.gmail" });
	expect(
		screen.queryByRole("tab", { name: "room:menuFileExplorer.name" }),
	).toBeNull();
});
