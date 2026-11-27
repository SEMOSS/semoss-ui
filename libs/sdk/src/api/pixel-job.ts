import { sleep } from "@semoss/utility/async";
import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixel,
	runPixelAsync,
} from "./base";

// -------------------------------------------------------------------------------------------------
// Pixel jobs: pixels started with `runPixelAsync`, stopped, or run while their console is read.
// -------------------------------------------------------------------------------------------------

/**
 * Stop a pixel job (`StopPixelExecution`), such as a streaming chat turn.
 * A job the backend cannot stop, as when it has already finished, reports an
 * error that a caller stopping it can ignore, so it is returned rather than
 * thrown.
 *
 * @param insightId - The insight the job runs in.
 * @param jobId - The job, from `runPixelAsync`.
 * @returns Whether the backend stopped it without an error.
 * @throws When the request itself fails.
 */
export const stopPixelJob = async (
	insightId: string,
	jobId: string,
): Promise<boolean> => {
	const { errors } = await runPixel(
		`StopPixelExecution(id=["${jobId}"]);`,
		insightId,
	);
	return errors.length === 0;
};

/** How {@link runPixelWithConsole} reads a job's console. */
export interface PixelConsoleOptions {
	/** Called with every line read so far, each time new lines arrive. */
	onConsole?: (logs: string[]) => void;
	/**
	 * The most characters of console output to keep. Once reached, a line
	 * saying the logs were cut is added and no more are kept. 0 or none keeps
	 * every line.
	 */
	maxLogChars?: number;
	/** How long to wait between reads of the console, in milliseconds. */
	intervalMs?: number;
}

/** What {@link runPixelWithConsole} returns. */
export interface PixelConsoleRun<O extends unknown[] | []> {
	/** Each statement's error. */
	errors: string[];
	/** Each statement's result. */
	results: Awaited<ReturnType<typeof getPixelAsyncResult<O>>>["results"];
	/** The console lines the job wrote, as they were kept. */
	logs: string[];
}

/**
 * Run a pixel as a job and read the console it writes (stdout and stderr)
 * while it runs, the way a terminal does, then read its result. The console
 * endpoint hands out each line once, so the lines are gathered here.
 *
 * @param insightId - The insight to run in.
 * @param pixel - The pixel.
 * @param options - Where the lines go, how many to keep, and how often to read.
 * @returns The job's errors, results and console lines.
 * @throws When the job cannot start or its result cannot be read.
 */
export const runPixelWithConsole = async <O extends unknown[] | []>(
	insightId: string,
	pixel: string,
	options: PixelConsoleOptions = {},
): Promise<PixelConsoleRun<O>> => {
	const { onConsole, maxLogChars, intervalMs = 1000 } = options;

	const { jobId } = await runPixelAsync(pixel, insightId);
	if (!jobId) {
		throw new Error("No job id returned for pixel execution");
	}

	const logs: string[] = [];
	let logChars = 0;
	let logsTruncated = false;
	/**
	 * Keep the lines read, until the limit.
	 *
	 * @param incoming - The lines read this time.
	 */
	const appendLogs = (incoming: string[]): void => {
		if (logsTruncated) return;
		for (const line of incoming) {
			if (maxLogChars && logChars >= maxLogChars) {
				logs.push(
					`… logs truncated (exceeded ${maxLogChars.toLocaleString()} characters)`,
				);
				logsTruncated = true;
				break;
			}
			logs.push(line);
			logChars += line.length;
		}
	};

	let isPolling = true;
	while (isPolling) {
		try {
			const { message, status } = await getPixelConsole(jobId);
			if (message?.length) {
				appendLogs(message);
				onConsole?.(logs.slice());
			}
			if (
				status === "Complete" ||
				status === "ProgressComplete" ||
				status === "Streaming"
			) {
				isPolling = false;
			} else {
				await sleep(intervalMs);
			}
		} catch {
			isPolling = false;
		}
	}

	// the lines written between the last read and the end
	try {
		const { message } = await getPixelConsole(jobId);
		if (message?.length) {
			appendLogs(message);
			onConsole?.(logs.slice());
		}
	} catch {
		// the result below still says how the job went
	}

	const { errors, results } = await getPixelAsyncResult<O>(jobId);
	return { errors: errors, results: results, logs: logs };
};
