'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';
var box;
jvCharts.prototype.boxwhisker = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateBoxes = generateBoxes;

/* *setBoxData
 *  gets cloud data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    chart.data.xAxisData = chart.setAxisData('x', chart.data, chart._vars);
    chart.data.yAxisData = chart.setAxisData('y', chart.data, chart._vars);
}

/* * paintBoxChart
 *
 *  @desc The initial starting point for bar chart, begins the drawing process. Must already have the data stored in the chart object
 */
function paint(transitionTime) {
    var chart = this,
        dataObj,
        axisData;

    if (transitionTime || transitionTime === 0) {
        chart._vars.transitionTime = transitionTime;
    } else if (!chart._vars.transitionTime) {
        chart._vars.transitionTime = 800;
    }

    dataObj = getBoxDataFromOptions(chart);
    axisData = chart.getBarDataFromOptions();
    // assign current data which is used by all bar chart operations
    if (chart._vars.rotateAxis) {
        chart.currentData = dataObj;
    } else {
        chart.currentData = axisData;
    }
    // Overwrite any pre-existing zoom
    chart.config.zoomEvent = null;
    // generate svg dynamically based on legend data
    chart.generateSVG();
    chart.generateXAxis(axisData.xAxisData);
    chart.generateYAxis(axisData.yAxisData);

    chart.generateBoxes(dataObj);
}

function getEventData() {
    return {};
}

/* * getBoxDataFromOptions
 *
 *  @desc Assigns the correct chart data to current data using the chart._vars
 */
function getBoxDataFromOptions(chart) {
    // creating these two data variables to avoid having to reference the chart object everytime
    var csv = chart.data.chartData,
        dataTable = chart.data.dataTable,
        min = Infinity,
        max = -Infinity,
        yAxis = [],
        dataObj = {},
        data = {},
        yAxisLabel = dataTable.label,
        xAxisLabel = dataTable.value,
        xAxisData,
        yAxisData,

        keys = csv.map(d => d[yAxisLabel]),
        keys2 = csv.map(d => d[xAxisLabel]),
        unique = keys.filter((item, i, ar) => ar.indexOf(item) === i),
        temp = [];

    for (let uniqueEle of unique) {
        let tempData = csv.filter(d => d[yAxisLabel] === uniqueEle);
        temp.push([uniqueEle, tempData.map(d => d[xAxisLabel])]);
    }

    max = Math.max.apply(Math, keys2);
    min = Math.min.apply(Math, keys2);
    yAxis.push(min);
    yAxis.push(max);

    xAxisData = { 'label': yAxisLabel, 'dataType': 'STRING', 'values': unique };
    yAxisData = { 'label': xAxisLabel, 'dataType': 'NUMBER', 'values': yAxis };

    dataObj.chartData = temp;
    dataObj.dataTable = data.dataTable;
    chart._vars.color = data.color;

    dataObj.xAxisData = xAxisData;
    dataObj.yAxisData = yAxisData;
    data = {
        yAxisData: dataObj.yAxisData,
        xAxisData: dataObj.xAxisData
    };

    if (chart._vars.rotateAxis) {
        dataObj.xAxisData = data.yAxisData;
        dataObj.yAxisData = data.xAxisData;
    } else {
        dataObj.xAxisData = data.xAxisData;
        dataObj.yAxisData = data.yAxisData;
    }

    return dataObj;
}

/* * generateBars
 *
 * @desc Does the actual painting of bars on the bar chart
 * @params boxData
 */
