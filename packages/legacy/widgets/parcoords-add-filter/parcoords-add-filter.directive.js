'use strict';

export default angular
    .module('app.parcoords-add-filter.directive', [])
    .directive('parcoordsAddFilter', parcoordsAddFilter);

parcoordsAddFilter.$inject = [];

function parcoordsAddFilter() {
    parCoordsAddFilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: parCoordsAddFilterLink,
    };

    function parCoordsAddFilterLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.emit('update-tool', {
                fn: 'drillDown',
                args: ['', '', 0],
            });
        }

        initialize();
    }
}
