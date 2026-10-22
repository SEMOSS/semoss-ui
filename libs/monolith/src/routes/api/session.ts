/**
 * Session lifecycle — `/api/session`.
 *
 * Backend: `SessionResource`
 * (Monolith/src/prerna/semoss/web/services/local/SessionResource.java).
 *
 * Errors here are `{ output: "Invalid session" }` (400) rather than
 * `{ errorMessage }`, surfaced as `ApiError`.
 */

import { ApiClient } from "../../lib/api-client";
import type { RequestOptions } from "../../types";
import { get, post } from "../../utility/http";
import { path } from "../../utility/url";

/**
 * Counts the active sessions on this Tomcat node (excluding the one this call
 * creates, which is invalidated again). Public.
 *
 * @name active
 * @endpoint GET /api/session/active
 * @source Monolith/src/prerna/semoss/web/services/local/SessionResource.java#getActiveSessions
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The count, or the string `"Error in getting manager context"` when the session manager cannot be read.
 * @throws {ApiError} On an unexpected server failure.
 */
export function active(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ activeSessions: number | string }> {
	return get(path`/api/session/active`, params, options);
}

/**
 * Schedules the session for cleanup, typically when the browser tab closes:
 * drops every insight of the session right away, waits 10 seconds, then
 * invalidates the session unless {@link cancelCleanSession} was called in the
 * meantime. The request itself blocks for those 10 seconds.
 *
 * @name cleanSession
 * @endpoint POST /api/session/cleanSession
 * @source Monolith/src/prerna/semoss/web/services/local/SessionResource.java#cleanSession
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `"invalidated"` or `"cancelled"`.
 * @throws {ApiError} 400 if there is no session.
 */
export function cleanSession(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ output: "invalidated" | "cancelled" }> {
	return post(path`/api/session/cleanSession`, params, options);
}

/**
 * Cancels a pending {@link cleanSession}, e.g. when the page reloads instead
 * of closing. The session's insights are already dropped.
 *
 * @name cancelCleanSession
 * @endpoint POST /api/session/cancelCleanSession
 * @source Monolith/src/prerna/semoss/web/services/local/SessionResource.java#cancelCleanSession
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ output: "cancel" }`.
 * @throws {ApiError} 400 if there is no session.
 */
export function cancelCleanSession(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<{ output: "cancel" }> {
	return post(path`/api/session/cancelCleanSession`, params, options);
}

/**
 * Force-ends the session: invalidates it and answers 302 with a `redirect`
 * header pointing to the custom logout URL, the logout page or the login
 * page. It never answers 2xx, so the promise always rejects (after
 * `onRedirect` runs, when configured). The client session (CSRF token and
 * cookies) is cleared either way.
 *
 * @name invalidateSession
 * @endpoint GET /api/session/invalidateSession
 * @source Monolith/src/prerna/semoss/web/services/local/SessionResource.java#invalidateSession
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns Never resolves successfully.
 * @throws {ApiError} Always: status 302 with `data.redirect` (or the redirect body) naming where to go.
 */
export function invalidateSession(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<never> {
	return get<never>(
		path`/api/session/invalidateSession`,
		params,
		options,
	).finally(() => ApiClient.clear());
}

/**
 * Lists the ids of the insights open in this session.
 *
 * @name insights
 * @endpoint GET /api/session/insights
 * @source Monolith/src/prerna/semoss/web/services/local/SessionResource.java#getInsights
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns The insight ids, or `null` when the session has none registered.
 * @throws {ApiError} 400 if there is no session.
 */
export function insights(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<string[] | null> {
	return get(path`/api/session/insights`, params, options);
}
