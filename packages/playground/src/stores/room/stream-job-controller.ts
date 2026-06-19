import { makeAutoObservable } from "mobx";
import {
	getPixelAsyncResult,
	getPixelJobStreaming,
	runPixel,
	runPixelAsync,
} from "@semoss/sdk/react";

/** A single streaming chunk as delivered by the polling loop. */
type StreamChunk = Awaited<
	ReturnType<typeof getPixelJobStreaming>
>["message"][number];

/** The settled result of a completed streaming job. */
type StreamResult<O extends unknown[] | []> = Awaited<
	ReturnType<typeof getPixelAsyncResult<O>>
>;

export interface StreamHandlers<O extends unknown[] | []> {
	/** Fires for each streaming chunk as it arrives. */
	onEmit: (chunk: StreamChunk) => void;
	/** Fires once when the stream completes, with the final pixel result. */
	onResult: (result: StreamResult<O>) => void;
	/**
	 * When provided, the job is cancellable: it's stashed so stop() can abort
	 * it and then run this. Fired by stop() (not the run loop) when the user
	 * stops the job, instead of onResult. Omit to make a job uncancellable —
	 * stop() then ignores it.
	 */
	onCancel?: () => void | Promise<void>;
}

export interface StreamOptions {
	/** Toggle the room's global loading state around the run. Defaults true. */
	showLoading?: boolean;
	/** Surface failures on the room rather than only throwing. Defaults true. */
	setErrorOnFail?: boolean;
}

interface StreamJobDeps {
	getInsightId: () => string;
	setLoading: (isLoading: boolean) => void;
	setError: (error: Error) => void;
}

/**
 * Owns the full lifecycle of a streaming pixel job: starts it async, polls for
 * chunks, fetches the settled result, and drives everything through callbacks
 * so callers never branch on a sentinel return value. Also the single source
 * of truth for the room's cancel state — a stop is signalled locally and
 * instantly rather than inferred from backend job status. Only one cancellable
 * job (currently AskPlayground) is tracked at a time.
 */
export class StreamJobController {
	private jobId: string | null = null;
	private cancelling = false;
	/** Cancel handler stashed by run(), invoked by stop() on a user stop. */
	private onCancel: (() => void | Promise<void>) | null = null;

	private static readonly POLL_INTERVAL_MS = 500;

	constructor(private readonly deps: StreamJobDeps) {
		makeAutoObservable(this);
	}

	/** A cancellable job is in flight and a cancel hasn't already been issued. */
	get canCancel(): boolean {
		return this.jobId !== null && !this.cancelling;
	}

	/** A stop has been issued and the job is still unwinding. */
	get isCancelling(): boolean {
		return this.cancelling;
	}

	/**
	 * Run a streaming pixel job to completion. Passing `onCancel` opts the job
	 * into cancellation via stop(); otherwise it runs to completion untracked.
	 */
	run = async <O extends unknown[] | []>(
		pixel: string,
		handlers: StreamHandlers<O>,
		options: StreamOptions = {},
	): Promise<void> => {
		const { onEmit, onResult, onCancel } = handlers;
		const { showLoading = true, setErrorOnFail = true } = options;
		const cancellable = onCancel !== undefined;

		try {
			if (showLoading) {
				this.deps.setLoading(true);
			}

			const { jobId } = await runPixelAsync(
				pixel,
				this.deps.getInsightId(),
			);

			if (!jobId) {
				throw new Error("No job ID returned from pixel execution");
			}

			if (cancellable) {
				this.jobId = jobId;
				this.cancelling = false;
				this.onCancel = onCancel;
			}

			let isPolling = true;

			while (isPolling) {
				// A user-initiated stop short-circuits before the next poll so the
				// stream stops instantly. The unwind is silent: stop() owns firing
				// onCancel, so run just stops emitting and never reports a result.
				if (this.cancelling) {
					return;
				}

				const response = await getPixelJobStreaming(jobId);

				if (response && response.message.length > 0) {
					for (const message of response.message) {
						onEmit(message);
					}
				}

				if (
					response.status === "ProgressComplete" ||
					response.status === "Complete"
				) {
					isPolling = false;
				} else if (response.status === "Error") {
					throw new Error("Streaming job encountered an error");
				} else if (response.status === "UnknownJob") {
					// The job is gone from the server. If we stopped it, unwind
					// silently and let stop() fire onCancel; otherwise it vanished
					// unexpectedly and there's nothing to fetch.
					if (this.cancelling) {
						return;
					}
					throw new Error("Streaming job no longer exists");
				}

				if (isPolling) {
					await new Promise((resolve) =>
						setTimeout(
							resolve,
							StreamJobController.POLL_INTERVAL_MS,
						),
					);
				}
			}

			const result = await getPixelAsyncResult<O>(jobId);

			if (result.errors.length > 0) {
				throw new Error(result.errors.join(""));
			}

			onResult(result);
		} catch (e) {
			// A stop that lands while a request is in flight surfaces here — unwind
			// silently and let stop() fire onCancel, not the room error path.
			if (this.cancelling) {
				return;
			}

			console.error(e);

			if (setErrorOnFail) {
				this.deps.setError(e as Error);
			}

			throw e;
		} finally {
			if (showLoading) {
				this.deps.setLoading(false);
			}
			if (cancellable) {
				this.jobId = null;
				this.cancelling = false;
				this.onCancel = null;
			}
		}
	};

	/**
	 * Stop the active cancellable job: flag the poll loop to break (which makes
	 * run() unwind silently), fire StopPixelExecution to abort the backend
	 * stream, then run the stashed onCancel. No-op when nothing cancellable is
	 * in flight.
	 */
	stop = async (): Promise<void> => {
		const jobId = this.jobId;
		if (jobId === null || this.cancelling) {
			return;
		}
		// Capture before any await: run()'s finally may clear onCancel once the
		// poll loop sees cancelling and unwinds.
		const onCancel = this.onCancel;
		this.cancelling = true;
		await runPixel(
			`StopPixelExecution(id=["${jobId}"]);`,
			this.deps.getInsightId(),
		);
		await onCancel?.();
	};
}
