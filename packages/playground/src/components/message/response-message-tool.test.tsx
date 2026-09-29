import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import type { ToolStore } from "@/stores";
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

test("uses inline expand and collapse actions for inline tools", () => {
	const closedTool = createTool("chat", false, { display: "inline" });
	const { container, rerender } = render(
		<ResponseMessageTool tool={closedTool} />,
	);
	const openButton = screen.getByRole("button", {
		name: "Search: Running. actions.openInline",
	});

	expect(openButton).toHaveAttribute("aria-expanded", "false");
	expect(
		container.querySelector(".lucide-chevrons-left-right"),
	).toBeInTheDocument();
	fireEvent.click(openButton);
	expect(closedTool.openTool).toHaveBeenCalledWith(undefined);
	expect(closedTool.closeTool).not.toHaveBeenCalled();

	const openTool = createTool("chat", false, {
		display: "inline",
		isOpen: true,
	});
	rerender(<ResponseMessageTool tool={openTool} />);
	const collapseButton = screen.getByRole("button", {
		name: "Search: Running. actions.collapse",
	});

	expect(collapseButton).toHaveAttribute("aria-expanded", "true");
	expect(
		container.querySelector(".lucide-chevrons-right-left"),
	).toBeInTheDocument();
	fireEvent.click(collapseButton);
	expect(openTool.closeTool).toHaveBeenCalledOnce();
	expect(openTool.openTool).not.toHaveBeenCalled();
});

test("reveals an inactive sidebar tool and closes the visible sidebar tool", () => {
	const retainedTool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	const { container, rerender } = render(
		<ResponseMessageTool tool={retainedTool} />,
	);
	const revealButton = screen.getByRole("button", {
		name: "Search: Running. actions.openInSidebar",
	});

	expect(revealButton).toHaveAttribute("aria-expanded", "false");
	expect(
		container.querySelector(".lucide-panel-right-close"),
	).toBeInTheDocument();
	fireEvent.click(revealButton);
	expect(retainedTool.openTool).toHaveBeenCalledWith(undefined);
	expect(retainedTool.closeTool).not.toHaveBeenCalled();

	mocks.isSidebarActive = true;
	const activeTool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	rerender(<ResponseMessageTool tool={activeTool} />);
	const closeButton = screen.getByRole("button", {
		name: "Search: Running. actions.closeInSidebar",
	});

	expect(closeButton).toHaveAttribute("aria-expanded", "true");
	expect(
		container.querySelector(".lucide-panel-right-open"),
	).toBeInTheDocument();
	fireEvent.click(closeButton);
	expect(activeTool.closeTool).toHaveBeenCalledOnce();
	expect(activeTool.openTool).not.toHaveBeenCalled();
});

test("opens sidebar-default tools inline on mobile", () => {
	mocks.isMobile = true;
	mocks.isSidebarActive = true;
	const tool = createTool("chat", false, {
		display: "sidebar",
		isOpen: true,
	});
	const { container } = render(<ResponseMessageTool tool={tool} />);
	const openButton = screen.getByRole("button", {
		name: "Search: Running. actions.openInline",
	});

	expect(openButton).toHaveAttribute("aria-expanded", "false");
	expect(
		container.querySelector(".lucide-chevrons-left-right"),
	).toBeInTheDocument();
	fireEvent.click(openButton);
	expect(tool.openTool).toHaveBeenCalledWith("inline");
	expect(tool.closeTool).not.toHaveBeenCalled();
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
