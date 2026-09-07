import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserEnginePermission } from "@semoss/sdk";
import { WorkbenchStoreContext } from "@/contexts/workbench.context";
import { createWorkbenchStore } from "@/stores/workbench";
import { useWorkbenchAccess } from "./use-workbench-access";

vi.mock("@semoss/sdk", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@semoss/sdk")>();
	return { ...actual, getUserEnginePermission: vi.fn() };
});

const enginePermission = vi.mocked(getUserEnginePermission);

/** Surfaces every field of the access state as text so tests can assert on it. */
const AccessProbe = () => {
	const access = useWorkbenchAccess("ENGINE", "engine-1");
	return (
		<div>
			<span>status:{access.status}</span>
			{access.status === "ready" ? (
				<>
					<span>permission:{access.permission}</span>
					<span>canEdit:{String(access.canEdit)}</span>
					<span>refreshing:{String(access.refreshing)}</span>
					<span>refreshError:{access.refreshError ?? ""}</span>
					<button
						type="button"
						onClick={() =>
							void access.refresh().catch(() => undefined)
						}
					>
						Refresh
					</button>
				</>
			) : null}
			{access.status === "error" ? (
				<span>error:{access.error}</span>
			) : null}
		</div>
	);
};

const renderAccess = () => {
	const store = createWorkbenchStore("access-hook");
	render(
		<WorkbenchStoreContext.Provider value={store}>
			<AccessProbe />
		</WorkbenchStoreContext.Provider>,
	);
};

/** Click the probe's refresh button. */
const clickRefresh = () => {
	act(() => screen.getByRole("button", { name: "Refresh" }).click());
};

describe("useWorkbenchAccess", () => {
	beforeEach(() => enginePermission.mockReset());

	it("starts loading, then resolves to ready", async () => {
		enginePermission.mockResolvedValue("OWNER");
		renderAccess();

		expect(screen.getByText("status:loading")).toBeVisible();
		await waitFor(() =>
			expect(screen.getByText("permission:OWNER")).toBeVisible(),
		);
		expect(screen.getByText("canEdit:true")).toBeVisible();
		expect(screen.getByText("refreshing:false")).toBeVisible();
	});

	it("fails closed with an error when permission never resolves", async () => {
		enginePermission.mockRejectedValueOnce(new Error("Access unavailable"));
		renderAccess();

		await waitFor(() =>
			expect(screen.getByText("error:Access unavailable")).toBeVisible(),
		);
	});

	it("keeps stale permission and reports refreshing while a refresh is in flight", async () => {
		let resolveRefresh: (permission: "READ_ONLY") => void = () => undefined;
		enginePermission.mockResolvedValueOnce("OWNER").mockReturnValueOnce(
			new Promise((resolve) => {
				resolveRefresh = resolve;
			}),
		);
		renderAccess();
		await waitFor(() =>
			expect(screen.getByText("permission:OWNER")).toBeVisible(),
		);

		clickRefresh();

		await waitFor(() =>
			expect(screen.getByText("refreshing:true")).toBeVisible(),
		);
		expect(screen.getByText("permission:OWNER")).toBeVisible();

		await act(async () => resolveRefresh("READ_ONLY"));
		await waitFor(() =>
			expect(screen.getByText("permission:READ_ONLY")).toBeVisible(),
		);
		expect(screen.getByText("canEdit:false")).toBeVisible();
		expect(screen.getByText("refreshing:false")).toBeVisible();
	});

	it("keeps stale permission and reports a refresh error when a refresh fails", async () => {
		let rejectRefresh: (error: Error) => void = () => undefined;
		enginePermission.mockResolvedValueOnce("OWNER").mockReturnValueOnce(
			new Promise((_resolve, reject) => {
				rejectRefresh = reject;
			}),
		);
		renderAccess();
		await waitFor(() =>
			expect(screen.getByText("permission:OWNER")).toBeVisible(),
		);

		clickRefresh();

		await act(async () => rejectRefresh(new Error("Refresh failed")));
		await waitFor(() =>
			expect(
				screen.getByText("refreshError:Refresh failed"),
			).toBeVisible(),
		);
		expect(screen.getByText("permission:OWNER")).toBeVisible();
		expect(screen.getByText("refreshing:false")).toBeVisible();
	});
});
