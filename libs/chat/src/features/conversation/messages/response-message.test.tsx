import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { download, runPixel, runPixelAsync } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { copyTextToClipboard } from "@semoss/utility/clipboard";
import { servePixelTransport } from "../../../test/pixel-transport";
import type {
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";
import type { InputMessageStore } from "../../room/store/input-message.store";
import type { ResponseMessageStore } from "../../room/store/response-message.store";
import { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { ResponseMessage } from "./response-message";

const mocks = vi.hoisted(() => ({
	theme: {} as Record<string, unknown>,
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		warning: vi.fn(),
		info: vi.fn(),
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

// the SDK's own calls go out over HTTP; answer them from the mocks above
servePixelTransport({
	runPixel: vi.mocked(runPixel),
	runPixelAsync: vi.mocked(runPixelAsync),
});
vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
	// keys come back as they are; a name rides along so files tell apart
	useTranslation: () => ({
		t: (key: string, options?: { name?: string }) =>
			options?.name ? `${key} ${options.name}` : key,
		i18n: { dir: () => "ltr", language: "en" },
	}),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	toast: mocks.toast,
}));
vi.mock("@semoss/utility/clipboard", () => ({
	copyTextToClipboard: vi.fn(),
}));
vi.mock("../../chat/config/use-chat-config", () => ({
	useChatConfig: () => ({ theme: mocks.theme }),
}));
vi.mock("../../connectors/store/connector-tools", async (original) => ({
	...(await original<
		typeof import("../../connectors/store/connector-tools")
	>()),
	readUserConnectorTools: vi.fn().mockResolvedValue(null),
}));
// each group lists its calls by id, so the grouping is what is asserted
vi.mock("./response-message-tool-group", () => ({
	ResponseMessageToolGroup: ({ tools }: { tools: ToolStore[] }) => (
		<ul aria-label="tool group">
			{tools.map((tool) => (
				<li key={tool.id}>{tool.id}</li>
			))}
		</ul>
	),
}));

/** The fields every stored message shares. */
const PIXEL = {
	visible: true,
	platform_generated: false,
	modelId: "model-1",
	modelType: "OPEN_AI",
	dateCreated: "2026-01-01 00:00:00",
	tokens: 0,
	ornaments: { modelName: "Model One" },
	pruneToolsAbove: false,
};

/**
 * A stored user message.
 *
 * @param messageId - Its id.
 * @param parentMessageId - The response it follows, or "" for the first.
 * @param text - What the user typed.
 * @returns The pixel message.
 */
const input = (
	messageId: string,
	parentMessageId: string,
	text: string,
): InputPixelMessage => ({
	...PIXEL,
	io: "INPUT",
	type: "INPUT_TEXT",
	messageId,
	parentMessageId,
	parts: [{ type: "TEXT", text, uiText: text }],
});

/**
 * A stored response.
 *
 * @param messageId - Its id.
 * @param parentMessageId - The message it answers.
 * @param parts - What the model said.
 * @param extra - Any other fields.
 * @returns The pixel message.
 */
const output = (
	messageId: string,
	parentMessageId: string,
	parts: ResponsePixelMessage["parts"],
	extra: Partial<ResponsePixelMessage> = {},
): ResponsePixelMessage => ({
	...PIXEL,
	io: "OUTPUT",
	messageId,
	parentMessageId,
	parts,
	...extra,
});

/** A text part. */
const text = (value: string) =>
	({ type: "TEXT", text: value, uiText: value }) as const;

/**
 * A tool call that asks first, so loading the room does not run it.
 *
 * @param id - The call's id.
 * @returns The part.
 */
const toolCall = (id: string): ResponsePixelMessage["parts"][number] => ({
	type: "TOOL_CALL",
	toolCall: {
		id,
		type: "function",
		name: "search",
		original_name: "search",
		title: "Search",
		description: "",
		arguments: {},
		_tool_found: true,
		_meta: {
			SMSS_ENGINE_NAME: "",
			SMSS_ENGINE_ID: "engine-1",
			SMSS_ENGINE_TYPE: "",
			SMSS_PROJECT_NAME: "",
			SMSS_PROJECT_ID: "",
			SMSS_MCP_EXECUTION: "ask",
		},
	},
});

/**
 * A pixel response the room reads.
 *
 * @param outputs - Each statement's output.
 * @param operationType - Each statement's operation type.
 * @returns The response.
 */
const pixelResponse = (outputs: unknown[], operationType: string[] = []) => ({
	errors: [],
	insightId: "insight-1",
	pixelReturn: outputs.map((value) => ({
		output: value,
		isMeta: false,
		operationType,
		pixelExpression: "",
		pixelId: "",
		timeToRun: 0,
	})),
});

/**
 * A room loaded from stored messages, as the app loads one. Its model is set
 * first, so loading looks no model up.
 *
 * @param messages - The stored messages.
 * @returns The loaded room.
 */
const createRoom = async (messages: PixelMessage[]) => {
	const room = new RoomStore({
		theme: {} as ThemeMap["playground"],
		roomId: "room-1",
		insightId: "insight-1",
		panelComponents: {},
	});
	room.setModel({
		engine_id: "model-1",
		engine_name: "Model One",
		engine_type: "MODEL",
	});
	vi.mocked(runPixel).mockImplementation(async (pixel: string) =>
		pixel.startsWith("GetPlaygroundMessages")
			? pixelResponse([messages, {}])
			: pixelResponse([true]),
	);
	await room.initialize();
	return room;
};

/** The pixels the room sent, in order, leaving out what loading it sent. */
const sentPixels = () =>
	vi
		.mocked(runPixel)
		.mock.calls.map(([pixel]) => pixel)
		.filter(
			(pixel) =>
				!pixel.startsWith("GetPlaygroundMessages") &&
				// the room's tool file, read as it loads
				!pixel.startsWith("GetInsightAssets"),
		);

/**
 * A message of the room by id.
 *
 * @param room - The room.
 * @param id - The message's id.
 * @returns The message.
 */
const messageOf = <T extends ResponseMessageStore | InputMessageStore>(
	room: RoomStore,
	id: string,
) => room.getMessage(id) as T;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.theme = {};
	localStorage.clear();
});

