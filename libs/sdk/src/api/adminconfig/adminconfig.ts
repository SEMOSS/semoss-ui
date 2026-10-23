/**
 * First-run admin setup — `/adminconfig`.
 *
 * Backend: `AdminConfigService`
 * (Monolith/src/prerna/semoss/web/services/config/AdminConfigService.java), on
 * the dedicated `/adminconfig` servlet (`AdminApplication`), behind
 * `AdminStartupFilter`.
 */

import type { RequestOptions } from "../../lib/api-types";
import { post } from "../../lib/http";
import { path } from "../../lib/url";

/**
 * Registers the first admin users of a fresh install. Unauthenticated, and
 * only works while the security database has no users at all; afterwards it
 * is refused.
 *
 * @name setInitialAdmins
 * @endpoint POST /adminconfig/setInitialAdmins
 * @source Monolith/src/prerna/semoss/web/services/config/AdminConfigService.java#setInitialAdmins
 * @param params - Form fields.
 * @param params.ids - User ids to register as admins (sent as a JSON array).
 * @param options - Per-call overrides (signal, headers).
 * @returns `success` and the login page to send the user to. With no `ids` it answers 200 with `{ errorMessage }` instead.
 * @throws {ApiError} 302 (redirect) or 404 from `AdminStartupFilter` once any user exists; 400 if an initial admin already exists or the check fails.
 */
export function setInitialAdmins(
	params: { ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true; redirectUrl?: string } | { errorMessage: string }> {
	return post(path`/adminconfig/setInitialAdmins`, params, options);
}
