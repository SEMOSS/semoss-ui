import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixel,
	runPixelAsync,
} from "./base";
import { runPixelWithConsole, stopPixelJob } from "./pixel-job";

vi.mock("./base", () => ({
	console: vi.fn(),
	getPixelAsyncResult: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
}));

const mockConsole = vi.mocked(getPixelConsole);
const mockResult = vi.mocked(getPixelAsyncResult);
const mockRunPixel = vi.mocked(runPixel);
const mockRunPixelAsync = vi.mocked(runPixelAsync);

/** A job's result. */
const result = {
	errors: [],
	insightId: "insight-1",
	results: [],
} as unknown as Awaited<ReturnType<typeof getPixelAsyncResult>>;

beforeEach(() => {
	vi.resetAllMocks();
	vi.useFakeTimers();
	mockRunPixelAsync.mockResolvedValue({ jobId: "job-1" });
	mockResult.mockResolvedValue(result);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("stopPixelJob", () => {
	it("stops the job, and reports a stop the backend refused without throwing", async () => {
		mockRunPixel
			.mockResolvedValueOnce({
				errors: [],
				insightId: "insight-1",
				pixelReturn: [],
			})
			.mockResolvedValueOnce({
				errors: ["Job is done"],
				insightId: "insight-1",
				pixelReturn: [],
			});

		await expect(stopPixelJob("insight-1", "job-1")).resolves.toBe(true);
		await expect(stopPixelJob("insight-1", "job-1")).resolves.toBe(false);
		expect(mockRunPixel).toHaveBeenCalledWith(
			'StopPixelExecution(id=["job-1"]);',
			"insight-1",
		);
	});
});

describe("runPixelWithConsole", () => {
	it("reads the console until the job ends, then its result", async () => {
		mockConsole
			.mockResolvedValueOnce({ message: ["one"], status: "InProgress" })
			.mockResolvedValueOnce({ message: ["two"], status: "Complete" })
			.mockResolvedValueOnce({ message: ["three"], status: "Complete" });
		const onConsole = vi.fn();

		const run = runPixelWithConsole("insight-1", 'Py("1");', { onConsole });
		await vi.advanceTimersByTimeAsync(1000);

		await expect(run).resolves.toEqual({
			errors: [],
			results: [],
			logs: ["one", "two", "three"],
		});
		expect(mockRunPixelAsync).toHaveBeenCalledWith('Py("1");', "insight-1");
		expect(onConsole.mock.calls).toEqual([
			[["one"]],
			[["one", "two"]],
			[["one", "two", "three"]],
		]);
		expect(mockResult).toHaveBeenCalledWith("job-1");
	});

	it("stops keeping lines past the limit", async () => {
		mockConsole
			.mockResolvedValueOnce({
				message: ["12345", "678"],
				status: "Complete",
			})
			.mockResolvedValueOnce({ message: ["9"], status: "Complete" });

		const { logs } = await runPixelWithConsole("insight-1", "Run();", {
			maxLogChars: 5,
		});

		expect(logs).toEqual([
			"12345",
			"… logs truncated (exceeded 5 characters)",
		]);
	});

	it("stops reading the console when it fails, and throws for no job", async () => {
		mockConsole.mockRejectedValue(new Error("gone"));
		await expect(
			runPixelWithConsole("insight-1", "Run();"),
		).resolves.toEqual({ errors: [], results: [], logs: [] });

		mockRunPixelAsync.mockResolvedValueOnce({ jobId: "" });
		await expect(
			runPixelWithConsole("insight-1", "Run();"),
		).rejects.toThrow("No job id returned for pixel execution");
	});
});
