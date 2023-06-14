export default angular
    .module('smss-style.btn', [])
    .directive('smssBtn', smssBtn);

import './smss-btn.scss';

smssBtn.$inject = ['$timeout'];

function smssBtn($timeout) {
    smssBtnLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: require('./smss-btn.directive.html'),
        replace: true,
        transclude: true,
        link: smssBtnLink,
    };

    function smssBtnLink(scope, ele, attrs) {
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
