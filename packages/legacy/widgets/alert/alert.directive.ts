'use strict';

import angular from 'angular';

import './alert.scss';

export default angular
    .module('app.alert.directive', [])
    .directive('alert', alertDirective);

alertDirective.$inject = ['semossCoreService'];

function alertDirective(semossCoreService: SemossCoreService) {
    alertLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./alert.directive.html'),
        scope: {},
        require: ['^insight'],
        controllerAs: 'alert',
        bindToController: {},
        link: alertLink,
        controller: alertCtrl,
    };

    function alertCtrl() {}

    function alertLink(scope, ele, attrs, ctrl) {
        scope.insightCtrl = ctrl[0];

        scope.alert.renderAlert = renderAlert;

        scope.alert.search = '';
        scope.alert.filter = ['error', 'primary', 'success', 'warn'];
        scope.alert.raw = [];
        scope.alert.rendered = [];

        /** Actions */
        /**
         * @name renderAlert
         * @desc called to search the messages
         * @returns {void}
         */
        function renderAlert(): void {
            const cleaned = String(scope.alert.search || '')
                .replace(/ /g, '_')
                .toUpperCase();

            scope.alert.rendered = scope.alert.raw.filter(
                (m: { color: string; text: string; open: boolean }) => {
                    if (scope.alert.filter.length > 0) {
                        if (scope.alert.filter.indexOf(m.color) === -1) {
                            return false;
                        }
                    }

                    if (
                        cleaned &&
                        m.text.toUpperCase().indexOf(cleaned) === -1
                    ) {
                        return false;
                    }

                    return true;
                }
            );
        }

        /** Updates */
        /**
         * @name updateMessages
         * @param update the messages
         */
        function updateMessages(): void {
            const messages =
                semossCoreService.alert.get(scope.insightCtrl.insightID) || [];

            scope.alert.raw = messages.map(
                (m: { color: string; text: string }) => {
                    return {
                        color: m.color,
                        text: m.text || '',
                        open: true,
                    };
                }
            );

            renderAlert();
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize(): void {
            let alertListener: () => void;

            // register listeners
            alertListener = semossCoreService.on('alert', updateMessages);

            scope.$on('$destroy', function () {
                alertListener();
            });

            updateMessages();
        }

        initialize();
    }
}
