import { beforeEach, expect, it, vi } from "vitest";
import { recoverFromFailedSave } from "./sync-recovery";

const toasts = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@semoss/ui/next", () => ({ toast: toasts }));

beforeEach(() => vi.clearAllMocks());

it("a refused save shows the error and reads the saved data again after queued saves", async () => {
	const order: string[] = [];
	await recoverFromFailedSave(
		"denied",
		async () => void order.push("settled"),
		async () => void order.push("reload"),
	);
	expect(order).toEqual(["settled", "reload"]);
	expect(toasts.error).toHaveBeenCalledOnce();
	expect(toasts.error.mock.calls[0]?.[0]).toContain("Could not save: denied");
});

it("a failed re-read leaves a Reload action", async () => {
	await recoverFromFailedSave(
		"denied",
		async () => {},
		async () => {
			throw new Error("offline");
		},
	);
	expect(toasts.error).toHaveBeenCalledTimes(2);
	expect(toasts.error.mock.calls[1]?.[1].action.label).toBe("Reload");
});
