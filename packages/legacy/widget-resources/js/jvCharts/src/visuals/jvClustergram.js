'use strict';
import * as d3 from 'd3';
import jvCharts from '../jvCharts.js';
jvCharts.prototype.clustergram = {
    paint: paint,
    setData: setData,
    getEventData: () => {}
};

jvCharts.prototype.generateClustergram = generateClustergram;

/** ********************************************** Clustergram functions ******************************************************/

/** setClustergramData
 *  gets heatmap data and adds it to the chart object
 *
 * @params data, dataTable, colors
 */
function setData() {
    var chart = this,
        leftTreeData = chart.data.chartData[0],
        rightTreeData = chart.data.chartData[1];

    chart.leftLabels = {};
    chart.leftLabels.values = [];
    for (let leftEle of leftTreeData.children) {
        if (leftEle.name) {
            chart.leftLabels.values.push(leftEle.name);
        }
    }

    chart.rightLabels = {};
    chart.rightLabels.values = [];
    for (let rightEle of rightTreeData.children) {
        if (rightEle.name) {
            chart.rightLabels.values.push(rightEle.name);
        }
    }

    chart.leftLeaves = getLeafNodes([leftTreeData]);
    chart.rightLeaves = getLeafNodes([rightTreeData]);
}

function getLeafNodes(nodes, result = []) {
    let returnData = result;
    for (let node of nodes) {
        if (node.children.length === 0) {
            returnData.push(node.name);
        } else {
            returnData = getLeafNodes(node.children, returnData);
        }
    }
    return returnData;
}

function paint() {
    var chart = this,
        customMargin = {
            top: 20,
            right: 40,
            left: 0,
            bottom: 20
        };
    chart._vars.color = chart.data.color;
    chart.currentData = chart.data;// Might have to move into method bc of reference/value relationship

    // Generate SVG-legend data is used to determine the size of the bottom margin (set to null for no legend)
    chart.generateSVG(null, customMargin);
    // chart.generateLegend(chart.currentData.legendData, 'generateClustergram');
    chart.generateClustergram();
}

/** generateClustergram
 *
 * paints the Clustergram on the chart
 * @params ClustergramData
 */
function generateClustergram() {
    var chart = this,
        svg = chart.svg,
        container = chart.config.container,
        leftTreeData = chart.data.chartData[0],
        rightTreeData = chart.data.chartData[1],
        gridData = chart.data.chartData[2],
        sizeWidth = chart.rightLeaves.length * 20,
        sizeHeight = chart.leftLeaves.length * 20,
        vis,
        leftG,
        bottomG,
        heatG,
        newWidth,
        newHeight,
        leftChildCount,
        rightChildCount;

    chart.data.yAxisData = [];
    chart.data.xAxisData = [];

    if (sizeWidth < container.width) {
        sizeWidth = container.width;
    }

    if (sizeHeight < container.height) {
        sizeHeight = container.height;
    }

    // remove svg elements
    svg.selectAll('*').remove();

    vis = svg.append('g').attr('transform', 'translate(0, 0)').attr('class', 'heatmap');
    leftG = vis.append('g').attr('id', 'left-tree');
    bottomG = vis.append('g').attr('id', 'bottom-tree');
    heatG = vis.append('g').attr('class', 'clustergram-container').attr('id', 'heat');

    d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    // calc new width and height
    newWidth = sizeWidth / 2;
    newHeight = sizeHeight / 2;

    leftChildCount = buildTree(leftTreeData, chart.data.yAxisData, leftG, newHeight, newWidth, 'left');
    rightChildCount = buildTree(rightTreeData, chart.data.xAxisData, bottomG, newHeight, newWidth, 'right');
    buildHeat(chart, gridData, heatG, newHeight, newWidth, leftChildCount, rightChildCount);

    chart.zoomed = () => svg.attr('transform', d3.event.transform);
    chart.chartDiv.select('.editable-svg').call(d3.zoom()
        .on('zoom', chart.zoomed));

    // align G tags
    chart._vars.leftTreeWidth = leftG.node().getBBox().width;
    chart._vars.topTreeHeight = bottomG.node().getBBox().height;
    leftG.attr('transform', 'translate(' + 0 + ',' + (chart._vars.topTreeHeight) + ')');
    bottomG.attr('transform', 'translate(' + (chart._vars.leftTreeWidth) + ',' + 0 + ')');
    heatG.attr('transform', 'translate(' + chart._vars.leftTreeWidth + ',' + (chart._vars.topTreeHeight) + ')');

    chart.config.container.height = heatG.node().getBBox().height;
    chart.config.container.width = heatG.node().getBBox().width;
}

