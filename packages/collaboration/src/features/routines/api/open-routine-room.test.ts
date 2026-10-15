import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { openRoutineRoom } from "./open-routine-room";

const startedAt = "2026-10-15T12:00:00.123Z";

/** Answer the Pixel boundary without bypassing its response validation. */
function transport(output: unknown, operationType: string[] = []) {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [{ output, operationType }],
	});
	return { actions: { run } as unknown as InsightActions, run };
}

describe("openRoutineRoom", () => {
	it.each(["inbox-daily-brief", "weekly-meeting-agendas"] as const)(
		"opens the displayed %s run through one Pixel call",
		async (routineId) => {
			const { actions, run } = transport({ roomId: "routine-chat" });
			await expect(
				openRoutineRoom(actions, routineId, startedAt),
			).resolves.toBe("routine-chat");
			expect(run).toHaveBeenCalledExactlyOnceWith(
				`WorkOpenRoutineRoom(routineId=[${JSON.stringify(routineId)}], startedAt=[${JSON.stringify(startedAt)}]);`,
			);
		},
	);

	it("serializes the displayed run identity without interpolating executable text", async () => {
		const { actions, run } = transport({ roomId: "routine-chat" });
		const suppliedStartedAt = `${startedAt}"]; WorkOpenRoutineRoom(); //\n`;
		await openRoutineRoom(actions, "inbox-daily-brief", suppliedStartedAt);
		expect(run).toHaveBeenCalledExactlyOnceWith(
			`WorkOpenRoutineRoom(routineId=["inbox-daily-brief"], startedAt=[${JSON.stringify(suppliedStartedAt)}]);`,
		);
	});

	it.each([null, {}, { roomId: "" }, { roomId: " \n " }, { roomId: 12 }])(
		"rejects a response without a usable room ID: %j",
		async (output) => {
			const { actions } = transport(output);
			await expect(
				openRoutineRoom(actions, "inbox-daily-brief", startedAt),
			).rejects.toThrow("SEMOSS returned an unexpected shape");
		},
	);

	it("surfaces a reactor failure without treating it as a room", async () => {
		const { actions } = transport(
			"The displayed run is no longer available.",
			["ERROR"],
		);
		await expect(
			openRoutineRoom(actions, "inbox-daily-brief", startedAt),
		).rejects.toThrow("The displayed run is no longer available.");
	});

	it("rejects an empty Pixel response", async () => {
		const { actions, run } = transport(null);
		run.mockResolvedValueOnce({ pixelReturn: [] });
		await expect(
			openRoutineRoom(actions, "inbox-daily-brief", startedAt),
		).rejects.toThrow("SEMOSS returned an empty result.");
	});

	it("preserves transport failures for retry", async () => {
		const { actions, run } = transport(null);
		run.mockRejectedValueOnce(new Error("Connection interrupted"));
		await expect(
			openRoutineRoom(actions, "weekly-meeting-agendas", startedAt),
		).rejects.toThrow("Connection interrupted");
	});
});
