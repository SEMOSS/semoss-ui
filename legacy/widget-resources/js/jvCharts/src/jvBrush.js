/** *  jvBrush ***/
'use-strict';
import * as d3 from 'd3';
/** jv Brush Flow
*
*  1. create new jvBrush object with a config object containing the specific jvChart and an onBrushCallback
*  2. jvBrush exposes startBrush and removeBrush functions
*  3. if startBrush is called with a d3.event, brush will assume that a force click event should be fired at the location of the d3.event
*  4. if a d3.event is not given to startBrush(), a brush lisener will be added to the visual to listen for the user to brush
*  5. After the user finishs brushing an area of the chart, brushEnd() is calle.
*  6. brushEnd() will create a data object for the brushed area in the format:
*      {'label1': ['value1','value2']}
*      Example
*      {'Movie_Genre': ['Drama','Documentary','Action']}
*  7. brushEnd will then call the onBrushCallback function with the above data object
*  8. brushEnd will finally call the removeBrush() function
*/

/**
* @name jvBrush
* @desc Constructor for JV Brush - creates brush mode for a jv visualization and executes a callback for the visual to be filtered
* @param {object} configObj - constructor object containing the jvChart and other options
* @return {undefined} - no return
*/
export default class jvBrush {
    constructor(configObj) {
        var brushObj = this;
        brushObj.chartDiv = configObj.jvChart.chartDiv;
        brushObj.jvChart = configObj.jvChart;
        brushObj.onBrushCallback = configObj.onBrushCallback;
    }

    /**
    * @name removeBrush
    * @desc removes the brush area from the visual
    * @return {undefined} - no return
    */
    removeBrush() {
        let brushObj = this;
        brushObj.jvChart.chartDiv.selectAll('.brusharea').remove();
    }

    /**
    * @name startBrush
    * @desc removes the brush area from the visual
    * @param {object} event - optional event to start brush immediately with a new mousedown
    * @return {undefined} - no return
    */
    startBrush(event = false) {
        let brushObj = this,
            height = brushObj.jvChart.config.container.height,
            width = brushObj.jvChart.config.container.width,
            svg = brushObj.jvChart.svg;

        if (brushObj.jvChart.config.type === 'singleaxis') {
            brushObj.brushType = 'x';
            svg.append('g')
                .attr('class', 'brusharea')
                .style('height', height + 'px')
                .style('width', width + 'px')
                .call(d3.brushX()
                    .extent([[0, 0], [width, height]])
                    .on('end', brushObj.brushEnd.bind(brushObj)));
        } else if (brushObj.jvChart.config.type === 'clustergram') {
            brushObj.brushType = 'xy';
            svg.append('g')
                .attr('class', 'brusharea')
                .attr('transform', `translate(${brushObj.jvChart._vars.leftTreeWidth}, ${brushObj.jvChart._vars.topTreeHeight})`)
                .style('height', height + 'px')
                .style('width', width + 'px')
                .call(d3.brush()
                    .extent([[0, 0], [width, height]])
                    .on('end', brushObj.brushEnd.bind(brushObj)));
        } else {
            brushObj.brushType = 'xy';
            svg.append('g')
                .attr('class', 'brusharea')
                .style('height', height + 'px')
                .style('width', width + 'px')
                .call(d3.brush()
                    .extent([[0, 0], [width, height]])
                    .on('end', brushObj.brushEnd.bind(brushObj)));
        }

        if (event) {
            // dispatch mousedown to start a brush at the event coordinates
            let brushElement = svg.select('.brusharea').node(),
                newEvent = new Event('mousedown');
            newEvent.pageX = event.pageX;
            newEvent.clientX = event.clientX;
            newEvent.pageY = event.pageY;
            newEvent.clientY = event.clientY;
            newEvent.view = event.view;
            brushElement.__data__ = { type: 'overlay' };
            brushElement.dispatchEvent(newEvent);
        }
    }

