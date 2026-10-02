import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { observable, runInAction } from "mobx";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { CodeEditorProps } from "@semoss/ui/next";
import { ToolsDefaultView } from "@/components/mcp/tools-default-view/tools-default-view";
import type { RoomStore } from "@/stores/room/room.store";
import type { ToolStore } from "@/stores/tool/tool.store";
import { TeamworkToolCard } from "../teamwork/components/teamwork-tool-card";
import { ToolDataView } from "./tool-data-view";
import { ToolInspector } from "./tool-inspector";
import { formatToolPayload } from "./tool-payload";

const mocks = vi.hoisted(() => ({
	decideAgent: vi.fn().mockResolvedValue(undefined),
	find: vi.fn(),
	toastError: vi.fn(),
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { dir: () => "ltr" },
	}),
}));
vi.mock("@/stores/message/agent-harness", () => ({
	decideAgentToolAction: mocks.decideAgent,
}));
vi.mock("@/stores/message/response-message.store", () => ({
	ResponseMessageStore: class {},
}));
vi.mock("@semoss/sdk/react", () => ({
	usePixel: () => ({
		status: "SUCCESS",
		data: {
			tools: [
				{
					name: "example_tool",
					description: "The declared tool description.",
					inputSchema: {
						properties: { subject: { type: "string" } },
						required: ["subject"],
					},
				},
			],
		},
	}),
}));
vi.mock("../teamwork/connectors/use-connect-provider", () => ({
	useConnectProvider: () => vi.fn(),
}));
vi.mock("@semoss/ui/next", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/ui/next")>();
	const { forwardRef, useImperativeHandle } = await import("react");
	return {
		...actual,
		toast: { ...actual.toast, error: mocks.toastError },
		// Monaco's layout is exercised in a real browser; retain its read-only
		// payload and accessible name here to test the surrounding interactions.
		CodeEditor: forwardRef(({ code, options }: CodeEditorProps, ref) => {
			useImperativeHandle(
				ref,
				() => ({ getAction: () => ({ run: mocks.find }) }),
				[],
			);
			return (
				<textarea
					aria-label={options?.ariaLabel}
					value={code}
					readOnly
				/>
			);
		}),
	};
});

const createTool = (status: ToolStore["status"] = "SUCCESS") =>
	observable({
		id: "call-123",
		displayName: "Example tool",
		status,
		parameters: {
			subject: "",
			includeBody: false,
			count: 0,
			optional: null,
		},
		response: '{"items":[{"name":"example"}]}',
		json: {
			name: "example_tool",
			original_name: "example_tool",
			description: "A description of the tool.",
			_meta: {
				SMSS_MCP_EXECUTION: "ask",
				SMSS_PROJECT_NAME: "Example toolbox",
			},
		},
	}) as unknown as ToolStore;

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

