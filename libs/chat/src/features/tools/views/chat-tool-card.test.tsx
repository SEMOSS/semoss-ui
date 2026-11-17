import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";
import type { PendingAgentAction } from "@semoss/sdk";
import type { ThemeMap } from "@semoss/shared";
import type { PixelMessageToolCallPart } from "../../../types";
import { signInToProvider } from "../../connectors/accounts/connector-sign-in";
import { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { decideAgentToolAction } from "../../room/turns/agent-turn-runner";
import { ChatToolCard } from "./chat-tool-card";

const mocks = vi.hoisted(() => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warning: vi.fn(),
	},
}));

vi.mock("@semoss/sdk/react", () => ({
	console: vi.fn(),
	download: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runMcpTool: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
	uploadInsight: vi.fn(),
}));
vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { dir: () => "ltr", language: "en" },
	}),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	toast: mocks.toast,
}));
vi.mock("../../room/turns/agent-turn-runner", async (original) => ({
	...(await original<typeof import("../../room/turns/agent-turn-runner")>()),
	decideAgentToolAction: vi.fn(),
}));
vi.mock("../../connectors/accounts/connector-sign-in", async (original) => ({
	...(await original<
		typeof import("../../connectors/accounts/connector-sign-in")
	>()),
	signInToProvider: vi.fn(),
}));
// the panel's tabs are the inspector's own; the card hands it these
vi.mock("../inspector/tool-inspector", () => ({
	ToolInspector: ({
		header,
		footer,
		response,
		description,
	}: {
		header: ReactNode;
		footer?: ReactNode;
		response?: string;
		description?: string;
	}) => (
		<section aria-label="inspector">
			{header}
			<p>description: {description}</p>
			<pre>response: {response}</pre>
			{footer}
		</section>
	),
}));

/**
 * A room as the app builds one, in chat or agent mode.
 *
 * @param mode - The room's mode.
 * @returns The room.
 */
const createRoom = (mode: "chat" | "agent" = "chat") => {
	const room = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		insightId: "insight-1",
		panelComponents: {},
	});
	room.setMode(mode);
	return room;
};

/** A connector call's metadata: OneDrive's Delete File, which asks first. */
const ONEDRIVE_DELETE: PixelMessageToolCallPart["toolCall"]["_meta"] = {
	SMSS_ENGINE_NAME: "",
	SMSS_ENGINE_ID: "__room__",
	SMSS_ENGINE_TYPE: "",
	SMSS_PROJECT_NAME: "",
	SMSS_PROJECT_ID: "",
	SMSS_MCP_EXECUTION: "ask",
	SMSS_FUNCTION_NAME: "MicrosoftOneDriveDeleteFile",
};

/**
 * A call the model made in a response of the room, as streaming leaves it.
 * A folder call comes with no metadata, as from a chat turn.
 *
 * @param room - The room.
 * @param name - The tool's name.
 * @param args - The call's arguments.
 * @param meta - The tool's metadata, for a connector call.
 * @returns The room's store for the call.
 */
const addCall = (
	room: RoomStore,
	name: string,
	args: Record<string, unknown>,
	meta?: PixelMessageToolCallPart["toolCall"]["_meta"],
): ToolStore => {
	room.createMessage({
		io: "OUTPUT",
		messageId: `message-${name}`,
		visible: true,
		platform_generated: false,
		modelId: "model-1",
		modelType: "OPEN_AI",
		dateCreated: "2026-01-01 00:00:00",
		tokens: 0,
		ornaments: {},
		pruneToolsAbove: false,
		parts: [
			{
				type: "TOOL_CALL",
				toolCall: {
					id: `call-${name}`,
					type: "function",
					name,
					original_name: name,
					title: meta ? "Delete File" : undefined,
					description: "",
					arguments: args,
					_tool_found: true,
					_meta: meta,
				},
			},
		],
	});
	return room.getTool(`call-${name}`);
};

/**
 * The value shown under a detail's label.
 *
 * @param label - The detail's label.
 * @returns Its value's text.
 */
const detail = (label: string) =>
	screen.getByText(label).nextElementSibling?.textContent;

/**
 * The status badge, by its label.
 *
 * @param label - The status's label.
 * @returns The badge's icon's lucide name.
 */
const badgeIcon = (label: string) =>
	[...(screen.getByText(label).querySelector("svg")?.classList ?? [])].find(
		(name) => name.startsWith("lucide-"),
	);

