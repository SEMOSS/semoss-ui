import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "@semoss/ui/next";
import { RoutineLoader } from "./routine-loader";

// one stable insight and pixel result, so effects keyed on them run once
const sdk = vi.hoisted(() => {
	const actions = { run: vi.fn() };
	return {
		actions,
		insight: { actions },
		pixel: {
			status: "SUCCESS",
			data: null as unknown,
			error: null,
			update: vi.fn(),
			refresh: vi.fn(),
		},
	};
});

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => sdk.insight,
	usePixel: () => sdk.pixel,
}));

const schema = z.object({
	enabled: z.boolean().optional(),
	lastRun: z.object({ status: z.string(), startedAt: z.string() }).nullable(),
});
type Routine = z.infer<typeof schema>;

/** Yesterday's brief, as a page opened before today's run shows it. */
const yesterday = {
	lastRun: { status: "completed", startedAt: "2026-11-04T13:00:00Z" },
};
const running = {
	lastRun: { status: "running", startedAt: "2026-11-05T13:00:02Z" },
};

/** Answers every read with the routine. */
function reads(routine: Routine): void {
	sdk.actions.run.mockResolvedValue({
		pixelReturn: [{ output: routine, operationType: [] }],
	});
}

function view(start?: () => Promise<Routine>, saved?: Routine) {
	return (
		<RoutineLoader pixel="WorkGetInboxRoutine();" schema={schema}>
			{(routine, update, runNow) => (
				<>
					<p>{routine.lastRun?.status ?? "never run"}</p>
					{start && (
						<button
							type="button"
							onClick={() => void runNow(start).catch(() => null)}
						>
							Run now
						</button>
					)}
					{saved && (
						<button type="button" onClick={() => update(saved)}>
							Save
						</button>
					)}
				</>
			)}
		</RoutineLoader>
	);
}

function showRoutine(start?: () => Promise<Routine>, saved?: Routine) {
	return render(view(start, saved));
}

/** How many reads the page has made. */
function readCount(): number {
	return sdk.actions.run.mock.calls.length;
}

describe("RoutineLoader", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		sdk.actions.run.mockReset();
		sdk.pixel.update.mockReset();
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("reads a routine with a run going again, so the run's end shows without a reload", async () => {
		sdk.pixel.data = running;
		reads(yesterday);
		showRoutine();
		expect(screen.getByText("running")).toBeInTheDocument();
		expect(sdk.actions.run).not.toHaveBeenCalled();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10_000);
		});
		expect(sdk.actions.run).toHaveBeenCalledWith("WorkGetInboxRoutine();");
		expect(sdk.pixel.update).toHaveBeenCalledWith(yesterday);
	});

	it("after Run now, reads every few seconds until its run shows, then at the running pace", async () => {
		vi.setSystemTime(new Date("2026-11-05T13:00:00Z"));
		sdk.pixel.data = yesterday;
		// the server answered before its run claimed, so the read after still has yesterday's
		const start = vi.fn(async () => yesterday);
		reads(yesterday);
		const { rerender } = showRoutine(start);
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Run now" }));
		});
		expect(start).toHaveBeenCalledOnce();
		expect(sdk.pixel.update).toHaveBeenCalledWith(yesterday);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3_000);
		});
		expect(readCount()).toBe(1);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3_000);
		});
		expect(readCount()).toBe(2);
		// the run claims; its read lands, and the running poll takes over
		sdk.pixel.data = running;
		rerender(view(start));
		expect(screen.getByText("running")).toBeInTheDocument();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(9_000);
		});
		expect(readCount()).toBe(2);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(1_000);
		});
		expect(readCount()).toBe(3);
	});

	it("reads again after a refused Run now, and stops looking after about a minute", async () => {
		vi.setSystemTime(new Date("2026-11-05T13:00:00Z"));
		sdk.pixel.data = yesterday;
		reads(yesterday);
		showRoutine(async () => {
			throw new Error("The brief is already running.");
		});
		await act(async () => {
			fireEvent.click(screen.getByRole("button", { name: "Run now" }));
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(3_000);
		});
		expect(sdk.actions.run).toHaveBeenCalledWith("WorkGetInboxRoutine();");
		await act(async () => {
			await vi.advanceTimersByTimeAsync(57_000);
		});
		const looked = readCount();
		expect(looked).toBeGreaterThanOrEqual(19);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60_000);
		});
		expect(readCount()).toBe(looked);
	});

	it("keeps a save over a read that was asked before it", async () => {
		sdk.pixel.data = { ...running, enabled: true };
		let answer: (response: unknown) => void = () => undefined;
		sdk.actions.run.mockReturnValueOnce(
			new Promise((resolve) => {
				answer = resolve;
			}),
		);
		showRoutine(undefined, { ...running, enabled: false });
		// the running poll asks while the routine is still on
		await act(async () => {
			await vi.advanceTimersByTimeAsync(10_000);
		});
		expect(readCount()).toBe(1);
		// the owner pauses it, and the save lands first
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await act(async () => {
			answer({
				pixelReturn: [
					{
						output: { ...running, enabled: true },
						operationType: [],
					},
				],
			});
			await vi.advanceTimersByTimeAsync(0);
		});
		expect(sdk.pixel.update).toHaveBeenCalledOnce();
		expect(sdk.pixel.update).toHaveBeenCalledWith({
			...running,
			enabled: false,
		});
	});

	it("leaves a routine with nothing running alone, and waits while the page is hidden", async () => {
		sdk.pixel.data = yesterday;
		showRoutine();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(30_000);
		});
		expect(sdk.actions.run).not.toHaveBeenCalled();
		cleanup();
		sdk.pixel.data = running;
		vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
		showRoutine();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(30_000);
		});
		expect(sdk.actions.run).not.toHaveBeenCalled();
	});
});
