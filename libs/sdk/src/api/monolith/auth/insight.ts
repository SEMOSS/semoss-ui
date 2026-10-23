/**
 * Insight permissions for the signed-in user — `/api/auth/insight`.
 *
 * Backend: `InsightAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java).
 * Response maps are built in `SecurityInsightUtils` and `SecurityUserInsightUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Errors follow `ResourceUtility.respond`: 401 when the session is invalid (and,
 * for writes, when the session is anonymous), 403 when the caller lacks the
 * permission or the server limits the action to admins, 400 for bad input and
 * 500 for unexpected failures, each with an `{ errorMessage }` body (surfaced
 * as `ApiError`).
 */

import type { RequestOptions } from "../../../lib/api-types";
import { get, post } from "../../../lib/http";
import { path } from "../../../lib/url";

/**
 * Searches the insights the caller can open, across all their projects or in
 * one project. Anonymous sessions are allowed.
 *
 * @name getInsights
 * @endpoint GET /api/auth/insight/getInsights
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#getInsights
 * @param params - Query parameters.
 * @param params.projectId - Only insights of this project.
 * @param params.searchTerm - Case-insensitive search on the insight name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per insight, with the caller's permissions on it and its project.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function getInsights(
	params: {
		projectId?: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{
		/** Legacy alias of `project_id`. */
		app_id: string;
		/** Legacy alias of `project_name`. */
		app_name: string;
		/** Legacy alias of `project_insight_id`. */
		app_insight_id: string;
		project_id: string;
		project_name: string;
		project_global: boolean;
		project_catalog_name?: string;
		project_insight_id: string;
		name: string;
		view_count?: number;
		layout?: string;
		created_on?: string;
		last_modified_on?: string;
		cacheable?: boolean;
		cacheMinutes?: number;
		cacheCron?: string;
		cachedOn?: string;
		cacheEncrypt?: boolean;
		insight_global: boolean;
		insight_schema_name?: string;
		low_name: string;
		/** Permission ids (1 = owner, 2 = edit, 3 = read only), or `null` when none. */
		insight_permission?: 1 | 2 | 3;
		project_permission?: 1 | 2 | 3;
		insight_group_permission?: 1 | 2 | 3;
		project_group_permission?: 1 | 2 | 3;
		/** The caller's favorite flag, coalesced to `0` when unset. */
		insight_favorite: boolean | number;
		/** The effective permission id: owner when the caller owns the project, else the best insight permission. */
		permission?: 1 | 2 | 3;
	}>
> {
	return get(path`/api/auth/insight/getInsights`, params, options);
}

/**
 * Lists the insights in a project the caller can edit: every insight for a
 * project owner, or those with explicit owner/edit permission for a project
 * editor. Read-only or no access returns an empty list. Anonymous sessions are
 * allowed.
 *
 * @name getProjectInsights
 * @endpoint GET /api/auth/insight/getProjectInsights
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#getProjectInsights
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per editable insight.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function getProjectInsights(
	params: { projectId: string },
	options?: RequestOptions,
): Promise<
	Array<{
		project_id: string;
		project_insight_id: string;
		name: string;
		insight_global: boolean;
		exec_count?: number;
		created_on?: string;
		last_modified_on?: string;
		cacheable?: boolean;
		/** The caller's insight permission; set only for project editors. */
		permission?: "OWNER" | "EDIT";
		/** Set instead of `permission` for project owners (an unaliased constant selector). */
		CONSTANT_OWNER?: "OWNER";
	}>
> {
	return get(path`/api/auth/insight/getProjectInsights`, params, options);
}

/**
 * Returns the caller's effective permission on an insight. Anonymous sessions
 * are allowed.
 *
 * @name getUserInsightPermission
 * @endpoint GET /api/auth/insight/getUserInsightPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#getUserInsightPermission
 * @param params - Query parameters.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns The caller's permission name.
 * @throws {ApiError} 403 if the caller has no access to the insight.
 */
export function getUserInsightPermission(
	params: { projectId: string; insightId: string },
	options?: RequestOptions,
): Promise<{ permission: "OWNER" | "EDIT" | "READ_ONLY" }> {
	return get(
		path`/api/auth/insight/getUserInsightPermission`,
		params,
		options,
	);
}

/**
 * Lists the members of an insight and their permissions, paged. The caller
 * must be able to view the insight. Anonymous sessions are allowed.
 *
 * @name getInsightUsers
 * @endpoint GET /api/auth/insight/getInsightUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#getInsightUsers
 * @param params - Query parameters.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.userId - Search on user id, name, username or email.
 * @param params.permission - Only members with this permission.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of members and the total member count for the same filters.
 * @throws {ApiError} 403 if the caller cannot view the insight.
 */
export function getInsightUsers(
	params: {
		projectId: string;
		insightId: string;
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
		name?: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		email?: string;
	}>;
}> {
	return get(path`/api/auth/insight/getInsightUsers`, params, options);
}

/**
 * Adds a user to an insight with a permission. A user without access to the
 * insight's project is first added to the project as read only.
 *
 * @name addInsightUserPermission
 * @endpoint POST /api/auth/insight/addInsightUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#addInsightUserPermission
 * @param params - Form fields.
 * @param params.id - The user id to add.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not add users to the project or insight; 400 if the user already has access.
 */
