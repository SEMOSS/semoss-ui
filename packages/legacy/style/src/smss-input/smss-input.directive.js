export default angular
    .module('smss-style.input', [])
    .directive('smssInput', smssInput);

import './smss-input.scss';

smssInput.$inject = ['$timeout'];

function smssInput($timeout) {
    smssInputLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        require: ['ngModel'],
        template: require('./smss-input.directive.html'),
        replace: true,
        transclude: true,
        link: smssInputLink,
    };

    function smssInputLink(scope, ele, attrs, ctrl) {
        let ngModel = ctrl[0];

        /**
         * @name keyupInput
         * @param {event} $event - DOM event
         * @desc key up event for the input
         * @returns {void}
         */
        function keyupInput($event) {
            if ($event.keyCode === 27) {
                // esc
                ngModel.$setViewValue('');
                ngModel.$render();
            }
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

            ele[0].addEventListener('keyup', keyupInput);
        }

        initialize();
    }
}
