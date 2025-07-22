import { Env, get, post } from '@semoss/sdk';

export const getTeams = async (admin: boolean) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += 'group/getGroups';
    // get the response
    const response = await get(url).catch((error) => {
        throw Error(error);
    });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get teams');
    }
    return response.data;
};

export const addTeam = async (
    groupId: string,
    description: string,
    isCustomGroup: boolean,
    type?: string,
) => {
    let url = `${Env.MODULE}/api/auth/admin/`
    url += 'group/addGroup';

    const postData = {
        groupId: groupId,
        description: description,
        isCustomGroup: isCustomGroup,
    }

    if (type) {
        postData['type'] = type;
    }
    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const deleteTeam = async (groupid: string, type?: string) => {
    let url = `${Env.MODULE}/api/auth/admin/`
    url += 'group/deleteGroup';

    const postData = {
        groupId: groupid,
    }
    if (type) {
        postData['type'] = type;
    }
    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const getTeamUsers = async (
    groupId: string,
    limit: number,
    offset: number,
    searchTerm: string,
) => {
    let url = `${Env.MODULE}/api/auth/admin/`;
    url += 'group/getGroupMembers?';
    groupId ? `groupId=${groupId}` : '';
    limit ? `limit=${limit}` : '';
    offset ? `offset=${offset}` : '';
    searchTerm ? `searchTerm=${searchTerm}` : '';
    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get group members');
    }
    return response.data;
};

export const getTeamUsersCount = async (groupId: string) => {
    let url = `${Env.MODULE}/api/auth/admin/`;
    url += 'group/getNumMembersInGroup?';

    groupId ? `groupId=${groupId}` : '';
    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get group member count');
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
    url += 'group/getNonGroupMembers?';
    groupId ? `groupId=${groupId}` : '';
    limit ? `limit=${limit}` : '';
    offset ? `offset=${offset}` : '';
    searchTerm ? `searchTerm=${searchTerm}` : '';

    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get non group members');
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
    let url = `${Env.MODULE}/api/auth/`
    if (admin) {
        url += 'admin/';
    }
    url += 'group/addGroupMember';
    const postData = {
        groupId: groupId,
        type: type,
        userId: userId,
    }
    if (endDate) {
        postData['endDate'] = endDate;
    }
    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const deleteTeamUser = async (user: {
    groupid: string;
    type: string;
    userid: string;
}) => {
    let url = `${Env.MODULE}/api/auth/admin/`
    url += 'group/deleteGroupMember';
    const postData = {
        groupId: user.groupid,
        type: user.type,
        userId: user.userid,
    }
    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
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
    url += 'group/getProjectsForGroup?';
    groupId ? `groupId=${groupId}` : '';
    groupType ? `groupType=${groupType}` : '';
    limit ? `limit=${limit}` : '';
    offset ? `offset=${offset}` : '';
    searchTerm ? `searchTerm=${searchTerm}` : '';
    onlyApps ? `onlyApps=${onlyApps}` : '';
    type ? `type=${type}` : '';

    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get group members');
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
    url += 'group/getAvailableProjectsForGroup?';
    groupId ? `groupId=${groupId}` : '';
    groupType ? `groupType=${groupType}` : '';
    limit ? `limit=${limit}` : '';
    offset ? `offset=${offset}` : '';
    searchTerm ? `searchTerm=${searchTerm}` : '';
    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get group members');
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
    url += 'group/getEnginesForGroup';
    groupId ? `groupId=${groupId}` : '';
    groupType ? `groupType=${groupType}` : '';
    limit ? `limit=${limit}` : '';
    offset ? `offset=${offset}` : '';
    searchTerm ? `searchTerm=${searchTerm}` : '';

    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get group members');
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
    url += 'group/getAvailableEnginesForGroup';
    groupId ? `groupId=${groupId}` : '';
    groupType ? `groupType=${groupType}` : '';
    limit ? `limit=${limit}` : '';
    offset ? `offset=${offset}` : '';
    searchTerm ? `searchTerm=${searchTerm}` : '';
    const response = await get(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get group members');
    }
    return response.data;
};