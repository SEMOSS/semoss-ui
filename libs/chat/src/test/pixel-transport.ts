import { afterEach, beforeEach } from "vitest";

/** One statement of a pixel answer, as a test writes it. */
interface Statement {
	output?: unknown;
	operationType?: string[];
	[key: string]: unknown;
}

/** A pixel answer, shaped like `runPixel`'s or `getPixelAsyncResult`'s return. */
interface PixelAnswer {
	errors?: string[];
	insightId?: string;
	pixelReturn?: Statement[];
	results?: Statement[];
}

/** A test's stand-ins for the SDK's transport, shaped like the SDK functions they replace. */
export interface PixelTransport {
	/** Answers `runPixel(pixel, insightId)`. */
	runPixel?: (pixel: string, insightId?: string) => unknown;
	/** Answers `runPixelAsync(pixel, insightId)` with `{ jobId }`. */
	runPixelAsync?: (pixel: string, insightId?: string) => unknown;
	/** Answers `console(jobId)` with `{ message, status }`. */
	console?: (jobId: string) => unknown;
	/** Answers `getPixelAsyncResult(jobId)`. */
	getPixelAsyncResult?: (jobId: string) => unknown;
}

/**
 * The statements of an answer as the backend sends them: its errors are
 * statements whose type is `ERROR`, which is how the SDK finds them.
 *
 * @param statements - The answer's statements.
 * @param errors - The answer's errors.
 * @returns The statements the backend would send.
 */
const toBackendStatements = (
	statements: Statement[] = [],
	errors: string[] = [],
): Statement[] => {
	const sent = statements.map((statement) => ({
		isMeta: false,
		pixelExpression: "",
		pixelId: "",
		timeToRun: 0,
		...statement,
		operationType: statement.operationType ?? [],
	}));
	const hasErrorStatement = sent.some((statement) =>
		statement.operationType.includes("ERROR"),
	);
	if (hasErrorStatement) {
		return sent;
	}
	return [
		...sent,
		...errors.map((error) => ({
			output: error,
			operationType: ["ERROR"],
			isMeta: false,
			pixelExpression: "",
			pixelId: "",
			timeToRun: 0,
		})),
	];
};

/**
 * A JSON response.
 *
 * @param data - The body.
 * @returns The response.
 */
const json = (data: unknown): Response =>
	new Response(JSON.stringify(data), {
		status: 200,
		headers: { "content-type": "application/json" },
	});

/**
 * Answer one request the SDK sends.
 *
 * @param transport - The test's stand-ins.
 * @param url - Where the request goes.
 * @param body - Its form fields.
 * @returns The backend's response.
 */
const answer = async (
	transport: PixelTransport,
	url: string,
	body: URLSearchParams,
): Promise<Response> => {
	const expression = body.get("expression") ?? "";
	const insightId = body.get("insightId") ?? undefined;
	const jobId = body.get("jobId") ?? "";

	if (url.endsWith("/api/engine/runPixel") && transport.runPixel) {
		const reply = (await transport.runPixel(expression, insightId)) as
			| PixelAnswer
			| undefined;
		return json({
			insightID: reply?.insightId ?? insightId,
			pixelReturn: toBackendStatements(reply?.pixelReturn, reply?.errors),
		});
	}
	if (url.endsWith("/api/engine/runPixelAsync") && transport.runPixelAsync) {
		return json(await transport.runPixelAsync(expression, insightId));
	}
	if (url.endsWith("/api/engine/console") && transport.console) {
		return json(await transport.console(jobId));
	}
	if (url.endsWith("/api/engine/result") && transport.getPixelAsyncResult) {
		const reply = (await transport.getPixelAsyncResult(jobId)) as
			| PixelAnswer
			| undefined;
		return json({
			insightID: reply?.insightId,
			pixelReturn: toBackendStatements(reply?.results, reply?.errors),
		});
	}
	throw new Error(`The test serves no request to ${url}`);
};

/**
 * Serve the pixel requests the SDK's own functions send, such as
 * `loadPlaygroundRoom`, from the test's stand-ins for `runPixel` and its kin,
 * for every test in the file. A test that mocks `runPixel` from
 * `@semoss/sdk/react` keeps answering, and asserting on, every pixel the room
 * sends, whether the chat runs it itself or an SDK function does.
 *
 * @param transport - The stand-ins, read on every request.
 */
export const servePixelTransport = (transport: PixelTransport): void => {
	let original: typeof fetch;

	beforeEach(() => {
		original = globalThis.fetch;
		globalThis.fetch = (async (
			input: RequestInfo | URL,
			init?: RequestInit,
		) =>
			answer(
				transport,
				String(input),
				new URLSearchParams(
					typeof init?.body === "string" ? init.body : "",
				),
			)) as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = original;
	});
};
