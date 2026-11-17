import { act, render } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { beforeEach, expect, test, vi } from "vitest";
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
import { RoomMessages } from "./room-messages";

const mocks = vi.hoisted(() => ({
	/** Commits inside each message's row, by message id. */
	renders: {} as Record<string, number>,
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
vi.mock("../../chat/config/use-chat-config", () => ({
	useChatConfig: () => ({ theme: { gracefulErrors: [] } }),
}));
vi.mock("../../connectors/store/connector-tools", async (original) => ({
	...(await original<
		typeof import("../../connectors/store/connector-tools")
	>()),
	readUserConnectorTools: vi.fn().mockResolvedValue(null),
}));

/**
 * Wrap a row in a profiler named for its message, so every commit inside the
 * real row counts toward that message.
 *
 * @param id - The message's id.
 * @returns Counts the commit.
 */
const countRow =
	(id: string): ProfilerOnRenderCallback =>
	() => {
		mocks.renders[id] = (mocks.renders[id] ?? 0) + 1;
	};

// the real rows, each inside a profiler that counts its commits
vi.mock("./response-message", async (original) => {
	const real = await original<typeof import("./response-message")>();
	return {
		ResponseMessage: (
			props: Parameters<typeof real.ResponseMessage>[0],
		) => (
			<Profiler
				id={props.message.id}
				onRender={countRow(props.message.id)}
			>
				<real.ResponseMessage {...props} />
			</Profiler>
		),
	};
});
vi.mock("./input-message", async (original) => {
	const real = await original<typeof import("./input-message")>();
	return {
		InputMessage: (props: Parameters<typeof real.InputMessage>[0]) => (
			<Profiler
				id={props.message.id}
				onRender={countRow(props.message.id)}
			>
				<real.InputMessage {...props} />
			</Profiler>
		),
	};
});

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
 * @returns The pixel message.
 */
const input = (
	messageId: string,
	parentMessageId: string,
): InputPixelMessage => ({
	...PIXEL,
	io: "INPUT",
	type: "INPUT_TEXT",
	messageId,
	parentMessageId,
	parts: [{ type: "TEXT", text: `Question ${messageId}`, uiText: messageId }],
});

/**
 * A stored response.
 *
 * @param messageId - Its id.
 * @param parentMessageId - The message it answers.
 * @returns The pixel message.
 */
const output = (
	messageId: string,
	parentMessageId: string,
): ResponsePixelMessage => ({
	...PIXEL,
	io: "OUTPUT",
	messageId,
	parentMessageId,
	parts: [
		{
			type: "TEXT",
			text: `Answer **${messageId}**, with a list:\n\n- one\n- two`,
			uiText: messageId,
		},
	],
});

/** The profiler around the whole conversation. */
const CONVERSATION_PROFILER = "conversation";

/** How many user and response pairs the conversation holds. */
const PAIRS = 75;

/** How many tokens stream into the last response. */
const TOKENS = 200;

/**
 * The conversation: {@link PAIRS} pairs, with a second branch beside the
 * tenth user message. The branch comes first, so the long chain is active.
 *
 * @returns The stored messages.
 */
const conversation = (): PixelMessage[] => {
	const messages: PixelMessage[] = [];
	for (let pair = 1; pair <= PAIRS; pair += 1) {
		const parent = pair === 1 ? "" : `r${pair - 1}`;
		if (pair === 10) {
			messages.push(
				input("i10-alt", parent),
				output("r10-alt", "i10-alt"),
			);
		}
		messages.push(
			input(`i${pair}`, parent),
			output(`r${pair}`, `i${pair}`),
		);
	}
	return messages;
};

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

beforeEach(() => {
	vi.clearAllMocks();
	mocks.renders = {};
	localStorage.clear();
	// jsdom has no element scrolling
	Element.prototype.scrollTo = vi.fn();
});

test("streaming into a long conversation renders only the streaming message", async () => {
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
			? pixelResponse([conversation(), {}])
			: pixelResponse([true]),
	);
	await room.initialize();
	expect(room.history).toHaveLength(PAIRS * 2);

	let commits = 0;
	render(
		<Profiler
			id={CONVERSATION_PROFILER}
			onRender={() => {
				commits += 1;
			}}
		>
			<RoomMessages room={room} />
		</Profiler>,
	);
	const mountCommits = commits;

	const streaming = room.getMessage(`r${PAIRS}`) as ResponseMessageStore;
	act(() => streaming.setIsThinking(true));

	commits = 0;
	mocks.renders = {};
	const start = performance.now();
	for (let token = 0; token < TOKENS; token += 1) {
		act(() =>
			streaming.savePart({ type: "TEXT", text: " tok", uiText: " tok" }),
		);
	}
	const streamMs = performance.now() - start;
	const streamCommits = commits;
	const streamRenders = { ...mocks.renders };
	act(() => streaming.setIsThinking(false));

	// switch the tenth user message to its other branch
	commits = 0;
	mocks.renders = {};
	const branchStart = performance.now();
	const tenth = room.getMessage("i10") as InputMessageStore;
	act(() => tenth.previousSibling?.activateMessage());
	const branchMs = performance.now() - branchStart;
	expect(room.history.map((message) => message.id)).toEqual([
		...Array.from({ length: 9 }, (_, index) => [
			`i${index + 1}`,
			`r${index + 1}`,
		]).flat(),
		"i10-alt",
		"r10-alt",
	]);
	const branchCommits = commits;
	const branchRenders = { ...mocks.renders };

	const otherRows = Object.keys(streamRenders).filter(
		(id) => id !== `r${PAIRS}`,
	);
	console.info(
		JSON.stringify(
			{
				messages: PAIRS * 2 + 2,
				tokens: TOKENS,
				mountCommits,
				stream: {
					commits: streamCommits,
					wallMs: Math.round(streamMs),
					msPerToken: Number((streamMs / TOKENS).toFixed(2)),
					renders: streamRenders,
				},
				branchSwitch: {
					commits: branchCommits,
					wallMs: Math.round(branchMs),
					renders: branchRenders,
				},
			},
			null,
			2,
		),
	);

	// loose bounds: a token commits about once and renders its own row only
	expect(streamCommits).toBeLessThan(TOKENS * 4);
	expect(otherRows).toEqual([]);
	expect(streamRenders[`r${PAIRS}`]).toBeLessThan(TOKENS * 4);
	expect(branchCommits).toBeLessThan(20);
	expect(streamMs).toBeLessThan(60_000);
});
