import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { FileExplorerHost } from "@semoss/panels";
import { ConversationWorkspace } from "@/features/conversation/conversation-workspace";
import { NextMessageRoomProvider } from "@/features/conversation/next-message-room.context";
import { RoomStore } from "@/stores/room/room.store";
import { RootStore } from "@/stores/root/root.store";
import { RoomSidebar } from "./room-sidebar";

const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
	HTMLElement.prototype,
	"scrollIntoView",
);

const mocks = vi.hoisted(() => ({
	addWorkspace: vi.fn(),
	explorerHost: vi.fn<(host: FileExplorerHost) => void>(),
}));
vi.mock("@semoss/panels", async (original) => {
	const actual = await original<typeof import("@semoss/panels")>();
	return {
		...actual,
		FileExplorerHostProvider: ({
			host,
			children,
		}: {
			host: FileExplorerHost;
			children: ReactNode;
		}) => {
			mocks.explorerHost(host);
			return (
				<actual.FileExplorerHostProvider host={host}>
					{children}
				</actual.FileExplorerHostProvider>
			);
		},
	};
});
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/hooks", () => ({
	useChat: () => ({ chat: { addWorkspace: mocks.addWorkspace } }),
}));

/** An editor with an unsaved local value, kept alive by the real workbench. */
function NotesEditor() {
	return <textarea aria-label="Notes" defaultValue="Unsaved notes" />;
}

const RoomWorkspaceTest = observer(({ room }: { room: RoomStore }) => (
	<ConversationWorkspace
		isOpen={room.sidebar.isOpen}
		onOpenWorkArea={room.openSidebar}
		panel={<RoomSidebar room={room} />}
	>
		<input aria-label="Draft" defaultValue="Unsent draft" />
	</ConversationWorkspace>
));

/** Build a room with a local panel, without starting network-backed room loading. */
function createRoom(): RoomStore {
	const room = new RoomStore({
		theme: new RootStore().theme,
		roomId: "room-controls",
		panelComponents: { notes: { name: "Notes", content: NotesEditor } },
	});
	room.setOptions({ instructions: "Original instructions", mcp: [] });
	room.openSidebarPanel("notes");
	return room;
}

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
});
afterEach(() => {
	vi.unstubAllGlobals();
	if (scrollIntoViewDescriptor) {
		Object.defineProperty(
			HTMLElement.prototype,
			"scrollIntoView",
			scrollIntoViewDescriptor,
		);
	} else {
		Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
	}
});

test("top border orders actions and publishes the latest room configuration", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	mocks.addWorkspace.mockResolvedValue("saved-agent");
	render(<RoomWorkspaceTest room={room} />);
	const border = screen.getByTestId("workbench-border-top");
	expect(
		within(border)
			.getAllByRole("button")
			.map(
				(button) =>
					button.getAttribute("aria-label") ?? button.textContent,
			),
	).toEqual([
		"workbench.file",
		"workspace.publishTooltip",
		"studio.closeWorkspace",
	]);
	act(() =>
		room.setOptions({
			instructions: "Updated instructions",
			mcp: [{ id: "tool-1", type: "PROJECT", name: "Tool" }],
		}),
	);
	await user.click(
		within(border).getByRole("button", {
			name: "workspace.publishTooltip",
		}),
	);
	await user.type(
		screen.getByLabelText("workspace.nameLabel"),
		"Published agent",
	);
	await user.click(
		screen.getByRole("button", { name: "workspace.publishButton" }),
	);
	await waitFor(() =>
		expect(mocks.addWorkspace).toHaveBeenCalledWith(
			expect.objectContaining({
				system_prompt: "Updated instructions",
				mcp: [{ id: "tool-1", type: "PROJECT", name: "Tool" }],
			}),
		),
	);
});

test("closing and reopening retain drafts and panels and restore conversation focus", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	render(<RoomWorkspaceTest room={room} />);
	const draft = screen.getByLabelText("Draft");
	// jsdom has no pane geometry; the resize handle intercepts pointer focus.
	act(() => draft.focus());
	expect(draft).toHaveFocus();
	const originalPanels = room.workbench.getState().layout.panels;
	await user.click(
		screen.getByRole("button", { name: "studio.closeWorkspace" }),
	);
	expect(room.sidebar.isOpen).toBe(false);
	await waitFor(() => expect(draft).toHaveFocus());
	act(() => {
		room.openSidebarPanel("notes");
	});
	expect(room.workbench.getState().layout.panels).toBe(originalPanels);
	expect(screen.getByLabelText("Draft")).toBe(draft);
	expect(draft).toHaveValue("Unsent draft");
});

