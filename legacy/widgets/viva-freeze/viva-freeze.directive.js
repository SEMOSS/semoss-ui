'use strict';

export default angular
    .module('app.viva-freeze.directive', [])
    .directive('vivaFreeze', vivaFreeze);

vivaFreeze.$inject = [];

function vivaFreeze() {
    vivaFreezeLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: vivaFreezeLink,
    };

    function vivaFreezeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.setState(
                'vivagraph-standard.graphLockToggle',
                true
            );
            scope.widgetCtrl.emit('update-tool', {
                fn: 'toggleLayout',
                args: [true],
            });
        }

        initialize();
    }
}
