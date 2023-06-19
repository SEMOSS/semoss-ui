/**
 * @name smss-radio.directive.js
 * @desc smss-radio field
 */
export default angular
    .module('smss-style.radio', [])
    .directive('smssRadio', smssRadio);

import './smss-radio.scss';

smssRadio.$inject = ['$timeout'];

function smssRadio($timeout) {
    smssRadioLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: require('./smss-radio.directive.html'),
        replace: true,
        transclude: true,
        scope: {
            name: '@',
            value: '@',
            model: '=',
            required: '=',
            disabled: '=?ngDisabled',
            change: '&',
        },
        link: smssRadioLink,
    };

    function smssRadioLink(scope, ele, attrs) {
        scope.keyup = keyup;
        scope.update = update;

        /**
         * @name keyup
         * @param {event} $event - angularjs event object
         * @param {*} value - value to use
         * @desc called to update the model
         * @returns {void}
         */
        function keyup($event, value) {
            if ($event.keyCode === 13) {
                if (!scope.disabled) {
                    scope.model = value;
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
                    let focusEle = ele[0].querySelector('#smss-radio__input');
                    if (focusEle) {
                        focusEle.focus();
                    }
                });
            }

            scope.$on('$destroy', function () {});
        }

        initialize();
    }
}