    /**
    * @name brushEnd
    * @desc called at the end of the user brushing which calls the onBrush callback
    * @return {undefined} - no return
    */
    brushEnd() {
        var brushObj = this,
            xScale = brushObj.jvChart.currentData.xAxisScale,
            yScale = brushObj.jvChart.currentData.yAxisScale,
            filteredXAxisLabels = [],
            filteredYAxisLabels = [],
            shouldReset = false,
            e = d3.event.selection,
            returnObj,
            filteredLabels = [],
            filteredConcepts = {},
            index,
            filterCol,
            filteredLabelsX,
            filteredLabelsY,
            cleanDataFlag = true;

        if (e) {
            if (brushObj.brushType === 'xy') {
                if (xScale && typeof xScale.invert !== 'function') { // means that the scale is ordinal and not linear
                    returnObj = jvBrush.calculateBrushAreaOrdinal(e[0][0], e[1][0], xScale);
                    filteredXAxisLabels = returnObj.filteredAxisLabels;
                    shouldReset = returnObj.shouldReset;
                } else if (xScale) {
                    // calculate labels for linear scale
                    returnObj = jvBrush.calculateBrushAreaLinear(e[0][0], e[1][0], xScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'x');
                    filteredXAxisLabels = returnObj.filteredAxisLabels;
                    shouldReset = returnObj.shouldReset;
                }

                if (yScale && typeof yScale.invert !== 'function') { // means that the scale is oridnal and not linear
                    returnObj = jvBrush.calculateBrushAreaOrdinal(e[0][1], e[1][1], yScale);
                    filteredYAxisLabels = returnObj.filteredAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                } else if (yScale) {
                    // calculate labels for linear scale
                    returnObj = jvBrush.calculateBrushAreaLinear(e[0][1], e[1][1], yScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'y');
                    filteredYAxisLabels = returnObj.filteredAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                } else if (brushObj.jvChart.config.type === 'heatmap') {
                    returnObj = jvBrush.calculateHeatmapBrush(e, brushObj.jvChart.currentData, brushObj.jvChart);
                    filteredLabelsX = returnObj.filteredXAxisLabels;
                    filteredLabelsY = returnObj.filteredYAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                } else if (brushObj.jvChart.config.type === 'clustergram') {
                    returnObj = jvBrush.calculateClustergramBrush(e, brushObj.jvChart.currentData, brushObj.jvChart);
                    filteredLabelsX = returnObj.filteredXAxisLabels;
                    filteredLabelsY = returnObj.filteredYAxisLabels;
                    if (returnObj.shouldReset) {
                        shouldReset = true;
                    }
                }
            } else if (brushObj.brushType === 'x') {
                returnObj = jvBrush.calculateBrushAreaLinear(e[0], e[1], xScale, brushObj.jvChart.currentData, brushObj.jvChart.config.type, 'x');
                filteredXAxisLabels = returnObj.filteredAxisLabels;
                if (returnObj.shouldReset) {
                    shouldReset = true;
                }
            }
        } else {
            shouldReset = true;
        }

        if (filteredXAxisLabels.length > 0 && filteredYAxisLabels.length > 0) {
            // merge axisLabels
            for (let j = 0; j < filteredXAxisLabels.length; j++) {
                index = filteredYAxisLabels.indexOf(filteredXAxisLabels[j]);
                if (index > -1) {
                    filteredLabels.push(filteredXAxisLabels[j]);
                }
            }
        } else if (filteredXAxisLabels.length > 0) {
            filteredLabels = filteredXAxisLabels;
        } else if (filteredYAxisLabels.length > 0) {
            filteredLabels = filteredYAxisLabels;
        }

        if (shouldReset) {
            filteredLabels = [];
        }

        if (brushObj.jvChart.config.type === 'heatmap') {
            let filterColX = brushObj.jvChart.currentData.dataTable.x,
                filterColY = brushObj.jvChart.currentData.dataTable.y;
            if (!shouldReset) {
                if (filteredLabelsX.length > 0) {
                    filteredConcepts[filterColX] = filteredLabelsX;
                }
                if (filteredLabelsY.length > 0) {
                    filteredConcepts[filterColY] = filteredLabelsY;
                }
            } else {
                filteredConcepts[filterColX] = [];
                filteredConcepts[filterColY] = [];
            }
        } else if (brushObj.jvChart.config.type === 'clustergram') {
            if (!shouldReset) {
                let xLength = Object.keys(filteredLabelsX).length,
                    yLength = Object.keys(filteredLabelsY).length;

                for (let i = 0; i < xLength; i++) {
                    let filterColX = brushObj.jvChart.currentData.dataTable['x_category ' + (xLength - i)];
                    filteredConcepts[filterColX] = filteredLabelsX[i];
                }
                for (let i = 0; i < yLength; i++) {
                    let filterColY = brushObj.jvChart.currentData.dataTable['y_category ' + (yLength - i)];
                    filteredConcepts[filterColY] = filteredLabelsY[i];
                }
            }
            cleanDataFlag = false;
        } else {
            if (brushObj.jvChart.config.type === 'gantt') {
                filterCol = brushObj.jvChart.currentData.dataTable.group;
            } else {
                filterCol = brushObj.jvChart.currentData.dataTable.label;
            }
            filteredConcepts[filterCol] = filteredLabels;
        }

        // calls back to update data with brushed data
        brushObj.onBrushCallback({
            data: filteredConcepts,
            reset: shouldReset,
            clean: cleanDataFlag
        });
        brushObj.removeBrush();
    }

