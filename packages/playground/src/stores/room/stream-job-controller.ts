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
	/**
	 * When true (default), throw if the settled result carries statement errors.
	 * Pass false for multi-statement pixels where the caller inspects the
	 * per-statement `results` in onResult rather than getting an all-or-nothing
	 * throw.
	 */
	throwOnError?: boolean;
}

interface StreamJobDeps {
	getInsightId: () => string;
	setLoading: (isLoading: boolean) => void;
	setError: (error: Error) => void;
}

/** A cancellable streaming job in flight — enough to abort it and commit. */
interface ActiveJob {
	jobId: string;
	onCancel: () => void | Promise<void>;
}

/**
 * Owns the full lifecycle of a streaming pixel job: starts it async, polls for
 * chunks, fetches the settled result, and drives everything through callbacks
 * so callers never branch on a sentinel return value. Also the single source
 * of truth for the room's cancel state — a stop is signalled locally and
 * instantly rather than inferred from backend job status.
 *
 * Tracks every cancellable job concurrently in flight (e.g. AskPlayground, plus
 * the fan-out of AddPlaygroundToolExecution streams during tool execution).
 * stop() is all-or-nothing, so a single `stopIssued` flag is the cancel signal
 * every cancellable poll loop watches; the job map only tracks what's needed to
 * abort each backend job and run its onCancel.
 */
export class StreamJobController {
	private activeJobs = new Map<string, ActiveJob>();
	private stopIssued = false;

	private static readonly POLL_INTERVAL_MS = 500;

	constructor(private readonly deps: StreamJobDeps) {
		makeAutoObservable(this);
	}

	/** A cancellable job is in flight and a stop hasn't already been issued. */
	get canCancel(): boolean {
		return this.activeJobs.size > 0 && !this.stopIssued;
	}

	/** A stop has been issued and jobs are still unwinding. */
	get isCancelling(): boolean {
		return this.stopIssued;
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
		const {
			showLoading = true,
			setErrorOnFail = true,
			throwOnError = true,
		} = options;
		const cancellable = onCancel !== undefined;

		// Key of this run's entry in activeJobs, set once cancellable + started.
		let trackedJobId: string | null = null;

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
				trackedJobId = jobId;
				this.activeJobs.set(jobId, { jobId, onCancel });
			}

			let isPolling = true;

			while (isPolling) {
				// A user-initiated stop short-circuits before the next poll so the
				// stream stops instantly. The unwind is silent: stop() owns firing
				// onCancel, so run just stops emitting and never reports a result.
				// Only cancellable runs honor the flag — untracked streams finish.
				if (cancellable && this.stopIssued) {
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
					if (cancellable && this.stopIssued) {
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

			if (throwOnError && result.errors.length > 0) {
				throw new Error(result.errors.join(""));
			}

			onResult(result);
		} catch (e) {
			// A stop that lands while a request is in flight surfaces here — unwind
			// silently and let stop() fire onCancel, not the room error path.
			if (cancellable && this.stopIssued) {
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
			if (trackedJobId !== null) {
				this.activeJobs.delete(trackedJobId);
				// Once the last cancellable job drains, clear the stop flag so a
				// fresh turn starts clean.
				if (this.activeJobs.size === 0) {
					this.stopIssued = false;
				}
			}
		}
	};

	/**
	 * Stop every cancellable job in flight: flag the poll loops to break (which
	 * makes run() unwind silently), fire StopPixelExecution to abort each backend
	 * stream, then run each stashed onCancel. No-op when nothing cancellable is
	 * in flight or a stop is already underway.
	 */
	stop = async (): Promise<void> => {
		if (this.activeJobs.size === 0 || this.stopIssued) {
			return;
		}
		this.stopIssued = true;
		// Snapshot before awaits: run()'s finally mutates activeJobs as loops
		// unwind.
		const jobs = [...this.activeJobs.values()];
		await Promise.all(
			jobs.map(async ({ jobId, onCancel }) => {
				await runPixel(
					`StopPixelExecution(id=["${jobId}"]);`,
					this.deps.getInsightId(),
				);
				await onCancel();
			}),
		);
	};
}
