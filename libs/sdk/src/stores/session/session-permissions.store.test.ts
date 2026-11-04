import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	getUserEnginePermission,
	getUserProjectPermission,
} from "../../api/permissions";
import type { Role } from "../../types";
import {
	isEditRole,
	isOwnerRole,
	SessionPermissionStore,
} from "./session-permissions.store";

vi.mock("../../api/permissions", () => ({
	getUserEnginePermission: vi.fn(),
	getUserProjectPermission: vi.fn(),
}));

const mockProject = vi.mocked(getUserProjectPermission);
const mockEngine = vi.mocked(getUserEnginePermission);

/** A promise and the function that settles it. */
const deferred = () => {
	let resolve: (role: Role) => void = () => {};
	const promise = new Promise<Role>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};

describe("SessionPermissionStore", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockProject.mockResolvedValue("EDIT");
		mockEngine.mockResolvedValue("READ_ONLY");
	});

	it("shares one read per resource and reuses it", async () => {
		const store = new SessionPermissionStore();

		const [first, second] = await Promise.all([
			store.load("PROJECT", "p1"),
			store.load("PROJECT", "p1"),
		]);
		await store.load("PROJECT", "p1");

		expect(first).toBe("EDIT");
		expect(second).toBe("EDIT");
		expect(mockProject).toHaveBeenCalledTimes(1);
		expect(store.get("PROJECT", "p1")).toEqual({
			status: "SUCCESS",
			permission: "EDIT",
		});
	});

	it("reads each kind of resource its own way", async () => {
		const store = new SessionPermissionStore();

		expect(await store.load("ENGINE", "e1")).toBe("READ_ONLY");
		expect(await store.load("INSIGHT", "i1")).toBe("EDIT");
		expect(mockEngine).toHaveBeenCalledWith("e1");
		expect(mockProject).not.toHaveBeenCalled();
	});

	it("keeps the last permission when a refresh fails", async () => {
		const store = new SessionPermissionStore();
		await store.load("PROJECT", "p1");

		mockProject.mockRejectedValueOnce(new Error("no access"));
		await expect(store.refresh("PROJECT", "p1")).rejects.toThrow(
			"no access",
		);

		expect(store.get("PROJECT", "p1")).toEqual({
			status: "ERROR",
			permission: "EDIT",
			error: "no access",
		});
	});

	it("does not let a synced permission overwrite a read in flight", async () => {
		const read = deferred();
		mockProject.mockReturnValueOnce(read.promise);
		const store = new SessionPermissionStore();

		const pending = store.load("PROJECT", "p1");
		store.sync("PROJECT", "p1", "OWNER");
		read.resolve("READ_ONLY");
		await pending;

		expect(store.get("PROJECT", "p1")?.permission).toBe("READ_ONLY");

		store.sync("PROJECT", "p1", "OWNER");
		expect(store.get("PROJECT", "p1")?.permission).toBe("OWNER");
	});

	it("drops a read that lands after a clear", async () => {
		const read = deferred();
		mockProject.mockReturnValueOnce(read.promise);
		const store = new SessionPermissionStore();

		const pending = store.load("PROJECT", "p1");
		store.clear();
		read.resolve("OWNER");
		await pending;

		expect(store.get("PROJECT", "p1")).toBeNull();
	});

	it("tells editors and owners apart", () => {
		expect(isEditRole("OWNER")).toBe(true);
		expect(isEditRole("EDIT")).toBe(true);
		expect(isEditRole("READ_ONLY")).toBe(false);
		expect(isEditRole(null)).toBe(false);
		expect(isOwnerRole("OWNER")).toBe(true);
		expect(isOwnerRole("EDIT")).toBe(false);
	});
});
