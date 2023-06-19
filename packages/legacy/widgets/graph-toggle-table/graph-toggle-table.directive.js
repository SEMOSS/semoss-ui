'use strict';

export default angular
    .module('app.graph-toggle-table.directive', [])
    .directive('graphToggleTable', graphToggleTable);

graphToggleTable.$inject = [];

function graphToggleTable() {
    graphToggleTableLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: graphToggleTableLink,
    };

    function graphToggleTableLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var tableToggle = scope.widgetCtrl.getState(
                'graph-standard.propertiesTableToggle'
            );
            scope.widgetCtrl.setState(
                'graph-standard.toggleTable',
                !tableToggle
            );
            scope.widgetCtrl.emit('update-tool', {
                fn: 'toggleTable',
                args: [],
            });
        }

        initialize();
    }
}