    /**
    * @name calculateBrushAreaOrdinal
    * @desc calculates the ordinal values that are in the brushed area
    * @param {number} mousePosMin - lower bound mouse position
    * @param {number} mousePosMax - upper bound mouse position
    * @param {object} scale - d3 axis scale
    * @return {Object} - object of filtered values
    */
    static calculateBrushAreaOrdinal(mousePosMin, mousePosMax, scale) {
        let domain = scale.domain(),
            padding = scale.padding(),
            step = scale.step(),
            minIndex, maxIndex,
            paddingDistance = padding * step / 2,
            filteredAxisLabels;

        // determine min index
        if (mousePosMin % step > step - paddingDistance) {
            // don't include on min side
            minIndex = (Math.floor(mousePosMin / step) + 1);
        } else {
            // include on min side
            minIndex = (Math.floor(mousePosMin / step));
        }

        // determine max index
        if (mousePosMax % step < paddingDistance) {
            // don't include on max side
            maxIndex = (Math.floor(mousePosMax / step) - 1);
        } else {
            // include on max side
            maxIndex = (Math.floor(mousePosMax / step));
            if (maxIndex === domain.length) {
                maxIndex -= 1;
            }
        }
        filteredAxisLabels = domain.slice(minIndex, maxIndex + 1);
        return { filteredAxisLabels: filteredAxisLabels, shouldReset: filteredAxisLabels.length === 0 };
    }


