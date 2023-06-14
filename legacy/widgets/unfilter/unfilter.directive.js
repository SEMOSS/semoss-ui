'use strict';

export default angular
    .module('app.unfilter.directive', [])
    .directive('unfilter', unfilter);

unfilter.$inject = [];

function unfilter() {
    unfilterLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: unfilterLink,
    };

    function unfilterLink(scope, ele, attrs, ctrl) {
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
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
            ]);
        }

        initialize();
    }
}
