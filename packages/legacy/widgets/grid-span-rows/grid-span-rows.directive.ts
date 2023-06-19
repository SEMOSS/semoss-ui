'use strict';

/**
 * @name grid-span-rows.directive.js
 * @desc row spanning in grid viz
 */
export default angular
    .module('app.grid-span-rows.directive', [])
    .directive('gridSpanRows', gridSpanRowsDirective);

gridSpanRowsDirective.$inject = [];

function gridSpanRowsDirective() {
    gridSpanRowsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        link: gridSpanRowsLink,
        scope: {},
    };

    function gridSpanRowsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /**
         * @name initialize
         * @returns {void}
         */
        function initialize() {
            // 'query': 'Panel(<SMSS_PANEL_ID>)|AddPanelOrnaments({"tools":{"shared":{"gridSpanRows":<!SMSS_SHARED_STATE.gridSpanRows>}}});Panel(<SMSS_PANEL_ID>)|RetrievePanelOrnaments("tools.shared.gridSpanRows");',
            let pixelComponents,
                keyIdx: number,
                sortCols: any = [];
            const gridSpan = !scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.gridSpanRows'
                ),
                sharedTools = {
                    gridSpanRows: gridSpan,
                },
                active = scope.widgetCtrl.getWidget('active'),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.0.keys.Grid'
                );

            // toggle the row spanning boolean
            pixelComponents = [
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: sharedTools,
                            },
                        },
                    ],
                    terminal: true,
                },
            ];

            // TODO if user already has sorts, should we override their sorts...?
            if (gridSpan) {
                // before here, we need to run another pixel to get the order of columns to set in the select
                // then we do a setPanelSort to sort all of the columns;
                for (keyIdx = 0; keyIdx < keys.length; keyIdx++) {
                    sortCols.push({
                        alias: keys[keyIdx].alias,
                        dir: 'asc',
                    });
                }
                pixelComponents = pixelComponents.concat([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'setPanelSort',
                        components: [sortCols],
                        terminal: true,
                    },
                ]);
            } else {
                pixelComponents = pixelComponents.concat([
                    {
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'unsortPanel',
                        components: [],
                        terminal: true,
                    },
                ]);
            }

            scope.widgetCtrl.emit('execute-pixel', {
                insightID: scope.widgetCtrl.insightID,
                commandList: pixelComponents,
            });
        }

        initialize();
    }
}
