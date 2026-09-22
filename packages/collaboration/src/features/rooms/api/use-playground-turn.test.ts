import type { PixelStreamMessage } from "@semoss/sdk";
import type {
	PlaygroundTurnOutput,
	ValidatedRoomMessage,
} from "@/features/messages/api/message-schemas";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import { PlaygroundTurnController } from "./use-playground-turn";

const transport = vi.hoisted(() => ({
	startPlaygroundJob: vi.fn(),
	stopPlaygroundJob: vi.fn(),
	runMcpTool: vi.fn(),
	runPlaygroundStatements: vi.fn(),
	uploadRoomFiles: vi.fn(),
}));

vi.mock("./playground-chat", async (importOriginal) => ({
	...(await importOriginal<typeof import("./playground-chat")>()),
	startPlaygroundJob: transport.startPlaygroundJob,
	stopPlaygroundJob: transport.stopPlaygroundJob,
	runMcpTool: transport.runMcpTool,
	runPlaygroundStatements: transport.runPlaygroundStatements,
}));

vi.mock("./upload-room-files", () => ({
	uploadRoomFiles: transport.uploadRoomFiles,
}));

interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (cause: unknown) => void;
}

function deferred<T>(): Deferred<T> {
	let resolve!: (value: T) => void;
	let reject!: (cause: unknown) => void;
	const promise = new Promise<T>((accept, decline) => {
		resolve = accept;
		reject = decline;
	});
	return { promise, resolve, reject };
}

function message(
	messageId: string,
	io: "INPUT" | "OUTPUT",
	parts: unknown[],
	parentMessageId?: string,
): ValidatedRoomMessage {
	return {
		messageId,
		io,
		visible: true,
		parts,
		parentMessageId,
	};
}

function turnOutput(
	responseParts: unknown[],
	ids: { input?: string; response?: string; parent?: string } = {},
): PlaygroundTurnOutput {
	const inputId = ids.input ?? "input-1";
	return {
		inputMessage: message(inputId, "INPUT", [
			{ type: "TEXT", text: "Question", uiText: "Question" },
		]),
		responseMessage: message(
			ids.response ?? "response-1",
			"OUTPUT",
			responseParts,
			ids.parent ?? inputId,
		),
	};
}

function toolPart(
	id: string,
	execution: "auto" | "ask" = "auto",
	name = "send_email",
) {
	return {
		type: "TOOL_CALL",
		toolCall: {
			id,
			name,
			title: "Send email",
			arguments: { to: "first@example.com" },
			_meta: {
				SMSS_MCP_EXECUTION: execution,
				SMSS_ENGINE_ID: "tool-engine",
			},
		},
	};
}

function successfulResult(output: unknown) {
	return [{ operationType: [], output }];
}

function controller() {
	return new PlaygroundTurnController({
		insightId: "insight-1",
		roomId: "room-1",
		engine: "model-1",
		context: "Be concise.",
	});
}

async function send(instance: PlaygroundTurnController) {
	await instance.send({ text: "Question", files: [] });
}

