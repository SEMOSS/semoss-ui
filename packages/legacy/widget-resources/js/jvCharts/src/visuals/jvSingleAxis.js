'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.singleaxis = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.getSingleAxisData = getSingleAxisData;
jvCharts.prototype.getSingleAxisZ = getSingleAxisZ;
jvCharts.prototype.generatePoints = generatePoints;

function isEmpty(value) {
    return typeof value === 'undefined' || value === null;
}

/* *********************************************** Single Axis Cluster functions ******************************************************/

function setData() {
    var chart = this;
    chart.currentData = { chartData: chart.data.chartData, dataTable: chart.data.dataTable };

    // Set the legend Data to the label from dataTable Keys
    chart.currentData.legendData = setSingleAxisLegendData(chart.currentData);
    chart.currentData.xAxisData = chart.getSingleAxisData(chart.currentData.chartData, chart.currentData.dataTable);

    if (chart.currentData.dataTable.hasOwnProperty('size')) {
        chart.currentData.zAxisData = chart.getSingleAxisZ(chart.currentData.chartData);
    }

    chart.currentData.color = jvCharts.setChartColors(chart._vars.color, chart.currentData.legendData, chart.colors);
}

/* *setScatterLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setSingleAxisLegendData(data) {
    let legendArray = [];
    if (data.dataTable.hasOwnProperty('facet')) {
        let facet = data.dataTable.facet;
        for (let chartEle of data.chartData) {
            if (legendArray.indexOf(chartEle[facet]) === -1) {
                legendArray.push(chartEle[facet]);
            }
        }
    }

    if (legendArray.length === 0 || typeof legendArray[0] === 'undefined') {
        legendArray.push(data.dataTable.label);
    }

    // order legend data in alphabetical order
    legendArray.sort();
    return legendArray;
}

function getEventData(event) {
    var chart = this;
    if (event.target.classList.value.split('cell-')[1]) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [jvCharts.getRawForValue(event.target.classList.value.split('cell-')[1])]
            },
            node: event.target
        };
    } else if (event.target.classList.value.indexOf('editable-svg') > -1) {
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

    chart.svg.select('.singleaxis-container').selectAll('circle')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    // highlight necessary circles
    if (node) {
        node
            .attr('stroke', chart._vars.highlightBorderColor)
            .attr('stroke-width', chart._vars.highlightBorderWidth);
    }
}

function paint() {
    var chart = this,
        splitData = {}, // If there is a split, the data that has been split
        numVizzes, // If there is a split, the number of single axis clusters that are created
        customSize = {}, // If there is a split, the svg needs to be a custom predefined height
        margin = {
            top: 50,
            left: 100,
            right: 100,
            bottom: 50
        };

    // If there is a split on the viz, run through this logic
    if (chart.data.dataTable.facet) {
        let splitDataKeys = [],
            splitOptionName = chart.data.dataTable.facet.replace(/_/g, ' ');

        // Check to see how many vizzes need to be created because of the split
        for (let ele of chart.currentData.chartData) {
            let addToKeys = true;
            for (let key of splitDataKeys) {
                if (ele[splitOptionName] === key) {
                    addToKeys = false;
                    break;
                }
            }
            if (addToKeys) {
                splitDataKeys.push(ele[splitOptionName]);
            }
        }

        // Create Object with keys and assign each element of the data array to corresponding object
        for (let key of splitDataKeys) {
            splitData[key] = [];// Assign empty array to each location
        }

        // Assign Data elements to appropriate place in splitData object
        for (let ele of chart.currentData.chartData) {
            splitData[ele[splitOptionName]].push(ele);
        }

        numVizzes = splitDataKeys.length;
        customSize.height = (numVizzes) * 300;

        chart.generateSVG(chart.currentData.legendData, margin, customSize);
        chart.generateXAxis(chart.currentData.xAxisData);
        chart.drawGridlines(chart.currentData.xAxisData);

        for (let i = 0; i < numVizzes; i++) {
            chart.generatePoints(splitData[splitDataKeys[i]], i);
        }
    } else { // When there isn't a split, the base case
        chart.generateSVG(chart.currentData.legendData, margin, customSize);
        chart.generateXAxis(chart.currentData.xAxisData);
        chart.drawGridlines(chart.currentData.xAxisData);
        chart.generatePoints(chart.currentData.chartData);
    }

    if (typeof chart.currentData.xAxisScale.ticks === 'function') {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.ticks().length);
    } else {
        chart.formatXAxisLabels(chart.currentData.xAxisScale.domain().length);
    }
}

function getSingleAxisZ(data) {
    var chart = this,
        size = chart.currentData.dataTable.size,
        min = data[0][size],
        max = data[0][size];
    // Find min and max of the data
    for (let i = 0; i < data.length; i++) {
        let num = data[i][size];
        if (num > max) {
            max = num;
        } else if (num < min) {
            min = num;
        }
    }

    return {
        'min': min,
        'max': max,
        'label': size
    };
}

function generatePoints(data, yLevel) {
    var chart = this,
        svg = chart.svg,
        width = chart.config.container.width,
        height = chart.config.container.height,
        dataTable = chart.currentData.dataTable,
        xAxisData = chart.currentData.xAxisData,
        zAxisData = chart.currentData.zAxisData,
        container = chart.config.container,
        radius = chart._vars.NODE_MIN_SIZE,
        pointColor = '#609cdb',
        coloredPoint = '#e88a17',
        colorByValue = chart._vars.colorByValue,
        x = jvCharts.getAxisScale('x', xAxisData, chart.config.container, chart._vars),
        currentAxisHeight,
        simulation,
        cell,
        color = d3.scaleOrdinal().range(chart.colors.map(c => {
            c = d3.rgb(c);
            c.opacity = 1;
            return c;
        }));

    const SPLIT_CLUSTER_HEIGHT = 300,
        TRANSLATE_SPLIT_CLUSTER = 150;

    // If there's a split, account for the multiple axes
    if (!isEmpty(yLevel)) {
        currentAxisHeight = (yLevel * SPLIT_CLUSTER_HEIGHT) + TRANSLATE_SPLIT_CLUSTER;// Each height is 100px
    } else {
        currentAxisHeight = height / 2;
    }

    if (!chart._vars.NODE_MIN_SIZE) {
        chart._vars.NODE_MIN_SIZE = 4.5;
    }
    if (!chart._vars.NODE_MAX_SIZE) {
        chart._vars.NODE_MAX_SIZE = 25;
    }

    chart.chartDiv.select('.container').attr('class', 'singleaxis-container');

    // Add a path line through the height of the axis
    if (!isEmpty(yLevel)) {
        svg.append('line')
            .attr('x1', 0)
            .attr('x2', container.width)
            .attr('y1', currentAxisHeight)
            .attr('y2', currentAxisHeight)
            .attr('stroke', 'white')
            .attr('stroke-width', '20px')
            .attr('transform', 'translate(0, ' + TRANSLATE_SPLIT_CLUSTER + ')');

        svg.append('text')
            .datum(data)
            .attr('x', 0)
            .attr('y', currentAxisHeight)
            .text((d) => {
                if (chart.data.dataTable.facet) {
                    d[0][chart.data.dataTable.facet.replace(/_/g, ' ')];
                }
            })
            .attr('transform', 'translate(-85, 0)');
    }


    simulation = d3.forceSimulation(data)
        .alphaDecay(0.05)
        .force('x', d3.forceX(d => x(d[dataTable.x]))
            .strength(1))
        .force('y', d3.forceY(currentAxisHeight))
        .force('collide', d3.forceCollide(d => {
            let norm,
                val = chart._vars.NODE_MIN_SIZE;
            // Set collision radius equal to the radius of the circle
            if (dataTable.hasOwnProperty('size')) {
                norm = (d[dataTable.size] - zAxisData.min) / (zAxisData.max - zAxisData.min);
                val = (chart._vars.NODE_MAX_SIZE - chart._vars.NODE_MIN_SIZE) * norm + chart._vars.NODE_MIN_SIZE;
            }
            return val;
        }).strength(1))
        .force('charge', d3.forceManyBody().strength(-6))
        .stop();

    for (let i = 0; i < 120; ++i) simulation.tick();

    cell = svg.append('g')
        .attr('class', 'cells')
        .selectAll('g')
        .data(d3.voronoi()
            .extent([[0, 0], [width, height]])
            .x(d => d.x)
            .y(d => d.y)
            .polygons(data)
        )
        .enter()
        .append('g');
    cell
        .append('circle')
        .attr('class', d => {
            return 'cell-' + jvCharts.getViewForValue(d.data[chart.currentData.dataTable.label]) + ' highlight-class-' + jvCharts.getViewForValue(d.data[chart.currentData.dataTable.label]);
        })
        .attr('r', d => {
            radius = chart._vars.NODE_MIN_SIZE;
            if (dataTable.hasOwnProperty('size') && !isEmpty(d) && d.hasOwnProperty('data')) {
                var norm = (d.data[dataTable.size] - zAxisData.min) / (zAxisData.max - zAxisData.min);
                if (!isNaN(norm)) {
                    radius = (chart._vars.NODE_MAX_SIZE - chart._vars.NODE_MIN_SIZE) * norm + chart._vars.NODE_MIN_SIZE;
                } else {// If there is only 1 node on the chart
                    radius = chart._vars.NODE_MIN_SIZE;
                }
            } else if (isEmpty(d)) {
                radius = 0;// Don't display undefined nodes
            }
            return radius;
        })
        .attr('cx', d => isEmpty(d) ? 0 : d.data.x)
        .attr('cy', d => isEmpty(d) ? 0 : d.data.y)
        .attr('fill', function (d, i) {
            if (colorByValue && jvCharts.colorByValue(d, colorByValue)) {
                return jvCharts.colorByValue(d, colorByValue);
            }
            if (!isEmpty(d) && (!d.color || d.color.indexOf('#') === -1)) {
                let cellColor;
                cellColor = jvCharts.getColors(chart.currentData.color, i, d.data[chart.data.dataTable.facet]);
                return cellColor;
            }
            // if (!isEmpty(d) && d.data[chart._vars.colorDataCategory] === chart._vars.colorDataInstance) {
            //     return coloredPoint;
            // }
            return pointColor;
        })
        .attr('opacity', 0.8)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                var tipData = chart.setTipData(d, i);
                chart.tip.generateSimpleTip(tipData, dataTable, chart.data.dataTableKeys);
                chart.tip.d = d;
                chart.tip.i = i;
            }
            d3.select(this).attr('r', function (c) {
                return radius * 3;
            });
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
                chart.tip.hideTip();
            }

            d3.select(this).attr('r', function (c) {
                return radius;
            });
        });
}

function getSingleAxisData(data, dataTable) {
    var chart = this,
        label,
        dataType,
        min,
        max,
        values = [];

    if (dataTable) {
        if (dataTable.hasOwnProperty('x')) {
            label = dataTable.x;
        }
    }

    dataType = 'NUMBER';

    for (let ele of data) {
        values.push(ele[dataTable.x]);
    }

    min = Math.min.apply(null, values);
    max = Math.max.apply(null, values);

    // Add a 10% buffer to both sides
    min = Math.floor(min - ((max - min) * 0.10));
    max = Math.ceil(max + ((max - min) * 0.10));

    // For axis min/max widget
    if (chart._vars.hasOwnProperty('xMin') && chart._vars.xMin !== 'none') {
        min = chart.options.xMin;
    }
    if (chart._vars.hasOwnProperty('xMax') && chart._vars.xMax !== 'none') {
        max = chart._vars.xMax;
    }

    return {
        'label': label,
        'values': values,
        'dataType': dataType,
        'min': min,
        'max': max
    };
}

export default jvCharts;
