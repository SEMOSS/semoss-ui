'use strict';

import * as d3 from 'd3';
import Utility from '../../../core/utility/utility.js';
import visualizationUniversal from '../../../core/store/visualization/visualization';

import Comment from './comment.js';

function echartsHelper() {
    var specificBrush = {
        bar: getBarBrush,
        scatter: getScatterBrush,
        line: getLineBrush,
        area: getLineBrush,
        box: getBoxBrush,
        heatmap: getHeatmapBrush,
        singleaxis: getSingleAxisBrush,
        pictorialBar: getPictorialBarBrush,
        flippedSeriesBar: getFlippedSeriesBar,
        flippedSeriesLine: getFlippedSeriesLine
    };

    /**
     * @name getCurrentMode
     * @desc return the selected mode
     * @param {string} mode - current mode
     * @returns {string} - current mode
     */
    function getCurrentMode(mode) {
        switch (mode) {
            case 'brush-mode':
                return 'brushMode';
            case 'comment-mode':
                return 'commentMode';
            case 'edit-mode':
                return 'editMode';
            case 'zoom-mode':
                return 'zoomMode';
            case 'polygon-brush-mode':
                return 'polygonBrushMode';
            default:
                return 'defaultMode';
        }
    }

    /**
     * @name getEchartsMode
     * @desc return the current echarts mode
     * @param {string} mode - mode to convert
     * @returns {string} - current mode
     */
    function getEchartsMode(mode) {
        if (mode === 'default-mode') {
            return 'rect';
        } else if (mode === 'polygon-brush-mode') {
            return 'polygon';
        }

        // user has purposely deselected the modes
        return false;
    }

    /**
     * @name formatLabel
     * @param {string} label the label to format
     * @param {object} rules the edit-axis rules to apply to the label
     * @param {object} format the data format rules to apply to the label
     * @desc format the label based on the rules passed in
     * @returns {string} the formatted label
     */
    function formatLabel(label, rules, format) {
        var tempValue = label,
            parts,
            formatType,
            date;

        if (format) {
            formatType = format;
            // TODO defulat for y axis should be to round fully
            tempValue = visualizationUniversal.formatValue(tempValue, formatType);
        }

        if (rules) {
            if (rules.type && rules.type !== 'Default') {
                // try to set value to number, if successful, we will round to their specification
                /*
                    Math.round(X);           // round X to an integer
                    Math.round(10*X)/10;     // round X to tenths
                    Math.round(100*X)/100;   // round X to hundredths
                    Math.round(1000*X)/1000; // round X to thousandths
                */
                if (rules.type === 'Million') {
                    if (!isNaN(tempValue)) {
                        tempValue = (Math.abs(Number(tempValue)) / 1.0e+6).toFixed(2) + '';
                        while (tempValue[tempValue.length - 1] === '0') {
                            tempValue = tempValue.slice(0, -1);
                        }

                        if (tempValue[tempValue.length - 1] === '.') {
                            tempValue = tempValue.slice(0, -1);
                        }

                        tempValue = tempValue + 'M';
                    }
                } else if (rules.type === 'Billion') {
                    if (!isNaN(tempValue)) {
                        tempValue = (Math.abs(Number(tempValue)) / 1.0e+9).toFixed(2);
                        while (tempValue[tempValue.length - 1] === '0') {
                            tempValue = tempValue.slice(0, -1);
                        }

                        if (tempValue[tempValue.length - 1] === '.') {
                            tempValue = tempValue.slice(0, -1);
                        }

                        tempValue = tempValue + 'B';
                    }
                } else if (rules.type === 'Trillion') {
                    if (!isNaN(tempValue)) {
                        tempValue = (Math.abs(Number(tempValue)) / 1.0e+12).toFixed(2);
                        while (tempValue[tempValue.length - 1] === '0') {
                            tempValue = tempValue.slice(0, -1);
                        }

                        if (tempValue[tempValue.length - 1] === '.') {
                            tempValue = tempValue.slice(0, -1);
                        }

                        tempValue = tempValue + 'T';
                    }
                } else if (rules.type === 'Round Whole Number') {
                    if (!isNaN(tempValue)) {
                        tempValue = Math.round(Number(tempValue));
                    }
                } else if (rules.type === 'Round Tenths') {
                    if (!isNaN(tempValue)) {
                        tempValue = Math.round(10 * Number(tempValue)) / 10;
                    }
                } else if (rules.type === 'Round Hundredths') {
                    if (!isNaN(tempValue)) {
                        tempValue = Math.round(100 * Number(tempValue)) / 100;
                    }
                } else if (rules.type === 'Short Date') {
                    date = new Date(tempValue);

                    // if it translates correctly to a date we will reformat it to be MM/DD
                    if (!isNaN(date.getUTCMonth()) && !isNaN(date.getUTCDate())) {
                        tempValue = (date.getUTCMonth() + 1) + '/' + (date.getUTCDate());
                    }
                }
            }

            if (rules.delimiter) {
                if (!isNaN(tempValue) && rules.delimiter !== 'Default') {
                    parts = tempValue.toString().split('.');
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, rules.delimiter);
                    tempValue = parts.join('.');
                }
            }

            if (rules.prepend && rules.prepend !== 0) {
                // prepend the value to beginning of string
                tempValue = rules.prepend + tempValue;
            }

            if (rules.append && rules.prepend !== 0) {
                // append the value to the end
                tempValue = tempValue + rules.append;
            }
        }

        // tempValue = tempValue + '';
        // tempValue = tempValue.replace(/_/g, ' ');

        if (typeof tempValue === 'string') {
            // default cleaning for titles or when format doesn't exist
            tempValue = tempValue.replace(/_/g, ' ');
        }
        return tempValue;
    }

    /**
     * @name cleanValue
     * @param {*} item the string/number to be cleaned
     * @desc clean the value for display
     * @returns {*} the string/number that has been cleaned
     */
    function cleanValue(item) {
        let formatted = item;

        if (typeof formatted === 'string') {
            // default cleaning for titles or when format doesn't exist
            formatted = formatted.replace(/_/g, ' ');
        } else if (typeof formatted === 'number') {
            formatted = Math.round(100 * Number(formatted)) / 100;
            formatted = formatted.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3
            });
        }
        return formatted;
    }

    /**
     * @name getLabels
     * @param {object} eChartsConfig the config options for the chart
     * @desc determines labels to pass into eChartsService for Brush
     * @returns {Array} - array of objects defining Data Zoom settings
     */
    function getLabels(eChartsConfig) {
        if (eChartsConfig.options.seriesFlipped) {
            return eChartsConfig.legendHeaders;
        }
        if (eChartsConfig.options.rotateAxis) {
            if (eChartsConfig.yAxisConfig[0]) {
                if (eChartsConfig.yAxisConfig[0][0]) {
                    // TODO Facet: pass in yAxisIndex
                    return eChartsConfig.yAxisConfig[0][0].data;
                }
                return eChartsConfig.yAxisConfig[0].data;
            }
            return [];
        }
        if (eChartsConfig.xAxisConfig[0]) {
            if (eChartsConfig.xAxisConfig[0][0]) {
                // TODO Facet: pass in yAxisIndex
                return eChartsConfig.xAxisConfig[0][0].data;
            }
            return eChartsConfig.xAxisConfig[0].data;
        }
        return [];
    }

    /**
     * @name formatDataForGroupByAll
     * @param {object} data the data to group
     * @param {object} groupBy the dimensions to group by
     * @param {object} facetHeaders the headers to facet
     * @desc format the data for grouping in a facet
     * @returns {object} the formatted data
     */
    function formatDataForGroupByAll(data, groupBy, facetHeaders) {
        var groupByIndex,
            i,
            n,
            j,
            dataObj = {},
            axisLabels = [],
            uniqueAxisLabels = [],
            exists,
            emptyArr,
            maxXLabels = 0;

        groupByIndex = data.headers.indexOf(groupBy.selectedDim);
        data.headers.splice(groupByIndex, 1);
        data.rawHeaders.splice(groupByIndex, 1);

        if (facetHeaders.commonAxis) {
            for (j = 0; j < data.values.length; j++) {
                axisLabels.push(data.values[j][0]);
            }
            // Get unique values axisLabels
            uniqueAxisLabels = axisLabels.filter(onlyUnique);
        }

        for (n = 0; n < groupBy.uniqueInstances.length; n++) {
            dataObj[groupBy.uniqueInstances[n]] = [];
            for (i = 0; i < data.values.length; i++) {
                if (data.values[i][groupByIndex] === groupBy.uniqueInstances[n]) {
                    data.values[i].splice(groupByIndex, 1);
                    dataObj[groupBy.uniqueInstances[n]].push(data.values[i]);
                }
            }
            if (facetHeaders.commonAxis) {
                if (dataObj[groupBy.uniqueInstances[n]].length !== uniqueAxisLabels.length) {
                    for (i = 0; i < uniqueAxisLabels.length; i++) {
                        exists = false;
                        for (j = 0; j < dataObj[groupBy.uniqueInstances[n]].length; j++) {
                            if (dataObj[groupBy.uniqueInstances[n]][j][0] === uniqueAxisLabels[i]) {
                                exists = true;
                            }
                        }
                        if (!exists) {
                            emptyArr = [uniqueAxisLabels[i], 0, 0];
                            dataObj[groupBy.uniqueInstances[n]].splice(i, 0, emptyArr);
                        }
                    }
                }
            }

            if (dataObj[groupBy.uniqueInstances[n]].length > maxXLabels) {
                maxXLabels = dataObj[groupBy.uniqueInstances[n]].length;
            }
            if (dataObj[groupBy.uniqueInstances[n]].length === 0) {
                delete dataObj[groupBy.uniqueInstances[n]];
            }
        }

        return {
            'data': dataObj,
            'maxXLabels': maxXLabels
        };
    }

    /**
     * @name formatDataForGroupByIndividual
     * @desc formats data when Group By exists
     * @param {object} data orginial data
     * @param {object} groupBy groupBy object
     * @returns {void}
     */
    function formatDataForGroupByIndividual(data, groupBy) {
        var formattedData = data,
            groupByIndex,
            name,
            i,
            instanceIdx,
            returnObj = {};

        if (groupBy.viewType === 'Individual Instance') {
            groupByIndex = data.headers.indexOf(groupBy.selectedDim);
            if (groupByIndex === -1) {
                // return data;
                groupByIndex = data.headers.length;
            }

            if (typeof groupBy.instanceIndex === 'string') {
                instanceIdx = parseInt(groupBy.instanceIndex, 10);
            }
            // Create name for title
            name = groupBy.selectedDim + ' : ' + groupBy.uniqueInstances[instanceIdx];
            // Remove Group By dimension from data headers and values
            formattedData.headers.splice(groupByIndex, 1);
            formattedData.rawHeaders.splice(groupByIndex, 1);

            // Remove any added data from brush/click
            for (i = 0; i < data.values.length; i++) {
                if (data.values[i][groupByIndex] !== groupBy.uniqueInstances[instanceIdx]) {
                    data.values.splice(i, 1);
                    i--;
                }
            }

            for (i = 0; i < data.values.length; i++) {
                data.values[i].splice(groupByIndex, 1);
            }
            returnObj.name = name;
            returnObj.data = data;
        }

        return returnObj;
    }

    /**
     * @name getValueMapping
     * @desc loop through keys and grab value dimension and tooltip info
     * @param {object} keys semoss keys
     * @param {object} headers data headers
     * @param {bool} seriesFlipped - uiOptions.seriesFlipped
     * @returns {void}
     */
    function getValuesMapping(keys, headers, seriesFlipped) {
        var key,
            mappingByDimension = {},
            mappingByModel = {};

        mappingByModel.value = [];
        mappingByModel.tooltip = [];

        for (key in keys) {
            if (keys.hasOwnProperty(key)) {
                mappingByDimension[keys[key].alias] = headers.indexOf(keys[key].alias);
                if (keys[key].model === 'value') {
                    mappingByModel.value.push(headers.indexOf(keys[key].alias));
                } else if (keys[key].model === 'tooltip') {
                    if (!seriesFlipped) {
                        mappingByModel.tooltip.push(headers.indexOf(keys[key].alias));
                    }
                } else {
                    mappingByModel[keys[key].model] = headers.indexOf(keys[key].alias);
                }
            }
        }
        return {
            mappingByDimension: mappingByDimension,
            mappingByModel: mappingByModel
        };
    }

    /**
     * @name mergeCharts
     * @param {array} chartArr the list of charts to be merged
     * @param {object} settings defines what you want merged other than the data
     * @desc merge the charts to be painted in eCharts
     * @returns {*} the merged charts
     */
    function mergeCharts(chartArr) {
        // TODO need to refactor facet to work with multi-task charts. facet would need to move to the BE in order to generate the correct facets
        var seriesIdx,
            chartIdx,
            tempChart = chartArr,
            newChart = tempChart[0]; // set the first chart as the 'base' to work off of
        /**
         * @name axistExists
         * @param {*} axisList the list of axies to check again
         * @param {*} axisName axis to check
         * @desc check to see if the axis name exists in the list of axes
         * @returns {boolean} true or false
         */
        function axisExists(axisList, axisName) {
            var axisIdx,
                exists = false;

            for (axisIdx = 0; axisIdx < axisList.length; axisIdx++) {
                if (axisName === axisList[axisIdx].name) {
                    exists = true;
                    break;
                }
            }

            return exists;
        }

        for (chartIdx = 1; chartIdx < tempChart.length; chartIdx++) {
            for (seriesIdx = 0; seriesIdx < tempChart[chartIdx].data.length; seriesIdx++) {
                newChart.data.push(tempChart[chartIdx].data[seriesIdx]);
                // add a new y axis
                if (tempChart[chartIdx].addYAxis) {
                    if (!axisExists(newChart.yAxisConfig, tempChart[chartIdx].yAxisConfig[0].name)) {
                        if (newChart.groupByInfo && newChart.groupByInfo.viewType === 'All Instances') {
                            // lets not handle all instance facet for now...
                        } else {
                            // coloring axis line to match the new series color
                            tempChart[chartIdx].yAxisConfig[0].axisLine.lineStyle = {
                                color: newChart.options.color[newChart.data.length - 1]
                            };
                        }

                        // if we have multiple yAxis on the same side...we need to set an offset so they are not on top of each other
                        if (newChart.yAxisConfig.length > 1) {
                            tempChart[chartIdx].yAxisConfig[0].offset = 80 * (newChart.yAxisConfig.length - 1);
                        }
                        newChart.yAxisConfig.push(tempChart[chartIdx].yAxisConfig[0]);
                        // set the y axis index of the data series
                        newChart.data[newChart.data.length - 1].yAxisIndex = newChart.yAxisConfig.length - 1;
                        newChart.data[newChart.data.length - 1].position = 'right';
                    }
                }

                // add a new x axis
                if (tempChart[chartIdx].addXAxis) {
                    if (!axisExists(newChart.xAxisConfig, tempChart[chartIdx].xAxisConfig[0].name)) {
                        newChart.xAxisConfig.push(tempChart[chartIdx].xAxisConfig[0]);

                        // if we have multiple yAxis on the same side...we need to set an offset so they are not on top of each other
                        // if (newChart.xAxisConfig.length > 2) {
                        //     tempChart[chartIdx].xAxisConfig[0].offset = 50 * (newChart.xAxisConfig.length - 1);
                        // }

                        // set the x axis index of the data series
                        newChart.data[newChart.data.length - 1].xAxisIndex = newChart.xAxisConfig.length - 1;
                        newChart.data[newChart.data.length - 1].position = 'top';
                    }
                }
            }
        }

        // if there are multiple y axis, we will color the first one as well to differentiate between data series
        if (newChart.yAxisConfig.length > 1) {
            if (newChart.groupByInfo && newChart.groupByInfo.viewType === 'All Instances') {
                // lets not handle all instance facet for now...
            } else {
                newChart.yAxisConfig[0].axisLine.lineStyle = {
                    color: newChart.options.color[0]
                };
            }
        }
        return newChart;
    }

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
     * @param {object} dataTypes - the data Types for the keys
     * @returns {Object} - object of ECharts data series
     */
    function getDataSeries(task, data, uiOptions, colorBy, groupByInstance, groupByInfo, keys, dataTypes) {
        var tempDataObject,
            i,
            groupedData,
            finalData = [],
            valuesMapping = getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);

        if (groupByInfo && groupByInfo.viewType === 'All Instances') {
            tempDataObject = [];
            finalData = [];
            for (i = 0; i < groupByInfo.uniqueInstances.length; i++) {
                groupedData = {};
                groupedData.headers = data.headers;
                groupedData.rawHeaders = data.rawHeaders;
                groupedData.values = groupByInfo.tempData[groupByInfo.uniqueInstances[i]];
                tempDataObject.push(formatData(valuesMapping, groupedData, uiOptions.seriesFlipped));
                finalData.push(processData(valuesMapping, task, tempDataObject[i], uiOptions, colorBy, i, dataTypes));
            }
        } else {
            tempDataObject = formatData(valuesMapping, data, uiOptions.seriesFlipped);
            finalData = processData(valuesMapping, task, tempDataObject, uiOptions, colorBy, i, dataTypes);
        }

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
     * @param {object} dataTypes data types for the viz
     * @returns {object} the data series
     */
    function processData(valuesMapping, task, data, options, colorBy, idx, dataTypes) {
        var dataObject = {},
            newDataObject = {},
            seriesArray = [],
            additionalSeries = [],
            i, j,
            markLineIdx = 0,
            markAreaIdx = 0,
            specificConfig = getVizSpecificConfig(task.layout, options),
            vizMap = {
                Column: 'bar',
                Area: 'line',
                Line: 'line',
                Pie: 'pie'
            },
            isDateType = false;

        if ((task.layout === 'Area' || task.layout === 'Line') &&
            dataTypes[data.labelName] && (dataTypes[data.labelName][0].dimensionType.toUpperCase() === 'DATE' || dataTypes[data.labelName][0].dimensionType.toUpperCase() === 'TIMESTAMP')) {
            isDateType = true;
        }

        for (i = 0; i < data.valuesNames.length; i++) {
            dataObject.name = data.valuesNames[i];
            dataObject.type = vizMap[task.layout];
            dataObject.itemStyle = {
                normal: {}
            };

            dataObject.data = configureDataValue(valuesMapping, data, options, i, colorBy, options.barImage, dataObject.name, isDateType);
            Object.assign(dataObject, specificConfig.settings);

            if (typeof idx !== 'undefined') {
                dataObject.xAxisIndex = idx;
                dataObject.yAxisIndex = idx;
            }
            // Animation
            dataObject.animation = false;

            // Toggle Stack
            if (options.toggleStack) {
                dataObject.stack = typeof idx === 'undefined' ? 'toggleStack' + idx : 'toggleStack';
            }

            // Toggle Highlight
            if (options.toggleEventAxis) {
                dataObject.emphasis = {
                    itemStyle: {
                        borderWidth: 1,
                        borderColor: 'rgba(0, 0, 0, 1)',
                        shadowBlur: 10,
                        shadowOffsetX: 1,
                        shadowColor: 'rgba(0, 0, 0, 1)'
                    }
                };
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
                            // for flipped series use formatting of first value dimension
                            if (options.seriesFlipped && dataTypes.hasOwnProperty(data.labelData[0])) {
                                formatType = dataTypes[data.labelData[0]][0];
                            }
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
                            // for flipped series use formatting of first value dimension
                            if (options.seriesFlipped && dataTypes.hasOwnProperty(data.labelData[0])) {
                                formatType = dataTypes[data.labelData[0]][0];
                            }
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
     * @name formatData
     * @desc puts data into ECharts data format
     * @param {object} valuesMapping dimensions & model information
     * @param {Object} data - object of data in original format
     * @param {bool} seriesFlipped - uiOptions.seriesFlipped
     * @returns {Object} - object of data in ECharts format
     */
    function formatData(valuesMapping, data, seriesFlipped) {
        var eChartsDataObject = {},
            labelIdx = valuesMapping.mappingByModel.label,
            i, n, j,
            temp,
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
        eChartsDataObject.yLabel = '';

        for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
            eChartsDataObject.tooltipHeaders.push(data.headers[valuesMapping.mappingByModel.tooltip[j]]);
        }

        for (i = 0; i < data.values.length; i++) {
            eChartsDataObject.labelData.push(data.values[i][labelIdx]);
            tooltipIdx = [];
            for (j = 0; j < valuesMapping.mappingByModel.tooltip.length; j++) {
                tooltipIdx.push(data.values[i][valuesMapping.mappingByModel.tooltip[j]]);
            }
            eChartsDataObject.tooltipData.push(tooltipIdx);
        }

        for (n = 0; n < valuesMapping.mappingByModel.value.length; n++) {
            if (n === 0) {
                eChartsDataObject.yLabel = cleanValue(data.headers[valuesMapping.mappingByModel.value[n]]);
            }
            eChartsDataObject.valuesNames.push(data.headers[valuesMapping.mappingByModel.value[n]]);

            valueData = [];
            for (i = 0; i < data.values.length; i++) {
                valueData.push(data.values[i][valuesMapping.mappingByModel.value[n]]);
            }
            eChartsDataObject.valuesData.push(valueData);
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
     * @name configureDataValue
     * @param {object} valuesMapping the valuesMapping
     * @param {object} data echarts data
     * @param {object} options Semoss ui options
     * @param {number} i index of for loop from parent function
     * @param {number} colorBy index of the data to highlight
     * @param {object} barImage uiOptions.barImage
     * @param {string} seriesName the name of the series
     * @param {boolean} isDateFormat true if x axis is a Date type and viz type is Area or Line
     * @desc builds the data values objects for series
     * @return {array} array of data values objects
     */
    function configureDataValue(valuesMapping, data, options, i, colorBy, barImage, seriesName, isDateFormat) {
        return data.valuesData[i].map(function (value, idx) {
            var valueObj = {},
                prop, j, item, labelIndex;

            if (isDateFormat) {
                valueObj.value = [data.labelData[idx], value];
            } else {
                valueObj.value = value;
            }

            if (i === 0 && valuesMapping.mappingByModel.tooltip.length > 0) {
                valueObj.tooltip = [];
                for (j = 0; j < data.tooltipData[idx].length; j++) {
                    valueObj.tooltip.push({
                        'header': data.tooltipHeaders[j],
                        'value': data.tooltipData[idx][j]
                    });
                }
            }

            if (options.highlight) {
                // check all properties in our highlight data
                for (prop in options.highlight.data) {
                    if (options.highlight.data.hasOwnProperty(prop)) {
                        // if x-axis label is equal to the property we are coloring
                        if (data.labelName === prop) {
                            options.highlight.data[prop].forEach(function (hiliteValue) {
                                if (data.labelData.indexOf(hiliteValue) === idx) {
                                    valueObj.itemStyle = {
                                        normal: {
                                            borderColor: '#000',
                                            borderWidth: 2
                                        }
                                    };
                                }
                            });
                        }
                    }
                }
            }

            if (options.label) {
                for (item in options.label) {
                    if (options.label.hasOwnProperty(item)) {
                        if (data.labelName === item) {
                            options.label[item].forEach(function (labelValue) {
                                if (data.labelData.indexOf(labelValue) === idx) {
                                    valueObj.label = {
                                        show: true,
                                        formatter: function (obj) {
                                            return cleanValue(obj.value);
                                        }
                                    };
                                }
                            });
                        }
                    }
                }
            }

            // Color by Value
            if (colorBy && colorBy.length > 0) {
                data.labelData = data.labelData.map(function (label) {
                    return label;
                });

                colorBy.forEach(function (rule) {
                    if (data.labelName === rule.colorOn) {
                        rule.valuesToColor.forEach(function (name) {
                            labelIndex = data.labelData.indexOf(name);
                            if (idx === labelIndex) {
                                if ( // ??? need to rework this logic...so confusing
                                    (data.valuesNames.length > 1 && rule.valuesColumn === seriesName) ||
                                    data.valuesNames.length === 1 ||
                                    rule.colorOn === rule.valuesColumn
                                ) {
                                    if (valueObj.hasOwnProperty('itemStyle') && valueObj.itemStyle.hasOwnProperty('normal')) {
                                        valueObj.itemStyle.normal.color = rule.color;
                                    } else {
                                        valueObj.itemStyle = {
                                            normal: {
                                                color: rule.color
                                            }
                                        };
                                    }
                                }
                            }
                        });
                    }
                });
            }

            if (barImage && barImage.symbol && barImage.symbol !== 'Default (Bar)') {
                valueObj.symbol = barImage.symbol;
            }

            return valueObj;
        });
    }

    /**
     * @name getXAxis
     * @desc defines settings for x-axis
     * @param {Object} uiOptions - uiOptions
     * @param {data} data - the data to get axis information from
     * @param {Object} groupBy - grouping information for facet
     * @param {object} keys - dimension & model mapping
     * @param {object} dataTypes - data types for viz
     * @param {string} layout - the viz layout
     * @returns {*} - array of x-axis settings
     */
    function getXAxis(uiOptions, data, groupBy, keys, dataTypes, layout) {
        var groupedData = {},
            tempDataObject,
            xAxisConfig = [],
            i,
            valuesMapping = getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);

        if (groupBy && groupBy.viewType === 'All Instances') {
            tempDataObject = [];
            for (i = 0; i < groupBy.uniqueInstances.length; i++) {
                groupedData = {};
                groupedData.headers = data.headers;
                groupedData.rawHeaders = data.rawHeaders;
                groupedData.values = groupBy.tempData[groupBy.uniqueInstances[i]];
                tempDataObject.push(formatData(valuesMapping, groupedData, uiOptions.seriesFlipped));
                xAxisConfig.push(configureXAxis(uiOptions, tempDataObject[i].labelData, tempDataObject[i].labelName, groupBy, i, dataTypes, layout));
            }
        } else {
            tempDataObject = formatData(valuesMapping, data, uiOptions.seriesFlipped);
            xAxisConfig = configureXAxis(uiOptions, tempDataObject.labelData, tempDataObject.labelName, groupBy, 0, dataTypes, layout);
        }
        if (uiOptions.displaySum) {
            xAxisConfig.push({
                type: 'category',
                data: getStackBarSum(tempDataObject, uiOptions.seriesFlipped, dataTypes)
            });
        }
        return xAxisConfig;
    }

    /**
     * @name getStackBarSum
     * @desc calculate the sum of stackbars
     * @param {Object} dataSeries - tempDataObject
     * @param {Boolean} seriesFlipped - flipped series value
     * @param {Object} dataTypes - data Types for viz
     * @returns {array} - array of stack bar sums
     */

    function getStackBarSum(dataSeries, seriesFlipped, dataTypes) {
        let sumList = [];
        for (let index = 0; index < dataSeries.labelData.length; index++) {
            var formatType,
                total = 0;
            if (seriesFlipped && dataSeries.labelData && dataSeries.labelData[index] && dataTypes.hasOwnProperty(dataSeries.labelData[index])) {
                formatType = dataTypes[dataSeries.labelData[index]][0];
            }
            // eslint-disable-next-line no-loop-func
            dataSeries.valuesData.forEach((data, i) => {
                if (data[index]) {
                    if (!seriesFlipped && dataSeries.valuesNames.length === dataSeries.valuesData.length && dataTypes.hasOwnProperty(dataSeries.valuesNames[i])) {
                        if (!formatType) {
                            formatType = dataTypes[dataSeries.valuesNames[i]][0];
                        } else if (!(formatType.dimensionType === 'DOUBLE')) {
                            formatType = dataTypes[dataSeries.valuesNames[i]][0];
                        }
                    }
                    total = total + parseFloat(data[index]);
                }
            });
            sumList.push(visualizationUniversal.formatValue(total, formatType));
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
     * @param {object} dataTypes - data Types for viz
     * @param {string} layout - the viz layout type
     * @returns {array} - array of x-axis settings
     */
    function configureXAxis(uiOptions, data, axisName, groupBy, idx, dataTypes, layout) {
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
            labelType,
            axisType = 'category';

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

        // when the x axis is date and the layout is area/line we need to paint the axis type as 'time'
        if (layout && (layout === 'Area' || layout === 'Line') &&
            labelType && (labelType.dimensionType.toUpperCase() === 'DATE' || labelType.dimensionType.toUpperCase() === 'TIMESTAMP')) {
            axisType = 'time';
        }

        let lineStyle = {
            color: uiOptions.axis.borderColor,
            width: parseFloat(uiOptions.axis.borderWidth)
        };

        xAxisConfig.push({
            type: axisType,
            data: axisType === 'time' ? null : data, // time data does not have data in x-axis
            axisTick: {
                show: showAxisTicks,
                alignWithLabel: true,
                lineStyle: lineStyle
            },
            splitLine: {
                show: grid,
                lineStyle: uiOptions.grid
            },
            axisLabel: {
                show: showAxisValues,
                rotate: settings.rotate || 0,
                formatter: function (value) {
                    // for flipped series do not apply formatting rules for label dimension to xAxis since its no longer the same series
                    if (uiOptions.seriesFlipped) {
                        return formatLabel(value, settings.format, false);
                    }
                    return formatLabel(value, settings.format, labelType);
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
                lineStyle: lineStyle
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
     * @param {*} dataTypes - data types of selected headers
     * @desc get the Y Axis config options
     * @returns {*} the y config options
     */
    function getYAxis(uiOptions, data, groupBy, keys, dataTypes) {
        var groupedData = {},
            tempDataObject,
            yAxisConfig = [],
            i,
            valuesMapping = getValuesMapping(keys, data.headers, uiOptions.seriesFlipped),
            extremes = findMaxMin();

        if (groupBy && groupBy.viewType === 'All Instances') {
            tempDataObject = [];
            for (i = 0; i < groupBy.uniqueInstances.length; i++) {
                groupedData = {};
                groupedData.headers = data.headers;
                groupedData.rawHeaders = data.rawHeaders;
                groupedData.values = groupBy.tempData[groupBy.uniqueInstances[i]];
                tempDataObject.push(formatData(valuesMapping, groupedData, uiOptions.seriesFlipped));
                yAxisConfig.push(configureYAxis(uiOptions, uiOptions.yReversed, tempDataObject[i].yLabel, groupBy, i, extremes, dataTypes));
            }
        } else {
            tempDataObject = formatData(valuesMapping, data, uiOptions.seriesFlipped);
            yAxisConfig = configureYAxis(uiOptions, uiOptions.yReversed, tempDataObject.yLabel, groupBy, 0, {}, dataTypes);
        }

        return yAxisConfig;

        /**
         * @name findMaxMin
         * @desc if Group By All Instances exists, find the max and min value for the y-axis
         * @returns {obj} max and min values
         */
        function findMaxMin() {
            var tempExtremes = {},
                dataArray = [],
                idx, n;
            if (groupBy && groupBy.viewType === 'All Instances') {
                for (idx = 0; idx < data.values.length; idx++) {
                    for (n = 0; n < valuesMapping.mappingByModel.value.length; n++) {
                        dataArray.push(data.values[idx][valuesMapping.mappingByModel.value[n]]);
                    }
                }
                tempExtremes.min = Math.min.apply(null, dataArray);
                tempExtremes.max = Math.max.apply(null, dataArray);

                if (tempExtremes.min > 0) {
                    tempExtremes.min = 0;
                }
            }
            return tempExtremes;
        }
    }

    /**
     * @name configureYAxis
     * @desc sets configuration of y-axis (min, max, and inverse bool)
     * @param {Object} options - uiOptions
     * @param {bool} reverse - boolean of whether or not to reverse y-axis
     * @param {Array} yLabel - default label for y axis
     * @param {Object} groupBy - object of groupBy info
     * @param {num} idx - groupBy instance index
     * @param {Object} extremes - max and min of group by all instances
     * @param {Object} dataTypes - data Types based on keys
     * @returns {Array} - array of object of y-axis configuration
     */
    function configureYAxis(options, reverse, yLabel, groupBy, idx, extremes, dataTypes) {
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
            originalTitle = '',
            lineStyle = {
                color: options.axis.borderColor,
                width: parseFloat(options.axis.borderWidth)
            };

        if (groupBy && groupBy.viewType === 'All Instances' && !options.toggleStack) {
            yMax = Math.ceil(extremes.max);
            if (extremes.min < 0) {
                yMin = Math.floor(extremes.min);
            }
        }

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
                    return formatLabel(value, options.editYAxis.format, formatType);
                },
                rotate: options.editYAxis.rotate || 0,
                fontWeight: parseInt(options.axis.label.fontWeight, 10) || 400,
                fontSize: parseFloat(options.axis.label.fontSize) || fontSize,
                fontFamily: options.axis.label.fontFamily || 'Inter',
                color: options.axis.label.fontColor || fontColor
            },
            axisLine: {
                show: showAxisLine,
                lineStyle: lineStyle
            },
            axisTick: {
                show: showAxisTicks,
                lineStyle: lineStyle
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
     * @param {object} groupBy - group by information for facet
     * @param {object} keys - the dimension & model mapping
     * @desc get the legend information
     * @returns {*} legend information
     */
    function getLegend(uiOptions, data, groupBy, keys) {
        var groupedData = {},
            tempDataObject,
            i,
            numberOfDataSeries,
            valuesMapping = getValuesMapping(keys, data.headers, uiOptions.seriesFlipped);

        if (groupBy && groupBy.viewType === 'All Instances') {
            tempDataObject = [];
            for (i = 0; i < groupBy.uniqueInstances.length; i++) {
                groupedData = {};
                groupedData.headers = data.headers;
                groupedData.rawHeaders = data.rawHeaders;
                groupedData.values = groupBy.tempData[groupBy.uniqueInstances[i]];
                tempDataObject.push(formatData(valuesMapping, groupedData, uiOptions.seriesFlipped));
            }

            if (tempDataObject[0]) {
                numberOfDataSeries = tempDataObject[0].valuesData.length || 0;
            } else {
                numberOfDataSeries = 0;
            }
        } else {
            tempDataObject = formatData(valuesMapping, data, uiOptions.seriesFlipped);
            numberOfDataSeries = tempDataObject.valuesData.length || 0;
        }

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
     * @name getAnimation
     * @param {object} animation options
     * @desc get the animation data for echarts
     * @returns {object} animation info
     */
    function getAnimation(animation) {
        var animationSettings = {};
        // TODO small refactor
        if (animation && animation.chooseType === 'No Animation') {
            animationSettings.showAnimation = false;
        } else if (animation) {
            animationSettings.showAnimation = true;
            animationSettings.defaultAnimationType = animation.chooseType;
            animationSettings.defaultAnimationSpeed = animation.animationSpeed;
            animationSettings.defaultAnimationDuration = animation.animationDuration;
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
                repeat: 'repeat'
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
     * @name getEchartsConfig
     * @param {object} config ele, task, uiOptions, selectedMode, commentData, colorBy
     * @desc process the echarts config object structure
     * @returns {object} returns the eChartsConfig option
     */
    function getEchartsConfig(config) {
        var n, i, k, j,
            groupByInfo,
            data,
            keys,
            dataTypes,
            options,
            allKeys = [],
            layerLayouts = [],
            groupBy = {},
            groupedData,
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
            dataTypes = getDataTypes(allKeys, options);
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
                groupBy = formatDataForGroupByIndividual(data, groupByInfo);
                data = groupBy.data;
                groupByInstance = groupBy.name;
            } else if (groupByInfo.viewType === 'All Instances') {
                groupedData = formatDataForGroupByAll(data, groupByInfo, config.uiOptions.facetHeaders);
                groupByInfo.tempData = groupedData.data;
                groupByInfo.maxXLabels = groupedData.maxXLabels;
                // Remove empty groups (if filtered)
                groupByInfo.uniqueInstances = [];
                for (n = 0; n < Object.keys(groupedData.data).length; n++) {
                    groupByInfo.uniqueInstances.push(Object.keys(groupedData.data)[n]);
                }
            }
        }

        // eChartsConfig = barService.getConfig('bar', data, uiOptions, colorBy, groupByInstance, groupByInfo, keys);
        eChartsConfig.data = getDataSeries(config.task, data, config.uiOptions, config.colorBy, groupByInstance, groupByInfo, keys, dataTypes);
        eChartsConfig.keys = keys;
        eChartsConfig.allKeys = allKeys;
        eChartsConfig.dataTypes = dataTypes;

        if (config.uiOptions.rotateAxis) {
            eChartsConfig.xAxisConfig = getYAxis(config.uiOptions, data, groupByInfo, keys, dataTypes);
            eChartsConfig.yAxisConfig = getXAxis(config.uiOptions, data, groupByInfo, keys, dataTypes, config.task.layout);
        } else {
            eChartsConfig.xAxisConfig = getXAxis(config.uiOptions, data, groupByInfo, keys, dataTypes, config.task.layout);
            eChartsConfig.yAxisConfig = getYAxis(config.uiOptions, data, groupByInfo, keys, dataTypes);
        }

        // get legend info
        // if (config.uiOptions.toggleLegend) {
        legend = getLegend(config.uiOptions, data, groupByInfo, keys);
        eChartsConfig.legendHeaders = legend.headers;
        eChartsConfig.legendLabels = legend.labels;
        eChartsConfig.legendData = legend.data;
        eChartsConfig.legendLabelStyle = legend.labelStyle;
        eChartsConfig.showLegend = config.uiOptions.toggleLegend;
        eChartsConfig.numberOfDataSeries = legend.numberOfDataSeries;
        
        // Get legend properties
        eChartsConfig.legendTop = config.uiOptions.legend.topalign;
        eChartsConfig.legendLeft = config.uiOptions.legend.leftalign;
        eChartsConfig.legendOrient = config.uiOptions.legend.orient;
        eChartsConfig.legendBackground = config.uiOptions.legend.backgroundColor;
        // }

        // get animation info
        animation = getAnimation(config.uiOptions.animation);
        eChartsConfig.showAnimation = animation.showAnimation;
        eChartsConfig.animationType = animation.defaultAnimationType;
        eChartsConfig.animationaDelay = animation.defaultAnimationSpeed;
        eChartsConfig.animationaDuration = animation.defaultAnimationDuration;

        eChartsConfig.axisPointer = config.uiOptions.axisPointer;
        eChartsConfig.backgroundColorStyle = getBackgroundColorStyle(config.uiOptions.watermark);
        eChartsConfig.groupByInstance = groupByInstance;
        eChartsConfig.options = config.uiOptions;

        eChartsConfig.currentMode = getCurrentMode(config.selectedMode);
        eChartsConfig.comments = config.commentData; // scope.widgetCtrl.getWidget('view.visualization.commentData');
        eChartsConfig.echartsMode = getEchartsMode(config.selectedMode);
        eChartsConfig.groupByInfo = groupByInfo;
        eChartsConfig.size = determineResize(config.ele, eChartsConfig);

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
        let dataTypes = {},
            k, j,
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
        return dataTypes;
    }

    /**
     * @name initializeClickHoverKeyEvents
     * @desc single click event from echarts
     * @param {object} echart - echarts instance
     * @param {object} config - config containing info for events: callbacks, data, currentevent callback
     * @returns {function} destroy function for dom listeners
     */
    function initializeClickHoverKeyEvents(echart, config) {
        var activeListeners = {}, // map of all current listers
            clickTimer,
            whiteSpaceClickTimer,
            ignoreDomMouseUp = false,
            hoverTimer;

        initializeMouseEvents();
        initializeKeyEvents();

        return destroy;

        /**
         * @name initializeMouseEvents
         * @desc mouse listener creation
         * @returns {void}
         */
        function initializeMouseEvents() {
            // The eventing layer is explicitly defined to handle, click, double click, hover, mouse out, and key press events. The definitions for each of these are below:
            // Click: a mouse-up event. Will be canceled if another mouse-up within 250 ms. Meaning that the click event is not fired until 250 ms after the mouse up
            // Double Click: a second mouse-up event within a 250 ms time period will fire the double click callback
            // Hover: a mouse-in event where the callback is fired when no other mouse-in or mouse-out events are fired for 2 seconds.
            // Mouse out: Event is only fired when the current event is Hover and then leaving the current element.This is done to prevent the mouse out event from firing too many times.
            // Key press: calls the key event callback whenever a key is pressed on the top level element. In order to enable key event capture, that dom element must have a defined tab index > 0 in order for the browser to catch those events.

            // only pertain to elements drawn on the canvas, not whitespace
            // these are echarts functions that return a reference to the data behind the clicked element
            echart.on('mouseup', eChartMouseUp);
            echart.on('mouseover', eChartMouse);
            echart.on('mouseout', eChartMouseOut);

            // Add listeners to DOM which is outside of echarts, so we need to manage them ourselves
            // Dom listeners will capture the whitespace
            echart._dom.addEventListener('mouseout', mouseOut);
            echart._dom.addEventListener('mouseup', whiteSpaceMouseUp);

            // update active listeners object to be able to destroy the listeners at the right time
            if (!activeListeners.hasOwnProperty('mouseout')) {
                activeListeners.mouseout = [];
            }
            if (!activeListeners.hasOwnProperty('mouseup')) {
                activeListeners.mouseup = [];
            }
            activeListeners.mouseout.push(mouseOut);
            activeListeners.mouseup.push(whiteSpaceMouseUp);
        }

        /**
         * @name initializeKeyEvents
         * @desc key listener creation
         * @returns {void}
         */
        function initializeKeyEvents() {
            // Only create key up and down events if they are passed in from the user
            if (typeof config.cb.onKeyUp === 'function' || typeof config.cb.onKeyDown === 'function') {
                // Add tab index as postive int to enable the dom element to capture the events
                echart._dom.tabIndex = 1;
                if (typeof config.cb.onKeyUp === 'function') {
                    // add keyup listner
                    echart._dom.addEventListener('keyup', keyup);

                    // add listener to activeListeners for management
                    if (!activeListeners.hasOwnProperty('keyup')) {
                        activeListeners.keyup = [];
                    }
                    activeListeners.keyup.push(keyup);
                }
                if (typeof config.cb.onKeyDown === 'function') {
                    // add keyup keydown
                    echart._dom.addEventListener('keydown', keydown);

                    // add listener to activeListeners for management
                    if (!activeListeners.hasOwnProperty('keydown')) {
                        activeListeners.keydown = [];
                    }
                    activeListeners.keydown.push(keydown);
                }
            }
        }

        /**
         * @name keyup
         * @desc keyup event
         * @param {object} e - echarts event sent back on keyup
         * @returns {void}
         */
        function keyup(e) {
            eventCallback(event, 'onKeyUp', {
                key: e.key,
                event: e,
                keyCode: e.keyCode
            });
        }

        /**
         * @name keydown
         * @desc keydown event
         * @param {object} e - echarts event sent back on keydown
         * @returns {void}
         */
        function keydown(e) {
            eventCallback(event, 'onKeyDown', {
                key: e.key,
                event: e,
                keyCode: e.keyCode
            });
        }

        /**
         * @name eChartMouseUp
         * @desc single click event from echarts
         * @param {object} event - echarts event sent back on click
         * @returns {void}
         */
        function eChartMouseUp(event) {
            config;

            // If click was a right-click, ignore
            if (event && event.event && event.event.which === 3) {
                return;
            }

            if (event && event.event && event.event.event) {
                // called from echarts, prevent the whiteSpace click
                ignoreDomMouseUp = true;
            }

            if (clickTimer) {
                clearTimeout(clickTimer);
                eventCallback(event, 'onDoubleClick');
            } else {
                if (config.vizType === 'Map' && !event.data) {
                    return;
                }
                clickTimer = setTimeout(eventCallback.bind(null, event, 'onClick'), 250);
            }
        }

        /**
         * @name whiteSpaceMouseUp
         * @desc single click event for canvas white space
         * @param {object} event - echarts event sent back on click
         * @returns {void}
         */
        function whiteSpaceMouseUp(event) {
            // call new function to check whitespace

            // If click was a right-click, ignore
            if (event && event.which === 3 || ignoreDomMouseUp) {
                ignoreDomMouseUp = false;
                return;
            }

            if (checkWhiteSpace(event)) {
                return;
            }

            if (whiteSpaceClickTimer) {
                clearTimeout(whiteSpaceClickTimer);
                eventCallback(event, 'onDoubleClick');
            } else {
                whiteSpaceClickTimer = setTimeout(eventCallback.bind(null, event, 'onClick'), 250);
            }
        }

        /**
         * @name checkWhiteSpace
         * @desc check whether the click was within or outside of the chart grid
         * @param {object} event - echarts event sent back on click
         * @returns {object} clickInWhiteSpace - boolean of whether or not the click was within the grid or in whitespace
         */
        function checkWhiteSpace(event) {
            var windowWidth,
                windowHeight,
                vizType,
                xStart, xEnd,
                yStart, yEnd;

            if (config.vizType === 'Map') {
                return true;
            }

            if (echart._model._componentsMap.series && echart._model._componentsMap.series[0]) {
                vizType = echart._model._componentsMap.series[0].subType;
            } else if (echart._model._componentsMap.data && echart._model._componentsMap.data.series) {
                vizType = echart._model._componentsMap.data.series[0].subType;
            }

            windowWidth = echart._dom.clientWidth;
            windowHeight = echart._dom.clientHeight;

            switch (vizType) {
                case 'bar':
                case 'line':
                case 'boxplot':
                case 'scatter':
                    xStart = echart._coordSysMgr._coordinateSystems[0]._rect.x || 40;
                    xEnd = xStart + echart._coordSysMgr._coordinateSystems[0]._rect.width || windowWidth - 45;
                    yStart = echart._coordSysMgr._coordinateSystems[0]._rect.y || 60;
                    yEnd = yStart + echart._coordSysMgr._coordinateSystems[0]._rect.height || windowHeight - 45;

                    if (event.layerY < yStart || event.layerY > yEnd || event.layerX > xEnd || event.layerX < xStart) {
                        return true;
                    }
                    break;
                case 'heatmap':
                    xStart = echart._coordSysMgr._coordinateSystems[0]._rect.x || 150;
                    xEnd = xStart + echart._coordSysMgr._coordinateSystems[0]._rect.width || windowWidth - 60;
                    yStart = echart._coordSysMgr._coordinateSystems[0]._rect.y || 120;
                    yEnd = yStart + echart._coordSysMgr._coordinateSystems[0]._rect.height || windowHeight - 60;

                    if (event.layerY < yStart || event.layerY > yEnd || event.layerX > xEnd || event.layerX < xStart) {
                        return true;
                    }
                    break;
                case 'funnel':
                    // width = 60%
                    if (event.layerX < (windowWidth * 0.2)) {
                        return true;
                    }
                    break;
                case 'sankey':
                    // left: '3%',
                    // right: '4%',
                    if (event.layerX > (windowWidth - (windowWidth * 0.03)) || event.layerX < (windowWidth * 0.04)) {
                        return true;
                    }
                    break;
                case 'radar':
                    if (event.layerX < (windowWidth * 0.15) || event.layerY > (windowHeight - 20)) {
                        return true;
                    }
                    break;
                case 'graphGL':
                    if (!event.data) {
                        return true;
                    }
                    break;
                case 'graph':
                    if (!event.data) {
                        return true;
                    }
                    break;
                default:
                    return false;
            }

            return false;
        }

        /**
         * @name eChartMouse
         * @desc onHover event for echarts
         * @param {object} event - echarts event sent back on hover
         * @returns {void}
         */
        function eChartMouse(event) {
            if (hoverTimer) {
                clearTimeout(hoverTimer);
            }
            hoverTimer = setTimeout(eventCallback.bind(null, event, 'onHover'), 2000);
        }

        /**
         * @name eChartMouseOut
         * @desc offHover event for echarts
         * @param {object} event - echarts event sent back on offHover
         * @returns {void}
         */
        function eChartMouseOut(event) {
            var currentEvent = config.getCurrentEvent();
            if (currentEvent.type === 'onHover') {
                eventCallback(event, 'onMouseOut');
            }

            clearTimeout(hoverTimer);
        }

        /**
         * @name mouseOut
         * @desc clears timers on mouse out of canvas
         * @returns {void}
         */
        function mouseOut() {
            // when you leave the dom element
            clearTimeout(hoverTimer);
        }

        /**
         * @name eventCallback
         * @desc click callback event
         * @param {object} event - echarts event sent back on click
         * @param {string} type - click, double click, hover, mouse out, key down, and key up
         * @param {object} paramReturnObj - object with return data
         * @returns {void}
         */
        function eventCallback(event, type, paramReturnObj) {
            var returnObj = {},
                toggleEventAxis = false,
                seriesFlipped = false,
                xVal = 0,
                yVal = 0;

            if (config.chartScope) {
                toggleEventAxis = config.chartScope.widgetCtrl.getWidget('view.visualization.tools.shared.toggleEventAxis');
                seriesFlipped = config.chartScope.widgetCtrl.getWidget('view.visualization.tools.shared.seriesFlipped');
            }

            if (typeof paramReturnObj === 'object' && Object.keys(paramReturnObj).length > 0) {
                returnObj = paramReturnObj;
            }
            returnObj.eventType = type;
            returnObj.data = {};

            if (config.header) {
                returnObj.data[config.header] = [];
            }

            // TODO look into why event is being passed differently...
            if (event.x || event.event && event.event.event && event.event.event.x) {
                xVal = event.x || event.event.event.x;
            }

            if (event.y || event.event && event.event.event && event.event.event.y) {
                yVal = event.y || event.event.event.y;
            }
            returnObj.mouse = [xVal, yVal];

            // specific to each echarts visual
            if (config.vizType === 'scatter' && Array.isArray(event.value)) {
                // the label instance is always the last value in the array
                returnObj.data[config.header].push(event.value[event.value.length - 1]);
            } else if (config.vizType === 'singleaxis' && Array.isArray(event.value) && config.header) {
                returnObj.data[config.header].push(event.value[event.value.length - 1][config.header]);
            } else if (config.vizType === 'heatmap') {
                returnObj.data = {};
                returnObj.data[config.heatData.x] = [];
                returnObj.data[config.heatData.y] = [];
                if (event.value) {
                    returnObj.data[config.heatData.x].push(event.value[0]);
                    returnObj.data[config.heatData.y].push(event.value[1]);
                }
            } else if ((config.vizType === 'GraphGL' || config.vizType === 'Graph') && event.data) {
                returnObj.data = {};
                if (event.data.category && event.data.name) {
                    returnObj.data[event.data.category] = [event.data.name];
                }
            } else if (config.vizType === 'Map' && event.data) {
                returnObj.data = {};
                if (event.data.name && event.data.valueMapping.label) {
                    returnObj.data[event.data.valueMapping.label] = [event.data.name];
                }
            } else if (config.vizType === 'Column' && toggleEventAxis) {
                if (seriesFlipped) {
                    returnObj.data[config.header].push(event.seriesName);
                } else {
                    returnObj.data = {};
                    if (event.seriesName) {
                        returnObj.data[event.seriesName] = [event.value];
                    }
                }
            } else if (event && typeof event.name === 'string') {
                if (event.data && event.data.originalValue) {
                    returnObj.data[config.header].push(event.data.originalValue);
                } else {
                    returnObj.data[config.header].push(event.name);
                }
            }

            config.cb[type](returnObj);

            // clear timers
            clearTimeout(hoverTimer);

            // not sure if we need to null them out
            clickTimer = null;
            whiteSpaceClickTimer = null;
            hoverTimer = null;
        }

        /**
         * @name destroy
         * @desc destroy listener for dom listeners stored in activeListeners
         * @returns {void}
         */
        function destroy() {
            var key, i, len;
            for (key in activeListeners) {
                if (activeListeners.hasOwnProperty(key)) {
                    for (i = 0, len = activeListeners[key].length; i < len; i++) {
                        echart._dom.removeEventListener(key, activeListeners[key][i]);
                    }
                }
            }
        }
    }

    /**
     * @name initializeCommentMode
     * @desc comment mode creation
     * @param {object} config - config holding data for comment mode: comments, current mode, save callback
     * @returns {void}
     */
    function initializeCommentMode(config) {
        // add comment mode
        var d3chart = d3.select('#chart-container'),
            commentMode = new Comment({
                comments: config.comments,
                mode: config.currentMode,
                onSaveCallback: config.saveCb
            });

        commentMode.comments = commentMode.setCommentsList(config.comments);
        commentMode.rescaleComments();

        // set cursor for comment mode
        d3chart.style('cursor', 'pointer');
        // add movementlisteners
        d3chart.selectAll('.smss-comment-mini-container')
            .on('mousedown', function () {
                // logic to move comments
                commentMode.createMoveListener(d3.select(this));
            })
            .on('mouseup', function () {
                if (commentMode.moved) {
                    commentMode.updatePosition();
                }
                commentMode.moved = false;
                d3chart.on('mousemove', false);
            });
        // time to hack dom listeners
        d3chart.on('dblclick', makeComment);
        d3.select(window).on('resize', rescaleComments);

        /**
         * @name makeComment
         * @desc creates comment on dom
         * @returns {void}
         */
        function makeComment() {
            if (config.currentMode === 'commentMode') {
                commentMode.makeComment();
            }
        }

        function rescaleComments() {
            commentMode.rescaleComments();
        }
    }

    /**
     * @name initializeBrush
     * @desc brush mode creation
     * @param {object} chart - echarts instance
     * @param {object} config - config holding data for brush mode: echarts data, brush callback
     * @returns {void}
     */
    function initializeBrush(chart, config) {
        var batch,
            mouseUp = false,
            brushTimer,
            waitForBrushRefresh = false;

        chart.on('brush', startBrush);
        chart.on('brushSelected', brushed);

        /**
         * @name eChartBrushed
         * @desc brush selected event from echarts
         * @param {object} e - charts event
         * @returns {void}
         */
        function brushed(e) {
            batch = e.batch;
        }

        /**
         * @name startBrush
         * @desc sets up mouse listener and updates the batch from the event
         * @returns {void}
         */
        function startBrush() {
            if (!mouseUp && !waitForBrushRefresh) {
                mouseUp = true;
                chart._dom.addEventListener('mouseup', onBrush, true);
                if (config.hasOwnProperty('setContextMenuDataFromBrush') && config.hasOwnProperty('openContextMenu')) {
                    chart._dom.addEventListener('mousemove', resetBrushTimer);
                }
            }
        }

        /**
         * @name resetBrushTimer
         * @desc start brush timer for context menu
         * @param {object} e - charts event
         * @returns {void}
         */
        function resetBrushTimer(e) {
            if (brushTimer) {
                clearTimeout(brushTimer);
            }

            brushTimer = setTimeout(function () {
                showContextMenu(e);
            }, 500);
        }

        /**
         * @name showContextMenu
         * @desc show the context menu
         * @param {object} e - charts event
         * @returns {void}
         */
        function showContextMenu(e) {
            // Remove Context Menu Timer
            clearTimeout(brushTimer);

            var brushObj,
                headers,
                values;

            // Get Selected Data
            brushObj = getBrushObj(chart, config.xLabels, config.legendLabels, batch, config.type, config.yLegendLabels, config.yLabels, config.series, config.pictorial, config.chartScope);

            if (Object.values(brushObj.data)[0].length > 0) {
                mouseUp = true;
                batch = null;
                waitForBrushRefresh = true;

                // Remove Context Menu and Brush listeners
                chart._dom.removeEventListener('mouseup', onBrush, true); // TODO is this necessary?
                chart._dom.removeEventListener('mousemove', resetBrushTimer);

                headers = Object.keys(brushObj.data);
                values = Object.values(brushObj.data);

                // Define & Show Context Menu
                config.setContextMenuDataFromBrush(headers, values);
                config.openContextMenu(e);

                // Freeze brush without triggering anything
                chart.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'mouseup'
                });
            }
        }

        /**
         * @name onBrush
         * @desc function called to execute brush pixel
         * @param {object} e - mouse up event
         * @returns {void}
         */
        function onBrush(e) {
            var brushObj;

            // Remove Context Menu Timer and Listener
            clearTimeout(brushTimer);
            chart._dom.removeEventListener('mousemove', resetBrushTimer);

            if (e) {
                e.stopPropagation();
            }
            brushObj = getBrushObj(chart, config.xLabels, config.legendLabels, batch, config.type, config.yLegendLabels, config.yLabels, config.series, config.pictorial, config.chartScope);
            batch = null;
            mouseUp = false;

            chart._dom.removeEventListener('mouseup', onBrush, true);

            // echarts is calling the startBrush function again... flag to prevent it
            waitForBrushRefresh = true;

            config.brushCb(brushObj, function (brushData) {
                clearBrush(config.repaint, brushData);
            });
        }
    }

    /**
     * @name clearBrush
     * @param {fn} repaint - chart paint function
     * @param {object} brushData - what got brushed
     * @desc repaints chart if no data painted. Until echarts provides a way to clear the brush programatically
     *       we have to do a repaint. This at least bypasses doing a full flux cycle, but its not ideal
     * @return {void}
     */
    function clearBrush(repaint, brushData) {
        var dim, noData = true;
        for (dim in brushData) {
            if (brushData[dim].length > 0) {
                noData = false;
            }
        }

        if (noData) {
            repaint();
        }
    }

    /**
     * @name getBrushObj
     * @desc called on echarts brush mouseup, makes the pixel for the selected brushed data
     * @param {object} chart - echarts instance
     * @param {object} xLabels - x values... specific to certain echarts viz's... TODO refactor
     * @param {object} legendLabels -x values
     * @param {object} batch - brushed values
     * @param {string} type - type of echarts visual
     * @param {object} yLegendLabels - y values...
     * @param {object} yLabels - y Labels
     * @param {object} series - series when applicable
     * @param {string} symbol - selected symbol for pictorialBar
     * @param {object} chartScope - selected scope (Only being passed from the BarEchart for now)
     * @returns {void}
     */
    function getBrushObj(chart, xLabels, legendLabels, batch, type, yLegendLabels, yLabels, series, symbol, chartScope) {
        var brushedValues,
            brushedIndecies,
            brushObj = {},
            tempType = type;

        if (symbol) {
            tempType = 'pictorialBar';
        }

        if (specificBrush.hasOwnProperty(tempType)) {
            return specificBrush[tempType](chart, xLabels, legendLabels, batch, yLegendLabels, yLabels, series, chartScope);
        }
        // error handling
        if (batch && batch[0] && batch[0].selected) {
            brushedIndecies = getBrushedIndecies(batch[0].selected);
            brushedValues = brushedIndecies.map(function (index) {
                if (index < xLabels.length || index >= 0) {
                    return xLabels[index];
                }
                return 0;
            });
            brushObj.data = {};
            brushObj.data[legendLabels] = brushedValues;
            // execute pixel with brushed values
        }
        return brushObj;
    }

    function getScatterBrush(chart, xLabels, legendLabels, batch) {
        var brushedValues = [],
            brushObj = {},
            i;

        if (batch && batch[0] && batch[0].selected) {
            for (i = 0; i < batch[0].selected.length; i++) {
                brushedValues.push.apply(brushedValues, batch[0].selected[i].dataIndex.map(getXLabels.bind(null, i)));
            }
            brushObj.data = {};
            brushObj.data[legendLabels] = brushedValues;
            // execute pixel with brushed values
        }
        return brushObj;

        function getXLabels(selectedIndex, index) {
            if (Array.isArray(xLabels[selectedIndex])) {
                if (index < xLabels[selectedIndex].length || index >= 0) {
                    return xLabels[selectedIndex][index];
                }
                return 0;
            }
            if (index < xLabels.length || index >= 0) {
                return xLabels[index];
            }
            return 0;
        }
    }

    function getBarBrush(chart, xLabels, legendLabels, batch, yLegendLabels, yLabels, series, chartScope) {
        var brushedValues = [],
            toggleEventAxis = chartScope.widgetCtrl.getWidget('view.visualization.tools.shared.toggleEventAxis'),
            brushObj = {},
            i;

        if (batch && batch[0] && batch[0].selected) {
            if (toggleEventAxis) {
                brushObj.data = {};
                for (i = 0; i < batch[0].selected.length; i++) {
                    brushedValues.push.apply(brushedValues, batch[0].selected[i].dataIndex.map(getYLabels.bind(null, i)));
                    brushObj.data[batch[0].selected[i].seriesName] = brushedValues;
                    brushedValues = [];
                }

                // execute pixel with brushed values
            } else {
                for (i = 0; i < batch[0].selected.length; i++) {
                    brushedValues.push.apply(brushedValues, batch[0].selected[i].dataIndex.map(getXLabels.bind(null, i)));
                }
                brushObj.data = {};
                brushObj.data[legendLabels] = brushedValues;
                // execute pixel with brushed values
            }
        }
        return brushObj;

        function getYLabels(selectedIndex, index) {
            if (Array.isArray(yLabels[selectedIndex])) {
                if (index < yLabels[selectedIndex].data.length || index >= 0) {
                    return yLabels[selectedIndex].data[index].value;
                }
                return 0;
            }
            if (index < yLabels[selectedIndex].data.length || index >= 0) {
                return yLabels[selectedIndex].data[index].value;
            }
            return 0;
        }

        function getXLabels(selectedIndex, index) {
            if (Array.isArray(xLabels[selectedIndex])) {
                if (index < xLabels[selectedIndex].length || index >= 0) {
                    return xLabels[selectedIndex][index];
                }
                return 0;
            }
            if (index < xLabels.length || index >= 0) {
                return xLabels[index];
            }
            return 0;
        }
    }

    function getLineBrush(chart, xLabels, legendLabels, batch) {
        var brushedValues = [],
            brushObj = {},
            dataPoints = chart._chartsMap,
            dataPointSeries,
            brushVizRange,
            xCoord, yCoord,
            xCoordPos, yCoordPos,
            pointsBrushed = [],
            pointsBrushedIdx,
            xList = [],
            flipped = chart.flipped;

        if (flipped) {
            xCoordPos = 1;
            yCoordPos = 0;
        } else {
            xCoordPos = 0;
            yCoordPos = 1;
        }

        if (batch && batch[0] && batch[0].areas[0]) {
            brushVizRange = batch[0].areas[0].range;
            // go through all of the points series by series
            for (dataPointSeries in dataPoints) {
                if (dataPoints.hasOwnProperty(dataPointSeries)) {
                    let seriesLength = dataPoints[dataPointSeries]._points.length,
                        xCoordIndex = xCoordPos,
                        yCoordIndex = yCoordPos;
                    while (xCoordIndex < seriesLength && yCoordIndex < seriesLength) {
                        xCoord = dataPoints[dataPointSeries]._points[xCoordIndex];
                        yCoord = dataPoints[dataPointSeries]._points[yCoordIndex];

                        if (xList.indexOf(xCoord) === -1) {
                            xList.push(xCoord);
                        }

                        if (xCoord > brushVizRange[xCoordPos][0] && xCoord < brushVizRange[xCoordPos][1] && yCoord > brushVizRange[yCoordPos][0] && yCoord < brushVizRange[yCoordPos][1]) {
                            if (pointsBrushed.indexOf(xCoord) === -1) {
                                pointsBrushed.push(xCoord);
                            }
                        }
                        xCoordIndex += 2;
                        yCoordIndex += 2;
                    }
                }
            }

            // this xList is basically the index of all of the x axis labels
            // we will sort it so we know how to map the x coords to the actual label values
            // xList.sort(function (a, b) {
            //     return a - b;
            // });

            // figure out where these x coordinates are located and map them to their actual value to be pushed into brushedValues
            for (pointsBrushedIdx = 0; pointsBrushedIdx < pointsBrushed.length; pointsBrushedIdx++) {
                brushedValues.push(xLabels[xList.indexOf(pointsBrushed[pointsBrushedIdx])]);
            }

            brushObj.data = {};
            brushObj.data[legendLabels] = brushedValues;
        }
        return brushObj;
    }

    function getPictorialBarBrush(chart, xLabels, legendLabels, batch) {
        var brushedValues = [],
            brushObj = {},
            dataPoints = chart._chartsMap,
            dataPointSeries,
            brushVizRange,
            dataPointIdx,
            xCoordMiddle,
            yCoordMax, yCoordMin,
            xCoordPos, yCoordPos,
            xRange, yRange,
            pointsBrushed = [],
            pointsBrushedIdx,
            xList = [],
            flipped = chart.flipped;

        if (flipped) {
            xCoordPos = 1;
            yCoordPos = 0;
        } else {
            xCoordPos = 0;
            yCoordPos = 1;
        }

        if (batch && batch[0] && batch[0].areas[0]) {
            brushVizRange = batch[0].areas[0].range;
            // go through all of the points series by series
            for (dataPointSeries in dataPoints) {
                if (dataPoints.hasOwnProperty(dataPointSeries)) {
                    for (dataPointIdx = 0; dataPointIdx < dataPoints[dataPointSeries]._data._itemLayouts.length; dataPointIdx++) {
                        xRange = false;
                        yRange = false;

                        if (flipped) {
                            xCoordMiddle = dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].y + (dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].height / 2);
                            yCoordMax = dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].x + dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].width;
                            yCoordMin = dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].x;
                        } else {
                            xCoordMiddle = dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].x + (dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].width / 2);
                            yCoordMax = dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].y;
                            yCoordMin = dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].y + dataPoints[dataPointSeries]._data._itemLayouts[dataPointIdx].height;
                        }

                        if (xList.indexOf(xCoordMiddle) === -1) {
                            xList.push(xCoordMiddle);
                        }

                        if (xCoordMiddle > brushVizRange[xCoordPos][0] && xCoordMiddle < brushVizRange[xCoordPos][1]) {
                            xRange = true;
                        }

                        if ((brushVizRange[yCoordPos][0] > yCoordMin && brushVizRange[yCoordPos][0] < yCoordMax) || (brushVizRange[yCoordPos][1] > yCoordMin && brushVizRange[yCoordPos][1] < yCoordMax)) {
                            yRange = true;
                        }

                        if (xRange && yRange) {
                            if (pointsBrushed.indexOf(xCoordMiddle) === -1) {
                                pointsBrushed.push(xCoordMiddle);
                            }
                        }
                    }
                }
            }

            // this xList is basically the index of all of the x axis labels
            // we will sort it so we know how to map the x coords to the actual label values
            xList.sort(function (a, b) {
                return a - b;
            });

            if (flipped) {
                xList = xList.reverse();
            }

            // figure out where these x coordinates are located and map them to their actual value to be pushed into brushedValues
            for (pointsBrushedIdx = 0; pointsBrushedIdx < pointsBrushed.length; pointsBrushedIdx++) {
                brushedValues.push(xLabels[xList.indexOf(pointsBrushed[pointsBrushedIdx])]);
            }

            brushObj.data = {};
            brushObj.data[legendLabels] = brushedValues;
        }
        return brushObj;
    }

    function getFlippedSeriesBar(chart, xLabels, legendLabels, batch) {
        var brushObj = {
                data: {}
            },
            i;

        brushObj.data[legendLabels] = [];

        for (i = 0; i < batch[0].selected.length; i++) {
            if (batch[0].selected[i].dataIndex.length > 0) {
                brushObj.data[legendLabels].push(batch[0].selected[i].seriesName);
            }
        }

        return brushObj;
    }

    function getFlippedSeriesLine(chart, xLabels, legendLabels, batch) {
        var brushObj = {},
            dataPoints = chart._chartsMap,
            dataPointSeries,
            brushVizRange,
            dataPointIdx,
            xCoord, yCoord,
            xCoordPos, yCoordPos,
            xList = [],
            flipped = chart.flipped;

        if (flipped) {
            xCoordPos = 1;
            yCoordPos = 0;
        } else {
            xCoordPos = 0;
            yCoordPos = 1;
        }

        brushObj.data = {};
        brushObj.data[legendLabels] = [];

        if (batch && batch[0] && batch[0].areas[0]) {
            brushVizRange = batch[0].areas[0].range;
            // go through all of the points series by series
            for (dataPointSeries in dataPoints) {
                if (dataPoints.hasOwnProperty(dataPointSeries)) {
                    for (dataPointIdx = 0; dataPointIdx < dataPoints[dataPointSeries]._points.length; dataPointIdx++) {
                        xCoord = dataPoints[dataPointSeries]._points[dataPointIdx][xCoordPos];
                        yCoord = dataPoints[dataPointSeries]._points[dataPointIdx][yCoordPos];

                        if (xList.indexOf(xCoord) === -1) {
                            xList.push(xCoord);
                        }

                        if (xCoord > brushVizRange[xCoordPos][0] && xCoord < brushVizRange[xCoordPos][1] && yCoord > brushVizRange[yCoordPos][0] && yCoord < brushVizRange[yCoordPos][1]) {
                            brushObj.data[legendLabels].push(dataPoints[dataPointSeries].__model.name);
                            break;
                        }
                    }
                }
            }
        }

        return brushObj;
    }

    /**
     * @name getBoxBrush
     * @param {object} chart - echarts instance
     * @param {object} xLabels - x values... specific to certain echarts viz's... TODO refactor
     * @param {object} legendLabels -x values
     * @param {object} batch - brushed values
     * @desc determines which boxes have been brushed. uses the echarts brush indices range
     *       to get an approximation of what was brushed, then actually checks which boxes overlap with
     *       the brush
     * @return {object} object containing the data of what to filter based on the brushed area
     */
    function getBoxBrush(chart, xLabels, legendLabels, batch) {
        var brushObj = {},
            brushedValues = [],
            indiceRange = batch[0].areas[0].coordRange[0], // indices of boxes brushed
            coordRange = batch[0].areas[0].range, // [[x1, x2], [y1, y2]]
            whiskerCoords,
            i;
        brushObj.data = {};

        for (i = indiceRange[0]; i <= indiceRange[1]; i++) {
            if (chart._chartsViews[0]._data._itemLayouts[i]) {
                whiskerCoords = chart._chartsViews[0]._data._itemLayouts[i].ends;
            } else {
                // sometimes an itemlayout is unavailable based on other artifacts on the chart
                // (note: we are only counting whiskers and boxes as a brush, not outliers)
                // and when it happens brushing still works
                // so for now lets just keep going thru the loop so we don't throw an error
                continue;
            }

            if (boxOverlapsWithBrush(whiskerCoords, coordRange)) {
                brushedValues.push(xLabels[i]);
            }
        }
        brushObj.data[legendLabels] = brushedValues;

        return brushObj;
    }

    /**
     * @name boxOverLapsWithBrush
     * @param {object} whiskerCoords - coordinates used to paint the whiskers
     * @param {array} coordRange - brushed coordinates, looks like-> [[x1, x2], [y1, y2]]
     * @desc determines if brush and box/whiskers overlap.
     * @return {boolean} true if the box and brush overlap false otherwise
     */
    function boxOverlapsWithBrush(whiskerCoords, coordRange) {
        var minX, maxX, minY, maxY;
        // get smallest and largest x and y coords
        whiskerCoords.forEach(function (coord) {
            if (!minX && minX !== 0) {
                minX = coord[0][0];
                maxX = coord[0][0];
                minY = coord[1][1];
                maxY = coord[1][1];
            }
            if (coord[0][0] < minX) {
                minX = coord[0][0];
            }
            if (coord[1][0] < minX) {
                minX = coord[1][0];
            }
            if (coord[0][0] > maxX) {
                maxX = coord[0][0];
            }
            if (coord[1][0] > maxX) {
                maxX = coord[1][0];
            }
            if (coord[0][1] < minY) {
                minY = coord[0][1];
            }
            if (coord[1][1] < minY) {
                minY = coord[1][1];
            }
            if (coord[0][1] > maxY) {
                maxY = coord[0][1];
            }
            if (coord[1][1] > maxY) {
                maxY = coord[1][1];
            }
        });

        // easier to check for no overlap
        if (coordRange[0][0] > maxX || coordRange[0][1] < minX) {
            return false;
        } else if (coordRange[1][1] < minY || coordRange[1][0] > maxY) {
            return false;
        }

        return true;
    }

    function getHeatmapBrush(chart, xLabels, legendLabels, batch, yLegendLabels, yLabels) {
        var brushedxValues,
            brushedyValues,
            brushedxIndecies = [],
            brushedyIndecies = [],
            brushObj = {},
            range,
            brushType,
            commonArr = [],
            i, j;

        if (batch && batch[0] && batch[0].areas[0]) {
            brushType = batch[0].areas[0].brushType;
            if (brushType === 'rect') {
                range = batch[0].areas[0].coordRange[0];
                while (range[0] <= range[1]) {
                    brushedxIndecies.push(range[0]);
                    range[0]++;
                }

                range = batch[0].areas[0].coordRange[1];
                while (range[0] <= range[1]) {
                    brushedyIndecies.push(range[0]);
                    range[0]++;
                }
            } else if (brushType === 'polygon') {
                // TODO polygon
            }

            brushedxValues = brushedxIndecies.map(function (index) {
                if (index < xLabels.length || index >= 0) {
                    return xLabels[index];
                }
                return 0;
            });

            brushedyValues = brushedyIndecies.map(function (index) {
                if (index < yLabels.length || index >= 0) {
                    return yLabels[index];
                }
                return 0;
            });
            brushObj.data = {};
            brushObj.data[legendLabels] = brushedxValues;
            brushObj.data[yLegendLabels] = brushedyValues;

            // Check if x-axis and y-axis dimension is the same
            // If so, we only want to take the common brushed element
            if (legendLabels === yLegendLabels) {
                for (i = 0; i < brushedxValues.length; i++) {
                    for (j = 0; j < brushedyValues.length; j++) {
                        if (brushedxValues[i] === brushedyValues[j]) {
                            commonArr.push(brushedxValues[i]);
                        }
                    }
                }
                brushObj.data[legendLabels] = commonArr;
                brushObj.data[yLegendLabels] = commonArr;
            }

            // execute pixel with brushed values
        }
        return brushObj;
    }

    function getSingleAxisBrush(chart, xLabels, legendLabels, batch, yLegendLabels, yLabels, series) {
        var brushedValues = [],
            brushObj = {},
            selectedIdxArray,
            i, j;
        if (batch && batch[0] && batch[0].selected) {
            for (i = 0; i < batch[0].selected.length; i++) {
                if (batch[0].selected[i].dataIndex.length > 0) {
                    for (j = 0; j < batch[0].selected[i].dataIndex.length; j++) {
                        selectedIdxArray = batch[0].selected[i].dataIndex;
                        brushedValues.push(series[i].data[selectedIdxArray[j]].value[2][legendLabels]);
                    }
                }
            }
            brushObj.data = {};
            brushObj.data[legendLabels] = brushedValues;
            // execute pixel with brushed values
        }
        return brushObj;
    }

    /**
     * @name getBrushedIndecies
     * @desc returns the brushed indecies for the echarts selection
     * @param {array} selected - current array of echarts data
     * @returns {array} array of indecies
     */
    function getBrushedIndecies(selected) {
        return selected
            // reduce to get only indecies
            .reduce(getIndexData, [])
            // filter to be only unique values
            .filter(onlyUnique);
    }

    /**
     * @name getIndexData
     * @desc continues to build the sumArray of dataIndex selections
     * @param {array} sumArray - current array of data indecies
     * @param {array} selection - current selection to iterate over
     * @returns {array} total array of indecies
     */
    function getIndexData(sumArray, selection) {
        if (Array.isArray(selection.dataIndex)) {
            sumArray.push.apply(sumArray, selection.dataIndex);
        }
        return sumArray;
    }

    /**
     * @name onlyUnique
     * @desc returns whether the value is in the self array
     * @param {string} value - value added to array
     * @param {number} index - current iteration index of self
     * @param {array} self - current array of unique values
     * @returns {boolean} - whether the value is already added to self or not
     */
    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    /**
     * @name converToColorArray
     * @param {object} obj uiOptions.color mapping that SEMOSS generates
     * @return {array} Array containing the colors that will be used to paint our viz
     * @desc Converts the color mapping object that SEMOSS generates
     *       into an array of hex colors. This is necessary because
     *       echarts reads in colors as Arrays only, so if a user wants
     *       to update the colors of their viz we have to pass them
     *       in as an Array
     */
    function convertToColorArray(obj) {
        var colorArray = [],
            i;

        if (typeof obj !== Array) {
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    colorArray.push(obj[i]);
                }
            }
        }

        return colorArray;
    }

    /**
     * @name getvizcomments
     * @param {string} type - Layout type according to jv
     * @param {Object} comments - Object of comments for this viz
     * @return {Object} - Comments that correspond to this viz type
     * @desc Takes in the current viz type and Object of comments and returns the
     *       comments that correspond to the viz type in an Object.
     */
    function getVizComments(type, comments) {
        var comment,
            vizType = adjustLayout(type);

        // Go through all comments and only add in the ones for the right viz type
        for (comment in comments) {
            // TODO why are we checking for vizType in echarts but not in svg...?
            if (comments.hasOwnProperty(comment)) {
                if (comments[comment].vizType === vizType ||
                    comments[comment].alwaysDisplay === true) {
                    comments[comment].display = true;
                } else {
                    comments[comment].display = false;
                }
            }
        }

        return comments;
    }

    /**
     * @name adjustLayout
     * @param {string} layout - The JV Layout given to the viz
     * @return {string} - The echarts equivalent layout name
     * @desc Takes in a string which corresponds to the layout type given to the viz by
     *       jvComment and returns the approrpriate layout type according to eCharts.
     */
    function adjustLayout(layout) {
        // Specific cases
        if (layout === 'Column') {
            return 'BAR';
        } else if (layout === 'SingleAxisCluster') {
            return 'SINGLE';
        } else if (layout === 'ParallelCoordinates') {
            return 'PARALLEL';
        }

        // All other cases just need to be all caps
        return layout.toUpperCase();
    }

    /**
     * @name setOption
     * @param {*} chart the echart chart option
     * @param {*} option the option to set
     * @desc set the options for the specific chart
     * @returns {void}
     */
    function setOption(chart, option) {
        chart.setOption(option);
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
            facetLayout,
            titleFontSize,
            labelType,
            hasCustomTooltip = false;

        if (eChartsConfig.options.facetHeaders && eChartsConfig.options.facetHeaders.titleFontSize) {
            titleFontSize = eChartsConfig.options.facetHeaders.titleFontSize;
        } else {
            titleFontSize = 18;
        }

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
                            setTooltipContent(chart, uiOptions, chartScope, $compile);
                            chartScope.$apply();
                        }
                    });
                });
            } else {
                chart.on('showTip', function () {
                    setTooltipContent(chart, uiOptions, chartScope, $compile);
                    chartScope.$apply();
                });
            }
        }

        // get label dimension format rules
        for (let dim in eChartsConfig.dataTypes) {
            if (eChartsConfig.dataTypes.hasOwnProperty(dim) && eChartsConfig.dataTypes[dim][0].model === 'label') {
                labelType = eChartsConfig.dataTypes[dim][0];
            }
        }

        option.tooltip = {
            show: eChartsConfig.options.showTooltips,
            // make it not enterable by default because it affects brushing when you quickly brush & enter a tooltip
            enterable: hasCustomTooltip,
            formatter: function (info) {
                var returnArray = ['<div>'],
                    tooltipName = uiOptions.toggleEventAxis ? info.name : info[0].name,
                    formatType,
                    tooltipType,
                    trendlineString,
                    formatName,
                    j;

                if (tooltipName) {
                    let xAxisSettings = eChartsConfig.options.editXAxis ? eChartsConfig.options.editXAxis.format : false;
                    if (!eChartsConfig.options.seriesFlipped) {
                        returnArray.push('<b>' + formatLabel(tooltipName, xAxisSettings, labelType) + '</b>' + '<br>');
                    } else {
                        returnArray.push('<b>' + formatLabel(tooltipName, xAxisSettings, false) + '</b>' + '<br>');
                    }
                }
                if (uiOptions.toggleEventAxis) {
                    if (info.marker) {
                        returnArray.push(info.marker);
                    }
                    if (eChartsConfig.options.seriesFlipped && info.name) {
                        if (eChartsConfig.dataTypes.hasOwnProperty(info.name)) {
                            formatType = eChartsConfig.dataTypes[info.name][0];
                        }
                        returnArray.push('' + visualizationUniversal.formatValue(info.seriesName, labelType) + ': ' + visualizationUniversal.formatValue(info.value, formatType) + '<br>');
                        // reset formatType for layered visuals
                        formatType = '';
                    } else if (info.seriesName) {
                        formatName = info.seriesName;
                        trendlineString = info.seriesName.substring(0, 10);
                        if (trendlineString === 'Trendline:') {
                            formatName = formatName.slice(11, info.seriesName.length);
                        }
                        if (eChartsConfig.dataTypes.hasOwnProperty(formatName)) {
                            formatType = eChartsConfig.dataTypes[formatName][0];
                        }
                        returnArray.push('' + cleanValue(info.seriesName) + ': ' + visualizationUniversal.formatValue(info.value, formatType) + '<br>');
                        // reset formatType for layered visuals
                        formatType = '';
                    }

                    if (info.data.tooltip) {
                        for (j = 0; j < info.data.tooltip.length; j++) {
                            tooltipType = eChartsConfig.dataTypes[info.data.tooltip[j].header][0];
                            if (eChartsConfig.legendHeaders.indexOf(info.data.tooltip[j].header) === -1) {
                                returnArray.push('' + cleanValue(info.data.tooltip[j].header) + ': ' + visualizationUniversal.formatValue(info.data.tooltip[j].value || 0, tooltipType) + '<br>');
                                tooltipType = '';
                            }
                        }
                    }
                } else {
                    for (j = 0; j < info.length; j++) {
                        if (info[j].marker) {
                            returnArray.push(info[j].marker);
                        }
                        if (eChartsConfig.options.seriesFlipped && info[j].name) {
                            if (eChartsConfig.dataTypes.hasOwnProperty(info[j].name)) {
                                formatType = eChartsConfig.dataTypes[info[j].name][0];
                            }
                            returnArray.push('' + visualizationUniversal.formatValue(info[j].seriesName, labelType) + ': ' + visualizationUniversal.formatValue(info[j].value, formatType) + '<br>');
                            // reset formatType for layered visuals
                            formatType = '';
                        } else if (info[j].seriesName) {
                            formatName = info[j].seriesName;
                            trendlineString = info[j].seriesName.substring(0, 10);
                            if (trendlineString === 'Trendline:') {
                                formatName = formatName.slice(11, info[j].seriesName.length);
                            }
                            if (eChartsConfig.dataTypes.hasOwnProperty(formatName)) {
                                formatType = eChartsConfig.dataTypes[formatName][0];
                            }
                            returnArray.push('' + cleanValue(info[j].seriesName) + ': ' + visualizationUniversal.formatValue(info[j].value, formatType) + '<br>');
                            // reset formatType for layered visuals
                            formatType = '';
                        }
                    }

                    if (info[0].data.tooltip) {
                        for (j = 0; j < info[0].data.tooltip.length; j++) {
                            tooltipType = eChartsConfig.dataTypes[info[0].data.tooltip[j].header][0];
                            if (eChartsConfig.legendHeaders.indexOf(info[0].data.tooltip[j].header) === -1) {
                                returnArray.push('' + cleanValue(info[0].data.tooltip[j].header) + ': ' + visualizationUniversal.formatValue(info[0].data.tooltip[j].value || 0, tooltipType) + '<br>');
                                tooltipType = '';
                            }
                        }
                    }
                }

                if (uiOptions && uiOptions.customTooltip.show) {
                    visualizationUniversal.setTooltipModel(chartScope, 'tooltip', getModelList(info, eChartsConfig.allKeys));
                }

                returnArray.push('</div>');

                return returnArray.join('');
            },
            trigger: uiOptions.toggleEventAxis ? 'item' : 'axis',
            axisPointer: {
                type: eChartsConfig.axisPointer, // line, shaddow, cross,
                lineStyle: {
                    color: uiOptions.axis.pointer.lineStyle.lineColor || '#000000',
                    width: parseFloat(uiOptions.axis.pointer.lineStyle.lineWidth) || 2,
                    type: uiOptions.axis.pointer.lineStyle.lineType || 'dashed',
                    opacity: uiOptions.axis.pointer.lineStyle.opacity || 0.1
                },
                shadowStyle: {
                    color: uiOptions.axis.pointer.shadowStyle.backgroundColor || '#000000',
                    opacity: uiOptions.axis.pointer.shadowStyle.opacity || 0.05
                },
                crossStyle: {
                    color: uiOptions.axis.pointer.lineStyle.lineColor || '#000000',
                    width: parseFloat(uiOptions.axis.pointer.lineStyle.lineWidth) || 2,
                    type: uiOptions.axis.pointer.lineStyle.lineType || 'dashed',
                    opacity: uiOptions.axis.pointer.lineStyle.opacity || 0.1
                },
                label: {
                    backgroundColor: uiOptions.tooltip.backgroundColor || 'auto',
                    color: uiOptions.tooltip.fontColor || '#000000',
                    fontFamily: uiOptions.tooltip.fontFamily || 'Inter',
                    fontSize: parseFloat(uiOptions.tooltip.fontSize) || 12,
                    shadowBlur: 5,
                    shadowColor: 'rgba(0,0,0,0.2)',
                    shadowOffsetX: 0,
                    shadowOffsetY: 2
                }
            },
            backgroundColor: uiOptions.tooltip.backgroundColor || '#FFFFFF',
            borderWidth: parseFloat(uiOptions.tooltip.borderWidth) || 0,
            borderColor: uiOptions.tooltip.borderColor || '',
            textStyle: {
                color: uiOptions.tooltip.fontColor || '#000000',
                fontFamily: uiOptions.tooltip.fontFamily || 'Inter',
                fontSize: parseFloat(uiOptions.tooltip.fontSize) || 12
            },
            confine: true
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
            // When legendTop === top pass charttitle font size(Numeric) else pass legendTop (String)  i.e. 'top'
            top: eChartsConfig.legendTop === 'top' ||  eChartsConfig.legendTop === undefined  ? (eChartsConfig.title && eChartsConfig.title.show ? eChartsConfig.title.fontSize : 0 ) : eChartsConfig.legendTop,
            pageButtonPosition: 'end',
            formatter: function (value) {
                return cleanValue(value);
            },
            textStyle: eChartsConfig.legendLabelStyle
        };

        // Options specific to Facet All Instances
        if (eChartsConfig.groupByInfo && eChartsConfig.groupByInfo.viewType === 'All Instances') {
            facetLayout = customizeFacetLayout(eChartsConfig);

            option.grid = facetLayout.grid;
            option.title = facetLayout.title.concat([{
                text: eChartsConfig.options.facetHeaders.titleName || 'All Instances of ' + cleanValue(eChartsConfig.groupByInfo.selectedDim),
                top: '20px',
                left: 'center',
                textStyle: {
                    fontSize: titleFontSize
                }
            }]);
            option.xAxis = facetLayout.xAxis;
            option.yAxis = facetLayout.yAxis;
            option.series = facetLayout.series;

            // bar specific
            option.barWidth = null;
        } else {
            option.xAxis = eChartsConfig.xAxisConfig;
            option.yAxis = eChartsConfig.yAxisConfig;
            option.series = eChartsConfig.data;
            option.grid = setGrid(eChartsConfig.groupByInfo, eChartsConfig.options);
            // bar specific
            option.barWidth = eChartsConfig.barWidth;
        }

        option.dataZoom = toggleZoom(eChartsConfig.groupByInfo, eChartsConfig.options.toggleZoomX, eChartsConfig.options.toggleZoomY, eChartsConfig.options.dataZoomXstart, eChartsConfig.options.dataZoomXend, eChartsConfig.options.dataZoomYstart, eChartsConfig.options.dataZoomYend, eChartsConfig.options.dataZoom, eChartsConfig.options.saveDataZoom);

    
        option.textStyle = {
            fontFamily: 'Inter'
        };

        return option;
    }

    /**
     * @name getModelList
     * @param {*} params the echarts tooltip parameters
     * @param {*} keys all of the columns for this viz
     * @desc loop through params and create the model list [{name: '', value: ''}]
     * @returns {array} the model list array
     */
    function getModelList(params, keys) {
        let modelList = [];

        // process bar/line/area
        // other types might have different structure to parse through
        if (params[0].seriesType === 'bar' || params[0].seriesType === 'line' || params[0].seriesType === 'area') {
            // first lets set the x axis from keys because it's not predictable in params
            for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
                if (keys[keyIdx].model === 'label') {
                    modelList.push({
                        name: keys[keyIdx].alias,
                        value: params[0].axisValue
                    });
                    break;
                }
            }

            // now lets loop through the series array to get the values
            for (let seriesIdx = 0; seriesIdx < params.length; seriesIdx++) {
                modelList.push({
                    name: params[seriesIdx].seriesName,
                    value: params[seriesIdx].value
                });

                // check to see if there are any tooltip dimensions, if so add them to scope as well
                if (params[seriesIdx].data.tooltip) {
                    for (let tooltipIdx = 0; tooltipIdx < params[seriesIdx].data.tooltip.length; tooltipIdx++) {
                        modelList.push({
                            name: params[seriesIdx].data.tooltip[tooltipIdx].header,
                            value: params[seriesIdx].data.tooltip[tooltipIdx].value
                        });
                    }
                }
            }
        }

        // TODO build out processing for other seriesTypes

        return modelList;
    }

    /**
     * @name toggleZoom
     * @desc toggles Data Zoom feature
     * @param {object} groupByInfo specifically for facet...
     * @param {bool} showX - boolean to show x zoom or not
     * @param {bool} showY - boolean to show y zoom or not
     * @param {number} xStart - start value for x
     * @param {number} xEnd - end value for x
     * @param {number} yStart - start value for y
     * @param {number} yEnd - end value for y
     * @param {object} style - style options
     * @returns {Array} - array of objects defining Data Zoom settings
     */
    function toggleZoom(groupByInfo, showX, showY, xStart, xEnd, yStart, yEnd, style, saveDataZoom) {
        var dataZoom = [],
            xSlider,
            xInside,
            ySlider,
            i,
            xAxisIndex,
            yAxisIndex,
            bottom = 20,
            yInside,
            zoomStyle = {
                backgroundColor: style.backgroundColor || 'transparent',
                fillerColor: style.fillerColor || 'transparent',
                borderColor: style.borderColor || '#CCCCCC',
                dataBackground: {
                    lineStyle: {
                        color: style.dataBackground.lineStyle.lineColor || 'rgba(64, 160, 255, .25)',
                        width: parseFloat(style.dataBackground.lineStyle.lineWidth || 1),
                        lineStyle: style.dataBackground.lineStyle.lineStyle || 'solid'
                    },
                    areaStyle: {
                        color: style.dataBackground.areaStyle.backgroundColor || 'rgba(64, 160, 255, .1)',
                        opacity: style.dataBackground.areaStyle.opacity || 1
                    }
                },
                selectedDataBackground: {
                    lineStyle: {
                        color: style.selectedDataBackground.lineStyle.lineColor || 'rgba(64, 160, 255, 1)',
                        width: parseFloat(style.selectedDataBackground.lineStyle.lineWidth) || 1,
                        lineStyle: style.selectedDataBackground.lineStyle.lineStyle || 'solid'
                    },
                    areaStyle: {
                        color: style.selectedDataBackground.areaStyle.backgroundColor || 'rgba(64, 160, 255, .5)',
                        opacity: style.selectedDataBackground.areaStyle.opacity || 1
                    }
                },
                handleStyle: {
                    color: style.handle.backgroundColor || '#FFFFFF',
                    borderWidth: parseFloat(style.handle.borderWidth) || 1,
                    borderStyle: style.handle.borderStyle || 'solid',
                    borderColor: style.handle.borderColor || '#CCCCCC'
                },
                moveHandleStyle: {
                    color: style.moveHandle.backgroundColor || '#FFFFFF',
                    borderWidth: parseFloat(style.moveHandle.borderWidth) || 1,
                    borderStyle: style.moveHandle.borderStyle || 'solid',
                    borderColor: style.moveHandle.borderColor || '#CCCCCC'
                },
                emphasis: {
                    moveHandleStyle: {
                        color: style.selectedDataBackground.lineStyle.lineColor || 'rgba(64, 160, 255, 1)'
                    },
                    handleStyle: {
                        borderColor: style.selectedDataBackground.lineStyle.lineColor || 'rgba(64, 160, 255, 1)'
                    }
                }
            };

        if (groupByInfo && groupByInfo.viewType === 'All Instances') {
            xAxisIndex = [];
            yAxisIndex = [];
            for (i = 0; i < groupByInfo.uniqueInstances.length; i++) {
                xAxisIndex.push(i);
                yAxisIndex.push(i);
            }
        } else {
            xAxisIndex = 0;
            yAxisIndex = 0;
        }

        if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
            bottom += 40;
        }

        if (showX) {
            xSlider = Object.assign({
                type: 'slider',
                show: true,
                // xAxisIndex: 0,
                xAxisIndex: xAxisIndex,
                bottom: bottom + 'px',
                filterMode: 'empty',
                showDetail: false,
                // CustomStyle
                start: xStart || 0,
                end: xEnd || 100,
                height: 20,
                z: 1
            }, zoomStyle);
            xInside = {
                type: 'inside',
                xAxisIndex: xAxisIndex,
                filterMode: 'empty'
            };
            dataZoom.push(xSlider, xInside);
        }
        if (showY) {
            ySlider = Object.assign({
                type: 'slider',
                show: true,
                yAxisIndex: yAxisIndex,
                right: '20px',
                filterMode: 'empty',
                showDetail: false,
                start: yStart || 0,
                end: yEnd || 100,
                width: 20,
                z: 1
            }, zoomStyle);
            yInside = {
                type: 'inside',
                yAxisIndex: yAxisIndex,
                filterMode: 'empty'
            };
            dataZoom.push(ySlider, yInside);
        }
        //painting set datazoom
        const  {startX, startY, endX, endY} = saveDataZoom;
        if ((startX > 0 && showX) || (startY > 0 && showY)) {
            paintSavedDataZoom(dataZoom, startX, startY, endX, endY, showX, showY) 
        }
        return dataZoom;
    }

    /**
     * @name setGrid
     * @desc sets grid dimensions based on whether or not datazoom is present
     * @param {object} groupByInfo - object used for facet
     * @param {*} options the options for the chart
     * @returns {obj} - object of grid dimensions
     */
    function setGrid(groupByInfo, options) {
        var grid = {
                top: 60,
                right: 45,
                bottom: 45,
                left: 40,
                containLabel: true
            },
            longest = 0,
            name = '',
            showX = options.toggleZoomX,
            showY = options.toggleZoomY,
            showAvg = options.toggleAverage,
            showTarget = options.markLine,
            flipAxis = options.rotateAxis;

        // push the chart down to allow space for title
        if (options.chartTitle && options.chartTitle.text) {
            grid.top += (parseFloat(options.chartTitle.fontSize) || 12);
        }

        if (showX) {
            grid.bottom += 15;
        }

        if (showY) {
            grid.right += 15;
        }

        if (groupByInfo && groupByInfo.viewType === 'Individual Instance') {
            grid.bottom += 40;
        }

        //  display values only cut off when axis NOT flipped
        if (!flipAxis) {
            if (showAvg) {
                grid.right += 25;
            }

            if (showTarget) {
                // find length of longest name if more than one target line
                longest = 0;
                for (let i = 0; i < showTarget.lines.length; i++) {
                    name = showTarget.lines[i].label.name;
                    if (name && name.length > longest) {
                        longest = name.length;
                    }
                }
                if (showAvg && (longest * 4) < 25) {
                    // if grid already shifted 25 to show avg and 25 > shift needed to show target name
                    // no additional shift needed
                } else {
                    // reset default to 45 so we don't include avg shift twice
                    grid.right = 45 + longest * 4;
                }
            }
        }

        return grid;
    }

    /**
     * @name customizeFacetLayout
     * @param {object} eChartsConfig configuration options for echarts
     * @desc defines grid, title, xAxis, yAxis, and series arrays used in echarts options configuration
     * @returns {object} - object of grid dimensions
     */
    function customizeFacetLayout(eChartsConfig) {
        var i, n,
            gridPixel,
            gridPercent,
            gridArray = [],
            title,
            titleArray = [],
            xAxisArray = [],
            yAxisArray = [],
            seriesArray = [],
            rowIndex,
            columnIndex,
            calculatedGridWidth,
            calculatedGridHeight,
            calculatedSpacingX,
            calculatedSpacingY,
            facetPadding = { // padding within the top and left of the panel
                top: 100,
                right: 120,
                bottom: 100,
                left: 120
            };

        for (i = 0; i < eChartsConfig.groupByInfo.uniqueInstances.length; i++) {
            rowIndex = Math.floor(i / eChartsConfig.options.facetHeaders.numberColumns);
            columnIndex = (i % eChartsConfig.options.facetHeaders.numberColumns);

            calculatedGridWidth = eChartsConfig.options.facetHeaders.grid.width;
            calculatedGridHeight = eChartsConfig.options.facetHeaders.grid.height;
            calculatedSpacingX = eChartsConfig.options.facetHeaders.spacing.x;
            calculatedSpacingY = eChartsConfig.options.facetHeaders.spacing.y;

            if (eChartsConfig.options.facetHeaders.unitType === '%') {
                calculatedGridWidth = (eChartsConfig.size.elementWidth * eChartsConfig.options.facetHeaders.grid.width) / 100;
                calculatedGridHeight = (eChartsConfig.size.elementHeight * eChartsConfig.options.facetHeaders.grid.height) / 100;
                calculatedSpacingX = (eChartsConfig.size.elementWidth * eChartsConfig.options.facetHeaders.spacing.x) / 100;
                calculatedSpacingY = (eChartsConfig.size.elementHeight * eChartsConfig.options.facetHeaders.spacing.y) / 100;
            }

            gridPixel = {
                top: facetPadding.top + (calculatedGridHeight + calculatedSpacingY) * rowIndex + 'px',
                left: facetPadding.left + (calculatedGridWidth + calculatedSpacingX) * columnIndex + 'px',
                width: calculatedGridWidth + 'px',
                height: calculatedGridHeight + 'px'
            };

            if (eChartsConfig.options.facetHeaders.customLayout) {
                // Center everything
                gridPixel.left = parseFloat(gridPixel.left) + (eChartsConfig.size.clientWidth - facetPadding.left - facetPadding.right - (calculatedGridWidth) * (eChartsConfig.options.facetHeaders.numberColumns) - (calculatedSpacingX) * (eChartsConfig.options.facetHeaders.numberColumns - 1)) / 2 + 'px';
            }

            gridPercent = {
                top: (parseFloat(gridPixel.top) / eChartsConfig.size.clientHeight) * 100 + '%',
                left: (parseFloat(gridPixel.left) / eChartsConfig.size.clientWidth) * 100 + '%',
                width: (parseFloat(gridPixel.width) / eChartsConfig.size.clientWidth) * 100 + '%',
                height: (parseFloat(gridPixel.height) / eChartsConfig.size.clientHeight) * 100 + '%'
            };

            gridArray.push(gridPercent);

            title = getFacetHeaders(eChartsConfig.groupByInfo.uniqueInstances[i], gridPercent, gridPixel, eChartsConfig.options.facetHeaders);
            titleArray.push(title);

            // Format Axes
            if (columnIndex === 0) {
                if (eChartsConfig.options.editYAxis) {
                    eChartsConfig.yAxisConfig[i][0].axisLabel.show = eChartsConfig.options.editYAxis.values;
                } else {
                    eChartsConfig.yAxisConfig[i][0].axisLabel.show = true;
                    eChartsConfig.yAxisConfig[i][0].name = null;
                }
            } else {
                eChartsConfig.yAxisConfig[i][0].name = null;
                eChartsConfig.yAxisConfig[i][0].axisLabel.show = false;
            }
            if (!eChartsConfig.options.editXAxis) {
                eChartsConfig.xAxisConfig[i][0].name = null;
                eChartsConfig.xAxisConfig[i][0].axisLabel.show = false;
            }

            xAxisArray.push(eChartsConfig.xAxisConfig[i][0]);
            yAxisArray.push(eChartsConfig.yAxisConfig[i][0]);

            for (n = 0; n < eChartsConfig.data[i].length; n++) {
                seriesArray.push(eChartsConfig.data[i][n]);
            }
        }

        return {
            grid: gridArray,
            title: titleArray,
            xAxis: xAxisArray,
            yAxis: yAxisArray,
            series: seriesArray
        };
    }

    /**
     * @name getFacetHeaders
     * @desc dynamically adjusts header size to not overlap grid
     * @param {string} text - header text
     * @param {obj} gridPercent - grid object (percent)
     * @param {obj} gridPixel - grid object (percent)
     * @param {obj} facetHeaders - uiOptions.facetHeaders
     * @returns {obj} - object of grid dimensions
     */
    function getFacetHeaders(text, gridPercent, gridPixel, facetHeaders) {
        var title = {},
            fontSize;

        if (typeof text === 'string') {
            title.text = cleanValue(text);
        } else {
            title.text = text;
        }

        title.left = parseFloat(gridPercent.left) + (parseFloat(gridPercent.width) / 2) + '%';

        if (facetHeaders && facetHeaders.headerFontSize) {
            fontSize = facetHeaders.headerFontSize;
            title.top = Number(gridPixel.top.substring(0, gridPixel.top.indexOf('px'))) - facetHeaders.headerFontSize - 8 + 'px';
        } else {
            fontSize = 14;
            title.top = Number(gridPixel.top.substring(0, gridPixel.top.indexOf('px'))) - fontSize - 8 + 'px';
        }

        title.textAlign = 'center';
        title.textStyle = {
            fontSize: fontSize
        };

        return title;
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
        if (vizType === 'Column') {
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
            }
        } else if (vizType === 'Line') {
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

    /**
     * @name determineResize
     * @param {array} ele the element to determine the size for
     * @param {object} eChartsConfig the config options for the viz
     * @desc determine the size of the chart when resizing
     * @returns {object} the size properties calculated for the viz
     */
    function determineResize(ele, eChartsConfig) {
        var chartContainer = ele[0].childNodes[0],
            parent = ele[0],
            numRows,
            numColumns,
            containerHeight,
            containerWidth,
            calculatedGridWidth,
            calculatedGridHeight,
            calculatedSpacingX,
            calculatedSpacingY,
            clientWidth,
            clientHeight,
            facetPadding = { // padding within the top and left of the panel
                top: 100,
                right: 120,
                bottom: 100,
                left: 120
            };

        parent.style.position = '';
        parent.style.top = '';
        parent.style.right = '';
        parent.style.bottom = '';
        parent.style.left = '';
        parent.style.overflowY = '';
        chartContainer.style.width = '';
        chartContainer.style.height = '';

        if (eChartsConfig.groupByInfo && eChartsConfig.groupByInfo.viewType === 'All Instances') {
            numColumns = eChartsConfig.options.facetHeaders.numberColumns;
            numRows = Math.ceil(eChartsConfig.groupByInfo.uniqueInstances.length / numColumns);
            calculatedGridWidth = eChartsConfig.options.facetHeaders.grid.width;
            calculatedGridHeight = eChartsConfig.options.facetHeaders.grid.height;
            calculatedSpacingX = eChartsConfig.options.facetHeaders.spacing.x;
            calculatedSpacingY = eChartsConfig.options.facetHeaders.spacing.y;

            if (eChartsConfig.options.facetHeaders.customLayout && eChartsConfig.options.facetHeaders.unitType === '%') {
                calculatedGridWidth = (chartContainer.clientWidth * eChartsConfig.options.facetHeaders.grid.width) / 100;
                calculatedGridHeight = (chartContainer.clientHeight * eChartsConfig.options.facetHeaders.grid.height) / 100;
                calculatedSpacingX = (chartContainer.clientWidth * eChartsConfig.options.facetHeaders.spacing.x) / 100;
                calculatedSpacingY = (chartContainer.clientHeight * eChartsConfig.options.facetHeaders.spacing.y) / 100;
            }

            if (!eChartsConfig.options.facetHeaders.customLayout) {
                calculatedGridWidth = (chartContainer.clientWidth - facetPadding.left - ((numColumns - 1) * calculatedSpacingX) - facetPadding.right) / numColumns;
                eChartsConfig.options.facetHeaders.grid.width = calculatedGridWidth;
            }

            containerHeight = facetPadding.top + (numRows * calculatedGridHeight) + ((numRows - 1) * calculatedSpacingY) + facetPadding.bottom;
            containerWidth = facetPadding.left + (numColumns * calculatedGridWidth) + ((numColumns - 1) * calculatedSpacingX) + facetPadding.right;

            parent.style.position = 'absolute';
            parent.style.top = '0';
            parent.style.right = '0';
            parent.style.bottom = '0';
            parent.style.left = '0';
            parent.style.overflowY = 'auto';

            if (chartContainer.clientWidth < containerWidth) {
                chartContainer.style.width = '' + containerWidth + 'px';
                clientWidth = containerWidth;
            } else {
                chartContainer.style.width = '';
                clientWidth = chartContainer.clientWidth;
            }

            if (chartContainer.clientHeight < containerHeight) {
                chartContainer.style.height = '' + containerHeight + 'px';
                clientHeight = containerHeight;
            } else {
                chartContainer.style.height = '';
                clientHeight = chartContainer.clientHeight;
            }
        }

        return {
            clientWidth: clientWidth,
            clientHeight: clientHeight,
            elementWidth: ele[0].clientWidth,
            elementHeight: ele[0].clientHeight
        };
    }

    /**
     * @name setTooltipContent
     * @param {*} chart the chart to manipulate
     * @param {*} uiOptions the viz options
     * @param {*} chartScope the scope of the chart
     * @param {*} $compile the angularjs compiler
     * @desc add a listener to see if tooltip has been drawn, if so we need to
     * @returns {void}
     */
    function setTooltipContent(chart, uiOptions, chartScope, $compile) {
        let html = '';
        if (uiOptions.customTooltip.html) {
            html += '<div>' + uiOptions.customTooltip.html + '</div>';

            // grab the divs inside of the chart
            let elements = chart.getDom().getElementsByTagName('div');
            // ### Assumption: second element is always the tooltip
            // remove all the content inside the tooltip
            while (elements[1].children.length > 0) {
                elements[1].removeChild(elements[1].lastElementChild);
            }

            // add the new tooltip
            elements[1].appendChild($compile(html)(chartScope)[0]);
        }
    }

    /**
     * @name getStateAbbreviationMapping
     * @return {Object} Mapping of two-letter state abbreviations to their state names
     * @desc Returns a mapping of two-letter state abbreviations to their corresponding state
     *       names. This is used in echarts-choropleth to determine if we should paint
     *       a state abbreviation.
     */
    function getStateAbbreviationMapping() {
        return {
            'AL': 'Alabama',
            'AK': 'Alaska',
            'AZ': 'Arizona',
            'AR': 'Arkansas',
            'CA': 'California',
            'CO': 'Colorado',
            'CT': 'Connecticut',
            'DE': 'Delaware',
            'DC': 'District of Columbia',
            'FL': 'Florida',
            'GA': 'Georgia',
            'HI': 'Hawaii',
            'ID': 'Idaho',
            'IL': 'Illinois',
            'IN': 'Indiana',
            'IA': 'Iowa',
            'KS': 'Kansas',
            'KY': 'Kentucky',
            'LA': 'Louisiana',
            'ME': 'Maine',
            'MD': 'Maryland',
            'MA': 'Massachusetts',
            'MI': 'Michigan',
            'MN': 'Minnesota',
            'MS': 'Mississippi',
            'MO': 'Missouri',
            'MT': 'Montana',
            'NE': 'Nebraska',
            'NV': 'Nevada',
            'NH': 'New Hampshire',
            'NJ': 'New Jersey',
            'NM': 'New Mexico',
            'NY': 'New York',
            'NC': 'North Carolina',
            'ND': 'North Dakota',
            'OH': 'Ohio',
            'OK': 'Oklahoma',
            'OR': 'Oregon',
            'PA': 'Pennsylvania',
            'PR': 'Puerto Rico',
            'RI': 'Rhode Island',
            'SC': 'South Carolina',
            'SD': 'South Dakota',
            'TN': 'Tennessee',
            'TX': 'Texas',
            'UT': 'Utah',
            'VT': 'Vermont',
            'VI': 'Virgin Islands',
            'VA': 'Virginia',
            'WA': 'Washington',
            'WV': 'West Virginia',
            'WI': 'Wisconsin',
            'WY': 'Wyoming'
        };
    }

    /**
     * @name getLabelWidth
     * @desc creates dummy div to match x and y axislabels and calculate witdth
     * @param {*} chart - type of chart (heatMap, barChart)
     * @param {*} data - x or y axis config
     * @param {*} rotate how much the label is rotated
     * @param {*} maxLength  maximum number of characters to be shown
     * @param {*} str  string specifying whether x-axis or y-axis is being edited
     * @param {*} fontSize label fontSize
     * @param {*} nameGap nameGap between Axis and Axis title
     * @param {*} gridBottom bottom position of bar chart in pixels
     * @param {*} dataZoom data Zoom for bar Chart
     * @returns {array} newWidth-axixLabelWidth, newNameGap- nameGaps new pixel size, newBottom- new grid.bottom
     */
    function getLabelWidth(chart, data, rotate, maxLength, str, fontSize, nameGap, gridBottom, dataZoom) {
        // refactored for bar chart and heat map
        let div = document.createElement('div'),
            innerDivContent = '',
            labelWidth,
            newWidth,
            newBottom,
            newNameGap,
            rotationMod = 0;
        if (typeof maxLength === 'undefined') {
            const sortedData = data.slice(0).sort((a, b) => b.length - a.length);
            for (let i = 0, len = sortedData.length; i < len; i++) {
                if (sortedData[i]) {
                    innerDivContent += sortedData[i];
                    innerDivContent += '<br>';
                }
            }
        } else {
            for (let i = 0, len = data.length; i < len; i++) {
                if (data[i]) {
                    innerDivContent += data[i].slice(0, maxLength);
                    if (data[i].length > maxLength) {
                        innerDivContent += '...';
                    }
                    innerDivContent += '<br>';
                }
            }
        }

        div.innerHTML = innerDivContent;
        div.style.display = 'inline-block';
        div.style.width = 'max-content';
        div.style.fontSize = typeof fontSize === 'undefined' ?  '12px' : fontSize + 'px';
        chart.appendChild(div);
        labelWidth = div.clientWidth;
        chart.removeChild(div);
        if (str === 'x') {
            if (rotate >= 0 && rotate <= 90) {
                rotationMod = rotate / 90;
            } else if (rotate > 90 && rotate <= 180) {
                rotationMod = (180 - rotate) / 90;
            } else if (rotate > 180 && rotate <= 270) {
                rotationMod = -(180 - rotate) / 90;
            } else if (rotate > 270 && rotate <= 360) {
                rotationMod = (360 - rotate) / 90;
            }
            if (rotationMod < 0.1) { // if its less than 10 % make it 10%
                rotationMod = 0.1; // this way you wont get rid of name gap
            }
        } else if (str === 'y') {
            if (rotate >= 0 && rotate <= 90) {
                rotationMod = (90 - rotate) / 90;
            } else if (rotate > 90 && rotate <= 180) {
                rotationMod = -(90 - rotate) / 90;
            } else if (rotate > 180 && rotate <= 270) {
                rotationMod = (270 - rotate) / 90;
            } else if (rotate > 270 && rotate <= 360) {
                rotationMod = -(270 - rotate) / 90;
            }

            if (rotationMod < 0.1) { // if its less than 10 % make it 10%
                rotationMod = 0.1; // this way you wont get rid of name gap
            }
        }
        newWidth = labelWidth * rotationMod;
        newNameGap = nameGap + newWidth + 10;
        newBottom = gridBottom + 10 + nameGap;

        if (typeof dataZoom !== 'undefined') {
            newNameGap -= 30;
            newBottom += 60 * rotationMod;
        }
        return [newWidth, newNameGap, newBottom];
    }


    /**
     * @name getCountryAbbreviationMapping
     * @return {Object} Mapping of two-letter country abbreviations to their country names
     * @desc Returns a mapping of two-letter country abbreviations to their corresponding
     *       country names. This is used in echarts-choropleth to determine if we should paint
     *       a country abbreviation.
     */
    function getCountryAbbreviationMapping() {
        return {
            'AF': 'Afghanistan',
            'AX': 'Aland Islands',
            'AL': 'Albania',
            'DZ': 'Algeria',
            'AS': 'American Samoa',
            'AD': 'Andorra',
            'AO': 'Angola',
            'AI': 'Anguilla',
            'AQ': 'Antarctica',
            'AG': 'Antigua And Barbuda',
            'AR': 'Argentina',
            'AM': 'Armenia',
            'AW': 'Aruba',
            'AU': 'Australia',
            'AT': 'Austria',
            'AZ': 'Azerbaijan',
            'BS': 'Bahamas',
            'BH': 'Bahrain',
            'BD': 'Bangladesh',
            'BB': 'Barbados',
            'BY': 'Belarus',
            'BE': 'Belgium',
            'BZ': 'Belize',
            'BJ': 'Benin',
            'BM': 'Bermuda',
            'BT': 'Bhutan',
            'BO': 'Bolivia',
            'BA': 'Bosnia And Herzegovina',
            'BW': 'Botswana',
            'BV': 'Bouvet Island',
            'BR': 'Brazil',
            'IO': 'British Indian Ocean Territory',
            'BN': 'Brunei Darussalam',
            'BG': 'Bulgaria',
            'BF': 'Burkina Faso',
            'BI': 'Burundi',
            'KH': 'Cambodia',
            'CM': 'Cameroon',
            'CA': 'Canada',
            'CV': 'Cape Verde',
            'KY': 'Cayman Islands',
            'CF': 'Central African Rep.',
            'TD': 'Chad',
            'CL': 'Chile',
            'CN': 'China',
            'CX': 'Christmas Island',
            'CC': 'Cocos (Keeling) Islands',
            'CO': 'Colombia',
            'KM': 'Comoros',
            'CG': 'Congo',
            'CD': 'Dem. Rep. Congo',
            'CK': 'Cook Islands',
            'CR': 'Costa Rica',
            'CI': 'Cote D\'Ivoire',
            'HR': 'Croatia',
            'CU': 'Cuba',
            'CY': 'Cyprus',
            'CZ': 'Czech Rep.',
            'DK': 'Denmark',
            'DJ': 'Djibouti',
            'DM': 'Dominica',
            'DO': 'Dominican Rep.',
            'EC': 'Ecuador',
            'EG': 'Egypt',
            'SV': 'El Salvador',
            'GQ': 'Equatorial Guinea',
            'ER': 'Eritrea',
            'EE': 'Estonia',
            'ET': 'Ethiopia',
            'FK': 'Falkland Islands (Malvinas)',
            'FO': 'Faroe Islands',
            'FJ': 'Fiji',
            'FI': 'Finland',
            'FR': 'France',
            'GF': 'French Guiana',
            'PF': 'French Polynesia',
            'TF': 'French Southern Territories',
            'GA': 'Gabon',
            'GM': 'Gambia',
            'GE': 'Georgia',
            'DE': 'Germany',
            'GH': 'Ghana',
            'GI': 'Gibraltar',
            'GR': 'Greece',
            'GL': 'Greenland',
            'GD': 'Grenada',
            'GP': 'Guadeloupe',
            'GU': 'Guam',
            'GT': 'Guatemala',
            'GG': 'Guernsey',
            'GN': 'Guinea',
            'GW': 'Guinea-Bissau',
            'GY': 'Guyana',
            'HT': 'Haiti',
            'HM': 'Heard Island & Mcdonald Islands',
            'VA': 'Holy See (Vatican City State)',
            'HN': 'Honduras',
            'HK': 'Hong Kong',
            'HU': 'Hungary',
            'IS': 'Iceland',
            'IN': 'India',
            'ID': 'Indonesia',
            'IR': 'Iran',
            'IQ': 'Iraq',
            'IE': 'Ireland',
            'IM': 'Isle Of Man',
            'IL': 'Israel',
            'IT': 'Italy',
            'JM': 'Jamaica',
            'JP': 'Japan',
            'JE': 'Jersey',
            'JO': 'Jordan',
            'KZ': 'Kazakhstan',
            'KE': 'Kenya',
            'KI': 'Kiribati',
            'KR': 'Korea',
            'KW': 'Kuwait',
            'KG': 'Kyrgyzstan',
            'LA': 'Lao PDR',
            'LV': 'Latvia',
            'LB': 'Lebanon',
            'LS': 'Lesotho',
            'LR': 'Liberia',
            'LY': 'Libya',
            'LI': 'Liechtenstein',
            'LT': 'Lithuania',
            'LU': 'Luxembourg',
            'MO': 'Macao',
            'MK': 'Macedonia',
            'MG': 'Madagascar',
            'MW': 'Malawi',
            'MY': 'Malaysia',
            'MV': 'Maldives',
            'ML': 'Mali',
            'MT': 'Malta',
            'MH': 'Marshall Islands',
            'MQ': 'Martinique',
            'MR': 'Mauritania',
            'MU': 'Mauritius',
            'YT': 'Mayotte',
            'MX': 'Mexico',
            'FM': 'Micronesia, Federated States Of',
            'MD': 'Moldova',
            'MC': 'Monaco',
            'MN': 'Mongolia',
            'ME': 'Montenegro',
            'MS': 'Montserrat',
            'MA': 'Morocco',
            'MZ': 'Mozambique',
            'MM': 'Myanmar',
            'NA': 'Namibia',
            'NR': 'Nauru',
            'NP': 'Nepal',
            'NL': 'Netherlands',
            'AN': 'Netherlands Antilles',
            'NC': 'New Caledonia',
            'NZ': 'New Zealand',
            'NI': 'Nicaragua',
            'NE': 'Niger',
            'NG': 'Nigeria',
            'NU': 'Niue',
            'NF': 'Norfolk Island',
            'MP': 'Northern Mariana Islands',
            'NO': 'Norway',
            'OM': 'Oman',
            'PK': 'Pakistan',
            'PW': 'Palau',
            'PS': 'Palestinian Territory, Occupied',
            'PA': 'Panama',
            'PG': 'Papua New Guinea',
            'PY': 'Paraguay',
            'PE': 'Peru',
            'PH': 'Philippines',
            'PN': 'Pitcairn',
            'PL': 'Poland',
            'PT': 'Portugal',
            'PR': 'Puerto Rico',
            'QA': 'Qatar',
            'RE': 'Reunion',
            'RO': 'Romania',
            'RU': 'Russia',
            'RW': 'Rwanda',
            'BL': 'Saint Barthelemy',
            'SH': 'Saint Helena',
            'KN': 'Saint Kitts And Nevis',
            'LC': 'Saint Lucia',
            'MF': 'Saint Martin',
            'PM': 'Saint Pierre And Miquelon',
            'VC': 'Saint Vincent And Grenadines',
            'WS': 'Samoa',
            'SM': 'San Marino',
            'ST': 'Sao Tome And Principe',
            'SA': 'Saudi Arabia',
            'SN': 'Senegal',
            'RS': 'Serbia',
            'SC': 'Seychelles',
            'SL': 'Sierra Leone',
            'SG': 'Singapore',
            'SK': 'Slovakia',
            'SI': 'Slovenia',
            'SB': 'Solomon Islands',
            'SO': 'Somalia',
            'ZA': 'South Africa',
            'GS': 'South Georgia And Sandwich Isl.',
            'ES': 'Spain',
            'LK': 'Sri Lanka',
            'SD': 'Sudan',
            'SR': 'Suriname',
            'SJ': 'Svalbard And Jan Mayen',
            'SZ': 'Swaziland',
            'SE': 'Sweden',
            'CH': 'Switzerland',
            'SY': 'Syria',
            'TW': 'Taiwan',
            'TJ': 'Tajikistan',
            'TZ': 'Tanzania',
            'TH': 'Thailand',
            'TL': 'Timor-Leste',
            'TG': 'Togo',
            'TK': 'Tokelau',
            'TO': 'Tonga',
            'TT': 'Trinidad And Tobago',
            'TN': 'Tunisia',
            'TR': 'Turkey',
            'TM': 'Turkmenistan',
            'TC': 'Turks And Caicos Islands',
            'TV': 'Tuvalu',
            'UG': 'Uganda',
            'UA': 'Ukraine',
            'AE': 'United Arab Emirates',
            'GB': 'United Kingdom',
            'US': 'United States',
            'UM': 'United States Outlying Islands',
            'UY': 'Uruguay',
            'UZ': 'Uzbekistan',
            'VU': 'Vanuatu',
            'VE': 'Venezuela',
            'VN': 'Vietnam',
            'VG': 'Virgin Islands, British',
            'VI': 'Virgin Islands, U.S.',
            'WF': 'Wallis And Futuna',
            'EH': 'W. Sahara',
            'YE': 'Yemen',
            'ZM': 'Zambia',
            'ZW': 'Zimbabwe'
        };
    }

    /**
     * @name setDataZoom
     * @desc sets the data zoom to the option service when zooming in
     * @param {any} chart - type of chart (bar, stack, are)
     * @param {any} optionsService - options service object of functions 
     * @param {string} widgetId - widget id for chart
     * @returns {void}
     */
     function setDataZoom(chart, optionsService, widgetId) {
        const option = chart.getOption();
        option.dataZoom.forEach((dataZoom) => {
            if (
                dataZoom.type === 'slider' &&
                dataZoom.start &&
                dataZoom.end &&
                dataZoom.hasOwnProperty('xAxisIndex')
            ) {
                optionsService.set(
                    widgetId,
                    'saveDataZoom.startX',
                    dataZoom.start,
                );

                optionsService.set(widgetId, 'saveDataZoom.endX', dataZoom.end);
            }
            if (
                dataZoom.type === 'slider' &&
                dataZoom.start &&
                dataZoom.end &&
                dataZoom.hasOwnProperty('yAxisIndex')
            ) {
                optionsService.set(
                    widgetId,
                    'saveDataZoom.startY',
                    dataZoom.start,
                );

                optionsService.set(widgetId, 'saveDataZoom.endY', dataZoom.end);
            }
        });
    }

    /**
     * @name paintSavedDataZoom
     * @desc paints data zoom if data zoom was saved
     * @param {any[]} dataZoomArr - data zoom array of data zoom objects
     * @param {number} startX - x coordinate start 
     * @param {number} startY - y coordinate start
     * @param {number} endX - x coordinate end
     * @param {number} endY - y coordinate end
     * @param {boolean} toggleZoomX if zoom x is toggled
     * @param {boolean} toggleZoomY if zoom y is toggled
     * @returns {void}
     */
    function paintSavedDataZoom(
        dataZoomArr,
        startX,
        startY,
        endX,
        endY,
        toggleZoomX,
        toggleZoomY,
    ) {
        dataZoomArr.forEach((dataZoom) => {
            if (
                toggleZoomX &&
                (startX > 0 || endX > 0) &&
                dataZoom.type === 'slider' &&
                dataZoom.hasOwnProperty('xAxisIndex')
            ) {
                dataZoom.start = startX;
                dataZoom.end = endX;
            }
            if (
                toggleZoomY &&
                (startY > 0 || endY > 0) &&
                dataZoom.type === 'slider' &&
                dataZoom.hasOwnProperty('yAxisIndex')
            ) {
                dataZoom.start = startY;
                dataZoom.end = endY;
            }
        });
        
    }

    return {
        getCurrentMode: getCurrentMode,
        getEchartsMode: getEchartsMode,
        initializeCommentMode: initializeCommentMode,
        initializeBrush: initializeBrush,
        getStateAbbreviationMapping: getStateAbbreviationMapping,
        getCountryAbbreviationMapping: getCountryAbbreviationMapping,
        initializeClickHoverKeyEvents: initializeClickHoverKeyEvents,
        getVizComments: getVizComments,
        setOption: setOption,
        formatLabel: formatLabel,
        getVizOptions: getVizOptions,
        determineResize: determineResize,
        getLabels: getLabels,
        formatDataForGroupByIndividual: formatDataForGroupByIndividual,
        formatDataForGroupByAll: formatDataForGroupByAll,
        getValuesMapping: getValuesMapping,
        getDataSeries: getDataSeries,
        getDataTypes: getDataTypes,
        getLegend: getLegend,
        getAnimation: getAnimation,
        getBackgroundColorStyle: getBackgroundColorStyle,
        getXAxis: getXAxis,
        getYAxis: getYAxis,
        cleanValue: cleanValue,
        getEchartsConfig: getEchartsConfig,
        mergeCharts: mergeCharts,
        onlyUnique: onlyUnique,
        toggleZoom: toggleZoom,
        setGrid: setGrid,
        setTooltipContent: setTooltipContent,
        configureDataValue: configureDataValue,
        getLabelWidth: getLabelWidth,
        formatData: formatData,
        processData: processData,
        setDataZoom: setDataZoom,
        paintSavedDataZoom: paintSavedDataZoom,
    };
}

export default echartsHelper();