function generateBoxes(boxData) {
    var chart = this,
        svg = chart.svg,
        options = chart._vars,
        container = chart.config.container,
        height = container.height,
        width = container.width,
        x,
        boxChart,
        margin = { top: 0, right: 50, bottom: 70, left: 50 };

    if (options.rotateAxis) {
        x = d3.scaleBand()
            .domain(boxData.chartData.map(d => d[0]))
            .rangeRound([0, height])
            .paddingInner(0.7)
            .paddingOuter(0.3);
        boxChart = box(chart)
            .whiskers(iqr(1.5))
            .height(width)
            .domain([boxData.xAxisData.values[0], boxData.xAxisData.values[1]])
            .showLabels(options.displayValues)
            .flipped(options.rotateAxis)
            .duration(options.transitionTime)
            .chart(chart);
    } else {
        x = d3.scaleBand()
            .domain(boxData.chartData.map(d => d[0]))
            .rangeRound([0, width])
            .paddingInner(0.7)
            .paddingOuter(0.3);
        boxChart = box(chart)
            .whiskers(iqr(1.5))
            .height(height)
            .domain([boxData.yAxisData.values[0], boxData.yAxisData.values[1]])
            .showLabels(options.displayValues)
            .flipped(options.rotateAxis)
            .duration(options.transitionTime)
            .chart(chart);
    }
    // draw the boxplots
    svg.attr('class', 'boxwhisker-container')
        .selectAll('.box')
        .data(boxData.chartData)
        .enter()
        .append('g')
        .attr('class', 'box-container')
        .attr('style', 'pointer-events: all;')
        .attr('transform', d => options.rotateAxis ? `translate(${margin.top}, ${x(d[0])})` : `translate(${x(d[0])}, ${margin.top})`)
        .call(boxChart.width(x.bandwidth()));

    d3.selectAll('rect.box').attr('class', (d, i) =>`editable editable-box box-${i} highlight-class-${i}box`);
    hideLabelsOnOverlap(x, width, svg);
}

/* *
 * @name hideLabelsOnOverlap
 * @desc determines if text on graph should be displayed or not
 */
function hideLabelsOnOverlap(x, width, svg) {
    var numSpacesBetween = x.domain().length - 1,
        totalBoxWidth = x.bandwidth() * x.domain().length,
        widthOfSpaces = (width - totalBoxWidth) / numSpacesBetween,
        xAxisLabelLengthLimit = x.bandwidth() + widthOfSpaces,
        ticks = svg.selectAll('.xAxis text');

    ticks.each(function () {
        if (this.getBBox().width > xAxisLabelLengthLimit) {
            svg.selectAll('.xAxis text')
                .attr('style', 'display:none');
            svg.selectAll('text.box')
                .attr('style', 'display:none');
            svg.selectAll('text.whisker')
                .attr('style', 'display:none');
        }
    });
}

/* *
 * @name iqr
 * @desc Returns a function to compute the interquartile range.
 */
function iqr(k) {
    return function (d) {
        var q1 = d.quartiles[0],
            q3 = d.quartiles[2],
            innerIQR = (q3 - q1) * k,
            idx = -1,
            j = d.length;
        while (d[++idx] < q1 - innerIQR);
        while (d[--j] > q3 + innerIQR);
        return [idx, j];
    };
}

