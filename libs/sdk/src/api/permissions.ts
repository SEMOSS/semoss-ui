import { Env } from "../env";
import type { PostUser, User } from "../types";
import { get, post } from "../utility";

/**
 * Get users without access to a project
 * @param projectId - The project ID
 * @param admin - Whether to use admin endpoint
 * @param searchTerm - Optional search term to filter users by
 * @param limit - Optional limit for pagination
 * @param offset - Optional offset for pagination
 * @returns Array of users without project credentials
 */
export const getProjectUsersNoCredentials = async (
	projectId: string,
	admin = false,
	searchTerm?: string,
	limit?: number,
	offset?: number,
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
 * @returns Array of users without engine credentials
 */
export const getEngineUsersNoCredentials = async (
	engineId: string,
	admin = false,
	searchTerm?: string,
	limit?: number,
	offset?: number,
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
