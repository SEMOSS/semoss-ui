/**
 * Custom groups, for their managers — `/api/auth/group`.
 *
 * Backend: `GroupAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java).
 * Response maps are built in `SecurityGroupManagerUtils` and
 * `AdminSecurityGroupUtils` (Semoss/src/prerna/auth/utils).
 *
 * A manager lists the custom groups they manage, sees what each can use, and
 * adds or removes members and managers. Being an admin counts for nothing here
 * (admins use `/api/auth/admin/group`). Errors follow `ResourceUtility.respond`:
 * 401 when the session is invalid or anonymous, 403 when the caller may not do
 * it, 400 for bad input (including a group that is not a custom group) and 500
 * for unexpected failures, each with an `{ errorMessage }` body (surfaced as
 * `ApiError`).
 */

import type { RequestOptions } from "../../../lib/api-types";
import { get, post } from "../../../lib/http";
import { path } from "../../../lib/url";

/**
 * Lists the custom groups the caller manages, with when they became a manager
 * and how many members each has.
 *
 * @name getGroups
 * @endpoint GET /api/auth/group/getGroups
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getGroups
 * @param params - Query parameters.
 * @param params.searchTerm - Case-insensitive search on the group id.
 * @param params.limit - Page size (`0` or omitted for all).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per managed group, ordered by id.
 * @throws {ApiError} 401 if the session is invalid or anonymous.
 */
export function getGroups(
	params: { searchTerm?: string; limit?: number; offset?: number } = {},
	options?: RequestOptions,
): Promise<
	Array<{
		id: string;
		/** Always `"CUSTOM"`. */
		type: string;
		description?: string;
		created_by_userid?: string;
		created_by_useridtype?: string;
		dateadded?: string;
		/** When the caller first became a manager (earliest of their logins). */
		manager_since?: string;
		member_count: number;
	}>
> {
	return get(path`/api/auth/group/getGroups`, params, options);
}

/**
 * Counts the custom groups the caller manages.
 *
 * @name getNumGroups
 * @endpoint GET /api/auth/group/getNumGroups
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getNumGroups
 * @param params - Query parameters.
 * @param params.searchTerm - Case-insensitive search on the group id.
 * @param options - Per-call overrides (signal, headers).
 * @returns The count.
 * @throws {ApiError} 401 if the session is invalid or anonymous.
 */
export function getNumGroups(
	params: { searchTerm?: string } = {},
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/group/getNumGroups`, params, options);
}

/**
 * Reads one custom group's details. Only its managers may.
 *
 * @name getGroupDetails
 * @endpoint GET /api/auth/group/getGroupDetails
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getGroupDetails
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param options - Per-call overrides (signal, headers).
 * @returns The group row.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if `groupId` is missing or the group is not a custom group.
 */
export function getGroupDetails(
	params: { groupId: string },
	options?: RequestOptions,
): Promise<{
	id: string;
	type: string;
	description?: string;
	created_by_userid?: string;
	created_by_useridtype?: string;
	dateadded?: string;
}> {
	return get(path`/api/auth/group/getGroupDetails`, params, options);
}

/**
 * Lists the managers of a custom group. Its managers can always see them; the
 * owner of a project or engine passes its id to see them before giving the
 * group access to it.
 *
 * @name getGroupManagers
 * @endpoint GET /api/auth/group/getGroupManagers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getGroupManagers
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.projectId - A project the caller owns and may give the group access to.
 * @param params.engineId - An engine the caller owns and may give the group access to.
 * @param options - Per-call overrides (signal, headers).
 * @returns The managers, ordered by name.
 * @throws {ApiError} 403 if the caller is neither a manager nor the owner of the project or engine passed; 400 if `groupId` is missing.
 */
export function getGroupManagers(
	params: { groupId: string; projectId?: string; engineId?: string },
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
	return get(path`/api/auth/group/getGroupManagers`, params, options);
}

/**
 * Lists the members of a custom group, paged (at most 200 per page). Its
 * managers can always see them; the owners of a project or engine pass its id
 * to see them (also before giving the group access), and its editors can once
 * the group has access.
 *
 * @name getGroupMembers
 * @endpoint GET /api/auth/group/getGroupMembers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getGroupMembers
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.projectId - A project the caller owns or edits.
 * @param params.engineId - An engine the caller owns or edits.
 * @param params.searchTerm - Search on the member's id, name, username or email.
 * @param params.limit - Page size (`0` or omitted, or above 200, reads 200).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The members, ordered by name.
 * @throws {ApiError} 403 if the caller cannot see the group's members; 400 if `groupId` is missing or the group is not a custom group.
 */
export function getGroupMembers(
	params: {
		groupId: string;
		projectId?: string;
		engineId?: string;
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
	return get(path`/api/auth/group/getGroupMembers`, params, options);
}

/**
 * Counts the members of a custom group, for the same people who can list them.
 *
 * @name getNumMembersInGroup
 * @endpoint GET /api/auth/group/getNumMembersInGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getNumMembersInGroup
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.projectId - A project the caller owns or edits.
 * @param params.engineId - An engine the caller owns or edits.
 * @param params.searchTerm - Search on the member's id, name, username or email.
 * @param options - Per-call overrides (signal, headers).
 * @returns The count.
 * @throws {ApiError} 403 if the caller cannot see the group's members; 400 if `groupId` is missing or the group is not a custom group.
 */
export function getNumMembersInGroup(
	params: {
		groupId: string;
		projectId?: string;
		engineId?: string;
		searchTerm?: string;
	},
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/group/getNumMembersInGroup`, params, options);
}

