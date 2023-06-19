'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import './boxwhisker-echarts.service.js';

export default angular
    .module('app.boxwhisker-echarts.directive', ['app.boxwhisker.service'])
    .directive('boxwhiskerEcharts', boxwhisker);

boxwhisker.$inject = ['VIZ_COLORS', 'boxwhiskerService', 'semossCoreService'];

function boxwhisker(VIZ_COLORS, boxwhiskerService, semossCoreService) {
    boxwhiskerLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: boxwhiskerLink,
    };

    function boxwhiskerLink(scope, ele, attrs, ctrl) {
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
            eChartsConfig,
            box,
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
            var layerIndex = 0,
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individual =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                uiOptions,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                );

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            uiOptions = angular.extend(sharedTools, individual);
            uiOptions.colorByValue = colorBy;

            eChartsConfig = boxwhiskerService.getConfig(
                data,
                uiOptions,
                keys,
                groupByInstance,
                groupByInfo
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.xAxisData = eChartsConfig.xAxis.data;
            eChartsConfig.keys = keys;
            eChartsConfig.groupByInfo = groupByInfo;

            // manually syncing the toggleZoomX to the storeService because echarts-helper can automatically set zoom to true based on # of instances in the view
            semossCoreService.set(
                'widgets.' +
                    scope.widgetCtrl.widgetId +
                    '.view.visualization.tools.shared.toggleZoomX',
                uiOptions.toggleZoomX
            );

            paint();
        }

        /**
         * @name formatDataForGroupBy
         * @desc formats data when Group By exists
         * @param {object} data orginial data
         * @param {object} groupBy groupBy object
         * @returns {void}
         */
        function formatDataForGroupBy(data, groupBy) {
            var formattedData = data,
                groupByIndex,
                name,
                i,
                instanceIdx,
                returnObj = {};

            if (groupBy.viewType === 'Individual Instance') {
                groupByIndex = data.headers.indexOf(groupBy.selectedDim);
                if (groupByIndex === -1) {
                    // return data;
                    groupByIndex = data.headers.length;
                }

                if (typeof groupBy.instanceIndex === 'string') {
                    instanceIdx = parseInt(groupBy.instanceIndex, 10);
                }
                // Create name for title
                name =
                    groupBy.selectedDim +
                    ' : ' +
                    groupBy.uniqueInstances[instanceIdx];
                // Remove Group By dimension from data headers and values
                formattedData.headers.splice(groupByIndex, 1);
                formattedData.rawHeaders.splice(groupByIndex, 1);

                // Remove any added data from brush/click
                for (i = 0; i < data.values.length; i++) {
                    if (
                        data.values[i][groupByIndex] !==
                        groupBy.uniqueInstances[instanceIdx]
                    ) {
                        data.values.splice(i, 1);
                        i--;
                    }
                }

                for (i = 0; i < data.values.length; i++) {
                    data.values[i].splice(groupByIndex, 1);
                }
                returnObj.name = name;
                returnObj.data = data;
            }

            return returnObj;
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            initializeEvents();
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @param {object} option the boxwhisker configuration object
         * @returns {void}
         */
        function paint() {
            if (box) {
                box.clear();
                box.dispose();
            }
            box = echarts.init(ele[0].firstElementChild);

            var i, dataEmpty;

            if (eChartsConfig.groupByInfo) {
                dataEmpty = true;
                for (i = 0; i < eChartsConfig.series.length; i++) {
                    if (eChartsConfig.series[i].data.length !== 0) {
                        dataEmpty = false;
                        break;
                    }
                }

                if (
                    eChartsConfig.groupByInfo.viewType === 'Individual Instance'
                ) {
                    eChartsConfig.graphic = [];
                    if (dataEmpty) {
                        eChartsConfig.graphic = eChartsConfig.graphic.concat({
                            id: 'textGroup',
                            type: 'group',
                            right: 'center',
                            top: 'center',
                            children: [
                                {
                                    type: 'rect',
                                    top: 'center',
                                    right: 'center',
                                    shape: {
                                        width: 200,
                                        height: 40,
                                    },
                                    style: {
                                        fill: '#fff',
                                        stroke: '#999',
                                        lineWidth: 2,
                                        shadowBlur: 8,
                                        shadowOffsetX: 3,
                                        shadowOffsetY: 3,
                                        shadowColor: 'rgba(0,0,0,0.3)',
                                    },
                                },
                                {
                                    type: 'text',
                                    right: 'center',
                                    top: 'center',
                                    style: {
                                        text: 'There is no data for this instance.',
                                        textAlign: 'center',
                                    },
                                },
                            ],
                        });
                    }
                }
            }
            eChartsConfig.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(box, eChartsConfig);
            // Add event listeners
            initializeEvents();
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @returns {void}
         */
        function initializeEvents() {
            var header = eChartsConfig.keys[0];

            if (typeof destroyListeners === 'function') {
                destroyListeners();
            }

            // Context Menu
            box.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [header.alias],
                });
            });
            box._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                box.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'brush',
                    brushOption: {
                        brushType: eChartsConfig.echartsMode,
                    },
                });
            }

            if (
                eChartsConfig.currentMode === 'defaultMode' ||
                eChartsConfig.currentMode === 'polygonBrushMode'
            ) {
                EchartsHelper.initializeBrush(box, {
                    xLabels: eChartsConfig.xAxisData,
                    legendLabels: header.alias,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    repaint: paint,
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                    type: 'box',
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    box,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: header.alias,
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
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            box.resize();
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
