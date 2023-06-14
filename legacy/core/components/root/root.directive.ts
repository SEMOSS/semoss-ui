'use strict';

import angular from 'angular';

import './root.scss';

export default angular
    .module('app.root.directive', [])
    .directive('root', rootDirective);

rootDirective.$inject = [
    'VISIBLE_ALERTS',
    'OPTIONAL_COOKIES',
    '$timeout',
    'semossCoreService',
];

function rootDirective(
    VISIBLE_ALERTS: string[],
    OPTIONAL_COOKIES: boolean,
    $timeout: ng.ITimeoutService,
    semossCoreService: SemossCoreService
) {
    rootCtrl.$inject = [];
    rootLink.$inject = ['scope', 'ele', 'ctrl', 'attrs'];

    return {
        restrict: 'E',
        template: require('./root.directive.html'),
        scope: {},
        controller: rootCtrl,
        controllerAs: 'root',
        bindToController: {},
        link: rootLink,
    };

    function rootCtrl() {}

    function rootLink(scope, ele, ctrl, attrs) {
        scope.root.OPTIONAL_COOKIES = OPTIONAL_COOKIES;
        scope.root.alert = {
            messages: [],
            counter: 0,
        };

        /** Alert */
        /**
         * @name updateAlert
         * @param {object} payload - {text, color}
         * @desc called to update when the alert changes
         */
        function updateAlert(payload: {
            text: string;
            color?: 'success' | 'error' | 'warn';
        }): void {
            const color = payload.color || 'error';

            // only show visible alerts
            if (VISIBLE_ALERTS.indexOf(color) === -1) {
                return;
            }

            scope.root.alert.messages.push({
                color: color,
                text: payload.text || '',
                open: true,
                id: ++scope.root.alert.counter,
            });

            $timeout(function () {
                scope.root.alert.messages.shift();
            }, 3000);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // add listener
            const alertListener = semossCoreService.on('alert', updateAlert);

            // remove
            scope.$on('$destroy', function () {
                alertListener();
            });
        }

        initialize();
    }
}