test("a settled response shows its markdown and its reasoning, collapsed", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [
			{ type: "THINKING", thinking: "Weighing the options" },
			text("**Hello** world"),
		]),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);

	expect(screen.getByText("Hello").tagName).toBe("STRONG");
	expect(screen.getByText(/world/)).toBeInTheDocument();
	const reasoning = screen.getByRole("button", { name: "reasoning" });
	expect(reasoning).toHaveAttribute("aria-expanded", "false");
	expect(screen.queryByText("Weighing the options")).toBeNull();
	fireEvent.click(reasoning);
	expect(screen.getByText("Weighing the options")).toBeVisible();
	expect(screen.queryByText("response.emptyResponse")).toBeNull();
	// the actions are named for a screen reader
	const actions = screen.getByRole("group", { name: "messages.actions" });
	expect(
		within(actions)
			.getAllByRole("button")
			.map((button) => button.getAttribute("aria-label")),
	).toEqual([
		"response.goodResponse",
		"response.poorResponse",
		"response.copyResponse",
		"download.title",
	]);
});

test("an empty response says so, unless it is the streaming placeholder", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [text(" ​ ")]),
		input("i2", "r1", "again"),
		output("STREAMING_PLACEHOLDER_ID", "i2", []),
	]);
	const { rerender } = render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);
	expect(screen.getByText("response.emptyResponse")).toBeInTheDocument();

	rerender(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(
				room,
				"STREAMING_PLACEHOLDER_ID",
			)}
		/>,
	);
	expect(screen.queryByText("response.emptyResponse")).toBeNull();
});

