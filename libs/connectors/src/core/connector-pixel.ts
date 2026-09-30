import { runPixel } from "@semoss/sdk";

/**
 * The operation type the backend adds when a reactor needs the user to sign
 * in first. The misspelling is the backend's.
 */
const LOGIN_REQUIRED_TYPES = ["LOGGIN_REQUIRED_ERROR", "LOGIN_REQUIRED_ERROR"];

/** How a Graph failure reads once the backend has wrapped it. */
const HTTP_STATUS = /returned HTTP (\d{3})/;

/** The detail the backend appends to a Graph failure, too raw to show. */
const RESPONSE_BODY = /\.?\s*Response body:[\s\S]*$/;

/** How Google says a sign in lacks the permission a call needs. */
const INSUFFICIENT_SCOPE =
	/ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficientPermissions|insufficient authentication scopes/i;

/** Raised when the account the reactor acts with has to sign in first. */
export class ConnectorSignInError extends Error {
	/**
	 * @param provider - The provider to sign in to, such as `MICROSOFT`.
	 * @param message - The backend's explanation.
	 */
	constructor(
		readonly provider: string,
		message: string,
	) {
		super(message);
		this.name = "ConnectorSignInError";
	}
}

/**
 * What went wrong, sorted into what the viewers explain differently:
 *
 * - `signIn`: the account has to sign in, or sign in again.
 * - `forbidden`: the account may not see the item.
 * - `scope`: the account signed in without permission for this app, which an
 *   administrator grants in the server's sign in settings.
 * - `notFound`: the item is gone.
 * - `throttled`: Microsoft is limiting requests.
 * - `other`: anything else, with the backend's message.
 */
export interface ConnectorErrorInfo {
	kind: "signIn" | "forbidden" | "scope" | "notFound" | "throttled" | "other";
	/** The backend's message, without Graph's raw response. */
	message: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Sort a failure into the kinds the viewers explain.
 *
 * Graph answering 401 counts as needing a sign in: the backend treats a token
 * without an expiry as valid, so a stale token surfaces that way rather than
 * as a sign in error.
 *
 * @param error - Whatever a connector call threw.
 * @return The kind of failure and its message.
 */
export const classifyConnectorError = (error: unknown): ConnectorErrorInfo => {
	if (error instanceof ConnectorSignInError) {
		return { kind: "signIn", message: error.message };
	}
	const raw = error instanceof Error ? error.message : String(error);
	const message = raw.replace(RESPONSE_BODY, "").trim();
	const status = Number(HTTP_STATUS.exec(raw)?.[1]);
	if (status === 401) {
		return { kind: "signIn", message: message };
	}
	if (status === 403) {
		return {
			kind: INSUFFICIENT_SCOPE.test(raw) ? "scope" : "forbidden",
			message: message,
		};
	}
	if (status === 404) {
		return { kind: "notFound", message: message };
	}
	if (status === 429) {
		return { kind: "throttled", message: message };
	}
	return { kind: "other", message: message };
};

/**
 * A failure something other than {@link runConnectorPixel} reported, such as
 * the file explorer's Pixel hook, as the viewers explain it. That hook reads
 * the backend's sign in details as its message, in JSON.
 *
 * @param error - What the Pixel hook reported.
 * @return A {@link ConnectorSignInError} for a sign in, or the error as it was.
 */
export const toConnectorError = (error: unknown): unknown => {
	if (!(error instanceof Error) || error instanceof ConnectorSignInError) {
		return error;
	}
	try {
		const details: unknown = JSON.parse(error.message);
		if (
			isRecord(details) &&
			typeof details.type === "string" &&
			typeof details.message === "string"
		) {
			return new ConnectorSignInError(details.type, details.message);
		}
	} catch {
		// a plain message rather than sign in details
	}
	return error;
};

const ERROR_KEYS: Record<ConnectorErrorInfo["kind"], string> = {
	signIn: "errors.signIn",
	forbidden: "errors.forbidden",
	scope: "errors.scope",
	notFound: "errors.notFound",
	throttled: "errors.throttled",
	other: "errors.other",
};

/**
 * The `connectors` translation key that explains a failure. Every key takes
 * the backend's message as `message`.
 *
 * @param info - The failure.
 * @return The translation key.
 */
export const getConnectorErrorKey = (info: ConnectorErrorInfo): string =>
	ERROR_KEYS[info.kind];

/**
 * Run one reactor against an insight and resolve to its output.
 *
 * @param pixel - A single reactor call.
 * @param insightId - The insight to run in. Downloads land in its folder.
 * @return The reactor's output.
 * @throws ConnectorSignInError when the account has to sign in, or Error with
 * the backend's message for any other failure.
 */
export const runConnectorPixel = async (
	pixel: string,
	insightId: string,
): Promise<unknown> => {
	const { pixelReturn } = await runPixel<[unknown]>(pixel, insightId);
	const result = pixelReturn[0];
	if (!result) {
		throw new Error("The server did not answer.");
	}

	const types = result.operationType ?? [];
	if (types.some((type) => LOGIN_REQUIRED_TYPES.includes(type))) {
		const details = isRecord(result.output) ? result.output : {};
		throw new ConnectorSignInError(
			typeof details.type === "string" ? details.type : "MICROSOFT",
			typeof details.message === "string"
				? details.message
				: "Sign in to continue.",
		);
	}
	if (types.some((type) => type.includes("ERROR"))) {
		throw new Error(
			typeof result.output === "string"
				? result.output
				: JSON.stringify(result.output),
		);
	}
	return result.output;
};
