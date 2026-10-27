import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../../env";
import { ApiError } from "../../lib/api-error";
import { buildPixel } from "../../lib/build-pixel";
import { ready } from "./health";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal("fetch", fetchMock);
	Env.update({ MODULE: "/Monolith", CSRF: false });
});
afterEach(() => vi.unstubAllGlobals());

describe("generated backend examples", () => {
	it("reads readiness through the shared transport and forwards request options", async () => {
		const body = { status: "READY", startupComplete: true };
		fetchMock.mockResolvedValueOnce(Response.json(body));
		const controller = new AbortController();
		await expect(
			ready(
				{},
				{ signal: controller.signal, headers: { "X-Test": "ready" } },
			),
		).resolves.toEqual(body);
		expect(fetchMock.mock.calls[0]?.[0]).toBe("/Monolith/health/ready");
		expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
		expect(
			new Headers(fetchMock.mock.calls[0]?.[1]?.headers).get("X-Test"),
		).toBe("ready");
	});

	it("keeps 503 as an ApiError containing the not-ready body", async () => {
		const body = { status: "NOT_READY", startupComplete: false };
		fetchMock.mockResolvedValueOnce(Response.json(body, { status: 503 }));
		const result = ready();
		await expect(result).rejects.toBeInstanceOf(ApiError);
		await expect(result).rejects.toMatchObject({
			status: 503,
			data: body,
			endpoint: "GET /health/ready",
		});
	});

	it("builds the generated reactor in both declared invocation forms", () => {
		expect(buildPixel("StopPixelExecution", { id: "job-1" })).toBe(
			'StopPixelExecution(id=["job-1"]);',
		);
		expect(buildPixel("StopPixelExecution", ["job-1"])).toBe(
			'StopPixelExecution("job-1");',
		);
	});
});
