import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { saveInboxRoutine } from "./inbox-routine-api";
import {
	type InboxRoutine,
	type InboxRoutineSettings,
	inboxRoutineSchema,
	inboxRoutineSettingsSchema,
} from "./inbox-routine-schema";

const settings: InboxRoutineSettings = {
	enabled: true,
	time: "08:00",
	days: ["MON", "TUE", "WED", "THU", "FRI"],
	timezone: "America/New_York",
	lookbackHours: 24,
};

const routine: InboxRoutine = {
	...settings,
	id: "inbox-daily-brief",
	configured: true,
	nextRunAt: "2026-10-13T12:00:00Z",
	schedulerAvailable: true,
	assistantAvailable: true,
	mailboxAvailable: true,
	availabilityMessage: null,
	lastRun: null,
};

function transport(output: unknown, operationType: string[] = []) {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [{ output, operationType }],
	});
	return { actions: { run } as unknown as InsightActions, run };
}

describe("inbox routine settings", () => {
	it("normalizes omitted Gson null fields in a first-time routine", () => {
		const parsed = inboxRoutineSchema.parse({
			...settings,
			id: "inbox-daily-brief",
			configured: false,
			enabled: false,
			schedulerAvailable: true,
			assistantAvailable: true,
			mailboxAvailable: true,
		});
		expect(parsed).toMatchObject({
			nextRunAt: null,
			lastRun: null,
			availabilityMessage: null,
		});
	});

	it("normalizes omitted result fields while a brief is running", () => {
		const parsed = inboxRoutineSchema.parse({
			...routine,
			lastRun: { status: "running", startedAt: "2026-10-12T12:00:00Z" },
		});
		expect(parsed.lastRun).toEqual({
			status: "running",
			startedAt: "2026-10-12T12:00:00Z",
			finishedAt: null,
			roomId: null,
			summary: null,
			error: null,
		});
	});

	it.each([
		{ time: "24:00" },
		{ time: "08:60" },
		{ time: "8:00" },
		{ days: [] },
		{ days: ["MON", "MON"] },
		{ days: ["Monday"] },
		{ timezone: "" },
		{ timezone: "Unknown/Zone" },
		{ lookbackHours: undefined },
		{ lookbackHours: null },
		{ lookbackHours: 0 },
		{ lookbackHours: 721 },
		{ lookbackHours: 1.5 },
		{ lookbackHours: "24" },
		{ enabled: "true" },
	])("rejects invalid schedule settings %j", (changes) => {
		expect(
			inboxRoutineSettingsSchema.safeParse({ ...settings, ...changes })
				.success,
		).toBe(false);
	});

	it.each([1, 720])(
		"accepts the lookback boundary %i hours",
		(lookbackHours) => {
			expect(
				inboxRoutineSettingsSchema.parse({
					...settings,
					lookbackHours,
					timezone: "UTC",
				}),
			).toEqual({ ...settings, lookbackHours, timezone: "UTC" });
		},
	);

	it("accepts a running brief without a result and a paused schedule without a next run", () => {
		expect(
			inboxRoutineSchema.parse({
				...routine,
				enabled: false,
				nextRunAt: null,
				lastRun: {
					status: "running",
					startedAt: "2026-10-12T12:00:00Z",
					finishedAt: null,
					roomId: null,
					summary: null,
					error: null,
				},
			}).lastRun?.status,
		).toBe("running");
	});
});

describe("saving an inbox routine", () => {
	it("encodes validated settings as one Pixel argument and returns the saved routine", async () => {
		const { actions, run } = transport(routine);
		expect(await saveInboxRoutine(actions, settings)).toEqual(routine);
		expect(run).toHaveBeenCalledExactlyOnceWith(
			`WorkSaveInboxRoutine(settings=[${JSON.stringify(settings)}]);`,
		);
	});

	it("does not send invalid settings to the scheduler", async () => {
		const { actions, run } = transport(routine);
		await expect(
			saveInboxRoutine(actions, { ...settings, lookbackHours: 0 }),
		).rejects.toThrow("Look back at least 1 hour");
		expect(run).not.toHaveBeenCalled();
	});

	it("surfaces a scheduler failure instead of reporting a saved routine", async () => {
		const { actions } = transport("Scheduler is unavailable", ["ERROR"]);
		await expect(saveInboxRoutine(actions, settings)).rejects.toThrow(
			"Scheduler is unavailable",
		);
	});

	it("rejects malformed server results", async () => {
		const { actions } = transport({ ...routine, enabled: "false" });
		await expect(saveInboxRoutine(actions, settings)).rejects.toThrow(
			"SEMOSS returned an unexpected shape",
		);
	});

	it("preserves transport errors so the owner can retry", async () => {
		const { actions, run } = transport(routine);
		run.mockRejectedValueOnce(new Error("Connection interrupted"));
		await expect(saveInboxRoutine(actions, settings)).rejects.toThrow(
			"Connection interrupted",
		);
	});
});
