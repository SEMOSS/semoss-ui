/* eslint-disable no-loop-func */
'use strict';
import EchartsHelper from '@/widget-resources/js/echarts/echarts-helper.js';

export default angular
    .module('app.graph-echarts.service', [])
    .factory('graphEchartsService', graphEchartsService);

graphEchartsService.$inject = ['VIZ_COLORS'];

function graphEchartsService(VIZ_COLORS) {
    /**
     * @name getSchema
     * @param {array} rawNodes - list of nodes
     * @param {array} rawEdges - list of edges
     * @param {object} rawGraphMeta - graphMeta data
     * @param {object} uiOptions - Semoss uiOptions
     * @desc builds the schema object
     * @return {object} schema object
     */
    function getSchema(rawNodes, rawEdges, rawGraphMeta, uiOptions) {
        var nodes,
            edges,
            categories,
            i,
            j,
            m,
            layoutSpecified,
            showClusters,
            cbv = uiOptions.colorByValue,
            symbolObj;

        if (rawNodes) {
            nodes = rawNodes.map(function (n) {
                var node = {},
                    prop,
                    item;
                node.id = n.uri;

                if (
                    uiOptions &&
                    uiOptions.customizeSymbol &&
                    uiOptions.customizeSymbol.rules.length > 0
                ) {
                    symbolObj = customizeSymbol(
                        uiOptions.customizeSymbol.rules,
                        n.VERTEX_TYPE_PROPERTY,
                        n.VERTEX_LABEL_PROPERTY
                    );
                    node.symbol = symbolObj.symbol;
                    node.symbolSize = symbolObj.symbolSize;
                    node.itemStyle = symbolObj.itemStyle || {};
                } else {
                    node.symbol = 'circle';
                    node.symbolSize = 15;
                }

                node.name = n.VERTEX_LABEL_PROPERTY;

                // Checking for a specified cluster
                if (
                    uiOptions.clusterExists &&
                    n.propHash.hasOwnProperty('CLUSTER')
                ) {
                    // CLUSTER LOGIC HERE
                    node.category = '' + n.propHash.CLUSTER;
                } else {
                    node.category = n.VERTEX_TYPE_PROPERTY;
                }
                // Checking for a specified layout
                // if (n.propHash.X && typeof n.propHash.X !== 'object' || n.propHash.X === 0) {
                if (uiOptions.toggleLayout) {
                    if (
                        n.propHash.hasOwnProperty('X') &&
                        n.propHash.hasOwnProperty('X')
                    ) {
                        node.x = n.propHash.X;
                        node.y = n.propHash.Y;
                    } else {
                        node.x = null;
                        node.y = null;
                    }
                } else {
                    layoutSpecified = false;
                    node.x = null;
                    node.y = null;
                }

                // node.fixed = true;
                node.draggable = true;

                node.itemStyle = {
                    normal: {},
                };

                if (cbv && cbv.length > 0) {
                    cbv.forEach(function (rule) {
                        var cleanColorOn;
                        cleanColorOn = rule.colorOn;
                        rule.valuesToColor.forEach(function (val) {
                            var cleanVal, cleanVertex, cleanLabel;

                            cleanVal = val;
                            cleanVertex = n.VERTEX_TYPE_PROPERTY;
                            cleanLabel = n.VERTEX_LABEL_PROPERTY;
                            if (
                                cleanVertex === cleanColorOn &&
                                cleanLabel === cleanVal
                            ) {
                                node.itemStyle.normal.color = rule.color;
                            }
                        });
                    });
                }

                // Highlgiht
                if (uiOptions.highlight) {
                    // check all properties in our highlight data
                    for (prop in uiOptions.highlight.data) {
                        if (uiOptions.highlight.data.hasOwnProperty(prop)) {
                            // if x-axis label is equal to the property we are coloring
                            if (node.category === prop) {
                                uiOptions.highlight.data[prop].forEach(
                                    function (hiliteValue) {
                                        if (hiliteValue === node.name) {
                                            node.itemStyle.normal.borderColor =
                                                '#000';
                                            node.itemStyle.normal.borderWidth = 2;
                                        }
                                    }
                                );
                            }
                        }
                    }
                }

                if (uiOptions.label) {
                    for (item in uiOptions.label) {
                        if (uiOptions.label.hasOwnProperty(item)) {
                            if (node.category === item) {
                                uiOptions.label[item].forEach(function (
                                    labelValue
                                ) {
                                    if (labelValue === node.name) {
                                        node.label = {
                                            show: true,
                                        };
                                    }
                                });
                            }
                        }
                    }
                }
                if (uiOptions.formatDataValues) {
                    for (
                        i = 0;
                        i < uiOptions.formatDataValues.formats.length;
                        i++
                    ) {
                        if (
                            uiOptions.formatDataValues.formats[i].dimension ===
                            node.category
                        ) {
                            node.name = EchartsHelper.formatLabel(
                                node.name,
                                uiOptions.formatDataValues.formats[i]
                            );
                        }
                    }
                }

                return node;
            });

            layoutSpecified = true;
            showClusters = true;
            for (j = 0; j < nodes.length; j++) {
                if (nodes[j].x === null || nodes[j].y === null) {
                    layoutSpecified = false;
                    break;
                }
                if (!rawNodes[j].propHash.hasOwnProperty('CLUSTER')) {
                    showClusters = false;
                    break;
                }
            }

            edges = rawEdges.map(function (e) {
                var edge = {};
                edge.source = e.source;
                edge.target = e.target;
                return edge;
            });

            // CLUSTER LOGIC HERE
            categories = [];
            // TODO need to check if CLUSTER is present for all nodes, not just the first
            // if (uiOptions.clusterExists && rawNodes[0].propHash.hasOwnProperty('CLUSTER')) {
            if (uiOptions.clusterExists && showClusters) {
                for (m = 0; m < rawNodes.length; m++) {
                    if (
                        categories.indexOf(rawNodes[m].propHash.CLUSTER) === -1
                    ) {
                        categories.push({
                            name: '' + rawNodes[m].propHash.CLUSTER,
                        });
                    }
                }
            } else {
                for (i in rawGraphMeta) {
                    if (rawGraphMeta.hasOwnProperty(i)) {
                        categories.push({
                            name: i,
                        });
                    }
                }
            }
        }

        return {
            nodes: nodes,
            edges: edges,
            categories: categories,
            meta: rawGraphMeta,
            layoutSpecified: layoutSpecified,
        };
    }

    /**
     * @name customizeSymbol
     * @desc determine the symbol shape and size of each node
     * @param {array} rules - uiOptions.customizeSymbol.rules
     * @param {string} nodeDim - dimension of selected node
     * @param {string} nodeInstance - dimension of selected node
     * @returns {obj} node shape and size
     */
    function customizeSymbol(rules, nodeDim, nodeInstance) {
        var returnObj = {},
            i,
            n,
            match = false;

        returnObj.symbol = 'circle';
        returnObj.symbolSize = 15;

        for (i = 0; i < rules.length; i++) {
            if (rules[i].dimension === 'All Nodes') {
                returnObj.symbol = rules[i].symbol;
                returnObj.symbolSize = rules[i].symbolSize;
                if (rules[i].selectedColor) {
                    returnObj.itemStyle = {
                        color: rules[i].selectedColor,
                    };
                }
                break;
            }
            if (nodeDim === rules[i].dimension) {
                if (rules[i].instances.length === 0) {
                    // Customize by dimension
                    returnObj.symbol = rules[i].symbol;
                    returnObj.symbolSize = rules[i].symbolSize;

                    if (rules[i].selectedColor) {
                        returnObj.itemStyle = {
                            color: rules[i].selectedColor,
                        };
                    }
                    break;
                } else {
                    // Custommize by instance
                    for (n = 0; n < rules[i].instances.length; n++) {
                        if (nodeInstance === rules[i].instances[n]) {
                            returnObj.symbol = rules[i].symbol;
                            returnObj.symbolSize = rules[i].symbolSize;

                            if (rules[i].selectedColor) {
                                returnObj.itemStyle = {
                                    color: rules[i].selectedColor,
                                };
                            }
                            match = true;
                            break;
                        }
                    }
                    if (match) {
                        break;
                    }
                }
            }
        }
        return returnObj;
    }

    /**
     * @name getLegend
     * @param {object} schema -  schema data for chart
     * @param {object} uiOptions - chart options
     * @desc builds tooltip config object
     * @return {object} legend config object
     */
    function getLegend(schema, uiOptions) {
        let rules = uiOptions.customizeSymbol.rules,
            hideLegend = uiOptions.toggleLegend,
            labelStyle = uiOptions.legend,
            topOffset =
                uiOptions.chartTitle && uiOptions.chartTitle.text
                    ? parseFloat(uiOptions.chartTitle.fontSize) + 5
                    : 0;
        return {
            data:
                schema && schema.categories
                    ? schema.categories.map(function (cat) {
                          var i;
                          if (rules.length > 0) {
                              for (i = 0; i < rules.length; i++) {
                                  if (rules[i].icon) {
                                      if (
                                          rules[i].icon.dimension ===
                                          'All Nodes'
                                      ) {
                                          cat.icon = rules[i].icon.symbol;
                                          break;
                                      } else if (
                                          cat.name === rules[i].icon.dimension
                                      ) {
                                          cat.icon = rules[i].icon.symbol;
                                          break;
                                      }
                                  }
                                  cat.icon = 'circle';
                              }
                          } else {
                              cat.icon = 'circle';
                          }
                          return cat;
                      })
                    : [],
            formatter: function (name) {
                if (schema.meta.hasOwnProperty(name)) {
                    return (
                        name.replace(/_/g, ' ') + ' (' + schema.meta[name] + ')'
                    );
                }
                return name.replace(/_/g, ' ');
            },
            left: 12,
            top: topOffset,
            type: 'scroll',
            pageButtonPosition: 'start',
            show: !hideLegend,
            textStyle: {
                color: labelStyle.fontColor || '#000000',
                fontSize: parseFloat(labelStyle.fontSize) || 12,
                fontFamily: labelStyle.fontFamily || 'Inter',
                fontWeight: labelStyle.fontWeight || 400,
            },
        };
    }

    /**
     * @name getSeries
     * @param {object} schema -  schema data for chart
     * @param {object} uiOptions -  Semoss uiOptions
     * @desc series forg graph
     * @return {object} series config object
     */
    function getSeries(schema, uiOptions) {
        // console.warn(schema, uiOptions);
        var layoutObj = getLayout(uiOptions.toggleLayout, schema);
        return [
            {
                animation: false,
                type: 'graph',
                // if X and Y exist for each node... layout = 'none', else use 'force', use 'circular' if specified
                layout: layoutObj.layout || 'force',
                circular: {
                    rotateLabel: true,
                },
                nodeScaleRatio: 0,
                categories: schema.categories,
                nodes: schema.nodes,
                edges: schema.edges,
                edgeSymbol: showDirection(uiOptions.showDirection) || [
                    'none',
                    'none',
                ],
                emphasis: {
                    focus: uiOptions.showAdjacent ? 'adjacency' : 'none',
                },
                roam: true,
                // draggable: true,
                label: {
                    normal: {
                        show:
                            uiOptions.displayValues ||
                            uiOptions.customizeLabel.showLabels,
                        position: uiOptions.customizeLabel.position || 'right',
                        rotate: uiOptions.customizeLabel.rotate || 0,
                        fontSize:
                            parseFloat(uiOptions.valueLabel.fontSize) || 12,
                        color: uiOptions.valueLabel.fontColor || 'black',
                        fontFamily:
                            uiOptions.valueLabel.fontFamily || 'sans-serif',
                        fontWeight: uiOptions.valueLabel.fontWeight || 'normal',
                        formatter: function (info) {
                            return typeof info.name === 'string'
                                ? info.name.replace(/_/g, ' ')
                                : EchartsHelper.cleanValue(info.name);
                        },
                    },
                    emphasis: {
                        show: uiOptions.showTooltips,
                    },
                },
                force: {
                    edgeLength: uiOptions.nodeRepulsion.edgeLength || 100, // [5, 100],
                    repulsion: uiOptions.nodeRepulsion.repulsion || 60, // [5, 100],
                    gravity: uiOptions.nodeRepulsion.gravity || 0.25,
                    layoutAnimation: uiOptions.toggleLock,
                },
                lineStyle: {
                    width: parseFloat(uiOptions.graph.lineWidth) || 1,
                    color: uiOptions.graph.lineColor || '#ccc',
                    type: uiOptions.graph.lineStyle || 'solid',
                    opacity: 1,
                    curveness: layoutObj.curve || 0,
                },
                left: 'center',
            },
        ];
    }

    /**
     * @name getConfig
     * @param {object} data Semoss chart data
     * @param {object} uiOptions Semoss uiOptions
     * @param {object} groupByInstance Group By Individual Instance Title
     * @desc builds and returns chart config
     * @return {object} chart config
     */
    function getConfig(data, uiOptions, groupByInstance) {
        var schema = getSchema(
                data.nodes,
                data.edges,
                data.graphMeta,
                uiOptions
            ),
            backgroundColor = getBackgroundColorStyle(uiOptions.watermark),
            returnObj,
            chartTitle = {};

        if (uiOptions.chartTitle && uiOptions.chartTitle.text) {
            chartTitle = {};
            chartTitle.show = true;
            chartTitle.text = uiOptions.chartTitle.text;
            chartTitle.fontSize = uiOptions.chartTitle.fontSize;
            chartTitle.fontWeight = uiOptions.chartTitle.fontWeight;
            chartTitle.fontFamily = uiOptions.chartTitle.fontFamily;
            chartTitle.fontColor = uiOptions.chartTitle.fontColor;
            chartTitle.align = uiOptions.chartTitle.align || 'left';
        }

        returnObj = {
            legend: getLegend(schema, uiOptions),
            color: uiOptions.color || VIZ_COLORS.COLOR_SEMOSS,
            series: getSeries(schema, uiOptions),
            groupByInstance: groupByInstance,
            title: chartTitle,
        };

        if (backgroundColor) {
            returnObj.backgroundColor = backgroundColor;
        }

        return returnObj;
    }
    /**
     * @name showDirection
     * @param {bool} param -  Semoss uiOptions.showDirection
     * @desc sets the edge symbol for echarts
     * @return {array} ['none','none'] or ['none', 'circle']
     */
    function showDirection(param) {
        if (param) {
            return ['none', 'arrow'];
        }
        return ['none', 'none'];
    }

    /**
     * @name getBackgroundColorStyle
     * @desc customize the background style of the canvas
     * @param {string} watermark - string of the watermark text
     * @returns {Object} - canvas details
     */
    function getBackgroundColorStyle(watermark) {
        if (/\S/.test(watermark)) {
            return {
                type: 'pattern',
                image: paintWaterMark(watermark),
                repeat: 'repeat',
            };
        }

        return false;
    }

    /**
     * @name paintWaterMark
     * @desc paints a custom watermark on the viz
     * @param {string} watermark - string of the watermark text
     * @returns {Object} - canvas details
     */
    function paintWaterMark(watermark) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 100;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.08;
        ctx.font = '20px Microsoft Yahei';
        ctx.translate(50, 50);
        ctx.rotate(-Math.PI / 4);
        if (watermark) {
            ctx.fillText(watermark, 0, 0);
        }
        return canvas;
    }

    /**
     * @name getLayout
     * @param {bool} selectedLayout -  Semoss uiOptions.toggleLayout
     * @param {object} schema -  schema data for chart
     * @desc sets the series layout of the graph
     * @return {string} 'force' or 'circular'
     */
    function getLayout(selectedLayout, schema) {
        var layout, curve;
        if (schema.layoutSpecified) {
            layout = 'none';
            curve = 0;
        } else if (selectedLayout) {
            switch (selectedLayout) {
                case 'circular':
                    layout = 'circular';
                    curve = 0.25;
                    break;
                default:
                    layout = 'force';
                    curve = 0;
            }
        } else {
            layout = 'force';
            curve = 0;
        }
        return {
            layout: layout,
            curve: curve,
        };
    }

    return {
        getConfig: getConfig,
    };
}
