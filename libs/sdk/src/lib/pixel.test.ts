import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Env } from "../env";
import { runPixel as publicRunPixel } from "../index";
import { buildPixel } from "./build-pixel";
import { runPixel } from "./pixel";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
	vi.stubGlobal("fetch", fetchMock);
	fetchMock.mockReset();
	Env.update({ MODULE: "/Monolith", CSRF: false });
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe("runPixel helper compatibility", () => {
	it("runs a built primitive string through the unchanged transport and result envelope", async () => {
		const returned = [
			{
				operationType: ["PROJECT_LIST"],
				output: [{ project_id: "project-1" }],
			},
			{
				operationType: ["ERROR"],
				output: { message: "delayed failure" },
			},
		];
		fetchMock.mockResolvedValueOnce(
			Response.json({ insightID: "insight-1", pixelReturn: returned }),
		);
		const result = await runPixel(
			buildPixel("GetProjectList"),
			"insight-1",
		);
		const call = fetchMock.mock.calls[0];
		expect(call?.[0]).toBe("/Monolith/api/engine/runPixel");
		expect(typeof call?.[1]?.body).toBe("string");
		const fields = new URLSearchParams(String(call?.[1]?.body));
		expect(fields.get("expression")).toBe("GetProjectList();");
		expect(fields.get("insightId")).toBe("insight-1");
		expect(fields.get("tz")).toBe(
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		);
		expect(result).toEqual({
			insightId: "insight-1",
			errors: ['{"message":"delayed failure"}'],
			pixelReturn: returned,
		});
	});

	it("keeps the root export and serializes structured Pixel errors", async () => {
		expect(publicRunPixel).toBe(runPixel);
		fetchMock.mockResolvedValueOnce(
			Response.json({
				insightID: "insight-1",
				pixelReturn: [
					{ operationType: ["ERROR"], output: { message: "failed" } },
				],
			}),
		);
		const result = await runPixel<[{ message: string }]>("BadPixel();");
		expect(result.errors).toEqual(['{"message":"failed"}']);
		expect(result.insightId).toBe("insight-1");
		expect(result.pixelReturn[0].output).toEqual({ message: "failed" });
	});

	it("omits empty insight ids and tolerates an unavailable timezone", async () => {
		vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
			throw new Error("Timezone unavailable");
		});
		fetchMock.mockResolvedValueOnce(
			Response.json({ insightID: "new", pixelReturn: [] }),
		);
		await runPixel("1+1;", "");
		const body = fetchMock.mock.calls[0]?.[1]?.body;
		expect(typeof body).toBe("string");
		const fields = new URLSearchParams(
			typeof body === "string" ? body : "",
		);
		expect(fields.get("expression")).toBe("1+1;");
		expect(fields.has("insightId")).toBe(false);
		expect(fields.has("tz")).toBe(false);
	});
});
