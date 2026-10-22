/**
 * Remote browser sessions — `/api/browser-sessions`.
 *
 * Backend: `RemoteBrowserSessionController`
 * (Monolith/src/prerna/remoteviewer/api/RemoteBrowserSessionController.java).
 * Sessions are isolated Playwright browsers managed by
 * `RemoteBrowserSessionManager` (Semoss/src/prerna/remoteviewer/service); the
 * live view and input run over the `/browserSocket/{sessionId}` WebSocket,
 * which this package does not wrap.
 *
 * A session can only be read or closed by the user who created it. Errors are
 * `{ error }` bodies, so `ApiError.message` is the server's `error` text and
 * `ApiError.data` keeps the raw body: 401 invalid session, 403 not the owner,
 * 404 unknown session, 400 bad input, 429 too many sessions, 500 failure.
 */

import type { RequestOptions } from "../../types";
import { del, get, post } from "../../utility/http";
import { path } from "../../utility/url";

/**
 * Starts a new isolated browser session for the caller and navigates it to
 * `url` (checked against the URL safety rules).
 *
 * @name postBrowserSessions
 * @endpoint POST /api/browser-sessions
 * @source Monolith/src/prerna/remoteviewer/api/RemoteBrowserSessionController.java#createSession
 * @param params - JSON body.
 * @param params.url - Page to open. Required unless `preserveExisting` is `true`.
 * @param params.viewportWidth - Viewport width in pixels (`0` / omitted for the default).
 * @param params.viewportHeight - Viewport height in pixels (`0` / omitted for the default).
 * @param params.preserveExisting - Allow an empty `url` and keep whatever the manager reuses.
 * @param options - Per-call overrides (signal, headers).
 * @returns The new session id, the WebSocket path to connect to, the viewport and the page's current URL (`""` if unreadable).
 * @throws {ApiError} 400 for a bad body, a missing or unsafe `url`; 401 if the session is invalid; 429 if the caller has too many sessions; 500 if the browser fails to start.
 */
export function postBrowserSessions(
	params: {
		url?: string;
		viewportWidth?: number;
		viewportHeight?: number;
		preserveExisting?: boolean;
	},
	options?: RequestOptions,
): Promise<{
	sessionId: string;
	/** `/browserSocket/{sessionId}`. */
	webSocketUrl: string;
	viewport: { width: number; height: number; deviceScaleFactor: number };
	currentUrl: string;
}> {
	return post(path`/api/browser-sessions`, params, options, {
		bodyType: "json",
	});
}

/**
 * Returns the user actions recorded in a session (clicks, typing, navigation).
 *
 * @name steps
 * @endpoint GET /api/browser-sessions/{sessionId}/steps
 * @source Monolith/src/prerna/remoteviewer/api/RemoteBrowserSessionController.java#getRemoteBrowserRecordedSteps
 * @param params - Path parameters.
 * @param params.sessionId - The browser session.
 * @param options - Per-call overrides (signal, headers).
 * @returns The recorded steps in order. `timestamp` is epoch milliseconds.
 * @throws {ApiError} 401 if the session is invalid, 403 if the caller does not own it, 404 if it does not exist.
 */
export function steps(
	params: { sessionId: string },
	options?: RequestOptions,
): Promise<
	Array<{
		type: string;
		url?: string;
		selector?: string;
		text?: string;
		role?: string;
		coordinates?: { x: number; y: number };
		viewport?: { width: number; height: number; deviceScaleFactor: number };
		timestamp: number;
	}>
> {
	const { sessionId } = params;
	return get(
		path`/api/browser-sessions/${sessionId}/steps`,
		undefined,
		options,
	);
}

/**
 * Returns the session's replayable Playwright recording: metadata plus the
 * steps grouped by tab.
 *
 * @name recording
 * @endpoint GET /api/browser-sessions/{sessionId}/recording
 * @source Monolith/src/prerna/remoteviewer/api/RemoteBrowserSessionController.java#getRecordingEnvelope
 * @param params - Path parameters.
 * @param params.sessionId - The browser session.
 * @param options - Per-call overrides (signal, headers).
 * @returns The `StepsEnvelope` (`version` `"1.0"`), its `meta`, and `steps`
 * keyed by recording tab id (`tab-1`, …), each a list of pages of
 * `PlaywrightStep`s. Step ids count up across tabs; `timestamp` is epoch
 * milliseconds and `coords` are relative to `viewport`.
 * @throws {ApiError} 401 if the session is invalid, 403 if the caller does not own it, 404 if it does not exist, 500 if it cannot be serialized.
 */
