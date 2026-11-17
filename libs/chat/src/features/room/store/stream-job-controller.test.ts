import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";
import { servePixelTransport } from "../../../test/pixel-transport";
import { StreamJobController } from "./stream-job-controller";

vi.mock("@semoss/sdk/react", () => ({
	getPixelAsyncResult: vi.fn(),
	getPixelJobStreaming: vi.fn(),
	runPixel: vi.fn(),
	runPixelAsync: vi.fn(),
}));

// the SDK's own calls go out over HTTP; answer them from the mocks above
servePixelTransport({ runPixel: vi.mocked(runPixel) });

/** One poll's response. */
type Poll = Awaited<ReturnType<typeof getPixelJobStreaming>>;

/** A content chunk, as the poll loop hands it on. */
const chunk = (content: string) =>
	({
		stream_type: "content",
		data: { content },
	}) as unknown as Poll["message"][number];

/** A poll that reports `status` with `chunks`. */
const poll = (status: Poll["status"], chunks: string[] = []): Poll => ({
	status,
	message: chunks.map(chunk),
});

/** The settled result of a job, with its statement errors. */
const result = (errors: string[] = []) => ({
	errors,
	insightId: "insight-1",
	results: [
		{
			output: "done",
			isMeta: false,
			operationType: [],
			pixelExpression: "",
			pixelId: "",
			timeToRun: 0,
		},
	],
});

/** A promise and the function that settles it. */
const deferred = <T = void>() => {
	let resolve: (value: T) => void = () => {};
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};

/**
 * A controller over spies, recording its cancel state at every `onChange`.
 *
 * @returns The controller, its deps, and the recorded states.
 */
const createController = () => {
	const changes: [canCancel: boolean, isCancelling: boolean][] = [];
	const deps = {
		getInsightId: vi.fn(() => "insight-1"),
		setLoading: vi.fn(),
		setError: vi.fn(),
		onChange: vi.fn(() => {
			changes.push([controller.canCancel, controller.isCancelling]);
		}),
	};
	const controller = new StreamJobController(deps);
	return { controller, deps, changes };
};

/** Handlers that record what they hear. */
const createHandlers = () => ({
	onEmit: vi.fn(),
	onResult: vi.fn(),
});

beforeEach(() => {
	vi.useFakeTimers();
	vi.mocked(runPixelAsync).mockResolvedValue({ jobId: "job-1" });
	vi.mocked(getPixelAsyncResult).mockResolvedValue(result());
	vi.mocked(runPixel).mockResolvedValue({
		errors: [],
		insightId: "insight-1",
		pixelReturn: [],
	});
	vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
	vi.useRealTimers();
	vi.resetAllMocks();
	vi.restoreAllMocks();
});

test("a job polls every 500ms, emits each chunk in order, and hands on its result", async () => {
	const { controller, deps, changes } = createController();
	const handlers = createHandlers();
	vi.mocked(getPixelJobStreaming)
		.mockResolvedValueOnce(poll("Streaming", ["a", "b"]))
		// a paused job keeps polling, as any status that is not an end does
		.mockResolvedValueOnce(poll("Paused"))
		.mockResolvedValueOnce(poll("Complete", ["c"]));

	const run = controller.run("AskPlayground();", handlers);

	await vi.advanceTimersByTimeAsync(0);
	expect(runPixelAsync).toHaveBeenCalledWith("AskPlayground();", "insight-1");
	expect(getPixelJobStreaming).toHaveBeenCalledTimes(1);
	expect(getPixelJobStreaming).toHaveBeenCalledWith("job-1");
	expect(handlers.onEmit).toHaveBeenCalledTimes(2);

	await vi.advanceTimersByTimeAsync(499);
	expect(getPixelJobStreaming).toHaveBeenCalledTimes(1);
	await vi.advanceTimersByTimeAsync(1);
	expect(getPixelJobStreaming).toHaveBeenCalledTimes(2);
	await vi.advanceTimersByTimeAsync(500);
	await run;

	expect(getPixelJobStreaming).toHaveBeenCalledTimes(3);
	expect(handlers.onEmit.mock.calls.map(([emitted]) => emitted)).toEqual([
		chunk("a"),
		chunk("b"),
		chunk("c"),
	]);
	expect(getPixelAsyncResult).toHaveBeenCalledWith("job-1");
	expect(handlers.onResult).toHaveBeenCalledTimes(1);
	expect(handlers.onResult).toHaveBeenCalledWith(result());
	expect(deps.setLoading.mock.calls).toEqual([[true], [false]]);
	expect(deps.setError).not.toHaveBeenCalled();
	// a job without onCancel is never tracked, so nothing changes
	expect(changes).toEqual([]);
	expect(controller.canCancel).toBe(false);
});

