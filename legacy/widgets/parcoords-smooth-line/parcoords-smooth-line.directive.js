'use strict';

export default angular
    .module('app.parcoords-smooth-line.directive', [])
    .directive('parcoordsSmoothLine', parcoordsSmoothLine);

parcoordsSmoothLine.$inject = [];

function parcoordsSmoothLine() {
    parcoordsSmoothLineLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: parcoordsSmoothLineLink,
    };

    function parcoordsSmoothLineLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.emit('update-tool', {
                fn: 'smoothLine',
                args: ['', '', 0],
            });
        }

        initialize();
    }
}
