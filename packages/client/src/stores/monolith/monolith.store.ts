import axios from 'axios';
import { makeAutoObservable } from 'mobx';

import { MODULE } from '@/constants';
import { Role } from '@/types';
import { RootStore } from '@/stores';

/**
 * Store that manages instances of the insights and handles applicaiton level querying
 */
export class MonolithStore {
    private _root: RootStore;

    constructor(root: RootStore) {
        // register the root
        this._root = root;

        // make it observable
        makeAutoObservable(this);
    }

    // *********************************************************
    // Actions
    // *********************************************************
    /**
     * Get the config
     */
    async config() {
        // get the response
        const response = await axios
            .get<{
                security: boolean;
                logins: { [key: string]: unknown };
                loginsAllowed: { [key: string]: boolean };
                [key: string]: unknown;
            }>(`${MODULE}/api/config`)
            .catch((error) => {
                throw Error(error);
            });

        // there was an error, no response
        if (!response) {
            throw Error('No Config Response');
        }

        // save the config data
        return response.data;
    }

    /**
     * Run a pixel string
     *
     * @param insightID - insightID to execute the pixel against
     * @param pixel - pixel to execute
     */
    async run(insightID: string, pixel: string) {
        // build the expression
        let postData = '';

        postData += 'expression=' + encodeURIComponent(pixel);
        if (insightID) {
            postData += '&insightId=' + encodeURIComponent(insightID);
        }

        const response = await axios
            .post<{
                insightID: string;
                pixelReturn: {
                    isMeta: boolean;
                    operationType: string[];
                    additionalOutput: { output: string }[];
                    output: any;
                    pixelExpression: string;
                    pixelId: string;
                }[];
            }>(`${MODULE}/api/engine/runPixel`, postData, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Pixel Response');
        }

        return response.data;
    }

    /**
     * Run a pixel off of the query insight
     *
     * @param pixel - pixel to execute
     */
    async runQuery(pixel: string) {
        const { configStore } = this._root;

        return this.run(configStore.store.insightID, pixel);
    }

