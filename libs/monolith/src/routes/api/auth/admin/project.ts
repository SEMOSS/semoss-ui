/**
 * Admin project permissions — `/api/auth/admin/project`.
 *
 * Backend: `AdminProjectAuthorizationResource`
 * (Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java).
 * Response maps are built in `SecurityAdminUtils` and `SecurityUserProjectUtils`
 * (Semoss/src/prerna/auth/utils).
 *
 * Every endpoint here is admin-only. Errors follow `ResourceUtility.respond`:
 * 401 when the session is invalid, 403 when the caller is not an admin,
 * 400 for bad input and 500 for unexpected failures, each with an
 * `{ errorMessage }` body (surfaced as `ApiError`).
 */

import type { RequestOptions } from "../../../../types";
import { get, post, repeat } from "../../../../utility/http";
import { path } from "../../../../utility/url";

/**
 * Lists every project on the server for the admin console, optionally filtered,
 * paged and decorated with project metadata.
 *
 * @name getProjects
 * @endpoint GET /api/auth/admin/project/getProjects
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getProjectsGET
 * @param params - Query parameters.
 * @param params.projectId - Only return these project ids.
 * @param params.filterWord - Case-insensitive search on the project name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.metaKeys - Project metadata keys to attach to each row (e.g. `"description"`, `"tag"`).
 * @param params.noMeta - Skip attaching metadata entirely.
 * @param params.userT - Include user-tracking information.
 * @param params.permissionUser - Only return projects this user id has access to.
 * @param params.effectivePermissions - With `permissionUser`, only these permission levels (1 = owner, 2 = edit, 3 = read only).
 * @param params.createdBy - Only projects created by these users, as a JSON array of `{ id, type }` maps.
 * @param params.createdByMe - Only projects created by the caller.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project. Requested `metaKeys` are added as extra keys on each row.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function getProjects(
	params: {
		projectId?: string[];
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
		[metaKey: string]: unknown;
	}>
> {
	return get(path`/api/auth/admin/project/getProjects`, params, options);
}

/**
 * Same as {@link getProjects}, but sends the filters in a form body — use it
 * when the `projectId` list is too long for a URL. Also accepts `metaFilters`.
 *
 * @name getProjectsPost
 * @endpoint POST /api/auth/admin/project/getProjects
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getProjectsPOST
 * @param params - Form fields; same meaning as {@link getProjects}.
 * @param params.metaFilters - Filter on project metadata, e.g. `{ tag: ["finance"] }`.
 * @param options - Per-call overrides (signal, headers).
 * @returns The same rows as {@link getProjects}.
 * @throws {ApiError} 403 if the caller is not an admin.
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
		permissionUser?: string;
		effectivePermissions?: Array<1 | 2 | 3>;
		createdBy?: Array<{ id: string; type: string }>;
		createdByMe?: boolean;
	} = {},
	options?: RequestOptions,
): Promise<
	Array<{ project_id: string; project_name: string; [key: string]: unknown }>
> {
	const { projectId, metaKeys, effectivePermissions, ...rest } = params;
	return post(
		path`/api/auth/admin/project/getProjects`,
		{
			...rest,
			// read with request.getParameterMap(), so lists are repeated keys
			projectId: repeat(projectId),
			metaKeys: repeat(metaKeys),
			effectivePermissions: repeat(effectivePermissions),
		},
		options,
	);
}

/**
 * Lists the projects a given user has explicit permission on.
 *
 * @name getAllUserProjects
 * @endpoint GET /api/auth/admin/project/getAllUserProjects
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getAllUserProjects
 * @param params - Query parameters.
 * @param params.userId - The user whose projects to list.
 * @param params.projectTypes - Only these project types.
 * @param params.searchTerm - Case-insensitive search on the project name.
 * @param params.limit - Page size (`0` or omitted for no limit).
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project with the user's permission on it.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function getAllUserProjects(
	params: {
		userId: string;
		projectTypes?: string[];
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		user_id: string;
		project_id: string;
		project_name: string;
		project_display_name?: string;
		project_type: string;
		/** Permission name: `"OWNER"`, `"EDIT"` or `"READ_ONLY"`. */
		project_permission: string;
	}>
> {
	return get(
		path`/api/auth/admin/project/getAllUserProjects`,
		params,
		options,
	);
}

