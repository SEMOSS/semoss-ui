/* eslint-disable no-loop-func */
'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import './graph-echarts.service.js';

/**
 *
 * @name graph-echarts
 * @desc graph-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.graph-echarts.directive', ['app.graph-echarts.service'])
    .directive('graphEcharts', graphEcharts);

graphEcharts.$inject = ['$timeout', 'VIZ_COLORS', 'graphEchartsService'];

function graphEcharts($timeout, VIZ_COLORS, graphEchartsService) {
    graphEchartsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: graphEchartsLink,
    };

    function graphEchartsLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            graphChart,
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

            scope.$on('$destroy', function () {
                resizeListener();
                updateTaskListener();
                updateOrnamentsListener();
                addDataListener();
                modeListener();
            });

            setData();
        }

        /** Data */
        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var active = scope.widgetCtrl.getWidget('active'),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.' + active + '.tools.individual.Graph'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                dataTypes,
                uiOptions;

            uiOptions = angular.extend(sharedTools, individiualTools);
            uiOptions.colorByValue = colorBy;
            dataTypes = getDataTypes(keys, uiOptions);

            if (groupByInfo) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            // set the config
            eChartsConfig = graphEchartsService.getConfig(
                data,
                uiOptions,
                groupByInstance
            );
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.groupByInfo = groupByInfo;
            eChartsConfig.dataTypes = dataTypes;

            paint();
        }
        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options- uiOptions
         */

        function getDataTypes(keys, options) {
            let k,
                i,
                formatDimension,
                dataTypes = [],
                dataTypeObj = {
                    dimensionType: '',
                    dimensionName: '',
                };
            if (keys) {
                for (k = 0; k < keys.length; k++) {
                    if (keys[k].model === 'start' || keys[k].model === 'end') {
                        dataTypeObj.dimensionType =
                            visualizationUniversal.mapFormatOpts(keys[k]);
                        dataTypeObj.dimensionName = keys[k].alias;
                    }
                    if (options.formatDataValues) {
                        for (
                            i = 0;
                            i < options.formatDataValues.formats.length;
                            i++
                        ) {
                            if (
                                options.formatDataValues.formats[i].type ===
                                    'Accounting' &&
                                !options.formatDataValues.formats[i].prepend
                                    .length
                            ) {
                                options.formatDataValues.formats[i].prepend =
                                    '$';
                            }
                            formatDimension =
                                options.formatDataValues.formats[i].dimension;
                            if (formatDimension === dataTypeObj.dimensionName) {
                                dataTypeObj.dimensionType =
                                    options.formatDataValues.formats[i];
                            }
                        }
                    }
                    dataTypes.push(dataTypeObj);
                    dataTypeObj = {};
                }
            }
            return dataTypes;
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

                // // Remove any added data from brush/click
                // for (i = 0; i < data.values.length; i++) {
                //     if (data.values[i][groupByIndex] !== groupBy.uniqueInstances[instanceIdx]) {
                //         data.values.splice(i, 1);
                //         i--;
                //     }
                // }

                // for (i = 0; i < data.values.length; i++) {
                //     data.values[i].splice(groupByIndex, 1);
                // }
                returnObj.name = name;
                returnObj.data = data;
            }

            return returnObj;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (graphChart) {
                graphChart.clear();
                graphChart.dispose();
            }

            // initialize visualization
            graphChart = echarts.init(ele[0].firstElementChild);

            // add facet information
            var dataEmpty;

            if (eChartsConfig.groupByInfo) {
                dataEmpty = false;

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

            if (eChartsConfig.title && eChartsConfig.title.text) {
                eChartsConfig.title.left = eChartsConfig.title.align;
                eChartsConfig.title.textStyle = {
                    fontSize: eChartsConfig.title.fontSize || 18,
                    color: eChartsConfig.title.fontColor || '#000000',
                    fontWeight: eChartsConfig.title.fontWeight || 'normal',
                    fontFamily: eChartsConfig.title.fontFamily || 'sans-serif',
                };
            }
            eChartsConfig.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(graphChart, eChartsConfig);

            // initialize events
            initializeEvents();
        }

        /** Events */

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
            graphChart.on('contextmenu', function (e) {
                if (e.name && e.hasOwnProperty('data') && e.data.category) {
                    scope.visualizationCtrl.setContextMenuDataFromClick(
                        e.name,
                        {
                            name: [e.data.category],
                        }
                    );
                }
            });

            // Don't display traverse if a custom dblclick event exists
            // Display traverse widget on dblclick
            graphChart.on('dblclick', function (e) {
                let dblClickEvents = scope.widgetCtrl.getWidget(
                    'events.onDoubleClick'
                );

                if (dblClickEvents) {
                    return;
                }

                $timeout(function () {
                    scope.widgetCtrl.open('handle', 'traverse');
                });

                scope.widgetCtrl.emit('change-selected', {
                    selected: [
                        {
                            alias: e.data.category,
                            instances: [e.data.name],
                            legendSelected: false,
                        },
                    ],
                });
            });

            graphChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            // it is necessary to initialize comment mode so the nodes are painted
            EchartsHelper.initializeCommentMode({
                comments: eChartsConfig.comments,
                currentMode: eChartsConfig.currentMode,
                saveCb: eChartsConfig.callbacks.commentMode.onSave,
            });

            if (eChartsConfig.echartsMode) {
                graphChart.dispatchAction({
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
                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    graphChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.legendLabels,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                        vizType: 'Graph',
                    }
                );
            }
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
         * @name resizeViz
         * @param {object} payload the payload from the message
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz(payload) {
            var containerEle = ele;
            // don't resize if we're just changing the menu sizing
            if (payload && payload.src === 'widget-view') {
                // we are looking for the container size...including the space the menu occupies
                while (
                    containerEle[0].classList[0] !== 'widget-view__resizable'
                ) {
                    if (containerEle.parent()) {
                        containerEle = containerEle.parent();
                    } else {
                        containerEle = undefined;
                        console.error(
                            'cannot find the parent height and width to set for resizing graph.'
                        );
                        break;
                    }
                }

                // once we find it, we will use that size (which is the size of the panel)
                if (containerEle) {
                    graphChart.resize({
                        width: containerEle[0].clientWidth,
                        height: containerEle[0].clientHeight,
                    });
                } else {
                    graphChart.resize();
                }
                return;
            }
            graphChart.resize();
            // We repaint so that we can re-center the graph viz
            paint();
        }

        // Start Visualization Creation
        initialize();
    }
}
