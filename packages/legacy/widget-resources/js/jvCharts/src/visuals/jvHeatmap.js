'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.heatmap = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.generateHeatMap = generateHeatMap;

/* *********************************************** HeatMap functions ******************************************************/

function quantized(chart, min, max) {
    let bucketCount = chart._vars.buckets,
        sectionValue = (max - min) / bucketCount,
        quantizedArray = [];
    for (let i = 0; i < bucketCount; i++) {
        quantizedArray[i] = min + i * sectionValue;
    }
    return quantizedArray;
}

/* *setData
 *  gets heatmap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    let chart = this,
        axisNames = setHeatAxisNames(chart.data);
    chart.data.xAxisData = axisNames.xAxisData;
    chart.data.yAxisData = axisNames.yAxisData;
    chart.data.processedData = setProcessedData(chart, chart.data, chart.data.xAxisData.values, chart.data.yAxisData.values);
    // define color object for chartData
    chart._vars.color = jvCharts.setChartColors(chart._vars.color, chart.data.xAxisData.values, chart.colors);
    chart.data.heatData = setHeatmapLegendData(chart, chart.data);
}


function getEventData(event) {
    let chart = this;

    if (event.target.__data__) {
        let data = event.target.__data__;
        return {
            data: {
                // [chart.currentData.dataTable.heat]: [data.value],
                [chart.currentData.dataTable.x]: [data.xAxisName],
                [chart.currentData.dataTable.y]: [data.yAxisName]
            },
            node: event.target
        };
    }
    return {
        data: {
            [chart.currentData.dataTable.x]: '',
            [chart.currentData.dataTable.y]: ''
        }
    };
}

function highlightFromEventData(highlightData) {
    let chart = this, header;

    chart.svg.select('.heatSection').selectAll('.heat')
        .attr('class', function (d) {
            var isHighlighted = true;
            for (header in highlightData.data) {
                if (highlightData.data.hasOwnProperty(header)) {
                    if (chart.currentData.dataTable.x !== header && chart.currentData.dataTable.y !== header) {
                        // don't evaluate this because this header is not part of the heatmap's x/y dimensions
                        continue;
                    }
                    // if neither x or y are in highlight data then we will not highlight. otherwise, highlight the data point
                    if (highlightData.data[header].indexOf(d.xAxisName) === -1 && highlightData.data[header].indexOf(d.yAxisName) === -1) {
                        isHighlighted = false;
                        break;
                    }
                }
            }

            // normal if column to highlight is not x or y--don't apply to these dimensions
            if (!highlightData.data[chart.currentData.dataTable.x] && !highlightData.data[chart.currentData.dataTable.y]) {
                return 'heat';
            }

            // highlight
            if (isHighlighted) {
                return 'heat rect-border';
            }

            // dim/don't highlight
            return 'heat rect-border rect-highlight';
        });

    // highlighting only labels...but conflicts with double click highlighting...so not doing it for now.
    // chart.svg.selectAll('.rowLabel')
    //     .attr('class', function (d) {
    //         if (highlightData.data[chart.currentData.dataTable.y] && highlightData.data[chart.currentData.dataTable.y].indexOf(d) > -1) {
    //             return '';
    //         }

    //         return 'text-highlight';
    //     });
    // chart.svg.selectAll('.colLabel')
    //     .attr('class', function (d) {
    //         if (highlightData.data[chart.currentData.dataTable.x] && highlightData.data[chart.currentData.dataTable.x].indexOf(d) > -1) {
    //             return '';
    //         }

    //         return 'text-highlight';
    //     });
}

function setHeatmapLegendData(chart, data) {
    let heatData;

    chart._vars.heatmapColor = organizeColors(chart);
    data.heatScores.sort((a, b) => a - b);

    chart.data.colorScale = d3.scaleQuantile()
        .domain(data.heatScores)
        .range(chart._vars.heatmapColor);

    if (chart._vars.heatmapLegend === 'continuous') {
        let temp = chart.data.colorScale.quantiles();
        if (temp[0] === 0) {
            heatData = chart.data.colorScale.quantiles();
        } else {
            heatData = [0].concat(chart.data.colorScale.quantiles());
        }
    } else {
        heatData = quantized(chart, data.heatScores[0], data.heatScores[data.heatScores.length - 1]);
    }

    return heatData;
}

function organizeColors(chart) {
    let colorSelectedBucket = [],
        sValue = chart._vars.buckets,
        newColors = [],
        bucketMapper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        bucketCount = bucketMapper[sValue - 1],
        colors;

    for (let c in chart._vars.heatmapColor) {
        if (chart._vars.heatmapColor.hasOwnProperty(c)) {
            colorSelectedBucket.push(chart._vars.heatmapColor[c]);
        }
    }

    for (var i = 0; i < bucketCount; i++) {
        if (i >= bucketCount / 2) {
            newColors[i] = colorSelectedBucket[Math.round((i + 1) / bucketCount * 9) - 1];
        } else {
            newColors[i] = colorSelectedBucket[Math.round((i) / bucketCount * 9)];
        }
    }

    colors = newColors.slice(0);
    return colors;
}

function setHeatAxisNames(data) {
    var chartData = data.chartData,
        xAxisName = data.dataTable.x,
        yAxisName = data.dataTable.y,
        xAxisArray = [],
        yAxisArray = [],
        returnObj = {};

    for (let key of data.dataTableKeys) {
        if (key.model === 'x') {
            returnObj.xAxisData = {};
            returnObj.xAxisData.dataType = key.type;
            returnObj.xAxisData.label = data.dataTable.x;
        } else if (key.model === 'y') {
            returnObj.yAxisData = {};
            returnObj.yAxisData.dataType = key.type;
            returnObj.yAxisData.label = data.dataTable.y;
        }
    }

    for (let ele of chartData) {
        if (xAxisArray.indexOf(ele[xAxisName]) === -1) {
            xAxisArray.push(ele[xAxisName]);
            // TODO make into 1 function for min max... waste of space
            if (returnObj.xAxisData.dataType === 'NUMBER') {
                // push min and max info
                if (!returnObj.xAxisData.min) {
                    returnObj.xAxisData.min = ele[xAxisName];
                } else if (ele[xAxisName] < returnObj.xAxisData.min) {
                    returnObj.xAxisData.min = ele[xAxisName];
                }

                if (!returnObj.xAxisData.max) {
                    returnObj.xAxisData.max = ele[xAxisName];
                } else if (ele[xAxisName] < returnObj.xAxisData.max) {
                    returnObj.xAxisData.max = ele[xAxisName];
                }
            }
        }
        if (yAxisArray.indexOf(ele[yAxisName]) === -1) {
            yAxisArray.push(ele[yAxisName]);
            if (returnObj.yAxisData.dataType === 'NUMBER') {
                // push min and max info
                if (!returnObj.yAxisData.min) {
                    returnObj.yAxisData.min = ele[yAxisName];
                } else if (ele[yAxisName] < returnObj.yAxisData.min) {
                    returnObj.yAxisData.min = ele[yAxisName];
                }

                if (!returnObj.yAxisData.max) {
                    returnObj.yAxisData.max = ele[yAxisName];
                } else if (ele[yAxisName] < returnObj.yAxisData.max) {
                    returnObj.yAxisData.max = ele[yAxisName];
                }
            }
        }
    }
    returnObj.xAxisData.values = xAxisArray;
    returnObj.yAxisData.values = yAxisArray;

    return returnObj;
}

function setProcessedData(chart, data, xAxisArray, yAxisArray) {
    var chartData = data.chartData,
        xAxisName = data.dataTable.x,
        yAxisName = data.dataTable.y,
        heat = data.dataTable.heat,
        dataArray = [],
        keys;

    data.heatScores = [];
    /* Assign each name a number and place matrix coordinates inside of dataArray */
    for (let i = 0; i < chartData.length; i++) {
        dataArray.push({
            value: chartData[i][heat],
            label: heat,
            xAxisName: chartData[i][xAxisName],
            yAxisName: chartData[i][yAxisName]
        });

        keys = Object.keys(data.dataTable);
        for (let key of keys) {
            if (key.indexOf('tooltip') > -1) {
                dataArray[i][key] = chartData[i][data.dataTable[key]];
            }
        }

        // This array stores the values as numbers
        data.heatScores.push(chartData[i][heat]);
        for (let j = 0; j < xAxisArray.length; j++) {
            if (xAxisArray[j] === dataArray[i].xAxisName) {
                dataArray[i].xAxis = j;
                break;
            }
        }
        for (let j = 0; j < yAxisArray.length; j++) {
            if (yAxisArray[j] === dataArray[i].yAxisName) {
                dataArray[i].yAxis = j;
                break;
            }
        }
    }

    return dataArray;
}

