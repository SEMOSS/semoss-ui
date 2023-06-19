'use strict';

import * as d3 from 'd3';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';
import ecStat from '@/widget-resources/js/echarts/statistics/ecStat.js';
import visualizationUniversal from '@/core/store/visualization/visualization.js';

angular
    .module('app.scatter-echarts.service', [])
    .factory('scatterService', scatterService);

function scatterService() {
    function getEchartsConfig(
        type,
        data,
        uiOptions,
        keys,
        colorBy,
        groupByInstance,
        groupBy
    ) {
        var tempDataObject,
            reverseYAxis = flipYAxis(uiOptions.yReversed),
            reverseXAxis = flipXAxis(uiOptions.xReversed),
            xAxisConfig,
            yAxisConfig,
            animation = customizeAnimation(uiOptions.animation),
            finalData = [],
            facetLegendHeaders,
            tempHeaders,
            finalSchema,
            groupedData,
            i,
            extremes = {},
            chartTitle = {};

        if (groupBy && groupBy.viewType === 'All Instances') {
            tempDataObject = [];
            xAxisConfig = [];
            yAxisConfig = [];
            finalSchema = [];
            tempHeaders = [];
            extremes = findMaxMin(data.values);

            for (i = 0; i < groupBy.uniqueInstances.length; i++) {
                groupedData = {};
                groupedData.headers = data.headers;
                groupedData.rawHeaders = data.rawHeaders;
                groupedData.values =
                    groupBy.tempData[groupBy.uniqueInstances[i]];

                tempDataObject.push(
                    formatData(groupedData, keys, uiOptions, colorBy)
                );
                xAxisConfig.push(
                    setXaxis(
                        uiOptions,
                        reverseXAxis,
                        keys,
                        groupBy,
                        i,
                        extremes.x
                    )[0]
                );
                yAxisConfig.push(
                    setYaxis(
                        uiOptions,
                        reverseYAxis,
                        keys,
                        groupBy,
                        i,
                        extremes.y
                    )[0]
                );

                finalData = finalData.concat(
                    setEChartsDataSeries(
                        type,
                        tempDataObject[i],
                        uiOptions,
                        i,
                        keys,
                        tempDataObject.valuesMapping
                    )
                );
                finalSchema.push(
                    setEChartsDataSchema(tempDataObject[i].valuesNames)
                );
                tempHeaders = tempHeaders.concat(
                    tempDataObject[i].legendHeaders
                );
            }

            facetLegendHeaders = tempHeaders.filter(function (val, idx, self) {
                return self.indexOf(val) === idx;
            }); // remove dups
        } else {
            tempDataObject = formatData(data, keys, uiOptions, colorBy);
            yAxisConfig = setYaxis(
                uiOptions,
                reverseYAxis,
                keys,
                groupBy,
                0,
                {}
            );
            xAxisConfig = setXaxis(
                uiOptions,
                reverseXAxis,
                keys,
                groupBy,
                0,
                {}
            );
            animation = customizeAnimation(uiOptions.animation);
            finalData = setEChartsDataSeries(
                type,
                tempDataObject,
                uiOptions,
                0,
                keys,
                tempDataObject.valuesMapping
            );
            finalSchema = setEChartsDataSchema(tempDataObject.valuesNames);
        }

        // check how many x axis values we have, if over limit we will activate zoom if it has not been set
        if (typeof uiOptions.toggleZoomXEnabled !== 'boolean') {
            // if (finalData[0].data.length > 50) {
            //     uiOptions.toggleZoomX = true;
            // } else {
            //     uiOptions.toggleZoomX = false;
            // }
        } else if (typeof uiOptions.toggleZoomXEnabled === 'boolean') {
            uiOptions.toggleZoomX = uiOptions.toggleZoomXEnabled;
        }

        // set chart title text & styles
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

        // Configure data for ECharts
        return {
            data: finalData,
            xAxisConfig: xAxisConfig,
            yAxisConfig: yAxisConfig,
            chartMapping: tempDataObject.valuesMapping,
            legendHeaders: tempDataObject.legendHeaders || facetLegendHeaders,
            legendLabels: Array.isArray(tempDataObject)
                ? tempDataObject[0].labelName
                : tempDataObject.labelName,
            legendData: tempDataObject.labelData || [],
            showLegend: uiOptions.toggleLegend,
            legendLabelStyle: legendLabelStyle,
            showAnimation: animation.showAnimation,
            animationType: animation.defaultAnimationType,
            animationDelay: animation.defaultAnimationSpeed,
            animationDuration: animation.defaultAnimationDuration,
            axisPointer: setAxisPointer(uiOptions.toggleAxisPointer),
            backgroundColorStyle: getBackgroundColorStyle(uiOptions.watermark),
            groupByInstance: groupByInstance,
            options: uiOptions,
            schema: finalSchema,
            // schema: setEChartsDataSchema(tempDataObject.valuesNames),
            runSeries: tempDataObject.runSeries,
            runSize: tempDataObject.runSize,
            keys: keys,
            dataTypes: getDataTypes(keys, uiOptions),
            title: chartTitle,
        };
    }

    /**
     * @name getDataTypes
     * @desc gets the data formatting options for each dimension
     * @param {Object} keys - object of data keys
     * @param {object} options - uiOptions
     * @returns {*} the data type mappings
     */
    function getDataTypes(keys, options) {
        var dataTypes = {};
        let k, j, formatType, newFormat;

        for (k = 0; k < keys.length; k++) {
            if (keys[k].model !== 'facet') {
                dataTypes[keys[k].alias] = [];
                formatType = visualizationUniversal.mapFormatOpts(keys[k]);
                dataTypes[keys[k].alias].push(formatType);
            }
            if (options.formatDataValues && keys[k].model !== 'facet') {
                for (j = 0; j < options.formatDataValues.formats.length; j++) {
                    newFormat = options.formatDataValues.formats[j];
                    if (keys[k].alias === newFormat.dimension) {
                        dataTypes[newFormat.dimension] = [];
                        dataTypes[newFormat.dimension].push(newFormat);
                    }
                }
            }
        }

        return dataTypes;
    }

    /**
     * @name findMaxMin
     * @desc if Group By All Instances exists, find the max and min value for the x-axis and y-axis
     * @param {Array} data - semoss data
     * @returns {obj} max and min values
     */
    function findMaxMin(data) {
        var extremes = {},
            dataXArray = [],
            dataYArray = [],
            len = data.length,
            i;

        for (i = 0; i < len; i++) {
            dataXArray.push(data[i][1]);
            dataYArray.push(data[i][2]);
        }

        extremes.x = {};
        extremes.y = {};
        extremes.x.min = Math.min.apply(null, dataXArray);
        extremes.x.max = Math.max.apply(null, dataXArray);
        extremes.y.min = Math.min.apply(null, dataYArray);
        extremes.y.max = Math.max.apply(null, dataYArray);

        if (extremes.x.min > 0) {
            extremes.x.min = 0;
        }

        if (extremes.y.min > 0) {
            extremes.y.min = 0;
        }

        return extremes;
    }

    function setAxisPointer(param) {
        var axisPointer = 'cross';
        if (param === true) {
            axisPointer = 'cross';
        } else {
            axisPointer = '';
        }
        return axisPointer;
    }

    /**
     * @name getZScale
     * @param {object} data the data for the z scale
     * @desc gets the scale for the z axis
     * @returns {object} the zaxis scale
     */
    function getZScale(data) {
        var zAxisScale = d3
            .scaleLinear()
            .domain([d3.min(data), d3.max(data)])
            .rangeRound([8, 45])
            .nice();
        return zAxisScale;
    }

    /**
     * @name setEChartsDataSchema
     * @desc format schema for displaying tooltip
     * @param {Object} data - headers in same order as data
     * @returns {Object} - tooltip schema
     */
    function setEChartsDataSchema(data) {
        var schema = [],
            i,
            obj;

        for (i = 0; i < data.length; i++) {
            obj = {};
            obj.name = data[i];
            obj.index = i;

            schema.push(obj);
        }

        return schema;
    }

    /**
     * @name findModelIndex
     * @param {array} headers - chart headers
     * @param {string} alias - header alias we are looking for
     * @returns {number} index of where the alias is
     */
    function findModelIndex(headers, alias) {
        var i,
            len = headers.length;
        for (i = 0; i < len; i++) {
            if (headers[i] === alias) {
                break;
            }
        }

        return i;
    }

    /**
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {Object} data - object of data in original format
     * @param {Array} keys - the alignments
     * @param {Object} uiOptions - the ornaments we will use to paint
     * @param {number} colorBy index of the data to highlight
     * @returns {Object} - object of data in eCharts format
     */
    function formatData(data, keys, uiOptions, colorBy) {
        var eChartsDataObject = {},
            tempNames = [],
            runSeries = false,
            runSize = false,
            i,
            x,
            xValueData = [],
            yValueData = [],
            zValueData = [],
            seriesValueData = [],
            headerNames = [],
            legendHeaders,
            dataPointValues,
            dataPoint,
            tipIdx,
            indices = {};
        if (!data.headers) {
            return {};
        }

        // Figure out the indexes for each respective piece of data
        // since data doesn't always come in the same order when brushing
        keys.forEach(function (key) {
            if (key.model === 'tooltip') {
                if (!indices[key.model]) {
                    indices[key.model] = [];
                }
                indices[key.model].push(
                    findModelIndex(data.headers, key.alias)
                );
            } else {
                indices[key.model] = findModelIndex(data.headers, key.alias);
            }
        });

        if (indices.hasOwnProperty('series')) {
            runSeries = true;
        }

        if (indices.hasOwnProperty('z')) {
            runSize = true;
        }

        eChartsDataObject.labelName = data.headers[indices.label]; // Label dimension  (genre)
        eChartsDataObject.regressionData = [];

        for (i = 0; i < data.values.length; i++) {
            if (runSeries) {
                tempNames.push(data.values[i][indices.series]);
                headerNames.push(data.values[i][indices.label]);
                seriesValueData.push(data.values[i][indices.series]);
            } else {
                tempNames.push(data.values[i][indices.label]);
            }

            if (uiOptions.regressionLine !== 'None') {
                eChartsDataObject.regressionData.push([
                    data.values[i][indices.x],
                    data.values[i][indices.y],
                ]);
            }

            if (runSize) {
                zValueData.push(data.values[i][indices.z]);
            }

            xValueData.push(data.values[i][indices.x]);
            yValueData.push(data.values[i][indices.y]);
        }
        eChartsDataObject.valuesData = []; // numerical data
        eChartsDataObject.schema = []; // numerical data
        eChartsDataObject.valuesData.push(xValueData);
        eChartsDataObject.valuesData.push(yValueData);

        legendHeaders = tempNames.filter(function (val, idx, self) {
            return self.indexOf(val) === idx; // remove dups
        });

        eChartsDataObject.valuesNames = JSON.parse(
            JSON.stringify(data.headers)
        );
        eChartsDataObject.valuesNames.splice(indices.label, 1); // Value dimensions (Average of Movie Budget, etc.)

        if (runSize) {
            eChartsDataObject.valuesData.push(zValueData);
            eChartsDataObject.zScale = getZScale(
                eChartsDataObject.valuesData[2]
            );
            eChartsDataObject.runSize = true;
            // Add label data into valuesNames
            eChartsDataObject.valuesNames.splice(
                3,
                0,
                data.headers[indices.label]
            );
        } else {
            eChartsDataObject.runSize = false;
            // Add label data into valuesNames
            eChartsDataObject.valuesNames.splice(
                2,
                0,
                data.headers[indices.label]
            );
        }

        if (runSeries) {
            eChartsDataObject.legendHeaders = legendHeaders;
            eChartsDataObject.labelData = headerNames;
            eChartsDataObject.valuesData.push(seriesValueData);
            eChartsDataObject.runSeries = true;
        } else {
            eChartsDataObject.legendHeaders = [];
            eChartsDataObject.legendHeaders.push(eChartsDataObject.labelName);
            eChartsDataObject.labelData = tempNames;
            eChartsDataObject.runSeries = false;
        }

        eChartsDataObject.chartData = [];
        for (x = 0; x < eChartsDataObject.labelData.length; x++) {
            dataPointValues = [];
            dataPoint = {};

            for (i = 0; i < eChartsDataObject.valuesData.length; i++) {
                dataPointValues.push(eChartsDataObject.valuesData[i][x]);
            }

            if (indices.tooltip) {
                for (tipIdx = 0; tipIdx < indices.tooltip.length; tipIdx++) {
                    dataPointValues.push(
                        data.values[x][indices.tooltip[tipIdx]]
                    );
                }
            }

            // push in the label instance last so we can reference in events as the last element
            dataPointValues.push(eChartsDataObject.labelData[x]);

            dataPoint.value = dataPointValues;

            if (uiOptions.highlight) {
                dataPoint = highlight(dataPoint, uiOptions.highlight);
            }

            // Color by Value
            if (colorBy && colorBy.length > 0) {
                dataPoint = colorByValue(dataPoint, colorBy);
            }

            // Instance-level labels
            if (uiOptions.label) {
                dataPoint = label(
                    dataPoint,
                    uiOptions.label,
                    eChartsDataObject.runSeries
                );
            }

            eChartsDataObject.chartData.push(dataPoint);
        }

        eChartsDataObject.valuesMapping = getValuesMapping(
            eChartsDataObject.chartData[0]
                ? eChartsDataObject.chartData[0].value
                : [],
            data.values[0] || [],
            data.headers
        );

        return eChartsDataObject;
    }

    function getValuesMapping(dataSample, inputSample, headers) {
        var i,
            j,
            tempSample = '',
            tempValuesArr = [],
            valuesMapping = {};

        for (i = 0; i < inputSample.length; i++) {
            if (typeof inputSample[i] === 'string') {
                tempSample = inputSample[i];
            } else {
                tempSample = inputSample[i];
            }

            for (j = 0; j < dataSample.length; j++) {
                if (
                    tempSample === dataSample[j] &&
                    tempValuesArr.indexOf(j) === -1
                ) {
                    valuesMapping[headers[i]] = j;
                    tempValuesArr.push(j);
                    break;
                }
            }
        }

        return valuesMapping;
    }

    /**
     * @name colorByValue
     * @param {object} dataPoint - data point to color
     * @param {array} colorBy - rules to color the data by
     * @desc color a datapoint
     * @return {object} colored - value
     */
    function colorByValue(dataPoint, colorBy) {
        // TODO: we need to standardize the data that we use and when we convert from '_' to ' '
        var tempData = JSON.parse(JSON.stringify(dataPoint));

        tempData.value = tempData.value.map(function (val) {
            return val;
        });

        colorBy.forEach(function (rule) {
            var ruleIdx = 0,
                ruleLen = rule.valuesToColor.length;

            for (; ruleIdx < ruleLen; ruleIdx++) {
                // validate that it is there by matching the 'dirty strings'... this isn't the proper way to do it with Dates. Dates can have ' '
                if (tempData.value.indexOf(rule.valuesToColor[ruleIdx]) > -1) {
                    if (
                        dataPoint.hasOwnProperty('itemStyle') &&
                        dataPoint.itemStyle.hasOwnProperty('normal')
                    ) {
                        dataPoint.itemStyle.normal.color = rule.color;
                    } else {
                        dataPoint.itemStyle = {
                            normal: {
                                color: rule.color,
                            },
                        };
                    }
                    break;
                }
            }
        });

        return dataPoint;
    }

    /**
     * @name highlightData
     * @param {*} data the data object we want to check to see if we need to highlight
     * @param {object} highlightData the data we want to highlight
     * @returns {object} the modified data to add border color if it's data we want to highlight
     */
    function highlight(data, highlightData) {
        var tempData = JSON.parse(JSON.stringify(data)),
            highlightKey,
            i;

        for (highlightKey in highlightData.data) {
            // do the checks to see if we need to highlight this data point
            if (highlightData.data.hasOwnProperty(highlightKey)) {
                for (i = 0; i < highlightData.data[highlightKey].length; i++) {
                    // TODO need to figure out how to resolve this underscore data and no underscore view issue...
                    if (
                        tempData.value.indexOf(
                            highlightData.data[highlightKey][i]
                        ) > -1
                    ) {
                        tempData.itemStyle = {
                            normal: {
                                borderColor: '#000',
                                borderWidth: 2,
                            },
                        };
                        break;
                    }
                }
            }
        }

        return tempData;
    }

    /**
     * @name label
     * @param {*} data the data object we want to check to see if we need to highlight
     * @param {object} labelData the data we want to label
     * @param {bool} runSeries whether or not a color dimension exists
     * @returns {object} the modified data to add label
     */
    function label(data, labelData, runSeries) {
        var item;

        for (item in labelData) {
            if (labelData.hasOwnProperty(item)) {
                // eslint-disable-next-line no-loop-func
                labelData[item].forEach(function (labelValue) {
                    if (data.value.indexOf(labelValue) > -1) {
                        data.label = {
                            show: true,
                            formatter: function (obj) {
                                if (runSeries) {
                                    return cleanValue(obj.seriesName);
                                }
                                // if (valuesMapping.hasOwnProperty(obj.seriesName)) {
                                //     return cleanValue(obj.value[valuesMapping[obj.seriesName]]);
                                // }
                                return cleanValue(obj.value[2]);
                            },
                        };
                    }
                });
            }
        }

        return data;
    }

    /**
     * @name flipYAxis
     * @desc reverses y-axis
     * @param {bool} param - uiOptions.yReversed - boolean of whether or not to flip y-axis
     * @returns {bool} - bool of y-axis direction
     */
    function flipYAxis(param) {
        // TODO remove, does this change any functionality
        // return param does the same thing => why have the function
        var reverseYAxis = false;
        if (param) {
            reverseYAxis = true;
        }
        return reverseYAxis;
    }

    /**
     * @name flipXAxis
     * @desc reverses x-axis
     * @param {bool} param - uiOptions.xReversed - boolean of whether or not to flip x-axis
     * @returns {bool} - bool of x-axis direction
     */
    function flipXAxis(param) {
        // TODO remove, does this change any functionality
        // return param does the same thing => why have the function
        var reverseXAxis = false;
        if (param) {
            reverseXAxis = true;
        }
        return reverseXAxis;
    }

    /**
     * @name setYAxis
     * @desc sets configuration of y-axis (min, max, and inverse bool)
     * @param {Object} uiOptions - uiOptions
     * @param {bool} reverse - boolean of whether or not to reverse y-axis
     * @param {Array} keys - array of data keys
     * @param {Object} groupBy - object of groupBy info
     * @param {num} idx - groupBy instance index
     * @param {Object} extremes - max and min of group by all instances
     * @returns {Array} - array of object of y-axis configuration
     */
    function setYaxis(uiOptions, reverse, keys, groupBy, idx, extremes) {
        var yAxis,
            i,
            yMin = null,
            yMax = null,
            axisTitle = '',
            showAxisValues,
            showAxisLine,
            showAxisTicks,
            nameGap = 15,
            key,
            formatType,
            settings = uiOptions.editYAxis,
            grid = uiOptions.editGrid.y,
            flipAxis = uiOptions.rotateAxis,
            fontSize = uiOptions.fontSize
                ? uiOptions.fontSize.substring(
                      0,
                      uiOptions.fontSize.indexOf('p')
                  )
                : 12,
            fontColor = uiOptions.fontColor || 'black',
            dataTypes = getDataTypes(keys, uiOptions),
            axisLineStyle = {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            };

        // get data type and header name of y-axis
        for (key in keys) {
            if (keys[key].model === 'y') {
                formatType = dataTypes[keys[key].alias][0];
            }
        }

        if (groupBy && groupBy.viewType === 'All Instances') {
            yMax = Math.ceil(extremes.max);
            yMin = Math.floor(extremes.min);
        }

        if (settings) {
            if (settings.title.show) {
                axisTitle = settings.title.name
                    ? cleanValue(settings.title.name)
                    : settings.title.name;
            } else {
                axisTitle = null;
            }
            nameGap = settings.nameGap;
            showAxisValues = settings.values;
            showAxisLine = settings.line;
            showAxisTicks = settings.line ? settings.showTicks : false;
            if (settings.min) {
                if (settings.min.show) {
                    yMin = settings.min.value;
                }
            }
            if (settings.max) {
                if (settings.max.show) {
                    yMax = settings.max.value;
                }
            }
        } else {
            for (key in keys) {
                if (keys[key].model === 'y') {
                    axisTitle = cleanValue(keys[key].alias);
                }
            }
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        yAxis = [
            {
                name: axisTitle,
            },
        ];
        yAxis[0].min = yMin;
        yAxis[0].max = yMax;
        yAxis[0].nameGap = nameGap;

        // Not Conditional
        yAxis[0].nameTextStyle = {
            fontWeight: parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
            fontSize: parseFloat(uiOptions.axis.name.fontSize) || fontSize,
            fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
            color: uiOptions.axis.name.fontColor || fontColor,
        };
        yAxis[0].inverse = reverse;
        yAxis[0].type = 'value';
        yAxis[0].splitLine = {
            show: grid,
            lineStyle: uiOptions.grid,
        };
        yAxis[0].axisLabel = {
            show: showAxisValues,
            formatter: function (value) {
                return EchartsHelper.formatLabel(
                    value,
                    settings.format,
                    formatType
                );
            },
            rotate: settings.rotate || 0,
            fontWeight: parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
            fontSize: parseFloat(uiOptions.axis.label.fontSize) || fontSize,
            fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
            color: uiOptions.axis.label.fontColor || fontColor,
        };
        yAxis[0].gridIndex = idx;
        yAxis[0].scale = true;
        yAxis[0].axisTick = {
            show: showAxisTicks,
            alignWithLabel: true,
            lineStyle: axisLineStyle,
        };
        yAxis[0].axisLine = {
            show: showAxisLine,
            lineStyle: axisLineStyle,
        };

        if (reverse) {
            yAxis[0].nameLocation = 'start';
        } else {
            yAxis[0].nameLocation = 'end';
        }

        if (axisTitle) {
            if (axisTitle.length > 10 && (axisTitle.length < 15) & !flipAxis) {
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
        // format xAxis axisPointer when data values are formatted
        yAxis[0].axisPointer = {
            label: {
                show: true,
                formatter: function (params) {
                    for (i = 0; i < Object.values(dataTypes).length; i++) {
                        if (
                            yAxis[0].name ===
                            Object.values(dataTypes)
                                [i][0].dimension.split('_')
                                .join(' ')
                        ) {
                            return EchartsHelper.formatLabel(
                                params.value,
                                settings.format,
                                Object.values(dataTypes)[i][0]
                            );
                        }
                    }
                    return params.value;
                },
            },
        };

        return yAxis;
    }

    /**
     * @name setXAxis
     * @desc sets configuration of y-axis (min, max, and inverse bool)
     * @param {Object} uiOptions - uiOptions
     * @param {bool} reverse - boolean of whether or not to reverse y-axis
     * @param {Array} keys - array of data keys
     * @param {Object} groupBy - object of groupBy info
     * @param {num} idx - groupBy instance index
     * @param {Object} extremes - max and min of group by all instances
     * @returns {Array} - array of object of y-axis configuration
     */
    function setXaxis(uiOptions, reverse, keys, groupBy, idx, extremes) {
        var xAxis,
            i,
            axisTitle = '',
            xMin = null,
            xMax = null,
            showAxisValues,
            nameGap = 25,
            showAxisLine,
            showAxisTicks,
            labelRotate = 0,
            key,
            formatType,
            settings = uiOptions.editXAxis,
            grid = uiOptions.editGrid.xScatter,
            fontSize = uiOptions.fontSize
                ? uiOptions.fontSize.substring(
                      0,
                      uiOptions.fontSize.indexOf('p')
                  )
                : 12,
            fontColor = uiOptions.fontColor || 'black',
            dataTypes = getDataTypes(keys, uiOptions),
            axisLineStyle = {
                color: uiOptions.axis.borderColor,
                width: parseFloat(uiOptions.axis.borderWidth),
            };

        // get data type and header name of x-axis
        for (key in keys) {
            if (keys[key].model === 'x') {
                formatType = dataTypes[keys[key].alias][0];
            }
        }

        if (groupBy && groupBy.viewType === 'All Instances') {
            xMax = Math.ceil(extremes.max);
            xMin = Math.floor(extremes.min);
        }

        if (settings) {
            if (settings.title.show) {
                axisTitle = settings.title.name
                    ? cleanValue(settings.title.name)
                    : settings.title.name;
            } else {
                axisTitle = null;
            }
            showAxisValues = settings.values;
            nameGap = settings.nameGap;
            showAxisLine = settings.line;
            showAxisTicks = settings.line ? settings.showTicks : false;
            labelRotate = settings.rotate;
            if (settings.min) {
                if (settings.min.show) {
                    xMin = settings.min.value;
                }
            }
            if (settings.max) {
                if (settings.max.show) {
                    xMax = settings.max.value;
                }
            }
        } else {
            for (key in keys) {
                if (keys[key].model === 'x') {
                    axisTitle = cleanValue(keys[key].alias);
                }
            }
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        xAxis = [
            {
                name: axisTitle,
            },
        ];

        xAxis[0].min = xMin;
        xAxis[0].max = xMax;

        // Not Conditional
        xAxis[0].nameLocation = 'center';
        xAxis[0].nameGap = nameGap;
        xAxis[0].nameTextStyle = {
            fontWeight: parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
            fontSize: parseFloat(uiOptions.axis.name.fontSize) || fontSize,
            fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
            color: uiOptions.axis.name.fontColor || fontColor,
        };
        xAxis[0].inverse = reverse;
        xAxis[0].type = 'value';
        xAxis[0].splitLine = {
            show: grid,
            lineStyle: uiOptions.grid,
        };
        xAxis[0].axisLabel = {
            show: showAxisValues,
            rotate: labelRotate,
            formatter: function (value) {
                return EchartsHelper.formatLabel(
                    value,
                    settings.format,
                    formatType
                );
            },
            fontWeight: parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
            fontSize: parseFloat(uiOptions.axis.label.fontSize) || fontSize,
            fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
            color: uiOptions.axis.label.fontColor || fontColor,
        };
        xAxis[0].gridIndex = idx;
        xAxis[0].scale = true;
        xAxis[0].axisTick = {
            show: showAxisTicks,
            alignWithLabel: true,
            lineStyle: axisLineStyle,
        };
        xAxis[0].axisLine = {
            show: showAxisLine,
            lineStyle: axisLineStyle,
        };
        // format xAxis axisPointer when data values are formatted
        xAxis[0].axisPointer = {
            label: {
                show: true,
                formatter: function (params) {
                    for (i = 0; i < Object.values(dataTypes).length; i++) {
                        if (
                            xAxis[0].name ===
                            Object.values(dataTypes)
                                [i][0].dimension.split('_')
                                .join(' ')
                        ) {
                            return EchartsHelper.formatLabel(
                                params.value,
                                settings.format,
                                Object.values(dataTypes)[i][0]
                            );
                        }
                    }
                    return params.value;
                },
            },
        };

        return xAxis;
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
     * @param {num} idx - groupBy instance index
     * @param {*} keys key
     * @param {*} valuesMapping valuesMapping
     * @returns {Object} - object of ECharts data series
     */
    function setEChartsDataSeries(
        type,
        data,
        options,
        idx,
        keys,
        valuesMapping
    ) {
        var dataObject = {},
            seriesArray = [],
            regression,
            i,
            markLineIdx = 0,
            markAreaIdx = 0,
            series = {},
            newDataObject,
            valueLabel = options.valueLabel;

        dataObject.type = type;

        dataObject.data = [];
        if (data.legendHeaders.length === 1) {
            dataObject.name = data.legendHeaders[0];
            dataObject.data = data.chartData;
            configDataObj(dataObject, options, data, idx, keys, valuesMapping);
            seriesArray.push(dataObject);
        } else {
            data.chartData.forEach(function (value) {
                var seriesProperty, valueIdx, legendIdx;

                outerloop: for (
                    valueIdx = 0;
                    valueIdx < value.value.length;
                    valueIdx++
                ) {
                    for (
                        legendIdx = 0;
                        legendIdx < data.legendHeaders.length;
                        legendIdx++
                    ) {
                        if (
                            value.value[valueIdx] ===
                            data.legendHeaders[legendIdx]
                        ) {
                            seriesProperty = value.value[valueIdx];
                            break outerloop;
                        }
                    }
                }
                if (series[seriesProperty]) {
                    series[seriesProperty].push(value);
                } else {
                    series[seriesProperty] = [value];
                }
            });

            Object.keys(series).forEach(function (prop) {
                newDataObject = {
                    data: [],
                    type: 'scatter',
                };
                configDataObj(
                    newDataObject,
                    options,
                    data,
                    idx,
                    keys,
                    valuesMapping
                );
                newDataObject.name = prop;
                series[prop].forEach(function (value) {
                    newDataObject.data.push(value);
                });
                seriesArray.push(newDataObject);
            });
        }

        if (options.markLine) {
            let startSymbol = 'none',
                endSymbol = 'none';

            if (options.markLine.hasOwnProperty('start')) {
                startSymbol = options.markLine.start;
                endSymbol = options.markLine.end;
            }
            markLineIdx = seriesArray.length;
            seriesArray[markLineIdx] = {
                type: 'scatter',
                name: 'markLine',
                xAxisIndex: idx,
                yAxisIndex: idx,
                data: [],
                markLine: {
                    data: [],
                    symbol: [startSymbol, endSymbol],
                },
            };
            for (i = 0; i < options.markLine.lines.length; i++) {
                seriesArray[markLineIdx].markLine.data.push({
                    name: options.markLine.lines[i].label.name,
                    lineStyle: {
                        color: options.markLine.lines[i].color,
                        type: options.markLine.lines[i].style,
                    },
                    label: {
                        show: options.markLine.lines[i].label.show,
                        position: 'end',
                        formatter: function (info) {
                            return info.name;
                        },
                    },
                    [options.markLine.lines[i].type]:
                        options.markLine.lines[i].value,
                });
            }
        }

        if (options.markArea) {
            markAreaIdx = seriesArray.length;
            seriesArray[markAreaIdx] = {
                type: 'line',
                name: 'markArea',
                xAxisIndex: idx,
                yAxisIndex: idx,
                data: [],
                markArea: {
                    silent: true, // ignore mouse events. prevent text from moving around when hovered over...
                    data: [],
                },
            };
            for (i = 0; i < options.markArea.areas.length; i++) {
                seriesArray[markAreaIdx].markArea.data.push([
                    {
                        [options.rotateAxis ? 'xAxis' : 'yAxis']:
                            options.markArea.areas[i].y.start,
                        [options.rotateAxis ? 'yAxis' : 'xAxis']:
                            options.markArea.areas[i].x.start,
                        itemStyle: {
                            color: options.markArea.areas[i].color,
                            opacity: options.markArea.areas[i].opacity,
                        },
                        name: options.markArea.areas[i].label.name,
                        label: {
                            show: options.markArea.areas[i].label.show,
                            color: options.markArea.areas[i].fontColor,
                            position: options.markArea.areas[i].position,
                            fontSize: options.markArea.areas[i].fontSize || 12,
                        },
                    },
                    {
                        [options.rotateAxis ? 'xAxis' : 'yAxis']:
                            options.markArea.areas[i].y.end,
                        [options.rotateAxis ? 'yAxis' : 'xAxis']:
                            options.markArea.areas[i].x.end,
                        name: options.markArea.areas[i].label.name,
                        itemStyle: {
                            color: options.markArea.areas[i].color,
                            opacity: options.markArea.areas[i].opacity,
                        },
                    },
                ]);
            }
        }

        if (options.regressionLine && options.regressionLine !== 'None') {
            regression = getRegression(
                data.regressionData,
                options.regressionLine
            );
            if (regression) {
                seriesArray.push({
                    name: 'regression',
                    type: 'line',
                    showSymbol: false,
                    smooth: true,
                    data: regression.points,
                    xAxisIndex: idx,
                    yAxisIndex: idx,
                    itemStyle: {
                        color: '#333',
                    },
                    markPoint: {
                        itemStyle: {
                            normal: {
                                color: 'transparent',
                            },
                        },
                        label: {
                            normal: {
                                show: true,
                                position: 'left',
                                formatter: regression.expression,
                                textStyle: {
                                    color: '#333',
                                    fontSize: 14,
                                },
                            },
                        },
                        data: [
                            {
                                coord: regression.points[
                                    regression.points.length - 1
                                ],
                            },
                        ],
                    },
                });
            }
        }

        return seriesArray;
    }

    /**
     * @name getRegression
     * @desc get regression data
     * @param {Array} data - semoss data
     * @param {string} showRegression - uiOptions.regressionLine
     * @returns {obj | false} regression object
     */
    function getRegression(data, showRegression) {
        var regressionObj;

        if (!showRegression || showRegression === 'None') {
            return false;
        }
        switch (showRegression) {
            case 'Linear':
                regressionObj = ecStat.regression('linear', data);
                break;
            case 'Exponential':
                regressionObj = ecStat.regression('exponential', data);
                break;
            case 'Logarithmic':
                regressionObj = ecStat.regression('logarithmic', data);
                break;
            case 'Polynomial':
                regressionObj = ecStat.regression('polynomial', data);
                break;
            default:
                return false;
        }

        if (regressionObj.hasOwnProperty('points')) {
            if (regressionObj.points.length > 0) {
                regressionObj.points.sort(function (a, b) {
                    return a[0] - b[0];
                });
            }
        }

        return regressionObj;
    }

    /**
     * @name getSymbol
     * @desc set scatter symbol
     * @param {bool} param - uiOptions.changeSymbol
     * @returns {string} symbol shape
     */
    function getSymbol(param) {
        if (param.symbolUrl && param.symbolUrl !== '') {
            return 'image://' + param.symbolUrl;
            // Error alert if not of acceptable type
        }

        if (param.chooseType === 'Circle') {
            return 'circle';
        } else if (param.chooseType === 'Rectangle') {
            return 'rect';
        } else if (param.chooseType === 'Round Rectangle') {
            return 'roundRect';
        } else if (param.chooseType === 'Triangle') {
            return 'triangle';
        } else if (param.chooseType === 'Diamond') {
            return 'diamond';
        } else if (param.chooseType === 'Pin') {
            return 'pin';
        } else if (param.chooseType === 'Arrow') {
            return 'arrow';
        } else if (param.chooseType === 'Empty Circle') {
            return 'emptyCircle';
        }
        return 'circle';
    }

    // /**
    //  * @name getAlignment
    //  * @desc sets the custom label alignment
    //  * @param {string} param - user selected alignment
    //  * @returns {string} customized alignment
    //  */
    // function getAlignment(param) {
    //     if (param === 'left') {
    //         return 'right';
    //     } else if (param === 'right') {
    //         return 'left';
    //     }
    //     return 'center';
    // }

    function configDataObj(
        dataObject,
        options,
        data,
        idx,
        keys,
        valuesMapping
    ) {
        var dataTypes = getDataTypes(keys, options);
        dataObject.xAxisIndex = idx;
        dataObject.yAxisIndex = idx;
        dataObject.animation = false;

        // Toggle Shadow
        if (options.toggleShadow === true) {
            dataObject.itemStyle = {
                normal: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                    shadowOffsetY: 5,
                },
            };
        }

        // Customize Line Label
        dataObject.label = {
            normal: {
                show: options.displayValues,
                color:
                    options.valueLabel.fontColor ||
                    options.fontColor ||
                    '#000000',
                formatter: function (obj) {
                    let key, labelType, seriesType;

                    // get data type and header name of label dimension
                    for (key in keys) {
                        if (keys[key].model === 'label') {
                            labelType = dataTypes[keys[key].alias][0];
                        }
                        if (keys[key].model === 'series') {
                            seriesType = dataTypes[keys[key].alias][0];
                        }
                    }

                    if (data.runSeries) {
                        return visualizationUniversal.formatValue(
                            obj.seriesName,
                            seriesType
                        );
                    }
                    if (valuesMapping.hasOwnProperty(obj.seriesName)) {
                        return visualizationUniversal.formatValue(
                            obj.value[valuesMapping[obj.seriesName]],
                            labelType
                        );
                    }
                    return cleanValue(obj.value[2]);
                },
                position: options.customizeBarLabel.position || 'top',
                rotate: options.customizeBarLabel.rotate || 0,
                align: options.customizeBarLabel.align || 'center',
                verticalAlign: 'middle',
                fontFamily: options.valueLabel.fontFamily || 'Inter',
                fontSize: options.valueLabel.fontSize || options.fontSize || 12,
                fontWeight: options.valueLabel.fontWeight || 400,
            },
        };

        if (options.changeSymbol) {
            dataObject.symbol = getSymbol(options.changeSymbol);
        } else {
            dataObject.symbol = 'circle';
        }

        // Toggle Average
        if (options.showQuadrants) {
            dataObject.markLine = {
                silent: true,
                symbol: 'none',
                data: [
                    {
                        type: 'average',
                        valueIndex: 0,
                        label: {
                            show: false,
                        },
                    },
                    {
                        type: 'average',
                        valueIndex: 1,
                        label: {
                            show: false,
                        },
                    },
                ],
            };
        }

        // Bubble Size
        if (data.runSize) {
            dataObject.symbolSize = function (d) {
                return data.zScale(d[2]);
            };
        } else if (options.changeSymbol.symbolSize) {
            dataObject.symbolSize = options.changeSymbol.symbolSize;
        } else {
            dataObject.symbolSize = 10;
        }
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
        getEchartsConfig: getEchartsConfig,
    };
}
