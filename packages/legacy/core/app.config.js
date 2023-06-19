'use strict';

import { react2angular } from 'react2angular';

/**
 * @name app.config
 * @desc app configuration
 * @returns {void}
 */
angular.module('app.config', []).config(config).run(stateRunner);

config.$inject = [
    '$stateProvider',
    '$urlRouterProvider',
    '$compileProvider',
    '$windowProvider',
    '$httpProvider',
];
stateRunner.$inject = [
    '$rootScope',
    '$state',
    '$stateParams',
    'semossCoreService',
];

import Utility from '@/core/utility/utility';

/**
 * @name config
 * @desc configuration setup for the application
 * @param {function} $stateProvider - ui router state provider
 * @param {function} $urlRouterProvider - url router provider
 * @param {function} $compileProvider - angularjs compile provider
 * @param {function} $windowProvider - angularjs window
 * @param {function} $httpProvider - angularjs http provider
 * @returns {void}
 */
function config(
    $stateProvider,
    $urlRouterProvider,
    $compileProvider,
    $windowProvider,
    $httpProvider
) {
    $httpProvider.interceptors.push('semossInterceptorService');
    $urlRouterProvider.otherwise('');

    $compileProvider.debugInfoEnabled(false);
    $compileProvider.commentDirectivesEnabled(false);
    $compileProvider.cssClassDirectivesEnabled(false);

    $stateProvider
        .state('login', {
            url: '/login',
            template: '<login></login>',
            params: {
                reload: null,
            },
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/login" */ './components/login/login.directive.js'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
            resolve: {
                setConfig: [
                    '$q',
                    'semossCoreService',
                    'monolithService',
                    'CONFIG',
                    function ($q, semossCoreService, monolithService, CONFIG) {
                        if (CONFIG.security && !CONFIG.loggedIn) {
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('home', {
            abstract: true,
            template: '<home></home>',
            resolve: {
                checkConfig: [
                    '$q',
                    '$state',
                    'CONFIG',
                    'semossCoreService',
                    'monolithService',
                    function (
                        $q,
                        $state,
                        CONFIG,
                        semossCoreService,
                        monolithService
                    ) {
                        if (CONFIG.security && !CONFIG.loggedIn) {
                            $state.go('login');
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('home.landing', {
            url: '/',
            template: '<landing></landing>',
        })
        .state('home.landing.tag', {
            url: 't/:tag',
            params: { tag: null },
            resolve: {
                checkTag: [
                    '$state',
                    '$stateParams',
                    'semossCoreService',
                    function ($state, $stateParams, semossCoreService) {
                        if (!$stateParams.tag) {
                            $state.go('home.landing');
                            return;
                        }
                    },
                ],
            },
        })
        .state('home.landing.project', {
            url: 'project/:projectId',
            params: { projectId: null, projectName: null },
            resolve: {
                checkProject: [
                    '$state',
                    '$stateParams',
                    'semossCoreService',
                    function ($state, $stateParams, semossCoreService) {
                        if (!$stateParams.projectId) {
                            $state.go('home.landing');
                            return;
                        }
                    },
                ],
            },
        })
        .state('home.landing.project.manage', {
            url: '/manage',
            template: '<project></project>',
        })
        .state('home.landing.starred', {
            url: 'starred',
        })
        .state('home.landing.recent', {
            url: 'recents',
        })
        .state('home.settings', {
            url: '/settings',
            template: '<settings></settings>',
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/settings" */ './components/settings/settings.directive.js'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
        })
        .state('home.settings2', {
            url: '/settings2',
            template: '<rewrite src="./packages/client/dist/#/settings"></rewrite>',
        })
        .state('home.scheduler', {
            url: '/jobs',
            template: '<scheduler></scheduler>',
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/scheduler" */ './components/scheduler/scheduler.directive.js'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
        })
        .state('home.react-test', {
            url: '/test',
            template: '<react-test></react-test>',
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "react/test" */ '@client/exports'
                )
                    .then(({ Test }) => {
                        // angularize the component
                        const mod = angular
                            .module('react.test', [])
                            // Counterfeit
                            .component(
                                'reactTest',
                                react2angular(
                                    Test,
                                    [],
                                    [
                                        'semossCoreService',
                                        '$stateParams',
                                        'CONFIG',
                                    ]
                                )
                            );

                        // load it in
                        $ocLazyLoad.load(mod);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
        })
        .state('home.catalog2', {
            url: '/catalog2',
            template: '<rewrite src="./packages/client/dist/#/catalog"></rewrite>',
        })
        .state('home.catalog', {
            url: '/catalog',
            template: '<catalog></catalog>',
        })
        .state('home.catalog.database', {
            url: '/database/:database',
            params: {
                database: null,
            },
            template: '<database></database>',
            resolve: {
                checkApp: [
                    '$q',
                    '$state',
                    '$stateParams',
                    'semossCoreService',
                    function ($q, $state, $stateParams, semossCoreService) {
                        let deferred = $q.defer();

                        if (!$stateParams.database) {
                            $state.go('home.catalog');
                            deferred.resolve();
                            return deferred.promise;
                        }

                        const message = Utility.random('open');
                        semossCoreService.once(message, function (response) {
                            if (response.type === 'error') {
                                semossCoreService.emit('alert', {
                                    color: 'error',
                                    text: response.message,
                                });

                                $state.go('home.catalog');
                                deferred.resolve();
                                return;
                            }

                            deferred.resolve();
                        });

                        semossCoreService.emit('open-app', {
                            appId: $stateParams.database,
                            message: message,
                        });

                        return deferred.promise;
                    },
                ],
            },
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/database" */ './components/database/database.directive'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
            redirectTo: 'home.catalog.database.meta',
        })

        // .state('home.catalog.database.collab', {
        //     url: '/collab',
        //     template: '<database-collab></database-collab>'
        // })
        .state('home.catalog.database.meta', {
            url: '/data',
            template: '<database-meta></database-meta>',
        })
        .state('home.build', {
            url: '/build',
            params: {
                insight: null,
            },
            template: '<build></build>',
            resolve: {
                checkWorkspace: [
                    '$state',
                    '$stateParams',
                    'semossCoreService',
                    function ($state, $stateParams, semossCoreService) {
                        const insight = $stateParams.insight;

                        // not a valid insight navigate away
                        if (
                            !insight ||
                            !semossCoreService.workbook.getWorkbook(insight)
                        ) {
                            $state.go('home.landing');
                            return;
                        }
                    },
                ],
            },
        })
        .state('home.import', {
            url: '/import',
            template: '<import></import>',
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/import" */ './components/import/import.directive.js'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
        })
        .state('mdm', {
            url: '/mdm',
            template: '<mdm></mdm>',
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/mdm" */ './components/mdm/mdm.directive.js'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
            resolve: {
                checkConfig: [
                    '$q',
                    '$state',
                    'CONFIG',
                    'semossCoreService',
                    'monolithService',
                    function (
                        $q,
                        $state,
                        CONFIG,
                        semossCoreService,
                        monolithService
                    ) {
                        if (CONFIG.security && !CONFIG.loggedIn) {
                            $state.go('login');
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('insight', {
            url: '/insight',
            template: '<viewer></viewer>',
            resolve: {
                checkConfig: [
                    '$q',
                    '$state',
                    'CONFIG',
                    'semossCoreService',
                    'monolithService',
                    function (
                        $q,
                        $state,
                        CONFIG,
                        semossCoreService,
                        monolithService
                    ) {
                        if (CONFIG.security && !CONFIG.loggedIn) {
                            $state.go('login');
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('terminal', {
            url: '/terminal',
            template: '<viewer-terminal></viewer-terminal>',
            resolve: {
                checkConfig: [
                    '$q',
                    '$state',
                    'CONFIG',
                    'semossCoreService',
                    'monolithService',
                    function (
                        $q,
                        $state,
                        CONFIG,
                        semossCoreService,
                        monolithService
                    ) {
                        if (CONFIG.security && !CONFIG.loggedIn) {
                            $state.go('login');
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('html', {
            url: '/html',
            template: '<viewer-html></viewer-html>',
            resolve: {
                checkConfig: [
                    '$q',
                    '$state',
                    'CONFIG',
                    'semossCoreService',
                    'monolithService',
                    function (
                        $q,
                        $state,
                        CONFIG,
                        semossCoreService,
                        monolithService
                    ) {
                        if (CONFIG.security && !CONFIG.loggedIn) {
                            $state.go('login');
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('redirect', {
            url: '/r/:id',
            template: '<redirect></redirect>', // TODO: Move this into the onEnter function of UI router?
            resolve: {
                checkConfig: [
                    '$q',
                    '$state',
                    'CONFIG',
                    'semossCoreService',
                    'monolithService',
                    function (
                        $q,
                        $state,
                        CONFIG,
                        semossCoreService,
                        monolithService
                    ) {
                        console.warn('config');

                        if (CONFIG.security && !CONFIG.loggedIn) {
                            $state.go('login');
                            return true;
                        }
                        if (!CONFIG.version) {
                            return securityConfig(
                                $q,
                                semossCoreService,
                                monolithService,
                                CONFIG
                            );
                        }

                        return true;
                    },
                ],
            },
        })
        .state('out-of-memory', {
            // Should refactor to error
            url: '/oom',
            template: '<out-of-memory></out-of-memory>',
            lazyLoad: ($transition$) => {
                const $ocLazyLoad = $transition$.injector().get('$ocLazyLoad');

                return import(
                    /* webpackChunkName: "components/out-of-memory" */ './components/out-of-memory/out-of-memory.directive'
                )
                    .then((module) => {
                        $ocLazyLoad.load(module.default);
                    })
                    .catch((err) => {
                        console.error('Error: ', err);
                    });
            },
        });

    // TODO: Why did we have this?
    // $locationProvider.html5Mode({
    //     enabled: true,
    //     requireBase: false
    // });

    // set the name of the webpage (for market)
    $windowProvider.$get().name = 'SemossWeb';
}

/**
 * @name securityConfig
 * @param {service} $q - angular promise service
 * @param {service} semossCoreService - the core service
 * @param {service} monolithService - monolith service
 * @param {constant} CONFIG - constant
 * @desc initialize the semossCoreService
 * @returns {void}
 */
function securityConfig($q, semossCoreService, monolithService, CONFIG) {
    var defer = $q.defer();
    monolithService.backendConfig().then(function (response) {
        var key;

        for (key in response) {
            if (response.hasOwnProperty(key)) {
                CONFIG[key] = response[key];
            }
        }

        // update config
        if (
            CONFIG.hasOwnProperty('theme') &&
            Object.keys(CONFIG.theme).length > 0
        ) {
            semossCoreService.emit('set-theme', {
                id: CONFIG.theme.ID,
                name: CONFIG.theme.THEME_NAME,
                theme: JSON.parse(CONFIG.theme.THEME_MAP),
            });
        }

        if (CONFIG.security) {
            if (Object.keys(CONFIG.logins).length > 0) {
                CONFIG.loggedIn = true;
                // init when user is logged in
                semossCoreService.emit('init-login');
            } else {
                CONFIG.loggedIn = false;
            }
        } else {
            semossCoreService.emit('init-login');
        }

        defer.resolve();
    });

    return defer.promise;
}

/**
 * @name stateRunner
 * @desc sets $state & $stateParams to the $rootScope
 * @param {function} $rootScope - angular js scope
 * @param {function} $state - ui router state object
 * @param {object} $stateParams - ui router state parameters
 * @param {service} semossCoreService - core service
 * @returns {void}
 */
function stateRunner($rootScope, $state, $stateParams, semossCoreService) {
    // easy access to $state and $stateParams... see explanation: https://github.com/angular-ui/ui-router/blob/gh-pages/sample/core/app.js
    // TODO find a better way to do this?
    semossCoreService.initialize();
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;

    window.semoss = semossCoreService;
}
