/**
 * Admin user management — `/api/auth/admin/user`.
 *
 * Backend: `AdminUserAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java).
 * Response maps are built in `SecurityAdminUtils` and `SecurityUpdateUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Every endpoint except {@link isAdminUser} is admin-only. This resource does
 * not use `ResourceUtility.respond`: a missing session **and** (except on
 * `registerUser`, which answers 400) a caller who is not an admin are both
 * answered with 401, and a failed change with 400, each with an
 * `{ errorMessage }` body (surfaced as `ApiError`).
 *
 * A user is identified by their id and their login type (e.g. `"NATIVE"`).
 * A model usage limit is `{ unlimited, rules: [{ metric, amount, window,
 * windowLength?, counts }] }`.
 */

import type { RequestOptions } from "@/types";
import { get, post } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Checks whether the signed-in user is an admin. Any signed-in user may call it.
 *
 * @name isAdminUser
 * @endpoint GET /api/auth/admin/user/isAdminUser
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#isAdminUser
 * @param params - No parameters.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true` when the caller is an admin.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function isAdminUser(
	params: Record<string, never> = {},
	options?: RequestOptions,
): Promise<boolean> {
	return get(path`/api/auth/admin/user/isAdminUser`, params, options);
}

/**
 * Registers a new user in the security database, optionally with a password
 * (native users), roles and an all-models usage limit.
 *
 * @name registerUser
 * @endpoint POST /api/auth/admin/user/registerUser
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#registerUser
 * @param params - Form fields.
 * @param params.userId - The new user's id.
 * @param params.type - The login type, e.g. `"NATIVE"`.
 * @param params.name - Display name.
 * @param params.email - Email address (validated).
 * @param params.phone - Phone number (validated and formatted).
 * @param params.phoneextension - Phone extension.
 * @param params.countrycode - Phone country code.
 * @param params.admin - Make the user an admin.
 * @param params.publisher - Let the user publish.
 * @param params.exporter - Let the user export.
 * @param params.password - Password, for native users (validated against the password rules).
 * @param params.modelUsageLimit - The user's all-models default usage limit (omitted or `null` for none).
 * @param options - Per-call overrides (signal, headers).
 * @returns Whether the user was registered.
 * @throws {ApiError} 401 if the session is invalid or the email, phone or password is invalid; 400 if the caller is not an admin, `userId` is missing or the user exists; 500 for unexpected failures.
 */
export function registerUser(
	params: {
		userId: string;
		type?: string;
		name?: string;
		email?: string;
		phone?: string;
		phoneextension?: string;
		countrycode?: string;
		admin?: boolean;
		publisher?: boolean;
		exporter?: boolean;
		password?: string;
		modelUsageLimit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	},
	options?: RequestOptions,
): Promise<boolean> {
	return post(path`/api/auth/admin/user/registerUser`, params, options);
}

/**
 * Grants or revokes a user's publisher role.
 *
 * @name setUserPublisher
 * @endpoint POST /api/auth/admin/user/setUserPublisher
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#setUserPublisher
 * @param params - Form fields.
 * @param params.userId - The user.
 * @param params.isPublisher - `true` to grant it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the update fails.
 */
export function setUserPublisher(
	params: { userId: string; isPublisher: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/user/setUserPublisher`, params, options);
}

/**
 * Locks or unlocks a user's account.
 *
 * @name setUserLocked
 * @endpoint POST /api/auth/admin/user/setUserLocked
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#setUserLocked
 * @param params - Form fields.
 * @param params.userId - The user.
 * @param params.type - The user's login type.
 * @param params.isLocked - `true` to lock.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the update fails.
 */
