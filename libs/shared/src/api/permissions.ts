import { Env, get, post } from "@semoss/sdk/react";
import type { PostUser, Role, User, UserAccessRequest } from "../types";

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