    /**
    * @name calculateBrushAreaLinear
    * @desc calculates the linear values that are in the brushed area
    * @param {number} mousePosMin - lower bound mouse position
    * @param {number} mousePosMax - upper bound mouse position
    * @param {object} scale - d3 axis scale
    * @param {object} data - chartData
    * @param {string} type - visual type
    * @param {string} axis - x / y / z
    * @return {Object} - object of filtered values
    */
    static calculateBrushAreaLinear(mousePosMin, mousePosMax, scale, data, type, axis) {
        let filteredAxisLabels = [],
            min,
            max,
            axisLabel;

        // switch min and max if scale is y due to svg drawing (y axis increases up the screen while mousePos decreases)
        if (axis === 'y') {
            max = scale.invert(mousePosMin);
            min = scale.invert(mousePosMax);
        } else {
            min = scale.invert(mousePosMin);
            max = scale.invert(mousePosMax);
        }

        if (type === 'bar') {
            for (axisLabel of data.legendData) {
                for (let dataElement of data.chartData) {
                    if (dataElement[axisLabel] >= min) {
                        filteredAxisLabels.push(dataElement[data.dataTable.label]);
                    }
                }
            }
        } else if (type === 'gantt') {
            max = new Date(max);
            min = new Date(min);
            for (let i = 0; i < data.legendData.length; i++) {
                let count = i + 1,
                    startDate,
                    endDate;
                for (let dataElement of data.chartData) {
                    if (count > 1) {
                        startDate = new Date(dataElement[data.dataTable['start ' + count]]);
                        endDate = new Date(dataElement[data.dataTable['end ' + count]]);
                    } else {
                        startDate = new Date(dataElement[data.dataTable.start]);
                        endDate = new Date(dataElement[data.dataTable.end]);
                    }
                    if ((startDate <= max && startDate >= min) || (endDate <= max && endDate >= min) || (startDate <= min && endDate >= max)) {
                        filteredAxisLabels.push(dataElement[data.dataTable.group]);
                    }
                }
            }
        } else if (type === 'line' || type === 'area' || type === 'singleaxis') {
            for (axisLabel of data.legendData) {
                for (let dataElement of data.chartData) {
                    if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                        filteredAxisLabels.push(dataElement[data.dataTable.label]);
                    }
                }
            }
        } else if (type === 'scatterplot') {
            axisLabel = data.dataTable[axis];
            for (let dataElement of data.chartData) {
                if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                    filteredAxisLabels.push(dataElement[data.dataTable.label]);
                }
            }
        } else if (type === 'boxwhisker') {
            axisLabel = data.dataTable.value;

            for (let dataElement of data.chartData) {
                if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                    filteredAxisLabels.push(dataElement[data.dataTable.label]);
                }
            }
        } else if (type === 'heatmap') {
            axisLabel = data.dataTable[axis];
            for (let dataElement of data.chartData) {
                if (dataElement[axisLabel] <= max && dataElement[axisLabel] >= min) {
                    filteredAxisLabels.push(dataElement[data.dataTable.label]);
                }
            }
        }
        return { filteredAxisLabels: filteredAxisLabels, shouldReset: filteredAxisLabels.length === 0 };
    }

    /**
    * @name calculateHeatmapBrush
    * @desc calculates values inside of brushed area of a heatmap
    * @param {array} e - mouse extent for location of brushed area
    * @param {array} data - chart data
    * @param {array} chart - jvChart
    * @return {object} - filtered data
    */
    static calculateHeatmapBrush(e, data, chart) {
        let mouseXmin = e[0][0],
            mouseYmin = e[0][1],
            mouseXmax = e[1][0],
            mouseYmax = e[1][1],
            filteredXAxisLabels = [],
            filteredYAxisLabels = [],
            reset = true,
            xBucketMax = Math.floor(mouseXmax / chart._vars.heatGridSize) + 1,
            yBucketMax = Math.floor(mouseYmax / chart._vars.heatGridSize) + 1,
            xBucketMin = Math.floor(mouseXmin / chart._vars.heatGridSize),
            yBucketMin = Math.floor(mouseYmin / chart._vars.heatGridSize);

        for (let i = 0; i < xBucketMax; i++) {
            if (i >= xBucketMin) {
                filteredXAxisLabels.push(data.xAxisData.values[i]);
                reset = false;
            }
        }
        for (let i = 0; i < yBucketMax; i++) {
            if (i >= yBucketMin) {
                filteredYAxisLabels.push(data.yAxisData.values[i]);
                reset = false;
            }
        }

        return { filteredXAxisLabels: filteredXAxisLabels, filteredYAxisLabels: filteredYAxisLabels, shouldReset: reset };
    }

    /**
    * @name calculateClustergramBrush
    * @desc calculates values inside of brushed area of a clustergram
    * @param {array} e - mouse extent for location of brushed area
    * @param {array} data - chart data
    * @param {array} chart - jvChart
    * @return {object} - filtered data
    */
    static calculateClustergramBrush(e, data, chart) {
        let mouseXmin = e[0][0],
            mouseYmin = e[0][1],
            mouseXmax = e[1][0],
            mouseYmax = e[1][1],
            filteredXAxisLabels = [],
            filteredYAxisLabels = [],
            reset = true,
            xBucketMax = Math.floor(mouseXmax / chart._vars.clustergramGridWidth) + 1,
            yBucketMax = Math.floor(mouseYmax / chart._vars.clustergramGridHeight) + 1,
            xBucketMin = Math.floor(mouseXmin / chart._vars.clustergramGridWidth),
            yBucketMin = Math.floor(mouseYmin / chart._vars.clustergramGridHeight),
            xLevels = {},
            yLevels = {};

        for (let i = 0; i < xBucketMax; i++) {
            if (i >= xBucketMin) {
                filteredXAxisLabels.push(data.xAxisData[i]);
                reset = false;
            }
        }
        for (let i = 0; i < yBucketMax; i++) {
            if (i >= yBucketMin) {
                filteredYAxisLabels.push(data.yAxisData[i]);
                reset = false;
            }
        }

        // X Axis
        // Dynamically create arrays for each level of the hierarchy
        if (filteredXAxisLabels[0]) {
            let parentCountX = (filteredXAxisLabels[0].match(/\./g) || []).length;
            for (let i = 0; i < parentCountX + 1; i++) {
                xLevels[i] = [];
            }

            // Populate the hierarchy arrays with the labels of that respective hierarchy
            for (let i = 0; i < filteredXAxisLabels.length; i++) {
                if (filteredXAxisLabels[i]) {
                    var xFields = filteredXAxisLabels[i].split('.');
                    for (let k = 0; k < xFields.length; k++) {
                        if (xLevels[k].indexOf(xFields[k]) === -1) {
                            xLevels[k].push(xFields[k]);
                        }
                    }
                }
            }
        }

        // Y Axis
        // Dynamically create arrays for each level of the hierarchy
        if (filteredYAxisLabels[0]) {
            let parentCountY = (filteredYAxisLabels[0].match(/\./g) || []).length;
            for (let i = 0; i < parentCountY + 1; i++) {
                yLevels[i] = [];
            }

            // Populate the hierarchy arrays with the labels of that respective hierarchy
            for (let i = 0; i < filteredYAxisLabels.length; i++) {
                if (filteredYAxisLabels[i]) {
                    let yFields = filteredYAxisLabels[i].split('.');
                    for (let k = 0; k < yFields.length; k++) {
                        if (yLevels[k].indexOf(yFields[k]) === -1) {
                            yLevels[k].push(yFields[k]);
                        }
                    }
                }
            }
        }

        return { filteredXAxisLabels: xLevels, filteredYAxisLabels: yLevels, shouldReset: reset };
    }
}
