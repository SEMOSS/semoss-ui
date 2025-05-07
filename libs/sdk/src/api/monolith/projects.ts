import { Env } from '@/env';
import { get, post} from "../../utility";
import { Role } from '@/types';

import { off } from 'process';

export const setProjectFavorite = async (
    projectId: string,
    favorite: boolean,
) => {
    let url = `${Env.MODULE}/api/auth/`

    const postData = {
        projectId: projectId,
        isFavorite: favorite,
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
        groupId: groupId,
        projectId: projectId,
        permission: permission,
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
        groupId: groupId,
        projectId: project.projectid,
        permission: project.permission,
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