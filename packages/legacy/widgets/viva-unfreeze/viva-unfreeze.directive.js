'use strict';

export default angular
    .module('app.viva-unfreeze.directive', [])
    .directive('vivaUnfreeze', vivaUnfreeze);

vivaUnfreeze.$inject = [];

function vivaUnfreeze() {
    vivaUnfreezeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: vivaUnfreezeLink,
    };

    function vivaUnfreezeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.setState(
                'vivagraph-standard.graphLockToggle',
                false
            );
            scope.widgetCtrl.emit('update-tool', {
                fn: 'toggleLayout',
                args: [false],
            });
        }

        initialize();
    }
}
