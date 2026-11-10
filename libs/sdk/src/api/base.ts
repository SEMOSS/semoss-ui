import { Env } from "../env";
import { CSRF, get, post } from "../utility";
import type { OutputOf, Pixel } from "./pixel";
/**
 * Get the System's configuration information
 */
export const getSystemConfig = async () => {
	// get the response
	// nulls are left out of backend responses, so a field that may be null is optional
	const response = await get<{
		/**
		 * The session's logins: the account name by provider, keyed by its
		 * upper case label such as `NATIVE` or `MICROSOFT`. Empty when signed
		 * out.
		 */
		logins: { [key: string]: string };
		/** The user id and name of each login, keyed like `logins`. Empty when signed out. */
		loginDetails: {
			[key: string]: {
				id: string;
				name: string;
				san?: Record<string, string>;
			};
		};
		/** The login the session belongs to, in upper case. Only sent when signed in. */
		primaryLogin?: string;
		/**
		 * What each OAuth sign in lets connectors use, by provider and app. Only
		 * sent for a signed in, non anonymous user.
		 */
		connectorAccess?: { [provider: string]: { [app: string]: boolean } };
		/**
		 * List of available providers (logins) that are available
		 */
		availableProviders: {
			/** The provider's lower case key, such as `native` or `ms`. */
			provider: string;
			/** The name shown for it. */
			name: string;
			/** The provider's upper case label, such as `NATIVE` or `MICROSOFT`. */
			label: string;
			isOauth: boolean;
		}[];
		/** Catalog metadata fields for engines */
		databaseMetaKeys: {
			metakey: string;
			display_order: number;
			single_multi: string;
			display_options?: string;
			display_values?: string;
		}[];
		/** Catalog metadata fields for projects */
		projectMetaKeys: {
			metakey: string;
			display_order: number;
			single_multi: string;
			display_options?: string;
			display_values?: string;
		}[];
		/** The active admin theme, or empty when there is none. */
		theme: {
			ID?: string;
			THEME_NAME?: string;
			/** The theme as a JSON string. */
			THEME_MAP?: string;
			IS_ACTIVE?: boolean;
		};
		/** Left out when the server cannot read its version. */
		version?: { version: string; datetime: string };
		/** Whether people may create native accounts. */
		nativeRegistration: boolean;
		/** Whether people searches can look in the organization's Microsoft directory */
		msGraphLookup: boolean;
		/** Whether requests must carry a CSRF token. */
		csrf: boolean;
		/** Whether the server can run R. */
		r: boolean;
		/** Whether the server can run Python. */
		python: boolean;
		/** Whether people who have not signed in may use the server. */
		anonymousUsers: boolean;
		/** Whether in-app notifications are on. */
		notificationEnabled: boolean;
		/** Whether only admins see the menu bar. */
		adminOnlyViewMenuBarFlag: boolean;
		/** Whether the audit log is on. */
		auditLogEnabled: boolean;
		/** How many minutes an idle session lasts. */
		timeout: number;
		/** The password rules for native accounts; left out when they cannot be read. */
		passwordRequirements?: {
			minPassLength: number;
			requireUpperCase: boolean;
			requireLowerCase: boolean;
			requireNumeric: boolean;
			requireSpecial: boolean;
			passwordExpirationDays: number;
			requireAdminResetForExpiration: boolean;
			allowUserChangePassword: boolean;
			passReuseCount: number;
			daysToLock: number;
			daysToLockEmail: number;
		};
		[key: string]: unknown;
	}>(`${Env.MODULE}/api/config`);

	if (response.data?.csrf) {
		// enable csrf; the config does not carry the token, so a token already
		// fetched through /api/config/fetchCsrf is kept rather than cleared
		CSRF.isEnabled = true;
		const token = response.data["X-CSRF-Token"];
		if (typeof token === "string" && token) {
			CSRF.token = token;
		}
	}

	// save the config data
	return response.data;
};

/** One statement's result in a Pixel response. */
export interface PixelReturn<O = unknown> {
	isMeta: boolean;
	operationType: string[];
	output: O;
	pixelExpression: string;
	pixelId: string;
	additionalOutput?: unknown;
	timeToRun: number;
}

/** What {@link runPixel} resolves with. */
export interface PixelResult<O extends unknown[] | []> {
	/** The output of every statement whose operation type is an error. */
	errors: string[];
	insightId: string;
	pixelReturn: PixelReturn<O[number]>[];
}

