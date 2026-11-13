import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResourcePermissions } from "@semoss/sdk";
import { useEngineUsageAccess } from "./use-engine-usage-access";

const mocks = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	getResourcePermissions: mocks.read,
}));
const access: ResourcePermissions = {
	people: [],
	teams: [],
	allowedPermissionChanges: {
		canChangePeople: true,
		canGiveAuthorAccess: true,
		canChangeTeams: true,
		addsAreAdminOnly: false,
		limitLevels: ["OWNER", "EDIT", "READ_ONLY"],
		canChangeModelLimits: false,
		canChangeEngineUsageLimits: true,
	},
	publicUse: null,
	modelTotal: null,
	costLimitsAvailable: false,
	price: null,
	engineUsage: {
		catalogType: "DATABASE",
		metrics: ["QUERIES", "ROWS", "COMPUTE_TIME"],
		publicUse: { isPublic: false, usageLimit: null },
		engineTotal: { usageLimit: null },
	},
};
/** Deferred results make response ordering and unmount cleanup observable. */
const defer = () => {
	let resolve: (value: ResourcePermissions) => void = () => {};
	const promise = new Promise<ResourcePermissions>((complete) => {
		resolve = complete;
	});
	return { promise, resolve };
};
afterEach(() => {
	cleanup();
	mocks.read.mockReset();
});
describe("useEngineUsageAccess", () => {
	it("does not request policies when no supported engine is selected", () => {
		const { result } = renderHook(() => useEngineUsageAccess(null));
		expect(mocks.read).not.toHaveBeenCalled();
		expect(result.current).toMatchObject({
			access: null,
			isLoading: false,
			error: null,
		});
	});
	it("ignores out-of-order results after changing engines", async () => {
		const first = defer();
		const second = defer();
		mocks.read
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const { result, rerender } = renderHook(
			({ id }) => useEngineUsageAccess(id),
			{ initialProps: { id: "first" } },
		);
		rerender({ id: "second" });
		await act(async () => second.resolve(access));
		expect(result.current.access).toBe(access);
		await act(async () =>
			first.resolve({ ...access, engineUsage: undefined }),
		);
		expect(result.current.access).toBe(access);
		expect(result.current.error).toBeNull();
	});
	it("surfaces missing capabilities as an error and explicitly retries", async () => {
		mocks.read
			.mockResolvedValueOnce({ ...access, engineUsage: undefined })
			.mockResolvedValueOnce(access);
		const { result } = renderHook(() => useEngineUsageAccess("db"));
		await waitFor(() => expect(result.current.error).not.toBeNull());
		expect(result.current.access).toBeNull();
		act(() => result.current.reload());
		await waitFor(() => expect(result.current.access).toBe(access));
		expect(result.current.error).toBeNull();
	});
	it("cleans up Strict Mode requests and isolates changes to admin mode", async () => {
		const old = defer();
		const admin = defer();
		mocks.read
			.mockReturnValueOnce(old.promise)
			.mockReturnValueOnce(old.promise)
			.mockReturnValueOnce(admin.promise);
		const { result, rerender, unmount } = renderHook(
			({ admin }) => useEngineUsageAccess("db", admin),
			{ initialProps: { admin: false }, wrapper: StrictMode },
		);
		rerender({ admin: true });
		await act(async () => old.resolve(access));
		expect(result.current.access).toBeNull();
		expect(mocks.read).toHaveBeenLastCalledWith(
			{ resourceType: "ENGINE", id: "db" },
			true,
		);
		unmount();
		await act(async () => admin.resolve(access));
		expect(result.current.access).toBeNull();
	});
});