test("mobile actions close both the drawer and work area and restore conversation focus", async () => {
	vi.stubGlobal("innerWidth", 360);
	const user = userEvent.setup();
	const room = createRoom();
	render(<RoomWorkspaceTest room={room} />);
	const draft = screen.getByLabelText("Draft");
	// jsdom has no pane geometry; the resize handle intercepts pointer focus.
	act(() => draft.focus());
	expect(draft).toHaveFocus();
	await user.click(
		screen.getByRole("button", { name: "Panels and actions" }),
	);
	const drawer = await screen.findByRole("dialog");
	expect(
		within(drawer).getByRole("button", {
			name: "workspace.publishTooltip",
		}),
	).toBeInTheDocument();
	await user.click(
		within(drawer).getByRole("button", { name: "studio.closeWorkspace" }),
	);
	expect(room.sidebar.isOpen).toBe(false);
	await waitFor(() => expect(drawer).toHaveAttribute("data-state", "closed"));
	await waitFor(() => expect(draft).toHaveFocus());
	act(() => {
		room.openSidebarPanel("notes");
	});
	expect(drawer).toHaveAttribute("data-state", "closed");
});

test("mobile top menus navigate and dismiss the drawer without closing the work area", async () => {
	vi.stubGlobal("innerWidth", 360);
	const user = userEvent.setup();
	const room = createRoom();
	const before = room.workbench.getState().layout.openPanelIds.length;
	render(<RoomSidebar room={room} />);
	await user.click(
		screen.getByRole("button", { name: "Panels and actions" }),
	);
	const drawer = await screen.findByRole("dialog");
	fireEvent.keyDown(
		within(drawer).getByRole("button", { name: "workbench.file" }),
		{ key: "Enter" },
	);
	expect(
		screen.queryByRole("menuitem", { name: "workbench.navigate" }),
	).not.toBeInTheDocument();
	await user.click(
		await screen.findByRole("menuitem", { name: "menuFileExplorer.open" }),
	);
	expect(room.workbench.getState().layout.openPanelIds).toHaveLength(
		before + 1,
	);
	expect(room.sidebar.isOpen).toBe(true);
	await waitFor(() => expect(drawer).toHaveAttribute("data-state", "closed"));
});

test("mobile command palette opens above the actions drawer", async () => {
	vi.stubGlobal("innerWidth", 360);
	Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
		configurable: true,
		value: vi.fn(),
	});
	const user = userEvent.setup();
	render(<RoomSidebar room={createRoom()} />);
	await user.click(
		screen.getByRole("button", { name: "Panels and actions" }),
	);
	const drawer = await screen.findByRole("dialog");
	fireEvent.keyDown(
		within(drawer).getByRole("button", { name: "workbench.file" }),
		{ key: "Enter" },
	);
	fireEvent.click(
		await screen.findByRole("menuitem", {
			name: "workbench.commandPalette",
		}),
	);
	expect(
		await screen.findByRole("dialog", {
			name: "Workbench Command Palette",
		}),
	).toBeInTheDocument();
	await user.keyboard("{Escape}");
	expect(drawer).toHaveAttribute("data-state", "open");
});

test.each([false, true])(
	"file context actions queue on the next message room (draft: %s)",
	async (isDraft) => {
		const room = createRoom();
		const draft = new RoomStore({
			theme: new RootStore().theme,
			roomId: "",
			panelComponents: {},
		});
		const panel = <RoomSidebar room={room} />;
		render(
			isDraft ? (
				<NextMessageRoomProvider room={draft}>
					{panel}
				</NextMessageRoomProvider>
			) : (
				panel
			),
		);
		const host = mocks.explorerHost.mock.lastCall?.[0];
		const file = { name: "notes.txt", path: "/notes.txt" };
		const mode = { type: "INSIGHT", insightId: "room-controls" } as const;
		const actions = host?.secondaryActions?.(file, mode) ?? [];
		expect(actions).toHaveLength(1);
		await act(async () => {
			await actions[0].action(file);
			await actions[0].action(file);
		});
		const target = isDraft ? draft : room;
		expect(target.contextItems.items).toEqual([
			expect.objectContaining({ path: "notes.txt", name: "notes.txt" }),
		]);
		expect(
			host?.secondaryActions?.({ ...file, type: "directory" }, mode),
		).toEqual([]);
		if (isDraft) expect(room.contextItems.items).toEqual([]);
	},
);