function findPath(child) {
    var str = '';
    let childNode = child;
    while (childNode.parent) {
        str += childNode.data.name + '.';
        childNode = childNode.parent;
    }
    return str.slice(0, -1);
}

function buildTree(data, axisData, gEle, newHeight, newWidth, sideOfTree) {
    var makeTree,
        root,
        childCount = 0;

    makeTree = d3.cluster()
        .size(sideOfTree === 'left' ? [newHeight, newWidth] : [newWidth, newHeight]);

    root = d3.hierarchy(data);
    makeTree(root);

    gEle.selectAll('.cluster-link')
        .data(root.descendants().slice(1))
        .enter().append('path')
        .attr('class', 'cluster-link')
        .style('fill', 'none')
        .style('stroke', 'black')
        .attr('d', d => {
            if (sideOfTree === 'left') {
                return 'M' + d.y / 8 + ',' + d.x + 'V' + d.parent.x + 'H' + d.parent.y / 8;
            }
            return 'M' + d.x + ',' + d.y / 8 + 'V' + d.parent.y / 8 + 'H' + d.parent.x;
        });

    gEle.selectAll('.cluster-node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', d => `cluster-node ${(d.children ? 'cluster-node--internal' : 'cluster-node--leaf')}`)
        .attr('transform', d => {
            if (sideOfTree === 'left') {
                return `translate(${d.y / 8}, ${d.x})`;
            }
            return `translate(${d.x}, ${d.y / 8})rotate(15)`;
        });

    if (sideOfTree === 'left') {
        gEle.selectAll('.cluster-node').append('text')
            .attr('dy', 3)
            .attr('x', d => d.children ? -8 : 0)
            .style('text-anchor', 'end')
            .text(d => {
                if (!d.children) {
                    childCount++;
                    axisData.push(findPath(d));
                }
                // return d.data.name;
                if (d.data.name === 'root') {
                    return '';
                }
                return d.children ? d.data.name.replace(/_/g, ' ') : '';
            });
        gEle.selectAll('.cluster-node').append('line')
            .style('stroke', 'black')
            .attr('x1', d => d.children ? 0 : 0)
            .attr('x2', d => d.children ? 0 : 15);
    } else if (sideOfTree === 'right') {
        gEle.selectAll('.cluster-node').append('text')
            .attr('dy', 8)
            .style('text-anchor', d => d.children ? 'end' : 'start')
            .attr('y', d => d.children ? -8 : 8)
            .text(d => {
                if (!d.children) {
                    childCount++;
                    axisData.push(findPath(d));
                }
                if (d.data.name === 'root') {
                    return '';
                }
                return d.children ? d.data.name.replace(/_/g, ' ') : '';
            });
    }
    return childCount;
}

function buildHeat(chart, gridData, heatG, newHeight, newWidth, leftChildCount, rightChildCount) {
    var heatScores = [],
        gridHeight,
        gridWidth,
        color;

    for (let i = 0; i < gridData.length; i++) {
        let cell = gridData[i];
        heatScores.push(cell.value);
    }

    // heat variables
    color = d3.scaleThreshold()
        .domain(heatScores)
        .range(['#fbf2d2', '#fee7a0', '#ffc665', '#fea743', '#fd8c3c', '#fb4b29', '#ea241e', '#d60b20', '#b10026', '#620023']);

    gridHeight = newHeight / leftChildCount;
    gridWidth = newWidth / rightChildCount;

    chart._vars.clustergramGridWidth = gridWidth;
    chart._vars.clustergramGridHeight = gridHeight;

    // grid
    heatG.selectAll('.heat')
        .data(gridData)
        .enter().append('rect')
        .attr('class', 'cluster-rect')
        .attr('x', d => d.x_index * gridWidth)
        .attr('y', d => d.y_index * gridHeight)
        .attr('width', () => gridWidth)
        .attr('height', () => gridHeight)
        .attr('stroke', '#E6E6E6')
        .attr('stroke-width', '1px')
        .style('fill', d => color(d.value))
        .on('mouseover', function (d, i) {
            if (chart.showToolTip) {
                if (chart.tip.d === d && chart.tip.i === i) {
                    chart.tip.showTip(d3.event);
                } else {
                    // Get tip data
                    let tipData = chart.setTipData(d, i);
                    tipData.color = color(d.value);
                    // Draw tip line
                    chart.tip.generateSimpleTip(tipData, chart.data.dataTable, chart.data.dataTableKeys);
                }
            }
        })
        .on('mouseout', function () {
            chart.tip.hideTip();
        });
}

export default jvCharts;


