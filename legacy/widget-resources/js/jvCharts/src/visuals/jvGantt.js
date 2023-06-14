'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.gantt = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateGanttBars = generateGanttBars;
jvCharts.prototype.setGanttLegendData = setGanttLegendData;
jvCharts.prototype.setGanttAxisData = setGanttAxisData;

/* *********************************************** Gantt functions ******************************************************/

/**
 * @name setData
 * @return {void}
 */
function setData() {
    var chart = this;
    chart.data.legendData = chart.setGanttLegendData(chart.data);
    chart.data.xAxisData = chart.setGanttAxisData(chart, 'x');
    chart.data.yAxisData = chart.setGanttAxisData(chart, 'y');
    // define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData(event) {
    var chart = this, ele = event.target.classList.value.split('bar-col-')[1];
    if (ele) {
        return {
            data: {
                [chart.currentData.dataTable.group]: [jvCharts.getRawForValue(ele)]
            },
            node: event.target
        };
    }
    return {
        data: {
            [chart.currentData.dataTable.group]: []
        },
        node: event.target
    };
}

function setGanttLegendData(data) {
    var legendArray = [],
        startsAndEnds = Object.keys(data.dataTable).filter(key => key.split(' ')[0] === 'start' || key.split(' ')[0] === 'end'),
        i;

    // once legend data is half the size of starts and ends, we know we have all the correct starts
    for (i = 0; legendArray.length < Math.floor(startsAndEnds.length / 2); i++) {
        if (startsAndEnds[i].split(' ')[0] === 'start') {
            legendArray.push(startsAndEnds[i]);
        }
    }

    return legendArray;
}

function setGanttAxisData(chart, axis) {
    var axisData = [],
        data = chart.data,
        chartData = data.chartData,
        dataType, label, valueContainer, numBars, i, j, ii;

    if (axis === 'x') {
        label = data.dataTable.group;
        dataType = 'DATE';

        numBars = data.legendData.length;
        // Loop through dataTable and assign labels based on how many groups there are
        valueContainer = [];
        valueContainer.push(data.dataTable.start);
        valueContainer.push(data.dataTable.end);
        for (i = 0; i < numBars; i++) {
            if (i === 0) {
                valueContainer.push(data.dataTable.start);
                valueContainer.push(data.dataTable.end);
            } else {
                valueContainer.push(data.dataTable['start ' + i]);
                valueContainer.push(data.dataTable['end ' + i]);
            }
        }

        // Get all the start and end dates and add them to axis data
        for (j = 0; j < valueContainer.length; j++) {
            for (ii = 0; ii < chartData.length; ii++) {
                if (chartData[ii][valueContainer[j]] !== null) {
                    axisData.push(chartData[ii][valueContainer[j]]);
                }
            }
        }

        // Add any axis formatting to this object, need to use when painting
        chart._vars.xAxisFormatting = {};
    } else {
        dataType = 'STRING';
        label = data.dataTable.group;

        // Add any axis formatting to this object, need to use when painting
        chart._vars.yAxisFormatting = {};

        for (i = 0; i < chartData.length; i++) {
            axisData.push(chartData[i][label]);
        }
    }

    return {
        'label': label,
        'values': axisData,
        'dataType': dataType
    };
}

function paint() {
    var chart = this;

    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;

    chart.generateSVG(chart.currentData.legendData);
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateGanttBars');
    chart.drawGridlines(chart.currentData.xAxisData);
    chart.generateGanttBars(chart.currentData);
    if (typeof chart.currentData.xAxisScale.ticks === 'function') {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.domain().length);
    }
}

