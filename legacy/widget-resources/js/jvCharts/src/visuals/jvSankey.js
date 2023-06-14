'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';

jvCharts.prototype.sankey = {
    paint: paint,
    setData: setData,
    getEventData: getEventData
};

jvCharts.prototype.generateSankey = generateSankey;

/** ********************************************** Sankey functions ******************************************************/
/**
 *
 * @param data
 * @param dataTable
 * @param colors
 */
function setData() {
    var chart = this;
    var sankeyData = {},
        data = chart.data.chartData,
        dataTable = chart.data.dataTable;

    sankeyData.links = [];
    sankeyData.nodes = [];

    // Iterate through sources and targets to make a node list
    var nodeList = [];
    for (var item in dataTable) {
        var nodeListForLabel = [];
        if (item === 'value') { continue; }
        for (var i = 0; i < data.length; i++) {
            var potentialNode = data[i][dataTable[item]];
            var addToList = true;
            for (var j = 0; j < nodeListForLabel.length; j++) {
                if (potentialNode === nodeListForLabel[j]) {
                    addToList = false;
                    break;
                }
            }
            if (addToList) {
                nodeListForLabel.push(potentialNode);
            }
        }
        nodeList = nodeList.concat(nodeListForLabel);
    }

    // Create nodes object
    for (var i = 0; i < nodeList.length; i++) {
        sankeyData.nodes.push({
            'name': nodeList[i]
        });
    }

    // See how many sets of links you need
    var linkGroups = 0;

    for (let item in dataTable) {
        if (item.indexOf('label') !== -1) {
            linkGroups++;
        }
    }

    let source,
        target,
        value;

    for (let k in dataTable) {
        if (k.indexOf('value') > -1) {
            value = dataTable[k];
        } else if (!source) {
            source = dataTable[k];
        } else {
            target = dataTable[k];
        }
    }

    for (let i = 1; i < linkGroups; i++) {
        var linkGroup = [];
        linkGroup = data.map(function (x) {
            return {
                'source': x[source],
                'target': x[target],
                'value': x[value]
            };
        });

        sankeyData.links = sankeyData.links.concat(linkGroup);
    }

    var nodeMap = {};
    for (i = 0; i < sankeyData.nodes.length; i++) {
        sankeyData.nodes[i].node = i;
        nodeMap[sankeyData.nodes[i].name] = i;
    }
    sankeyData.links = sankeyData.links.map(function (x) {
        return {
            source: nodeMap[x.source],
            target: nodeMap[x.target],
            value: x.value
        };
    });

    // Group common sankey links together and add the values
    var aggregateSankeyLinks = [];
    for (let i = 0; i < sankeyData.links.length; i++) {
        var currentLink = {};
        currentLink.source = sankeyData.links[i].source;
        currentLink.target = sankeyData.links[i].target;
        currentLink.value = sankeyData.links[i].value;

        // Make sure that only unique links are pushed to the aggregated array
        let addToAggregate = true;
        for (let k = 0; k < aggregateSankeyLinks.length; k++) {
            if (aggregateSankeyLinks[k].source === currentLink.source && aggregateSankeyLinks[k].target === currentLink.target) {
                addToAggregate = false;
                break;
            }
        }

        if (!addToAggregate) {
            continue;
        }

        // Sum the value of identical links
        for (let j = 0; j < sankeyData.links.length; j++) {
            if (sankeyData.links[i].source === sankeyData.links[j].source && sankeyData.links[i].target === sankeyData.links[j].target) {
                currentLink.value = currentLink.value + sankeyData.links[j].value;
            }
        }

        aggregateSankeyLinks.push(currentLink);
    }

    sankeyData.links = aggregateSankeyLinks;

    chart.data.chartData = sankeyData;
    chart.currentData = chart.data;
    chart.data.color = d3.scaleOrdinal(d3.schemeCategory20);
}

function paint() {
    var chart = this;
    var data = chart.data.chartData;

    // generate SVG
    chart.generateSVG(null);
    chart.generateSankey(data);
}

function getEventData() {
    return {};
}

/**
 * Generates a sankey chart with the given data
 * @param sankeyData
 */
function generateSankey(sankeyData) {
    var chart = this,
        svg = chart.svg,
        color = chart._vars.color,
        colorByValue = chart._vars.colorByValue;

    var width = chart.config.container.width;
    var height = chart.config.container.height;

    var formatNumber = d3.format(',.0f'),    // zero decimal places
        format = function (d) { return formatNumber(d) + ' ' + 'Widgets'; },
        color = d3.scaleOrdinal(d3.schemeCategory20);

    var sankey = d3.sankey()
        .nodeWidth(10)
        .nodePadding(15)
        .size([width, height]);

    var path = sankey.link();

    // //Adding zoom v4 behavior to sankey
    d3.selectAll('svg')
        .call(d3.zoom()
            .scaleExtent([0.1, 10])
            .on('zoom', zoom));// zoom event listener

    sankey
        .nodes(sankeyData.nodes)
        .links(sankeyData.links)
        .layout(32);

    var link = svg.append('g').selectAll('.sankey-link')
        .data(sankeyData.links)
        .enter()
        .append('path')
        .filter(function (d) { return d.value > 0; })
        .attr('class', 'sankey-link')
        .attr('d', path)
        .style('stroke-width', function (d) {
            return Math.max(1, d.dy);
        })
        .sort(function (a, b) {
            return b.dy - a.dy;
        })
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                var tipData = chart.setTipData(d, i);
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
        .on('mouseout', function (d, i) {
            if (chart.showToolTip) {
                chart.tip.hideTip();
            }
        });

    var node = svg.append('g').selectAll('.node')
        .data(sankeyData.nodes)
        .enter()
        .append('g')
        .filter(function (d) { return d.value > 0; })
        .attr('class', 'node')
        .attr('transform', function (d) {
            return 'translate(' + d.x + ', ' + d.y + ')';
        })
        .call(d3.drag()
            .subject(function (d) {
                return d;
            })
            .on('start', function (d) {
                d3.event.sourceEvent.stopPropagation();
                this.parentNode.appendChild(this);
            })
            .on('drag', dragmove));

    node.append('rect')
        .attr('height', function (d) {
            // return d.dy;
            return Math.abs(d.dy);
            // return Math.max(d.dy, 2);
        })
        .attr('width', sankey.nodeWidth())
        .style('fill', function (d) {
            var colorValue, data = {};
            if (colorByValue) {
                data.data = d; // need to do this to keep data format consistent
                colorValue = jvCharts.colorByValue(data, colorByValue, 'sankey', chart.data);
                if (colorValue) {
                    return d.color = colorValue;
                }
            }
            return d.color = color(d.name);
        })
        .style('stroke', function (d) {
            return d3.rgb(d.color).darker(2);
        });

    node.append('text')
        .attr('x', -6)
        .attr('y', function (d) {
            return d.dy / 2;
        })
        .attr('dy', '.35em')
        .attr('text-anchor', 'end')
        .attr('transform', null)
        .attr('transform', null)
        .text(function (d) {
            return d.name;
        })
        .filter(function (d) {
            return d.x < width / 2;
        })
        .attr('x', 6 + sankey.nodeWidth())
        .attr('text-anchor', 'start');

    function dragmove(d) {
        d3.select(this).attr('transform',
            'translate(' + (
                d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
            ) + ',' + (
                d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
            ) + ')');
        sankey.relayout();
        link.attr('d', path);
    }

    function zoom() { // Implementing the v4 zooming feature
        svg.attr('transform', d3.event.transform);
    }
}

export default jvCharts;
