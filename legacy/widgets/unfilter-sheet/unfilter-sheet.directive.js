'use strict';

export default angular
    .module('app.unfilter-sheet.directive', [])
    .directive('unfilterSheet', unfilterSheet);

unfilterSheet.$inject = [];

function unfilterSheet() {
    unfilterSheetLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget'],
        link: unfilterSheetLink,
    };

    function unfilterSheetLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'setPanelView',
                    components: ['dashboard-unfilter'],
                    terminal: true,
                },
            ]);

            console.warn('YO');
        }

        initialize();
    }
}
