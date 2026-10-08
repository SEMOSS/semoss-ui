import { Env, get, post } from "@semoss/sdk/react";

export const getTeams = async (
	admin: boolean,
	searchTerm?: string,
	limit?: number,
	offset?: number,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getGroups";
	const params = new URLSearchParams();
	if (searchTerm) params.set("searchTerm", searchTerm);
	if (limit !== undefined) params.set("limit", String(limit));
	if (offset !== undefined) params.set("offset", String(offset));
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	// get the response
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get teams");
	}
	return response.data;
};

export const getGroupDetails = async (
	admin: boolean,
	groupId: string,
	type?: string,
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getGroupDetails";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (type) params.set("type", type);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("No Response to get group details");
	}
	return response.data;
};

export const getTeamsCount = async (admin: boolean, searchTerm?: string) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getNumGroups";
	const params = new URLSearchParams();
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("No Response to get team count");
	}
	return parseCount(response.data);
};

const parseCount = (value: unknown) => {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : 0;
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	if (value && typeof value === "object") {
		const candidate =
			(value as { count?: unknown }).count ??
			(value as { numGroups?: unknown }).numGroups ??
			(value as { numMembers?: unknown }).numMembers ??
			(value as { numProjects?: unknown }).numProjects ??
			(value as { numEngines?: unknown }).numEngines ??
			(value as { total?: unknown }).total ??
			(value as { value?: unknown }).value ??
			(value as { data?: unknown }).data;
		const parsed = Number(candidate);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

export const getNumProjectsForGroup = async (
	groupId: string,
	groupType: string,
	searchTerm?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getNumProjectsForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("No Response to get project count");
	}
	return parseCount(response.data);
};

export const getNumEnginesForGroup = async (
	groupId: string,
	groupType: string,
	searchTerm?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getNumEnginesForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("No Response to get engine count");
	}
	return parseCount(response.data);
};

export const addTeam = async (
	groupId: string,
	description: string,
	isCustomGroup: boolean,
	type?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/addGroup";

	let postData: Record<string, unknown> = {
		groupId: groupId,
		description: description,
		isCustomGroup: isCustomGroup,
	};

	if (type) {
		postData = {
			...postData,
			type: type,
		};
	}
	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

/**
 * @name editTeam
 * @param groupId
 * @param description
 * @param type
 * @returns
 */
export const editTeam = async (
	groupId: string,
	description: string,
	type?: string,
	previousTeamName?: string,
	previousType?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`,
		postData = {};

	url += "group/editGroupDetails";

	postData = {
		groupId: previousTeamName,
		newGroupId: groupId,
		newDescription: description,
		type: encodeURIComponent(previousType),
		newType: encodeURIComponent(type),
	};

	const response = await post<{ success: boolean }>(url, postData, {});

	return response;
};

export const deleteTeam = async (groupid: string, type?: string) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/deleteGroup";

	let postData: Record<string, unknown> = {
		groupId: groupid,
	};
	if (type) {
		postData = {
			...postData,
			type: type,
		};
	}
	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const getTeamUsers = async (
	groupId: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getGroupMembers";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

export const getTeamUsersCount = async (
	groupId: string,
	searchTerm?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getNumMembersInGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group member count");
	}
	return parseCount(response.data);
};

/**
 * Get people who are not members of a custom group
 * @param groupId - The group
 * @param limit - Page size
 * @param offset - Number of people already loaded
 * @param searchTerm - Text to search for
 * @param msGraphLookup - Optional choice of where to search: `true` for the
 * Microsoft directory, `false` for existing users. Without it the backend
 * searches the directory whenever the directory is available.
 */
export const getNonTeamUsers = async (
	groupId: string,
	limit: number,
	offset: number,
	searchTerm: string,
	msGraphLookup?: boolean,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getNonGroupMembers";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	if (msGraphLookup !== undefined) {
		params.set("msGraphLookup", String(msGraphLookup));
	}
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}

	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get non group members");
	}
	return response.data;
};

/**
 * Add a person to a custom group
 * @param groupId - The group
 * @param type - The person's login type
 * @param userId - The person's user id
 * @param admin - Whether to use the admin endpoint
 * @param endDate - Optional date their membership ends
 * @param details - Name, email and username of a person picked from the
 * Microsoft directory, so the backend can give them an account first
 */
export const addTeamUser = async (
	groupId: string,
	type: string,
	userId: string,
	admin: boolean,
	endDate?: string,
	details?: {
		name?: string | null;
		email?: string | null;
		username?: string | null;
	},
) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/addGroupMember";
	let postData: Record<string, unknown> = {
		groupId: groupId,
		type: type,
		userId: userId,
	};
	if (endDate) {
		postData = {
			...postData,
			endDate: endDate,
		};
	}
	if (details?.name) {
		postData = { ...postData, name: details.name };
	}
	if (details?.email) {
		postData = { ...postData, email: details.email };
	}
	if (details?.username) {
		postData = { ...postData, username: details.username };
	}
	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const deleteTeamUser = async (user: {
	groupid: string;
	type: string;
	userid: string;
}) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/deleteGroupMember";
	const postData = {
		groupId: user.groupid,
		type: user.type,
		userId: user.userid,
	};
	const response = await post<{
		success: boolean;
	}>(url, postData, {});
	return response;
};

export const getTeamProjects = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
	onlyApps: boolean,
	type?: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getProjectsForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	if (onlyApps) params.set("onlyApps", String(onlyApps));
	if (type) params.set("type", type);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}

	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

export const getUnassignedTeamProjects = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getAvailableProjectsForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

export const getTeamEngines = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getEnginesForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}

	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

export const getUnassignedTeamEngines = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getAvailableEnginesForGroup";
	const params = new URLSearchParams();
	if (groupId) params.set("groupId", groupId);
	if (groupType) params.set("groupType", groupType);
	if (limit) params.set("limit", String(limit));
	if (offset) params.set("offset", String(offset));
	if (searchTerm) params.set("searchTerm", searchTerm);
	const query = params.toString();
	if (query) {
		url += `?${query}`;
	}
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};
// Get teams by engineId
export const getGroupsWithAccessToEngine = async (
	engineId: string,
	limit?: number,
	offset?: number,
) => {
	let url = `${Env.MODULE}/api/auth/group/engine/getGroupsWithAccessToEngine?`;
	const params = [];
	if (engineId) params.push(`engineId=${engineId}`);
	if (typeof limit === "number") params.push(`limit=${limit}`);
	if (typeof offset === "number") params.push(`offset=${offset}`);
	url += params.join("&");
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("No Response to get teams by engineId");
	}
	return response.data;
};

// Get teams by projectId (for apps)
export const getGroupsWithAccessToProject = async (
	projectId: string,
	limit?: number,
	offset?: number,
) => {
	let url = `${Env.MODULE}/api/auth/group/project/getGroupsWithAccessToProject?`;
	const params = [];
	if (projectId) params.push(`projectId=${projectId}`);
	if (typeof limit === "number") params.push(`limit=${limit}`);
	if (typeof offset === "number") params.push(`offset=${offset}`);
	url += params.join("&");
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	if (!response) {
		throw Error("No Response to get teams by projectId");
	}
	return response.data;
};
