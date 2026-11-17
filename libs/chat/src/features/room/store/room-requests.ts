import { throwOnPixelErrors } from "@semoss/sdk";
import { runPixel } from "@semoss/sdk/react";
import type { StreamOptions } from "./stream-job-controller";

/** Loading and error behavior for a request whose failures throw on their own. */
export type RoomRequestOptions = Omit<StreamOptions, "throwOnError">;

/** A pixel's response, as `runRoomPixel` returns it. */
export interface RoomPixelResponse<O extends [] | unknown[]> {
	/** The pixel's errors; none for a clean run. */
	errors: string[];
	/** The insight it ran in. */
	insightId: string;
	/** Each statement's result. */
	pixelReturn: {
		isMeta: boolean;
		operationType: string[];
		output: O[number];
		pixelExpression: string;
		pixelId: string;
		additionalOutput?: unknown;
		timeToRun: number;
	}[];
}

/** What the request runner needs from its room. */
export interface RoomRequestsDependencies {
	/** The insight to run in, read at each start. */
	getInsightId: () => string;
	/** Set the room's loading state. */
	setLoading: (isLoading: boolean) => void;
	/** Surface a failure on the room, or clear it with null. */
	setError: (error: Error | null) => void;
}

/**
 * Runs the room's one-off pixels and backend requests with the room's
 * loading and error state around them. Streaming jobs are the
 * `StreamJobController`'s.
 */
export class RoomRequests {
	/** What the runner reads from and writes to its room. */
	private readonly deps: RoomRequestsDependencies;

	/**
	 * @param deps - What the runner needs from its room.
	 */
	constructor(deps: RoomRequestsDependencies) {
		this.deps = deps;
	}

	/**
	 * Run a pixel in the room's insight. A run without errors clears the
	 * room's error.
	 *
	 * @param pixel - The pixel to run.
	 * @param options - Loading, error, and throw behavior; see `StreamOptions`.
	 * With `throwOnError: false`, a response with errors is returned for the
	 * caller to inspect per statement, and the room's error is left as it was.
	 * @returns The pixel's response.
	 */
	runPixel = <O extends [] | unknown[]>(
		pixel: string,
		options: StreamOptions = {},
	): Promise<RoomPixelResponse<O>> => {
		const { throwOnError = true } = options;
		return this.track(
			async () => {
				const response = await runPixel<O>(
					pixel,
					this.deps.getInsightId(),
				);
				if (throwOnError) {
					throwOnPixelErrors(response);
				}
				return response;
			},
			options,
			(response) => response.errors.length === 0,
		);
	};

	/**
	 * Run a backend request in the room's insight, such as one of the SDK's
	 * calls. A request that succeeds clears the room's error.
	 *
	 * @param request - The request, given the room's insight.
	 * @param options - Loading and error behavior.
	 * @returns What the request returned.
	 */
	runRequest = <T>(
		request: (insightId: string) => Promise<T>,
		options: RoomRequestOptions = {},
	): Promise<T> =>
		this.track(
			() => request(this.deps.getInsightId()),
			options,
			() => true,
		);

	/**
	 * Keep the room's loading and error state around a request.
	 *
	 * @param run - Runs the request.
	 * @param options - Whether to show loading and keep a failure on the room.
	 * @param isClean - Whether a result that did not throw clears the room's error.
	 * @returns What the request returned.
	 */
	private track = async <T>(
		run: () => Promise<T>,
		options: StreamOptions,
		isClean: (result: T) => boolean,
	): Promise<T> => {
		const { showLoading = true, setErrorOnFail = true } = options;
		try {
			if (showLoading) {
				this.deps.setLoading(true);
			}
			const result = await run();
			// a run that succeeds clears the last failure
			if (isClean(result)) {
				this.deps.setError(null);
			}
			return result;
		} catch (e) {
			if (setErrorOnFail) {
				this.deps.setError(e as Error);
			}
			throw e;
		} finally {
			if (showLoading) {
				this.deps.setLoading(false);
			}
		}
	};
}
