import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserEnginePermission, getUserProjectPermission } from "@semoss/sdk";
import { createConfigStore } from "../config";
import { createSessionStore } from "./session.store";

// logout() would otherwise hit the network; the cache clear is what matters.
vi.mock("@semoss/sdk/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk/react")>();
	return { ...actual, logout: vi.fn().mockResolvedValue(undefined) };
});

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

const makeStore = () => createSessionStore(createConfigStore());

describe("session permission cache", () => {
	beforeEach(() => {
		enginePermission.mockReset();
		projectPermission.mockReset();
	});

	it("loads and caches an engine permission", async () => {
		enginePermission.mockResolvedValue("OWNER");
		const store = makeStore();

		await expect(
			store.getState().loadPermission("ENGINE", "engine-1"),
		).resolves.toBe("OWNER");
		await store.getState().loadPermission("ENGINE", "engine-1");

		expect(enginePermission).toHaveBeenCalledOnce();
		expect(store.getState().permissions["ENGINE:engine-1"]).toEqual({
			status: "SUCCESS",
			permission: "OWNER",
		});
	});

	it("stores an already-resolved permission without an API request", () => {
		const store = makeStore();

		store.getState().syncPermission("PROJECT", "project-1", "READ_ONLY");

		expect(projectPermission).not.toHaveBeenCalled();
		expect(store.getState().permissions["PROJECT:project-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
	});

	it("deduplicates concurrent permission requests", async () => {
		let resolvePermission: (permission: "EDIT") => void = () => undefined;
		enginePermission.mockReturnValue(
			new Promise((resolve) => {
				resolvePermission = resolve;
			}),
		);
		const store = makeStore();

		const first = store.getState().loadPermission("ENGINE", "engine-1");
		const second = store.getState().loadPermission("ENGINE", "engine-1");
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
		const store = makeStore();

		await Promise.all([
			store.getState().loadPermission("ENGINE", "shared-id"),
			store.getState().loadPermission("PROJECT", "shared-id"),
		]);

		expect(
			store.getState().permissions["ENGINE:shared-id"]?.permission,
		).toBe("EDIT");
		expect(
			store.getState().permissions["PROJECT:shared-id"]?.permission,
		).toBe("READ_ONLY");
	});

	it("refreshes and replaces a cached permission", async () => {
		projectPermission
			.mockResolvedValueOnce("OWNER")
			.mockResolvedValueOnce("READ_ONLY");
		const store = makeStore();
		await store.getState().loadPermission("PROJECT", "project-1");

		await expect(
			store.getState().refreshPermission("PROJECT", "project-1"),
		).resolves.toBe("READ_ONLY");
		expect(projectPermission).toHaveBeenCalledTimes(2);
		expect(store.getState().permissions["PROJECT:project-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
	});

	it("retains the last permission when refresh fails", async () => {
		enginePermission
			.mockResolvedValueOnce("EDIT")
			.mockRejectedValueOnce(new Error("Permission unavailable"));
		const store = makeStore();
		await store.getState().loadPermission("ENGINE", "engine-1");

		await expect(
			store.getState().refreshPermission("ENGINE", "engine-1"),
		).rejects.toThrow("Permission unavailable");
		expect(store.getState().permissions["ENGINE:engine-1"]).toEqual({
			status: "ERROR",
			permission: "EDIT",
			error: "Permission unavailable",
		});
	});

	it("resolves insight access without an API request", async () => {
		const store = makeStore();
		await expect(
			store.getState().loadPermission("INSIGHT", "insight-1"),
		).resolves.toBe("EDIT");
		expect(enginePermission).not.toHaveBeenCalled();
		expect(projectPermission).not.toHaveBeenCalled();
	});

	it("lets an in-flight fetch win over a stale synced permission", async () => {
		// One cache is shared by every workbench, so a second workbench
		// mounting with an old route-supplied value must not clobber a fetch
		// that is already in the air.
		let resolvePermission: (permission: "READ_ONLY") => void = () =>
			undefined;
		enginePermission.mockReturnValue(
			new Promise((resolve) => {
				resolvePermission = resolve;
			}),
		);
		const store = makeStore();

		const pending = store.getState().loadPermission("ENGINE", "engine-1");
		store.getState().syncPermission("ENGINE", "engine-1", "OWNER");
		resolvePermission("READ_ONLY");
		await pending;

		expect(store.getState().permissions["ENGINE:engine-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
	});

	it("drops every permission on logout", async () => {
		// The session store outlives every workbench, so a permission left
		// behind here would show up for whoever logs in next.
		enginePermission.mockResolvedValue("OWNER");
		const store = makeStore();
		await store.getState().loadPermission("ENGINE", "engine-1");

		await store.getState().logout();

		expect(store.getState().permissions).toEqual({});
	});
});
