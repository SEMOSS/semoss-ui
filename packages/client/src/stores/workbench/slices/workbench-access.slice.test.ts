import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserEnginePermission, getUserProjectPermission } from "@semoss/sdk";
import { createWorkbenchStore } from "../workbench.store";

vi.mock("@semoss/sdk", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk")>();
	return {
		...actual,
		getUserEnginePermission: vi.fn(),
		getUserProjectPermission: vi.fn(),
	};
});

const enginePermission = vi.mocked(getUserEnginePermission);
const projectPermission = vi.mocked(getUserProjectPermission);

describe("workbench access slice", () => {
	beforeEach(() => {
		enginePermission.mockReset();
		projectPermission.mockReset();
	});

	it("loads and caches an engine permission", async () => {
		enginePermission.mockResolvedValue("OWNER");
		const store = createWorkbenchStore("access-engine");

		await expect(
			store.getState().access.actions.load("ENGINE", "engine-1"),
		).resolves.toBe("OWNER");
		await store.getState().access.actions.load("ENGINE", "engine-1");

		expect(enginePermission).toHaveBeenCalledOnce();
		expect(store.getState().access.entries["ENGINE:engine-1"]).toEqual({
			status: "SUCCESS",
			permission: "OWNER",
		});
	});

	it("deduplicates concurrent permission requests", async () => {
		let resolvePermission: (permission: "EDIT") => void = () => undefined;
		enginePermission.mockReturnValue(
			new Promise((resolve) => {
				resolvePermission = resolve;
			}),
		);
		const store = createWorkbenchStore("access-dedup");

		const first = store
			.getState()
			.access.actions.load("ENGINE", "engine-1");
		const second = store
			.getState()
			.access.actions.load("ENGINE", "engine-1");
		resolvePermission("EDIT");

		await expect(Promise.all([first, second])).resolves.toEqual([
			"EDIT",
			"EDIT",
		]);
		expect(enginePermission).toHaveBeenCalledOnce();
	});

	it("keeps different resource permissions independent", async () => {
		enginePermission.mockResolvedValue("EDIT");
		projectPermission.mockResolvedValue("READ_ONLY");
		const store = createWorkbenchStore("access-independent");

		await Promise.all([
			store.getState().access.actions.load("ENGINE", "shared-id"),
			store.getState().access.actions.load("PROJECT", "shared-id"),
		]);

		expect(
			store.getState().access.entries["ENGINE:shared-id"]?.permission,
		).toBe("EDIT");
		expect(
			store.getState().access.entries["PROJECT:shared-id"]?.permission,
		).toBe("READ_ONLY");
	});

	it("refreshes and replaces a cached permission", async () => {
		projectPermission
			.mockResolvedValueOnce("OWNER")
			.mockResolvedValueOnce("READ_ONLY");
		const store = createWorkbenchStore("access-refresh");
		await store.getState().access.actions.load("PROJECT", "project-1");

		await expect(
			store.getState().access.actions.refresh("PROJECT", "project-1"),
		).resolves.toBe("READ_ONLY");
		expect(projectPermission).toHaveBeenCalledTimes(2);
		expect(store.getState().access.entries["PROJECT:project-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
	});

	it("retains the last permission when refresh fails", async () => {
		enginePermission
			.mockResolvedValueOnce("EDIT")
			.mockRejectedValueOnce(new Error("Permission unavailable"));
		const store = createWorkbenchStore("access-error");
		await store.getState().access.actions.load("ENGINE", "engine-1");

		await expect(
			store.getState().access.actions.refresh("ENGINE", "engine-1"),
		).rejects.toThrow("Permission unavailable");
		expect(store.getState().access.entries["ENGINE:engine-1"]).toEqual({
			status: "ERROR",
			permission: "EDIT",
			error: "Permission unavailable",
		});
	});

	it("resolves insight access without an API request", async () => {
		const store = createWorkbenchStore("access-insight");
		await expect(
			store.getState().access.actions.load("INSIGHT", "insight-1"),
		).resolves.toBe("EDIT");
		expect(enginePermission).not.toHaveBeenCalled();
		expect(projectPermission).not.toHaveBeenCalled();
	});
});
