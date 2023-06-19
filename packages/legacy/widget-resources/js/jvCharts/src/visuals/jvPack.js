'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.circlepack = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generatePack = generatePack;

/* *********************************************** Pack functions ******************************************************/

/* *setPackChartData
 *  gets pack data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this;
    chart.data.legendData = setPackLegendData(chart.data.dataTable);
    if (!chart.data.chartData.hasOwnProperty('children')) {
        chart.data.chartData = jvCharts.convertTableToTree(chart.data.chartData, chart.data.dataTable, true);
    }

    // define color object for chartData
    chart.data.color = chart.colors;
}

function getEventData() {
    return {};
}

/* *setPackLegendData
 *  gets legend info from chart Data
 *
 * @params data, type
 * @returns [] of legend text
 */
function setPackLegendData(dataTable) {
    var legendArray = [],
        label = '';
    for (let key in dataTable) {
        if (dataTable.hasOwnProperty(key)) {
            if (key === 'value') {
                label = dataTable[key];
            } else if (key !== 'tooltip 1') {
                legendArray.push(dataTable[key]);
            }
        }
    }
    legendArray.unshift(label);
    return legendArray;
}

function paint() {
    var chart = this,
        packMargins = {
            top: 30,
            right: 20,
            bottom: 15,
            left: 20
        };
    chart._vars.color = chart.data.color;

    chart.currentData = chart.data;// Might have to move into method bc of reference/value relationship

    // Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, packMargins);
    chart.generateVerticalLegend('generatePack');
    chart.generatePack(chart.currentData);
}

/* *generatePack
 *
 * paints the pack on the chart
 * @params packData
 */
function generatePack() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        colorByValue = chart._vars.colorByValue,
        w = container.width,
        h = container.height,
        r = Math.min(h / 2, w / 3),
        margin = 20,
        diameter = r * 2,
        color,
        root,
        pack,
        vis,
        circleGroup,
        node,
        view;
    chart.children = chart.data.chartData;

    color = d3.scaleOrdinal()
        .range(chart.data.color
            .map(c => {
                var newC;
                newC = d3.rgb(c);
                newC.opacity = 0.8;
                return newC;
            }));

    // assigns the data to a hierarchy using parent-child relationships
    root = d3.hierarchy(chart.children, d => d.children);

    pack = d3.pack()
        .size([container.width, container.height])
        .padding(2);

    pack(root
        .sum(d => d.hasOwnProperty('children') ? 0 : d.value)
        .sort((a, b) => b.height - a.height || b.value - a.value))
        .descendants();

    svg.selectAll('.pack').remove();

    vis = svg.append('g')
        .attr('class', 'pack')
        .attr('transform', 'translate(' + (w / 2) + ',' + (h / 2) + ')');

    circleGroup = vis.selectAll('g')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'circleGroup');

    circleGroup.append('circle')
        .attr('class', d => d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root')
        .style('fill', d => {
            if (colorByValue && jvCharts.colorByValue(d, colorByValue, 'pack', chart.data)) {
                return jvCharts.colorByValue(d, colorByValue, chart.data);
            }
            d.color = color(d.depth);

            return d.color; // d.children ? color(d.depth) : null;
        })
        .on('click', function (d) {
            if (focus !== d) {
                zoom(d);
                d3.event.stopPropagation();
            }
        })
        .on('mouseover', function (d, i) {
            if (chart._vars.showTooltips) {
                // Get tip data
                var tipData = chart.setTipData(d, i);
                // Draw tip line
                chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
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
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function () {
            chart.tip.hideTip();
        })
        .on('contextmenu', function (d) {
            var header, idx;

            if (d.depth > 1) {
                idx = d.depth - 1;
                header = chart.data.dataTable['group ' + idx];
            } else {
                header = chart.data.dataTable.group;
            }

            if (header && d.hasOwnProperty('data') && d.data.name && d.data.name !== 'root') {
                chart.config.setContextMenuDataFromClick(typeof d.data.name === 'string' ? d.data.name.replace(/ /g, '_') : d.data.name,
                    {
                        name: [typeof header === 'string' ? header.replace(/ /g, '_') : header]
                    }
                );
                chart.config.openContextMenu(d3.event);
            }
        });
    if (chart._vars.displayValues) {
        let fontSize = parseFloat(chart._vars.valueLabel.fontSize) || chart._vars.fontSize || 12,
            fontFamily = chart._vars.valueLabel.fontFamily || 'Inter',
            fontWeight = chart._vars.valueLabel.fontWeight || 400,
            fontColor = chart._vars.valueLabel.fontColorAlt || chart._vars.valueLabel.fontColor || '#FFFFFF';

        // Add name text
        circleGroup.append('text')
            .text(d => {
                let label = d.data.name;
                return label;
            })
            .attr('style', function (d) {
                // Only display for the innermost circles and if it fits within the circle
                if (this.clientWidth > d.r * 2 || d.hasOwnProperty('children') || fontSize * 2 > d.r * 2) {
                    return 'display: none';
                }
                return '';
            })
            .style('font-family', fontFamily)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .style('fill', fontColor)
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', 0);

        // Add value text
        circleGroup.append('text')
            .text(d => {
                let label = d.value;
                return label;
            })
            .attr('style', function (d) {
                // Only display for the innermost circles and if it fits within the circle
                if (this.clientWidth > d.r * 2 || d.hasOwnProperty('children') || fontSize * 2 > d.r * 2) {
                    return 'display: none';
                }
                return '';
            })
            .style('font-family', fontFamily)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .style('fill', fontColor)
            .attr('text-anchor', 'middle')
            .attr('x', 0)
            .attr('y', fontSize);
    }

    node = svg.selectAll('circle,text,g.circleGroup');

    d3.select('body')
        .on('click', function () {
            zoom(root);
        });

    zoomTo([root.x, root.y, root.r * 2 + margin]);

    function zoom(d) {
        var focus = d;
        d3.transition()
            .duration(d3.event.altKey ? 7500 : 750)
            .tween('zoom', function (d) {
                var i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2 + margin]);
                return function (t) {
                    zoomTo(i(t));
                };
            });
    }
    function zoomTo(v) {
        var k = diameter / v[2];

        // set global zoom
        view = v;

        circleGroup.attr('transform', d => {
            if (d && d.x && d.y) {
                return 'translate(' + (d.x - v[0]) * k + ',' + (d.y - v[1]) * k + ')';
            }
            return '';
        });

        node.selectAll('circle').attr('r', d => d.r * k);
    }
}

export default jvCharts;