test("ProgressComplete ends the poll like Complete", async () => {
	const { controller } = createController();
	const handlers = createHandlers();
	vi.mocked(getPixelJobStreaming).mockResolvedValueOnce(
		poll("ProgressComplete"),
	);

	await controller.run("Pixel();", handlers);

	expect(getPixelJobStreaming).toHaveBeenCalledTimes(1);
	expect(handlers.onResult).toHaveBeenCalledTimes(1);
});

test.each([
	["Error", "Streaming job encountered an error"],
	["Canceled", "Streaming job was cancelled"],
	["UnknownJob", "Streaming job no longer exists"],
] as const)(
	"a job that ends in %s throws and surfaces the failure",
	async (status, message) => {
		const { controller, deps } = createController();
		const handlers = { ...createHandlers(), onCancel: vi.fn() };
		vi.mocked(getPixelJobStreaming).mockResolvedValueOnce(
			poll(status, ["partial"]),
		);

		await expect(controller.run("Pixel();", handlers)).rejects.toThrow(
			message,
		);

		// the last poll's chunks are still emitted before the throw
		expect(handlers.onEmit).toHaveBeenCalledTimes(1);
		expect(handlers.onResult).not.toHaveBeenCalled();
		expect(handlers.onCancel).not.toHaveBeenCalled();
		expect(getPixelAsyncResult).not.toHaveBeenCalled();
		expect(deps.setError).toHaveBeenCalledWith(new Error(message));
		expect(deps.setLoading.mock.calls).toEqual([[true], [false]]);
		expect(controller.canCancel).toBe(false);
		expect(controller.isCancelling).toBe(false);
	},
);

test("a job with no id throws before it polls", async () => {
	const { controller, deps } = createController();
	vi.mocked(runPixelAsync).mockResolvedValueOnce({ jobId: "" });

	await expect(controller.run("Pixel();", createHandlers())).rejects.toThrow(
		"No job ID returned from pixel execution",
	);
	expect(getPixelJobStreaming).not.toHaveBeenCalled();
	expect(deps.setError).toHaveBeenCalledTimes(1);
	expect(deps.setLoading.mock.calls).toEqual([[true], [false]]);
});

test("showLoading, setErrorOnFail and throwOnError change what a run reports", async () => {
	const { controller, deps } = createController();

	// statement errors throw by default, joined with nothing between them
	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Complete"));
	vi.mocked(getPixelAsyncResult).mockResolvedValue(result(["bad ", "pixel"]));
	const thrown = createHandlers();
	await expect(controller.run("Pixel();", thrown)).rejects.toThrow(
		"bad pixel",
	);
	expect(thrown.onResult).not.toHaveBeenCalled();
	expect(deps.setError).toHaveBeenCalledTimes(1);

	// throwOnError: false hands the result on, errors and all
	const inspected = createHandlers();
	await controller.run("Pixel();", inspected, { throwOnError: false });
	expect(inspected.onResult).toHaveBeenCalledWith(result(["bad ", "pixel"]));
	expect(deps.setError).toHaveBeenCalledTimes(1);

	// setErrorOnFail: false throws without telling the room
	deps.setLoading.mockClear();
	await expect(
		controller.run("Pixel();", createHandlers(), {
			setErrorOnFail: false,
			showLoading: false,
		}),
	).rejects.toThrow("bad pixel");
	expect(deps.setError).toHaveBeenCalledTimes(1);
	// showLoading: false leaves the room's loading state alone
	expect(deps.setLoading).not.toHaveBeenCalled();
});

test("stop sends StopPixelExecution, runs onCancel once, and unwinds the run silently", async () => {
	const { controller, deps, changes } = createController();
	const onCancel = vi.fn();
	const handlers = { ...createHandlers(), onCancel };
	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Streaming", ["a"]));

	const run = controller.run("AskPlayground();", handlers);
	await vi.advanceTimersByTimeAsync(0);
	expect(controller.canCancel).toBe(true);
	expect(changes).toEqual([[true, false]]);

	await controller.stop();
	expect(runPixel).toHaveBeenCalledTimes(1);
	expect(runPixel).toHaveBeenCalledWith(
		'StopPixelExecution(id=["job-1"]);',
		"insight-1",
	);
	expect(onCancel).toHaveBeenCalledTimes(1);
	// the commit has settled but the poll loop is still asleep, so the stop
	// has not drained yet
	expect(controller.canCancel).toBe(false);
	expect(controller.isCancelling).toBe(true);

	// a second stop while the first unwinds does nothing
	await controller.stop();
	expect(runPixel).toHaveBeenCalledTimes(1);
	expect(onCancel).toHaveBeenCalledTimes(1);

	await vi.advanceTimersByTimeAsync(500);
	await run;

	// the loop saw the stop before its next poll
	expect(getPixelJobStreaming).toHaveBeenCalledTimes(1);
	expect(handlers.onEmit).toHaveBeenCalledTimes(1);
	expect(handlers.onResult).not.toHaveBeenCalled();
	expect(getPixelAsyncResult).not.toHaveBeenCalled();
	expect(deps.setError).not.toHaveBeenCalled();
	expect(deps.setLoading.mock.calls).toEqual([[true], [false]]);
	expect(controller.isCancelling).toBe(false);
	expect(changes).toEqual([
		[true, false], // the job started
		[false, true], // stop issued
		[false, true], // the run unwound, while the stop is still draining
		[false, false], // both halves drained
	]);
});

