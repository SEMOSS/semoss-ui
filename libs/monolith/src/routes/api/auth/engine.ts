/**
 * Engine permissions for the signed-in user — `/api/auth/engine`.
 *
 * Backend: `EngineAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java).
 * Response maps are built in `MyEnginesReactor` (Semoss/src/prerna/reactor/security),
 * `SecurityEngineUtils` and `SecurityUserEngineUtils` (Semoss/src/prerna/auth/utils).
 *
 * Errors follow `ResourceUtility.respond`: 401 when the session is invalid (and,
 * for writes, when the session is anonymous), 403 when the caller lacks the
 * permission or the server limits the action to admins, 400 for bad input and
 * 500 for unexpected failures, each with an `{ errorMessage }` body (surfaced
 * as `ApiError`).
 */

import type { RequestOptions } from "@/types";
import { get, post, repeat } from "@/utility/http";
import { path } from "@/utility/url";

/**
 * Lists the engines (databases, models, storages, vectors, functions…) the
 * caller can access, optionally filtered, paged and decorated with metadata.
 * Anonymous sessions are allowed.
 *
 * @name getEngines
 * @endpoint GET /api/auth/engine/getEngines
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#getEngines
 * @param params - Query parameters.
 * @param params.engineId - Only return these engine ids.
 * @param params.engineTypes - Only these engine types (e.g. `"DATABASE"`, `"MODEL"`).
 * @param params.filterWord - Case-insensitive search on the engine name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.onlyFavorites - Only the caller's favorite engines.
 * @param params.metaKeys - Engine metadata keys to attach to each row (e.g. `"description"`, `"tag"`).
 * @param params.noMeta - Skip attaching metadata (and model `capabilities`) entirely.
 * @param params.userT - Attach vote totals (`upvotes`, `hasUpvoted`) when user tracking is enabled.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine. Requested `metaKeys` are added as extra keys (a string, or an array when the key has several values); model rows also get `capabilities` unless `noMeta`.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function getEngines(
	params: {
		engineId?: string[];
		engineTypes?: string[];
		filterWord?: string;
		limit?: number;
		offset?: number;
		onlyFavorites?: boolean;
		metaKeys?: string[];
		noMeta?: boolean;
		userT?: boolean;
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{
		engine_id: string;
		engine_name: string;
		engine_display_name: string | null;
		engine_type: string;
		engine_subtype: string | null;
		engine_cost: string | null;
		engine_discoverable: boolean;
		engine_global: boolean;
		engine_tool_app: boolean | null;
		engine_created_by: string | null;
		engine_created_by_type: string | null;
		engine_date_created: string | null;
		low_engine_name: string;
		/** The caller's direct permission id (1 = owner, 2 = edit, 3 = read only). */
		engine_user_permission: 1 | 2 | 3 | null;
		/** The best permission id the caller has through a group. */
		engine_group_permission: 1 | 2 | 3 | null;
		/** The caller's favorite flag, coalesced to `0` when unset. */
		engine_favorite: boolean | number;
		/** Legacy alias of `engine_id`. */
		app_id: string;
		/** Legacy alias of `engine_name`. */
		app_name: string;
		/** Legacy alias of `engine_type`. */
		app_type: string;
		/** Legacy alias of `engine_subtype`. */
		app_subtype: string | null;
		/** Legacy alias of `engine_cost`. */
		app_cost: string | null;
		/** Legacy alias of `engine_id`. */
		database_id: string;
		/** Legacy alias of `engine_name`. */
		database_name: string;
		/** Legacy alias of `engine_type`. */
		database_type: string;
		/** Legacy alias of `engine_discoverable`. */
		database_discoverable: boolean;
		engine_description: string | null;
		/** The best of `engine_user_permission` and `engine_group_permission`. */
		permission: 1 | 2 | 3 | null;
		/** Model capabilities (`SecurityModelMetadataUtils.toCapabilities`), on model rows only. */
		capabilities?: Record<string, unknown>;
		/** Vote total, with `userT` and user tracking enabled. */
		upvotes?: number;
		/** Whether the caller voted, with `userT` and user tracking enabled. */
		hasUpvoted?: boolean;
		[metaKey: string]: unknown;
	}>
