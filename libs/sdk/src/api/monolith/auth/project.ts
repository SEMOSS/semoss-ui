/**
 * Project permissions for the signed-in user — `/api/auth/project`.
 *
 * Backend: `ProjectAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java).
 * Response maps are built in `MyProjectsReactor` (Semoss/src/prerna/reactor/project),
 * `SecurityProjectUtils` and `SecurityUserProjectUtils` (Semoss/src/prerna/auth/utils).
 *
 * Errors follow `ResourceUtility.respond`: 401 when the session is invalid (and,
 * for writes, when the session is anonymous), 403 when the caller lacks the
 * permission or the server limits the action to admins, 400 for bad input and
 * 500 for unexpected failures, each with an `{ errorMessage }` body (surfaced
 * as `ApiError`).
 */

import type { RequestOptions } from "../../../lib/api-types";
import { repeat } from "../../../utility/body";
import { get, post } from "../../../utility/http";
import { path } from "../../../utility/url";

/**
 * Lists the projects the caller can access (directly, through a group, or
 * because they are public), optionally filtered, paged and decorated with
 * project metadata. Anonymous sessions are allowed.
 *
 * @name getProjects
 * @endpoint GET /api/auth/project/getProjects
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#getProjectsGET
 * @param params - Query parameters.
 * @param params.projectId - Only return these project ids.
 * @param params.filterWord - Case-insensitive search on the project name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.onlyFavorites - Only the caller's favorite projects.
 * @param params.metaKeys - Project metadata keys to attach to each row (e.g. `"description"`, `"tag"`).
 * @param params.noMeta - Skip attaching metadata entirely.
 * @param params.userT - Include user-tracking information (currently a no-op for projects).
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project. Requested `metaKeys` are added as extra keys on each row (a string, or an array when the key has several values).
 * @throws {ApiError} 401 if the session is invalid.
 */
