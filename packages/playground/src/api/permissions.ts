import type { User } from "@/types";

export type PostUser = {
	userid: string;
	permission: string;
};

/**
 * Helper Methods
 */

/**
 * Fetch data from the API
 * @param extension - The API endpoint extension
 * @param params - Query parameters to include in the request
 * @returns The API response data
 */
const fetchApi = async <K>(extension: string, params: object): Promise<K> => {
	const queryParams = new URLSearchParams(
		Object.entries(params)
			.filter(([_, value]) => value !== undefined)
			.map(([key, value]) => [key, String(value)]),
	);
	const url = `${import.meta.env.MODULE}/api/auth/project/${extension}?${queryParams}`;

	// get the response
	const response = await fetch(url).catch((error) => {
		throw Error(error);
	});

	// there was no response, that is an error
	if (!response.ok) {
		throw Error(`No Response from ${extension}`);
	}

	const data = await response.json();
	return data;
};

/**
 * Post data to the API
 * @param extension - The API endpoint extension
 * @param projectId - The project ID
 * @param postData - The data to post as URL-encoded string
 * @returns Whether the operation was successful
 */
const postApi = async (
	extension: string,
	projectId: string,
	postData: string,
): Promise<boolean> => {
	const url = `${import.meta.env.MODULE}/api/auth/project/${extension}`;

	const response = await fetch(url, {
		method: "POST",
		headers: {
			"content-type": "application/x-www-form-urlencoded",
		},
		body: `projectId=${encodeURIComponent(projectId)}${postData}`,
	});

	if (!response.ok) {
		throw Error(`No Response from ${extension}`);
	}

	const data = await response.json();
	return data.success;
};

/**
 * Get the current user's permission for a project
 * @param projectId - The project ID
 * @returns The user's permission level
 */
export const getUserProjectPermission = async (
	projectId: string,
): Promise<string> =>
	(
		await fetchApi<{
			permission: string;
		}>("getUserProjectPermission", { projectId })
	).permission;

/**
 * Get users with access to a project
 * @param projectId - The project ID
 * @param userId - Optional user ID to filter by
 * @param permission - Optional permission level to filter by
 * @param offset - Optional offset for pagination
 * @param limit - Optional limit for pagination
 * @returns Object containing members array and total count
 */
export const getProjectUsers = async (
	projectId: string,
	userId?: string,
	permission?: string,
	offset?: number,
	limit?: number,
): Promise<{
	totalMembers: number;
	members: User[];
}> =>
	await fetchApi<{
		members: User[];
		totalMembers: number;
	}>("getProjectUsers", { projectId, userId, permission, offset, limit });

/**
 * Add user permissions to a project
 * @param projectId - The project ID
 * @param users - Array of users with their permissions to add
 * @returns Whether the operation was successful
 */
export const addProjectUserPermissions = async (
	projectId: string,
	users: PostUser[],
) =>
	await postApi(
		"addProjectUserPermissions",
		projectId,
		`&userpermissions=${encodeURIComponent(JSON.stringify(users))}`,
	);

/**
 * Edit user permissions for a project
 * @param projectId - The project ID
 * @param users - Array of users with their updated permissions
 * @returns Whether the operation was successful
 */
export const editProjectUserPermissions = async (
	projectId: string,
	users: PostUser[],
) =>
	await postApi(
		"editProjectUserPermissions",
		projectId,
		`&userpermissions=${encodeURIComponent(JSON.stringify(users))}`,
	);

/**
 * Remove user permissions from a project
 * @param projectId - The project ID
 * @param users - Array of user IDs to remove
 * @returns Whether the operation was successful
 */
export const removeProjectUserPermissions = async (
	projectId: string,
	users: string[],
) =>
	await postApi(
		"removeProjectUserPermissions",
		projectId,
		`&ids=${encodeURIComponent(JSON.stringify(users))}`,
	);

/**
 * Propagate user permissions to project dependencies
 * @param projectId - The project ID
 * @param users - Array of users with their permissions to propagate
 * @returns Whether the operation was successful
 */
export const propagateUserPermissions = async (
	projectId: string,
	users: PostUser[],
) =>
	await postApi(
		"propagateProjectDependencyPermissions",
		projectId,
		`&userpermissions=${encodeURIComponent(JSON.stringify(users))}`,
	);