// Inspired by http:// informationandvisualization.de/blog/box-plot
box = function (jvChart) {
    var width = 1,
        height = 1,
        duration = 0,
        domain = null,
        value = Number,
        whiskers = boxWhiskers,
        quartiles = boxQuartiles,
        showLabels = true, // whether or not to show text labels
        tickFormat = null,
        chart = {},
        colorByValue = jvChart._vars.colorByValue,
        boxColor = jvChart.colors[0],
        flipped = false;

    // For each small multiple…
    function box(g) {
        g.each(function (data, i) {
            var d = data[1].sort(d3.ascending),
                g = d3.select(this),
                n = d.length,
                min = d[0],
                max = d[n - 1], outlier, center, whiskerTick,
                outlierLabel = data[0], quartileData, whiskerIndices, whiskerData, outlierIndices, x1, x0,
                hoverArea, medianLine, box, whisker, boxTick, format,
                colorByValueInformation = {data: {}};

            // box does not have access to this data when coloring so must set it
            // up here
            colorByValueInformation.data[jvChart.data.dataTable.label] = data[0];
            colorByValueInformation.data[jvChart.data.dataTable.value] = data[1];
            // Compute quartiles. Must return exactly 3 elements.
            quartileData = d.quartiles = quartiles(d);

            // Compute whiskers. Must return exactly 2 elements, or null.
            whiskerIndices = whiskers && whiskers.call(this, d, i);
            whiskerData = whiskerIndices && whiskerIndices.map(function (j) { return d[j]; });
            // Compute outliers. If no whiskers are specified, all data are 'outliers'.
            // We compute the outliers as indices, so that we can join across transitions!
            outlierIndices = whiskerIndices
                ? d3.range(0, whiskerIndices[0]).concat(d3.range(whiskerIndices[1] + 1, n))
                : d3.range(n);

            // Compute the new x-scale.
            if (flipped) {
                x1 = d3.scaleLinear()
                    .domain(domain && domain.call(this, d, i) || [min, max])
                    .range([0, height]);
            } else {
                x1 = d3.scaleLinear()
                    .domain(domain && domain.call(this, d, i) || [min, max])
                    .range([height, 0]);
            }

            // Retrieve the old x-scale, if this is an update.
            x0 = this.__chart__ || d3.scaleLinear()
                .domain([0, Infinity])
                // .domain([0, max])
                .range(x1.range());

            // Stash the new scale.
            this.__chart__ = x1;

            // Note: the box, median, and box tick elements are fixed in number,
            // so we only have to handle enter and update. In contrast, the outliers
            // and other elements are variable, so we need to exit them! Variable
            // elements also fade in and out.

            // Update outliers.
            outlier = g.selectAll('circle.outlier')
                .data(outlierIndices, Number);

            outlier = outlier.enter().append('g');

            if (flipped) {
                outlier.insert('circle', 'text')
                    .attr('class', 'outlier')
                    .attr('fill', 'white')
                    .attr('r', function () {
                        if (width > 10) {
                            return 5;
                        }

                        return width / 2;
                    })
                    .attr('cy', width / 2)
                    .attr('cx', function (j) { return x0(d[j]); })
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .attr('cx', function (j) { return x1(d[j]); })
                    .style('opacity', 1);

                outlier.append('text').text(function (j) {
                    return d[j];
                })
                    .attr('y', (width / 2) + 7)
                    .attr('x', function (j) { return x1(d[j]) + 4; })
                    .attr('class', 'outlier-label')
                    .attr('font-size', '10px')
                    .attr('style', function () {
                        if (!showLabels) {
                            return 'display:none;';
                        }

                        return '';
                    });
                outlier.exit().transition()
                    .duration(duration)
                    .attr('cx', function (j) { return x1(d[j]); })
                    .style('opacity', 1e-6)
                    .remove();
            } else {
                outlier.insert('circle', 'text')
                    .attr('class', 'outlier')
                    .attr('fill', 'white')
                    .attr('r', function () {
                        if (width > 10) {
                            return 5;
                        }

                        return width / 2;
                    })
                    .attr('cx', width / 2)
                    .attr('cy', function (j) { return x0(d[j]); })
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .attr('cy', function (j) { return x1(d[j]); })
                    .style('opacity', 1);

                outlier.append('text').text(function (j) {
                    return d[j];
                })
                    .attr('x', (width / 2) + 7)
                    .attr('y', function (j) { return x1(d[j]) + 4; })
                    .attr('class', 'outlier-label')
                    .attr('font-size', '10px')
                    .attr('style', function () {
                        if (!showLabels) {
                            return 'display:none;';
                        }

                        return '';
                    });

                outlier.transition()
                    .duration(duration)
                    .attr('cy', function (j) { return x1(d[j]); })
                    .style('opacity', 1);

                outlier.exit().transition()
                    .duration(duration)
                    .attr('cy', function (j) { return x1(d[j]); })
                    .style('opacity', 1e-6)
                    .remove();
            }

            outlier
                .on('mouseover', function (j) {
                    if (chart.showToolTip) {
                        const eventOutlier = [d[j]],
                            eventData = {
                                Outlier: eventOutlier,
                                label: outlierLabel,
                                labelCol: chart.data.dataTable.label,
                                Value: chart.data.dataTable.value
                            },
                            tipData = chart.setTipData(eventData, j);

                        chart.tip.generateSimpleTip(tipData, eventData, chart.data.dataTableKeys);
                        chart.tip.d = d.data;
                        chart.tip.i = i;
                    }
                })
                .on('mousemove', function (j) {
                    if (chart.showToolTip) {
                        const eventOutlier = [d[j]],
                            boxdata = {
                                Outlier: eventOutlier,
                                label: outlierLabel,
                                labelCol: chart.data.dataTable.label,
                                Value: chart.data.dataTable.value
                            },
                            tipData = chart.setTipData(boxdata, j);

                        chart.tip.generateSimpleTip(tipData, boxdata, chart.data.dataTableKeys);
                        chart.tip.d = d.data;
                        chart.tip.i = i;
                    }
                })
                .on('mouseout', function () {
                    if (chart.showToolTip) {
                        chart.tip.hideTip();
                    }
                });

            // set separate tooltips for quartiles and whiskers
            g = g.append('g').attr('class', 'inner-box-container')
                .on('mouseover', function (label) {
                    if (chart.showToolTip) {
                        const eventData = {
                                label: label[0],
                                labelCol: chart.data.dataTable.label,
                                Value: chart.data.dataTable.value,
                                Upper: whiskerData[1],
                                Q3: d.quartiles[2],
                                Median: d.quartiles[1],
                                Q1: d.quartiles[0],
                                Lower: whiskerData[0]
                            },
                            tipData = chart.setTipData(eventData, i);

                        chart.tip.generateSimpleTip(tipData, eventData, chart.data.dataTableKeys);
                        chart.tip.d = d.data;
                        chart.tip.i = i;
                    }
                })
                .on('mousemove', function (label) {
                    if (chart.showToolTip) {
                        const eventData = {
                                label: label[0],
                                labelCol: chart.data.dataTable.label,
                                Value: chart.data.dataTable.value,
                                Upper: whiskerData[1],
                                Q3: d.quartiles[2],
                                Median: d.quartiles[1],
                                Q1: d.quartiles[0],
                                Lower: whiskerData[0]
                            },
                            tipData = chart.setTipData(eventData, i);

                        chart.tip.generateSimpleTip(tipData, eventData, chart.data.dataTableKeys);
                        chart.tip.d = d.data;
                        chart.tip.i = i;
                    }
                })
                .on('mouseleave', function () {
                    if (chart.showToolTip) {
                        chart.tip.hideTip();
                    }
                });


            // Update center line: the vertical line spanning the whiskers.
            center = g.selectAll('line.center')
                .data(whiskerData ? [whiskerData] : []);
            // vertical line
            if (flipped) {
                center.enter().insert('line', 'rect')
                    .attr('class', 'center')
                    .attr('y1', width / 2)
                    .attr('x1', function (dat) { return x0(dat[0]); })
                    .attr('y2', width / 2)
                    .attr('x2', function (dat) { return x0(dat[1]); })
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .style('opacity', 1)
                    .attr('x1', function (dat) { return x1(dat[0]); })
                    .attr('x2', function (dat) { return x1(dat[1]); });

                center.transition()
                    .duration(duration)
                    .style('opacity', 1)
                    .attr('x1', function (dat) { return x1(dat[0]); })
                    .attr('x2', function (dat) { return x1(dat[1]); });

                center.exit().transition()
                    .duration(duration)
                    .style('opacity', 1e-6)
                    .attr('x1', function (dat) { return x1(dat[0]); })
                    .attr('x2', function (dat) { return x1(dat[1]); })
                    .remove();
            } else {
                center.enter().insert('line', 'rect')
                    .attr('class', 'center')
                    .attr('x1', width / 2)
                    .attr('y1', function (dat) { return x0(dat[0]); })
                    .attr('x2', width / 2)
                    .attr('y2', function (dat) { return x0(dat[1]); })
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .style('opacity', 1)
                    .attr('y1', function (dat) { return x1(dat[0]); })
                    .attr('y2', function (dat) { return x1(dat[1]); });

                center.transition()
                    .duration(duration)
                    .style('opacity', 1)
                    .attr('y1', function (dat) { return x1(dat[0]); })
                    .attr('y2', function (dat) { return x1(dat[1]); });

                center.exit().transition()
                    .duration(duration)
                    .style('opacity', 1e-6)
                    .attr('y1', function (dat) { return x1(dat[0]); })
                    .attr('y2', function (dat) { return x1(dat[1]); })
                    .remove();
            }

            hoverArea = g.selectAll('line.hover-area')
                .data(whiskerData ? [whiskerData] : []);
            // vertical line
            if (flipped) {
                hoverArea.enter().insert('line', 'rect')
                    .attr('class', 'hover-area')
                    .attr('y1', width / 2)
                    .attr('x1', function (dat) { return x0(dat[0]); })
                    .attr('y2', width / 2)
                    .attr('x2', function (dat) { return x0(dat[1]); })
                    .style('opacity', 0)
                    .style('stroke-width', width)
                    .transition()
                    .duration(duration)
                    .style('opacity', 0)
                    .attr('x1', function (dat) { return x1(dat[0]); })
                    .attr('x2', function (dat) { return x1(dat[1]); });

                hoverArea.transition()
                    .duration(duration)
                    .style('opacity', 0)
                    .attr('x1', function (dat) { return x1(dat[0]); })
                    .attr('x2', function (dat) { return x1(dat[1]); });

                hoverArea.exit().transition()
                    .duration(duration)
                    .style('opacity', 0)
                    .attr('x1', function (dat) { return x1(dat[0]); })
                    .attr('x2', function (dat) { return x1(dat[1]); })
                    .remove();
            } else {
                hoverArea.enter().insert('line', 'rect')
                    .attr('class', 'hover-area')
                    .attr('x1', width / 2)
                    .attr('y1', function (dat) { return x0(dat[0]); })
                    .attr('x2', width / 2)
                    .attr('y2', function (dat) { return x0(dat[1]); })
                    .style('opacity', 0)
                    .style('stroke-width', width)
                    .transition()
                    .duration(duration)
                    .style('opacity', 0)
                    .attr('y1', function (dat) { return x1(dat[0]); })
                    .attr('y2', function (dat) { return x1(dat[1]); });

                hoverArea.transition()
                    .duration(duration)
                    .style('opacity', 0)
                    .attr('y1', function (dat) { return x1(dat[0]); })
                    .attr('y2', function (dat) { return x1(dat[1]); });

                hoverArea.exit().transition()
                    .duration(duration)
                    .style('opacity', 0)
                    .attr('y1', function (dat) { return x1(dat[0]); })
                    .attr('y2', function (dat) { return x1(dat[1]); })
                    .remove();
            }
            // Update innerquartile box.
            box = g.selectAll('rect.box')
                .data([quartileData]);
            if (flipped) {
                box.enter().append('rect')
                    .attr('fill', function (dat) {
                        if (colorByValue && jvCharts.colorByValue(colorByValueInformation, colorByValue)) {
                            return jvCharts.colorByValue(colorByValueInformation, colorByValue);
                        }

                        return boxColor;
                    })
                    .attr('class', 'box')
                    .attr('y', 0)
                    .attr('x', function (dat) { return x0(dat[2]) - Math.abs(x0(dat[0]) - x0(dat[2])); })
                    .attr('height', width)
                    .attr('width', function (dat) { return Math.abs(x0(dat[0]) - x0(dat[2])); })
                    .transition()
                    .duration(duration)
                    .attr('x', function (dat) { return x1(dat[2]) - Math.abs(x1(dat[0]) - x1(dat[2])); })
                    .attr('width', function (dat) { return Math.abs(x1(dat[0]) - x1(dat[2])); });

                box.transition()
                    .duration(duration)
                    .attr('x', function (dat) { return x1(dat[2]) - Math.abs(x1(dat[0]) - x1(dat[2])); })
                    .attr('width', function (dat) { return Math.abs(x1(dat[0]) - x1(dat[2])); });
            } else {
                box.enter().append('rect')
                    .attr('fill', function () {
                        if (colorByValue && jvCharts.colorByValue(colorByValueInformation, colorByValue)) {
                            return jvCharts.colorByValue(colorByValueInformation, colorByValue);
                        }

                        return boxColor;
                    })
                    .attr('class', 'box')
                    .attr('x', 0)
                    .attr('y', function (dat) { return x0(dat[2]); })
                    .attr('width', width)
                    .attr('height', function (dat) { return x0(dat[0]) - x0(dat[2]); })
                    .transition()
                    .duration(duration)
                    .attr('y', function (dat) { return x1(dat[2]); })
                    .attr('height', function (dat) { return x1(dat[0]) - x1(dat[2]); });

                box.transition()
                    .duration(duration)
                    .attr('y', function (dat) { return x1(dat[2]); })
                    .attr('height', function (dat) { return x1(dat[0]) - x1(dat[2]); });
            }

            // Update median line.
            medianLine = g.selectAll('line.median')
                .data([quartileData[1]]);
            if (flipped) {
                medianLine.enter().append('line')
                    .attr('class', 'median')
                    .attr('y1', 0)
                    .attr('x1', x0)
                    .attr('y2', width)
                    .attr('x2', x0)
                    .transition()
                    .duration(duration)
                    .attr('x1', x1)
                    .attr('x2', x1);

                medianLine.transition()
                    .duration(duration)
                    .attr('x1', x1)
                    .attr('x2', x1);
            } else {
                medianLine.enter().append('line')
                    .attr('class', 'median')
                    .attr('x1', 0)
                    .attr('y1', x0)
                    .attr('x2', width)
                    .attr('y2', x0)
                    .transition()
                    .duration(duration)
                    .attr('y1', x1)
                    .attr('y2', x1);

                medianLine.transition()
                    .duration(duration)
                    .attr('y1', x1)
                    .attr('y2', x1);
            }
            // Update whiskers.
            whisker = g.selectAll('line.whisker')
                .data(whiskerData || []);
            if (flipped) {
                whisker.enter()
                    .insert('line', 'circle, text')
                    .attr('class', 'whisker')
                    .attr('y1', 0)
                    .attr('x1', x0)
                    .attr('y2', 0 + width)
                    .attr('x2', x0)
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .attr('x1', x1)
                    .attr('x2', x1)
                    .style('opacity', 1);

                whisker.transition()
                    .duration(duration)
                    .attr('x1', x1)
                    .attr('x2', x1)
                    .style('opacity', 1);

                whisker.exit().transition()
                    .duration(duration)
                    .attr('x1', x1)
                    .attr('x2', x1)
                    .style('opacity', 1e-6)
                    .remove();
            } else {
                whisker.enter()
                    .insert('line', 'circle, text')
                    .attr('class', 'whisker')
                    .attr('x1', 0)
                    .attr('y1', x0)
                    .attr('x2', 0 + width)
                    .attr('y2', x0)
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .attr('y1', x1)
                    .attr('y2', x1)
                    .style('opacity', 1);

                whisker.transition()
                    .duration(duration)
                    .attr('y1', x1)
                    .attr('y2', x1)
                    .style('opacity', 1);

                whisker.exit().transition()
                    .duration(duration)
                    .attr('y1', x1)
                    .attr('y2', x1)
                    .style('opacity', 1e-6)
                    .remove();
            }
            // Compute the tick format.
            format = tickFormat || x1.tickFormat(8);

            // Update box ticks.
            boxTick = g.selectAll('text.box')
                .data(quartileData);

            if (flipped) {
                boxTick.enter().append('text')
                    .attr('class', 'box')
                    .attr('dx', '.3em')
                    .attr('dy', function (dat, j) { return j & 1 ? 6 : -6; })
                    .attr('y', function (dat, j) { return j & 1 ? +width : 0; })
                    .attr('x', x0)
                    .attr('text-anchor', function (dat, j) { return j & 1 ? 'start' : 'end'; })
                    .attr('style', function () {
                        if (!showLabels) {
                            return 'display: none;';
                        }

                        return '';
                    })
                    .text(format)
                    .transition()
                    .duration(duration)
                    .attr('x', x1);

                boxTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr('x', x1);
            } else {
                boxTick.enter().append('text')
                    .attr('class', 'box')
                    .attr('dy', '.3em')
                    .attr('dx', function (dat, j) { return j & 1 ? 6 : -6; })
                    .attr('x', function (dat, j) { return j & 1 ? +width : 0; })
                    .attr('y', x0)
                    .attr('text-anchor', function (dat, j) { return j & 1 ? 'start' : 'end'; })
                    .attr('style', function () {
                        if (!showLabels) {
                            return 'display: none;';
                        }

                        return '';
                    })
                    .text(format)
                    .transition()
                    .duration(duration)
                    .attr('y', x1);

                boxTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr('y', x1);
            }
            // Update whisker ticks. These are handled separately from the box
            // ticks because they may or may not exist, and we want don't want
            // to join box ticks pre-transition with whisker ticks post-.
            whiskerTick = g.selectAll('text.whisker')
                .data(whiskerData || []);

            if (flipped) {
                whiskerTick.enter().append('text')
                    .attr('class', 'whisker')
                    .attr('dx', '.3em')
                    .attr('dy', 6)
                    .attr('y', width)
                    .attr('x', x0)
                    .attr('style', function () {
                        if (!showLabels) {
                            return 'display:none;';
                        }

                        return '';
                    })
                    .text(format)
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .attr('x', x1)
                    .style('opacity', 1);

                whiskerTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr('x', x1)
                    .style('opacity', 1);

                whiskerTick.exit().transition()
                    .duration(duration)
                    .attr('x', x1)
                    .style('opacity', 1e-6)
                    .remove();
            } else {
                whiskerTick.enter().append('text')
                    .attr('class', 'whisker')
                    .attr('dy', '.3em')
                    .attr('dx', 6)
                    .attr('x', width)
                    .attr('y', x0)
                    .attr('style', function () {
                        if (!showLabels) {
                            return 'display:none;';
                        }

                        return '';
                    })
                    .text(format)
                    .style('opacity', 1e-6)
                    .transition()
                    .duration(duration)
                    .attr('y', x1)
                    .style('opacity', 1);

                whiskerTick.transition()
                    .duration(duration)
                    .text(format)
                    .attr('y', x1)
                    .style('opacity', 1);

                whiskerTick.exit().transition()
                    .duration(duration)
                    .attr('y', x1)
                    .style('opacity', 1e-6)
                    .remove();
            }
        });

        // d3.timer.flush();
        d3.timerFlush();
    }

    box.width = function (x) {
        if (!arguments.length) return width;
        width = x;
        return box;
    };

    box.height = function (x) {
        if (!arguments.length) return height;
        height = x;
        return box;
    };

    box.tickFormat = function (x) {
        if (!arguments.length) return tickFormat;
        tickFormat = x;
        return box;
    };

    box.duration = function (x) {
        if (!arguments.length) return duration;
        duration = x;
        return box;
    };

    function constant(x) {
        return function () {
            return x;
        };
    }
    box.domain = function (x) {
        if (!arguments.length) return domain;
        // domain = x == null ? x : d3.functor(x);
        domain = x === null ? x : constant(x);

        return box;
    };

    box.value = function (x) {
        if (!arguments.length) return value;
        value = x;
        return box;
    };

    box.whiskers = function (x) {
        if (!arguments.length) return whiskers;
        whiskers = x;
        return box;
    };

    box.showLabels = function (x) {
        if (!arguments.length) return showLabels;
        showLabels = x;
        return box;
    };

    box.flipped = function (x) {
        if (!arguments.length) return flipped;
        flipped = x;
        return box;
    };

    box.chart = function (x) {
        if (!arguments.length) return chart;
        chart = x;
        return box;
    };

    box.quartiles = function (x) {
        if (!arguments.length) return quartiles;
        quartiles = x;
        return box;
    };

    return box;
};

function boxWhiskers(d) {
    return [0, d.length - 1];
}

function boxQuartiles(d) {
    return [
        d3.quantile(d, 0.25),
        d3.quantile(d, 0.5),
        d3.quantile(d, 0.75)
    ];
}

export default jvCharts;