/**
 * Lists the projects a given user does **not** have access to (for granting new access).
 *
 * @name getUserProjectsNoCredentials
 * @endpoint GET /api/auth/admin/project/getUserProjectsNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getUserProjectsNoCredentials
 * @param params - Query parameters.
 * @param params.userId - The user to check.
 * @param params.projectTypes - Only these project types.
 * @param params.searchTerm - Case-insensitive search on the project name.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns One row per project the user has no permission on, ordered by lower-cased display name.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function getUserProjectsNoCredentials(
	params: {
		userId: string;
		projectTypes?: string[];
		searchTerm?: string;
		limit?: number;
		offset?: number;
	},
	options?: RequestOptions,
): Promise<
	Array<{
		project_id: string;
		project_name: string;
		project_display_name?: string;
		project_type: string;
		/** The display name, lower-cased (the sort key); left out when there is none. */
		low_project_name?: string;
	}>
> {
	return get(
		path`/api/auth/admin/project/getUserProjectsNoCredentials`,
		params,
		options,
	);
}

/**
 * Grants a user the same permission on every project on the server.
 *
 * @name grantAllProjects
 * @endpoint POST /api/auth/admin/project/grantAllProjects
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#grantAllProjects
 * @param params - Form fields.
 * @param params.userId - The user to grant access to.
 * @param params.permission - Permission to grant.
 * @param params.isAddNew - Also grant it on projects created later.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function grantAllProjects(
	params: {
		userId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
		isAddNew?: boolean;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/grantAllProjects`,
		params,
		options,
	);
}

/**
 * Gives every user created from now on a permission on a project.
 *
 * @name grantNewUsersProjectAccess
 * @endpoint POST /api/auth/admin/project/grantNewUsersProjectAccess
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#grantNewUsersProjectAccess
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.permission - Permission new users receive.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function grantNewUsersProjectAccess(
	params: { projectId: string; permission: "OWNER" | "EDIT" | "READ_ONLY" },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/grantNewUsersProjectAccess`,
		params,
		options,
	);
}

/**
 * Lists the members of a project and their permissions, paged.
 *
 * @name getProjectUsers
 * @endpoint GET /api/auth/admin/project/getProjectUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getProjectUsers
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.searchTerm - Search on user id, name or email (takes precedence over `userId`).
 * @param params.userId - Search for a single user id.
 * @param params.permission - Only members with this permission.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param options - Per-call overrides (signal, headers).
 * @returns The page of members and the total member count for the same filters.
 * @throws {ApiError} 403 if the caller is not an admin.
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
	return get(path`/api/auth/admin/project/getProjectUsers`, params, options);
}

/**
 * Adds a user to a project with a permission.
 *
 * @name addProjectUserPermission
 * @endpoint POST /api/auth/admin/project/addProjectUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#addProjectUserPermission
 * @param params - Form fields.
 * @param params.id - The user id to add.
 * @param params.projectId - The project.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if the user already has access.
 */
export function addProjectUserPermission(
	params: {
		id: string;
		projectId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/addProjectUserPermission`,
		params,
		options,
	);
}

/**
 * Adds several users to a project in one call.
 *
 * @name addProjectUserPermissions
 * @endpoint POST /api/auth/admin/project/addProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#addProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.userpermissions - One entry per user. Users picked from the Microsoft directory are created if missing.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function addProjectUserPermissions(
	params: {
		projectId: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
			endDate?: string;
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/addProjectUserPermissions`,
		params,
		options,
	);
}

/**
 * Adds every user on the server to a project with the same permission.
 *
 * @name addAllUsers
 * @endpoint POST /api/auth/admin/project/addAllUsers
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#addAllUsers
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.permission - Permission to grant.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function addAllUsers(
	params: { projectId: string; permission: "OWNER" | "EDIT" | "READ_ONLY" },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(path`/api/auth/admin/project/addAllUsers`, params, options);
}

/**
 * Changes one member's permission on a project.
 *
 * @name editProjectUserPermission
 * @endpoint POST /api/auth/admin/project/editProjectUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#editProjectUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.projectId - The project.
 * @param params.permission - The new permission.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function editProjectUserPermission(
	params: {
		id: string;
		projectId: string;
		permission: "OWNER" | "EDIT" | "READ_ONLY";
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/editProjectUserPermission`,
		params,
		options,
	);
}

/**
 * Changes several members' permissions on a project in one call.
 *
 * @name editProjectUserPermissions
 * @endpoint POST /api/auth/admin/project/editProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#editProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.userpermissions - One entry per member.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function editProjectUserPermissions(
	params: {
		projectId: string;
		userpermissions: Array<{
			userid: string;
			type?: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/editProjectUserPermissions`,
		params,
		options,
	);
}

/**
 * Sets every member of a project to the same permission.
 *
 * @name updateProjectUserPermissions
 * @endpoint POST /api/auth/admin/project/updateProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#updateProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.permission - The permission every member gets.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function updateProjectUserPermissions(
	params: { projectId: string; permission: "OWNER" | "EDIT" | "READ_ONLY" },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/updateProjectUserPermissions`,
		params,
		options,
	);
}

/**
 * Removes one member from a project.
 *
 * @name removeProjectUserPermission
 * @endpoint POST /api/auth/admin/project/removeProjectUserPermission
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#removeProjectUserPermission
 * @param params - Form fields.
 * @param params.id - The member's user id.
 * @param params.projectId - The project.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function removeProjectUserPermission(
	params: { id: string; projectId: string },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/removeProjectUserPermission`,
		params,
		options,
	);
}

/**
 * Removes several members from a project in one call.
 *
 * @name removeProjectUserPermissions
 * @endpoint POST /api/auth/admin/project/removeProjectUserPermissions
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#removeProjectUserPermissions
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.ids - User ids to remove.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function removeProjectUserPermissions(
	params: { projectId: string; ids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/removeProjectUserPermissions`,
		params,
		options,
	);
}

/**
 * Sets whether users who can view a project may clone it as a template.
 *
 * @name setProjectTemplate
 * @endpoint POST /api/auth/admin/project/setProjectTemplate
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#setProjectTemplate
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.template - `true` to make it a template.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if either field is missing.
 */