/**
 * Searches for people to add to a custom group: users in the security database
 * who are not members yet or — when the Microsoft directory lookup is enabled
 * and not turned off — the directory, leaving out current members.
 *
 * @name getNonGroupMembers
 * @endpoint GET /api/auth/group/getNonGroupMembers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getNonGroupMembers
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the user's id, name, username or email.
 * @param params.limit - Page size (at most 200).
 * @param params.offset - Rows to skip; for a directory search, `0` starts a new search and anything else continues it.
 * @param params.msGraphLookup - Search the Microsoft directory (`MicrosoftGraphUserLookup.LOOKUP_PARAM`). Defaults to `true` when the directory is enabled; pass `false` to search the security database.
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users. Directory fields are configurable and retain their raw Graph values. Directory results also carry the Graph fields.
 * @remarks Directory `ms_graphapi_jsonPattern` mappings can omit or change the type of user fields. `type` is always a provider string; validate other fields before using them.
 * @throws {ApiError} 403 if the caller does not manage the group, or a directory search needs a Microsoft login; 400 if the group is not a custom group.
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
		id?: unknown;
		type: string;
		name?: unknown;
		username?: unknown;
		email?: unknown;
		[key: string]: unknown;
	}>
> {
	return get(path`/api/auth/group/getNonGroupMembers`, params, options);
}

/**
 * Lists the projects a custom group has access to, so its managers know what
 * the people they add can use. Only the projects' owners and admins change it.
 *
 * @name getProjectsForGroup
 * @endpoint GET /api/auth/group/getProjectsForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getProjectsForGroup
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the project id or name.
 * @param params.limit - Page size (at most 200).
 * @param params.offset - Rows to skip.
 * @param params.onlyApps - Only projects with a portal (apps).
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project with the group's grant on it, ordered by name.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the group is not a custom group.
 */
export function getProjectsForGroup(
	params: {
		groupId: string;
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
	return get(path`/api/auth/group/getProjectsForGroup`, params, options);
}

/**
 * Counts the projects a custom group has access to, with the same filters as
 * {@link getProjectsForGroup}.
 *
 * @name getNumProjectsForGroup
 * @endpoint GET /api/auth/group/getNumProjectsForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getNumProjectsForGroup
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the project id or name.
 * @param params.onlyApps - Only projects with a portal (apps).
 * @param options - Per-call overrides (signal, headers).
 * @returns The count.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the group is not a custom group.
 */
export function getNumProjectsForGroup(
	params: { groupId: string; searchTerm?: string; onlyApps?: boolean },
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/group/getNumProjectsForGroup`, params, options);
}

/**
 * Lists the engines a custom group has access to, so its managers know what
 * the people they add can use. Only the engines' owners and admins change it.
 *
 * @name getEnginesForGroup
 * @endpoint GET /api/auth/group/getEnginesForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getEnginesForGroup
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the engine id or name.
 * @param params.limit - Page size (at most 200).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per engine with the group's grant on it, ordered by name.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the group is not a custom group.
 */
export function getEnginesForGroup(
	params: {
		groupId: string;
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
	return get(path`/api/auth/group/getEnginesForGroup`, params, options);
}

/**
 * Counts the engines a custom group has access to.
 *
 * @name getNumEnginesForGroup
 * @endpoint GET /api/auth/group/getNumEnginesForGroup
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#getNumEnginesForGroup
 * @param params - Query parameters.
 * @param params.groupId - The custom group.
 * @param params.searchTerm - Search on the engine id or name.
 * @param options - Per-call overrides (signal, headers).
 * @returns The count.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the group is not a custom group.
 */
export function getNumEnginesForGroup(
	params: { groupId: string; searchTerm?: string },
	options?: RequestOptions,
): Promise<number> {
	return get(path`/api/auth/group/getNumEnginesForGroup`, params, options);
}

/**
 * Adds a member to a custom group the caller manages. A person picked from the
 * Microsoft directory who has no account yet gets one, with the details the
 * directory holds.
 *
 * @name addGroupMember
 * @endpoint POST /api/auth/group/addGroupMember
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#addGroupMember
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The new member's user id.
 * @param params.type - The new member's login type (e.g. `"NATIVE"`).
 * @param params.endDate - When the membership ends; omit or blank for never.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the person is already a member, does not exist, or the end date cannot be read.
 */
export function addGroupMember(
	params: { groupId: string; userId: string; type: string; endDate?: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/group/addGroupMember`, params, options);
}

/**
 * Removes a member from a custom group the caller manages.
 *
 * @name deleteGroupMember
 * @endpoint POST /api/auth/group/deleteGroupMember
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#deleteGroupMember
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The member's user id.
 * @param params.type - The member's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the person is not a member.
 */
export function deleteGroupMember(
	params: { groupId: string; userId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/group/deleteGroupMember`, params, options);
}

/**
 * Makes someone a manager of a custom group the caller manages. A person picked
 * from the Microsoft directory who has no account yet gets one.
 *
 * @name addGroupManager
 * @endpoint POST /api/auth/group/addGroupManager
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#addGroupManager
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The new manager's user id.
 * @param params.type - The new manager's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the user does not exist or already manages it.
 */
export function addGroupManager(
	params: { groupId: string; userId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/group/addGroupManager`, params, options);
}

/**
 * Stops someone managing a custom group the caller manages.
 *
 * @name removeGroupManager
 * @endpoint POST /api/auth/group/removeGroupManager
 * @source Monolith/src/prerna/semoss/web/services/local/auth/GroupAuthorizationResource.java#removeGroupManager
 * @param params - Form fields.
 * @param params.groupId - The custom group.
 * @param params.userId - The manager's user id.
 * @param params.type - The manager's login type.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller does not manage the group; 400 if the person does not manage it.
 */
export function removeGroupManager(
	params: { groupId: string; userId: string; type: string },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/group/removeGroupManager`, params, options);
}
