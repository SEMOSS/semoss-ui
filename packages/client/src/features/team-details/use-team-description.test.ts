import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type GroupKey, getGroupDetails } from "@/api/teams";
import { useTeamDescription } from "./use-team-description";

// the description reading stays real; only the request is replaced
vi.mock("@/api/teams", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/api/teams")>()),
	getGroupDetails: vi.fn(),
}));

/** Stable across renders, as the hook asks of its callers */
const SALES: GroupKey = { id: "Sales", type: "CUSTOM" };

describe("useTeamDescription", () => {
	beforeEach(() => {
		vi.mocked(getGroupDetails).mockReset();
	});

	it("is loading until the read ends, then shows the decoded description", async () => {
		vi.mocked(getGroupDetails).mockResolvedValue({
			description: "&quot;Sales &amp; marketing&quot;",
		});
		const { result } = renderHook(() => useTeamDescription(SALES, true));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.description).toBeNull();

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.description).toBe("Sales & marketing");
		expect(result.current.error).toBeNull();
		expect(getGroupDetails).toHaveBeenCalledExactlyOnceWith(
			true,
			"Sales",
			"CUSTOM",
		);
	});

	it.each([
		["a blank description", { description: "   " }],
		["no description", {}],
		["a response that is not a team", "Sales"],
	])("reads %s as null", async (_name, details) => {
		vi.mocked(getGroupDetails).mockResolvedValue(details);
		const { result } = renderHook(() => useTeamDescription(SALES, false));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.description).toBeNull();
		expect(result.current.error).toBeNull();
	});

	it("reports a failed read and reads again on refresh", async () => {
		vi.mocked(getGroupDetails)
			.mockRejectedValueOnce(new Error("Forbidden"))
			.mockResolvedValueOnce({ description: "Sales team" });
		const { result } = renderHook(() => useTeamDescription(SALES, false));

		await waitFor(() => expect(result.current.error).toBe("Forbidden"));
		expect(result.current.isLoading).toBe(false);
		expect(result.current.description).toBeNull();

		act(() => result.current.refresh());

		expect(result.current.isLoading).toBe(true);
		expect(result.current.error).toBeNull();
		await waitFor(() =>
			expect(result.current.description).toBe("Sales team"),
		);
		expect(result.current.isLoading).toBe(false);
		expect(getGroupDetails).toHaveBeenCalledTimes(2);
	});

	it("says why a read failed when it has no message", async () => {
		vi.mocked(getGroupDetails).mockRejectedValue("offline");
		const { result } = renderHook(() => useTeamDescription(SALES, true));

		await waitFor(() =>
			expect(result.current.error).toBe("Could not load the team"),
		);
	});

	it("reads again when refreshKey changes", async () => {
		vi.mocked(getGroupDetails)
			.mockResolvedValueOnce({ description: "Before" })
			.mockResolvedValueOnce({ description: "After" });
		const { result, rerender } = renderHook(
			(props: { refreshKey: number }) =>
				useTeamDescription(SALES, true, props.refreshKey),
			{ initialProps: { refreshKey: 0 } },
		);
		await waitFor(() => expect(result.current.description).toBe("Before"));

		rerender({ refreshKey: 1 });

		await waitFor(() => expect(result.current.description).toBe("After"));
		expect(getGroupDetails).toHaveBeenCalledTimes(2);
	});
});
