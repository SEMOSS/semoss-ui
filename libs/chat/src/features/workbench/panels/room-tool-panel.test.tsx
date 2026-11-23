import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { WorkbenchPanelProps } from "@semoss/workbench";
import { ROOM_TOOL_PANEL } from "./room-tool-panel";

const mocks = vi.hoisted(() => ({
	config: {} as Record<string, unknown>,
	setConfig: vi.fn(),
	control: null as ComponentType<WorkbenchPanelProps> | null,
	tool: null as unknown,
}));
vi.mock("@semoss/workbench", () => ({
	useWorkbenchPanel: () => ({
		config: mocks.config,
		setConfig: mocks.setConfig,
	}),
	useWorkbenchControl: (
		_id: string,
		content: ComponentType<WorkbenchPanelProps>,
	) => {
		mocks.control = content;
	},
	WORKBENCH_STYLES: { chromeButton: "", chromeIcon: "" },
}));
vi.mock("../../room/scope/room.context", () => ({
	useRoom: () => ({ getTool: () => mocks.tool }),
}));
vi.mock("../../room/store/use-room-selector", () => ({
	useRoomSelector: <T,>(
		room: { getTool: () => unknown },
		select: (current: { getTool: () => unknown }) => T,
	) => select(room),
}));
vi.mock("../../tools/views/tools-view", () => ({
	ToolsView: () => <p>Tool view</p>,
}));
vi.mock("../../tools/inspector/tool-inspector", () => ({
	ToolInspector: () => <p>Tool details</p>,
}));

const Panel = ROOM_TOOL_PANEL.content;
const PANEL_ID = "panel-1";

/**
 * Render the tool tab and the control it registers for its chrome.
 *
 * @returns A function that unmounts both.
 */
const renderTab = () => {
	const panel = render(<Panel id={PANEL_ID} />);
	const Control = mocks.control;
	if (!Control) {
		throw new Error("The tool tab registered no control");
	}
	const control = render(<Control id={PANEL_ID} />);
	return () => {
		panel.unmount();
		control.unmount();
	};
};

const detailsSwitch = () =>
	screen.getByRole("button", { name: "actions.showDetails" });

beforeEach(() => {
	vi.clearAllMocks();
	mocks.config = { toolId: "tool-1", app: "app-1", message: "message-1" };
	mocks.control = null;
	mocks.tool = {
		json: { id: "tool-1", server_tool: false },
		openTool: vi.fn(),
	};
});

test("the tool tab switches between the tool's view and the call's details", () => {
	const unmount = renderTab();
	expect(screen.getByText("Tool view")).toBeInTheDocument();
	expect(detailsSwitch()).toHaveAttribute("aria-pressed", "false");
	fireEvent.click(detailsSwitch());
	expect(mocks.setConfig).toHaveBeenCalledWith({ showsDetails: true });
	unmount();

	mocks.config = { ...mocks.config, showsDetails: true };
	renderTab();
	expect(screen.getByText("Tool details")).toBeInTheDocument();
	expect(screen.queryByText("Tool view")).toBeNull();
	expect(detailsSwitch()).toHaveAttribute("aria-pressed", "true");
	fireEvent.click(detailsSwitch());
	expect(mocks.setConfig).toHaveBeenLastCalledWith({ showsDetails: false });
});

test("a server tool keeps its view and has no switch", () => {
	mocks.tool = {
		json: { id: "tool-1", server_tool: true },
		openTool: vi.fn(),
	};
	mocks.config = { ...mocks.config, showsDetails: true };
	renderTab();
	expect(screen.getByText("Tool view")).toBeInTheDocument();
	expect(
		screen.queryByRole("button", { name: "actions.showDetails" }),
	).toBeNull();
	expect(
		screen.getByRole("button", { name: "actions.openInline" }),
	).toBeInTheDocument();
});
