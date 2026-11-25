import { act, render } from "@testing-library/react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import {
	CALENDAR_BROWSER_PANEL,
	createRoomConnectorLayout,
	EMAIL_BROWSER_PANEL,
	ONEDRIVE_BROWSER_PANEL,
	ROOM_TASK_PANEL_TYPE,
} from "@/features/room-connectors/room-connectors.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolWorkbenchProvider } from "./tool-workbench-provider";

const captured: { workbench?: ReturnType<typeof useToolWorkbench> } = {};
function CaptureWorkbench() {
	captured.workbench = useToolWorkbench();
	return null;
}

const actions = () => {
	if (!captured.workbench) throw new Error("The dock was not captured");
	return captured.workbench.store.getState().layout.actions;
};

beforeEach(() => {
	// the dock asks whether the screen is a phone's
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

/** A room's dock, whose rail gains the task when the key says the chat has a work item. */
function room({ hasTask = false } = {}) {
	return (
		<ToolWorkbenchProvider
			roomId="room-1"
			insightId="insight-1"
			tools={{}}
			pendingApprovals={[]}
			onApproveTool={vi.fn()}
			onRejectTool={vi.fn()}
			createLayout={(id) => createRoomConnectorLayout(id, true, hasTask)}
			layoutKey={hasTask ? "task" : "plain"}
		>
			<CaptureWorkbench />
		</ToolWorkbenchProvider>
	);
}

/** The rail as the owner left it: on the given tab, with OneDrive opened on demand, at 420px. */
function leaveRailOn(activeId: string | null) {
	const before = actions().getSnapshot();
	act(() => {
		actions().loadSnapshot({
			...before,
			panels: {
				...before.panels,
				[ONEDRIVE_BROWSER_PANEL]: {
					id: ONEDRIVE_BROWSER_PANEL,
					type: ONEDRIVE_BROWSER_PANEL,
					name: "OneDrive",
					config: {},
				},
			},
			borders: {
				...before.borders,
				left: {
					...before.borders.left,
					panelIds: [
						...before.borders.left.panelIds,
						ONEDRIVE_BROWSER_PANEL,
					],
					activeId,
					size: 420,
				},
			},
		});
	});
}

it("adds the task tab when it arrives late without moving the owner off the tab they are on, or losing the tabs and width they have", () => {
	const { rerender } = render(room());
	leaveRailOn(EMAIL_BROWSER_PANEL);

	rerender(room({ hasTask: true }));

	const { borders, panels } = actions().getSnapshot();
	expect(borders.left.panelIds).toEqual(
		expect.arrayContaining([
			ROOM_TASK_PANEL_TYPE,
			FILE_PANEL_TYPES.FILE_EXPLORER,
			EMAIL_BROWSER_PANEL,
			ONEDRIVE_BROWSER_PANEL,
		]),
	);
	expect(borders.left.activeId).toBe(EMAIL_BROWSER_PANEL);
	expect(borders.left.size).toBe(420);
	expect(panels[ROOM_TASK_PANEL_TYPE]).toBeDefined();
	expect(panels[ONEDRIVE_BROWSER_PANEL]).toBeDefined();
});

it("still opens the task tab when it joins and the owner has chosen nothing yet", () => {
	const { rerender } = render(room());
	expect(actions().getSnapshot().borders.left.activeId).toBeNull();

	rerender(room({ hasTask: true }));

	const { borders } = actions().getSnapshot();
	expect(borders.left.activeId).toBe(ROOM_TASK_PANEL_TYPE);
	expect(borders.left.panelIds[0]).toBe(ROOM_TASK_PANEL_TYPE);
});

it("keeps the tab the owner is on across several layout updates", () => {
	const { rerender } = render(room());
	leaveRailOn(FILE_PANEL_TYPES.FILE_EXPLORER);

	rerender(room({ hasTask: true }));
	rerender(room());
	rerender(room({ hasTask: true }));

	const { borders } = actions().getSnapshot();
	expect(borders.left.activeId).toBe(FILE_PANEL_TYPES.FILE_EXPLORER);
	expect(borders.left.size).toBe(420);
});

it("opens with no tab selected unless one is chosen, which is how a dock opened by hand behaves", () => {
	render(room());
	act(() => captured.workbench?.openWorkbench());
	expect(captured.workbench?.isOpen).toBe(true);
	expect(actions().getSnapshot().borders.left.activeId).toBeNull();
});

it("shows any of the rail's own tabs by its id, without making a copy, and keeps it showing when asked again", () => {
	render(room({ hasTask: true }));
	const copiesBefore = Object.keys(actions().getSnapshot().panels).length;

	for (const tab of [
		FILE_PANEL_TYPES.FILE_EXPLORER,
		EMAIL_BROWSER_PANEL,
		CALENDAR_BROWSER_PANEL,
		ROOM_TASK_PANEL_TYPE,
	]) {
		act(() => actions().activatePanel({ kind: "border", id: "left" }, tab));
		expect(actions().getSnapshot().borders.left.activeId).toBe(tab);
		// unlike clicking its rail icon, which would collapse it
		act(() => actions().activatePanel({ kind: "border", id: "left" }, tab));
		expect(actions().getSnapshot().borders.left.activeId).toBe(tab);
	}

	expect(Object.keys(actions().getSnapshot().panels)).toHaveLength(
		copiesBefore,
	);
});
