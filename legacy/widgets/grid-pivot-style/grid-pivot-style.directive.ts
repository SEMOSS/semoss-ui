'use strict';

import angular from 'angular';

export default angular
    .module('app.grid-pivot-style.directive', [])
    .directive('gridPivotStyle', gridPivotStyleDirective);

gridPivotStyleDirective.$inject = ['VIZ_COLORS', 'semossCoreService'];

function gridPivotStyleDirective(VIZ_COLORS, semossCoreService) {
    gridPivotStyleCtrl.$inject = [];
    gridPivotStyleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        controllerAs: 'gridPivotStyle',
        bindToController: {},
        template: require('./grid-pivot-style.directive.html'),
        controller: gridPivotStyleCtrl,
        link: gridPivotStyleLink,
        require: ['^widget'],
    };

    function gridPivotStyleCtrl() {}

    function gridPivotStyleLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.gridPivotStyle.colorTheme = VIZ_COLORS.COLOR_SEMOSS;
        scope.gridPivotStyle.options = {};

        // functions
        scope.gridPivotStyle.execute = execute;
        scope.gridPivotStyle.toggleGrandTotals = toggleGrandTotals;

        /** Logic **/
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            let individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.KPI'
                    ) || {},
                sharedTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.shared'
                    ) || {},
                options;

            options = angular.extend(sharedTools, individualTools) || {};

            scope.gridPivotStyle.colorTheme = options.color;

            if (
                options.hasOwnProperty('gridPivotStyle') &&
                options.gridPivotStyle
            ) {
                scope.gridPivotStyle.options = options.gridPivotStyle;
            } else {
                scope.gridPivotStyle.options = {
                    headerColor: '#F6F6F6',
                    fontColor: '#1E1E1eE',
                    gridFullWidth: false,
                    grandTotals: true,
                    grandTotalsRows: true,
                    grandTotalsColumns: true,
                    subTotals: true,
                };
            }
        }

        /**
         * @name toggleGrandTotals
         * @desc toggles grand totals row / column totals dependencies
         * @param {boolean} allTotals - boolean whether allTotals has been toggled vs rows or columns
         * @returns {void}
         */
        function toggleGrandTotals(allTotals: boolean) {
            if (allTotals) {
                scope.gridPivotStyle.options.grandTotalsRows =
                    scope.gridPivotStyle.options.grandTotals;
                scope.gridPivotStyle.options.grandTotalsColumns =
                    scope.gridPivotStyle.options.grandTotals;
            } else {
                // when either rows or columns are off then All Totals is also off
                if (
                    !scope.gridPivotStyle.options.grandTotalsRows ||
                    !scope.gridPivotStyle.options.grandTotalsColumns
                ) {
                    scope.gridPivotStyle.options.grandTotals = false;
                }
                // if both rows and columns are on then All Totals is on
                if (
                    scope.gridPivotStyle.options.grandTotalsRows &&
                    scope.gridPivotStyle.options.grandTotalsColumns
                ) {
                    scope.gridPivotStyle.options.grandTotals = true;
                }
            }
        }

        /**
         * @name execute
         * @desc add the ornaments
         * @returns {void}
         */
        function execute() {
            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: {
                                    gridPivotStyle:
                                        scope.gridPivotStyle.options,
                                },
                            },
                        },
                    ],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateFrameListener,
                updateTaskListener,
                updateOrnamentsListener;

            // listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            updateTaskListener = scope.widgetCtrl.on('update-task', resetPanel);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                updateFrameListener();
                updateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
