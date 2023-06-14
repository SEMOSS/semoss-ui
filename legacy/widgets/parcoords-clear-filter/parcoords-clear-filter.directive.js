'use strict';

export default angular
    .module('app.parcoords-clear-filter.directive', [])
    .directive('parcoordsClearFilter', parcoordsClearFilter);

parcoordsClearFilter.$inject = [];

function parcoordsClearFilter() {
    parCoordsClearFilterLink.$inject = [];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: parCoordsClearFilterLink,
    };

    function parCoordsClearFilterLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.execute([
                {
                    type: 'variable',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'unfilterFrame',
                    components: [],
                    terminal: true,
                },
                {
                    type: 'refreshInsight',
                    components: [scope.widgetCtrl.insightID],
                    terminal: true,
                },
            ]);
        }

        initialize();
    }
}
