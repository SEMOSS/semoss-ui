/**
 * Admin insight permissions — `/api/auth/admin/insight`.
 *
 * Backend: `AdminInsightAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java).
 * Response maps are built in `SecurityAdminUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Every endpoint here is admin-only. This resource does not use
 * `ResourceUtility.respond`: a missing session **and** a caller who is not an
 * admin are both answered with 401, and a failed change with 400 (the
 * exception message as `{ errorMessage }`).
 *
 * An insight is identified by its project and its id.
 */

import type { RequestOptions } from "../../../../lib/api-types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Lists every insight on the server (or in one project), paged, with the
 * caller's own permission and favorite flag on each.
 *
 * @name getInsights
 * @endpoint GET /api/auth/admin/insight/getInsights
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#getInsights
 * @param params - Query parameters.
 * @param params.projectId - Only insights of this project.
 * @param params.searchTerm - Search on the insight name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per insight. `app_*` keys are legacy aliases of the `project_*` keys.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
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
		app_id: string;
		app_name: string;
		app_insight_id: string;
		project_id: string;
		project_name: string;
		project_global: boolean;
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
		low_name: string;
		/** The caller's permission ids (1 = owner, 2 = edit, 3 = read only), or `null`. */
		insight_permission?: number;
		project_permission?: number;
		insight_group_permission?: number;
		project_group_permission?: number;
		/** The caller's effective permission id on the insight. */
		permission?: number;
		/** `1` when the caller marked it a favorite, otherwise `0`. */
		insight_favorite: number;
	}>
> {
	return get(path`/api/auth/admin/insight/getInsights`, params, options);
}

/**
 * Lists every insight of a project, sorted by name.
 *
 * @name getProjectInsights
 * @endpoint GET /api/auth/admin/insight/getProjectInsights
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#getProjectInsights
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.searchTerm - Accepted but ignored by the backend.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per insight.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getProjectInsights(
	params: { projectId: string; searchTerm?: string },
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
	}>
> {
	return get(
		path`/api/auth/admin/insight/getProjectInsights`,
		params,
		options,
	);
}

/**
 * Lists every insight of a project with the permission one user has on each
 * (`null` when the user has none).
 *
 * @name getAllProjectInsightUsers
 * @endpoint POST /api/auth/admin/insight/getAllProjectInsightUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#getAllProjectInsightUsers
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.userId - The user.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per insight, sorted by name.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
 */
export function getAllProjectInsightUsers(
	params: { projectId: string; userId: string },
	options?: RequestOptions,
): Promise<
	Array<{
		insight_id: string;
		insight_name: string;
		insight_public: boolean;
		project_id: string;
		/** Permission name: `"OWNER"`, `"EDIT"` or `"READ_ONLY"`, or `null`. */
		insight_permission?: string;
		user_id?: string;
	}>
> {
	return post(
		path`/api/auth/admin/insight/getAllProjectInsightUsers`,
		params,
		options,
	);
}

/**
 * Deletes insights from a project.
 *
 * @name deleteProjectInsights
 * @endpoint POST /api/auth/admin/insight/deleteProjectInsights
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#deleteProjectInsights
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - Ids of the insights to delete.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid, the caller is not an admin, or the delete fails.
 */
export function deleteProjectInsights(
	params: { projectId: string; insightId: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/deleteProjectInsights`,
		params,
		options,
	);
}

/**
 * Lists the users who have explicit permission on an insight, paged.
 *
 * @name getInsightUsers
 * @endpoint GET /api/auth/admin/insight/getInsightUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#getInsightUsers
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.userId - Search on the user.
 * @param params.permission - Only users with this permission.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of members and the total member count for the same filters.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
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
		email?: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	}>;
}> {
	return get(path`/api/auth/admin/insight/getInsightUsers`, params, options);
}

/**
 * Adds a user to an insight with a permission.
 *
 * @name addInsightUserPermission
 * @endpoint POST /api/auth/admin/insight/addInsightUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#addInsightUserPermission
 * @param params - Form fields.
 * @param params.id - The user id to add.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the user already has access.
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
		path`/api/auth/admin/insight/addInsightUserPermission`,
		params,
		options,
	);
}

/**
 * Grants a user the same permission on every insight of a project.
 *
 * @name grantAllProjectInsights
 * @endpoint POST /api/auth/admin/insight/grantAllProjectInsights
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#grantAllProjectInsights
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.userId - The user to grant access to.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the grant fails.
 */
export function grantAllProjectInsights(
	params: {
		projectId: string;
		userId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/grantAllProjectInsights`,
		params,
		options,
	);
}

