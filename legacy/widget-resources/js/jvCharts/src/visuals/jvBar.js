'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.bar = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.generateBarThreshold = generateBarThreshold;
jvCharts.prototype.generateBars = generateBars;


/* *paint
 *
 * The initial starting point for bar chart, begins the drawing process. Must already have the data stored in the chart
 * object
 */
function paint(transitionTime = 800) {
    let chart = this,
        // Uses the original data and then manipulates it based on any existing options
        dataObj = chart.getBarDataFromOptions();

    if (transitionTime || transitionTime === 0) {
        chart._vars.transitionTime = transitionTime;
    }

    // assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    // generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateBars');
    chart.generateBars(dataObj);

    if (typeof dataObj.xAxisScale.ticks === 'function') {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }
}


/* *Sets the data for the bar chart prior to painting
 *  @function
 * @params {Object} data - Data passed into the chart
 * @params {Object} dataTable - Shows which data column is associated with each field in visual panel
 * @params {Object} dataTableKeys - Contains the data type for each column of data
 * @params {Object} colors - Colors object used to color the bars
 */
function setData() {
    let chart = this;
    // sort chart data if there is a sort type and label in the _vars
    if (chart._vars.hasOwnProperty('sortType') && chart._vars.sortType) {
        if (chart._vars.sortLabel && chart._vars.sortType !== 'default') {
            chart.organizeChartData(chart._vars.sortLabel, chart._vars.sortType);
        }
    }
    chart.data.legendData = setBarLineLegendData(chart.data);
    chart.data.xAxisData = chart.setAxisData('x', chart.data);
    chart.data.yAxisData = chart.setAxisData('y', chart.data);
    if (chart._vars.seriesFlipped) {
        chart.setFlippedSeries(chart.data.dataTableKeys);
        chart.flippedData.color = jvCharts.setChartColors(chart._vars.color, chart.flippedData.legendData, chart.colors);
    }

    // define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}


function getEventData(event) {
    var chart = this;
    if (event.target.classList.value.split('bar-col-')[1]) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [jvCharts.getRawForValue(event.target.classList.value.split('bar-col-')[1])]
            },
            node: event.target
        };
    } else if (event.target.classList.value.indexOf('bar-container') > -1) {
        return {
            data: {
                [chart.currentData.dataTable.label]: []
            },
            node: event.target
        };
    }
    return {
        data: false
    };
}

function highlightFromEventData(event) {
    let chart = this;
    chart.svg.select('.bar-container').selectAll('rect')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    if (event.data[chart.currentData.dataTable.label]) {
        let labelArray = event.data[chart.currentData.dataTable.label],
            node,
            cssClass;
        for (let label of labelArray) {
            cssClass = '.highlight-class-' + jvCharts.getViewForValue(label);
            node = chart.svg.selectAll(cssClass);

            // highlight necessary bars
            node
                .attr('stroke', chart._vars.highlightBorderColor)
                .attr('stroke-width', chart._vars.highlightBorderWidth);
        }
    }
}

/* *setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setBarLineLegendData(data) {
    var legendArray = [];
    for (let item in data.dataTable) {
        if (data.dataTable.hasOwnProperty(item)) {
            if (item !== 'label' && item.indexOf('tooltip') === -1) {
                legendArray.push(data.dataTable[item]);
            }
        }
    }
    return legendArray;
}

/* *********************************************** Bar functions ******************************************************/
function generateBarThreshold() {
    var chart = this,
        svg = chart.svg,
        width = chart.config.container.width,
        height = chart.config.container.height,
        thresholds = chart._vars.thresholds,
        length = thresholds !== 'none' ? Object.keys(thresholds).length : 0,
        x = chart.currentData.xAxisScale,
        y = chart.currentData.yAxisScale;

    if (thresholds !== 'none') {
        let thresholdRects,
            threshold;
        for (let i = 0; i < length; i++) {
            threshold = thresholds[i];
            if (!chart._vars.xAxisThreshold) {
                if (chart._vars.rotateAxis) {
                    if (chart._vars.yMin === 'none') {
                        svg.append('line')
                            .style('stroke', threshold.thresholdColor)
                            .attr('x1', x(threshold.threshold))
                            .attr('y1', 0)
                            .attr('x2', x(threshold.threshold))
                            .attr('y2', height)
                            .attr('stroke-dasharray', ('3, 3'));
                    } else if (threshold.threshold > chart._vars.yMin) {
                        svg.append('line')
                            .style('stroke', threshold.thresholdColor)
                            .attr('x1', x(threshold.threshold))
                            .attr('y1', 0)
                            .attr('x2', x(threshold.threshold))
                            .attr('y2', height)
                            .attr('stroke-dasharray', ('3, 3'));
                    }
                } else if (chart._vars.yMin === 'none') {
                    svg.append('line')
                        .style('stroke', threshold.thresholdColor)
                        .attr('x1', 0)
                        .attr('y1', y(threshold.threshold))
                        .attr('x2', width)
                        .attr('y2', y(threshold.threshold))
                        .attr('stroke-dasharray', ('3, 3'));
                } else if (threshold.threshold > chart._vars.yMin) {
                    svg.append('line')
                        .style('stroke', threshold.thresholdColor)
                        .attr('x1', 0)
                        .attr('y1', y(threshold.threshold))
                        .attr('x2', width)
                        .attr('y2', y(threshold.threshold))
                        .attr('stroke-dasharray', ('3, 3'));
                }
            }

            if (chart._vars.colorChart) {
                thresholdRects = d3.selectAll('rect.rect-' + i);
                thresholdRects.attr('fill', threshold.thresholdColor);
            }
        }
    }
}

