'use strict';
/**
 * @name graphgl-echarts.service.js
 * @desc configures echarts graphgl
 */
angular
    .module('app.graphgl-echarts.service', [])
    .factory('graphglEchartsService', graphglEchartsService);

graphglEchartsService.$inject = ['VIZ_COLORS'];

function graphglEchartsService(VIZ_COLORS) {
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
            n,
            layoutSpecified,
            showClusters,
            cbv = uiOptions.colorByValue,
            symbolObj,
            labelObj,
            clusters = [];

        nodes = rawNodes.map(function (n) {
            var node = {};
            node.id = n.uri;
            labelObj = customizeLabels(
                uiOptions,
                n.VERTEX_TYPE_PROPERTY,
                n.VERTEX_LABEL_PROPERTY
            );

            if (uiOptions.customizeSymbol.rules.length > 0) {
                symbolObj = customizeSymbol(
                    uiOptions.customizeSymbol.rules,
                    n.VERTEX_TYPE_PROPERTY,
                    n.VERTEX_LABEL_PROPERTY
                );
                node.symbol = symbolObj.symbol;
                node.symbolSize = symbolObj.symbolSize;
                // node.itemStyle = symbolObj.itemStyle || {};
            } else {
                node.symbol = 'circle';
                node.symbolSize = 12;
            }

            // Label Management
            if (!uiOptions.displayGraphValues) {
                node.label = {
                    show: false,
                    fontSize: labelObj.fontSize,
                    fontFamily: labelObj.fontFamily,
                    fontWeight: labelObj.fontWeight,
                };
            } else if (uiOptions.customizeGraphLabel.dimension) {
                node.label = {
                    show: labelObj.show,
                    fontSize: labelObj.fontSize,
                    fontFamily: labelObj.fontFamily,
                    fontWeight: labelObj.fontWeight,
                };
            } else {
                node.label = {
                    show: true,
                    fontSize: labelObj.fontSize,
                    fontFamily: labelObj.fontFamily,
                    fontWeight: labelObj.fontWeight,
                };
            }
            node.name = n.VERTEX_LABEL_PROPERTY;
            node.label.formatter = function (info) {
                return typeof info.name === 'string'
                    ? info.name.replace(/_/g, ' ')
                    : info.name;
            };

            // Category
            if (
                uiOptions.clusterExists &&
                n.propHash.hasOwnProperty('CLUSTER')
            ) {
                node.category = '' + n.propHash.CLUSTER;
                if (clusters.indexOf(n.propHash.CLUSTER) === -1) {
                    clusters.push(n.propHash.CLUSTER);
                }
            } else {
                node.category = n.VERTEX_TYPE_PROPERTY;
            }

            // Layout
            if (uiOptions.toggleLayout) {
                if (
                    n.propHash.hasOwnProperty('X') &&
                    n.propHash.hasOwnProperty('Y')
                ) {
                    node.x = n.propHash.X;
                    node.y = n.propHash.Y;
                } else {
                    console.warn(
                        'We are not receiving x and y positions for all nodes'
                    );
                    node.x = null;
                    node.y = null;
                }
            } else {
                node.x = null;
                node.y = null;
            }

            // node.fixed = true;
            node.draggable = true;

            if (cbv && cbv.length > 0) {
                cbv.forEach(function (rule) {
                    var cleanColorOn;
                    cleanColorOn = rule.colorOn;

                    rule.valuesToColor.forEach(function (val) {
                        var itemStyle = {},
                            cleanVal,
                            cleanVertex,
                            cleanLabel;
                        cleanVal = val;
                        cleanVertex = n.VERTEX_TYPE_PROPERTY;
                        cleanLabel = n.VERTEX_LABEL_PROPERTY;
                        if (
                            cleanVertex === cleanColorOn &&
                            cleanLabel === cleanVal
                        ) {
                            itemStyle.color = rule.color;
                            node.itemStyle = itemStyle;
                        }
                    });
                });
            }

            return node;
        });

        edges = rawEdges.map(function (e) {
            var edge = {};
            edge.source = e.source;
            edge.target = e.target;
            return edge;
        });

        // CLUSTER LOGIC HERE
        categories = [];
        if (clusters.length > 0) {
            for (m = 0; m < clusters.length; m++) {
                categories.push({
                    name: '' + clusters[m],
                });
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

        return {
            nodes: nodes,
            edges: edges,
            categories: categories,
            meta: rawGraphMeta,
        };
    }

    /**
     * @name customizeLabels
     * @desc determine the labels for each node
     * @param {obj} options - chart options
     * @param {string} nodeDim - dimension of selected node
     * @param {string} nodeInstance - dimension of selected node
     * @returns {obj} node shape and size
     */
    function customizeLabels(options, nodeDim, nodeInstance) {
        var label = options.customizeGraphLabel,
            fontOptions = options.valueLabel,
            returnObj = {
                fontSize: parseFloat(fontOptions.fontSize) || 12,
                fontFamily: fontOptions.fontFamily || 'Inter',
                fontWeight: fontOptions.fontWeight || 400,
            };

        if (label.dimension && label.dimension === 'All Nodes') {
            returnObj.show = true;
        } else if (
            label.instances &&
            label.instances.length === 0 &&
            nodeDim === label.dimension
        ) {
            returnObj.show = true;
        } else if (
            label.instances &&
            label.instances.length > 0 &&
            nodeDim === label.dimension &&
            label.instances.indexOf(nodeInstance) !== -1
        ) {
            returnObj.show = true;
        } else {
            returnObj.show = false;
        }
        return returnObj;
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
        returnObj.symbolSize = 12;

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
     * @param {arr} rules -  uiOptions.customizeSymbol.rules
     * @desc builds tooltip config object
     * @return {object} legend config object
     */
    function getLegend(schema, rules) {
        return {
            data: schema.categories.map(function (cat) {
                var i;
                if (rules.length > 0) {
                    for (i = 0; i < rules.length; i++) {
                        if (rules[i].icon) {
                            if (rules[i].icon.dimension === 'All Nodes') {
                                cat.icon = rules[i].icon.symbol;
                                break;
                            } else if (cat.name === rules[i].icon.dimension) {
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
            }),
            formatter: function (name) {
                if (schema.meta.hasOwnProperty(name)) {
                    return (
                        name.replace(/_/g, ' ') + ' (' + schema.meta[name] + ')'
                    );
                }
                return name.replace(/_/g, ' ');
            },
            left: 12,
            top: 8,
            selectedMode: false,
            type: 'scroll',
            pageButtonPosition: 'start',
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
        if (uiOptions.toggleLayout) {
            return [
                {
                    type: 'graphGL',
                    nodes: schema.nodes,
                    edges: schema.edges,
                    layout: 'none',
                    lineStyle: {
                        opacity: 0.3,
                    },
                    focusNodeAdjacency: uiOptions.showAdjacent,
                    categories: schema.categories,
                    left: 'center',
                    top: 'middle',
                },
            ];
        }

        return [
            {
                type: 'graphGL',
                nodes: schema.nodes,
                edges: schema.edges,
                layout: 'forceAtlas2',
                modularity: {
                    resolution: 2,
                    sort: true,
                },
                itemStyle: {
                    opacity: 1,
                },
                lineStyle: {
                    opacity: 0.3,
                },
                focusNodeAdjacency: uiOptions.showAdjacent,
                categories: schema.categories,
                forceAtlas2: {
                    steps: 5,
                    stopThreshold: 20,
                    jitterTolerence: 10,
                    edgeWeight: [0.2, 1],
                    gravity: 5,
                    edgeWeightInfluence: 0,
                },
            },
        ];
    }

    /**
     * @name getConfig
     * @param {object} data Semoss chart data
     * @param {object} uiOptions Semoss uiOptions
     * @desc builds and returns chart config
     * @return {object} chart config
     */
    function getConfig(data, uiOptions) {
        var schema = getSchema(
                data.nodes,
                data.edges,
                data.graphMeta,
                uiOptions
            ),
            backgroundColor = getBackgroundColorStyle(uiOptions.watermark),
            returnObj;

        returnObj = {
            legend: getLegend(schema, uiOptions.customizeSymbol.rules),
            color: uiOptions.color || VIZ_COLORS.COLOR_SEMOSS,
            series: getSeries(schema, uiOptions),
        };

        if (backgroundColor) {
            returnObj.backgroundColor = backgroundColor;
        }

        return returnObj;
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

    // /**
    //  * @name showDirection
    //  * @param {bool} param -  Semoss uiOptions.showDirection
    //  * @desc sets the edge symbol for echarts
    //  * @return {array} ['none','none'] or ['none', 'circle']
    //  */
    // function showDirection(param) {
    //     if (param) {
    //         return ['none', 'arrow'];
    //     }
    //     return ['none', 'none'];
    // }

    // /**
    //  * @name getLayout
    //  * @param {bool} selectedLayout -  Semoss uiOptions.toggleLayout
    //  * @param {object} schema -  schema data for chart
    //  * @desc sets the series layout of the graph
    //  * @return {string} 'force' or 'circular'
    //  */
    // function getLayout(selectedLayout, schema) {
    //     var layout, curve;
    //     if (schema.layoutSpecified) {
    //         layout = 'none';
    //         curve = 0;
    //     } else if (selectedLayout) {
    //         layout = 'circular';
    //         curve = 0.25;
    //     } else {
    //         layout = 'force';
    //         curve = 0;
    //     }
    //     return {
    //         layout: layout,
    //         curve: curve
    //     };
    // }

    return {
        getConfig: getConfig,
    };
}
