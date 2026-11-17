import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { getWorkspace, type WorkspaceDetails } from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import { servePixelTransport } from "../../../test/pixel-transport";
import type {
	InputPixelMessage,
	PixelMessage,
	ResponsePixelMessage,
} from "../../../types";
import { RoomStore } from "../../room/store/room.store";
import type { InputMessageStore } from "../store/input-message.store";
import type { ResponseMessageStore } from "../store/response-message.store";
import { useMessage } from "../store/use-message";
import { RoomMessages } from "./room-messages";

const mocks = vi.hoisted(() => ({
	theme: { gracefulErrors: [] } as Record<string, unknown>,
	/** How many times each message's row rendered, by message id. */
	renders: {} as Record<string, number>,
}));

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getWorkspace: vi.fn(),
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
servePixelTransport({ runPixel: vi.mocked(runPixel) });
vi.mock("@semoss/i18n", async (original) => ({
	...(await original<typeof import("@semoss/i18n")>()),
	getI18n: () => ({ t: (key: string) => key }),
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: { dir: () => "ltr", language: "en" },
	}),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	ChatGeneratingIndicator: ({
		active,
		overrideMessage,
	}: {
		active: boolean;
		overrideMessage?: string;
	}) => (active ? <p>{overrideMessage ?? "Generating"}</p> : null),
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
vi.mock("../suggestions/room-suggestions", () => ({
	RoomSuggestions: () => <aside aria-label="suggestions" />,
}));
// each row reads its own message, as the real ones do, and counts its renders
vi.mock("./input-message", () => ({
	InputMessage: ({ message }: { message: InputMessageStore }) => {
		const id = useMessage(message, (current) => current.id);
		mocks.renders[id] = (mocks.renders[id] ?? 0) + 1;
		return <article aria-label={`input ${id}`} />;
	},
}));
vi.mock("./response-message", () => ({
	ResponseMessage: ({
		message,
		subsequentTools = [],
	}: {
		message: ResponseMessageStore;
		subsequentTools?: ResponseMessageStore[];
	}) => {
		const { id, parts } = useMessage(message, (current) => ({
			id: current.id,
			parts: current.parts,
		}));
		mocks.renders[id] = (mocks.renders[id] ?? 0) + 1;
		return (
			<article aria-label={`response ${id}`}>
				{parts.length} parts
				{subsequentTools.length > 0 &&
					`, folds ${subsequentTools.map((tool) => tool.id).join(" ")}`}
			</article>
		);
	},
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

/** Model Two's fields, for a message sent to another model. */
const MODEL_TWO = { modelId: "model-2", ornaments: { modelName: "Model Two" } };

/**
 * A stored user message.
 *
 * @param messageId - Its id.
 * @param parentMessageId - The response it follows, or "" for the first.
 * @param extra - Any other fields.
 * @returns The pixel message.
 */
const input = (
	messageId: string,
	parentMessageId: string,
	extra: Partial<InputPixelMessage> = {},
): InputPixelMessage => ({
	...PIXEL,
	io: "INPUT",
	type: "INPUT_TEXT",
	messageId,
	parentMessageId,
	parts: [{ type: "TEXT", text: messageId, uiText: messageId }],
	...extra,
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
 * @returns The response.
 */
const pixelResponse = (outputs: unknown[]) => ({
	errors: [],
	insightId: "insight-1",
	pixelReturn: outputs.map((value) => ({
		output: value,
		isMeta: false,
		operationType: [],
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
 * @param options - The room's theme, and the agent's workspace config when
 * the room was started from one.
 * @returns The loaded room.
 */
const createRoom = async (
	messages: PixelMessage[],
	options: { theme?: object; workspaceConfig?: object } = {},
) => {
	const room = new RoomStore({
		theme: (options.theme ?? {}) as ThemeMap["playground"],
		roomId: "room-1",
		insightId: "insight-1",
		panelComponents: {},
	});
	room.setModel({
		engine_id: "model-1",
		engine_name: "Model One",
		engine_type: "MODEL",
	});
	vi.mocked(runPixel).mockImplementation(async (pixel: string) => {
		if (pixel.startsWith("GetPlaygroundMessages")) {
			return pixelResponse([
				messages,
				options.workspaceConfig
					? { OPTIONS: { workspace: { workspace_id: "agent-1" } } }
					: {},
			]);
		}
		return pixelResponse([true]);
	});
	vi.mocked(getWorkspace).mockResolvedValue({
		mcp: [],
		skills: [],
		prompts: [],
		config_json: options.workspaceConfig,
	} as unknown as WorkspaceDetails);
	await room.initialize();
	return room;
};

/**
 * A message of the room by id.
 *
 * @param room - The room.
 * @param id - The message's id.
 * @returns The response.
 */
const responseOf = (room: RoomStore, id: string) =>
	room.getMessage(id) as ResponseMessageStore;

/** The conversation's rows, in order, by their names. */
const rowNames = () =>
	screen
		.getAllByRole("article")
		.map((row) => `${row.getAttribute("aria-label")}: ${row.textContent}`);

beforeEach(() => {
	vi.clearAllMocks();
	mocks.theme = { gracefulErrors: [] };
	mocks.renders = {};
	localStorage.clear();
	// jsdom has no element scrolling
	Element.prototype.scrollTo = vi.fn();
});

test("hidden messages and empty replies to a response are skipped, and tool-only responses fold up", async () => {
	const room = await createRoom([
		input("i1", ""),
		output("r1", "i1", [text("Hello")]),
		// a hidden note and its acknowledgement, as a stopped turn leaves them
		input("hidden-in", "r1", { visible: false }),
		output("hidden-out", "hidden-in", [text("ack")], { visible: false }),
		// tool-only responses fold into the response before them, across the
		// hidden pair
		output("r2", "hidden-out", [toolCall("a")]),
		output("r3", "r2", [{ type: "THINKING", thinking: "" }, toolCall("b")]),
		// an empty response after another response is noise
		output("r4", "r3", []),
		input("i2", "r4"),
		// an empty reply to the user still shows, and a tool-only response
		// folds into it
		output("r5", "i2", []),
		output("r6", "r5", [toolCall("c")]),
		input("i3", "r6"),
		output("r7", "i3", [toolCall("d")]),
		output("r8", "r7", [toolCall("e")]),
	]);
	render(<RoomMessages room={room} />);

	expect(rowNames()).toEqual([
		"input i1: ",
		"response r1: 1 parts, folds r2 r3",
		"input i2: ",
		"response r5: 0 parts, folds r6",
		"input i3: ",
		// a tool-only reply to the user has its own row, and the next folds in
		"response r7: 1 parts, folds r8",
	]);
	// every tool call waits on the user, so the room asks for them
	expect(screen.getByText("response.completeToolsAsk")).toBeInTheDocument();
});

test("the model's name shows above a message only when the model changes", async () => {
	const room = await createRoom([
		input("i1", ""),
		output("r1", "i1", [text("One")]),
		input("i2", "r1", MODEL_TWO),
		output("r2", "i2", [text("Two")], MODEL_TWO),
		// a hidden pair, sent to Model One, as a stopped turn leaves them
		input("hidden-in", "r2", { visible: false }),
		output("hidden-out", "hidden-in", [text("ack")], {
			visible: false,
		}),
		input("i3", "hidden-out", MODEL_TWO),
		output("r3", "i3", [text("Three")], MODEL_TWO),
		input("i4", "r3"),
		output("r4", "i4", [text("Four")]),
	]);
	const { container } = render(<RoomMessages room={room} />);

	// the room's own model is the first one, so it is not named
	const names = within(container).getAllByText(/^Model (One|Two)$/);
	expect(names.map((name) => name.textContent)).toEqual([
		"Model Two",
		// today: the hidden pair counts as the model before i3, so Model Two
		// is named again though nothing shown changed it
		"Model Two",
		"Model One",
	]);
	const rows = screen.getAllByRole("article");
	const precedes = (a: Element, b: Element) =>
		!!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
	// each name sits just above the message that changed the model
	for (const [index, name] of names.entries()) {
		const row = [2, 4, 6][index];
		expect(precedes(rows[row - 1], name) && precedes(name, rows[row])).toBe(
			true,
		);
	}
	expect(rows.map((row) => row.getAttribute("aria-label"))).toEqual([
		"input i1",
		"response r1",
		"input i2",
		"response r2",
		"input i3",
		"response r3",
		"input i4",
		"response r4",
	]);
});

test("an agent's greeting opens the conversation, and suggestions follow it when the theme turns them on", async () => {
	const room = await createRoom([], {
		theme: { featureFlags: { enableSuggestions: true } },
		workspaceConfig: { greeting_enabled: true, greeting: "**Welcome** in" },
	});
	render(<RoomMessages room={room} />);

	expect(screen.getByText("Welcome").tagName).toBe("STRONG");
	expect(screen.queryAllByRole("article")).toEqual([]);
	expect(
		screen.getByRole("complementary", { name: "suggestions" }),
	).toBeInTheDocument();

	// a greeting the agent turned off is not shown, and suggestions need the
	// room's own theme, not the host's
	mocks.theme = {
		gracefulErrors: [],
		featureFlags: { enableSuggestions: true },
	};
	const quiet = await createRoom([input("i1", "")], {
		workspaceConfig: { greeting_enabled: false, greeting: "Hidden" },
	});
	render(<RoomMessages room={quiet} />);
	expect(screen.queryByText("Hidden")).toBeNull();
	expect(
		screen.getAllByRole("complementary", { name: "suggestions" }),
	).toHaveLength(1);
});

test("the room's error shows below the conversation, in the theme's words when it has them", async () => {
	mocks.theme = {
		gracefulErrors: [
			{ pattern: "quota", errorKey: "quotaExceeded" },
			{ pattern: "offline", text: "You are offline" },
		],
	};
	const room = await createRoom([
		input("i1", ""),
		output("r1", "i1", [text("Hello")]),
	]);
	render(<RoomMessages room={room} />);

	act(() => room.setError(new Error("Model exploded")));
	expect(screen.getByText("Model exploded")).toBeInTheDocument();

	act(() => room.setError(new Error("Daily quota reached")));
	expect(
		screen.getByText("gracefulErrors.quotaExceeded"),
	).toBeInTheDocument();

	act(() => room.setError(new Error("Went offline")));
	expect(screen.getByText("You are offline")).toBeInTheDocument();

	act(() => room.setError(new Error("")));
	expect(screen.getByText("gracefulErrors.errorDefault")).toBeInTheDocument();

	act(() => room.setError(null));
	expect(screen.queryByText("gracefulErrors.errorDefault")).toBeNull();
});

test("a pending response has no row until it streams, and a streamed token renders only its message", async () => {
	const room = await createRoom([
		input("i1", ""),
		output("r1", "i1", [text("One")]),
		input("i2", "r1"),
		output("r2", "i2", []),
	]);
	const streaming = responseOf(room, "r2");
	act(() => streaming.setIsThinking(true));
	render(<RoomMessages room={room} />);

	// nothing to show yet: the indicator stands in for it
	expect(rowNames()).toEqual([
		"input i1: ",
		"response r1: 1 parts",
		"input i2: ",
	]);
	expect(screen.getByText("Generating")).toBeInTheDocument();

	// its first reasoning gives it a row
	act(() => streaming.savePart({ type: "THINKING", thinking: "Hmm" }));
	act(() => streaming.savePart(text("T")));
	expect(rowNames()).toEqual([
		"input i1: ",
		"response r1: 1 parts",
		"input i2: ",
		"response r2: 2 parts",
	]);
	// the indicator steps aside once the response streams
	expect(screen.queryByText("Generating")).toBeNull();

	mocks.renders = {};
	act(() => streaming.savePart(text("o")));
	act(() => streaming.savePart(text("k")));
	act(() => streaming.savePart(text("en")));
	expect(mocks.renders).toEqual({ r2: 3 });
	expect(streaming.parts).toEqual([
		{ type: "THINKING", thinking: "Hmm" },
		text("Token"),
	]);
});
