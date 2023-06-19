'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import StackHelper from '@/widget-resources/js/echarts/stack-helper.js';

/**
 *
 * @name multi-line-echarts
 * @desc multi-line-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.multi-line-echarts.directive', [])
    .directive('multiLineEcharts', multiLineEcharts);

multiLineEcharts.$inject = ['VIZ_COLORS', 'semossCoreService', '$compile'];

function multiLineEcharts(VIZ_COLORS, semossCoreService, $compile) {
    multiLineChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: multiLineChartLink,
    };

    function multiLineChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            removeBrushListener,
            /** *************** ECharts ****************************/
            eChartsConfig = {},
            multiLineChart,
            destroyListeners;

        /** **************** Destory Listener *************************/
        scope.$on('$destroy', destroy);

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
            modeListener = scope.widgetCtrl.on('update-mode', toggleMode);
            removeBrushListener = scope.widgetCtrl.on('remove-brush', paint);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                tasks = scope.widgetCtrl.getWidget('view.visualization.tasks'),
                uiOptions,
                taskIdx,
                commentData = scope.widgetCtrl.getWidget(
                    'view.visualization.commentData'
                ),
                selectedMode = scope.widgetCtrl.getMode('selected'),
                mergedArr = [];

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;
            uiOptions.rotateAxis = sharedTools.rotateAxis;

            //Get legend properties
            uiOptions.legend = sharedTools.legend;
            for (taskIdx = 0; taskIdx < tasks.length; taskIdx++) {
                eChartsConfig = {};
                if (!tasks[taskIdx]) {
                    continue;
                }

                if (
                    scope.widgetCtrl.layerVizList.indexOf(
                        tasks[taskIdx].layout
                    ) === -1 &&
                    taskIdx > 0
                ) {
                    scope.widgetCtrl.alert(
                        'warn',
                        tasks[taskIdx].layout +
                            ' visualization cannot be layered.'
                    );
                    continue;
                }

                eChartsConfig = StackHelper.getEchartsConfig({
                    ele: ele,
                    task: tasks[taskIdx],
                    uiOptions: uiOptions,
                    colorBy: colorBy,
                    commentData: commentData,
                    selectedMode: selectedMode,
                    dataZoom: {
                        viewSize: 50,
                    },
                    tasks: tasks,
                });

                // manually syncing the toggleZoomX to the storeService because echarts-helper can automatically set zoom to true based on # of instances in the view
                semossCoreService.set(
                    'widgets.' +
                        scope.widgetCtrl.widgetId +
                        '.view.visualization.tools.shared.toggleZoomX',
                    eChartsConfig.options.toggleZoomX
                );

                mergedArr.push(eChartsConfig);
            }
            eChartsConfig = EchartsHelper.mergeCharts(mergedArr);
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            paint();
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            var option,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                uiOptions = angular.extend(sharedTools, individualTools);

            if (multiLineChart) {
                multiLineChart.clear();
                multiLineChart.dispose();
            }
            multiLineChart = echarts.init(ele[0].firstElementChild);
            option = StackHelper.getVizOptions(
                eChartsConfig,
                multiLineChart,
                uiOptions,
                scope,
                $compile
            );
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(multiLineChart, option);
            // Add event listeners
            initializeEvents();
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            if (typeof destroyListeners === 'function') {
                destroyListeners();
            }

            // Context Menu
            multiLineChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                });
            });
            multiLineChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                multiLineChart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: eChartsConfig.echartsMode,
                    },
                });
                // multiLineChart._componentsMap[Object.keys(multiLineChart._componentsMap)[0]]._features.brush.model.iconPaths[eChartsConfig.echartsMode].trigger('click');
            }

            if (eChartsConfig.options.rotateAxis) {
                multiLineChart.flipped = true;
            } else {
                multiLineChart.flipped = false;
            }

            if (
                eChartsConfig.currentMode === 'defaultMode' ||
                eChartsConfig.currentMode === 'polygonBrushMode'
            ) {
                EchartsHelper.initializeBrush(multiLineChart, {
                    // xLabels: eChartsConfig.options.rotateAxis ? eChartsConfig.yAxisConfig[0].data.reverse() : eChartsConfig.xAxisConfig[0].data,
                    xLabels: getLabels(),
                    legendLabels: eChartsConfig.legendLabels,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    type: eChartsConfig.options.seriesFlipped
                        ? 'flippedSeriesLine'
                        : 'line',
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                    repaint: paint,
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    multiLineChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                    }
                );
            }

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });
        }

        /**
         * @name getLabels
         * @desc determines labels to pass into eChartsService for Brush
         * @returns {Array} - array of objects defining Data Zoom settings
         */
        function getLabels() {
            return EchartsHelper.getLabels(eChartsConfig);
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            var layerIndex = 0;
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.groupByInfo = scope.widgetCtrl.getWidget(
                'view.visualization.tasks.' + layerIndex + '.groupByInfo'
            );

            initializeEvents();
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            if (multiLineChart) {
                multiLineChart.resize();
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'All Instances'
            ) {
                eChartsConfig.size = EchartsHelper.determineResize(
                    ele,
                    eChartsConfig
                );
                paint();
            }
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
            modeListener();
            removeBrushListener();
        }

        // Start Visualization Creation
        initialize();
    }
}
