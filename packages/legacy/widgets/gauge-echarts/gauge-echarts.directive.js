'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';
import './gauge-echarts.service.js';

export default angular
    .module('app.gauge-echarts.directive', ['app.gauge.service'])
    .directive('gaugeEcharts', gaugeEcharts);

gaugeEcharts.$inject = ['semossCoreService', 'gaugeService'];

function gaugeEcharts(semossCoreService, gaugeService) {
    gaugeChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: gaugeChartLink,
    };

    function gaugeChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        // scope.visualizationCtrl = ctrl[1];

        /** ************* Main Event Listeners ************************/
        var resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            gaugeChart,
            timeSeriesTimer,
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
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupBy = {},
                groupByInstance,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions = angular.extend(sharedTools, individiualTools);

            if (groupByInfo && groupByInfo.viewType) {
                groupBy = formatDataForGroupBy(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }

            // TODO add comments
            // comments: scope.widgetCtrl.getWidget('view.visualization.commentData'),
            eChartsConfig = gaugeService.getConfig(
                'gauge',
                data,
                uiOptions,
                semossCoreService.visualization.getDataTableAlign(keys),
                groupByInstance,
                keys
            );
            eChartsConfig.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            eChartsConfig.callbacks = scope.widgetCtrl.getEventCallbacks();
            eChartsConfig.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            eChartsConfig.groupByInfo = groupByInfo;
            eChartsConfig.dataTypes = getDataTypes(keys, uiOptions);

            paint();
        }

        /**
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options - uiOptions
         * @returns {object} datatypes
         */
        function getDataTypes(keys, options) {
            let k,
                i,
                formatDimension,
                dataTypes = {
                    valueType: '',
                    valueName: '',
                    labelType: '',
                    labelName: '',
                };

            for (k = 0; k < keys.length; k++) {
                if (keys[k].model === 'value') {
                    dataTypes.valueType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.valueName = keys[k].alias;
                }
                if (keys[k].model === 'label') {
                    dataTypes.labelType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.labelName = keys[k].alias;
                }
            }

            if (options.formatDataValues) {
                for (i = 0; i < options.formatDataValues.formats.length; i++) {
                    formatDimension =
                        options.formatDataValues.formats[i].dimension;
                    if (formatDimension === dataTypes.valueName) {
                        dataTypes.valueType =
                            options.formatDataValues.formats[i];
                    }
                    if (formatDimension === dataTypes.labelName) {
                        dataTypes.labelType =
                            options.formatDataValues.formats[i];
                    }
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
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (gaugeChart) {
                gaugeChart.clear();
                gaugeChart.dispose();
            }

            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            gaugeChart = echarts.init(ele[0].firstElementChild);

            var option = {},
                i,
                dataEmpty,
                index,
                timer,
                intDuration,
                dataTypes = eChartsConfig.dataTypes;

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType
            ) {
                dataEmpty = true;
                for (i = 0; i < eChartsConfig.data.length; i++) {
                    if (typeof eChartsConfig.data[i].value !== 'undefined') {
                        dataEmpty = false;
                        break;
                    }
                }

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

            if (eChartsConfig.backgroundColorStyle) {
                option.backgroundColor = eChartsConfig.backgroundColorStyle;
            }
            option.textStyle = {
                fontFamily: 'Inter',
            };
            option.tooltip = {
                show: eChartsConfig.options.showTooltips,
                trigger: 'item',
                confine: true,
                formatter: function (info) {
                    var returnArray = [],
                        dim,
                        i,
                        j,
                        k,
                        tooltipType,
                        cleanName,
                        formatDimension;

                    returnArray.push(
                        '<b>' +
                            cleanValue(eChartsConfig.keys.label) +
                            '</b>: ' +
                            visualizationUniversal.formatValue(
                                info.name,
                                dataTypes.labelType
                            ) +
                            '<br>',
                        '<b>' +
                            cleanValue(eChartsConfig.keys.value) +
                            '</b>: ' +
                            visualizationUniversal.formatValue(
                                info.value,
                                dataTypes.valueType
                            )
                    );

                    if (info.data.hasOwnProperty('tooltip')) {
                        for (dim in info.data.tooltip) {
                            // get primary db format type
                            if (info.data.tooltip.hasOwnProperty(dim)) {
                                for (
                                    k = 0;
                                    k < eChartsConfig.allKeys.length;
                                    k++
                                ) {
                                    cleanName = eChartsConfig.allKeys[
                                        k
                                    ].alias.replace(/_/g, ' ');
                                    if (cleanName === dim) {
                                        tooltipType =
                                            visualizationUniversal.mapFormatOpts(
                                                eChartsConfig.allKeys[k]
                                            );
                                    }
                                }
                                // if user has updated formatting rules in widget, override db format types
                                if (eChartsConfig.options.formatDataValues) {
                                    for (
                                        i = 0;
                                        i <
                                        eChartsConfig.options.formatDataValues
                                            .formats.length;
                                        i++
                                    ) {
                                        formatDimension =
                                            eChartsConfig.options
                                                .formatDataValues.formats[i]
                                                .dimension;
                                        cleanName = formatDimension.replace(
                                            /_/g,
                                            ' '
                                        );
                                        if (cleanName === dim) {
                                            tooltipType =
                                                eChartsConfig.options
                                                    .formatDataValues.formats[
                                                    i
                                                ];
                                        }
                                    }
                                }

                                if (info.data.tooltip.hasOwnProperty(dim)) {
                                    returnArray.push(
                                        '<br>' +
                                            cleanValue(dim) +
                                            ': ' +
                                            visualizationUniversal.formatValue(
                                                info.data.tooltip[dim],
                                                tooltipType
                                            )
                                    );
                                }
                            }
                        }
                    }

                    return returnArray.join('');
                },
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
                    type: 'gauge',
                    title: {
                        show: false,
                    },
                    center: ['50%', '70%'],
                    radius: '90%',
                    detail: {
                        show: false,
                    },
                    axisLabel: {
                        show: !eChartsConfig.options.toggleAxisLabels,
                        formatter: function (value) {
                            return visualizationUniversal.formatValue(
                                value,
                                dataTypes.valueType
                            );
                        },
                        color: eChartsConfig.options.axis.label.fontColor,
                        fontSize: eChartsConfig.options.axis.label.fontSize,
                        fontWeight: eChartsConfig.options.axis.label.fontWeight,
                        fontFamily: eChartsConfig.options.axis.label.fontFamily,
                    },
                    startAngle: 180,
                    endAngle: 0,
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: getGaugeColor(
                                eChartsConfig.options.gaugeColor
                            ),
                        },
                    },
                    axisTick: {
                        lineStyle: {
                            color: eChartsConfig.options.axis.borderColor,
                            width: eChartsConfig.options.axis.borderWidth,
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: eChartsConfig.options.axis.borderColor,
                            width:
                                2 *
                                parseFloat(
                                    eChartsConfig.options.axis.borderWidth
                                ),
                        },
                    },
                    data: checkTimeSeries(
                        eChartsConfig.data,
                        eChartsConfig.options
                    ),
                },
            ];

            if (eChartsConfig.options.minMax) {
                if (
                    eChartsConfig.options.minMax.min.show &&
                    typeof eChartsConfig.options.minMax.min.value !==
                        'undefined'
                ) {
                    option.series[0].min =
                        eChartsConfig.options.minMax.min.value;
                } else {
                    option.series[0].min = eChartsConfig.min;
                }
                if (
                    eChartsConfig.options.minMax.max.show &&
                    typeof eChartsConfig.options.minMax.max.value !==
                        'undefined'
                ) {
                    option.series[0].max =
                        eChartsConfig.options.minMax.max.value;
                } else {
                    option.series[0].max = eChartsConfig.max;
                }
            } else {
                option.series[0].min = eChartsConfig.min;
                option.series[0].max = eChartsConfig.max;
            }

            option.color = eChartsConfig.options.color;

            // Use this for time interval
            index = 0;
            timer;
            intDuration = 2500;

            if (eChartsConfig.data.length !== 0) {
                if (eChartsConfig.options.timeSeries) {
                    if (timeSeriesTimer) {
                        clearInterval(timeSeriesTimer);
                        timeSeriesTimer = intDuration - 10;
                    }

                    timeSeriesTimer = setInterval(function () {
                        var length = eChartsConfig.data.length;
                        option.series[0].data[0].value =
                            eChartsConfig.data[index].value;
                        if (
                            typeof eChartsConfig.data[index].name === 'string'
                        ) {
                            option.series[0].data[0].name = eChartsConfig.data[
                                index
                            ].name.replace(/_/g, ' ');
                        } else {
                            option.series[0].data[0].name =
                                eChartsConfig.data[index].name;
                        }
                        option.series[0].title = {
                            show: true,
                            offsetCenter: [0, '25%'],
                            fontStyle: 'bold',
                            fontSize: 30,
                        };
                        option.series[0].detail = {
                            show: true,
                            fontSize: 25,
                            offsetCenter: [0, '-40%'],
                            formatter: function (value) {
                                return visualizationUniversal.formatValue(
                                    value,
                                    dataTypes.valueType
                                );
                            },
                        };
                        option.series[0].min = eChartsConfig.min;
                        option.series[0].max = eChartsConfig.max;

                        EchartsHelper.setOption(gaugeChart, option);
                        index++;
                        if (index === length) {
                            index = 0;
                        }
                        length = 0;
                    }, intDuration);
                } else {
                    if (timeSeriesTimer) {
                        clearInterval(timeSeriesTimer);
                    }
                    EchartsHelper.setOption(gaugeChart, option);
                }
            }
        }

        /**
         * @name getGaugeColor
         * @desc format color of gauge axis
         * @param {array} param color array
         * @returns {array} array of color and indices
         */
        function getGaugeColor(param) {
            var i,
                colorLength = param.length,
                colorArray = [];

            for (i = 0; i < colorLength; i++) {
                colorArray.push([(i + 1) / colorLength, param[i]]);
            }

            return colorArray;
        }

        function cleanValue(item) {
            if (typeof item === 'string') {
                return item.replace(/_/g, ' ');
            } else if (typeof item === 'number') {
                if (item > 1) {
                    return item.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 1,
                    });
                }
                return item.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 3,
                });
            }
            return item;
        }

        function checkTimeSeries(data, options) {
            if (options.timeSeries) {
                return [
                    {
                        value: eChartsConfig.data[0].value,
                        name: eChartsConfig.data[0].name,
                    },
                ];
            }
            return data;
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

            if (eChartsConfig.echartsMode) {
                gaugeChart._componentsMap[
                    Object.keys(gaugeChart._componentsMap)[0]
                ]._features.brush.model.iconPaths[
                    eChartsConfig.echartsMode
                ].trigger('click');
            }

            // Context Menu
            // gaugeChart.on('contextmenu', function (e) {
            //     scope.visualizationCtrl.setContextMenuDataFromClick(e, {name: eChartsConfig.keys.label});
            // });
            // gaugeChart._dom.addEventListener('contextmenu', scope.visualizationCtrl.openContextMenu);

            if (eChartsConfig.currentMode === 'defaultMode') {
                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    gaugeChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.keys.label,
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
            gaugeChart.resize();
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
