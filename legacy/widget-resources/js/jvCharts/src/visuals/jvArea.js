'use strict';

import * as d3 from 'd3';
import jvCharts from './jvLine.js';

jvCharts.prototype.area = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.fillArea = fillArea;

/* *********************************************** Line functions ******************************************************/

/* *setLineData
 *  gets line data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    // sort chart data if there is a sort type and label in the _vars
    if (chart._vars.sortType) {
        if (chart._vars.sortLabel && chart._vars.sortType !== 'default') {
            chart.organizeChartData(chart._vars.sortLabel, chart._vars.sortType);
        }
    }

    // remove if we add non linear to area chart
    chart._vars.lineCurveType = 'Linear';

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

/* *setBarLineLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend tex
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
/* *paintLineChart
 *
 * The initial starting point for line chart, begins the drawing process. Must already have the data stored in the chart
 * object
 */
function paint() {
    var chart = this,
        // Uses the original data and then manipulates it based on any existing options
        dataObj = chart.getBarDataFromOptions();

    // assign current data which is used by all bar chart operations
    chart.currentData = dataObj;

    // Overwrite any pre-existing zoom
    chart.config.zoomEvent = null;

    // generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);
    chart.generateXAxis(dataObj.xAxisData);
    chart.generateYAxis(dataObj.yAxisData);
    chart.generateLegend(dataObj.legendData, 'generateLine');

    if (typeof dataObj.xAxisScale.ticks === 'function') {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }

    chart.generateLine(dataObj);
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
    } else if (event.target.classList.value.indexOf('area-container') > -1) {
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
    let chart = this,
        node;
    if (event.data[chart.currentData.dataTable.label]) {
        let label = event.data[chart.currentData.dataTable.label][0],
            cssClass = '.highlight-class-' + jvCharts.getViewForValue(label);
        node = chart.svg.selectAll(cssClass);
    }
    chart.svg.select('.area-container').selectAll('circle')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    // highlight necessary circles
    if (node) {
        node
            .attr('stroke', chart._vars.highlightBorderColor)
            .attr('stroke-width', chart._vars.highlightBorderWidth);
    }
}

/* *
 *
 */
function fillArea(lineData) {
    var chart = this,
        svg = chart.svg,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        legendData = chart.currentData.legendData,
        container = chart.config.container,
        colorByValue = chart._vars.colorByValue,
        colors = chart._vars.color,
        x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars, 'no-padding'),
        y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars, 'no-padding'),
        area,
        data = {};

    // If a legend element is toggled off, use the new list of headers
    if (chart._vars.hasOwnProperty('legendHeaders')) {
        legendData = chart._vars.legendHeaders;
    }
    // If axis are normal
    if (!chart._vars.rotateAxis) {
        area = d3.area()
            .x(d => {
                if (d.x === '') {
                    return x('EMPTY_STRING');
                }
                return x(d.x);
            })
            .y0(container.height)
            .y1(d => y(d.y));
    } else {
        area = d3.area()
            .y(d => y(d.y))
            .x1(0)
            .x0(d => x(d.x));
    }

    for (let dataEle of lineData) {
        for (let legendEle of legendData) {
            if (legendEle.toggle === false) {
                // Don't write anything to data
                continue;
            }
            if (!data[legendEle]) {
                data[legendEle] = [];
            }
            if (!chart._vars.rotateAxis) {
                data[legendEle].push({
                    'x': dataEle[xAxisData.label],
                    'y': parseFloat(dataEle[legendEle])
                });
            } else {
                data[legendEle].push({
                    'y': dataEle[yAxisData.label],
                    'x': parseFloat(dataEle[legendEle])
                });
            }
        }
    }

    svg.selectAll('.area').remove();
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            svg.append('path')
                .datum(data[key])
                .attr('class', () => {
                    if (chart._vars.colorLine && chart._vars.thresholds !== 'none' && chart._vars.colorChart) {
                        return 'area area-threshold';
                    }
                    return 'area';
                })
                .attr('d', area)
                .attr('fill', (d, i) => {
                    var currentData = {data: chart.data.chartData[i]};
                    if (colorByValue) {
                        for (let id = 0; i < colorByValue.length; id++) {
                            let colorOn = currentData.data[colorByValue[id].colorOn];
                            if (isNaN(colorOn)) {
                                if (colorOn && colorByValue[id].valuesToColor.includes(colorOn.replace(/ /g, '_'))) {
                                    return colorByValue[id].color;
                                }
                            } else if (colorByValue[id].valuesToColor.includes(colorOn)) {
                                return colorByValue[id].color;
                            }
                        }
                    }
                    return jvCharts.getColors(colors, null, key);
                })
                .attr('opacity', 0.6)
                .attr('transform', () => chart._vars.rotateAxis ? `translate(0, ${container.height / lineData.length / 2})` : `translate(${container.width / lineData.length / 2}, 0)`)
                .attr('pointer-events', 'none')
                .attr('clip-path', 'url(#clip)');
        }
    }
}

export default jvCharts;