test("completed tools open on Output and preserve empty, false, zero and null inputs", async () => {
	const user = userEvent.setup();
	render(<ToolInspector tool={createTool()} />);
	expect(screen.getByRole("tab", { name: "tabs.output" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(screen.getByRole("textbox", { name: /tabs.output/ })).toHaveValue(
		'{\n  "items": [\n    {\n      "name": "example"\n    }\n  ]\n}',
	);
	await user.click(screen.getByRole("tab", { name: "inspector.input" }));
	const pretty = screen.getByRole("region", { name: /inspector.input/ });
	expect(within(pretty).getByText("inspector.emptyString")).toBeVisible();
	expect(within(pretty).getByText("Include Body")).toBeVisible();
	expect(within(pretty).getByText("false")).toBeVisible();
	expect(within(pretty).getByText("0")).toBeVisible();
	expect(within(pretty).getByText("null")).toBeVisible();
	await user.click(screen.getByRole("radio", { name: "inspector.raw" }));
	expect(
		JSON.parse(
			(
				screen.getByRole("textbox", {
					name: /inspector.input/,
				}) as HTMLTextAreaElement
			).value,
		),
	).toEqual({ subject: "", includeBody: false, count: 0, optional: null });
});

test("results automatically appear unless the user has chosen a tab", async () => {
	const user = userEvent.setup();
	const tool = createTool("LOADING");
	const first = render(<ToolInspector tool={tool} />);
	expect(
		screen.getByRole("tab", { name: "inspector.input" }),
	).toHaveAttribute("aria-selected", "true");
	act(() =>
		runInAction(() => {
			tool.status = "SUCCESS";
		}),
	);
	expect(screen.getByRole("tab", { name: "tabs.output" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	first.unmount();
	const pendingTool = createTool("LOADING");
	render(<ToolInspector tool={pendingTool} />);
	await user.click(screen.getByRole("tab", { name: "inspector.info" }));
	act(() =>
		runInAction(() => {
			pendingTool.status = "SUCCESS";
		}),
	);
	expect(screen.getByRole("tab", { name: "inspector.info" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(screen.getByText("A description of the tool.")).toBeVisible();
});

test("Info exposes description, call metadata and the available input schema", async () => {
	const user = userEvent.setup();
	render(
		<ToolInspector
			tool={createTool()}
			inputSchema={{
				properties: {
					count: { type: "integer", description: "Maximum items" },
				},
			}}
		/>,
	);
	await user.click(screen.getByRole("tab", { name: "inspector.info" }));
	expect(screen.getByText("example_tool")).toBeVisible();
	expect(screen.getByText("call-123")).toBeVisible();
	expect(screen.getByText("Example toolbox")).toBeVisible();
	await user.click(screen.getByText("inspector.inputSchema"));
	expect(
		(
			(await screen.findByRole("textbox", {
				name: "inspector.inputSchema",
			})) as HTMLTextAreaElement
		).value,
	).toContain("Maximum items");
	await user.click(screen.getByText("inspector.metadata"));
	expect(
		(
			(await screen.findByRole("textbox", {
				name: "inspector.metadata",
			})) as HTMLTextAreaElement
		).value,
	).toContain("SMSS_MCP_EXECUTION");
});

test.each(["ERROR", "CANCELLED"] as const)(
	"%s keeps the outcome visible even with an empty response",
	(status) => {
		const tool = createTool(status);
		tool.response = "";
		render(<ToolInspector tool={tool} />);
		expect(screen.getByText("inspector.emptyOutput")).toBeVisible();
		expect(
			within(screen.getByRole("tabpanel")).getByText(
				status === "ERROR" ? "status.failed" : "status.cancelled",
			),
		).toBeVisible();
	},
);

test("plain text failures are readable and JSON scalar results are retained", () => {
	expect(formatToolPayload("Permission denied\nTry again.", true)).toEqual({
		text: "Permission denied\nTry again.",
		language: "plaintext",
	});
	for (const value of ["false", "0", "null", '""']) {
		expect(formatToolPayload(value, true)).toEqual({
			text: value,
			language: "json",
		});
	}
});

test("large payloads remain complete when copied and expanded, and closing restores focus", async () => {
	const user = userEvent.setup();
	const value = {
		items: Array.from({ length: 2000 }, (_, id) => ({
			id,
			text: `Item ${id}`,
		})),
	};
	const text = JSON.stringify(value, null, 2);
	const writeText = vi
		.spyOn(navigator.clipboard, "writeText")
		.mockResolvedValue();
	render(<ToolDataView value={value} label="Large input" />);
	await user.click(screen.getByRole("button", { name: "inspector.copy" }));
	expect(writeText).toHaveBeenCalledWith(text);
	const expand = screen.getByRole("button", { name: "actions.expand" });
	await user.click(expand);
	expect(
		within(screen.getByRole("dialog")).getByRole("textbox", {
			name: "Large input",
		}),
	).toHaveValue(text);
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
	expect(expand).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "inspector.find" }));
	expect(mocks.find).toHaveBeenCalledOnce();
});

test("returning to a payload preserves its viewer instead of remounting it", async () => {
	const user = userEvent.setup();
	render(<ToolInspector tool={createTool()} />);
	const output = screen.getByRole("textbox", { name: /tabs.output/ });
	await user.click(screen.getByRole("tab", { name: "inspector.input" }));
	await user.click(screen.getByRole("tab", { name: "tabs.output" }));
	expect(screen.getByRole("textbox", { name: /tabs.output/ })).toBe(output);
});

const createApprovalTool = (mode: "chat" | "agent" = "chat") => {
	const approveChatTool = vi.fn().mockResolvedValue(undefined);
	const declineChatTool = vi.fn().mockResolvedValue(undefined);
	const approveConnectorChatTool = vi.fn().mockResolvedValue(undefined);
	const tool = {
		...createTool("INITIAL"),
		message: {},
		pendingAction: mode === "agent" ? {} : null,
		closeTool: vi.fn(),
		json: {
			name: mode === "chat" ? "folder_write" : "connector_call",
			description: "Write a file",
			_meta: { SMSS_MCP_EXECUTION: "ask" },
		},
		parameters: {
			path: "example.txt",
			content: "Long text\n".repeat(1000),
		},
		room: {
			mode,
			teamwork: {
				approveChatTool,
				declineChatTool,
				approveConnectorChatTool,
				chatToolDefinitions: [],
			},
		},
	} as unknown as ToolStore;
	return { tool, approveChatTool, declineChatTool, approveConnectorChatTool };
};

test("folder approvals remain available on Info and still use the room's approval path", async () => {
	const user = userEvent.setup();
	const { tool, approveChatTool } = createApprovalTool();
	render(<TeamworkToolCard tool={tool} variant="panel" />);
	await user.click(screen.getByRole("tab", { name: "inspector.info" }));
	await user.click(screen.getByRole("button", { name: "card.allow" }));
	expect(approveChatTool).toHaveBeenCalledWith(tool);
	expect(mocks.decideAgent).not.toHaveBeenCalled();
	expect(tool.closeTool).not.toHaveBeenCalled();
});

test("agent denials retain the harness decision path", async () => {
	const user = userEvent.setup();
	const { tool, declineChatTool } = createApprovalTool("agent");
	render(<TeamworkToolCard tool={tool} variant="panel" />);
	await user.click(screen.getByRole("tab", { name: "tabs.output" }));
	await user.click(screen.getByRole("button", { name: "card.deny" }));
	expect(mocks.decideAgent).toHaveBeenCalledWith(tool, "reject");
	expect(declineChatTool).not.toHaveBeenCalled();
});

test("failed approvals report the error and allow retry", async () => {
	const { tool, approveChatTool } = createApprovalTool();
	approveChatTool.mockRejectedValueOnce(new Error("Unavailable"));
	render(<TeamworkToolCard tool={tool} variant="panel" />);
	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	await waitFor(() =>
		expect(mocks.toastError).toHaveBeenCalledWith("card.decisionError"),
	);
	expect(screen.getByRole("button", { name: "card.allow" })).toBeEnabled();
	expect(screen.getByRole("button", { name: "card.deny" })).toBeEnabled();
});

test("the editable default form survives tab changes and submits through the agent decision path", async () => {
	const user = userEvent.setup();
	const tool = createTool("INITIAL");
	Object.assign(tool, { pendingAction: { id: "action-1" } });
	render(
		<ToolsDefaultView
			tool={tool}
			room={{} as RoomStore}
			app="example-app"
			message="message-1"
		/>,
	);
	fireEvent.change(screen.getByRole("textbox", { name: /subject/ }), {
		target: { value: "Edited subject" },
	});
	await user.click(screen.getByRole("tab", { name: "inspector.info" }));
	expect(screen.getByText("The declared tool description.")).toBeVisible();
	await user.click(screen.getByRole("tab", { name: "inspector.input" }));
	expect(screen.getByRole("textbox", { name: /subject/ })).toHaveValue(
		"Edited subject",
	);
	await user.click(screen.getByRole("button", { name: "form.execute" }));
	expect(mocks.decideAgent).toHaveBeenCalledWith(tool, "submit", {
		subject: "Edited subject",
		includeBody: false,
		count: 0,
		optional: null,
	});
});

test("completed default tools show the arguments actually executed and no execute action", async () => {
	const user = userEvent.setup();
	const tool = createTool("ERROR");
	tool.parameters = { actual: "executed value", undeclared: false };
	tool.response = "The tool failed.";
	render(
		<ToolsDefaultView
			tool={tool}
			room={{} as RoomStore}
			app="example-app"
			message="message-1"
		/>,
	);
	expect(screen.getByRole("textbox", { name: /tabs.output/ })).toHaveValue(
		"The tool failed.",
	);
	await user.click(screen.getByRole("tab", { name: "inspector.input" }));
	await user.click(screen.getByRole("radio", { name: "inspector.raw" }));
	expect(
		screen.getByRole("textbox", { name: /inspector.input/ }),
	).toHaveValue(JSON.stringify(tool.parameters, null, 2));
	expect(
		screen.queryByRole("button", { name: "form.execute" }),
	).not.toBeInTheDocument();
});

test("Pretty uses schema descriptions and keeps expanded fields when switching modes", async () => {
	const user = userEvent.setup();
	const tool = createTool("INITIAL");
	tool.parameters = { advanced: { limit: 25 } };
	render(
		<ToolInspector
			tool={tool}
			inputSchema={{
				properties: {
					advanced: {
						properties: {
							limit: {
								title: "Maximum items",
								description: "How many messages to return",
							},
						},
					},
				},
			}}
		/>,
	);
	expect(screen.queryByText("Maximum items")).not.toBeInTheDocument();
	await user.click(screen.getByTitle("advanced"));
	expect(await screen.findByText("Maximum items")).toBeVisible();
	expect(screen.getByText("How many messages to return")).toBeVisible();
	await user.click(screen.getByRole("radio", { name: "inspector.raw" }));
	expect(
		screen.getByRole("textbox", { name: /inspector.input/ }),
	).toHaveValue(JSON.stringify(tool.parameters, null, 2));
	await user.click(screen.getByRole("radio", { name: "inspector.pretty" }));
	expect(screen.getByText("Maximum items")).toBeVisible();
	expect(screen.getByText("25")).toBeVisible();
});

test("Pretty reveals long text and pages large collections without dropping data from Copy", async () => {
	const user = userEvent.setup();
	const tool = createTool("INITIAL");
	tool.parameters = {
		body: `${"Long text. ".repeat(100)}END_OF_VALUE`,
		messages: Array.from({ length: 105 }, (_, index) => `message-${index}`),
	};
	const copy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
	render(<ToolInspector tool={tool} />);
	expect(screen.queryByText(/END_OF_VALUE/)).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "inspector.showFullValue" }),
	);
	expect(screen.getByText(/END_OF_VALUE/)).toBeVisible();
	await user.click(screen.getByTitle("messages"));
	expect(await screen.findByText("message-49")).toBeVisible();
	expect(screen.queryByText("message-50")).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "inspector.showMore" }),
	);
	expect(screen.getByText("message-99")).toBeVisible();
	await user.click(
		screen.getByRole("button", { name: "inspector.showMore" }),
	);
	expect(screen.getByText("message-104")).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "inspector.showMore" }),
	).not.toBeInTheDocument();
	await user.click(screen.getByRole("button", { name: "inspector.copy" }));
	expect(copy).toHaveBeenCalledWith(JSON.stringify(tool.parameters, null, 2));
});

test("changing mode in the expanded input restores focus to the current mode's Expand button", async () => {
	const user = userEvent.setup();
	render(<ToolInspector tool={createTool("INITIAL")} />);
	await user.click(screen.getByRole("button", { name: "actions.expand" }));
	await user.click(
		within(screen.getByRole("dialog")).getByRole("radio", {
			name: "inspector.raw",
		}),
	);
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
	);
	expect(
		screen.getByRole("radio", { name: "inspector.raw" }),
	).toHaveAttribute("aria-checked", "true");
	expect(
		screen.getByRole("button", { name: "actions.expand" }),
	).toHaveFocus();
});
