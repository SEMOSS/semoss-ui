import { describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { createWorkItem, updateWorkItem } from "./work-items";

const actionsReturning = (output: unknown) =>
	({
		run: vi.fn(async () => ({
			pixelReturn: [{ output, operationType: ["OPERATION"] }],
		})),
	}) as unknown as InsightActions & { run: ReturnType<typeof vi.fn> };

describe("work items", () => {
	it("changes an item through WorkSaveWork with its taskId", async () => {
		const actions = actionsReturning({});
		await updateWorkItem(actions, "t1", {
			title: "Ship it",
			due: "",
			priority: "high",
			status: "done",
		});
		expect(actions.run).toHaveBeenCalledWith(
			'WorkSaveWork(taskId=["t1"], title=["Ship it"], due=[""], priority=["high"], status=["done"]);',
		);
	});

	it("makes an item without a taskId and returns its id", async () => {
		const actions = actionsReturning({ id: "new-1" });
		const id = await createWorkItem(actions, {
			title: "Plan offsite",
			topicId: "top1",
		});
		expect(id).toBe("new-1");
		expect(actions.run).toHaveBeenCalledWith(
			'WorkSaveWork(title=["Plan offsite"], topicIds=["top1"]);',
		);
		await createWorkItem(actions, { title: "Plain" });
		expect(actions.run).toHaveBeenLastCalledWith(
			'WorkSaveWork(title=["Plain"]);',
		);
	});

	it("throws when the server refuses", async () => {
		const actions = {
			run: vi.fn(async () => ({
				pixelReturn: [{ output: "no", operationType: ["ERROR"] }],
			})),
		} as unknown as InsightActions;
		await expect(updateWorkItem(actions, "t1", {})).rejects.toThrow("no");
	});
});