beforeEach(() => {
	vi.clearAllMocks();
	localStorage.clear();
});

test.each(["inline", "panel"] as const)(
	"the %s card's badge follows the call's status, waiting first",
	(variant) => {
		const room = createRoom();
		const write = addCall(room, "folder_write", { path: "notes.md" });
		const read = addCall(room, "folder_read", { path: "notes.md" });
		const { rerender } = render(
			<ChatToolCard tool={write} variant={variant} />,
		);

		// a folder call is Room Files', under its tool's title
		expect(
			screen.getByText("chatTools:tools.titles.folder_write"),
		).toBeVisible();
		expect(screen.getByText("card.roomFiles")).toBeVisible();
		// a write asks first, so it waits for the user
		expect(badgeIcon("card.status.waiting")).toBe("lucide-hourglass");
		for (const [status, label, icon] of [
			["LOADING", "card.status.running", "lucide-loader-circle"],
			["SUCCESS", "card.status.done", "lucide-check"],
			["ERROR", "card.status.failed", "lucide-circle-alert"],
			["CANCELLED", "card.status.notRun", "lucide-x"],
		] as const) {
			act(() => write.setStatus(status));
			expect(badgeIcon(label)).toBe(icon);
		}

		// a read runs on its own, so before it starts it is only queued
		rerender(<ChatToolCard tool={read} variant={variant} />);
		expect(badgeIcon("card.status.queued")).toBe("lucide-hourglass");
		expect(screen.queryByRole("button", { name: "card.allow" })).toBeNull();
	},
);

test.each([
	{
		name: "folder_write",
		args: { path: "notes.md", content: "Hello" },
		details: { "card.file": "notes.md", "card.newContents": "Hello" },
		notes: [],
	},
	{
		name: "folder_edit",
		args: {
			path: "notes.md",
			old_text: "Hello",
			new_text: "Hi",
			replace_all: "true",
		},
		details: {
			"card.file": "notes.md",
			"card.replace": "Hello",
			"card.with": "Hi",
		},
		notes: ["card.replaceAll"],
	},
	{
		name: "folder_edit",
		args: { path: "notes.md", old_text: "Hello", new_text: "Hi" },
		details: { "card.replace": "Hello", "card.with": "Hi" },
		notes: [],
	},
	{
		name: "folder_move",
		args: { from: "a.md", to: "b/a.md" },
		details: { "card.from": "a.md", "card.to": "b/a.md" },
		notes: [],
	},
	{
		name: "folder_delete",
		args: { path: "old", recursive: true },
		details: { "card.path": "old" },
		notes: ["card.deleteRecursive"],
	},
	{
		name: "folder_delete",
		args: { path: "old.md" },
		details: { "card.path": "old.md" },
		notes: [],
	},
	{
		name: "folder_search",
		args: { query: "budget" },
		details: { "card.query": "budget" },
		notes: [],
	},
	{
		// list, read and create directory show the path the call summarizes
		name: "folder_list",
		args: { path: "reports" },
		details: { "card.path": "reports" },
		notes: [],
	},
	{
		name: "folder_list",
		args: {},
		details: { "card.path": "chatTools:tools.rootFolder" },
		notes: [],
	},
])(
	"an inline $name card lays out what it acts on",
	({ name, args, details, notes }) => {
		const room = createRoom();
		render(
			<ChatToolCard tool={addCall(room, name, args)} variant="inline" />,
		);

		for (const [label, value] of Object.entries(details)) {
			expect(detail(label)).toBe(value);
		}
		for (const note of ["card.replaceAll", "card.deleteRecursive"]) {
			if (notes.includes(note)) {
				expect(screen.getByText(note)).toBeVisible();
			} else {
				expect(screen.queryByText(note)).toBeNull();
			}
		}
	},
);

