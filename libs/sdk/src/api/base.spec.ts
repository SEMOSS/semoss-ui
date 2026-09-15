import { beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { getPixelAsyncResult, runPixel, runPixelAsync } from "./base";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
	mockFetch.mockReset();
	Env.update({ MODULE: "http://localhost:9090/Monolith" });
});

describe("runPixel", () => {
	it("throws when pixel is empty", async () => {
		await expect(runPixel("")).rejects.toThrow("Missing Pixel");
	});

	it("sends pixel expression and returns parsed response", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					insightID: "abc-123",
					pixelReturn: [
						{
							isMeta: false,
							operationType: ["FRAME"],
							output: { data: "test" },
							pixelExpression: "Frame()",
							pixelId: "p1",
							timeToRun: 100,
						},
					],
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const result = await runPixel("Frame()");

		expect(result.errors).toEqual([]);
		expect(result.insightId).toBe("abc-123");
		expect(result.pixelReturn).toHaveLength(1);
		expect(result.pixelReturn[0].output).toEqual({ data: "test" });
	});

	it("collects errors from pixelReturn", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					insightID: "abc-123",
					pixelReturn: [
						{
							isMeta: false,
							operationType: ["ERROR"],
							output: "Something went wrong",
							pixelExpression: "BadPixel()",
							pixelId: "p1",
							timeToRun: 50,
						},
					],
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const result = await runPixel("BadPixel()");

		expect(result.errors).toEqual(["Something went wrong"]);
	});

	it("includes insightId in request body when provided", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					insightID: "insight-1",
					pixelReturn: [],
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		await runPixel("Frame()", "insight-1");

		const [, options] = mockFetch.mock.calls[0];
		const body = new URLSearchParams(options.body);
		expect(body.get("insightId")).toBe("insight-1");
	});
});

describe("runPixelAsync", () => {
	it("throws when pixel is empty", async () => {
		await expect(runPixelAsync("")).rejects.toThrow("No Pixel To Execute");
	});

	it("returns jobId from response", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(JSON.stringify({ jobId: "job-456" }), {
				status: 200,
				headers: { "content-type": "application/json" },
			}),
		);

		const result = await runPixelAsync("LLM()");

		expect(result.jobId).toBe("job-456");
	});
});

describe("getPixelAsyncResult", () => {
	it("throws when jobId is empty", async () => {
		await expect(getPixelAsyncResult("")).rejects.toThrow(
			"No job id provided to get pixel response",
		);
	});

	it("returns results and collects errors", async () => {
		mockFetch.mockResolvedValueOnce(
			new Response(
				JSON.stringify({
					insightID: "insight-2",
					pixelReturn: [
						{
							isMeta: false,
							operationType: ["SUCCESS"],
							output: "done",
							pixelExpression: "Query()",
							pixelId: "p2",
							timeToRun: 200,
						},
					],
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				},
			),
		);

		const result = await getPixelAsyncResult("job-789");

		expect(result.errors).toEqual([]);
		expect(result.insightId).toBe("insight-2");
		expect(result.results).toHaveLength(1);
	});
});
