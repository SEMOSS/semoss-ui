'use strict';

import * as d3 from 'd3';
import '@/widget-resources/js/jvCharts/src/jv.js';
import '@/widget-resources/css/d3-charts.css';
import '@/widget-resources/js/jvCharts/src/jv.css';

export default angular
    .module('app.sunburst-standard.directive', [])
    .directive('sunburstStandard', sunburstStandard);

sunburstStandard.$inject = ['semossCoreService'];

function sunburstStandard(semossCoreService) {
    sunburstStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: sunburstStandardLink,
    };

    function sunburstStandardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** **************Get Chart Div *************************/
        scope.chartDiv = d3.select(ele[0].firstElementChild);
        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            jvModeListener,
            /** *************** jvChart Object ****************************/
            jvChart,
            /** *************** local data Object ****************************/
            jvConfig,
            transition = 0;

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            // bind listeners
            resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            jvModeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.Sunburst'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.Sunburst'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions,
                chartData = semossCoreService.visualization.getTableData(
                    data.headers,
                    data.values,
                    data.rawHeaders
                );

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;

            jvConfig = {
                type: 'sunburst',
                callbacks: scope.widgetCtrl.getEventCallbacks(),
                options: uiOptions,
                chartDiv: scope.chartDiv,
                setData: {
                    data: chartData.viewData,
                    dataTable:
                        semossCoreService.visualization.getDataTableAlign(keys),
                    dataTableKeys: keys || [],
                    colors: uiOptions.color,
                },
                comments: scope.widgetCtrl.getWidget(
                    'view.visualization.commentData'
                ),
                editOptions: scope.widgetCtrl.getWidget(
                    'view.visualization.editOptions'
                ),
                mode: scope.widgetCtrl.getMode('selected') || 'default-mode',
                currentEvent: scope.widgetCtrl.getEvent('currentEvent'),
                openContextMenu: scope.visualizationCtrl.openContextMenu,
                setContextMenuDataFromClick:
                    scope.visualizationCtrl.setContextMenuDataFromClick,
            };

            if (transition || transition === 0) {
                jvConfig.options.transitionTime = transition;
            }

            paint();
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (jvChart && typeof jvChart.destroy === 'function') {
                jvChart.destroy();
            }
            /** ********** Create and Paint JV Chart *************/
            jvChart = new jvCharts(jvConfig);
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            jvChart.toggleModes(scope.widgetCtrl.getMode('selected'));
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            jvChart.chartDiv = scope.chartDiv;
            // call paint with no transition
            jvChart.paint(0);
        }

        /**
         * @name destroy
         * @desc destroys listeners and dom elements outside of the scope
         * @returns {void}
         */
        function destroy() {
            resizeListener();
            updateTaskListener();
            updateOrnamentsListener();
            addDataListener();
            jvModeListener();
        }

        /** ********* Start Visualization Creation ***************/
        initialize();
    }
}