    /**
     * Download a file by using a unique key
     *
     * @param insightID - insightID to download the file
     * @param fileKey - id for the file to download
     */
    async download(insightID: string, fileKey: string) {
        return new Promise<void>((resolve) => {
            // create the download url
            const url = `${MODULE}/api/engine/downloadFile?insightId=${insightID}&fileKey=${encodeURIComponent(
                fileKey,
            )}`;

            // fake clicking a link
            const link: HTMLAnchorElement = document.createElement('a');

            link.href = url;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);

            // resolve the promise
            resolve();
        });
    }

    /**
     * Run a download a file off of the query insight
     *
     * @param fileKey - id for the file to download
     */
    async downloadQuery(fileKey: string) {
        const { configStore } = this._root;

        return this.download(configStore.store.insightID, fileKey);
    }

    /**
     * Allow the user to login
     *
     * @param username - username to login with
     * @param password - password to login with
     * @returns true if successful
     */
    async login(username: string, password: string): Promise<boolean> {
        const postData = `username=${encodeURIComponent(
            username,
        )}&password=${encodeURIComponent(password)}&disableRedirect=true`;

        await axios
            .post(`${MODULE}/api/auth/login`, postData, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        return true;
    }

    /**     *
     * @returns true if successful
     */
    async logout(): Promise<boolean> {
        await axios
            .get(`${MODULE}/api/auth/logout/all`, {
                validateStatus: function (status) {
                    return true;
                },
            })
            .catch((err) => {
                throw Error(err);
            });

        return true;
    }

    /**
     * Allow the user to login using oauth
     *
     * @param provider - provider to login with
     * @returns true if successful
     */
    async oauth(provider: string): Promise<boolean> {
        // check if the user is logged in
        const response = await axios
            .get<{ name: string }>(`${MODULE}/api/auth/userinfo/${provider}`)
            .catch((error) => {
                throw Error(error);
            });

        //check if they are already logged in
        if (response.data && response.data.name) {
            return true;
        }

        return new Promise((resolve) => {
            const url = `${MODULE}/api/auth/login/${provider}`;
            const popUpWindow = window.top.open(
                url,
                '_blank',
                'height=600,width=400,top=300,left=' + 600,
            );

            // setup an interval to see if the popup window is closed or successful
            const interval = setInterval(async () => {
                try {
                    if (
                        !popUpWindow ||
                        popUpWindow.closed ||
                        popUpWindow.closed === undefined
                    ) {
                        clearInterval(interval);
                    } else if (
                        popUpWindow.document.location.href.indexOf(
                            `${window.location.host}`,
                        ) > -1
                    ) {
                        clearInterval(interval);

                        // close it
                        popUpWindow.close();

                        // try to get the info again
                        const response = await this.oauth(provider);

                        // close it
                        resolve(response);
                    }
                } catch (err) {
                    // do nothing
                    // this is to work around the blocked frame error that comes up
                }
            }, 1000);
        });
    }

    /**
     * @name getLoginProperties
     * @returns
     */
    async getLoginProperties() {
        const url = `${MODULE}/api/auth/loginProperties`;

        const response = await axios.get(url).catch((error) => {
            throw Error(error);
        });

        return response.data;
    }

    async modifyLoginProperties(provider, properties) {
        const url = `${MODULE}/api/auth/modifyLoginProperties/` + provider;
        let postData = '';

        postData += 'modifications=' + JSON.stringify(properties);

        const response = await axios.post<boolean>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data;
    }

    /**
     * @name isAdminUser
     * @description Determines whether user is admin or
     * @returns boolean
     */
    async isAdminUser() {
        const url = `${MODULE}/api/auth/admin/user/isAdminUser`;

        const response = await axios.get(url).catch((error) => {
            throw Error(error);
        });

        if (!response) {
            throw Error('No Response to isAdminUSer');
        }

        return response.data;
    }

    // ----------------------------------------------------------------------
    // Engine
    // ----------------------------------------------------------------------
    /**
     * @name getEngines
     * @param admin - is admin user
     * @returns AppInterface[]
     */
    async getEngines(
        admin: boolean,
        search: string,
        engineType: string,
        offset?: number,
        limit?: number,
    ) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'engine/getEngines';

        const params = {};

        params['engineTypes'] = engineType;
        search && (params['filterWord'] = search);

        offset && (params['offset'] = offset);

        limit && (params['limit'] = limit);

        // get the response
        const response = await axios
            .get(url, {
                params: params,
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get Apps');
        }

        return response.data;
    }

    /**
     * @name getUserEnginePermission
     * @desc Get a user's role for the engine
     * @param id - id of engine (db, storage, model)
     */
    async getUserEnginePermission(id: string) {
        const response = await axios
            .get<{ permission: Role }>(
                `${MODULE}/api/auth/engine/getUserEnginePermission`,
                {
                    params: { engineId: id },
                },
            )
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No roles for the app user');
        }

        return response.data;
    }

    /**
     * @name getEngineUsers
     * @param admin
     * @param appId
     * @returns MemberInterface[]
     */
    async getEngineUsers(
        admin: boolean,
        databaseId: string,
        user: string,
        permission: string,
        offset?: number,
        limit?: number,
        projectId?,
    ) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'engine/getEngineUsers';

        // get the response
        const response = await axios
            .get<{
                members: {
                    id: string;
                    name: string;
                    permission: string;
                }[];
                totalMembers: number;
            }>(url, {
                params: {
                    engineId: databaseId,
                    userId: user,
                    permission: permission,
                    offset: offset,
                    limit: limit,
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get users associated with app');
        }

        console.warn(
            'Project Id is not a necessary param, optional due to the similarity of usage for getInsightUsers',
            projectId,
        );

        return response.data;
    }

    /**
     * @name getEngineUsersNoCredentials
     * @param admin
     * @param appId
     * @returns
     */
    async getEngineUsersNoCredentials(admin: boolean, appId: string) {
        let url = `${MODULE}/api/auth/`;

        // Currently no admin ENDPOINT;
        if (admin) {
            url += 'admin/';
        }

        url += 'engine/getEngineUsersNoCredentials';

        // get the response
        const response = await axios
            .get<Record<string, unknown>[]>(url, {
                params: { engineId: appId },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get non credentialed users');
        }

        return response;
    }

    /**
     * @name addEngineUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async addEngineUserPermissions(
        admin: boolean,
        appId: string,
        users: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        // No Admin endpoint currently
        if (admin) {
            url += 'admin/';
        }

        url += 'engine/addEngineUserPermissions';

        postData += 'engineId=' + encodeURIComponent(appId);
        postData +=
            '&userpermissions=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name editEngineUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async editEngineUserPermissions(
        admin: boolean,
        appId: string,
        users: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'engine/editEngineUserPermissions';

        postData += 'engineId=' + encodeURIComponent(appId);
        postData +=
            '&userpermissions=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name removeEngineUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async removeEngineUserPermissions(
        admin: boolean,
        appId: string,
        users: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'engine/removeEngineUserPermissions';

        postData += 'engineId=' + encodeURIComponent(appId);
        postData += '&ids=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * @name setEngineGlobal
     * @param admin
     * @param appId
     * @param global
     */
    async setEngineGlobal(admin: boolean, engineId: string, global: boolean) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        // change to database
        url += 'engine/setEngineGlobal';

        postData += 'engineId=' + encodeURIComponent(engineId);
        postData += '&public=' + encodeURIComponent(global);

        const response = await axios
            .post<{ success: boolean }>(url, postData, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        return response;
    }

    /**
     * @name setEngineVisiblity
     * @param admin
     * @param appId
     * @param visible
     */
    async setEngineVisiblity(
        admin: boolean,
        engineId: string,
        visible: boolean,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'engine/setEngineDiscoverable';

        postData += 'engineId=' + encodeURIComponent(engineId);
        postData += '&discoverable=' + encodeURIComponent(visible);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    async setEngineFavorite(engineId: string, favorite: boolean) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        url += 'engine/setEngineFavorite';
        postData += 'engineId=' + encodeURIComponent(engineId);
        postData += '&isFavorite=' + encodeURIComponent(favorite);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * @name approveEngineUserAccessRequest
     * @param admin
     * @param engineId
     * @param requests
     * @returns
     */
    async approveEngineUserAccessRequest(
        admin: boolean,
        engineId: string,
        requests: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'engine/approveEngineUserAccessRequest';

        postData += 'engineId=' + encodeURIComponent(engineId);
        postData += '&requests=' + encodeURIComponent(JSON.stringify(requests));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * @name denyEngineUserAccessRequest
     * @param admin
     * @param appId
     * @param userIds
     * @returns
     */
    async denyEngineUserAccessRequest(
        admin: boolean,
        engineId: string,
        userIds: string[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'engine/denyEngineUserAccessRequest';

        postData += 'engineId=' + encodeURIComponent(engineId);
        postData +=
            '&requestIds=' + encodeURIComponent(JSON.stringify(userIds));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });
        return response;
    }

    // ----------------------------------------------------------------------
    // Database Level
    // ----------------------------------------------------------------------
    /**
     * @name getDatabases
     * @param admin - is admin user
     * @returns AppInterface[]
     */
    async getDatabases(admin: boolean) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'database/getDatabases';
        // get the response
        const response = await axios
            .get<
                {
                    app_global: boolean;
                    app_id: string;
                    app_name: string;
                    app_permission: string;
                    app_visibility: boolean;
                }[]
            >(url)
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get Apps');
        }

        return response.data;
    }

    // ----- Users Start -----

    // ----- Users End -----
    // ----- Properties Start -----

    /**
     * @name updateDatabaseSmmsProperties
     * @param databaseId
     * @param smssProps
     * @returns
     */
    async updateDatabaseSmssProperties(databaseId: string, smssProps: string) {
        const url = `${MODULE}/api/e-${databaseId}/updateSmssFile`;

        let postData = '';
        postData += 'engineId=' + encodeURIComponent(databaseId);
        postData += '&smss=' + encodeURIComponent(smssProps);

        const response = await axios
            .post<{ success: boolean }>(url, postData, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        return response;
    }

    /**
     * @name setDatabaseDiscoverable
     * @param admin
     * @param appId
     * @param discoverable
     */
    async setDatabaseDiscoverable(
        admin: boolean,
        appId: string,
        discoverable: boolean,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        // change to database
        url += 'app/setAppDiscoverable';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&discoverable=' + encodeURIComponent(discoverable);

        const response = await axios
            .post<{ success: boolean }>(url, postData, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        return response;
    }

    // ----- Properties End -----

    // ----------------------------------------------------------------------
    // Project Level
    // ----------------------------------------------------------------------
    /**
     * @name getProjects
     * @param admin - is admin user
     * @returns Projects retrieved from Promise
     */
    async getProjects(
        admin: boolean,
        search?: string,
        offset?: number,
        limit?: number,
    ) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'project/getProjects';

        const params = {};

        search && (params['filterWord'] = search);

        offset && (params['offset'] = offset);

        limit && (params['limit'] = limit);

        const response = await axios
            .get<
                {
                    project_global: boolean;
                    project_id: string;
                    project_name: string;
                    project_permission: string;
                    project_visibility: boolean;
                }[]
            >(url, {
                params: params,
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get Projects');
        }

        return response.data;
    }

    /**
     * @name getUserProjectPermission
     * @param admin - is admin user
     * @returns Projects retrieved from Promise
     */
    async getUserProjectPermission(projectId: string) {
        let url = `${MODULE}/api/auth/`;

        url += 'project/getUserProjectPermission';

        const response = await axios.get(url, {
            params: {
                projectId: projectId,
            },
        });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get permission');
        }

        return response.data;
    }

    // ----- Users Start -----

    /**
     * @name getProjectUsers
     * @param admin
     * @param projectId
     * @returns MemberInterface[]
     */
    async getProjectUsers(
        admin: boolean,
        projectId: string,
        user: string,
        permission: string,
        offset?: number,
        limit?: number,
        id?: string,
    ) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'project/getProjectUsers';
        // get the response
        const response = await axios
            .get<{
                members: {
                    id: string;
                    name: string;
                    permission: string;
                }[];
                totalMembers: number;
            }>(url, {
                params: {
                    projectId: projectId,
                    userId: user,
                    permission: permission,
                    offset: offset,
                    limit: limit,
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get users associated with app');
        }

        return response.data;
    }

    /**
     * @name getProjectUsersNoCredentials
     * @param admin if admin initiated the call
     * @param projectId the id of app
     * @desc get the existing users and their permissions for this app
     */
    async getProjectUsersNoCredentials(admin: boolean, projectId: string) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'project/getProjectUsersNoCredentials';

        // get the response
        const response = await axios
            .get<Record<string, unknown>[]>(url, {
                params: { projectId: projectId },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get non credentialed users');
        }

        return response;
    }

    /**
     * @name approveProjectUserAccessRequest
     * @param admin
     * @param appId
     * @param requests
     * @returns
     */
    async approveProjectUserAccessRequest(
        admin: boolean,
        appId: string,
        requests: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'project/approveProjectUserAccessRequest';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData += '&requests=' + encodeURIComponent(JSON.stringify(requests));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name denyProjectUserAccessRequest
     * @param admin
     * @param projectId
     * @param userIds
     * @returns
     */
    async denyProjectUserAccessRequest(
        admin: boolean,
        projectId: string,
        userIds: string[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'project/denyProjectUserAccessRequest';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData +=
            '&requestids=' + encodeURIComponent(JSON.stringify(userIds));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });
        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name addProjectUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async addProjectUserPermissions(
        admin: boolean,
        appId: string,
        users: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'project/addProjectUserPermissions';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData +=
            '&userpermissions=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name editProjectUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async editProjectUserPermissions(
        admin: boolean,
        appId: string,
        users: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'project/editProjectUserPermissions';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData +=
            '&userpermissions=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name removeProjectUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async removeProjectUserPermissions(
        admin: boolean,
        appId: string,
        users: any[],
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'project/removeProjectUserPermissions';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData += '&ids=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }
    // ----- Users End -----
    // ----- Properties Start -----

    /**
     * @name setProjectGlobal
     * @param admin
     * @param appId
     * @param global
     */
    async setProjectGlobal(admin, appId, global: boolean) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/setProjectGlobal';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData += '&public=' + encodeURIComponent(global);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * @name setProjectVisiblity
     * @param admin
     * @param appId
     * @param visible
     */
    async setProjectVisiblity(admin, appId, visible) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/setProjectDiscoverable';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData += '&discoverable=' + encodeURIComponent(visible);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    // ----- Properties End -----
    // ----- Portal Start -----

    /**
     * @name setProjectPortal
     * @param projectId
     * @param hasPortal
     * @param portalName
     */
    async setProjectPortal(
        admin: boolean,
        projectId: string,
        hasPortal: boolean,
        portalName?: string,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        // if (admin) {
        //     url += 'admin/';
        // }

        url += 'project/setProjectPortal';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&hasPortal=' + encodeURIComponent(hasPortal);

        if (portalName) {
            postData += '&projectId=' + encodeURIComponent(portalName);
        }

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    // ----- Portal End -----

    // ----------------------------------------------------------------------
    // Insight Level
    // ----------------------------------------------------------------------

    async getInsights() {
        console.error('needs to be added on BE');
    }

    async getInsightUsers(
        admin: boolean,
        id: string,
        user: string,
        permission: string,
        offset?: number,
        limit?: number,
        projectid?: string,
    ) {
        // /api/auth/insight/getInsightUsers?
        // insightId=feb4c485-0aa8-4ff6-b355-e894dc74589a&projectId=2e2534db-fffa-4054-b9e9-dbf44183ab3b

        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'insight/getInsightUsers';

        if (!projectid) {
            throw Error('no project id');
        }

        // get the response
        const response = await axios
            .get<
                {
                    id: string;
                    name: string;
                    permission: string;
                }[]
            >(url, {
                params: {
                    insightId: id,
                    projectId: projectid,
                    offset: offset,
                    limit: limit,
                    userId: user,

                    // projectId: projectId,
                    //             permission: permission,
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        if (!response) {
            throw Error('Unsuccessful attempt at retrieving Insight Users');
        }

        return response.data;
    }

    /**
     * @name getInsightUsersNoCredentials
     * @param admin if admin initiated the call
     * @param projectId the id of app
     * @desc get the existing users and their permissions for this app
     */
    async getInsightUsersNoCredentials(
        admin: boolean,
        insightId: string,
        projectId: string,
    ) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'insight/getInsightUsersNoCredentials';

        // get the response
        const response = await axios
            .get(url, {
                params: { projectId: projectId, insightId: insightId },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get non credentialed users');
        }

        return response.data;
    }

    // Verified Project Member actions

    /**
     * @name addInsightUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async addInsightUserPermissions(
        admin: boolean,
        id: string,
        users: any[],
        projectId: string,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'insight/addInsightUserPermissions';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&insightId=' + encodeURIComponent(id);
        postData +=
            '&userpermissions=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name removeInsightUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async removeInsightUserPermissions(
        admin: boolean,
        id: string,
        users: any[],
        projectId,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'project/removeProjectUserPermissions';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&insightId=' + encodeURIComponent(id);
        postData += '&ids=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    /**
     * @name editInsightUserPermissions
     * @param admin
     * @param appId
     * @param users
     * @returns
     */
    async editInsightUserPermissions(
        admin: boolean,
        id: string,
        users: any[],
        projectId: string,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'insight/editInsightUserPermissions';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&insightId=' + encodeURIComponent(id);
        postData +=
            '&userpermissions=' + encodeURIComponent(JSON.stringify(users));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;

        // figure out whether we want to do .catch here
    }

    // Being used but need to be taken out below ------------------
    /**
     * This will end up being taken out
     * @param admin
     * @param projectId
     * @param id
     * @param permission
     * @returns
     */
    async editProjectUserPermission(
        admin: boolean,
        projectId: string,
        id: string,
        permission: string,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/editProjectUserPermission';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&id=' + encodeURIComponent(id);
        postData += '&permission=' + encodeURIComponent(permission);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * This will end up being taken out
     * @desc this call will edit access permissions for a user
     * @param admin admin true or false
     * @param appId id of app
     * @param id id of user
     * @param permission permission to give
     */
    async editAppUserPermission(
        admin: boolean,
        appId: string,
        id: string,
        permission: string,
    ) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/editAppUserPermission';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&id=' + encodeURIComponent(id);
        postData += '&permission=' + encodeURIComponent(permission);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    async uploadFile(
        files: File[],
        insightId: string | null,
        projectId?: string | null,
        path?: string | null,
    ) {
        let param = '';
        if (insightId || projectId || path) {
            if (insightId) {
                if (param.length > 0) {
                    param += '&';
                }
                param += `insightId=${insightId}`;
            }

            if (projectId) {
                if (param.length > 0) {
                    param += '&';
                }
                param += `projectId=${projectId}`;
            }

            if (path) {
                if (param.length > 0) {
                    param += '&';
                }
                param += `path=${path}`;
            }

            param = `?${param}`;
        }

        const url = `${MODULE}/api/uploadFile/baseUpload${param}`,
            fd: FormData = new FormData();

        if (Array.isArray(files)) {
            for (let i = 0; i < files.length; i++) {
                fd.append('file', files[i]);
            }
        } else {
            // pasted data
            fd.append('file', files);
        }

        const response = await axios.post<
            {
                fileName: string;
                fileLocation: string;
            }[]
        >(url, fd, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response.data;
    }

    async getApps(databaseId: string) {
        const url = `${MODULE}/api/auth/admin/app/getApps?databaseId=${databaseId}`;
        const response = await axios.get(url).catch((error) => {
            throw Error(error);
        });

        return response.data;
    }

    /**
     * @name getDBUsers
     * @param admin if admin initiated the call
     * @param appId the id of app
     * @desc get the existing users and their permissions for this db
     * @returns $http promise
     */
    async getDBUsers(admin: boolean, appId: string) {
        let url = `${MODULE}/api/auth/`;
        if (admin) url += 'admin/';

        url += 'app/getAppUsers';
        const response = await axios
            .get(url, {
                params: { appId: appId },
            })
            .catch((error) => {
                throw Error(error);
            });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get non credentialed users');
        }

        return response;
    }
    /**
     * @name removeAppUserPermissions
     * @param admin if admin initiated the call
     * @param appId the id of app
     * @desc get the existing users and their permissions for this db
     * @returns $http promise
     */
    async removeAppUserPermissions(admin: boolean, appId: string, id: string) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/removeAppUserPermission';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&id=' + encodeURIComponent(id);

        const response = await axios
            .post<{ success: boolean }>(url, postData, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            })
            .catch((error) => {
                throw Error(error);
            });

        return response;
    }

    // ----------------------------------------------------------------------
    // Member Level
    // ----------------------------------------------------------------------

    /**
     * @name getAllUsers
     * @param admin - is admin user
     * @returns MemberInterface[]
     */
    async getAllUsers(admin) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }

        url += 'user/getAllUsers';
        // get the response
        const response = await axios.get(url).catch((error) => {
            throw Error(error);
        });

        // there was no response, that is an error
        if (!response) {
            throw Error('No Response to get Members');
        }

        return response.data;
    }

    /**
     * @name editMemberInfo
     * @param admin
     * @param user
     * @returns
     */
    async editMemberInfo(admin: boolean, user: any) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'user/editUser';

        postData += 'user=' + encodeURIComponent(JSON.stringify(user));

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * @name deleteMember
     * @param admin
     * @param userId
     * @param userType
     * @returns
     */
    async deleteMember(admin: boolean, userId: string, userType: string) {
        let url = `${MODULE}/api/auth/`,
            postData = '';

        if (admin) {
            url += 'admin/';
        }
        url += 'user/deleteUser';

        postData += 'userId=' + encodeURIComponent(userId);
        postData += '&type=' + encodeURIComponent(userType);

        const response = await axios.post<{ success: boolean }>(url, postData, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
            },
        });

        return response;
    }

    /**
     * @name createUser
     * @param admin
     * @param user
     * @returns
     */
    async createUser(admin: boolean, user: any) {
        let url = `${MODULE}/api/auth/`;

        if (admin) {
            url += 'admin/';
        }
        url += 'user/registerUser';

        let newUserInfo =
            'userId=' +
            encodeURIComponent(user.id) +
            '&admin=' +
            encodeURIComponent(user.admin) +
            '&publisher=' +
            encodeURIComponent(user.publisher) +
            '&exporter=' +
            encodeURIComponent(user.exporter) +
            '&name=' +
            encodeURIComponent(user.name);

        if (user.email) {
            newUserInfo += '&email=' + encodeURIComponent(user.email);
        }
        if (user.type) {
            newUserInfo += '&type=' + encodeURIComponent(user.type);
        }
        if (user.password) {
            newUserInfo += '&password=' + encodeURIComponent(user.password);
        }

        const response = await axios.post<{ success: boolean }>(
            url,
            newUserInfo,
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            },
        );

        return response;
    }
}
