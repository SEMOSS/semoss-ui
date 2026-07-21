import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatOptions } from "./chat-options";
import { ChatSession } from "./chat-session";
import type {
	ChatMessage,
	RawPixelMessage,
	ResponseMessage,
	StreamChunk,
} from "./types";

function flushMicrotasks(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

const {
	createPlaygroundRoom,
	updateRoomOptions,
	askPlayground,
	runMcpTool,
	addPlaygroundToolExecution,
	getPlaygroundRoomHistory,
	submitFeedback,
	downloadMessageAsFile,
} = vi.hoisted(() => ({
	createPlaygroundRoom: vi.fn(),
	updateRoomOptions: vi.fn(),
	askPlayground: vi.fn(),
	runMcpTool: vi.fn(),
	addPlaygroundToolExecution: vi.fn(),
	getPlaygroundRoomHistory: vi.fn(),
	submitFeedback: vi.fn(),
	downloadMessageAsFile: vi.fn(),
}));

vi.mock("./transport/pixel-calls", () => ({
	createPlaygroundRoom,
	updateRoomOptions,
	askPlayground,
	runMcpTool,
	addPlaygroundToolExecution,
	getPlaygroundRoomHistory,
	submitFeedback,
	downloadMessageAsFile,
}));

// biome-ignore lint/suspicious/noExplicitAny: test double, real InsightActions is a large SDK type
const actions = {} as any;
const insightId = "insight-1";

const baseOptions: ChatOptions = { engineId: "test-engine" };

function textResponse(text: string, messageId = "msg-1"): ResponseMessage {
	return { messageId, parts: [{ type: "TEXT", text }] };
}

function toolCallResponse(messageId = "msg-1"): ResponseMessage {
	return {
		messageId,
		type: "RESPONSE_TOOL",
		parts: [
			{
				type: "TOOL_CALL",
				toolCall: {
					id: "tool-1",
					name: "doThing",
					arguments: { foo: "bar" },
					_meta: { SMSS_PROJECT_ID: "project-1" },
				},
			},
		],
	};
}

/** Simulates askPlayground/addPlaygroundToolExecution's real signature: streams chunks, then resolves with the final structured response. */
function streamed(chunks: StreamChunk[], response: ResponseMessage) {
	return async (
		_insightId: string,
		_params: unknown,
		onChunk: (chunk: StreamChunk) => void,
	) => {
		for (const chunk of chunks) {
			onChunk(chunk);
		}
		return response;
	};
}

function contentChunk(text: string): StreamChunk {
	return { stream_type: "content", data: { content: text } };
}

function messageText(message: ChatMessage | undefined): string {
	if (!message) {
		return "";
	}
	return message.parts
		.filter((part) => part.type === "text")
		.map((part) => (part.type === "text" ? part.text : ""))
		.join("");
}

beforeEach(() => {
	createPlaygroundRoom.mockReset().mockResolvedValue({ roomId: "room-1" });
	updateRoomOptions.mockReset().mockResolvedValue(undefined);
	askPlayground.mockReset();
	runMcpTool.mockReset().mockResolvedValue({ ok: true });
	addPlaygroundToolExecution.mockReset();
	getPlaygroundRoomHistory
		.mockReset()
		.mockResolvedValue({ messages: [], mcp: [] });
	submitFeedback.mockReset().mockResolvedValue(undefined);
	downloadMessageAsFile.mockReset().mockResolvedValue(undefined);
});

describe("ChatSession.sendMessage", () => {
	it("defers resumed-room history and starts it only once", async () => {
		const session = new ChatSession(
			actions,
			insightId,
			{ ...baseOptions, roomId: "room-1" },
			false,
		);

		expect(getPlaygroundRoomHistory).not.toHaveBeenCalled();

		await Promise.all([session.start(), session.start()]);

		expect(getPlaygroundRoomHistory).toHaveBeenCalledTimes(1);
		expect(getPlaygroundRoomHistory).toHaveBeenCalledWith(
			actions,
			"room-1",
		);
	});

	it("streams content chunks into a single merged text part and marks the message complete", async () => {
		askPlayground.mockImplementation(
			streamed(
				[contentChunk("hello "), contentChunk("there")],
				textResponse("hello there"),
			),
		);
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("hi");

		expect(session.messages).toHaveLength(2);
		expect(session.messages[0]).toMatchObject({ role: "user" });
		expect(messageText(session.messages[0])).toBe("hi");
		expect(session.messages[1]).toMatchObject({
			role: "assistant",
			status: "complete",
		});
		// two content chunks merge into one text part, not two
		expect(session.messages[1]?.parts).toHaveLength(1);
		expect(messageText(session.messages[1])).toBe("hello there");
		expect(session.isTyping).toBe(false);
		expect(session.error).toBeNull();
	});

	it("marks the assistant message streaming while chunks arrive, then complete", async () => {
		let resolveAskPlayground: (value: ResponseMessage) => void = () => {};
		askPlayground.mockImplementation(
			(
				_insightId: string,
				_params: unknown,
				onChunk: (chunk: StreamChunk) => void,
			) => {
				onChunk(contentChunk("partial"));
				return new Promise((resolve) => {
					resolveAskPlayground = () =>
						resolve(textResponse("partial"));
				});
			},
		);
		const session = new ChatSession(actions, insightId, baseOptions);

		const sendPromise = session.sendMessage("hi");

		// status alone isn't a reliable wait condition here — it's already
		// "streaming" synchronously at message creation, before askPlayground
		// (and its onChunk callback) has even run.
		await vi.waitFor(() => {
			expect(messageText(session.messages.at(-1))).toBe("partial");
		});
		expect(session.messages.at(-1)?.status).toBe("streaming");

		resolveAskPlayground(textResponse("partial"));
		await sendPromise;

		expect(session.messages.at(-1)?.status).toBe("complete");
	});

	it("falls back to the final response's text if no content chunks streamed in", async () => {
		askPlayground.mockImplementation(
			streamed([], textResponse("fallback text")),
		);
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("hi");

		expect(messageText(session.messages.at(-1))).toBe("fallback text");
	});

	it("creates the room only once across multiple messages", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("first");
		await session.sendMessage("second");

		expect(createPlaygroundRoom).toHaveBeenCalledTimes(1);
		expect(session.roomId).toBe("room-1");
	});

	it("syncs room options once when defaultRoomSettings is provided", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			defaultRoomSettings: { instructions: "be nice", temperature: 0.2 },
		});

		await session.sendMessage("first");
		await session.sendMessage("second");

		expect(updateRoomOptions).toHaveBeenCalledTimes(1);
		expect(updateRoomOptions).toHaveBeenCalledWith(
			actions,
			expect.objectContaining({
				roomId: "room-1",
				instructions: "be nice",
				temperature: 0.2,
			}),
		);
	});

	it("does not call updateRoomOptions when no defaultRoomSettings given", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("hi");

		expect(updateRoomOptions).not.toHaveBeenCalled();
	});

	it("auto-executes a tool call round inline in the same assistant message", async () => {
		askPlayground.mockImplementation(streamed([], toolCallResponse()));
		addPlaygroundToolExecution.mockImplementation(
			streamed(
				[contentChunk("tool result summary")],
				textResponse("tool result summary", "msg-2"),
			),
		);
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("do the thing");

		expect(runMcpTool).toHaveBeenCalledWith(
			actions,
			expect.objectContaining({
				projectId: "project-1",
				functionName: "doThing",
				paramValues: { foo: "bar" },
			}),
		);
		expect(addPlaygroundToolExecution).toHaveBeenCalledTimes(1);

		// exactly one assistant message — everything folds into it, not a
		// separate message per phase
		expect(session.messages).toHaveLength(2);
		const assistantMessage = session.messages.at(-1);
		expect(assistantMessage?.status).toBe("complete");
		expect(assistantMessage?.parts.map((part) => part.type)).toEqual([
			"tool_call",
			"tool_result",
			"text",
		]);
		expect(assistantMessage?.parts[0]).toMatchObject({
			type: "tool_call",
			name: "doThing",
			arguments: { foo: "bar" },
		});
		expect(assistantMessage?.parts[1]).toMatchObject({
			type: "tool_result",
			status: "success",
		});
		expect(messageText(assistantMessage)).toBe("tool result summary");
	});

	it("reconciles a streamed tool_call placeholder with the authoritative final result", async () => {
		// streamed chunks only know a partial name ("do"); the real name
		// and arguments should come from the final structured response
		askPlayground.mockImplementation(
			streamed(
				[
					{
						stream_type: "tool",
						data: {
							index: 0,
							id: "tool-1",
							function: { name: "do" },
						},
					},
				],
				toolCallResponse(),
			),
		);
		addPlaygroundToolExecution.mockImplementation(
			streamed([contentChunk("done")], textResponse("done", "msg-2")),
		);
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("do the thing");

		const assistantMessage = session.messages.at(-1);
		const toolCallParts = assistantMessage?.parts.filter(
			(part) => part.type === "tool_call",
		);
		expect(toolCallParts).toHaveLength(1);
		expect(toolCallParts?.[0]).toMatchObject({
			name: "doThing",
			arguments: { foo: "bar" },
		});
	});

	it("records an error tool_result and stops when runMcpTool fails", async () => {
		askPlayground.mockImplementation(streamed([], toolCallResponse()));
		runMcpTool.mockRejectedValue(new Error("tool boom"));
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("do the thing");

		expect(addPlaygroundToolExecution).not.toHaveBeenCalled();
		const assistantMessage = session.messages.at(-1);
		expect(assistantMessage?.status).toBe("error");
		expect(
			assistantMessage?.parts.find((part) => part.type === "tool_result"),
		).toMatchObject({ status: "error", output: "tool boom" });
	});

	it("stops after toolAutoExecutionLimit rounds and marks the message as error", async () => {
		askPlayground.mockImplementation(streamed([], toolCallResponse()));
		addPlaygroundToolExecution.mockImplementation(
			streamed([], toolCallResponse("msg-2")),
		);
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			toolAutoExecutionLimit: 1,
		});

		await session.sendMessage("loop forever");

		expect(addPlaygroundToolExecution).toHaveBeenCalledTimes(1);
		expect(session.messages.at(-1)?.status).toBe("error");
		expect(session.error).not.toBeNull();
	});

	it("maps a matching error substring through gracefulErrors", async () => {
		askPlayground.mockRejectedValue(new Error("insight 503 timeout"));
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			gracefulErrors: {
				"503": "The assistant is temporarily unavailable.",
			},
		});

		await session.sendMessage("hi");

		expect(session.error).toBe("The assistant is temporarily unavailable.");
		expect(session.messages.at(-1)?.status).toBe("error");
		expect(messageText(session.messages.at(-1))).toBe(
			"The assistant is temporarily unavailable.",
		);
	});

	it("ignores empty/whitespace-only input", async () => {
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.sendMessage("   ");

		expect(session.messages).toHaveLength(0);
		expect(createPlaygroundRoom).not.toHaveBeenCalled();
	});
});

