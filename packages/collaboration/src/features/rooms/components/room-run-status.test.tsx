import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AgentConfiguration } from "@/features/agents/types/agent";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "../types/room";
import { RoomRunStatus } from "./room-run-status";

const workbench = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	openWorkbench: vi.fn(),
	openInline: vi.fn(),
	onApproveTool: vi.fn(async () => undefined),
	onRejectTool: vi.fn(async () => undefined),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useIsMobile: () => false,
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));

const agent = { name: "Assistant" } as AgentConfiguration;

function ask(id: string, extra: Partial<PendingToolApproval> = {}) {
	workbench.tools[id] = {
		id,
		parentMessageId: "answer",
		name: id,
		title: `Tool ${id}`,
		arguments: { day: "Friday" },
		status: "INPUT_REQUIRED",
	};
	return {
		toolId: id,
		parentMessageId: "answer",
		toolName: id,
		arguments: { day: "Friday" },
		task: "book lunch",
		...extra,
	};
}

it("shows each ask on one line and decides plain calls in place", async () => {
	const plain = ask("plain");
	const custom = ask("custom", { uiUrl: "ui://custom" });
	render(
		<RoomRunStatus
			agent={agent}
			turnError={null}
			transportError={null}
			pendingApprovals={[plain, custom]}
			reviewInWorkbench
		/>,
	);
	expect(screen.getByText("Tool plain")).toBeInTheDocument();
	// a tool with its own UI is decided there
	expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	expect(workbench.onApproveTool).toHaveBeenCalledWith(plain, {
		day: "Friday",
	});
	await userEvent.click(screen.getByRole("button", { name: "Deny" }));
	expect(workbench.onRejectTool).toHaveBeenCalledWith(plain);
	await userEvent.click(screen.getAllByRole("button", { name: "Review" })[1]);
	expect(workbench.openWorkbench).toHaveBeenCalledWith("custom");
});
