export default angular
    .module('smss-style.tab-group', [])
    .directive('smssTabGroup', smssTabGroup);

import './smss-tab-group.scss';

function smssTabGroup() {
    smssTabGroupLink.$inject = ['scope', 'ele', 'attrs'];

    return {
        restrict: 'EA',
        template: `
        <div class="smss-tab-group" ng-transclude>
        </div>
        `,
        replace: true,
        transclude: true,
        link: smssTabGroupLink,
    };

    function smssTabGroupLink(scope) {
        /**
         * @name initialize
         * @desc called when the directive is loaded
         * @returns {void}
         */
        function initialize() {}

        initialize();
    }
}
