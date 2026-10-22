/**
 * Admin groups (teams) — `/api/auth/admin/group`.
 *
 * Backend: `AdminGroupAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java).
 * Response maps are built in `AdminSecurityGroupUtils` and
 * `SecurityGroupManagerUtils` (Semoss/src/prerna/auth/utils); column keys come
 * back lower-cased.
 *
 * Every endpoint here is admin-only. Errors follow `ResourceUtility.respondAsAdmin`:
 * 401 when the session is invalid, 403 when the caller is not an admin,
 * 400 for bad input and 500 for unexpected failures, each with an
 * `{ errorMessage }` body (surfaced as `ApiError`).
 *
 * A group is identified by its id and its type: `"CUSTOM"` for groups made in
 * SEMOSS, otherwise the login provider whose groups it mirrors. Group grants
 * take numeric permissions: 1 = owner, 2 = edit, 3 = read only.
 */

import type { RequestOptions } from "../../../../types";
import { get, post } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Lists every group, paged and sorted by type then id. Custom groups also
 * carry their member count.
 *
 * @name getGroups
 * @endpoint GET /api/auth/admin/group/getGroups
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getGroups
 * @param params - Query parameters.
 * @param params.searchTerm - Search on the group id.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per group.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function getGroups(
	params: { searchTerm?: string; limit?: number; offset?: number } = {},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		type: string;
		description?: string;
		created_by_userid?: string;
		created_by_useridtype?: string;
		dateadded?: string;
		/** Only on `"CUSTOM"` groups. */
		member_count?: number;
	}>
> {
	return get(path`/api/auth/admin/group/getGroups`, params, options);
}

/**
 * Reads one group's details.
 *
 * @name getGroupDetails
 * @endpoint GET /api/auth/admin/group/getGroupDetails
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getGroupDetails
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param options - Per-call overrides (signal, headers).
 * @returns The group.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the group does not exist.
 */
export function getGroupDetails(
	params: { groupId: string; type: string },
	options?: RequestOptions,
): Promise<{
	id: string;
	type: string;
	description?: string;
	created_by_userid?: string;
	created_by_useridtype?: string;
	dateadded?: string;
}> {
	return get(path`/api/auth/admin/group/getGroupDetails`, params, options);
}

/**
 * Counts the groups, for paging {@link getGroups}.
 *
 * @name getNumGroups
 * @endpoint GET /api/auth/admin/group/getNumGroups
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getNumGroups
 * @param params - Query parameters.
 * @param params.searchTerm - Search on the group id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The number of groups.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function getNumGroups(
	params: { searchTerm?: string } = {},
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/admin/group/getNumGroups`, params, options);
}

/**
 * Creates a group.
 *
 * @name addGroup
 * @endpoint POST /api/auth/admin/group/addGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#addGroup
 * @param params - Form fields.
 * @param params.groupId - The new group's id (its name).
 * @param params.type - The group's type, e.g. `"CUSTOM"`.
 * @param params.description - Description (defaults to empty).
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the id or type is missing or the group exists.
 */
export function addGroup(
	params: { groupId: string; type: string; description?: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/group/addGroup`, params, options);
}

/**
 * Deletes a group and every grant, membership and manager it has.
 *
 * @name deleteGroup
 * @endpoint POST /api/auth/admin/group/deleteGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#deleteGroup
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the id is missing.
 */
export function deleteGroup(
	params: { groupId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/group/deleteGroup`, params, options);
}

