import { describe, expect, it } from "vitest";
import type { RunStore } from "./workbench-assistant.runs";
import {
	applyStreamBatch,
	mergeDurableRun,
	startRun,
} from "./workbench-assistant.runs";

/** A store seeded with one freshly submitted run. */
const seedStore = (): RunStore =>
	startRun(
		{ runs: {}, roomRunIds: [], activeRunId: null },
		{
			runId: "run-1",
			roomId: "room-1",
			input: "build the page",
			status: "SUBMITTED",
		},
	);

describe("mergeDurableRun", () => {
	it("normalizes raw java.sql.Timestamp strings so Date.parse works everywhere", () => {
		const store = mergeDurableRun(seedStore(), {
			record: {
				runId: "run-1",
				status: "COMPLETED",
				// The backend serializes DATE_CREATED via Timestamp.toString()
				// — space-separated, no timezone. Safari's Date.parse returns
				// NaN for this shape, which used to sort the run to the top
				// of the timeline.
				dateCreated: "2026-08-19 12:34:56.789",
				startedAt: "2026-08-19 12:34:57",
				completedAt: "2026-08-19 12:36:00.001",
			},
			reconciled: true,
		});

		const run = store.runs["run-1"];
		expect(run.dateCreated).toBe("2026-08-19T12:34:56.789Z");
		expect(run.startedAt).toBe("2026-08-19T12:34:57Z");
		expect(run.completedAt).toBe("2026-08-19T12:36:00.001Z");
		expect(Number.isFinite(Date.parse(run.dateCreated))).toBe(true);
	});

	it("keeps already-normalized timestamps unchanged", () => {
		const store = mergeDurableRun(seedStore(), {
			record: {
				runId: "run-1",
				dateCreated: "2026-08-19T12:34:56.789Z",
			},
		});

		expect(store.runs["run-1"].dateCreated).toBe(
			"2026-08-19T12:34:56.789Z",
		);
	});
});

describe("applyStreamBatch", () => {
	it("keeps the client-set dateCreated when the snapshot omits it", () => {
		const seeded = seedStore();
		const before = seeded.runs["run-1"].dateCreated;

		const store = applyStreamBatch(seeded, {
			runId: "run-1",
			snapshot: {
				runId: "run-1",
				roomId: "room-1",
				status: "RUNNING",
				pendingActions: [],
			},
			events: [],
		});

		expect(store.runs["run-1"].dateCreated).toBe(before);
		expect(store.runs["run-1"].status).toBe("RUNNING");
	});
});
