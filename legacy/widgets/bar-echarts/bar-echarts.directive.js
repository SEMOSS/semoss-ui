'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';

export default angular
    .module('app.bar-echarts.directive', [])
    .directive('barEcharts', barEcharts);

barEcharts.$inject = ['VIZ_COLORS', 'semossCoreService', '$compile', 'optionsService'];

function barEcharts(VIZ_COLORS, semossCoreService, $compile, optionsService) {
    barChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: barChartLink,
    };

    function barChartLink(scope, ele, attrs, ctrl) {
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
            barChart,
            destroyListeners;

        /** **************** Destory Listener *************************/

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

                eChartsConfig = EchartsHelper.getEchartsConfig({
                    ele: ele,
                    task: tasks[taskIdx],
                    uiOptions: uiOptions,
                    colorBy: colorBy,
                    commentData: commentData,
                    selectedMode: selectedMode,
                    dataZoom: {
                        viewSize: 500,
                    },
                    tasks: tasks,
                })
                // manually syncing the toggleZoomX to the storeService because echarts-helper can automatically set zoom to true based on # of instances in the view
                semossCoreService.set(
                    'widgets.' +
                        scope.widgetCtrl.widgetId +
                        '.view.visualization.tools.shared.toggleZoomX',
                    eChartsConfig.options.toggleZoomX
                );
                eChartsConfig.barWidth = getBarWidth(
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
         * @name customizeBarWidth
         * @desc sets the bar with
         * @param {object} param - object of whether or not to use default width (yes or no) and bar width
         * @param {integer} numberOfDataSeries The number of data series on our bar chart
         * @returns {string} customized bar width
         */
        function getBarWidth(param, numberOfDataSeries) {
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

            
            if (barChart) {
                barChart.clear();
                barChart.dispose();
            }

            barChart = echarts.init(ele[0].firstElementChild);

            option = EchartsHelper.getVizOptions(
                eChartsConfig,
                barChart,
                uiOptions,
                scope,
                $compile
            );

            
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(barChart, option);


            barChart.resize();

            // Add event listeners
            initializeEvents();
        }

    /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            var pictorialBarExists = false;

            if (typeof destroyListeners === 'function') {
                destroyListeners();
            }

            if (
                eChartsConfig.options.barImage.symbol &&
                eChartsConfig.options.barImage.symbol !== 'Default (Bar)'
            ) {
                eChartsConfig.echartsMode = 'rect';
                pictorialBarExists = true;
            }


            // saving data zoom
            barChart.on('dataZoom', () =>
                EchartsHelper.setDataZoom(
                    barChart,
                    optionsService,
                    scope.widgetCtrl.widgetId,
                ),
            );
            // Context Menu
            barChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.legendLabels],
                });
            });
            barChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                barChart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: eChartsConfig.echartsMode,
                    },
                });
            }
        
            if (eChartsConfig.options.rotateAxis) {
                barChart.flipped = true;
            } else {
                barChart.flipped = false;
            }

            if (
                eChartsConfig.currentMode === 'defaultMode' ||
                eChartsConfig.currentMode === 'polygonBrushMode'
            ) {
                EchartsHelper.initializeBrush(barChart, {
                    xLabels: getLabels(),
                    yLabels: eChartsConfig.data,
                    legendLabels: eChartsConfig.legendLabels,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    repaint: paint,
                    type: eChartsConfig.options.seriesFlipped
                        ? 'flippedSeriesBar'
                        : 'bar',
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                    pictorial: pictorialBarExists,
                    chartScope: scope,
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    barChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                        chartScope: scope,
                        vizType: 'Column',
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

        // TODO move to EchartsHelper
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
         * @desc switches the mode to the new specified mode
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
            if (barChart) {
                barChart.resize();
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
