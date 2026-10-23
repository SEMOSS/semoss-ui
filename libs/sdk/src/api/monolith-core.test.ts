import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
	vi,
} from "vitest";
import { Env } from "../env";
import { clearSession } from "../utility/session";
import { browserSocketUrl } from "./monolith/browser-sessions";
import { type AgentRunProgress, agentRunStreaming } from "./monolith/engine";
import { imageDownloadUrl } from "./monolith/engine-route";
import { comms, commsSse, commsUrl } from "./monolith/ext/mcp";
import {
	embeddings,
	llm,
	type ModelResponseUsageLimits,
	vision,
} from "./monolith/model";
import { chat } from "./monolith/model/ollama";
import {
	insightImageDownloadUrl,
	jdbcCsvPost,
	jdbcJson,
	jdbcJsonPost,
	projectImageDownloadUrl,
} from "./monolith/project";
import { list } from "./monolith/storage";
import { baseUpload } from "./monolith/upload-file";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	Env.update({
		MODULE: "https://example.test/Monolith/",
		CSRF: false,
		HEADLESS: false,
	});
	clearSession();
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => vi.unstubAllGlobals());

describe("core route wire contracts", () => {
	it("preserves model billing rules and omitted nullable fields across model responses", async () => {
		const ceilingOnly = {
			unlimited: false,
			rules: [],
			capped: true,
			ceilings: [
				{
					limitType: "MODEL_TOTAL",
					rules: [
						{
							metric: "COST",
							amount: 1000000,
							window: "MONTH",
							teamTotal: false,
							used: 15000,
							resetsAt: "2026-11-01T00:00:00Z",
						},
					],
				},
			],
		} satisfies ModelResponseUsageLimits;
		const billed = {
			billedTo: {
				sourceType: "TEAM",
				subjectId: "team",
				subjectType: "CUSTOM",
				limitType: "TEAM",
			},
			unlimited: false,
			capped: false,
			ceilings: [],
			rules: [
				{
					metric: "TOKENS",
					amount: 5000,
					window: "MINUTE",
					windowLength: 10,
					counts: "SHARED",
					teamTotal: true,
					used: 20,
					resetsAt: "2026-10-23T10:10:00Z",
				},
			],
		} satisfies ModelResponseUsageLimits;
		const scenarios = [
			{
				call: () => llm({ modelId: "m", command: "hi" }),
				usageLimits: ceilingOnly,
				output: {
					messageType: "CHAT",
					response: "hi",
					messageId: "message",
					roomId: "room",
				},
			},
			{
				call: () =>
					vision({
						modelId: "m",
						command: "describe",
						image: "image.png",
					}),
				usageLimits: billed,
				output: {
					messageType: "CHAT",
					response: "a picture",
					messageId: "message",
					roomId: "room",
				},
			},
			{
				call: () => embeddings({ modelId: "m", values: ["hi"] }),
				usageLimits: billed,
				output: { response: [[0.5]] },
			},
		];
		for (const { call, usageLimits, output } of scenarios) {
			fetchMock.mockResolvedValueOnce(
				Response.json({
					insightID: "i",
					pixelReturn: [
						{
							pixelId: "0",
							isMeta: false,
							timeToRun: 1,
							operationType: [],
							output: { ...output, usageLimits },
						},
					],
				}),
			);
			const result = await call();
			expect(result.pixelReturn[0]?.output.usageLimits).toEqual(
				usageLimits,
			);
		}
		expect(ceilingOnly).not.toHaveProperty("billedTo");
		expect(ceilingOnly.ceilings[0]?.rules[0]).not.toHaveProperty("counts");
		expect(ceilingOnly.ceilings[0]?.rules[0]).not.toHaveProperty(
			"windowLength",
		);
		expectTypeOf<
			Awaited<
				ReturnType<typeof llm>
			>["pixelReturn"][number]["output"]["usageLimits"]
		>().toEqualTypeOf<ModelResponseUsageLimits | undefined>();
		expectTypeOf<
			Awaited<
				ReturnType<typeof embeddings>
			>["pixelReturn"][number]["output"]["usageLimits"]
		>().toEqualTypeOf<ModelResponseUsageLimits | undefined>();
		expectTypeOf<
			Awaited<
				ReturnType<typeof vision>
			>["pixelReturn"][number]["output"]["usageLimits"]
		>().toEqualTypeOf<ModelResponseUsageLimits | undefined>();
	});

	it("posts raw JDBC SQL without a query-string SQL copy and preserves frame-specific output", async () => {
		const sql =
			"SELECT \"café & +\" FROM frame WHERE value = 'a=b'\n-- trailing comment";
		const payload = {
			INSIGHT_INSTANCE: "i&1",
			columns: ["café & +"],
			dataArray: [["a=b"]],
		};
		fetchMock.mockResolvedValueOnce(Response.json(payload));
		await expect(
			jdbcJsonPost({ projectId: "p/a", insightId: "i&1", sql }),
		).resolves.toEqual(payload);
		const [target, options] = fetchMock.mock.calls[0] ?? [];
		expect(target).toBe(
			"https://example.test/Monolith/api/project-p%2Fa/jdbc_json?insightId=i%261",
		);
		expect(options?.method).toBe("POST");
		expect(options?.body).toBe(sql);
		expect(new Headers(options?.headers).get("content-type")).toBe(
			"text/plain;charset=UTF-8",
		);
		fetchMock.mockResolvedValueOnce(new Response('"No such insight"'));
		await expect(
			jdbcCsvPost({ projectId: "session", insightId: "missing", sql }),
		).resolves.toBe('"No such insight"');
		expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(sql);
	});

	it("keeps JDBC GET SQL in the encoded query", async () => {
		fetchMock.mockResolvedValueOnce(Response.json("No such insight"));
		await expect(
			jdbcJson({
				projectId: "session",
				insightId: "i",
				sql: "SELECT 'a&b+c'",
			}),
		).resolves.toBe("No such insight");
		const target = new URL(String(fetchMock.mock.calls[0]?.[0]));
		expect(Object.fromEntries(target.searchParams)).toEqual({
			insightId: "i",
			sql: "SELECT 'a&b+c'",
		});
		expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined();
	});

	it("builds image, MCP and WebSocket URLs from the current Env", () => {
		expect(
			projectImageDownloadUrl({ projectId: "p/a", theme: "dark" }),
		).toBe(
			"https://example.test/Monolith/api/project-p%2Fa/projectImage/download?theme=dark",
		);
		expect(
			insightImageDownloadUrl({
				projectId: "p",
				rdbmsId: "i&1",
				params: '{"a":"b+c"}',
			}),
		).toBe(
			"https://example.test/Monolith/api/project-p/insightImage/download?rdbmsId=i%261&params=%7B%22a%22%3A%22b%2Bc%22%7D",
		);
		expect(imageDownloadUrl({ engineId: "e/a" })).toBe(
			"https://example.test/Monolith/api/e-e%2Fa/image/download",
		);
		expect(commsUrl({ toolbox_id: "t/a", access_key: "a&b" })).toBe(
			"https://example.test/Monolith/api/ext/mcp/t%2Fa/comms?access_key=a%26b",
		);
		expect(browserSocketUrl({ sessionId: "s/a" })).toBe(
			"wss://example.test/Monolith/browserSocket/s%2Fa",
		);
		Env.update({ MODULE: "http://other.test/backend" });
		expect(browserSocketUrl({ sessionId: "s" })).toBe(
			"ws://other.test/backend/browserSocket/s",
		);
		expect(imageDownloadUrl({ engineId: "e" })).toBe(
			"http://other.test/backend/api/e-e/image/download",
		);
		Env.update({ MODULE: "/Monolith" });
		expect(browserSocketUrl({ sessionId: "s" })).toBe(
			"/Monolith/browserSocket/s",
		);
	});

	it("retains JSON resource bodies and multipart file names with query metadata", async () => {
		fetchMock.mockResolvedValueOnce(
			Response.json({ insightID: "i", pixelReturn: [] }),
		);
		await list({ storageId: "s/a", storagePath: "reports/a&b" });
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"https://example.test/Monolith/api/storage-s%2Fa/list",
		);
		expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
			storagePath: "reports/a&b",
		});
		const file = new File(["data"], "report.csv", { type: "text/csv" });
		fetchMock.mockResolvedValueOnce(
			Response.json([{ fileName: file.name, fileLocation: file.name }]),
		);
		await baseUpload({
			file,
			insightId: "i&1",
			path: "a/b",
			userSpace: false,
		});
		const [target, options] = fetchMock.mock.calls[1] ?? [];
		expect(
			Object.fromEntries(new URL(String(target)).searchParams),
		).toEqual({ insightId: "i&1", path: "a/b", userSpace: "false" });
		const body = options?.body;
		expect(body).toBeInstanceOf(FormData);
		if (!(body instanceof FormData))
			throw new Error("Expected multipart upload");
		const uploaded = body.get("file");
		expect(uploaded).toBeInstanceOf(File);
		if (!(uploaded instanceof File)) throw new Error("Expected file field");
		expect(uploaded.name).toBe("report.csv");
		expect(new Headers(options?.headers).has("content-type")).toBe(false);
	});

	it("selects MCP JSON versus SSE and preserves Ollama's default streaming", async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 202 }));
		await expect(
			comms({ toolbox_id: "t", method: "notifications/initialized" }),
		).resolves.toBeUndefined();
		expect(
			new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("accept"),
		).toBe("application/json");
		const sse = new Response('data: {"jsonrpc":"2.0"}\n\n');
		fetchMock.mockResolvedValueOnce(sse);
		await expect(
			commsSse({ toolbox_id: "t", method: "tools/list", id: 1 }),
		).resolves.toBe(sse.body);
		expect(
			new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("accept"),
		).toBe("text/event-stream");
		const stream = new Response('{"done":true}\n');
		fetchMock.mockResolvedValueOnce(stream);
		await expect(chat({ model: "m", messages: [] })).resolves.toBe(
			stream.body,
		);
		const completed = {
			model: "m",
			created_at: "2026-10-23T10:00:00Z",
			done: true,
			done_reason: "stop",
			message: { role: "assistant", content: "ok" },
		};
		fetchMock.mockResolvedValueOnce(Response.json(completed));
		await expect(
			chat({ model: "m", messages: [], stream: false }),
		).resolves.toEqual(completed);
	});

	it("exposes raw agent progress, delivery evidence, and omitted pending fields without normalization", async () => {
		const progress = {
			phase: "completed",
			activity: "idle",
			maxTurns: 3,
			turnsCompleted: 1,
			turnsRemaining: 2,
			modelCalls: 1,
			modelTimeMs: 50,
			toolTimeMs: 10,
			toolWallTimeMs: 10,
			elapsedMs: 70,
			toolCalls: 1,
			toolFailures: 0,
			repeatedFailures: [],
		} satisfies AgentRunProgress;
		const payload = {
			run: {
				runId: "run",
				status: "COMPLETED",
				pendingActions: [],
				artifacts: [],
				progress,
			},
			events: [
				{
					version: 1,
					eventId: "e",
					sequence: 1,
					runId: "run",
					timestamp: "2026-10-23T10:00:00Z",
					type: "item.completed",
					item: { ...progress, id: "progress", kind: "progress" },
				},
			],
			droppedEvents: 0,
		} satisfies Awaited<ReturnType<typeof agentRunStreaming>>;
		fetchMock.mockResolvedValueOnce(Response.json(payload));
		const result = await agentRunStreaming({ runId: "run" });
		expect(result).toEqual(payload);
		expectTypeOf(result.run.roomId).toEqualTypeOf<string | undefined>();
		expectTypeOf(result.run.progress).toEqualTypeOf<
			AgentRunProgress | undefined
		>();
	});
});