test("an image previews, a stored file opens in the Workspace, and an inline file previews", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [
			{
				type: "MEDIA",
				mediaInfo: {
					fileName: "chart.png",
					base64Data: "aW1n",
					mimeType: "image/png",
					mediaInputType: "FILE",
				},
			},
			{
				type: "MEDIA",
				mediaInfo: {
					fileName: "data.xlsx",
					fileLocation: "/data.xlsx",
					mediaInputType: "FILE",
				},
			},
			{
				type: "MEDIA",
				mediaInfo: {
					fileName: "report.pdf",
					base64Data: "cGRm",
					mediaInputType: "FILE",
				},
			},
		]),
	]);
	const openFile = vi
		.spyOn(room, "openWorkbenchFilePanel")
		.mockReturnValue("panel-1");
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);

	// the image shows itself and opens full size
	const image = screen.getByRole("button", {
		name: "attachments.view chart.png",
	});
	expect(
		within(image).getByRole("img", { name: "chart.png" }),
	).toHaveAttribute("src", "data:image/png;base64,aW1n");
	fireEvent.click(image);
	const imageDialog = await screen.findByRole("dialog");
	// the preview dialogs are named by their file
	expect(imageDialog).toHaveAccessibleName("chart.png");
	expect(
		within(imageDialog).getByRole("img", { name: "chart.png" }),
	).toHaveAttribute("src", "data:image/png;base64,aW1n");
	fireEvent.keyDown(imageDialog, { key: "Escape" });
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

	// a file shows its type's icon and extension, and opens where it is stored
	const sheet = screen.getByRole("button", {
		name: "attachments.view data.xlsx",
	});
	expect(sheet.querySelector("svg.lucide-file-spreadsheet")).not.toBeNull();
	expect(sheet).toHaveTextContent("xlsx");
	fireEvent.click(sheet);
	expect(openFile).toHaveBeenCalledWith("/data.xlsx", "data.xlsx");

	// a file with only its bytes previews as a PDF
	const pdf = screen.getByRole("button", {
		name: "attachments.view report.pdf",
	});
	expect(pdf.querySelector("svg.lucide-file-badge")).not.toBeNull();
	fireEvent.click(pdf);
	const pdfDialog = await screen.findByRole("dialog");
	expect(pdfDialog).toHaveAccessibleName("report.pdf");
	expect(
		within(pdfDialog).getByLabelText("attachments.previewOf report.pdf"),
	).toHaveAttribute("data", "data:application/pdf;base64,cGRm");
	fireEvent.keyDown(pdfDialog, { key: "Escape" });
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

	// with an image and no text there is Copy Image, and no Copy or Download
	expect(
		screen.getAllByRole("button", { name: "response.copyImage" }),
	).toHaveLength(1);
	expect(
		screen.queryByRole("button", { name: "response.copyResponse" }),
	).toBeNull();
	expect(screen.queryByRole("button", { name: "download.title" })).toBeNull();
});

test("consecutive tool calls group, text splits them, and folded-up responses join the last group", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [
			text("Looking"),
			toolCall("a"),
			toolCall("b"),
			text("Then"),
			toolCall("c"),
		]),
		output("r2", "r1", [toolCall("d")]),
		output("r3", "r2", [{ type: "THINKING", thinking: "" }, toolCall("e")]),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
			subsequentTools={[
				messageOf<ResponseMessageStore>(room, "r2"),
				messageOf<ResponseMessageStore>(room, "r3"),
			]}
		/>,
	);

	const groups = screen.getAllByRole("list", { name: "tool group" });
	expect(
		groups.map((group) =>
			within(group)
				.getAllByRole("listitem")
				.map((item) => item.textContent),
		),
	).toEqual([
		["a", "b"],
		// an empty reasoning part does not split a run
		["c", "d", "e"],
	]);

	// Copy writes the folded-up responses' calls too
	fireEvent.click(
		screen.getByRole("button", { name: "response.copyResponse" }),
	);
	await waitFor(() =>
		expect(copyTextToClipboard).toHaveBeenCalledWith(
			"Looking\n<search>\n<search>\nThen\n<search>\n<search>\n\n<search>",
		),
	);
	expect(mocks.toast.success).toHaveBeenCalledWith(
		"notifications.copySuccess",
	);
});

test("thumbs up and down save the rating with its pixel, and a second click clears it", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [text("Hello")]),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);
	const up = screen.getByRole("button", { name: "response.goodResponse" });
	const down = screen.getByRole("button", { name: "response.poorResponse" });
	expect(up).toHaveAttribute("aria-pressed", "false");

	fireEvent.click(up);
	await waitFor(() => expect(up).toHaveAttribute("aria-pressed", "true"));
	expect(sentPixels()).toEqual([
		'SubmitLlmFeedback(messageId="r1", feedbackText="", rating=true, roomId="room-1");',
	]);
	expect(mocks.toast.success).toHaveBeenCalledWith(
		"notifications.feedbackSuccess",
	);

	fireEvent.click(up);
	await waitFor(() => expect(up).toHaveAttribute("aria-pressed", "false"));
	expect(sentPixels()[1]).toBe(
		'SubmitLlmFeedback(messageId="r1", feedbackText="", rating=null, roomId="room-1");',
	);
	// clearing a rating says nothing
	expect(mocks.toast.success).toHaveBeenCalledTimes(1);

	fireEvent.click(down);
	await waitFor(() => expect(down).toHaveAttribute("aria-pressed", "true"));
	expect(sentPixels()[2]).toContain("rating=false");

	// a save the backend refuses keeps the rating and says why
	vi.mocked(runPixel).mockResolvedValueOnce({
		...pixelResponse([]),
		errors: ["Feedback is closed"],
	});
	fireEvent.click(up);
	await waitFor(() =>
		expect(mocks.toast.error).toHaveBeenCalledWith("Feedback is closed"),
	);
	expect(down).toHaveAttribute("aria-pressed", "true");
	expect(up).toHaveAttribute("aria-pressed", "false");
	// the refusal is also the room's error
	expect(room.error?.message).toBe("Feedback is closed");
});

