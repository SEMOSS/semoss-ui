/**
 * Trusted-host tokens — `/token`.
 *
 * Backend: `TrustedTokenService`
 * (Monolith/src/prerna/semoss/web/services/config/TrustedTokenService.java), on
 * the dedicated `/token` servlet (`TrustedTokenApplication`). In a cluster the
 * tokens live in the security database's `TOKEN` table
 * (`SecurityTokenUtils`, Semoss/src/prerna/auth/utils); otherwise in a
 * per-pod cache that expires them after 120 minutes.
 *
 * A token is bound to the caller's IP address: asking again from the same IP
 * returns the same token.
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Gets (or creates) the token for the caller's IP. Only allowed when the
 * server does not require API-user credentials; otherwise use
 * {@link getTokenPost}.
 *
 * @name getToken
 * @endpoint GET /token/getToken
 * @source Monolith/src/prerna/semoss/web/services/config/TrustedTokenService.java#getTokenGet
 * @param params - Query parameters.
 * @param params.client_id - The client id to record with a new token.
 * @param options - Per-call overrides (signal, headers).
 * @returns The token, when it was issued, and the client id it was issued to.
 * @throws {ApiError} 401 when the server requires client/secret credentials (use {@link getTokenPost}).
 */
export function getToken(
	params: { client_id?: string } = {},
	options?: RequestOptions,
): Promise<{
	token: string;
	/** Issue time (UTC). In a cluster this field holds the IP address instead (backend bug). */
	dateAdded: string | null;
	clientId: string | null;
}> {
	return get(path`/token/getToken`, params, options);
}

/**
 * Gets (or creates) the token for the caller's IP, checking the API user's
 * client id and secret first when the server requires them.
 *
 * @name getTokenPost
 * @endpoint POST /token/getToken
 * @source Monolith/src/prerna/semoss/web/services/config/TrustedTokenService.java#getTokenPost
 * @param params - Form fields.
 * @param params.client_id - The API user's client id.
 * @param params.secret_key - The API user's secret key (checked only when the server requires credentials).
 * @param options - Per-call overrides (signal, headers).
 * @returns The same as {@link getToken}.
 * @throws {ApiError} 401 for an invalid client/secret combination.
 */
export function getTokenPost(
	params: { client_id?: string; secret_key?: string } = {},
	options?: RequestOptions,
): Promise<{
	token: string;
	/** Issue time (UTC). In a cluster this field holds the IP address instead (backend bug). */
	dateAdded: string | null;
	clientId: string | null;
}> {
	return post(path`/token/getToken`, params, options);
}
