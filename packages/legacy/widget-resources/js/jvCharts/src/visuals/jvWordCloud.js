'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';
const cloud = require('../../lib/d3-cloud/d3.layout.cloud.js');

jvCharts.prototype.cloud = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateCloud = generateCloud;

/* *********************************************** Cloud functions ******************************************************/

/* *setCloudData
 *  gets cloud data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    // define color object for chartData
    chart.data.color = chart.colors;
}

function getEventData() {
    return {};
}

/* *setCloudLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setCloudLegendData(data) {
    var legendArray = [], i;
    for (i = 0; i < data.chartData.children.length; i++) {
        if (legendArray.indexOf(data.chartData.children[i][data.dataTable.series]) === -1) {
            legendArray.push((data.chartData.children[i][data.dataTable.series]));
        }
    }
    return legendArray;
}

function paint() {
    var chart = this, cloudMargins;
    if (!chart.smallerFontRepaint) {
        chart._vars.fontSizeMax = 80;
        chart.currentData = chart.data;
    } else {
        chart.currentData = JSON.parse(JSON.stringify(chart.data));
    }
    chart._vars.color = chart.data.color;

    cloudMargins = {
        top: 15,
        right: 15,
        left: 15,
        bottom: 15
    };

    // Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, cloudMargins);
    // chart.generateLegend(chart.currentData.legendData, 'generateCloud');
    chart.generateCloud(chart.currentData);
}

/* * generateCloud
 *
 * paints the cloud  on the chart
 * @params cloud Data
 */
function generateCloud(cloudData) {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        relationMap = chart.data.dataTable,
        colorByValue = chart._vars.colorByValue,
        width = container.width,
        height = container.height,
        margin = chart.config.margin,
        min, max, categories, color, fontSize, layout, wordcloud;

    categories = d3.keys(d3.nest().key(function (d) {
        if (!min && !max) {
            min = d[relationMap.value];
            max = d[relationMap.value];
        } else {
            if (d[relationMap.value] > max) {
                max = d[relationMap.value];
            }
            if (d[relationMap.value] < min) {
                min = d[relationMap.value];
            }
        }

        return d[relationMap.value];
    }).map(cloudData.chartData));

    if (!chart._vars.fontSizeMax) {
        chart._vars.fontSizeMax = 80;
    }

    color = d3.scaleOrdinal()
        .range(chart.data.color
            .map(function (c) {
                var newC;
                newC = d3.rgb(c);
                newC.opacity = 0.8;
                return newC;
            }));

    fontSize = d3.scalePow().exponent(5).domain([0, 1]).range([10, chart._vars.fontSizeMax]);
    chart.smallerFontRepaint = false;
    layout = cloud()
        .timeInterval(10)
        .size([width, height])
        .words(cloudData.chartData)
        .rotate(function () { return 0; })
        .font('Inter')
        .fontSize(function (d) {
            return fontSize(max - min !== 0 ? (d[relationMap.value] - min) / (max - min) : 0);
        })
        .repaintWithSmallerFont(function () {
            if (chart._vars.fontSizeMax > 10) {
                chart._vars.fontSizeMax -= 5;
                chart.smallerFontRepaint = true;
                paint();
            }
        })
        .text(function (d) { return d[relationMap.label]; })
        .spiral('archimedean')
        .on('end', draw)
        .start();

    wordcloud = svg.append('g')
        .attr('class', 'wordcloud')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    function draw() {
        if (chart.smallerFontRepaint) {
            return;
        }
        wordcloud.selectAll('text')
            .data(cloudData.chartData)
            .enter().append('text')
            .attr('class', 'word')
            .style('font-size', function (d) {
                return d.size + 'px';
            })
            .style('font-family', function (d) {
                return d.font;
            })
            .style('fill', function (d) {
                var data = {data: d};

                if (colorByValue && jvCharts.colorByValue(data, colorByValue)) {
                    return jvCharts.colorByValue(data, colorByValue);
                }

                return color(d[relationMap.value]);
            })
            .attr('text-anchor', 'middle')
            .text(function (d) { return d.text; })
            .on('mouseover', function (d, i) {
                // Get tip data
                var tipData = chart.setTipData(d, i);
                tipData.color = color(d[relationMap.value]);

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
            .transition().duration('1000')
            .attr('transform', function (d) { return 'translate(' + [d.x, d.y] + ')rotate(' + d.rotate + ')'; });
    }
}

export default jvCharts;
