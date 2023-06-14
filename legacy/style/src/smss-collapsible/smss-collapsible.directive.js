/**
 * @name smss-collapsible.directive.js
 * @desc smss-collapsible field
 */
export default angular
    .module('smss-style.collapsible', [])
    .directive('smssCollapsible', smssCollapsibleDirective);

import './smss-collapsible.scss';

smssCollapsibleDirective.$inject = ['$timeout'];

function smssCollapsibleDirective($timeout) {
    smssCollapsibleController.$inject = [];
    smssCollapsibleLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'E',
        template: require('./smss-collapsible.directive.html'),
        scope: {},
        bindToController: {
            model: '=?',
            disabled: '=?ngDisabled',
            change: '&?',
            rotated: '@?',
        },
        replace: true,
        transclude: {
            header: '?smssCollapsibleHeader',
            content: '?smssCollapsibleContent',
        },
        controllerAs: 'smssCollapsible',
        controller: smssCollapsibleController,
        link: smssCollapsibleLink,
    };

    function smssCollapsibleController() {}

    function smssCollapsibleLink(scope, ele, attrs) {
        scope.smssCollapsible.select = select;

        /**
         * @name select
         * @desc change the option
         * @returns {void}
         */
        function select() {
            // toggle it
            scope.smssCollapsible.model = !scope.smssCollapsible.model;

            // move
            $timeout(function () {
                if (scope.change) {
                    scope.change({
                        model: scope.smssCollapsible.model,
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
            scope.$on('$destroy', function () {});
        }

        initialize();
    }
}