export function getProjects(
	params: {
		projectId?: string[];
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
		project_id: string;
		project_name: string;
		project_display_name?: string;
		project_type: string;
		project_cost?: string;
		project_global: boolean;
		project_discoverable: boolean;
		project_is_template: boolean;
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
		/** The caller's favorite flag, coalesced to `0` when unset. */
		project_favorite: boolean | number;
		/** The caller's direct permission id (1 = owner, 2 = edit, 3 = read only). */
		user_permission?: 1 | 2 | 3;
		/** The best permission id the caller has through a group. */
		group_permission?: 1 | 2 | 3;
		/** The best of `user_permission` and `group_permission`. */
		permission?: 1 | 2 | 3;
		project_description?: string;
		[metaKey: string]: unknown;
	}>
> {
	return get(path`/api/auth/project/getProjects`, params, options);
}

/**
 * Same as {@link getProjects}, but sends the filters in a form body — use it
 * when the `projectId` list is too long for a URL. Also accepts `metaFilters`.
 * Anonymous sessions are allowed.
 *
 * @name getProjectsPost
 * @endpoint POST /api/auth/project/getProjects
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#getProjectsPOST
 * @param params - Form fields; same meaning as {@link getProjects}.
 * @param params.projectId - Only return these project ids.
 * @param params.filterWord - Case-insensitive search on the project name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.metaKeys - Project metadata keys to attach to each row.
 * @param params.metaFilters - Filter on project metadata, e.g. `{ tag: ["finance"] }`.
 * @param params.noMeta - Skip attaching metadata entirely.
 * @param params.userT - Include user-tracking information (currently a no-op for projects).
 * @param options - Per-call overrides (signal, headers).
 * @returns The same rows as {@link getProjects}.
 * @throws {ApiError} 401 if the session is invalid.
 */
export function getProjectsPost(
	params: {
		projectId?: string[];
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
	Array<{ project_id: string; project_name: string; [key: string]: unknown }>
> {
	const { projectId, metaKeys, ...rest } = params;
	return post(
		path`/api/auth/project/getProjects`,
		{
			...rest,
			// read with request.getParameterMap(), so lists are repeated keys
			projectId: repeat(projectId),
			metaKeys: repeat(metaKeys),
		},
		options,
	);
}

/**
 * Returns the caller's effective permission on a project, or `"DISCOVERABLE"`
 * when they have no access but the project is discoverable. Anonymous
 * sessions are allowed.
 *
 * @name getUserProjectPermission
 * @endpoint GET /api/auth/project/getUserProjectPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#getUserProjectPermission
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns The caller's permission name.
 * @throws {ApiError} 403 if the caller has no access and the project is not discoverable.
 */
export function getUserProjectPermission(
	params: { projectId: string },
	options?: RequestOptions,
): Promise<{
	permission: "OWNER" | "EDIT" | "READ_ONLY" | "DISCOVERABLE";
}> {
	return get(
		path`/api/auth/project/getUserProjectPermission`,
		params,
		options,
	);
}

/**
 * Lists the members of a project and their permissions, paged. The caller
 * must be able to view the project. Anonymous sessions are allowed.
 *
 * @name getProjectUsers
 * @endpoint GET /api/auth/project/getProjectUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#getProjectUsers
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.searchTerm - Search on user id, name, username or email (takes precedence over `userId`).
 * @param params.userId - Search for a user id (used only when `searchTerm` is absent).
 * @param params.permission - Only members with this permission.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of members and the total member count for the same filters.
 * @throws {ApiError} 403 if the caller cannot view the project.
 */
export function getProjectUsers(
	params: {
		projectId: string;
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
	}>;
}> {
	return get(path`/api/auth/project/getProjectUsers`, params, options);
}

/**
 * Adds a user to a project with a permission. Requires owner/edit rights on
 * the project, and admin rights when the server limits adding access to admins.
 *
 * @name addProjectUserPermission
 * @endpoint POST /api/auth/project/addProjectUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#addProjectUserPermission
 * @param params - Form fields.
 * @param params.id - The user id to add.
 * @param params.projectId - The project.
 * @param params.permission - Permission to grant.
 * @param params.endDate - When the access ends; omit for never.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not add users; 400 if the user already has access.
 */
export function addProjectUserPermission(
	params: {
		id: string;
		projectId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/addProjectUserPermission`,
		params,
		options,
	);
}

/**
 * Gives a user the requested access to every engine and project the project
 * depends on. Where the caller has edit/owner rights the access is granted;
 * otherwise an access request is filed for the dependency's owners.
 *
 * @name propagateProjectDependencyPermission
 * @endpoint POST /api/auth/project/propagateProjectDependencyPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#propagateProjectDependencyPermission
 * @param params - Form fields.
 * @param params.id - The user id.
 * @param params.type - The user's login type.
 * @param params.projectId - The project whose dependencies to share.
 * @param params.permission - The permission requested on each dependency.
 * @param params.endDate - When the access ends; omit for never.
 * @param params.usageLimit - The user's usage limit on the model dependencies (`null` for no limit). Omit to give new users no limit and keep existing users' limits. Only a model's owners may set a different limit.
 * @param options - Per-call overrides (signal, headers).
 * @returns Dependency ids grouped by what happened to each.
 * @throws {ApiError} 403 if the server limits adding access to admins and the caller is not one; 400 for an invalid `usageLimit`.
 */
export function propagateProjectDependencyPermission(
	params: {
		id: string;
		type?: string;
		projectId: string;
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
): Promise<{
	"Successfully processed permission propagation": true;
	alreadyHaveAccess: string[];
	requestAlreadyExists: string[];
	newRequestAdded: string[];
	accessGranted: string[];
	couldNotAddRequest: string[];
}> {
	return post(
		path`/api/auth/project/propagateProjectDependencyPermission`,
		params,
		options,
	);
}

/**
 * Bulk version of {@link propagateProjectDependencyPermission}: shares the
 * project's dependencies with several users at once.
 *
 * @name propagateProjectDependencyPermissions
 * @endpoint POST /api/auth/project/propagateProjectDependencyPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#propagateProjectDependencyPermissions
 * @param params - Form fields.
 * @param params.projectId - The project whose dependencies to share.
 * @param params.endDate - When the access ends, for every user; omit for never.
 * @param params.userpermissions - One entry per user. `usageLimit` behaves as in {@link propagateProjectDependencyPermission}; omit it to keep existing limits.
 * @param options - Per-call overrides (signal, headers).
 * @returns `success` plus, per user id, the same grouping as {@link propagateProjectDependencyPermission}.
 * @throws {ApiError} 403 if the server limits adding access to admins and the caller is not one; 400 for an invalid `usageLimit`.
 */
export function propagateProjectDependencyPermissions(
	params: {
		projectId: string;
		endDate?: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
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
): Promise<{
	success: true;
	users: Record<
		string,
		{
			"Successfully processed permission propagation": true;
			alreadyHaveAccess: string[];
			requestAlreadyExists: string[];
			newRequestAdded: string[];
			accessGranted: string[];
			couldNotAddRequest: string[];
		}
	>;
}> {
	return post(
		path`/api/auth/project/propagateProjectDependencyPermissions`,
		params,
		options,
	);
}

/**
 * Changes one member's permission on a project. Only owners may change an
 * owner's access or grant owner.
 *
 * @name editProjectUserPermission
 * @endpoint POST /api/auth/project/editProjectUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#editProjectUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.type - The member's login type.
 * @param params.projectId - The project.
 * @param params.permission - The new permission.
 * @param params.endDate - When the access ends; omit for never.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the member's access.
 */
export function editProjectUserPermission(
	params: {
		id: string;
		type?: string;
		projectId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		endDate?: string;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/editProjectUserPermission`,
		params,
		options,
	);
}

/**
 * Changes several members' permissions on a project in one call.
 *
 * @name editProjectUserPermissions
 * @endpoint POST /api/auth/project/editProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#editProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.endDate - When the access ends, for every member; omit for never.
 * @param params.userpermissions - One entry per member.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change access; 400 if a member has no access or a non-owner touches owner access.
 */
export function editProjectUserPermissions(
	params: {
		projectId: string;
		endDate?: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/editProjectUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes one member from a project, with their permissions on its insights.
 * Anyone may remove themselves.
 *
 * @name removeProjectUserPermission
 * @endpoint POST /api/auth/project/removeProjectUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#removeProjectUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not remove the member.
 */
export function removeProjectUserPermission(
	params: { id: string; projectId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/removeProjectUserPermission`,
		params,
		options,
	);
}

/**
 * Sets whether users who can view a project may clone it as a template.
 *
 * @name setProjectTemplate
 * @endpoint POST /api/auth/project/setProjectTemplate
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#setProjectTemplate
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.template - `true` to make it a template.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 400 if either field is missing; 403 if the caller may not change the project.
 */
export function setProjectTemplate(
	params: { projectId: string; template: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/project/setProjectTemplate`, params, options);
}

/**
 * Makes a project public (every user can open it) or private.
 *
 * @name setProjectGlobal
 * @endpoint POST /api/auth/project/setProjectGlobal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#setProjectGlobal
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.public - `true` for public.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the project, or the server limits this to admins.
 */
export function setProjectGlobal(
	params: { projectId: string; public: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/project/setProjectGlobal`, params, options);
}

/**
 * Makes a project discoverable (listed for users without access, so they can
 * request it) or hidden.
 *
 * @name setProjectDiscoverable
 * @endpoint POST /api/auth/project/setProjectDiscoverable
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#setProjectDiscoverable
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.discoverable - `true` to make it discoverable.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the project, or the server limits this to admins.
 */
export function setProjectDiscoverable(
	params: { projectId: string; discoverable: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/setProjectDiscoverable`,
		params,
		options,
	);
}

/**
 * Shows or hides a project in the caller's own project list.
 *
 * @name setProjectVisibility
 * @endpoint POST /api/auth/project/setProjectVisibility
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#setProjectVisibility
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.visibility - `true` to show it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller cannot view the project.
 */
export function setProjectVisibility(
	params: { projectId: string; visibility: boolean },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/project/setProjectVisibility`, params, options);
}

/**
 * Marks or unmarks a project as one of the caller's favorites.
 *
 * @name setProjectFavorite
 * @endpoint POST /api/auth/project/setProjectFavorite
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#setProjectFavorite
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.isFavorite - `true` to favorite it.
 * @param options - Per-call overrides (signal, headers).
 * @returns `true`.
 * @throws {ApiError} 403 if the caller cannot view the project.
 */
export function setProjectFavorite(
	params: { projectId: string; isFavorite: boolean },
	options?: RequestOptions,
): Promise<true> {
	return post(path`/api/auth/project/setProjectFavorite`, params, options);
}

/**
 * Searches for users who do not yet have access to a project, from the
 * security database or — when the Microsoft directory lookup is enabled — the
 * directory. The caller must be able to view the project. Anonymous sessions
 * are allowed.
 *
 * @name getProjectUsersNoCredentials
 * @endpoint GET /api/auth/project/getProjectUsersNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#getProjectUsersNoCredentials
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.searchTerm - Search on user id, name, username or email.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip. For directory lookups, `0` starts a new search and any other value continues it (paging state is kept in the session).
 * @param params.msGraphLookup - `false` to search the security database even when the directory is enabled. Defaults to the directory when it is enabled (`MicrosoftGraphUserLookup.LOOKUP_PARAM`).
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users. Directory fields are configurable and retain their raw Graph values.
 * @remarks Directory `ms_graphapi_jsonPattern` mappings can omit or change the type of user fields. `type` is always a provider string; validate other fields before using them.
 * @throws {ApiError} 403 if the caller cannot view the project, or a directory lookup needs a Microsoft login the caller lacks.
 */
export function getProjectUsersNoCredentials(
	params: {
		projectId: string;
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
		path`/api/auth/project/getProjectUsersNoCredentials`,
		params,
		options,
	);
}

/**
 * Approves pending access requests for a project, granting each requester the
 * permission in their request. Requesters are notified (and emailed when
 * configured).
 *
 * @name approveProjectUserAccessRequest
 * @endpoint POST /api/auth/project/approveProjectUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#approveProjectUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.endDate - When the granted access ends; omit for never.
 * @param params.requests - The requests to approve.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not change the project's permissions.
 */
export function approveProjectUserAccessRequest(
	params: {
		projectId: string;
		endDate?: string;
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
		path`/api/auth/project/approveProjectUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Denies pending access requests for a project and notifies the requesters.
 * Only the project's owners may deny.
 *
 * @name denyProjectUserAccessRequest
 * @endpoint POST /api/auth/project/denyProjectUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#denyProjectUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.requestids - Ids of the requests to deny.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an owner of the project.
 */
export function denyProjectUserAccessRequest(
	params: { projectId: string; requestids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/denyProjectUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Adds several users to a project in one call and notifies them. Users picked
 * from the Microsoft directory are created if missing.
 *
 * @name addProjectUserPermissions
 * @endpoint POST /api/auth/project/addProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#addProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.endDate - When the access ends, for every user; omit for never.
 * @param params.userpermissions - One entry per user.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not add users; 400 if a user already has access or a non-owner grants owner.
 */
export function addProjectUserPermissions(
	params: {
		projectId: string;
		endDate?: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/addProjectUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes several members from a project in one call. Their permissions on
 * the project's insights stay.
 *
 * @name removeProjectUserPermissions
 * @endpoint POST /api/auth/project/removeProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/ProjectAuthorizationResource.java#removeProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.ids - User ids to remove.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller may not remove members.
 */
export function removeProjectUserPermissions(
	params: { projectId: string; ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/project/removeProjectUserPermissions`,
		params,
		options,
	);
}
