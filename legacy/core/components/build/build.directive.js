'use strict';

export default angular
    .module('app.build.directive', [])
    .directive('build', buildDirective);

buildDirective.$inject = [
    '$state',
    '$stateParams',
    '$transitions',
    'semossCoreService',
];

function buildDirective($state, $stateParams, $transitions, semossCoreService) {
    buildLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./build.directive.html'),
        link: buildLink,
        scope: {},
    };

    function buildLink(scope) {
        scope.build = {};
        scope.build.getContent = getContent;

        /**
         * @name updateApp
         * @desc called when the sheet information changes
         * @returns {void}
         */
        function updateWorkspace() {
            scope.build.appId = semossCoreService.app.get('selectedApp');
        }

        /**
         * @name getContent
         * @desc get the content to paint
         * @returns {void}
         */
        function getContent() {
            return `<insight id="build-${$stateParams.insight}" insight-i-d="${$stateParams.insight}"><workspace></workspace></insight>`;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var stateChangeListener = $transitions.onSuccess(
                {},
                updateWorkspace
            );

            scope.$on('$destroy', function () {
                stateChangeListener();
            });

            updateWorkspace();
        }

        initialize();
    }
}