export function setUserLocked(
	params: { userId: string; type: string; isLocked: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/user/setUserLocked`, params, options);
}

/**
 * Edits a user's details. The row is rewritten whole: fields left out are
 * cleared (`admin`, `publisher` and `exporter` become `false`), so send the
 * full user. `model_usage_limit` replaces the all-models default when present
 * (`null` removes it) and keeps it when absent. The last admin cannot be demoted.
 *
 * @name editUser
 * @endpoint POST /api/auth/admin/user/editUser
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#editUser
 * @param params - Form fields.
 * @param params.user - The user, sent as JSON. For native users `username` must equal `id`; `password` is only applied to native users.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if validation fails, the last admin would be demoted or the update fails.
 */
export function editUser(
	params: {
		user: {
			id: string;
			type: string;
			name?: string;
			email?: string;
			username?: string;
			password?: string;
			phone?: string;
			phoneextension?: string;
			countrycode?: string;
			admin?: boolean | 0 | 1;
			publisher?: boolean | 0 | 1;
			exporter?: boolean | 0 | 1;
			model_usage_limit?: {
				unlimited: boolean;
				rules: Array<{
					metric: "TOKENS" | "COST" | "COMPUTE_TIME";
					amount: number;
					window:
						| "MINUTE"
						| "HOUR"
						| "DAY"
						| "WEEK"
						| "MONTH"
						| "YEAR";
					windowLength?: number | null;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			} | null;
		};
	},
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/user/editUser`, params, options);
}

/**
 * Deletes a user. The last admin cannot be deleted.
 *
 * @name deleteUser
 * @endpoint POST /api/auth/admin/user/deleteUser
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#deleteUser
 * @param params - Form fields.
 * @param params.userId - The user.
 * @param params.type - The user's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns Whether the user was deleted.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the user is the last admin.
 */
export function deleteUser(
	params: { userId: string; type: string },
	options?: RequestOptions,
): Promise<boolean> {
	return post(path`/api/auth/admin/user/deleteUser`, params, options);
}

/**
 * Lists every user, paged and sorted by name, with each user's all-models
 * default usage limit.
 *
 * @name getAllUsers
 * @endpoint GET /api/auth/admin/user/getAllUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#getAllUsers
 * @param params - Query parameters.
 * @param params.filterWord - Search on user id, name, username or email.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per user.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getAllUsers(
	params: { filterWord?: string; limit?: number; offset?: number } = {},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		type: string;
		name: string | null;
		username: string | null;
		email: string | null;
		admin: boolean;
		publisher: boolean;
		exporter: boolean;
		phone: string | null;
		phoneextension: string | null;
		countrycode: string | null;
		locked: boolean | null;
		model_usage_limit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	}>
> {
	return get(path`/api/auth/admin/user/getAllUsers`, params, options);
}

/**
 * Counts the users, for paging {@link getAllUsers}.
 *
 * @name getNumUsers
 * @endpoint GET /api/auth/admin/user/getNumUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#getNumUsers
 * @param params - Query parameters.
 * @param params.filterWord - Search on user id, name, username or email.
 * @param options - Per-call overrides (signal, headers).
 * @returns The number of users.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getNumUsers(
	params: { filterWord?: string } = {},
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/admin/user/getNumUsers`, params, options);
}

/**
 * Lists the API users (type `API_USER`), paged and sorted by name, with each
 * one's all-models default usage limit.
 *
 * @name getAllAPIUsers
 * @endpoint GET /api/auth/admin/user/getAllAPIUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#getAllAPIUsers
 * @param params - Query parameters.
 * @param params.filterWord - Search on user id, name, username or email.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per API user.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getAllAPIUsers(
	params: { filterWord?: string; limit?: number; offset?: number } = {},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		type: string;
		name: string | null;
		username: string | null;
		email: string | null;
		admin: boolean;
		publisher: boolean;
		exporter: boolean;
		phone: string | null;
		phoneextension: string | null;
		countrycode: string | null;
		date_created: string | null;
		model_usage_limit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	}>
> {
	return get(path`/api/auth/admin/user/getAllAPIUsers`, params, options);
}

/**
 * Counts the API users, for paging {@link getAllAPIUsers}.
 *
 * @name getNumAPIUsers
 * @endpoint GET /api/auth/admin/user/getNumAPIUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminUserAuthorizationResource.java#getNumAPIUsers
 * @param params - Query parameters.
 * @param params.filterWord - Search on user id, name, username or email.
 * @param options - Per-call overrides (signal, headers).
 * @returns The number of API users.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getNumAPIUsers(
	params: { filterWord?: string } = {},
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/admin/user/getNumAPIUsers`, params, options);
}
