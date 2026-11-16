import { beforeEach, describe, expect, it, vi } from "vitest";
import { runPixel } from "@semoss/sdk/react";
import { getMyAccessRequest, withdrawMyAccessRequest } from "./user-access";

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	runPixel: vi.fn(),
}));

/** What the backend answers a pixel with: its output, or its errors */
const answer = (
	output: unknown,
	errors: string[] = [],
): Awaited<ReturnType<typeof runPixel>> => ({
	errors,
	insightId: "insight-1",
	pixelReturn: [
		{
			isMeta: false,
			operationType: errors.length > 0 ? ["ERROR"] : ["OPERATION"],
			output,
			pixelExpression: "",
			pixelId: "1",
			timeToRun: 0,
		},
	],
});

describe("my access requests", () => {
	beforeEach(() => {
		vi.mocked(runPixel).mockReset();
	});

	it("reads the user's waiting request on a project with the id quoted", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			answer({
				id: "r1",
				permission: "EDIT",
				comment: "to edit it",
				requestedAt: "2026-11-15T10:00:00Z",
			}),
		);

		const request = await getMyAccessRequest("insight-1", "PROJECT", 'p"1');

		expect(runPixel).toHaveBeenCalledExactlyOnceWith(
			'GetMyProjectAccessRequest(project=["p\\"1"]);',
			"insight-1",
		);
		expect(request).toEqual({
			id: "r1",
			permission: "EDIT",
			comment: "to edit it",
			requestedAt: "2026-11-15T10:00:00Z",
		});
	});

	it("reads no request when none waits, and none it cannot read", async () => {
		vi.mocked(runPixel).mockResolvedValueOnce(answer(null));
		expect(
			await getMyAccessRequest("insight-1", "ENGINE", "e1"),
		).toBeNull();

		vi.mocked(runPixel).mockResolvedValueOnce(
			answer({ id: "r1", permission: "DISCOVERABLE" }),
		);
		expect(
			await getMyAccessRequest("insight-1", "ENGINE", "e1"),
		).toBeNull();
	});

	it("keeps a request with no reason or time as null ones", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			answer({ id: "r1", permission: "READ_ONLY" }),
		);

		expect(await getMyAccessRequest("insight-1", "ENGINE", "e1")).toEqual({
			id: "r1",
			permission: "READ_ONLY",
			comment: null,
			requestedAt: null,
		});
	});

	it("fails a read with the backend's reason", async () => {
		vi.mocked(runPixel).mockResolvedValue(
			answer("Please define the engine id.", [
				"Please define the engine id.",
			]),
		);

		await expect(
			getMyAccessRequest("insight-1", "ENGINE", ""),
		).rejects.toThrow("Please define the engine id.");
	});

	it("withdraws the user's request on an engine with the id quoted", async () => {
		vi.mocked(runPixel).mockResolvedValue(answer(true));

		await withdrawMyAccessRequest("insight-1", "ENGINE", "e1");

		expect(runPixel).toHaveBeenCalledExactlyOnceWith(
			'WithdrawMyEngineAccessRequest(engine=["e1"]);',
			"insight-1",
		);
	});

	it("fails a withdraw with the backend's reason", async () => {
		const reason = "You have no access request waiting on this project";
		vi.mocked(runPixel).mockResolvedValue(answer(reason, [reason]));

		await expect(
			withdrawMyAccessRequest("insight-1", "PROJECT", "p1"),
		).rejects.toThrow(reason);
	});
});