test("with feedback text on, a new rating asks for a comment before it is sent", async () => {
	mocks.theme = { featureFlags: { enableFeedbackText: true } };
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [text("Hello")], {
			feedback: {
				rating: true,
				feedbackText: "",
				messageId: "r1",
				messageType: "RESPONSE_TEXT",
				feedbackDate: "2026-01-01 00:00:00",
			},
		}),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);
	const up = screen.getByRole("button", { name: "response.goodResponse" });
	const down = screen.getByRole("button", { name: "response.poorResponse" });
	expect(up).toHaveAttribute("aria-pressed", "true");

	// a new rating opens the dialog and sends nothing yet
	fireEvent.click(down);
	const dialog = await screen.findByRole("dialog", {
		name: "response.poorResponse",
	});
	expect(sentPixels()).toEqual([]);
	fireEvent.change(
		within(dialog).getByRole("textbox", {
			name: "response.feedbackPlaceholder",
		}),
		{ target: { value: "  Too long  " } },
	);
	fireEvent.click(
		within(dialog).getByRole("button", { name: "response.feedbackSubmit" }),
	);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(sentPixels()).toEqual([
		'SubmitLlmFeedback(messageId="r1", feedbackText="Too long", rating=false, roomId="room-1");',
	]);
	expect(down).toHaveAttribute("aria-pressed", "true");

	// Cancel sends nothing
	fireEvent.click(up);
	const second = await screen.findByRole("dialog", {
		name: "response.goodResponse",
	});
	fireEvent.click(
		within(second).getByRole("button", { name: "response.feedbackCancel" }),
	);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(sentPixels()).toHaveLength(1);

	// clicking the rating it has clears it without asking
	fireEvent.click(down);
	await waitFor(() => expect(down).toHaveAttribute("aria-pressed", "false"));
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(sentPixels()[1]).toBe(
		'SubmitLlmFeedback(messageId="r1", feedbackText="", rating=null, roomId="room-1");',
	);
});

test("branch arrows switch between the user's sibling messages and count them", async () => {
	const room = await createRoom([
		input("i1", "", "first"),
		output("r1", "i1", [text("One")]),
		input("i2a", "r1", "second, take one"),
		output("r2a", "i2a", [text("Two A")]),
		input("i2b", "r1", "second, take two"),
		output("r2b", "i2b", [text("Two B")]),
	]);
	const r1 = messageOf<ResponseMessageStore>(room, "r1");
	const r2b = messageOf<ResponseMessageStore>(room, "r2b");
	// the sibling stored last is the active one
	expect(r1.activeChild?.id).toBe("i2b");

	const { rerender } = render(<ResponseMessage room={room} message={r2b} />);
	const previous = screen.getByRole("button", {
		name: "response.previousMessage",
	});
	const next = screen.getByRole("button", { name: "response.nextMessage" });
	expect(screen.getByText("2/2")).toBeInTheDocument();
	expect(previous).toBeEnabled();
	expect(next).toBeDisabled();

	// the arrows wait while the response is still being written
	act(() => r2b.setIsThinking(true));
	expect(previous).toBeDisabled();
	act(() => r2b.setIsThinking(false));

	fireEvent.click(previous);
	expect(r1.activeChild?.id).toBe("i2a");
	expect(room.history.map((message) => message.id)).toEqual([
		"i1",
		"r1",
		"i2a",
		"r2a",
	]);

	rerender(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r2a")}
		/>,
	);
	expect(screen.getByText("1/2")).toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "response.previousMessage" }),
	).toBeDisabled();
	fireEvent.click(
		screen.getByRole("button", { name: "response.nextMessage" }),
	);
	expect(r1.activeChild?.id).toBe("i2b");

	// a message with no siblings has no arrows
	rerender(<ResponseMessage room={room} message={r1} />);
	expect(
		screen.queryByRole("button", { name: "response.previousMessage" }),
	).toBeNull();
});

