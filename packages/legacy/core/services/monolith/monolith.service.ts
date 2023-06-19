import angular from 'angular';
import SuccessFn from './SuccessFn';

/**
 * @name monolith.service.js
 * @desc service used to interface with the Monolith REST API
 */
export default angular
    .module('app.monolith.service', [])
    .factory('monolithService', monolithService);

monolithService.$inject = [
    'CONFIG',
    'ENDPOINT',
    '$http',
    '$q',
    'messageService',
    '$location',
];

function monolithService(
    CONFIG,
    ENDPOINT: EndPoint,
    $http: ng.IHttpService,
    $q: ng.IQService,
    messageService: MessageService,
    $location
) {
    const THEN_ARGS = [
            (response: any): SuccessFn => successReturnFn(response, 'data'),
            errorReturnFn,
        ],
        GENERIC_SUCCESS = <T>(response: T): T => response;
    enum METHODS {
        GET = 'GET',
        POST = 'POST',
    }

    /**
     * @name errorReturnFn
     * @param err - the error sent back from the server
     * @param loggedout - if we get 302 from logged out, everyone has been logged out
     * @desc used for callback function when there is an error received from the server
     * @return rejected promise
     */
    function errorReturnFn(err: any, loggedout?: boolean): ng.IPromise<never> {
        messageService.emit('session-reset');

        if (err.status === 302) {
            if (loggedout) {
                // if every account has been logged out, we get a redirect and cannot
                // clean up CONFIG in security service
                CONFIG.loggedIn = false;
                CONFIG.logins = {};
            }
            const headers = err.headers();
            if (headers.redirect) {
                if (navigator.userAgent.indexOf('Tableau') === -1) {
                    window.location.replace(headers.redirect);
                }
            }

            messageService.emit('clear-loading');
            return $q.reject();
        }

        return $q.reject(err);
    }

    /**
     * @name successReturnFn
     * @param response the response from the BE
     * @param accessor what to access in the response
     * @desc returns the successful response
     * @returns the response
     */
    function successReturnFn(response: any, accessor?: string): any {
        let convertedAccessor: string[],
            convertedRoot = response;

        messageService.emit('session-reset');
        if (accessor) {
            convertedAccessor = accessor.split('.');
            for (let i = 0, len = convertedAccessor.length; i < len; i++) {
                // move to the next key in the path, reset the root
                if (
                    typeof convertedRoot[convertedAccessor[i]] === 'undefined'
                ) {
                    return false;
                }
                convertedRoot = convertedRoot[convertedAccessor[i]];
            }
        }

        return convertedRoot;
    }

    /** ****Searching for and Retrieving Insights (Solr Calls)******/
    /**
     * @name getSearchInsightsResults
     * @param searchInputConfig - configuration object for the search. TODO describe config inputs
     * @desc Returns insights from Solr
     * @return $http promise
     */
    function getSearchInsightsResults(searchInputConfig: {
        searchString: string;
        filterData: any;
        limit: number;
        offset: number;
    }): ng.IPromise<any> {
        let postData =
            'searchString=' +
            encodeURIComponent(searchInputConfig.searchString);

        postData +=
            '&filterData=' +
            encodeURIComponent(JSON.stringify(searchInputConfig.filterData));
        postData +=
            '&limit=' +
            encodeURIComponent(JSON.stringify(searchInputConfig.limit));
        postData +=
            '&offset=' +
            encodeURIComponent(JSON.stringify(searchInputConfig.offset));

        return HTTPReq(
            '/api/engine/central/context/getSearchInsightsResults',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name uploadFile
     * @param files - list of file to upload
     * @param insightId - insight id used for messaging
     * @param projectId - do we want to load this directly into a project folder?
     * @param path - load it directly to a path?
     * @desc xray upload
     * @returns return message
     */
    function uploadFile(
        files: any,
        insightId: string,
        projectId?: string,
        path?: string
    ): ng.IPromise<any> {
        let url = '/api/uploadFile/baseUpload',
            param = '',
            fd = new FormData();

        if (insightId || projectId || path) {
            if (insightId) {
                if (param.length > 0) {
                    param += '&';
                }
                param += 'insightId=' + insightId;
            }

            if (projectId) {
                if (param.length > 0) {
                    param += '&';
                }
                param += 'projectId=' + projectId;
            }

            if (path) {
                if (param.length > 0) {
                    param += '&';
                }
                param += 'path=' + path;
            }

            param = '?' + param;
        }

        url += param;

        if (Array.isArray(files)) {
            for (let i = 0; i < files.length; i++) {
                fd.append('file', files[i].file);
            }
        } else {
            // pasted data
            fd.append('file', files);
        }

        return HTTPReq(url, fd, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name checkHeaders
     * @param data the data that will be sent to the BE to check the headers for flat upload
     * @desc this call will check the headers of a flat upload for both excel and csv
     * @return $http promise
     */
    function checkHeaders(data: any): ng.IPromise<any> {
        let postData = '';

        postData += 'uploadType=' + encodeURIComponent(data.uploadType);
        postData +=
            '&userHeaders=' +
            encodeURIComponent(JSON.stringify(data.userHeaders));

        return HTTPReq(
            '/api/uploadFile/headerCheck',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name runPixel
     * @param insightID id for the insight
     * @param input pixel to run
     * @param sessionInfo jsessionid and Secret
     * @desc this call will run the pixel query
     * @returns {promise} promise of data from BE
     */
    function runPixel(
        insightID: string,
        input: string,
        sessionInfo?: any,
        disableLogging?: boolean
    ): ng.IPromise<any> {
        let url = '/api/engine/runPixel',
            postData = 'expression=' + encodeURIComponent(input);

        if (
            sessionInfo &&
            sessionInfo.jsessionId &&
            sessionInfo.secret &&
            sessionInfo.hash &&
            sessionInfo.insightId
        ) {
            url += '?JSESSIONID=' + encodeURIComponent(sessionInfo.jsessionId);
            url += '&s=' + encodeURIComponent(sessionInfo.secret);
            url += '&hash=' + encodeURIComponent(sessionInfo.hash);
            url += '&i=' + encodeURIComponent(sessionInfo.insightId);
        }

        if (insightID) {
            postData += '&insightId=' + encodeURIComponent(insightID);
        }

        if (disableLogging) {
            postData += '&dropLogging=false';
        }

        // send the timezone of the browser
        postData +=
            '&tz=' +
            encodeURIComponent(
                new Intl.DateTimeFormat().resolvedOptions().timeZone
            );

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name getInsightState
     * @param {string} insightId insight id to get the state for
     * @desc get the dashboard state of this insight id
     * @returns {promise} promise of the data from BE
     */
    function getInsightState(insightId: string): ng.IPromise<any> {
        const url =
            '/api/share/i-' +
            encodeURIComponent(insightId) +
            '/getInsightState';

        return HTTPReq(url, '', METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name getPipeline
     * @param insightID id for the insight
     * @desc gets pipeline AST reconstruct a pipeline from a pixel
     * @returns promise of data from BE
     */
    function getPipeline(insightID: string): ng.IPromise<any> {
        const data = `insightId=${encodeURIComponent(insightID)}`;

        return HTTPReq('/api/engine/getPipeline', data, METHODS.POST).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name createUser
     * @desc this call will run createUser endpoint
     * @param name, name of new user
     * @param username, username of new user
     * @param email, email of new user
     * @param password, password of new user
     * @param phone, phone of new user
     * @param phoneextension, phoneextension of new user
     * @param countrycode, countrycode of new user
     * @returns $http promise
     */
    function createUser(
        name: string,
        username: string,
        email: string,
        password: string,
        phone: string,
        phoneextension: string,
        countrycode: string
    ): ng.IPromise<any> {
        const create: string =
            'name=' +
            encodeURIComponent(name) +
            '&username=' +
            encodeURIComponent(username) +
            '&email=' +
            encodeURIComponent(email) +
            '&password=' +
            encodeURIComponent(password);
        '&phone=' +
            encodeURIComponent(phone) +
            '&phoneextension=' +
            encodeURIComponent(phoneextension) +
            '&countrycode=' +
            encodeURIComponent(countrycode);
        return HTTPReq('/api/auth/createUser', create, METHODS.POST).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name updateUser
     * @desc this call will run updateUser endpoint
     * @param userId, id of updating user
     * @param name, name of updating user
     * @param userEmail, email of updating user
     * @param userPassword, password of updating user
     * @param username, username of updating user
     * @param userAdmin, true or false
     * @param userPublisher, true or false
     * @param userExporter, true or false
     * @param type, the type of user login
     * @param phone, phone of new user
     * @param phoneextension, phoneextension of new user
     * @param countrycode, countrycode of new user
     * @param newId, updated ID
     * @param newEmail, updated email
     * @param newUsername, updated username
     * @returns $http promise
     */
    function updateUser(
        userId: string,
        name: string,
        userEmail: string,
        userPassword: string,
        userAdmin: string,
        userPublisher: boolean,
        userExporter: boolean,
        type: string,
        phone: string,
        phoneextension: string,
        countrycode: string,
        username: string,
        newId: string,
        newEmail: string,
        newUsername: string
    ): ng.IPromise<any> {
        const updateUserInfo: string =
            'user=' +
            encodeURIComponent(
                JSON.stringify({
                    id: userId,
                    name: name,
                    email: userEmail,
                    password: userPassword,
                    admin: userAdmin,
                    publisher: userPublisher,
                    exporter: userExporter,
                    type: type,
                    phone: phone,
                    phoneextension: phoneextension,
                    countrycode: countrycode,
                    username: username,
                    newId: newId,
                    newEmail: newEmail,
                    newUsername: newUsername,
                })
            );
        return HTTPReq(
            '/api/auth/admin/user/editUser',
            updateUserInfo,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name addNewUser
     * @desc this call will run addNewUser endpoint
     * @param userId, id of updating user
     * @param userAdmin, true or false
     * @returns $http promise
     */
    function addNewUser(
        userId: string,
        userAdmin: boolean,
        userPublisher: boolean,
        userExporter: boolean,
        name: string,
        email: string,
        type: string,
        password: string
    ): ng.IPromise<any> {
        if (!userAdmin) {
            userAdmin = false;
        }
        if (!userPublisher) {
            userPublisher = false;
        }
        if (!userExporter) {
            userExporter = false;
        }
        let newUserInfo =
            'userId=' +
            encodeURIComponent(userId) +
            '&admin=' +
            encodeURIComponent(userAdmin) +
            '&publisher=' +
            encodeURIComponent(userPublisher) +
            '&exporter=' +
            encodeURIComponent(userExporter) +
            '&name=' +
            encodeURIComponent(name);

        if (email) {
            newUserInfo += '&email=' + encodeURIComponent(email);
        }
        if (type) {
            newUserInfo += '&type=' + encodeURIComponent(type);
        }
        if (password) {
            newUserInfo += '&password=' + encodeURIComponent(password);
        }

        return HTTPReq(
            '/api/auth/admin/user/registerUser',
            newUserInfo,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name loginUser
     * @desc this call will run login endpoint
     * @param username of login user
     * @param password of login user
     * @returns $http promise
     */
    function loginUser(username: string, password: string): ng.IPromise<any> {
        const loginInfo =
            'username=' +
            encodeURIComponent(username) +
            '&password=' +
            encodeURIComponent(password);

        return HTTPReq('/api/auth/login', loginInfo, METHODS.POST).then(
            (response: any): SuccessFn => {
                window.localStorage.setItem(
                    'smssusername',
                    response.data.username
                );
                window.localStorage.setItem('smssname', response.data.name);

                return successReturnFn(response, 'data');
            },
            errorReturnFn
        );
    }

    /**
     * @name logout
     * @desc this call will run logout endpoint
     * @returns $http promise
     */
    function logoutUser(): ng.IPromise<any> {
        return HTTPReq('/api/auth/logout', '', METHODS.GET).then(
            (response: any): SuccessFn => {
                window.localStorage.removeItem('smssusername');
                window.localStorage.removeItem('smssname');

                return successReturnFn(response, 'data');
            },
            errorReturnFn
        );
    }

    /**
     * @name loginsAllowed
     * @desc this call will return which method will be used for user login i.e. OAuth or native
     * @returns $http promise
     */
    function loginsAllowed(): ng.IPromise<any> {
        return HTTPReq('/api/auth/loginsAllowed', '', METHODS.GET).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name console
     * @desc this call will run the pixel query
     * @param id - id to grab the message for
     * @returns $http promise
     */
    function console(id: string): ng.IPromise<any> {
        const postData = 'jobId=' + encodeURIComponent(id);

        return HTTPReq('/api/engine/console', postData, METHODS.POST).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name downloadFile
     * @desc this call will create a get to download a file
     * @param insightID - insightID
     * @param fileKey - id for the file to grab
     */
    function downloadFile(insightID: string, fileKey: string): void {
        let url =
                ENDPOINT.URL +
                '/api/engine/downloadFile?insightId=' +
                insightID +
                '&fileKey=' +
                encodeURIComponent(fileKey),
            link: HTMLAnchorElement;

        link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * @name updateDatabaseSmmsFile
     * @desc this call will run the pixel query
     * @param id - id to update for
     * @param content - smss content to update
     * @returns $http promise
     */
    function updateDatabaseSmssFile(
        id: string,
        content: string
    ): ng.IPromise<any> {
        let postData = '';
        postData += 'databaseId=' + encodeURIComponent(id);
        postData += '&smss=' + encodeURIComponent(content);
        const url = `/api/app-${id}/updateSmssFile`;

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name updateDatabaseSmmsFile
     * @desc this call will run the pixel query
     * @param id - id to update for
     * @param content - smss content to update
     * @returns $http promise
     */
    function updateProjectSmssFile(
        id: string,
        content: string
    ): ng.IPromise<any> {
        let postData = '';
        postData += 'projectId=' + encodeURIComponent(id);
        postData += '&smss=' + encodeURIComponent(content);
        const url = `/api/project-${id}/updateSmssFile`;

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name uploadDatabaseImage
     * @desc this call will run the pixel query
     * @param id - id to upload for
     * @param file - file to upload
     * @returns $http promise
     */
    function uploadDatabaseImage(id: string, file: File): ng.IPromise<any> {
        const fd = new FormData();

        fd.append('databaseId', id);
        fd.append('file', file);

        return HTTPReq(
            '/api/images/databaseImage/upload',
            fd,
            METHODS.POST,
            false
        ).then(...THEN_ARGS);
    }

    /**
     * @name deleteDatabaseImage
     * @param id app id to delete image for
     * @desc delete app image
     * @returns $http promise
     */
    function deleteDatabaseImage(id: string): ng.IPromise<any> {
        let postData = '';

        postData += 'databaseId=' + encodeURIComponent(id);

        return HTTPReq(
            '/api/images/databaseImage/delete',
            postData,
            METHODS.POST
        ).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name uploadProjectImage
     * @desc this call will run the pixel query
     * @param id - id to upload for
     * @param file - file to upload
     * @returns $http promise
     */
    function uploadProjectImage(id: string, file: File): ng.IPromise<any> {
        const fd = new FormData();

        fd.append('projectId', id);
        fd.append('file', file);

        return HTTPReq(
            '/api/images/projectImage/upload',
            fd,
            METHODS.POST,
            false
        ).then(...THEN_ARGS);
    }

    /**
     * @name deleteProjectImage
     * @param id app id to delete image for
     * @desc delete app image
     * @returns $http promise
     */
    function deleteProjectImage(id: string): ng.IPromise<any> {
        let postData = '';

        postData += 'projectId=' + encodeURIComponent(id);

        return HTTPReq(
            '/api/images/projectImage/delete',
            postData,
            METHODS.POST
        ).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name uploadInsightImage
     * @desc this call will run the pixel query
     * @param app - the app of the insight
     * @param id - id to upload for
     * @param file - file to upload
     * @returns $http promise
     */
    function uploadInsightImage(
        app: string,
        id: string,
        file: string
    ): ng.IPromise<any> {
        const fd = new FormData();

        fd.append('projectId', app);
        fd.append('insightId', id);
        fd.append('file', file);

        return HTTPReq(
            '/api/images/insightImage/upload',
            fd,
            METHODS.POST,
            false
        ).then(...THEN_ARGS);
    }

    /**
     * @name deleteInsightImage
     * @param appId app id to delete image for
     * @param insightId the insight id
     * @desc delete insight image
     * @returns $http promise
     */
    function deleteInsightImage(
        appId: string,
        insightId: string
    ): ng.IPromise<any> {
        let postData = '';

        postData += 'projectId=' + encodeURIComponent(appId);
        postData += '&insightId=' + encodeURIComponent(insightId);

        return HTTPReq(
            '/api/images/insightImage/delete',
            postData,
            METHODS.POST
        ).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name backendConfig
     * @desc get the  configuration settings from BE
     * @returns $http promise
     */
    function backendConfig(): ng.IPromise<any> {
        let url = '/api/config',
            param: string,
            urlParams = $location.search(),
            customParams,
            customParamStr = '';

        // additional params that serve to add query params
        if (urlParams && urlParams.hasOwnProperty('customParams')) {
            customParams = JSON.parse(urlParams.customParams);
            for (param in customParams) {
                if (!customParamStr) {
                    // first query param so start with ?
                    customParamStr += '?';
                } else {
                    customParamStr += '&';
                }

                customParamStr += param; // ?sencha
                customParamStr += '='; // ?sencha=
                customParamStr += customParams[param]; // ?sencha=davyzhang
            }

            if (customParamStr) {
                url += customParamStr;
            }
        }

        return HTTPReq(url, '', METHODS.GET).then((response: any): any => {
            let key: string;
            for (key in response.data) {
                if (response.data.hasOwnProperty(key)) {
                    CONFIG[key] = response.data[key];
                }
            }
            // message out to indicate config came back
            messageService.emit('initialize-config');
            return response.data;
        }, errorReturnFn);
    }

    /**
     * @name isAdmin
     * @desc checks to see if user is admin
     * @returns {object} $http promise
     */
    function isAdmin(): ng.IPromise<any> {
        return HTTPReq(
            '/api/auth/admin/user/isAdminUser',
            '',
            METHODS.GET
        ).then(...THEN_ARGS);
    }

    /**
     * @name getAllUsers
     * @desc to list all user information for admin
     * @returns $http promise
     */
    function getAllUsers(): ng.IPromise<any> {
        return HTTPReq(
            '/api/auth/admin/user/getAllUsers',
            '',
            METHODS.GET
        ).then(...THEN_ARGS);
    }

    /**
     * @name getAllUserDbs
     * @desc to list all user information for admin
     * @returns $http promise
     */
    function getAllUserDbs(userId: string): ng.IPromise<any> {
        const id = 'userId=' + encodeURIComponent(userId);

        return HTTPReq(
            '/api/auth/admin/app/getAllUserApps',
            id,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name removeAdminUser
     * @desc this call will remove a user
     * @param userId, id of user
     * @param type, type of user login
     * @returns $http promise
     */
    function removeAdminUser(userId: string, type: string): ng.IPromise<any> {
        const inputs =
            'userId=' +
            encodeURIComponent(userId) +
            '&type=' +
            encodeURIComponent(type);

        return HTTPReq(
            '/api/auth/admin/user/deleteUser',
            inputs,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name getUserInformation
     * @desc this call will return all users for a given search result
     * @param searchInput what to search for
     * @returns $http promise
     */
    function getUserInformation(searchInput: any): ng.IPromise<any> {
        const url =
            '/api/authorization/searchForUser?searchTerm=' + searchInput;

        return HTTPReq(url, '', METHODS.GET).then(...THEN_ARGS);
    }

    /**
     * @name getInsightUsers
     * @param projectId the project id the insight belongs to
     * @param insightId the id of the insight
     * @desc get the list of users for this insight
     * @returns $http promise
     */
    function getInsightUsers(
        projectId: string,
        insightId: string
    ): ng.IPromise<any> {
        return HTTPReq('/api/auth/insight/getInsightUsers', '', METHODS.GET, {
            projectId,
            insightId,
        }).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name getAdminInsightUsers
     * @param projectId the project id the insight belongs to
     * @param insightId the id of the insight
     * @desc get the list of users for this insight
     * @returns $http promise
     */
    function getAdminInsightUsers(
        projectId: string,
        insightId: string
    ): ng.IPromise<any> {
        return HTTPReq(
            '/api/auth/admin/insight/getInsightUsers',
            '',
            METHODS.GET,
            { projectId, insightId }
        ).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name getInsightUsersNoCredentials
     * @param admin if admin initiated the call
     * @param projectId the id of project
     * @param insightId the id of insight
     * @desc get the existing users and their permissions for this insight
     * @returns $http promise
     */
    function getInsightUsersNoCredentials(
        admin: boolean,
        projectId: string,
        insightId: string
    ): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'insight/getInsightUsersNoCredentials';

        return HTTPReq(url, '', METHODS.GET, { projectId, insightId }).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name getAllProjectInsightUsers
     * @param projectId the project id
     * @param userId the user to get insights for
     * @desc get the list of insights and their permissions for this user
     * @returns $http promise
     */
    function getAllProjectInsightUsers(
        projectId: string,
        userId: string
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/insight/getAllProjectInsightUsers',
            postData = '';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&userId=' + encodeURIComponent(userId);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name getUserDBPermission
     * @param appId the appId to get user permission for
     * @desc get permission of current user
     * @returns http promise
     */
    function getUserDBPermission(appId: string): ng.IPromise<any> {
        return HTTPReq('/api/auth/app/getUserAppPermission', '', METHODS.GET, {
            appId,
        }).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name getDBUsers
     * @param admin if admin initiated the call
     * @param appId the id of app
     * @desc get the existing users and their permissions for this db
     * @returns $http promise
     */
    function getDBUsers(admin: boolean, appId: string): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/getAppUsers';

        return HTTPReq(url, '', METHODS.GET, { appId }).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name getDBUsersNoCredentials
     * @param admin if admin initiated the call
     * @param appId the id of app
     * @desc get the existing users and their permissions for this app
     * @returns $http promise
     */
    function getDBUsersNoCredentials(
        admin: boolean,
        appId: string
    ): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/getAppUsersNoCredentials';

        return HTTPReq(url, '', METHODS.GET, { appId }).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addDBUserPermission
     * @param admin came from admin or not
     * @param appId id of app
     * @param id id of user
     * @param permission permission to give
     * @desc add the user permissions
     * @returns $http promise
     */
    function addDBUserPermission(
        admin: boolean,
        appId: string,
        id: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';
        if (admin) {
            url += 'admin/';
        }

        url += 'app/addAppUserPermission';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&id=' + encodeURIComponent(id);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name editDBUserPermission
     * @param admin admin true or false
     * @param appId id of app
     * @param id id of user
     * @param permission permission to give
     * @desc edit the user permissions
     * @returns $http promise
     */
    function editDBUserPermission(
        admin: boolean,
        appId: string,
        id: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/editAppUserPermission';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&id=' + encodeURIComponent(id);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name removeDBUserPermission
     * @param admin true or false
     * @param appId id of app
     * @param id id of user
     * @desc remove the user permissions
     * @returns $http promise
     */
    function removeDBUserPermission(
        admin: boolean,
        appId: string,
        id: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/removeAppUserPermission';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&id=' + encodeURIComponent(id);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addDBAllUserPermissions
     * @param appId id of app
     * @param permission permission to give
     * @desc give permissions to all of the existing users for an app
     * @returns $http promise
     */
    function addDBAllUserPermissions(
        appId: string,
        permission: string,
        addNew: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/app/',
            postData = '';

        addNew
            ? (url += 'grantNewUsersAppAccess')
            : (url += 'updateAppUserPermissions');

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addAllUsersDB
     * @param appId id of app
     * @param permission permission to give
     * @desc give permissions to all users for an app
     * @returns $http promise
     */
    function addAllUsersDB(
        appId: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/app/addAllUsers',
            postData = '';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name grantAllDBs
     * @param userId id of db
     * @param permission permission to give
     * @desc give permissions to all apps for a user
     * @returns $http promise
     */
    function grantAllDBs(
        userId: string,
        permission: string,
        isAddNew: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/app/grantAllApps',
            postData = '';

        postData += 'userId=' + encodeURIComponent(userId);
        postData += '&permission=' + encodeURIComponent(permission);
        postData += '&isAddNew=' + encodeURIComponent(isAddNew);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setDBGlobal
     * @param admin whether made from admin call
     * @param appId id of app
     * @param global global value
     * @desc set the global value to true/false
     * @returns $http promise
     */
    function setDBGlobal(
        admin: boolean,
        appId: string,
        global: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/setAppGlobal';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&public=' + encodeURIComponent(global);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setDBVisibility
     * @param appId id of db
     * @param visibility visibility value
     * @desc set the visibility value to true/false
     * @returns $http promise
     */
    function setDBVisibility(
        appId: string,
        visibility: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        url += 'app/setAppVisibility';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&visibility=' + encodeURIComponent(visibility);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setDBDiscoverable
     * @param admin whether made from admin call
     * @param appId id of db
     * @param discoverable discoverable value
     * @desc set the discoverable value to true/false
     * @returns $http promise
     */
    function setDBDiscoverable(
        admin: boolean,
        appId: string,
        discoverable: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/setAppDiscoverable';

        postData += 'appId=' + encodeURIComponent(appId);
        postData += '&discoverable=' + encodeURIComponent(discoverable);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name getDBs
     * @param admin whether made from admin call
     * @param databaseId optional filter to a specific db
     * @desc get all the dbs with their permissions
     * @returns $http promise
     */
    function getDBs(admin: boolean, databaseId: string): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'app/getApps';

        if (databaseId) {
            url += '?databaseId=' + encodeURIComponent(databaseId);
        }

        return HTTPReq(url, '', METHODS.GET, {}).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setDBFavorite
     * @desc favorites/unfavorites an db
     * @param appId - app id
     * @param isFavorite - whether the db is favorited or not
     * @returns $http promise
     */
    function setDBFavorite(
        appId: string,
        isFavorite: boolean
    ): ng.IPromise<any> {
        let postData = '',
            url = '/api/auth/app/setAppFavorite';

        postData += 'appId=' + appId;
        postData += '&isFavorite=' + isFavorite;

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name getAllUserProjects
     * @desc to list all user information for admin
     * @returns $http promise
     */
    function getAllUserProjects(userId: string): ng.IPromise<any> {
        const id = 'userId=' + encodeURIComponent(userId);

        return HTTPReq(
            '/api/auth/admin/project/getAllUserProjects',
            id,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name getUserProjectPermission
     * @param projectId the projectId to get user permission for
     * @desc get permission of current user
     * @returns http promise
     */
    function getUserProjectPermission(projectId: string): ng.IPromise<any> {
        return HTTPReq(
            '/api/auth/project/getUserProjectPermission',
            '',
            METHODS.GET,
            { projectId }
        ).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name getProjectUsers
     * @param admin if admin initiated the call
     * @param projectId the id of app
     * @desc get the existing users and their permissions for this app
     * @returns $http promise
     */
    function getProjectUsers(
        admin: boolean,
        projectId: string
    ): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/getProjectUsers';

        return HTTPReq(url, '', METHODS.GET, { projectId }).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name getProjectUsersNoCredentials
     * @param admin if admin initiated the call
     * @param projectId the id of app
     * @desc get the existing users and their permissions for this app
     * @returns $http promise
     */
    function getProjectUsersNoCredentials(
        admin: boolean,
        projectId: string
    ): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/getProjectUsersNoCredentials';

        return HTTPReq(url, '', METHODS.GET, { projectId }).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addProjectUserPermission
     * @param admin came from admin or not
     * @param projectId id of app
     * @param id id of user
     * @param permission permission to give
     * @desc add the user permissions
     * @returns $http promise
     */
    function addProjectUserPermission(
        admin: boolean,
        projectId: string,
        id: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';
        if (admin) {
            url += 'admin/';
        }

        url += 'project/addProjectUserPermission';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&id=' + encodeURIComponent(id);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name editProjectUserPermission
     * @param admin admin true or false
     * @param projectId id of project
     * @param id id of user
     * @param permission permission to give
     * @desc edit the user permissions
     * @returns $http promise
     */
    function editProjectUserPermission(
        admin: boolean,
        projectId: string,
        id: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/editProjectUserPermission';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&id=' + encodeURIComponent(id);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name removeProjectUserPermission
     * @param admin true or false
     * @param projectId id of project
     * @param id id of user
     * @desc remove the user permissions
     * @returns $http promise
     */
    function removeProjectUserPermission(
        admin: boolean,
        projectId: string,
        id: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/removeProjectUserPermission';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&id=' + encodeURIComponent(id);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addProjectAllUserPermissions
     * @param projectId id of project
     * @param permission permission to give
     * @desc give permissions to all of the existing users for an app
     * @returns $http promise
     */
    function addProjectAllUserPermissions(
        projectId: string,
        permission: string,
        addNew: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/project/',
            postData = '';

        addNew
            ? (url += 'grantNewUsersProjectAccess')
            : (url += 'updateProjectUserPermissions');

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addAllUsersProject
     * @param projectId id of project
     * @param permission permission to give
     * @desc give permissions to all users for an app
     * @returns $http promise
     */
    function addAllUsersProject(
        projectId: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/project/addAllUsers',
            postData = '';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name grantAllProjects
     * @param userId id of project
     * @param permission permission to give
     * @desc give permissions to all projects for a user
     * @returns $http promise
     */
    function grantAllProjects(
        userId: string,
        permission: string,
        isAddNew: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/project/grantAllProjects',
            postData = '';

        postData += 'userId=' + encodeURIComponent(userId);
        postData += '&permission=' + encodeURIComponent(permission);
        postData += '&isAddNew=' + encodeURIComponent(isAddNew);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setProjectGlobal
     * @param admin whether made from admin call
     * @param projectId id of project
     * @param global global value
     * @desc set the global value to true/false
     * @returns $http promise
     */
    function setProjectGlobal(
        admin: boolean,
        projectId: string,
        global: string
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/setProjectGlobal';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&public=' + encodeURIComponent(global);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setProjectVisibility
     * @param projectId id of project
     * @param visibility visibility value
     * @desc set the visibility value to true/false
     * @returns $http promise
     */
    function setProjectVisibility(
        projectId: string,
        visibility: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/',
            postData = '';

        url += 'project/setProjectVisibility';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&visibility=' + encodeURIComponent(visibility);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name getProjects
     * @param admin whether made from admin call
     * @desc get all the projects with their permissions
     * @returns $http promise
     */
    function getProjects(admin: boolean): ng.IPromise<any> {
        let url = '/api/auth/';

        if (admin) {
            url += 'admin/';
        }

        url += 'project/getProjects';

        return HTTPReq(url, '', METHODS.GET, {}).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setProjectFavorite
     * @desc favorites/unfavorites an app
     * @param appId - app id
     * @param isFavorite - whether the app is favorited or not
     * @returns $http promise
     */
    function setProjectFavorite(
        appId: string,
        isFavorite: boolean
    ): ng.IPromise<any> {
        let postData = '',
            url = '/api/auth/project/setProjectFavorite';

        postData += 'projectId=' + appId;
        postData += '&isFavorite=' + isFavorite;

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name getUserInsightPermission
     * @param projectId the project id the insight belongs to
     * @param insightId the id of the insight
     * @desc get the user's permission for this insight
     * @returns $http promise
     */
    function getUserInsightPermission(
        projectId: string,
        insightId: string
    ): ng.IPromise<any> {
        const params = {
            projectId: projectId,
            insightId: insightId,
        };

        return HTTPReq(
            '/api/auth/insight/getUserInsightPermission',
            '',
            METHODS.GET,
            params
        ).then(GENERIC_SUCCESS, errorReturnFn);
    }

    /**
     * @name addInsightUserPermission
     * @param projectId the appId
     * @param insightId the insight id to add permission to
     * @param id the user id
     * @param permission the permission to give
     * @param admin whether user is admin or not
     * @desc add permission to an insight
     * @returns the promise to return
     */
    function addInsightUserPermission(
        projectId: string,
        insightId: string,
        id: string,
        permission: string,
        admin: boolean
    ): ng.IPromise<any> {
        let postData = '',
            url = '/api/auth/';

        postData += 'projectId=' + projectId;
        postData += '&insightId=' + insightId;
        postData += '&id=' + id;
        postData += '&permission=' + permission;

        if (admin) {
            url += 'admin/';
        }
        url += 'insight/addInsightUserPermission';

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name editInsightUserPermission
     * @param projectId the project id
     * @param insightId the insight id to edit permission for
     * @param id the user id
     * @param permission the permission to edit
     * @param admin whether user is admin or not
     * @desc edit permission of an insight
     * @returns the promise to return
     */
    function editInsightUserPermission(
        projectId: string,
        insightId: string,
        id: string,
        permission: string,
        admin: boolean
    ): ng.IPromise<any> {
        let postData = '',
            url = '/api/auth/';

        postData += 'projectId=' + projectId;
        postData += '&insightId=' + insightId;
        postData += '&id=' + id;
        postData += '&permission=' + permission;

        if (admin) {
            url += 'admin/';
        }
        url += 'insight/editInsightUserPermission';

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name removeInsightUserPermission
     * @param projectId the project id
     * @param insightId the insight id to remove permission from
     * @param id the user id
     * @param admin whether user is admin or not
     * @desc remove permission from an insight
     * @returns the promise to return
     */
    function removeInsightUserPermission(
        projectId: string,
        insightId: string,
        id: string,
        admin: boolean
    ): ng.IPromise<any> {
        let postData = '',
            url = '/api/auth/';

        postData += 'projectId=' + projectId;
        postData += '&insightId=' + insightId;
        postData += '&id=' + id;

        if (admin) {
            url += 'admin/';
        }
        url += 'insight/removeInsightUserPermission';

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name addInsightAllUserPermissions
     * @param projectId id of project
     * @param insightId id of insight
     * @param permission permission to give
     * @param addNew whether the users to be added are new or existing
     * @desc give permissions to all of the existing users for an app
     * @returns $http promise
     */
    function addInsightAllUserPermissions(
        projectId: string,
        insightId: string,
        permission: string,
        addNew: boolean
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/insight/',
            postData = '';

        addNew
            ? (url += 'grantNewUsersInsightAccess')
            : (url += 'updateInsightUserPermissions');

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&insightId=' + encodeURIComponent(insightId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name addAllUsersInsight
     * @param projectId id of project
     * @param insightId id of insight
     * @param permission permission to give
     * @desc give permissions to all of the new users for an app
     * @returns $http promise
     */
    function addAllUsersInsight(
        projectId: string,
        insightId: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/insight/addAllUsers',
            postData = '';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&insightId=' + encodeURIComponent(insightId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name grantAllProjectInsights
     * @param userId id of app
     * @param projectId id of project
     * @param permission permission to give
     * @desc give permissions to all apps for a user
     * @returns $http promise
     */
    function grantAllProjectInsights(
        projectId: string,
        userId: string,
        permission: string
    ): ng.IPromise<any> {
        let url = '/api/auth/admin/insight/grantAllProjectInsights',
            postData = '';

        postData += 'projectId=' + encodeURIComponent(projectId);
        postData += '&userId=' + encodeURIComponent(userId);
        postData += '&permission=' + encodeURIComponent(permission);

        return HTTPReq(url, postData, METHODS.POST).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name setInsightGlobal
     * @param projectId the project id
     * @param insightId the insight id
     * @param isPublic the boolean to set it to
     * @param isAdmin whether admin user or not
     * @desc sets the insight public/private
     * @returns promise
     */
    function setInsightGlobal(
        projectId: string,
        insightId: string,
        isPublic: boolean,
        isAdmin: boolean
    ): ng.IPromise<any> {
        let postData = '';
        let url = '/api/auth/';
        if (isAdmin) {
            url += 'admin/';
        }
        url += 'insight/setInsightGlobal';

        postData += 'projectId=' + projectId;
        postData += '&insightId=' + insightId;
        postData += '&isPublic=' + isPublic;

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name getProjectInsights
     * @param projectId the project id to get insights for
     * @param isAdmin whether user is admin or not
     * @desc get the insights for app id for the admin
     * @returns Promise
     */
    function getProjectInsights(
        projectId: string,
        isAdmin: boolean
    ): ng.IPromise<any> {
        const params = {
            projectId: projectId,
        };

        let url = '/api/auth/';
        if (isAdmin) {
            url += 'admin/';
        }
        url += 'insight/getProjectInsights';

        return HTTPReq(url, '', METHODS.GET, params).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name deleteAdminInsight
     * @param projectId the add id insight belongs to
     * @param insightId the list of ids to delete
     * @desc delete the insight as an admin
     * @returns Promise
     */
    function deleteAdminInsight(
        projectId: string,
        insightId: string[]
    ): ng.IPromise<any> {
        let postData = '';

        postData += 'projectId=' + projectId;
        postData += '&insightId=' + JSON.stringify(insightId);

        return HTTPReq(
            '/api/auth/admin/insight/deleteProjectInsights',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name getAllEngines
     * @returns all engines
     * @desc Get all engines
     */
    function getAllEngines(): ng.IPromise<any> {
        return HTTPReq('/api/engine/all', '', METHODS.GET).then(
            GENERIC_SUCCESS,
            errorReturnFn
        );
    }

    /**
     * @name loginProperties
     * @desc get the current login properties
     * @returns the login properties
     */
    function loginProperties(): ng.IPromise<any> {
        return HTTPReq('/api/auth/loginProperties', '', METHODS.GET).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name modifyLoginProperties
     * @param provider the provider to modify
     * @param properties the properties to modify
     * @desc modify the properties for this provider
     * @returns response
     */
    function modifyLoginProperties(
        provider: string,
        properties: any
    ): ng.IPromise<any> {
        let url = '/api/auth/modifyLoginProperties/' + provider,
            postData = '';

        postData += 'modifications=' + JSON.stringify(properties);

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }
    /**
     * @name activeLogins
     * @desc get a list of things that are currently loggedIn
     * @returns response
     */
    function activeLogins(): ng.IPromise<any> {
        return HTTPReq('/api/auth/logins', '', METHODS.GET).then(...THEN_ARGS);
    }

    /**
     * @name login
     * @param provider the provider to log into
     * @desc log into a specific provider
     * @returns response
     */
    function login(provider: string): ng.IPromise<any> {
        const url = '/api/auth/login/' + provider;

        return HTTPReq(url, '', METHODS.GET).then(...THEN_ARGS);
    }

    /**
     * @name logout
     * @param provider name of provider...google/facebook/etc.
     * @desc logout from the provider
     * @returns response
     */
    function logout(provider: string): ng.IPromise<any> {
        const url = '/api/auth/logout/' + provider;

        return HTTPReq(url, '', METHODS.GET).then(...THEN_ARGS);
    }

    /**
     * @name getUserInfo
     * @param provider the name of the provider
     * @desc gets the userInfo
     * @returns user info
     */
    function getUserInfo(provider: string): ng.IPromise<any> {
        const url = '/api/auth/userinfo/' + provider;

        return HTTPReq(url, '', METHODS.GET).then(...THEN_ARGS);
    }

    /**
     * @name saveFilesInInsightAsDb
     * @param insightID - insightID to check
     * @param engineName - new DB name
     * @dsec Creates a db before saving an insight
     * @returns response data
     */
    function saveFilesInInsightAsDb(
        insightID: string,
        engineName: string
    ): ng.IPromise<any> {
        const url = '/api/engine/i-' + insightID + '/saveFilesInInsightAsDb',
            postData = 'engineName=' + encodeURIComponent(engineName);

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name getAdminThemes
     * @desc this call will get the active theme
     * @return $http promise
     */
    function getAdminThemes(): ng.IPromise<any> {
        return HTTPReq('/api/themes/getAdminThemes', '', METHODS.GET).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name createAdminTheme
     * @param data the data that will be sent to the BE to define a theme
     * @desc this call will create a new theme defined by the admin
     * @return $http promise
     */
    function createAdminTheme(data: {
        name: string;
        json: any;
        isActive: boolean;
    }): ng.IPromise<any> {
        let postData = '';

        postData += 'name=' + encodeURIComponent(data.name);
        postData += '&json=' + encodeURIComponent(JSON.stringify(data.json));
        postData += '&isActive=' + encodeURIComponent(data.isActive);

        return HTTPReq(
            '/api/themes/createAdminTheme',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name editAdminTheme
     * @param data the data that will be sent to the BE to define a theme
     * @desc this call will edit an existing admin theme
     * @return $http promise
     */
    function editAdminTheme(data: {
        id: string;
        name: string;
        json: any;
        isActive: boolean;
    }): ng.IPromise<any> {
        let postData = '';

        postData += '&id=' + encodeURIComponent(data.id);
        postData += '&name=' + encodeURIComponent(data.name);
        postData += '&json=' + encodeURIComponent(JSON.stringify(data.json));
        postData += '&isActive=' + encodeURIComponent(data.isActive);

        return HTTPReq(
            '/api/themes/editAdminTheme',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name deleteAdminTheme
     * @param data the data that will be sent to the BE to define a theme
     * @desc this call will delete an existing admin theme
     * @return $http promise
     */
    function deleteAdminTheme(data: { id: string }): ng.IPromise<any> {
        const postData = 'id=' + encodeURIComponent(data.id);

        return HTTPReq(
            '/api/themes/deleteAdminTheme',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name setActiveAdminTheme
     * @param data the data that will be sent to the BE to set the admin theme
     * @desc this call will set an existing admin theme
     * @return $http promise
     */
    function setActiveAdminTheme(data: { id: string }): ng.IPromise<any> {
        const postData = 'id=' + encodeURIComponent(data.id);

        return HTTPReq(
            '/api/themes/setActiveAdminTheme',
            postData,
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name setAllAdminThemesInactive
     * @desc this call will set all admin themes inactive
     * @return $http promise
     */
    function setAllAdminThemesInactive(): ng.IPromise<any> {
        return HTTPReq(
            '/api/themes/setAllAdminThemesInactive',
            '',
            METHODS.POST
        ).then(...THEN_ARGS);
    }

    /**
     * @name setCookie
     * @param insightId - insight id
     * @param secret - user defined secret
     * @desc sets cookie to allow user to share session
     * @return $http promise
     */
    function setCookie(insightId: string, secret: string): ng.IPromise<any> {
        const postData = 'i=' + insightId + '&s=' + secret;

        return HTTPReq('/api/auth/cookie', postData, METHODS.POST).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name invalidateSession
     * @desc invalidates the current session
     * @return $http promise
     */
    function invalidateSession() {
        return HTTPReq('/api/session/invalidateSession', '', METHODS.GET).then(
            ...THEN_ARGS
        );
    }

    /**
     * @name setInsightFavorite
     * @desc favorites/unfavorites an insight
     * @param projectId - project id
     * @param insightId - insight id
     * @param isFavorite - whether the insight is favorited or not
     * @returns $http promise
     */
    function setInsightFavorite(
        projectId: string,
        insightId: string,
        isFavorite: boolean
    ): ng.IPromise<any> {
        let postData = '',
            url = '/api/auth/insight/setInsightFavorite';

        postData += 'projectId=' + projectId;
        postData += '&insightId=' + insightId;
        postData += '&isFavorite=' + isFavorite;

        return HTTPReq(url, postData, METHODS.POST).then(...THEN_ARGS);
    }

    /**
     * @name HTTPReq
     * @param route - url endpoint
     * @param data - data for POSTs
     * @param method - GET | POST
     * @param param - get request params
     * @desc helper function for http reqs
     * @return promise
     */
    function HTTPReq(
        route: string,
        data: string | FormData,
        method: string,
        param?: any
    ): ng.IPromise<any> {
        const url = ENDPOINT.URL + route,
            cache = false;
        let headers: { 'Content-Type': string | undefined } = {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            params;

        if (typeof data !== 'string') {
            headers = {
                'Content-Type': undefined,
            };
        }
        if (param) {
            params = param;
        }

        return $http({
            url,
            data,
            method,
            cache,
            headers,
            params,
        });
    }

    return {
        getSearchInsightsResults: getSearchInsightsResults,
        uploadFile: uploadFile,
        checkHeaders: checkHeaders,
        runPixel: runPixel,
        getInsightState: getInsightState,
        getPipeline: getPipeline,
        createUser: createUser,
        updateUser: updateUser,
        addNewUser: addNewUser,
        loginUser: loginUser,
        logoutUser: logoutUser,
        console: console,
        downloadFile: downloadFile,
        updateDatabaseSmssFile: updateDatabaseSmssFile,
        uploadDatabaseImage: uploadDatabaseImage,
        deleteDatabaseImage: deleteDatabaseImage,
        updateProjectSmssFile: updateProjectSmssFile,
        uploadProjectImage: uploadProjectImage,
        deleteProjectImage: deleteProjectImage,
        uploadInsightImage: uploadInsightImage,
        deleteInsightImage: deleteInsightImage,
        activeLogins: activeLogins,
        login: login,
        logout: logout,
        getUserInfo: getUserInfo,
        backendConfig: backendConfig,
        isAdmin: isAdmin,
        getAllEngines: getAllEngines,
        removeAdminUser: removeAdminUser,
        getUserInformation: getUserInformation,
        getAllUsers: getAllUsers,
        getAllUserDbs: getAllUserDbs,

        // auth/app
        getDBUsers: getDBUsers,
        getDBUsersNoCredentials: getDBUsersNoCredentials,
        getUserDBPermission: getUserDBPermission,
        addDBUserPermission: addDBUserPermission,
        editDBUserPermission: editDBUserPermission,
        removeDBUserPermission: removeDBUserPermission,
        addDBAllUserPermissions: addDBAllUserPermissions,
        addAllUsersDB: addAllUsersDB,
        grantAllDBs: grantAllDBs,
        setDBGlobal: setDBGlobal,
        setDBDiscoverable: setDBDiscoverable,
        setDBVisibility: setDBVisibility,
        getDBs: getDBs,
        setDBFavorite: setDBFavorite,

        //auth/project
        getAllUserProjects: getAllUserProjects,
        getProjectUsers: getProjectUsers,
        getProjectUsersNoCredentials: getProjectUsersNoCredentials,
        getUserProjectPermission: getUserProjectPermission,
        addProjectUserPermission: addProjectUserPermission,
        editProjectUserPermission: editProjectUserPermission,
        removeProjectUserPermission: removeProjectUserPermission,
        addProjectAllUserPermissions: addProjectAllUserPermissions,
        addAllUsersProject: addAllUsersProject,
        grantAllProjects: grantAllProjects,
        setProjectGlobal: setProjectGlobal,
        setProjectVisibility: setProjectVisibility,
        getProjects: getProjects,
        setProjectFavorite: setProjectFavorite,

        // insights permissions
        getInsightUsers: getInsightUsers,
        getAdminInsightUsers: getAdminInsightUsers,
        getInsightUsersNoCredentials: getInsightUsersNoCredentials,
        getAllProjectInsightUsers: getAllProjectInsightUsers,
        getUserInsightPermission: getUserInsightPermission,
        addInsightUserPermission: addInsightUserPermission,
        editInsightUserPermission: editInsightUserPermission,
        removeInsightUserPermission: removeInsightUserPermission,
        addInsightAllUserPermissions: addInsightAllUserPermissions,
        addAllUsersInsight: addAllUsersInsight,
        grantAllProjectInsights: grantAllProjectInsights,
        setInsightGlobal: setInsightGlobal,
        getProjectInsights: getProjectInsights,
        deleteAdminInsight: deleteAdminInsight,
        saveFilesInInsightAsDb: saveFilesInInsightAsDb,
        loginsAllowed: loginsAllowed,
        loginProperties: loginProperties,
        modifyLoginProperties: modifyLoginProperties,
        getAdminThemes: getAdminThemes,
        createAdminTheme: createAdminTheme,
        editAdminTheme: editAdminTheme,
        deleteAdminTheme: deleteAdminTheme,
        setActiveAdminTheme: setActiveAdminTheme,
        setAllAdminThemesInactive: setAllAdminThemesInactive,
        setCookie: setCookie,
        invalidateSession: invalidateSession,
        setInsightFavorite: setInsightFavorite,
    };
}