describe("ChatSession.engineId", () => {
	it("starts at options.engineId and changes what subsequent messages send", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("ok")));
		const session = new ChatSession(actions, insightId, baseOptions);

		expect(session.engineId).toBe("test-engine");

		await session.sendMessage("first");
		expect(askPlayground).toHaveBeenLastCalledWith(
			insightId,
			expect.objectContaining({ engineId: "test-engine" }),
			expect.any(Function),
		);

		session.setEngineId("other-engine");
		expect(session.engineId).toBe("other-engine");

		await session.sendMessage("second");
		expect(askPlayground).toHaveBeenLastCalledWith(
			insightId,
			expect.objectContaining({ engineId: "other-engine" }),
			expect.any(Function),
		);
	});

	it("uses the current engineId for a tool-continuation call too", async () => {
		askPlayground.mockImplementation(streamed([], toolCallResponse()));
		addPlaygroundToolExecution.mockImplementation(
			streamed([], textResponse("done", "msg-2")),
		);
		const session = new ChatSession(actions, insightId, baseOptions);
		session.setEngineId("other-engine");

		await session.sendMessage("do the thing");

		expect(addPlaygroundToolExecution).toHaveBeenCalledWith(
			insightId,
			expect.objectContaining({ engineId: "other-engine" }),
			expect.any(Function),
		);
	});
});

