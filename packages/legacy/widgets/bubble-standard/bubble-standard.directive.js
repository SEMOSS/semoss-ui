import * as d3 from 'd3';

import '@/widget-resources/js/jvCharts/src/jv.css';
import '@/widget-resources/js/jvCharts/src/jv.js';

('use strict');

/**
 * @name bubble
 * @desc directive for creating and visualizing a Bubble Chart Chart
 */

export default angular
    .module('app.bubble-standard.directive', [])
    .directive('bubbleStandard', bubbleStandard);

bubbleStandard.$inject = ['semossCoreService'];

function bubbleStandard(semossCoreService) {
    bubbleStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: bubbleStandardLink,
    };

    function bubbleStandardLink(scope, ele, attrs, ctrl) {
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
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            jvModeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            // cleanup
            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var layerIndex = 0,
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.Bubble'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.Bubble'
                ),
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                uiOptions,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                chartData = semossCoreService.visualization.getTableData(
                    data.headers,
                    data.values,
                    data.rawHeaders
                );

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;

            jvConfig = {
                type: 'bubble',
                callbacks: scope.widgetCtrl.getEventCallbacks(),
                options: uiOptions,
                chartDiv: scope.chartDiv,
                setData: {
                    data: chartData.rawData,
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
