'use strict';

/**
 * @name redirect-insight.directive.js
 * @desc redirect-insight directive
 */

export default angular
    .module('app.redirect-insight.directive', [])
    .directive('redirectInsight', redirectInsight);

redirectInsight.$inject = ['semossCoreService'];

function redirectInsight(semossCoreService) {
    redirectInsightLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./redirect-insight.directive.html'),
        link: redirectInsightLink,
        scope: {},
    };

    function redirectInsightLink(scope) {
        var redirectInsightListener;

        scope.redirectInsight = {};
        scope.redirectInsight.redirect = redirect;
        scope.redirectInsight.openNewInstance = openNewInstance;

        /**
         * @name redirect
         * @desc redirect and open the already opened insight
         * @returns {void}
         */
        function redirect() {
            semossCoreService.emit('home-nav', {
                type: 'redirect-insight',
                insightId: scope.redirectInsight.options.insightId,
            });
            resetValues();
        }

        /**
         * @name openNewInstance
         * @desc open a new instance of the insight
         * @returns {void}
         */
        function openNewInstance() {
            scope.redirectInsight.options.callback();
            resetValues();
        }

        /**
         * @name resetValues
         * @desc reset the values to their defaults
         * @returns {void}
         */
        function resetValues() {
            scope.redirectInsight.options = {
                open: false,
                appId: '',
                appInsightId: '',
                insightId: '',
                callback: undefined,
            };
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            resetValues();
            redirectInsightListener = semossCoreService.on(
                'redirect-insight',
                function (payload) {
                    scope.redirectInsight.options = {
                        open: true,
                        appId: payload.appId,
                        appInsightId: payload.appInsightId,
                        insightId: payload.insightId,
                        callback: payload.callback,
                    };
                }
            );
        }

        initialize();

        scope.$on('$destroy', function () {
            redirectInsightListener();
        });
    }
}
