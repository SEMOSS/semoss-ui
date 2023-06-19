'use strict';

export default angular
    .module('app.cloud.service', [])
    .factory('cloudService', cloudService);

cloudService.$inject = ['VIZ_COLORS'];

function cloudService(VIZ_COLORS) {
    var valuesMapping = {};

    function getConfig(type, data, uiOptions, keys) {
        valuesMapping = getValuesMapping(keys, data.headers);

        var tempDataObject = formatData(data);

        // Configure data for ECharts
        return {
            data: setEChartsDataSeries(type, tempDataObject, uiOptions),
            legendHeaders: tempDataObject.valuesNames,
            legendLabels: tempDataObject.labelName,
            legendData: tempDataObject.labelData,
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            keys: keys,
            options: uiOptions,
        };
    }

    /**
     * @name getValueMapping
     * @desc loop through keys and grab value dimension and tooltip info
     * @param {object} keys semoss keys
     * @param {object} headers data headers
     * @returns {void}
     */
    function getValuesMapping(keys, headers) {
        var key,
            mappingByDimension = {},
            mappingByModel = {};

        mappingByModel.tooltip = [];

        for (key in keys) {
            if (keys.hasOwnProperty(key)) {
                mappingByDimension[keys[key].alias] = headers.indexOf(
                    keys[key].alias
                );
                if (keys[key].model === 'tooltip') {
                    mappingByModel.tooltip.push(
                        headers.indexOf(keys[key].alias)
                    );
                } else {
                    mappingByModel[keys[key].model] = headers.indexOf(
                        keys[key].alias
                    );
                }
            }
        }
        return {
            mappingByDimension: mappingByDimension,
            mappingByModel: mappingByModel,
        };
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Object} data - object of data in original format
     * @returns {Object} - object of data in ECharts format
     */
    function formatData(data) {
        var eChartsDataObject = {},
            labelIdx = valuesMapping.mappingByModel.label,
            valueIdx = valuesMapping.mappingByModel.value,
            i,
            j,
            tooltipIdx;

        // X-Axis Title
        eChartsDataObject.labelName = data.headers[labelIdx];
        // X-Axis Labels
        eChartsDataObject.labelData = [];
        // Y-Axis Labels (Series)
        eChartsDataObject.valuesNames = [data.headers[valueIdx]];
        // Y-Axis Data
        eChartsDataObject.valuesData = [];
        // Tooltip data
        eChartsDataObject.tooltipData = [];
        eChartsDataObject.tooltipHeaders = [];

        for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
            eChartsDataObject.tooltipHeaders.push(
                data.headers[valuesMapping.mappingByModel.tooltip[j]]
            );
        }

        for (i = 0; i < data.values.length; i++) {
            if (
                isNaN(data.values[i][valuesMapping.mappingByModel.value]) ||
                data.values[i][valuesMapping.mappingByModel.value] === null
            ) {
                continue;
            }

            eChartsDataObject.labelData.push(data.values[i][labelIdx]);
            tooltipIdx = [];
            for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
                tooltipIdx.push(
                    data.values[i][valuesMapping.mappingByModel.tooltip[j]]
                );
            }
            eChartsDataObject.tooltipData.push(tooltipIdx);
            eChartsDataObject.valuesData.push(
                data.values[i][valuesMapping.mappingByModel.value]
            );
        }

        return eChartsDataObject;
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
            seriesArray = [],
            i;

        for (i = 0; i < data.valuesNames.length; i++) {
            dataObject.name = data.valuesNames[i];
            dataObject.type = type;
            // Positioning
            dataObject.height = '98%';
            dataObject.width = '98%';
            dataObject.left = 'center';
            dataObject.right = null;
            dataObject.top = 'center';
            dataObject.bottom = null;
            // Format
            dataObject.shape = 'circle'; // or circle, triangle, triangle-forward, cardioid, diamond
            dataObject.gridSize = 4;
            dataObject.sizeRange = [10, 60];
            dataObject.rotationRange = [0, 0];
            dataObject.drawOutOfBound = false;
            // DATA
            dataObject.data = configureDataValue(data, options, i);

            seriesArray.push(dataObject);
            dataObject = {};
        }

        return seriesArray;
    }

    /**
     * @name configureDataValue
     * @param {object} data echarts data
     * @param {object} options Semoss ui options
     * @param {number} i index of for loop from parent function
     * @param {string} color color value
     * @desc builds the data values objects for series
     * @return {array} array of data values objects
     */
    function configureDataValue(data, options, i) {
        return data.valuesData.map(function (value, idx) {
            var valueObj = {
                    name:
                        typeof data.labelData[idx] === 'string'
                            ? data.labelData[idx].replace(/_/g, ' ')
                            : data.labelData[idx],
                    value: value,
                    originalValue: data.labelData[idx],
                },
                prop,
                j,
                labelData,
                valueClean;

            valueObj.textStyle = {
                color: getColor(idx, options.color),
            };

            if (i === 0 && valuesMapping.mappingByModel.tooltip.length > 0) {
                valueObj.tooltip = [];
                for (j = 0; j < data.tooltipData[idx].length; j++) {
                    valueObj.tooltip.push({
                        header: data.tooltipHeaders[j],
                        value: data.tooltipData[idx][j],
                    });
                }
            }

            if (options.colorByValue && options.colorByValue.length > 0) {
                options.colorByValue.forEach(function (rule) {
                    if (data.labelName === rule.colorOn) {
                        rule.valuesToColor.forEach(function (val) {
                            labelData = data.labelData[idx];
                            valueClean = val;

                            if (valueClean === labelData) {
                                valueObj.textStyle.color = rule.color;
                            }
                        });
                    }
                });
            }
            if (options.highlight) {
                // check all properties in our highlight data
                for (prop in options.highlight.data) {
                    if (options.highlight.data.hasOwnProperty(prop)) {
                        // if x-axis label is equal to the property we are
                        if (data.labelName === prop) {
                            options.highlight.data[prop].forEach(function (
                                hiliteValue
                            ) {
                                if (
                                    data.labelData.indexOf(
                                        hiliteValue.replace(/ /g, '_')
                                    ) === idx
                                ) {
                                    valueObj.textStyle.textBorderWidth = 3;
                                    valueObj.textStyle.textBorderColor = '#000';
                                }
                            });
                        }
                    }
                }
            }

            return valueObj;
        });
    }

    /**
     * @name getColor
     * @desc set the color of each word
     * @param {number} idx user defined panel background color
     * @param {array} color list of colors
     * @returns {string} - color hex value
     */
    function getColor(idx, color) {
        var colorIdx = idx,
            colorPalette = color;

        if (idx > colorPalette.length - 1) {
            colorIdx = idx % colorPalette.length;
        }

        return colorPalette[colorIdx];
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
