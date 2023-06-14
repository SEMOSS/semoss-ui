import angular from 'angular';
import Utility from '../../utility/utility.js';

export default angular
    .module('app.security.service', [])
    .factory('securityService', securityService);

securityService.$inject = [
    '$q',
    '$state',
    '$auth',
    'ENDPOINT',
    'CONFIG',
    'messageService',
    'monolithService',
];

function securityService(
    $q: ng.IQService,
    $state,
    $auth,
    ENDPOINT: EndPoint,
    CONFIG,
    messageService: MessageService,
    monolithService: MonolithService
) {
    const /** Public */
        /** Private */
        _state: any = {},
        _actions = {
            'initialize-config': (): void => {
                if (CONFIG.logins && Object.keys(CONFIG.logins).length > 0) {
                    _state.activeLogins = CONFIG.logins;
                }
            },
            // redirect page to oauth login
            'oauth-login2': (payload: { provider: string }): void => {
                const url =
                    ENDPOINT.URL + '/api/auth/login/' + payload.provider;

                window.location.replace(url);
            },
            // popup to oauth login
            'oauth-login': (payload: {
                provider: string;
                message: string;
                widgetId: string;
            }): void => {
                let url = ENDPOINT.URL + '/api/auth/login/' + payload.provider,
                    interval,
                    popUpWindow,
                    provider = payload.provider;
                monolithService.getUserInfo(provider).then((response) => {
                    if (response.name) {
                        CONFIG.loggedIn = true;
                        CONFIG.logins[provider.toUpperCase()] = response.name;
                        // user already signed in
                        messageService.emit(payload.message, {
                            success: true,
                            widgetId: payload.widgetId,
                        });
                        getActiveLogins();
                    } else {
                        popUpWindow = window.top.open(
                            url,
                            '_blank',
                            'height=600,width=400,top=300,left=' + 600
                        );

                        interval = setInterval(() => {
                            try {
                                if (
                                    !popUpWindow ||
                                    popUpWindow.closed ||
                                    popUpWindow.closed === undefined
                                ) {
                                    clearInterval(interval);
                                } else if (
                                    popUpWindow.document.location.href.indexOf(
                                        ENDPOINT.HOST
                                    ) > -1
                                ) {
                                    clearInterval(interval);
                                    popUpWindow.close();
                                    if ($state.current.name === 'login') {
                                        // need to tell login page we are good to go
                                        messageService.emit(
                                            'oauth-login',
                                            payload
                                        );
                                    } else {
                                        messageService.emit(
                                            'oauth-login-success',
                                            {}
                                        );
                                        // if a response is requested, we will emit out the message to indicate successful login
                                        if (payload.message) {
                                            messageService.emit(
                                                payload.message,
                                                {
                                                    success: true,
                                                    widgetId: payload.widgetId,
                                                }
                                            );
                                        }
                                    }
                                }
                            } catch (err) {
                                // do nothing
                                // this is to work around the blocked frame error that comes up
                            }
                        }, 1000);
                    }
                });
            },
            'oauth-logout': function (payload: {
                provider: string;
                message: string;
            }): void {
                const provider = payload.provider;

                if (provider.toUpperCase() === 'NATIVE') {
                    monolithService.logoutUser().then(() => {
                        delete CONFIG.logins[provider.toUpperCase()];
                        messageService.emit(payload.message, {
                            success: true,
                        });
                    });
                } else {
                    monolithService.logout(provider).then((response) => {
                        if (response.success) {
                            if (provider === 'all') {
                                CONFIG.logins = {};
                                CONFIG.loggedin = false;
                            } else {
                                delete CONFIG.logins[provider.toUpperCase()];
                            }
                            messageService.emit(payload.message, {
                                success: true,
                            });

                            messageService.emit('oauth-logout-success', {});
                            getActiveLogins();
                        }
                    });
                }

                // clear all apps with their sheets/panels
                messageService.emit('close-all');
            },
            'pixel-login': (payload: {
                type: string;
                insightID: string;
                insight?: {
                    app: string;
                    id: string;
                    params: any;
                    additionalPixels: any;
                };
            }): void => {
                $auth.authenticate(payload.type, []).then(function () {
                    if (
                        payload.insight &&
                        payload.insight.app &&
                        payload.insight.id
                    ) {
                        const pixelComponents: PixelCommand[] = [
                            {
                                type: 'clearInsight',
                                components: [],
                                terminal: true,
                                meta: true,
                            },
                            {
                                type: 'openInsight',
                                components: [
                                    payload.insight.app,
                                    payload.insight.id,
                                    payload.insight.params,
                                    payload.insight.additionalPixels,
                                ],
                                terminal: true,
                                meta: true,
                            },
                        ];

                        messageService.emit('execute-pixel', {
                            insightID: payload.insightID,
                            commandList: pixelComponents,
                        });
                    }
                });
            },
            'backend-config': (data: { security: boolean }): void => {
                if (data.hasOwnProperty('security')) {
                    _state.securityEnabled = data.security;
                }
            },
            'open-tab': (payload: { url: string }): void => {
                window.open(payload.url);
            },
            'download-file': (payload: {
                insightID: string;
                file: any;
            }): void => {
                monolithService.downloadFile(payload.insightID, payload.file);
            },
        };

    /**
     * @name getActiveLogins
     * @desc get a list of everything that is logged in
     */
    function getActiveLogins(): ng.IPromise<any> {
        return monolithService.activeLogins().then((response) => {
            _state.activeLogins = response;

            return response;
        });
    }

    /**
     * @name getCurrentLogins
     * @desc get the currently logged in information
     */
    function getCurrentLogins(): any {
        return _state.activeLogins;
    }

    /**
     * @name getCredentials
     * @param {string} provider the name of the provider
     * @desc get the security information
     */
    function getCredentials(provider: string): ng.IPromise<any> {
        return monolithService.getUserInfo(provider).then((response) => {
            if (response.name) {
                return {
                    name: response.name,
                };
            }
            return false;
        });
    }

    /**
     * @name getInitCredentials
     * @desc get the security information
     * @return {void}
     */
    function getInitCredentials():
        | { username: string; name: string }
        | boolean {
        const username = String(window.localStorage.getItem('smssusername')),
            name = String(window.localStorage.getItem('smssname'));

        if (username) {
            return {
                username,
                name,
            };
        }

        return false;
    }

    /**
     * @name get
     * @param accessor - string to get to the object. In the form of 'a.b.c'
     * @desc function that gets data from the store
     * @returns value of the requested object
     */
    function get(accessor?: string): any {
        return Utility.getter(_state, accessor);
    }

    /**
     * @name isSecurityEnabled
     * @desc checks to see if security is turned on
     * @returns {boolean} true or false
     */
    function isSecurityEnabled(): ng.IPromise<any> {
        // TODO should just look at semossCoreService's getBEConfig call which is doing the same thing
        const deferred = $q.defer();
        if (!CONFIG.hasOwnProperty('security')) {
            return monolithService.backendConfig().then((config) => {
                for (const key in config) {
                    if (config.hasOwnProperty(key)) {
                        CONFIG[key] = config[key];
                    }
                }

                // update config
                if (
                    CONFIG.hasOwnProperty('theme') &&
                    Object.keys(CONFIG.theme).length > 0
                ) {
                    messageService.emit('set-theme', {
                        id: CONFIG.theme.ID,
                        name: CONFIG.theme.THEME_NAME,
                        theme: JSON.parse(CONFIG.theme.THEME_MAP),
                    });
                }

                _state.securityEnabled = config.security;
                deferred.resolve(config.security);
                return CONFIG.security;
            });
        }

        deferred.resolve(CONFIG.security);
        return deferred.promise;
    }

    /**
     * @name initialize
     * @desc called when the module is loaded
     */
    function initialize(): void {
        // register the store to force conformity
        for (const a in _actions) {
            if (_actions.hasOwnProperty(a)) {
                messageService.on(a, _actions[a]);
            }
        }
    }

    return {
        initialize: initialize,
        getCredentials: getCredentials,
        getInitCredentials: getInitCredentials,
        getActiveLogins: getActiveLogins,
        getCurrentLogins: getCurrentLogins,
        isSecurityEnabled: isSecurityEnabled,
        get: get,
    };
}
