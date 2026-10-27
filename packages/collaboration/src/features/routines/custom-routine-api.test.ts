import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { openRoutineDocuments } from "./custom-routine-api";

function transport(output: unknown) {
	const run = vi.fn().mockResolvedValue({
		pixelReturn: [{ output, operationType: ["OPERATION"] }],
	});
	return { actions: { run } as unknown as InsightActions, run };
}

describe("routine documents api", () => {
	it("opens the routine's folder and returns its path and documents", async () => {
		const opened = {
			path: "/collaboration/routines/r1",
			documents: [
				{ name: "plan.md", size: 4, updatedAt: "2026-10-23T12:00:00Z" },
			],
		};
		const { actions, run } = transport(opened);
		expect(await openRoutineDocuments(actions, "r1")).toEqual(opened);
		expect(run).toHaveBeenCalledWith(
			'WorkRoutineDocuments(routineId=["r1"]);',
		);
	});

	it("rejects a folder of the wrong shape", async () => {
		const { actions } = transport({ documents: [] });
		await expect(openRoutineDocuments(actions, "r1")).rejects.toThrow(
			/unexpected shape/,
		);
	});
});
