/**
 * Group access to projects — `/api/auth/group/project`.
 *
 * Backend: `GroupProjectAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java).
 * Response maps are built in `SecurityGroupProjectUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Only a project's owners change which groups have access to it; being an
 * admin counts for nothing here. Errors follow `ResourceUtility.respond`: 401
 * when the session is invalid (or anonymous, for writes), 403 when the caller
 * may not do it, 400 for bad input and 500 for unexpected failures, each with
 * an `{ errorMessage }` body (surfaced as `ApiError`).
 */

import type { RequestOptions } from "../../../../types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Reads one group's permission on a project. Any session may call it,
 * anonymous included; the caller's own access is not checked.
 *
 * @name getGroupProjectPermission
 * @endpoint GET /api/auth/group/project/getGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java#getGroupProjectPermission
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.type - The group's type (e.g. `"CUSTOM"` or a login provider).
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns The permission name; `permission` is absent when the group has no access.
 * @throws {ApiError} 400 if any parameter is missing.
 */
export function getGroupProjectPermission(
	params: { groupId: string; type: string; projectId: string },
	options?: RequestOptions,
): Promise<{ permission?: "OWNER" | "EDIT" | "READ_ONLY" }> {
	return get(
		path`/api/auth/group/project/getGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Gives a group access to a project. Only the project's owners can.
 *
 * @name addGroupProjectPermission
 * @endpoint POST /api/auth/group/project/addGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java#addGroupProjectPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project.
 * @param params.permission - Permission to grant (anything else is read only).
 * @param params.endDate - When the access ends.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the project; 400 if a field is missing or the group already has access.
 */
export function addGroupProjectPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/project/addGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Changes a group's permission on a project. Only the project's owners can.
 *
 * @name editGroupProjectPermission
 * @endpoint POST /api/auth/group/project/editGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java#editGroupProjectPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project.
 * @param params.permission - The new permission.
 * @param params.endDate - When the access ends.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the project; 400 if a field is missing or the group has no access.
 */
export function editGroupProjectPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/project/editGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Takes a group's access to a project away. Only the project's owners can.
 *
 * @name removeGroupProjectPermission
 * @endpoint POST /api/auth/group/project/removeGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java#removeGroupProjectPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the project; 400 if a field is missing or the group has no access.
 */
export function removeGroupProjectPermission(
	params: { groupId: string; type: string; projectId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/project/removeGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Lists the groups that have access to a project, paged, with the total, for
 * anyone who can view the project (anonymous sessions included).
 *
 * @name getGroupsWithAccessToProject
 * @endpoint GET /api/auth/group/project/getGroupsWithAccessToProject
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java#getAllGroupsWithAccessToProject
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of groups (keys in upper case, as the query returns them) and the total.
 * @throws {ApiError} 403 if the caller cannot view the project; 400 if `projectId` is missing.
 */
export function getGroupsWithAccessToProject(
	params: { projectId: string; limit?: number; offset?: number },
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
		path`/api/auth/group/project/getGroupsWithAccessToProject`,
		params,
		options,
	);
}

/**
 * Lists the groups that do not have access to a project yet, for its owners to
 * choose from.
 *
 * @name getAvailableGroupsForProject
 * @endpoint GET /api/auth/group/project/getAvailableGroupsForProject
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupProjectAuthorizationResource.java#getAvailableGroupsForProject
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.searchTerm - Case-insensitive search on the group id.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The groups, ordered by id and type.
 * @throws {ApiError} 403 if the caller is not an owner of the project; 400 if `projectId` is missing.
 */
export function getAvailableGroupsForProject(
	params: {
		projectId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<Array<{ id: string; type: string; description?: string }>> {
	return get(
		path`/api/auth/group/project/getAvailableGroupsForProject`,
		params,
		options,
	);
}
