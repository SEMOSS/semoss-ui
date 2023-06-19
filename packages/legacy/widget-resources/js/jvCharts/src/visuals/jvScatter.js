'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.scatterplot = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.generateScatter = generateScatter;
jvCharts.prototype.createLineGuide = createLineGuide;

/* *********************************************** Scatter functions ******************************************************/

/* *setScatterData
 *  gets scatter data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    chart.data.legendData = setScatterLegendData(chart.data);
    chart.data.xAxisData = setScatterAxisData(chart.data, 'x', chart._vars);
    chart.data.yAxisData = setScatterAxisData(chart.data, 'y', chart._vars);
    chart.data.zAxisData = chart.data.dataTable.hasOwnProperty('z') ? setScatterAxisData(chart.data, 'z', chart._vars) : {};
    // define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData(event, mouse) {
    var chart = this,
        ele = event.target.__data__;
    // determine if the click event happens inside the container
    let brushContainer = chart.chartDiv.select('.' + chart.config.type + '-container rect').node(),
        containerBox = brushContainer.getBoundingClientRect(),
        x = mouse[0],
        y = mouse[1],
        insideContainer = false;
    if (x < containerBox.right && y < containerBox.bottom && x > containerBox.left && y > containerBox.top) {
        insideContainer = true;
    }
    if (insideContainer && ele) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [jvCharts.getRawForValue(ele[chart.currentData.dataTable.label])]
            },
            node: event.target
        };
    } else if (insideContainer) {
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
    let chart = this, labelIdx,
        labels = event.data[chart.currentData.dataTable.label],
        cssClass,
        node;

    chart.svg.select('.scatter-circle').selectAll('circle')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    // highlight necessary circles
    if (event.data[chart.currentData.dataTable.label]) {
        for (labelIdx = 0; labelIdx < labels.length; labelIdx++) {
            cssClass = '.highlight-class-' + jvCharts.getViewForValue(labels[labelIdx]);
            node = chart.svg.selectAll(cssClass);

            node
                .attr('stroke', chart._vars.highlightBorderColor)
                .attr('stroke-width', chart._vars.highlightBorderWidth);
        }
    }
}

/* *setScatterLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setScatterLegendData(data) {
    let legendArray = [];
    if (data.dataTable.hasOwnProperty('series')) {
        let series = data.dataTable.series;
        for (let chartEle of data.chartData) {
            if (legendArray.indexOf(chartEle[series]) === -1) {
                legendArray.push(chartEle[series]);
            }
        }
    }

    if (legendArray.length === 0 || typeof legendArray[0] === 'undefined') {
        legendArray.push(data.dataTable.label);
        data.dataTable.series = data.dataTable.label;
    }

    // order legend data in alphabetical order
    legendArray.sort();
    return legendArray;
}

/* *setScatterAxisData
 *  gets z axis data based on the chartData
 *
 * @params data, dataTable
 * @returns object with label and values
 */
function setScatterAxisData(data, axis, _vars) {
    // declare vars
    var axisData = [],
        chartData = data.chartData,
        scatterLabel = data.dataTable[axis],
        min = scatterLabel ? chartData[0][scatterLabel] : 0,
        max = scatterLabel ? chartData[0][scatterLabel] : 0;

    // loop over data to find max and min
    // also determines the y axis total if the data is stacked
    for (let chartEle of chartData) {
        if (chartEle.hasOwnProperty(scatterLabel)) {
            let num = chartEle[scatterLabel];
            if (!isNaN(num)) {
                num = parseFloat(num);
                if (num > max) {
                    max = num;
                } else if (num < min) {
                    min = num;
                }
            }
        }
    }
    if (axis !== 'z') {
        min *= 0.9;
        max *= 1.1;
    }

    if (_vars.yMin && !isNaN(_vars.yMin) && axis === 'y') {
        min = _vars.yMin;
    }
    if (_vars.yMax && !isNaN(_vars.yMax) && axis === 'y') {
        max = _vars.yMax;
    }
    if (_vars.xMin && !isNaN(_vars.xMin) && axis === 'x') {
        min = _vars.xMin;
    }
    if (_vars.xMax && !isNaN(_vars.xMax) && axis === 'x') {
        max = _vars.xMax;
    }

    axisData.push(min);
    axisData.push(max);
    return {
        'label': scatterLabel,
        'values': axisData,
        'dataType': 'NUMBER',
        'min': min,
        'max': max
    };
}