export function recording(
	params: { sessionId: string },
	options?: RequestOptions,
): Promise<{
	version: string;
	meta: {
		id?: string;
		title?: string;
		description?: string;
		createdAt?: number;
		updatedAt?: number;
		intent?: string;
	};
	steps: Record<
		string,
		Array<
			Array<{
				id: number;
				type:
					| "NAVIGATE"
					| "CLICK"
					| "TYPE"
					| "SCROLL"
					| "WAIT"
					| "CONTEXT"
					| "HOVER";
				url?: string;
				coords?: { x: number; y: number };
				multiCoords?: Array<{ x: number; y: number }>;
				prompt?: string;
				text?: string;
				pressEnter?: boolean;
				deltaY?: number;
				waitUntil?: string;
				waitAfterMs?: number;
				viewport?: {
					width: number;
					height: number;
					deviceScaleFactor: number;
				};
				timestamp: number;
				label?: string;
				description?: string;
				isPassword: boolean;
				storeValue: boolean;
				selector?: {
					strategy: string;
					value: string;
					frameSelector?: string;
				};
				isTriggerNewTab?: { isTrue: boolean; tabId?: string };
				shouldRun?: boolean;
				required?: boolean;
				sendToPlayground?: boolean;
				tag?: string;
			}>
		>
	>;
}> {
	const { sessionId } = params;
	return get(
		path`/api/browser-sessions/${sessionId}/recording`,
		undefined,
		options,
	);
}

/**
 * Saves the session's recording as `<name>.json` in the project's recordings
 * folder (keeping the id and creation time of a file it overwrites), then
 * clears the session's recording buffer.
 *
 * @name save
 * @endpoint POST /api/browser-sessions/{sessionId}/recording/save
 * @source Monolith/src/prerna/remoteviewer/api/RemoteBrowserSessionController.java#saveRecording
 * @param params - Path parameter plus the JSON body.
 * @param params.sessionId - The browser session (path).
 * @param params.project - Project id whose assets receive the recording.
 * @param params.name - File name; sanitized, `.json` is appended if missing.
 * @param params.title - Recording title.
 * @param params.description - Recording description.
 * @param params.intent - What the recording is meant to do.
 * @param options - Per-call overrides (signal, headers).
 * @returns Where the file was written (absolute server path and name).
 * @throws {ApiError} 400 for a missing `project` / `name`, 401 if the session is invalid, 403 if the caller does not own it, 404 if it does not exist, 500 if the file cannot be written.
 */
export function save(
	params: {
		sessionId: string;
		project: string;
		name: string;
		title?: string;
		description?: string;
		intent?: string;
	},
	options?: RequestOptions,
): Promise<{
	filePath: string;
	fileName: string;
	project: string;
	saved: true;
}> {
	const { sessionId, ...body } = params;
	return post(
		path`/api/browser-sessions/${sessionId}/recording/save`,
		body,
		options,
		{
			bodyType: "json",
		},
	);
}

/**
 * Closes a browser session. Closing an unknown or already-closed session
 * succeeds with a different message.
 *
 * @name deleteBrowserSession
 * @endpoint DELETE /api/browser-sessions/{sessionId}
 * @source Monolith/src/prerna/remoteviewer/api/RemoteBrowserSessionController.java#closeSession
 * @param params - Path parameters.
 * @param params.sessionId - The browser session.
 * @param options - Per-call overrides (signal, headers).
 * @returns `"Session closed"`, or `"Session not found or already closed"`.
 * @throws {ApiError} 401 if the session is invalid, 403 if the caller does not own it.
 */
export function deleteBrowserSession(
	params: { sessionId: string },
	options?: RequestOptions,
): Promise<{ message: string }> {
	const { sessionId } = params;
	return del(path`/api/browser-sessions/${sessionId}`, undefined, options);
}
