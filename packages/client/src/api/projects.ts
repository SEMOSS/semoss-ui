import { Env, get, post } from '@semoss/sdk';

import { Role } from '@/types';

export const setProjectFavorite = async (
    projectId: string,
    favorite: boolean,
) => {
    let url = `${Env.MODULE}/api/auth/`

    const postData = {
        'projectId': projectId,
        'isFavorite': favorite,
    }
    url += 'project/setProjectFavorite';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const addProject = async (
    groupId: string,
    projectId: string,
    permission: number,
    type?: string,
    endDate?: string,
) => {
    let url = `${Env.MODULE}/api/auth/admin/`
    url += 'group/addGroupProjectPermission';
    const postData = {
        'groupId': groupId,
        'projectId': projectId,
        'permission': permission,
    }
    if (type) {
        postData['type'] = type;
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

export const editProjectPermisison = async (
    groupId: string,
    groupType: string,
    project: {
        projectid: string;
        permission: number;
        project_type?: string;
        endDate?: string;
    },
) => {
    let url = `${Env.MODULE}/api/auth/admin/`
    url += 'group/editGroupProjectPermission';
    const postData = {
        'groupId': groupId,
        'projectId': project.projectid,
       'permission': project.permission,
    }
    if (groupType) {
        postData['type'] = project.project_type;
    }
    if (project.endDate) {
        postData['endDate'] = project.endDate;
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

export const deleteProjectPermission = async (
    groupId,
    groupType: string,
    project: {
        projectid: string;
        group_type?: string;
    },
) => {
    let url = `${Env.MODULE}/api/auth/admin/`
    url += 'group/removeGroupProjectPermission';
    const postData = {
        groupId: groupId,
        projectId: project.projectid,
    }
    if (groupType) {
        postData['type'] = groupType;
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

export const getProjects = async (
    admin: boolean,
    search?: string,
    offset?: number,
    limit?: number,
) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += 'project/getProjects?';
    search ? (url += `?filterWord=${search}`) : '';
    offset ? (url += `&offset=${offset}`) : '';
    limit ? (url += `&limit=${limit}`) : '';
    const response = await get<
            {
                project_global: boolean;
                project_id: string;
                project_name: string;
                project_permission: string;
                project_visibility: boolean;
            }[]
        >(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get Projects');
    }
    return response.data;
};

//Check with Neel
export const getUserProjectPermission = async (
    projectId: string,
): Promise<{
    permission: Role;
}> => {
    let url = `${Env.MODULE}/api/auth/`;
    url += `project/getUserProjectPermission?projectId=${projectId}`;
    const response = await get(url);
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get permission');
    }
    return {permission: response.data as Role};
};

export const getProjectUsers = async (
    admin: boolean,
    projectId: string,
    user: string,
    permission: string,
    offset?: number,
    limit?: number,
    id?: string,
) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += `project/getProjectUsers?projectId=${projectId}&userId=${user}&permission=${permission}`;
    if (offset) {
        url += `&offset=${offset}`;
    }
    if (limit) {
        url += `&limit=${limit}`;
    }
    // get the response
    const response = await get<{
            members: {
                id: string;
                name: string;
                permission: string;
            }[];
            totalMembers: number;
        }>(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get users associated with app');
    }
    return response.data;
};

export const getProjectUsersNoCredentials = async (
    admin: boolean,
    appId: string,
    limit: number,
    offset: number,
    searchTerm: string,
) => {
    let url = `${Env.MODULE}/api/auth/`;
    if (admin) {
        url += 'admin/';
    }
    url += `project/getProjectUsersNoCredentials?projectId=${appId}&limit=${limit}&offset=${offset}&searchTerm=${searchTerm}`;
    // get the response
    const response = await get<
            {
                id: string;
                email: string;
                name: string;
                type: string;
                username: string;
            }[]
        >(url)
        .catch((error) => {
            throw Error(error);
        });
    // there was no response, that is an error
    if (!response) {
        throw Error('No Response to get non credentialed users');
    }
    return response;
};

export const approveProjectUserAccessRequest = async (
    admin: boolean,
    appId: string,
    requests: any[],
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'projectId': appId,
        'requests': requests,
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'project/approveProjectUserAccessRequest';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const denyProjectUserAccessRequest = async (
    admin: boolean,
    projectId: string,
    userIds: string[],
) => {
    let url = `${Env.MODULE}/api/auth/`
    
    const postData = {
        'projectId': projectId,
        'requestids': userIds,
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'project/denyProjectUserAccessRequest';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const addProjectUserPermissions = async (
    admin: boolean,
    appId: string,
    users: any[],
) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'projectId': appId,
        'userpermissions': users,
        }
    if (admin) {
        url += 'admin/';
    }
    url += 'project/addProjectUserPermissions';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const editProjectUserPermissions = async (
    admin: boolean,
    appId: string,
    users: any[],
) => {
    let url = `${Env.MODULE}/api/auth/`

    const postData = {
        'projectId': appId,
        'userpermissions': users,
    }
    if (admin) {
        url += 'admin/';
    }
    url += 'project/editProjectUserPermissions';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const removeProjectUserPermissions = async (
    admin: boolean,
    appId: string,
    users: any[],
) => {
    let url = `${Env.MODULE}/api/auth/`

    const postData = {
        'projectId': appId,
        'ids': users,
    };
    if (admin) {
        url += 'admin/';
    }
    url += 'project/removeProjectUserPermissions';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
    // figure out whether we want to do .catch here
};

export const setProjectGlobal = async (admin, appId, global: boolean) => {
    let url = `${Env.MODULE}/api/auth/`
    const postData = {
        'projectId': appId,
        'public': global,
    }
    if (admin) {
        url += 'admin/';
    }
    url += 'project/setProjectGlobal';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const setProjectVisiblity = async (admin, appId, visible) => {
    let url = `${Env.MODULE}/api/auth/`

    const postData = {
        'projectId': appId,
        'discoverable': visible,
    }
    if (admin) {
        url += 'admin/';
    }
    url += 'project/setProjectDiscoverable';

    const response = await post<{
        success: boolean;
    }>(url, postData, {
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
    });
    return response;
};

export const setProjectPortal = async (
    admin: boolean,
    projectId: string,
    hasPortal: boolean,
    portalName?: string,
) => {
    let url = `${Env.MODULE}/api/auth/`
    // if (admin) {
    //     url += 'admin/';
    // }
    url += `project/setProjectPortal?projectId=${encodeURIComponent(projectId)}&hasPortal=${encodeURIComponent(hasPortal)}`;

    if (portalName) {
        url += '&projectId=' + encodeURIComponent(portalName);
    }
    const response = await post<{
        success: boolean;
    }>(url, null);
    return response;
};



