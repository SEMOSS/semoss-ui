import { makeAutoObservable } from 'mobx';

import { RootStore, StateStore, StateStoreImplementation } from '@/stores';
import { AppMetadata } from '@/components/app';

import { WorkspaceStore } from '@/stores';
import { DefaultCells } from '@/components/cell-defaults';
import { runPixel } from '@/api';

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

        // create the newly loaded workspace
        this._store.workspaces[appId] = new WorkspaceStore(this._root, {
            id: appId,
            type: 'code',
            options: {},
            role: role,
            metadata: metadata,
        });

        // return the new workspace
        return this._store.workspaces[appId];
    }

    /**
     * Load an app into a workspace
     *
     * @param appId - id of app to load into the workspace
     */
    async loadBlocksWorkspace(appId: string) {
        // sleep for 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // load the app
        // const setContext = await this._root.monolithStore.run<[true]>(
        //     'new',
        //     `SetContext(app=["${appId}"]);`,
        // );
        const setContext = await this._root.monolithStore.run<[true]>(
            'new',
            `1+1`,
        );

        // throw the errors if there are any
        if (setContext.errors.length > 0) {
            throw new Error(setContext.errors.join(''));
        }

        // create the newly loaded workspace
        this._store.workspaces[appId] = new WorkspaceStore(this._root, {
            id: appId,
            role: 'OWNER',
            type: 'blocks',
            options: {
                state: new StateStoreImplementation({
                    insightId: setContext.insightId,
                    blocks: {},
                    queries: {},
                    cellRegistry: DefaultCells,
                }),
            },
            metadata: {
                project_id: '',
                project_name: '',
                project_type: '',
                project_cost: '',
                project_global: '',
                project_catalog_name: '',
                project_created_by: '',
                project_created_by_type: '',
                project_date_created: '',
            },
        });

        // return the new workspace
        return this._store.workspaces[appId];
    }
}