test("an inline connector card lists its arguments and, once finished, its result", () => {
	const room = createRoom();
	const tool = addCall(
		room,
		"MicrosoftOneDriveDeleteFile",
		{ itemId: "abc", reason: "x".repeat(81), lines: "one\ntwo" },
		ONEDRIVE_DELETE,
	);
	render(<ChatToolCard tool={tool} variant="inline" />);

	// a connector call is its service's, under its title
	expect(screen.getByText("Delete File")).toBeVisible();
	expect(
		screen.getByText("chatConnectors:services.onedrive.name"),
	).toBeVisible();
	expect(screen.getByText("card.connectorApproval")).toBeVisible();
	// a short value is a row; a long or multi-line one is a block
	expect(detail("itemId")).toBe("abc");
	expect(screen.getByText("itemId").nextElementSibling?.tagName).toBe("SPAN");
	expect(screen.getByText("reason").nextElementSibling?.tagName).toBe("PRE");
	expect(screen.getByText("lines").nextElementSibling?.tagName).toBe("PRE");
	expect(screen.queryByText("card.result")).toBeNull();

	act(() => tool.settle({ status: "SUCCESS", response: '{"deleted":true}' }));
	expect(detail("card.result")).toBe('{\n  "deleted": true\n}');
	expect(screen.queryByText("card.connectorApproval")).toBeNull();

	act(() => tool.settle({ status: "ERROR", response: "Not found" }));
	expect(detail("card.error")).toBe("Not found");

	act(() => tool.setParameters({}));
	expect(screen.getByText("card.noArguments")).toBeVisible();
});

test("a waiting panel card hands the inspector its header, the folder tool's definition, and its approval", () => {
	const room = createRoom();
	const tool = addCall(room, "folder_delete", {
		path: "old",
		recursive: true,
	});
	render(<ChatToolCard tool={tool} variant="panel" />);

	const definition = room.chatTools.chatToolDefinitions.find(
		(item) => item.name === "folder_delete",
	);
	expect(definition?.description).toBeTruthy();
	expect(
		screen.getByText(`description: ${definition?.description}`),
	).toBeInTheDocument();
	expect(screen.getByText("card.folderApproval")).toBeVisible();
	expect(screen.getByText("card.deleteRecursive")).toBeVisible();
	expect(screen.getByRole("button", { name: "card.allow" })).toBeEnabled();
	// the panel has no details of its own: the inspector's tabs show them
	expect(screen.queryByText("card.path")).toBeNull();

	act(() => tool.settle({ status: "SUCCESS", response: "[1,2]" }));
	expect(screen.getByText(/^response:/)).toHaveTextContent(
		"response: [ 1, 2 ]",
	);
	expect(screen.queryByText("card.folderApproval")).toBeNull();
	expect(screen.queryByRole("button", { name: "card.allow" })).toBeNull();
});

test("in a chat room Allow and Deny go to the room's chat tools, and an inline card closes after", async () => {
	const room = createRoom();
	const write = addCall(room, "folder_write", { path: "notes.md" });
	const connector = addCall(
		room,
		"MicrosoftOneDriveDeleteFile",
		{ itemId: "abc" },
		ONEDRIVE_DELETE,
	);
	let finish = () => {};
	const approve = vi.spyOn(room.chatTools, "approveChatTool").mockReturnValue(
		new Promise<void>((resolve) => {
			finish = resolve;
		}),
	);
	const decline = vi
		.spyOn(room.chatTools, "declineChatTool")
		.mockResolvedValue();
	const approveConnector = vi
		.spyOn(room.chatTools, "approveConnectorChatTool")
		.mockResolvedValue();
	const close = vi.spyOn(write, "closeTool");
	const { rerender } = render(<ChatToolCard tool={write} variant="inline" />);

	// both buttons wait while the decision is carried out
	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	expect(approve).toHaveBeenCalledWith(write);
	expect(
		screen.getByRole("button", { name: "card.allowing" }),
	).toBeDisabled();
	expect(screen.getByRole("button", { name: "card.deny" })).toBeDisabled();
	expect(close).not.toHaveBeenCalled();
	await act(async () => finish());
	expect(close).toHaveBeenCalledOnce();
	expect(screen.getByRole("button", { name: "card.allow" })).toBeEnabled();

	fireEvent.click(screen.getByRole("button", { name: "card.deny" }));
	await waitFor(() => expect(decline).toHaveBeenCalledWith(write));
	expect(decideAgentToolAction).not.toHaveBeenCalled();

	// a connector call runs through the room's toolbox; a panel stays open
	const closeConnector = vi.spyOn(connector, "closeTool");
	rerender(<ChatToolCard tool={connector} variant="panel" />);
	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	await waitFor(() =>
		expect(approveConnector).toHaveBeenCalledWith(connector),
	);
	expect(closeConnector).not.toHaveBeenCalled();

	// a failed decision says so and leaves the buttons to try again
	approveConnector.mockRejectedValueOnce(new Error("Toolbox offline"));
	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	await waitFor(() =>
		expect(mocks.toast.error).toHaveBeenCalledWith("card.decisionError"),
	);
	expect(screen.getByRole("button", { name: "card.allow" })).toBeEnabled();
});

