import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ConversationMessage, ConversationTool } from "../types/message";
import { ownedMessageParts } from "../utils/message-presentation";
import { MessageToolActivity } from "./message-tool-activity";

const workbench = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	pendingApprovals: [],
	isOpen: false,
	activeToolId: null,
	getToolDisplayMode: vi.fn(() => "hidden"),
	isToolInline: vi.fn(() => false),
	openWorkbench: vi.fn(),
	openInline: vi.fn(),
	closeTool: vi.fn(),
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("@/features/tools/components/tool-inline", () => ({
	ToolInline: () => <div>Open tool contents</div>,
}));

function tools(...statuses: ConversationTool["status"][]) {
	const message: ConversationMessage = {
		id: "source",
		role: "assistant",
		createdAt: "2026-09-24T16:00:00Z",
		parts: statuses.map((status, index) => ({
			type: "tool",
			tool: {
				id: `tool-${index}`,
				parentMessageId: "source",
				name: `Tool ${index}`,
				title: `Tool ${index}`,
				arguments: {},
				status,
			},
		})),
	};
	return ownedMessageParts(message);
}

beforeEach(() => {
	vi.stubGlobal(
		"matchMedia",
		vi.fn(() => ({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	);
	workbench.tools = {};
	workbench.getToolDisplayMode.mockReset().mockReturnValue("hidden");
	workbench.isToolInline.mockReset().mockReturnValue(false);
	workbench.openWorkbench.mockClear();
});

afterEach(() => vi.unstubAllGlobals());

it("keeps original source timestamps only in contextual tool menus", async () => {
	const items = tools("COMPLETED", "RUNNING");
	items[1].message = {
		...items[1].message,
		id: "later",
		createdAt: "2026-09-24T16:05:00Z",
	};
	const { container } = render(<MessageToolActivity items={items} />);
	expect(container.querySelector("time")).toBeNull();
	fireEvent.keyDown(
		screen.getAllByRole("button", { name: "Tool display options" })[1],
		{ key: "Enter" },
	);
	const menu = await screen.findByRole("menu");
	expect(menu.querySelector("time")).toHaveAttribute(
		"datetime",
		items[1].message.createdAt,
	);
});

it("keeps tool nodes mounted while collapsing successful steps out of the accessible tree", () => {
	const items = tools("RUNNING", "RUNNING");
	const { rerender, container } = render(
		<MessageToolActivity items={items} />,
	);
	const original = screen.getByRole("button", {
		name: "Tool 0 details in workbench",
	});
	rerender(<MessageToolActivity items={tools("COMPLETED", "COMPLETED")} />);
	expect(original.isConnected).toBe(true);
	expect(
		screen.queryByRole("button", { name: "Tool 0 details in workbench" }),
	).toBeNull();
	expect(container.querySelectorAll("[inert]")).toHaveLength(2);
	const summary = screen.getByRole("button", {
		name: "2 tools completed View steps",
	});
	expect(summary).toHaveAttribute("aria-expanded", "false");
	fireEvent.click(summary);
	expect(
		screen.getByRole("button", { name: "Tool 0 details in workbench" }),
	).toBe(original);
	fireEvent.click(original);
	expect(workbench.openWorkbench).toHaveBeenCalledWith("tool-0");
});

it("preserves manually expanded groups when new completed tools arrive", () => {
	const { rerender } = render(
		<MessageToolActivity items={tools("COMPLETED", "COMPLETED")} />,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "2 tools completed View steps" }),
	);
	rerender(
		<MessageToolActivity
			items={tools("COMPLETED", "COMPLETED", "COMPLETED")}
		/>,
	);
	expect(
		screen.getByRole("button", { name: "3 tools completed Hide steps" }),
	).toHaveAttribute("aria-expanded", "true");
});

it("defers folding a focused tool until focus leaves and preserves the button identity", () => {
	const { rerender } = render(
		<MessageToolActivity items={tools("RUNNING", "RUNNING")} />,
	);
	const button = screen.getByRole("button", {
		name: "Tool 0 details in workbench",
	});
	act(() => button.focus());
	rerender(<MessageToolActivity items={tools("COMPLETED", "COMPLETED")} />);
	expect(button).toHaveFocus();
	expect(
		screen.queryByRole("button", { name: "2 tools completed View steps" }),
	).toBeNull();
	act(() => button.blur());
	expect(
		screen.getByRole("button", { name: "2 tools completed View steps" }),
	).toBeInTheDocument();
	expect(button.isConnected).toBe(true);
});

it("keeps inspected tools visible while grouping neighboring successes and failures", () => {
	workbench.getToolDisplayMode.mockImplementation((id?: string) =>
		id === "tool-0" ? "inline" : "hidden",
	);
	workbench.isToolInline.mockImplementation((id?: string) => id === "tool-0");
	render(
		<MessageToolActivity
			items={tools("COMPLETED", "COMPLETED", "COMPLETED", "FAILED")}
		/>,
	);
	expect(screen.getByText("Open tool contents")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "3 tools · 1 failed View steps" }),
	).toBeInTheDocument();
	expect(
		screen.queryByRole("button", {
			name: "Tool 3 details in workbench — failed",
		}),
	).toBeNull();
});

