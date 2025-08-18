import { Env } from "../env";
import { get, interceptors, post, UnauthorizedError } from "../utility";

const CSRF = {
	isEnabled: false,
	token: "",
};

// set up the request interceptor
interceptors.request = async (options) => {
	if (Env.ACCESS_KEY && Env.SECRET_KEY) {
		// create the headeres
		if (!options.headers) {
			options.headers = {};
		}

		// add the authorization tokens
		options.headers = {
			...options.headers,
			authorization: `Basic ${btoa(
				`${Env.ACCESS_KEY}:${Env.SECRET_KEY}`,
			)}`,
		};
	}

	// only set if enabled
	if (CSRF.isEnabled || Env.CSRF) {
		if (options.method === "POST") {
			// ensure headers object exists
			if (!options.headers) {
				options.headers = {};
			}
			// use the token if it is there otherwise fetch it
			if (!CSRF.token) {
				try {
					const response = await fetch(
						`${Env.MODULE}/api/config/fetchCsrf`,
						{
							headers: {
								"X-CSRF-Token": "fetch",
							},
						},
					);
					// not sure why the proxy server is sending it as lowercase, preserving headers doesn't fix it
					CSRF.token =
						response.headers.get("X-CSRF-Token") ||
						response.headers.get("x-csrf-token") ||
						"";
				} catch (error) {
					if (error instanceof Error) {
						throw error;
					}
					throw Error("Failed to fetch CSRF token:");
					CSRF.token = "";
				}
			}

			// add the token
			if (CSRF.token) {
				options.headers = {
					...options.headers,
					"X-CSRF-Token": CSRF.token,
				};
			}
		}
	}

	// 		if (!CSRF.token) {
	// 			const { response } = await get(
	// 				`${Env.MODULE}/api/config/fetchCsrf`,
	// 				{
	// 					headers: {
	// 						"X-CSRF-Token": "fetch",
	// 					},
	// 				},
	// 			);

	// 			CSRF.token =
	// 				response.headers.get("X-CSRF-Token") ||
	// 				response.headers.get("x-csrf-token") ||
	// 				"";
	// 		}

	// 		if (options.headers) {
	// 			options.headers = {
	// 				...options.headers,
	// 				"X-CSRF-Token": CSRF.token,
	// 			};
	// 		}
	// 	}
	// }

	return options;
};

// setup the response interceptor
interceptors.response = async ({ response }) => {
	if (response.status === 302) {
		throw new UnauthorizedError("Unauthorized");
	}
};

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

	if (response.data && response.data.csrf) {
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

	// build the expression
	let postData = "";

	postData += "expression=" + encodeURIComponent(pixel);
	if (insightId) {
		postData += "&insightId=" + encodeURIComponent(insightId);
	}

	try {
		const response = await fetch(`${Env.MODULE}/api/engine/runPixelAsync`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"X-CSRF-Token": CSRF.token,
			},
			body: postData,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw Error(errorData.errorMessage || "Failed to run pixel");
		}

		const data = await response.json();

		if (!data) {
			throw Error("No Pixel Response");
		}

		return {
			jobId: data.jobId,
		};
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw Error("An unknown error occurred");
	}
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

	const body = new URLSearchParams();
	body.append("jobId", jobId);

	try {
		const response = await fetch(`${Env.MODULE}/api/engine/result`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"X-CSRF-Token": CSRF.token,
			},
			body: body,
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw Error(
				errorData.errorMessage || "Failed to get pixel response",
			);
		}

		const data = (await response.json()) as {
			insightID: string;
			pixelReturn: {
				operationType: string[];
				output: O[number];
				pixelExpression: string;
			}[];
		};

		// there was no response, that is an error
		if (!data) {
			throw Error("No Pixel Response");
		}

		const errors: string[] = [];

		// collect the errors
		for (const p of data.pixelReturn) {
			const { output, operationType } = p;

			if (operationType.indexOf("ERROR") > -1) {
				errors.push(output as string);
			}
		}

		return {
			errors: errors,
			insightId: data.insightID,
			results: data.pixelReturn,
		};
	} catch (error) {
		if (error instanceof Error) {
			throw error;
		}
		throw Error("An unknown error occurred");
	}
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