/* *generateBars
 *
 * Does the actual painting of bars on the bar chart
 * @params barData
 */

function generateBars(barData) {
    var chart = this,
        svg = chart.svg,

        // Used to draw line that appears when tool tips are visible
        tipLineX = 0,
        tipLineWidth = 0,
        tipLineHeight = 0,
        tipLineY = 0,
        // Add logic to filter bardata
        dataHeaders = barData.legendData,
        bars,
        barDataNew,
        eventGroups;

    // Removes any existing bar containers and creates a new one
    svg.selectAll('g.bar-container').remove();

    bars = svg.append('g')
        .attr('class', 'bar-container')
        .selectAll('g');

    if (chart._vars.seriesFlipped && chart._vars.flippedLegendHeaders) {
        dataHeaders = chart._vars.flippedLegendHeaders;
    } else if (chart._vars.legendHeaders) {
        dataHeaders = chart._vars.legendHeaders;
    }

    chart._vars.legendHeaders = dataHeaders;

    barDataNew = jvCharts.getToggledData(barData, dataHeaders);

    generateBarGroups(bars, barDataNew, chart);

    eventGroups = jvCharts.generateEventGroups(bars, barDataNew, chart);

    // Add listeners

    eventGroups
        .on('mouseover', function (d, i) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.showToolTip) {
                // Get tip data
                let tipData = chart.setTipData(d, i),
                    mouseItem = d3.select(this);

                // Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                chart.tip.d = d;
                chart.tip.i = i;
                svg.selectAll('.tip-line').remove();

                tipLineX = mouseItem.node().getBBox().x;
                tipLineWidth = mouseItem.node().getBBox().width;
                tipLineHeight = mouseItem.node().getBBox().height;
                tipLineY = mouseItem.node().getBBox().y;

                // Draw line in center of event-rect
                svg
                    .append('line')
                    .attr('class', 'tip-line')
                    .attr('x1', () => chart._vars.rotateAxis ? 0 : tipLineX + tipLineWidth / 2)
                    .attr('x2', () => chart._vars.rotateAxis ? tipLineWidth : tipLineX + tipLineWidth / 2)
                    .attr('y1', () => chart._vars.rotateAxis ? tipLineY + tipLineHeight / 2 : 0)
                    .attr('y2', () => chart._vars.rotateAxis ? tipLineY + tipLineHeight / 2 : tipLineHeight)
                    .attr('fill', 'none')
                    .attr('shape-rendering', 'crispEdges')
                    .attr('stroke', 'black')
                    .attr('stroke-width', '1px');
            }
        })
        .on('mousemove', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip();
                } else {
                    // Get tip data
                    var tipData = chart.setTipData(d, i);
                    // Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function () {
            if (chart.showToolTip) {
                chart.tip.hideTip();
                svg.selectAll('line.tip-line').remove();
            }
        });

    chart.displayValues();
    chart.generateClipPath();
    chart.generateBarThreshold();
}

/* *generateBarGroups
 *
 * Paints the groups of the bars
 * @params chartContainer, barData, chart
 */