/**
 * Renames a group and/or changes its description, carrying the new id through
 * its grants, memberships and managers.
 *
 * @name editGroupDetails
 * @endpoint POST /api/auth/admin/group/editGroupDetails
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#editGroupDetails
 * @param params - Form fields.
 * @param params.groupId - The group's current id.
 * @param params.newGroupId - The new id (send the current id to keep it).
 * @param params.type - The group's type.
 * @param params.newDescription - The new description.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function editGroupDetails(
	params: {
		groupId: string;
		newGroupId: string;
		type: string;
		newDescription?: string;
	},
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/group/editGroupDetails`, params, options);
}

/**
 * Lists the members of a custom group, paged and sorted by name.
 *
 * @name getGroupMembers
 * @endpoint GET /api/auth/admin/group/getGroupMembers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getGroupMembers
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the member.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per member.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getGroupMembers(
	params: {
		groupId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		userid: string;
		type: string;
		dateadded?: string;
		name?: string;
		username?: string;
		email?: string;
	}>
> {
	return get(path`/api/auth/admin/group/getGroupMembers`, params, options);
}

/**
 * Counts the members of a custom group, for paging {@link getGroupMembers}.
 *
 * @name getNumMembersInGroup
 * @endpoint GET /api/auth/admin/group/getNumMembersInGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getNumMembersInGroup
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the member.
 * @param options - Per-call overrides (signal, headers).
 * @returns The number of members.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getNumMembersInGroup(
	params: { groupId: string; searchTerm?: string },
	options?: RequestOptions,
): Promise<number> {
	return get(
		path`/api/auth/admin/group/getNumMembersInGroup`,
		params,
		options,
	);
}

/**
 * Searches for people who are not members of a custom group yet, from the
 * security database or — when the Microsoft directory lookup is enabled on the
 * server and not turned off with `msGraphLookup: false` — the Microsoft directory.
 *
 * @name getNonGroupMembers
 * @endpoint GET /api/auth/admin/group/getNonGroupMembers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getNonGroupMembers
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the user.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.msGraphLookup - Search the Microsoft directory (defaults to `true` when the lookup is enabled).
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users.
 * @remarks Unverified response shape for directory lookups (`MsGraphUtility.getGroupUsers`).
 * @throws {ApiError} 403 if the caller is not an admin or a directory lookup is made without a Microsoft login; 400 if `groupId` is missing.
 */
