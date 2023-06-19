'use strict';
/** *  jvCharts ***/
import * as d3 from 'd3';
import jvTip from './jvTip.js';
import visualizationUniversal from '../../../../core/store/visualization/visualization.js';

/** Create a jvCharts object
 * @constructor
 * @param {Object} configObj - Configuration object passed into jvCharts constructor
 * @param {string} configObj.type - The type of chart
 * @param {string} configObj.name - The name of the chart
 * @param {Object} configObj.container - The container of the chart
 * @param {Object} configObj.userOptions - UI options for the chart
 * @param {Object} configObj.tipConfig - Configuration object for jvTooltip
 * @param {Object} configObj.chartDiv - A div wrapper for the chart and other jv features
 */
class jvCharts {
    constructor(configObj) {
        let chart = this;
        
        configObj.type = configObj.type.toLowerCase();
        chart.chartDiv = configObj.chartDiv;
        configObj.options = jvCharts.cleanToolData(configObj.options, configObj.editOptions);
        chart._vars = chart.getDefaultOptions(configObj.options);
        chart.mode = configObj.mode || 'default-mode';

        // remove pieces from config that have been copied somewhere else
        delete configObj.chartDiv;
        // delete configObj.options;
        delete configObj.mode;

        chart.config = configObj;

        // Start painting the jv Chart
        chart.createTooltip();
        chart.setData();
        chart.paint(chart._vars.transitionTime);
    }

    destroy() {
        this.timers && this.timers.forEach(timer => timer && window.clearTimeout(timer));
    }

    createTooltip() {
        let chart = this;
        chart.tip = new jvTip({
            config: chart.config.tipConfig,
            chartDiv: chart.chartDiv,
            uiOptions: chart.config.options
        });
    }

    setData() {
        let chart = this;
        if (chart.config.setData) {
            chart.data = chart.config.setData;
            // refer to main data as chartData to keep naming separate and understandable
            chart.data.chartData = chart.config.setData.data;
            delete chart.data.data;
            if (chart.data.dataTableKeys) {
                chart.cleanDataTableKeys();
            }

            if (chart.data.headers) {
                chart.setAlignAndKeys();
            }

            chart.colors = chart.config.setData.colors;
            chart[chart.config.type].setData.call(chart);
        }
    }

    /**
    * @name updateDataTableAlign
    * @param {array} currentKeys - array of objects to describe how to build the visual
    * @return {object} dataTableAlign - key:value mapping of current alignment
    */
    setAlignAndKeys() {
        var chart = this,
            dataTableAlign = {},
            i,
            len,
            keyMapping = {},
            keys = chart.data.headers;

        // iterate over current keys to create new object with key:value mapping instead of key:array mapping
        for (i = 0, len = keys.length; i < len; i++) {
            if (!keyMapping.hasOwnProperty(keys[i].model)) {
                keyMapping[keys[i].model] = 0;
                dataTableAlign[keys[i].model] = keys[i].name;
            } else {
                dataTableAlign[keys[i].model + ' ' + i] = keys[i].name;
            }
        }
        chart.data.dataTableKeys = chart.data.headers;
        chart.data.dataTable = dataTableAlign;
    }

    cleanDataTableKeys() {
        let chart = this,
            newKeys = [];
        for (let key of chart.data.dataTableKeys) {
            newKeys.push({
                name: key.varKey || key.alias || key.name,
                model: key.vizType || key.model,
                type: key.type,
                additionalDataType: key.additionalDataType
            });
        }
        chart.data.dataTableKeys = newKeys;
    }

    checkDimensions() {
        let chart = this,
            dimensions = chart.chartDiv.node().getBoundingClientRect();
        if (dimensions.height > 50 && dimensions.width > 120) {
            return true;
        }
        console.log('Chart container is too small to paint');
        return false;
    }

    paint(animation) {
        let chart = this, col, i,
            tempHighlight = {}, convertedData = [];
        if (chart.checkDimensions()) {
            if (chart.data && typeof chart[chart.config.type] === 'object' && typeof chart[chart.config.type].paint === 'function') {
                chart[chart.config.type].paint.call(chart, animation);
                chart.initializeModes();

                if (chart._vars.highlight) {
                    /* ******************************/
                    // TODO fix this when Jon is back
                    for (col in chart._vars.highlight.data) {
                        if (chart._vars.highlight.data.hasOwnProperty(col)) {
                            convertedData = [];
                            for (i = 0; i < chart._vars.highlight.data[col].length; i++) {
                                convertedData.push(typeof chart._vars.highlight.data[col][i] === 'string' ? chart._vars.highlight.data[col][i].replace(/_/g, ' ') : chart._vars.highlight.data[col][i]);
                            }
                            tempHighlight[typeof col === 'string' ? col.replace(/_/g, ' ') : col] = JSON.parse(JSON.stringify(convertedData));
                        }
                    }
                    chart._vars.highlight.data = tempHighlight;
                    /* ******************************/
                    if (chart[chart.config.type].highlightFromEventData) {
                        chart[chart.config.type].highlightFromEventData.call(chart, chart._vars.highlight);
                    }
                }
            } else {
                console.log('no paint function for: ' + chart.config.type);
            }
        }
    }

    setAxisData(axis, data, keys) {
        let chart = this,
            axisData = [],
            chartData = data.chartData,
            label = '',
            maxStack = 0,
            dataTableKeys = data.dataTableKeys,
            dataType,
            headers,
            additionalDataType;

        if (!dataTableKeys) {
            dataTableKeys = keys;
        }

        // Step 1: find out what the label is for the axis
        if (axis === 'x') {
            if (data.dataTable) {
                if (data.dataTable.hasOwnProperty('label')) {
                    label = data.dataTable.label;
                } else {
                    console.error("Label doesn't exist in dataTable");
                }
            } else {
                console.log('DataTable does not exist');
            }

            dataType = 'STRING';

            // Replace underscores with spaces
            label = label.replace(/_/g, ' ');

            // loop through data to populate axisData
            for (let chartEle of chartData) {
                if (chartEle[label] === null) {
                    axisData.push('NULL_VALUE');
                } else if (chartEle[label] === '') {
                    axisData.push('EMPTY_STRING');
                } else if (chartEle[label] || chartEle[label] === 0) {
                    axisData.push(chartEle[label]);
                }
            }
        } else {
            if (dataTableKeys === undefined) {
                console.error('dataTableKeys do not exist');
            }
            // Find the max value for Y Data
            let count = 0;

            for (let key of dataTableKeys) {
                if (key.model !== 'label' && key.model !== 'tooltip' && key.model !== 'series') {
                    label = key.name;
                    count++;
                }
            }
            dataType = jvCharts.getDataTypeFromKeys(label, dataTableKeys, 'NUMBER');

            // Add all values that are on yaxis to axis data
            for (let chartEle of chartData) {
                let stack = 0; // Keeps track of the maximum size of stacked data so that axis can be scaled to fit max size
                for (let k in data.dataTable) {
                    if (chartEle.hasOwnProperty(data.dataTable[k]) && k !== 'label' && k.indexOf('tooltip') === -1 && k !== 'series') {
                        stack += chartEle[data.dataTable[k]];
                        axisData.push(chartEle[data.dataTable[k]]);
                    }
                }
                if (stack > maxStack) {
                    maxStack = stack;
                }
            }

            // If there are multiple values on the yAxis, don't specify a label
            if (count > 1) {
                label = '';
            }
            label = label.replace(/_/g, ' ');
        }

        // Add additionalDataType for formatting
        headers = chart.data.dataTableKeys;
        for (let i = 0; i < headers.length; i++) {
            if (headers[i].name === label.replace(/ /g, '_')) {
                additionalDataType = headers[i].additionalDataType ? headers[i].additionalDataType : '';
                break;
            }
        }

        // Find the min and max of numeric data for building axes and add it to the returned object
        if (dataType === 'NUMBER') {
            let max,
                min,
                temp,
                tempMin,
                tempMax;
            if (chart._vars.toggleStack) {
                max = maxStack;
            } else {
                max = Math.max.apply(null, axisData);
            }

            min = Math.min.apply(null, axisData);
            min = Math.min(0, min);

            // Check if there's an axis min/max set
            if (axis === 'x') {
                if (chart._vars.xMin != null && chart._vars.xMin !== 'none') {
                    min = chart._vars.xMin;
                }
                if (chart._vars.xMax != null && chart._vars.xMax !== 'none') {
                    max = chart._vars.xMax;
                }
            } else if (axis === 'y') {
                if (chart._vars.yMin != null && chart._vars.yMin !== 'none') {
                    min = chart._vars.yMin;
                }
                if (chart._vars.yMax != null && chart._vars.yMax !== 'none') {
                    max = chart._vars.yMax;
                }
            }

            if (dataType === 'NUMBER' && axisData.length === 1) {
                if (axisData[0] >= 0) {
                    axisData.unshift(0);
                } else {
                    axisData.push(0);
                }
            }

            tempMin = parseInt(min, 10);
            tempMax = parseInt(max, 10);
            // Make sure that axis min and max don't get flipped
            if (tempMin > tempMax) {
                temp = min;
                min = max;
                max = temp;
            }

            return {
                'label': label,
                'values': axisData,
                'dataType': dataType,
                'min': min,
                'max': max,
                'additionalDataType': additionalDataType
            };
        }

        return {
            'label': label,
            'values': axisData,
            'dataType': dataType,
            'additionalDataType': additionalDataType
        };
    }


    /** 
     * @name setFlippedSeries
     * @desc flips series and returns flipped data
     * @param {any} dataTableKeys chartData, dataTable, dataLabel
     * @returns {void} Object of data and table for flipped series
     */
    setFlippedSeries(dataTableKeys) {
        let chart = this,
            chartData = chart.data.chartData,
            dataTable = chart.data.dataTable,
            dataLabel = chart.data.xAxisData.label,
            flippedData = [],
            flippedDataTable = {},
            valueCount = 1,
            filteredDataTableArray = [];

        for (let k in dataTable) {
            if (dataTable.hasOwnProperty(k)) {
                let flippedObject = {};
                if (dataTable[k] !== dataLabel) {
                    flippedObject[dataLabel] = dataTable[k];
                    for (let chartEle of chartData) {
                        flippedObject[chartEle[dataLabel]] = chartEle[dataTable[k]];
                        if (filteredDataTableArray.indexOf(chartEle[dataLabel]) === -1) {
                            flippedDataTable['value ' + valueCount] = chartEle[dataLabel];
                            valueCount++;
                            filteredDataTableArray.push(chartEle[dataLabel]);
                        }
                    }
                    flippedData.push(flippedObject);
                }
            }
        }
        flippedDataTable.label = dataLabel;
        chart.flippedData = { chartData: flippedData, dataTable: flippedDataTable };

        if (chart.config.type === 'bar' || chart.config.type === 'line' || chart.config.type === 'area') {
            chart.flippedData.xAxisData = chart.setAxisData('x', chart.flippedData, dataTableKeys);
            chart.flippedData.yAxisData = chart.setAxisData('y', chart.flippedData, dataTableKeys);
            chart.flippedData.legendData = jvCharts.setBarLineLegendData(chart.flippedData);
        } else {
            console.log('Add additional chart type to set flipped series');
        }
    }

