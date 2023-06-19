/**
 * @name smss-alert.directive.js
 * @desc smss-alert field
 */
export default angular
    .module('smss-style.alert', [])
    .directive('smssAlert', smssAlertDirective);

import './smss-alert.scss';

smssAlertDirective.$inject = [];

function smssAlertDirective() {
    smssAlertCtrl.$inject = [];
    smssAlertLink.$inject = ['scope', 'ele', 'attrs', 'ctrl', 'transclude'];

    return {
        restrict: 'E',
        require: ['ngModel'],
        template: require('./smss-alert.directive.html'),
        scope: {},
        bindToController: {
            color: '=',
            inline: '=?',
        },
        transclude: {
            label: '?smssAlertLabel',
        },
        controller: smssAlertCtrl,
        controllerAs: 'smssAlert',
        link: smssAlertLink,
    };

    function smssAlertCtrl() {}

    function smssAlertLink(scope, ele, attrs, ctrl, transclude) {
        let ngModel = ctrl[0];

        scope.smssAlert.close = close;

        /**
         * @name close
         * @desc called to close the model
         * @returns {void}
         */
        function close() {
            ngModel.$setViewValue(false);
            ngModel.$render();
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('closeable')) {
                scope.smssAlert.closeable = !(attrs.closeable === 'false');
            } else {
                scope.smssAlert.closeable = true;
            }

            if (attrs.hasOwnProperty('inline')) {
                scope.smssAlert.inline = !(attrs.inline === 'false');
                if (scope.smssAlert.inline) {
                    scope.smssAlert.closeable = false;
                }
            }

            // add listener
            ngModel.$render = function () {
                scope.smssAlert.model = ngModel.$viewValue;
            };
        }

        initialize();
    }
}