test("in an agent room a connector's Allow and every Deny decide the run's pending action", async () => {
	const room = createRoom("agent");
	const connector = addCall(
		room,
		"MicrosoftOneDriveDeleteFile",
		{ itemId: "abc" },
		ONEDRIVE_DELETE,
	);
	const write = addCall(room, "folder_write", { path: "notes.md" });
	vi.mocked(decideAgentToolAction).mockResolvedValue(undefined);
	const approve = vi
		.spyOn(room.chatTools, "approveChatTool")
		.mockResolvedValue();
	const decline = vi.spyOn(room.chatTools, "declineChatTool");
	const approveConnector = vi.spyOn(
		room.chatTools,
		"approveConnectorChatTool",
	);
	const { rerender } = render(
		<ChatToolCard tool={connector} variant="inline" />,
	);

	// an agent's call waits only once its run pauses on it
	expect(badgeIcon("card.status.queued")).toBe("lucide-hourglass");
	expect(screen.queryByRole("button", { name: "card.allow" })).toBeNull();
	act(() =>
		connector.setPendingAction({
			actionId: "action-1",
		} as PendingAgentAction),
	);
	expect(badgeIcon("card.status.waiting")).toBe("lucide-hourglass");

	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	await waitFor(() =>
		expect(decideAgentToolAction).toHaveBeenCalledWith(connector, "submit"),
	);
	fireEvent.click(screen.getByRole("button", { name: "card.deny" }));
	await waitFor(() =>
		expect(decideAgentToolAction).toHaveBeenCalledWith(connector, "reject"),
	);
	expect(approveConnector).not.toHaveBeenCalled();

	// a folder call still runs here, but its Deny goes to the run
	act(() =>
		write.setPendingAction({ actionId: "action-2" } as PendingAgentAction),
	);
	rerender(<ChatToolCard tool={write} variant="inline" />);
	fireEvent.click(screen.getByRole("button", { name: "card.allow" }));
	await waitFor(() => expect(approve).toHaveBeenCalledWith(write));
	fireEvent.click(screen.getByRole("button", { name: "card.deny" }));
	await waitFor(() =>
		expect(decideAgentToolAction).toHaveBeenCalledWith(write, "reject"),
	);
	expect(decline).not.toHaveBeenCalled();
	expect(decideAgentToolAction).toHaveBeenCalledTimes(3);
});

test.each(["inline", "panel"] as const)(
	"a %s connector call that failed for sign in offers Sign In",
	async (variant) => {
		vi.mocked(signInToProvider).mockResolvedValue(true);
		const room = createRoom();
		const connector = addCall(
			room,
			"MicrosoftOneDriveDeleteFile",
			{ itemId: "abc" },
			ONEDRIVE_DELETE,
		);
		const folder = addCall(room, "folder_write", { path: "notes.md" });
		const { rerender } = render(
			<ChatToolCard tool={connector} variant={variant} />,
		);

		act(() =>
			connector.settle({
				status: "ERROR",
				response: "Please log in to your Microsoft account",
			}),
		);
		expect(
			screen.getByText("chatConnectors:signIn.toolFailed"),
		).toBeVisible();
		fireEvent.click(
			screen.getByRole("button", {
				name: "chatConnectors:signIn.toolAction",
			}),
		);
		expect(signInToProvider).toHaveBeenCalledWith("MICROSOFT");
		await waitFor(() =>
			expect(mocks.toast.success).toHaveBeenCalledWith(
				"providers.connectSuccess",
			),
		);

		// another failure has no Sign In
		act(() => connector.settle({ status: "ERROR", response: "Not found" }));
		expect(
			screen.queryByRole("button", {
				name: "chatConnectors:signIn.toolAction",
			}),
		).toBeNull();

		// nor does a folder call that failed the same way
		act(() =>
			folder.settle({
				status: "ERROR",
				response: "LOGIN_REQUIRED_ERROR",
			}),
		);
		rerender(<ChatToolCard tool={folder} variant={variant} />);
		expect(
			screen.queryByRole("button", {
				name: "chatConnectors:signIn.toolAction",
			}),
		).toBeNull();
	},
);
