import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { fakeStore } from "../../../test/fake-store";
import type { ToolStore } from "../../room/store/tool.store";
import { ResponseMessageTool } from "./response-message-tool";

const mocks = vi.hoisted(() => ({
	decide: vi.fn(),
	error: vi.fn(),
	isMobile: false,
	isWorkbenchActive: false,
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => mocks.isMobile,
	toast: { error: mocks.error },
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	useLoadingMessage: () => ({ loadingMessage: "Running" }),
}));
vi.mock("../../workbench/rail/use-workbench-panel-active", () => ({
	useWorkbenchPanelActive: () => mocks.isWorkbenchActive,
}));
vi.mock("../../room/turns/agent-turn-runner", () => ({
	decideAgentToolAction: mocks.decide,
}));
vi.mock("../../tools/views/tools-view", () => ({
	ToolsView: () => (
		<textarea aria-label="Approval parameters" defaultValue="Keep edits" />
	),
}));

/**
 * A fake resolved call.
 *
 * @param mode - The room's mode.
 * @param approval - Whether the call waits for the user.
 * @param state - Where it shows and whether it is open.
 * @returns The call.
 */
function createTool(
	mode: "chat" | "agent",
	approval = false,
	state: {
		display?: "inline" | "sidebar";
		isOpen?: boolean;
	} = {},
) {
	return fakeStore({
		id: "tool-1",
		isResolved: true,
		display: state.display ?? "sidebar",
		displayName: "Search",
		isOpen: state.isOpen ?? false,
		status: approval ? "INITIAL" : "LOADING",
		pendingAction: approval ? { type: "approval" } : undefined,
		json: { id: "tool-1", _meta: {} },
		room: fakeStore({
			mode,
			workbenchPane: { isOpen: false },
		}),
		message: {
			id: "message-1",
			saveToolExecution: vi.fn().mockResolvedValue(undefined),
		},
		openTool: vi.fn(),
		closeTool: vi.fn(),
		setIsExpanded: vi.fn(),
	}) as unknown as ToolStore;
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.isMobile = false;
	mocks.isWorkbenchActive = false;
});

test("the card expands and collapses an inline tool in place", () => {
	const closedTool = createTool("chat", false, { display: "inline" });
	const { rerender } = render(<ResponseMessageTool tool={closedTool} />);
	const openButton = screen.getByRole("button", {
		name: "Search: Running. actions.openInline",
	});
	expect(openButton).toHaveAttribute("aria-expanded", "false");
	fireEvent.click(openButton);
	expect(closedTool.openTool).toHaveBeenCalledWith("inline");

	const openTool = createTool("chat", false, {
		display: "inline",
		isOpen: true,
	});
	rerender(<ResponseMessageTool tool={openTool} />);
	const collapseButton = screen.getByRole("button", {
		name: "Search: Running. actions.collapse",
	});
	expect(collapseButton).toHaveAttribute("aria-expanded", "true");
	fireEvent.click(collapseButton);
	expect(openTool.closeTool).toHaveBeenCalledOnce();
	expect(openTool.openTool).not.toHaveBeenCalled();
});

test("the card opens a sidebar tool in the sidebar and brings it forward there", () => {
	const closedTool = createTool("chat", false, { display: "sidebar" });
	const { rerender } = render(<ResponseMessageTool tool={closedTool} />);
	const openButton = screen.getByRole("button", {
		name: "Search: Running. actions.openInSidebar",
	});
	expect(openButton).not.toHaveAttribute("aria-expanded");
	fireEvent.click(openButton);
	expect(closedTool.openTool).toHaveBeenCalledWith("sidebar");

	const openTool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	rerender(<ResponseMessageTool tool={openTool} />);
	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: Running. actions.openInSidebar",
		}),
	);
	expect(openTool.openTool).toHaveBeenCalledWith("sidebar");
	expect(openTool.closeTool).not.toHaveBeenCalled();
});

test("the arrow collapses and expands a pending decision without moving it", () => {
	const tool = createTool("agent", true);
	render(<ResponseMessageTool tool={tool} isLarge />);
	expect(screen.getByLabelText("Approval parameters")).toBeInTheDocument();

	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: activity.needsInput. actions.collapse",
		}),
	);
	expect(screen.queryByLabelText("Approval parameters")).toBeNull();

	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: activity.needsInput. actions.openInline",
		}),
	);
	expect(screen.getByLabelText("Approval parameters")).toBeInTheDocument();
	expect(tool.openTool).not.toHaveBeenCalled();
	expect(tool.closeTool).not.toHaveBeenCalled();
});

test("the Workbench button shows when the tool is in the Workbench", () => {
	const tool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	const { rerender } = render(<ResponseMessageTool tool={tool} />);
	expect(
		screen.getByRole("button", { name: "actions.openInline" }),
	).toHaveAttribute("aria-pressed", "true");

	rerender(<ResponseMessageTool tool={createTool("chat")} />);
	expect(
		screen.getByRole("button", { name: "actions.openInSidebar" }),
	).toHaveAttribute("aria-pressed", "false");
});

test.each([
	["inline", "actions.openInSidebar", "sidebar"],
	["sidebar", "actions.openInline", "inline"],
] as const)(
	"the Workbench button takes an open %s tool to the other location",
	(display, label, target) => {
		const tool = createTool("chat", false, { display, isOpen: true });
		render(<ResponseMessageTool tool={tool} />);
		fireEvent.click(screen.getByRole("button", { name: label }));
		expect(tool.openTool).toHaveBeenCalledWith(target);
		expect(tool.closeTool).not.toHaveBeenCalled();
	},
);