describe("PlaygroundTurnController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		transport.uploadRoomFiles.mockResolvedValue([]);
		transport.stopPlaygroundJob.mockResolvedValue(undefined);
		transport.runPlaygroundStatements.mockResolvedValue([]);
	});

	it("streams text, thinking, and tool arguments before authoritative reconciliation", async () => {
		const jobResult = deferred<ReturnType<typeof successfulResult>>();
		let emit: ((chunk: PixelStreamMessage) => void) | undefined;
		transport.startPlaygroundJob.mockImplementation(
			async (_insightId, _statement, onChunk) => {
				emit = onChunk;
				return { jobId: "ask-job", result: jobResult.promise };
			},
		);
		const instance = controller();
		await send(instance);

		emit?.({ stream_type: "content", data: { content: "Draft" } });
		emit?.({ stream_type: "thinking", data: { thinking: "Checking" } });
		emit?.({
			stream_type: "tool",
			data: {
				index: 0,
				id: "stream-tool",
				function: { name: "lookup", arguments: '{"term":' },
			},
		});
		emit?.({
			stream_type: "tool",
			data: { index: 0, function: { arguments: '"SEMOSS"}' } },
		});

		expect(instance.getSnapshot().messages[1]?.parts).toEqual([
			{ type: "text", text: "Draft", state: "active" },
			{ type: "thinking", text: "Checking", state: "active" },
			expect.objectContaining({
				type: "tool",
				tool: expect.objectContaining({
					id: "stream-tool",
					name: "lookup",
					arguments: { term: "SEMOSS" },
				}),
			}),
		]);

		jobResult.resolve(
			successfulResult(
				turnOutput([{ type: "TEXT", text: "Final", uiText: "Final" }]),
			),
		);
		await vi.waitFor(() => {
			expect(instance.getSnapshot().phase).toBe("completed");
		});
		expect(instance.getSnapshot().messages.map((item) => item.id)).toEqual([
			"input-1",
			"response-1",
		]);
		expect(instance.getSnapshot().messages[1]?.parts).toEqual([
			{ type: "text", text: "Final" },
		]);
	});

	it("restores a persisted unresolved approval after navigation", () => {
		const instance = controller();
		instance.reconcileHistory([
			message("response-1", "OUTPUT", [toolPart("approval-1", "ask")]),
		]);

		expect(instance.getSnapshot().phase).toBe("awaiting_approval");
		expect(instance.getSnapshot().pendingApprovals).toEqual([
			expect.objectContaining({
				toolId: "approval-1",
				parentMessageId: "response-1",
			}),
		]);
	});

	it("uploads attachments before including their durable locations in AskPlayground", async () => {
		transport.uploadRoomFiles.mockResolvedValue([
			{ fileLocation: "/room/uploads/brief.txt" },
		]);
		transport.startPlaygroundJob.mockResolvedValue({
			jobId: "ask-job",
			result: Promise.resolve(
				successfulResult(
					turnOutput([
						{ type: "TEXT", text: "Reviewed", uiText: "Reviewed" },
					]),
				),
			),
		});
		const attachment = new File(["contents"], "brief.txt", {
			type: "text/plain",
		});
		const instance = controller();

		await instance.send({ text: "Review this", files: [attachment] });
		await vi.waitFor(() => {
			expect(instance.getSnapshot().phase).toBe("completed");
		});

		expect(transport.uploadRoomFiles).toHaveBeenCalledWith("insight-1", [
			attachment,
		]);
		expect(
			String(transport.startPlaygroundJob.mock.calls[0]?.[1]),
		).toContain('media=["/room/uploads/brief.txt"]');
	});

	it("runs edited approval arguments and recursively handles a follow-up tool", async () => {
		let addCall = 0;
		transport.startPlaygroundJob.mockImplementation(
			async (_insightId, statement: string) => {
				if (statement.startsWith("AskPlayground")) {
					return {
						jobId: "ask-job",
						result: Promise.resolve(
							successfulResult(
								turnOutput([toolPart("tool-1", "ask")]),
							),
						),
					};
				}
				addCall += 1;
				return {
					jobId: `add-job-${addCall}`,
					result: Promise.resolve(
						successfulResult(
							addCall === 1
								? turnOutput(
										[toolPart("tool-2", "auto", "lookup")],
										{
											input: "tool-input-1",
											response: "tool-response-1",
										},
									)
								: turnOutput(
										[
											{
												type: "TEXT",
												text: "Done",
												uiText: "Done",
											},
										],
										{
											input: "tool-input-2",
											response: "tool-response-2",
										},
									),
						),
					),
				};
			},
		);
		transport.runMcpTool.mockResolvedValue("tool output");

		const instance = controller();
		await send(instance);
		await vi.waitFor(() => {
			expect(instance.getSnapshot().phase).toBe("awaiting_approval");
		});
		const approval = instance.getSnapshot()
			.pendingApprovals[0] as PendingToolApproval;
		await instance.approve(approval, { to: "edited@example.com" });

		await vi.waitFor(() => {
			expect(instance.getSnapshot().phase).toBe("completed");
		});
		expect(transport.runMcpTool).toHaveBeenNthCalledWith(
			1,
			"insight-1",
			expect.objectContaining({
				toolName: "send_email",
				argumentsValue: { to: "edited@example.com" },
			}),
		);
		expect(transport.runMcpTool).toHaveBeenNthCalledWith(
			2,
			"insight-1",
			expect.objectContaining({ toolName: "lookup" }),
		);
		expect(addCall).toBe(2);
	});

	it("limits automatic tool execution to five concurrent calls", async () => {
		const toolRuns = Array.from({ length: 6 }, () => deferred<string>());
		let runIndex = 0;
		transport.runMcpTool.mockImplementation(() => {
			const pending = toolRuns[runIndex];
			runIndex += 1;
			return pending?.promise;
		});
		let addCall = 0;
		transport.startPlaygroundJob.mockImplementation(
			async (_insightId, statement: string) => {
				if (statement.startsWith("AskPlayground")) {
					return {
						jobId: "ask-job",
						result: Promise.resolve(
							successfulResult(
								turnOutput(
									Array.from({ length: 6 }, (_, index) =>
										toolPart(`tool-${index + 1}`),
									),
								),
							),
						),
					};
				}
				addCall += 1;
				return {
					jobId: `add-job-${addCall}`,
					result: Promise.resolve(
						successfulResult(
							addCall === 6
								? turnOutput([
										{
											type: "TEXT",
											text: "All done",
											uiText: "All done",
										},
									])
								: "saved",
						),
					),
				};
			},
		);

		const instance = controller();
		await send(instance);
		await vi.waitFor(() => {
			expect(transport.runMcpTool).toHaveBeenCalledTimes(5);
		});
		toolRuns[0]?.resolve("one");
		await vi.waitFor(() => {
			expect(transport.runMcpTool).toHaveBeenCalledTimes(6);
		});
		for (const pending of toolRuns.slice(1)) pending.resolve("done");
		await vi.waitFor(() => {
			expect(instance.getSnapshot().phase).toBe("completed");
		});
		expect(addCall).toBe(6);
	});

	it("records a save failure as an error without re-running the tool", async () => {
		let addCall = 0;
		transport.startPlaygroundJob.mockImplementation(
			async (_insightId, statement: string) => {
				if (statement.startsWith("AskPlayground")) {
					return {
						jobId: "ask-job",
						result: Promise.resolve(
							successfulResult(turnOutput([toolPart("tool-1")])),
						),
					};
				}
				addCall += 1;
				return {
					jobId: `add-job-${addCall}`,
					result: Promise.resolve(
						addCall === 1
							? [
									{
										operationType: ["ERROR"],
										output: "save failed",
									},
								]
							: successfulResult(
									turnOutput([
										{
											type: "TEXT",
											text: "Recovered",
											uiText: "Recovered",
										},
									]),
								),
					),
				};
			},
		);
		transport.runMcpTool.mockResolvedValue("side effect completed");

		const instance = controller();
		await send(instance);
		await vi.waitFor(() => {
			expect(instance.getSnapshot().phase).toBe("completed");
		});

		expect(transport.runMcpTool).toHaveBeenCalledOnce();
		expect(addCall).toBe(2);
		const retryStatement = String(
			transport.startPlaygroundJob.mock.calls.at(-1)?.[1],
		);
		expect(retryStatement).toContain('mcpToolStatus="error"');
		expect(retryStatement).toContain("Failed to save tool response");
	});

	it("persists streamed text when an initial response is stopped", async () => {
		const jobResult = deferred<ReturnType<typeof successfulResult>>();
		let emit: ((chunk: PixelStreamMessage) => void) | undefined;
		transport.startPlaygroundJob.mockImplementation(
			async (_insightId, _statement, onChunk) => {
				emit = onChunk;
				return { jobId: "ask-job", result: jobResult.promise };
			},
		);
		transport.runPlaygroundStatements.mockResolvedValue(
			successfulResult(
				turnOutput([
					{ type: "TEXT", text: "Partial", uiText: "Partial" },
				]),
			),
		);
		const instance = controller();
		await send(instance);
		emit?.({ stream_type: "content", data: { content: "Partial" } });

		await instance.cancel();

		expect(transport.stopPlaygroundJob).toHaveBeenCalledWith(
			"insight-1",
			"ask-job",
		);
		const commit = String(
			transport.runPlaygroundStatements.mock.calls[0]?.[1],
		);
		expect(commit).toContain("responseParts=");
		expect(commit).toContain("Partial");
		expect(commit).toContain("stopped your previous response");
		expect(instance.getSnapshot().phase).toBe("completed");
		expect(instance.getSnapshot().settlementVersion).toBe(1);
	});

	it("commits a stopped post-tool response through AddPlaygroundToolExecution", async () => {
		const followUp = deferred<ReturnType<typeof successfulResult>>();
		let emitFollowUp: ((chunk: PixelStreamMessage) => void) | undefined;
		transport.runMcpTool.mockResolvedValue("tool output");
		transport.startPlaygroundJob.mockImplementation(
			async (_insightId, statement: string, onChunk) => {
				if (statement.startsWith("AskPlayground")) {
					return {
						jobId: "ask-job",
						result: Promise.resolve(
							successfulResult(turnOutput([toolPart("tool-1")])),
						),
					};
				}
				emitFollowUp = onChunk;
				return { jobId: "add-job", result: followUp.promise };
			},
		);
		transport.runPlaygroundStatements.mockResolvedValue(
			successfulResult(
				turnOutput([
					{
						type: "TEXT",
						text: "Tool follow-up",
						uiText: "Tool follow-up",
					},
				]),
			),
		);
		const instance = controller();
		await send(instance);
		await vi.waitFor(() => expect(emitFollowUp).toBeTypeOf("function"));
		emitFollowUp?.({
			stream_type: "content",
			data: { content: "Tool follow-up" },
		});

		await instance.cancel();

		expect(transport.stopPlaygroundJob).toHaveBeenCalledWith(
			"insight-1",
			"add-job",
		);
		const commit = String(
			transport.runPlaygroundStatements.mock.calls[0]?.[1],
		);
		expect(commit).toContain("AddPlaygroundToolExecution(");
		expect(commit).toContain("responseParts=");
		expect(commit).toContain("Tool follow-up");
		expect(instance.getSnapshot().settlementVersion).toBe(1);
	});

	it("cancels unresolved tools and ignores a late execution result", async () => {
		const toolRun = deferred<string>();
		transport.runMcpTool.mockReturnValue(toolRun.promise);
		transport.startPlaygroundJob.mockResolvedValue({
			jobId: "ask-job",
			result: Promise.resolve(
				successfulResult(turnOutput([toolPart("tool-1")])),
			),
		});
		transport.runPlaygroundStatements.mockResolvedValue(
			successfulResult(turnOutput([])),
		);
		const instance = controller();
		await send(instance);
		await vi.waitFor(() => {
			expect(instance.getSnapshot().toolStates["tool-1"]?.status).toBe(
				"RUNNING",
			);
		});

		await instance.cancel();
		expect(instance.getSnapshot().toolStates["tool-1"]?.status).toBe(
			"CANCELLED",
		);
		expect(
			String(transport.runPlaygroundStatements.mock.calls[0]?.[1]),
		).toContain('mcpToolStatus="cancelled"');

		toolRun.resolve("late success");
		await Promise.resolve();
		await Promise.resolve();
		expect(instance.getSnapshot().toolStates["tool-1"]?.status).toBe(
			"CANCELLED",
		);
		expect(transport.startPlaygroundJob).toHaveBeenCalledOnce();
	});
});