/**
 * Gives every user created from now on a permission on an insight.
 *
 * @name grantNewUsersInsightAccess
 * @endpoint POST /api/auth/admin/insight/grantNewUsersInsightAccess
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#grantNewUsersInsightAccess
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.permission - Permission new users receive.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the grant fails.
 */
export function grantNewUsersInsightAccess(
	params: {
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/grantNewUsersInsightAccess`,
		params,
		options,
	);
}

/**
 * Adds every user on the server to an insight with the same permission.
 *
 * @name addAllUsers
 * @endpoint POST /api/auth/admin/insight/addAllUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#addAllUsers
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the change fails.
 */
export function addAllUsers(
	params: {
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/insight/addAllUsers`, params, options);
}

/**
 * Changes one user's permission on an insight.
 *
 * @name editInsightUserPermission
 * @endpoint POST /api/auth/admin/insight/editInsightUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#editInsightUserPermission
 * @param params - Form fields.
 * @param params.id - The user id.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.permission - The new permission.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the user has no access.
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
		path`/api/auth/admin/insight/editInsightUserPermission`,
		params,
		options,
	);
}

/**
 * Changes several users' permissions on an insight in one call.
 *
 * @name editInsightUserPermissions
 * @endpoint POST /api/auth/admin/insight/editInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#editInsightUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.userpermissions - One entry per user.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if any user has no access.
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
		path`/api/auth/admin/insight/editInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Sets every user of an insight to the same permission.
 *
 * @name updateInsightUserPermissions
 * @endpoint POST /api/auth/admin/insight/updateInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#updateAppUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.permission - The permission every user gets.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the change fails.
 */
export function updateInsightUserPermissions(
	params: {
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/updateInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes one user from an insight.
 *
 * @name removeInsightUserPermission
 * @endpoint POST /api/auth/admin/insight/removeInsightUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#removeInsightUserPermission
 * @param params - Form fields.
 * @param params.id - The user id.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the removal fails.
 */
export function removeInsightUserPermission(
	params: { id: string; projectId: string; insightId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/removeInsightUserPermission`,
		params,
		options,
	);
}

/**
 * Makes an insight public (every user who can open its project can open it)
 * or private, in the security database and the project's insight database.
 *
 * @name setInsightGlobal
 * @endpoint POST /api/auth/admin/insight/setInsightGlobal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#setInsightGlobal
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.isPublic - `true` for public.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the update fails.
 */
export function setInsightGlobal(
	params: { projectId: string; insightId: string; isPublic: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/setInsightGlobal`,
		params,
		options,
	);
}

/**
 * Searches for users who do not yet have access to an insight.
 *
 * @name getInsightUsersNoCredentials
 * @endpoint GET /api/auth/admin/insight/getInsightUsersNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#getInsightUsersNoCredentials
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.searchTerm - Search on the user.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin.
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
		path`/api/auth/admin/insight/getInsightUsersNoCredentials`,
		params,
		options,
	);
}

/**
 * Adds several users to an insight in one call (one permission batch, all or none).
 *
 * @name addInsightUserPermissions
 * @endpoint POST /api/auth/admin/insight/addInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#addInsightUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.userpermissions - One entry per user.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if any user already has access.
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
		path`/api/auth/admin/insight/addInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes several users from an insight in one call.
 *
 * @name removeInsightUserPermissions
 * @endpoint POST /api/auth/admin/insight/removeInsightUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#removeInsightUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.ids - User ids to remove.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the removal fails.
 */
export function removeInsightUserPermissions(
	params: { projectId: string; insightId: string; ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/removeInsightUserPermissions`,
		params,
		options,
	);
}

/**
 * Approves pending access requests for an insight, granting each requester
 * the permission in their request. The caller is recorded as the approver.
 *
 * @name approveInsightUserAccessRequest
 * @endpoint POST /api/auth/admin/insight/approveInsightUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#approveInsightUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.requests - The requests to approve.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the approval fails.
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
		path`/api/auth/admin/insight/approveInsightUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Denies pending access requests for an insight. The caller is recorded as
 * the approver.
 *
 * @name denyInsightUserAccessRequest
 * @endpoint POST /api/auth/admin/insight/denyInsightUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminInsightAuthorizationResource.java#denyInsightUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.insightId - The insight.
 * @param params.requestids - Ids of the requests to deny.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 401 if the session is invalid or the caller is not an admin; 400 if the update fails.
 */
export function denyInsightUserAccessRequest(
	params: { projectId: string; insightId: string; requestids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/insight/denyInsightUserAccessRequest`,
		params,
		options,
	);
}
