'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

export default angular
    .module('app.waterfall-echarts.directive', [])
    .directive('waterfallEcharts', waterfallEcharts);

waterfallEcharts.$inject = ['semossCoreService'];

function waterfallEcharts(semossCoreService) {
    waterfallChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        priority: 300,
        link: waterfallChartLink,
    };

    function waterfallChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];
        var dataTypes,
            /** ************* Main Event Listeners ************************/
            resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            removeBrushListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            waterfallChart,
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
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                ),
                uiOptions;

            uiOptions = angular.extend(sharedTools, individualTools);
            uiOptions.colorByValue = colorBy;
            uiOptions.rotateAxis = sharedTools.rotateAxis;
            getDataTypes(keys, uiOptions);

            eChartsConfig = {};
            eChartsConfig.uiOptions = uiOptions;
            eChartsConfig.data = formatData(
                data,
                keys,
                uiOptions.highlight,
                colorBy
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
            eChartsConfig.groupByInfo = groupByInfo;
            eChartsConfig.keys = keys;

            // check how many x axis values we have, if over limit we will activate zoom if it has not been set
            if (typeof uiOptions.toggleZoomXEnabled !== 'boolean') {
                if (eChartsConfig.data.xLabels.length > 50) {
                    uiOptions.toggleZoomX = true;
                } else {
                    uiOptions.toggleZoomX = false;
                }
            } else if (typeof uiOptions.toggleZoomXEnabled === 'boolean') {
                uiOptions.toggleZoomX = uiOptions.toggleZoomXEnabled;
            }

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
         * @name getDataTypes
         * @desc gets the data formatting options for each dimension
         * @param {Object} keys - object of data keys
         * @param {object} options - uiOptions
         * @returns {void}
         */
        function getDataTypes(keys, options) {
            dataTypes = {
                startType: '',
                startName: '',
                labelType: '',
                labelName: '',
            };
            let k, i, j, formatType, formatDimension;

            for (k = 0; k < keys.length; k++) {
                if (keys[k].model === 'start') {
                    dataTypes.startType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.startName = keys[k].alias;
                }
                if (keys[k].model === 'label') {
                    dataTypes.labelType = visualizationUniversal.mapFormatOpts(
                        keys[k]
                    );
                    dataTypes.labelName = keys[k].alias;
                }
                if (keys[k].model === 'tooltip') {
                    dataTypes[keys[k].alias] = [];
                    formatType = visualizationUniversal.mapFormatOpts(keys[k]);
                    dataTypes[keys[k].alias].push(formatType);
                    if (options.formatDataValues) {
                        for (
                            j = 0;
                            j < options.formatDataValues.formats.length;
                            j++
                        ) {
                            formatType = options.formatDataValues.formats[j];
                            if (keys[k].alias === formatType.dimension) {
                                dataTypes[formatType.dimension] = [];
                                dataTypes[formatType.dimension].push(
                                    formatType
                                );
                            }
                        }
                    }
                }
            }

            if (options.formatDataValues) {
                for (i = 0; i < options.formatDataValues.formats.length; i++) {
                    formatDimension =
                        options.formatDataValues.formats[i].dimension;
                    if (formatDimension === dataTypes.startName) {
                        dataTypes.startType =
                            options.formatDataValues.formats[i];
                    }
                    if (formatDimension === dataTypes.labelName) {
                        dataTypes.labelType =
                            options.formatDataValues.formats[i];
                    }
                }
            }
        }

        /**
         * @name formatData
         * @desc format data for echarts
         * @param {object} data semoss data
         * @param {object} keys semoss keys
         * @param {object} highlight uiOptions.highlight
         * @param {object} colorBy color by value rule set
         * @returns {obj} formatted data
         */
        function formatData(data, keys, highlight, colorBy) {
            var i,
                labelIdx,
                startIdx,
                endIdx,
                tooltipIdx = [];
            eChartsConfig.tooltipDimensions = [];

            for (i = 0; i < keys.length; i++) {
                if (keys[i].model === 'start') {
                    startIdx = data.headers.indexOf(keys[i].alias);
                } else if (keys[i].model === 'end') {
                    endIdx = data.headers.indexOf(keys[i].alias);
                } else if (keys[i].model === 'label') {
                    eChartsConfig.xAxisDimension = keys[i].alias;
                    labelIdx = data.headers.indexOf(keys[i].alias);
                } else if (keys[i].model === 'tooltip') {
                    eChartsConfig.tooltipDimensions.push(keys[i].alias);
                    tooltipIdx.push(data.headers.indexOf(keys[i].alias));
                }
            }
            return getChartValues(
                data,
                labelIdx,
                startIdx,
                endIdx,
                tooltipIdx,
                highlight,
                colorBy
            );
        }

        /**
         * @name getChartValues
         * @desc format data for echarts
         * @param {object} data semoss data
         * @param {num} labelIdx data index of label dimension
         * @param {num} startIdx data index of start dimension
         * @param {num} endIdx data index of end dimension
         * @param {array} tooltipIdx data indices of tooltip dimensions
         * @param {object} highlight uiOptions.highlight
         * @param {object} colorBy color by value rule set
         * @returns {obj} formatteddata
         */
        function getChartValues(
            data,
            labelIdx,
            startIdx,
            endIdx,
            tooltipIdx,
            highlight,
            colorBy
        ) {
            var echartsData = {},
                adjustedValues,
                positiveColor = '#76B7B2',
                negativeColor = '#E15759',
                i;

            echartsData.xLabels = [];
            echartsData.startValues = []; // must be less than end value
            echartsData.height = []; // equals end value - start value

            if (Array.isArray(eChartsConfig.uiOptions.waterfallColor)) {
                positiveColor =
                    eChartsConfig.uiOptions.waterfallColor[0] || '#76B7B2';
                negativeColor =
                    eChartsConfig.uiOptions.waterfallColor[1] || '#E15759';
            }

            for (i = 0; i < data.values.length; i++) {
                echartsData.xLabels.push(data.values[i][labelIdx]);
                adjustedValues = getStartEndValues(
                    data.values[i],
                    labelIdx,
                    startIdx,
                    endIdx,
                    tooltipIdx,
                    positiveColor,
                    negativeColor
                );
                echartsData.startValues.push(adjustedValues.start);
                adjustedValues.height = configureDataStyling(
                    adjustedValues.height,
                    data.values[i][labelIdx],
                    highlight,
                    colorBy
                );
                echartsData.height.push(adjustedValues.height);
            }

            return echartsData;
        }

        /**
         * @name getStartEndValues
         * @desc determine the correct start value and height value for a bar
         * @param {num} data start value
         * @param {num} labelIdx data index of label dimension
         * @param {num} startIdx data index of start dimension
         * @param {num} endIdx data index of end dimension
         * @param {array} tooltipIdx data indices of tooltip dimensions
         * @param {string} positiveColor hex value of positive bar
         * @param {string} negativeColor hex value of negative bar
         * @returns {obj} start and height value
         */
        function getStartEndValues(
            data,
            labelIdx,
            startIdx,
            endIdx,
            tooltipIdx,
            positiveColor,
            negativeColor
        ) {
            var values = {
                    start: {},
                    height: {
                        tooltip: {},
                    },
                },
                i;

            for (i = 0; i < tooltipIdx.length; i++) {
                values.height.tooltip[eChartsConfig.tooltipDimensions[i]] =
                    data[tooltipIdx[i]];
            }

            if (data[startIdx] < data[endIdx]) {
                values.start.value = data[startIdx];
                values.height.value = data[endIdx] - data[startIdx];
                values.height.itemStyle = {
                    color: positiveColor,
                };
                values.height.positive = true;
            } else {
                values.start.value = data[endIdx];
                values.height.value = data[startIdx] - data[endIdx];
                values.height.itemStyle = {
                    color: negativeColor,
                };
                values.height.positive = false;
                values.height.test = true;
            }

            return values;
        }

        /**
         * @name configureDataStyling
         * @param {object} dataObj data object to style
         * @param {object} dataLabel individual data object
         * @param {object} highlight uiOptions.highlight
         * @param {number} colorBy index of the data to highlight
         * @desc builds the data values objects for series
         * @return {array} array of data values objects
         */
        function configureDataStyling(dataObj, dataLabel, highlight, colorBy) {
            var finalDataObj = dataObj,
                prop;

            if (highlight) {
                // check all properties in our highlight data
                for (prop in highlight.data) {
                    if (highlight.data.hasOwnProperty(prop)) {
                        // if x-axis label is equal to the property we are
                        if (eChartsConfig.xAxisDimension === prop) {
                            highlight.data[prop].forEach(function (
                                hiliteValue
                            ) {
                                if (dataLabel === hiliteValue) {
                                    if (
                                        finalDataObj.hasOwnProperty('itemStyle')
                                    ) {
                                        finalDataObj.itemStyle.borderColor =
                                            '#000';
                                        finalDataObj.itemStyle.borderWidth = 2;
                                    } else {
                                        finalDataObj.itemStyle = {
                                            borderColor: '#000',
                                            borderWidth: 2,
                                        };
                                    }
                                }
                            });
                        }
                    }
                }
            }

            // Color by Value
            if (colorBy && colorBy.length > 0) {
                colorBy.forEach(function (rule) {
                    if (eChartsConfig.xAxisDimension === rule.colorOn) {
                        rule.valuesToColor.forEach(function (name) {
                            if (dataLabel === name) {
                                if (finalDataObj.hasOwnProperty('itemStyle')) {
                                    finalDataObj.itemStyle.color = rule.color;
                                } else {
                                    finalDataObj.itemStyle = {
                                        color: rule.color,
                                    };
                                }
                            }
                        });
                    }
                });
            }

            return finalDataObj;
        }

        function paint() {
            var option,
                xAxis,
                yAxis,
                label,
                grid,
                dataZoom,
                backgroundColorStyle,
                temp;

            if (waterfallChart) {
                waterfallChart.clear();
                waterfallChart.dispose();
            }

            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            waterfallChart = echarts.init(ele[0].firstElementChild);

            xAxis = setXAxis(eChartsConfig.uiOptions);
            yAxis = setYAxis(eChartsConfig.uiOptions);
            grid = setGrid(
                eChartsConfig.uiOptions.toggleZoomX,
                eChartsConfig.uiOptions.toggleZoomY
            );
            label = setLabel(
                eChartsConfig.uiOptions.displayValues,
                eChartsConfig.uiOptions.customizeBarLabel,
                eChartsConfig.uiOptions.valueLabel
            );
            dataZoom = setDataZoom(
                eChartsConfig.uiOptions.toggleZoomX,
                eChartsConfig.uiOptions.toggleZoomY,
                eChartsConfig.uiOptions.dataZoom
            );
            backgroundColorStyle = getBackgroundColorStyle(
                eChartsConfig.uiOptions.watermark
            );

            if (eChartsConfig.uiOptions.rotateAxis) {
                temp = yAxis;
                yAxis = xAxis;
                xAxis = temp;
            }

            option = {
                tooltip: {
                    show: eChartsConfig.uiOptions.showTooltips,
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow',
                        shadowStyle: {
                            color:
                                eChartsConfig.uiOptions.axis.pointer.shadowStyle
                                    .backgroundColor || '#000000',
                            opacity:
                                eChartsConfig.uiOptions.axis.pointer.shadowStyle
                                    .opacity || 0.05,
                        },
                    },
                    formatter: function (params) {
                        var tar = params[1],
                            sign = tar.data.positive ? '(+) ' : '(-) ',
                            tooltipText = '',
                            tooltipType,
                            dim;

                        tooltipText +=
                            visualizationUniversal.formatValue(
                                tar.name,
                                dataTypes.labelType
                            ) +
                            '<br/>' +
                            tar.marker +
                            tar.seriesName +
                            ' : ' +
                            sign +
                            visualizationUniversal.formatValue(
                                tar.value,
                                dataTypes.startType
                            );

                        if (tar.data.hasOwnProperty('tooltip')) {
                            for (dim in tar.data.tooltip) {
                                if (tar.data.tooltip.hasOwnProperty(dim)) {
                                    tooltipType = dataTypes[dim][0];
                                    tooltipText +=
                                        '<br>' +
                                        cleanValue(dim) +
                                        ': ' +
                                        visualizationUniversal.formatValue(
                                            tar.data.tooltip[dim],
                                            tooltipType
                                        );
                                }
                            }
                        }

                        return tooltipText;
                    },
                    backgroundColor:
                        eChartsConfig.uiOptions.tooltip.backgroundColor ||
                        '#FFFFFF',
                    borderWidth:
                        parseFloat(
                            eChartsConfig.uiOptions.tooltip.borderWidth
                        ) || 0,
                    borderColor:
                        eChartsConfig.uiOptions.tooltip.borderColor || '',
                    textStyle: {
                        color:
                            eChartsConfig.uiOptions.tooltip.fontColor ||
                            '#000000',
                        fontFamily:
                            eChartsConfig.uiOptions.tooltip.fontFamily ||
                            'Inter',
                        fontSize:
                            parseFloat(
                                eChartsConfig.uiOptions.tooltip.fontSize
                            ) || 12,
                    },
                },
                legend: {
                    data: 'Change',
                    // show: eChartsConfig.showLegend,
                    type: 'scroll',
                    orient: 'horizontal',
                    left: 'left',
                    pageButtonPosition: 'start',
                    formatter: function (value) {
                        return value.replace(/_/g, ' ');
                    },
                },
                toolbox: {
                    show: false,
                    left: '2',
                    bottom: '5',
                    orient: 'vertical',
                    feature: {
                        brush: {
                            type: ['rect'],
                            title: {
                                rect: 'Brush',
                                polygon: 'Polygon Brush',
                            },
                        },
                    },
                    iconStyle: {
                        emphasis: {
                            textPosition: 'right',
                            textAlign: 'left',
                        },
                    },
                },
                brush: {
                    brushStyle: {
                        borderWidth: 1,
                        color: 'rgba(120,140,180,0.15)',
                        borderColor: 'rgba(120,140,180,0.35)',
                    },
                },
                dataZoom: dataZoom,
                grid: {
                    left: '4%',
                    right: grid.right || '40px',
                    bottom: grid.bottom || '55px',
                    containLabel: true,
                },
                xAxis: xAxis,
                yAxis: yAxis,
                series: [
                    {
                        name: 'Start',
                        type: 'bar',
                        stack: 'waterfall',
                        itemStyle: {
                            normal: {
                                barBorderColor: 'rgba(0,0,0,0)',
                                color: 'rgba(0,0,0,0)',
                            },
                            emphasis: {
                                opacity: 0,
                            },
                        },
                        z: 1,
                        data: eChartsConfig.data.startValues,
                    },
                    {
                        name: 'Change',
                        type: 'bar',
                        stack: 'waterfall',
                        label: label,
                        data: eChartsConfig.data.height,
                    },
                ],
            };

            if (backgroundColorStyle) {
                option.backgroundColor = backgroundColorStyle;
            }

            option.textStyle = {
                fontFamily: 'Inter',
            };

            EchartsHelper.setOption(waterfallChart, option);

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
         * @name setXAxis
         * @desc defines settings for x-axis
         * @param {object} uiOptions - chart options
         * @returns {array} - array of x-axis settings
         */
        function setXAxis(uiOptions) {
            var settings = uiOptions.editXAxis,
                grid = uiOptions.editGrid.x,
                flipAxis = uiOptions.rotateAxis,
                axis = uiOptions.axis,
                fontSize = parseFloat(uiOptions.fontSize) || 12,
                fontColor = uiOptions.fontColor || 'black',
                xAxisConfig = [],
                axisTitle,
                showAxisValues,
                nameGap = 25,
                showAxisLine,
                showAxisTicks;

            if (settings) {
                if (settings.title.show) {
                    axisTitle = settings.title.name;
                } else {
                    axisTitle = null;
                }
                showAxisValues = settings.values;
                nameGap = settings.nameGap;
                showAxisLine = settings.line;
                showAxisTicks = settings.line ? settings.showTicks : false;
            } else {
                axisTitle = eChartsConfig.xAxisDimension;
                showAxisValues = true;
                showAxisLine = true;
                showAxisTicks = false;
            }

            xAxisConfig.push({
                type: 'category',
                data: eChartsConfig.data.xLabels,
                axisTick: {
                    show: showAxisTicks,
                    alignWithLabel: true,
                    lineStyle: {
                        color: axis.borderColor,
                        width: parseFloat(axis.borderWidth),
                    },
                },
                splitLine: {
                    show: grid,
                    lineStyle: eChartsConfig.uiOptions.grid,
                },
                axisLabel: {
                    show: showAxisValues,
                    rotate: settings.rotate || 0,
                    formatter: function (value) {
                        return EchartsHelper.formatLabel(
                            value,
                            settings.format,
                            dataTypes.labelType
                        );
                    },
                    fontWeight: parseInt(axis.label.fontWeight, 10) || 400,
                    fontSize: parseFloat(axis.label.fontSize) || fontSize,
                    fontFamily: axis.label.fontFamily || 'Inter',
                    color: axis.label.fontColor || fontColor,
                },
                name: axisTitle,
                nameLocation: 'center',
                nameGap: nameGap,
                nameTextStyle: {
                    fontWeight: parseInt(axis.name.fontWeight, 10) || 400,
                    fontSize: parseFloat(axis.name.fontSize) || fontSize,
                    fontFamily: axis.name.fontFamily || 'Inter',
                    color: axis.name.fontColor || fontColor,
                },
                gridIndex: 0,
                axisLine: {
                    show: showAxisLine,
                    lineStyle: {
                        color: axis.borderColor,
                        width: parseFloat(axis.borderWidth),
                    },
                },
            });

            if (flipAxis) {
                xAxisConfig[0].nameLocation = 'end';
                xAxisConfig[0].nameGap = 15;
            }

            return xAxisConfig;
        }

        /**
         * @name setYAxis
         * @desc sets configuration of y-axis (min, max, and inverse bool)
         * @param {object} uiOptions - chart options
         * @returns {Array} - array of object of y-axis configuration
         */
        function setYAxis(uiOptions) {
            var settings = uiOptions.editYAxis,
                grid = uiOptions.editGrid.yWaterfall,
                reverse = uiOptions.yReversed,
                flipAxis = uiOptions.rotateAxis,
                axis = uiOptions.axis,
                fontSize = parseFloat(uiOptions.fontSize) || 12,
                fontColor = uiOptions.fontColor || 'black',
                yAxis,
                axisTitle,
                showAxisValues,
                showAxisLine,
                showAxisTicks,
                nameGap = 15,
                yMin = null,
                yMax = null;

            if (settings) {
                if (settings.title.show) {
                    axisTitle = settings.title.name;
                } else {
                    axisTitle = '';
                }
                showAxisValues = settings.values;
                showAxisLine = settings.line;
                showAxisTicks = settings.line ? settings.showTicks : false;
                nameGap = settings.nameGap;
                if (settings.min.show) {
                    yMin = settings.min.value;
                }
                if (settings.max.show) {
                    yMax = settings.max.value;
                }
            } else {
                axisTitle = '';
                showAxisValues = true;
                showAxisLine = true;
                showAxisTicks = false;
            }

            yAxis = [
                {
                    min: yMin || null,
                    max: yMax || null,
                    name: axisTitle,
                    nameTextStyle: {
                        fontWeight: parseInt(axis.name.fontWeight, 10) || 400,
                        fontSize: parseFloat(axis.name.fontSize) || fontSize,
                        fontFamily: axis.name.fontFamily || 'Inter',
                        color: axis.name.fontColor || fontColor,
                    },
                    nameGap: nameGap,
                    inverse: reverse,
                    gridIndex: 0,
                    type: 'value',
                    splitLine: {
                        show: grid,
                        lineStyle: eChartsConfig.uiOptions.grid,
                    },
                    axisLabel: {
                        show: showAxisValues,
                        formatter: function (value) {
                            return EchartsHelper.formatLabel(
                                value,
                                settings.format,
                                dataTypes.startType
                            );
                        },
                        fontWeight: parseInt(axis.label.fontWeight, 10) || 400,
                        fontSize: parseFloat(axis.label.fontSize) || fontSize,
                        fontFamily: axis.label.fontFamily || 'Inter',
                        color: axis.label.fontColor || fontColor,
                    },
                    axisLine: {
                        show: showAxisLine,
                        lineStyle: {
                            color: axis.borderColor,
                            width: parseFloat(axis.borderWidth),
                        },
                    },
                    axisTick: {
                        show: showAxisTicks,
                        lineStyle: {
                            color: axis.borderColor,
                            width: parseFloat(axis.borderWidth),
                        },
                    },
                },
            ];

            if (flipAxis) {
                yAxis[0].nameLocation = 'center';
                yAxis[0].nameGap = 25;
            } else if (reverse) {
                yAxis[0].nameLocation = 'start';
            } else {
                yAxis[0].nameLocation = 'end';
            }

            // TODO Use nameTestStyle.align: 'left' instead of padding - align not working correctly
            if (axisTitle) {
                if (
                    axisTitle.length > 10 &&
                    (axisTitle.length < 15) & !flipAxis
                ) {
                    yAxis[0].nameTextStyle.padding = [
                        0,
                        0,
                        0,
                        (axisTitle.length * 10) / 4,
                    ];
                } else if (axisTitle.length >= 15) {
                    yAxis[0].nameTextStyle.padding = [
                        0,
                        0,
                        0,
                        (axisTitle.length * 10) / 2,
                    ];
                }
            }

            return yAxis;
        }

        /**
         * @name setGrid
         * @desc sets grid dimensions based on whether or not datazoom is present
         * @param {bool} showX - boolean to show x zoom or not
         * @param {bool} showY - boolean to show y zoom or not
         * @returns {obj} - object of grid dimensions
         */
        function setGrid(showX, showY) {
            var grid = {
                top: 60,
                right: 45,
                bottom: 45,
                left: 40,
                containLabel: true,
            };

            if (showX) {
                grid.bottom += 15;
            }

            if (showY) {
                grid.right += 15;
            }

            if (
                eChartsConfig.groupByInfo &&
                eChartsConfig.groupByInfo.viewType === 'Individual Instance'
            ) {
                grid.bottom += 40;
            }

            return grid;
        }

        /**
         * @name setLabel
         * @desc sets the label configuration
         * @param {bool} displayValues - uiOptions.displayValues
         * @param {object} customizeValues - uiOptions.customizeBarValues
         * @param {object} fontOptions uiOptions.valueLabel
         * @returns {obj} - object of label configurations
         */
        function setLabel(displayValues, customizeValues, fontOptions) {
            if (customizeValues.showLabel === 'Yes') {
                return {
                    normal: {
                        show: displayValues,
                        color: fontOptions.fontColor,
                        formatter: function (obj) {
                            return visualizationUniversal.formatValue(
                                obj.value,
                                dataTypes.startType
                            );
                        },
                        position: customizeValues.position || 'top',
                        rotate: customizeValues.rotate || 0,
                        align: getAlignment(customizeValues.align) || 'center',
                        verticalAlign: 'middle',
                        fontFamily: fontOptions.fontFamily || 'sans-serif',
                        fontSize: fontOptions.fontSize || 12,
                        fontWeight: fontOptions.fontWeight || 'normal',
                    },
                };
            }
            return {
                normal: {
                    show: displayValues,
                    color: fontOptions.fontColor,
                    formatter: function (obj) {
                        return visualizationUniversal.formatValue(
                            obj.value,
                            dataTypes.startType
                        );
                    },
                    position: 'inside',
                    fontFamily: fontOptions.fontFamily || 'sans-serif',
                    fontSize: fontOptions.fontSize || 12,
                    fontWeight: fontOptions.fontWeight || 'normal',
                },
            };
        }

        /**
         * @name getAlignment
         * @desc sets the custom label alignment
         * @param {string} param - user selected alignment
         * @returns {string} customized alignment
         */
        function getAlignment(param) {
            if (param === 'left') {
                return 'right';
            } else if (param === 'right') {
                return 'left';
            }
            return 'center';
        }

        /**
         * @name setDataZoom
         * @desc toggles Data Zoom feature
         * @param {bool} showX - boolean to show x zoom or not
         * @param {bool} showY - boolean to show y zoom or not
         * @param {object} style - datazoom style
         * @returns {Array} - array of objects defining Data Zoom settings
         */
        function setDataZoom(showX, showY, style) {
            var dataZoom = [],
                xSlider,
                ySlider,
                xInside,
                yInside,
                xAxisIndex = 0,
                yAxisIndex = 0,
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

            if (showX) {
                xSlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        xAxisIndex: xAxisIndex,
                        bottom: '16px',
                        filterMode: 'empty',
                        showDetail: false,
                        height: 20,
                    },
                    zoomStyle
                );
                xInside = {
                    type: 'inside',
                    xAxisIndex: xAxisIndex,
                    filterMode: 'empty',
                };
                dataZoom.push(xSlider, xInside);
            }
            if (showY) {
                ySlider = Object.assign(
                    {
                        type: 'slider',
                        show: true,
                        yAxisIndex: yAxisIndex,
                        right: '16px',
                        filterMode: 'empty',
                        showDetail: false,
                        width: 20,
                    },
                    zoomStyle
                );
                yInside = {
                    type: 'inside',
                    yAxisIndex: yAxisIndex,
                    filterMode: 'empty',
                };
                dataZoom.push(ySlider, yInside);
            }

            return dataZoom;
        }

        /**
         * @name getBackgroundColorStyle
         * @desc customize the background style of the canvas
         * @param {string} watermark - string of the watermark text
         * @returns {Object} - canvas details
         */
        function getBackgroundColorStyle(watermark) {
            if (/\S/.test(watermark)) {
                return {
                    type: 'pattern',
                    image: paintWaterMark(watermark),
                    repeat: 'repeat',
                };
            }

            return false;
        }

        /**
         * @name paintWaterMark
         * @desc paints a custom watermark on the viz
         * @param {string} watermark - string of the watermark text
         * @returns {Object} - canvas details
         */
        function paintWaterMark(watermark) {
            var canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            canvas.width = canvas.height = 100;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.08;
            ctx.font = '20px Microsoft Yahei';
            ctx.translate(50, 50);
            ctx.rotate(-Math.PI / 4);
            if (watermark) {
                ctx.fillText(watermark, 0, 0);
            }
            return canvas;
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
            waterfallChart.on('contextmenu', function (e) {
                scope.visualizationCtrl.setContextMenuDataFromClick(e, {
                    name: [eChartsConfig.xAxisDimension],
                });
            });
            waterfallChart._dom.addEventListener(
                'contextmenu',
                scope.visualizationCtrl.openContextMenu
            );

            if (eChartsConfig.echartsMode) {
                waterfallChart.dispatchAction({
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
                EchartsHelper.initializeBrush(waterfallChart, {
                    xLabels: getLabels(),
                    legendLabels: eChartsConfig.xAxisDimension,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    pictorial: false,
                    repaint: paint,
                    openContextMenu: scope.visualizationCtrl.openContextMenu,
                    setContextMenuDataFromBrush:
                        scope.visualizationCtrl.setContextMenuDataFromBrush,
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    waterfallChart,
                    {
                        cb: eChartsConfig.callbacks.defaultMode,
                        header: eChartsConfig.xAxisDimension,
                        getCurrentEvent: function () {
                            return scope.widgetCtrl.getEvent('currentEvent');
                        },
                    }
                );
            }

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
            // if (eChartsConfig.options.rotateAxis) {
            //     return eChartsConfig.yAxis[0].data;
            // }
            return eChartsConfig.data.xLabels;
        }

        /**
         * @name resizeViz
         * @desc call resize function
         * @returns {void}
         */
        function resizeViz() {
            waterfallChart.resize();
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
