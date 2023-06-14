import angular from 'angular';
import Utility from '../../../utility/utility.js';

export default angular
    .module('app.home.home-nav', [])
    .directive('homeNav', homeNavDirective);

import './home-nav.scss';

homeNavDirective.$inject = [
    '$timeout',
    '$state',
    '$stateParams',
    '$transitions',
    'semossCoreService',
];

function homeNavDirective(
    $timeout,
    $state,
    $stateParams,
    $transitions,
    semossCoreService
) {
    homeNavCtrl.$inject = [];
    homeNavLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./home-nav.directive.html'),
        scope: {},
        controller: homeNavCtrl,
        controllerAs: 'homeNav',
        bindToController: {},
        link: homeNavLink,
    };

    function homeNavCtrl() {}

    function homeNavLink(scope, ele) {
        scope.homeNav.active = {
            listeners: [],
            search: '',
            rawApps: [],
            rawInsights: [],
        };

        scope.homeNav.navigate = navigate;
        scope.homeNav.newInsight = newInsight;
        scope.homeNav.showActive = showActive;
        scope.homeNav.closeActive = closeActive;
        scope.homeNav.remove = remove;
        scope.homeNav.redirectToLink = redirectToLink;

        /**
         * @name navigate
         * @desc navigate to an active insight or app
         * @param state - selected state
         * @param params - options for the active state
         */
        function navigate(state: string, params: any): void {
            $state.go(state, params || {});
        }

        /**
         * @name newInsight
         * @desc newInsight a new insight
         */
        function newInsight(): void {
            semossCoreService.emit('open', {
                type: 'new',
                options: {},
            });
        }

        /**
         * @name showActive
         * @desc show the active items
         * @returns {void}
         */
        function showActive(): void {
            scope.homeNav.active.search = '';

            // remove it  (in case)
            for (
                let listenerIdx = 0,
                    listenerLen = scope.homeNav.active.listeners.length;
                listenerIdx < listenerLen;
                listenerIdx++
            ) {
                scope.homeNav.active.listeners[listenerIdx]();
            }

            scope.homeNav.active.listeners = [
                semossCoreService.on('new-insight', function () {
                    updateActiveInsights();
                }),
                semossCoreService.on('saved-insight', function () {
                    updateActiveInsights();
                }),
                semossCoreService.on('closed-insight', function () {
                    updateActiveInsights();
                }),
                semossCoreService.on('changed-insight-name', function () {
                    updateActiveInsights();
                }),
                semossCoreService.on('close-all', function () {
                    updateActiveInsights();
                }),
            ];

            updateActiveInsights();
            $timeout();
        }

        /**
         * @name closeActive
         * @desc close the active menu
         * @returns {void}
         */
        function closeActive(): void {
            // remove it
            for (
                let listenerIdx = 0,
                    listenerLen = scope.homeNav.active.listeners.length;
                listenerIdx < listenerLen;
                listenerIdx++
            ) {
                scope.homeNav.active.listeners[listenerIdx]();
            }
        }

        /**
         * @name updateActiveInsights
         * @desc update the active insights
         */
        function updateActiveInsights(): void {
            scope.homeNav.active.rawInsights = [];

            const shared = semossCoreService.get('shared');
            for (const insight in shared) {
                if (shared.hasOwnProperty(insight)) {
                    if (!shared[insight]) {
                        continue;
                    }

                    let image = require('images/blue-logo.svg');
                    if (
                        shared[insight].insight &&
                        shared[insight].insight.app_id &&
                        shared[insight].insight.app_insight_id
                    ) {
                        const imageUpdates =
                                semossCoreService.getOptions('imageUpdates'),
                            insightImageKey =
                                shared[insight].insight.app_id +
                                shared[insight].insight.app_insight_id;

                        if (imageUpdates[insightImageKey]) {
                            image = imageUpdates[insightImageKey];
                        } else {
                            image =
                                semossCoreService.app.generateInsightImageURL(
                                    shared[insight].insight.app_id,
                                    shared[insight].insight.app_insight_id
                                );
                        }
                    }
                    scope.homeNav.active.rawInsights.push({
                        name: shared[insight].insight.name,
                        image: image,
                        insightID: shared[insight].insightID,
                    });
                }
            }

            Utility.sort(scope.homeNav.active.rawInsights, 'name');
        }

        /**
         * @name remove
         * @desc close  an active insight or app
         * @param type - type of item to open
         * @param options - options for the active item
         */
        function remove(
            type: string,
            options: { appId?: string; insightID?: string }
        ): void {
            if (type === 'insight') {
                semossCoreService.emit('execute-pixel', {
                    insightID: options.insightID,
                    commandList: [
                        {
                            type: 'dropInsight',
                            components: [],
                            terminal: true,
                        },
                    ],
                });
            }
        }

        /**
         * @name updateNavigation
         * @desc called when a route changes
         * @returns {void}
         */
        function updateNavigation(): void {
            scope.homeNav.state = {
                name: $state.current.name,
                params: $stateParams,
            };
        }

        function redirectToLink(link): void {
            window.open(link, '_blank');
        }

        /**
         * @name updateTheme
         * @desc called to update the theme
         * @returns {void}
         */
        function updateTheme() {
            const theme = semossCoreService.settings.get('active.theme');
            scope.homeNav.homeLeftNavItems = theme.homeLeftNavItems;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize(): void {
            let navigationListener, insightNavigationListener;

            navigationListener = $transitions.onSuccess({}, updateNavigation);
            insightNavigationListener = semossCoreService.on(
                'home-nav',
                function (payload) {
                    if (payload.type === 'redirect-insight') {
                        scope.homeNav.navigate('home.build', {
                            insight: payload.insightId,
                        });
                    }
                }
            );

            scope.$on('$destroy', function () {
                navigationListener();
                insightNavigationListener();

                // remove the active listeners
                for (
                    let listenerIdx = 0,
                        listenerLen = scope.homeNav.active.listeners.length;
                    listenerIdx < listenerLen;
                    listenerIdx++
                ) {
                    scope.homeNav.active.listeners[listenerIdx]();
                }
            });
            updateTheme();
            updateNavigation();
        }

        initialize();
    }
}
