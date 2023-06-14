'use strict';

import visualizationUniversal from '@/core/store/visualization/visualization.js';

/**
 * @name pie-echarts.service.js
 * @desc configures echarts pie
 */
angular.module('app.pie.service', []).factory('pieService', pieService);

function pieService() {
    var dataTypes;

    function getConfig(
        type,
        data,
        uiOptions,
        colorBy,
        groupByInstance,
        groupBy,
        valuesMapping,
        keys
    ) {
        var options = uiOptions || {},
            finalData,
            labelInfo,
            keyInfo,
            heatAndLegendValues,
            groupedData,
            i,
            chartTitle = {};

        getDataTypes(keys, options);
        if (keys) {
            keyInfo = keys;
        }

        if (groupBy && groupBy.viewType === 'All Instances') {
            finalData = [];
            for (i = 0; i < groupBy.uniqueInstances.length; i++) {
                groupedData = {};
                groupedData.headers = data.headers;
                groupedData.rawHeaders = data.rawHeaders;
                groupedData.values =
                    groupBy.tempData[groupBy.uniqueInstances[i]];
                finalData.push(
                    setEChartsDataSeries(
                        type,
                        groupedData,
                        colorBy,
                        options,
                        valuesMapping,
                        keys
                    )
                );
            }
        } else {
            finalData = setEChartsDataSeries(
                type,
                data,
                colorBy,
                options,
                valuesMapping,
                keys
            );
        }

        heatAndLegendValues = getLegendHeaders(data.values, valuesMapping);
        labelInfo = getLegendLabels(data.headers, valuesMapping);

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

        // set chart title text & styles
        if (options.chartTitle && options.chartTitle.text) {
            chartTitle = {};
            chartTitle.show = true;
            chartTitle.text = options.chartTitle.text;
            chartTitle.fontSize = options.chartTitle.fontSize;
            chartTitle.fontWeight = options.chartTitle.fontWeight;
            chartTitle.fontFamily = options.chartTitle.fontFamily;
            chartTitle.fontColor = options.chartTitle.fontColor;
            chartTitle.align = options.chartTitle.align || 'left';
        }

        // Configure data for ECharts
        return {
            data: finalData,
            legendHeaders: heatAndLegendValues.legendHeaders,
            legendLabels: labelInfo.legend,
            heatLabel: labelInfo.heat,
            visualMap: getVisualMap(
                heatAndLegendValues.heat,
                valuesMapping,
                groupBy
            ),
            showLegend: options.toggleLegend || false,
            legendLabelStyle: legendLabelStyle,
            axisPointer: options.axisPointer || null,
            valueDimension: data.headers[valuesMapping.mappingByModel.value],
            backgroundColorStyle: getBackgroundColorStyle(options.watermark),
            groupByInstance: groupByInstance,
            options: options,
            keys: keyInfo,
            dataTypes: dataTypes,
            title: chartTitle,
        };
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
            heatType: '',
            heatName: '',
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
            if (keys[k].model === 'heat') {
                dataTypes.heatType = visualizationUniversal.mapFormatOpts(
                    keys[k]
                );
                dataTypes.heatName = keys[k].alias;
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
                if (formatDimension === dataTypes.heatName) {
                    dataTypes.heatType = options.formatDataValues.formats[i];
                }
                if (formatDimension === dataTypes.labelName) {
                    dataTypes.labelType = options.formatDataValues.formats[i];
                }
            }
        }
    }

    function getLegendLabels(headers, valuesMapping) {
        var legend = '',
            heat = '';
        if (headers && Array.isArray(headers)) {
            legend = headers[valuesMapping.mappingByModel.label];
            heat = headers[valuesMapping.mappingByModel.heat];
        }
        return {
            legend: legend,
            heat: heat,
        };
    }

    function getLegendHeaders(values, valuesMapping) {
        var returnObj = {},
            legendHeaders = [],
            heatValues = [],
            heatExists = false,
            i;

        if (values && Array.isArray(values)) {
            for (i = 0; i < values.length; i++) {
                legendHeaders.push(
                    String(values[i][valuesMapping.mappingByModel.label])
                );
                if (typeof valuesMapping.mappingByModel.heat === 'number') {
                    heatValues.push(
                        values[i][valuesMapping.mappingByModel.heat]
                    );
                    heatExists = true;
                } else {
                    heatExists = false;
                }
            }
        }

        returnObj.legendHeaders = legendHeaders;

        if (heatExists) {
            returnObj.heat = {
                min: Math.min.apply(null, heatValues),
                max: Math.max.apply(null, heatValues),
            };
        }

        return returnObj;
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Array} values - object of data in original format
     * @param {Array} headers - object of data in original format
     * @param {object} highlight - highlight prop from uiOptions
     * @param {object} colorBy - user-defined Color By Value rule(s)
     * @param {object} valuesMapping - values mapping
     * @returns {Object} - object of data in ECharts format
     */
    function formatData(values, headers, highlight, colorBy, valuesMapping) {
        var i,
            j,
            prop,
            dataObj,
            dataArray = [],
            dataObjName;

        if (values && Array.isArray(values)) {
            for (i = 0; i < values.length; i++) {
                if (values[i][valuesMapping.mappingByModel.value] < 0) {
                    continue;
                }
                dataObj = {};
                dataObj.value = getValues(
                    values[i][valuesMapping.mappingByModel.value],
                    values[i][valuesMapping.mappingByModel.heat]
                );
                dataObj.tooltip = [];

                for (
                    j = 0;
                    j < valuesMapping.mappingByModel.tooltip.length;
                    j++
                ) {
                    dataObj.tooltip.push({
                        header: headers[
                            valuesMapping.mappingByModel.tooltip[j]
                        ],
                        value: values[i][
                            valuesMapping.mappingByModel.tooltip[j]
                        ],
                    });
                }

                dataObj.name = String(
                    values[i][valuesMapping.mappingByModel.label]
                );

                if (highlight && highlight.data) {
                    for (prop in highlight.data) {
                        if (highlight.data.hasOwnProperty(prop)) {
                            if (
                                highlight.data[prop].indexOf(
                                    values[i][
                                        valuesMapping.mappingByModel.label
                                    ]
                                ) > -1
                            ) {
                                dataObj.itemStyle = {
                                    normal: {
                                        borderColor: '#000',
                                        borderWidth: 2,
                                    },
                                };
                            }
                        }
                    }
                }

                // Color by Value
                if (colorBy && colorBy.length > 0) {
                    // eslint-disable-next-line no-loop-func
                    colorBy.forEach(function (rule) {
                        var valueToColor, dataObjValue;
                        for (j = 0; j < rule.valuesToColor.length; j++) {
                            valueToColor = rule.valuesToColor[j];
                            dataObjValue = dataObj.value;
                            dataObjName = dataObj.name;

                            if (
                                dataObjValue === valueToColor ||
                                dataObjName === valueToColor
                            ) {
                                if (
                                    dataObj.hasOwnProperty('itemStyle') &&
                                    dataObj.itemStyle.hasOwnProperty('normal')
                                ) {
                                    dataObj.itemStyle.normal.color = rule.color;
                                } else {
                                    dataObj.itemStyle = {
                                        normal: {
                                            color: rule.color,
                                        },
                                    };
                                }
                                break;
                            }
                        }
                    });
                }

                dataArray.push(dataObj);
            }
        }

        return dataArray;
    }

    /**
     * @name getValues
     * @param {number} value the pie slice value
     * @param {number} heat the heat value for visualMap
     * @desc if number just returns value, otherwise removes spaces from string
     * @return {number | array} altered value
     */
    function getValues(value, heat) {
        if (heat) {
            return [value, heat];
        }
        return [value];
    }

    /**
     * @name getVisualMap
     * @param {object} heat max and min of heat data
     * @param {object} valuesMapping - values mapping
     * @param {object} groupBy - facet info
     * @desc define visual map for data if heat dimension exits
     * @return {number | array} altered value
     */
    function getVisualMap(heat, valuesMapping, groupBy) {
        var bottom = 0;

        if (heat && typeof valuesMapping.mappingByModel.heat === 'number') {
            if (groupBy && groupBy.viewType === 'Individual Instance') {
                bottom += 60;
            }
            return {
                show: true,
                min: heat.min,
                max: heat.max,
                bottom: bottom,
                formatter: function (value) {
                    return visualizationUniversal.formatValue(
                        value,
                        dataTypes.heatType
                    );
                },
                text: ['High', 'Low'],
                // inRange: {
                //     color: ['#4575b4', '#74add1', '#CE6661', '#C0444E']
                // }
            };
        }
        return {};
    }

    /**
     * @name customizeAnimation
     * @desc sets the animation style
     * @param {object} param - object of animation settings
     * @returns {object} - object of animation settings
     */
    function customizeAnimation(param) {
        var animationSettings = {};
        // TODO small refactor
        if (param && param === 'None') {
            animationSettings.showAnimation = false;
        } else if (param === 'Expansion') {
            animationSettings.showAnimation = true;
            animationSettings.animationType = 'expansion';
        } else if (param === 'Linear') {
            animationSettings.showAnimation = true;
            animationSettings.animationType = 'scale';
            animationSettings.animationEasing = 'linear';
        } else if (param === 'Exponential') {
            animationSettings.showAnimation = true;
            animationSettings.animationType = 'scale';
            animationSettings.animationEasing = 'exponentialOut';
        } else if (param === 'Elastic') {
            animationSettings.showAnimation = true;
            animationSettings.animationType = 'scale';
            animationSettings.animationEasing = 'elasticOut';
        } else {
            // default
            animationSettings.showAnimation = false;
            animationSettings.animationType = 'None';
        }
        return animationSettings;
    }

    function getHeaderNames(headers) {
        var headerNames = [];
        if (headers && Array.isArray(headers)) {
            // Value dimensions (Average of Movie Budget, etc.)
            headerNames = headers.slice(1, headers.length);
        }
        return headerNames;
    }

    /**
     * @name setEChartsDataSeries
     * @desc creates data series object to define ECharts viz
     * @param {string} type - chart type
     * @param {object} rawData - object of data in ECharts format created from formData function
     * @param {number} colorBy index of the data to highlight
     * @param {object} options - ui options
     * @param {object} valuesMapping - values mapping
     * @param {object} keys the dimensions
     * @returns {Object} - object of ECharts data series
     */
    function setEChartsDataSeries(
        type,
        rawData,
        colorBy,
        options,
        valuesMapping,
        keys
    ) {
        var dataObject = {},
            animation = customizeAnimation(options.animationPie),
            pieData = formatData(
                rawData.values,
                rawData.headers,
                options.highlight,
                colorBy,
                valuesMapping
            );

        dataObject.type = type;
        // dataObject.name = getHeaderNames(rawData.headers);
        dataObject.name = rawData.headers[valuesMapping.mappingByModel.value];
        dataObject.data = pieData || [];
        dataObject.label = customizePieLabel(
            options.customizePieLabel,
            options.displayValues,
            options.valueLabel
        );
        dataObject.animation = animation.showAnimation;
        dataObject.animationType = animation.animationType;
        dataObject.animationEasing = animation.animationEasing || null;

        if (rawData.values.length < 40) {
            dataObject.avoidLabelOverlap = true;
        } else {
            dataObject.avoidLabelOverlap = false;
        }

        // Donut
        if (options.toggleDonut === true) {
            dataObject.radius = [
                options.pieRadius.outerRadius / 2 + '%',
                options.pieRadius.outerRadius + '%',
            ]; // default: 35-70
        } else {
            dataObject.radius = ['0%', options.pieRadius.outerRadius + '%']; // default: 0-70
        }

        // Rose Type
        if (options.rose === 'RoseRadius') {
            dataObject.roseType = 'radius';
        } else if (options.rose === 'RoseArea') {
            dataObject.roseType = 'area';
        } else {
            dataObject.roseType = false;
        }

        // Toggle Shadow
        if (options.toggleShadow === true) {
            dataObject.itemStyle = {
                normal: {
                    shadowBlur: 50,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            };
        }

        if (options.customizePieLabel.labelLineLength) {
            dataObject.labelLine = {
                length: Number(options.customizePieLabel.labelLineLength),
            };
        }

        return dataObject;
    }

    /**
     * @name customizePieLabel
     * @desc defines pie label settings for chart
     * @param {object} pieLabelOptions - uiOptions.customizePieLabel settings
     * @param {bool} displayValues - uiOptions.displayValues
     * @param {object} labelFont - font options for label
     * @returns {object} object of pie label settings
     */
    function customizePieLabel(pieLabelOptions, displayValues, labelFont) {
        var labelPosition = 'outside',
            labelDimensions,
            i,
            fontFamily = labelFont.fontFamily || 'Inter',
            fontWeight = labelFont.fontWeight || 400,
            fontColor = labelFont.fontColor || '#000000',
            fontNormal = parseFloat(labelFont.fontSize) || 12,
            fontEmphasis = fontNormal + 2,
            labelObject = {};

        if (pieLabelOptions.position === 'Inside') {
            labelPosition = 'inside';
        }

        // formatter for display values
        labelDimensions = function (item) {
            var tempVal = '';

            for (i = 0; i < pieLabelOptions.dimension.length; i++) {
                if (i !== 0) {
                    tempVal += '\n';
                }
                if (pieLabelOptions.dimension[i] === 'Percentage') {
                    tempVal += ' ' + item.percent + '%';
                } else if (pieLabelOptions.dimension[i] === 'Value') {
                    // pie stores value as array of [value, <heat if selected>], clean value only
                    tempVal +=
                        ' ' +
                        visualizationUniversal.formatValue(
                            item.value[0],
                            dataTypes.valueType
                        );
                } else if (item.name !== 'Other') {
                    // don't format 'Other' slice grouping categories
                    tempVal += visualizationUniversal.formatValue(
                        item.name,
                        dataTypes.labelType
                    );
                } else {
                    tempVal += item.name;
                }
            }

            return tempVal;
        };

        labelObject = {
            normal: {
                show: displayValues === null ? true : displayValues,
                position: labelPosition,
                formatter: labelDimensions,
                textStyle: {
                    fontSize: fontNormal,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: fontColor,
                },
            },
        };

        if (labelObject.normal.show && pieLabelOptions.dynamicView === 'Yes') {
            // dynamicView = true;
            labelObject.emphasis = {
                show: true,
                textStyle: {
                    fontSize: fontEmphasis,
                    fontFamily: fontFamily,
                    fontWeight: fontWeight,
                    color: fontColor,
                },
            };
        }

        if (pieLabelOptions.showLabel === 'No') {
            delete labelObject.emphasis;
        }
        if (
            pieLabelOptions.showLabel === 'Yes' &&
            pieLabelOptions.dynamicView === 'No'
        ) {
            delete labelObject.emphasis;
        }

        return labelObject;
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
        formatData: formatData,
        setEChartsDataSeries: setEChartsDataSeries,
        paintWaterMark: paintWaterMark,
    };
}
