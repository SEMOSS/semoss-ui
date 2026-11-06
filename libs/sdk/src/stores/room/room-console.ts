import {
	getPixelAsyncResult,
	console as getPixelConsole,
	runPixelAsync,
} from "../../api/base";

/**
 * Run a pixel as a job and collect its stdout/stderr while it runs, the way
 * the terminal REPL does, so a caller gets the logs and the raw results.
 *
 * @param insightId - The insight to run in.
 * @param pixel - The pixel.
 * @param onConsole - Called with the logs so far after each poll.
 * @param maxLogChars - Stop collecting after this many characters, so a
 * runaway job cannot flood the view; 0 or undefined for no cap.
 * @returns The job's errors, results and logs.
 */
export const runPixelWithConsole = async (
	insightId: string,
	pixel: string,
	onConsole?: (logs: string[]) => void,
	maxLogChars?: number,
) => {
	const { jobId } = await runPixelAsync(pixel, insightId);
	if (!jobId) {
		throw new Error("No job id returned for pixel execution");
	}

	// the console endpoint drains its buffer per call, so logs accumulate
	const logs: string[] = [];
	let logChars = 0;
	let logsTruncated = false;
	const appendLogs = (incoming: string[]) => {
		if (logsTruncated) {
			return;
		}
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

	let polling = true;
	while (polling) {
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
				polling = false;
			} else {
				await new Promise((r) => setTimeout(r, 1000));
			}
		} catch {
			polling = false;
		}
	}

	// logs written between the last poll and completion
	try {
		const { message } = await getPixelConsole(jobId);
		if (message?.length) {
			appendLogs(message);
			onConsole?.(logs.slice());
		}
	} catch {
		// ignore
	}

	const { errors, results } = await getPixelAsyncResult(jobId);
	return { errors, results, logs };
};
