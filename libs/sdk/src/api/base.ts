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
