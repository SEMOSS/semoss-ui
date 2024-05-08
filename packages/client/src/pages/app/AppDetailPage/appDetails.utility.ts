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
    mainUses: string | ReactNode;
    tags: string[];
    dependencies: any[];
    userRole: Role | '';
    permission: 'author' | 'editor' | 'readOnly' | '';
    roleChangeComment: string | ReactNode;
}

export const AppDetailsFormValues: AppDetailsFormTypes = {
    appId: '',
    appInfo: null,
    mainUses: '',
    tags: [],
    dependencies: [],
    userRole: '',
    permission: '',
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

/**
 * -----------------------------------------------------------------------
 * OTHER UTILITY FUNCTIONS -----------------------------------------------
 * -----------------------------------------------------------------------
 */
export type AppDetailPermission = 'author' | 'editor' | 'readOnly' | '';
export const determineUserPermission = (role: Role): AppDetailPermission => {
    let permission: AppDetailPermission = '';

    if (role === 'OWNER') {
        permission = 'author';
    } else if (role === 'EDIT' || role === 'EDITOR') {
        permission = 'editor';
    } else if (
        role === 'READ_ONLY' ||
        role === 'DISCOVERABLE' ||
        role === 'VIEWER'
    ) {
        permission = 'readOnly';
    }

    return permission;
};
