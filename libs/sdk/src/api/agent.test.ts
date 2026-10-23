import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { HttpError } from "../lib/error";
import { runPixel } from "../lib/pixel";
import { clearSession } from "../utility/session";
import { getAgentRun, pollAgentRun, runAgent, stopAgentRun } from "./agent";
import type { agentRunStreaming } from "./monolith/engine";

vi.mock("../lib/pixel", () => ({
	runPixel: vi.fn(),
}));

const mockRunPixel = vi.mocked(runPixel);
const fetchMock = vi.fn<typeof fetch>();

/** A complete Pixel envelope with an intentionally unconstrained output. */
const pixelResult = (
	output: unknown,
): Awaited<ReturnType<typeof runPixel>> => ({
	errors: [],
	insightId: "insight-1",
	pixelReturn: [
		{
			output,
			isMeta: false,
			operationType: [],
			pixelExpression: "",
			pixelId: "0",
			timeToRun: 0,
		},
	],
});

beforeEach(() => {
	Env.update({
		MODULE: "https://example.test/Monolith",
		CSRF: false,
		HEADLESS: false,
	});
	clearSession();
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	mockRunPixel.mockReset();
});

afterEach(() => vi.unstubAllGlobals());

/** The pixel the last runAgent call ran. */
const lastPixel = (): string => String(mockRunPixel.mock.calls.at(-1)?.[0]);

describe("runAgent", () => {
	beforeEach(() => {
		mockRunPixel.mockResolvedValue(
			pixelResult({
				runId: "run-1",
				roomId: "room-1",
				status: "SUBMITTED",
			}),
		);
	});

	it("sends what it always did when no space is given", async () => {
		await runAgent(
			{
				roomId: "room-1",
				command: "hi",
				harnessType: "semoss",
				paramValues: { tools: [] },
			},
			"insight-1",
		);
		expect(lastPixel()).toBe(
			'RunAgent(roomId=["room-1"],\ncommand=["hi"],\nharnessType="semoss",\nparamValues=[{"tools":[]}],\nwait=false);',
		);
		expect(mockRunPixel).toHaveBeenCalledWith(lastPixel(), "insight-1");
	});

	it("sends the space as its own argument and the subdir with the params", async () => {
		await runAgent({
			roomId: "room-1",
			command: "hi",
			space: "USER",
			subdir: "reports/2026",
			paramValues: { subdir: "old", effort: "high" },
		});
		expect(lastPixel()).toContain('space=["USER"]');
		expect(lastPixel()).toContain(
			'paramValues=[{"subdir":"reports/2026","effort":"high"}]',
		);
	});

	it("sends a subdir even without other params", async () => {
		await runAgent({ roomId: "room-1", command: "hi", subdir: "notes" });
		expect(lastPixel()).toContain('paramValues=[{"subdir":"notes"}]');
		expect(lastPixel()).not.toContain("space=");
	});
});

describe("agent snapshot compatibility", () => {
	it("normalizes omitted approval fields while preserving sparse tool items and the poll envelope", async () => {
		const payload = {
			run: {
				runId: "run&1",
				status: "INPUT_REQUIRED",
				artifacts: [],
				pendingActions: [
					{
						actionId: "a",
						runId: "run&1",
						status: "PENDING",
						hasUi: false,
					},
				],
			},
			events: [
				{
					version: 1,
					eventId: "event",
					sequence: 2,
					runId: "run&1",
					timestamp: "2026-10-23T10:00:00Z",
					type: "item.completed",
					item: {
						id: "tool",
						kind: "tool",
						status: "COMPLETED",
						output: "done",
					},
				},
			],
			droppedEvents: 3,
		} satisfies Awaited<ReturnType<typeof agentRunStreaming>>;
		fetchMock.mockResolvedValueOnce(Response.json(payload));
		const result = await pollAgentRun("run&1");
		expect(result.events).toEqual(payload.events);
		expect(result.droppedEvents).toBe(3);
		expect(result.run).not.toHaveProperty("roomId");
		expect(result.run.pendingActions).toEqual([
			{
				...payload.run.pendingActions[0],
				parentMessageId: null,
				toolCallId: null,
				toolName: null,
				toolArgs: null,
				editedArgs: null,
				toolMeta: null,
				uiUrl: null,
			},
		]);
		expect(fetchMock.mock.calls[0]?.[0]).toBe(
			"https://example.test/Monolith/api/engine/agentRunStreaming",
		);
		expect(
			new URLSearchParams(String(fetchMock.mock.calls[0]?.[1]?.body)).get(
				"runId",
			),
		).toBe("run&1");
	});

	it("preserves populated approval fields and typed delivery evidence", async () => {
		const payload = {
			run: {
				runId: "run",
				roomId: "room",
				status: "FAILED",
				errorMessage: "review incomplete",
				artifacts: [
					{
						status: "available",
						filePath: "slides.pptx",
						sourceHash: "sha",
						slideCount: 2,
						disposition: "proposal",
						structuralValidation: "passed",
					},
				],
				reviewOutcome: {
					status: "incomplete",
					verdict: "inconclusive",
					unreviewedSlides: [2],
				},
				warnings: ["Review incomplete"],
				pendingActions: [
					{
						actionId: "a",
						runId: "run",
						status: "PENDING",
						hasUi: true,
						parentMessageId: "m",
						toolCallId: "t",
						toolName: "edit",
						toolArgs: { text: "" },
						editedArgs: {},
						toolMeta: { ui: true },
						uiUrl: "https://example.test/tool",
					},
				],
			},
			events: [],
			droppedEvents: 0,
		} satisfies Awaited<ReturnType<typeof agentRunStreaming>>;
		fetchMock.mockResolvedValueOnce(Response.json(payload));
		await expect(pollAgentRun("run")).resolves.toEqual(payload);
	});

	it("keeps legacy HTTP errors and rejects a missing run before sending", async () => {
		await expect(pollAgentRun("")).rejects.toThrow("Missing runId");
		expect(fetchMock).not.toHaveBeenCalled();
		fetchMock.mockResolvedValueOnce(
			Response.json({ errorMessage: "missing" }, { status: 404 }),
		);
		await expect(pollAgentRun("unknown")).rejects.toBeInstanceOf(HttpError);
	});

	it("normalizes durable snapshot reads and stops without dropping messages", async () => {
		mockRunPixel.mockResolvedValueOnce(
			pixelResult({
				runId: "run",
				status: "RUNNING",
				messages: [{ id: "message" }],
			}),
		);
		await expect(
			getAgentRun("run", { includeMessages: true }),
		).resolves.toEqual({
			runId: "run",
			status: "RUNNING",
			messages: [{ id: "message" }],
			pendingActions: [],
		});
		mockRunPixel.mockResolvedValueOnce(
			pixelResult({
				runId: "run",
				status: "CANCELLED",
				pendingActions: [
					{
						actionId: "a",
						runId: "run",
						status: "PENDING",
						hasUi: false,
					},
				],
			}),
		);
		const stopped = await stopAgentRun("run");
		expect(stopped.pendingActions[0]?.toolArgs).toBeNull();
		expect(stopped.pendingActions[0]?.toolName).toBeNull();
		expect(stopped.status).toBe("CANCELLED");
	});
});
