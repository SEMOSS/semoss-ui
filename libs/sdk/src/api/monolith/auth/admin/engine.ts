/**
 * Admin engine permissions — `/api/auth/admin/engine`.
 *
 * Backend: `AdminEngineAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java).
 * Response maps are built in `SecurityAdminUtils`, `SecurityUserEngineUtils`
 * and `AdminMyEnginesReactor` (Semoss/src/prerna/auth/utils).
 *
 * Every endpoint here is admin-only. This resource does not use
 * `ResourceUtility.respond`: a missing session **and** a caller who is not an
 * admin are both answered with 401, a failed change with 400 (the exception
 * message as `{ errorMessage }`), and a few endpoints answer 500.
 *
 * A model usage limit (`usageLimit`) is
 * `{ unlimited, rules: [{ metric, amount, window, windowLength?, counts }] }`;
 * `amount` is tokens, millionths of a US dollar or milliseconds, by `metric`.
 */

import type { RequestOptions } from "../../../../lib/api-types";
import { repeat } from "../../../../utility/body";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Lists every engine on the server for the admin console (runs
 * `AdminMyEnginesReactor`), optionally filtered, paged and decorated with
 * engine metadata and user-tracking counts.
 *
 * @name getEngines
 * @endpoint GET /api/auth/admin/engine/getEngines
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#getEnginesGET
 * @param params - Query parameters.
 * @param params.engineId - Only return these engine ids.
 * @param params.engineTypes - Only these engine types (e.g. `"MODEL"`, `"DATABASE"`).
 * @param params.filterWord - Case-insensitive search on the engine name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.metaKeys - Engine metadata keys to attach to each row (e.g. `"description"`, `"tag"`).
 * @param params.noMeta - Skip attaching metadata entirely.
 * @param params.userT - Include user-tracking information (`upvotes`, `hasUpvoted`).
 * @param params.permissionUser - Only return engines this user id has access to.
 * @param params.effectivePermissions - With `permissionUser`, only these permission levels (1 = owner, 2 = edit, 3 = read only).
 * @param params.createdBy - Only engines created by these users, as a JSON array of `{ id, type }` maps.
 * @param params.createdByMe - Only engines created by the caller.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine. Requested `metaKeys` are added as extra keys on each row.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getEngines(
	params: {
		engineId?: string[];
		engineTypes?: string[];
		filterWord?: string;
		limit?: number;
		offset?: number;
		metaKeys?: string[];
		noMeta?: boolean;
		userT?: boolean;
		permissionUser?: string;
		effectivePermissions?: Array<1 | 2 | 3>;
		createdBy?: string;
		createdByMe?: boolean;
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{
		engine_id: string;
		engine_name: string;
		engine_display_name?: string;
		engine_type: string;
		engine_subtype?: string;
		engine_cost?: string;
		engine_discoverable: boolean;
		engine_global: boolean;
		/** Linked tool project id, when one is assigned. */
		engine_tool_app?: string;
		engine_created_by?: string;
		engine_created_by_type?: string;
		engine_date_created?: string;
		low_engine_name: string;
		/** Legacy alias of `engine_id`. */
		database_id: string;
		/** Legacy alias of `engine_name`. */
		database_name: string;
		/** Legacy alias of `engine_id`. */
		app_id: string;
		/** Legacy alias of `engine_name`. */
		app_name: string;
		/** Legacy alias of `engine_global`. */
		app_global: boolean;
		/** With `userT`. */
		upvotes?: number;
		/** With `userT`. */
		hasUpvoted?: boolean;
		[metaKey: string]: unknown;
	}>
> {
	return get(path`/api/auth/admin/engine/getEngines`, params, options);
}

/**
 * Same as {@link getEngines}, but sends the filters in a form body — use it
 * when the `engineId` list is too long for a URL. Also accepts `metaFilters`.
 *
 * @name getEnginesPost
 * @endpoint POST /api/auth/admin/engine/getEngines
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#getEnginesPOST
 * @param params - Form fields; same meaning as {@link getEngines}.
 * @param params.engineId - Only return these engine ids.
 * @param params.engineTypes - Only these engine types.
 * @param params.filterWord - Case-insensitive search on the engine name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.metaKeys - Engine metadata keys to attach to each row.
 * @param params.metaFilters - Filter on engine metadata, e.g. `{ tag: ["finance"] }`.
 * @param params.noMeta - Skip attaching metadata entirely.
 * @param params.userT - Include user-tracking information.
 * @param params.permissionUser - Only return engines this user id has access to.
 * @param params.effectivePermissions - With `permissionUser`, only these permission levels.
 * @param params.createdBy - Only engines created by these users.
 * @param params.createdByMe - Only engines created by the caller.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same rows as {@link getEngines}.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getEnginesPost(
	params: {
		engineId?: string[];
		engineTypes?: string[];
		filterWord?: string;
		limit?: number;
		offset?: number;
		metaKeys?: string[];
		metaFilters?: Record<string, unknown>;
		noMeta?: boolean;
		userT?: boolean;
		permissionUser?: string;
		effectivePermissions?: Array<1 | 2 | 3>;
		createdBy?: Array<{ id: string; type: string }>;
		createdByMe?: boolean;
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{ engine_id: string; engine_name: string; [key: string]: unknown }>
> {
	const { engineId, engineTypes, metaKeys, effectivePermissions, ...rest } =
		params;
	return post(
		path`/api/auth/admin/engine/getEngines`,
		{
			...rest,
			// read with request.getParameterMap(), so lists are repeated keys
			engineId: repeat(engineId),
			engineTypes: repeat(engineTypes),
			metaKeys: repeat(metaKeys),
			effectivePermissions: repeat(effectivePermissions),
		},
		options,
	);
}

/**
 * Lists the engines a given user has explicit permission on.
 *
 * @name getAllUserEngines
 * @endpoint GET /api/auth/admin/engine/getAllUserEngines
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#getAllUserEngines
 * @param params - Query parameters.
 * @param params.userId - The user whose engines to list.
 * @param params.engineTypes - Only these engine types.
 * @param params.searchTerm - Search on the engine id, name or display name.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine with the user's permission on it. `app_*` keys are legacy aliases of the `engine_*` keys.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getAllUserEngines(
	params: {
		userId: string;
		engineTypes?: string[];
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		user_id: string;
		engine_id: string;
		engine_name: string;
		engine_display_name?: string;
		engine_type: string;
		engine_subtype?: string;
		/** Permission name: `"OWNER"`, `"EDIT"` or `"READ_ONLY"`. */
		engine_permission: string;
		app_id: string;
		app_name: string;
		app_display_name?: string;
		/** Selected twice in the query (id and name); the name normally wins. */
		app_permission: string | number;
		low_engine_name: string;
	}>
> {
	return get(path`/api/auth/admin/engine/getAllUserEngines`, params, options);
}

/**
 * Lists the engines a given user does **not** have access to (for granting new access).
 *
 * @name getUserEnginesNoCredentials
 * @endpoint GET /api/auth/admin/engine/getUserEnginesNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#getUserEnginesNoCredentials
 * @param params - Query parameters.
 * @param params.userId - The user to check.
 * @param params.engineTypes - Only these engine types.
 * @param params.searchTerm - Search on the engine id, name or display name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns Engine rows, sorted by display name.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getUserEnginesNoCredentials(
	params: {
		userId: string;
		engineTypes?: string[];
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		engine_id: string;
		engine_name: string;
		engine_display_name?: string;
		engine_type: string;
		engine_subtype?: string;
		low_engine_name: string;
	}>
> {
	return get(
		path`/api/auth/admin/engine/getUserEnginesNoCredentials`,
		params,
		options,
	);
}

/**
 * Grants a user the same permission on every engine on the server, or on every
 * engine of the given types.
 *
 * @name grantAllEngines
 * @endpoint POST /api/auth/admin/engine/grantAllEngines
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#grantAllEngines
 * @param params - Form fields.
 * @param params.userId - The user to grant access to.
 * @param params.permission - Permission to grant.
 * @param params.isAddNew - Also grant it on engines created later.
 * @param params.engineTypes - Only engines of these types (all types when omitted).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the grant fails.
 */
export function grantAllEngines(
	params: {
		userId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		isAddNew?: boolean;
		engineTypes?: string[];
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/engine/grantAllEngines`, params, options);
}

/**
 * Gives every user created from now on a permission on an engine.
 *
 * @name grantNewUsersEngineAccess
 * @endpoint POST /api/auth/admin/engine/grantNewUsersEngineAccess
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#grantNewUsersEngineAccess
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.permission - Permission new users receive.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the grant fails.
 */
export function grantNewUsersEngineAccess(
	params: { engineId: string; permission: "OWNER" | "EDIT" | "READ_ONLY" },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/grantNewUsersEngineAccess`,
		params,
		options,
	);
}

/**
 * Lists the members of an engine and their permissions, paged. Each row
 * carries the member's own model usage limit on the engine (absent or `null`
 * when none is defined, and always for engines that are not models).
 *
 * @name getEngineUsers
 * @endpoint GET /api/auth/admin/engine/getEngineUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#getEngineUsers
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param params.searchTerm - Search on user id, name, username or email (takes precedence over `userId`).
 * @param params.userId - Search for a single user id.
 * @param params.permission - Only members with this permission.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of members and the total member count for the same filters.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getEngineUsers(
	params: {
		engineId: string;
		searchTerm?: string;
		userId?: string;
		permission?: "OWNER" | "EDIT" | "READ_ONLY";
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<{
	totalMembers: number;
	members: Array<{
		id: string;
		type: string;
		name?: string;
		email?: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		end_date?: string;
		permission_granted_by?: string;
		permission_granted_by_type?: string;
		date_added?: string;
		usage_limit?: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		};
	}>;
}> {
	return get(path`/api/auth/admin/engine/getEngineUsers`, params, options);
}

/**
 * Adds a user to an engine with a permission and, on a model, an optional usage
 * limit (omitted or `null` gives no limit).
 *
 * @name addEngineUserPermission
 * @endpoint POST /api/auth/admin/engine/addEngineUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#addEngineUserPermission
 * @param params - Form fields.
 * @param params.id - The user id to add.
 * @param params.engineId - The engine.
 * @param params.permission - Permission to grant.
 * @param params.usageLimit - The person's usage limit on the model.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the user already has access or the limit is invalid.
 */
export function addEngineUserPermission(
	params: {
		id: string;
		engineId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		usageLimit?: {
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
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/addEngineUserPermission`,
		params,
		options,
	);
}

/**
 * Adds several users to an engine in one call (one permission batch, all or
 * none). Users picked from the Microsoft directory are created if missing.
 *
 * @name addEngineUserPermissions
 * @endpoint POST /api/auth/admin/engine/addEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#addEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.userpermissions - One entry per user; a row without `usageLimit` gives no limit.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if any user already has access.
 */
export function addEngineUserPermissions(
	params: {
		engineId: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
			usageLimit?: {
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
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/addEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Adds every user on the server to an engine with the same permission.
 *
 * @name addAllUsers
 * @endpoint POST /api/auth/admin/engine/addAllUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#addAllUsers
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the change fails.
 */
export function addAllUsers(
	params: { engineId: string; permission: "OWNER" | "EDIT" | "READ_ONLY" },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/engine/addAllUsers`, params, options);
}

/**
 * Changes one member's permission on an engine. On a model, sending
 * `usageLimit` replaces the member's limit (`null` removes it); omitting it
 * keeps the current limit.
 *
 * @name editEngineUserPermission
 * @endpoint POST /api/auth/admin/engine/editEngineUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#editEngineUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.engineId - The engine.
 * @param params.permission - The new permission.
 * @param params.usageLimit - The member's new usage limit on the model.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the user has no access or the limit is invalid.
 */
export function editEngineUserPermission(
	params: {
		id: string;
		engineId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		usageLimit?: {
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
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/editEngineUserPermission`,
		params,
		options,
	);
}

/**
 * Changes several members' permissions on an engine in one call. A row without
 * `usageLimit` keeps the member's limit; a row with `usageLimit: null` removes it.
 *
 * @name editEngineUserPermissions
 * @endpoint POST /api/auth/admin/engine/editEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#editEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.userpermissions - One entry per member.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if any user has no access.
 */
export function editEngineUserPermissions(
	params: {
		engineId: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
			usageLimit?: {
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
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/editEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Sets every member of an engine to the same permission.
 *
 * @name updateEngineUserPermissions
 * @endpoint POST /api/auth/admin/engine/updateEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#updateEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.permission - The permission every member gets.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the change fails.
 */
export function updateEngineUserPermissions(
	params: { engineId: string; permission: "OWNER" | "EDIT" | "READ_ONLY" },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/updateEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes one member from an engine.
 *
 * @name removeEngineUserPermission
 * @endpoint POST /api/auth/admin/engine/removeEngineUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#removeEngineUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.engineId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the removal fails.
 */
export function removeEngineUserPermission(
	params: { id: string; engineId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/removeEngineUserPermission`,
		params,
		options,
	);
}

/**
 * Removes several members from an engine in one call.
 *
 * @name removeEngineUserPermissions
 * @endpoint POST /api/auth/admin/engine/removeEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#removeEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.ids - User ids to remove.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the removal fails.
 */
export function removeEngineUserPermissions(
	params: { engineId: string; ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/removeEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Makes an engine public (every user can use it) or private.
 *
 * @name setEngineGlobal
 * @endpoint POST /api/auth/admin/engine/setEngineGlobal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#setEngineGlobal
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.public - `true` for public.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 500 if the update fails.
 */
export function setEngineGlobal(
	params: { engineId: string; public: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/engine/setEngineGlobal`, params, options);
}

/**
 * Makes an engine discoverable (listed in the catalog for users without
 * access, so they can request it) or hidden.
 *
 * @name setEngineDiscoverable
 * @endpoint POST /api/auth/admin/engine/setEngineDiscoverable
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#setEngineDiscoverable
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.discoverable - `true` to make it discoverable.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 500 if the update fails.
 */
export function setEngineDiscoverable(
	params: { engineId: string; discoverable: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/setEngineDiscoverable`,
		params,
		options,
	);
}

/**
 * Searches for users who do not yet have access to an engine, from the
 * security database or — when the Microsoft directory lookup is enabled on the
 * server and not turned off with `msGraphLookup: false` — the Microsoft directory.
 *
 * @name getEngineUsersNoCredentials
 * @endpoint GET /api/auth/admin/engine/getEngineUsersNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#getEngineUsersNoCredentials
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param params.searchTerm - Search on user id, name or email.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.msGraphLookup - Search the Microsoft directory (defaults to `true` when the lookup is enabled).
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users. Directory fields are configurable and retain their raw Graph values.
 * @remarks Directory `ms_graphapi_jsonPattern` mappings can omit or change the type of user fields. `type` is always a provider string; validate other fields before using them.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if a directory lookup is made without a Microsoft login; 500 if the lookup fails.
 */
export function getEngineUsersNoCredentials(
	params: {
		engineId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
		msGraphLookup?: boolean;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		id?: unknown;
		type: string;
		username?: unknown;
		name?: unknown;
		email?: unknown;
		[key: string]: unknown;
	}>
> {
	return get(
		path`/api/auth/admin/engine/getEngineUsersNoCredentials`,
		params,
		options,
	);
}

/**
 * Approves pending access requests for an engine, granting each requester the
 * permission in their request (added, or changed when they already have
 * access). The caller is recorded as the approver.
 *
 * @name approveEngineUserAccessRequest
 * @endpoint POST /api/auth/admin/engine/approveEngineUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#approveEngineUserAccessRequest
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.requests - The requests to approve.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the approval fails.
 */
export function approveEngineUserAccessRequest(
	params: {
		engineId: string;
		requests: Array<{
			requestid: string;
			userid: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/approveEngineUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Denies pending access requests for an engine. The caller is recorded as the
 * approver.
 *
 * @name denyEngineUserAccessRequest
 * @endpoint POST /api/auth/admin/engine/denyEngineUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminEngineAuthorizationResource.java#denyEngineUserAccessRequest
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.requestIds - Ids of the requests to deny.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the update fails.
 */
export function denyEngineUserAccessRequest(
	params: { engineId: string; requestIds: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/engine/denyEngineUserAccessRequest`,
		params,
		options,
	);
}
