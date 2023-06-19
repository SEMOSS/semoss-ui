'use strict';

import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

angular
    .module('app.heatmap.service', [])
    .factory('heatmapService', heatmapService);

heatmapService.$inject = [];

function heatmapService() {
    var dataTypes;

    function getConfig(type, data, uiOptions, keys, groupByInstance) {
        var tempDataObject,
            xAxisConfig,
            yAxisConfig,
            chartTitle = {};
        getDataTypes(keys, uiOptions);

        tempDataObject = formatData(data, keys, uiOptions.highlight);
        xAxisConfig = configureXAxis(
            tempDataObject.xAxisLabels,
            uiOptions,
            tempDataObject.xName
        );
        yAxisConfig = configureYaxis(
            tempDataObject.yAxisLabels,
            uiOptions,
            tempDataObject.yName
        );
        // Configure data for ECharts
        if (uiOptions.chartTitle && uiOptions.chartTitle.text) {
            chartTitle = {};
            chartTitle.show = true;
            chartTitle.text = uiOptions.chartTitle.text;
            chartTitle.fontSize = uiOptions.chartTitle.fontSize;
            chartTitle.fontWeight = uiOptions.chartTitle.fontWeight;
            chartTitle.fontFamily = uiOptions.chartTitle.fontFamily;
            chartTitle.fontColor = uiOptions.chartTitle.fontColor;
            chartTitle.align = uiOptions.chartTitle.align || 'left';
        }

        let legendLabelStyle = {
            color:
                uiOptions.legend.fontColor || uiOptions.fontColor || '#000000',
            fontSize:
                parseFloat(uiOptions.legend.fontSize) ||
                uiOptions.fontSize ||
                12,
            fontFamily: uiOptions.legend.fontFamily || 'Inter',
            fontWeight: uiOptions.legend.fontWeight || 400,
        };

        return {
            data: setEChartsDataSeries(type, tempDataObject, uiOptions),
            xAxisConfig: xAxisConfig,
            yAxisConfig: yAxisConfig,
            maxHeat: tempDataObject.maxHeat,
            minHeat: tempDataObject.minHeat,
            legendHeaders: tempDataObject.valuesNames,
            legendLabelStyle: legendLabelStyle,
            xName: tempDataObject.xName,
            yName: tempDataObject.yName,
            heat: tempDataObject.heat,
            tooltips: tempDataObject.tooltips,
            legendData: tempDataObject.xAxisLabels,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            groupByInstance: groupByInstance,
            keys: keys,
            options: uiOptions,
            dataTypes: dataTypes,
            title: chartTitle,
        };
    }

    /**
     * @name getDataTypes
     * @desc gets the data formatting options for each dimension
     * @param {Object} keys - object of data keys
     * @param {object} options- uiOptions
     */

    function getDataTypes(keys, options) {
        dataTypes = {
            xType: '',
            xName: '',
            heatType: '',
            heatName: '',
            yType: '',
            yName: '',
        };
        let k, i, formatDimension;

        for (k = 0; k < keys.length; k++) {
            if (keys[k].model === 'x') {
                dataTypes.xType = visualizationUniversal.mapFormatOpts(keys[k]);
                dataTypes.xName = keys[k].alias;
            }
            if (keys[k].model === 'heat') {
                dataTypes.heatType = visualizationUniversal.mapFormatOpts(
                    keys[k]
                );
                dataTypes.heatName = keys[k].alias;
            }
            if (keys[k].model === 'y') {
                dataTypes.yType = visualizationUniversal.mapFormatOpts(keys[k]);
                dataTypes.yName = keys[k].alias;
            }
        }

        if (options.formatDataValues) {
            for (i = 0; i < options.formatDataValues.formats.length; i++) {
                formatDimension = options.formatDataValues.formats[i].dimension;
                if (formatDimension === dataTypes.xName) {
                    dataTypes.xType = options.formatDataValues.formats[i];
                }
                if (formatDimension === dataTypes.heatName) {
                    dataTypes.heatType = options.formatDataValues.formats[i];
                }
                if (formatDimension === dataTypes.yName) {
                    dataTypes.yType = options.formatDataValues.formats[i];
                }
            }
        }
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Object} data - object of data in original format
     * @param {Object} keys - object of data keys
     * @param {object} highlight - highlight prop from uiOptions
     * @returns {Object} - object of data in ECharts format
     */
    function formatData(data, keys, highlight) {
        var eChartsDataObject = {},
            xAxisValues = [],
            uniqueXAxisValues = [],
            yAxisValues = [],
            uniqueYAxisValues = [],
            heatValues = [],
            heatValuesNoNulls = [],
            tooltipValues = [],
            uniqueTooltipValues = [],
            maxHeatValue,
            minHeatValue,
            dataArray = [],
            i,
            j,
            aliasArray = [],
            xIndex,
            yIndex,
            heatIndex,
            tooltipIndexes = [],
            xValue,
            yValue,
            heatValue,
            tooltipValue,
            dataObj = {},
            header,
            isHighlighted = true,
            tooltip,
            tooltips = [];

        for (j = 0; j < keys.length; j++) {
            if (keys[j].model === 'x') {
                aliasArray.push(keys[j].alias);
                eChartsDataObject.xName = keys[j].alias;
            } else if (keys[j].model === 'y') {
                aliasArray.push(keys[j].alias);
                eChartsDataObject.yName = keys[j].alias;
            } else if (keys[j].model === 'heat') {
                aliasArray.push(keys[j].alias);
                eChartsDataObject.heat = keys[j].alias;
            } else if (keys[j].model === 'tooltip') {
                tooltips.push(keys[j].alias);
            } else if (keys[j].model === 'facet') {
                aliasArray.push(keys[j].alias);
            }
        }

        heatIndex = data.headers.indexOf(eChartsDataObject.heat);
        xIndex = data.headers.indexOf(eChartsDataObject.xName);
        yIndex = data.headers.indexOf(eChartsDataObject.yName);

        eChartsDataObject.tooltips = [];

        // tooltip logic
        if (tooltips) {
            tooltips.forEach(function (t) {
                tooltipIndexes.push(data.headers.indexOf(t));
                eChartsDataObject.tooltips.push(
                    data.headers[data.headers.indexOf(t)].replace(/_/g, ' ')
                );
            });
        }

        for (i = 0; i < data.values.length; i++) {
            isHighlighted = true;
            dataObj = {};
            xValue = data.values[i][xIndex];
            yValue = data.values[i][yIndex];
            heatValue = data.values[i][heatIndex];

            if (typeof xValue === 'number') {
                xValue = xValue.toString();
            }
            if (typeof yValue === 'number') {
                yValue = yValue.toString();
            }
            dataObj.value = [xValue, yValue, heatValue];
            // Highlight Event
            if (highlight && highlight.data) {
                for (header in highlight.data) {
                    if (highlight.data.hasOwnProperty(header)) {
                        if (aliasArray.indexOf(header) === -1) {
                            // don't evaluate this because this header is not part of the heatmap's x/y dimensions
                            continue;
                        }
                        // if neither x or y are in highlight data then we will not highlight. otherwise, highlight the data point
                        if (
                            highlight.data[header].indexOf(
                                data.values[i][xIndex]
                            ) === -1 &&
                            highlight.data[header].indexOf(
                                data.values[i][yIndex]
                            ) === -1
                        ) {
                            isHighlighted = false;
                            break;
                        }
                    }
                }
            } else {
                isHighlighted = false;
            }

            if (
                highlight &&
                highlight.data &&
                !highlight.data[aliasArray[xIndex]] &&
                !highlight.data[aliasArray[yIndex]]
            ) {
                // if no highlight applies to these dimensions then we don't do anything
            } else if (isHighlighted) {
                dataObj.itemStyle = {
                    normal: {
                        borderColor: '#000',
                        borderWidth: 2,
                    },
                };
            }

            xAxisValues.push(xValue);
            yAxisValues.push(yValue);
            heatValues.push(heatValue);
            dataObj.tip = [];

            if (tooltips) {
                // eslint-disable-next-line no-loop-func
                tooltipIndexes.forEach(function (t) {
                    tooltipValue = data.values[i][t];
                    tooltipValues.push(tooltipValue);
                    dataObj.tip.push(tooltipValue);
                });
            }

            dataArray.push(dataObj);
        }

        uniqueXAxisValues = xAxisValues.filter(function onlyUnique(
            value,
            index,
            self
        ) {
            return self.indexOf(value) === index;
        });

        uniqueYAxisValues = yAxisValues.filter(function onlyUnique(
            value,
            index,
            self
        ) {
            return self.indexOf(value) === index;
        });

        heatValuesNoNulls = heatValues.filter(function (val) {
            return val !== null;
        });

        maxHeatValue =
            heatValuesNoNulls.length > 0
                ? heatValuesNoNulls.reduce(function (a, b) {
                      return Math.max(a, b);
                  })
                : 0;

        minHeatValue = Math.min.apply(null, heatValuesNoNulls);

        if (tooltip) {
            uniqueTooltipValues = tooltipValues.filter(function onlyUnique(
                value,
                index,
                self
            ) {
                return self.indexOf(value) === index;
            });
        }

        eChartsDataObject.data = dataArray;
        eChartsDataObject.xAxisLabels = uniqueXAxisValues;
        eChartsDataObject.yAxisLabels = uniqueYAxisValues;
        eChartsDataObject.maxHeat = maxHeatValue;
        eChartsDataObject.minHeat = minHeatValue;
        eChartsDataObject.valuesNames = data.headers.slice(
            2,
            data.headers.length
        );
        // eChartsDataObject.valuesNames = eChartsDataObject.valuesNames.map(cleanUnderscores);
        eChartsDataObject.valuesData = data.values;
        eChartsDataObject.tooltipLabels = uniqueTooltipValues;
        return eChartsDataObject;
    }

    /**
     * @name formatWordwrap
     * @param {string} word the word to wrap
     * @param {number} maxLength the max length of the word before wrapping
     * @desc format the word so that it wraps
     * @returns {string} the formatted string
     */
    function formatWordwrap(word, maxLength) {
        var re = new RegExp('([\\w\\s]{' + maxLength + ',}?\\w)\\s?\\b', 'g');
        return word.replace(re, '$1\n');
    }

    /**
     * @name configureXAxis
     * @desc defines settings for x-axis
     * @param {bool} data - array of labels on the x-axis
     * @param {Object} uiOptions - uiOptions
     * @param {string} axisName - tempDataObject.xName (x-axis label name)
     * @returns {array} - array of x-axis settings
     */
    function configureXAxis(data, uiOptions, axisName) {
        var xAxisConfig,
            tickLength,
            axisTitle,
            showAxisValues,
            showAxisLine,
            nameGap = 17,
            showAxisTicks,
            labelRotation = 315,
            maxLength = 10,
            wordWrap = false,
            settings = uiOptions.editXAxis,
            fontSize = uiOptions.fontSize
                ? uiOptions.fontSize.substring(
                      0,
                      uiOptions.fontSize.indexOf('p')
                  )
                : 12,
            fontColor = uiOptions.fontColor || 'black',
            lineStyle = {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            };

        if (settings) {
            if (settings.title.show) {
                axisTitle = settings.title.name
                    ? settings.title.name.replace(/_/g, ' ')
                    : settings.title.name;
            } else {
                axisTitle = null;
            }
            showAxisValues = settings.values;
            nameGap = settings.nameGap;
            showAxisLine = settings.line;
            showAxisTicks = settings.line ? settings.showTicks : false;
            labelRotation = settings.rotate;
            maxLength = settings.format.maxLength || 10;
            wordWrap = settings.format.wordWrap;
        } else {
            axisTitle = axisName ? axisName.replace(/_/g, ' ') : axisName;
            showAxisValues = true;
            showAxisLine = showAxisTicks = false;
        }

        if (data.length > 30 && uiOptions.fitToView) {
            tickLength = 0;
        } else {
            tickLength = 5;
        }

        xAxisConfig = [
            {
                type: 'category',
                position: 'top',
                data: data,
                splitArea: {
                    show: uiOptions.editGrid.x,
                },
                z: 3,
                axisLabel: {
                    show: showAxisValues,
                    rotate: labelRotation,
                    formatter: function (value) {
                        var tempValue = EchartsHelper.formatLabel(
                            value,
                            settings.format,
                            dataTypes.xType
                        );
                        if (tempValue.length > maxLength) {
                            // KP added wordWrap function
                            if (wordWrap) {
                                return formatWordwrap(tempValue, maxLength);
                            }

                            return (
                                tempValue
                                    .substr(0, maxLength)
                                    .replace(/_/g, ' ') + '...'
                            );
                        }

                        return tempValue.replace(/_/g, ' ');
                    },
                    fontWeight:
                        parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                    fontSize:
                        parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                    fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                    color: uiOptions.axis.label.fontColor || fontColor,
                },
                axisTick: {
                    show: showAxisTicks,
                    length: tickLength,
                    lineStyle: lineStyle,
                },
                axisLine: {
                    show: showAxisLine,
                    lineStyle: lineStyle,
                },
                name: axisTitle,
                nameLocation: 'center',
                nameGap: nameGap,
                nameTextStyle: {
                    fontWeight:
                        parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                    fontSize:
                        parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                    fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                    color: uiOptions.axis.name.fontColor || fontColor,
                },
                maxLength: maxLength,
                offset: 2,
            },
        ];
        return xAxisConfig;
    }

    /**
     * @name configureYAxis
     * @desc sets configuration of y-axis (min, max, and inverse bool)
     * @param {number} data - array of labels on the y-axis
     * @param {Object} uiOptions - uiOptions
     * @param {string} axisName - tempDataObject.yName (y-axis label name)
     * @returns {array} - array of y-axis settings
     */
    function configureYaxis(data, uiOptions, axisName) {
        var yAxisConfig,
            tickLength,
            axisTitle,
            showAxisValues,
            showAxisLine,
            nameGap = 12,
            showAxisTicks,
            labelRotation = 0,
            maxLength = 10,
            wordWrap = false,
            settings = uiOptions.editYAxis,
            fontSize = uiOptions.fontSize
                ? uiOptions.fontSize.substring(
                      0,
                      uiOptions.fontSize.indexOf('p')
                  )
                : 12,
            fontColor = uiOptions.fontColor || 'black',
            lineStyle = {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            };
        if (settings) {
            if (settings.title.show) {
                axisTitle = settings.title.name
                    ? settings.title.name.replace(/_/g, ' ')
                    : settings.title.name;
            } else {
                axisTitle = null;
            }
            showAxisValues = settings.values;
            nameGap = settings.nameGap;
            showAxisLine = showAxisTicks = settings.line;
            showAxisTicks = settings.line ? settings.showTicks : false;
            labelRotation = settings.rotate;
            maxLength = settings.format.maxLength || 10;
            // KP added wordWrap
            wordWrap = settings.format.wordWrap;
        } else {
            axisTitle = axisName ? axisName.replace(/_/g, ' ') : axisName;
            showAxisValues = true;
            showAxisLine = showAxisTicks = false;
        }

        if (data.length > 30 && uiOptions.fitToView) {
            tickLength = 0;
        } else {
            tickLength = 5;
        }

        yAxisConfig = [
            {
                type: 'category',
                data: data,
                splitArea: {
                    show: uiOptions.editGrid.yWaterfall,
                },
                axisLabel: {
                    rotate: labelRotation,
                    show: showAxisValues,
                    formatter: function (value) {
                        // formatLabel for millions, etc.
                        var tempValue = EchartsHelper.formatLabel(
                            value,
                            settings.format,
                            dataTypes.yType
                        );
                        if (tempValue.length > maxLength) {
                            // KP added wordWrap function
                            if (wordWrap) {
                                return formatWordwrap(tempValue, maxLength);
                            }
                            return (
                                tempValue
                                    .substr(0, maxLength)
                                    .replace(/_/g, ' ') + '...'
                            );
                        }
                        return tempValue.replace(/_/g, ' ');
                    },
                    fontWeight:
                        parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                    fontSize:
                        parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                    fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                    color: uiOptions.axis.label.fontColor || fontColor,
                },
                axisTick: {
                    show: showAxisTicks,
                    length: tickLength,
                    lineStyle: lineStyle,
                },
                axisLine: {
                    show: showAxisLine,
                    lineStyle: lineStyle,
                },
                name: axisTitle,
                nameTextStyle: {
                    fontWeight:
                        parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                    fontSize:
                        parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                    fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                    color: uiOptions.axis.name.fontColor || fontColor,
                },
                nameGap: nameGap,
                nameLocation: 'center',
                maxLength: maxLength,
                offset: 2,
            },
        ];
        return yAxisConfig;
    }

    /**
     * @name setEChartsDataSeries
     * @desc creates data series object to define ECharts viz
     * @param {string} type - chart type
     * @param {object} data - object of data in ECharts format created from formData function
     * @param {object} options - ui options
     * @returns {Object} - object of ECharts data series
     */
    function setEChartsDataSeries(type, data, options) {
        var dataObject = {},
            seriesArray = [];

        dataObject.name = data.valuesNames;
        dataObject.type = type;
        dataObject.data = data.data;
        dataObject.itemStyle = {
            emphasis: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                borderWidth: 0,
            },
            borderColor: '#ffffff',
            borderWidth: 1.35,
        };
        // Display Values
        if (options.displayValues === true) {
            let fontSize =
                    parseFloat(options.valueLabel.fontSize) ||
                    options.fontSize ||
                    12,
                fontFamily = options.valueLabel.fontFamily || 'Inter',
                fontWeight = options.valueLabel.fontWeight || 400;
            dataObject.label = {
                normal: {
                    show: true,
                    // heatmap stores value as [x, y, heat] so clean heat value only
                    formatter: function (obj) {
                        return visualizationUniversal.formatValue(
                            obj.value[2],
                            dataTypes.heatType
                        );
                    },
                    fontSize: fontSize,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                },
                emphasis: {
                    fontSize: fontSize + 2,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    textBorderColor: '#000000',
                    textBorderWidth: 1,
                },
            };
        }
        seriesArray.push(dataObject);
        dataObject = {};
        return seriesArray;
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

    return {
        getConfig: getConfig,
    };
}
