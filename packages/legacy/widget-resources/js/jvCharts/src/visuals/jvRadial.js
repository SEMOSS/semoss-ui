'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';
import visualizationUniversal from '../../../../../core/store/visualization/visualization.js';

jvCharts.prototype.radial = {
    paint: paint,
    setData: setData,
    getEventData: getEventData,
    highlightFromEventData: highlightFromEventData
};

jvCharts.prototype.generateRadial = generateRadial;

/* *********************************************** Radial Data functions ******************************************************/
/* *setRadialChartData
 *  gets bar data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    let chart = this;
    chart.data.legendData = setRadialLegendData(chart.data);
    // define color object for chartData
    chart.data.color = jvCharts.setChartColors(chart._vars.color, chart.data.legendData, chart.colors);
}

function paint() {
    let chart = this,
        radialMargins = {
            top: 40,
            right: 20,
            bottom: 20,
            left: 20
        };
    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;// Might have to move into method bc of reference/value relationship

    // Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, radialMargins);
    chart.generateVerticalLegend('generateRadial');
    chart.generateRadial();
}

function getEventData(event) {
    let chart = this,
        ele = event.target.classList.value.split('radial-data-')[1];
    if (ele) {
        return {
            data: {
                [chart.currentData.dataTable.label]: [event.target.__data__[chart.currentData.dataTable.label]]
            }
        };
    } else if (event.target.classList.value.indexOf('radial-container') > -1) {
        return {
            data: {
                [chart.currentData.dataTable.label]: []
            }
        };
    }
    return {
        data: false
    };
}

function highlightFromEventData(event) {
    let chart = this,
        label,
        cssClass,
        node;

    if (event.data[chart.currentData.dataTable.label]) {
        label = event.data[chart.currentData.dataTable.label][0];
        cssClass = '.highlight-class-' + jvCharts.getViewForValue(label);
        node = chart.svg.selectAll(cssClass);
    }
    chart.svg.select('.radial-container').selectAll('path')
        .attr('stroke', 0)
        .attr('stroke-width', 0);
    // highlight necessary slices
    if (node) {
        node
            .attr('stroke', chart._vars.highlightBorderColor)
            .attr('stroke-width', chart._vars.highlightBorderWidth);
    }
}

/* *setRadialLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setRadialLegendData(data) {
    var legendArray = [];
    for (let chartEle of data.chartData) {
        if (legendArray.indexOf(chartEle[data.dataTable.label]) === -1) {
            legendArray.push((chartEle[data.dataTable.label]));
        }
    }
    return legendArray;
}

/* *generateRadial
 *
 * paints the radil bar chart on the chart
 * @params radialData
 */