describe("ChatSession resume (roomId option)", () => {
	function rawMessage(
		overrides: Partial<RawPixelMessage> & { messageId: string },
	): RawPixelMessage {
		return {
			io: "INPUT",
			dateCreated: "2026-06-22 12:00:00",
			parts: [],
			...overrides,
		};
	}

	it("loads history and populates messages when constructed with a roomId", async () => {
		getPlaygroundRoomHistory.mockResolvedValue({
			messages: [
				rawMessage({
					messageId: "m1",
					io: "INPUT",
					modelId: "engine-2",
					parts: [{ type: "TEXT", text: "earlier question" }],
				}),
				rawMessage({
					messageId: "m2",
					io: "OUTPUT",
					parentMessageId: "m1",
					parts: [{ type: "TEXT", text: "earlier answer" }],
				}),
			],
			mcp: [],
		});

		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "room-1",
		});

		expect(session.roomId).toBe("room-1");
		expect(session.isLoadingHistory).toBe(true);
		expect(createPlaygroundRoom).not.toHaveBeenCalled();

		await flushMicrotasks();

		expect(session.isLoadingHistory).toBe(false);
		expect(session.messages).toHaveLength(2);
		expect(messageText(session.messages[0])).toBe("earlier question");
		expect(messageText(session.messages[1])).toBe("earlier answer");
		// lastModelId from the walked INPUT message seeds engineId.
		expect(session.engineId).toBe("engine-2");
	});

	it("does not call createPlaygroundRoom when sending into a resumed room", async () => {
		getPlaygroundRoomHistory.mockResolvedValue({ messages: [], mcp: [] });
		askPlayground.mockImplementation(
			streamed([], textResponse("hi there")),
		);
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "room-1",
		});
		await flushMicrotasks();

		await session.sendMessage("hi");

		expect(createPlaygroundRoom).not.toHaveBeenCalled();
		expect(askPlayground).toHaveBeenCalledWith(
			insightId,
			expect.objectContaining({ roomId: "room-1" }),
			expect.any(Function),
		);
	});

	it("never overwrites defaultRoomSettings onto a resumed room's own options", async () => {
		getPlaygroundRoomHistory.mockResolvedValue({ messages: [], mcp: [] });
		askPlayground.mockImplementation(streamed([], textResponse("hi")));
		const session = new ChatSession(actions, insightId, {
			engineId: "test-engine",
			roomId: "room-1",
			defaultRoomSettings: { instructions: "be terse" },
		});
		await flushMicrotasks();

		await session.sendMessage("hi");

		expect(updateRoomOptions).not.toHaveBeenCalled();
	});

	it("does not clobber an in-flight optimistic message if history resolves after the user already sent one", async () => {
		let resolveHistory: (value: RawPixelMessage[]) => void = () => {};
		getPlaygroundRoomHistory.mockImplementation(
			() =>
				new Promise<RawPixelMessage[]>((resolve) => {
					resolveHistory = resolve;
				}),
		);
		askPlayground.mockImplementation(streamed([], textResponse("hi back")));

		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "room-1",
		});

		// User sends before history resolves.
		await session.sendMessage("hi");
		expect(session.messages).toHaveLength(2);

		// History now resolves with unrelated older messages — must not
		// replace what's already showing.
		resolveHistory([
			rawMessage({
				messageId: "old-1",
				io: "INPUT",
				parts: [{ type: "TEXT", text: "old message" }],
			}),
		]);
		await flushMicrotasks();

		expect(session.messages).toHaveLength(2);
		expect(messageText(session.messages[0])).toBe("hi");
	});

	it("surfaces a load-history failure through the gracefulErrors mapping", async () => {
		getPlaygroundRoomHistory.mockRejectedValue(
			new Error("room lookup failed: not found"),
		);
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "missing-room",
			gracefulErrors: { "not found": "That room no longer exists." },
		});

		await flushMicrotasks();

		expect(session.isLoadingHistory).toBe(false);
		expect(session.error).toBe("That room no longer exists.");
	});

	it("carries a historical message's feedback rating onto the resumed ChatMessage", async () => {
		getPlaygroundRoomHistory.mockResolvedValue({
			messages: [
				rawMessage({
					messageId: "m1",
					io: "INPUT",
					parts: [{ type: "TEXT", text: "question" }],
				}),
				rawMessage({
					messageId: "m2",
					io: "OUTPUT",
					parentMessageId: "m1",
					parts: [{ type: "TEXT", text: "answer" }],
					feedback: { rating: true },
				}),
			],
			mcp: [],
		});
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "room-1",
		});

		await flushMicrotasks();

		expect(session.messages[1]?.feedback).toEqual({ rating: true });
	});
});

