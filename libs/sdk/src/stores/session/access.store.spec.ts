import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserEnginePermission, getUserProjectPermission } from "../../api";
import type { Role } from "../../types";
import { createAccessStore } from "./access.store";

vi.mock("../../api", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../../api")>();
	return {
		...actual,
		getUserEnginePermission: vi.fn(),
		getUserProjectPermission: vi.fn(),
	};
});

const enginePermission = vi.mocked(getUserEnginePermission);
const projectPermission = vi.mocked(getUserProjectPermission);

const deferred = <Value>() => {
	let resolve!: (value: Value) => void;
	let reject!: (error: unknown) => void;
	const promise = new Promise<Value>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
};

describe("createAccessStore", () => {
	beforeEach(() => {
		enginePermission.mockReset();
		projectPermission.mockReset();
	});

	it("deduplicates simultaneous requests for one resource", async () => {
		const response = deferred<Role>();
		enginePermission.mockReturnValue(response.promise);
		const store = createAccessStore();

		const first = store
			.getState()
			.access.actions.loadPermission("ENGINE", "1");
		const second = store
			.getState()
			.access.actions.loadPermission("ENGINE", "1");

		expect(first).toBe(second);
		expect(enginePermission).toHaveBeenCalledTimes(1);
		expect(store.getState().access.entries.ENGINE["1"]).toEqual({
			status: "loading",
			permission: undefined,
		});

		response.resolve("OWNER");
		await expect(first).resolves.toBe("OWNER");
		expect(store.getState().access.entries.ENGINE["1"]).toEqual({
			status: "ready",
			permission: "OWNER",
		});
	});

	it("retains a stale value when refresh fails", async () => {
		enginePermission.mockResolvedValueOnce("EDIT");
		const store = createAccessStore();
		await store.getState().access.actions.loadPermission("ENGINE", "1");

		const error = new Error("offline");
		enginePermission.mockRejectedValueOnce(error);
		await expect(
			store.getState().access.actions.refreshPermission("ENGINE", "1"),
		).rejects.toBe(error);

		expect(store.getState().access.entries.ENGINE["1"]).toEqual({
			status: "error",
			permission: "EDIT",
			error,
		});
	});

	it("does not let priming replace an active request", async () => {
		const response = deferred<Role>();
		projectPermission.mockReturnValue(response.promise);
		const store = createAccessStore();
		const request = store
			.getState()
			.access.actions.loadPermission("PROJECT", "project-1");

		store
			.getState()
			.access.actions.primePermission("PROJECT", "project-1", "OWNER");
		expect(
			store.getState().access.entries.PROJECT["project-1"]?.status,
		).toBe("loading");

		response.resolve("READ_ONLY");
		await request;
		expect(
			store.getState().access.entries.PROJECT["project-1"]?.permission,
		).toBe("READ_ONLY");
	});

	it("ignores stale epochs without deleting a newer same-key request", async () => {
		const oldResponse = deferred<Role>();
		const newResponse = deferred<Role>();
		enginePermission
			.mockReturnValueOnce(oldResponse.promise)
			.mockReturnValueOnce(newResponse.promise);
		const store = createAccessStore();

		const oldRequest = store
			.getState()
			.access.actions.loadPermission("ENGINE", "same");
		store.getState().access.actions.clearPermissions();
		const newRequest = store
			.getState()
			.access.actions.loadPermission("ENGINE", "same");

		oldResponse.resolve("OWNER");
		await oldRequest;
		expect(store.getState().access.entries.ENGINE.same?.status).toBe(
			"loading",
		);
		expect(
			store.getState().access.actions.loadPermission("ENGINE", "same"),
		).toBe(newRequest);
		expect(enginePermission).toHaveBeenCalledTimes(2);

		newResponse.resolve("EDIT");
		await newRequest;
		expect(store.getState().access.entries.ENGINE.same).toEqual({
			status: "ready",
			permission: "EDIT",
		});
	});

	it("resolves insight access without a network request", async () => {
		const store = createAccessStore();

		await expect(
			store
				.getState()
				.access.actions.loadPermission("INSIGHT", "insight-1"),
		).resolves.toBe("EDIT");
		expect(enginePermission).not.toHaveBeenCalled();
		expect(projectPermission).not.toHaveBeenCalled();
	});
});
