'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import './sankey-echarts.service.js';

/**
 *
 * @name sankey-echarts
 * @desc sankey-echarts chart directive for creating and visualizing a column chart
 */

export default angular
    .module('app.sankey-echarts.directive', ['app.sankey.service'])
    .directive('sankeyEcharts', sankeyEcharts);

sankeyEcharts.$inject = ['VIZ_COLORS', 'sankeyService'];

function sankeyEcharts(VIZ_COLORS, sankeyService) {
    sankeyChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: sankeyChartLink,
    };

    function sankeyChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        // scope.visualizationCtrl = ctrl[1];

        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            eChartsConfig,
            sankeyChart,
            destroyListeners;

        /**
         * @name initialize
         * @desc creates the visualization on the chart div
         * @returns {void}
         */
        function initialize() {
            var classArray;

            resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            modeListener = scope.widgetCtrl.on('update-mode', toggleMode);

            // add scroll bar
            classArray = ele[0].firstElementChild.className.split(' ');
            if (classArray.indexOf('widget-view__scroll') === -1) {
                ele[0].firstElementChild.className += ' widget-view__scroll';
            }

            scope.$on('$destroy', destroy);

            setData();
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.Sankey'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                // TODO types support for dates?... use keys
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.Sankey'
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions = angular.extend(sharedTools, individiualTools);

            if (groupByInfo) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            eChartsConfig = {};
            eChartsConfig = sankeyService.getConfig(
                data,
                uiOptions,
                keys,
                groupByInstance,
                colorBy
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.groupByInfo = groupByInfo;
            paint(uiOptions);
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
         * @name paint
         * @param {object} uiOptions - Semoss panel ornaments
         * @desc paints the visualization
         * @returns {void}
         */
        function paint(uiOptions) {
            if (sankeyChart) {
                sankeyChart.clear();
                sankeyChart.dispose();
            }
            if (uiOptions.canvasWidth) {
                ele[0].firstElementChild.style.width =
                    uiOptions.canvasWidth + 'px';
            } else {
                ele[0].firstElementChild.style.width = '';
            }
            if (uiOptions.canvasHeight) {
                ele[0].firstElementChild.style.height =
                    uiOptions.canvasHeight + 'px';
            } else {
                ele[0].firstElementChild.style.height = '';
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            sankeyChart = echarts.init(ele[0].firstElementChild);

            var option = {},
                dataEmpty;

            if (eChartsConfig.groupByInfo && eChartsConfig.enoughDimensions) {
                dataEmpty = false;

                if (
                    eChartsConfig.groupByInfo.viewType === 'Individual Instance'
                ) {
                    option.graphic = [];
                    if (dataEmpty) {
                        option.graphic = option.graphic.concat({
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

            if (!eChartsConfig.enoughDimensions) {
                option.graphic = [
                    {
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
                                    width: 280,
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
                                    text: 'At least two label dimensions are required.',
                                    textAlign: 'center',
                                },
                            },
                        ],
                    },
                ];
            }

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }

            option.color = eChartsConfig.options.color;
            option.tooltip = {
                show: eChartsConfig.options.showTooltips,
                formatter: function (info) {
                    var returnArray = [];

                    if (info.marker) {
                        returnArray.push(cleanValue(info.marker));
                    }

                    if (info.name) {
                        returnArray.push(cleanValue(info.name));
                    }

                    if (info.value) {
                        returnArray.push(
                            '<br>Value: ' + cleanValue(info.value)
                        );
                    }

                    if (info.data.tooltip) {
                        Object.keys(info.data.tooltip).forEach(function (
                            tipKey
                        ) {
                            returnArray.push(
                                '<br>' +
                                    cleanValue(tipKey) +
                                    ': ' +
                                    cleanValue(info.data.tooltip[tipKey])
                            );
                        });
                    }

                    return returnArray.join('');
                },
                trigger: 'item',
                confine: true,
                backgroundColor:
                    eChartsConfig.options.tooltip.backgroundColor || '#FFFFFF',
                borderWidth:
                    parseFloat(eChartsConfig.options.tooltip.borderWidth) || 0,
                borderColor: eChartsConfig.options.tooltip.borderColor || '',
                textStyle: {
                    color: eChartsConfig.options.tooltip.fontColor || '#000000',
                    fontFamily:
                        eChartsConfig.options.tooltip.fontFamily || 'Inter',
                    fontSize:
                        parseFloat(eChartsConfig.options.tooltip.fontSize) ||
                        12,
                },
            };
            option.series = [
                {
                    type: 'sankey',
                    layout: 'none',
                    data: eChartsConfig.data.nodes,
                    links: eChartsConfig.data.links,
                    top: 'center',
                    height: '80%',
                    left: 'center',
                    width: '70%',
                    lineStyle: {
                        normal: {
                            curveness: 0.5,
                            color: 'source',
                        },
                    },
                    label: {
                        formatter: function (info) {
                            return typeof info.name === 'string'
                                ? info.name.replace(/_/g, ' ')
                                : info.name;
                        },
                        color:
                            uiOptions.valueLabel.fontColor ||
                            uiOptions.fontColor ||
                            '#000000',
                        fontSize:
                            parseFloat(uiOptions.valueLabel.fontSize) ||
                            uiOptions.fontSize ||
                            12,
                        fontFamily: uiOptions.valueLabel.fontFamily || 'Inter',
                        fontWeight: uiOptions.valueLabel.fontWeight || 400,
                    },
                },
            ];
            option.animation = false;
            option.dataZoom = toggleZoom(true, uiOptions.dataZoom);
            option.textStyle = {
                fontFamily: 'Inter',
            };

            if (eChartsConfig.title) {
                option.title = eChartsConfig.title;
            }

            // use configuration item and data specified to show chart
            EchartsHelper.setOption(sankeyChart, option);

            // Add event listeners
            initializeEvents();
        }

        function cleanValue(item) {
            if (typeof item === 'string') {
                return item.replace(/_/g, ' ');
            } else if (typeof item === 'number') {
                return item.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                });
            }
            return item;
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
            // sankeyChart.on('contextmenu', function (e) {
            // 	scope.visualizationCtrl.setContextMenuDataFromClick(e, {name: null});
            // });
            // sankeyChart._dom.addEventListener('contextmenu', scope.visualizationCtrl.openContextMenu);

            if (eChartsConfig.echartsMode) {
                sankeyChart._componentsMap[
                    Object.keys(sankeyChart._componentsMap)[0]
                ]._features.brush.model.iconPaths[
                    eChartsConfig.echartsMode
                ].trigger('click');
            }

            if (eChartsConfig.currentMode === 'defaultMode') {
                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    sankeyChart,
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
         * @name toggleZoom
         * @desc toggles Data Zoom feature
         * @param {bool} showZoom - boolean to show zoom or not
         * @param {object} style - zoom style
         * @returns {Array} - array of objects defining Data Zoom settings
         */
        function toggleZoom(showZoom, style) {
            var dataZoom = [],
                xSlider,
                xInside,
                ySlider,
                yInside,
                zoomStyle = {
                    backgroundColor: style.backgroundColor || 'transparent',
                    fillerColor: style.fillerColor || 'transparent',
                    borderColor: style.borderColor || '#CCCCCC',
                    dataBackground: {
                        lineStyle: {
                            color:
                                style.dataBackground.lineStyle.lineColor ||
                                'rgba(64, 160, 255, .25)',
                            width: parseFloat(
                                style.dataBackground.lineStyle.lineWidth || 1
                            ),
                            lineStyle:
                                style.dataBackground.lineStyle.lineStyle ||
                                'solid',
                        },
                        areaStyle: {
                            color:
                                style.dataBackground.areaStyle
                                    .backgroundColor ||
                                'rgba(64, 160, 255, .1)',
                            opacity:
                                style.dataBackground.areaStyle.opacity || 1,
                        },
                    },
                    selectedDataBackground: {
                        lineStyle: {
                            color:
                                style.selectedDataBackground.lineStyle
                                    .lineColor || 'rgba(64, 160, 255, 1)',
                            width:
                                parseFloat(
                                    style.selectedDataBackground.lineStyle
                                        .lineWidth
                                ) || 1,
                            lineStyle:
                                style.selectedDataBackground.lineStyle
                                    .lineStyle || 'solid',
                        },
                        areaStyle: {
                            color:
                                style.selectedDataBackground.areaStyle
                                    .backgroundColor ||
                                'rgba(64, 160, 255, .5)',
                            opacity:
                                style.selectedDataBackground.areaStyle
                                    .opacity || 1,
                        },
                    },
                    handleStyle: {
                        color: style.handle.backgroundColor || '#FFFFFF',
                        borderWidth: parseFloat(style.handle.borderWidth) || 1,
                        borderStyle: style.handle.borderStyle || 'solid',
                        borderColor: style.handle.borderColor || '#CCCCCC',
                    },
                    moveHandleStyle: {
                        color: style.moveHandle.backgroundColor || '#FFFFFF',
                        borderWidth:
                            parseFloat(style.moveHandle.borderWidth) || 1,
                        borderStyle: style.moveHandle.borderStyle || 'solid',
                        borderColor: style.moveHandle.borderColor || '#CCCCCC',
                    },
                    emphasis: {
                        moveHandleStyle: {
                            color:
                                style.selectedDataBackground.lineStyle
                                    .lineColor || 'rgba(64, 160, 255, 1)',
                        },
                        handleStyle: {
                            borderColor:
                                style.selectedDataBackground.lineStyle
                                    .lineColor || 'rgba(64, 160, 255, 1)',
                        },
                    },
                };
            if (showZoom && showZoom.toggleZoomX === 'Yes') {
                xSlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        xAxisIndex: 0,
                        top: '97%',
                        filterMode: 'empty',
                        showDetail: false,
                        // CustomStyle
                        height: 20,
                    },
                    zoomStyle
                );
                xInside = {
                    type: 'inside',
                    xAxisIndex: 0,
                    filterMode: 'empty',
                };
                dataZoom.push(xSlider, xInside);
            }
            if (showZoom && showZoom.toggleZoomY === 'Yes') {
                ySlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: 0,
                        left: '97%',
                        filterMode: 'empty',
                        showDetail: false,
                        // CustomStyle
                        width: 20,
                    },
                    zoomStyle
                );
                yInside = {
                    type: 'inside',
                    yAxisIndex: 0,
                    filterMode: 'empty',
                };
                dataZoom.push(ySlider, yInside);
            }
            return dataZoom;
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            initializeEvents();
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            sankeyChart.resize();
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
        }

        // Start Visualization Creation
        initialize();
    }
}