    /** 
     * @name organizeChartData
     * @desc reorders all data based on the sortLabel and sortType
     *  -Only for chartData, does not work with flipped data
     * @param {string} sortParam - 
     * @param {string} sortType - direction of sort
     * @returns {any} [] sorted data
     */
    organizeChartData(sortParam, sortType) {
        let chart = this,
            organizedData,
            dataType,
            dataTableKeys = chart.data.dataTableKeys,
            sortLabel = sortParam;

        // If sortLabel doesn't exist, sort on the x axis label by default
        if (sortLabel === 'none') {
            for (let key of dataTableKeys) {
                if (key.model === 'label') {
                    sortLabel = key.name;
                    break;
                }
            }
        }

        // Remove underscores from sortLabel
        if (sortLabel) {
            sortLabel = sortLabel.replace(/_/g, ' ');
        }

        if (!chart.data.chartData[0][sortLabel]) {
            // Check if the sort label is a calculatedBy field
            let isValidSortLabel = false;
            for (let key of dataTableKeys) {
                if (key.operation.hasOwnProperty('calculatedBy') && key.operation.calculatedBy[0] === sortLabel) {
                    sortLabel = key.name.replace(/_/g, ' ');
                    isValidSortLabel = true;
                    break;
                }
            }
            // If it's not a valid sort label, return and don't sort the data
            if (!isValidSortLabel) {
                console.error('Not a valid sort');
                // throw new Error('Not a valid sort');
            }
        }

        // Check the data type to determine which logic to flow through
        for (let key of dataTableKeys) {
            // Loop through dataTableKeys to find sortLabel
            if (key.name.replace(/_/g, ' ') === sortLabel) {
                dataType = key.type;
                break;
            }
        }

        // Date sorting
        if (dataType != null && dataType === 'DATE') {
            organizedData = chart.data.chartData.sort((a, b) => {
                return new Date(a[sortLabel]) - new Date(b[sortLabel]);
            });
        } else if (dataType != null && dataType === 'NUMBER') {
            organizedData = chart.data.chartData.sort((a, b) => {
                if (!isNaN(a[sortLabel]) && !isNaN(b[sortLabel])) {
                    return a[sortLabel] - b[sortLabel];
                }
            });
        } else {
            organizedData = chart.data.chartData.sort((a, b) => {
                if (!isNaN(a[sortLabel]) && !isNaN(b[sortLabel])) {
                    if (parseFloat(a[sortLabel]) < parseFloat(b[sortLabel])) { // sort string ascending
                        return -1;
                    }
                    if (parseFloat(a[sortLabel]) > parseFloat(b[sortLabel])) {
                        return 1;
                    }
                    return 0;
                }
                if (a[sortLabel].toLowerCase() < b[sortLabel].toLowerCase()) { // sort string ascending
                    return -1;
                }
                if (a[sortLabel].toLowerCase() > b[sortLabel].toLowerCase()) {
                    return 1;
                }
                return 0;
            });
        }

        switch (sortType) {
            case 'sortAscending':
            case 'ascending':
                chart.data.chartData = organizedData;
                break;
            case 'sortDescending':
            case 'descending':
                chart.data.chartData = organizedData.reverse();
                break;
            default:
                chart.data.chartData = organizedData;
        }
    }

    /** 
     * @name setTipData
     * @desc creates data object to display in tooltip
     * @param {any} d the data
     * @param {any} i - 
     * @returns {any} object used to display tooltip
     */
    setTipData(d, i) {
        let chart = this,
            data = chart.currentData.chartData,
            // Get Color from chartData and add to object
            color = (chart._vars.color && chart._vars.color !== 'none') ? chart._vars.color : chart.colors[0],
            dataTable = chart.currentData.dataTable,
            title = d[dataTable.label],
            tipData = {};

        if (chart.config.type === 'bubble') {
            // Bubble uses raw data instead of view data (need to replace spaces with underscores)
            title = d[dataTable.label.replace(/ /g, '_')];
        }

        if (chart.config.type === 'treemap') {
            for (let item in d) {
                if (item !== dataTable.label && item !== 'Parent') {
                    tipData[item] = d[item];
                }
            }
        } else if (chart.config.type === 'bar' || chart.config.type === 'line' || chart.config.type === 'area') {
            title = data[i][dataTable.label];
            for (let item in data[i]) {
                if (item !== dataTable.label) {
                    tipData[item] = data[i][item];
                } else {
                    continue;
                }
            }
        } else if (chart.config.type === 'gantt') {
            // Calculate length of dates

            for (let item in data[i]) {
                if (data[i].hasOwnProperty(item) && item !== dataTable.group) {
                    tipData[item] = data[i][item];
                }
            }

            let start,
                end,
                difference,
                // Calculting duration of date ranges to add to tooltip
                numPairs = Math.floor(Object.keys(dataTable).length / 2);

            for (let j = 0; j < numPairs; j++) {
                if (j === 0) {
                    start = new Date(data[i][dataTable.start]);
                    end = new Date(data[i][dataTable.end]);
                } else {
                    start = new Date(data[i][dataTable['start ' + j]]);
                    end = new Date(data[i][dataTable['end ' + j]]);
                }
                difference = end.getTime() - start.getTime();
                tipData.duration = Math.ceil(difference / (1000 * 60 * 60 * 24)) + ' days';
            }

            title = data[i][dataTable.group];
        } else if (chart.config.type === 'pie' || chart.config.type === 'radial') {
            title = d[dataTable.label];
            for (let item in dataTable) {
                if (item !== 'label') {
                    tipData[dataTable[item]] = d[dataTable[item]];
                } else {
                    continue;
                }
            }
            delete tipData.outerRadius;
        } else if (chart.config.type === 'circlepack' || chart.config.type === 'sunburst') {
            title = d.data.name;
            tipData[dataTable.value] = d.value;
        } else if (chart.config.type === 'cloud') {
            title = d[dataTable.label];
            tipData[dataTable.value] = d[dataTable.value];
            if (typeof d[dataTable['tooltip 1']] !== 'undefined') {
                tipData[dataTable['tooltip 1']] = d[dataTable['tooltip 1']];
            }
        } else if (chart.config.type === 'heatmap') {
            title = d.yAxisName + ' to ' + d.xAxisName;
            if (d.hasOwnProperty('value')) {
                tipData[d.label] = d.value;
            }
            for (let tooltip in d) {
                if (tooltip.indexOf('tooltip') > -1) {
                    tipData[dataTable[tooltip]] = d[tooltip];
                }
            }
        } else if (chart.config.type === 'clustergram') {
            // title = d.y_path.replace(/\./g, '→') + '</br>' + d.x_path.replace(/\./g, '→');
            // Build strings for tooltip
            let yTemp = d.y_path.split('.'),
                yTempString = '',
                xTemp = d.x_path.split('.'),
                xTempString = '';

            for (let k = 0; k < yTemp.length; k++) {
                if (dataTable['y_category ' + (k + 1)]) {
                    yTempString += yTemp[k] += ' (' + dataTable['y_category ' + (k + 1)] + ')';
                } else {
                    yTempString += yTemp[k] += ' (' + dataTable.y_category + ')';
                }

                if (k !== yTemp.length - 1) {
                    yTempString += ' → ';
                }
            }
            for (let k = 0; k < xTemp.length; k++) {
                if (dataTable['x_category ' + (k + 1)]) {
                    xTempString += xTemp[k] += ' (' + dataTable['x_category ' + (k + 1)] + ')';
                } else {
                    xTempString += xTemp[k] += ' (' + dataTable.x_category + ')';
                }

                if (k !== xTemp.length - 1) {
                    xTempString += ' → ';
                }
            }

            title = 'Y > ' + yTempString + '<br>' + 'X > ' + xTempString;
            if (d.hasOwnProperty('value')) {
                tipData.value = d.value;
            }
            for (let tooltip in d) {
                if (tooltip.indexOf('tooltip') > -1) {
                    tipData[dataTable[tooltip]] = d[tooltip];
                }
            }
        } else if (chart.config.type === 'sankey') {
            title = d.source.name + ' to ' + d.target.name;

            if (d.hasOwnProperty('value')) {
                tipData[dataTable.value] = d.value;
            }
        } else if (chart.config.type === 'singleaxis') {
            title = d.data[dataTable.label];

            for (let item in dataTable) {
                if (item !== 'label') {
                    tipData[dataTable[item]] = d.data[dataTable[item]];
                }
            }
        } else {
            for (let item in d) {
                if (item !== dataTable.label) {
                    tipData[item] = d[item];
                } else {
                    continue;
                }
            }
        }


        return { 'data': d, 'tipData': tipData, 'index': i, 'title': title, 'color': color, 'viz': chart.config.type };
    }

    /** ********************************************** Draw functions ******************************************************/