export function addInsightUserPermission(
	params: {
		id: string;
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/addInsightUserPermission`,
		params,
		options,
	);
}

/**
 * Changes one member's permission on an insight.
 *
 * @name editInsightUserPermission
 * @endpoint POST /api/auth/insight/editInsightUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#editInsightUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.permission - The new permission.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the member's access.
 */
export function editInsightUserPermission(
	params: {
		id: string;
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/editInsightUserPermission`,
		params,
		options,
	);
}

/**
 * Changes several members' permissions on an insight in one call. Only owners
 * may grant owner.
 *
 * @name editInsightUserPermissions
 * @endpoint POST /api/auth/insight/editInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#editInsightUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.userpermissions - One entry per member.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change access, or the server limits this to admins; 400 if a member has no access.
 */
export function editInsightUserPermissions(
	params: {
		projectId: string;
		insightId: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/editInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes one member from an insight.
 *
 * @name removeInsightUserPermission
 * @endpoint POST /api/auth/insight/removeInsightUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#removeInsightUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not remove the member.
 */
export function removeInsightUserPermission(
	params: { id: string; projectId: string; insightId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/removeInsightUserPermission`,
		params,
		options,
	);
}

/**
 * Makes an insight public within its project (every project member can open
 * it) or private. Only the insight's owner may; making it public may also
 * require admin rights.
 *
 * @name setInsightGlobal
 * @endpoint POST /api/auth/insight/setInsightGlobal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#setInsightGlobal
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.isPublic - `true` for public.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not the insight's owner, or the server limits making insights public to admins.
 */
export function setInsightGlobal(
	params: { projectId: string; insightId: string; isPublic: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/insight/setInsightGlobal`, params, options);
}

/**
 * Marks or unmarks an insight as one of the caller's favorites.
 *
 * @name setInsightFavorite
 * @endpoint POST /api/auth/insight/setInsightFavorite
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#setInsightFavorite
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.isFavorite - `true` to favorite it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller cannot view the insight.
 * @remarks The Java method also declares an unannotated `String appId` entity parameter next to the form; it is unused.
 */
export function setInsightFavorite(
	params: { projectId: string; insightId: string; isFavorite: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/insight/setInsightFavorite`, params, options);
}

/**
 * Shows or hides an insight in the caller's own insight list.
 *
 * @name setInsightVisibility
 * @endpoint POST /api/auth/insight/setInsightVisibility
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#setInsightVisibility
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.visibility - `true` to show it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller cannot view the insight.
 */
export function setInsightVisibility(
	params: { projectId: string; insightId: string; visibility: boolean },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/insight/setInsightVisibility`, params, options);
}

/**
 * Searches for users who do not yet have access to an insight. The caller
 * must be able to view the insight. Anonymous sessions are allowed.
 *
 * @name getInsightUsersNoCredentials
 * @endpoint GET /api/auth/insight/getInsightUsersNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#getInsightUsersNoCredentials
 * @param params - Query parameters.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.searchTerm - Search on user id, name, username or email.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users.
 * @throws {ApiError} 403 if the caller cannot view the insight.
 */
export function getInsightUsersNoCredentials(
	params: {
		projectId: string;
		insightId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		username?: string;
		name?: string;
		email?: string;
	}>
> {
	return get(
		path`/api/auth/insight/getInsightUsersNoCredentials`,
		params,
		options,
	);
}

/**
 * Adds several users to an insight in one call.
 *
 * @name addInsightUserPermissions
 * @endpoint POST /api/auth/insight/addInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#addInsightUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.userpermissions - One entry per user.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the server limits this to admins; 400 if the caller lacks permission, a user already has access, or a non-owner grants owner.
 */
export function addInsightUserPermissions(
	params: {
		projectId: string;
		insightId: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/addInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes several members from an insight in one call.
 *
 * @name removeInsightUserPermissions
 * @endpoint POST /api/auth/insight/removeInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#removeInsightUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.ids - User ids to remove.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not remove members, or the server limits this to admins.
 */
export function removeInsightUserPermissions(
	params: { projectId: string; insightId: string; ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/removeInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Approves pending access requests for an insight, granting each requester
 * the permission in their request.
 *
 * @name approveInsightUserAccessRequest
 * @endpoint POST /api/auth/insight/approveInsightUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#approveInsightUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.requests - The requests to approve.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the insight's permissions, or the server limits this to admins.
 */
export function approveInsightUserAccessRequest(
	params: {
		projectId: string;
		insightId: string;
		requests: Array<{
			requestid: string;
			userid: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/approveInsightUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Denies pending access requests for an insight. Only the insight's owners
 * may deny.
 *
 * @name denyInsightUserAccessRequest
 * @endpoint POST /api/auth/insight/denyInsightUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/InsightAuthorizationResource.java#denyInsightUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The insight's project.
 * @param params.insightId - The insight.
 * @param params.requestIds - Ids of the requests to deny.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the insight, or the server limits this to admins.
 */
export function denyInsightUserAccessRequest(
	params: { projectId: string; insightId: string; requestIds: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/insight/denyInsightUserAccessRequest`,
		params,
		options,
	);
}