function generateRadial() {
    var chart = this,
        svg = chart.svg,
        colors = chart._vars.color,
        colorByValue = chart._vars.colorByValue,
        legendData = chart.currentData.legendData,
        // necessary to copy the data, for toggling legend elements
        radialData = JSON.parse(JSON.stringify(chart.currentData.chartData)),
        dataTable = chart.currentData.dataTable,
        tickNumber = 3,
        width = chart.config.container.width,
        height = chart.config.container.height,
        r = Math.min(height / 2, width / 3),
        barHeight = r - 40,
        legendElementToggleArray,
        vis,
        extent,
        barScale,
        keys,
        numBars,
        x,
        arc,
        xAxis,
        segments,
        axisGroup,
        additionalFormats = chart.config.options.formatDataValues ? chart.config.options.formatDataValues : null,
        gridOptions = chart.config.options.grid,
        axisOptions = chart.config.options.axis;


    if (!chart._vars.legendHeaders) {
        chart._vars.legendHeaders = legendData;
    }
    legendElementToggleArray = jvCharts.getLegendElementToggleArray(chart._vars.legendHeaders, legendData);

    radialData
        .filter(slice => legendElementToggleArray.find(ele => ele.element === slice[dataTable.label] && !ele.toggle))
        .map(slice => {
            slice[dataTable.value] = 0;
        });

    // total = pieData.reduce((sum, slice) => sum + parseFloat(slice[dataTable.value]), 0);

    // Remove existing bars from page
    svg.selectAll('g.radial-container').remove();
    vis = svg
        .append('g')
        .attr('class', 'radial-container')
        .attr('height', height)
        .attr('transform', `translate( ${width / 2} , ${height / 2} )`);

    extent = d3.extent(radialData, d => d[dataTable.value]);

    if (extent[0] !== 0) {
        extent[0] = 0;
    }
    barScale = d3.scaleLinear()
        .domain(extent)
        .range([0, barHeight]);

    keys = radialData.map(d => d[dataTable.label]);
    numBars = keys.length;

    x = d3.scaleLinear()
        .domain(extent)
        .range([0, -barHeight]);

    // create xAxis drawing function
    xAxis = d3.axisLeft()
        .scale(x)
        .ticks(tickNumber)
        .tickFormat((value) => {
            let formatted,
                format,
                formatNumber = d3.format(',.0f'),
                formatType;
            if (extent[1] >= 1000000) { // millions
                let p = d3.precisionPrefix(1e5, 1.3e6);
                formatNumber = d3.formatPrefix('.' + p, 1.3e6);
            } else if (extent[1] <= 100) { // 2 decimals
                formatNumber = d3.format(',.2f');
            }
            formatted = value;
            for (let i = 0; i < chart.data.dataTableKeys.length; i++) {
                if (chart.data.dataTableKeys[i].name === chart.data.dataTable.value.replace(/ /g, '_')) {
                    formatType = chart.data.dataTableKeys[i].additionalDataType;
                    break;
                }
            }

            if (additionalFormats) {
                for (let i = 0; i < additionalFormats.formats.length; i++) {
                    if (additionalFormats.formats[i].dimension === chart.data.dataTable.value.replace(/ /g, '_')) {
                        format = additionalFormats.formats[i];
                        break;
                    }
                }
                formatted = visualizationUniversal.formatValue(formatted, format);
            } else if (formatType) {
                formatted = visualizationUniversal.formatValue(formatted, formatType);
            } else {
                formatted = formatNumber(value);
            }
            return formatted;
        });

    vis.selectAll('circle')
        .data(x.ticks(3))
        .enter().append('circle')
        .attr('r', d => barScale(d))
        .style('fill', 'none')
        .style('stroke', gridOptions.color)
        .style('stroke-dasharray', '2,2')
        .style('stroke-width', gridOptions.width);

    arc = d3.arc()
        .startAngle((d, i) => (i * 2 * Math.PI) / numBars)
        .endAngle((d, i) => ((i + 1) * 2 * Math.PI) / numBars)
        .innerRadius(0);

    segments = vis.selectAll('path')
        .data(radialData)
        .enter().append('g')
        .append('path')
        .attr('class', d => {
            let label = jvCharts.getViewForValue(d[dataTable.label]);
            return `radial-data-${label} highlight-class-${label}`;
        })
        .each(d => {
            d.outerRadius = 0;
        })
        .style('fill', (d, i) => {
            var colorValue;
            d.data = d;
            if (colorByValue) {
                for (var i = 0; i < colorByValue.length; i++) {
                    if (isNaN(d.data[colorByValue[i].colorOn])) {
                        if (colorByValue[i].valuesToColor.includes(d.data[colorByValue[i].colorOn].replace(/ /g, '_'))) {
                            return colorByValue[i].color;
                        }
                    } else if (colorByValue[i].valuesToColor.includes(d.data[colorByValue[i].colorOn])) {
                        return colorByValue[i].color;
                    }
                }
            }
            return jvCharts.getColors(colors, i, d[dataTable.label]);
        })
        .attr('d', arc)
        .on('mouseover', function (d, i) {
            if (chart._vars.showTooltips) {
                // Get tip data
                var tipData = chart.setTipData(d, i);
                // Draw tip line
                chart.tip.generateSimpleTip(tipData, dataTable, chart.data.dataTableKeys);
                chart.tip.d = d;
                chart.tip.i = i;
            }
        })
        .on('mousemove', function (d, i) {
            if (chart._vars.showTooltips) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(d3.event);
                } else {
                    // Get tip data
                    var tipData = chart.setTipData(d, i);
                    // Draw tip line
                    chart.tip.generateSimpleTip(tipData, dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function () {
            if (chart._vars.showTooltips) {
                chart.tip.hideTip();
                svg.selectAll('line.tip-line').remove();
            }
        })
        .on('contextmenu', function (d) {
            if (chart.data.dataTable.label && d.hasOwnProperty(chart.data.dataTable.label) && d[chart.data.dataTable.label]) {
                chart.config.setContextMenuDataFromClick(typeof d[chart.data.dataTable.label] === 'string' ? d[chart.data.dataTable.label].replace(/ /g, '_') : d[chart.data.dataTable.label],
                    {
                        name: [typeof chart.data.dataTable.label === 'string' ? chart.data.dataTable.label.replace(/ /g, '_') : chart.data.dataTable.label]
                    }
                );
                chart.config.openContextMenu(d3.event);
            }
        });

    segments
        .transition()
        .duration(800)
        .ease(d3.easeElastic)
        .delay((d, i) => 750 - 50 * i)
        .attrTween('d', (d, index) => {
            var i = d3.interpolate(d.outerRadius, barScale(+d[dataTable.value]));
            return t => {
                d.outerRadius = i(t);
                return arc(d, index);
            };
        });

    vis.append('circle')
        .attr('r', barHeight)
        .classed('outer', true)
        .style('fill', 'none')
        .style('stroke', axisOptions.borderColor)
        .style('stroke-width', axisOptions.borderWidth);

    vis.selectAll('line')
        .data(keys)
        .enter().append('g')
        .attr('class', 'label')
        .append('line')
        .attr('y2', -barHeight - 20)
        .style('stroke', axisOptions.borderColor)
        .style('stroke-width', axisOptions.borderWidth)
        .attr('transform', (d, i) => `rotate( ${i * 360 / numBars} )`);

    axisGroup = vis.append('g')
        .attr('class', 'xAxis')
        .style('pointer-events', 'none')
        .call(xAxis);

    axisGroup.selectAll('text')
        .attr('fill', axisOptions.label.fontColor)// Customize the color of axis labels
        .attr('class', 'yAxisLabels editable editable-yAxis editable-text editable-num')
        .attr('transform', d => {
            if (d === xAxis.scale().ticks(tickNumber)[tickNumber]) {
                return 'translate(0, 10)';
            }
            return 'translate(0,0)';
        })
        .style('font-family', axisOptions.label.fontFamily)
        .style('font-size', axisOptions.label.fontSize)
        .style('font-weight', axisOptions.label.fontWeight)
        .style('fill', axisOptions.label.fontColor)
        .append('svg:title');

    axisGroup.selectAll('g.tick line')
        .style('stroke', axisOptions.borderColor)
        .style('stroke-width', axisOptions.borderWidth);
}

export default jvCharts;
