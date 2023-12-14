import { makeAutoObservable } from 'mobx';

import { RootStore } from '@/stores';
import { AppMetadata } from '@/components/app';

import { WorkspaceStore } from '@/stores';
import { WorkspaceConfigInterface } from '../workspace/workspace.store';

interface CacheStoreInterface {
    /** Track the loaded workspaces */
    workspaces: Record<string, WorkspaceStore>;
}

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class CacheStore {
    private _root: RootStore;
    private _store: CacheStoreInterface = {
        workspaces: {},
    };

    constructor(root: RootStore) {
        // register the root
        this._root = root;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get all of the workspace
     */
    get workspaces() {
        return this._store.workspaces;
    }

    /**
     * Get a workspace from the store
     * @param appId - appId of the workspace
     * @returns the app
     */
    getWorkspace(appId: string) {
        if (this._store.workspaces[appId]) {
            return this._store.workspaces[appId];
        }

        return null;
    }

    /**
     * Actions
     */
    /**
     * Check if a workspace is loaded in the store
     * @param appId - id of the workspace
     * @returns true if the workspace is loaded
     */
    containsWorkspace(appId: string) {
        if (this._store.workspaces[appId]) {
            return true;
        }

        return false;
    }

    /**
     * Load an app into a workspace
     *
     * @param appId - id of app to load into the workspace
     */
    async loadWorkspace(appId: string) {
        // check the permission
        const getUserProjectPermission =
            await this._root.monolithStore.getUserProjectPermission(appId);

        // get the role and throw an error if it is missing
        const role = getUserProjectPermission.permission;
        if (!role) {
            throw new Error('Unauthorized');
        }

        // get the metadata
        const getAppInfo = await this._root.monolithStore.runQuery<
            [AppMetadata]
        >(`ProjectInfo(project=["${appId}"]);`);

        // throw the errors if there are any
        if (getAppInfo.errors.length > 0) {
            throw new Error(getAppInfo.errors.join(''));
        }

        const metadata = {
            ...getAppInfo.pixelReturn[0].output,
        };

        const workspace: WorkspaceConfigInterface = {
            appId: appId,
            type: 'CODE',
            role: role,
            metadata: metadata,
        };

        // set it as blocks
        if (metadata.project_type === 'BLOCKS') {
            workspace.type = 'BLOCKS';
        }

        // create the newly loaded workspace
        this._store.workspaces[appId] = new WorkspaceStore(
            this._root,
            workspace,
        );

        // return the new workspace
        return this._store.workspaces[appId];
    }
}