describe("ChatSession.recordFeedback", () => {
	async function sessionWithOneResponse(): Promise<ChatSession> {
		askPlayground.mockImplementation(streamed([], textResponse("hi back")));
		const session = new ChatSession(actions, insightId, baseOptions);
		await session.sendMessage("hi");
		return session;
	}

	it("optimistically sets the rating and calls submitFeedback with roomId/messageId", async () => {
		const session = await sessionWithOneResponse();
		const assistantMessage = session.messages[1];

		await session.recordFeedback(assistantMessage.id, true);

		expect(assistantMessage.feedback).toEqual({ rating: true });
		expect(submitFeedback).toHaveBeenCalledWith(actions, {
			roomId: "room-1",
			messageId: assistantMessage.id,
			rating: true,
		});
	});

	it("clears the rating when called again with the same value (toggle-off)", async () => {
		const session = await sessionWithOneResponse();
		const assistantMessage = session.messages[1];

		await session.recordFeedback(assistantMessage.id, true);
		await session.recordFeedback(assistantMessage.id, true);

		expect(assistantMessage.feedback).toBeUndefined();
		expect(submitFeedback).toHaveBeenLastCalledWith(actions, {
			roomId: "room-1",
			messageId: assistantMessage.id,
			rating: null,
		});
	});

	it("reverts the optimistic update if submitFeedback rejects", async () => {
		const session = await sessionWithOneResponse();
		const assistantMessage = session.messages[1];
		submitFeedback.mockRejectedValue(new Error("network error"));

		await session.recordFeedback(assistantMessage.id, true);

		expect(assistantMessage.feedback).toBeUndefined();
		expect(session.error).toBeTruthy();
	});
});

