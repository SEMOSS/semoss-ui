'use strict';
/**
 * @name polar-bar-echarts.service.js
 * @desc configures echarts polar bar
 */
angular
    .module('app.polar-bar.service', [])
    .factory('polarBarService', polarBarService);

polarBarService.$inject = [];

function polarBarService() {
    var valuesMapping = {};

    function getConfig(type, data, uiOptions, colorBy, groupByInstance, keys) {
        valuesMapping = getValuesMapping(keys, data.headers);

        var tempDataObject = formatData(data),
            xAxisConfig = configureXAxis(
                tempDataObject.labelData,
                uiOptions.toggleGrid
            ),
            animation = customizeAnimation(uiOptions.animation),
            tempLabels = [],
            legendLabelStyle = {
                color:
                    uiOptions.legend.fontColor ||
                    uiOptions.fontColor ||
                    '#000000',
                fontSize:
                    parseFloat(uiOptions.legend.fontSize) ||
                    uiOptions.fontSize ||
                    12,
                fontFamily: uiOptions.legend.fontFamily || 'Inter',
                fontWeight: uiOptions.legend.fontWeight || 400,
            };

        // Set Background Color (check for watermark)
        if (/\S/.test(uiOptions.watermark)) {
            backgroundColorStyle = {
                type: 'pattern',
                image: paintWaterMark(uiOptions.watermark),
                repeat: 'repeat',
            };
        }

        tempLabels = tempDataObject.labelData;

        // Configure data for ECharts
        return {
            data: setEChartsDataSeries(
                type,
                tempDataObject,
                uiOptions,
                colorBy
            ),
            xAxisConfig: xAxisConfig,
            legendHeaders: tempDataObject.valuesNames,
            legendLabels: tempDataObject.labelName,
            legendData: tempLabels,
            showLegend: uiOptions.toggleLegend,
            legendLabelStyle: legendLabelStyle,
            showAnimation: animation.showAnimation,
            animationType: animation.defaultAnimationType,
            animationDelay: animation.defaultAnimationSpeed,
            animationDuration: animation.defaultAnimationDuration,
            axisPointer: uiOptions.axisPointer,
            barWidth: customizeBarWidth(uiOptions.editBarWidth),
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            groupByInstance: groupByInstance,
            angleAxis: getAngleAxis(uiOptions),
            options: uiOptions,
            keys: keys,
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

        mappingByModel.value = [];
        mappingByModel.tooltip = [];

        for (key in keys) {
            if (keys.hasOwnProperty(key)) {
                mappingByDimension[keys[key].alias] = headers.indexOf(
                    keys[key].alias
                );
                if (keys[key].model === 'value') {
                    mappingByModel.value.push(headers.indexOf(keys[key].alias));
                } else if (keys[key].model === 'tooltip') {
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
            i,
            n,
            j,
            valueData,
            tooltipIdx;

        // X-Axis Title
        eChartsDataObject.labelName = data.headers[labelIdx];
        // X-Axis Labels
        eChartsDataObject.labelData = [];
        // Y-Axis Labels (Series)
        eChartsDataObject.valuesNames = [];
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
            eChartsDataObject.labelData.push(data.values[i][labelIdx]);
            tooltipIdx = [];
            for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
                tooltipIdx.push(
                    data.values[i][valuesMapping.mappingByModel.tooltip[j]]
                );
            }
            eChartsDataObject.tooltipData.push(tooltipIdx);
        }

        for (n = 0; n < valuesMapping.mappingByModel.value.length; n++) {
            eChartsDataObject.valuesNames.push(
                data.headers[valuesMapping.mappingByModel.value[n]]
            );
            valueData = [];
            for (i = 0; i < data.values.length; i++) {
                valueData.push(
                    data.values[i][valuesMapping.mappingByModel.value[n]]
                );
            }
            eChartsDataObject.valuesData.push(valueData);
        }

        return eChartsDataObject;
    }

    /**
     * @name configureXAxis
     * @desc defines settings for x-axis
     * @param {bool} data - array of labels on the x-axis
     * @param {bool} options - boolean of whether or not to show a grid
     * @returns {array} - array of x-axis settings
     */
    function configureXAxis(data, options) {
        var xAxisConfig = [
            {
                type: 'category',
                data: data,
                axisTick: {
                    alignWithLabel: true,
                },
                // Toggle Grid
                splitLine: {
                    show: options,
                },
            },
        ];
        return xAxisConfig;
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
        if (param && param.chooseType === 'No Animation') {
            animationSettings.showAnimation = false;
        } else if (param) {
            animationSettings.showAnimation = true;
            animationSettings.defaultAnimationType = param.chooseType;
            animationSettings.defaultAnimationSpeed = param.animationSpeed;
            animationSettings.defaultAnimationDuration =
                param.animationDuration;
        } else {
            // default
            animationSettings.showAnimation = true;
            // TODO set as same as widget service default state
            animationSettings.defaultAnimationType = 'No Animation';
            animationSettings.defaultAnimationSpeed = 1;
            animationSettings.defaultAnimationDuration = 500;
        }
        return animationSettings;
    }

    /**
     * @name setEChartsDataSeries
     * @desc creates data series object to define ECharts viz
     * @param {string} type - chart type
     * @param {object} data - object of data in ECharts format created from formData function
     * @param {object} options - ui options
     * @param {object} colorBy - user-defined Color By Value rule(s)
     * @returns {Object} - object of ECharts data series
     */
    function setEChartsDataSeries(type, data, options, colorBy) {
        var dataObject = {},
            seriesArray = [],
            i,
            barSpecificConfig = barSpecific(type, data, options);

        for (i = 0; i < data.valuesNames.length; i++) {
            dataObject.name = data.valuesNames[i];
            // Set chart type
            if (type === 'area') {
                dataObject.type = 'line';
            } else if (type === 'barPolar') {
                dataObject.type = 'bar';
            } else {
                dataObject.type = type;
            }
            // Set Chart Data
            dataObject.data = configureDataValue(data, options, i, colorBy);

            dataObject.animation = false;

            // Define Additional Tools
            if (
                type === 'bar' ||
                type === 'barPolar' ||
                type === 'line' ||
                type === 'area'
            ) {
                Object.assign(dataObject, barSpecificConfig.barSettings);
            }
            if (type === 'barPolar') {
                dataObject.coordinateSystem = 'polar';
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
     * @param {object} colorBy - user-defined Color By Value rule(s)
     * @desc builds the data values objects for series
     * @return {array} array of data values objects
     */
    function configureDataValue(data, options, i, colorBy) {
        return data.valuesData[i].map(function (value, idx) {
            var valueObj = {},
                prop,
                j,
                labelIndex;

            valueObj.value = value;

            if (i === 0 && valuesMapping.mappingByModel.tooltip.length > 0) {
                valueObj.tooltip = [];
                for (j = 0; j < data.tooltipData[idx].length; j++) {
                    valueObj.tooltip.push({
                        header: data.tooltipHeaders[j],
                        value: data.tooltipData[idx][j],
                    });
                }
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
                                        typeof hiliteValue === 'string'
                                            ? hiliteValue
                                            : hiliteValue
                                    ) === idx
                                ) {
                                    valueObj.itemStyle = {
                                        normal: {
                                            borderColor: '#000',
                                            borderWidth: 2,
                                        },
                                    };
                                }
                            });
                        }
                    }
                }
            }

            // Color by Value
            if (colorBy) {
                data.labelData = data.labelData.map(function (label) {
                    return label;
                });

                colorBy.forEach(function (rule) {
                    if (data.labelName === rule.colorOn) {
                        rule.valuesToColor.forEach(function (name) {
                            var cleanName = name;
                            labelIndex = data.labelData.indexOf(cleanName);
                            if (idx === labelIndex) {
                                if (
                                    valueObj.hasOwnProperty('itemStyle') &&
                                    valueObj.itemStyle.hasOwnProperty('normal')
                                ) {
                                    valueObj.itemStyle.normal.color =
                                        rule.color;
                                } else {
                                    valueObj.itemStyle = {
                                        normal: {
                                            color: rule.color,
                                        },
                                    };
                                }
                            }
                        });
                    }
                });
            }

            return valueObj;
        });
    }

    /** *********************** Bar Settings  ******************************/
    /**
     * @name barSpecific
     * @desc defines bar-specific settings for chart (also used for line and area)
     * @param {object} type - chart type (bar or line)
     * @param {object} data - object of data in ECharts format created from formData function
     * @param {object} options - uiOptions
     * @returns {object} object of bar settings
     */
    function barSpecific(type, data, options) {
        var barSettings = {},
            dataArray = [];
        if (type === 'bar') {
            barSettings.barGap = '5%';
        }
        // Toggle Stack
        if (options.toggleStack === true) {
            barSettings.stack = 'toggleStack';
        }

        return {
            barSettings: barSettings,
            additionalDataObjects: dataArray,
        };
    }

    /**
     * @name customizeBarWidth
     * @desc sets the bar with
     * @param {object} param - object of whether or not to use default width (yes or no) and bar width
     * @returns {string} customized bar width
     */
    function customizeBarWidth(param) {
        var barWidth;
        if (param && param.defaultWidth !== 'Yes') {
            barWidth = param.barWidth;
        } else {
            barWidth = 0;
        }
        return barWidth;
    }

    /**
     * @name getAngleAxis
     * @desc define min and max of the angle axis if specified by user
     * @param {object} uiOptions - options for chart
     * @returns {object} angle settings
     */
    function getAngleAxis(uiOptions) {
        var returnObj = {},
            minMax = uiOptions.minMax,
            gridOptions = uiOptions.grid,
            axis = uiOptions.axis;

        if (minMax) {
            if (minMax.min.show && typeof minMax.min.value !== 'undefined') {
                returnObj.min = minMax.min.value;
            }
            if (minMax.max.show && typeof minMax.max.value !== 'undefined') {
                returnObj.max = minMax.max.value;
            }
        }

        if (gridOptions) {
            returnObj.splitLine = {
                show: true,
                lineStyle: gridOptions,
            };
        }

        if (axis) {
            returnObj.axisLine = {
                lineStyle: {
                    color: axis.borderColor,
                    width: parseFloat(axis.borderWidth) || 1,
                },
            };
            returnObj.axisLabel = {
                fontWeight: parseInt(axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(axis.label.fontSize) || uiOptions.fontSize,
                fontFamily: axis.label.fontFamily || 'Inter',
                color: axis.label.fontColor || uiOptions.fontColor,
            };
        }

        return returnObj;
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
        setEChartsDataSeries: setEChartsDataSeries,
        formatData: formatData,
        customizeAnimation: customizeAnimation,
        configureXAxis: configureXAxis,
        barSpecific: barSpecific,
        customizeBarWidth: customizeBarWidth,
        paintWaterMark: paintWaterMark,
    };
}
