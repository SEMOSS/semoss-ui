export default angular
    .module('smss-style.tab', [])
    .directive('smssTab', smssTab);

import './smss-tab.scss';

smssTab.$inject = ['$timeout'];

function smssTab($timeout) {
    smssTabLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: `
        <button class="smss-tab"
            tabindex="0">
            <span ng-transclude></span>
        </button>
        `,
        replace: true,
        transclude: true,
        link: smssTabLink,
    };

    function smssTabLink(scope, ele, attrs) {
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
