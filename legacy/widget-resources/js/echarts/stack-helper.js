'use strict';

import Utility from '../../../core/utility/utility.js';
import visualizationUniversal from '../../../core/store/visualization/visualization';
import EchartsHelper from './echarts-helper';


function stackHelper() {
    var  dataTypes;

    /**
     * @name getDataSeries
     * @desc creates data series object to define ECharts viz
     * @param {string} task - task
     * @param {object} data - object of data in ECharts format created from formData function
     * @param {object} uiOptions - ui options
     * @param {object} colorBy - user-defined Color By Value rule(s)
     * @param {object} groupByInstance - the instances to group by for facet
     * @param {object} groupByInfo - the grouping info for facet
     * @param {object} keys - the header key info
     * @returns {Object} - object of ECharts data series
     */
    function getDataSeries(task, data, uiOptions, colorBy, groupByInstance, groupByInfo, keys) {
        var tempDataObject,
            i,
            finalData = [],
            valuesMapping = EchartsHelper.getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);
        // If not stack, use the format data from echart helper.
        if (task.layout !== 'Stack' && task.layout !== 'MultiLine') {
            tempDataObject = EchartsHelper.formatData(valuesMapping, data, uiOptions.seriesFlipped);
        } else {
            tempDataObject = formatDataForCategory(valuesMapping, data, uiOptions.seriesFlipped);
        }
        finalData = processData(valuesMapping, task, tempDataObject, uiOptions, colorBy, i);

        return finalData;
    }


    /**
     * @name processData
     * @param {object} valuesMapping dimensions & model information
     * @param {string} task the task of the viz
     * @param {data} data the data to process
     * @param {object} options the ui options for this viz
     * @param {object} colorBy the coloring of this viz
     * @param {number} idx id for facet
     * @returns {object} the data series
     */
    function processData(valuesMapping, task, data, options, colorBy, idx) {
        var dataObject = {},
            newDataObject = {},
            seriesArray = [],
            additionalSeries = [],
            i, j,
            markLineIdx = 0,
            markAreaIdx = 0,
            specificConfig = getVizSpecificConfig(task.layout, options),
            vizMap = {
                Stack: 'bar',
                Column: 'bar',
                Area: 'line',
                Line: 'line',
                Pie: 'pie',
                MultiLine: 'line'
            };

        for (i = 0; i < data.valuesNames.length; i++) {
            dataObject.name = data.valuesNames[i];
            dataObject.type = vizMap[task.layout];
            dataObject.itemStyle = {
                normal: {}
            };

            dataObject.data = EchartsHelper.configureDataValue(valuesMapping, data, options, i, colorBy, options.barImage, dataObject.name);
            Object.assign(dataObject, specificConfig.settings);
            dataObject.name = data.valuesNames[i] ? data.valuesNames[i] : 'null';
            dataObject.xAxisIndex = idx;
            dataObject.yAxisIndex = idx;
            // Animation
            dataObject.animation = false;

            // for stacking based on category dimension and not MultiLine
            if(task.layout != 'MultiLine')
                dataObject.stack = !options.toggleStack;

            
            // Setting null value to 0 for MultiLine
            if(task.layout == 'MultiLine') {
                dataObject.data = dataObject.data.map(element => {
                    if(element.value == null) {
                        element.value = 0;
                    }
                    return element;
                })
            }

            // Toggle Average
            if (options.toggleAverage) {
                dataObject.markLine = {
                    silent: true,
                    data: [{
                        type: 'average',
                        name: 'Average',
                        label: {
                            normal: {
                                show: true,
                                position: 'end'
                            }
                        }
                    }],
                    label: {
                        // eslint-disable-next-line no-loop-func
                        formatter: function (info) {
                            let formatType;

                            if (dataTypes.hasOwnProperty(info.seriesName)) {
                                formatType = dataTypes[info.seriesName][0];
                            }
                            return visualizationUniversal.formatValue(info.value, formatType);
                        }
                    }
                };
            }

            // Toggle Trendline
            if (options.toggleTrendline && options.toggleTrendline !== 'No Trendline') {
                for (i = 0; i < data.valuesNames.length; i++) {
                    newDataObject.name = 'Trendline: ' + data.valuesNames[i];
                    newDataObject.type = 'line';
                    newDataObject.data = data.valuesData[i];
                    newDataObject.xAxisIndex = idx;
                    newDataObject.yAxisIndex = idx;
                    if (options.toggleTrendline === 'Smooth') {
                        newDataObject.smooth = true;
                    }
                    if (options.toggleTrendline === 'Exact') {
                        newDataObject.smooth = false;
                    }
                    if (options.toggleTrendline === 'Step (start)') {
                        newDataObject.step = 'start';
                    }
                    if (options.toggleTrendline === 'Step (middle)') {
                        newDataObject.step = 'middle';
                    }
                    if (options.toggleTrendline === 'Step (end)') {
                        newDataObject.step = 'end';
                    }

                    newDataObject.lineStyle = {
                        normal: {
                            color: '#000000',
                            opacity: '0.3'
                        }
                    };
                    additionalSeries.push(Utility.freeze(newDataObject));
                    newDataObject = {};
                }
            }

            // TODO think about abstracting the colors #0000F and rgb out to the top of the file for easier customizability
            // Toggle Extremes
            if (options.toggleExtremes) {
                dataObject.markPoint = {
                    silent: true,
                    data: [{
                        type: 'max',
                        name: 'Max',
                        label: {
                            normal: {
                                color: '#00000F'
                            }
                        }
                    },
                    {
                        type: 'min',
                        name: 'Min',
                        label: {
                            normal: {
                                color: '#00000F'
                            }
                        }
                    }
                    ],
                    label: {
                        // eslint-disable-next-line no-loop-func
                        formatter: function (info) {
                            let formatType;

                            if (dataTypes.hasOwnProperty(info.seriesName)) {
                                formatType = dataTypes[info.seriesName][0];
                            }
                            return visualizationUniversal.formatValue(info.value, formatType);
                        }
                    }
                };
            }

            // Toggle Shadow
            if (options.toggleShadow) {
                dataObject.itemStyle.normal.shadowBlur = 50;
                dataObject.itemStyle.normal.shadowColor = 'rgba(0, 0, 0, 0.5)';
            }

            if (task.layer && !Utility.isEmpty(task.layer.z)) {
                dataObject.z = task.layer.z;
            }

            // Customize Line Label
            dataObject.label = {
                normal: {
                    show: options.displayValues,
                    color: options.valueLabel.fontColor || 'black',
                    // eslint-disable-next-line no-loop-func
                    formatter: function (obj) {
                        var formatType,
                            label = '',
                            labelType;

                        // single axis cluster viz stores values as array of dimensions
                        // clean value stored in 'label' dimension only which is always stored in position 2
                        if (obj.seriesType === 'scatter' && obj.value[2] && obj.value[2].hasOwnProperty(data.labelName)) {
                            label = obj.value[2][data.labelName];
                            if (dataTypes.hasOwnProperty(data.labelName)) {
                                labelType = dataTypes[data.labelName][0];
                            }
                            return visualizationUniversal.formatValue(label, labelType);
                        }

                        // for Stack and seriesFlipped 
                        if (options.seriesFlipped && dataTypes.hasOwnProperty(data.labelData[obj.dataIndex])) {
                            formatType = dataTypes[data.labelData[obj.dataIndex]][0];
                        }
                        // all other visuals using echarts helper (bar, line, and area)
                        if (dataTypes.hasOwnProperty(obj.seriesName)) {
                            formatType = dataTypes[obj.seriesName][0];
                        }

                        // Stack Specific
                        label = data.yLabel.replaceAll(' ', '_');
                        if (obj.seriesType === 'bar' && dataTypes.hasOwnProperty(label)) {
                            formatType = dataTypes[label][0];
                        }

                        // when it's stacked and the value is 0, don't show the value because there is no bar painted. this number would overlap with other stacked values
                        if (options.toggleStack && obj.value === 0) {
                            return '';
                        }

                        return visualizationUniversal.formatValue(obj.value, formatType);
                    },
                    position: options.customizeBarLabel.position || 'top',
                    rotate: options.customizeBarLabel.rotate || 0,
                    align: options.customizeBarLabel.align || 'center',
                    verticalAlign: 'middle',
                    fontFamily: options.valueLabel.fontFamily || 'sans-serif',
                    fontSize: parseFloat(options.valueLabel.fontSize) || 12,
                    fontWeight: options.valueLabel.fontWeight || 'normal'
                }
            };
            seriesArray.push(dataObject);
            dataObject = {};
        }
        // Adds Trendline, and Threshold Line for Bar, Line, and Area
        for (j = 0; j < additionalSeries.length; j++) {
            seriesArray.push(additionalSeries[j]);
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
                type: 'line',
                name: 'markLine',
                xAxisIndex: idx,
                yAxisIndex: idx,
                data: [],
                markLine: {
                    data: [],
                    symbol: [startSymbol, endSymbol]
                }
            };
            for (i = 0; i < options.markLine.lines.length; i++) {
                seriesArray[markLineIdx].markLine.data.push({
                    name: options.markLine.lines[i].label.name,
                    lineStyle: {
                        color: options.markLine.lines[i].color,
                        type: options.markLine.lines[i].style
                    },
                    label: {
                        show: options.markLine.lines[i].label.show,
                        position: 'end',
                        formatter: function (info) {
                            return info.name;
                        }
                    },
                    [options.rotateAxis ? 'xAxis' : 'yAxis']: options.markLine.lines[i].value
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
                    data: []
                }
            };
            for (i = 0; i < options.markArea.areas.length; i++) {
                seriesArray[markAreaIdx].markArea.data.push([{
                    [options.rotateAxis ? 'xAxis' : 'yAxis']: options.markArea.areas[i].y.start,
                    itemStyle: {
                        color: options.markArea.areas[i].color,
                        opacity: options.markArea.areas[i].opacity
                    },
                    name: options.markArea.areas[i].label.name,
                    label: {
                        show: options.markArea.areas[i].label.show,
                        color: options.markArea.areas[i].fontColor,
                        position: options.markArea.areas[i].position,
                        fontSize: options.markArea.areas[i].fontSize || 12
                    }
                },
                {
                    [options.rotateAxis ? 'xAxis' : 'yAxis']: options.markArea.areas[i].y.end,
                    itemStyle: {
                        color: options.markArea.areas[i].color,
                        opacity: options.markArea.areas[i].opacity
                    }
                }
                ]);
            }
        }

        return seriesArray;
    }

    /**
        * @name formatDataForCategory
        * @desc formats data when category (ie.Category Dimension) is exist
        * @param {object} valuesMapping dimensions & model information
        * @param {Object} data - object of data in original format
        * @param {bool} seriesFlipped - uiOptions.seriesFlipped
        * @returns {Object} - object of data in ECharts format
        */
    function formatDataForCategory(valuesMapping, data, seriesFlipped) {
        var eChartsDataObject = {},
            labelIdx = valuesMapping.mappingByModel.label,
            i, n, j, valuesMappingIndex,
            temp,
            tooltipIdx,
            tempLabelData = [],
            tempCategories = [];

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
        eChartsDataObject.yLabel = '';

        for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
            eChartsDataObject.tooltipHeaders.push(data.headers[valuesMapping.mappingByModel.tooltip[j]]);
        }

        for (i = 0; i < data.values.length; i++) {
            tempLabelData.push(data.values[i][labelIdx]);
            tooltipIdx = [];
            for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
                tooltipIdx.push(data.values[i][valuesMapping.mappingByModel.tooltip[j]]);
            }
            eChartsDataObject.tooltipData.push(tooltipIdx);
        }
        eChartsDataObject.labelData = tempLabelData.filter(EchartsHelper.onlyUnique);

        data.values.filter((item) => {
            if (item) {
                tempCategories.push(item[valuesMapping.mappingByModel.category]);
            }
        });


        eChartsDataObject.valuesNames = tempCategories.filter(EchartsHelper.onlyUnique);
        // eChartsDataObject.yLabel = EchartsHelper.cleanValue(data.headers[valuesMapping.mappingByModel.value]);

        for (n = 0; n < eChartsDataObject.valuesNames.length; n++) {
            let dataObj = [],
                value = [];

            for (i = 0; i < data.values.length; i++) {
                if (data.values[i][valuesMapping.mappingByModel.category] === eChartsDataObject.valuesNames[n]) {
                    dataObj.push(data.values[i]);
                }
            }

            if (dataObj.length !== eChartsDataObject.labelData.length) {
                for (i = 0; i < eChartsDataObject.labelData.length; i++) {
                    let exists = false;
                    for (j = 0; j < dataObj.length; j++) {
                        if (dataObj[j][labelIdx] === eChartsDataObject.labelData[i]) {
                            exists = true;
                        }
                    }
                    if (!exists) {
                        let emptyArr = [eChartsDataObject.labelData[i], null, eChartsDataObject.valuesNames[n]];
                        dataObj.splice(i, 0, emptyArr);
                    }
                }
            }

            // Adding the for loop to traverse according to the number of columns.
            for (valuesMappingIndex = 0; valuesMappingIndex < valuesMapping.mappingByModel.value.length; valuesMappingIndex++) {
                if (valuesMappingIndex === 0) {
                    eChartsDataObject.yLabel = EchartsHelper.cleanValue(data.headers[valuesMapping.mappingByModel.value[valuesMappingIndex]]);
                }
                // Cleaning the Value
                value = [];
                for (let index = 0; index < dataObj.length; index++) {
                    value.push(dataObj[index][valuesMapping.mappingByModel.value[valuesMappingIndex]]);
                }
                eChartsDataObject.valuesData.push(value);
            }
        }


        if (seriesFlipped) {
            eChartsDataObject.valuesData = eChartsDataObject.valuesData[0].map((col, k) => eChartsDataObject.valuesData.map(row => row[k]));
            temp = eChartsDataObject.labelData;
            eChartsDataObject.labelData = eChartsDataObject.valuesNames;
            eChartsDataObject.valuesNames = temp;
        }

        return eChartsDataObject;
    }
    /**
     * @name getXAxis
     * @desc defines settings for x-axis
     * @param {Object} uiOptions - uiOptions
     * @param {data} data - the data to get axis information from
     * @param {Object} groupBy - grouping information for facet
     * @param {object} keys - dimension & model mapping
     * @returns {*} - array of x-axis settings
     */
    function getXAxis(uiOptions, data, groupBy, keys) {
        var tempDataObject,
            xAxisConfig = [],
            valuesMapping = EchartsHelper.getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);

        tempDataObject = formatDataForCategory(valuesMapping, data, uiOptions.seriesFlipped);
        xAxisConfig = configureXAxis(uiOptions, tempDataObject.labelData, tempDataObject.labelName, groupBy, 0);

        if (uiOptions.displaySum)  {
            xAxisConfig.push({
                type: 'category',
                data: getStackedBarChartSum(tempDataObject)
            });
        }

        return xAxisConfig;
    }

    /**
     * @name getStackedBarChartSum
     * @desc calculate the sum of stackedbars
     * @param {Object} dataSeries - tempDataObject    
     * @returns {array} - array of stacked bar sums
     */

    function getStackedBarChartSum(dataSeries) {
        var sumList = [], valueFormatType, total;

        for (let dim in dataTypes) {
            if (dataTypes.hasOwnProperty(dim) && dataTypes[dim][0].model === 'value') {
                valueFormatType = dataTypes[dim][0];
                break;
            }
        }
        for (let index = 0; index < dataSeries.labelData.length; index++) {
            total = 0;
            dataSeries.valuesData.forEach((data) => {
                if (data[index]) {
                    total = total + parseFloat(data[index]);
                }
            });
            sumList.push(visualizationUniversal.formatValue(total, valueFormatType));
        }
        return sumList;
    }

    /**
     * @name configureXAxis
     * @desc defines settings for x-axis
     * @param {Object} uiOptions - uiOptions
     * @param {Array} data - array of labels on the x-axis
     * @param {string} axisName - tempDataObject.labelName (x-axis label name)
     * @param {Object} groupBy - object of groupBy info
     * @param {num} idx - groupBy instance index
     * @returns {array} - array of x-axis settings
     */
    function configureXAxis(uiOptions, data, axisName, groupBy, idx) {
        var xAxisConfig = [],
            axisTitle,
            showAxisValues,
            nameGap = 25,
            showAxisLine,
            showAxisTicks,
            centerTitle,
            settings = uiOptions.editXAxis,
            grid = uiOptions.editGrid.x,
            flipAxis = uiOptions.rotateAxis,
            fontSize = uiOptions.fontSize ? uiOptions.fontSize.substring(0, uiOptions.fontSize.indexOf('p')) : 12,
            fontColor = uiOptions.fontColor || 'black',
            labelType;

        if (settings) {
            if (settings.title.show) {
                axisTitle = settings.title.name;
            } else {
                axisTitle = null;
            }
            centerTitle = settings.centerTitle;
            showAxisValues = settings.values;
            nameGap = settings.nameGap;
            showAxisLine = settings.line;
            showAxisTicks = settings.line ? settings.showTicks : false;
        } else {
            axisTitle = axisName.replace(/_/g, ' ');
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        // get x-axis data format rules
        if (dataTypes.hasOwnProperty(axisName)) {
            labelType = dataTypes[axisName][0];
        }

        xAxisConfig.push({
            type: 'category',
            data: data,
            axisTick: {
                show: showAxisTicks,
                alignWithLabel: true,
                lineStyle: {
                    color: uiOptions.axis.borderColor,
                    width: parseFloat(uiOptions.axis.borderWidth)
                }
            },
            splitLine: {
                show: grid,
                lineStyle: uiOptions.grid
            },
            axisLabel: {
                show: showAxisValues,
                rotate: settings.rotate || 0,
                formatter: function (value) {
                    return EchartsHelper.formatLabel(value, settings.format, labelType);
                },
                interval: settings.showAllXValues ? 0 : 'auto',
                fontWeight: parseInt(uiOptions.axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.label.fontSize) || fontSize,
                fontFamily: uiOptions.axis.label.fontFamily || 'Inter',
                color: uiOptions.axis.label.fontColor || fontColor
            },
            name: axisTitle,
            nameLocation: 'center',
            nameGap: nameGap,
            nameTextStyle: {
                fontWeight: parseInt(uiOptions.axis.name.fontWeight, 10) || 400,
                fontSize: parseFloat(uiOptions.axis.name.fontSize) || fontSize,
                fontFamily: uiOptions.axis.name.fontFamily || 'Inter',
                color: uiOptions.axis.name.fontColor || fontColor
            },
            gridIndex: idx,
            axisLine: {
                show: showAxisLine,
                lineStyle: {
                    color: uiOptions.axis.borderColor,
                    width: parseFloat(uiOptions.axis.borderWidth)
                }
            }
        });

        if (flipAxis && axisTitle) {
            if (centerTitle) {
                xAxisConfig[0].nameLocation = 'end';
            } else {
                xAxisConfig[0].nameLocation = 'end';
                if (axisTitle.length > 10 && axisTitle.length < 15) {
                    xAxisConfig[0].nameTextStyle.padding = [0, 0, 0, ((axisTitle.length * 10) / 4)];
                } else if (axisTitle.length >= 15) {
                    xAxisConfig[0].nameTextStyle.padding = [0, 0, 0, ((axisTitle.length * 10) / 2)];
                }
            }
        }

        return xAxisConfig;
    }

    /**
     * @name getYAxis
     * @param {*} uiOptions - chart options
     * @param {*} data - data to grab y axis information from
     * @param {*} groupBy - group by information for facet
     * @param {*} keys - dimension & model mapping
     * @desc get the Y Axis config options
     * @returns {*} the y config options
     */
    function getYAxis(uiOptions, data, groupBy, keys) {
        var tempDataObject,
            yAxisConfig = [],
            valuesMapping = EchartsHelper.getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);

        tempDataObject = formatDataForCategory(valuesMapping, data, uiOptions.seriesFlipped);
        yAxisConfig = configureYAxis(uiOptions, uiOptions.yReversed, tempDataObject.yLabel, groupBy, 0);
        return yAxisConfig;
    }

    /**
     * @name configureYAxis
     * @desc sets configuration of y-axis (min, max, and inverse bool)
     * @param {Object} options - uiOptions
     * @param {bool} reverse - boolean of whether or not to reverse y-axis
     * @param {Array} yLabel - default label for y axis
     * @param {Object} groupBy - object of groupBy info
     * @param {num} idx - groupBy instance index
     * @returns {Array} - array of object of y-axis configuration
     */
    function configureYAxis(options, reverse, yLabel, groupBy, idx) {
        var yAxis,
            axisTitle,
            showAxisValues,
            showAxisLine,
            showAxisTicks,
            yMin = null,
            yMax = null,
            nameGap = 25,
            grid = options.editGrid.y,
            flipAxis = options.rotateAxis,
            fontSize = options.fontSize ? options.fontSize.substring(0, options.fontSize.indexOf('p')) : 12,
            fontColor = options.fontColor || 'black',
            formatType,
            originalTitle = '';
        if (options.editYAxis) {
            if (options.editYAxis.title.show) {
                axisTitle = options.editYAxis.title.name;
            } else {
                axisTitle = '';
            }
            nameGap = options.editYAxis.nameGap;
            showAxisValues = options.editYAxis.values;
            showAxisLine = options.editYAxis.line;
            showAxisTicks = options.editYAxis.line ? options.editYAxis.showTicks : false;
            if (options.editYAxis.min) {
                if (options.editYAxis.min.show) {
                    yMin = options.editYAxis.min.value;
                }
            }
            if (options.editYAxis.max) {
                if (options.editYAxis.max.show) {
                    yMax = options.editYAxis.max.value;
                }
            }
        } else {
            axisTitle = yLabel;
            showAxisValues = true;
            showAxisLine = true;
            showAxisTicks = false;
        }

        // get y axis data format rules
        originalTitle = yLabel.replace(/ /g, '_');
        if (dataTypes && dataTypes.hasOwnProperty(originalTitle)) {
            formatType = dataTypes[originalTitle][0];
        }

        yAxis = [{
            min: yMin || null,
            max: yMax || null,
            name: axisTitle,
            nameTextStyle: {
                fontWeight: parseInt(options.axis.name.fontWeight, 10) || 400,
                fontSize: parseFloat(options.axis.name.fontSize) || fontSize,
                fontFamily: options.axis.name.fontFamily || 'Inter',
                color: options.axis.name.fontColor || fontColor
            },
            nameGap: nameGap,
            inverse: reverse,
            gridIndex: idx,
            type: 'value',
            splitLine: {
                show: grid,
                lineStyle: options.grid
            },
            axisLabel: {
                show: showAxisValues,
                formatter: function (value) {
                    return EchartsHelper.formatLabel(value, options.editYAxis.format, formatType);
                },
                rotate: options.editYAxis.rotate || 0,
                fontWeight: parseInt(options.axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(options.axis.label.fontSize) || fontSize,
                fontFamily: options.axis.label.fontFamily || 'Inter',
                color: options.axis.label.fontColor || fontColor
            },
            axisLine: {
                show: showAxisLine,
                lineStyle: {
                    color: options.axis.borderColor,
                    width: parseFloat(options.axis.borderWidth)
                }
            },
            axisTick: {
                show: showAxisTicks,
                lineStyle: {
                    color: options.axis.borderColor,
                    width: parseFloat(options.axis.borderWidth)
                }
            }
        }];

        if (flipAxis) {
            yAxis[0].nameLocation = 'center';
            yAxis[0].nameGap = 25;
        } else if (reverse) {
            yAxis[0].nameLocation = 'start';
        } else {
            yAxis[0].nameLocation = 'end';
        }

        if (axisTitle && !flipAxis) {
            if (axisTitle.length > 10 && axisTitle.length < 15) {
                yAxis[0].nameTextStyle.padding = [0, 0, 0, ((axisTitle.length * 10) / 4)];
            } else if (axisTitle.length >= 15) {
                yAxis[0].nameTextStyle.padding = [0, 0, 0, ((axisTitle.length * 10) / 2)];
            }
        }

        return yAxis;
    }

    /**
     * @name getLegend
     * @param {object} uiOptions - chart options
     * @param {object} data - data to grab information from
     * @param {object} keys - the dimension & model mapping
     * @desc get the legend information
     * @returns {*} legend information
     */
    function getLegend(uiOptions, data, keys) {
        var tempDataObject,
            numberOfDataSeries,
            valuesMapping = EchartsHelper.getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);

        tempDataObject = formatDataForCategory(valuesMapping, data, uiOptions.seriesFlipped);
        numberOfDataSeries = tempDataObject.valuesData.length || 0;


        return {
            headers: tempDataObject.valuesNames || tempDataObject[0].valueNames,
            labels: tempDataObject.labelName || tempDataObject[0].labelName,
            data: tempDataObject.labelData || tempDataObject[0].labelData,
            numberOfDataSeries: numberOfDataSeries,
            labelStyle: {
                color: uiOptions.legend.fontColor || uiOptions.fontColor || '#000000',
                fontSize: parseFloat(uiOptions.legend.fontSize) || uiOptions.fontSize || 12,
                fontFamily: uiOptions.legend.fontFamily || 'Inter',
                fontWeight: uiOptions.legend.fontWeight || 400
            }
        };
    }

    /**
     * @name getEchartsConfig
     * @param {object} config ele, task, uiOptions, selectedMode, commentData, colorBy
     * @desc process the echarts config object structure
     * @returns {object} returns the eChartsConfig option
     */
    function getEchartsConfig(config) {
        var i, k, j,
            groupByInfo,
            data,
            keys,
            options,
            allKeys = [],
            layerLayouts = [],
            groupBy = {},
            groupByInstance,
            legend,
            animation,
            eChartsConfig = {},
            maxValues = 0,
            dataIdx;

        groupByInfo = config.task.groupByInfo;
        data = config.task.data;
        keys = config.task.keys[config.task.layout];
        options = config.uiOptions;

        // get list of layouts for all layers
        if (config.tasks) {
            for (i = 0; i < config.tasks.length; i++) {
                layerLayouts.push(config.tasks[i].layout);
            }
            // get all keys for all applied layouts
            for (i = 0; i < config.tasks.length; i++) {
                for (k = 0; k < layerLayouts.length; k++) {
                    if (config.tasks[i].keys[layerLayouts[k]]) {
                        for (j = 0; j < config.tasks[i].keys[layerLayouts[k]].length; j++) {
                            allKeys.push(config.tasks[i].keys[layerLayouts[k]][j]);
                        }
                    }
                }
            }
            getDataTypes(allKeys, options);
        }

        // set chart title text & styles
        if (options.chartTitle && options.chartTitle.text) {
            eChartsConfig.title = {};
            eChartsConfig.title.show = true;
            eChartsConfig.title.text = options.chartTitle.text;
            eChartsConfig.title.fontSize = options.chartTitle.fontSize;
            eChartsConfig.title.fontWeight = options.chartTitle.fontWeight;
            eChartsConfig.title.fontFamily = options.chartTitle.fontFamily;
            eChartsConfig.title.fontColor = options.chartTitle.fontColor;
            eChartsConfig.title.align = options.chartTitle.align || 'left';
        }

        if (groupByInfo && groupByInfo.viewType) {
            if (groupByInfo.viewType === 'Individual Instance') {
                groupBy = EchartsHelper.formatDataForGroupByIndividual(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            }
        }

        // eChartsConfig = barService.getConfig('bar', data, uiOptions, colorBy, groupByInstance, groupByInfo, keys);
        eChartsConfig.data = getDataSeries(config.task, data, config.uiOptions, config.colorBy, groupByInstance, groupByInfo, keys);
        eChartsConfig.keys = keys;
        eChartsConfig.allKeys = allKeys;

        if (config.uiOptions.rotateAxis) {
            eChartsConfig.xAxisConfig = getYAxis(config.uiOptions, data, groupByInfo, keys);
            eChartsConfig.yAxisConfig = getXAxis(config.uiOptions, data, groupByInfo, keys);
        } else {
            eChartsConfig.xAxisConfig = getXAxis(config.uiOptions, data, groupByInfo, keys);
            eChartsConfig.yAxisConfig = getYAxis(config.uiOptions, data, groupByInfo, keys);
        }

        // get legend info
        // if(config.uiOptions.toggleLegend){
        legend = getLegend(config.uiOptions, data, keys);
        eChartsConfig.legendHeaders = legend.headers;
        eChartsConfig.legendLabels = legend.labels;
        eChartsConfig.legendData = legend.data;
        eChartsConfig.showLegend = config.uiOptions.toggleLegend;
        eChartsConfig.legendLabelStyle = legend.labelStyle;
        eChartsConfig.numberOfDataSeries = legend.numberOfDataSeries;

        //Get legend properties
        eChartsConfig.legendTop = config.uiOptions.legend.topalign;
        eChartsConfig.legendLeft = config.uiOptions.legend.leftalign;
        eChartsConfig.legendOrient = config.uiOptions.legend.orient;
        eChartsConfig.legendBackground =config.uiOptions.legend.backgroundColor;
        // }

        // get animation info
        animation = EchartsHelper.getAnimation(config.uiOptions.animation);
        eChartsConfig.showAnimation = animation.showAnimation;
        eChartsConfig.animationType = animation.defaultAnimationType;
        eChartsConfig.animationaDelay = animation.defaultAnimationSpeed;
        eChartsConfig.animationaDuration = animation.defaultAnimationDuration;

        eChartsConfig.axisPointer = config.uiOptions.axisPointer;
        eChartsConfig.backgroundColorStyle = EchartsHelper.getBackgroundColorStyle(config.uiOptions.watermark);
        eChartsConfig.groupByInstance = groupByInstance;
        eChartsConfig.options = config.uiOptions;

        eChartsConfig.currentMode = EchartsHelper.getCurrentMode(config.selectedMode);
        eChartsConfig.comments = config.commentData; // scope.widgetCtrl.getWidget('view.visualization.commentData');
        eChartsConfig.echartsMode = EchartsHelper.getEchartsMode(config.selectedMode);
        eChartsConfig.groupByInfo = groupByInfo;
        eChartsConfig.size = EchartsHelper.determineResize(config.ele, eChartsConfig);

        if (config.task.layer && config.task.layer.addYAxis) {
            eChartsConfig.addYAxis = config.task.layer.addYAxis;
        }

        if (config.task.layer && config.task.layer.addXAxis) {
            eChartsConfig.addXAxis = config.task.layer.addXAxis;
        }

        // don't run through this logic to toggle zoom when facet is set to all instances
        if (!eChartsConfig.groupByInfo || eChartsConfig.groupByInfo.viewType !== 'All Instances') {
            // find the highest # of bars to paint
            for (dataIdx = 0; dataIdx < eChartsConfig.data.length; dataIdx++) {
                if (maxValues < eChartsConfig.data[dataIdx].data.length) {
                    maxValues = eChartsConfig.data[dataIdx].data.length;
                }
            }

            // viewSize is the threshold we set before adding a dataZoom to scroll the viz.
            // also dont set this if dataZoom has already been set from a widget.
            if (typeof eChartsConfig.options.toggleZoomXEnabled !== 'boolean') {
                if (config.dataZoom && config.dataZoom.viewSize && config.dataZoom.viewSize < maxValues) {
                    eChartsConfig.options.toggleZoomX = true;
                } else {
                    eChartsConfig.options.toggleZoomX = false;
                }
            } else if (typeof eChartsConfig.options.toggleZoomXEnabled === 'boolean') {
                eChartsConfig.options.toggleZoomX = eChartsConfig.options.toggleZoomXEnabled;
            }
        } else {
            eChartsConfig.options.toggleZoomX = false;
        }

        return eChartsConfig;
    }

    /**
     * @name getDataTypes
     * @desc gets the data formatting options for each dimension
     * @param {Object} keys - object of data keys
     * @param {object} options - uiOptions
     * @returns {void}
     */
    function getDataTypes(keys, options) {
        dataTypes = {};
        let k, j,
            formatType;

        for (k = 0; k < keys.length; k++) {
            dataTypes[keys[k].alias] = [];
            formatType = visualizationUniversal.mapFormatOpts(keys[k]);
            dataTypes[keys[k].alias].push(formatType);
            if (options.formatDataValues) {
                for (j = 0; j < options.formatDataValues.formats.length; j++) {
                    formatType = options.formatDataValues.formats[j];
                    if (keys[k].alias === formatType.dimension) {
                        dataTypes[formatType.dimension] = [];
                        dataTypes[formatType.dimension].push(formatType);
                    }
                }
            }
        }
    }

    /**
     * @name getVizOptions
     * @param {object} eChartsConfig all the data pieces needed to create the echarts options
     * @param {*} chart the echarts chart object
     * @param {*} uiOptions the ornaments in this viz
     * @param {*} chartScope the scope of the directive using this function
     * @param {*} $compile the compiler
     * @desc setup the options to be passed into echarts to visualize
     * @returns {object} the options to be passed to echarts
     */
    function getVizOptions(eChartsConfig, chart, uiOptions, chartScope, $compile) {
        var option = {},
            i,
            dataEmpty,
            labelType,
            categoryType,
            valueType,
            hasCustomTooltip = false;

        if (eChartsConfig.groupByInfo && eChartsConfig.groupByInfo.viewType === 'Individual Instance') {
            dataEmpty = true;
            for (i = 0; i < eChartsConfig.data.length; i++) {
                if (eChartsConfig.data[i].data.length !== 0) {
                    dataEmpty = false;
                    break;
                }
            }

            option.graphic = [];
            if (dataEmpty) {
                option.graphic = option.graphic.concat({
                    id: 'textGroup',
                    type: 'group',
                    right: 'center',
                    top: 'center',
                    children: [{
                        type: 'rect',
                        top: 'center',
                        right: 'center',
                        shape: {
                            width: 200,
                            height: 40
                        },
                        style: {
                            fill: '#fff',
                            stroke: '#999',
                            lineWidth: 2,
                            shadowBlur: 8,
                            shadowOffsetX: 3,
                            shadowOffsetY: 3,
                            shadowColor: 'rgba(0,0,0,0.3)'
                        }
                    },
                    {
                        type: 'text',
                        right: 'center',
                        top: 'center',
                        style: {
                            text: 'There is no data for this instance.',
                            textAlign: 'center'
                        }
                    }
                    ]
                });
            }
        }

        if (eChartsConfig.backgroundColorStyle) {
            option.backgroundColor = eChartsConfig.backgroundColorStyle;
        }

        option.toolbox = {
            show: false,
            left: '2',
            bottom: '5',
            orient: 'vertical',
            feature: {
                brush: {
                    // type: ['rect', 'polygon', 'lineX'],
                    type: ['rect', 'polygon'],
                    title: {
                        rect: 'Brush',
                        polygon: 'Polygon Brush' // ,
                        // lineX: 'Horizontal'
                    }
                }
            },
            iconStyle: {
                emphasis: {
                    textPosition: 'right',
                    textAlign: 'left'
                }
            }
        };

        if (eChartsConfig.groupByInfo) {
            // TODO enable brush for Facet All Instances (pass in correct labelIndex)
            if (eChartsConfig.groupByInfo.viewType === 'Individual Instance') {
                option.brush = {
                    brushStyle: {
                        borderWidth: 1,
                        color: 'rgba(120,140,180,0.15)',
                        borderColor: 'rgba(120,140,180,0.35)'
                    },
                    xAxisIndex: 0
                };
            }
        } else {
            option.brush = {
                brushStyle: {
                    borderWidth: 1,
                    color: 'rgba(120,140,180,0.15)',
                    borderColor: 'rgba(120,140,180,0.35)'
                },
                xAxisIndex: 0
            };
        }

        option.color = eChartsConfig.options.color;
        if (chart && uiOptions && (uiOptions.customTooltip.html ||
            (uiOptions.customTooltip.asset && uiOptions.customTooltip.asset.path && uiOptions.customTooltip.asset.space))) {
            hasCustomTooltip = true;
            // if there is a path and a space, we need to load the asset
            if (uiOptions.customTooltip.asset.path && uiOptions.customTooltip.asset.space) {
                chartScope.widgetCtrl.meta([{
                    meta: true,
                    type: 'getAsset',
                    components: [
                        uiOptions.customTooltip.asset.space,
                        uiOptions.customTooltip.asset.path
                    ],
                    terminal: true
                }], function (response) {
                    let output = response.pixelReturn[0].output;
                    uiOptions.customTooltip.html = output;

                    chart.on('showTip', function () {
                        if (uiOptions.customTooltip.html) {
                            EchartsHelper.setTooltipContent(chart, uiOptions, chartScope, $compile);
                            chartScope.$apply();
                        }
                    });
                });
            } else {
                chart.on('showTip', function () {
                    EchartsHelper.setTooltipContent(chart, uiOptions, chartScope, $compile);
                    chartScope.$apply();
                });
            }
        }

        // get label dimension format rules
        for (let dim in dataTypes) {
            if (dataTypes.hasOwnProperty(dim) && dataTypes[dim][0].model === 'label') {
                labelType = dataTypes[dim][0];
            } else if (dataTypes.hasOwnProperty(dim) && dataTypes[dim][0].model === 'value') {
                valueType = dataTypes[dim][0];
            } else if (dataTypes.hasOwnProperty(dim) && dataTypes[dim][0].model === 'category') {
                categoryType = dataTypes[dim][0];
            }
        }

        option.tooltip = {
            show: eChartsConfig.options.showTooltips,
            // make it not enterable by default because it affects brushing when you quickly brush & enter a tooltip
            enterable: hasCustomTooltip,
            formatter: function (info) {
                var returnArray = ['<div>'],
                    tooltipName = info[0].name,
                    tooltipType,
                    j;

                if (tooltipName) {
                    returnArray.push('<b>' + visualizationUniversal.formatValue(tooltipName, eChartsConfig.options.seriesFlipped ? categoryType : labelType) + '</b>' + '<br>');
                }

                for (j = 0; j < info.length; j++) {
                    if (eChartsConfig.options.showNullTooltips === false) {
                        returnArray.push(info[j].marker);
                        returnArray.push('' + EchartsHelper.cleanValue(info[j].seriesName) + ': ' + visualizationUniversal.formatValue(info[j].value, valueType) + '<br>');
                    }
                    else{
                        if (info[j].value !== null) {
                            if (info[j].marker) {
                                returnArray.push(info[j].marker);
                                returnArray.push('' + EchartsHelper.cleanValue(info[j].seriesName) + ': ' + visualizationUniversal.formatValue(info[j].value, valueType) + '<br>');
                        
                            }
                        }
                    }
                }

                if (info[0].data.tooltip) {
                    for (j = 0; j < info[0].data.tooltip.length; j++) {
                        tooltipType = dataTypes[info[0].data.tooltip[j].header][0];
                        if (eChartsConfig.legendHeaders.indexOf(info[0].data.tooltip[j].header) === -1) {
                            returnArray.push('' + EchartsHelper.cleanValue(info[0].data.tooltip[j].header) + ': ' + visualizationUniversal.formatValue(info[0].data.tooltip[j].value || 0, tooltipType) + '<br>');
                            tooltipType = '';
                        }
                    }
                }

                if (uiOptions && uiOptions.customTooltip.show) {
                    visualizationUniversal.setTooltipModel(chartScope, 'tooltip', EchartsHelper.getModelList(info, eChartsConfig.allKeys));
                }

                returnArray.push('</div>');

                return returnArray.join('');
            },
            trigger: 'axis',
            axisPointer: {
                type: eChartsConfig.axisPointer, // line, shaddow, cross
                lineStyle: {
                    color: eChartsConfig.options.axis.pointer.lineStyle.lineColor || '#000000',
                    width: parseFloat(eChartsConfig.options.axis.pointer.lineStyle.lineWidth) || 2,
                    type: eChartsConfig.options.axis.pointer.lineStyle.lineType || 'dashed',
                    opacity: eChartsConfig.options.axis.pointer.lineStyle.opacity || 0.1
                },
                shadowStyle: {
                    color: eChartsConfig.options.axis.pointer.shadowStyle.backgroundColor || '#000000',
                    opacity: eChartsConfig.options.axis.pointer.shadowStyle.opacity || 0.05
                },
                crossStyle: {
                    color: eChartsConfig.options.axis.pointer.lineStyle.lineColor || '#000000',
                    width: parseFloat(eChartsConfig.options.axis.pointer.lineStyle.lineWidth) || 2,
                    type: eChartsConfig.options.axis.pointer.lineStyle.lineType || 'dashed',
                    opacity: eChartsConfig.options.axis.pointer.lineStyle.opacity || 0.1
                },
                label: {
                    backgroundColor: eChartsConfig.options.tooltip.backgroundColor || 'auto',
                    color: eChartsConfig.options.tooltip.fontColor || '#000000',
                    fontFamily: eChartsConfig.options.tooltip.fontFamily || 'Inter',
                    fontSize: parseFloat(eChartsConfig.options.tooltip.fontSize) || 12,
                    shadowBlur: 5,
                    shadowColor: 'rgba(0,0,0,0.2)',
                    shadowOffsetX: 0,
                    shadowOffsetY: 2
                }
            },
            confine: true,
            backgroundColor: eChartsConfig.options.tooltip.backgroundColor || '#FFFFFF',
            borderWidth: parseFloat(eChartsConfig.options.tooltip.borderWidth) || 0,
            borderColor: eChartsConfig.options.tooltip.borderColor || '',
            textStyle: {
                color: eChartsConfig.options.tooltip.fontColor || '#000000',
                fontFamily: eChartsConfig.options.tooltip.fontFamily || 'Inter',
                fontSize: parseFloat(eChartsConfig.options.tooltip.fontSize) || 12
            }
        };

        if (eChartsConfig.title) {
            option.title = {
                show: eChartsConfig.title.show,
                text: eChartsConfig.title.text,
                textStyle: {
                    fontSize: eChartsConfig.title.fontSize || 18,
                    color: eChartsConfig.title.fontColor || '#000000',
                    fontWeight: eChartsConfig.title.fontWeight || 'normal',
                    fontFamily: eChartsConfig.title.fontFamily || 'sans-serif'
                },
                left: eChartsConfig.title.align
                // subtext: 'this is an example of a sub text'
            };
        }

        option.legend = {
            data: eChartsConfig.legendHeaders,
            show: eChartsConfig.showLegend,
            type: 'scroll',
            left: eChartsConfig.legendLeft,
            orient: eChartsConfig.legendOrient,
            backgroundColor: eChartsConfig.legendBackground,
            //When legendTop === top pass charttitle font size(Numeric) else pass legendTop (String)  i.e. 'top'
            top: eChartsConfig.legendTop === 'top' ||  eChartsConfig.legendTop === undefined  ? (eChartsConfig.title && eChartsConfig.title.show ? eChartsConfig.title.fontSize : 0 ): eChartsConfig.legendTop,
            pageButtonPosition: 'start',
            formatter: function (value) {
                return EchartsHelper.cleanValue(value);
            },
            textStyle: eChartsConfig.legendLabelStyle
        };

        option.xAxis = eChartsConfig.xAxisConfig;
        option.yAxis = eChartsConfig.yAxisConfig;
        option.series = eChartsConfig.data;
        option.grid = EchartsHelper.setGrid(eChartsConfig.groupByInfo, eChartsConfig.options);
        // bar specific
        option.barWidth = eChartsConfig.barWidth;

        option.dataZoom = EchartsHelper.toggleZoom(eChartsConfig.groupByInfo, eChartsConfig.options.toggleZoomX, eChartsConfig.options.toggleZoomY, eChartsConfig.options.dataZoomXstart, eChartsConfig.options.dataZoomXend, eChartsConfig.options.dataZoomYstart, eChartsConfig.options.dataZoomYend, eChartsConfig.options.dataZoom, eChartsConfig.options.saveDataZoom);
        option.textStyle = {
            fontFamily: 'Inter'
        };

        return option;
    }

    /**
     * @name getVizSpecificConfig     
     * @param {*} vizType the viz type
     * @param {*} options the options in this viz type
     * @desc set the viz specific options
     * @returns {object} the specific settings for this viz
     */
    function getVizSpecificConfig(vizType, options) {
        var settings = {};
        settings.barGap = '5%';
        if (options.barImage) {
            if (options.barImage.hasOwnProperty('borderRadius')) {
                settings.itemStyle = {
                    normal: {
                        barBorderRadius: options.barImage.borderRadius || 0
                    }
                };
            }

            if (options.barImage.hasOwnProperty('symbol') && options.barImage.symbol !== 'Default (Bar)') {
                settings.type = 'pictorialBar';
                settings.symbolRepeat = options.barImage.repeat;
                settings.symbolSize = options.barImage.symbolSize + '%';
                settings.symbolClip = options.barImage.clip;
            }
        } else if (vizType === 'Line' || vizType === 'MultiLine') {
            // Curve Type
            if (options.curveType.toUpperCase() === 'SMOOTH') {
                settings.smooth = true;
            }
            if (options.curveType === 'StepStart') {
                settings.step = 'start';
            }
            if (options.curveType === 'StepMiddle') {
                settings.step = 'middle';
            }
            if (options.curveType === 'StepEnd') {
                settings.step = 'end';
            }
            // Symbol
            if (options.symbolStyle) {
                // type
                if (options.symbolStyle.type === 'Arrow') {
                    settings.symbol = 'arrow';
                }
                if (options.symbolStyle.type === 'Circle') {
                    settings.symbol = 'circle';
                }
                if (options.symbolStyle.type === 'Diamond') {
                    settings.symbol = 'diamond';
                }
                if (options.symbolStyle.type === 'Pin') {
                    settings.symbol = 'pin';
                }
                if (options.symbolStyle.type === 'Rectangle') {
                    settings.symbol = 'rect';
                }
                if (options.symbolStyle.type === 'Round Rectangle') {
                    settings.symbol = 'roundRect';
                }
                if (options.symbolStyle.type === 'Triangle') {
                    settings.symbol = 'triangle';
                }
                if (options.symbolStyle.type === 'None') {
                    settings.symbol = 'none';
                }
                // size
                if (options.symbolStyle.size) {
                    settings.symbolSize = options.symbolStyle.size;
                }
            }
            // Line Style
            // create new "Line Style" widget, add to widget.service, and line-echarts congfig
            settings.lineStyle = {
                normal: {
                    'type': options.lineStyle.type || 'solid',
                    'width': options.lineStyle.width || 3
                }
            };
        } else if (vizType === 'Area') {
            // Curve Type
            if (options.curveType.toUpperCase() === 'SMOOTH') {
                settings.smooth = true;
            }
            if (options.curveType === 'StepStart') {
                settings.step = 'start';
            }
            if (options.curveType === 'StepMiddle') {
                settings.step = 'middle';
            }
            if (options.curveType === 'StepEnd') {
                settings.step = 'end';
            }
            // Line Style
            settings.lineStyle = {
                normal: {
                    'type': options.lineStyleArea.type || 'dotted',
                    'width': options.lineStyleArea.width || 3
                }
            };

            settings.areaStyle = {
                normal: {
                    opacity: 0.85
                }
            };
        }

        return {
            settings: settings
        };
    }

    return {
        getVizOptions: getVizOptions,
        getDataSeries: getDataSeries,
        getDataTypes: getDataTypes,
        getLegend: getLegend,
        getXAxis: getXAxis,
        getYAxis: getYAxis,
        getEchartsConfig: getEchartsConfig
    };
}

export default stackHelper();
