import { Env } from "../env";
import { get, post } from "../lib/fetch";
import type {
	PostUser,
	Role,
	User,
	UserAccessRequest,
	UserSearchResult,
} from "../types";
import { readModelUsageLimit } from "./access";

/** A validated person who can be added to a project or engine. No permission is assigned yet. */
export interface PermissionCandidate {
	id: string;
	type: string;
	name?: string;
	email?: string;
	username?: string;
	[key: string]: unknown;
}

/**
 * Get the current user's permission for a project
 * @param projectId - The project ID
 * @param _admin - Retained for compatibility; this endpoint has no admin variant.
 * @returns The user's permission level
 *
 * @deprecated Use `getUserProjectPermission({ projectId })` from
 * `@semoss/sdk/api/monolith/auth/project` and read `.permission`. There is no admin variant;
 * the legacy admin argument is ignored.
 */
export const getUserProjectPermission = async (
	projectId: string,
	_admin = false,
): Promise<Role> => {
	// This endpoint reads the caller's own permission; there is no admin variant.
	const url = `${Env.MODULE}/api/auth/project/getUserProjectPermission?${new URLSearchParams({ projectId })}`;

	const response = await get<{ permission: Role }>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get permission");
	}

	return response.data.permission;
};

/**
 * Get the current user's permission for an engine
 * @param engineId - The engine ID
 * @param _admin - Retained for compatibility; this endpoint has no admin variant.
 * @returns The user's permission level
 *
 * @deprecated Use `getUserEnginePermission({ engineId })` from
 * `@semoss/sdk/api/monolith/auth/engine` and read `.permission`. There is no admin variant;
 * the legacy admin argument is ignored.
 */
export const getUserEnginePermission = async (
	engineId: string,
	_admin = false,
): Promise<Role> => {
	// This endpoint reads the caller's own permission; there is no admin variant.
	const url = `${Env.MODULE}/api/auth/engine/getUserEnginePermission?${new URLSearchParams({ engineId })}`;

	const response = await get<{ permission: Role }>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get permission");
	}

	return response.data.permission;
};

/**
 * Get users with access to a project
 * @param projectId - The project ID
 * @param admin - Whether to use admin endpoint
 * @param userId - Optional user ID to filter by
 * @param permission - Optional permission level to filter by
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Object containing members array and total count
 *
 * @deprecated Use `getProjectUsers` from `@semoss/sdk/api/monolith/auth/project`, or
 * `@semoss/sdk/api/monolith/auth/admin/project` when admin=true. Pass object parameters
 * including projectId, userId, permission, limit and offset. Read the raw members/totalMembers
 * body; optional backend fields remain omitted.
 * Narrow permission to OWNER, EDIT or READ_ONLY; arbitrary strings and DISCOVERABLE are not
 * accepted by the resource.
 */
export const getProjectUsers = async (
	projectId: string,
	admin = false,
	userId?: string,
	permission?: string,
	limit?: number,
	offset?: number,
): Promise<{
	totalMembers: number;
	members: User[];
}> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}

	url += "project/getProjectUsers?";
	url += `projectId=${projectId}`;
	url += userId ? `&userId=${userId}` : "";
	url += permission ? `&permission=${permission}` : "";
	url += offset !== undefined ? `&offset=${offset}` : "";
	url += limit !== undefined ? `&limit=${limit}` : "";

	const response = await get<{
		members: User[];
		totalMembers: number;
	}>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get users associated with project");
	}

	return response.data;
};

/**
 * Get users with access to an engine. A model's members carry their usage
 * limit as `usage_limit`.
 * @param engineId - The engine ID
 * @param admin - Whether to use admin endpoint
 * @param userId - Optional user ID to filter by
 * @param permission - Optional permission level to filter by
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Object containing members array and total count
 *
 * @deprecated Use `getEngineUsers` from `@semoss/sdk/api/monolith/auth/engine`, or
 * `@semoss/sdk/api/monolith/auth/admin/engine` when admin=true. Pass object parameters
 * including engineId, searchTerm: userId, permission, limit and offset. Read the raw
 * members/totalMembers body; the resource leaves usage_limit unnormalized.
 * Narrow permission to OWNER, EDIT or READ_ONLY; arbitrary strings and DISCOVERABLE are not
 * accepted by the resource.
 */
