import { Role } from '@/types';
import { ReactNode } from 'react';

/**
 * -----------------------------------------------------------------------
 * react-hook-form -----------------------------------------------------------
 * -----------------------------------------------------------------------
 */
export interface AppDetailsFormTypes {
    appId: string;
    appInfo: any;
    userRole: Role | '';
    permission: 'author' | 'editor' | 'readOnly' | 'discoverable' | '';

    mainUses: string;
    tags: string[];
    videos: any[]; // TODO: type fixes
    detailsForm: {
        mainUses: string;
        tags: string[];
        videos: any[];
    };

    dependencies: any[];

    requestedPermission: 'author' | 'editor' | 'readOnly' | '';
    roleChangeComment: string | ReactNode;
}

export const AppDetailsFormValues: AppDetailsFormTypes = {
    appId: '',
    appInfo: null,
    userRole: '',
    permission: '',

    mainUses: '',
    tags: [],
    videos: [],
    detailsForm: {
        mainUses: '',
        tags: [],
        videos: [],
    },

    dependencies: [],

    requestedPermission: '',
    roleChangeComment: '',
};

/**
 * -----------------------------------------------------------------------
 * PIXEL CALLS -----------------------------------------------------------
 * -----------------------------------------------------------------------
 */
export const fetchAppInfo = async (monolithStore: any, appId: string) => {
    const res = await monolithStore.runQuery(`ProjectInfo(project="${appId}")`);

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    if (type.indexOf('ERROR') === -1) {
        return {
            type: 'success',
            output,
        };
    } else {
        return {
            type: 'error',
            output,
        };
    }
};

export const fetchMainUses = async (monolithStore: any, appId: string) => {
    const res = await monolithStore.runQuery(
        `GetProjectMarkdown(project="${appId}")`,
    );

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    if (type.indexOf('ERROR') === -1) {
        return {
            type: 'success',
            output,
        };
    } else {
        return {
            type: 'error',
            output,
        };
    }
};

export const fetchDependencies = async (monolithStore: any, appId: string) => {
    const res = await monolithStore.runQuery(
        `GetProjectDependencies(project="${appId}", details=[true])`,
    );

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    if (type.indexOf('ERROR') === -1) {
        return {
            type: 'success',
            output,
        };
    } else {
        return {
            type: 'error',
            output,
        };
    }
};

export const updateProjectDetails = async (
    monolithStore: any,
    appId: string,
    markdown: string,
    tags: string[],
) => {
    const res = await monolithStore.runQuery(
        `SetProjectMetadata(project="${appId}", meta=[{"markdown": "${markdown}", "tag": [${tags.map(
            (tag) => {
                return `"${tag}"`;
            },
        )}]}])`,
    );

    const type = res.pixelReturn[0].operationType;
    const output = res.pixelReturn[0].output;

    return {
        type: type.indexOf('ERROR') === -1 ? 'success' : 'error',
        output,
    };
};

/**
 * -----------------------------------------------------------------------
 * OTHER UTILITY FUNCTIONS -----------------------------------------------
 * -----------------------------------------------------------------------
 */
type AppPermission = 'author' | 'editor' | 'readOnly' | 'discoverable' | '';
export const determineUserPermission = (role: Role): AppPermission => {
    let permission: AppPermission = '';

    if (role === 'OWNER') {
        permission = 'author';
    } else if (role === 'EDIT' || role === 'EDITOR') {
        permission = 'editor';
    } else if (role === 'READ_ONLY' || role === 'VIEWER') {
        permission = 'readOnly';
    } else if (role === 'DISCOVERABLE') {
        permission = 'discoverable';
    }

    return permission;
};
