import { beforeEach, describe, expect, it, vi } from "vitest";

const sdkMocks = vi.hoisted(() => ({
	runPixel: vi.fn(),
}));

vi.mock("@semoss/sdk", () => ({
	runPixel: sdkMocks.runPixel,
}));

vi.mock("@semoss/sdk/react", () => ({
	Env: { MODULE: "" },
	get: vi.fn(),
	post: vi.fn(),
}));

import { searchAppLogs } from "./projects";

describe("searchAppLogs", () => {
	beforeEach(() => {
		sdkMocks.runPixel.mockReset();
	});

	it("serializes parameters and validates the response", async () => {
		sdkMocks.runPixel.mockResolvedValue({
			errors: [],
			pixelReturn: [
				{
					output: {
						lines: ["[ERROR] failed"],
						hasMore: true,
					},
				},
			],
		});

		await expect(
			searchAppLogs({
				projectId: "project-1",
				query: 'quote " and slash \\',
				levels: ["ERROR", "WARN"],
				offset: 50,
				limit: 50,
				insightId: "insight-1",
			}),
		).resolves.toEqual({
			lines: ["[ERROR] failed"],
			hasMore: true,
		});

		expect(sdkMocks.runPixel).toHaveBeenCalledWith(
			'SearchAppLogs(paramValues=[{"projectId":"project-1","offset":"50","limit":"50","query":"quote \\" and slash \\\\","levels":"ERROR,WARN"}]);',
			"insight-1",
		);
	});

	it("rejects backend errors and malformed payloads", async () => {
		sdkMocks.runPixel
			.mockResolvedValueOnce({
				errors: ["Only project owners can search app logs"],
				pixelReturn: [],
			})
			.mockResolvedValueOnce({
				errors: [],
				pixelReturn: [{ output: { lines: "invalid", hasMore: false } }],
			});

		await expect(
			searchAppLogs({
				projectId: "project-1",
				offset: 0,
				limit: 50,
			}),
		).rejects.toThrow("Only project owners can search app logs");
		await expect(
			searchAppLogs({
				projectId: "project-1",
				offset: 0,
				limit: 50,
			}),
		).rejects.toThrow("Invalid app log search response");
	});
});
