'use strict';

import * as echarts from 'echarts';
import StackHelper from '@/widget-resources/js/echarts/stack-helper.js';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper';

export default angular
    .module('app.stack-echarts.directive', [])
    .directive('stackEcharts', stackEcharts);

stackEcharts.$inject = [
    'VIZ_COLORS',
    'semossCoreService',
    '$compile',
    'optionsService',
];

function stackEcharts(VIZ_COLORS, semossCoreService, $compile, optionsService) {
    stackChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: stackChartLink,
    };

    function stackChartLink(scope, ele, attrs, ctrl) {
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
            stackChart,
            destroyListeners;

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

            // clean up
            scope.$on('$destroy', destroy);

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
                eChartsConfig.barWidth = getStackedBarWidth(
                    uiOptions.editBarWidth,
                    eChartsConfig.numberOfDataSeries
                );
                mergedArr.push(eChartsConfig);
            }

            eChartsConfig = EchartsHelper.mergeCharts(mergedArr);
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            paint();
        }

        /**
         * @name getStackedBarWidth
         * @desc sets the Stacked bar with
         * @param {object} param - object of whether or not to use default width (yes or no) and stacked bar width
         * @param {integer} numberOfDataSeries The number of data series on our stacked bar chart
         * @returns {string} customized stacked bar width
         */
        function getStackedBarWidth(param, numberOfDataSeries) {
            if (numberOfDataSeries === 0) {
                return 'null';
            }
            var maxBarWidth = (
                    100 / numberOfDataSeries -
                    Math.min(1, numberOfDataSeries - 1)
                ).toFixed(2),
                barWidth;

            if (
                param &&
                param.defaultWidth !== 'Yes' &&
                Math.abs(param.barWidth) <= maxBarWidth
            ) {
                barWidth = param.barWidth + '%';
            } else if (
                param &&
                param.defaultWidth !== 'Yes' &&
                Math.abs(param.barWidth) > maxBarWidth
            ) {
                barWidth = maxBarWidth + '%';
                scope.widgetCtrl.alert(
                    'warn',
                    'Bar width currently cannot be greater than ' +
                        maxBarWidth +
                        '%! Setting bar width to ' +
                        maxBarWidth +
                        '%.'
                );
            } else {
                barWidth = 'null';
            }

            return barWidth;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            var option = {},
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

            if (stackChart) {
                stackChart.clear();
                stackChart.dispose();
            }

            stackChart = echarts.init(ele[0].firstElementChild);

            option = StackHelper.getVizOptions(
                eChartsConfig,
                stackChart,
                uiOptions,
                scope,
                $compile
            );

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(stackChart, option);

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
            stackChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                });
            });
            stackChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                stackChart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: eChartsConfig.echartsMode,
                    },
                });
            }

            if (eChartsConfig.options.rotateAxis) {
                stackChart.flipped = true;
            } else {
                stackChart.flipped = false;
            }

            if (
                eChartsConfig.currentMode === 'defaultMode' ||
                eChartsConfig.currentMode === 'polygonBrushMode'
            ) {
                EchartsHelper.initializeBrush(stackChart, {
                    // xLabels: eChartsConfig.options.rotateAxis ? eChartsConfig.yAxisConfig[0].data.reverse() : eChartsConfig.xAxisConfig[0].data,
                    xLabels: getLabels(),
                    legendLabels: eChartsConfig.legendLabels,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    type: eChartsConfig.options.seriesFlipped
                        ? 'flippedSeriesLine'
                        : 'stack',
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                    repaint: paint,
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    stackChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                    }
                );
            }

            stackChart.on('dataZoom', () =>
                EchartsHelper.setDataZoom(
                    stackChart,
                    optionsService,
                    scope.widgetCtrl.widgetId
                )
            );

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
            var mode = scope.widgetCtrl.getMode('selected'),
                layerIndex = 0;
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(mode);
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
            if (stackChart) {
                stackChart.resize();
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
