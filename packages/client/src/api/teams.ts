import { Env, get, post } from "@semoss/sdk/react";

export const getTeams = async (admin: boolean) => {
	let url = `${Env.MODULE}/api/auth/`;
	if (admin) {
		url += "admin/";
	}
	url += "group/getGroups";
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
	url += "group/getGroupMembers?";
	url += groupId ? `&groupId=${groupId}` : "";
	url += limit ? `&limit=${limit}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response.data;
};

export const getTeamUsersCount = async (groupId: string) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getNumMembersInGroup?";

	url += groupId ? `groupId=${groupId}` : "";
	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group member count");
	}
	return response.data;
};

export const getNonTeamUsers = async (
	groupId: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getNonGroupMembers?";
	url += groupId ? `&groupId=${groupId}` : "";
	url += limit ? `&limit=${limit}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";

	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get non group members");
	}
	return response.data;
};

export const addTeamUser = async (
	groupId: string,
	type: string,
	userId: string,
	admin: boolean,
	endDate?: string,
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
	url += "group/getProjectsForGroup?";
	url += groupId ? `&groupId=${groupId}` : "";
	url += groupType ? `&groupType=${groupType}` : "";
	url += limit ? `&limit=${limit}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";
	url += onlyApps ? `&onlyApps=${onlyApps}` : "";
	url += type ? `&type=${type}` : "";

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
	url += "group/getAvailableProjectsForGroup?";
	url += groupId ? `&groupId=${groupId}` : "";
	url += groupType ? `&groupType=${groupType}` : "";
	url += limit ? `&limit=${limit}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";
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
	url += "group/getEnginesForGroup?";
	url += groupId ? `&groupId=${groupId}` : "";
	url += groupType ? `&groupType=${groupType}` : "";
	url += limit ? `&limit=${limit}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";

	const response = await get(url).catch((error) => {
		throw Error(error);
	});
	// there was no response, that is an error
	if (!response) {
		throw Error("No Response to get group members");
	}
	return response;
};

export const getUnassignedTeamEngines = async (
	groupId: string,
	groupType: string,
	limit: number,
	offset: number,
	searchTerm: string,
) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/getAvailableEnginesForGroup?";
	url += groupId ? `&groupId=${groupId}` : "";
	url += groupType ? `&groupType=${groupType}` : "";
	url += limit ? `&limit=${limit}` : "";
	url += offset ? `&offset=${offset}` : "";
	url += searchTerm ? `&searchTerm=${searchTerm}` : "";
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