/**
 * Run a Pixel built by `buildPixel`. Its output is typed from the reactor's contract;
 * check `errors` (or use `readPixelOutput`) before trusting it.
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
// Two type parameters, so one type argument (`runPixel<[Foo]>` or
// `typeof runPixel<O>`) always picks the plain-string signature below. `R` has
// nothing to infer from, so it is the reactor's output.
export function runPixel<P extends Pixel, R extends OutputOf<P>>(
	pixel: P,
	insightId?: string,
): Promise<PixelResult<[R]>>;
/**
 * Run a pixel string
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export function runPixel<O extends unknown[] | []>(
	pixel: string,
	insightId?: string,
): Promise<PixelResult<O>>;
export async function runPixel<O extends unknown[] | []>(
	pixel: string,
	insightId?: string,
): Promise<PixelResult<O>> {
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
		pixelReturn: PixelReturn<O[number]>[];
	}>(`${Env.MODULE}/api/engine/runPixel`, body, {});

	// collect the errors
	const errors: string[] = [];
	for (const p of response.data.pixelReturn) {
		const { output, operationType } = p;

		if (operationType.indexOf("ERROR") > -1) {
			// output isn't always a string - avoid "[object Object]"
			errors.push(
				typeof output === "string" ? output : JSON.stringify(output),
			);
		}
	}

	return {
		errors: errors,
		insightId: response.data.insightID,
		pixelReturn: response.data.pixelReturn,
	};
}

declare const pixelJobOutputs: unique symbol;

/**
 * The id of an async job started from a Pixel built by `buildPixel`. It is still
 * a plain string at runtime; the type remembers the outputs, so
 * `getPixelAsyncResult` can type them.
 */
export type PixelJobId<O extends unknown[] | []> = string & {
	readonly [pixelJobOutputs]: O;
};

/** What {@link getPixelAsyncResult} resolves with. */
export interface PixelAsyncResult<O extends unknown[] | []> {
	/** The output of every statement whose operation type is an error. */
	errors: string[];
	insightId: string;
	results: PixelReturn<O[number]>[];
}

// Two type parameters, so that one type argument always picks the
// plain-string signature below. `R` has nothing to infer from, so it is the
// reactor's output.
/**
 * Asyncronously run a Pixel built by `buildPixel`. Its job id remembers the
 * reactor, so `getPixelAsyncResult` types the result.
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export function runPixelAsync<P extends Pixel, R extends OutputOf<P>>(
	pixel: P,
	insightId?: string,
): Promise<{ jobId: PixelJobId<[R]> }>;
/**
 * Asyncronously run a pixel string
 *
 * @param pixel - pixel
 * @param insightId - id of the insight to run
 */
export function runPixelAsync(
	pixel: string,
	insightId?: string,
): Promise<{ jobId: string }>;
export async function runPixelAsync(
	pixel: string,
	insightId?: string,
): Promise<{ jobId: string }> {
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
}

/**
 * Gets the typed results of a job started with `runPixelAsync(buildPixel(...))`.
 */
export function getPixelAsyncResult<
	J extends PixelJobId<unknown[] | []>,
	O extends J extends PixelJobId<infer Q> ? Q : never,
>(jobId: J): Promise<PixelAsyncResult<O>>;
/**
 * @name getPixelAsyncResult
 * @description Gets results for async pixel calls
 */
export function getPixelAsyncResult<O extends unknown[] | []>(
	jobId: string,
): Promise<PixelAsyncResult<O>>;
export async function getPixelAsyncResult<O extends unknown[] | []>(
	jobId: string,
): Promise<PixelAsyncResult<O>> {
	if (!jobId) {
		throw Error("No job id provided to get pixel response");
	}

	const body = {
		jobId: jobId,
	};

	const response = await post<{
		insightID: string;
		pixelReturn: PixelReturn<O[number]>[];
	}>(`${Env.MODULE}/api/engine/result`, body, {});

	// collect the errors
	const errors: string[] = [];
	for (const p of response.data.pixelReturn) {
		const { output, operationType } = p;

		if (operationType.indexOf("ERROR") > -1) {
			// output isn't always a string - avoid "[object Object]"
			errors.push(
				typeof output === "string" ? output : JSON.stringify(output),
			);
		}
	}

	return {
		errors: errors,
		insightId: response.data.insightID,
		results: response.data.pixelReturn,
	};
}

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

/** A token usage chunk from a streaming pixel job */
export type PixelStreamUsageMessage = {
	stream_type: "usage";
	data: {
		/** Tokens in the prompt */
		input_tokens?: number;
		/** Tokens in the response */
		output_tokens?: number;
	};
};

/** Union of all message chunk types yielded by a streaming pixel job */
export type PixelStreamMessage =
	| PixelStreamContentMessage
	| PixelStreamToolMessage
	| PixelStreamThinkingMessage
	| PixelStreamUsageMessage;

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
