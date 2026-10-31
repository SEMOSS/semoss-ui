import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { ToolStore } from "@/stores/tool/tool.store";
import { ResponseMessageTool } from "./response-message-tool";

const mocks = vi.hoisted(() => ({
	decide: vi.fn(),
	error: vi.fn(),
	isMobile: false,
	isSidebarActive: false,
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => mocks.isMobile,
	toast: { error: mocks.error },
}));
vi.mock("@/hooks/use-loading-message", () => ({
	useLoadingMessage: () => ({ loadingMessage: "Running" }),
}));
vi.mock("@/hooks/use-sidebar-panel-active", () => ({
	useSidebarPanelActive: () => mocks.isSidebarActive,
}));
vi.mock("@/stores/message/agent-harness", () => ({
	decideAgentToolAction: mocks.decide,
}));
vi.mock("../mcp/tools-view", () => ({
	ToolsView: () => (
		<textarea aria-label="Approval parameters" defaultValue="Keep edits" />
	),
}));
vi.mock("../room/room-inline-tool", () => ({ RoomInlineTool: () => null }));

function createTool(
	mode: "chat" | "agent",
	approval = false,
	state: {
		display?: "inline" | "sidebar";
		isOpen?: boolean;
	} = {},
) {
	return {
		id: "tool-1",
		isResolved: true,
		display: state.display ?? "sidebar",
		displayName: "Search",
		isOpen: state.isOpen ?? false,
		status: approval ? "INITIAL" : "LOADING",
		pendingAction: approval ? { type: "approval" } : undefined,
		json: { id: "tool-1", _meta: {} },
		room: {
			mode,
			sidebar: { isOpen: false },
		},
		message: {
			id: "message-1",
			saveToolExecution: vi.fn().mockResolvedValue(undefined),
		},
		openTool: vi.fn(),
		closeTool: vi.fn(),
		setIsExpanded: vi.fn(),
	} as unknown as ToolStore;
}
beforeEach(() => {
	vi.clearAllMocks();
	mocks.isMobile = false;
	mocks.isSidebarActive = false;
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

test("the sidebar button shows when the tool is in the sidebar", () => {
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
	"the sidebar button takes an open %s tool to the other location",
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
	mocks.isSidebarActive = true;
	const sidebarTool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	const { rerender } = render(<ResponseMessageTool tool={sidebarTool} />);
	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: Running. actions.openInline",
		}),
	);
	expect(sidebarTool.openTool).toHaveBeenCalledWith("inline");
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

test("a pending decision shows inline once and steps aside for the sidebar", () => {
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
