/**
 * User search for sharing dialogs — `/api/authorization`.
 *
 * Backend: `AuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/AuthorizationResource.java).
 * Rows come from `SecurityQueryUtils.searchForUser` (Semoss/src/prerna/auth/utils)
 * or `MsGraphUtility.searchDirectory` (Monolith/src/prerna/graph/utility).
 *
 * Errors are `{ errorMessage }` maps (surfaced as `ApiError`).
 */

import type { RequestOptions } from "../../lib/api-types";
import { get } from "../../lib/http";
import { path } from "../../lib/url";

/**
 * Searches users by name, email, id or username. Uses the Microsoft Graph
 * directory when the server has it enabled (unless `msGraphLookup: false`),
 * otherwise the security database. Directory searches are paged through the
 * session: `offset: 0` starts a search and any other offset continues it.
 * Any signed-in user may call it.
 *
 * @name searchForUser
 * @endpoint GET /api/authorization/searchForUser
 * @source Monolith/src/prerna/semoss/web/services/local/AuthorizationResource.java#searchForUser
 * @param params - Query parameters.
 * @param params.searchTerm - Text to match (case-insensitive "like"). Empty matches everyone.
 * @param params.limit - Page size (`0` or omitted for all / one Graph page).
 * @param params.offset - Users already returned.
 * @param params.msGraphLookup - `false` to search the security database even when the directory is available.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per user. Directory rows also carry `hasAccount` and the raw Graph fields.
 * @remarks Directory `ms_graphapi_jsonPattern` mappings can omit or change the type of user fields. `type` is always a provider string; validate other fields before using them.
 * @throws {ApiError} 401 if the session is invalid; 400 if the directory needs a Microsoft login the caller lacks; 500 on failure.
 */
export function searchForUser(
	params: {
		searchTerm?: string;
		limit?: number;
		offset?: number;
		msGraphLookup?: boolean;
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{
		id?: unknown;
		type: string;
		username?: unknown;
		name?: unknown;
		email?: unknown;
		/** Directory searches only: whether the user already exists in SEMOSS. */
		hasAccount?: boolean;
		[graphField: string]: unknown;
	}>
> {
	return get(path`/api/authorization/searchForUser`, params, options);
}
