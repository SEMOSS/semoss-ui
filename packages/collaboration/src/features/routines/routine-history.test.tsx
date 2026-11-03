import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDuration, RoutineHistory } from "./routine-history";

const service = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	open: vi.fn(),
	usePixel: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: service.actions }),
	usePixel: service.usePixel,
}));
vi.mock("./api/open-routine-room", () => ({
	openRoutineRoom: service.open,
}));
vi.mock("react-router", async (original) => ({
	...(await original<typeof import("react-router")>()),
	useNavigate: () => vi.fn(),
}));

afterEach(cleanup);

describe("RoutineHistory", () => {
	it("lists past runs and opens only a run with output, by its run id", async () => {
		service.usePixel.mockReturnValue({
			status: "SUCCESS",
			error: null,
			refresh: vi.fn(),
			data: {
				runs: [
					{
						runId: "run-2",
						startedAt: "2026-10-27T12:00:00Z",
						finishedAt: "2026-10-27T12:04:12Z",
						status: "completed",
						trigger: "manual",
						durationMs: 252000,
						hasOutput: true,
					},
					{
						runId: "run-1",
						startedAt: "2026-10-26T12:00:00Z",
						finishedAt: "2026-10-26T12:15:00Z",
						status: "failed",
						trigger: "scheduled",
						durationMs: 900000,
						hasOutput: false,
					},
				],
			},
		});
		service.open.mockResolvedValue("room-2");
		render(
			<MemoryRouter>
				<RoutineHistory routineId="event-planning" timezone="UTC" />
			</MemoryRouter>,
		);
		expect(service.usePixel).toHaveBeenCalledWith(
			'WorkListRoutineRuns(routineId=["event-planning"]);',
		);
		expect(screen.getAllByRole("row")).toHaveLength(3);
		expect(screen.getByText("Run now")).toBeVisible();
		expect(screen.getByText("Failed")).toBeVisible();
		expect(screen.getByText("4m 12s")).toBeVisible();
		const open = screen.getAllByRole("button", { name: "Open chat" });
		expect(open).toHaveLength(1);
		await userEvent.setup().click(open[0] as HTMLElement);
		await waitFor(() =>
			expect(service.open).toHaveBeenCalledExactlyOnceWith(
				service.actions,
				"event-planning",
				undefined,
				"run-2",
			),
		);
	});

	it("formats run lengths", () => {
		expect(formatDuration(null)).toBe("-");
		expect(formatDuration(45000)).toBe("45s");
		expect(formatDuration(3_725_000)).toBe("62m 5s");
	});
});
