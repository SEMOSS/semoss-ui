'use strict';

import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

angular
    .module('app.boxwhisker.service', [])
    .factory('boxwhiskerService', boxwhiskerService);

function boxwhiskerService() {
    var dataTypes;
    /**
     * @name getToolTip
     * @param {bool} show uiOptions.showTooltips
     * @param {object} tooltipStyle - style options for tooltip
     * @param {object} axisPointerStyle - style for axis pointer
     * @desc configures tooltip object
     * @return {oject} tooltip object
     */
    function getToolTip(show, tooltipStyle, axisPointerStyle) {
        return {
            show: show,
            trigger: 'item',
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
            backgroundColor: tooltipStyle.backgroundColor || '#FFFFFF',
            borderWidth: parseFloat(tooltipStyle.borderWidth) || 0,
            borderColor: tooltipStyle.borderColor || '',
            textStyle: {
                color: tooltipStyle.fontColor || '#000000',
                fontFamily: tooltipStyle.fontFamily || 'Inter',
                fontSize: parseFloat(tooltipStyle.fontSize) || 12,
            },
        };
    }

    /**
     * @name getGrid
     * @desc configures chart positioning within panel
     * @param {bool} showX - boolean to show x zoom or not
     * @param {bool} showY - boolean to show y zoom or not
     * @param {object} groupByInfo - facet info
     * @return {object} position config object
     */
    function getGrid(showX, showY, groupByInfo) {
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

        if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
            grid.bottom += 40;
        }

        return grid;
    }

    /**
     * @name getX
     * @param {string} title label for yAxis
     * @param {array} axisData eCharts axis data
     * @param {object} uiOptions chart options
     * @desc sets up the xAxis
     * @return {object} xAxis config object
     */
    function getX(title, axisData, uiOptions) {
        var fontSize = convertToNumber(uiOptions.fontSize),
            editXAxis = uiOptions.editXAxis,
            rotateAxis = uiOptions.rotateAxis,
            grid = uiOptions.editGrid.x,
            gridOptions = uiOptions.grid,
            showAxisValues,
            nameGap = 25,
            nameLocation = 'center',
            showAxisTicks,
            xAxisConfig,
            showAxisLine,
            axisTitle,
            lineStyle = {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            };

        if (editXAxis) {
            if (editXAxis.title.show) {
                axisTitle = editXAxis.title.name;
            } else {
                axisTitle = null;
            }
            showAxisValues = editXAxis.values;
            nameGap = editXAxis.nameGap;
            showAxisLine = editXAxis.line;
            showAxisTicks = editXAxis.line ? editXAxis.showTicks : false;
        } else {
            axisTitle = cleanValue(title);
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        xAxisConfig = {
            type: 'category',
            data: axisData,
            axisTick: {
                show: showAxisTicks,
                alignWithLabel: true,
                lineStyle: lineStyle,
            },
            axisLabel: {
                show: showAxisValues,
                rotate: editXAxis.rotate || 0,
                formatter: function (value) {
                    return EchartsHelper.formatLabel(
                        value,
                        editXAxis.format,
                        dataTypes.labelType
                    );
                },
                fontWeight:
                    parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                color: uiOptions.axis.label.fontColor || uiOptions.fontColor,
            },
            name: axisTitle,
            nameLocation: nameLocation,
            nameGap: nameGap,
            nameTextStyle: {
                fontWeight: parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                color: uiOptions.axis.name.fontColor || uiOptions.fontColor,
            },
            splitLine: {
                show: grid,
                lineStyle: gridOptions,
            },
            axisLine: {
                show: showAxisLine,
                lineStyle: lineStyle,
            },
        };

        if (rotateAxis) {
            xAxisConfig.nameLocation = 'end';
            if (axisTitle.length > 10 && axisTitle.length < 15) {
                xAxisConfig.nameTextStyle.padding = [
                    0,
                    0,
                    0,
                    (axisTitle.length * 10) / 4,
                ];
            } else if (axisTitle.length >= 15) {
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
     * @name getY
     * @param {string} title label for yAxis
     * @param {object} uiOptions chart options
     * @desc sets up the yAxis
     * @return {object} yAxis config object
     */
    function getY(title, uiOptions) {
        var fontSize = convertToNumber(uiOptions.fontSize),
            editYAxis = uiOptions.editYAxis,
            rotateAxis = uiOptions.rotateAxis,
            grid = uiOptions.editGrid.y,
            gridOptions = uiOptions.grid,
            axisTitle,
            yAxis,
            showAxisValues,
            showAxisLine,
            showAxisTicks,
            nameLocation = 'end',
            nameGap = 25,
            yMin = null,
            yMax = null,
            lineStyle = {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            };

        if (editYAxis) {
            if (editYAxis.title.show) {
                axisTitle = editYAxis.title.name;
            } else {
                axisTitle = '';
            }
            showAxisValues = editYAxis.values;
            showAxisLine = editYAxis.line;
            showAxisTicks = editYAxis.line ? editYAxis.showTicks : false;
            nameGap = editYAxis.nameGap;
            if (editYAxis.min) {
                if (editYAxis.min.show) {
                    yMin = editYAxis.min.value;
                }
            }
            if (editYAxis.max) {
                if (editYAxis.max.show) {
                    yMax = editYAxis.max.value;
                }
            }
        } else {
            axisTitle = title;
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        if (rotateAxis) {
            nameLocation = 'center';
        }

        yAxis = {
            type: 'value',
            min: yMin || null,
            max: yMax || null,
            name: axisTitle,
            nameTextStyle: {
                fontWeight: parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                color: uiOptions.axis.name.fontColor || uiOptions.fontColor,
            },
            nameLocation: nameLocation,
            nameGap: nameGap,
            splitArea: {
                show: false,
            },
            splitLine: {
                show: grid,
                lineStyle: gridOptions,
            },
            axisLabel: {
                show: showAxisValues,
                formatter: function (value) {
                    return EchartsHelper.formatLabel(
                        value,
                        editYAxis.format,
                        dataTypes.valueType
                    );
                },
                rotate: editYAxis.rotate || 0,
                fontWeight:
                    parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                color: uiOptions.axis.label.fontColor || uiOptions.fontColor,
            },
            axisLine: {
                show: showAxisLine,
                lineStyle: lineStyle,
            },
            axisTick: {
                show: showAxisTicks,
                lineStyle: lineStyle,
            },
        };

        if (axisTitle && !rotateAxis) {
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
     * @name getSeries
     * @param {object} data eCharts box data
     * @param {array} cbv color by value rules
     * @param {object} keys semoss keys
     * @param {string} color semoss color
     * @param {object} rawData raw data
     * @param {object} borderStyle border style
     * @desc sets up series configuration object
     * @return {object} series configuration object
     */
    function getSeries(data, cbv, keys, color, rawData, borderStyle) {
        var seriesData = getSeriesData(
                data.boxData,
                color,
                cbv,
                data.axisData,
                keys,
                false,
                borderStyle
            ),
            outlierData = getSeriesData(
                data.outliers,
                color,
                cbv,
                data.axisData,
                keys,
                true,
                borderStyle
            );

        return [
            {
                // name: 'boxplot',
                // boxwhisker only stores 2 dimesnions as headers [<x axis>, <y axis>]
                name: rawData.headers[1],
                type: 'boxplot',
                data: seriesData,
                tooltip: {
                    formatter: function (param) {
                        if (
                            param.data &&
                            param.data.hasOwnProperty('itemStyle')
                        ) {
                            return [
                                '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:' +
                                    param.data.itemStyle.color +
                                    ';"></span>' +
                                    '<b>' +
                                    visualizationUniversal.formatValue(
                                        param.name,
                                        dataTypes.labelType
                                    ) +
                                    '</b>',
                                'Upper: ' +
                                    visualizationUniversal.formatValue(
                                        param.value[5],
                                        dataTypes.valueType
                                    ),
                                'Q3: ' +
                                    visualizationUniversal.formatValue(
                                        param.value[4],
                                        dataTypes.valueType
                                    ),
                                'Median: ' +
                                    visualizationUniversal.formatValue(
                                        param.value[3],
                                        dataTypes.valueType
                                    ),
                                'Q1: ' +
                                    visualizationUniversal.formatValue(
                                        param.value[2],
                                        dataTypes.valueType
                                    ),
                                'Lower: ' +
                                    visualizationUniversal.formatValue(
                                        param.value[1],
                                        dataTypes.valueType
                                    ),
                            ].join('<br/>');
                        }
                        return [
                            '<b>' +
                                visualizationUniversal.formatValue(
                                    param.name,
                                    dataTypes.labelType
                                ) +
                                '</b>',
                            'Upper: ' +
                                visualizationUniversal.formatValue(
                                    param.value[5],
                                    dataTypes.valueType
                                ),
                            'Q3: ' +
                                visualizationUniversal.formatValue(
                                    param.value[4],
                                    dataTypes.valueType
                                ),
                            'Median: ' +
                                visualizationUniversal.formatValue(
                                    param.value[3],
                                    dataTypes.valueType
                                ),
                            'Q1: ' +
                                visualizationUniversal.formatValue(
                                    param.value[2],
                                    dataTypes.valueType
                                ),
                            'Lower: ' +
                                visualizationUniversal.formatValue(
                                    param.value[1],
                                    dataTypes.valueType
                                ),
                        ].join('<br/>');
                    },
                },
            },
            {
                name: 'Outlier',
                type: 'scatter',
                data: outlierData,
                tooltip: {
                    formatter: function (param) {
                        return [
                            param.marker +
                                '<b>' +
                                visualizationUniversal.formatValue(
                                    param.name,
                                    dataTypes.labelType
                                ) +
                                '</b>',
                            'Outlier: ' +
                                visualizationUniversal.formatValue(
                                    param.value[1],
                                    dataTypes.valueType
                                ),
                        ].join('<br/>');
                    },
                },
            },
        ];
    }

    /**
     * @name getSeriesData
     * @param {array} data data for part of series we are building boxData/outliers
     * @param {string} innerColor hex string for the color of the inside of hte element
     * @param {array} cbv color by value rules
     * @param {array} xAxis xAxis labels
     * @param {object} keys semoss keys
     * @param {boolean} outliers true if its for outliers
     * @param {object} borderStyle border style
     * @desc builds series data for different parts of the series
     * @return {array} seriesData array
     */
    function getSeriesData(
        data,
        innerColor,
        cbv,
        xAxis,
        keys,
        outliers,
        borderStyle
    ) {
        var seriesData = [],
            cleanXAxis = xAxis.map(function (val) {
                return val;
            });

        data.forEach(function (value, idx) {
            var valueObj = {},
                noColor = true;
            if (value.value) {
                valueObj.value = value.value;
            } else {
                valueObj.value = value;
            }

            if (value.itemStyle) {
                valueObj.itemStyle = value.itemStyle;
            } else {
                valueObj.itemStyle = {
                    normal: {
                        borderWidth: parseFloat(borderStyle.borderWidth) || 1,
                        borderStyle: borderStyle.borderStyle || 'solid',
                        borderColor: borderStyle.borderColor || '#000000',
                    },
                };
            }

            if (cbv && cbv.length > 0) {
                cbv.forEach(function (rule) {
                    var colorOnCorrect = false,
                        i;
                    // it only makes sense if we are coloring on x axis
                    // so lets just check that
                    keys.forEach(function (key) {
                        if (
                            key.alias === rule.colorOn &&
                            key.type === 'STRING'
                        ) {
                            colorOnCorrect = true;
                        }
                    });
                    if (colorOnCorrect) {
                        // the coloring is on the xaxis so lets overide that color!
                        for (i = 0; i < rule.valuesToColor.length; i++) {
                            if (
                                outliers &&
                                value[0] ===
                                    cleanXAxis.indexOf(rule.valuesToColor[i])
                            ) {
                                valueObj.itemStyle.normal.color = rule.color;
                                noColor = false;

                                break;
                            } else if (
                                rule.valuesToColor[i] === cleanXAxis[idx]
                            ) {
                                valueObj.itemStyle.normal.color = rule.color;
                                noColor = false;

                                break;
                            }
                        }
                    }
                });
            }

            if (noColor || !cbv || cbv.length === 0) {
                valueObj.itemStyle.normal.color = innerColor;
            }

            seriesData.push(valueObj);
        });

        return seriesData;
    }

    /**
     * @name setBoxData
     * @param {array} data Semoss data
     * @param {object} opt optional options object
     * @desc echarts function to create boxData for box plot
     * @return {object} info for boxdata outliers and axis data
     */
    function setBoxData(data, opt) {
        var boxData = [],
            outliers = [],
            axisData = [],
            i,
            j,
            low,
            high,
            min,
            max,
            Q1,
            Q2,
            Q3,
            ascList,
            dataItem,
            outlier,
            bound,
            boundIQR = opt ? opt.boundIQR : null,
            label,
            useExtreme = boundIQR === 'none' || boundIQR === 0,
            rawData = [],
            dataMap;

        dataMap = buildDataMap(data);
        // use the data map to set axis data and echarts friendly
        for (label in dataMap) {
            if (dataMap.hasOwnProperty(label)) {
                rawData.push(dataMap[label]);
                axisData.push(label);
            }
        }

        for (i = 0; i < rawData.length; i++) {
            ascList = asc(rawData[i].slice());

            Q1 = quantile(ascList, 0.25);
            Q2 = quantile(ascList, 0.5);
            Q3 = quantile(ascList, 0.75);
            min = ascList[0];
            max = ascList[ascList.length - 1];

            bound = (boundIQR === null ? 1.5 : boundIQR) * (Q3 - Q1);

            low = useExtreme ? min : Math.max(min, Q1 - bound);
            high = useExtreme ? max : Math.min(max, Q3 + bound);

            boxData.push([low, Q1, Q2, Q3, high]);

            for (j = 0; j < ascList.length; j++) {
                dataItem = ascList[j];
                if (dataItem < low || dataItem > high) {
                    outlier = [i, dataItem];
                    opt && opt.layout === 'vertical' && outlier.reverse();
                    outliers.push(outlier);
                }
            }
        }
        return {
            boxData: boxData,
            outliers: outliers,
            axisData: axisData,
        };
    }

    /**
     * @name buildDataMap
     * @param {array} data Semoss chartData.values
     * @desc makes a map of labels to all the values for that label
     * @return {object} {label: [values]}
     */
    function buildDataMap(data) {
        var map = {};
        data.forEach(function (values) {
            values[0] = values[0];
            if (!map[values[0]]) {
                map[values[0]] = [];
            }

            map[values[0]].push(values[1]);
        });

        return map;
    }

    /**
     * @name asc
     * @param {array} arr array to sort
     * @desc echarts function sorts an array and returns it
     * @return {array} sorted array
     */
    function asc(arr) {
        arr.sort(function (a, b) {
            return a - b;
        });
        return arr;
    }

    /**
     *
     * @param {array} ascArr sorted array
     * @param {number} p percentile
     * @desc calculates quantiles for boxes
     * @return {number} quantile
     */
    function quantile(ascArr, p) {
        var H = (ascArr.length - 1) * p + 1,
            h = Math.floor(H),
            v = +ascArr[h - 1],
            e = H - h;
        return e ? v + e * (ascArr[h] - v) : v;
    }

    /**
     * @name getDataZoom
     * @desc toggles Data Zoom feature
     * @param {bool} showX - boolean to show x zoom or not
     * @param {bool} showY - boolean to show y zoom or not
     * @param {object} groupByInfo - facet info
     * @param {object} style - style options for datazoom
     * @returns {Array} - array of objects defining Data Zoom settings
     */
    function getDataZoom(showX, showY, groupByInfo, style) {
        var dataZoom = [],
            xSlider,
            xInside,
            ySlider,
            bottom = 20,
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
                            style.dataBackground.lineStyle.lineStyle || 'solid',
                    },
                    areaStyle: {
                        color:
                            style.dataBackground.areaStyle.backgroundColor ||
                            'rgba(64, 160, 255, .1)',
                        opacity: style.dataBackground.areaStyle.opacity || 1,
                    },
                },
                selectedDataBackground: {
                    lineStyle: {
                        color:
                            style.selectedDataBackground.lineStyle.lineColor ||
                            'rgba(64, 160, 255, 1)',
                        width:
                            parseFloat(
                                style.selectedDataBackground.lineStyle.lineWidth
                            ) || 1,
                        lineStyle:
                            style.selectedDataBackground.lineStyle.lineStyle ||
                            'solid',
                    },
                    areaStyle: {
                        color:
                            style.selectedDataBackground.areaStyle
                                .backgroundColor || 'rgba(64, 160, 255, .5)',
                        opacity:
                            style.selectedDataBackground.areaStyle.opacity || 1,
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
                    borderWidth: parseFloat(style.moveHandle.borderWidth) || 1,
                    borderStyle: style.moveHandle.borderStyle || 'solid',
                    borderColor: style.moveHandle.borderColor || '#CCCCCC',
                },
                emphasis: {
                    moveHandleStyle: {
                        color:
                            style.selectedDataBackground.lineStyle.lineColor ||
                            'rgba(64, 160, 255, 1)',
                    },
                    handleStyle: {
                        borderColor:
                            style.selectedDataBackground.lineStyle.lineColor ||
                            'rgba(64, 160, 255, 1)',
                    },
                },
            };

        if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
            bottom += 40;
        }

        if (showX) {
            xSlider = Object.assign(
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: 0,
                    bottom: bottom + 'px',
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
        if (showY) {
            ySlider = Object.assign(
                {
                    type: 'slider',
                    show: true,
                    yAxisIndex: 0,
                    right: '20px',
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
     * @name getToolBox
     * @return {object} tool box object
     */
    function getToolBox() {
        return {
            show: false,
        };
    }

    /**
     * @name getBrush
     * @return {object} brush object
     */
    function getBrush() {
        return {
            xAxisIndex: 0,
            brushStyle: {
                borderWidth: 1,
                color: 'rgba(120,140,180,0.15)',
                borderColor: 'rgba(120,140,180,0.35)',
            },
        };
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
     * @name highlightBox
     * @desc sets options to highlight the item on hover
     * @param {object} boxData - data
     * @param {*} highlight - uiOptions.highlight
     * @param {*} borderStyle - border style
     * @returns {void}
     */
    function highlightBox(boxData, highlight, borderStyle) {
        var highlightIndex = findHighlightIndex(boxData, highlight);
        boxData.boxData = boxData.boxData.map(function (value, idx) {
            var dataObj = {};
            dataObj.value = value;
            if (highlightIndex.indexOf(idx) > -1) {
                dataObj.itemStyle = {
                    borderWidth: parseFloat(borderStyle.borderWidth) + 1 || 2,
                };
            }

            return dataObj;
        });
    }

    /**
     * @name findHighlightIndex
     * @param {object} data echarts data
     * @param {object} highlight semoss ui options.highlight
     * @desc finds the index of the data to highlight
     * @return {number} the index of the data to highlight
     */
    function findHighlightIndex(data, highlight) {
        var prop,
            i,
            index,
            highlightIndex = [];

        for (prop in highlight.data) {
            if (highlight.data.hasOwnProperty(prop)) {
                for (i = 0; i < highlight.data[prop].length; i++) {
                    index = data.axisData.indexOf(highlight.data[prop][i]);
                    if (index > -1) {
                        highlightIndex.push(index);
                    }
                }
            }
        }

        return highlightIndex;
    }

    /**
     * @name getConfig
     * @param {object} data Semoss chart data
     * @param {object} uiOptions Semoss uiOptions
     * @param {object} keys Semoss keys
     * @param {string} groupByInstance Group By Individual Instance info
     * @param {object} groupByInfo group by info
     * @desc builds and returns chart config
     * @return {object} chart config
     */
    function getConfig(data, uiOptions, keys, groupByInstance, groupByInfo) {
        var boxData = setBoxData(data.values),
            configObj,
            backgroundColorStyle = getBackgroundColorStyle(uiOptions.watermark),
            keysMapping = getMapping(keys),
            dataTypes = getDataTypes(keys, uiOptions);

        if (uiOptions.highlight) {
            highlightBox(boxData, uiOptions.highlight, uiOptions.boxwhisker);
        }

        // check how many x axis values we have, if over limit we will activate zoom if it has not been set
        if (typeof uiOptions.toggleZoomXEnabled !== 'boolean') {
            if (boxData.axisData.length > 50) {
                uiOptions.toggleZoomX = true;
            } else {
                uiOptions.toggleZoomX = false;
            }
        } else if (typeof uiOptions.toggleZoomXEnabled === 'boolean') {
            uiOptions.toggleZoomX = uiOptions.toggleZoomXEnabled;
        }

        configObj = {
            tooltip: getToolTip(
                uiOptions.showTooltips,
                uiOptions.tooltip,
                uiOptions.axis.pointer
            ),
            grid: getGrid(
                uiOptions.toggleZoomX,
                uiOptions.toggleZoomY,
                groupByInfo
            ),
            xAxis: getX(keysMapping.label, boxData.axisData, uiOptions),
            yAxis: getY(keysMapping.value, uiOptions),
            dataZoom: getDataZoom(
                uiOptions.toggleZoomX,
                uiOptions.toggleZoomY,
                groupByInfo,
                uiOptions.dataZoom
            ),
            series: getSeries(
                boxData,
                uiOptions.colorByValue,
                keys,
                uiOptions.color[0],
                data,
                uiOptions.boxwhisker
            ),
            animation: false,
            toolbox: getToolBox(),
            groupByInstance: groupByInstance,
            brush: getBrush(),
        };

        if (backgroundColorStyle) {
            configObj.backgroundColor = backgroundColorStyle;
        }

        if (uiOptions.rotateAxis) {
            configObj.xAxis = getY(keysMapping.value, uiOptions);
            configObj.yAxis = getX(
                keysMapping.label,
                boxData.axisData,
                uiOptions
            );
        }

        return configObj;
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
        let k, i, formatDimension;

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
                formatDimension = options.formatDataValues.formats[i].dimension;
                if (formatDimension === dataTypes.valueName) {
                    dataTypes.valueType = options.formatDataValues.formats[i];
                }
                if (formatDimension === dataTypes.labelName) {
                    dataTypes.labelType = options.formatDataValues.formats[i];
                }
            }
        }
    }

    /**
     * @name getMapping
     * @param {array} keys Semoss keys
     * @desc get mapping of key to chart options
     * @return {object} keys mapping
     */
    function getMapping(keys) {
        var key,
            mappingByModel = {};

        for (key in keys) {
            if (keys.hasOwnProperty(key)) {
                mappingByModel[keys[key].model] = keys[key].alias;
            }
        }

        return mappingByModel;
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
     * @name convertToNumber
     * @param {string} fontSize Semoss uiOptions fontSize
     * @desc takes the fontSize string and converts into eCharts friendly number
     * @return {number} fontSize as a number
     */
    function convertToNumber(fontSize) {
        return Number(fontSize.substr(0, fontSize.indexOf('p')));
    }

    return {
        getConfig: getConfig,
    };
}