> {
	return get(path`/api/auth/engine/getEngines`, params, options);
}

/**
 * Same as {@link getEngines}, but sends the filters in a form body — use it
 * when the `engineId` list is too long for a URL. Also accepts `metaFilters`.
 * Anonymous sessions are allowed.
 *
 * @name getEnginesPost
 * @endpoint POST /api/auth/engine/getEngines
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#getEnginesPOST
 * @param params - Form fields; same meaning as {@link getEngines}.
 * @param params.engineId - Only return these engine ids.
 * @param params.engineTypes - Only these engine types.
 * @param params.filterWord - Case-insensitive search on the engine name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.metaKeys - Engine metadata keys to attach to each row.
 * @param params.metaFilters - Filter on engine metadata, e.g. `{ tag: ["finance"] }`.
 * @param params.noMeta - Skip attaching metadata entirely.
 * @param params.userT - Attach vote totals when user tracking is enabled.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same rows as {@link getEngines}.
 * @throws {ApiError} 401 if the session is invalid.
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
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{
		engine_id: string;
		engine_name: string;
		engine_type: string;
		[key: string]: unknown;
	}>
> {
	const { engineId, engineTypes, metaKeys, ...rest } = params;
	return post(
		path`/api/auth/engine/getEngines`,
		{
			...rest,
			// read with request.getParameterMap(), so lists are repeated keys
			engineId: repeat(engineId),
			engineTypes: repeat(engineTypes),
			metaKeys: repeat(metaKeys),
		},
		options,
	);
}

/**
 * Returns the caller's effective permission on an engine, or `"DISCOVERABLE"`
 * when they have no access but the engine is discoverable. Anonymous sessions
 * are allowed.
 *
 * @name getUserEnginePermission
 * @endpoint GET /api/auth/engine/getUserEnginePermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#getUserEnginePermission
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns The caller's permission name.
 * @throws {ApiError} 403 if the caller has no access and the engine is not discoverable.
 */
export function getUserEnginePermission(
	params: { engineId: string },
	options?: RequestOptions,
): Promise<{
	permission: "OWNER" | "EDIT" | "READ_ONLY" | "DISCOVERABLE";
}> {
	return get(path`/api/auth/engine/getUserEnginePermission`, params, options);
}

/**
 * Lists the members of an engine and their permissions, paged. On a model,
 * each row carries the member's direct usage limit. The caller must be able to
 * view the engine. Anonymous sessions are allowed.
 *
 * @name getEngineUsers
 * @endpoint GET /api/auth/engine/getEngineUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#getEngineUsers
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param params.searchTerm - Search on user id, name, username or email (takes precedence over `userId`).
 * @param params.userId - Search for a user id (used only when `searchTerm` is absent).
 * @param params.permission - Only members with this permission.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of members and the total member count for the same filters.
 * @throws {ApiError} 403 if the caller cannot view the engine.
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
		name: string | null;
		email: string | null;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		end_date: string | null;
		permission_granted_by: string | null;
		permission_granted_by_type: string | null;
		date_added: string | null;
		/** The member's own usage limit on this model, or `null` for none (always `null` on non-models). */
		usage_limit: {
			unlimited: boolean;
			rules: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number | null;
				counts: "EACH_PERSON" | "SHARED";
			}> | null;
		} | null;
	}>;
}> {
	return get(path`/api/auth/engine/getEngineUsers`, params, options);
}

/**
 * Adds a user to an engine with a permission. On a model, only the engine's
 * owners may give a usage limit. Requires admin rights when the server limits
 * adding access to admins.
 *
 * @name addEngineUserPermission
 * @endpoint POST /api/auth/engine/addEngineUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#addEngineUserPermission
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.id - The user id to add.
 * @param params.permission - Permission to grant.
 * @param params.usageLimit - The user's usage limit on a model; omit or `null` for no limit.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not add users, grants owner as a non-owner, or sets a limit as a non-owner; 400 if the user already has access or the limit is invalid.
 */
