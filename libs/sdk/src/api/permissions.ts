import { Env } from "../env";
import type {
	PostUser,
	Role,
	User,
	UserAccessRequest,
	UserSearchResult,
} from "../types";
import { get, post } from "../utility";

/**
 * Get the current user's permission for a project
 * @param projectId - The project ID
 * @param admin - Whether to use admin endpoint
 * @returns The user's permission level
 */
export const getUserProjectPermission = async (
	projectId: string,
	admin = false,
): Promise<Role> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += `project/getUserProjectPermission?projectId=${projectId}`;

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
 * @param admin - Whether to use admin endpoint
 * @returns The user's permission level
 */
export const getUserEnginePermission = async (
	engineId: string,
	admin = false,
): Promise<Role> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += `engine/getUserEnginePermission?engineId=${engineId}`;

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
 * Get users with access to an engine
 * @param engineId - The engine ID
 * @param admin - Whether to use admin endpoint
 * @param userId - Optional user ID to filter by
 * @param permission - Optional permission level to filter by
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Object containing members array and total count
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

	return response.data;
};

/**
 * Edit user permissions for a project
 * @param projectId - The project ID
 * @param users - Array of users with their updated permissions
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
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
 * @param users - Array of users with their updated permissions
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
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
 * Propagate user permissions to project dependencies
 * @param projectId - The project ID
 * @param users - Array of users with their permissions to propagate
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
 */
export const propagateUserPermissions = async (
	projectId: string,
	users: PostUser[],
	admin = false,
): Promise<boolean> => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "project/propagateProjectDependencyPermissions";

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
 */
export const getProjectUsersNoCredentials = async (
	projectId: string,
	admin = false,
	searchTerm?: string,
	limit?: number,
	offset?: number,
	msGraphLookup?: boolean,
): Promise<User[]> => {
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

	const response = await get<User[]>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get non credentialed users");
	}

	return response.data;
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
 */
export const getEngineUsersNoCredentials = async (
	engineId: string,
	admin = false,
	searchTerm?: string,
	limit?: number,
	offset?: number,
	msGraphLookup?: boolean,
): Promise<User[]> => {
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

	const response = await get<User[]>(url).catch((error) => {
		throw Error(error);
	});

	if (!response) {
		throw Error("No Response to get non credentialed users");
	}

	return response.data;
};

/**
 * Add user permissions to a project
 * @param projectId - The project ID
 * @param users - Array of users with their permissions to add
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
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
 * @param users - Array of users with their permissions to add
 * @param admin - Whether to use admin endpoint
 * @returns Whether the operation was successful
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
