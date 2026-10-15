import type { InsightActions } from "@/lib/pixel";
import { waitForGeneratedRoomName } from "./wait-for-generated-room-name";

function pixelResponse(roomName: string | null) {
	return {
		pixelReturn: [
			{
				output: {
					OPTIONS: {},
					ROOM_NAME: roomName,
				},
				operationType: [],
			},
		],
	};
}

describe("waitForGeneratedRoomName", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("waits for the background agent namer to persist a title", async () => {
		const run = vi
			.fn()
			.mockResolvedValueOnce(pixelResponse(null))
			.mockResolvedValueOnce(pixelResponse("Quarterly planning"));
		const pending = waitForGeneratedRoomName(
			{ run } as unknown as InsightActions,
			"room-1",
			{ initialDelayMs: 10, maxDelayMs: 10 },
		);

		await vi.advanceTimersByTimeAsync(10);

		await expect(pending).resolves.toBe("Quarterly planning");
		expect(run).toHaveBeenCalledTimes(2);
		expect(run).toHaveBeenCalledWith('GetRoomOptions(roomId=["room-1"]);');
	});

	it("stops after the configured number of empty reads", async () => {
		const run = vi.fn().mockResolvedValue(pixelResponse(null));

		await expect(
			waitForGeneratedRoomName(
				{ run } as unknown as InsightActions,
				"room-1",
				{ maxAttempts: 3, initialDelayMs: 0 },
			),
		).resolves.toBeNull();
		expect(run).toHaveBeenCalledTimes(3);
	});
});
