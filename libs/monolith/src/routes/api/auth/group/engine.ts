/**
 * Group access to engines — `/api/auth/group/engine`.
 *
 * Backend: `GroupEngineAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java).
 * Response maps are built in `SecurityGroupEngineUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Only an engine's owners change which groups have access to it; being an
 * admin counts for nothing here. Errors follow `ResourceUtility.respond`: 401
 * when the session is invalid (or anonymous, for writes), 403 when the caller
 * may not do it, 400 for bad input and 500 for unexpected failures, each with
 * an `{ errorMessage }` body (surfaced as `ApiError`).
 */

import type { RequestOptions } from "../../../../types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Reads one group's permission on an engine. Any session may call it,
 * anonymous included; the caller's own access is not checked.
 *
 * @name getGroupAppPermission
 * @endpoint GET /api/auth/group/engine/getGroupAppPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java#getGroupAppPermission
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.type - The group's type (e.g. `"CUSTOM"` or a login provider).
 * @param params.appId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns The permission name; `permission` is absent when the group has no access.
 * @throws {ApiError} 400 if any parameter is missing.
 */
export function getGroupAppPermission(
	params: { groupId: string; type: string; appId: string },
	options?: RequestOptions,
): Promise<{ permission?: "OWNER" | "EDIT" | "READ_ONLY" }> {
	return get(
		path`/api/auth/group/engine/getGroupAppPermission`,
		params,
		options,
	);
}

/**
 * Gives a group access to an engine. On a model, `usageLimit` sets the team
 * limit (shared and each-member rules); only the engine's owners can.
 *
 * @name addGroupEnginePermission
 * @endpoint POST /api/auth/group/engine/addGroupEnginePermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java#addGroupEnginePermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.engineId - The engine.
 * @param params.permission - Permission to grant (anything else is read only).
 * @param params.endDate - When the access ends.
 * @param params.usageLimit - The team limit on a model, sent as JSON; `null` for no limit defined.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the engine; 400 if a field is missing, the group already has access, or the limit cannot be set there.
 */
export function addGroupEnginePermission(
	params: {
		groupId: string;
		type: string;
		engineId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
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
		path`/api/auth/group/engine/addGroupEnginePermission`,
		params,
		options,
	);
}

/**
 * Changes a group's permission on an engine, keeping its team limit on a
 * model. Only the engine's owners can.
 *
 * @name editGroupAppPermission
 * @endpoint POST /api/auth/group/engine/editGroupAppPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java#editGroupAppPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.appId - The engine.
 * @param params.permission - The new permission.
 * @param params.endDate - When the access ends.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the engine; 400 if a field is missing or the group has no access.
 */
export function editGroupAppPermission(
	params: {
		groupId: string;
		type: string;
		appId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/engine/editGroupAppPermission`,
		params,
		options,
	);
}

/**
 * Takes a group's access to an engine away. Only the engine's owners can.
 *
 * @name removeGroupAppPermission
 * @endpoint POST /api/auth/group/engine/removeGroupAppPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java#removeGroupAppPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.appId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the engine; 400 if a field is missing or the group has no access.
 */
export function removeGroupAppPermission(
	params: { groupId: string; type: string; appId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/engine/removeGroupAppPermission`,
		params,
		options,
	);
}

/**
 * Lists the groups that have access to an engine, paged, with the total, for
 * anyone who can view the engine (anonymous sessions included).
 *
 * @name getGroupsWithAccessToEngine
 * @endpoint GET /api/auth/group/engine/getGroupsWithAccessToEngine
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java#getAllGroupsWithAccessToEngine
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of groups (keys in upper case, as the query returns them) and the total.
 * @throws {ApiError} 403 if the caller cannot view the engine; 400 if `engineId` is missing.
 */
export function getGroupsWithAccessToEngine(
	params: { engineId: string; limit?: number; offset?: number },
	options?: RequestOptions,
): Promise<{
	totalGroups: number;
	groups: Array<{
		ID: string;
		TYPE: string;
		/** Permission id: 1 = owner, 2 = edit, 3 = read only. */
		PERMISSION: 1 | 2 | 3;
		DATEADDED?: string;
		ENDDATE?: string;
	}>;
}> {
	return get(
		path`/api/auth/group/engine/getGroupsWithAccessToEngine`,
		params,
		options,
	);
}

/**
 * Lists the groups that do not have access to an engine yet, for its owners to
 * choose from.
 *
 * @name getAvailableGroupsForEngine
 * @endpoint GET /api/auth/group/engine/getAvailableGroupsForEngine
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupEngineAuthorizationResource.java#getAvailableGroupsForEngine
 * @param params - Query parameters.
 * @param params.engineId - The engine.
 * @param params.searchTerm - Case-insensitive search on the group id.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The groups, ordered by id and type.
 * @throws {ApiError} 403 if the caller is not an owner of the engine; 400 if `engineId` is missing.
 */
export function getAvailableGroupsForEngine(
	params: {
		engineId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<Array<{ id: string; type: string; description?: string }>> {
	return get(
		path`/api/auth/group/engine/getAvailableGroupsForEngine`,
		params,
		options,
	);
}
