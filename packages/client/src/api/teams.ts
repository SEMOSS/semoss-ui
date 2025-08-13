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

	const postData = {
		groupId: groupId,
		description: description,
		isCustomGroup: isCustomGroup,
	};

	if (type) {
		postData["type"] = type;
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
export const editTeam = async(
    groupId: string,
    description: string,
    type?: string,
    previousTeamName?: string,
    previousType?: string
  ) => {
    let url = `${Env.MODULE}/api/auth/admin/`,
      postData = {
      };

    url += "group/editGroupDetails";

    postData = {
      groupId: encodeURIComponent(previousTeamName),
      newGroupId: encodeURIComponent(groupId),
      newDescription: encodeURIComponent(description),
      type: encodeURIComponent(previousType),
      newType: encodeURIComponent(type),
    };

    const response = await post<{ success: boolean }>(url, postData, {});

    return response;
  }

export const deleteTeam = async (groupid: string, type?: string) => {
	let url = `${Env.MODULE}/api/auth/admin/`;
	url += "group/deleteGroup";

	const postData = {
		groupId: groupid,
	};
	if (type) {
		postData["type"] = type;
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
	const postData = {
		groupId: groupId,
		type: type,
		userId: userId,
	};
	if (endDate) {
		postData["endDate"] = endDate;
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