export const getEngineUsers = async (
	engineId: string,
	admin = false,
	userId?: string,
	permission?: string,
	limit?: number,
	offset?: number,
): Promise<{
	totalMembers: number;
	members: User[];
}> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}

	url += "engine/getEngineUsers?";
	url += `engineId=${engineId}`;
	url += userId ? `&searchTerm=${userId}` : "";
	url += permission ? `&permission=${permission}` : "";
	url += offset !== undefined ? `&offset=${offset}` : "";
	url += limit !== undefined ? `&limit=${limit}` : "";

	const response = await get<{
		members: User[];
		totalMembers: number;
	}>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get users associated with engine");
	}

	// a model's members carry their usage limit, read here into its one shape
	return {
		...response.data,
		members: (response.data.members ?? []).map((member) =>
			"usage_limit" in member
				? {
						...member,
						usage_limit: readModelUsageLimit(member.usage_limit),
					}
				: member,
		),
	};
};

/**
 * Edit user permissions for a project
 * @param projectId - The project ID
 * @param users - Array of users with their updated permissions
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `editProjectUserPermissions({ projectId, userpermissions: users })` from
 * `@semoss/sdk/api/monolith/auth/project`, or `@semoss/sdk/api/monolith/auth/admin/project`
 * when admin=true. Read the returned `.success` field rather than treating the body as a
 * boolean.
 * Adapt legacy PostUser entries to the route input: permission must be OWNER, EDIT or
 * READ_ONLY, and an absent type must be omitted rather than null.
 */
