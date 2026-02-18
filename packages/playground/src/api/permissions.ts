export type PostUser = {
	userid: string;
	permission: string;
};

/**
 * Helper Methods
 */

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
		const errorData = await response.json().catch(() => ({}));
		const errorMessage =
			errorData.errorMessage ||
			errorData.error ||
			errorData.message ||
			`No Response from ${extension}`;
		throw Error(errorMessage);
	}

	const data = await response.json();
	return data.success;
};

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
