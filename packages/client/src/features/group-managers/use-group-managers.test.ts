import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type GroupAccessTarget,
	type GroupManager,
	getGroupManagers,
} from "@/api/teams";
import { useGroupManagers } from "./use-group-managers";

vi.mock("@/api/teams", () => ({ getGroupManagers: vi.fn() }));

const ADA: GroupManager = {
	userid: "ada",
	type: "NATIVE",
	name: "Ada Lovelace",
};
const GRACE: GroupManager = {
	userid: "grace",
	type: "NATIVE",
	name: "Grace Hopper",
};

/** A promise the test settles by hand */
function defer<T>() {
	let resolve: (value: T) => void = () => {};
	let reject: (reason: unknown) => void = () => {};
	const promise = new Promise<T>((onResolve, onReject) => {
		resolve = onResolve;
		reject = onReject;
	});
	return { promise, resolve, reject };
}

/** Render the hook for a team the test can change through rerender */
const renderManagers = (groupId: string | null, admin = false) =>
	renderHook(
		(props: { groupId: string | null }) =>
			useGroupManagers(props.groupId, admin),
		{ initialProps: { groupId } },
	);

describe("useGroupManagers", () => {
	beforeEach(() => {
		vi.mocked(getGroupManagers).mockReset();
	});

	it("reads nothing and is not loading without a team", () => {
		const { result } = renderManagers(null);

		expect(result.current).toMatchObject({
			managers: [],
			isLoading: false,
			error: null,
		});
		expect(getGroupManagers).not.toHaveBeenCalled();
	});

	it("reads a team's managers", async () => {
		vi.mocked(getGroupManagers).mockResolvedValue([ADA]);
		const { result } = renderManagers("Sales", true);

		expect(result.current.isLoading).toBe(true);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.managers).toEqual([ADA]);
		expect(result.current.error).toBeNull();
		expect(getGroupManagers).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			true,
			undefined,
		);
	});

	it("shows a newly picked team as loading, with no managers, until its own read ends", async () => {
		const support = defer<GroupManager[]>();
		vi.mocked(getGroupManagers)
			.mockResolvedValueOnce([ADA])
			.mockReturnValueOnce(support.promise);
		const { result, rerender } = renderManagers("Sales");
		await waitFor(() => expect(result.current.managers).toEqual([ADA]));

		rerender({ groupId: "Support" });

		expect(result.current).toMatchObject({
			managers: [],
			isLoading: true,
			error: null,
		});
		await act(async () => support.resolve([GRACE]));
		expect(result.current).toMatchObject({
			managers: [GRACE],
			isLoading: false,
			error: null,
		});
	});

	it("does not carry a failed team's error over to the next team", async () => {
		const support = defer<GroupManager[]>();
		vi.mocked(getGroupManagers)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockReturnValueOnce(support.promise);
		const { result, rerender } = renderManagers("Sales");
		await waitFor(() => expect(result.current.error).toBe("Forbidden"));
		expect(result.current.isLoading).toBe(false);
		expect(result.current.managers).toEqual([]);

		rerender({ groupId: "Support" });

		expect(result.current).toMatchObject({
			managers: [],
			isLoading: true,
			error: null,
		});
		await act(async () => support.resolve([GRACE]));
		expect(result.current.managers).toEqual([GRACE]);
	});

	it("says why a read failed when it has no message", async () => {
		vi.mocked(getGroupManagers).mockRejectedValue("offline");
		const { result } = renderManagers("Sales");

		await waitFor(() =>
			expect(result.current.error).toBe(
				"Could not load the team's managers",
			),
		);
	});

	it("reads the managers again on refresh", async () => {
		vi.mocked(getGroupManagers)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockResolvedValueOnce([ADA]);
		const { result } = renderManagers("Sales");
		await waitFor(() => expect(result.current.error).toBe("Forbidden"));

		act(() => result.current.refresh());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBeNull();
		await waitFor(() => expect(result.current.managers).toEqual([ADA]));
		expect(result.current.isLoading).toBe(false);
		expect(getGroupManagers).toHaveBeenCalledTimes(2);
	});

	it("stops loading when the team is cleared", async () => {
		vi.mocked(getGroupManagers).mockResolvedValue([ADA]);
		const { result, rerender } = renderManagers("Sales");
		await waitFor(() => expect(result.current.managers).toEqual([ADA]));

		rerender({ groupId: null });

		expect(result.current).toMatchObject({
			managers: [],
			isLoading: false,
			error: null,
		});
	});

	it("passes the target and reads again only when the target itself changes", async () => {
		vi.mocked(getGroupManagers).mockResolvedValue([ADA]);
		const { result, rerender } = renderHook(
			(props: { target: GroupAccessTarget }) =>
				useGroupManagers("Sales", false, props.target),
			{
				initialProps: {
					target: { resource: "PROJECT", resourceId: "project-1" },
				},
			},
		);
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(getGroupManagers).toHaveBeenCalledExactlyOnceWith(
			"Sales",
			false,
			{ resource: "PROJECT", resourceId: "project-1" },
		);

		// a new object for the same project
		rerender({ target: { resource: "PROJECT", resourceId: "project-1" } });
		expect(getGroupManagers).toHaveBeenCalledTimes(1);

		rerender({ target: { resource: "ENGINE", resourceId: "project-1" } });
		await waitFor(() => expect(getGroupManagers).toHaveBeenCalledTimes(2));
		expect(getGroupManagers).toHaveBeenLastCalledWith("Sales", false, {
			resource: "ENGINE",
			resourceId: "project-1",
		});
	});
});