function paint() {
    var chart = this,
        dataObj = {};

    dataObj.chartData = chart.data.chartData;
    dataObj.legendData = chart.data.legendData;
    dataObj.dataTable = chart.data.dataTable;
    chart._vars.color = chart.data.color;
    dataObj.xAxisData = chart.data.xAxisData;
    dataObj.yAxisData = chart.data.yAxisData;
    dataObj.zAxisData = chart.data.zAxisData;
    chart.currentData = dataObj;


    // generate svg dynamically based on legend data
    chart.generateSVG(dataObj.legendData);

    // TODO remove these from draw object
    chart.generateXAxis(chart.currentData.xAxisData);
    chart.generateYAxis(chart.currentData.yAxisData);
    chart.generateLegend(chart.currentData.legendData, 'generateScatter');

    chart.generateScatter();

    if (chart._vars.lineGuide) {
        chart.createLineGuide();
    }

    if (typeof dataObj.xAxisScale.ticks === 'function') {
        chart.formatXAxisLabels(dataObj.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(dataObj.xAxisScale.domain().length);
    }
}

function calculateMean(data, type) {
    return d3.mean(data, value => +value[type]);
}

function createLineGuide() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        chartData = chart.currentData.chartData,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        xMean = calculateMean(chartData, dataTable.x),
        yMean = calculateMean(chartData, dataTable.y),
        xScale = jvCharts.getAxisScale('x', xAxisData, container, chart._vars),
        yScale = jvCharts.getAxisScale('y', yAxisData, container, chart._vars),
        lineGroup;

    svg.selectAll('g.lineguide.x').remove();
    svg.selectAll('g.lineguide.y').remove();

    lineGroup = svg.append('g')
        .attr('class', 'line-group');

    // create crosshair based on median x (up/down)
    lineGroup.append('g')
        .attr('class', 'lineguide x')
        .append('line')
        .style('stroke', 'gray')
        .style('stroke-dasharray', ('3, 3'))
        .style('fill', 'black')
        .attr('x1', xScale(xMean))
        .attr('y1', 0)
        .attr('x2', xScale(xMean))
        .attr('y2', container.height);

    // create crosshair based on median y (left/right)
    lineGroup.append('g')
        .attr('class', 'lineguide y')
        .append('line')
        .style('stroke', 'gray')
        .style('stroke-dasharray', ('3, 3'))
        .style('fill', 'black')
        .attr('x1', 0)
        .attr('y1', yScale(yMean))
        .attr('x2', container.width)
        .attr('y2', yScale(yMean));
}

/* *generateScatter
 *
 * creates and draws a scatter plot on the svg element
 * @params svg, scatterData, _vars, xAxisData, yAxisData, zAxisData, container, dataTable legendData
 * @returns {{}}
 */
