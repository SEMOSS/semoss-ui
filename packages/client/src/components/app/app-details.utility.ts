import { Role } from '@/types';
import { ReactNode } from 'react';

/**
 * -----------------------------------------------------------------------
 * TYPES -----------------------------------------------------------------
 * -----------------------------------------------------------------------
 */

export interface appDependency {
    engine_discoverable: boolean;
    engine_global: boolean;
    engine_id: string;
    engine_name: string;
    engine_subtype: string;
    engine_type: string;
}

export interface modelledDependency {
    name: string;
    id: string;
    type: string;
    userPermission: Role | '';
    isPublic: boolean;
    isDiscoverable: boolean;
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
    user_permission: Role;
}

export interface AppDetailsRef {
    metakey: string;
    single_multi: string;
    display_values?: string;
    display: string;
    display_options:
        | 'input'
        | 'textarea'
        | 'markdown'
        | 'single-checklist'
        | 'multi-checklist'
        | 'single-select'
        | 'multi-select'
        | 'single-typeahead'
        | 'multi-typeahead'
        | 'select-box';
    ref: React.MutableRefObject<HTMLElement>;
}

/**
 * -----------------------------------------------------------------------
 * react-hook-form -----------------------------------------------------------
 * -----------------------------------------------------------------------
 */
export interface DetailsForm extends Record<string, unknown> {
    markdown: string;
    tag: string[];
}

export interface AppDetailsFormTypes {
    appId: string;
    appInfo: any;
    userRole: Role | '';
    permission: 'author' | 'editor' | 'readOnly' | 'discoverable' | '';

    markdown: string;
    tag: string[];
    detailsForm: DetailsForm;
    dependencies: modelledDependency[];
    allDependencies: modelledDependency[];
    selectedDependencies: modelledDependency[];

    requestedPermission: 'OWNER' | 'EDIT' | 'READ_ONLY' | '';
    roleChangeComment: string | ReactNode;
}

export const AppDetailsFormValues: AppDetailsFormTypes = {
    appId: '',
    appInfo: null,
    userRole: '',
    permission: '',
    markdown: '',
    tag: [],
    detailsForm: {
        markdown: '',
        tag: [],
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
export const fetchAppInfo = async (
    monolithStore: any,
    appId: string,
    metaKeys: string[],
) => {
    const res = await monolithStore.runQuery(
        `GetProjectMetadata(project="${appId}", metaKeys=${JSON.stringify([
            metaKeys,
        ])})`,
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
    data: object,
) => {
    // copy over the defined keys
    const meta = {};
    if (data) {
        for (const key in data) {
            if (data[key] !== undefined) {
                meta[key] = data[key];
            }
        }
    }
    const res = await monolithStore.runQuery(
        `SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
            meta,
        )}], jsonCleanup=[true])`,
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
    dependencies: string[],
) => {
    const res = await monolithStore.runQuery(
        `SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
            dependencies,
        )})`,
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