export function addEngineUserPermission(
	params: {
		engineId: string;
		id: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		usageLimit?: {
			unlimited?: boolean;
			rules?: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/addEngineUserPermission`,
		params,
		options,
	);
}

/**
 * Adds several users to an engine in one call and notifies them. Users picked
 * from the Microsoft directory are created if missing.
 *
 * @name addEngineUserPermissions
 * @endpoint POST /api/auth/engine/addEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#addEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.userpermissions - One entry per user, each with its own optional `endDate` and (on a model, owners only) `usageLimit`; a row without `usageLimit` gives no limit.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not add users; 400 if a user already has access, a non-owner grants owner or sets a limit.
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
				unlimited?: boolean;
				rules?: Array<{
					metric: "TOKENS" | "COST" | "COMPUTE_TIME";
					amount: number;
					window:
						| "MINUTE"
						| "HOUR"
						| "DAY"
						| "WEEK"
						| "MONTH"
						| "YEAR";
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			} | null;
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/addEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Changes one member's permission on an engine and notifies them. Only owners
 * may change an owner's access, grant owner, or change a usage limit.
 *
 * @name editEngineUserPermission
 * @endpoint POST /api/auth/engine/editEngineUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#editEngineUserPermission
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.id - The member's user id.
 * @param params.type - The member's login type.
 * @param params.permission - The new permission.
 * @param params.usageLimit - The member's new usage limit on a model (`null` removes it). Omit to keep the current limit.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the member's access or limit; 400 if the member has no access or the limit is invalid.
 */
export function editEngineUserPermission(
	params: {
		engineId: string;
		id: string;
		type?: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		usageLimit?: {
			unlimited?: boolean;
			rules?: Array<{
				metric: "TOKENS" | "COST" | "COMPUTE_TIME";
				amount: number;
				window: "MINUTE" | "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";
				windowLength?: number;
				counts: "EACH_PERSON" | "SHARED";
			}>;
		} | null;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/editEngineUserPermission`,
		params,
		options,
	);
}

/**
 * Changes several members' permissions on an engine in one call and notifies
 * them.
 *
 * @name editEngineUserPermissions
 * @endpoint POST /api/auth/engine/editEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#editEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.userpermissions - One entry per member, each with its own optional `endDate`. A row without `usageLimit` keeps the member's limit; `usageLimit: null` removes it (owners only).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change access; 400 if a member has no access, a non-owner touches owner access or limits.
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
				unlimited?: boolean;
				rules?: Array<{
					metric: "TOKENS" | "COST" | "COMPUTE_TIME";
					amount: number;
					window:
						| "MINUTE"
						| "HOUR"
						| "DAY"
						| "WEEK"
						| "MONTH"
						| "YEAR";
					windowLength?: number;
					counts: "EACH_PERSON" | "SHARED";
				}>;
			} | null;
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/editEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes one member from an engine.
 *
 * @name removeEngineUserPermission
 * @endpoint POST /api/auth/engine/removeEngineUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#removeEngineUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.engineId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not remove the member.
 */
export function removeEngineUserPermission(
	params: { id: string; engineId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/removeEngineUserPermission`,
		params,
		options,
	);
}

/**
 * Removes several members from an engine in one call.
 *
 * @name removeEngineUserPermissions
 * @endpoint POST /api/auth/engine/removeEngineUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#removeEngineUserPermissions
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.ids - User ids to remove.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not remove members.
 */
export function removeEngineUserPermissions(
	params: { engineId: string; ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/removeEngineUserPermissions`,
		params,
		options,
	);
}

/**
 * Makes an engine public (every user can use it) or private.
 *
 * @name setEngineGlobal
 * @endpoint POST /api/auth/engine/setEngineGlobal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#setEngineGlobal
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.public - `true` for public.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the engine, or the server limits this to admins.
 */
export function setEngineGlobal(
	params: { engineId: string; public: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/engine/setEngineGlobal`, params, options);
}

/**
 * Makes an engine discoverable (listed for users without access, so they can
 * request it) or hidden.
 *
 * @name setEngineDiscoverable
 * @endpoint POST /api/auth/engine/setEngineDiscoverable
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#setEngineDiscoverable
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.discoverable - `true` to make it discoverable.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the engine, or the server limits setting engines public to admins (the message then wrongly reads "User session is invalid").
 */
export function setEngineDiscoverable(
	params: { engineId: string; discoverable: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/engine/setEngineDiscoverable`, params, options);
}

/**
 * Shows or hides an engine in the caller's own engine list.
 *
 * @name setEngineVisibility
 * @endpoint POST /api/auth/engine/setEngineVisibility
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#setEngineVisibility
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.visibility - `true` to show it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller cannot view the engine.
 */
export function setEngineVisibility(
	params: { engineId: string; visibility: boolean },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/engine/setEngineVisibility`, params, options);
}

/**
 * Marks or unmarks an engine as one of the caller's favorites.
 *
 * @name setEngineFavorite
 * @endpoint POST /api/auth/engine/setEngineFavorite
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#setEngineFavorite
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.isFavorite - `true` to favorite it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the engine is not public and the caller cannot view it.
 */
export function setEngineFavorite(
	params: { engineId: string; isFavorite: boolean },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/engine/setEngineFavorite`, params, options);
}