describe("ChatSession.downloadMessage", () => {
	it("joins the message's text parts and calls downloadMessageAsFile", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("hi back")));
		const session = new ChatSession(actions, insightId, baseOptions);
		await session.sendMessage("hi");
		const assistantMessage = session.messages[1];

		await session.downloadMessage(assistantMessage.id, "word");

		expect(downloadMessageAsFile).toHaveBeenCalledWith(actions, insightId, {
			format: "word",
			markdown: "hi back",
			fileName: "room-1",
		});
	});

	it("throws when the message has no text content", async () => {
		askPlayground.mockImplementation(
			streamed([], { messageId: "msg-1", parts: [] }),
		);
		const session = new ChatSession(actions, insightId, baseOptions);
		await session.sendMessage("hi");
		const assistantMessage = session.messages[1];

		await expect(
			session.downloadMessage(assistantMessage.id, "pdf"),
		).rejects.toThrow("No content to download");
	});
});

describe("ChatSession.setMcp", () => {
	const knowledgeMcp = { type: "VECTOR" as const, id: "kb-1", name: "Docs" };

	it("updates local state immediately, without persisting, before a room exists", async () => {
		const session = new ChatSession(actions, insightId, baseOptions);

		await session.setMcp([knowledgeMcp]);

		expect(session.mcp).toEqual([knowledgeMcp]);
		expect(updateRoomOptions).not.toHaveBeenCalled();
	});

	it("persists via UpdateRoomOptions once a room exists", async () => {
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "room-1",
		});
		await flushMicrotasks();

		await session.setMcp([knowledgeMcp]);

		expect(session.mcp).toEqual([knowledgeMcp]);
		expect(updateRoomOptions).toHaveBeenCalledWith(actions, {
			roomId: "room-1",
			instructions: undefined,
			temperature: undefined,
			mcp: [knowledgeMcp],
		});
	});

	it("reverts to the previous value if the pixel call fails", async () => {
		const session = new ChatSession(actions, insightId, {
			...baseOptions,
			roomId: "room-1",
		});
		await flushMicrotasks();
		updateRoomOptions.mockRejectedValueOnce(new Error("network error"));

		await session.setMcp([knowledgeMcp]);

		expect(session.mcp).toEqual([]);
		expect(session.error).toBeTruthy();
	});

	it("persists a brand-new room's first-attached mcp on the first sendMessage (syncRoomOptionsOnce)", async () => {
		askPlayground.mockImplementation(streamed([], textResponse("hi back")));
		const session = new ChatSession(actions, insightId, baseOptions);

		// Attached before the room exists yet — setMcp is a local-only no-op
		// here (see the first test above); the room isn't created until the
		// first sendMessage().
		await session.setMcp([knowledgeMcp]);
		expect(updateRoomOptions).not.toHaveBeenCalled();

		await session.sendMessage("hi");

		// This is the exact dormant bug the plan called out: without
		// threading `mcp` through syncRoomOptionsOnce, this first save would
		// silently persist an empty mcp array and wipe the attachment.
		expect(updateRoomOptions).toHaveBeenCalledWith(actions, {
			roomId: "room-1",
			instructions: undefined,
			temperature: undefined,
			mcp: [knowledgeMcp],
		});
	});
});