test("isCancelling holds until a slow cancel commit settles", async () => {
	const { controller, changes } = createController();
	const commit = deferred();
	const onCancel = vi.fn(() => commit.promise);
	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Streaming"));

	const run = controller.run("AskPlayground();", {
		...createHandlers(),
		onCancel,
	});
	await vi.advanceTimersByTimeAsync(0);
	const stop = controller.stop();
	await vi.advanceTimersByTimeAsync(500);
	await run;

	// the stream has unwound, but the cancelled turn is still being saved
	expect(controller.isCancelling).toBe(true);
	expect(controller.canCancel).toBe(false);

	commit.resolve();
	await stop;
	expect(controller.isCancelling).toBe(false);
	expect(changes.at(-1)).toEqual([false, false]);
});

test("isCancelling holds until a poll in flight at the stop returns", async () => {
	const { controller, deps } = createController();
	const inFlight = deferred<Poll>();
	vi.mocked(getPixelJobStreaming).mockReturnValueOnce(inFlight.promise);
	const handlers = { ...createHandlers(), onCancel: vi.fn() };

	const run = controller.run("AskPlayground();", handlers);
	await vi.advanceTimersByTimeAsync(0);
	await controller.stop();

	// StopPixelExecution and the commit are done; the poll is not
	expect(handlers.onCancel).toHaveBeenCalledTimes(1);
	expect(controller.isCancelling).toBe(true);

	// the server reports the job it stopped: the run unwinds without an error
	inFlight.resolve(poll("Canceled"));
	await run;
	expect(deps.setError).not.toHaveBeenCalled();
	expect(handlers.onResult).not.toHaveBeenCalled();
	expect(controller.isCancelling).toBe(false);
});

test("a stop over several jobs stops each and runs each onCancel once", async () => {
	const { controller, deps } = createController();
	vi.mocked(runPixelAsync)
		.mockResolvedValueOnce({ jobId: "job-1" })
		.mockResolvedValueOnce({ jobId: "job-2" })
		.mockResolvedValueOnce({ jobId: "job-3" });
	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Streaming"));
	const first = vi.fn();
	const second = vi.fn(() => {
		throw new Error("save failed");
	});
	const runs = [
		controller.run("A();", { ...createHandlers(), onCancel: first }),
		controller.run("B();", { ...createHandlers(), onCancel: second }),
		// an untracked job finishes on its own and is never stopped
		controller.run("C();", createHandlers()),
	];
	await vi.advanceTimersByTimeAsync(0);

	await controller.stop();

	expect(vi.mocked(runPixel).mock.calls.map(([pixel]) => pixel)).toEqual([
		'StopPixelExecution(id=["job-1"]);',
		'StopPixelExecution(id=["job-2"]);',
	]);
	expect(first).toHaveBeenCalledTimes(1);
	expect(second).toHaveBeenCalledTimes(1);
	// a commit that fails is surfaced on the room
	expect(deps.setError).toHaveBeenCalledWith(new Error("save failed"));

	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Complete"));
	await vi.advanceTimersByTimeAsync(500);
	await Promise.all(runs);
	expect(getPixelAsyncResult).toHaveBeenCalledTimes(1);
	expect(getPixelAsyncResult).toHaveBeenCalledWith("job-3");
	expect(controller.isCancelling).toBe(false);
});

test("stop does nothing with no cancellable job in flight", async () => {
	const { controller, deps } = createController();
	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Streaming"));
	const run = controller.run("Tool();", createHandlers());
	await vi.advanceTimersByTimeAsync(0);

	await controller.stop();

	expect(runPixel).not.toHaveBeenCalled();
	expect(controller.isCancelling).toBe(false);
	expect(deps.onChange).not.toHaveBeenCalled();

	vi.mocked(getPixelJobStreaming).mockResolvedValue(poll("Complete"));
	await vi.advanceTimersByTimeAsync(500);
	await run;
});
