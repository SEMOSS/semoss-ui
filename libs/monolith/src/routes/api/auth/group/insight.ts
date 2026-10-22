/**
 * Group access to insights — `/api/auth/group/insight`.
 *
 * Backend: `GroupInsightAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java).
 * Response maps are built in `SecurityGroupInsightsUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Only an insight's owners change which groups have access to it; being an
 * admin counts for nothing here. Errors follow `ResourceUtility.respond`: 401
 * when the session is invalid (or anonymous, except for
 * {@link getGroupInsightPermission}), 403 when the caller may not do it, 400
 * for bad input and 500 for unexpected failures, each with an
 * `{ errorMessage }` body (surfaced as `ApiError`).
 */

import type { RequestOptions } from "../../../../types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Reads one group's permission on an insight. Any session may call it,
 * anonymous included; the caller's own access is not checked.
 *
 * @name getGroupInsightPermission
 * @endpoint GET /api/auth/group/insight/getGroupInsightPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java#getGroupInsightPermission
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.type - The group's type (e.g. `"CUSTOM"` or a login provider).
 * @param params.projectId - The project the insight belongs to.
 * @param params.insightId - The insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns The permission name; `permission` is absent when the group has no access.
 * @throws {ApiError} 400 if any parameter is missing.
 */
export function getGroupInsightPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		insightId: string;
	},
	options?: RequestOptions,
): Promise<{ permission?: "OWNER" | "EDIT" | "READ_ONLY" }> {
	return get(
		path`/api/auth/group/insight/getGroupInsightPermission`,
		params,
		options,
	);
}

/**
 * Gives a group access to an insight. Only the insight's owners can.
 *
 * @name addGroupInsightPermission
 * @endpoint POST /api/auth/group/insight/addGroupInsightPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java#addGroupInsightPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project the insight belongs to.
 * @param params.insightId - The insight.
 * @param params.permission - Permission to grant (anything else is read only).
 * @param params.endDate - When the access ends.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the insight; 400 if a field is missing or the group already has access.
 */
export function addGroupInsightPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/insight/addGroupInsightPermission`,
		params,
		options,
	);
}

/**
 * Changes a group's permission on an insight. Only the insight's owners can.
 *
 * @name editGroupInsightPermission
 * @endpoint POST /api/auth/group/insight/editGroupInsightPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java#editGroupInsightPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project the insight belongs to.
 * @param params.insightId - The insight.
 * @param params.permission - The new permission.
 * @param params.endDate - When the access ends.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the insight; 400 if a field is missing or the group has no access.
 */
export function editGroupInsightPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		insightId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/insight/editGroupInsightPermission`,
		params,
		options,
	);
}

/**
 * Takes a group's access to an insight away. Only the insight's owners can.
 *
 * @name removeGroupInsightPermission
 * @endpoint POST /api/auth/group/insight/removeGroupInsightPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java#removeGroupInsightPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project the insight belongs to.
 * @param params.insightId - The insight.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the insight; 400 if a field is missing or the group has no access.
 */
export function removeGroupInsightPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		insightId: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/group/insight/removeGroupInsightPermission`,
		params,
		options,
	);
}

/**
 * Lists the groups that have access to an insight, paged, with the total, for
 * anyone signed in who can view the insight.
 *
 * @name getGroupsWithAccessToInsight
 * @endpoint GET /api/auth/group/insight/getGroupsWithAccessToInsight
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java#getGroupsWithAccessToInsight
 * @param params - Query parameters.
 * @param params.projectId - The project the insight belongs to.
 * @param params.insightId - The insight.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of groups (keys in upper case, as the query returns them; no end date, unlike the project and engine versions) and the total.
 * @throws {ApiError} 403 if the caller cannot view the insight; 400 if `projectId` or `insightId` is missing.
 */
export function getGroupsWithAccessToInsight(
	params: {
		projectId: string;
		insightId: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<{
	totalGroups: number;
	groups: Array<{
		ID: string;
		TYPE: string;
		/** Permission id: 1 = owner, 2 = edit, 3 = read only. */
		PERMISSION: 1 | 2 | 3;
		DATEADDED?: string;
	}>;
}> {
	return get(
		path`/api/auth/group/insight/getGroupsWithAccessToInsight`,
		params,
		options,
	);
}

/**
 * Lists the groups that do not have access to an insight yet, for its owners
 * to choose from.
 *
 * @name getAvailableGroupsForInsight
 * @endpoint GET /api/auth/group/insight/getAvailableGroupsForInsight
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupInsightAuthorizationResource.java#getAvailableGroupsForInsight
 * @param params - Query parameters.
 * @param params.projectId - The project the insight belongs to.
 * @param params.insightId - The insight.
 * @param params.searchTerm - Case-insensitive search on the group id.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The groups, ordered by id and type.
 * @throws {ApiError} 403 if the caller is not an owner of the insight; 400 if `projectId` or `insightId` is missing.
 */
export function getAvailableGroupsForInsight(
	params: {
		projectId: string;
		insightId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<Array<{ id: string; type: string; description?: string }>> {
	return get(
		path`/api/auth/group/insight/getAvailableGroupsForInsight`,
		params,
		options,
	);
}
