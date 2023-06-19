'use strict';

import './home.scss';

import './home-help/home-help.directive';
import './home-intro/home-intro.directive';
import './home-nav/home-nav.directive';
import './home-search/home-search.directive';

export default angular
    .module('app.home.directive', [
        'app.home.home-help',
        'app.home.home-intro',
        'app.home.home-nav',
        'app.home.home-search',
    ])
    .directive('home', homeDirective);

homeDirective.$inject = [
    '$location',
    '$state',
    '$stateParams',
    '$timeout',
    '$transitions',
    'semossCoreService',
    'monolithService',
    'PLAYGROUND',
    'RIBBON_MESSAGE',
    'CONFIG',
    'LINKS',
];

function homeDirective(
    $location,
    $state,
    $stateParams,
    $timeout,
    $transitions,
    semossCoreService,
    monolithService,
    PLAYGROUND,
    RIBBON_MESSAGE,
    CONFIG,
    LINKS
) {
    homeCtrl.$inject = [];
    homeLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./home.directive.html'),
        scope: {},
        controller: homeCtrl,
        controllerAs: 'home',
        bindToController: {},
        link: homeLink,
    };

    function homeCtrl() {}

    function homeLink(scope) {
        scope.home.help = {
            open: false,
        };
        scope.home.login = {
            native: {
                isNative: false,
                username: '',
                password: '',
            },
            loggedIn: false,
            popover: false,
            allowed: {},
            providers: [
                {
                    name: 'Github',
                    image: require('images/github.png'),
                    provider: 'github',
                    backendENUM: 'GITHUB', // TODO: Don't know why this is different
                    loggedIn: false,
                },
                {
                    name: 'Google',
                    image: require('images/google.png'),
                    provider: 'google',
                    backendENUM: 'GOOGLE', // TODO: Don't know why this is different
                    loggedIn: false,
                },
                {
                    name: 'Dropbox',
                    image: require('images/dropbox.png'),
                    provider: 'dropbox',
                    backendENUM: 'DROPBOX', // TODO: Don't know why this is different
                    loggedIn: false,
                },
                {
                    name: 'Microsoft',
                    image: require('images/ms.png'),
                    provider: 'ms',
                    backendENUM: 'MS', // TODO: Don't know why this is different
                    loggedIn: false,
                },
                {
                    name: 'SEMOSS',
                    image: require('images/profilePic.png'),
                    provider: 'native',
                    backendENUM: 'NATIVE', // TODO: Don't know why this is different
                    loggedIn: false,
                },
            ],
        };
        scope.home.loading = {
            open: false,
            messages: [],
        };
        scope.home.search = {
            open: false,
        };
        scope.home.hideTopbar = false;
        scope.home.PLAYGROUND = PLAYGROUND;
        scope.home.RIBBON_MESSAGE = RIBBON_MESSAGE;

        scope.home.navigate = navigate;
        scope.home.toggleHelp = toggleHelp;
        scope.home.userLogin = userLogin;
        scope.home.loginProvider = loginProvider;
        scope.home.logoutProvider = logoutProvider;
        scope.home.toggleSearch = toggleSearch;

        /**
         * @name navigate
         * @param {string} state - selected state
         * @param {object} params - params to pass to the state
         * @desc function that switches the view
         * @returns {void}
         */
        function navigate(state, params) {
            $state.go(state, params || {});
        }

        /** Home */
        /**
         * @name toggleHelp
         * @desc toggle the home open or close
         * @return {void}
         */
        function toggleHelp() {
            scope.home.help.open = !scope.home.help.open;
        }

        /** login */

        /**
         * @name userLogin
         * @desc logs in using native
         * @returns {void}
         */
        function userLogin() {
            monolithService
                .loginUser(
                    scope.home.login.native.username,
                    scope.home.login.native.password
                )
                .then(
                    function () {
                        CONFIG.loggedIn = true;
                        CONFIG.logins.NATIVE = scope.home.login.native.username;
                        updateLogin();
                        scope.home.login.native.isNative = false;
                        scope.home.login.native.username = '';
                        scope.home.login.native.password = '';
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.error,
                        });
                    }
                );
        }

        /**
         * @name loginProvider
         * @desc function that is called to login
         * @param {string} provider - login provider
         * @returns {void}
         */
        function loginProvider(provider) {
            const message = semossCoreService.utility.random('login');

            if (provider === 'native') {
                scope.home.login.native.isNative =
                    !scope.home.login.native.isNative;
            } else {
                semossCoreService.once(message, function (response) {
                    if (response.success) {
                        updateLogin();
                    }
                });

                semossCoreService.emit('oauth-login', {
                    provider: provider,
                    message: message,
                });
            }
        }

        /**
         * @name logoutProvider
         * @desc function that is called to logout
         * @param {string} provider - logout provider
         * @returns {void}
         */
        function logoutProvider(provider) {
            const message = semossCoreService.utility.random('logout');

            semossCoreService.once(message, function (response) {
                if (response.success) {
                    updateLogin();
                }
            });

            semossCoreService.emit('oauth-logout', {
                provider: provider,
                message: message,
            });
        }

        /**
         * @name updateLogin
         * @desc function that is called to check if the user is loggined in
         * @returns {void}
         */
        function updateLogin() {
            // no need to call server if we have config
            if (CONFIG.hasOwnProperty('security')) {
                scope.home.securityEnabled = CONFIG.security;
                setActiveLogins(CONFIG.logins);
            } else {
                updateLoginViaServer();
            }
        }

        /**
         * @name updateLoginViaServer
         * @desc when we message on oauth login/out, we must call server to get updated config
         * @return {void}
         */
        function updateLoginViaServer() {
            semossCoreService.isSecurityEnabled().then(function (response) {
                scope.home.securityEnabled = response;
                semossCoreService.getActiveLogins().then(setActiveLogins);
            });
        }

        /**
         * @name setActiveLogins
         * @param {object} activeLogins object with keys of allowed login services and string values [the username]
         * @desc determines active logins and configures the directive accordingly
         * @return {void}
         */
        function setActiveLogins(activeLogins) {
            // updating config when coming from server
            CONFIG.logins = activeLogins;

            scope.home.login.loggedIn = false;

            for (
                let providerIdx = 0,
                    providerLen = scope.home.login.providers.length;
                providerIdx < providerLen;
                providerIdx++
            ) {
                if (
                    activeLogins[
                        scope.home.login.providers[providerIdx].backendENUM
                    ]
                ) {
                    scope.home.login.providers[providerIdx].loggedIn = true;
                } else {
                    scope.home.login.providers[providerIdx].loggedIn = false;
                }
            }

            scope.home.login.loggedIn = Object.keys(activeLogins).length > 0;
            scope.home.userName = '';
            for (let provider in activeLogins) {
                if (
                    activeLogins.hasOwnProperty(provider) &&
                    provider !== 'ANONYMOUS'
                ) {
                    if (activeLogins[provider]) {
                        scope.home.userName = activeLogins[provider];
                        break;
                    }
                }
            }

            if (scope.home.securityEnabled && !scope.home.login.loggedIn) {
                $state.go('login');
            }
        }

        /**
         * @name updateHomeLogin
         * @desc function that is called to check if the user is loggined in
         * @returns {void}
         */
        function updateHomeLogin() {
            const credentials = semossCoreService.getInitCredentials();

            if (credentials && credentials.username) {
                scope.home.login.loggedIn = true;
                scope.home.login.username = credentials.username;
                scope.home.login.name = credentials.name;
            } else {
                scope.home.login.loggedIn = false;
                scope.home.login.username = '';
                scope.home.login.name = '';
            }
        }

        /** Search */
        /**
         * @name toggleSearch
         * @desc toggle the search open or close
         * @returns {void}
         */
        function toggleSearch() {
            scope.home.search.open = !scope.home.search.open;
        }

        /** Loading */
        /**
         * @name updateLoading
         * @param {object} payload - {id, messageList, visible}
         * @desc called to update when the loading changes
         * @returns {void}
         */
        function updateLoading(payload) {
            const queryInsightID = semossCoreService.get('queryInsightID');
            // if the id is false, it is on the global level
            if (payload.id === false || payload.id === queryInsightID) {
                scope.home.loading.open = payload.active;
                scope.home.loading.messages = payload.messageList;
            }
        }

        /**
         * @name updateTheme
         * @desc called to update the theme
         * @returns {void}
         */
        function updateTheme() {
            let theme = semossCoreService.settings.get('active.theme');

            scope.home.name = theme.name;
            scope.home.logo = theme.logo;
            scope.home.isLogoUrl = theme.isLogoUrl;
            scope.home.backgroundImage = theme.backgroundImage;
            scope.home.backgroundImageOpacity = theme.backgroundImageOpacity;
            scope.home.includeNameWithLogo = theme.includeNameWithLogo;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let loginListener,
                logoutListener,
                securityListener,
                updateLoadingListener,
                // newInsightListener,
                themeListener,
                urlParams = {};

            // add listener
            loginListener = semossCoreService.on(
                'oauth-login-success',
                updateLoginViaServer
            );
            logoutListener = semossCoreService.on(
                'oauth-logout-success',
                updateLoginViaServer
            );
            securityListener = semossCoreService.on(
                'security-update',
                updateHomeLogin
            );
            updateLoadingListener = semossCoreService.on(
                'update-loading',
                updateLoading
            );

            themeListener = semossCoreService.on('updated-theme', updateTheme);

            // remove
            scope.$on('$destroy', function () {
                loginListener();
                logoutListener();
                securityListener();
                updateLoadingListener();
                themeListener();
            });

            /* DZ: removing this and rely on the session being timed out to remove all insights. otherwise this will conflict with
             *       logic for syncing insights from another session (since these insights will always be dropped, we don't want that)
             *       Also can't do this because when user logs out and tries to bring to a custom logout screen, it will try to run a pixel
             *       on a invalid session and then be redirected back to /login when we want to redirect to a custom logout page.
             */
            // off load event
            // window.onbeforeunload = function () {
            //     semossCoreService.emit('close-all');
            // };

            // homeContentEle = ele[0].querySelector('.home__content');
            // switch
            urlParams = $location.search();
            if (
                urlParams.hasOwnProperty('app_id') &&
                urlParams.hasOwnProperty('app_insight_id')
            ) {
                semossCoreService.emit('open', {
                    type: 'insight',
                    options: urlParams,
                    newSheet: true,
                });
            }

            if (urlParams.hasOwnProperty('hideTopbar')) {
                scope.home.hideTopbar = urlParams.hideTopbar === 'true';
            }

            if (
                urlParams.hasOwnProperty('insightId') &&
                urlParams.insightId === 'new'
            ) {
                semossCoreService.emit('open', {
                    type: 'new',
                    options: {},
                });
            }

            // if status is in the url, we will setup the listener to check when the data has finished loading,
            // if so we will add an empty div with 'viz-loaded- as id for the BE to check that we have finished loading.
            if (urlParams.hasOwnProperty('status')) {
                semossCoreService.on('sync-insight', function (payload) {
                    const initialized = semossCoreService.getShared(
                        payload.insightID,
                        'initialized'
                    );
                    if (initialized) {
                        window.visualLoaded = true;
                        let element = document.createElement('div');
                        element.id = 'viz-loaded';

                        window.document.body.appendChild(element);
                    }
                });
            }

            updateTheme();
            updateHomeLogin();
            updateLogin();

            // Playground mode
            if (PLAYGROUND) {
                scope.home.banner = true;
            } else {
                scope.home.banner = false;
            }

            scope.home.overlay = PLAYGROUND;
            scope.home.LINKS = LINKS;

            // get the available logins allowed so we can show/hide
            if (CONFIG.loginsAllowed) {
                scope.home.login.allowed = CONFIG.loginsAllowed;
            } else {
                monolithService.loginsAllowed().then(function (data) {
                    scope.home.login.allowed = data;
                });
            }
        }

        initialize();
    }
}
