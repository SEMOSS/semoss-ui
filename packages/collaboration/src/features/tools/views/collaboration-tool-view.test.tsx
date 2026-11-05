import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { ToolContent } from "../components/tool-content";
import { collaborationToolViewUri } from "./collaboration-tool-catalog";

const workbench = vi.hoisted(() => ({
	tools: {} as Record<string, ConversationTool>,
	pendingApprovals: [] as PendingToolApproval[],
	onApproveTool: vi.fn(
		async (_action: PendingToolApproval, _args: Record<string, unknown>) =>
			undefined,
	),
	onRejectTool: vi.fn(async (_action: PendingToolApproval) => undefined),
}));
vi.mock("../tool-workbench.context", () => ({
	useToolWorkbench: () => workbench,
}));
vi.mock("../api/use-tool-ui-url", () => ({ useToolUiUrl: () => undefined }));

function call(name: string, output?: unknown): ConversationTool {
	return {
		id: "tool",
		parentMessageId: "answer",
		name,
		title: name,
		arguments: {},
		status: "COMPLETED",
		output: typeof output === "string" ? output : JSON.stringify(output),
	};
}

beforeEach(() => {
	workbench.tools = {};
	workbench.pendingApprovals = [];
	vi.clearAllMocks();
});

it("reuses connector views, preserves custom UIs, and avoids taking over attached tools", () => {
	expect(collaborationToolViewUri(call("ListEvents"))).toBe(
		"component://calendar/agenda?provider=microsoft",
	);
	expect(collaborationToolViewUri(call("ListM365Mail"))).toBe(
		"component://mail/list?provider=microsoft",
	);
	expect(
		collaborationToolViewUri({
			...call("ListTeams"),
			uiUrl: "https://example.com/ui",
		}),
	).toBeUndefined();
	expect(
		collaborationToolViewUri({
			...call("ListTeams"),
			metadata: { SMSS_ENGINE_ID: "attached" },
		}),
	).toBeUndefined();
	expect(
		collaborationToolViewUri({
			...call("ListTeams"),
			metadata: {
				SMSS_MCP_UI: {
					resourceURI: "component://mail/list?provider=google",
				},
			},
		}),
	).toBe("component://mail/list?provider=google");
});

it("filters returned results, retains envelope details, and restores keyboard focus", async () => {
	workbench.tools.tool = call("ListTeams", {
		teams: Array.from({ length: 7 }, (_, index) => ({
			id: `team-${index}`,
			displayName: `Team ${index}`,
			description: `Workspace ${index}`,
		})),
		hasMore: true,
		unavailableCount: 2,
	});
	render(<ToolContent toolId="tool" />);
	await screen.findByRole("button", { name: "Open Team 3" });
	expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
		"data-state",
		"active",
	);
	expect(
		screen.getByText(/More are available from the source/),
	).toBeInTheDocument();
	await userEvent.type(
		screen.getByRole("textbox", { name: "Filter these results" }),
		"Team 3",
	);
	expect(screen.getByText("1 result of 7")).toBeInTheDocument();
	await userEvent.click(screen.getByRole("button", { name: "Open Team 3" }));
	expect(
		screen.getByRole("button", { name: "Back to results" }),
	).toHaveFocus();
	expect(screen.getByText("team-3")).toBeInTheDocument();
	await userEvent.keyboard("{Enter}");
	expect(screen.getByRole("button", { name: "Open Team 3" })).toHaveFocus();
	expect(
		screen.getByRole("textbox", { name: "Filter these results" }),
	).toHaveValue("Team 3");
	await userEvent.click(screen.getByText("Result details"));
	expect(screen.getByText(/Unavailable count/i)).toBeVisible();
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
});

it("shows an explicit empty state and keeps the raw output accessible", async () => {
	workbench.tools.tool = call("SearchFiles", { files: [] });
	render(<ToolContent toolId="tool" />);
	expect(await screen.findByText("Nothing found")).toBeInTheDocument();
	expect(screen.getByText("0 results")).toBeInTheDocument();
	await userEvent.click(screen.getByRole("tab", { name: "Output" }));
	expect(
		screen.getByRole("textbox", { name: "SearchFiles result" }),
	).toHaveValue('{\n  "files": []\n}');
});

it.each([
	["RUNNING", "Working…"],
	["FAILED", "Permission denied"],
	["REJECTED", "This action was not run."],
] as const)("shows %s without claiming completion", async (status, text) => {
	workbench.tools.tool = {
		...call("GetFile"),
		status,
		error: status === "FAILED" ? text : undefined,
	};
	render(<ToolContent toolId="tool" />);
	expect(await screen.findByText(text)).toBeInTheDocument();
});

