/**
 * @name smss-checkbox.directive.js
 * @desc smss-checkbox field
 */
export default angular
    .module('smss-style.checkbox', [])
    .directive('smssCheckbox', smssCheckbox);

import './smss-checkbox.scss';

smssCheckbox.$inject = ['$timeout'];

function smssCheckbox($timeout) {
    smssCheckboxLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: require('./smss-checkbox.directive.html'),
        replace: true,
        transclude: true,
        scope: {
            name: '@',
            model: '=',
            required: '=',
            disabled: '=?ngDisabled',
            change: '&',
        },
        link: smssCheckboxLink,
    };

    function smssCheckboxLink(scope, ele, attrs) {
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
                    let focusEle = ele[0].querySelector(
                        '#smss-checkbox__input'
                    );
                    if (focusEle) {
                        focusEle.focus();
                    }
                });
            }
        }

        initialize();
    }
}