it("includes failures in the summary and reveals the specific errors on focus", async () => {
	const items = tools("COMPLETED", "FAILED", "COMPLETED", "FAILED");
	if (items[1].part.type !== "tool" || items[3].part.type !== "tool")
		throw new Error("Expected tools");
	items[1].part.tool.error = "The workspace could not be found.";
	items[3].part.tool.output = "The subagent limit was reached.";
	render(<MessageToolActivity items={items} />);
	const summary = screen.getByRole("button", {
		name: "4 tools · 2 failed View steps",
	});
	expect(summary).toHaveAttribute("aria-expanded", "false");
	act(() => summary.focus());
	const tooltip = await screen.findByRole("tooltip");
	expect(tooltip).toHaveTextContent("Tool 1 failed");
	expect(tooltip).toHaveTextContent("The workspace could not be found.");
	expect(tooltip).toHaveTextContent("Tool 3 failed");
	expect(tooltip).toHaveTextContent("The subagent limit was reached.");
	expect(summary).toHaveAttribute("aria-describedby", tooltip.id);
	fireEvent.click(summary);
	const failedTool = screen.getByRole("button", {
		name: "Tool 1 details in workbench — failed",
	});
	expect(failedTool).toBeVisible();
	fireEvent.click(failedTool);
	expect(workbench.openWorkbench).toHaveBeenCalledWith("tool-1");
});

it("keeps the summary and expansion state stable when a finished tool reports a failure", () => {
	const { rerender } = render(
		<MessageToolActivity items={tools("COMPLETED", "COMPLETED")} />,
	);
	const summary = screen.getByRole("button", {
		name: "2 tools completed View steps",
	});
	fireEvent.click(summary);
	const row = screen.getByRole("button", {
		name: "Tool 1 details in workbench",
	});
	rerender(<MessageToolActivity items={tools("COMPLETED", "FAILED")} />);
	expect(
		screen.getByRole("button", { name: "2 tools · 1 failed Hide steps" }),
	).toBe(summary);
	expect(summary).toHaveAttribute("aria-expanded", "true");
	expect(
		screen.getByRole("button", {
			name: "Tool 1 details in workbench — failed",
		}),
	).toBe(row);
});

it("shows failure details for a single tool and keeps focused failures visible", async () => {
	const { rerender } = render(
		<MessageToolActivity items={tools("RUNNING", "COMPLETED")} />,
	);
	const row = screen.getByRole("button", {
		name: "Tool 0 details in workbench",
	});
	act(() => row.focus());
	rerender(<MessageToolActivity items={tools("FAILED", "COMPLETED")} />);
	expect(row).toHaveFocus();
	expect(
		screen.queryByRole("button", { name: "2 tools · 1 failed View steps" }),
	).toBeNull();
	const tooltip = await screen.findByRole("tooltip");
	expect(tooltip).toHaveTextContent("No error details were provided.");
	expect(row).toHaveAttribute("aria-describedby", tooltip.id);
});

it("shows a bounded preview on hover while keeping every failed step accessible by expansion", async () => {
	const user = userEvent.setup();
	const items = tools("FAILED", "FAILED", "FAILED", "FAILED");
	for (const item of items) {
		if (item.part.type === "tool")
			item.part.tool.error = "An extended error message. ".repeat(40);
	}
	render(<MessageToolActivity items={items} />);
	const summary = screen.getByRole("button", {
		name: "4 tools · 4 failed View steps",
	});
	await user.hover(summary);
	const tooltip = await screen.findByRole("tooltip");
	expect(tooltip).toHaveTextContent("Tool 0 failed");
	expect(tooltip).toHaveTextContent("Tool 2 failed");
	expect(tooltip).not.toHaveTextContent("Tool 3 failed");
	expect(tooltip).toHaveTextContent("And 1 more failed tool.");
	expect(tooltip).toHaveTextContent("…");
	expect(tooltip.textContent?.length).toBeLessThan(900);
	await user.click(summary);
	expect(
		screen.getByRole("button", {
			name: "Tool 3 details in workbench — failed",
		}),
	).toBeVisible();
});
