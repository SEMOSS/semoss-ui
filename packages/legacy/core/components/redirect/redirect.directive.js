'use strict';

/**
 * @name redirect
 * @desc redirect
 */
export default angular
    .module('app.redirect.directive', [])
    .directive('redirect', redirectDirective);

import './redirect.scss';

redirectDirective.$inject = [
    '$timeout',
    '$location',
    '$state',
    '$stateParams',
    'semossCoreService',
];

function redirectDirective(
    $timeout,
    $location,
    $state,
    $stateParams,
    semossCoreService
) {
    redirectCtrl.$inject = [];
    redirectLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'EA',
        scope: {},
        require: [],
        template: require('./redirect.directive.html'),
        controllerAs: 'redirect',
        controller: redirectCtrl,
        link: redirectLink,
    };

    function redirectCtrl() {}

    function redirectLink(scope) {
        scope.redirect.widgetLoadingScreens = [];
        scope.redirect.loading = true;

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var updateLoadingListener,
                message,
                pixel = '',
                insightUrl = $location.absUrl();

            updateLoadingListener = semossCoreService.on(
                'update-loading',
                function (payload) {
                    var queryInsightID =
                        semossCoreService.get('queryInsightID');
                    // if the id is false, it is on the global level
                    if (payload.id === false || payload.id === queryInsightID) {
                        scope.redirect.loading = payload.active;
                        scope.redirect.widgetLoadingScreens =
                            payload.messageList;
                    }
                }
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateLoadingListener();
            });

            if (!$stateParams.id) {
                $state.go('home.landing');
                return;
            }

            // clear out loading
            scope.redirect.widgetLoadingScreens = [];
            scope.redirect.loading = true;

            // TODO: do we need to wait? Why isn't this called in the service before?
            // security check
            semossCoreService.getBEConfig().then(function (config) {
                if (config.security) {
                    // look to see if user is signed in. if not, we need to store the insight url so we can route to it when user signs in.
                    semossCoreService.getActiveLogins().then(function () {
                        semossCoreService.setOptions(
                            'options',
                            'insightURL',
                            insightUrl
                        );
                    });
                }
            });

            // validate
            pixel += 'bq(';
            pixel += 'fancy=["' + $stateParams.id + '"] ';
            pixel += ')';

            message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    base;

                if (type.indexOf('ERROR') > -1) {
                    $state.go('home.landing');
                    return;
                }

                base = $location.absUrl().split('#')[0];
                base += output;

                window.location.replace(base);
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                response: message,
                listeners: [],
            });
        }

        initialize();
    }
}
