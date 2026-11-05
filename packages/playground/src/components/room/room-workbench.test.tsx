import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { observer } from "mobx-react-lite";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { FileExplorerHost } from "@semoss/panels";
import { NextMessageRoomProvider } from "@/features/conversation/next-message-room.context";
import { RoomLayout } from "@/features/conversation/room-layout";
import { WorkbenchToggleButton } from "@/features/workbench/workbench-toggle-button";
import { RoomStore } from "@/stores/room/room.store";
import { RootStore } from "@/stores/root/root.store";
import { RoomWorkbench } from "./room-workbench";

const mocks = vi.hoisted(() => ({
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
	getI18n: () => ({ t: (key: string) => key }),
}));

/** An editor with an unsaved local value, kept alive by the real workbench. */
function NotesEditor() {
	return <textarea aria-label="Notes" defaultValue="Unsaved notes" />;
}

const RoomLayoutTest = observer(({ room }: { room: RoomStore }) => (
	<RoomLayout
		isWorkbenchOpen={room.sidebar.isOpen}
		header={<WorkbenchToggleButton room={room} />}
		workbench={<RoomWorkbench room={room} />}
	>
		<input aria-label="Draft" defaultValue="Unsent draft" />
	</RoomLayout>
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
		const draft = new RoomStore({
			theme: new RootStore().theme,
			roomId: "",
			panelComponents: {},
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