export const editProjectUserPermissions = async (
	projectId: string,
	users: PostUser[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/editProjectUserPermissions";

	const response = await post<{ success: boolean }>(
		url,
		{
			projectId,
			userpermissions: users,
		},
		{},
	);

	return response.data.success;
};

/**
 * Edit user permissions for an engine
 * @param engineId - The engine ID
 * @param users - Array of users with their updated permissions; on a model,
 * each with its `usageLimit`, since a change without one keeps the limit the
 * person has
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `editEngineUserPermissions({ engineId, userpermissions: users })` from
 * `@semoss/sdk/api/monolith/auth/engine`, or `@semoss/sdk/api/monolith/auth/admin/engine` when
 * admin=true. Read the returned `.success` field rather than treating the body as a boolean.
 * Preserve omitted versus null usageLimit values on model grants.
 * Adapt legacy PostUser entries to the route input: permission must be OWNER, EDIT or
 * READ_ONLY, type cannot be null, and usage-limit rule amounts must be numbers.
 */
export const editEngineUserPermissions = async (
	engineId: string,
	users: PostUser[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/editEngineUserPermissions";

	const response = await post<{ success: boolean }>(
		url,
		{
			engineId,
			userpermissions: users,
		},
		{},
	);

	return response.data.success;
};

/**
 * Remove user permissions from a project
 * @param projectId - The project ID
 * @param userIds - Array of user IDs to remove
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `removeProjectUserPermissions({ projectId, ids: userIds })` from
 * `@semoss/sdk/api/monolith/auth/project`, or `@semoss/sdk/api/monolith/auth/admin/project`
 * when admin=true. Read the returned `.success` field rather than treating the body as a
 * boolean.
 */
export const removeProjectUserPermissions = async (
	projectId: string,
	userIds: string[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/removeProjectUserPermissions";

	const response = await post<{ success: boolean }>(
		url,
		{
			projectId,
			ids: userIds,
		},
		{},
	);

	return response.data.success;
};

/**
 * Remove user permissions from an engine
 * @param engineId - The engine ID
 * @param userIds - Array of user IDs to remove
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `removeEngineUserPermissions({ engineId, ids: userIds })` from
 * `@semoss/sdk/api/monolith/auth/engine`, or `@semoss/sdk/api/monolith/auth/admin/engine` when
 * admin=true. Read the returned `.success` field rather than treating the body as a boolean.
 */
export const removeEngineUserPermissions = async (
	engineId: string,
	userIds: string[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/removeEngineUserPermissions";

	const response = await post<{ success: boolean }>(
		url,
		{
			engineId,
			ids: userIds,
		},
		{},
	);

	return response.data.success;
};

/**
 * Approve user access requests to a project
 * @param projectId - The project ID
 * @param requests - Array of access requests to approve
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `approveProjectUserAccessRequest({ projectId, requests })` from
 * `@semoss/sdk/api/monolith/auth/project`, or `@semoss/sdk/api/monolith/auth/admin/project`
 * when admin=true. Read the returned `.success` field.
 * Narrow request permissions to OWNER, EDIT or READ_ONLY. The ordinary resource also requires
 * each request's type; the admin resource does not.
 */
export const approveProjectUserAccessRequest = async (
	projectId: string,
	requests: UserAccessRequest[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/approveProjectUserAccessRequest";

	const response = await post<{ success: boolean }>(
		url,
		{
			projectId,
			requests,
		},
		{},
	);

	return response.data.success;
};

/**
 * Deny user access requests to a project
 * @param projectId - The project ID
 * @param userIds - Array of user IDs to deny
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `denyProjectUserAccessRequest({ projectId, requestids: userIds })` from
 * `@semoss/sdk/api/monolith/auth/project`, or `@semoss/sdk/api/monolith/auth/admin/project`
 * when admin=true. Read the returned `.success` field.
 */
export const denyProjectUserAccessRequest = async (
	projectId: string,
	userIds: string[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/denyProjectUserAccessRequest";

	const response = await post<{ success: boolean }>(
		url,
		{
			projectId,
			requestids: userIds,
		},
		{},
	);

	return response.data.success;
};

/**
 * Propagate user permissions to project dependencies. The backend gives each
 * person the access the signed-in user can give on each dependency, and asks
 * the dependency's owners for the rest. There is no admin version.
 * @param projectId - The project ID
 * @param users - Array of users with their permissions to propagate
 * @returns Whether the operation was successful
 *
 * @deprecated Use `propagateProjectDependencyPermissions({ projectId, userpermissions: users
 * })` from `@semoss/sdk/api/monolith/auth/project` and read `.success`. There is no admin
 * variant.
 * Adapt legacy PostUser entries to OWNER, EDIT or READ_ONLY permissions, omit null type values
 * and supply numeric usage-limit rule amounts.
 */
export const propagateUserPermissions = async (
	projectId: string,
	users: PostUser[],
): Promise<boolean> => {
	const response = await post<{ success: boolean }>(
		`${Env.MODULE}/api/auth/project/propagateProjectDependencyPermissions`,
		{
			projectId,
			userpermissions: users,
		},
		{},
	);

	return response.data.success;
};

/**
 * Get users without access to a project
 * @param projectId - The project ID
 * @param admin - Whether to use admin endpoint
 * @param searchTerm - Optional search term to filter users by
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @param msGraphLookup - Optional choice of where to search: `true` for the
 * Microsoft directory, `false` for existing users. Without it the backend
 * searches the directory whenever the directory is available.
 * @returns Array of users without project credentials
 *
 * @deprecated Use `getProjectUsersNoCredentials` from `@semoss/sdk/api/monolith/auth/project`,
 * or `@semoss/sdk/api/monolith/auth/admin/project` when admin=true. Pass { projectId,
 * searchTerm, limit, offset, msGraphLookup }. The raw directory rows are not filtered or
 * normalized into PermissionCandidate objects; validate required id/type and optional display
 * fields in caller-owned code.
 */
export const getProjectUsersNoCredentials = async (
	projectId: string,
	admin = false,
	searchTerm?: string,
	limit?: number,
	offset?: number,
	msGraphLookup?: boolean,
): Promise<PermissionCandidate[]> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}

	url += "project/getProjectUsersNoCredentials?";
	url += `projectId=${projectId}`;
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";
	url += limit !== undefined ? `&limit=${limit}` : "";
	url += offset !== undefined ? `&offset=${offset}` : "";
	url += msGraphLookup !== undefined ? `&msGraphLookup=${msGraphLookup}` : "";

	const response = await get<unknown>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get non credentialed users");
	}

	return readPermissionCandidates(response.data);
};

/**
 * Get users without access to an engine
 * @param engineId - The engine ID
 * @param admin - Whether to use admin endpoint
 * @param searchTerm - Optional search term to filter users by
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @param msGraphLookup - Optional choice of where to search: `true` for the
 * Microsoft directory, `false` for existing users. Without it the backend
 * searches the directory whenever the directory is available.
 * @returns Array of users without engine credentials
 *
 * @deprecated Use `getEngineUsersNoCredentials` from `@semoss/sdk/api/monolith/auth/engine`,
 * or `@semoss/sdk/api/monolith/auth/admin/engine` when admin=true. Pass { engineId,
 * searchTerm, limit, offset, msGraphLookup }. The raw directory rows are not filtered or
 * normalized into PermissionCandidate objects; validate required id/type and optional display
 * fields in caller-owned code.
 */
export const getEngineUsersNoCredentials = async (
	engineId: string,
	admin = false,
	searchTerm?: string,
	limit?: number,
	offset?: number,
	msGraphLookup?: boolean,
): Promise<PermissionCandidate[]> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}

	url += "engine/getEngineUsersNoCredentials?";
	url += `engineId=${engineId}`;
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";
	url += limit !== undefined ? `&limit=${limit}` : "";
	url += offset !== undefined ? `&offset=${offset}` : "";
	url += msGraphLookup !== undefined ? `&msGraphLookup=${msGraphLookup}` : "";

	const response = await get<unknown>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get non credentialed users");
	}

	return readPermissionCandidates(response.data);
};