export function getNonGroupMembers(
	params: {
		groupId: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
		msGraphLookup?: boolean;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		type: string;
		name?: string;
		username?: string;
		email?: string;
		[key: string]: unknown;
	}>
> {
	return get(path`/api/auth/admin/group/getNonGroupMembers`, params, options);
}

/**
 * Adds a person to a custom group. A person picked from the Microsoft
 * directory who is not in the security database yet is added to it.
 *
 * @name addGroupMember
 * @endpoint POST /api/auth/admin/group/addGroupMember
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#addGroupMember
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The person's user id.
 * @param params.type - The person's login type.
 * @param params.endDate - When the membership ends (omit for never).
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function addGroupMember(
	params: { groupId: string; userId: string; type: string; endDate?: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/group/addGroupMember`, params, options);
}

/**
 * Removes a person from a custom group.
 *
 * @name deleteGroupMember
 * @endpoint POST /api/auth/admin/group/deleteGroupMember
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#deleteGroupMember
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The member's user id.
 * @param params.type - The member's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function deleteGroupMember(
	params: { groupId: string; userId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/group/deleteGroupMember`, params, options);
}

/**
 * Lists the managers of a custom group, sorted by name.
 *
 * @name getGroupManagers
 * @endpoint GET /api/auth/admin/group/getGroupManagers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getGroupManagers
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per manager.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getGroupManagers(
	params: { groupId: string },
	options?: RequestOptions,
): Promise<
	Array<{
		userid: string;
		type: string;
		dateadded?: string;
		name?: string;
		username?: string;
		email?: string;
	}>
> {
	return get(path`/api/auth/admin/group/getGroupManagers`, params, options);
}

/**
 * Makes someone a manager of a custom group. A person picked from the
 * Microsoft directory who is not in the security database yet is added to it.
 *
 * @name addGroupManager
 * @endpoint POST /api/auth/admin/group/addGroupManager
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#addGroupManager
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The person's user id.
 * @param params.type - The person's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function addGroupManager(
	params: { groupId: string; userId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/admin/group/addGroupManager`, params, options);
}

/**
 * Removes someone as a manager of a custom group.
 *
 * @name removeGroupManager
 * @endpoint POST /api/auth/admin/group/removeGroupManager
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#removeGroupManager
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The manager's user id.
 * @param params.type - The manager's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function removeGroupManager(
	params: { groupId: string; userId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(
		path`/api/auth/admin/group/removeGroupManager`,
		params,
		options,
	);
}

/**
 * Gives a group access to a project.
 *
 * @name addGroupProjectPermission
 * @endpoint POST /api/auth/admin/group/addGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#addGroupProjectPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project.
 * @param params.permission - Permission to grant (1 = owner, 2 = edit, 3 = read only).
 * @param params.endDate - When the access ends (omit for never).
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing or `permission` is not a number.
 */
export function addGroupProjectPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		permission: 1 | 2 | 3;
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<true> {
	return post(
		path`/api/auth/admin/group/addGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Changes the access a group has to a project.
 *
 * @name editGroupProjectPermission
 * @endpoint POST /api/auth/admin/group/editGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#editGroupProjectPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project.
 * @param params.permission - The new permission (1 = owner, 2 = edit, 3 = read only).
 * @param params.endDate - When the access ends (omit for never).
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing or `permission` is not a number.
 */
export function editGroupProjectPermission(
	params: {
		groupId: string;
		type: string;
		projectId: string;
		permission: 1 | 2 | 3;
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<true> {
	return post(
		path`/api/auth/admin/group/editGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Takes away the access a group has to a project.
 *
 * @name removeGroupProjectPermission
 * @endpoint POST /api/auth/admin/group/removeGroupProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#removeGroupProjectPermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function removeGroupProjectPermission(
	params: { groupId: string; type: string; projectId: string },
	options?: RequestOptions,
): Promise<true> {
	return post(
		path`/api/auth/admin/group/removeGroupProjectPermission`,
		params,
		options,
	);
}

/**
 * Lists the projects a group holds a grant on, with the grant's level and end
 * date and the project's details, sorted by name.
 *
 * @name getProjectsForGroup
 * @endpoint GET /api/auth/admin/group/getProjectsForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getProjectsForGroup
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.groupType - The group's type (note: `groupType` here, `type` on the write endpoints).
 * @param params.searchTerm - Search on the project id or name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.onlyApps - Only projects with a portal.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project grant.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getProjectsForGroup(
	params: {
		groupId: string;
		groupType?: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
		onlyApps?: boolean;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		/** The group id. */
		id: string;
		/** The group type. */
		type: string;
		projectid: string;
		/** Permission id: 1 = owner, 2 = edit, 3 = read only. */
		permission: 1 | 2 | 3;
		enddate?: string;
		project_id: string;
		project_name: string;
		project_type: string;
		project_cost?: string;
		project_global: boolean;
		project_discoverable: boolean;
		project_catalog_name?: string;
		project_created_by?: string;
		project_created_by_type?: string;
		project_date_created?: string;
		project_date_last_edited?: string;
		project_portal_published_date?: string;
		project_published_user?: string;
		project_published_user_type?: string;
		project_reactors_compiled_date?: string;
		project_reactors_compiled_user?: string;
		project_reactors_compiled_user_type?: string;
		low_project_name: string;
	}>
> {
	return get(
		path`/api/auth/admin/group/getProjectsForGroup`,
		params,
		options,
	);
}

/**
 * Counts the projects a group holds a grant on, for paging {@link getProjectsForGroup}.
 *
 * @name getNumProjectsForGroup
 * @endpoint GET /api/auth/admin/group/getNumProjectsForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getNumProjectsForGroup
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.groupType - The group's type.
 * @param params.searchTerm - Search on the project id or name.
 * @param params.onlyApps - Only projects with a portal.
 * @param options - Per-call overrides (signal, headers).
 * @returns The number of projects.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getNumProjectsForGroup(
	params: {
		groupId: string;
		groupType?: string;
		searchTerm?: string;
		onlyApps?: boolean;
	},
	options?: RequestOptions,
): Promise<number> {
	return get(
		path`/api/auth/admin/group/getNumProjectsForGroup`,
		params,
		options,
	);
}

/**
 * Lists the projects a group does not hold a grant on yet (for granting new access).
 *
 * @name getAvailableProjectsForGroup
 * @endpoint GET /api/auth/admin/group/getAvailableProjectsForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getAvailableProjectsForGroup
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.groupType - The group's type.
 * @param params.searchTerm - Search on the project id or name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.onlyApps - Only projects with a portal.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project, sorted by name.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getAvailableProjectsForGroup(
	params: {
		groupId: string;
		groupType?: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
		onlyApps?: boolean;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		project_id: string;
		project_name: string;
		project_type: string;
		project_cost?: string;
		project_global: boolean;
		project_discoverable: boolean;
		project_catalog_name?: string;
		project_created_by?: string;
		project_created_by_type?: string;
		project_date_created?: string;
		project_portal_published_date?: string;
		project_published_user?: string;
		project_published_user_type?: string;
		project_reactors_compiled_date?: string;
		project_reactors_compiled_user?: string;
		project_reactors_compiled_user_type?: string;
		low_project_name: string;
	}>
> {
	return get(
		path`/api/auth/admin/group/getAvailableProjectsForGroup`,
		params,
		options,
	);
}

/**
 * Gives a group access to an engine. On a model, `usageLimit` is the team
 * limit (with shared and each-member rules); omitted or `null` gives no limit.
 *
 * @name addGroupEnginePermission
 * @endpoint POST /api/auth/admin/group/addGroupEnginePermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#addGroupEnginePermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.engineId - The engine.
 * @param params.permission - Permission to grant (1 = owner, 2 = edit, 3 = read only).
 * @param params.endDate - When the access ends (omit for never).
 * @param params.usageLimit - The team limit on the model.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing, `permission` is not a number or the limit is invalid.
 */
export function addGroupEnginePermission(
	params: {
		groupId: string;
		type: string;
		engineId: string;
		permission: 1 | 2 | 3;
		endDate?: string;
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
): Promise<true> {
	return post(
		path`/api/auth/admin/group/addGroupEnginePermission`,
		params,
		options,
	);
}

/**
 * Changes the access a group has to an engine (its team limit is kept).
 *
 * @name editGroupEnginePermission
 * @endpoint POST /api/auth/admin/group/editGroupEnginePermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#editGroupEnginePermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.engineId - The engine.
 * @param params.permission - The new permission (1 = owner, 2 = edit, 3 = read only).
 * @param params.endDate - When the access ends (omit for never).
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing or `permission` is not a number.
 */
export function editGroupEnginePermission(
	params: {
		groupId: string;
		type: string;
		engineId: string;
		permission: 1 | 2 | 3;
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<true> {
	return post(
		path`/api/auth/admin/group/editGroupEnginePermission`,
		params,
		options,
	);
}

/**
 * Takes away the access a group has to an engine.
 *
 * @name removeGroupEnginePermission
 * @endpoint POST /api/auth/admin/group/removeGroupEnginePermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#removeGroupEnginePermission
 * @param params - Form fields.
 * @param params.groupId - The group.
 * @param params.type - The group's type.
 * @param params.engineId - The engine.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a required field is missing.
 */
export function removeGroupEnginePermission(
	params: { groupId: string; type: string; engineId: string },
	options?: RequestOptions,
): Promise<true> {
	return post(
		path`/api/auth/admin/group/removeGroupEnginePermission`,
		params,
		options,
	);
}

/**
 * Lists the engines a group holds a grant on, with the grant's level and end
 * date and the engine's details, sorted by name.
 *
 * @name getEnginesForGroup
 * @endpoint GET /api/auth/admin/group/getEnginesForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getEnginesForGroup
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.groupType - The group's type (note: `groupType` here, `type` on the write endpoints).
 * @param params.searchTerm - Search on the engine id or name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine grant.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getEnginesForGroup(
	params: {
		groupId: string;
		groupType?: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		/** The group id. */
		id: string;
		/** The group type. */
		type: string;
		engineid: string;
		/** Permission id: 1 = owner, 2 = edit, 3 = read only. */
		permission: 1 | 2 | 3;
		enddate?: string;
		engine_id: string;
		engine_name: string;
		engine_type: string;
		engine_subtype?: string;
		engine_cost?: string;
		engine_discoverable: boolean;
		engine_global: boolean;
		engine_created_by?: string;
		engine_created_by_type?: string;
		engine_date_created?: string;
		low_engine_name: string;
	}>
> {
	return get(path`/api/auth/admin/group/getEnginesForGroup`, params, options);
}

/**
 * Counts the engines a group holds a grant on, for paging {@link getEnginesForGroup}.
 *
 * @name getNumEnginesForGroup
 * @endpoint GET /api/auth/admin/group/getNumEnginesForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getNumEnginesForGroup
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.groupType - The group's type.
 * @param params.searchTerm - Search on the engine id or name.
 * @param options - Per-call overrides (signal, headers).
 * @returns The number of engines.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getNumEnginesForGroup(
	params: { groupId: string; groupType?: string; searchTerm?: string },
	options?: RequestOptions,
): Promise<number> {
	return get(
		path`/api/auth/admin/group/getNumEnginesForGroup`,
		params,
		options,
	);
}

/**
 * Lists the engines a group does not hold a grant on yet (for granting new access).
 *
 * @name getAvailableEnginesForGroup
 * @endpoint GET /api/auth/admin/group/getAvailableEnginesForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminGroupAuthorizationResource.java#getAvailableEnginesForGroup
 * @param params - Query parameters.
 * @param params.groupId - The group.
 * @param params.groupType - The group's type.
 * @param params.searchTerm - Search on the engine id or name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine, sorted by name.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if `groupId` is missing.
 */
export function getAvailableEnginesForGroup(
	params: {
		groupId: string;
		groupType?: string;
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		engine_id: string;
		engine_name: string;
		engine_type: string;
		engine_subtype?: string;
		engine_cost?: string;
		engine_discoverable: boolean;
		engine_global: boolean;
		engine_created_by?: string;
		engine_created_by_type?: string;
		engine_date_created?: string;
		low_engine_name: string;
	}>
> {
	return get(
		path`/api/auth/admin/group/getAvailableEnginesForGroup`,
		params,
		options,
	);
}
