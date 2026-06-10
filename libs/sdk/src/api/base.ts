import { Env } from "../env";
import { CSRF, get, post } from "../utility";
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

/**
 * Get streaming output from an async pixel job (LLM responses)
 * Poll this endpoint until a message with `finish_reason` is received
 *
 * @param jobId - The job ID returned from runPixelAsync
 * @returns Streaming response with message chunks and status
 */
export const getPixelJobStreaming = async (jobId: string) => {
	if (!jobId) {
		throw new Error("No job id provided for streaming");
	}

	const response = await post<{
		/** Array of streaming messages received since last poll */
		message: (
			| {
					/** Type of stream message */
					stream_type: "content";
					/** Data payload for the message */
					data: {
						/** Incremental content chunk from the LLM */
						content?: string;

						/** Stop reason*/
						finish_reason?: string;
					};
			  }
			| {
					/** Type of stream message */
					stream_type: "tool";
					/** Data payload for the message */
					data: {
						/** Index of the tool call within this turn (used to associate deltas) */
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
			  }
			| {
					/** Type of stream message */
					stream_type: "thinking";
					/** Data payload for the message */
					data: {
						/** Incremental content chunk from the LLM */
						thinking?: string;

						/** Stop reason*/
						finish_reason?: string;
					};
			  }
		)[];
		/** Status of the streaming job */
		status:
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
	}>(`${Env.MODULE}/api/engine/pixelJobStreaming`, { jobId });

	return response.data;
};

/**
 * Cancel a running async pixel job by firing StopPixelExecution on the backend.
 * Safe to call even if the job has already completed — the reactor handles that gracefully.
 *
 * @param jobId - The job ID returned from runPixelAsync
 * @param insightId - The insight the job is running under
 */
export const cancelPixelJob = async (
	jobId: string,
	insightId: string,
): Promise<void> => {
	if (!jobId) return;
	try {
		await runPixel(`StopPixelExecution(id=["${jobId}"]);`, insightId);
	} catch {
		// best-effort — if the job is already done or the call fails, ignore
	}
};

/**
 * Persist a cancelled turn's partial assistant response (plus a hidden
 * user-note/assistant-ack round-trip) into the room's message history.
 *
 * Called by the FE after StopPixelExecution to commit whatever the user
 * actually saw on screen so the next AskPlayground call has correct context.
 *
 * @param engineId        - Model engine the AskPlayground call was using
 * @param roomId          - The room id
 * @param userPrompt      - The user's question that was cancelled mid-response
 * @param partialResponse - The streamed assistant text the FE accumulated
 *   before the user clicked stop. Pass "" if nothing streamed.
 * @param parentMessageId - Optional parent message id for the chain
 * @param insightId       - The insight the call is running under
 */
export const recordCancelledTurn = async (
	engineId: string,
	roomId: string,
	userPrompt: string,
	partialResponse: string,
	parentMessageId: string | undefined,
	insightId: string,
): Promise<void> => {
	const parentArg = parentMessageId
		? `, parentMessageId=["${parentMessageId}"]`
		: "";
	await runPixel(
		`RecordCancelledTurn(engine=["${engineId}"], roomId=["${roomId}"], command=["<encode>${userPrompt}</encode>"], partialResponse=["<encode>${partialResponse}</encode>"]${parentArg});`,
		insightId,
	);
};