function generateGanttBars(ganttData) {
    var chart = this,
        svg = chart.svg,
        colors = ganttData.color,
        container = chart.config.container,
        colorByValue = chart._vars.colorByValue,
        dataHeaders, ganttDataNew, externalCounterForJ, externalCounterForJJ,
        yAxisData = ganttData.yAxisData, bars, numBars, ganttBars, startDates, endDates,
        i, ii, x, y, sampleData, dataToPlot, eventGroups, currentDate, dateData;

    // Remove existing bars from page
    svg.selectAll('g.gantt-container').remove();
    bars = svg.append('g')
        .attr('class', 'gantt-container');
    dataHeaders = chart._vars.legendHeaders ? chart._vars.legendHeaders : ganttData.legendData;
    ganttDataNew = jvCharts.getToggledData(ganttData, dataHeaders);

    x = jvCharts.getAxisScale('x', ganttData.xAxisData, container, chart._vars);
    y = jvCharts.getAxisScale('y', ganttData.yAxisData, container, chart._vars);
    sampleData = ganttDataNew;

    chart._vars.rotateAxis = true;

    numBars = ganttData.legendData.length;
    ganttBars = [];
    // create array of start dates and end dates to iterate through
    startDates = [];
    endDates = [];
    for (i = 0; i < numBars; i++) {
        let key = ' ' + i;
        if (i === 0) {
            key = '';
        }
        startDates.push(chart.currentData.dataTable['start' + key]);
        endDates.push(chart.currentData.dataTable['end' + key]);
    }

    for (ii = 0; ii < numBars; ii++) {
        externalCounterForJ = -1;
        ganttBars[ii] = bars.selectAll('.gantt-bar' + ii)
            .data(sampleData)
            .enter()
            .append('rect')
            .attr('class', function () {
                externalCounterForJ++;
                var label = jvCharts.getViewForValue(String(sampleData[externalCounterForJ][chart.currentData.dataTable.group]));

                return 'gantt-bar' + ii + ' editable editable-bar bar-col-' + label + '-index-' + ii + ' highlight-class-' + label + ' rect ';
            })
            .attr('width', 0)
            .attr('height', y.bandwidth() / numBars)
            .attr('x', function (d) {
                if (d[startDates[ii]]) {
                    return x(new Date(d[startDates[ii]]));
                }
                return 0;
            })
            .attr('y', function (d) {
                return y(d[yAxisData.label]) + (y.bandwidth() / numBars * ii);
            })
            .attr('rx', 3)
            .attr('ry', 3)
            .attr('fill', function (d) {
                var typeVal = chart.currentData.dataTable['Type' + (ii + 1)],
                    colorValue, data = {data: d};
                if (colorByValue) {
                    colorValue = jvCharts.colorByValue(data, colorByValue);
                    if (colorValue) {
                        return colorValue;
                    }
                }
                if (chart._vars.legendHeaders) {
                    var color = jvCharts.getColors(colors, ii, chart._vars.legendHeaders[ii]);
                } else {
                    var color = jvCharts.getColors(colors, ii, chart.currentData.legendData[ii]);
                }
                return color;
            });


        ganttBars[ii].transition()
            .duration(400)
            .delay(100)
            .attr('width', function (d, i) {
                var width = x(new Date(d[endDates[ii]])) - x(new Date(d[startDates[ii]]));//(x(d.StartDate) - x(d.EndDate));
                if (width >= 0) {
                    return width;
                }
                
                    return 0;
                
            });
    }
    externalCounterForJJ = -1;
    dataToPlot = jvCharts.getPlotData(ganttDataNew, chart);
    eventGroups = bars.selectAll('.event-rect')
        .data(dataToPlot)
        .enter()
        .append('rect')
        .attr('class', 'event-rect')
        .attr('class', function () {
            externalCounterForJJ++;
            var label = jvCharts.getViewForValue(String(sampleData[externalCounterForJJ][chart.currentData.dataTable.group]));
            return 'event-rect bar-col-' + label;
        })
        .attr('x', 0)
        .attr('y', function (d, idx) {
            return container.height / ganttDataNew.length * idx;
        })
        .attr('width', container.width)
        .attr('height', function () {
            return container.height / ganttDataNew.length;
        })
        .attr('fill', 'transparent')
        .attr('transform', 'translate(0,0)');
    eventGroups
        .on('mouseover', function (d, idx) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
            if (chart.showToolTip) {
                // Get tip data
                var tipData = chart.setTipData(d, idx);
                // Draw tip
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                chart.tip.d = d;
                chart.tip.i = idx;
            }
        })
        .on('mousemove', function (d, idx) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === idx) {
                    chart.tip.showTip(d3.event);
                } else {
                    // Get tip data
                    var tipData = chart.setTipData(d, idx);
                    // Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function (d) {
            if (chart.showToolTip) {
                chart.tip.hideTip();
            }
        });

    currentDate = new Date();
    dateData = [currentDate];
    // Draws a line representing the current date
    svg.selectAll('.currentDateLine')
        .data(dateData)
        .enter()
        .append('line')
        .attr('x1', function (d) {
            return x(d);
        })
        .attr('x2', function (d) {
            return x(d);
        })
        .attr('y1', function () {
            return '0px';
        })
        .attr('y2', function () {
            return chart.config.container.height;
        })
        .attr('class', 'currentDateLine')
        .attr('stroke', chart._vars.axisColor)
        .attr('stroke-width', chart._vars.STROKE_WIDTH)
        .attr('stroke-dasharray', ('3, 3'));


    svg.selectAll('.currentDateLabel')
        .data(dateData)
        .enter()
        .append('text')
        .text(function () {
            var today = new Date(),
                dd = today.getDate(),
                mm = today.getMonth() + 1, // January is 0!
                yyyy = today.getFullYear();

            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }

            return mm + '/' + dd + '/' + yyyy;
        })
        .attr('x', function (d) {
            return x(d);
        })
        .attr('y', function () {
            return '-10px';
        })
        .attr('text-anchor', 'middle')
        .attr('fill', chart._vars.fontColor);
}

export default jvCharts;
