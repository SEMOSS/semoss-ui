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

test.each([false, true])(
	"moves an inline tool to the sidebar instead of collapsing when open: %s",
	(isOpen) => {
		const tool = createTool("chat", false, { display: "inline", isOpen });
		const { container } = render(<ResponseMessageTool tool={tool} />);
		const moveButton = screen.getByRole("button", {
			name: "Search: Running. actions.openInSidebar",
		});

		expect(
			container.querySelector(".lucide-panel-right-close"),
		).toBeInTheDocument();
		fireEvent.click(moveButton);
		expect(tool.openTool).toHaveBeenCalledWith("sidebar");
		expect(tool.closeTool).not.toHaveBeenCalled();
	},
);

test("moves a pending decision between locations without rendering it twice", () => {
	const inlineTool = createTool("agent", true, {
		display: "inline",
		isOpen: true,
	});
	const { rerender } = render(
		<ResponseMessageTool tool={inlineTool} isLarge />,
	);
	expect(screen.getAllByLabelText("Approval parameters")).toHaveLength(1);
	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: activity.needsInput. actions.openInSidebar",
		}),
	);
	expect(inlineTool.openTool).toHaveBeenCalledWith("sidebar");
	expect(inlineTool.closeTool).not.toHaveBeenCalled();

	const sidebarTool = createTool("agent", true, {
		display: "sidebar",
		isOpen: true,
	});
	rerender(<ResponseMessageTool tool={sidebarTool} isLarge />);
	expect(screen.queryByLabelText("Approval parameters")).toBeNull();
	fireEvent.click(
		screen.getByRole("button", {
			name: "Search: activity.needsInput. actions.openInline",
		}),
	);
	expect(sidebarTool.openTool).toHaveBeenCalledWith("inline");
	expect(sidebarTool.closeTool).not.toHaveBeenCalled();

	rerender(<ResponseMessageTool tool={inlineTool} isLarge />);
	expect(screen.getAllByLabelText("Approval parameters")).toHaveLength(1);
});

test.each([false, true])(
	"moves a sidebar tool inline with one click when its tab is active: %s",
	(isSidebarActive) => {
		mocks.isSidebarActive = isSidebarActive;
		const tool = createTool("chat", false, {
			display: "sidebar",
			isOpen: true,
		});
		const { container } = render(<ResponseMessageTool tool={tool} />);
		const inlineButton = screen.getByRole("button", {
			name: "Search: Running. actions.openInline",
		});

		expect(
			container.querySelector(".lucide-panel-right-open"),
		).toBeInTheDocument();
		fireEvent.click(inlineButton);
		expect(tool.openTool).toHaveBeenCalledWith("inline");
		expect(tool.closeTool).not.toHaveBeenCalled();
	},
);

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

	expect(
		container.querySelector(".lucide-panel-right-open"),
	).toBeInTheDocument();
	fireEvent.click(openButton);
	expect(tool.openTool).toHaveBeenCalledWith("inline");
	expect(tool.closeTool).not.toHaveBeenCalled();
});

test("offers one location switch in the tool menu", async () => {
	const tool = createTool("chat", false, { display: "inline", isOpen: true });
	render(<ResponseMessageTool tool={tool} />);
	fireEvent.keyDown(
		screen.getByRole("button", { name: "activity.actions" }),
		{ key: "Enter" },
	);
	const moveItem = await screen.findByRole("menuitem", {
		name: "actions.openInSidebar",
	});
	expect(screen.getAllByRole("menuitem")).toHaveLength(1);
	fireEvent.click(moveItem);
	expect(tool.openTool).toHaveBeenCalledWith("sidebar");
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