export function setProjectTemplate(
	params: { projectId: string; template: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/setProjectTemplate`,
		params,
		options,
	);
}

/**
 * Makes a project public (every user can open it) or private.
 *
 * @name setProjectGlobal
 * @endpoint POST /api/auth/admin/project/setProjectGlobal
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#setProjectGlobal
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.public - `true` for public.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function setProjectGlobal(
	params: { projectId: string; public: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/setProjectGlobal`,
		params,
		options,
	);
}

/**
 * Makes a project discoverable (listed in the catalog for users without access, so they can request it) or hidden.
 *
 * @name setProjectDiscoverable
 * @endpoint POST /api/auth/admin/project/setProjectDiscoverable
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#setProjectDiscoverable
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.discoverable - `true` to make it discoverable.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function setProjectDiscoverable(
	params: { projectId: string; discoverable: boolean },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/setProjectDiscoverable`,
		params,
		options,
	);
}

/**
 * Searches for users who do not yet have access to a project, from the
 * security database or — when requested and enabled — the Microsoft directory.
 *
 * @name getProjectUsersNoCredentials
 * @endpoint GET /api/auth/admin/project/getProjectUsersNoCredentials
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#getProjectUsersNoCredentials
 * @param params - Query parameters.
 * @param params.projectId - The project.
 * @param params.searchTerm - Search on user id, name or email.
 * @param params.limit - Page size.
 * @param params.offset - Rows to skip.
 * @param params.msGraphLookup - Search the Microsoft directory instead of the security database (`MicrosoftGraphUserLookup.LOOKUP_PARAM`).
 * @param options - Per-call overrides (signal, headers).
 * @returns Matching users.
 * @remarks Unverified response shape for directory lookups.
 * @throws {ApiError} 403 if the caller is not an admin; 400 if a directory lookup is requested without a Microsoft login.
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
		id: string;
		type: string;
		username?: string;
		name?: string;
		email?: string;
		[key: string]: unknown;
	}>
> {
	return get(
		path`/api/auth/admin/project/getProjectUsersNoCredentials`,
		params,
		options,
	);
}

/**
 * Approves pending access requests for a project, granting each requester the permission in their request.
 *
 * @name approveProjectUserAccessRequest
 * @endpoint POST /api/auth/admin/project/approveProjectUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#approveProjectUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.requests - The requests to approve, each the request's id, the requester's user id and the permission to grant (`PermissionBatchUtils.approvalChanges` / `markApproved`). Requesters are notified (and emailed when configured).
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function approveProjectUserAccessRequest(
	params: {
		projectId: string;
		requests: Array<{
			requestid: string;
			userid: string;
			permission: "OWNER" | "EDIT" | "READ_ONLY";
		}>;
	},
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/approveProjectUserAccessRequest`,
		params,
		options,
	);
}

/**
 * Denies pending access requests for a project.
 *
 * @name denyProjectUserAccessRequest
 * @endpoint POST /api/auth/admin/project/denyProjectUserAccessRequest
 * @source Monolith/src/prerna/semoss/web/services/local/auth/AdminProjectAuthorizationResource.java#denyProjectUserAccessRequest
 * @param params - Form fields.
 * @param params.projectId - The project.
 * @param params.requestids - Ids of the requests to deny.
 * @param options - Per-call overrides (signal, headers).
 * @returns `{ success: true }`.
 * @throws {ApiError} 403 if the caller is not an admin.
 */
export function denyProjectUserAccessRequest(
	params: { projectId: string; requestids: string[] },
	options?: RequestOptions,
): Promise<{ success: true }> {
	return post(
		path`/api/auth/admin/project/denyProjectUserAccessRequest`,
		params,
		options,
	);
}