/**
 * Add user permissions to a project
 * @param projectId - The project ID
 * @param users - Array of users with their permissions to add
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `addProjectUserPermissions({ projectId, userpermissions: users })` from
 * `@semoss/sdk/api/monolith/auth/project`, or `@semoss/sdk/api/monolith/auth/admin/project`
 * when admin=true. Read the returned `.success` field rather than treating the body as a
 * boolean.
 * Adapt legacy PostUser entries to the route input: permission must be OWNER, EDIT or
 * READ_ONLY, and an absent type must be omitted rather than null.
 */
export const addProjectUserPermissions = async (
	projectId: string,
	users: PostUser[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/addProjectUserPermissions";

	const response = await post<{ success: boolean }>(
		url,
		{
			projectId,
			userpermissions: users,
		},
		{},
	);

	return response.data.success;
};

/**
 * Add user permissions to an engine
 * @param engineId - The engine ID
 * @param users - Array of users with their permissions to add; on a model,
 * each can carry its `usageLimit`
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 *
 * @deprecated Use `addEngineUserPermissions({ engineId, userpermissions: users })` from
 * `@semoss/sdk/api/monolith/auth/engine`, or `@semoss/sdk/api/monolith/auth/admin/engine` when
 * admin=true. Read the returned `.success` field rather than treating the body as a boolean.
 * Preserve omitted versus null usageLimit values on model grants.
 * Adapt legacy PostUser entries to the route input: permission must be OWNER, EDIT or
 * READ_ONLY, type cannot be null, and usage-limit rule amounts must be numbers.
 */
export const addEngineUserPermissions = async (
	engineId: string,
	users: PostUser[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "engine/addEngineUserPermissions";

	const response = await post<{ success: boolean }>(
		url,
		{
			engineId,
			userpermissions: users,
		},
		{},
	);

	return response.data.success;
};

/**
 * Search for people by name or email
 * @param searchTerm - Text to search for
 * @param options - Paging, and `msGraphLookup` to choose where to search:
 * `true` for the Microsoft directory, `false` for existing users. Without it
 * the backend searches the directory whenever the directory is available.
 * @returns The people found. Entries without an id are left out.
 *
 * @deprecated Use `searchForUser({ searchTerm, ...options })` from
 * `@semoss/sdk/api/monolith/authorization`. Raw directory rows can have provider-defined
 * fields; validate IDs and optional display fields yourself instead of relying on this
 * helper's filtering and null defaults.
 */
export const searchForUser = async (
	searchTerm: string,
	options: { limit?: number; offset?: number; msGraphLookup?: boolean } = {},
): Promise<UserSearchResult[]> => {
	const params = new URLSearchParams({ searchTerm });
	if (options.limit !== undefined) {
		params.set("limit", String(options.limit));
	}
	if (options.offset !== undefined) {
		params.set("offset", String(options.offset));
	}
	if (options.msGraphLookup !== undefined) {
		params.set("msGraphLookup", String(options.msGraphLookup));
	}

	const response = await get<unknown>(
		`${Env.MODULE}/api/authorization/searchForUser?${params.toString()}`,
	);

	if (!response || !Array.isArray(response.data)) {
		throw Error("No Response to search for users");
	}

	return response.data.flatMap(toUserSearchResult);
};

/** Reads a non-blank string, or null */
const readText = (value: unknown): string | null =>
	typeof value === "string" && value.trim() !== "" ? value : null;

/** Validate directory mappings and database rows without inventing existing permissions. */
const readPermissionCandidates = (value: unknown): PermissionCandidate[] => {
	if (!Array.isArray(value)) {
		throw new Error("No Response to get non credentialed users");
	}
	return value.flatMap((row: unknown): PermissionCandidate[] => {
		if (typeof row !== "object" || row === null || Array.isArray(row))
			return [];
		const { id, type, name, email, username, ...details } = row as Record<
			string,
			unknown
		>;
		const personId = readText(id);
		const loginType = readText(type);
		if (!personId || !loginType) return [];
		return [
			{
				...details,
				id: personId,
				type: loginType,
				...(typeof name === "string" ? { name } : {}),
				...(typeof email === "string" ? { email } : {}),
				...(typeof username === "string" ? { username } : {}),
			},
		];
	});
};

/** Validates one search result, returning it in a list, or an empty list when it has no id */
const toUserSearchResult = (value: unknown): UserSearchResult[] => {
	if (typeof value !== "object" || value === null) {
		return [];
	}
	const record = value as Record<string, unknown>;
	const id = readText(record.id);
	if (!id) {
		return [];
	}
	return [
		{
			id,
			name: readText(record.name),
			email: readText(record.email),
			username: readText(record.username),
			type: readText(record.type),
			...(typeof record.hasAccount === "boolean" && {
				hasAccount: record.hasAccount,
			}),
		},
	];
};
