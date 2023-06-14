'use strict';

import * as d3 from 'd3';
import * as Viva from '@/widget-resources/js/vivagraph/vivagraph.js';
import '@/widget-resources/css/d3-charts.css';

import './vivagraph-standard.scss';

export default angular
    .module('app.vivagraph-standard.directive', [])
    .directive('vivagraphStandard', vivagraphStandard);

vivagraphStandard.$inject = ['$filter', '$timeout'];

function vivagraphStandard($filter, $timeout) {
    vivagraphStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    vivagraphStandardCtrl.$inject = ['$scope'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: vivagraphStandardLink,
        controller: vivagraphStandardCtrl,
        template: require('./vivagraph-standard.directive.html'),
    };

    function vivagraphStandardCtrl() {}

    function vivagraphStandardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        /** **************Get Chart Div *************************/
        scope.chartDiv = d3.select(ele[0].firstElementChild);
        scope.chartDiv.width = ele
            .parents('#widget-view__resizable')[0]
            .getBoundingClientRect().width;
        scope.chartDiv.height = ele
            .parents('#widget-view__resizable')[0]
            .getBoundingClientRect().height;
        /** **************Main Event Listeners*************************/
        var resizeListener = scope.widgetCtrl.on('resize-widget', resizeViz),
            toolListener = scope.widgetCtrl.on(
                'update-tool',
                toolUpdateProcessor
            ),
            brushModeListener = scope.widgetCtrl.on('update-mode', toggleMode),
            updateListener = scope.widgetCtrl.on(
                'update-ornaments',
                initialize
            ),
            updateTaskListener = scope.widgetCtrl.on('update-task', initialize),
            addDataListener = scope.widgetCtrl.on('added-data', initialize),
            addedNodes,
            addedEdges,
            linkColor,
            svgContainer,
            svg,
            legendBox,
            legendNodeCounts = {},
            selectedNodes = [],
            graphMeta = {},
            // declare/initialize local variables
            container,
            tooltip,
            graph,
            graphics,
            layout,
            events,
            renderer,
            multiSelectOverlay;

        scope.vivaGraph = {};

        // variables for d3 legend
        linkColor = 0xb3b3b3ff;

        /**
         * @name toggleBrushMode
         * @desc toggles brush mode
         * @return {void}
         */
        function toggleMode() {
            var toggle = false,
                mode = scope.widgetCtrl.getMode('selected');

            if (mode === 'brush-mode') {
                // add brush mode
                multiSelectOverlay = startMultiSelect();
                toggle = true;
            } else {
                // clear brush mode
                if (multiSelectOverlay) {
                    multiSelectOverlay.destroy();
                }
                multiSelectOverlay = null;
            }
            scope.vivaGraph.vivaGraphOptions.brushMode = toggle;
        }

        /**
         * @name initialize
         * @param {Object} newData newly changed data
         * @desc function that is triggered when data is updated by the UI
         * @return {void}
         */
        function initialize() {
            var individiualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.VivaGraph'
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared'
                ),
                layerIndex = 0,
                newData = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.data'
                ),
                legendContainer,
                brushContainer,
                toggleLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.toggleLayout'
                );

            newData.uiOptions = angular.extend(sharedTools, individiualTools);

            addedNodes = newData.nodes;
            addedEdges = newData.edges;
            graphMeta = newData.graphMeta;
            scope.vivaGraph.vivaGraphOptions = {
                defaultNodeSize: 12,
                defaultNodeBorder: 0,
                selectedUri: [],
                selectedColorGroup:
                    newData.uiOptions.selectedColorGroup || false,
                legendToggle: true,
                labelToggle: false,
                brushMode: false,
                selectedLayout:
                    newData.uiOptions.selectedLayoutOptions || 'forceDirected',
                selectedLayoutOptions: newData.uiOptions
                    .selectedLayoutOptions || {
                    springLength: 80,
                    springCoeff: 0.0002,
                    gravity: -1.2,
                    theta: 0.8,
                    dragCoeff: 0.02,
                    timeStep: 20,
                    stableThreshold: 0.009,
                },
            };
            if (toggleLayout && scope.widgetCtrl.getFrame('type') === 'GRAPH') {
                scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions = {
                    springLength: 0,
                    springCoeff: 0,
                    gravity: 0,
                    theta: 0,
                    dragCoeff: 0,
                    timeStep: 0,
                    stableThreshold: 0,
                };
            }

            // add legend container
            if (scope.vivaGraph.vivaGraphOptions.legendToggle) {
                legendContainer = scope.chartDiv.select('#vivagraph__legend');
                if (!legendContainer._groups[0][0]) {
                    legendContainer = document.createElement('div');
                    legendContainer.setAttribute('id', 'vivagraph__legend');
                    legendContainer.setAttribute('class', 'vivagraph__legend');
                    scope.chartDiv.node().append(legendContainer);
                }
            }

            // add brush container
            brushContainer = scope.chartDiv.select(
                '#chart-container-graph-brush'
            );
            if (!brushContainer._groups[0][0]) {
                brushContainer = document.createElement('div');
                brushContainer.setAttribute(
                    'id',
                    'chart-container-graph-brush'
                );
                brushContainer.style.position = 'absolute';
                brushContainer.style.left = 0;
                brushContainer.style.top = 0;
                brushContainer.style.right = 0;
                brushContainer.style.bottom = 0;
                brushContainer.style.display = 'none';
                brushContainer.style.cursor = 'crosshair';
                scope.chartDiv.node().append(brushContainer);
            }

            drawGraph(newData.nodes, newData.edges, graphMeta);
            // toggleMode(currentWidget.data.selectedMode);
        }

        /**
         * @name toolUpdateProcessor
         * @param {object} toolUpdateConfig newly changed tools
         * @desc function that is triggered when tools is updated by the UI
         * @return {void}
         */
        function toolUpdateProcessor(toolUpdateConfig) {
            scope[toolUpdateConfig.fn](toolUpdateConfig.args);
        }

        /**
         * @name resizeViz
         * @desc function that is triggered when the panel is resized
         * @return {void}
         */
        function resizeViz() {
            var w = ele
                    .parents('#widget-view__resizable')[0]
                    .getBoundingClientRect().width,
                height = ele
                    .parents('#widget-view__resizable')[0]
                    .getBoundingClientRect().height;
            if (
                scope.chartDiv.select('canvas').node().width !== w ||
                scope.chartDiv.select('canvas').node().height !== height
            ) {
                // scope.chartDiv.width = w;
                // scope.chartDiv.height = height;
                drawGraph(addedNodes, addedEdges, graphMeta, true);
            }
        }

        /* Viz Functions*/
        /** Main**/
        /**
         * @name drawGraph
         * @param {Object} nodes nodes that comprise the graph
         * @param {Object} edges edges that comprise the graph
         * @param {Object} drawGraphMeta node counts
         * @param {boolean} resized if we resize, don't want to unlock
         * @desc used for drawing the graph
         * @return {void}
         */
        function drawGraph(nodes, edges, drawGraphMeta, resized) {
            // var graphLockToggle = scope.widgetCtrl.getState('vivagraph-standard.graphLockToggle');
            legendNodeCounts = drawGraphMeta;
            createGraph(nodes, edges);
            setGraphics();
            setGraphLayout();
            setGraphEvents(graphics, graph);
            if (!resized) {
                // need to unlock before redraw
                scope.widgetCtrl.setState(
                    'vivagraph-standard.graphLockToggle',
                    false
                );
                scope.widgetCtrl.emit('update-tool', {
                    fn: 'toggleLayout',
                    args: [false],
                });
            }
            renderGraph(graph, container, graphics, layout);
            createLegend();
            updateLegend();

            // if (graphLockToggle) {
            //     $timeout(function () {
            //         scope.widgetCtrl.emit('update-tool', {
            //             'fn': 'toggleLayout',
            //             'args': [true]
            //         });
            //     });
            // }
        }

        /**
         * @name createGraph
         * @desc handles creation of the graph object
         * @param {array} nodes array of nodes
         * @param {array} edges array of edges
         * @return {void}
         */
        function createGraph(nodes, edges) {
            var count,
                i,
                filteredNodes,
                filteredEdges,
                vertexTypeName,
                clustering = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.clusterExists'
                );
            if (graph) {
                renderer.dispose();
            }
            container = scope.chartDiv.node();
            filteredNodes = nodes.filter(function (node) {
                return String(node.VERTEX_LABEL_PROPERTY);
            });

            filteredEdges = edges.filter(function (edge) {
                if (
                    !calculateFullEdge(edge, 'source') ||
                    !calculateFullEdge(edge, 'target')
                ) {
                    return false;
                }

                return true;
            });

            // clear canvas container - TODO do this a more efficient way
            clearChildElements('canvas');

            // construct graph
            graph = Viva.Graph.graph();

            // add in nodes
            for (i = 0; i < filteredNodes.length; i++) {
                // name, data
                // need to have different property so tooltip labels show up correctly
                filteredNodes[i].VERTEX_TOOLTIP =
                    filteredNodes[i].VERTEX_TYPE_PROPERTY;
                if (clustering) {
                    filteredNodes[i].VERTEX_TYPE_PROPERTY =
                        filteredNodes[i].propHash.CLUSTER;
                } else if (filteredNodes[i].propHash.CLUSTER) {
                    // we don't ask for data again, need to remove clustering for display purposes
                    delete filteredNodes[i].propHash.CLUSTER;
                }
                filteredNodes[i].color = getNodeColor(filteredNodes[i]);
                graph.addNode(filteredNodes[i].uri, filteredNodes[i]);
                if (
                    legendNodeCounts &&
                    typeof legendNodeCounts[
                        filteredNodes[i].VERTEX_TYPE_PROPERTY
                    ] !== 'object'
                ) {
                    count =
                        legendNodeCounts[filteredNodes[i].VERTEX_TYPE_PROPERTY];
                    legendNodeCounts[filteredNodes[i].VERTEX_TYPE_PROPERTY] =
                        {};
                    legendNodeCounts[
                        filteredNodes[i].VERTEX_TYPE_PROPERTY
                    ].count = count;
                    if (clustering) {
                        vertexTypeName = filteredNodes[i].propHash.CLUSTER;
                    } else {
                        vertexTypeName = filteredNodes[i].VERTEX_TYPE_PROPERTY;
                    }
                    legendNodeCounts[
                        filteredNodes[i].VERTEX_TYPE_PROPERTY
                    ].name = vertexTypeName;
                    legendNodeCounts[
                        filteredNodes[i].VERTEX_TYPE_PROPERTY
                    ].color = filteredNodes[i].VERTEX_COLOR_PROPERTY;
                }
            }

            // add in edges
            for (i = 0; i < filteredEdges.length; i++) {
                // source, target, data
                graph.addLink(
                    filteredEdges[i].source,
                    filteredEdges[i].target,
                    filteredEdges[i].propHash
                );
            }
        }

        /**
         * @name calculateFullEdge
         * @param {object} edge edge in questions
         * @param {string} edgeProp source or target
         * @return {boolean} if true, it is full edge
         */
        function calculateFullEdge(edge, edgeProp) {
            var numSlashes = 0,
                lastSlash;

            edge[edgeProp].split('').forEach(function (char, idx) {
                if (char === '/') {
                    lastSlash = idx;
                    numSlashes++;
                }
            });

            if (numSlashes === 1 && lastSlash === edge[edgeProp].length - 1) {
                return false;
            }

            return true;
        }

        /**
         * @name clearChildElements
         * @param {Dom} element dom element
         * @desc clears child elements
         * @return {void}
         */
        function clearChildElements(element) {
            var childCount = container.children.length;
            while (childCount !== 0) {
                if (container.children[childCount - 1].localName === element) {
                    container.removeChild(container.children[childCount - 1]);
                }
                childCount--;
            }
        }

        /**
         * @name setLabelGraphics
         * @desc configures label graphics for the container
         * @return {void}
         */
        function setLabelGraphics() {
            // create tooltip for nodes
            tooltip = container.querySelectorAll('.vivagraph__tooltip');

            if (tooltip.length === 0) {
                tooltip = document.createElement('div');
                tooltip.className = 'vivagraph__tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.zIndex = 10;
                tooltip.style.display = 'none';
                container.appendChild(tooltip);
            } else {
                tooltip = tooltip[0];
            }
        }

        /**
         * @name setGraphics
         * @desc toggles the graphics
         * @TODO render the labels using WebGL
         * @return {void}
         */
        function setGraphics() {
            setLabelGraphics();

            // render options
            graphics = Viva.Graph.View.webglGraphics();

            // use custom shader
            graphics.setNodeProgram(buildCircleNodeShader());
            graphics.node(function (node) {
                return {
                    size: scope.vivaGraph.vivaGraphOptions.defaultNodeSize,
                    color: rgbToHex(node.data.color),
                    border: scope.vivaGraph.vivaGraphOptions.defaultNodeBorder,
                };
            });

            graphics.link(function () {
                return {
                    color: linkColor,
                };
            });
        }

        /**
         * @name setGraphLayout
         * @desc sets the graph layout
         * @return {void}
         */
        function setGraphLayout() {
            var toggleLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.toggleLayout'
                ),
                selectedLayout = 'force',
                frameType = scope.widgetCtrl.getFrame('type'),
                size =
                    scope.chartDiv.width <= scope.chartDiv.height
                        ? scope.chartDiv.width / 2.5
                        : scope.chartDiv.height / 2.5;

            if (frameType !== 'GRAPH' && toggleLayout) {
                selectedLayout = toggleLayout;
            }

            if (selectedLayout === 'circular') {
                createRadialGraph(size);
            } else if (selectedLayout === 'force') {
                layout = Viva.Graph.Layout.forceDirected(
                    graph,
                    scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions
                );
            } else if (
                scope.vivaGraph.vivaGraphOptions.selectedLayout ===
                'forceAtlas2'
            ) {
                layout = Viva.Graph.Layout.forceAtlas2(
                    graph,
                    scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions
                );
            }

            // if layout has functions to pin and set, do it
            if (toggleLayout && frameType === 'GRAPH') {
                graph.forEachNode(function (node) {
                    // normalized xMin/xMax = -1, xMax/yMax 1
                    var x,
                        y,
                        convertedX,
                        convertedY,
                        ratioX,
                        ratioY,
                        max = 50;

                    if (node.data && node.data.propHash) {
                        if (
                            (node.data.propHash.X ||
                                node.data.propHash.X === 0) &&
                            (node.data.propHash.Y || node.data.propHash.Y === 0)
                        ) {
                            x = node.data.propHash.X;
                            y = node.data.propHash.Y;

                            ratioX = x / max;
                            ratioY = y / max;

                            convertedX = size * ratioX;
                            convertedY = size * ratioY;

                            layout.setNodePosition(
                                node.id,
                                convertedX,
                                convertedY
                            );
                            layout.pinNode(node, true);
                        }
                    }
                });
            }
        }

        /**
         * @name createRadialGraph
         * @param {number} size - smaller dimension of the panel
         * @desc creates an array of positions to place nodes in a circle
         * @return {void}
         */
        function createRadialGraph(size) {
            var circlePositions,
                positionCounter = 0;
            layout = Viva.Graph.Layout.constant(graph);
            circlePositions = generateCircularPositions(size);
            graph.forEachNode(function (node) {
                layout.setNodePosition(
                    node.id,
                    circlePositions[positionCounter].x,
                    circlePositions[positionCounter].y
                );
                layout.pinNode(node, true);
                positionCounter++;
            });
        }

        /**
         * @name generateCircularPositions
         * @param {number} radius size of the circle's radius
         * @return {{x: number, y:number}[]} array of positions objects
         */
        function generateCircularPositions(radius) {
            var nodePositions = [],
                n,
                i,
                pos;
            n = graph.getNodesCount();
            for (i = 0; i < n; i++) {
                pos = {
                    x: radius * Math.cos((i * 2 * Math.PI) / n),
                    y: radius * Math.sin((i * 2 * Math.PI) / n),
                };
                nodePositions.push(pos);
            }
            return nodePositions;
        }

        /**
         * @name setGraphEvents
         * @desc set events on the graph
         * @param {object} setEventGraphics event graphics to set
         * @param {object} setGraph event graph to set
         * @return {void}
         */
        function setGraphEvents(setEventGraphics, setGraph) {
            var i;
            events = Viva.Graph.webglInputEvents(setEventGraphics, setGraph);

            events.dblClick(function (node) {
                scope.selectNode(node.data);
                highlightSelectedNodes([node]);
                // legend highlight clear
                d3.select('.chart-container.legend')
                    .selectAll('circle')
                    .attr('stroke-width', function () {
                        return 0;
                    })
                    .attr('stroke', function () {
                        return node.VERTEX_TYPE_PROPERTY;
                    });
            });

            if (!scope.vivaGraph.vivaGraphOptions.labelToggle) {
                events.mouseEnter(function (node) {
                    var tooltipContent =
                        $filter('replaceUnderscores')(
                            node.data.VERTEX_TOOLTIP
                        ) +
                        ': ' +
                        $filter('replaceUnderscores')(
                            node.data.VERTEX_LABEL_PROPERTY
                        ) +
                        '\n';
                    // Loop through prophash and add properties to tooltip
                    for (i in node.data.propHash) {
                        if (
                            i !== 'URI' &&
                            i !== 'VERTEX_COLOR_PROPERTY' &&
                            i !== 'VERTEX_LABEL_PROPERTY' &&
                            i !== 'Outputs' &&
                            i !== 'VERTEX_TYPE_PROPERTY' &&
                            i !== 'X' &&
                            i !== 'Y' &&
                            i !== 'Z'
                        ) {
                            tooltipContent +=
                                i + ' : ' + node.data.propHash[i] + '\n';
                        }
                    }
                    tooltip.innerText = tooltipContent;
                    tooltip.style.display = 'block';
                    tooltip.style.left = event.offsetX + 'px';
                    tooltip.style.top = event.offsetY - 9 + 'px';
                    tooltip.style.pointer = 'cursor';
                });

                events.mouseLeave(function () {
                    tooltip.style.display = 'none';
                });
            }
        }

        /**
         * @name startMultiSelect
         * @param {object} multiRenderer webGL
         * @desc initialize the multi select mode
         * @return {object} overlay WebGl Object
         */
        function startMultiSelect() {
            var domOverlay, elClone, overlay;
            domOverlay = document.querySelector('#chart-container-graph-brush');
            // clone the dom element and replace it to wipe all of the event listeners that keep stacking because viva graph does not track / could not find info about the listener store
            elClone = domOverlay.cloneNode(true);
            domOverlay.parentNode.replaceChild(elClone, domOverlay);

            overlay = createOverlay(elClone);
            overlay.onAreaSelected(handleAreaSelected);
            overlay.onDragStop(filterGraphNodes);

            return overlay;

            function handleAreaSelected(area) {
                // For the sake of this demo we are using silly O(n) implementation.
                // Could be improved with spatial indexing if required.
                var topLeft = graphics.transformClientToGraphCoordinates({
                        x: area.x,
                        y: area.y,
                    }),
                    nodeConcept,
                    bottomRight = graphics.transformClientToGraphCoordinates({
                        x: area.x + area.width,
                        y: area.y + area.height,
                    });

                scope.filteredConcepts = {};
                graph.forEachNode(highlightIfInside);
                renderer.rerender();

                return;

                function highlightIfInside(node) {
                    var nodeUI = graphics.getNodeUI(node.id);
                    if (nodeUI) {
                        nodeUI.color = rgbToHex(node.data.color);
                        if (isInside(node.id, topLeft, bottomRight)) {
                            nodeUI.size = 20;
                            nodeConcept = node.data.VERTEX_TYPE_PROPERTY;
                            if (!scope.filteredConcepts[nodeConcept]) {
                                scope.filteredConcepts[nodeConcept] = [];
                            }
                            if (
                                scope.filteredConcepts[nodeConcept].indexOf(
                                    node.data.VERTEX_LABEL_PROPERTY
                                ) === -1
                            ) {
                                scope.filteredConcepts[nodeConcept].push(
                                    node.data.VERTEX_LABEL_PROPERTY
                                );
                            }
                        } else {
                            nodeUI.size =
                                scope.vivaGraph.vivaGraphOptions.defaultNodeSize;
                        }
                    }
                }
            }

            function filterGraphNodes() {
                scope.widgetCtrl.execute(
                    buildFilterComponents(scope.filteredConcepts)
                );
            }

            function isInside(nodeId, topLeft, bottomRight) {
                var nodePos = layout.getNodePosition(nodeId);
                return (
                    topLeft.x < nodePos.x &&
                    nodePos.x < bottomRight.x &&
                    topLeft.y < nodePos.y &&
                    nodePos.y < bottomRight.y
                );
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
                                    components: [
                                        scope.widgetCtrl.getFrame('name'),
                                    ],
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
        }

        /**
         * @name createOverlay
         * @desc initialize the multi select mode
         * @param {dom} overlayDom - dom to overlay
         * @return {object} overlay functions
         */
        function createOverlay(overlayDom) {
            var selectionClassName = 'vivagraph__selection',
                selectionIndicator = overlayDom.querySelector(
                    '.' + selectionClassName
                ),
                dragstop = [],
                notify = [],
                dragndrop = Viva.Graph.Utils.dragndrop(overlayDom),
                selectedArea = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                },
                startX = 0,
                startY = 0;
            if (!selectionIndicator) {
                selectionIndicator = document.createElement('div');
                selectionIndicator.className = selectionClassName;
                overlayDom.appendChild(selectionIndicator);
            }

            // clear filtered labels
            scope.filteredConcepts = {};

            dragndrop.onStart(function (e) {
                startX = selectedArea.x = e.clientX;
                startY = selectedArea.y = e.clientY;
                selectedArea.width = selectedArea.height = 0;

                updateSelectedAreaIndicator();
                selectionIndicator.style.display = 'block';
            });

            dragndrop.onDrag(function (e) {
                recalculateSelectedArea(e);
                updateSelectedAreaIndicator();
                notifyAreaSelected();
            });

            dragndrop.onStop(function () {
                selectionIndicator.style.display = 'none';
                fireOnDragStop();
            });

            overlayDom.style.display = 'block';

            return {
                onDragStop: function (cb) {
                    dragstop.push(cb);
                },
                onAreaSelected: function (cb) {
                    notify.push(cb);
                },
                destroy: function () {
                    overlayDom.style.display = 'none';
                    dragndrop.release();
                },
            };

            function notifyAreaSelected() {
                notify.forEach(function (cb) {
                    cb(selectedArea);
                });
            }

            function fireOnDragStop() {
                dragstop.forEach(function (cb) {
                    cb(selectedArea);
                });
            }

            function recalculateSelectedArea(e) {
                selectedArea.width = Math.abs(e.clientX - startX);
                selectedArea.height = Math.abs(e.clientY - startY);
                selectedArea.x = Math.min(e.clientX, startX);
                selectedArea.y = Math.min(e.clientY, startY);
            }

            function updateSelectedAreaIndicator() {
                selectionIndicator.style.left = selectedArea.x + 'px';
                selectionIndicator.style.top = selectedArea.y + 'px';
                selectionIndicator.style.width = selectedArea.width + 'px';
                selectionIndicator.style.height = selectedArea.height + 'px';
            }
        }

        /**
         * @name renderGraph
         * @param {object} thisRenderGraph the graph
         * @param {domnode} renderContainer - where to put the graph
         * @param {WebGLData} renderGraphics - graphics for the graph
         * @param {string} renderLayout - layout type
         * @desc render the graph
         * @return {void}
         */
        function renderGraph(
            thisRenderGraph,
            renderContainer,
            renderGraphics,
            renderLayout
        ) {
            renderer = Viva.Graph.View.renderer(thisRenderGraph, {
                container: renderContainer,
                graphics: renderGraphics,
                layout: renderLayout,
                renderLinks: true,
            });
            renderer.run();
        }

        /**
         * @name buildCircleNodeShader
         * @desc constructs nodes in webGL. this is using a custom node shader on top of vivagraph.js
         * @return {object} circle node shader functions
         */
        function buildCircleNodeShader() {
            // For each primitive we need 5 attributes: x, y, color, size, and border.
            // border variable needs to match between the two shader programs
            var ATTRIBUTES_PER_PRIMITIVE = 5,
                nodeVertexShader = [
                    'attribute vec2 a_vertexPos;',
                    'attribute vec4 a_customAttributes;',
                    'uniform vec2 u_screenSize;',
                    'uniform mat4 u_transform;',
                    'varying vec4 color;',
                    'varying float border;',

                    'void main() {',
                    '   gl_Position = u_transform * vec4(a_vertexPos/u_screenSize, 0, 1);',
                    '   gl_PointSize = a_customAttributes[1] * u_transform[0][0];',
                    '   float c = a_customAttributes[0];',
                    '   color.b = mod(c, 256.0); c = floor(c/256.0);',
                    '   color.g = mod(c, 256.0); c = floor(c/256.0);',
                    '   color.r = mod(c, 256.0); c = floor(c/256.0); color /= 255.0;',
                    '   color.a = 1.0;',
                    '   border = float(a_customAttributes[2]);',
                    '}',
                ].join('\n'),
                nodeFragmentShader = [
                    '#extension GL_OES_standard_derivatives : enable', // import this* (see load function)
                    'precision mediump float;',
                    'varying vec4 color;',
                    'varying float border;',

                    'void main() {',
                    '   vec4 outlineColor = vec4(0.0, 0.0, 0.0, 1.0);',
                    '   vec4 noOutlineColor = vec4(0.0, 0.0, 0.0, 0.0);',
                    '   float eq = (gl_PointCoord.x - 0.5) * (gl_PointCoord.x - 0.5) + (gl_PointCoord.y - 0.5) * (gl_PointCoord.y - 0.5);',
                    '   float distance = sqrt(eq);',
                    '   float delta = fwidth(distance);',
                    '   float alpha = 1.0 - smoothstep(0.45 - delta, 0.45, distance);',
                    '   float outerEdgeCenter = 0.5 - border;',
                    '   float stroke = 1.0 - smoothstep(outerEdgeCenter - delta, outerEdgeCenter + delta, distance);',
                    '   if (eq < 0.25) {',
                    '      if (true) {',
                    '         gl_FragColor = vec4( mix(outlineColor.rgb, color.rgb, stroke), alpha );',
                    '      } else {',
                    // '         gl_FragColor = vec4( mix(noOutlineColor.rgba, color.rgba, stroke) );',
                    '         gl_FragColor = color;',
                    '      }',
                    '   } else {',
                    '      gl_FragColor = vec4(0);',
                    '   }',
                    '}',
                ].join('\n'),
                program,
                gl,
                buffer,
                locations,
                webglUtils,
                nodes = new Float32Array(64),
                nodesCount = 0,
                transform,
                isCanvasDirty,
                canvasWidth,
                canvasHeight;

            return {
                // Called by webgl renderer to load the shader into gl context.
                load: function (glContext) {
                    gl = glContext;
                    webglUtils = Viva.Graph.webgl(gl);

                    gl.getExtension('OES_standard_derivatives'); //* need to get the extension

                    program = webglUtils.createProgram(
                        nodeVertexShader,
                        nodeFragmentShader
                    );
                    gl.useProgram(program);
                    locations = webglUtils.getLocations(program, [
                        'a_vertexPos',
                        'a_customAttributes',
                        'u_screenSize',
                        'u_transform',
                    ]);

                    gl.enableVertexAttribArray(locations.vertexPos);
                    gl.enableVertexAttribArray(locations.customAttributes);

                    buffer = gl.createBuffer();
                },

                // Called by webgl renderer when user resizes the canvas with nodes.
                updateSize: function (newCanvasWidth, newCanvasHeight) {
                    canvasWidth = newCanvasWidth;
                    canvasHeight = newCanvasHeight;
                    isCanvasDirty = true;
                },

                // Called by webgl renderer when user scales/pans the canvas with nodes.
                updateTransform: function (newTransform) {
                    transform = newTransform;
                    isCanvasDirty = true;
                },

                // Called by webgl renderer to notify us that the new node was created in the graph
                createNode: function () {
                    nodes = webglUtils.extendArray(
                        nodes,
                        nodesCount,
                        ATTRIBUTES_PER_PRIMITIVE
                    );
                    nodesCount += 1;
                },

                // Called by webgl renderer to notify us that the node was removed from the graph
                removeNode: function (node) {
                    if (nodesCount > 0) {
                        nodesCount -= 1;
                    }
                    if (node.id < nodesCount && nodesCount > 0) {
                        // we do not really delete anything from the buffer.
                        // Instead we swap deleted node with the 'last' node in the
                        // buffer and decrease marker of the 'last' node. Gives nice O(1)
                        // performance, but make code slightly harder than it could be:
                        webglUtils.copyArrayPart(
                            nodes,
                            node.id * ATTRIBUTES_PER_PRIMITIVE,
                            nodesCount * ATTRIBUTES_PER_PRIMITIVE,
                            ATTRIBUTES_PER_PRIMITIVE
                        );
                    }
                },

                // This method is called by webgl renderer when it changes parts of its
                // buffers. We don't use it here, but it's needed by API (see the comment
                // in the removeNode() method)
                replaceProperties: function () {},

                /**
                 * @name position
                 * @param {object} nodeUI - data model for the rendered node (WebGLCircle in this case)
                 * @param {array} pos - {x, y} coordinates of the node.
                 * @desc Called by webgl renderer to update node position in the buffer array
                 * @return {void}
                 */
                position: function (nodeUI, pos) {
                    var idx = nodeUI.id;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE] = pos.x;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 1] = -pos.y;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 2] = nodeUI.color;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 3] = nodeUI.size;
                    nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 4] = nodeUI.border;
                },

                // Request from webgl renderer to actually draw our stuff into the
                // gl context. This is the core of our shader.
                render: function () {
                    gl.useProgram(program);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, nodes, gl.DYNAMIC_DRAW);

                    if (isCanvasDirty) {
                        isCanvasDirty = false;
                        gl.uniformMatrix4fv(
                            locations.transform,
                            false,
                            transform
                        );
                        gl.uniform2f(
                            locations.screenSize,
                            canvasWidth,
                            canvasHeight
                        );
                    }

                    gl.vertexAttribPointer(
                        locations.vertexPos,
                        3,
                        gl.FLOAT,
                        false,
                        ATTRIBUTES_PER_PRIMITIVE *
                            Float32Array.BYTES_PER_ELEMENT,
                        0
                    );
                    gl.vertexAttribPointer(
                        locations.customAttributes,
                        3,
                        gl.FLOAT,
                        false,
                        ATTRIBUTES_PER_PRIMITIVE *
                            Float32Array.BYTES_PER_ELEMENT,
                        2 * 4
                    );

                    gl.drawArrays(gl.POINTS, 0, nodesCount);
                },
            };
        }

        /**
         * @name createLegend
         * @desc creates the legend
         * @return {void}
         */
        function createLegend() {
            var legendNodeSize = Object.keys(legendNodeCounts).length;

            if (svg) {
                svg.remove();
            }

            svgContainer = scope.chartDiv
                .select('#vivagraph__legend')
                .attr('height', '100%')
                .attr('width', '100%');

            svg = svgContainer
                .append('svg')
                .attr('class', 'editable-svg')
                .attr('height', legendNodeSize * 20 + 20);

            legendBox = svg.append('g').attr('height', 100).attr('width', 100);
        }

        /**
         * @name updateLegend
         * @desc updates the legend for new nodes
         * @return {void}
         */
        function updateLegend() {
            var legend,
                legendNodesUpdate,
                legendText,
                key,
                labelStyle = scope.widgetCtrl.getWidget(
                    'view.visualization.tools.shared.legend'
                ),
                fontColor = labelStyle.fontColor || '#000000',
                fontSize = labelStyle.fontSize || '12px',
                fontFamily = labelStyle.fontFamily || 'Inter',
                fontWeight = labelStyle.fontWeight || 400;

            // legend update...
            legendNodesUpdate = [];
            for (key in legendNodeCounts) {
                if (legendNodeCounts.hasOwnProperty(key)) {
                    legendNodesUpdate.push(legendNodeCounts[key]);
                }
            }

            legend = legendBox
                .selectAll('circle')
                .data(legendNodesUpdate, function (d) {
                    return d.name;
                })
                .enter()
                .append('circle')
                .attr('r', 0)
                .attr('r', 6)
                .attr('stroke-width', 1)
                .attr('stroke', function (d) {
                    return 'rgb(' + d.color + ')';
                })
                .style('fill', function (d) {
                    return 'rgb(' + d.color + ')';
                })
                .attr('transform', function (d, i) {
                    return 'translate(15,' + (i * 20 + 20) + ')';
                });

            // legendText update...
            legendText = legendBox
                .selectAll('text')
                .data(legendNodesUpdate, function (d) {
                    return d.name;
                })
                .enter()
                .append('text')
                .text(function (d) {
                    var name = d.name,
                        count = d.count + '';
                    // shorten the name
                    if (typeof name === 'string') {
                        if (name.length + count.length > 16) {
                            if (13 - count.length > 0) {
                                name =
                                    name.substring(0, 13 - count.length) +
                                    '...';
                            }
                        }
                        return (
                            $filter('replaceUnderscores')(name) +
                            ' (' +
                            count +
                            ')'
                        );
                    }

                    return name;
                })
                .style('fill', fontColor)
                .style('font-size', fontSize)
                .style('font-family', fontFamily)
                .style('font-weight', fontWeight)
                .attr('x', 12)
                .attr('transform', function (d, i) {
                    return 'translate(15,' + (i * 20 + 25) + ')';
                });

            // legendText exit...
            legendText.exit().remove();

            // legend exit...
            legend.exit().remove();

            // need to combine this selectALL and the bottom selectAll into one group
            legendText.style('cursor', 'pointer').on('click', function (d) {
                legendClick(d);
            });

            legend.style('cursor', 'pointer').on('click', function (d) {
                legendClick(d);
            });
        }

        /**
         * @name legendClick
         * @param {Object} legendItem item of the legend
         * @desc when legend item is selected, it will highlight corresponding graph elements
         * @return {void}
         */
        function legendClick(legendItem) {
            var type = legendItem.name,
                selected = [],
                selectedHolder = {},
                i,
                len;
            selectedNodes = [];

            // fill the selected legend node
            d3.select('.chart-container.legend')
                .selectAll('circle')
                .attr('stroke-width', function (node) {
                    if (node.name === type) {
                        return 1.5;
                    }

                    return 0;
                })
                .attr('stroke', function (node) {
                    if (node.name === type) {
                        return 'black';
                    }
                    return node.name;
                });

            graph.forEachNode(function (node) {
                if (node.data.VERTEX_TYPE_PROPERTY === type) {
                    selectedNodes.push(node);
                    // highlight node to skip highlight selectedNodes Call
                    highlightNode(node);
                } else {
                    unHighlightNode(node);
                }
            });

            // loop through selectedNode and push into items
            for (i = 0, len = selectedNodes.length; i < len; i++) {
                if (
                    !selectedHolder[selectedNodes[i].data.VERTEX_TYPE_PROPERTY]
                ) {
                    selectedHolder[selectedNodes[i].data.VERTEX_TYPE_PROPERTY] =
                        {
                            alias: selectedNodes[i].data.VERTEX_TYPE_PROPERTY,
                            instances: [],
                        };
                }

                selectedHolder[
                    selectedNodes[i].data.VERTEX_TYPE_PROPERTY
                ].instances.push(selectedNodes[i].data.VERTEX_LABEL_PROPERTY);
            }

            for (i in selectedHolder) {
                if (selectedHolder.hasOwnProperty(i)) {
                    selected.push(selectedHolder[i]);
                }
            }

            // render highlighted nodes
            renderer.rerender();

            dataPointSelected(selected, true);
        }

        /**
         * @name dataPointSelected
         * @param {array} selectedData data selected
         * @desc retrieves the related insights to the selectedData
         * @param {bool} conceptSelected true if a concept (legend dimension) was selected; false if an individual node was selected
         * @return {void}
         */
        function dataPointSelected(selectedData, conceptSelected) {
            if (selectedData.length === 0) {
                console.log('no selected data.. why was this called');
                return;
            }

            $timeout(function () {
                scope.widgetCtrl.open('handle', 'traverse');
            });

            scope.widgetCtrl.emit('change-selected', {
                selected: selectedData,
                concept: conceptSelected,
            });
        }

        /** Utility**/

        /**
         * @name rgbToHex
         * @param {string} rgb - the rbg value to convert
         * @desc converts rgb value to hex.
         * @return {string} hexidecimal value string
         */
        function rgbToHex(rgb) {
            var newRgb = rgb.match(/(\d+),\s*(\d+),\s*(\d+)$/);

            function hex(x) {
                return ('0' + parseInt(x, 10).toString(16)).slice(-2);
            }

            return '0x' + hex(newRgb[1]) + hex(newRgb[2]) + hex(newRgb[3]);
        }

        /**
         * @name getNodeColor
         * @param {Object} nodeData - data for node
         * @desc returns node color
         * @return {string} color
         */
        function getNodeColor(nodeData) {
            var color = '20,20,20',
                colorArray,
                colorLength,
                colorGroup,
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                colorValue;

            if (colorBy) {
                colorValue = getColorValue(colorBy, nodeData);
                if (colorValue) {
                    return colorValue;
                }
            }

            if (nodeData.VERTEX_COLOR_PROPERTY) {
                color = nodeData.VERTEX_COLOR_PROPERTY;
            }

            if (
                scope.vivaGraph.vivaGraphOptions.selectedColorGroup &&
                nodeData[scope.vivaGraph.vivaGraphOptions.selectedColorGroup]
            ) {
                colorArray = [
                    '1,94,255',
                    '12,196,2',
                    '252,10,24',
                    '174,167,165',
                    '255,21,174',
                    '217,159,7',
                    '17,165,254',
                    '3,126,67',
                    '186,68,85',
                    '209,10,255',
                    '147,84,166',
                    '123,109,43',
                    '8,187,187',
                    '149,180,45',
                    '181,78,4',
                    '238,116,255',
                    '45,117,147',
                    '225,151,114',
                    '250,127,190',
                    '254,3,91',
                    '174,160,219',
                    '144,94,118',
                    '146,178,122',
                    '3,194,98',
                    '135,138,255',
                    '74,118,98',
                    '255,103,87',
                    '254,133,4',
                    '147,64,225',
                    '42,134,2',
                    '7,182,229',
                    '210,17,112',
                    '82,106,179',
                    '255,8,226',
                    '187,46,167',
                    '228,145,159',
                    '9,191,145',
                    '144,98,76',
                    '187,169,74',
                    '162,108,5',
                    '92,118,5',
                    '223,137,231',
                    '176,72,124',
                    '238,147,69',
                    '112,180,88',
                    '177,155,113',
                    '107,109,116',
                    '236,82,6',
                    '133,167,199',
                    '255,103,140',
                    '181,91,62',
                    '128,84,204',
                    '126,176,160',
                    '196,128,179',
                    '217,16,45',
                    '90,120,63',
                    '254,102,210',
                    '188,19,200',
                    '98,189,51',
                    '184,171,3',
                    '143,49,255',
                    '253,133,129',
                    '4,146,121',
                    '116,115,156',
                    '14,106,214',
                    '116,113,81',
                    '1,135,141',
                    '3,128,191',
                    '191,129,253',
                    '139,161,251',
                    '136,122,2',
                    '192,155,181',
                    '169,119,65',
                    '208,64,150',
                    '193,144,131',
                    '165,131,218',
                    '140,161,73',
                    '177,99,104',
                    '194,62,55',
                    '253,123,64',
                    '209,33,83',
                    '178,76,210',
                    '86,166,111',
                    '93,175,189',
                    '120,172,235',
                    '35,117,254',
                    '212,159,84',
                    '234,65,211',
                    '136,94,146',
                    '132,104,253',
                    '207,78,255',
                    '201,55,22',
                    '197,99,175',
                    '214,104,134',
                    '102,77,253',
                    '70,133,48',
                    '109,96,190',
                    '250,138,100',
                    '5,152,67',
                    '255,85,161',
                    '99,139,142',
                    '189,109,46',
                    '255,15,122',
                    '63,147,255',
                    '255,81,103',
                    '143,154,127',
                    '214,130,1',
                    '139,144,84',
                    '254,73,53',
                    '157,126,133',
                    '1,165,43',
                    '89,185,155',
                    '186,92,196',
                    '75,190,115',
                    '103,153,37',
                    '185,144,35',
                    '64,129,88',
                    '250,86,254',
                    '214,96,59',
                    '131,144,4',
                    '209,120,106',
                    '203,65,112',
                    '137,122,187',
                    '142,140,161',
                    '65,151,194',
                    '168,142,73',
                    '21,127,213',
                    '186,107,255',
                    '210,4,152',
                    '218,109,16',
                    '127,185,5',
                    '189,114,141',
                    '252,12,254',
                    '245,21,144',
                    '227,92,96',
                    '126,104,94',
                    '92,101,220',
                    '104,134,195',
                    '143,174,181',
                    '17,179,249',
                    '202,149,219',
                    '171,29,231',
                    '108,154,84',
                    '234,139,180',
                    '161,125,165',
                    '104,125,220',
                    '255,15,55',
                    '110,155,119',
                    '215,28,2',
                    '147,120,78',
                    '157,139,123',
                    '252,8,198',
                    '233,116,228',
                    '68,162,152',
                    '159,82,141',
                    '159,105,207',
                    '242,124,210',
                    '14,195,57',
                    '111,122,45',
                    '170,114,183',
                    '3,147,173',
                    '67,112,159',
                    '172,78,105',
                    '112,125,113',
                    '219,93,149',
                    '85,187,79',
                    '174,172,98',
                    '168,175,62',
                    '222,155,56',
                    '183,123,93',
                    '252,66,119',
                    '254,130,153',
                    '176,64,155',
                    '135,105,16',
                    '213,15,229',
                    '245,71,174',
                    '169,164,201',
                    '151,101,101',
                    '4,159,103',
                    '229,138,205',
                    '206,160,109',
                    '96,119,143',
                    '122,103,126',
                    '214,47,68',
                    '163,88,74',
                    '211,104,111',
                    '254,65,3',
                    '83,157,1',
                    '15,123,110',
                    '102,126,90',
                    '255,68,78',
                    '147,143,55',
                    '143,116,244',
                    '165,152,26',
                    '193,138,150',
                    '156,93,56',
                    '172,2,255',
                    '184,104,4',
                    '218,88,26',
                    '209,80,207',
                    '218,106,88',
                    '191,148,254',
                    '15,185,211',
                    '75,93,233',
                    '91,144,168',
                    '200,106,154',
                    '122,95,170',
                    '212,77,229',
                    '214,88,189',
                    '210,121,81',
                    '45,173,6',
                    '140,182,74',
                    '196,13,179',
                    '154,96,30',
                    '251,115,29',
                    '226,148,139',
                    '71,157,83',
                    '168,172,126',
                    '223,119,58',
                    '68,123,2',
                    '162,87,126',
                    '75,131,253',
                    '242,61,190',
                    '243,100,183',
                    '216,140,79',
                    '108,113,61',
                    '109,139,180',
                    '71,155,54',
                    '173,129,50',
                    '94,151,231',
                    '197,154,201',
                    '151,76,187',
                    '182,74,68',
                    '248,141,46',
                    '148,82,221',
                    '224,67,57',
                    '222,78,106',
                    '54,118,128',
                    '167,72,255',
                    '245,96,58',
                    '203,108,231',
                    '174,157,237',
                    '208,10,131',
                    '15,127,34',
                    '175,82,34',
                    '136,143,145',
                    '98,178,213',
                    '164,177,5',
                    '253,118,165',
                    '121,184,112',
                    '9,189,169',
                    '236,71,130',
                    '104,146,129',
                    '159,151,252',
                    '252,105,235',
                    '192,157,159',
                    '121,182,54',
                    '215,149,180',
                    '122,182,137',
                    '195,50,121',
                    '60,122,58',
                    '191,130,4',
                    '179,167,143',
                    '201,165,30',
                    '168,52,208',
                    '242,2,67',
                    '187,111,198',
                    '197,130,47',
                    '221,15,206',
                    '154,173,161',
                    '2,136,94',
                    '141,157,227',
                    '102,137,49',
                    '16,163,174',
                    '223,8,99',
                    '141,90,255',
                    '142,138,98',
                    '119,148,95',
                    '140,140,190',
                    '164,127,102',
                    '147,176,141',
                    '241,142,118',
                    '143,121,225',
                    '182,118,108',
                    '34,166,126',
                    '203,160,129',
                    '93,85,242',
                    '103,104,161',
                    '72,142,118',
                    '254,124,107',
                    '164,168,185',
                    '111,113,8',
                    '184,72,144',
                    '115,133,210',
                    '170,133,192',
                    '92,191,7',
                    '47,154,225',
                    '150,167,219',
                    '147,179,103',
                    '168,100,224',
                    '234,135,138',
                    '171,61,180',
                    '165,140,47',
                    '255,111,127',
                    '190,166,105',
                    '195,120,225',
                    '94,177,229',
                    '220,2,177',
                    '125,139,36',
                    '114,158,2',
                    '251,118,81',
                    '54,111,176',
                    '197,57,72',
                    '137,103,49',
                    '228,11,31',
                    '132,101,109',
                    '130,118,202',
                    '167,121,145',
                    '43,108,198',
                    '130,105,77',
                    '189,70,30',
                    '225,9,75',
                    '64,130,125',
                    '166,108,151',
                    '224,91,76',
                    '72,148,159',
                    '243,145,3',
                    '180,46,189',
                    '88,114,115',
                    '154,119,5',
                    '202,146,236',
                    '48,193,77',
                    '174,79,84',
                    '107,121,254',
                    '209,118,132',
                    '109,165,165',
                    '193,43,151',
                    '158,88,107',
                    '91,149,204',
                    '84,162,125',
                    '73,167,44',
                    '120,149,255',
                    '80,188,132',
                    '14,147,40',
                    '179,136,94',
                    '133,160,44',
                    '125,100,139',
                    '29,124,170',
                    '136,124,122',
                    '123,145,74',
                    '254,57,141',
                    '220,104,172',
                    '126,151,166',
                    '57,180,90',
                    '113,85,221',
                    '169,87,12',
                    '182,80,240',
                    '215,112,206',
                    '117,163,71',
                    '201,139,89',
                    '89,183,182',
                    '187,76,51',
                    '187,43,224',
                    '238,82,85',
                    '225,59,142',
                    '229,69,29',
                    '82,143,86',
                    '245,49,243',
                    '215,125,36',
                    '168,150,162',
                    '23,123,95',
                    '205,38,99',
                    '167,82,160',
                    '192,77,107',
                    '147,105,191',
                    '180,109,62',
                    '105,137,4',
                    '144,128,71',
                    '219,69,188',
                    '204,99,241',
                    '230,104,126',
                    '198,120,190',
                    '253,65,231',
                    '236,131,159',
                    '131,64,248',
                    '174,112,123',
                    '202,131,133',
                    '83,103,206',
                    '143,123,42',
                    '156,121,112',
                    '31,150,2',
                    '9,160,218',
                    '166,132,249',
                    '228,116,161',
                    '255,105,46',
                    '196,158,68',
                    '3,189,126',
                    '238,141,85',
                    '225,133,247',
                    '27,103,224',
                    '79,120,45',
                    '227,93,135',
                ];
                colorLength = colorArray.length;
                colorGroup =
                    nodeData[
                        scope.vivaGraph.vivaGraphOptions.selectedColorGroup
                    ] % colorLength;

                color = colorArray[colorGroup];
            }
            return color;
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

            if (returnColor) {
                returnColor = hexToString(returnColor);
            }

            return returnColor;
        }

        /**
         * @name hexToString
         * @param {string} hex hexidecimal color string
         * @desc turns hexidecimal color string to a rgb color string ('x, y, z')
         *       returns false in case a bad string is given so then we just use
         *       the original node color
         * @return {string | boolean} the rgb color string, false if bad data
         */
        function hexToString(hex) {
            var hexValues = hex.substr(1), // remove #
                decValues = [],
                i,
                subHex,
                sliceVal;
            hexValues.length === 3 ? (sliceVal = 1) : (sliceVal = 2);
            if (hexValues.length === 3 || hexValues.length === 6) {
                for (i = 0; i < 3; i++) {
                    subHex = parseInt(hexValues.substr(0, sliceVal), 16);
                    decValues.push(subHex);
                    hexValues = hexValues.substr(sliceVal);
                }

                return decValues.join(', ');
            }

            return false;
        }

        /**
         * @name highlightSelectedNodes
         * @param {Array} nodeData - array of nodes to select
         * @desc paints selected nodes from array with a black border
         * @TODO - move this to highlightSelectedItem
         * @return {void}
         */
        function highlightSelectedNodes(nodeData) {
            // need to clear old highlighting
            graph.forEachNode(function (node) {
                unHighlightNode(node);
            });

            for (var i = 0; i < nodeData.length; i++) {
                highlightNode(nodeData[i]);
            }
            renderer.rerender();
        }

        function unHighlightNode(node) {
            var nodeUI = graphics.getNodeUI(node.id);
            nodeUI.border = scope.vivaGraph.vivaGraphOptions.defaultNodeBorder;
        }

        function highlightNode(node) {
            var nodeUI = graphics.getNodeUI(node.id);
            // uncommenting will let the color and size change when a node is double clicked.
            /* nodeUI.color = 0xFFA500ff;
                nodeUI.size = 20;*/
            nodeUI.border = 0.2;
        }

        /* Tool Functions*/
        /**
         * @name selectNode
         * @param {Object} nodeData data for the node
         * @desc getsRelatedInstances to Node
         * @return {void}
         */
        scope.selectNode = function (nodeData) {
            dataPointSelected([
                {
                    alias: nodeData.VERTEX_TYPE_PROPERTY,
                    instances: [nodeData.VERTEX_LABEL_PROPERTY],
                },
            ]);
        };

        /**
         * @name searchGraph
         * @param {String} searchTerm - the search term
         * @desc searches for a given term to see if the node exists on the graph
         * @todo  - determine the 'best match' and center the graph around that node
         * renderer.zoomIn();
         * renderer.zoomOut();
         * @return {void}
         */
        scope.searchGraph = function (searchTerm) {
            // clear the search highlighting but only make one call to renderer.rerender
            var foundNodes = [],
                exactMatch = [],
                isExactMatch = false;
            graph.forEachNode(function (node) {
                var nodeUI = graphics.getNodeUI(node.id),
                    nodeString,
                    isMatch;
                nodeUI.color = rgbToHex(node.data.color);

                nodeString = $filter('replaceUnderscores')(
                    node.data.VERTEX_LABEL_PROPERTY
                );
                isMatch = false;
                // var regExp = new RegExp(searchTerm);

                if (nodeString.indexOf(searchTerm) > -1) {
                    isMatch = true;
                }
                if (
                    nodeString.toLowerCase().indexOf(searchTerm.toLowerCase()) >
                    -1
                ) {
                    isMatch = true;
                }

                if (nodeString === searchTerm) {
                    isExactMatch = true;
                }
                if (nodeString.toLowerCase() === searchTerm.toLowerCase()) {
                    isExactMatch = true;
                }

                if (isMatch) {
                    foundNodes.push(node);
                }
                if (isExactMatch) {
                    exactMatch.push(node);
                }
            });
            if (isExactMatch) {
                scope.centerOnNode(exactMatch[0]);
            } else if (foundNodes[0]) {
                scope.centerOnNode(foundNodes[0]);
            }

            renderer.rerender();
        };

        /**
         * @name centerOnNode
         * @param {Object} node the selected node on which to center the graph
         * @desc given a node, centers the graph around that nodes position
         * @todo improve the viva api to get/set the scaleFactor to zoom in on a node
         * @returns {void}
         */
        scope.centerOnNode = function (node) {
            var nodeId = node.id,
                pos;
            if (graph.getNode(nodeId)) {
                pos = layout.getNodePosition(nodeId);
                renderer.moveTo(pos.x, pos.y);
                // need to set the scale...
                // renderer.getGraphics().scale(2);
                centerHighlightNode(node);
            }
        };

        /**
         * @name centerHighlightNode
         * @param {Object} node node
         * @desc highlight a specific node on the graph
         * @return {void}
         */
        function centerHighlightNode(node) {
            graph.beginUpdate();
            var id = node.id,
                ui = graphics.getNodeUI(id);
            // need to preserve the opacity
            ui.color = rgbToHex('255,255,0');
            graph.endUpdate();
        }

        /**
         * @name clearSearchHighlighting
         * @desc clears all search highlighting
         * @return {void}
         */
        scope.clearSearchHighlighting = function () {
            // need to clear old highlighting
            graph.forEachNode(function (node) {
                var nodeUI = graphics.getNodeUI(node.id);
                nodeUI.color = rgbToHex(node.data.color);
            });
            renderer.rerender();
        };

        /**
         * @name resetScale
         * @desc resets the zooming / panning level for the entire graph
         * @return {void}
         */
        scope.resetScale = function () {
            renderer.reset();
            renderer.rerender();
        };

        /**
         * @name toggleLayout
         * @param {string} isPaused id of the node
         * @desc pause or resume the layout motion
         * @return {void}
         */
        scope.toggleLayout = function (isPaused) {
            var graphLockToggle = isPaused[0];
            scope.widgetCtrl.setState(
                'vivagraph-standard.graphLockToggle',
                graphLockToggle
            );
            graph.forEachNode(function (node) {
                layout.pinNode(node, isPaused[0]);
            });

            return false;
        };

        /**
         * @name toggleLegend
         * @param {string} isToggled id of the node
         * @desc hide/show the legend on the graph  graph.forEachNode(function (node) {
                    layout.pinNode(node, isPaused)
                });
            * @return {void}
            */
        scope.toggleLegend = function (isToggled) {
            scope.vivaGraph.vivaGraphOptions.legendToggle = isToggled;
        };

        /**
         * @name toggleLabels
         * @param {string} isToggled id of the node
         * @desc hide/show the labels for the nodes
         * @TODO fix issue with label updating
         * @return {void}
         */
        scope.toggleLabels = function (isToggled) {
            scope.vivaGraph.vivaGraphOptions.labelToggle = isToggled;
            drawGraph(addedNodes, addedEdges, graphMeta);
            // TODO update whats necessary..there is a bug here with the labels when zoom/layout changes
            /* setGraphics();
                setGraphEvents(graphics, graph);
                renderGraph(graph, container, graphics, layout);*/
        };

        /**
         * @name updateLayout
         * @param {string} toolValue value of the tool
         * @desc update layout and redraw graph
         * @return {void}
         */
        scope.updateLayout = function (toolValue) {
            scope.vivaGraph.vivaGraphOptions.selectedLayout = toolValue.layout;
            scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions =
                toolValue.options;
            drawGraph(addedNodes, addedEdges, graphMeta);
        };

        /**
         * @name updateLayoutOptions
         * @param {string} toolValue value of the tool
         * @desc update layout and redraw graph
         * @return {void}
         */
        scope.updateLayoutOptions = function (toolValue) {
            scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions =
                toolValue.options;
            if (toolValue.render) {
                drawGraph(addedNodes, addedEdges, graphMeta);
            } else if (layout.simulator) {
                for (var i in scope.vivaGraph.vivaGraphOptions
                    .selectedLayoutOptions) {
                    if (
                        scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions.hasOwnProperty(
                            i
                        )
                    ) {
                        layout.simulator[i] =
                            scope.vivaGraph.vivaGraphOptions.selectedLayoutOptions[
                                i
                            ];
                    }
                }
            }
        };

        /**
         * @name colorBy
         * @param {string} toolValue value of the tool
         * @desc update layout and redraw graph
         * @return {void}
         */
        scope.colorBy = function (toolValue) {
            scope.vivaGraph.vivaGraphOptions.selectedColorGroup = toolValue;

            // need to clear old highlighting
            graph.forEachNode(function (node) {
                var nodeUI = graphics.getNodeUI(node.id);
                node.data.color = getNodeColor(node.data);
                nodeUI.color = rgbToHex(node.data.color);
            });

            renderer.rerender();

            createLegend();
            updateLegend();
        };

        // when directive ends, make sure to clean out all $on watchers
        scope.$on('$destroy', function () {
            resizeListener();
            toolListener();
            brushModeListener();
            updateListener();
            updateTaskListener();
            addDataListener();
            scope.chartDiv.node().innerHTML = '';
        });

        initialize();
    }
}
