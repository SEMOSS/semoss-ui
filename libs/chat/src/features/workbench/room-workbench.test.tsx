import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { ChatFileExplorerHost } from "../../host/chat-host-config";
import { createTestHostConfig } from "../../testing/test-host-config";
import { NextMessageRoomProvider } from "../conversation/next-message-room.context";
import { RoomLayout } from "../conversation/room-layout";
import { RoomUiStore } from "./room-ui.store";
import { RoomWorkbench } from "./room-workbench";
import { WorkbenchToggleButton } from "./workbench-toggle-button";

const mocks = vi.hoisted(() => ({
	explorerHost: vi.fn<(host: ChatFileExplorerHost) => void>(),
}));
// the host's explorer provider, which records the room's additions
vi.mock("../../host/chat.context", () => ({
	useChat: () => ({
		config: {
			filePanels: {
				ExplorerHostProvider: ({
					host,
					children,
				}: {
					host: ChatFileExplorerHost;
					children: ReactNode;
				}) => {
					mocks.explorerHost(host);
					return children;
				},
			},
		},
	}),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
	getI18n: () => ({ t: (key: string) => key }),
}));

/** An editor with an unsaved local value, kept alive by the real workbench. */
function NotesEditor() {
	return <textarea aria-label="Notes" defaultValue="Unsaved notes" />;
}

const RoomLayoutTest = ({ room }: { room: RoomUiStore }) => (
	<RoomLayout
		isWorkbenchOpen={room.sidebar.isOpen}
		header={<WorkbenchToggleButton room={room} />}
		workbench={<RoomWorkbench room={room} />}
	>
		<input aria-label="Draft" defaultValue="Unsent draft" />
	</RoomLayout>
);

/** Build a room with a local panel, without starting network-backed room loading. */
function createRoom(): RoomUiStore {
	const room = new RoomUiStore({
		roomId: "room-controls",
		host: createTestHostConfig({
			panelComponents: { notes: { name: "Notes", content: NotesEditor } },
		}),
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
afterEach(() => vi.unstubAllGlobals());

test("the Workspace has no strip above its tabs", () => {
	render(<RoomLayoutTest room={createRoom()} />);
	expect(screen.queryByTestId("workbench-border-top")).toBeNull();
	expect(screen.queryByRole("button", { name: "workbench.view" })).toBeNull();
});

test("closing from the header and reopening retain drafts and panels and restore conversation focus", async () => {
	const user = userEvent.setup();
	const room = createRoom();
	render(<RoomLayoutTest room={room} />);
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

test.each([false, true])(
	"file context actions queue on the next message room (draft: %s)",
	async (isDraft) => {
		const room = createRoom();
		const draft = new RoomUiStore({
			roomId: "",
			host: createTestHostConfig(),
		});
		const panel = <RoomWorkbench room={room} />;
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
		const actions = host?.secondaryActions?.(file) ?? [];
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
			host?.secondaryActions?.({ ...file, type: "directory" }),
		).toEqual([]);
		if (isDraft) expect(room.contextItems.items).toEqual([]);
	},
);
