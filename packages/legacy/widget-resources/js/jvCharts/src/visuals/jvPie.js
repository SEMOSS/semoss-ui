'use strict';
import jvCharts from '../jvCharts.js';
import * as d3 from 'd3';
jvCharts.prototype.pie = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.generatePie = generatePie;

/* *********************************************** Pie Data functions ******************************************************/

/* setPieData
 *  gets pie data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;

    //  Set data if a 'bucket' is specified--paints # specified, groups rest into other category
    if (chart._vars.hasOwnProperty('buckets') && parseInt(chart._vars.buckets, 10) !== 0) {
        //  bucket the data
        let data = chart.data,
            otherValue = 0,
            bucketData = [],
            i;

        data.chartData.sort((a, b) => b[data.dataTable.value] - a[data.dataTable.value]);

        for (i = 0; i < data.chartData.length; i++) {
            if (i < chart._vars.buckets) {
                bucketData.push(data.chartData[i]);
            } else {
                otherValue += data.chartData[i][data.dataTable.value];
            }
        }

        if (otherValue > 0) {
            bucketData.push({
                [data.dataTable.label]: 'Other',
                [data.dataTable.value]: otherValue
            });
            data.chartData = bucketData;
        }
    }
    // Set legend data after determining if the data is bucketed
    chart.data.legendData = setPieLegendData(chart.data);
    // define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function getEventData(event) {
    var chart = this,
        ele = event.target.classList.value.split('pie-data-')[1];
    if (ele) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [jvCharts.getRawForValue(ele)]
            },
            node: event.target
        };
    } else if (event.target.classList.value.indexOf('pie-container') > -1) {
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
    chart.svg.select('.pie-container').selectAll('.slice')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    // highlight necessary slices
    if (node) {
        node
            .attr('stroke', chart._vars.highlightBorderColor)
            .attr('stroke-width', chart._vars.highlightBorderWidth);
    }
}

/* *setPieLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPieLegendData(data) {
    return data.chartData.map(chartEle => chartEle[data.dataTable.label]);
}

function paint() {
    var chart = this,
        customMargins = {
            top: 40,
            right: 20,
            bottom: 20,
            left: 20
        };

    chart.currentData = chart.data;
    chart._vars.color = chart.data.color;
    chart.legendData = chart.data.legendData;
    chart.generateSVG(chart.data.legendData, customMargins);

    // If the container size is small, don't generate a legend
    if (chart.config.container.width > 550) {
        chart.generateVerticalLegend('generatePie');
    }

    chart.generatePie(chart.currentData);
}

/* *generatePie
 *
 * creates and draws a pie chart on the svg element
 * @params svg, pieData, _vars, container
 * @returns {{}}
 */
function generatePie(currentData) {
    var chart = this,
        svg = chart.svg,
        // necessary to copy the data, for toggling legend elements
        pieData = JSON.parse(JSON.stringify(currentData.chartData)),
        container = chart.config.container,
        legendData = chart.currentData.legendData,
        colors = chart._vars.color,
        colorByValue = chart._vars.colorByValue,
        w = container.width,
        h = container.height,
        r = Math.min(h / 2, w / 3),
        total = 0,
        legendElementToggleArray,
        vis,
        arc,
        arcs,
        dataTable = chart.currentData.dataTable;

    // define variables to change attr's
    svg.select('g.pie-container').remove();

    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }

    legendElementToggleArray = jvCharts.getLegendElementToggleArray(chart._vars.legendHeaders, legendData);
    pieData
        .filter(slice => legendElementToggleArray.find(ele => ele.element === slice[dataTable.label] && !ele.toggle))
        .map(slice => {
            slice[dataTable.value] = 0;
        });

    total = pieData.reduce((sum, slice) => sum + parseFloat(slice[dataTable.value]), 0);
    vis = svg
        .append('g')
        .data([pieData])
        .attr('class', 'pie-container')
        .attr('height', 200)
        .attr('transform', `translate(${w / 2}, ${r})`);

    // declare an arc generator function
    arc = d3.arc()
        .innerRadius(0)// Normal pie chart when this = 0, can be changed to create donut chart
        .outerRadius(r);

    // select paths, use arc generator to draw
    arcs = vis
        .selectAll('g.slice')
        .data(d3.pie().value(d => d[dataTable.value]))
        .enter().append('g').attr('class', 'slice');

    arcs.append('path')
        .attr('fill', (d, i) => {
            if (colorByValue && jvCharts.colorByValue(d, colorByValue)) {
                return jvCharts.colorByValue(d, colorByValue);
            }

            return jvCharts.getColors(colors, i, d.data[dataTable.label]);
        })
        .attr('d', d => arc(d))
        .attr('class', (d) => {
            if (typeof d.data[dataTable.label] !== 'string') {
                return '';
            }

            return `editable editable-pie pie-slice-${jvCharts.getViewForValue(d.data[dataTable.label])} highlight-class-${jvCharts.getViewForValue(d.data[dataTable.label])} pie-data-${jvCharts.getViewForValue(d.data[dataTable.label])}`;
        })
        .attr('stroke', chart._vars.pieBorder)
        .attr('stroke-width', chart._vars.pieBorderWidth)
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                // Get tip data
                var tipData = chart.setTipData(d.data, i);
                //  Draw tip line
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
            chart.tip.hideTip();
        });

    arcs.append('svg:text')
        .attr('class', 'sliceLabel')
        .attr('transform', (d) => {
            let centroid = arc.centroid(d);
            centroid[0] = centroid[0] * 1.6;
            centroid[1] = centroid[1] * 1.6;
            return `translate(${centroid})`;
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .text((d, i) => {
            var percent = pieData[i][dataTable.value] / total * 100;
            percent = d3.format('.1f')(percent);
            if (percent > 1) {
                return percent + '%';
            }
            return percent;
        })
        .attr('font-size', chart._vars.fontSize)
        .attr('fill', chart._vars.pieTextColor)
        .attr('pointer-events', 'none');
}

export default jvCharts;
