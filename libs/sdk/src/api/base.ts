import { Env } from "../env";
import { CSRF, get, notifySessionRevoked, post } from "../utility";
/**
 * Get the System's configuration information
 */
export const getSystemConfig = async (): Promise<{
	logins: { [key: string]: unknown };
	/**
	 * List of available providers (logins) that are available
	 */
	availableProviders: {
		provider: string;
		name: string;
		isOauth: boolean;
	}[];
	[key: string]: unknown;
}> => {
	// get the response
	const response = await get<{
		logins: { [key: string]: unknown };
		availableProviders: {
			provider: string;
			name: string;
			isOauth: boolean;
		}[];
		[key: string]: unknown;
	}>(`${Env.MODULE}/api/config`);

	if (response.data?.csrf) {
		const token = response.data["X-CSRF-Token"] as string;

		// enable and store the token
		CSRF.isEnabled = true;
		CSRF.token = token;
	}

	// save the config data
	return response.data;
};

/**
 * Run a pixel string
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export const runPixel = async <O extends unknown[] | []>(
	pixel: string,
	insightId?: string,
) => {
	if (!pixel) {
		throw new Error("Missing Pixel");
	}

	const body: Record<string, unknown> = {
		expression: pixel,
	};

	if (insightId) {
		body.insightId = insightId;
	}

	// try to add the timezone
	try {
		body.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {}

	const response = await post<{
		insightID: string;
		pixelReturn: {
			isMeta: boolean;
			operationType: string[];
			output: O[number];
			pixelExpression: string;
			pixelId: string;
			additionalOutput?: unknown;
			timeToRun: number;
		}[];
	}>(`${Env.MODULE}/api/engine/runPixel`, body, {});

	// collect the errors
	const errors: string[] = [];
	for (const p of response.data.pixelReturn) {
		const { output, operationType } = p;

		if (operationType.indexOf("ERROR") > -1) {
			errors.push(output as string);
		}
		if (operationType.indexOf("USER_LOGGED_OUT_ERROR") > -1) {
			notifySessionRevoked(output as string);
		}
	}

	return {
		errors: errors,
		insightId: response.data.insightID,
		pixelReturn: response.data.pixelReturn,
	};
};

/**
 * Asyncronously run a pixel string
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export const runPixelAsync = async (pixel: string, insightId?: string) => {
	if (!pixel) {
		throw Error("No Pixel To Execute");
	}

	const body: Record<string, unknown> = {
		expression: pixel,
	};

	if (insightId) {
		body.insightId = insightId;
	}

	// try to add the timezone
	try {
		body.tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {}

	const response = await post<{
		jobId: string;
	}>(`${Env.MODULE}/api/engine/runPixelAsync`, body, {});

	return {
		jobId: response.data.jobId,
	};
};

/**
 * @name getPixelAsyncResult
 * @description Gets results for async pixel calls
 */
export const getPixelAsyncResult = async <O extends unknown[] | []>(
	jobId: string,
) => {
	if (!jobId) {
		throw Error("No job id provided to get pixel response");
	}

	const body = {
		jobId: jobId,
	};

	const response = await post<{
		insightID: string;
		pixelReturn: {
			isMeta: boolean;
			operationType: string[];
			output: O[number];
			pixelExpression: string;
			pixelId: string;
			additionalOutput?: unknown;
			timeToRun: number;
		}[];
	}>(`${Env.MODULE}/api/engine/result`, body, {});

	// collect the errors
	const errors: string[] = [];
	for (const p of response.data.pixelReturn) {
		const { output, operationType } = p;

		if (operationType.indexOf("ERROR") > -1) {
			errors.push(output as string);
		}
		if (operationType.indexOf("USER_LOGGED_OUT_ERROR") > -1) {
			notifySessionRevoked(output as string);
		}
	}

	return {
		errors: errors,
		insightId: response.data.insightID,
		results: response.data.pixelReturn,
	};
};

/**
 * @deprecated use getPixelJobStreaming
 * Get a partial result from the insight
 * @param insightId - id of the insight to run
 */
export const partial = async (insightId: string) => {
	const response = await post<{
		message: {
			new: string;
			total: string;
		};
		status: string;
	}>(`${Env.MODULE}/api/engine/partial`, {
		jobId: insightId,
	});

	return response.data;
};

/**
 * Get the console message from an insight
 * @param insightId - id of the insight to run
 */
export const console = async (insightId: string) => {
	const response = await post<{
		message: string[];
		status: string;
	}>(`${Env.MODULE}/api/engine/console`, {
		jobId: insightId,
	});

	return response.data;
};

/** A content chunk from a streaming pixel job */
export type PixelStreamContentMessage = {
	stream_type: "content";
	data: {
		/** Incremental content chunk from the LLM */
		content?: string;
		/** Stop reason */
		finish_reason?: string;
	};
};

/** A tool-call chunk from a streaming pixel job */
export type PixelStreamToolMessage = {
	stream_type: "tool";
	data: {
		/** Index of the tool call within this turn */
		index?: number;
		/** Tool call id; present on the opening chunk for a given index */
		id?: string;
		/** Tool call type, typically "function" */
		type?: string;
		/** Function delta — name arrives once, arguments arrive as JSON string chunks */
		function?: {
			name?: string;
			arguments?: string;
		};
		/** Stop reason; present on the final tool chunk */
		finish_reason?: string;
	};
};

/** A thinking chunk from a streaming pixel job */
export type PixelStreamThinkingMessage = {
	stream_type: "thinking";
	data: {
		/** Incremental thinking chunk from the LLM */
		thinking?: string;
		/** Stop reason */
		finish_reason?: string;
	};
};

/** Union of all message chunk types yielded by a streaming pixel job */
export type PixelStreamMessage =
	| PixelStreamContentMessage
	| PixelStreamToolMessage
	| PixelStreamThinkingMessage;

/** Status values returned by the pixelJobStreaming endpoint */
export type PixelJobStreamingStatus =
	| "Created"
	| "Submitted"
	| "Canceled"
	| "InProgress"
	| "ProgressComplete"
	| "Streaming"
	| "Complete"
	| "Paused"
	| "Error"
	| "UnknownJob";

/**
 * Fetch the latest message chunks and status for an async pixel job.
 * Each call returns only the chunks received since the last poll.
 * For a managed polling loop use {@link streamPixelJob} instead.
 *
 * @param jobId - The job ID returned from runPixelAsync
 */
export const getPixelJobStreaming = async (jobId: string) => {
	if (!jobId) {
		throw new Error("No job id provided for streaming");
	}

	const response = await post<{
		message: PixelStreamMessage[];
		status: PixelJobStreamingStatus;
	}>(`${Env.MODULE}/api/engine/pixelJobStreaming`, { jobId });

	return response.data;
};