function generateScatter() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        scatterData = chart.currentData.chartData,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        yAxisData = chart.currentData.yAxisData,
        zAxisData = chart.currentData.zAxisData,
        legendData = chart.currentData.legendData,
        colorByValue = chart._vars.colorByValue,
        colors = chart._vars.color,
        legendElementToggleArray,
        scatterDataFiltered = [],
        x,
        y,
        z;

    if (!chart._vars.NODE_MIN_SIZE) {
        chart._vars.NODE_MIN_SIZE = 4.5;
    }
    if (!chart._vars.NODE_MAX_SIZE) {
        chart._vars.NODE_MAX_SIZE = 25;
    }

    svg.selectAll('g.scatterplot-container').remove();
    svg.selectAll('g.scatterplot-container.editable-scatter').remove();

    // set clip path rectangle
    svg.append('clipPath')
        .attr('id', 'scatter-area')
        .attr('class', 'scatterplot-container')
        .append('rect')
        .attr('x', 1)
        .attr('width', container.width - 1)
        .attr('height', container.height);


    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }

    legendElementToggleArray = jvCharts.getLegendElementToggleArray(chart._vars.legendHeaders, legendData);

    scatterDataFiltered = scatterData.filter(point => {
        // TODO: ....
        // when there is only one header we have to just check toggle value
        if (legendElementToggleArray.length === 1 && legendElementToggleArray[0].toggle) {
            return true;
        } else if (legendElementToggleArray === 1 && !legendElementToggleArray[0].toggle) {
            return false;
        }

        // otherwise lets go thru all the of the legend elements and determine if we need to filter or not
        for (let i = 0, len = legendElementToggleArray.length; i < len; i++) {
            if (point[dataTable.series] === legendElementToggleArray[i].element && legendElementToggleArray[i].toggle) {
                return true;
            }
        }

        return false;
    });

    x = jvCharts.getAxisScale('x', xAxisData, container, chart._vars);
    y = jvCharts.getAxisScale('y', yAxisData, container, chart._vars);
    z;

    if (zAxisData && typeof zAxisData === 'object' && Object.keys(zAxisData).length > 0) {
        z = jvCharts.getZScale(zAxisData, container, chart._vars);
    }

    if (!svg.select('.scatterplot-circles').empty()) {
        svg.select('.scatterplot-circles').remove();
    }

    svg.append('g')
        .attr('class', 'scatterplot-circles')
        .selectAll('g')
        .data(scatterDataFiltered)
        .enter()
        .append('circle')
        .attr('clip-path', 'url(#scatter-area)')
        .attr('class', function (d, i) {
            return 'editable editable-scatter scatter-circle-' + jvCharts.getViewForValue(chart.currentData.chartData[i][chart.currentData.dataTable.label]) + ' highlight-class-' + jvCharts.getViewForValue(chart.currentData.chartData[i][chart.currentData.dataTable.label]);
        })
        .attr('cx', (d, i) => x(scatterDataFiltered[i][xAxisData.label]))
        .attr('cy', (d, i) => y(scatterDataFiltered[i][yAxisData.label]))
        .attr('opacity', 0.8)
        .attr('r', (d, i) => {
            if (dataTable.hasOwnProperty('z')) {
                if (chart._vars.toggleZ && zAxisData && typeof zAxisData === 'object' && Object.keys(zAxisData).length > 0 && scatterDataFiltered[i][dataTable.z]) {
                    return z(scatterDataFiltered[i][dataTable.z]);
                }
            }
            return chart._vars.NODE_MIN_SIZE;
        })
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                this.setAttribute('clip-path', '');
                var tipData = chart.setTipData(d, i);

                // Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                chart.tip.d = d;
                chart.tip.i = i;
            }
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
            if (chart.showToolTip) {
                this.setAttribute('clip-path', 'url(#scatter-area)');
                chart.tip.hideTip();
            }
        })
        .attr('fill', (d, i) => {
            var colorByValueIdx,
                colorByValueLen;

            if (colorByValue) {
                for (colorByValueIdx = 0, colorByValueLen = colorByValue.length; colorByValueIdx < colorByValueLen; colorByValueIdx++) {
                    let colorOn = d[colorByValue[colorByValueIdx].colorOn];
                    if (isNaN(colorOn)) {
                        if (colorOn && colorByValue[colorByValueIdx].valuesToColor.includes(colorOn.replace(/ /g, '_'))) {
                            return colorByValue[colorByValueIdx].color;
                        }
                    } else if (colorByValue[colorByValueIdx].valuesToColor.includes(colorOn)) {
                        return colorByValue[colorByValueIdx].color;
                    }
                }
            }

            return jvCharts.getColors(colors, i, scatterDataFiltered[i][dataTable.series]);
        });
}

export default jvCharts;
