export default angular
    .module('smss-style.textarea', [])
    .directive('smssTextarea', smssTextarea);

import './smss-textarea.scss';

smssTextarea.$inject = ['$timeout'];

function smssTextarea($timeout) {
    smssTextareaLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        require: ['ngModel'],
        template: require('./smss-textarea.directive.html'),
        replace: true,
        transclude: true,
        link: smssTextareaLink,
    };

    function smssTextareaLink(scope, ele, attrs, ctrl) {
        let ngModel = ctrl[0];

        /**
         * @name keyupTextarea
         * @param {event} $event - DOM event
         * @desc key up event for the input
         * @returns {void}
         */
        function keyupTextarea($event) {
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

            ele[0].addEventListener('keyup', keyupTextarea);
        }

        initialize();
    }
}
