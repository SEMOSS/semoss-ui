/**
 * @name smss-toggle.directive.js
 * @desc smss-toggle field
 */
export default angular
    .module('smss-style.toggle', [])
    .directive('smssToggle', smssToggleDirective);

import './smss-toggle.scss';

smssToggleDirective.$inject = ['$timeout'];

function smssToggleDirective($timeout) {
    smssToggleLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: require('./smss-toggle.directive.html'),
        replace: true,
        transclude: true,
        scope: {
            name: '@',
            model: '=',
            required: '=',
            disabled: '=?ngDisabled',
            change: '&',
        },
        link: smssToggleLink,
    };

    function smssToggleLink(scope, ele, attrs) {
        scope.keyup = keyup;
        scope.update = update;

        /**
         * @name keyup
         * @param {event} $event - angularjs event object
         * @desc called to update the model
         * @returns {void}
         */
        function keyup($event) {
            if ($event.keyCode === 13) {
                if (!scope.disabled) {
                    scope.model = !scope.model;
                }
            }
        }

        /**
         * @name update
         * @desc called to update the model
         * @returns {void}
         */
        function update() {
            $timeout(function () {
                if (scope.change) {
                    scope.change({
                        model: scope.model,
                    });
                }
            });
        }

        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {
            if (attrs.hasOwnProperty('autofocus')) {
                $timeout(function () {
                    if (ele[0]) {
                        ele[0].focus();
                    }
                });
            }
        }

        initialize();
    }
}