function generateBarGroups(chartContainer, barData, chart) {
    var container = chart.config.container,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        colors = chart._vars.color,
        colorByValue = chart._vars.colorByValue,
        x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars),
        y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars),
        posCalc = jvCharts.getPosCalculations(barData, chart._vars, xAxisData, yAxisData, container, chart),
        dataToPlot = jvCharts.getPlotData(barData, chart),
        barGroups,
        externalCounterForJ,
        bars,
        barCount = 0, groupCount = 0;

    if (xAxisData.dataType === 'STRING' || !xAxisData.hasOwnProperty('min')) {
        // Creates bar groups
        barGroups = chartContainer
            .data(dataToPlot)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            // Translate the bar groups by (outer padding * step) and the width of the bars (container.width / barData.length * i)
            .attr('transform', (d, i) => `translate(${x.paddingOuter() * x.step() + x.step() * i} ,0)`);
    } else if (xAxisData.dataType === 'NUMBER') {
        // Creates bar groups
        barGroups = chartContainer
            .data(dataToPlot)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            // Translate the bar groups by (outer padding * step) and the width of the bars (container.width / barData.length * i)
            .attr('transform', (d, i) => `translate(0, ${y.paddingOuter() * y.step() + y.step() * i} )`);
    }

    // Creates bars within bar groups
    externalCounterForJ = -1;
    bars = barGroups.selectAll('rect')
        .data(d => d)
        .enter()
        .append('rect')
        .attr('class', (d, i) => {
            let keys = Object.keys(barData[0]),
                filteredKeys = [],
                label,
                legendVal,
                thresholdDir;

            if (i === 0) {
                externalCounterForJ++;
            }

            for (let key of keys) {
                if (key !== chart.currentData.dataTable.label) {
                    filteredKeys.push(key);
                }
            }

            label = jvCharts.getViewForValue(String(barData[externalCounterForJ][chart.currentData.dataTable.label]));
            legendVal = jvCharts.getViewForValue(String(filteredKeys[i]));
            thresholdDir;

            if (chart._vars.xAxisThreshold) {
                thresholdDir = chart.setThreshold(barData[externalCounterForJ][chart.currentData.dataTable.label]);
            } else {
                thresholdDir = chart.setThreshold(d);
            }

            return `editable editable-bar bar-col-${label}-index-${legendVal} highlight-class-${label} rect ${thresholdDir}`;
        })
        .attr('x', (d, i) => posCalc.startx(d, i))
        .attr('y', (d, i) => posCalc.starty(d, i))
        .attr('width', (d, i) => posCalc.startwidth(d, i))
        .attr('height', (d, i) => posCalc.startheight(d, i))
        .attr('fill', (d, i) =>  {
            // this is iterating bar by bar, so need to know how many bars are in a group
            // and keep track of what point we are at, since i (the iterator arg) is not
            // updating. barCount keeps track of what bar we are on in a group, and 
            // groupCount keeps track of what group we are on. When the barCount is the same
            // as barsPerGroup, need to reset barCount and move on to the next group by increasing
            // groupCount
            var data = {data: {}}, barsPerGroup = Object.keys(chart.data.chartData[0]).length - 1;
            data.data = chart.data.chartData[groupCount];
            barCount++;
            if (barCount === barsPerGroup) {
                barCount = 0;
                groupCount++;
            }

            if (colorByValue && jvCharts.colorByValue(data, colorByValue)) {
                return jvCharts.colorByValue(data, colorByValue);
            }

            return jvCharts.getColors(colors, i, chart._vars.legendHeaders[i]);
        })
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('opacity', 0.9)
        .attr('clip-path', d => d > 30000000 ? 'url(#clip-above)' : 'url(#clip-below)');
    if (chart._vars.transitionTime > 0) {
        bars
            .transition()
            .duration(chart._vars.transitionTime)
            .ease(d3.easePolyOut)
            .attr('x', (d, i, j) => posCalc.x(d, i, j))
            .attr('y', (d, i, j) => posCalc.y(d, i, j))
            .attr('width', (d, i) => posCalc.width(d, i))
            .attr('height', (d, i) => posCalc.height(d, i));
    } else {
        bars
            .attr('x', (d, i, j) => posCalc.x(d, i, j))
            .attr('y', (d, i, j) => posCalc.y(d, i, j))
            .attr('width', (d, i) => posCalc.width(d, i))
            .attr('height', (d, i) => posCalc.height(d, i));
    }

    return barGroups;// returns the bar containers
}

export default jvCharts;
