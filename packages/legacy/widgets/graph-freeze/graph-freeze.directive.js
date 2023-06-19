'use strict';

export default angular
    .module('app.graph-freeze.directive', [])
    .directive('graphFreeze', graphFreeze);

graphFreeze.$inject = [];

function graphFreeze() {
    graphFreezeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: graphFreezeLink,
    };

    function graphFreezeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.setState('graph-standard.graphLockToggle', true);
            scope.widgetCtrl.emit('update-tool', {
                fn: 'toggleLayout',
                args: [],
            });
        }

        initialize();
    }
}
