import { Role } from '@/types';
import { ReactNode } from 'react';

/**
 * -----------------------------------------------------------------------
 * TYPES -----------------------------------------------------------------
 * -----------------------------------------------------------------------
 */
export interface dependency {
    app_id: string;
    app_name: string;
    app_type: string;
}

export interface modelledDependency {
    appId: string;
    appName: string;
    appType: string;
    isDiscoverable: boolean;
    isPublic: boolean;
}

export interface engine {
    app_cost: string;
    app_favorite: number;
    app_id: string;
    app_name: string;
    app_subtype: string;
    app_type: string;
    database_cost: string;
    database_discoverable: false;
    database_favorite: number;
    database_global: false;
    database_id: string;
    database_name: string;
    database_subtype: string;
    database_type: string;
    low_database_name: string;
    permission: number;
    user_permission: number;
}

/**
 * -----------------------------------------------------------------------
 * react-hook-form -----------------------------------------------------------
 * -----------------------------------------------------------------------
 */
export interface AppDetailsFormTypes {
    appId: string;
    appInfo: any;
    userRole: Role | '';
    permission:
        | 'creator'
        | 'author'
        | 'editor'
        | 'readOnly'
        | 'discoverable'
        | '';

    mainUses: string;
    tags: string[];
    detailsForm: {
        mainUses: string;
        tags: string[];
    };

    dependencies: any[];
    allDependencies: engine[];
    selectedDependencies: any[];

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
    detailsForm: {
        mainUses: '',
        tags: [],
    },

    dependencies: [],
    allDependencies: [],
    selectedDependencies: [],

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

export const SetProjectDependencies = async (
    monolithStore: any,
    appId: string,
    dependencies: dependency[],
) => {
    const res = await monolithStore.runQuery(
        `SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
            dependencies,
        )})`,
    );
    console.log('RES', res);
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