it("renders plain-text results and source HTML as text without executable links", async () => {
	workbench.tools.tool = call("GetChatMessage", {
		body: "<img src=x onerror=alert(1)>",
		webUrl: "javascript:alert(1)",
	});
	render(<ToolContent toolId="tool" />);
	expect(
		await screen.findByText("<img src=x onerror=alert(1)>"),
	).toBeInTheDocument();
	expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

it("edits structured inputs, retains false and zero, and retries a failed approval without losing edits", async () => {
	const tool = call("EditTopic");
	tool.status = "INPUT_REQUIRED";
	tool.arguments = {
		name: "Launch",
		addPeople: ["alex@example.com"],
		enabled: false,
		limit: 0,
	};
	tool.metadata = {
		SMSS_TOOL_INPUT_SCHEMA: {
			type: "object",
			required: ["name"],
			properties: {
				name: { type: "string", minLength: 1 },
				addPeople: { type: "array", items: { type: "string" } },
				enabled: { type: "boolean" },
				limit: { type: "integer" },
				description: { type: "string" },
			},
		},
	};
	workbench.tools.tool = tool;
	const action = {
		toolId: tool.id,
		toolName: tool.name,
		parentMessageId: tool.parentMessageId,
		arguments: tool.arguments,
	};
	workbench.pendingApprovals = [action];
	workbench.onApproveTool.mockRejectedValueOnce(
		new Error("Connection lost. Try again."),
	);
	render(<ToolContent toolId="tool" />);
	const name = await screen.findByRole("textbox", {
		name: "Name (required)",
	});
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
	await userEvent.clear(name);
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"invalid length",
	);
	expect(name).toHaveAttribute("aria-invalid", "true");
	expect(name).toHaveAccessibleDescription("name has an invalid length.");
	expect(name).toHaveFocus();
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
	await userEvent.type(name, "Autumn launch");
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Connection lost",
	);
	expect(name).toHaveValue("Autumn launch");
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	await waitFor(() =>
		expect(workbench.onApproveTool).toHaveBeenCalledTimes(2),
	);
	expect(workbench.onApproveTool).toHaveBeenLastCalledWith(action, {
		name: "Autumn launch",
		addPeople: ["alex@example.com"],
		enabled: false,
		limit: 0,
	});
	expect(await screen.findByText("Working…")).toBeInTheDocument();
});

it("keeps the same focused input when a value grows beyond 100 characters", async () => {
	const tool = {
		...call("EditTopic"),
		status: "INPUT_REQUIRED" as const,
		arguments: { name: "" },
	};
	workbench.tools.tool = tool;
	workbench.pendingApprovals = [
		{
			toolId: tool.id,
			toolName: tool.name,
			parentMessageId: tool.parentMessageId,
			arguments: tool.arguments,
		},
	];
	render(<ToolContent toolId="tool" />);
	const input = await screen.findByRole("textbox", {
		name: "Name",
	});
	await userEvent.type(input, "a".repeat(110));
	expect(screen.getByRole("textbox", { name: "Name" })).toBe(input);
	expect(input).toHaveValue("a".repeat(110));
	expect(input).toHaveFocus();
	await userEvent.keyboard("{Backspace>20/}");
	expect(input).toHaveValue("a".repeat(90));
	expect(input).toHaveFocus();
});

it("focuses and describes an invalid field inside an array of objects", async () => {
	const tool = {
		...call("EditTopic"),
		status: "INPUT_REQUIRED" as const,
		arguments: { addPeople: [{ email: "" }] },
	};
	tool.metadata = {
		SMSS_TOOL_INPUT_SCHEMA: {
			type: "object",
			properties: {
				addPeople: {
					type: "array",
					items: {
						type: "object",
						required: ["email"],
						properties: { email: { type: "string", minLength: 1 } },
					},
				},
			},
		},
	};
	workbench.tools.tool = tool;
	workbench.pendingApprovals = [
		{
			toolId: tool.id,
			toolName: tool.name,
			parentMessageId: tool.parentMessageId,
			arguments: tool.arguments,
		},
	];
	render(<ToolContent toolId="tool" />);
	const input = await screen.findByRole("textbox", {
		name: "Email (required)",
	});
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	await waitFor(() => expect(input).toHaveFocus());
	expect(input).toHaveAttribute("aria-invalid", "true");
	expect(input).toHaveAccessibleDescription(/email has an invalid length/);
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
	await userEvent.type(input, "alex@example.com");
	expect(input).not.toHaveAttribute("aria-invalid");
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	expect(workbench.onApproveTool).toHaveBeenCalledWith(expect.anything(), {
		addPeople: [{ email: "alex@example.com" }],
	});
});

it("reveals an invalid optional field before moving focus to it", async () => {
	const tool = {
		...call("EditTopic"),
		status: "INPUT_REQUIRED" as const,
		arguments: { name: "Launch" },
	};
	tool.metadata = {
		SMSS_TOOL_INPUT_SCHEMA: {
			type: "object",
			properties: {
				name: { type: "string" },
				count: { type: "integer", minimum: 1 },
			},
		},
	};
	workbench.tools.tool = tool;
	workbench.pendingApprovals = [
		{
			toolId: tool.id,
			toolName: tool.name,
			parentMessageId: tool.parentMessageId,
			arguments: tool.arguments,
		},
	];
	render(<ToolContent toolId="tool" />);
	const disclosure = await screen.findByText("More fields");
	await userEvent.click(disclosure);
	const count = screen.getByRole("spinbutton", { name: "Count" });
	await userEvent.type(count, "0");
	await userEvent.click(disclosure);
	expect(count).not.toBeVisible();
	await userEvent.click(screen.getByRole("button", { name: "Approve" }));
	await waitFor(() => expect(count).toHaveFocus());
	expect(count).toBeVisible();
	expect(count).toHaveAccessibleDescription(
		"count is outside the allowed range.",
	);
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
});

it("declines through the room controller without running the tool", async () => {
	const tool = {
		...call("DeleteMySkill"),
		status: "INPUT_REQUIRED" as const,
		arguments: { skillId: "skill" },
	};
	const action = {
		toolId: tool.id,
		toolName: tool.name,
		parentMessageId: tool.parentMessageId,
		arguments: tool.arguments,
	};
	workbench.tools.tool = tool;
	workbench.pendingApprovals = [action];
	render(<ToolContent toolId="tool" />);
	await userEvent.click(
		await screen.findByRole("button", { name: "Decline" }),
	);
	expect(workbench.onRejectTool).toHaveBeenCalledWith(action);
	expect(workbench.onApproveTool).not.toHaveBeenCalled();
	expect(
		await screen.findByText("This action was not run."),
	).toBeInTheDocument();
});
