'use strict';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

export default angular
    .module('app.funnel.service', [])
    .factory('funnelService', funnelService);

funnelService.$inject = [];

function funnelService() {
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
            groupedData,
            keyInfo,
            i;

        getDataTypes(keys, uiOptions);

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
                        groupBy,
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
                groupBy,
                valuesMapping,
                keys
            );
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

        // Configure data for ECharts
        return {
            data: finalData,
            valueDimension: data.headers[valuesMapping.mappingByModel.value],
            legendHeaders: getLegendHeaders(data.values, valuesMapping),
            legendLabels: getLegendLabels(data.headers, valuesMapping),
            showLegend: options.toggleLegend || false,
            legendLabelStyle: legendLabelStyle,
            axisPointer: options.axisPointer || null,
            backgroundColorStyle: getBackgroundColorStyle(options.watermark),
            groupByInstance: groupByInstance,
            options: options,
            keys: keys,
            dataTypes: dataTypes,
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

    function getLegendLabels(headers, valuesMapping) {
        var label = '';
        if (headers && Array.isArray(headers)) {
            label = headers[valuesMapping.mappingByModel.label];
        }
        return label;
    }

    function getLegendHeaders(values, valuesMapping) {
        var legendHeaders = [],
            i;

        if (values && Array.isArray(values)) {
            for (i = 0; i < values.length; i++) {
                legendHeaders.push(
                    values[i][valuesMapping.mappingByModel.label]
                );
            }
        }

        return legendHeaders;
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
            dataArray = [];

        if (values && Array.isArray(values)) {
            for (i = 0; i < values.length; i++) {
                dataObj = {};
                dataObj.value = values[i][valuesMapping.mappingByModel.value];
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
                    colorBy.forEach(function (rule) {
                        var header = headers.indexOf(rule.colorOn),
                            i,
                            cleanName,
                            cleanObjValue,
                            cleanRuleValue;

                        if (header !== -1) {
                            for (i = 0; i < rule.valuesToColor.length; i++) {
                                if (typeof rule.valuesToColor[i] === 'string') {
                                    cleanRuleValue = rule.valuesToColor[i];
                                } else {
                                    cleanRuleValue = rule.valuesToColor[i];
                                }

                                if (typeof dataObj.name === 'string') {
                                    cleanName = dataObj.name;
                                } else {
                                    cleanName = dataObj.name;
                                }

                                if (typeof dataObj.value === 'string') {
                                    cleanObjValue = dataObj.value;
                                } else {
                                    cleanObjValue = dataObj.value;
                                }

                                if (
                                    cleanName === cleanRuleValue ||
                                    cleanRuleValue === cleanObjValue
                                ) {
                                    if (
                                        dataObj.hasOwnProperty('itemStyle') &&
                                        dataObj.itemStyle.hasOwnProperty(
                                            'normal'
                                        )
                                    ) {
                                        dataObj.itemStyle.normal.color =
                                            rule.color;
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
                        }
                    });
                }

                dataArray.push(dataObj);
            }
        }
        return dataArray;
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
     * @param {object} groupBy - facet info
     * @param {object} valuesMapping - values mapping
     * @returns {Object} - object of ECharts data series
     */
    function setEChartsDataSeries(
        type,
        rawData,
        colorBy,
        options,
        groupBy,
        valuesMapping,
        keys
    ) {
        // TODO add ability to show a second Value dimension (it two: right align and left, align)
        var dataObject = {},
            funnelData = formatData(
                rawData.values,
                rawData.headers,
                options.highlight,
                colorBy,
                valuesMapping
            );

        dataObject.type = type;
        dataObject.name = getHeaderNames(rawData.headers);
        dataObject.data = funnelData || [];

        if (!(groupBy && groupBy.viewType === 'All Instances')) {
            dataObject.width = '60%';
            dataObject.height = '75%';
            dataObject.top = 'center';
            dataObject.left = 'center';
        }

        dataObject.funnelAlign = options.changeAlignment || 'center';
        dataObject.gap = 1;
        dataObject.sort = getFunnelOrder(options.flipOrder);
        dataObject.label = customizeFunnelLabel(
            options.customizeFunnelLabel,
            options.displayValues,
            groupBy,
            keys,
            options
        );
        dataObject.animation = false;
        dataObject.avoidLabelOverlap = false;

        // Toggle Shadow
        if (options.toggleShadow === true) {
            dataObject.itemStyle = {
                normal: {
                    shadowBlur: 50,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            };
        }

        return dataObject;
    }

    /**
     * @name getFunnelOrder
     * @desc defines funnel orientation
     * @param {bool} options - uiOptions.flipOrder setting
     * @returns {string} ascending or descending order
     */
    function getFunnelOrder(options) {
        var order = 'descending';
        if (options === true) {
            order = 'ascending';
        } else {
            order = 'descending';
        }
        return order;
    }

    /**
     * @name customizeFunnelLabel
     * @desc defines funnel label settings for chart
     * @param {object} funnelLabelOptions - uiOptions.customizeFunnelLabel settings
     * @param {bool} displayValues - uiOptions.displayValues
     * @param {object} groupBy - Facet Info
     * @returns {object} object of funnel label settings
     */
    function customizeFunnelLabel(
        funnelLabelOptions,
        displayValues,
        groupBy,
        keys,
        options
    ) {
        var showLabel = false,
            labelPosition = 'inside',
            labelSize =
                parseFloat(options.valueLabel.fontSize) ||
                options.fontSize ||
                12,
            labelWeight = options.valueLabel.fontWeight || 400,
            labelFamily = options.valueLabel.fontFamily || 'Inter',
            labelColor =
                options.valueLabel.fontColorAlt ||
                options.valueLabel.fontColor ||
                '#FFFFFF',
            labelObject = {},
            dynamicView = {};

        // Position
        if (funnelLabelOptions.position === 'Outside') {
            labelPosition = 'outside';
        } else {
            labelPosition = 'inside';
        }

        // Show Label
        if (displayValues) {
            showLabel = true;
        } else {
            showLabel = false;
            dynamicView = {
                show: true,
                position: labelPosition,
                textStyle: {
                    fontSize: labelSize + 2,
                    fontWeight: labelWeight,
                    fontFamily: labelFamily,
                    color: labelColor,
                },
            };
        }

        labelObject = {
            normal: {
                show: showLabel,
                position: labelPosition,
                formatter: function (info) {
                    if (funnelLabelOptions.dimension === 'Percentage') {
                        return info.percent + '%';
                    } else if (funnelLabelOptions.dimension === 'Value') {
                        return visualizationUniversal.formatValue(
                            info.value,
                            dataTypes.valueType
                        );
                    }
                    if (info.name !== 'Other') {
                        return visualizationUniversal.formatValue(
                            info.name,
                            dataTypes.labelType
                        );
                    } else {
                        return info.name;
                    }
                },
                textStyle: {
                    fontSize: labelSize,
                    fontWeight: labelWeight,
                    fontFamily: labelFamily,
                    color: labelColor,
                },
            },
            emphasis: dynamicView,
        };
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
    };
}
