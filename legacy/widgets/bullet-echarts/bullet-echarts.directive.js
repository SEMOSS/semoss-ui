'use strict';

import * as echarts from 'echarts';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

export default angular
    .module('app.bullet-echarts.directive', [])
    .directive('bulletEcharts', bulletEcharts);

bulletEcharts.$inject = ['VIZ_COLORS'];

function bulletEcharts(VIZ_COLORS) {
    bulletChartLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: bulletChartLink,
    };

    function bulletChartLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        /** ************* Main Event Listeners ************************/
        var dataTypes,
            resizeListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            modeListener,
            /** *************** ECharts ****************************/
            eChartsConfig,
            bulletChart,
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
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + selectedLayout
                ),
                semossAttributeObject = {},
                chartConfig = {},
                configurableOptions = {},
                uiOptions = angular.extend(sharedTools, individualTools);

            getDataTypes(keys, uiOptions);
            _constructSemossAttributeObject(semossAttributeObject);
            configurableOptions = _getConfigurableChartOptions(uiOptions);
            chartConfig = _configureVisualizationData(
                data,
                keys,
                configurableOptions
            );
            eChartsConfig = _combineChartObjectAttributes(
                semossAttributeObject,
                chartConfig,
                uiOptions
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
                valueType: '',
                valueName: '',
                labelType: '',
                labelName: '',
            };
            let k, i, j, formatType, formatDimension;

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
                if (keys[k].model !== 'facet') {
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
        }

        /**
         * @name _constructSemossAttributeObject
         * @param {Object} obj The object to be modified
         * @returns {void}
         * @desc Creates an object with the "Semoss" attributes that we need for
         *       our visual such as callbacks, comments, etc.
         */
        function _constructSemossAttributeObject(obj) {
            obj.currentMode = EchartsHelper.getCurrentMode(
                scope.widgetCtrl.getMode('selected')
            );
            obj.callbacks = scope.widgetCtrl.getEventCallbacks();
            obj.comments = scope.widgetCtrl.getWidget(
                'view.visualization.commentData'
            );
            obj.echartsMode = EchartsHelper.getEchartsMode(
                scope.widgetCtrl.getMode('selected')
            );
        }

        /**
         * @name _getConfigurableChartOptions
         * @param {Object} obj UiOptions object to pull attrs from
         * @returns {Object} Object containing the variables needed to paint our chart
         * @desc Takes in our large UiOptions object and only takes out the
         *       pieces necessary to customize and create our bullet chart so that
         *       we don't pass around UiOptions everywhere unnecessarily.
         */
        function _getConfigurableChartOptions(obj) {
            return {
                rotateAxis: obj.rotateAxis,
                toggleGrid: obj.editGrid,
                color: obj.color,
                yReversed: obj.yReversed,
                toggleZoomX: obj.toggleZoomX,
                toggleZoomY: obj.toggleZoomY,
                xAxis: obj.editXAxis,
                yAxis: obj.editYAxis,
                watermark: obj.watermark,
                showTooltips: obj.showTooltips,
                formatDataValues: obj.formatDataValues,
                fontSize: obj.fontSize,
                fontColor: obj.fontColor,
                grid: obj.grid,
                axis: obj.axis,
                tooltip: obj.tooltip,
            };
        }

        /**
         * @name _combineChartObjectAttributes
         * @param {Object} semossAttributeObject "Semoss" attrs object
         * @param {Object} chartConfig Configuration object for drawing our chart
         * @param {Object} configurableOptions Configurable options for chart customization
         * @returns {Object} eCharts object ready to be painted
         * @desc Combines our "Semoss" attributes object as well as our chartConfig for our bullet
         *       chart. We unfortunately have to also redundantly set rotateAxis on our overall
         *       eCharts object because it determines what values we pass in the setLabels function. The
         *       end result is an eCharts object ready to be painted.
         */
        function _combineChartObjectAttributes(
            semossAttributeObject,
            chartConfig,
            configurableOptions
        ) {
            var returnObj = {};

            returnObj = angular.extend(semossAttributeObject, chartConfig);
            returnObj.rotateAxis = configurableOptions.rotateAxis;

            return returnObj;
        }

        /**
         * @name _configureVisualizationData
         * @param {Object} data Raw data returned from BE for our visual
         * @param {Object} keys Raw keys object returned from BE for our visual
         * @param {Object} options Configurable options that can customize our bullet chart
         * @returns {Object} eCharts object that can be painted, althrough we combine with the "Semoss" attrs
         *                   object for logic purposes.
         * @desc Takes in our data, keys, and configurable options object to create an eCharts object
         *       that can be painted. We don't take the end result and immediately paint, however, this
         *       is because we combine this object with the "Semoss" attributes object so that what
         *       we are painting as well as our callbacks/comments are self-contained in the same obj.
         */
        function _configureVisualizationData(data, keys, options) {
            var indexHeaderMapping = _getDataTableAlign(data.headers, keys),
                xLabel = indexHeaderMapping.label.header.replace(/_/g, ' '),
                yLabel = indexHeaderMapping.value.header.replace(/_/g, ' '),
                backgroundColorStyle = _getBackgroundColorStyle(
                    options.watermark
                ),
                returnConfigObject = {
                    series: [],
                    dataZoom: [],
                },
                layerIndex = 0,
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.groupByInfo'
                );

            if (backgroundColorStyle) {
                returnConfigObject.backgroundColor = backgroundColorStyle;
            }

            _initializeGrid(returnConfigObject, groupByInfo);
            _initializeAxes(xLabel, yLabel, returnConfigObject, options);
            _getLegendLabels(returnConfigObject, keys);
            _initializeSeriesDataObjects(
                returnConfigObject,
                indexHeaderMapping,
                options,
                data.values.length
            );
            _populateSeriesDataObjects(
                returnConfigObject,
                data.values,
                indexHeaderMapping,
                options.rotateAxis
            );
            _formatTooltips(
                returnConfigObject,
                options.showTooltips,
                options.tooltip,
                options.axis.pointer
            );
            _formatToolbox(returnConfigObject);

            returnConfigObject.keys = keys;

            return returnConfigObject;
        }

        /**
         * @name getBackgroundColorStyle
         * @desc customize the background style of the canvas
         * @param {string} watermark - string of the watermark text
         * @returns {Object} - canvas details
         */
        function _getBackgroundColorStyle(watermark) {
            if (/\S/.test(watermark)) {
                return {
                    type: 'pattern',
                    image: _paintWaterMark(watermark),
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
        function _paintWaterMark(watermark) {
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
         * @name _initializeGrid
         * @param {Object} obj Object to be modified
         * @param {object} groupByInfo - facet info
         * @returns {void}
         * @desc Takes in our configurable options and creates a corresponding
         *       grid object for our eCharts object.
         */
        function _initializeGrid(obj, groupByInfo) {
            var grid = {
                top: 60,
                right: 45,
                bottom: 45,
                left: 40,
                containLabel: true,
            };

            if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
                grid.bottom += 40;
            }

            obj.grid = grid;
        }

        /**
         * @name _populateSeriesDataObjects
         * @param {Object} obj Object to be modified
         * @param {array} dataValues Raw data values array for our chart
         * @param {Object} indexHeaderMapping IndexHeaderMapping object
         * @param {boolean} rotateAxis Are our axes rotated?
         * @returns {void}
         * @desc Loops through our data values array and assigns each value to its
         *       corresponding parent object in our overall eCharts object.
         */
        function _populateSeriesDataObjects(
            obj,
            dataValues,
            indexHeaderMapping,
            rotateAxis
        ) {
            // Note - this works because this is the order our values are in our
            // config.json. Anytime that gets updated seriesMapping also needs to
            var seriesMapping = {},
                count = -1,
                axisWithLabels = rotateAxis ? 'yAxis' : 'xAxis';
            Object.keys(indexHeaderMapping).forEach(function (header) {
                count++;
                if (header !== 'label') {
                    // since label is in the series we need to correct index by 1
                    seriesMapping[header] =
                        indexHeaderMapping[header].index - 1;
                }
            });
            seriesMapping.label = count; // not actually in the obj.series, this configures labels

            dataValues.forEach(function (dv) {
                Object.keys(seriesMapping).forEach(function (seriesKey) {
                    var seriesIndex = seriesMapping[seriesKey],
                        value = dv[indexHeaderMapping[seriesKey].index];

                    if (seriesKey === 'label') {
                        value = value ? value.replace(/_/g, ' ') : value;
                        obj[axisWithLabels].data.push(value);
                    } else if (obj.series[seriesIndex]) {
                        obj.series[seriesIndex].data.push(value);
                    }
                });
            });
        }

        /**
         * @name _getLegendLabels
         * @param {Object} obj Object to be modified
         * @param {array} keysArr Array of our visuals keys
         * @returns {void}
         * @desc Function that quickly determines what keys our labels are
         *       for eventing purposes. Currently we do not allow for multi-label
         *       so this will always only return an array of 1.
         */
        function _getLegendLabels(obj, keysArr) {
            var returnArr = keysArr
                .filter(function (arrayObj) {
                    return arrayObj.model === 'label';
                })
                .map(function (arrayObj) {
                    return arrayObj.header;
                });

            obj.legendLabels = returnArr;
        }

        /**
         * @name _formatTooltips
         * @param {Object} obj Object to be modified
         * @param {bool} show uiOptions.showTooltips
         * @param {object} tooltipStyle tooltip style
         * @param {object} axisPointerStyle axis pointer style
         * @returns {void}
         * @desc Constructs the formatting for our tooltips on hover for our
         *       eCharts object.
         */
        function _formatTooltips(obj, show, tooltipStyle, axisPointerStyle) {
            obj.tooltip = {
                show: show,
                formatter: function (info) {
                    var returnArray = [],
                        tooltipName = info[0].name,
                        formatType,
                        formatDimension,
                        j;

                    if (tooltipName) {
                        returnArray.push(
                            '<b>' +
                                visualizationUniversal.formatValue(
                                    tooltipName,
                                    dataTypes.labelType
                                ) +
                                '</b>' +
                                '<br>'
                        );
                    }

                    for (j = 0; j < info.length; j++) {
                        formatDimension = info[j].seriesName.replace(/ /g, '_');
                        formatType = dataTypes[formatDimension][0];
                        if (info[j].marker) {
                            returnArray.push(info[j].marker);
                        }

                        if (info[j].seriesName) {
                            returnArray.push(
                                '' +
                                    EchartsHelper.cleanValue(
                                        info[j].seriesName
                                    ) +
                                    ': ' +
                                    visualizationUniversal.formatValue(
                                        info[j].value,
                                        formatType
                                    ) +
                                    '<br>'
                            );
                            formatType = '';
                        }
                    }
                    return returnArray.join('');
                },
                axisPointer: {
                    type: 'shadow',
                    shadowStyle: {
                        color:
                            axisPointerStyle.shadowStyle.backgroundColor ||
                            '#000000',
                        opacity: axisPointerStyle.shadowStyle.opacity || 0.05,
                    },
                },
                confine: true,
                trigger: 'axis',
                backgroundColor: tooltipStyle.backgroundColor || '#FFFFFF',
                borderWidth: parseFloat(tooltipStyle.borderWidth) || 0,
                borderColor: tooltipStyle.borderColor || '',
                textStyle: {
                    color: tooltipStyle.fontColor || '#000000',
                    fontFamily: tooltipStyle.fontFamily || 'Inter',
                    fontSize: parseFloat(tooltipStyle.fontSize) || 12,
                },
            };

            obj.brush = {
                toolbox: ['rect'],
            };
        }

        /**
         * @name _formatToolbox
         * @param {Object} obj Object to be modified
         * @returns {void}
         * @desc Initializes our toolbox to rectangular brushing, this is
         *       necessary for brush eventing.
         */
        function _formatToolbox(obj) {
            obj.brush = {
                toolbox: ['rect'],
            };

            obj.toolbox = {
                show: false,
            };
        }

        /**
         * @name _initializeAxes
         * @param {string} xLabel x-axis title
         * @param {string} yLabel y-axis title
         * @param {Object} obj Object to be modified
         * @param {Object} options Configurable object that contains custom attrs
         * @returns {void}
         * @desc Initializes/creates the x and y-axis parent objects for our
         *       eCharts object.
         */
        function _initializeAxes(xLabel, yLabel, obj, options) {
            if (options.rotateAxis) {
                obj.yAxis = _configureXAxis(xLabel, options);
                obj.xAxis = _configureYAxis(yLabel, options);
            } else {
                obj.xAxis = _configureXAxis(xLabel, options);
                obj.yAxis = _configureYAxis(yLabel, options);
            }
        }

        /**
         * @name _configureXAxis
         * @param {string} xLabel x-axis title
         * @param {Object} configurableOptions Configurable options object
         * @returns {void}
         * @desc Creates the x-axis object for our overall eCharts object.
         */
        function _configureXAxis(xLabel, configurableOptions) {
            var axisTitle,
                showAxisValues,
                nameGap = 25,
                nameLocation = 'center',
                xAxisConfig,
                showAxisLine,
                showAxisTicks,
                lineStyle = {
                    color: configurableOptions.axis.borderColor,
                    width: parseFloat(configurableOptions.axis.borderWidth),
                };

            if (configurableOptions.xAxis) {
                if (configurableOptions.xAxis.title.show) {
                    axisTitle = configurableOptions.xAxis.title.name;
                } else {
                    axisTitle = null;
                }
                nameGap = configurableOptions.xAxis.nameGap;
                showAxisValues = configurableOptions.xAxis.values;
                showAxisLine = configurableOptions.xAxis.line;
                showAxisTicks = configurableOptions.xAxis.line
                    ? configurableOptions.xAxis.showTicks
                    : false;
            } else {
                axisTitle = xLabel;
                showAxisValues = true;
                showAxisLine = true;
                showAxisTicks = false;
            }

            xAxisConfig = {
                name: axisTitle,
                nameGap: nameGap,
                nameLocation: nameLocation,
                nameTextStyle: {
                    fontWeight:
                        parseInt(
                            configurableOptions.axis.name.fontWeight,
                            10
                        ) || 400,
                    fontSize:
                        parseFloat(configurableOptions.axis.name.fontSize) ||
                        configurableOptions.fontSize,
                    fontFamily:
                        configurableOptions.axis.name.fontFamily || 'Inter',
                    color:
                        configurableOptions.axis.name.fontColor ||
                        configurableOptions.fontColor,
                },
                axisTick: {
                    show: showAxisTicks,
                    alignWithLabel: true,
                    lineStyle: lineStyle,
                },
                axisLabel: {
                    show: showAxisValues,
                    rotate: configurableOptions.xAxis.rotate || 0,
                    formatter: function (value) {
                        return EchartsHelper.formatLabel(
                            value,
                            configurableOptions.xAxis.format,
                            dataTypes.labelType
                        );
                    },
                    fontWeight:
                        parseInt(
                            configurableOptions.axis.label.fontWeight,
                            10
                        ) || 400,
                    fontSize:
                        parseFloat(configurableOptions.axis.label.fontSize) ||
                        configurableOptions.fontSize,
                    fontFamily:
                        configurableOptions.axis.label.fontFamily || 'Inter',
                    color:
                        configurableOptions.axis.label.fontColor ||
                        configurableOptions.fontColor,
                },
                splitLine: {
                    show: configurableOptions.toggleGrid.x,
                    lineStyle: configurableOptions.grid,
                },
                type: 'category',
                data: [],
                axisLine: {
                    show: showAxisLine,
                    lineStyle: lineStyle,
                },
            };

            if (configurableOptions.rotateAxis) {
                xAxisConfig.nameLocation = 'end';
                if (
                    axisTitle &&
                    axisTitle.length > 10 &&
                    axisTitle.length < 15
                ) {
                    xAxisConfig.nameTextStyle.padding = [
                        0,
                        0,
                        0,
                        (axisTitle.length * 10) / 4,
                    ];
                } else if (axisTitle && axisTitle.length >= 15) {
                    xAxisConfig.nameTextStyle.padding = [
                        0,
                        0,
                        0,
                        (axisTitle.length * 10) / 2,
                    ];
                }
            }

            return xAxisConfig;
        }

        /**
         * @name _configureYAxis
         * @param {string} yLabel y-axis title
         * @param {Object} configurableOptions Configurable options object
         * @returns {void}
         * @desc Creates the y-axis object for our overall eCharts object.
         */
        function _configureYAxis(yLabel, configurableOptions) {
            var axisTitle,
                yAxis,
                showAxisValues,
                nameGap = 25,
                nameLocation = 'end',
                showAxisLine,
                showAxisTicks,
                lineStyle = {
                    color: configurableOptions.axis.borderColor,
                    width: parseFloat(configurableOptions.axis.borderWidth),
                };

            if (configurableOptions.yAxis) {
                if (configurableOptions.yAxis.title.show) {
                    axisTitle = configurableOptions.yAxis.title.name;
                } else {
                    axisTitle = null;
                }
                showAxisValues = configurableOptions.yAxis.values;
                nameGap = configurableOptions.yAxis.nameGap;
                showAxisLine = configurableOptions.yAxis.line;
                showAxisTicks = configurableOptions.yAxis.line
                    ? configurableOptions.yAxis.showTicks
                    : false;
            } else {
                axisTitle = yLabel;
                showAxisValues = true;
                showAxisLine = true;
                showAxisTicks = false;
            }

            if (configurableOptions.rotateAxis) {
                nameLocation = 'center';
            }

            yAxis = {
                name: axisTitle,
                nameGap: nameGap,
                nameLocation: nameLocation,
                nameTextStyle: {
                    fontWeight:
                        parseInt(
                            configurableOptions.axis.name.fontWeight,
                            10
                        ) || 400,
                    fontSize:
                        parseFloat(configurableOptions.axis.name.fontSize) ||
                        configurableOptions.fontSize,
                    fontFamily:
                        configurableOptions.axis.name.fontFamily || 'Inter',
                    color:
                        configurableOptions.axis.name.fontColor ||
                        configurableOptions.fontColor,
                },
                axisLabel: {
                    show: showAxisValues,
                    formatter: function (value) {
                        return EchartsHelper.formatLabel(
                            value,
                            configurableOptions.yAxis.format,
                            dataTypes.valueType
                        );
                    },
                    fontWeight:
                        parseInt(
                            configurableOptions.axis.label.fontWeight,
                            10
                        ) || 400,
                    fontSize:
                        parseFloat(configurableOptions.axis.label.fontSize) ||
                        configurableOptions.fontSize,
                    fontFamily:
                        configurableOptions.axis.label.fontFamily || 'Inter',
                    color:
                        configurableOptions.axis.label.fontColor ||
                        configurableOptions.fontColor,
                },
                axisLine: {
                    show: showAxisLine,
                    lineStyle: lineStyle,
                },
                axisTick: {
                    show: showAxisTicks,
                    lineStyle: lineStyle,
                },
                inverse: configurableOptions.yReversed,
                type: 'value',
                splitLine: {
                    show: configurableOptions.toggleGrid.y,
                    lineStyle: configurableOptions.grid,
                },
            };

            if (axisTitle && !configurableOptions.rotateAxis) {
                if (axisTitle.length > 10 && axisTitle.length < 15) {
                    yAxis.nameTextStyle.padding = [
                        0,
                        0,
                        0,
                        (axisTitle.length * 10) / 4,
                    ];
                } else if (axisTitle.length >= 15) {
                    yAxis.nameTextStyle.padding = [
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
         * @name _initializeSeriesDataObjects
         * @param {Object} obj Object to be modified
         * @param {Object} indexHeaderMapping Index to header mapping object
         * @param {Object} options Configurable options object
         * @param {integer} numDataValues Number of objects in our raw data array
         * @returns {void}
         * @desc Creates our initial series array for our eCharts object.
         */
        function _initializeSeriesDataObjects(
            obj,
            indexHeaderMapping,
            options,
            numDataValues
        ) {
            _pushValueObject(
                obj,
                indexHeaderMapping.value.header,
                options.color[0]
            );
            _pushTargetObject(
                obj,
                indexHeaderMapping,
                options.color[1],
                options.rotateAxis,
                numDataValues
            );
            if (indexHeaderMapping.badMarker) {
                _pushDataQualityObject(
                    obj,
                    indexHeaderMapping.badMarker.header,
                    options.color[2]
                );
            }
            if (indexHeaderMapping.satisfactoryMarker) {
                _pushDataQualityObject(
                    obj,
                    indexHeaderMapping.satisfactoryMarker.header,
                    options.color[3]
                );
            }
            if (indexHeaderMapping.excellentMarker) {
                _pushDataQualityObject(
                    obj,
                    indexHeaderMapping.excellentMarker.header,
                    options.color[4]
                );
            }
        }

        /**
         * @name _pushDataQualityObject
         * @param {Object} obj Object to be modified
         * @param {string} header Label for this data quality object
         * @param {string} color Color that will be painted for this object
         * @returns {void}
         * @desc Creates a data quality object in our series array. Note - these
         *       have to be pushed in the correct order (bad | satis | excellent).
         */
        function _pushDataQualityObject(obj, header, color) {
            var tempObj = {
                name: header,
                type: 'bar',
                barGap: '-150%',
                barWidth: '50%',
                itemStyle: {
                    normal: {
                        color: color,
                    },
                },
                stack: 'total',
                data: [],
                animation: false,
            };

            obj.series.push(tempObj);
        }

        /**
         * @name _pushTargetObject
         * @param {Object} obj Object to be modified
         * @param {string} indexHeaderMapping Label for our Target Value object
         * @param {string} color Color that our target value will appear as
         * @param {boolean} rotate Should we rotate our target value?
         * @param {integer} numDataValues Number of objects in our raw data array
         * @returns {void}
         * @desc Creates the target value object for our series array in
         *       our overall eCharts object.
         */
        function _pushTargetObject(
            obj,
            indexHeaderMapping,
            color,
            rotate,
            numDataValues
        ) {
            var symbolOffset = rotate ? [0, '-19%'] : ['-19%', 0],
                tempObj;

            if (Object.keys(indexHeaderMapping).length === 3) {
                symbolOffset = rotate ? [0, 0] : [0, 0];
            }
            tempObj = {
                name: indexHeaderMapping.targetValue.header,
                type: 'scatter',
                symbol: 'rect',
                silent: true,
                itemStyle: {
                    normal: {
                        color: color,
                    },
                },
                symbolSize: function () {
                    // Unfortunately this can't be broken out into a function, we set the length and width of each
                    // scatter based off a percentage of the chart container found experimentally
                    var chartHeight =
                            ele[0].firstElementChild.getBoundingClientRect()
                                .height,
                        chartWidth =
                            ele[0].firstElementChild.getBoundingClientRect()
                                .width;

                    if (rotate) {
                        return [
                            0.0045 * chartWidth,
                            (0.3 * chartHeight) / numDataValues,
                        ];
                    }

                    return [
                        (0.3 * chartWidth) / numDataValues,
                        0.008 * chartHeight,
                    ];
                },
                symbolOffset: symbolOffset,
                z: 20,
                data: [],
                animation: false,
            };

            obj.series.push(tempObj);
        }

        /**
         * @name _pushValueObject
         * @param {Object} obj Object to be modified
         * @param {string} header Label for our actual value object
         * @param {string} color Color that our actual value will appear as
         * @returns {void}
         * @desc Creates the actual value object for our series array in
         *       our overall eCharts object.
         */
        function _pushValueObject(obj, header, color) {
            var tempObj = {
                name: header.replace(/_/g, ' '),
                type: 'bar',
                barWidth: '25%',
                z: 10,
                itemStyle: {
                    normal: {
                        color: color,
                    },
                },
                data: [],
                animation: false,
            };

            obj.series.push(tempObj);
        }

        /**
         * @name _getDataTableAlign
         * @param {array} headers Array of the headers for our visual
         * @param {array} keys Array of the keys for our visual
         * @returns {Object} Data table align/index to header mapping for our visual
         * @desc Create our indexHeaderMapping object that is used throughout this directive.
         *       This object essentially tells you for a given data model (value, label, etc.),
         *       what is its index in our raw data array and what header is it going by.
         */
        function _getDataTableAlign(headers, keys) {
            var i,
                indexMapping = {};

            for (i = 0; i < keys.length; i++) {
                indexMapping[keys[i].model] = {
                    index: headers.indexOf(keys[i].alias),
                    header: keys[i].alias,
                };
            }

            return indexMapping;
        }

        /**
         * @name paint
         * @desc paints the visualization
         * @returns {void}
         */
        function paint() {
            if (bulletChart) {
                bulletChart.clear();
                bulletChart.dispose();
            }
            // TODO also think abou abstracting some of these options to variables for more customizabilty from uiOptions
            bulletChart = echarts.init(ele[0].firstElementChild);
            eChartsConfig.textStyle = {
                fontFamily: 'Inter',
            };
            // use configuration item and data specified to show chart
            EchartsHelper.setOption(bulletChart, eChartsConfig);

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

            if (eChartsConfig.echartsMode) {
                bulletChart.dispatchAction({
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
                EchartsHelper.initializeBrush(bulletChart, {
                    xLabels: getLabels(),
                    legendLabels: eChartsConfig.legendLabels,
                    brushCb: eChartsConfig.callbacks.defaultMode.onBrush,
                    repaint: paint,
                });

                destroyListeners = EchartsHelper.initializeClickHoverKeyEvents(
                    bulletChart,
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
            if (eChartsConfig.rotateAxis && eChartsConfig.yAxis.data) {
                return eChartsConfig.yAxis.data;
            }

            return eChartsConfig.xAxis.data;
        }

        /**
         * @name toggleMode
         * @desc switches the jv mode to the new specified mode
         * @returns {void}
         */
        function toggleMode() {
            var layerIndex = 0;
            if (eChartsConfig) {
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
        }

        /**
         * @name resizeViz
         * @desc reruns the jv paint function
         * @returns {void}
         */
        function resizeViz() {
            bulletChart.resize();
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
