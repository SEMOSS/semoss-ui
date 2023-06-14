import angular from 'angular';

import './query-struct-filter-group.scss';

export default angular
    .module('app.query-struct-filter.group', [])
    .directive('queryStructFilterGroup', queryStructFilterGroupDirective);

queryStructFilterGroupDirective.$inject = [];

function queryStructFilterGroupDirective() {
    queryStructFilterGroupCtrl.$inject = [];
    queryStructFilterGroupLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./query-struct-filter-group.directive.html'),
        scope: {},
        require: ['^queryStructFilter'],
        controller: queryStructFilterGroupCtrl,
        controllerAs: 'queryStructFilterGroup',
        bindToController: {
            root: '=',
            key: '=',
            parent: '=',
            value: '=',
            children: '=',
        },
        link: queryStructFilterGroupLink,
        replace: true,
        transclude: true,
    };

    function queryStructFilterGroupCtrl() {}

    function queryStructFilterGroupLink(scope, ele, attrs, ctrl) {
        scope.queryStructFilterCtrl = ctrl[0];

        /** Filter */
        /**
         * @name resetFilter
         * @desc reset the filter
         */
        function resetFilter() {
            // noop
        }

        /** Comparator */

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            resetFilter();
        }

        initialize();
    }
}