test("Rewrite Message sends the user's message again as a new branch", async () => {
	mocks.theme = { featureFlags: { enableRewrite: true } };
	const room = await createRoom([
		input("i1", "", "first"),
		output("r1", "i1", [text("One")]),
		input("i2", "r1", "second"),
		output("r2", "i2", [text("Two")]),
	]);
	// the turn is left running
	vi.mocked(runPixelAsync).mockReturnValue(new Promise(() => {}));
	const { rerender } = render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);
	// today: the first message cannot be rewritten, since its parent is the root
	expect(
		screen.getByRole("button", { name: "response.rewriteMessage" }),
	).toBeDisabled();

	rerender(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r2")}
		/>,
	);
	room.setError(new Error("Last turn failed"));
	fireEvent.click(
		screen.getByRole("button", { name: "response.rewriteMessage" }),
	);
	await waitFor(() =>
		expect(mocks.toast.success).toHaveBeenCalledWith(
			"notifications.rewriteSuccess",
		),
	);

	// the room's options are saved first, and the last error cleared
	expect(sentPixels()[0]).toMatch(/^UpdateRoomOptions\(roomId="room-1"/);
	expect(room.error).toBeNull();
	// the new message is a sibling of the old one, and the one shown
	const r1 = messageOf<ResponseMessageStore>(room, "r1");
	expect(r1.children.map((child) => child.id)).toEqual([
		"i2",
		"REWRITE_PLACEHOLDER_ID",
	]);
	expect(r1.activeChild?.parts).toEqual(
		messageOf<InputMessageStore>(room, "i2").parts,
	);
	// and it runs as a turn after the response it follows
	const [askPixel] = vi.mocked(runPixelAsync).mock.calls[0];
	expect(askPixel).toMatch(/^AskPlayground\(engine=\["model-1"\]/);
	expect(askPixel).toContain('command=["<encode>second</encode>"]');
	expect(askPixel).toContain('parentMessageId=["r1"]');
});

test("the Rewrite button shows only when the theme turns it on", async () => {
	const room = await createRoom([
		input("i1", "", "first"),
		output("r1", "i1", [text("One")]),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);
	expect(
		screen.queryByRole("button", { name: "response.rewriteMessage" }),
	).toBeNull();
});

test("Download saves the response as Word or PDF and closes the dialog", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [text("Hello "), toolCall("a"), text("world")]),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);
	const trigger = screen.getByRole("button", { name: "download.title" });

	fireEvent.click(trigger);
	let dialog = await screen.findByRole("dialog", { name: "download.title" });
	expect(dialog).toHaveAccessibleDescription("download.description");
	vi.mocked(runPixel).mockResolvedValueOnce(
		pixelResponse(["file-key"], ["FILE_DOWNLOAD"]),
	);
	fireEvent.click(
		within(dialog).getByRole("button", { name: /sidebar:download\.word/ }),
	);
	await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(sentPixels()).toEqual([
		'ToDocx(markdown=["<encode>Hello world</encode>"], fileName="Chat Response Export");',
	]);
	expect(download).toHaveBeenCalledWith("insight-1", "file-key");
	expect(mocks.toast.success).toHaveBeenCalledWith("download.success");
	// focus goes back to the button that opened it
	await waitFor(() => expect(trigger).toHaveFocus());

	// a pixel that makes no file says so, and the dialog stays open
	fireEvent.click(trigger);
	dialog = await screen.findByRole("dialog", { name: "download.title" });
	vi.mocked(runPixel).mockResolvedValueOnce(pixelResponse(["nothing"]));
	fireEvent.click(
		within(dialog).getByRole("button", { name: /sidebar:download\.pdf/ }),
	);
	await waitFor(() =>
		expect(mocks.toast.error).toHaveBeenCalledWith(
			"sidebar:download.generateFailed",
		),
	);
	expect(sentPixels()[1]).toBe(
		'ToPdf(markdown=["<encode>Hello world</encode>"], fileName="Chat Response Export");',
	);
	expect(
		screen.getByRole("dialog", { name: "download.title" }),
	).toBeVisible();
	expect(download).toHaveBeenCalledTimes(1);
});

test("an image known only by its extension shows and previews with that type", async () => {
	const room = await createRoom([
		input("i1", "", "hi"),
		output("r1", "i1", [
			{
				type: "MEDIA",
				mediaInfo: {
					fileName: "photo.JPG",
					base64Data: "anBn",
					mediaInputType: "FILE",
				},
			},
		]),
	]);
	render(
		<ResponseMessage
			room={room}
			message={messageOf<ResponseMessageStore>(room, "r1")}
		/>,
	);

	const image = screen.getByRole("button", {
		name: "attachments.view photo.JPG",
	});
	expect(
		within(image).getByRole("img", { name: "photo.JPG" }),
	).toHaveAttribute("src", "data:image/jpeg;base64,anBn");
	fireEvent.click(image);
	const dialog = await screen.findByRole("dialog", { name: "photo.JPG" });
	expect(
		within(dialog).getByRole("img", { name: "photo.JPG" }),
	).toHaveAttribute("src", "data:image/jpeg;base64,anBn");
});
