'use strict';

import './login.scss';

export default angular
    .module('app.login.directive', [])
    .directive('login', loginDirective);

loginDirective.$inject = [
    'semossCoreService',
    'monolithService',
    '$sce',
    '$state',
    '$timeout',
    'RIBBON_MESSAGE',
    'CONFIG',
    'SEMOSS_VIDEOS',
];

function loginDirective(
    semossCoreService,
    monolithService,
    $sce,
    $state,
    $timeout,
    RIBBON_MESSAGE,
    CONFIG,
    SEMOSS_VIDEOS
) {
    loginCtrl.$inject = ['$stateParams', '$window'];

    return {
        restrict: 'E',
        require: [],
        template: require('./login.directive.html'),
        controller: loginCtrl,
        link: loginLink,
        bindToController: {},
        controllerAs: 'login',
    };

    function loginCtrl($stateParams, $window) {
        // reload home page when user logout
        if ($stateParams.reload) {
            $window.location.reload();
        }
    }

    function loginLink(scope, ele) {
        var loginsAllowedListener;

        scope.login.nameMapping = {
            dropbox: 'Dropbox',
            google: 'Google',
            github: 'Github',
            ms: 'Microsoft',
            cac: 'CAC',
        };
        scope.login.registration = {};
        scope.login.activeTab = 1;
        scope.login.userRegistration = false;
        scope.login.overlay = {
            open: false,
        };
        scope.login.infoOverlay = false;
        scope.login.RIBBON_MESSAGE = RIBBON_MESSAGE;
        scope.login.youtubeLink = 'https://www.youtube.com/embed/AA72vgwhKjI';
        scope.login.walkthroughIdx = 0;
        scope.login.version = false;
        scope.login.loginMethod = {};
        scope.login.showWhy = false;
        scope.login.signUpUser = signUpUser;
        scope.login.userLogin = userLogin;
        scope.login.userLoginAuth = userLoginAuth;
        scope.login.loginsAllowed = loginsAllowed;
        scope.login.passwordValidate = passwordValidate;
        scope.login.updateWalkthroughContent = updateWalkthroughContent;
        scope.login.openOverlay = openOverlay;
        scope.login.closeOverlay = closeOverlay;
        scope.login.openLoginInfoOverlay = openLoginInfoOverlay;
        scope.login.closeLoginInfoOverlay = closeLoginInfoOverlay;
        scope.login.isMultiLogin = isMultiLogin;

        /**
         * @name process
         * @param {string} username the user name
         * @desc  check if username is stored, then land on home page
         * @returns {void}
         */
        function process(username) {
            if (window.localStorage.getItem('smssusername') !== null) {
                CONFIG.loggedIn = true;
                CONFIG.logins.NATIVE = username;
                semossCoreService.emit('init-login');
                $state.go('home.landing');
            }
        }

        /**
         * @name openOverlay
         * @desc open the overlay
         * @returns {void}
         */
        function openOverlay() {
            scope.login.overlay.open = true;
        }

        /**
         * @name closeOverlay
         * @desc close the overlay
         * @returns {void}
         */
        function closeOverlay() {
            scope.login.overlay.open = false;
        }

        /**
         * @name openLoginInfoOverlay
         * @desc open the overlay
         * @returns {void}
         */
        function openLoginInfoOverlay() {
            scope.login.infoOverlay = true;
        }

        /**
         * @name closeOverlay
         * @desc close the overlay
         * @returns {void}
         */
        function closeLoginInfoOverlay() {
            scope.login.infoOverlay = false;
        }

        /**
         * @name loginsAllowed
         * @desc check which method to choose for user login
         * @returns {void}
         */
        function loginsAllowed() {
            monolithService.loginsAllowed().then(setLoginsAllowed);
        }

        /**
         * @name setLoginsAllowed
         * @param {object} allowed - object with keys of login types available and values of boolean
         * @desc called as promise return for monolith.loginsAllowed or if CONFIG is set, simply added
         * @return {void}
         */
        function setLoginsAllowed(allowed) {
            scope.login.loginMethod = allowed;
            scope.login.userRegistration = allowed.registration;
        }

        /**
         * @name isMultiLogin
         * @desc checks to see if we are allowing multiple forms of login (native && oauth)
         * @returns {boolean} true/false
         */
        function isMultiLogin() {
            let isMulti = false;

            if (scope.login.loginMethod.native) {
                for (let provider in scope.login.loginMethod) {
                    if (provider === 'registration' || provider === 'native') {
                        continue;
                    }

                    if (scope.login.loginMethod[provider]) {
                        isMulti = true;
                        break;
                    }
                }
            }
            return isMulti;
        }

        /**
         * @name updateWalkthroughContent
         * @param {string} state - current state
         * @desc update content for video
         * @returns {void}
         */
        function updateWalkthroughContent(state) {
            if (state === 'right' || state === 'left') {
                if (state === 'right') {
                    scope.login.walkthroughIdx++;
                } else if (state === 'left') {
                    scope.login.walkthroughIdx--;
                }
            } else {
                // Do not update iframe if same section is selected
                if (state === scope.login.currentWalkthroughSection.title) {
                    return;
                }

                switch (state) {
                    case 'overview':
                        scope.login.walkthroughIdx = 0;
                        break;
                    case 'dashboard':
                        scope.login.walkthroughIdx = 1;
                        break;
                    case 'r':
                        scope.login.walkthroughIdx = 2;
                        break;
                    case 'python':
                        scope.login.walkthroughIdx = 3;
                        break;
                    case 'tableau':
                        scope.login.walkthroughIdx = 4;
                        break;
                    case 'git':
                        scope.login.walkthroughIdx = 5;
                        break;
                    default:
                        scope.login.walkthroughIdx = 0;
                }
            }

            // Go to Next section and Update Content
            scope.login.currentWalkthroughSection =
                scope.login.walkthroughContent[scope.login.walkthroughIdx];
        }

        /**
         * @name getWalkthroughContent
         * @desc define the content for walkthrough
         * @returns {void}
         */
        function getWalkthroughContent() {
            scope.login.walkthroughContent = [
                {
                    title: 'overview',
                    link: $sce.trustAsResourceUrl(SEMOSS_VIDEOS.overview),
                    header: 'What is SEMOSS?',
                    description:
                        'SEMOSS is an open-source, end-to-end data analytics platform.',
                },
                {
                    title: 'dashboard',
                    link: $sce.trustAsResourceUrl(SEMOSS_VIDEOS.dashboard),
                    header: 'Dashboard Engine',
                    description:
                        'Transform your data to a dashboard with just a few clicks and publish it for everyone to access.',
                },
                {
                    title: 'r',
                    link: $sce.trustAsResourceUrl(SEMOSS_VIDEOS.r),
                    header: 'R REPL Environment',
                    description: 'Use SEMOSS as a R Notebook / R Studio.',
                },
                {
                    title: 'python',
                    link: $sce.trustAsResourceUrl(SEMOSS_VIDEOS.python),
                    header: 'Python REPL Environment',
                    description:
                        'Use SEMOSS as a Python Notebook / Python REPL.',
                },
                {
                    title: 'tableau',
                    link: $sce.trustAsResourceUrl(SEMOSS_VIDEOS.tableau),
                    header: 'Tableau',
                    description:
                        'Use SEMOSS to profile, cleanup and transform your data and visualize in Tableau.',
                },
                {
                    title: 'git',
                    link: $sce.trustAsResourceUrl(SEMOSS_VIDEOS.git),
                    header: 'Collaborate',
                    description:
                        'Share and collaborate across environments using Git.',
                },
            ];

            scope.login.currentWalkthroughSection =
                scope.login.walkthroughContent[0];
        }

        /**
         * @name passwordValidate
         * @desc function that validate password strength for user registration
         * @param {string} password - password to validate
         * @returns {void}
         */
        function passwordValidate(password) {
            if (!password) {
                scope.login.passwordInvalid = true;
                return;
            }
            if (!password.match(/[a-z]/g)) {
                scope.login.passwordInvalid = true;
                return;
            }

            if (!password.match(/[A-Z]/g)) {
                scope.login.passwordInvalid = true;
                return;
            }

            if (!password.match(/[0-9]/g)) {
                scope.login.passwordInvalid = true;
                return;
            }

            if (!password.match(/[!@#\$%\^&\*]/g)) {
                scope.login.passwordInvalid = true;
                return;
            }
            // Validate length
            if (password.length < 8) {
                scope.login.passwordInvalid = true;
                return;
            }

            scope.login.passwordInvalid = false;
        }

        /**
         * @name userLoginAuth
         * @desc function that is called to login
         * @param {string} provider - login provider
         * @returns {void}
         */
        function userLoginAuth(provider) {
            var message = semossCoreService.utility.random('login');

            semossCoreService.once(message, function (response) {
                if (response.success) {
                    if (semossCoreService.getOptions('options', 'insightURL')) {
                        window.location.replace(
                            semossCoreService.getOptions(
                                'options',
                                'insightURL'
                            )
                        );
                        // semossCoreService.setOptions('options', 'insightURL', false);
                    } else {
                        CONFIG.loggedIn = true;
                        semossCoreService.emit('init-login');
                        $state.go('home.landing');
                    }
                }
            });

            if (navigator.userAgent.indexOf('Tableau') > -1) {
                semossCoreService.emit('oauth-login2', {
                    provider: provider,
                    message: message,
                });
            } else {
                semossCoreService.emit('oauth-login', {
                    provider: provider,
                    message: message,
                });
            }
        }

        /** signUp */
        /**
         * @name signUp
         * @desc function that is called to signUp
         * @param  {string} signupForm - form name
         * @returns {void}
         */
        function signUpUser(signupForm) {
            scope.login.registration.userName =
                scope.login.registration.userFirstName +
                ' ' +
                scope.login.registration.userLastName;
            monolithService
                .createUser(
                    scope.login.registration.userName,
                    scope.login.registration.userSignUPName,
                    scope.login.registration.userSignUPEmail,
                    scope.login.registration.userSignUPPassword,
                    scope.login.registration.userSignUPPassword,
                    scope.login.registration.userSignUPPhone,
                    scope.login.registration.userSignUPPhoneextension,
                    scope.login.registration.userSignUPCountrycode
                )
                .then(
                    function () {
                        scope.login.registration = {};
                        signupForm.$setPristine();
                        signupForm.$setUntouched();

                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'You have successfully registered! Please Log in',
                        });
                        scope.login.activeTab = 1;
                    },
                    function (error) {
                        console.log('Error in signup');

                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
        }

        /**
         * @name userLogin
         * @desc function that is called to login
         * @returns {void}
         */
        function userLogin() {
            monolithService
                .loginUser(
                    scope.login.registration.userLoginName,
                    scope.login.registration.userLoginPassword
                )
                .then(
                    function () {
                        if (
                            semossCoreService.getOptions(
                                'options',
                                'insightURL'
                            )
                        ) {
                            CONFIG.loggedIn = true;
                            CONFIG.logins.NATIVE =
                                scope.login.registration.userLoginName;
                            window.location.replace(
                                semossCoreService.getOptions(
                                    'options',
                                    'insightURL'
                                )
                            );
                            // $state.go('insight');
                            // semossCoreService.setOptions('options', 'insightURL', false);
                        } else {
                            process(scope.login.registration.userLoginName);
                        }
                    },
                    function (error) {
                        console.log('Error in login');
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
        }

        /**
         * @name setActiveLogins
         * @param {object} logins - keys of the service logged in, always true, otherwise key isn't there
         * @desc sets login status and sends user to appropriate destination based on url
         * @return {void}
         */
        function setActiveLogins(logins) {
            if (Object.keys(logins).length > 0) {
                CONFIG.loggedIn = true;
                CONFIG.logins = logins;

                if (semossCoreService.getOptions('options', 'insightURL')) {
                    window.location.replace(
                        semossCoreService.getOptions('options', 'insightURL')
                    );
                    // semossCoreService.setOptions('options', 'insightURL', false);
                } else {
                    semossCoreService.emit('init-login');
                    $state.go('home.landing');
                }
            } else {
                CONFIG.loggedIn = false;
            }
        }

        /**
         * @name updateTheme
         * @desc called to update the theme
         * @returns {void}
         */
        function updateTheme() {
            const theme = semossCoreService.settings.get('active.theme');

            scope.login.theme = theme;
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            CONFIG.logins = {};
            // register listeners
            loginsAllowedListener = semossCoreService.on(
                'user-login',
                loginsAllowed
            );
            // no need to call server if we have this info
            if (CONFIG.loginsAllowed) {
                setLoginsAllowed(CONFIG.loginsAllowed);
            } else {
                loginsAllowed();
            }
            getWalkthroughContent();

            if (CONFIG.hasOwnProperty('version')) {
                scope.login.version = {
                    version: 'V' + CONFIG.version.version,
                    date: CONFIG.version.datetime.split(' ')[0],
                };
            }

            // check CONFIG first to avoid round trip
            // check if CONFIG has a security prop and its off so we can just go right home
            // otherwise, make the trip
            if (CONFIG.hasOwnProperty('security') && !CONFIG.security) {
                $state.go('home.landing');
            } else {
                semossCoreService.isSecurityEnabled().then(function (response) {
                    if (response) {
                        semossCoreService
                            .getActiveLogins()
                            .then(setActiveLogins);
                    } else {
                        $state.go('home.landing');
                    }
                });
            }

            const themeListener = semossCoreService.on(
                'updated-theme',
                updateTheme
            );

            scope.$on('$destroy', function () {
                console.log('destroying login...');
                themeListener();
                loginsAllowedListener();
            });

            updateTheme();
        }

        initialize();
    }
}
