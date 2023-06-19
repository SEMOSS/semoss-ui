'use strict';

export default angular
    .module('app.graph-unfreeze.directive', [])
    .directive('graphUnfreeze', graphUnfreeze);

graphUnfreeze.$inject = [];

function graphUnfreeze() {
    graphUnfreezeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: graphUnfreezeLink,
    };

    function graphUnfreezeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.setState('graph-standard.graphLockToggle', false);
            scope.widgetCtrl.emit('update-tool', {
                fn: 'toggleLayout',
                args: [],
            });
        }

        initialize();
    }
}