test("mobile opens tools inline and only offers moving out of the drawer", () => {
	mocks.isMobile = true;
	mocks.isWorkbenchActive = true;
	const workbenchTool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	const { rerender } = render(<ResponseMessageTool tool={workbenchTool} />);
	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: Running. actions.openInline",
		}),
	);
	expect(workbenchTool.openTool).toHaveBeenCalledWith("inline");
	expect(
		screen.getByRole("button", { name: "actions.openInline" }),
	).toBeInTheDocument();

	rerender(
		<ResponseMessageTool
			tool={createTool("chat", false, {
				display: "inline",
				isOpen: true,
			})}
		/>,
	);
	expect(
		screen.queryByRole("button", { name: "actions.openInSidebar" }),
	).toBeNull();
});

test("a pending decision shows inline once and steps aside for the Workbench", () => {
	const inlineTool = createTool("agent", true, {
		display: "inline",
		isOpen: true,
	});
	const { rerender } = render(
		<ResponseMessageTool tool={inlineTool} isLarge />,
	);
	expect(screen.getAllByLabelText("Approval parameters")).toHaveLength(1);

	rerender(
		<ResponseMessageTool
			tool={createTool("agent", true, {
				display: "sidebar",
				isOpen: true,
			})}
			isLarge
		/>,
	);
	expect(screen.queryByLabelText("Approval parameters")).toBeNull();
});

test("deciding an open call keeps its view mounted, so a framed page keeps its state", () => {
	const tool = createTool("agent", true, { display: "inline", isOpen: true });
	render(<ResponseMessageTool tool={tool} isLarge />);
	const view = screen.getByLabelText("Approval parameters");
	fireEvent.change(view, { target: { value: "Edited in the page" } });

	// the run takes the decision: the call runs, then completes
	const decided = tool as unknown as {
		status: string;
		pendingAction: unknown;
		room: { notify: () => void };
	};
	decided.pendingAction = undefined;
	decided.status = "LOADING";
	act(() => decided.room.notify());
	decided.status = "SUCCESS";
	act(() => decided.room.notify());

	expect(
		screen.getByRole("button", {
			name: "Search: status.completed. actions.collapse",
		}),
	).toBeInTheDocument();
	// the same element, not a new one: a new frame would load its page again
	expect(screen.getByLabelText("Approval parameters")).toBe(view);
	expect(view).toHaveValue("Edited in the page");
});

test("the actions menu only appears when a decision can be cancelled", () => {
	const { rerender } = render(
		<ResponseMessageTool tool={createTool("chat")} />,
	);
	expect(
		screen.queryByRole("button", { name: "activity.actions" }),
	).toBeNull();

	rerender(<ResponseMessageTool tool={createTool("agent", true)} isLarge />);
	expect(
		screen.getByRole("button", { name: "activity.actions" }),
	).toBeInTheDocument();
});

test("keeps cancellation on its owning lifecycle and retains a failed tool for retry", async () => {
	const tool = createTool("chat");
	vi.mocked(tool.message.saveToolExecution).mockRejectedValueOnce(
		new Error("Cancel failed"),
	);
	const { rerender } = render(<ResponseMessageTool tool={tool} />);
	fireEvent.click(screen.getByRole("button", { name: "actions.cancel" }));
	await waitFor(() =>
		expect(mocks.error).toHaveBeenCalledWith("Cancel failed"),
	);
	expect(tool.closeTool).not.toHaveBeenCalled();
	expect(tool.message.saveToolExecution).toHaveBeenCalledWith(
		tool,
		"",
		"cancelled",
		{},
	);
	rerender(<ResponseMessageTool tool={createTool("agent")} />);
	expect(screen.queryByRole("button", { name: "actions.cancel" })).toBeNull();
});

test("keeps approval parameters visible and rejects through the existing agent decision handler", async () => {
	const tool = createTool("agent", true);
	mocks.decide.mockResolvedValue(undefined);
	render(<ResponseMessageTool tool={tool} isLarge />);
	fireEvent.change(screen.getByLabelText("Approval parameters"), {
		target: { value: "Edited request" },
	});
	fireEvent.keyDown(
		screen.getByRole("button", { name: "activity.actions" }),
		{ key: "Enter" },
	);
	fireEvent.click(
		await screen.findByRole("menuitem", { name: "actions.cancel" }),
	);
	await waitFor(() =>
		expect(mocks.decide).toHaveBeenCalledWith(tool, "reject"),
	);
	expect(tool.message.saveToolExecution).not.toHaveBeenCalled();
	expect(screen.getByLabelText("Approval parameters")).toHaveValue(
		"Edited request",
	);
});

test("inline folder tools retain their approval card inside the compact activity row", async () => {
	const base = createTool("chat", false, { display: "inline", isOpen: true });
	const approveChatTool = vi.fn().mockResolvedValue(undefined);
	const tool = {
		...base,
		status: "INITIAL",
		json: {
			...base.json,
			name: "folder_write",
			_meta: { SMSS_CLIENT_TOOL: true, SMSS_MCP_EXECUTION: "ask" },
		},
		parameters: { path: "draft.md", content: "Draft content" },
		room: {
			...base.room,
			chatTools: { approveChatTool },
		},
	} as unknown as ToolStore;
	render(<ResponseMessageTool tool={tool} />);
	expect(screen.getByRole("button", { name: "card.deny" })).toBeVisible();
	expect(approveChatTool).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	await waitFor(() => expect(approveChatTool).toHaveBeenCalledWith(tool));
	expect(tool.closeTool).toHaveBeenCalledTimes(1);
});
