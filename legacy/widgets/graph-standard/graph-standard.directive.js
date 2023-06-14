'use strict';

export default angular
    .module('app.graph-standard.directive', [])
    .directive('graphStandard', graphStandard);

import './graph-standard.scss';
import * as d3 from 'd3';
import '@/widget-resources/js/jvCharts/src/jv.js';
import '@/widget-resources/js/jvCharts/src/jv.css';
import '@/widget-resources/css/d3-charts.css';
graphStandard.$inject = ['$filter', '$timeout', 'semossCoreService'];

function graphStandard($filter, $timeout, semossCoreService) {
    graphStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^visualization'],
        controller: graphStandardCtrl,
        link: graphStandardLink,
        template: require('./graph-standard.directive.html'),
        priority: 300,
    };

    function graphStandardCtrl() {}

    function graphStandardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.visualizationCtrl = ctrl[1];

        /** **************Get Chart Div *************************/
        scope.chartDiv = d3.select(ele[0].firstElementChild);

        /** **************Main Event Listeners*************************/
        var resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz),
            updateListener = scope.widgetCtrl.on(
                'update-ornaments',
                initialize
            ),
            toolListener = scope.widgetCtrl.on(
                'update-tool',
                toolUpdateProcessor
            ),
            updateTaskListener = scope.widgetCtrl.on('update-task', initialize),
            addDataListener = scope.widgetCtrl.on('added-data', initialize),
            updateModeListener = scope.widgetCtrl.on('update-mode', updateMode),
            // initial variables
            // Graph
            width,
            height,
            simulation,
            svg,
            graph,
            rect,
            vis,
            link,
            arrow,
            node,
            legendBox,
            legend,
            brush,
            brushTransform,
            brushListener,
            editMode,
            fontSize,
            // Data
            links = [],
            nodes = [],
            nodesLength,
            legendNodes = [],
            legendNodeCounts = {},
            selectedNodes = [],
            selectedLegends = [],
            colors = null;

        scope.forcegraph = {}; // register custom variables that need to be bound to the ui here
        scope.forcegraph.forceGraphOptions = {
            labelToggle: true,
        };

        /** **************View Functions*************************/
        scope.highlightAdjacent = highlightAdjacent;
        scope.toggleLayout = toggleLayout;
        scope.resetHighlighting = resetHighlighting;

        // TODO MAKE SENSE OF THIS
        scope.forcegraph.toggleLabels = toggleLabels;

        /**
         * @name findWithAttr
         * @param {Array} array array to search thru
         * @param {String}attr attribute to search for
         * @param {String} value value of attribute
         * @returns {number} index or -1 if not found
         * @desc finds the index of an array of objects based on attr value
         */
        function findWithAttr(array, attr, value) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i][attr] === value) {
                    return i;
                }
            }
            return -1;
        }

        /** **************Data Functions*************************/
        /**
         * @name initialize
         * @returns {void}
         * @desc gets called from chart and is where the data manipulation happens for the viz
         */
        function initialize() {
            var layerIndex = 0,
                data = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                mode = scope.widgetCtrl.getMode('selected') || 'default-mode',
                editFontSize = scope.widgetCtrl.getWidget(
                    'view.visualization.editOptions.text.editable-text-increment'
                ),
                active = scope.widgetCtrl.getWidget('active'),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.' + active + '.tools.individual.Graph'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                uiOptions = angular.extend(sharedTools, individiualTools);

            if (typeof editFontSize === 'number') {
                fontSize = editFontSize;
            } else {
                fontSize = 10;
            }
            // update data for the visualization
            updateData(data, uiOptions);
            addBrushMode();
            scope.widgetCtrl.emit('change-mode', {
                mode: mode,
            });

            // add edit mode
            editMode = new jvEdit({
                chartDiv: scope.chartDiv,
                vizOptions: scope.widgetCtrl.getWidget(
                    'view.visualization.editOptions'
                ),
                onSaveCallback:
                    scope.widgetCtrl.getEventCallbacks().editMode.onSave,
                fontSize: fontSize,
                onFontSize: updateFontSize,
            });
        }

        /**
         * @name updateFontSize
         * @param {number} size new font size
         * @desc call back for edit mode to update font size
         * @return {void}
         */
        function updateFontSize(size) {
            semossCoreService.set(
                'widgets.' +
                    scope.widgetCtrl.widgetId +
                    '.view.visualizations.editOptions.text.editable-text-increment',
                size
            );
        }

        function updateMode() {
            var mode = scope.widgetCtrl.getMode('selected');
            if (mode === 'edit-mode') {
                scope.chartDiv.on('click', function () {
                    var classText = d3.select(event.target).attr('class');
                    if (classText && classText.indexOf('editable') > -1) {
                        editMode.displayEdit(d3.mouse(this), classText);
                    }
                });
            } else {
                scope.chartDiv.on('click', false);
            }
        }

        /**
         * @name updateData
         * @param {Object} data - what to update graph data with
         * @param {object} uiOptions - Semoss uiOptions
         * @returns {void}
         * @desc Function that updates viz when data changes
         */
        function updateData(data, uiOptions) {
            var i, j, n, colorArray, legendArray, useCustomColors, showCluster;
            legendNodes = [];
            legendNodeCounts = {};

            // creating a new graph so need to empty all previous nodes & links
            if (
                !data.edges ||
                !data.nodes ||
                data.edges.length === 0 ||
                data.nodes.length === 0
            ) {
                console.log('Empty edges or nodes from backend');
            }

            nodes = data.nodes;
            nodesLength = nodes.length;
            links = data.edges;
            legendNodeCounts = data.graphMeta;
            // if (uiOptions.clusterExists && data.nodes[0].propHash.hasOwnProperty('CLUSTER')) {
            //     legendNodeCounts = {};
            // }

            showCluster = true;
            if (uiOptions.clusterExists) {
                for (n = 0; n < data.nodes.length; n++) {
                    if (!data.nodes[n].propHash.hasOwnProperty('CLUSTER')) {
                        showCluster = false;
                        console.warn(n);
                        break;
                    }
                }
                if (showCluster) {
                    legendNodeCounts = {};
                }
                // Update shared tools
                // semossCoreService.set('view.visualization.tools.shared.clusterExists', showCluster);
                if (
                    showCluster !==
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.shared.clusterExists'
                    )
                ) {
                    addPanelOrnaments(showCluster);
                }
            }
            // ugh make nodeMap
            // scope.widgetCtrl.getWidget('view.visualization.tools.shared');

            for (i = 0; i < links.length; i++) {
                // depending on if the link.source & link.target are already pointing to
                // strings or object instances
                if (typeof links[i].source !== 'string') {
                    links[i].source = findNode(links[i].source);
                }
                if (typeof links[i].target !== 'string') {
                    links[i].target = findNode(links[i].target);
                }
            }

            if (data.uiOptions && data.uiOptions.color) {
                colorArray = Object.keys(data.uiOptions.color);
                legendArray = Object.keys(legendNodeCounts) || [];
                useCustomColors = true;
                if (colorArray.length !== legendArray.length) {
                    useCustomColors = false;
                }
                for (j = colorArray.length - 1; j >= 0; j--) {
                    if (colorArray[j] !== legendArray[j]) {
                        useCustomColors = false;
                    }
                }
                if (useCustomColors) {
                    colors = data.uiOptions.color;
                }
            }

            updateViz();
        }

        /**
         * @name addPanelOrnaments
         * @param {bool} showCluster bool to show cluster or not
         * @desc makes add panel ornament pixel
         * @return {void}
         */
        function addPanelOrnaments(showCluster) {
            var ornaments = {
                tools: scope.widgetCtrl.getWidget('view.visualization.tools'),
            };

            ornaments.tools.shared.clusterExists = showCluster;

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [ornaments],
                    terminal: true,
                },
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'retrievePanelOrnaments',
                    components: ['tools'],
                    terminal: true,
                },
            ]);
        }

        /** **************View Functions*************************/
        /**
         * @name updateViz
         * @param {boolean} resized we want to keep lock on when we resize
         * @returns {void}
         */
        function updateViz(resized) {
            let timeout = null;
            if (!resized) {
                // need to unlock viz when repaint
                scope.widgetCtrl.setState(
                    'graph-standard.graphLockToggle',
                    false
                );
                scope.widgetCtrl.emit('update-tool', {
                    fn: 'toggleLayout',
                    args: [],
                });
            }
            // remove svg
            scope.chartDiv.select('svg').remove();

            // Grab the size of the container
            var dimensions = scope.chartDiv.node().getBoundingClientRect(),
                active = scope.widgetCtrl.getWidget('active'),
                individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.' + active + '.tools.individual.Graph'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                uiOptions = angular.extend(sharedTools, individiualTools),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                );

            width = dimensions.width;
            height = dimensions.height;

            // HERE (no simulation if layout exists)
            simulation = d3
                .forceSimulation()
                .force(
                    'link',
                    d3
                        .forceLink()
                        .distance(60)
                        .id(function (d) {
                            return d.uri;
                        })
                )
                .force('charge', d3.forceManyBody().strength(-100))
                .force('center', d3.forceCenter(width / 2, height / 2));

            svg = scope.chartDiv
                .append('svg')
                .attr('class', 'editable-svg')
                .attr('width', width)
                .attr('height', height)
                .call(
                    d3
                        .zoom()
                        .scaleExtent([0.05, 1000])
                        .on('zoom', function () {
                            graph.attr('transform', d3.event.transform);
                            var inverseTransform = 1 / d3.event.transform.k;
                            node.selectAll('circle.nodecircle').attr(
                                'transform',
                                'scale(' + inverseTransform + ')'
                            );
                            node.selectAll('.force-labels').attr(
                                'transform',
                                'scale(' + inverseTransform + ')'
                            );
                            link.attr('stroke-width', inverseTransform);
                            brushTransform = d3.event.transform;
                        })
                )
                .on('dblclick.zoom', null);

            // build the arrow.
            if (uiOptions.showDirection) {
                arrow = svg
                    .append('svg:defs')
                    .selectAll('marker')
                    .data(['end']) // Different link/path types can be defined here
                    .enter()
                    .append('svg:marker') // This section adds in the arrows
                    .attr('id', 'end-' + scope.widgetCtrl.widgetId)
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 15)
                    .attr('refY', -1.5)
                    .attr('markerWidth', 9)
                    .attr('markerHeight', 9)
                    .attr('orient', 'auto');

                arrow
                    .append('svg:path')
                    .attr('class', 'graph-arrow')
                    .attr('d', 'M0,-5L10,0L0,5');
            }

            graph = svg.append('g').attr('class', 'graph');

            rect = graph
                .append('rect')
                .attr('class', 'editable-svg')
                .attr('width', width)
                .attr('height', height)
                .style('fill', 'none')
                // make transparent (vs black if commented-out)
                .style('pointer-events', 'all');

            if (uiOptions.toggleLayout) {
                vis = graph
                    .append('g')
                    .attr(
                        'transform',
                        'translate(' + width / 2 + ',' + height / 2 + ')'
                    );
            } else {
                vis = graph.append('g');
            }

            // add legend
            legendBox = svg
                .append('g')
                .attr('class', 'chart-container legend')
                .attr('height', 100)
                .attr('width', 100)
                .attr('transform', 'translate(0,0)');

            legendBox.append('rect').attr('fill', 'white');

            // add in links
            link = vis
                .append('g')
                .attr('class', 'links')
                .selectAll('line')
                .data(links)
                .enter()
                .append('line')
                .attr('stroke', '#999') // add in edge color here
                .attr('stroke-opacity', '0.6')
                .attr('stroke-width', 1) // add in edge weight here
                .attr(
                    'marker-end',
                    'url(#end-' + scope.widgetCtrl.widgetId + ')'
                );

            // add in nodes
            node = vis
                .append('g')
                .selectAll('.node')
                .data(nodes)
                .enter()
                .append('g')
                .attr('class', 'node')
                // add listeners on the node
                .on('dblclick', function (d) {
                    var selectedIdx = selectedNodes.indexOf(d),
                        selected = [];
                    // set all circles (and previously selected nodes) to default stroke & stroke-width
                    node.selectAll('circle.nodecircle')
                        .attr('stroke', '#777')
                        .attr('stroke-width', 1.5);

                    // clear legend selections
                    legend
                        .selectAll('circle')
                        .attr('stroke-width', 0)
                        .attr('stroke', function (node2) {
                            return node2.VERTEX_TYPE_PROPERTY;
                        });
                    selectedLegends = [];
                    // remove node if you select it again, if multiple nodes selected it will only select one
                    if (selectedIdx > -1 && selectedNodes.length < 2) {
                        selectedNodes.splice(selectedIdx, 1);
                    } else {
                        selectedNodes = [];
                        selectedNodes.push(d);

                        // set selected node to <color> and <border> size
                        d3.select(this)
                            .select('circle.nodecircle')
                            .attr('stroke', 'black')
                            .attr('stroke-width', 2);

                        selected.push({
                            alias: d.VERTEX_TYPE_PROPERTY,
                            instances: [d.VERTEX_LABEL_PROPERTY],
                            legendSelected: false,
                        });
                        dataPointSelected(selected);
                    }
                    clearTimeout(timeout);
                    initializeEvents('dblclick', [d]);
                })
                .call(
                    d3
                        .drag()
                        .on('start', function (d) {
                            if (!d3.event.active) {
                                simulation.alphaTarget(0.3).restart();
                            }
                            d.fx = d.x;
                            d.fy = d.y;
                        })
                        .on('drag', function (d) {
                            d.fx = d3.event.x;
                            d.fy = d3.event.y;
                        })
                        .on('end', function (d, i) {
                            if (!d3.event.active) {
                                simulation.alphaTarget(0);
                            }

                            nodes[i].fixed = true;
                            if (!d.fixed) {
                                d.fx = null;
                                d.fy = null;
                            }
                        })
                )
                .on('click', function (d) {
                    if (d3.event.ctrlKey) {
                        var selectedNode = d3.select(this).select('circle'),
                            selectedIdx = selectedNodes.indexOf(d), // see if clicked item is already selected -- if so we will deselect
                            selected = [],
                            idx;

                        if (selectedNodes.length > 0) {
                            // if a different node type is selected, we will wipe all current selections and select the new node
                            // this is to enforce the selection of one type only
                            if (
                                selectedNodes[0].VERTEX_TYPE_PROPERTY !==
                                d.VERTEX_TYPE_PROPERTY
                            ) {
                                selectedNodes = [];
                                selectedLegends = [];
                                // clear all legend selections/highlights
                                legend
                                    .selectAll('circle')
                                    .attr('stroke-width', function () {
                                        return 0;
                                    })
                                    .attr('stroke', function (legendNode) {
                                        return legendNode.color;
                                    });

                                // clear all node selections/highlights
                                node.selectAll('circle.nodecircle')
                                    .attr('stroke', function () {
                                        return '#777';
                                    })
                                    .attr('stroke-width', function () {
                                        return 1.5;
                                    });
                            }
                        }

                        if (selectedIdx > -1) {
                            // deselect the node
                            selectedNode.attr('stroke', '#777');
                            selectedNode.attr('stroke-width', 1.5);
                            selectedNodes.splice(selectedIdx, 1);
                        } else {
                            // highlight the node
                            selectedNode.attr('stroke', 'black');
                            selectedNode.attr('stroke-width', 2.0);
                            selectedNodes.push(d);
                        }

                        // make call to
                        for (idx = 0; idx < selectedNodes.length; idx++) {
                            if (selected.length === 0) {
                                selected.push({
                                    alias: selectedNodes[idx]
                                        .VERTEX_TYPE_PROPERTY,
                                    instances: [
                                        selectedNodes[idx]
                                            .VERTEX_LABEL_PROPERTY,
                                    ],
                                    legendSelected: false,
                                });
                            } else {
                                selected[0].instances.push(
                                    selectedNodes[idx].VERTEX_LABEL_PROPERTY
                                );
                            }
                        }

                        // console.log(d.VERTEX_LABEL_PROPERTY + ' of Type: ' + d.VERTEX_TYPE_PROPERTY + ' clicked');
                        // initializeEvents('click', selectedNodes);
                        if (selected.length > 0) {
                            dataPointSelected(selected);
                        }
                    } else {
                        clearTimeout(timeout);
                        timeout = setTimeout(function () {
                            initializeEvents('click', [d]);
                        }, 500);
                    }
                })
                .on('contextmenu', function (d) {
                    if (d.VERTEX_LABEL_PROPERTY && d.VERTEX_TYPE_PROPERTY) {
                        scope.visualizationCtrl.setContextMenuDataFromClick(
                            typeof d.VERTEX_LABEL_PROPERTY === 'string'
                                ? d.VERTEX_LABEL_PROPERTY.replace(/ /g, '_')
                                : d.VERTEX_LABEL_PROPERTY,
                            {
                                name: [
                                    typeof d.VERTEX_TYPE_PROPERTY === 'string'
                                        ? d.VERTEX_TYPE_PROPERTY.replace(
                                              / /g,
                                              '_'
                                          )
                                        : d.VERTEX_TYPE_PROPERTY,
                                ],
                            }
                        );
                        scope.visualizationCtrl.openContextMenu(d3.event);
                    }
                });
            // add circles
            node.append('circle')
                .attr('class', 'nodecircle')
                .attr('r', 8) // add in node size here
                .attr('fill', function (d) {
                    // add in node color here
                    // CLUSTER LOGIC HERE
                    var tempNodeColor =
                            d.VERTEX_COLOR_PROPERTY || '238,238,238',
                        count,
                        colorValue,
                        colorPalette,
                        index;
                    if (colorBy) {
                        colorValue = getColorValue(colorBy, d);
                        // if (colorValue) {
                        //     return colorValue;
                        // }
                    }
                    if (colors) {
                        tempNodeColor = colors[d.VERTEX_TYPE_PROPERTY];
                    } else {
                        tempNodeColor = 'rgb(' + tempNodeColor + ')';
                    }

                    // if (uiOptions.clusterExists && d.propHash.hasOwnProperty('CLUSTER')) {
                    if (uiOptions.clusterExists) {
                        // colorValue = colorArray[d.propHash.CLUSTER];
                        tempNodeColor = '';
                        colorPalette = uiOptions.color;
                        count = legendNodeCounts[d.propHash.CLUSTER];
                        legendNodeCounts[d.propHash.CLUSTER] = {};

                        if (d.propHash.CLUSTER > colorPalette.length - 1) {
                            index = d.propHash.CLUSTER % colorPalette.length;
                            tempNodeColor = colorPalette[index];
                            legendNodeCounts[d.propHash.CLUSTER].color =
                                colorPalette[index];
                        } else {
                            tempNodeColor = colorPalette[d.propHash.CLUSTER];
                            legendNodeCounts[d.propHash.CLUSTER].color =
                                colorPalette[d.propHash.CLUSTER];
                        }

                        // legendNodeCounts[d.propHash.CLUSTER].count = count;
                        legendNodeCounts[d.propHash.CLUSTER].name =
                            d.propHash.CLUSTER;
                    } else if (
                        typeof legendNodeCounts[d.VERTEX_TYPE_PROPERTY] !==
                        'object'
                    ) {
                        count = legendNodeCounts[d.VERTEX_TYPE_PROPERTY];
                        legendNodeCounts[d.VERTEX_TYPE_PROPERTY] = {};
                        legendNodeCounts[d.VERTEX_TYPE_PROPERTY].count = count;
                        legendNodeCounts[d.VERTEX_TYPE_PROPERTY].name =
                            d.VERTEX_TYPE_PROPERTY;
                        legendNodeCounts[d.VERTEX_TYPE_PROPERTY].color =
                            tempNodeColor;
                    }

                    if (colorBy && colorValue) {
                        return colorValue;
                    }
                    return tempNodeColor;
                })
                .attr('stroke', function (d) {
                    if (findWithAttr(selectedNodes, 'uri', d.uri) > -1) {
                        return 'black';
                    }
                    return '#777';
                })
                .attr('stroke-width', function (d) {
                    if (findWithAttr(selectedNodes, 'uri', d.uri) > -1) {
                        return 2.0;
                    }
                    return 1.5;
                });
            // add text
            node.append('text')
                .attr('class', 'force-labels')
                .attr('x', 12)
                .attr('dy', '.35em')
                .attr('stroke', 'none')
                .attr('font-size', fontSize + 'px')
                .attr('opacity', 1)
                .style('display', 'block')
                .text(function (d) {
                    if (typeof d.VERTEX_LABEL_PROPERTY === 'string') {
                        return d.VERTEX_LABEL_PROPERTY.replace(/_/g, ' ');
                    }
                    return d.VERTEX_LABEL_PROPERTY;
                });

            toggleLabels(uiOptions.displayValues);

            legendNodes = [];
            for (var key in legendNodeCounts) {
                if (legendNodeCounts.hasOwnProperty(key)) {
                    legendNodes.push(legendNodeCounts[key]);
                }
            }

            // legend update...
            legend = legendBox
                .selectAll('.legend')
                .data(legendNodes)
                .enter()
                .append('g')
                .attr('class', 'legend')
                .style('cursor', 'pointer')
                .on('dblclick', function (d) {
                    var selected = [],
                        selectedHolder = {},
                        i,
                        len;
                    selectedNodes = [];
                    selectedLegends = [d.name];

                    // fill the selected legend node
                    legend
                        .selectAll('circle')
                        .attr('stroke-width', function (node) {
                            if (node.name === d.name) {
                                return 1.5;
                            }
                            return 0;
                        })
                        .attr('stroke', function (node) {
                            if (node.name === d.name) {
                                return 'black';
                            }
                            return node.color;
                        });

                    // increase stroke width and change color for nodes that are the selected type
                    node.selectAll('circle.nodecircle')
                        .attr('stroke', function (node) {
                            if (node.VERTEX_TYPE_PROPERTY === d.name) {
                                selectedNodes.push(node);
                                return 'black';
                            }
                            return '#777';
                        })
                        .attr('stroke-width', function (node) {
                            if (node.VERTEX_TYPE_PROPERTY === d.name) {
                                return 2;
                            }
                            return 1.5;
                        });

                    // loop through selectedNode and push into items
                    for (i = 0, len = selectedNodes.length; i < len; i++) {
                        if (
                            !selectedHolder[
                                selectedNodes[i].VERTEX_TYPE_PROPERTY
                            ]
                        ) {
                            selectedHolder[
                                selectedNodes[i].VERTEX_TYPE_PROPERTY
                            ] = {
                                alias: selectedNodes[i].VERTEX_TYPE_PROPERTY,
                                instances: [],
                                legendSelected: true,
                            };
                        }

                        selectedHolder[
                            selectedNodes[i].VERTEX_TYPE_PROPERTY
                        ].instances.push(
                            selectedNodes[i].VERTEX_LABEL_PROPERTY
                        );
                    }

                    for (i in selectedHolder) {
                        if (selectedHolder.hasOwnProperty(i)) {
                            selected.push(selectedHolder[i]);
                        }
                    }

                    dataPointSelected(selected);
                });

            legend
                .append('circle')
                .attr('r', 0)
                .attr('r', 6)
                .attr('stroke-width', function (d) {
                    if (selectedLegends.indexOf(d.name) > -1) {
                        return 2.0;
                    }
                    return 1.5;
                })
                .attr('stroke', function (d) {
                    if (selectedLegends.indexOf(d.name) > -1) {
                        return 'black';
                    }
                    return '#777';
                })
                .style('fill', function (d) {
                    return d.color;
                })
                .attr('transform', function (d, i) {
                    return 'translate(20,' + (i * 20 + 25) + ')';
                });

            legend
                .append('text')
                .attr('x', 12)
                .text(function (d) {
                    if (d.hasOwnProperty('count')) {
                        return (
                            $filter('replaceUnderscores')(d.name) +
                            ' (' +
                            d.count +
                            ')'
                        );
                    }
                    return $filter('replaceUnderscores')(d.name);
                })
                .attr('transform', function (d, i) {
                    return 'translate(20,' + (i * 20 + 29) + ')';
                });

            // start simulation
            simulation.nodes(nodes).on('tick', function () {
                link.attr('x1', function (d) {
                    return d.source.x;
                })
                    .attr('y1', function (d) {
                        return d.source.y;
                    })
                    .attr('x2', function (d) {
                        return d.target.x;
                    })
                    .attr('y2', function (d) {
                        return d.target.y;
                    });

                node.attr('transform', function (d) {
                    return 'translate(' + d.x + ',' + d.y + ')';
                });
            });

            simulation.force('link').links(links);
        }

        /**
         * @name getColorValue
         * @param {object} colorByValue Semoss uiOptions.colorByValue
         * @param {object} d current data point
         * @desc determines if node should be colored using colorByValue
         * @return {string | boolean} color string if node should be colored,
         *                            false otherwise
         */
        function getColorValue(colorByValue, d) {
            var returnColor = false,
                i,
                j;
            if (!colorByValue) {
                return returnColor;
            }

            for (i = 0; i < colorByValue.length; i++) {
                if (
                    d.VERTEX_TYPE_PROPERTY.replace(/_/g, ' ') ===
                    colorByValue[i].colorOn.replace(/_/g, ' ')
                ) {
                    for (j = 0; j < colorByValue[i].valuesToColor.length; j++) {
                        if (
                            colorByValue[i].valuesToColor[j] &&
                            colorByValue[i].valuesToColor[j].replace(
                                /_/g,
                                ' '
                            ) === d.VERTEX_LABEL_PROPERTY.replace(/_/g, ' ')
                        ) {
                            returnColor = colorByValue[i].color;
                            break;
                        }
                    }
                }
            }

            return returnColor;
        }

        /**
         * @name resizeViz
         * @desc Function triggered when the visualization is resized
         * @returns {void}
         */
        function resizeViz() {
            // Grab the size of the container
            var dimensions = scope.chartDiv.node().getBoundingClientRect();
            width = dimensions.width;
            height = dimensions.height;

            svg.attr('width', width).attr('height', height);

            rect.attr('width', width).attr('height', height);

            updateViz(true);
        }

        function addBrushMode() {
            brushListener = scope.widgetCtrl.on('update-mode', function () {
                var mode = scope.widgetCtrl.getMode('selected');
                if (mode === 'brush-mode') {
                    startBrush();
                } else {
                    removeBrush();
                }
            });
        }

        function removeBrush() {
            scope.chartDiv.selectAll('.brusharea').remove();
        }

        function startBrush() {
            var divHeight = scope.chartDiv._groups[0][0].clientHeight,
                divWidth = scope.chartDiv._groups[0][0].clientWidth,
                brushContext;
            brush = d3
                .brush()
                .extent([
                    [0, 0],
                    [divWidth, divHeight],
                ])
                .on('end', brushEnd);
            brushContext = svg
                .append('g')
                .attr('class', 'brusharea')
                .style('height', divHeight + 'px')
                .style('width', divWidth + 'px')
                .call(brush);
        }

        function brushEnd() {
            var e = d3.event.selection,
                brushedNodes = {},
                i,
                nodeEle;
            if (e) {
                if (brushTransform) {
                    // x
                    e[0][0] = (e[0][0] - brushTransform.x) / brushTransform.k;
                    e[1][0] = (e[1][0] - brushTransform.x) / brushTransform.k;
                    // y
                    e[0][1] = (e[0][1] - brushTransform.y) / brushTransform.k;
                    e[1][1] = (e[1][1] - brushTransform.y) / brushTransform.k;
                }

                for (i = 0; i < nodesLength; i++) {
                    nodeEle = nodes[i];
                    if (nodeEle.x >= e[0][0] && nodeEle.x <= e[1][0]) {
                        if (nodeEle.y >= e[0][1] && nodeEle.y <= e[1][1]) {
                            if (!brushedNodes[nodeEle.VERTEX_TYPE_PROPERTY]) {
                                brushedNodes[nodeEle.VERTEX_TYPE_PROPERTY] = [];
                            }
                            brushedNodes[nodeEle.VERTEX_TYPE_PROPERTY].push(
                                nodeEle.VERTEX_LABEL_PROPERTY
                            );
                        }
                    }
                }
            }

            scope.widgetCtrl.execute(buildFilterComponents(brushedNodes));
        }

        /**
         * @name dataPointSelected
         * @param {array} selectedData data selected
         * @desc retrieves the related insights to the selectedData
         * @param {bool} conceptSelected true if a concept (legend dimension) was selected; false if an individual node was selected
         * @return {void}
         */
        function dataPointSelected(selectedData) {
            let dblClickEvents = scope.widgetCtrl.getWidget(
                'events.onDoubleClick'
            );

            // Don't display traverse if a custom dblclick event exists
            if (selectedData.length === 0 || dblClickEvents) {
                return;
            }

            $timeout(function () {
                scope.widgetCtrl.open('handle', 'traverse');
            });

            // stores in insightData (selected across for points)
            scope.widgetCtrl.emit('change-selected', {
                selected: selectedData,
            });
            // only update if something is selected
            // call if toggled open
            // TODO davy: need to loop through all of the selected.data and get all the types for when we are able to select multiple types with 'ctrl' key
        }
        /**
         * @name buildFilterComponents
         * @param {object} dataToFilter - nodes that will be filtered on
         * @desc builds the filter components
         * @returns {array} - array of filter components
         */
        function buildFilterComponents(dataToFilter) {
            var components = [],
                panels,
                hasData = false,
                alias,
                i,
                len;

            for (alias in dataToFilter) {
                if (dataToFilter.hasOwnProperty(alias)) {
                    if (dataToFilter[alias].length > 0) {
                        hasData = true;
                        components.push(
                            {
                                type: 'variable',
                                components: [scope.widgetCtrl.getFrame('name')],
                            },
                            {
                                type: 'setFrameFilter',
                                components: [
                                    [
                                        {
                                            type: 'value',
                                            alias: alias,
                                            comparator: '==',
                                            values: dataToFilter[alias],
                                        },
                                    ],
                                ],
                                terminal: true,
                            }
                        );
                    }
                }
            }

            if (!hasData) {
                components.push(
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'unfilterFrame',
                        components: [],
                        terminal: true,
                    }
                );
            }

            if (components.length > 0) {
                panels = scope.widgetCtrl.getShared('panels');
                // refresh
                for (i = 0, len = panels.length; i < len; i++) {
                    components.push({
                        type: 'refresh',
                        components: [panels[i].widgetId],
                        terminal: true,
                    });
                }

                return components;
            }
            return [];
        }
        /**
         * @name toggleLabels
         * @desc toggles the labels to be visible or not
         * @param {bool} param - uiOptions.displayValues
         * @returns {void}
         */
        function toggleLabels(param) {
            if (typeof param === 'undefined' || param) {
                node.on('mouseover', null).on('mouseout', null);

                node.selectAll('.force-labels')
                    .attr('class', 'force-labels')
                    .style('display', 'block')
                    .attr('opacity', 1);
            } else {
                node.on('mouseover', function (d) {
                    d3.select(this)
                        .select('.force-labels')
                        .attr('class', 'force-labels')
                        .style('display', 'block')
                        .attr('opacity', 1);
                }).on('mouseout', function (d) {
                    d3.select(this)
                        .select('.force-labels')
                        .attr('class', 'force-labels')
                        .style('display', 'none')
                        .attr('opacity', 1);
                });

                node.selectAll('.force-labels')
                    .attr('class', 'force-labels')
                    .style('display', 'none')
                    .attr('opacity', 1);
            }
        }

        /**
         * @name findNode
         * @param {String} uri uri string
         * @desc finds node based on uri
         * @returns {Object} node or null
         */
        function findNode(uri) {
            for (var i = 0; i < nodesLength; i++) {
                if (nodes[i].uri === uri) {
                    return nodes[i];
                }
            }
            return null;
        }

        /**
         * @name initializeEvents
         * @desc creates the event layer
         * @param {string} actionType mouseover, mouseout, click, etc.
         * @param {obj} data selected data
         * @returns {void}
         */
        function initializeEvents(actionType, data) {
            var callbacks = scope.widgetCtrl.getEventCallbacks(),
                currentMode =
                    scope.widgetCtrl.getMode('selected') || 'default-mode',
                actionData;

            if (currentMode === 'default-mode') {
                switch (actionType) {
                    case 'mouseover':
                        actionData = getDataForEvents(data);
                        callbacks.defaultMode.onMouseIn(actionData);
                        break;
                    case 'mouseout':
                        actionData = getDataForEvents(data);
                        callbacks.defaultMode.onMouseOut(actionData);
                        break;
                    case 'click':
                        actionData = getDataForEvents(data);
                        callbacks.defaultMode.onClick(actionData);
                        break;
                    case 'dblclick':
                        actionData = getDataForEvents(data);
                        callbacks.defaultMode.onDoubleClick(actionData);
                        break;
                    default:
                        return;
                }
            }
        }

        /**
         * @name getDataForEvents
         * @desc format data for event service
         * @param {obj} data - selected data
         * @returns {obj} selected data formatted for event service
         */
        function getDataForEvents(data) {
            var actionData = {};

            actionData.data = {};
            if (Array.isArray(data)) {
                for (let dataIdx = 0; dataIdx < data.length; dataIdx++) {
                    if (!actionData.data[data[dataIdx].VERTEX_TYPE_PROPERTY]) {
                        actionData.data[data[dataIdx].VERTEX_TYPE_PROPERTY] =
                            [];
                    }

                    actionData.data[data[dataIdx].VERTEX_TYPE_PROPERTY].push(
                        data[dataIdx].VERTEX_LABEL_PROPERTY
                    );
                }
            } else {
                actionData.data[data.VERTEX_TYPE_PROPERTY] = [
                    data.VERTEX_LABEL_PROPERTY,
                ];
            }
            actionData.eventType = '';
            actionData.mouse = [];

            return actionData;
        }

        /** **************Tool Functions*************************/
        /**
         * @name toolUpdateProcessor
         * @desc Function triggered when the visualization tools have changed, and the viz needs to be updated
         * @param {object} toolUpdateConfig - config object for the tool function
         */

        function toolUpdateProcessor(toolUpdateConfig) {
            // need to invoke tool functions
            scope[toolUpdateConfig.fn](toolUpdateConfig.args);
        }

        /**
         * @name highlightSpecific
         * @param {string} concept concept to highlight
         * @desc highlight nodes of a specific concept
         * @returns {void}
         */
        scope.highlightSpecific = function (concept) {
            selectedNodes = [];
            // unhighlight all legend nodes
            d3.select('.chart-container.legend .' + scope.widgetCtrl.widgtId)
                .selectAll('circle')
                .attr('stroke-width', 0.5)
                .attr('stroke', '#777');

            // unhighlight edges
            link.selectAll('line')
                .attr('opacity', 0.2)
                .attr('stroke', '#666')
                .attr('stroke-width', 1.5);

            node.each(function (d) {
                // populate array with values of selected property
                if (d.VERTEX_TYPE_PROPERTY !== concept) {
                    // lower the opacity of nodes that aren't highlighted, reset selections
                    d3.select(this)
                        .select('circle')
                        .transition()
                        .duration(800)
                        .attr('opacity', 0.5)
                        .attr('stroke', '#777')
                        .attr('stroke-width', 1.5);
                    d3.select(this)
                        .select('text')
                        .transition()
                        .duration(800)
                        .attr('opacity', 0.5);
                } else {
                    // highlight the node on the graph, push adjacent nodes to the selected nodes array
                    selectedNodes.push(d);
                    d3.select(this)
                        .select('circle')
                        .transition()
                        .duration(800)
                        .attr('opacity', 1)
                        .attr('stroke', 'black')
                        .attr('stroke-width', 2.0);
                    d3.select(this)
                        .select('text')
                        .transition()
                        .duration(800)
                        .attr('opacity', 1);
                }
            });
        };

        /**
         * @name highlightAdjacent
         * @param {string} type - type to highlight
         * @desc if a node is selected, this function will highlight adjacent links & nodes
         * @returns {void}
         */
        function highlightAdjacent(type) {
            var highlightNodes = [],
                highlightEdges = [],
                i,
                j;
            // find nodes and edges to highlight based on selectedNodes

            for (i = 0; i < selectedNodes.length; i++) {
                highlightNodes.push(selectedNodes[i].uri);

                if (type.indexOf('Downstream') > -1) {
                    for (j = 0; j < links.length; j++) {
                        // if the sources match then push the target
                        if (links[j].source.uri === selectedNodes[i].uri) {
                            highlightNodes.push(links[j].target.uri);
                            highlightEdges.push(selectedNodes[i].uri);
                        }
                    }
                }
                if (type.indexOf('Upstream') > -1) {
                    for (j = 0; j < links.length; j++) {
                        // if the sources match then push the target
                        if (links[j].target.uri === selectedNodes[i].uri) {
                            highlightNodes.push(links[j].source.uri);
                            highlightEdges.push(selectedNodes[i].uri);
                        }
                    }
                }
            }
            // reset selected
            selectedNodes = [];

            link.selectAll('line')
                .attr('stroke-width', function (d) {
                    return d3.select(this).attr('stroke-width');
                })
                .attr('stroke', function (d) {
                    if (
                        highlightEdges.indexOf(d.source.uri) > -1 ||
                        highlightEdges.indexOf(d.target.uri) > -1
                    ) {
                        return 'black';
                    }
                    return '#666';
                })
                .attr('opacity', function (d) {
                    if (
                        highlightEdges.indexOf(d.source.uri) > -1 ||
                        highlightEdges.indexOf(d.target.uri) > -1
                    ) {
                        return 1;
                    }
                    return 0.2;
                });

            node.selectAll('circle.nodecircle')
                .attr('stroke-width', function (d) {
                    if (highlightNodes.indexOf(d.uri) > -1) {
                        selectedNodes.push(d);
                        return 2;
                    }
                    return 1.5;
                })
                .attr('stroke', function (d) {
                    if (highlightNodes.indexOf(d.uri) > -1) {
                        return 'black';
                    }
                    return '#777';
                })
                .attr('opacity', function (d) {
                    if (highlightNodes.indexOf(d.uri) > -1) {
                        return 1;
                    }
                    return 0.5;
                });

            node.selectAll('.force-labels').attr('opacity', function (d) {
                if (highlightNodes.indexOf(d.uri) > -1) {
                    return 1;
                }
                return 0.5;
            });
        }

        /**
         * @name toggleLayout
         * @desc stops physics
         * @returns {void}
         */
        function toggleLayout() {
            if (simulation) {
                var active = scope.widgetCtrl.getWidget('active'),
                    individiualTools =
                        scope.widgetCtrl.getWidget(
                            'view.' + active + '.tools.individual.Graph'
                        ) || {},
                    sharedTools = scope.widgetCtrl.getWidget(
                        'view.' + active + '.tools.shared'
                    ),
                    uiOptions = angular.extend(sharedTools, individiualTools),
                    i,
                    positionX = [],
                    positionY = [],
                    scale,
                    dimensions = scope.chartDiv.node().getBoundingClientRect();

                if (
                    scope.widgetCtrl.getState('graph-standard.graphLockToggle')
                ) {
                    for (i = 0; i < nodesLength; i++) {
                        nodes[i].fx = nodes[i].x;
                        nodes[i].fy = nodes[i].y;
                        nodes[i].fixed = true;
                    }
                    simulation.stop();
                } else if (uiOptions.toggleLayout) {
                    if (
                        nodes[0].propHash.X !== null &&
                        nodes[0].propHash.y !== null
                    ) {
                        // Initial Postition & Scale
                        for (i = 0; i < nodesLength; i++) {
                            positionX.push(nodes[i].propHash.X);
                            positionY.push(nodes[i].propHash.Y);
                        }
                        var maxX = Math.max.apply(null, positionX),
                            maxY = Math.max.apply(null, positionY),
                            minX = Math.min.apply(null, positionX),
                            minY = Math.min.apply(null, positionY),
                            positionTooLarge = false;

                        if (
                            Math.abs(maxX) > dimensions.width / 4 ||
                            Math.abs(maxY) > dimensions.height / 4 ||
                            Math.abs(minX) > dimensions.width / 4 ||
                            Math.abs(minY) > dimensions.height / 4
                        ) {
                            positionTooLarge = true;
                        }
                        scale = dimensions.width / 4 / Math.abs(maxX);

                        for (i = 0; i < nodesLength; i++) {
                            if (positionTooLarge) {
                                nodes[i].fx = nodes[i].propHash.X;
                                nodes[i].fy = nodes[i].propHash.Y;
                            } else {
                                nodes[i].fx = nodes[i].propHash.X * scale;
                                nodes[i].fy = nodes[i].propHash.Y * scale;
                                // or check if this value exceeds width, height, etc.
                            }
                            nodes[i].fixed = true;
                        }

                        // for (i = 0; i < nodesLength; i++) {
                        //     nodes[i].fx = nodes[i].propHash.X;
                        //     nodes[i].fy = nodes[i].propHash.Y;

                        //     nodes[i].fixed = true;
                        // }

                        simulation.restart();
                    }
                } else {
                    for (i = 0; i < nodesLength; i++) {
                        nodes[i].fx = null;
                        nodes[i].fy = null;
                        nodes[i].fixed = false;
                    }
                    simulation.restart();
                }
            } else {
                $timeout(function () {
                    toggleLayout();
                }, 1000);
            }
        }

        /**
         * @name resetHighlighting
         * @desc removes al highlighting
         * @returns {void}
         */
        function resetHighlighting() {
            link.selectAll('line').attr('stroke', '#666').attr('opacity', 1);

            node.selectAll('circle.nodecircle')
                .attr('stroke', '#777')
                .attr('stroke-width', 1.5)
                .attr('opacity', 1);

            node.selectAll('.force-labels').attr('opacity', 1);

            selectedNodes = [];
            selectedLegends = [];
        }

        scope.$on('$destroy', function () {
            resizeListener();
            toolListener();
            updateListener();
            addDataListener();
            brushListener();
            updateTaskListener();
            updateModeListener();
            // clear chart div
            scope.chartDiv.node().innerHTML = '';
        });

        initialize();
    }
}