function paint() {
    var chart = this,
        customMargin = {
            top: 0,
            right: 40,
            left: 0,
            bottom: 20
        };

    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;// Might have to move into method bc of reference/value relationship

    // Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, customMargin);
    // chart.generateLegend(chart.currentData.legendData, 'generateHeatMap');
    chart.generateHeatMap();
}

/* *generateHeatMap
 *
 * paints the HeatMap on the chart
 * @params HeatMapData
 */
function generateHeatMap() {
    var chart = this,
        svg = chart.svg,
        colors = chart._vars.heatmapColor,
        quantiles = chart._vars.heatmapLegend,
        data = chart.data.processedData,
        heatMapData = chart.currentData,
        gridSize = chart._vars.heatGridSize,
        legendSpacing = chart._vars.heatLegendSpacing,
        vis, heatMap,
        yAxisTitle, xAxisTitle,
        formatType,
        yAxisSection, xAxisSection, formatValueType,
        yAxis, xAxis, width, height, hLine, vLine,
        legend, legendContainer;

    d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    vis = svg.append('g').attr('transform', 'translate(0,0)').attr('class', 'heatmap');


    yAxisTitle = vis.selectAll('.heatmap')
        .data([heatMapData.dataTable.y]);

    yAxisTitle.enter().append('text')
        .attr('class', 'axisLabels bold')
        .attr('x', -21)
        .attr('y', -5)
        .attr('text-anchor', 'end')
        .attr('transform', () => 'translate(-' + (chart._vars.heatmapYmargin + 10) + ',' + 0 + ')rotate(-90)')
        .text(d => d);

    yAxisTitle.exit().remove();
    formatType = jvCharts.jvFormatValueType(chart.currentData.yAxisData.values, chart.currentData.yAxisData.dataType);

    yAxisSection = vis.append('svg:g')
        .attr('class', 'yAxisSection');

    yAxis = yAxisSection.selectAll('.xAxis')
        .data(heatMapData.yAxisData.values)
        .enter().append('svg:g');

    yAxis.append('text')
        .text(d => {
            var str = jvCharts.jvFormatValue(d, formatType);
            if (str === null) {
                return 'null';
            } else if (str.length > 15) {
                return str.substring(0, 14) + '...';
            }

            return str;
        })
        .attr('x', 0)
        .attr('y', (d, i) => i * gridSize)
        .style('text-anchor', 'end')
        .style('font-size', chart._vars.fontSize)
        .attr('transform', 'translate(-6,' + gridSize / 1.5 + ')')
        .attr('class', 'rowLabel pointer')
        .on('click', function (d) {
            // removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);

            let paintBool = true;
            if (d === chart._vars.selectedX) {
                chart._vars.selectedX = '';
                paintBool = false;
            } else {
                chart._vars.selectedX = d;
            }

            // fade all rects except in this row
            d3.selectAll('.heat').classed('rect-highlight', r => {
                for (var i = 0; i < chart.currentData.yAxisData.values.length; i++) {
                    if (chart.currentData.yAxisData.values[i] === d && d) {
                        if (r.yAxis !== i && paintBool) {
                            return true;
                        }
                    }
                }
                return false;
            });
        });

    yAxis.append('title')
        .text(d => d);


    xAxisTitle = vis.selectAll('.xAxisTitle')
        .data([heatMapData.dataTable.x]);

    xAxisTitle.enter().append('text')
        .attr('class', 'axisLabels bold')
        .attr('x', 6)
        .attr('y', 9)
        .attr('transform', `translate(0, -${chart._vars.heatmapXmargin - 10})`)
        .text(d => d);

    xAxisTitle.exit().remove();

    xAxisSection = vis.append('svg:g')
        .attr('class', 'xAxisSection');

    xAxis = xAxisSection.selectAll('.xAxis')
        .data(heatMapData.xAxisData.values)
        .enter().append('svg:g');

    formatType = jvCharts.jvFormatValueType(chart.currentData.xAxisData.values, chart.currentData.xAxisData.dataType);

    xAxis.append('text')
        .text(d => {
            var str = jvCharts.jvFormatValue(d, formatType);
            if (str === null) {
                return 'null';
            } else if (str.length > 15) {
                return str.substring(0, 14) + '...';
            }

            return str;
        })
        .style('text-anchor', 'start')
        .attr('x', 6)
        .attr('y', 7)
        .attr('class', 'colLabel pointer')
        .attr('transform', (d, i) => `translate(${i * gridSize}, -6)rotate(-45)`)
        .attr('title', d => d)
        .style('font-size', chart._vars.fontSize)
        .on('click', d => {
            // removing styling
            d3.selectAll('.rowLabel').classed('text-highlight', false);
            d3.selectAll('.colLabel').classed('text-highlight', false);
            d3.selectAll('.heat').classed('rect-highlight', false);
            d3.selectAll('.heat').classed('rect-border', false);

            let paintBool = true;
            if (d === chart._vars.selectedX) {
                chart._vars.selectedX = '';
                paintBool = false;
            } else {
                chart._vars.selectedX = d;
            }
            // fade all rects except in this column
            d3.selectAll('.heat').classed('rect-highlight', r => {
                for (var i = 0; i < chart.currentData.xAxisData.values.length; i++) {
                    if (chart.currentData.xAxisData.values[i] === d) {
                        if (r.xAxis !== i && paintBool) {
                            return true;
                        }
                    }
                }
                return false;
            });
        });

    xAxis.append('title')
        .text(d => d);

    width = heatMapData.xAxisData.values.length * gridSize;
    height = heatMapData.yAxisData.values.length * gridSize;
    formatValueType = jvCharts.jvFormatValueType(chart.data.heatData);

    // vertical lines
    vLine = vis.append('svg:g')
        .attr('class', 'vLineSection');

    vLine.selectAll('.vLineSection')
        .data(d3.range(heatMapData.xAxisData.values.length + 1))
        .enter().append('line')
        .attr('x1', d => d * gridSize)
        .attr('x2', d => d * gridSize)
        .attr('y1', 0)
        .attr('y2', height)
        .style('stroke', chart._vars.gridLineColor);

    // horizontal lines
    hLine = vis.append('svg:g')
        .attr('class', 'heatmap-container');

    hLine.selectAll('.heatmap-container')
        .data(d3.range(heatMapData.yAxisData.values.length + 1))
        .enter().append('line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => d * gridSize)
        .attr('y2', d => d * gridSize)
        .style('stroke', chart._vars.gridLineColor);

    heatMap = vis.append('svg:g')
        .attr('class', 'heatSection');

    heatMap.selectAll('.heatSection')
        .data(data)
        .enter().append('rect')
        .attr('x', d => d.xAxis * gridSize)
        .attr('y', d => d.yAxis * gridSize)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('class', 'heat')
        .attr('width', gridSize - 1)
        .attr('height', gridSize - 1)
        .style('fill', d => {
            if (quantiles === 'continuous') {
                if (chart._vars.domainArray.length === 0 || (d.value >= chart._vars.domainArray[0] && d.value <= chart._vars.domainArray[1])) {
                    return chart.data.colorScale(d.value);
                }
                return 'white';
            }
            if (chart._vars.domainArray.length === 0 || (d.value >= chart._vars.domainArray[0] && d.value <= chart._vars.domainArray[1])) {
                return getQuantizedColor(chart.data.heatData, d.value);
            }
            return 'white';
        })
        .on('mouseover', function (d, i) {
            // Get tip data
            var tipData = chart.setTipData(d, i);
            tipData.color = chart.data.colorScale(d.value);

            // Draw tip
            chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
            chart.tip.d = d;
            chart.tip.i = i;
        })
        .on('mousemove', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(d3.event);
                } else {
                    // Get tip data
                    var tipData = chart.setTipData(d, i);
                    // Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function () {
            chart.tip.hideTip();
        })
        .on('dblclick', function (d) {
            chart.clicked = !chart.clicked;
            if (chart.clicked) {
                // border around selected rect
                d3.select(this).classed('rect-border', true);
                // Fade row labels
                d3.selectAll('.rowLabel').classed('text-highlight', (r, ri) => ri != d.yAxis);
                // fade column labels
                d3.selectAll('.colLabel').classed('text-highlight', (r, ri) => ri != d.xAxis);
                // fade all rects except selected
                d3.selectAll('.heat').classed('rect-highlight', r => r.yAxis != d.yAxis || r.xAxis != d.xAxis);
            } else {
                // removing styling
                d3.selectAll('.rowLabel').classed('text-highlight', false);
                d3.selectAll('.colLabel').classed('text-highlight', false);
                d3.selectAll('.heat').classed('rect-highlight', false);
                d3.selectAll('.heat').classed('rect-border', false);
            }
        });


    chart.chartDiv.select('svg.heatLegend').remove();

    if (chart._vars.toggleLegend) {
        legendContainer = chart.chartDiv.append('svg')
            .style('top', chart.config.margin.top + 'px')
            .attr('class', 'heatLegend')
            .attr('width', chart.config.heatWidth);

        legend = legendContainer.selectAll('.legend')
            .data(chart.data.heatData)
            .enter().append('g')
            .attr('transform', (d, i) => `translate(0, ${gridSize * i} )`);

        legend.append('rect')
            .attr('class', 'legend')
            .attr('width', gridSize)
            .attr('height', gridSize)
            .style('fill', (d, i) => colors[i])
            .on('click', () => d3.selectAll('.heat').classed('rect-highlight', false))
            // removing styling
            // fade all rects except selected
            .on('dblclick', d => d3.selectAll('.heat').classed('rect-highlight', r => r.value < d));

        legend.append('text')
            .attr('class', 'legendText')
            .attr('x', gridSize + legendSpacing)
            .attr('y', gridSize - legendSpacing)
            .text(d => {
                if (isNaN(d)) {
                    return d;
                }
                return jvCharts.jvFormatValue(d, formatValueType);
            })
            .style('fill', chart._vars.black);
    }

    function getQuantizedColor(quantizedArray, value) {
        for (let i = 1; i < quantizedArray.length; i++) {
            if (value < quantizedArray[i]) {
                return colors[i - 1];
            }
        }
        return colors[quantizedArray.length - 1];
    }
}

export default jvCharts;