/**
 * Searches for users who do not yet have access to an engine, from the
 * security database or — when the Microsoft directory lookup is enabled — the
 * directory. The caller must be able to view the engine. Anonymous sessions
 * are allowed.
 *
 * @name getEngineUsersNoCredentials
 * @endpoint GET /api/auth/engine/getEngineUsersNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#getEngineUsersNoCredentials
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param params.searchTerm - Search on user id, name, username or email.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip. For directory lookups, `0` starts a new search and any other value continues it (paging state is kept in the session).
 * @param params.msGraphLookup - `"false"` to search the security database even when the directory is enabled. Defaults to the directory when it is enabled (`MicrosoftGraphUserLookup.LOOKUP_PARAM`).
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users.
 * @remarks Unverified response shape for directory lookups.
 * @throws {ApiError} 403 if the caller cannot view the engine, or a directory lookup needs a Microsoft login the caller lacks.
 */
export function getEngineUsersNoCredentials(
	params: {
		engineId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
		msGraphLookup?: string;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		type: string;
		username?: string | null;
		name: string | null;
		email: string | null;
		[key: string]: unknown;
	}>
> {
	return get(
		path`/api/auth/engine/getEngineUsersNoCredentials`,
		params,
		options,
	);
}

/**
 * Approves pending access requests for an engine, granting each requester the
 * permission in their request.
 *
 * @name approveEngineUserAccessRequest
 * @endpoint POST /api/auth/engine/approveEngineUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#approveEngineUserAccessRequest
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.requests - The requests to approve.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the engine's permissions.
 */
export function approveEngineUserAccessRequest(
	params: {
		engineId: string;
		requests: Array<{
			requestid: string;
			userid: string;
			type: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/approveEngineUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Denies pending access requests for an engine and notifies the requesters.
 * Only the engine's owners may deny.
 *
 * @name denyEngineUserAccessRequest
 * @endpoint POST /api/auth/engine/denyEngineUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/EngineAuthorizationResource.java#denyEngineUserAccessRequest
 * @param params - Form fields.
 * @param params.engineId - The engine.
 * @param params.requestIds - Ids of the requests to deny (note the camelCase `requestIds`, unlike the project endpoint).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the engine.
 */
export function denyEngineUserAccessRequest(
	params: { engineId: string; requestIds: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/engine/denyEngineUserAccessRequest`,
		params,
		options,
	);
}