    /** 
     * @name generateSVG
     * @desc creates an SVG element on the panel
     * @param {any} legendData - 
     * @param {any} customMarginParam -
     * @param {any} customSizeParam - 
     * @returns {void}
     */
    generateSVG(legendData, customMarginParam, customSizeParam) {
        let chart = this,
            margin = {},
            container = {},
            dimensions = chart.chartDiv.node().getBoundingClientRect(),
            customMargins = customMarginParam,
            customSize = customSizeParam,
            textWidth;

        if (chart._vars.customMargins) {
            customMargins = chart._vars.customMargins;
        }

        // set margins
        if (!customMargins) {
            // declare margins if they arent passed in
            margin = {
                top: 55,
                right: 50,
                left: 100,
                bottom: 70
            };
            if (legendData != null) {
                if (legendData.length <= 3) {
                    margin.bottom = 70;
                } else if (legendData.length <= 6) {
                    margin.bottom = 85;
                } else {
                    margin.bottom = 130;
                }
            }
        } else {
            margin = customMargins;
        }

        // reduce margins if legend is toggled off
        // TODO make this better
        if (chart._vars.toggleLegend === false) {
            if (chart.config.type === 'pie' || chart.config.type === 'radial' || chart.config.type === 'circlepack' || chart.config.type === 'heatmap') {
                margin.left = 40;
            } else if (chart.config.type === 'treemap' || chart.config.type === 'bar' || chart.config.type === 'gantt' || chart.config.type === 'scatterplot' || chart.config.type === 'line') {
                margin.bottom = 40;
            }
        }

        if (chart.config.type === 'clustergram') {
            textWidth = jvCharts.getMaxWidthForAxisData('y', chart.leftLabels, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
            margin.left = Math.ceil(textWidth);
            if (margin.left < 30) {
                margin.left = 30;
            }

            textWidth = jvCharts.getMaxWidthForAxisData('y', chart.rightLabels, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
            margin.top = Math.ceil(textWidth);
            if (margin.top < 30) {
                margin.top = 30;
            }
        }

        // set yAxis margins
        if (chart.currentData && chart.currentData.yAxisData) {
            textWidth = jvCharts.getMaxWidthForAxisData('y', chart.currentData.yAxisData, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
            if (textWidth > 100 && chart.config.type === 'heatmap') {
                textWidth = 100;
            }
            chart._vars.heatmapYmargin = textWidth;
            margin.left = Math.ceil(textWidth) + 30;
        }

        // set xAxis top margins
        if (chart.config.type === 'heatmap' && chart.currentData && chart.currentData.xAxisData) {
            textWidth = jvCharts.getMaxWidthForAxisData('x', chart.currentData.xAxisData, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
            // subtract space for tilt
            textWidth = Math.ceil(textWidth);
            if (textWidth > 100) {
                textWidth = 100;
            }
            // specific to heatmap
            // if (chart.config.type === 'heatmap') {
            if (textWidth > 100) {
                textWidth = 100;
            } else if (textWidth < 80) {
                textWidth = 80;
            }
            // }
            chart._vars.heatmapXmargin = textWidth;
            margin.top = textWidth;
            customSize = {};
            // set container
            customSize.width = chart.currentData.xAxisData.values.length * 20;
            customSize.height = chart.currentData.yAxisData.values.length * 20;

            if (chart._vars.toggleLegend) {
                let dummyObj = {};
                dummyObj.values = chart.data.heatData;
                dummyObj.values.sort((a, b) => a - b);
                dummyObj.label = '';
                dummyObj.min = dummyObj.values[0];
                dummyObj.max = dummyObj.values[dummyObj.values.length - 1];

                textWidth = jvCharts.getMaxWidthForAxisData('y', dummyObj, chart._vars, dimensions, margin, chart.chartDiv, chart.config.type);
                chart.config.heatWidth = Math.ceil(textWidth) + 30;
                margin.left = margin.left + chart.config.heatWidth;
            }

            if (customSize.width + margin.left + margin.right < dimensions.width) {
                margin.right = parseInt(dimensions.width, 10) - margin.left - customSize.width - 20;
            }
            if (customSize.height + margin.top + margin.bottom < dimensions.height) {
                margin.bottom = parseInt(dimensions.height, 10) - margin.top - customSize.height - 10;
            }
            customSize.width += margin.right + margin.left;
            customSize.height += margin.top + margin.bottom;
        }

        // set container attributes
        // Set svg size based on calculation margins or custom size if specified
        if (customSize && customSize.hasOwnProperty('height')) {
            container.height = customSize.height - margin.top - margin.bottom;
        } else {
            container.height = parseInt(dimensions.height, 10) - margin.top - margin.bottom;
            if (container.height <= 50) {
                margin.top = 10;
                margin.bottom = 10;
                container.height = parseInt(dimensions.height, 10) - margin.top - margin.bottom;
                chart._vars.xLabelFontSize = 0;
            }
        }

        if (customSize && customSize.hasOwnProperty('width')) {
            container.width = customSize.width - margin.left - margin.right;
        } else {
            container.width = parseInt(dimensions.width, 10) - margin.left - margin.right;
        }

        // add margin and container to chart config object
        chart.config.margin = margin;
        chart.config.container = container;

        // remove old svg if it exists
        chart.svg = chart.chartDiv.select('svg').remove();

        // svg layer
        if (chart.config.type === 'heatmap' || chart.config.type === 'singleaxis') {
            chart.svg = chart.chartDiv.append('svg')
                .attr('class', 'editable-svg')
                .attr('width', container.width + margin.left + margin.right)
                .attr('height', container.height + margin.top + margin.bottom)
                .append('g')
                .attr('class', 'container')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
        } else if (chart.config.type === 'clustergram') {
            var sizeWidth = chart.rightLeaves.length * 20;
            if (sizeWidth < container.width) {
                sizeWidth = container.width;
            }

            var sizeHeight = chart.leftLeaves.length * 20;
            if (sizeHeight < container.height) {
                sizeHeight = container.height;
            }

            chart.svg = chart.chartDiv.append('svg')
                .attr('class', 'editable-svg')
                .attr('width', sizeWidth + margin.left + margin.right)
                .attr('height', sizeHeight + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
        } else {
            chart.svg = chart.chartDiv.append('svg')
                .attr('class', 'editable-svg')
                .attr('width', container.width + margin.left + margin.right)
                .attr('height', container.height + margin.top + margin.bottom)
                .append('g')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')');
        }
    }

    /** 
     * @name generateXAxis
     * @desc creates x axis on the svg
     * @param {any} xAxisData - the data displayed on the x-axis
     * @param {any} ticks -
     * @returns {void}
     */
    generateXAxis(xAxisData, ticks) {
        // declare variables
        let chart = this,
            xAxis,
            // Need to getXAxisScale each time so that axis updates on resize
            xAxisScale = jvCharts.getAxisScale('x', xAxisData, chart.config.container, chart._vars),
            containerHeight = chart.config.container.height,
            containerWidth = chart.config.container.width,
            xAxisClass = 'xAxisLabels editable editable-xAxis editable-text',
            tickSize = 0,
            axisHeight = containerHeight,
            xContent,
            xAxisGroup,
            formatValueType;

        // assign css class for edit mode
        // if the axis is numbers add editable-num
        if (xAxisData.dataType === 'NUMBER') {
            xAxisClass += ' editable-num';
        }

        // remove previous xAxis container if its there
        chart.svg.selectAll('.xAxisContainer').remove();

        // Save the axis scale to chart object
        chart.currentData.xAxisScale = xAxisScale;

        if (chart.currentData.xAxisData.dataType === 'NUMBER') {
            tickSize = 5;
        }

        // create xAxis drawing function
        if (chart.config.type === 'singleaxis') {
            xAxis = d3.axisTop(xAxisScale)
                .tickSize(tickSize);
        } else {
            xAxis = d3.axisBottom(xAxisScale)
                .tickSize(tickSize);
        }

        if (ticks) {
            xAxis.ticks(ticks);
        }

        if (chart.config.type === 'singleaxis') {// For any axes that are on top of the data
            axisHeight = 0;
        }

        xContent = chart.svg.append('g')
            .attr('class', 'xAxisContainer')
            .attr('transform', 'translate(0,' + (axisHeight) + ')');

        xAxisGroup = xContent.append('g')
            .attr('class', 'xAxis')
            .call(xAxis);

        formatValueType = jvCharts.jvFormatValueType(xAxisData.values);

        // Styling the axis
        xAxisGroup.select('path')
            .attr('stroke', chart._vars.axisColor)
            .attr('stroke-width', chart._vars.strokeWidth);

        // Styling for ticks
        xAxisGroup.selectAll('line')
            .attr('stroke', chart._vars.axisColor)
            .attr('stroke-width', chart._vars.stroke);

        // Styling the labels for each piece of data
        xAxisGroup.selectAll('text')
            .attr('fill', chart._vars.fontColor)// Customize the color of axis labels
            .attr('class', xAxisClass)
            .style('text-anchor', 'middle')
            .attr('font-size', chart._vars.fontSize)
            .attr('transform', 'translate(0, 3)')
            .text((d) => {
                if (xAxisData.dataType === 'NUMBER' || chart._vars.rotateAxis) {
                    return jvCharts.jvFormatValue(d, formatValueType, xAxisData, chart);
                }
                return d;
            });

        // Styling the label for the entire axis
        xContent.append('g')
            .attr('class', 'xLabel')
            .append('text')
            .attr('class', 'xLabel editable editable-text editable-content')
            .attr('text-anchor', 'middle')
            .attr('font-size', chart._vars.fontSize)
            .text(() => {
                if (xAxisData.dataType === 'DATE') {
                    return '';
                }
                return xAxisData.label;
            })
            .attr('transform', 'translate(' + containerWidth / 2 + ', 33)');
    }

    /** FormatXAxisLabels
     *
     * If x-axis labels are too long/overlapping, they will be hidden/shortened
     */
    formatXAxisLabels(dataLength, recursion) {
        let chart = this,
            showAxisLabels = true,
            xAxisLength = chart.config.container.width,
            textWidth = [],
            formatValueType = null,
            dataType = chart.currentData.xAxisData.dataType,
            axisValues = chart.currentData.xAxisData.values;

        if (dataType === 'NUMBER') {
            formatValueType = jvCharts.jvFormatValueType(axisValues);
        }

        // create dummy text to determine computed text length for the axis labels
        // necessary to do this because axis labels getBBox() is returning 0 since they do not seem to be drawn yet
        chart.svg.append('g')
            .selectAll('.dummyText')
            .data(axisValues)
            .enter()
            .append('text')
            .attr('font-family', 'Inter')
            .attr('font-size', chart._vars.fontSize)
            .text((d) => {
                let returnVal = d;
                if (dataType === 'NUMBER') {
                    returnVal = jvCharts.jvFormatValue(d, formatValueType);
                }
                return returnVal;
            })
            .each(function () {
                // adding 10px buffer
                let thisWidth = this.getComputedTextLength() + 10;
                textWidth.push(thisWidth);
                this.remove(); // remove them just after displaying them
            });

        for (let textEle of textWidth) {
            if (textEle > xAxisLength / dataLength) {
                showAxisLabels = false;
            }
        }

        if (showAxisLabels) {
            if (recursion) {
                chart.generateXAxis(chart.currentData.xAxisData, dataLength);
            }
            chart.svg.selectAll('.xAxisLabels').style('display', 'block');
        } else if (dataLength > 1 && chart.currentData.xAxisData.dataType === 'NUMBER') {
            // recursively keep decreasing to figure out ticks length to repaint the xAxis if its numeric
            chart.formatXAxisLabels((dataLength - 1), true);
        } else {
            chart.svg.selectAll('.xAxis').selectAll('text').style('display', 'none');
        }
    }

    /** generateYAxis
     * creates y axis on the svg
     *
     * @params generateYAxis
     */
    generateYAxis(yAxisData) {
        let chart = this,
            yAxisScale = jvCharts.getAxisScale('y', yAxisData, chart.config.container, chart._vars),
            yAxisClass = 'yAxisLabels editable editable-yAxis editable-text',
            maxYAxisLabelWidth,
            numberOfTicks = Math.floor(chart.config.container.height / 14),
            yAxis,
            yContent,
            yAxisGroup,
            forceFormatTypeTo = null,
            ylabel = '';
        // assign css class for edit mode
        // if the axis is numbers add editable-num
        if (yAxisData.dataType === 'NUMBER') {
            yAxisClass += ' editable-num';
        }

        // Save y axis scale to chart object
        chart.currentData.yAxisScale = yAxisScale;

        // remove previous svg elements
        chart.svg.selectAll('.yAxisContainer').remove();
        chart.svg.selectAll('text.yLabel').remove();

        if (numberOfTicks > 10) {
            if (numberOfTicks < 20) {
                numberOfTicks = 10;
            } else if (numberOfTicks < 30) {
                numberOfTicks /= 2;
            } else {
                numberOfTicks = 15;
            }
        }

        // If all y-axis values are the same, only show a tick for that value. If value is 1, don't show any decimal places
        if (yAxisData.values.length > 0 && !!yAxisData.values.reduce((a, b) => a === b ? a : NaN)) {
            numberOfTicks = 1;
            if (yAxisData.values[0] === 1) {
                forceFormatTypeTo = 'nodecimals';
            }
        }
        yAxis = d3.axisLeft()
            .ticks(numberOfTicks)// Link to D3.svg.axis options: https://github.com/mbostock/d3/wiki/SVG-Axes
            .scale(yAxisScale)// Sets the scale to use in the axis
            .tickSize(5)// Sets the thickness of the axis line
            .tickPadding(5);

        // Hide Axis values if necessary
        if (yAxisData.hideValues) {
            yAxis.tickFormat('');
        }
        if (chart._vars.displayYAxisLabel) {
            ylabel = yAxisData.label;
        }

        yContent = chart.svg.append('g')
            .attr('class', 'yAxisContainer');

        yContent.append('g')
            .attr('class', 'yLabel')
            .append('text')
            .attr('class', 'yLabel editable editable-text editable-content')
            .attr('text-anchor', 'start')
            .attr('font-size', chart._vars.fontSize)
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', 'translate(' + (-chart.config.margin.left + 10) + ', -10)')
            .text(ylabel)
            .attr('fill-opacity', 1);

        yAxisGroup = yContent.append('g')
            .attr('class', 'yAxis');


        yAxisGroup
            .call(yAxis);

        // Styling for Axis
        yAxisGroup.select('path')
            .attr('stroke', chart._vars.axisColor)
            .attr('stroke-width', chart._vars.strokeWidth);

        maxYAxisLabelWidth = 0;

        if (yAxisData.hideValues) {
            // Styling for ticks
            yAxisGroup.selectAll('line')
                .attr('stroke-width', 0);
        } else {
            let formatValueType = jvCharts.jvFormatValueType(yAxisData.values);
            // Styling for ticks
            yAxisGroup.selectAll('line')
                .attr('stroke', chart._vars.axisColor)
                .attr('stroke-width', chart._vars.stroke);
            // Styling for data labels on axis
            yAxisGroup.selectAll('text')
                .attr('fill', chart._vars.fontColor)// Customize the color of axis labels
                .attr('class', yAxisClass)
                .attr('transform', 'rotate(0)')// Add logic to rotate axis based on size of title
                .attr('font-size', chart._vars.fontSize)
                .append('svg:title');

            yAxisGroup.selectAll('text')
                .text((d) => {
                    if (chart._vars.rotateAxis) {
                        return d;
                    }
                    let maxLength = 13,
                        current = '';
                    if (d.length > maxLength) {
                        current = d.substring(0, maxLength) + '...';
                    } else {
                        current = d;
                    }

                    if (forceFormatTypeTo !== null) {
                        formatValueType = forceFormatTypeTo;
                    }
                    return jvCharts.jvFormatValue(current, formatValueType, yAxisData, chart);
                })
                .each((d, i, j) => {
                    if (j[0].getBBox().width > maxYAxisLabelWidth) {
                        maxYAxisLabelWidth = j[0].getBBox().width;
                    }
                });
            if (maxYAxisLabelWidth > 0) {
                chart._vars.yLabelWidth = Math.ceil(maxYAxisLabelWidth) + 20;
            }
        }
    }
    /* *********************************************** Legend functions ******************************************************/

    generateLegend(legendData, drawFunc) {
        let chart = this,
            svg = chart.svg,
            legendElements;

        if (!chart._vars.toggleLegend) {
            return;
        }
        svg.selectAll('.legend').remove();

        legendElements = jvCharts.generateLegendElements(chart, legendData, drawFunc);

        // Returns the legend rectangles that are toggled on/off
        if (drawFunc) {
            jvCharts.attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
        }

        if (chart._vars.thresholds !== 'none' && chart._vars.thesholdLegend === true) {
            if (chart.config.type === 'bar' || chart.config.type === 'area' || chart.config.type === 'line') {
                if (chart.config.container.height > 300 && chart.config.container.width > 300) {
                    jvCharts.generateThresholdLegend(chart);
                }
            }
        }
    }

    /** generateVerticalLegend
     *
     * creates and draws a vertical legend on the svg element
     * @params svg, legendData, options, container, chartData, xAxisData, yAxisData, chartType
     * @returns {{}}
     */
    generateVerticalLegend(paintFunc) {
        let chart = this,
            svg = chart.svg,
            legendData = chart.currentData.legendData,
            legendElements;

        if (!chart._vars.toggleLegend) {
            return;
        }

        svg.selectAll('.legend').remove();
        legendElements = jvCharts.generateVerticalLegendElements(chart, legendData, paintFunc);

        // Returns the legend rectangles that are toggled on/off
        if (paintFunc !== 'generatePack') {
            jvCharts.attachClickEventsToLegend(chart, legendElements, paintFunc, legendData);
        }
    }

    /**
     *
     * Generates a clip path that contains the contents of the chart area to the view of the chart area container
     * i.e - don't want bars going below the x axis
     */
    generateClipPath() {
        let chart = this,
            svg = chart.svg,
            type = chart.config.type,
            containerName = '.' + type + '-container';

        svg
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('x', 0)
            .attr('y', -3)
            .attr('width', chart.config.container.width)
            .attr('height', chart.config.container.height + 3);

        // Break this out into logic for all other vizzes that have overflow issues
        svg
            .select(containerName)
            .attr('clip-path', 'url(#clip)');
    }

    setThreshold(data) {
        let chart = this,
            thresholds = chart._vars.thresholds,
            length = thresholds ? Object.keys(thresholds).length : 0;

        if (thresholds !== 'none') {
            for (let i = length - 1; i >= 0; i--) {
                let threshold = thresholds[i];
                // console.log(typeof data == "date");
                if (data >= Number(threshold.threshold)) {
                    return 'rect-' + i;
                }
            }
        }
        return '';
    }

    generateLineThreshold() {
        let chart = this,
            svg = chart.svg,
            width = chart.config.container.width,
            height = chart.config.container.height,
            thresholds = chart._vars.thresholds,
            length = Object.keys(chart._vars.thresholds).length,
            x = chart.currentData.xAxisScale,
            y = chart.currentData.yAxisScale;
        if (thresholds !== 'none') {
            for (let i = 0; i < length; i++) {
                let threshold = thresholds[i];
                if (chart._vars.rotateAxis) {
                    svg.append('line')
                        .style('stroke', threshold.thresholdColor)
                        .attr('x1', x(threshold.threshold))
                        .attr('y1', 0)
                        .attr('x2', x(threshold.threshold))
                        .attr('y2', height)
                        .attr('stroke-dasharray', ('3, 3'));
                } else {
                    svg.append('line')
                        .style('stroke', threshold.thresholdColor)
                        .attr('x1', 0)
                        .attr('y1', y(threshold.threshold))
                        .attr('x2', width)
                        .attr('y2', y(threshold.threshold))
                        .attr('stroke-dasharray', ('3, 3'));
                }
            }
        }
    }


    /** displayValues
     *
     * toggles data values that are displayed on the specific type of chart on the svg
     * @params svg, barData, options, xAxisData, yAxisData, container
     * @returns {{}}
     */
    displayValues() {
        var chart = this,
            svg = chart.svg,
            container = chart.config.container,
            chartData = chart.data.chartData,
            xAxisData = chart.currentData.xAxisData,
            yAxisData = chart.currentData.yAxisData,
            legendOptions = chart._vars.legendOptions,
            cleanedChartData = JSON.parse(JSON.stringify(chartData)),
            data = [], // Only stores values
            posCalc,
            x,
            y,
            displayValuesGroup;

        // If series is flipped, use flipped data; initialize with the full data set
        if (chart._vars.seriesFlipped) {
            chartData = chart.flippedData.chartData;
            legendOptions = chart._vars.flippedLegendOptions;
        }

        if (chart._vars.displayValues === true) {
            svg.selectAll('.displayValueContainer').remove();
            if (legendOptions) {// Checking which legend elements are toggled on resize
                for (let chartEle of cleanedChartData) {
                    for (let legendEle of legendOptions) {
                        if (legendEle.toggle === false) {
                            delete chartEle[legendEle.element];
                        }
                    }
                }
            }

            for (let chartEle of cleanedChartData) {
                let val = jvCharts.getDisplayValuesElement(chartEle, chart.currentData.dataTable, chart.config.type);
                data.push(val);
            }

            posCalc = jvCharts.getPosCalculations(cleanedChartData, chart._vars, xAxisData, yAxisData, container, chart);
            x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars);
            y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars);

            if (chart._vars.rotateAxis) {
                // Add a container for display values over each bar group
                displayValuesGroup =
                    svg
                        .append('g')
                        .attr('class', 'displayValuesGroup')
                        .selectAll('g')
                        .data(data)
                        .enter()
                        .append('g')
                        .attr('class', 'displayValuesGroup')
                        .attr('transform', (d, i) => {
                            let translate = (y.paddingOuter() * y.step()) + (y.step() * i);
                            return 'translate(0,' + translate + ')';
                        });

                displayValuesGroup.selectAll('text')
                    .data(d => d)
                    .enter()
                    .append('text')
                    .attr('class', 'displayValue')
                    .attr('x', (d, i, j) => { // sets the x position of the bar)
                        return posCalc.width(d, i, j) + posCalc.x(d, i, j);
                    })
                    .attr('y', (d, i, j) => { // sets the y position of the bar
                        return posCalc.y(d, i, j) + (posCalc.height(d, i, j) / 2);
                    })
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'start')
                    .attr('fill', chart._vars.fontColor)
                    .text((d) => {
                        let returnText = Math.round(d * 100) / 100;// round to 2 decimals
                        return jvCharts.jvFormatValue(returnText);
                    })
                    .attr('font-size', chart._vars.fontSize);
            } else {
                // Add a display values container over each bar group
                displayValuesGroup = svg.append('g')
                    .attr('class', 'displayValuesGroup')
                    .selectAll('g')
                    .data(data)
                    .enter()
                    .append('g')
                    .attr('class', 'displayValuesGroup')
                    .attr('transform', (d, i) => {
                        let translate = (x.paddingOuter() * x.step()) + (x.step() * i);
                        return 'translate(' + translate + ',0)';
                    });
                displayValuesGroup.selectAll('text')
                    .data(d => d)
                    .enter()
                    .append('text')
                    .attr('class', 'displayValue')
                    .attr('x', (d, i, j) => { // sets the x position of the bar)
                        return Math.round((posCalc.x(d, i, j) + (posCalc.width(d, i, j) / 2)));
                    })
                    .attr('y', (d, i, j) => { // sets the y position of the bar
                        return Math.round(posCalc.y(d, i, j)) - 3;// + posCalc.height(d, i, j) - 5);
                    })
                    .attr('text-anchor', 'middle')
                    .attr('fill', chart._vars.fontColor)
                    .text((d, i, j) => {
                        if (chart._vars.toggleStack && chart._vars.displayValuesStackAsPercent) {
                            let total = 0;
                            for (let index = 0; index < j.length; index++) {
                                total += j[index].__data__;
                            }
                            return jvCharts.jvFormatValue(d / total, 'percent');
                        }

                        return jvCharts.jvFormatValue(d);
                    })
                    .attr('font-size', chart._vars.fontSize);

                if (chart._vars.toggleStack && chart._vars.displayValuesStackTotal) {
                    let stackCounter = 0;
                    svg.append('g')
                        .attr('class', 'displayStackTotal')
                        .selectAll('g')
                        .data(data)
                        .enter()
                        .append('g')
                        .attr('transform', (d, i) => {
                            let translate = (x.paddingOuter() * x.step()) + (x.step() * i);
                            return 'translate(' + translate + ',0)';
                        })
                        .selectAll('text')
                        .data(d => d)
                        .enter()
                        .append('text')
                        .attr('x', (d, i, j) => { // sets the x position of the bar)
                            return Math.round((posCalc.x(d, i, j) + (posCalc.width(d, i, j) / 2)));
                        })
                        .attr('y', (d, i, j) => { // sets the y position of the bar
                            return Math.round(posCalc.y(d, i, j)) - 18;// + posCalc.height(d, i, j) - 5);
                        })
                        .attr('text-anchor', 'middle')
                        .attr('fill', chart._vars.fontColor)
                        .text((d, i, j) => {
                            let yLength = chart.currentData.yAxisData.values.length,
                                xLength = chart.currentData.xAxisData.values.length,
                                indexMax = yLength / xLength,
                                stack = 0;
                            if ((i + 1) === indexMax) {
                                for (let k = 0; k < indexMax; k++) {
                                    stack += chart.currentData.yAxisData.values[indexMax * stackCounter + k];
                                }
                                stackCounter++;
                                return jvCharts.jvFormatValue(stack);
                            }
                            return '';
                        })
                        .attr('font-size', chart._vars.fontSize);
                }
            }
        } else {
            svg.selectAll('.displayValueContainer').remove();
        }
    }

    drawGridlines(axisData) {
        let chart = this,
            scaleData;

        chart.svg.selectAll('g.gridLines').remove();
        chart.svg.append('g')
            .attr('class', 'gridLines');

        // Determine if gridlines are horizontal or vertical based on rotateAxis
        if (chart._vars.rotateAxis === true || chart.config.type === 'gantt' || chart.config.type === 'singleaxis') {
            let gridLineHeight = chart.config.container.height,
                xAxisScale = jvCharts.getAxisScale('x', axisData, chart.config.container, chart._vars);

            if (axisData.dataType === 'STRING') {
                scaleData = axisData.values;
            } else if (axisData.dataType === 'NUMBER' || axisData.dataType === 'DATE') {
                scaleData = xAxisScale.ticks(10);
            }

            chart.svg.select('.gridLines').selectAll('.horizontalGrid')
                .data(scaleData)
                .enter()
                .append('line')
                .attr('class', 'horizontalGrid')
                .attr('x1', (d, i) => i > 0 ? xAxisScale(d) : 0)
                .attr('x2', (d, i) => i > 0 ? xAxisScale(d) : 0)
                .attr('y1', 0)
                .attr('y2', (d, i) => i > 0 ? gridLineHeight : 0)
                .attr('fill', 'none')
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke', chart._vars.axisColor)
                .attr('stroke-width', chart._vars.gridLineStrokeWidth);
        } else {
            let gridLineWidth = chart.config.container.width,
                yAxisScale = jvCharts.getAxisScale('y', axisData, chart.config.container, chart._vars);

            if (axisData.dataType === 'STRING') {
                scaleData = axisData.values;
            } else if (axisData.dataType === 'NUMBER' || axisData.dataType === 'DATE') {
                scaleData = yAxisScale.ticks(10);
            }

            chart.svg.select('.gridLines').selectAll('.horizontalGrid').data(scaleData).enter()
                .append('line')
                .attr('class', 'horizontalGrid')
                .attr('x1', 0)
                .attr('x2', (d, i) => i > 0 ? gridLineWidth : 0)
                .attr('y1', (d, i) => i > 0 ? yAxisScale(d) : 0)
                .attr('y2', (d, i) => i > 0 ? yAxisScale(d) : 0)
                .attr('fill', 'none')
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke', chart._vars.axisColor)
                .attr('stroke-width', chart._vars.gridLineStrokeWidth);
        }
    }

    /** getBarDataFromOptions
    * ^^ not just a bar function, line and area also use it
    *
    * Assigns the correct chart data to current data using the chart.options
    */
    getBarDataFromOptions() {
        let chart = this,
            dataObj = {},
            data = chart.data;

        // set flipped data if necessary
        if (chart._vars.seriesFlipped) {
            data = chart.flippedData;
        }

        dataObj.chartData = data.chartData;
        dataObj.legendData = data.legendData;
        dataObj.dataTable = data.dataTable;
        chart._vars.color = data.color;
        if (chart._vars.rotateAxis === true) {
            dataObj.xAxisData = data.yAxisData;
            dataObj.yAxisData = data.xAxisData;
        } else {
            dataObj.xAxisData = data.xAxisData;
            dataObj.yAxisData = data.yAxisData;
        }

        return dataObj;
    }

    /** ********************************************** Utility functions ******************************************************/

    /** highlightItems
     *
     * highlights items on the svg element
     * @params items, svg
     * @returns {{}}
     */
    highlightItem(items, tag, highlightIndex, highlightUri) {
        let chart = this,
            svg = chart.svg;

        // TODO remove if statements
        if (highlightIndex >= 0) {
            if (chart.config.type === 'pie') {
                // set all circles stroke width to 0
                svg.select('.pie-container').selectAll(tag)
                    .attr('stroke', chart._vars.pieBorder)
                    .attr('stroke-width', 1);
                // highlight necessary pie slices
                svg.select('.pie-container')
                    .selectAll(tag)
                    .filter('.highlight-class-' + highlightIndex)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
            if (chart.config.type === 'scatterplot') {
                // set all circles stroke width to 0
                svg.select('.scatter-container').selectAll(tag)
                    .attr('stroke-width', 0);
                // highlight necessary scatter dots
                svg.select('.scatter-container').selectAll(tag).filter('.scatter-circle-' + highlightIndex)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
        } else if (highlightUri) {
            if (chart.config.type === 'bar') {
                // set all bars stroke width to 0
                svg.select('.bar-container').selectAll(tag)
                    .attr('stroke', 0)
                    .attr('stroke-width', 0);
                // highlight necessary bars
                svg.select('.bar-container').selectAll('.highlight-class-' + highlightUri)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
            if (chart.config.type === 'line' || chart.config.type === 'area') {
                // set all circles stroke width to 0
                svg.select('.line-container').selectAll(tag)
                    .attr('stroke', 0)
                    .attr('stroke-width', 0);
                // highlight necessary cirlces
                svg.select('.line-container').selectAll(tag).filter('.highlight-class-' + highlightUri)
                    .attr('stroke', chart._vars.highlightBorderColor)
                    .attr('stroke-width', chart._vars.highlightBorderWidth);
            }
        } else {
            console.log('need to pass highlight index to highlight item');
        }
    }

    /**
    *@desc Removes highlights that were applied with related insights
    *
    */
    removeHighlight() {
        let chart = this,
            svg = chart.svg;
        if (chart.config.type === 'pie') {
            // set all circles stroke width to 0
            svg.select('.pie-container').selectAll('path')
                .attr('stroke', chart._vars.pieBorder)
                .attr('stroke-width', 0);
        }
        if (chart.config.type === 'scatterplot') {
            svg.select('.scatter-container').selectAll('circle')
                .attr('stroke-width', 0);
        }
        if (chart.config.type === 'bar') {
            svg.select('.bar-container').selectAll('rect')
                .attr('stroke', 0)
                .attr('stroke-width', 0);
        }
        if (chart.config.type === 'line' || chart.config.type === 'area') {
            svg.select('.line-container').selectAll('circle')
                .attr('stroke', 0)
                .attr('stroke-width', 0);
        }
    }

    static getViewForValue(input) {
        return String(input).replace(/\s/g, '_')
            .replace(/\./g, '__period__')
            .replace(/:/g, '__colon__')
            .replace(/~/g, '__tilde__')
            .replace(/!/g, '__exclamation__')
            .replace(/@/g, '__atsign__')
            .replace(/#/g, '__numbersign__')
            .replace(/\$/g, '__dollarsign__')
            .replace(/%/g, '__percentsign__')
            .replace(/\^/g, '__caret__')
            .replace(/&/g, '__ampersand__')
            .replace(/\*/g, '__asterisk__')
            .replace(/\(/g, '__openparentheses__')
            .replace(/\)/g, '__closeparentheses__')
            .replace(/;/g, '__semicolon__')
            .replace(/'/g, '__apostrophe__')
            .replace(/"/g, '__quote__')
            .replace(/\?/g, '__questionmark__')
            .replace(/</g, '__lessthansign__')
            .replace(/>/g, '__greaterthansign__')
            .replace(/\[/g, '__openbracket__')
            .replace(/]/g, '__closebracket__')
            .replace(/\\/g, '__backslash__')
            .replace(/\//g, '__forwardslash__')
            .replace(/{/g, '__opencurlybrace__')
            .replace(/}/g, '__closecurlybrace__')
            .replace(/\|/g, '__pipe__')
            .replace(/`/g, '__grave__')
            .replace(/\+/g, '__plussign__')
            .replace(/\=/g, '__equalssign__')
            .replace(/,/g, '__comma__');
    }

    static getRawForValue(input) {
        return String(input)
            .replace(/__period__/g, '.')
            .replace(/__colon__/g, ':')
            .replace(/__tilde__/g, '~')
            .replace(/__exclamation__/g, '!')
            .replace(/__atsign__/g, '@')
            .replace(/__numbersign__/g, '#')
            .replace(/__dollarsign__/g, '$')
            .replace(/__percentsign__/g, '%')
            .replace(/__caret__/g, '^')
            .replace(/__ampersand__/g, '&')
            .replace(/__asterisk__/g, '*')
            .replace(/__openparentheses__/g, '(')
            .replace(/__closeparentheses__/g, ')')
            .replace(/__semicolon__/g, ';')
            .replace(/__apostrophe__/g, "'")
            .replace(/__quote__/g, '"')
            .replace(/__questionmark__/g, '?')
            .replace(/__lessthansign__/g, '<')
            .replace(/__greaterthansign__/g, '>')
            .replace(/__openbracket__/g, '[')
            .replace(/__closebracket__/g, ']')
            .replace(/__backslash__/g, '\\')
            .replace(/__forwardslash__/g, '/')
            .replace(/__opencurlybrace__/g, '{')
            .replace(/__closecurlybrace__/g, '}')
            .replace(/__pipe__/g, '|')
            .replace(/__grave__/g, '`')
            .replace(/__plussign__/g, '+')
            .replace(/__equalssign__/g, '=')
            .replace(/__comma__/g, ',');
    }

    static applyDefaultFormat(val, formatType) {
        let formatNumber = d3.format('.0f');

        if (formatType === 'billions') {
            return formatNumber(val / 1e9) + 'B';
        } else if (formatType === 'millions') {
            return formatNumber(val / 1e6) + 'M';
        } else if (formatType === 'thousands') {
            return formatNumber(val / 1e3) + 'K';
        } else if (formatType === 'decimals') {
            formatNumber = d3.format('.2f');
            return formatNumber(val);
        } else if (formatType === 'nodecimals') {
            return formatNumber(val);
        } else if (formatType === 'percent') {
            let p = Math.max(0, d3.precisionFixed(0.05) - 2),
                expression = d3.format('.' + p + '%');
            return expression(val);
        } else if (formatType === '') {
            return val;
        }

        if (val === 0) {
            return 0;
        }

        if (Math.abs(val) >= 1000000000) {
            // Billions
            return formatNumber(val / 1e9) + 'B';
        } else if (Math.abs(val) >= 1000000) {
            // Millions
            return formatNumber(val / 1e6) + 'M';
        } else if (Math.abs(val) >= 1000) {
            // Thousands
            return formatNumber(val / 1e3) + 'K';
        } else if (Math.abs(val) <= 10) {
            // 2 decimals
            formatNumber = d3.format('.2f');
        }
        return formatNumber(val);
    }

    static jvFormatValue(val, formatType, axisData, chart) {
        if (chart && chart.config.options.formatDataValues) {
            let formats = chart.config.options.formatDataValues.formats,
                config;
            for (let i = 0; i < formats.length; i++) {
                if (formats[i].dimension === axisData.label.replace(/ /g, '_')) {
                    config = formats[i];
                    break;
                }
            }
            if (config) {
                return visualizationUniversal.formatValue(val, config);
            }
            return this.applyDefaultFormat(val, formatType);
        } else if (axisData && axisData.additionalDataType && chart) {
            return visualizationUniversal.formatValue(val, axisData.additionalDataType);
        } else if (!isNaN(val)) {
            return this.applyDefaultFormat(val, formatType);
        }
        return val;
    }

    /**
     * @name jvFormatValueType
     * @desc
     * @param {any} valueArray set of values that you want to format uniformly
     * @param {string} dataType the type of the data
     * @return {string} '' the level of formatting for the group of data
     * Problem with jvFormatValue function is that if you pass in values 10, 20... 90, 100, 1120, 120
     * you will get the formats 10.00, 20.00 .... 100, 110, 120 when you want 10, 20, ... 100, 110
     * --Format the value based off of the highest number in the group
     */
    static jvFormatValueType(valueArray, dataType) {
        if (valueArray != null && dataType !== 'STRING') {
            let max = Math.max.apply(null, valueArray),
                // After getting the max, check the min
                min = Math.min.apply(null, valueArray),
                range = max - min,
                incrememnt = Math.abs(Math.round(range / 10));// 10 being the number of axis labels to show

            if (Math.abs(incrememnt) >= 1000000000) {
                return 'billions';
            } else if (Math.abs(incrememnt) >= 1000000) {
                return 'millions';
            } else if (Math.abs(incrememnt) >= 1000) {
                return 'thousands';
            } else if (Math.abs(incrememnt) <= 10) {
                return 'decimals';
            } else if (Math.abs(incrememnt) >= 10) {
                return 'nodecimals';
            }
        }
        return '';
    }

    /** getFormatExpression
     *
     * @desc returns the d3 format expression for a given option
     * @params option
     * @returns string expression
     */
    static getFormatExpression(option) {
        let expression = '',
            p;
        if (option === 'currency') {
            expression = d3.format('$,');
        }
        if (option === 'fixedCurrency') {
            expression = d3.format('($.2f');
        }
        if (option === 'percent') {
            p = Math.max(0, d3.precisionFixed(0.05) - 2);
            expression = d3.format('.' + p + '%');
        }
        if (option === 'millions') {
            p = d3.precisionPrefix(1e5, 1.3e6);
            expression = d3.formatPrefix('.' + p, 1.3e6);
        }
        if (option === 'commas') {
            expression = d3.format(',.0f');
        }
        if (option === 'none' || option === '') {
            expression = d3.format('');
        }
        if (option === 'displayValues') {
            expression = d3.format(',.2f');
        }

        return expression;
    }

    /** getToggledData
     *
     * Gets the headers of the data to be drawn and filters the data based on that
     * @params chartData, dataHeaders
     */
    static getToggledData(data, dataHeaders) {
        let legendToggleArray = this.getLegendElementToggleArray(dataHeaders, data.legendData),
            newData = JSON.parse(JSON.stringify(data.chartData));
        if (legendToggleArray) {
            for (let i = 0; i < data.chartData.length; i++) {
                for (let toggleKey of legendToggleArray) {
                    if (toggleKey.toggle === false) {
                        delete newData[i][toggleKey.element];
                    }
                }
            }
        }
        return newData;
    }

    /**
     * @name getLegendElementToggleArray
     * @desc Gets an array of legend elements with true/false tags for if toggled
     * @param {any} selectedHeaders - headers selected by user
     * @param {any} allHeaders - all available headers in the visual
     * @returns {array} - array of legend elements
     */
    static getLegendElementToggleArray(selectedHeaders, allHeaders) {
        let legendToggleArray = [];
        for (let header of allHeaders) {
            legendToggleArray.push({ element: header });
        }

        for (let toggleKey of legendToggleArray) {
            for (let header of selectedHeaders) {
                if (toggleKey.element === header) {
                    toggleKey.toggle = true;
                    continue;
                }
            }
            if (toggleKey.toggle !== true) {
                toggleKey.toggle = false;
            }
        }
        return legendToggleArray;
    }

    /**
     * generateLegendElements
     *
     * @param {any} chart - chart object
     * @param {any} legendData -legend data for visual
     * @param {any} drawFunc - redraw function for visual
     * @returns {object} - legend rectangles
     */
    static generateLegendElements(chart, legendData, drawFunc) {
        let svg = chart.svg,
            container = chart.config.container,
            legend,
            legendRow = 0,
            legendColumn = 0,
            legendDataLength = legendData.length,
            legendElementToggleArray,
            legendRectangles,
            legendText;

        if (!chart._vars.legendIndex) {
            chart._vars.legendIndex = 0;
        }

        if (!chart._vars.legendIndexMax) {
            chart._vars.legendIndexMax = Math.floor(legendDataLength / chart._vars.legendMax - 0.01);
        }

        // if legend headers don't exist, set them equal to legend data
        if (!chart._vars.legendHeaders && !chart._vars.seriesFlipped) {
            chart._vars.legendHeaders = JSON.parse(JSON.stringify(legendData));
        } else if (!chart._vars.flippedLegendHeaders && chart._vars.seriesFlipped) {
            chart._vars.flippedLegendHeaders = JSON.parse(JSON.stringify(legendData));
        }
        // Set legend element toggle array based on if series is flipped
        if (!chart._vars.seriesFlipped) {
            legendElementToggleArray = this.getLegendElementToggleArray(chart._vars.legendHeaders, legendData);
        } else {
            legendElementToggleArray = this.getLegendElementToggleArray(chart._vars.flippedLegendHeaders, legendData);
        }

        legend = svg.append('g')
            .attr('class', 'legend');

        // Adding colored rectangles to the legend
        legendRectangles = legend.selectAll('rect')
            .data(legendData)
            .enter()
            .append('rect')
            .attr('class', 'legendRect')
            .attr('x', (d, i) => {
                let legendPos;
                if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                    legendColumn = 0;
                }
                legendPos = 200 * legendColumn;
                legendColumn++;
                return legendPos;
            })
            .attr('y', (d, i) => {
                if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                    legendRow++;
                }
                if (i % chart._vars.legendMax === 0 && i > 0) {
                    legendRow = 0;
                }
                return (container.height + 10) + (15 * (legendRow + 1)) - 5; // Increment row when column limit is reached
            })
            .attr('width', chart._vars.gridSize)
            .attr('height', chart._vars.gridSize)
            .attr('fill', (d, i) => this.getColors(chart._vars.color, i, legendData[i]))
            .attr('display', (d, i) => {
                if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                    return 'all';
                }
                return 'none';
            })
            .attr('opacity', (d, i) => {
                if (!legendElementToggleArray) {
                    return '1';
                }
                if (legendElementToggleArray[i].toggle === true) {
                    return '1';
                }
                return '0.2';
            });

        legendRow = 0;
        legendColumn = 0;

        // Adding text labels for each rectangle in legend
        legendText = legend.selectAll('text')
            .data(legendData)
            .enter()
            .append('text')
            .attr('class', (d, i) => 'legendText editable editable-text editable-content editable-legend-' + i)
            .attr('x', (d, i) => {
                if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                    legendColumn = 0;
                }
                let legendPos = 200 * legendColumn;
                legendColumn++;
                return legendPos + 17;
            })
            .attr('y', (d, i) => {
                if (i % (chart._vars.legendMax / 3) === 0 && i > 0) {
                    legendRow++;
                }
                if (i % chart._vars.legendMax === 0 && i > 0) {
                    legendRow = 0;
                }
                return (container.height + 10) + (15 * (legendRow + 1)); // Increment row when column limit is reached
            })
            .attr('text-anchor', 'start')
            .attr('dy', '0.35em') // Vertically align with node
            .attr('fill', chart._vars.fontColor)
            .attr('font-size', chart._vars.fontSize)
            .attr('display', (d, i) => {
                if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                    return 'all';
                }
                return 'none';
            })
            .text((d, i) => {
                let elementName = legendData[i];

                if (elementName.length > 30) {
                    return elementName.substring(0, 29) + '...';
                }
                return elementName;
            });

        // Adding info box to legend elements when hovering over
        legendText
            .data(legendData)
            .append('svg:title')
            .text(d => d);


        // Only create carousel if the number of elements exceeds one legend "page"
        if (chart._vars.legendIndexMax > 0) {
            this.createCarousel(chart, legendData, drawFunc);
        }
        // Centers the legend in the panel
        if (legend) {
            let legendWidth = legend.node().getBBox().width;
            legend.attr('transform', 'translate(' + ((container.width - legendWidth) / 2) + ', 30)');
        }

        return legendRectangles;
    }

    /** updateDataFromLegend
     *
     * Returns a list of data headers that should be displayed in viz
     * based off what is toggled on/off in legend
     * @params legendData
     */
    static updateDataFromLegend(legendData) {
        let data = [],
            legendElement = legendData[0];
        for (let ele of legendElement) {
            if (ele.attributes.opacity.value !== '0.2') {
                // If not white, add it to the updated data array
                data.push(ele.__data__);
            }
        }
        return data;
    }

    /** createCarousel
     *
     * Draws the horizontal legend carousel
     * @params chart, legendData, drawFunc
     */
    static createCarousel(chart, legendData, drawFunc) {
        let svg = chart.svg,
            container = chart.config.container,
            legendPolygon;

        // Adding carousel to legend
        svg.selectAll('.legend-carousel').remove();
        svg.selectAll('#legend-text-index').remove();

        legendPolygon = svg.append('g')
            .attr('class', 'legend-carousel');

        // Creates left navigation arrow for carousel
        legendPolygon.append('polygon')
            .attr('id', 'leftChevron')
            .attr('class', 'pointer-cursor')
            .style('fill', chart._vars.legendArrowColor)
            .attr('transform', 'translate(0,0)')
            .attr('points', '0,7.5, 15,0, 15,15')
            .on('click', () => {
                if (chart._vars.legendIndex >= 1) {
                    chart._vars.legendIndex--;
                }
                svg.selectAll('.legend').remove();
                let legendElements = this.generateLegendElements(chart, legendData, drawFunc);
                this.attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            })
            .attr({
                display: () => {
                    if (chart._vars.legendIndex === 0) {
                        return 'none';
                    }
                    return 'all';
                }
            });

        // Creates page number for carousel navigation
        legendPolygon.append('text')
            .attr('id', 'legend-text-index')
            .attr('x', 35)
            .attr('y', 12.5)
            .style('text-anchor', 'start')
            .style('font-size', chart._vars.fontSize)
            .text(() => (chart._vars.legendIndex + 1) + ' / ' + (chart._vars.legendIndexMax + 1))
            .attr({
                display: () => {
                    if (chart._vars.legendIndexMax === 0) {
                        return 'none';
                    }
                    return 'all';
                }
            });

        // Creates right navigation arrow for carousel
        legendPolygon.append('polygon')
            .attr('id', 'rightChevron')
            .attr('class', 'pointer-cursor')
            .style('fill', chart._vars.legendArrowColor)
            .attr('transform', 'translate(85,0)')
            .attr('points', '15,7.5, 0,0, 0,15')
            .on('click', () => {
                if (chart._vars.legendIndex < chart._vars.legendIndexMax) {
                    chart._vars.legendIndex++;
                }
                svg.selectAll('.legend').remove();
                let legendElements = this.generateLegendElements(chart, legendData, drawFunc);
                this.attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            })
            .attr({
                display: () => {
                    if (chart._vars.legendIndex === chart._vars.legendIndexMax) {
                        return 'none';
                    }
                    return 'all';
                }
            });

        // Centers the legend polygons in the panel
        if (legendPolygon) {
            let legendPolygonWidth = legendPolygon.node().getBBox().width;
            legendPolygon.attr('transform', 'translate(' + ((container.width - legendPolygonWidth) / 2) + ',' + (container.height + 105) + ')');
        }
    }


    /** getPlotData
     *
     * Returns only data values to be plotted; input is the data object
     * @params objectData, chart
     */
    static getPlotData(objectData, chart) {
        let data = [],
            objDataNew = JSON.parse(JSON.stringify(objectData));// Copy of barData
        for (let objEle of objDataNew) {
            let group = [];
            for (let legendEle of chart.currentData.legendData) {
                if (typeof objEle[legendEle] !== 'undefined') {
                    group.push(objEle[legendEle]);
                }
            }
            data.push(group);
        }
        return data;
    }

    /** getPosCalculations
     *Holds the logic for positioning all bars on a bar chart (depends on toolData)
     *
     * @params svg, chartData, options, xAxisData, yAxisData, container
     * @returns {{}}
     */
    static getPosCalculations(chartData, _vars, xAxisData, yAxisData, container, chart) {
        let x = jvCharts.getAxisScale('x', xAxisData, container, _vars),
            y = jvCharts.getAxisScale('y', yAxisData, container, _vars),
            scaleFactor = 1,
            data = [],
            size = 0,
            positionFunctions = {};

        for (let item in chart.currentData.dataTable) {
            if (item !== 'label' && item.indexOf('tooltip') === -1) {
                size++;
            }
        }

        for (let chartEle of chartData) {
            let val = [];
            for (let key in chartEle) {
                if (chartEle.hasOwnProperty(key)) {
                    val.push(chartEle[key]);
                }
            }
            data.push(val.slice(1, chartEle.length));
        }

        if (_vars.rotateAxis === true && _vars.toggleStack === true) {
            positionFunctions.startx = () => 0;
            positionFunctions.starty = () => 0;
            positionFunctions.startwidth = () => 0;
            positionFunctions.startheight = () => y.bandwidth() * 0.95;
            positionFunctions.x = (d, i, j) => {
                let increment = 0;// Move the x up by the values that come before it
                for (let k = i - 1; k >= 0; k--) {
                    if (!isNaN(j[k].__data__)) {
                        increment += j[k].__data__;
                    }
                }
                return x(increment) === 0 ? 1 : x(increment);
            };
            positionFunctions.y = () => 0;
            positionFunctions.width = d => Math.abs(x(0) - x(d));
            positionFunctions.height = () => y.bandwidth() * 0.95;
        } else if (_vars.rotateAxis === true && _vars.toggleStack === false) {
            positionFunctions.startx = () => 0;
            positionFunctions.starty = (d, i) => y.bandwidth() / size * i;
            positionFunctions.startwidth = () => 0;
            positionFunctions.startheight = () => (y.bandwidth() / size * 0.95) * scaleFactor;
            positionFunctions.x = d => x(0) - x(d) > 0 ? x(d) : x(0);
            positionFunctions.y = (d, i) => y.bandwidth() / size * i;
            positionFunctions.width = d => Math.abs(x(0) - x(d));
            positionFunctions.height = () => (y.bandwidth() / size * 0.95) * scaleFactor;
        } else if (_vars.rotateAxis === false && _vars.toggleStack === true) {
            positionFunctions.startx = () => 0;
            positionFunctions.starty = () => container.height;
            positionFunctions.startwidth = () => (x.bandwidth() * 0.95) * scaleFactor;
            positionFunctions.startheight = () => 0;
            positionFunctions.x = () => 0;
            positionFunctions.y = (d, i, j) => {
                let increment = 0;// Move the y up by the values that come before it
                for (let k = i - 1; k >= 0; k--) {
                    if (!isNaN(j[k].__data__)) {
                        increment += j[k].__data__;
                    }
                }
                return y(parseFloat(d) + increment);
            };
            positionFunctions.width = () => (x.bandwidth() * 0.95) * scaleFactor;
            positionFunctions.height = d => container.height - y(d);
        } else if (_vars.rotateAxis === false && _vars.toggleStack === false) {
            positionFunctions.startx = (d, i) => x.bandwidth() / size * i;
            positionFunctions.starty = () => container.height;
            positionFunctions.startwidth = () => x.bandwidth() / size * 0.95;
            positionFunctions.startheight = () => 0;
            positionFunctions.x = (d, i) => x.bandwidth() / size * i;
            positionFunctions.y = d => y(0) - y(d) > 0 ? y(d) : y(0);
            positionFunctions.width = () => x.bandwidth() / size * 0.95;
            positionFunctions.height = d => Math.abs(y(0) - y(d));
        }
        return positionFunctions;
    }

    /** getColors
     *
     * gets the colors to apply to the specific chart
     * @params colorObj, index, label
     * @returns {{}}
     */
    static getColors(colorObj, paramIndex, label) {
        let index = paramIndex,
            cleanedColors;

        // logic to return the color if the colorObj passed in
        // is an object with the label being the key
        if (typeof label !== 'undefined' && colorObj.hasOwnProperty(label) && colorObj[label]) {
            return colorObj[label];
        }

        if (!Array.isArray(colorObj)) {
            cleanedColors = [];
            for (let k in colorObj) {
                if (colorObj.hasOwnProperty(k)) {
                    if (colorObj[k]) {
                        cleanedColors.push(colorObj[k]);
                    }
                }
            }
        } else {
            cleanedColors = colorObj;
        }

        // logic to return a repeating set of colors assuming that
        // the user changed data (ex: flip series on bar chart)
        if (!cleanedColors[index]) {
            while (index > cleanedColors.length - 1) {
                index = index - cleanedColors.length;
            }
        }
        return cleanedColors[index];
    }

    /**
     * @name hextToRGB
     * @param {string} hex The hex input for a color
     * @return {Object} Object containing the corresponding rgb values for our hex input
     */
    static hexToRGB(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
            result;

        hex = hex.replace(shorthandRegex, (m, r, g, b) => {
            return r + r + g + g + b + b;
        });

        // Break down to rgb vals
        result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * @name colorByValue
     * @param {object} d  data of current point
     * @param {object} colorByValue uiOptions colorByValue
     * @param {string} type type of visualization
     * @param {object} chartData Semoss chartData
     * @return {string} color, false if error 
     */
    static colorByValue(d, colorByValue, type, chartData) {
        let color = false, pack = type === 'pack' ? true : false, selected;

        colorByValue.forEach(rule => {
            const cleanCol = rule.colorOn.replace(/_/g, ' ');
            if (pack) {// if pack need to modify d to get correct values
                if (d.depth !== 0) { // not the root
                    if (d.depth === 1) {
                        selected = chartData.dataTable.group;
                    } else {
                        selected = chartData.dataTable['group ' + (d.depth - 1)];
                    }

                    selected = selected.replace(/_/g, ' ');

                    let dataType;
                    for (let i = 0; i < chartData.dataTableKeys.length; i++) {
                        if (selected.replace(/ /g, '_') === chartData.dataTableKeys[i].name) {
                            dataType = chartData.dataTableKeys[i].type;
                            break;
                        }
                    }
                    if (dataType === 'NUMBER' || dataType === 'INT' || dataType === 'DOUBLE') {
                        d.data[selected] = Number(d.data.name);
                    } else {
                        d.data[selected] = d.data.name;
                    }
                }
            }
            for (let i = 0; i < rule.valuesToColor.length; i++) {
                let valueToColor = rule.valuesToColor[i],
                    valueToCheck = d.data[cleanCol];

                if (typeof valueToCheck === 'string') {
                    valueToCheck = valueToCheck.replace(/_/g, ' ');
                }

                if (typeof valueToColor === 'string') {
                    valueToColor = valueToColor.replace(/_/g, ' ');
                }

                if (valueToColor === valueToCheck) {
                    color = rule.color;
                }
            }
        });

        return color;
    }


    static getAxisScale(whichAxis, axisData, container, _vars, paddingType) {
        let leftPadding = 0.4,
            rightPadding = 0.2,
            axisScale,
            axis,
            minDate,
            maxDate;

        if (paddingType === 'no-padding') {
            leftPadding = 0;
            rightPadding = 0;
        }

        whichAxis === 'x' ? axis = container.width : axis = container.height;

        if (axisData.dataType === 'DATE') {
            for (let i = 0; i < axisData.values.length; i++) {
                axisData.values[i] = new Date(axisData.values[i]);
            }

            maxDate = Math.max.apply(null, axisData.values);
            minDate = Math.min.apply(null, axisData.values);

            axisScale = d3.scaleTime().domain([new Date(minDate), new Date(maxDate)]).rangeRound([0, axis]);
        } else if (axisData.dataType === 'STRING') {
            axisScale = d3.scaleBand()
                .domain(axisData.values)
                .range([0, axis])
                .paddingInner(leftPadding)
                .paddingOuter(rightPadding);
        } else if (axisData.dataType === 'NUMBER') {
            let domain;
            if (_vars.xReversed || _vars.yReversed) {
                if ((_vars.xReversed && whichAxis === 'x') || (whichAxis === 'y' && !_vars.yReversed)) {
                    domain = [axisData.max, axisData.min];
                }
                if ((_vars.yReversed && whichAxis === 'y') || (whichAxis === 'x' && !_vars.xReversed)) {
                    domain = [axisData.min, axisData.max];
                }
            } else {
                whichAxis === 'x' ? domain = [axisData.min, axisData.max] : domain = [axisData.max, axisData.min];
            }

            if (_vars.hasOwnProperty('axisType') && _vars.axisType === 'Logarithmic') {
                domain[1] = 0.1;
                axisScale = d3.scaleLog().base(10).domain(domain).rangeRound([0, axis]);
            } else {
                axisScale = d3.scaleLinear().domain(domain).rangeRound([0, axis]);
            }
        } else {
            console.error('Axis is not a valid data type');
            // throw new Error('Axis is not a valid data type');
        }
        return axisScale;
    }

    /** ********************************************** Data functions ******************************************************/

    /**
     * @function
     * @param {string} label - The field that is checked for type
     * @param {Object} dataTableKeys - Object that contains the data type for each column of data
     */
    static getDataTypeFromKeys(label, dataTableKeys, defaultType = 'STRING') {
        let type = defaultType;

        for (let key of dataTableKeys) {
            // Replace underscores with spaces
            if (key.name.replace(/_/g, ' ') === label.replace(/_/g, ' ')) {
                if (key.hasOwnProperty('type')) {
                    type = (key.type + '').toUpperCase();
                    if (type === 'STRING') {
                        type = 'STRING';
                    } else if (type === 'DATE') {
                        type = 'DATE';
                    } else if (type === 'NUMBER') {
                        type = 'NUMBER';
                    } else {
                        type = 'NUMBER';
                    }
                    break;
                }
            }
        }
        return type;
    }

    /** setBarLineLegendData
     *  gets legend info from chart Data
     *
     * @params data, type
     * @returns [] of legend text
     */
    static setBarLineLegendData(data) {
        let legendArray = [];
        for (let item in data.dataTable) {
            if (data.dataTable.hasOwnProperty(item)) {
                if (item !== 'label') {
                    legendArray.push(data.dataTable[item]);
                }
            }
        }
        return legendArray;
    }

    /** setChartColors
     *  cleans incoming colors for consistency
     *
     * @params colorArray, legendData
     * @returns object with colors
     */

    static setChartColors(toolData, legendData, defaultColorArray) {
        // function handles 3 color inputs
        // toolData as an array in toolData
        // toolData as an object
        // toolData as 'none'
        // any other case will result in using defaultColorArray

        let colors = {},
            usedColors = [],
            unaccountedLegendElements = [],
            toolDataAsArray;

        // toolData is array
        if (Array.isArray(toolData)) {
            if (toolData.length > 0) {
                colors = this.createColorsWithDefault(legendData, toolData);
            } else {
                colors = this.createColorsWithDefault(legendData, defaultColorArray);
            }
        } else if (toolData === Object(toolData)) {
            for (let legendEle of legendData) {
                if (toolData.hasOwnProperty(legendEle)) {
                    usedColors.push(toolData[legendEle]);
                } else {
                    unaccountedLegendElements.push(legendEle);
                }
            }
            // check if object has desired keys
            if (usedColors.length === legendData.length) {
                colors = toolData;
            } else if (usedColors.length > 0) {
                toolDataAsArray = Object.values(toolData);
                if (toolDataAsArray.length > legendData.length) {
                    colors = this.createColorsWithDefault(legendData, toolDataAsArray);
                } else {
                    colors = this.createColorsWithDefault(legendData, defaultColorArray);
                }
            } else {
                toolDataAsArray = Object.values(toolData);
                if (toolDataAsArray.length > legendData.length) {
                    colors = this.createColorsWithDefault(legendData, toolDataAsArray);
                } else {
                    colors = this.createColorsWithDefault(legendData, defaultColorArray);
                }
            }
        } else {
            colors = this.createColorsWithDefault(legendData, defaultColorArray);
        }

        return colors;
    }

    static createColorsWithDefault(legendData, colors) {
        let mappedColors = {},
            count = 0;
        for (let legendEle of legendData) {
            if (count > colors.length - 1) {
                count = 0;
            }
            mappedColors[legendEle] = colors[count];
            count++;
        }
        return mappedColors;
    }

    /** cleanToolData
     *  cleans incoming toolData for consistency
     *
     * @param toolData
     * @returns object with tooldata
     */
    static cleanToolData(options = {}, editOptions = {}) {
        let data = options || {};

        if (!data.hasOwnProperty('rotateAxis')) {
            data.rotateAxis = false;
        }
        if (data.hasOwnProperty('toggleStack')) {
            if (data.toggleStack === 'stack-data' || data.toggleStack === true) {
                data.toggleStack = true;
            } else {
                data.toggleStack = false;
            }
        } else {
            data.toggleStack = false;
        }
        if (data.hasOwnProperty('colors')) {
            data.color = data.colors;
        }
        if (!data.hasOwnProperty('thresholds')) {
            data.thresholds = [];
        }

        // These are used in setting dynamic margins on the y Axis in jvCharts
        if (editOptions && editOptions.hasOwnProperty('yAxis') && editOptions.yAxis.hasOwnProperty('editable-text-size')) {
            data.yLabelFontSize = editOptions.yAxis['editable-text-size'];
            data.yLabelFormat = editOptions.yAxis['editable-num-format'];
        }
        return data;
    }

    static getMaxWidthForAxisData(axis, axisData, _vars, dimensions, margin, chartDiv) {
        let maxAxisText = '',
            formatType,
            dummySVG,
            axisDummy,
            width;
        // Dynamic left margin for charts with y axis
        if (_vars.rotateAxis) {
            // get length of longest text label and make the axis based off that
            let maxString = '',
                height = parseInt(dimensions.height, 10) - margin.top - margin.bottom;

            // check if labels should be shown
            if (height !== 0 && height / axisData.values.length < parseInt(_vars.fontSize, 10)) {
                axisData.hideValues = true;
            } else {
                for (let axisValue of axisData.values) {
                    let currentStr = axisValue.toString();
                    if (currentStr.length > maxString.length) {
                        maxString = currentStr;
                    }
                }
                maxAxisText = maxString;
            }
        } else if (!!_vars.yLabelFormat || !!_vars.xLabelFormat) {
            let labelFormat = _vars.yLabelFormat,
                expression;
            if (axis === 'x') {
                labelFormat = _vars.xLabelFormat;
            }

            formatType = this.jvFormatValueType(axisData.values);
            expression = this.getFormatExpression(labelFormat);

            if (expression !== '') {
                maxAxisText = expression(axisData.max);
            } else {
                maxAxisText = this.jvFormatValue(axisData.max);
            }
        } else {
            formatType = this.jvFormatValueType(axisData.values);
            if (!axisData.hasOwnProperty('max')) {
                let maxLength = 0;
                for (let axisValue of axisData.values) {
                    if (axisValue && axisValue.length > maxLength) {
                        maxLength = axisValue.length;
                        maxAxisText = axisValue;
                    }
                }
            } else {
                maxAxisText = this.jvFormatValue(axisData.max, formatType);
            }
        }

        // if (type === 'heatmap') {
        // //also need to check width of label
        // if (maxAxisText.length < axisData.label.length + 5) {
        // //need added space
        // if (axis === 'x') {
        // maxAxisText = axisData.label;
        // } else {
        // maxAxisText = axisData.label + 'Extra';
        // }
        // }
        // }

        // Create dummy svg to place max sized text element on
        dummySVG = chartDiv.append('svg').attr('class', 'dummy-svg');

        // Create dummy text element
        axisDummy = dummySVG
            .append('text')
            .attr('font-size', () => {
                if (axis === 'y' && _vars.yLabelFontSize !== 'none') {
                    return _vars.yLabelFontSize;
                }
                if (axis === 'x' && _vars.xLabelFontSize !== 'none') {
                    return _vars.xLabelFontSize;
                }
                return _vars.fontSize;
            })
            .attr('x', 0)
            .attr('y', 0)
            .text(maxAxisText);

        // Calculate the width of the dummy text
        width = axisDummy.node().getBBox().width;
        // Remove the svg and text element
        chartDiv.select('.dummy-svg').remove();
        return width;
    }

    static getDisplayValuesElement(object, dataTableAlign, type) {
        let valuesArray = [];

        if (type === 'bar' || type === 'pie' || type === 'line' || type === 'area') {
            for (let key in dataTableAlign) {
                if (dataTableAlign.hasOwnProperty(key)) {
                    if (key.indexOf('value') > -1) {
                        valuesArray.push(object[dataTableAlign[key]]);
                    }
                }
            }
        } else {
            for (let key in object) {
                if (object.hasOwnProperty(key)) {
                    valuesArray.push(object[key]);
                }
            }
        }
        return valuesArray;
    }

    /** getZScale
     *
     * gets the scale for the z axis
     * @params zAxisData, container, padding
     * @returns {{}}
     */
    static getZScale(zAxisData, container, _vars) {
        let zAxisScale = d3.scaleLinear()
            .domain([d3.min(zAxisData.values), d3.max(zAxisData.values)])
            .rangeRound([_vars.NODE_MIN_SIZE, _vars.NODE_MAX_SIZE])
            .nice();
        return zAxisScale;
    }

    /** 
     * @name generateEventGroups
     * @desc sets the tooltip data for bar and line/area
     * @param {*} chartContainer - svg
     * @param {*} barData - data for the bar
     * @param {*} chart - the chart info
     * @returns {*} eventGroups - the created svg
     */
    static generateEventGroups(chartContainer, barData, chart) {
        let container = chart.config.container,
            eventGroups;

        // Invisible rectangles on screen that represent bar groups. Used to show/hide tool tips on hover
        eventGroups = chartContainer
            .data(barData)
            .enter()
            .append('rect')
            .attr('class', 'event-rect')
            // sets the x position of the bar
            .attr('x', (d, i) => chart._vars.rotateAxis ? 0 : (container.width / barData.length * i))
            // sets the y position of the bar
            .attr('y', (d, i) => chart._vars.rotateAxis ? (container.height / barData.length * i) : 0)
            // sets the width position of the bar
            .attr('width', () => chart._vars.rotateAxis ? container.width : (container.width / barData.length))
            // sets the height position of the bar
            .attr('height', () => chart._vars.rotateAxis ? (container.height / barData.length) : container.height)
            .attr('fill', 'transparent')
            .attr('class', (d, i) => {
                let dataEle = jvCharts.getViewForValue(String(barData[i][chart.currentData.dataTable.label]));
                return 'event-rect editable-bar bar-col-' + dataEle;
            });

        return eventGroups;
    }

    static generateThresholdLegend(chart) {
        let svg = chart.svg,
            colorLegendData = [],
            gLegend,
            legend;
        if (chart._vars.thresholds !== 'none') {
            for (let j = 0; j < Object.keys(chart._vars.thresholds).length; j++) {
                colorLegendData.push(chart._vars.thresholds[j].thresholdName);
            }
        }

        gLegend = svg.append('g')
            .attr('class', 'thresholdLegendContainer');

        legend = gLegend.selectAll('.thresholdLegend')
            .data(colorLegendData)
            .enter()
            .append('g')
            .attr('class', 'thresholdLegend')
            .attr('transform', (d, i) => {
                let height = 19,
                    offset = 19 * colorLegendData.length / 2,
                    horz = -2 * 12,
                    vert = i * height - offset;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .style('fill', (d, i) => chart._vars.thresholds[i].thresholdColor);

        legend.append('text')
            .attr('x', 24)
            .attr('y', 8)
            .attr('font-size', '.75em')
            .text(d => d);

        // Centers the legend in the panel
        if (gLegend) {
            let legendWidth = gLegend.node().getBBox().width;
            gLegend.attr('transform', 'translate(' + (chart.config.container.width - legendWidth) + ',' + (10 * colorLegendData.length) + ')');
        }
    }

    static attachClickEventsToLegend(chart, legendElements, drawFunc) {
        // Adding the click event to legend rectangles for toggling on/off
        legendElements
            .on('click', function () {
                let selectedRect = d3.select(this),
                    dataHeaders;

                if (selectedRect._groups[0][0].attributes.opacity.value !== '0.2') {
                    selectedRect
                        .attr('opacity', '0.2');
                } else {
                    selectedRect
                        .attr('opacity', '1');
                }

                // Gets the headers of the data to be drawn
                dataHeaders = jvCharts.updateDataFromLegend(legendElements._groups);
                // Sets the legendData to the updated headers
                if (chart._vars.seriesFlipped) {
                    chart._vars.flippedLegendHeaders = dataHeaders;
                } else {
                    chart._vars.legendHeaders = dataHeaders;
                }

                // Plots the data
                chart._vars.transitionTime = 800;// Keep transition for toggling legend elements
                if (chart._vars.seriesFlipped) {
                    chart[drawFunc](chart.flippedData);
                } else {
                    chart[drawFunc](chart.data);
                }
                if (chart.applyEditMode) {
                    chart.applyEditMode();
                }
            });
    }

    /** generateVerticalLegendElements
     *
     * Creates the legend elements--rectangles and labels
     * @params chart, legendData, drawFunc
     */
    static generateVerticalLegendElements(chart, legendData, drawFunc) {
        let svg = chart.svg,
            legend,
            legendDataLength = legendData.length,
            legendElementToggleArray,
            legendRectangles,
            legendText,
            labelStyle = chart._vars.legend,
            fontColor = labelStyle.fontColor || '#000000',
            fontSize = labelStyle.fontSize || '12px',
            fontFamily = labelStyle.fontFamily || 'Inter',
            fontWeight = labelStyle.fontWeight || 400;

        chart._vars.gridSize = 20;

        if (!chart._vars.legendIndex) {
            chart._vars.legendIndex = 0;
        }

        if (!chart._vars.legendIndexMax) {
            chart._vars.legendIndexMax = Math.floor(legendDataLength / chart._vars.legendMax - 0.01);
        }

        // Check to see if legend element toggle array needs to be set
        if (!chart._vars.legendHeaders) {
            chart._vars.legendHeaders = JSON.parse(JSON.stringify(legendData));
        }

        legendElementToggleArray = this.getLegendElementToggleArray(chart._vars.legendHeaders, legendData);

        legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', 'translate(' + 18 + ',' + 20 + ')');

        // Adding colored rectangles to the legend
        legendRectangles = legend.selectAll('rect')
            .data(legendData)
            .enter()
            .append('rect')
            .attr('class', 'legendRect')
            .attr('x', '3')
            .attr('y', (d, i) => (chart._vars.gridSize) * (i % chart._vars.legendMax) * 1.1)
            .attr('width', chart._vars.gridSize)
            .attr('height', chart._vars.gridSize)
            .attr('fill', (d, i) => {
                if ((!legendElementToggleArray && !chart._vars.seriesFlipped) || (chart._vars.seriesFlipped && !legendElementToggleArray)) {
                    return this.getColors(chart._vars.color, i, legendData[i]);
                }
                if ((!chart._vars.seriesFlipped && legendElementToggleArray[i].toggle === true) ||
                    (chart._vars.seriesFlipped && legendElementToggleArray[i].toggle === true)) {
                    return this.getColors(chart._vars.color, i, legendData[i]);
                }
                return chart._vars.emptyLegendSquare;
            })
            .attr('display', (d, i) => {
                if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                    return 'all';
                }
                return 'none';
            })
            .attr('opacity', '1');

        // Adding text labels for each rectangle in legend
        legendText = legend.selectAll('text')
            .data(legendData)
            .enter()
            .append('text')
            .attr('class', (d, i) => 'legendText editable editable-text editable-content editable-legend-' + i)
            .attr('x', chart._vars.gridSize + 7)
            .attr('y', (d, i) => (chart._vars.gridSize) * (i % chart._vars.legendMax) * 1.1 + 10)
            .attr('text-anchor', 'start')
            .attr('dy', '0.35em') // Vertically align with node
            .style('fill', fontColor)
            .style('font-size', fontSize)
            .style('font-family', fontFamily)
            .style('font-weight', fontWeight)
            .attr('display', (d, i) => {
                if (i >= (chart._vars.legendIndex * chart._vars.legendMax) && i <= ((chart._vars.legendIndex * chart._vars.legendMax) + (chart._vars.legendMax - 1))) {
                    return 'all';
                }
                return 'none';
            })
            .text((d, i) => {
                let elementName = legendData[i];
                if (elementName.length > 20) {
                    return elementName.substring(0, 19) + '...';
                }
                return elementName;
            });

        // Adding info box to legend elements when hovering over
        legendText
            .data(legendData)
            .append('svg:title')
            .text(d => d);

        // Only create carousel if the number of elements exceeds one legend "page"
        if (chart._vars.legendIndexMax > 0) {
            this.createVerticalCarousel(chart, legendData, drawFunc);
        }

        return legendRectangles;
    }

    /** createVerticalCarousel
     *
     * Draws the vertical legend carousel
     * @params chart, legendData, drawFunc
     */
    static createVerticalCarousel(chart, legendData, drawFunc) {
        let svg = chart.svg,
            legendPolygon;

        // Adding carousel to legend
        svg.selectAll('.legend-carousel').remove();
        svg.selectAll('#legend-text-index').remove();

        legendPolygon = svg.append('g')
            .attr('class', 'legend-carousel');

        // Creates left navigation arrow for carousel
        legendPolygon.append('polygon')
            .attr('id', 'leftChevron')
            .attr('class', 'pointer-cursor')
            .style('fill', chart._vars.legendArrowColor)
            .attr('transform', 'translate(0,' + ((chart._vars.legendMax * chart._vars.gridSize) + 50) + ')')
            .attr('points', '0,7.5, 15,0, 15,15')
            .on('click', () => {
                if (chart._vars.legendIndex >= 1) {
                    chart._vars.legendIndex--;
                }
                svg.selectAll('.legend').remove();
                let legendElements = this.generateVerticalLegendElements(chart, legendData, drawFunc);
                this.attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            })
            .attr({
                display: () => {
                    if (chart._vars.legendIndex === 0) {
                        return 'none';
                    }
                    return 'all';
                }
            });

        // Creates page number for carousel navigation
        legendPolygon.append('text')
            .attr('id', 'legend-text-index')
            .attr('x', 35)
            .attr('y', 242.5)
            .style('text-anchor', 'start')
            .style('font-size', chart._vars.fontSize)
            .text(() => (chart._vars.legendIndex + 1) + ' / ' + (chart._vars.legendIndexMax + 1))
            .attr({
                display: () => {
                    if (chart._vars.legendIndexMax === 0) {
                        return 'none';
                    }
                    return 'all';
                }
            });

        // Creates right navigation arrow for carousel
        legendPolygon.append('polygon')
            .attr('id', 'rightChevron')
            .attr('class', 'pointer-cursor')
            .style('fill', chart._vars.legendArrowColor)
            .attr('transform', 'translate(85,' + ((chart._vars.legendMax * chart._vars.gridSize) + 50) + ')')
            .attr('points', '15,7.5, 0,0, 0,15')
            .on('click', () => {
                if (chart._vars.legendIndex < chart._vars.legendIndexMax) {
                    chart._vars.legendIndex++;
                }
                svg.selectAll('.legend').remove();
                let legendElements = this.generateVerticalLegendElements(chart, legendData, drawFunc);
                this.attachClickEventsToLegend(chart, legendElements, drawFunc, legendData);
            })
            .attr({
                display: () => {
                    if (chart._vars.legendIndex === chart._vars.legendIndexMax) {
                        return 'none';
                    }
                    return 'all';
                }
            });
    }

    /** convertTableToTree
     *
     * Converts table data to tree structure
     * @params data, dataTable, numericCheck
     */
    static convertTableToTree(data, dataTable, lastNodeAsValue) {
        var allHash = {},
            list = [],
            rootMap = {},
            currentMap = {},
            tableHeaders = [],
            count;
        if (dataTable) {
            for (let header in dataTable) {
                if (header !== 'value' && header.indexOf('tooltip') === -1) {
                    tableHeaders.push(dataTable[header]);
                }
            }
            if (dataTable.value) {
                tableHeaders.push(dataTable.value);
            }
        }

        for (let dataEle of data) { // all of this is to change it to a tree structure and then call makeTree to structure the data appropriately for this viz
            count = 0;
            for (let header of tableHeaders) {
                if (header !== '') {
                    if (!dataEle[header.replace(/[_]/g, ' ')]) {
                        dataEle[header.replace(/[_]/g, ' ')] = 'NULL_VALUE';
                    }
                    let currentValue = dataEle[header.replace(/[_]/g, ' ')].toString().replace(/["]/g, ''),
                        nextMap = {};

                    if (count === 0) { // will take care of the first level and put into rootmap if it doesnt already exist in rootmap
                        currentMap = rootMap[currentValue];
                        if (!currentMap) {
                            currentMap = {};
                            rootMap[currentValue] = currentMap;
                        }
                        nextMap = currentMap;
                        count++;
                    } else {
                        nextMap = currentMap[currentValue];
                        if (!nextMap) {
                            nextMap = {};
                            currentMap[currentValue] = nextMap;
                        }
                        currentMap = nextMap;
                    }
                }
            }
        }
        this.makeTree(rootMap, list, lastNodeAsValue, tableHeaders, 0);
        allHash.name = 'root';
        allHash.children = list;
        return allHash;
    }

    /** makeTree
     *
     * Recurive function to build tree
     * @params map, list, isNumeric
     */
    static makeTree(map, list, lastNodeAsValue, tableHeaders, level) {
        var childSet = [];
        for (let key in map) {
            if (map.hasOwnProperty(key)) {
                let childMap = map[key],
                    dataMap = {},
                    childExists = childMap && Object.getOwnPropertyNames(childMap).length > 0,
                    numericCheck = lastNodeAsValue && Object.keys(childMap).length === 1 && !isNaN(Object.keys(childMap)[0]);
                dataMap.name = key;
                dataMap.label = tableHeaders[level];
                if (!childExists || numericCheck) {
                    dataMap.value = Object.keys(childMap)[0];
                    list.push(dataMap);
                } else {
                    dataMap.children = childSet;
                    list.push(dataMap);
                    let nextLevel = level + 1;
                    this.makeTree(childMap, childSet, lastNodeAsValue, tableHeaders, nextLevel);
                    childSet = [];
                }
            }
        }
    }

    /** convertTableToTreemap
     *
     * Loop through data to organize into treemap form
     * @params data, dataTableAlgin
     */
    static convertTableToTreemap(data, dataTableAlign) {
        var addedHeaderMap = {},
            childrenArray = [],
            seriesIndex;

        for (let dataEle of data) {
            let series = dataEle[dataTableAlign.series];
            seriesIndex = addedHeaderMap[series];
            dataEle.Parent = series;
            if (seriesIndex) {
                childrenArray[seriesIndex].children.push(dataEle);
            } else {
                addedHeaderMap[series] = childrenArray.length;
                childrenArray.push({
                    [dataTableAlign.series]: series,
                    Parent: 'Top Level',
                    children: [dataEle]
                });
            }
        }

        return {
            [dataTableAlign.series]: 'Top Level',
            children: childrenArray
        };
    }
}

export default jvCharts;
