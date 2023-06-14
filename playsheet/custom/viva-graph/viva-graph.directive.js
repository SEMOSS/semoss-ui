(function () {
    "use strict";

    /**
     * @name vivaGraph
     * @desc Viva Graph directive for creating and visualizing viva graph
     */
    angular.module("app.viva-graph.directive", [])
        .directive("vivaGraph", vivaGraph);

    vivaGraph.$inject = ["$rootScope", "_", "$document", "$compile", "$filter", "vivaGraphService", "pkqlService", "dataService"];

    function vivaGraph($rootScope, _, $document, $compile, $filter, vivaGraphService, pkqlService, dataService) {

        vivaGraphLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        vivaGraphCtrl.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            link: vivaGraphLink,
            controller: vivaGraphCtrl,
            templateUrl: 'custom/viva-graph/viva-graph.directive.html'
        };

        function vivaGraphLink(scope, ele, attrs, ctrl) {
            var addedNodes, addedEdges;

            //declare/initialize scope variables
            scope.chartCtrl = ctrl[0];
            scope.chartCtrl.vivaGraph = {};

            //chartCtrl functions that are over written by viva graph
            scope.chartCtrl.toggleDefaultMode = toggleDefaultMode;
            scope.chartCtrl.toggleBrushMode = toggleBrushMode;
            scope.chartCtrl.initializeModes = initializeModes;
            scope.chartCtrl.dataProcessor = dataProcessor;
            scope.chartCtrl.toolUpdateProcessor = toolUpdateProcessor;
            scope.chartCtrl.highlightSelectedItem = highlightSelectedItem;
            scope.chartCtrl.resizeViz = resizeViz;

            //widget variables
            scope.chartCtrl.margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            };

            scope.chartCtrl.vivaGraph.vivaGraphOptions = {
                //chartData: {},
                currentLabels: {},
                defaultNodeSize: 12,
                defaultNodeBorder: 0,
                type: {
                    properties: []
                },
                engines: {
                    selected: {},
                    list: []
                },
                showPropertiesTable: false,
                selectedUri: [],
                typeLabels: [],
                //filteredData: {},
                //completeGraphData: {},
                graph: {
                    nodeResizeProperties: [],
                    edgeResizeProperties: []
                },
                node: {
                    properties: []
                },
                legendToggle: true,
                labelToggle: false,
                brushMode: false,
                selectedColorGroup: false,
                selectedLayout: 'forceDirected',
                selectedLayoutOptions: {
                    springLength: 80,
                    springCoeff: 0.0002,
                    gravity: -1.2,
                    theta: 0.8,
                    dragCoeff: 0.02,
                    timeStep: 20,
                    stableThreshold: .009
                }
            };

            //variables for d3 legend
            var width = 160,
                linkColor = 0xb3b3b3ff;

            var svgContainer, svg, legendBox;
            var legendNodes = [],
                newLegendNodes = [],
                legendNodeCounts = {},
                selectedNodes = [];

            var rScale = d3.scale.linear()
                .rangeRound([4, 20])
                .nice();

            //declare/initialize local variables
            var container, tooltip, graph, labels, graphics, layout, events, renderer, multiSelectOverlay;

            //inserting div which will bind to the visualization
            var html = "<div class=\"append-viz\" id=\"" + scope.chartCtrl.chartName + "-append-viz\">" +
                "<div class=\"absolute-size overflow-hidden\" id=\"" + scope.chartCtrl.chartName + "\">" +
                "<div id=\"" + scope.chartCtrl.chartName + "-viva-legend\" class=\"viva-legend-container\" ng-show=\"chartCtrl.vivaGraph.vivaGraphOptions.legendToggle\"></div>" +
                "</div>" +
                "<div style='display:none;cursor:crosshair;' class=\"absolute-size overflow-hidden\" id=\"" + scope.chartCtrl.chartName + "-graph-brush\"></div>" +
                "</div>";
            ele.append($compile(html)(scope));

            /**
             * @name toggleDefaultMode
             * @param {Boolean} [toggle] [toggles  mode on or off]
             * @desc toggles brush mode
             */
            function toggleDefaultMode(toggle) {
                if (toggle) {
                    //clear other modes
                    //brush
                    if (multiSelectOverlay != null) {
                        multiSelectOverlay.destroy();
                    }
                    multiSelectOverlay = null;
                    scope.chartCtrl.vivaGraph.vivaGraphOptions.brushMode = false;
                } else {

                }
            }

            /**
             * @name toggleBrushMode
             * @param {Boolean} [toggle] [toggles brush mode on or off]
             * @desc toggles brush mode
             */
            function toggleBrushMode(toggle) {
                if (toggle) {
                    console.log("toggle on");
                    multiSelectOverlay = startMultiSelect(graph, renderer, layout);
                } else {
                    if (multiSelectOverlay != null) {
                        multiSelectOverlay.destroy();
                    }
                    multiSelectOverlay = null;
                }
                scope.chartCtrl.vivaGraph.vivaGraphOptions.brushMode = toggle;
            }

            /**
             * @name initializeModes
             * @desc function that initializes and creates the chart toolbar
             * @todo refactor this out
             */
            function initializeModes(comments, lookandfeel) {
            }

            /**
             * @name dataProcessor
             * @param newData {Object} newly changed data
             * @desc function that is triggered when data is updated by the UI
             */
            function dataProcessor(newData) {
                addedNodes = newData.nodes;
                addedEdges = newData.edges;

                scope.chartCtrl.vivaGraph.vivaGraphOptions.graph.nodeResizeProperties = vivaGraphService.parseNodeResizeProps(JSON.parse(JSON.stringify(scope.chartCtrl.data.nodes)), scope.chartCtrl.vivaGraph.vivaGraphOptions.graph.nodeResizeProperties);
                scope.chartCtrl.vivaGraph.vivaGraphOptions.graph.edgeResizeProperties = vivaGraphService.parseEdgeResizeProps(JSON.parse(JSON.stringify(scope.chartCtrl.data.edges)), scope.chartCtrl.vivaGraph.vivaGraphOptions.graph.edgeResizeProperties);

                if (newData.uiOptions) {
                    console.log('checking ui options...')
                    scope.chartCtrl.vivaGraph.vivaGraphOptions = {
                        //chartData: {},
                        currentLabels: {},
                        defaultNodeSize: 12,
                        defaultNodeBorder: 0,
                        type: {
                            properties: []
                        },
                        instanceTraversed: {
                            selection: ""
                        },
                        engines: {
                            selected: {},
                            list: []
                        },
                        traverseHistory: [], //array of stepIDs
                        showPropertiesTable: false,
                        selectedUri: [],
                        typeLabels: [],
                        //filteredData: {},
                        //completeGraphData: {},
                        traverseByType: [],
                        graph: {
                            nodeResizeProperties: [],
                            edgeResizeProperties: []
                        },
                        node: {
                            properties: []
                        },
                        selectedColorGroup: newData.uiOptions.selectedColorGroup || false,
                        legendToggle: true,
                        labelToggle: false,
                        brushMode: scope.chartCtrl.vivaGraph.vivaGraphOptions.brushMode || false,
                        selectedLayout: newData.uiOptions.selectedLayoutOptions || 'forceDirected',
                        selectedLayoutOptions: newData.uiOptions.selectedLayoutOptions || {
                            springLength: 80,
                            springCoeff: 0.0002,
                            gravity: -1.2,
                            theta: 0.8,
                            dragCoeff: 0.02,
                            timeStep: 20,
                            stableThreshold: .009
                        }
                    };
                }

                drawGraph(newData.nodes, newData.edges);

                configureGraphLabels(newData);
            }

            /**
             * @name toolUpdateProcessor
             * @param toolUpdateConfig {Object} newly changed tools
             * @desc function that is triggered when tools is updated by the UI
             */
            function toolUpdateProcessor(toolUpdateConfig) {
                scope[toolUpdateConfig.fn](toolUpdateConfig.args);
            }

            /**
             * @name highlightSelectedItem
             * @param selectedItem  item to be highlighted
             * @desc function that is triggered when tools is updated by the UI
             */
            function highlightSelectedItem(selectedItem) {

            }

            /**
             * @name resizeViz
             * @desc function that is triggered when the panel is resized
             */
            function resizeViz() {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                drawGraph(addedNodes, addedEdges);
            }

            /* Viz Functions */
            /** Main **/
            /**
             * @name drawGraph
             * @param nodes {Object} nodes that comprise the graph
             * @param edges {Object} edges that comprise the graph
             * @desc used for drawing the graph
             */
            function drawGraph(nodes, edges) {
                createGraph(nodes, edges);
                setGraphics();
                setGraphLayout(scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayout);
                setGraphEvents(graphics, graph);
                renderGraph(graph, container, graphics, layout);
                //Legend
                //set up legendNodes array for legend
                legendNodes.length = 0;
                legendNodeCounts = {};
                newLegendNodes = _.filter(nodes, function (node) {
                    if (legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] > 0) {
                        legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] = legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] + 1;
                        return false;
                    }
                    legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] = 1;
                    return true;
                });


                createLegend();
                updateLegend();
                //Brush
                scope.chartCtrl.toggleBrushMode(scope.chartCtrl.vivaGraph.vivaGraphOptions.brushMode);
            }

            /**
             * @name createGraph
             * @desc handles creation of the graph object
             */
            function createGraph(nodes, edges) {
                if (graph) {
                    renderer.dispose();
                }

                container = document.getElementById(scope.chartCtrl.chartName);

                //clear canvas container - TODO do this a more efficient way
                clearChildElements("canvas");

                //construct graph
                graph = Viva.Graph.graph();

                //add in nodes
                for (var i in nodes) {
                    //name, data
                    graph.addNode(i, nodes[i]);
                }

                //add in edges
                for (var i = 0; i < edges.length; i++) {
                    //source, target, data
                    graph.addLink(edges[i].source, edges[i].target, edges[i].propHash);
                }
            }

            /**
             * @name clearChildElements
             * @param element
             * @desc clears child elements
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
             */
            function setLabelGraphics() {
                //remove old tooltips
                clearChildElements("span");

                if (scope.chartCtrl.vivaGraph.vivaGraphOptions.labelToggle) {
                    //labels
                    labels = generateDOMLabels();
                } else {
                    //create tooltip for nodes
                    //TODO - render the labels using WebGL
                    tooltip = document.createElement('span');
                    tooltip.style.position = 'absolute';
                    tooltip.style.zIndex = 10;
                    container.appendChild(tooltip);
                }
            }

            /**
             * @name setGraphics
             * @desc toggles the graphics
             * @TODO render the labels using WebGL
             */
            function setGraphics() {
                setLabelGraphics();

                //render options
                graphics = Viva.Graph.View.webglGraphics();

                //use custom shader
                graphics.setNodeProgram(buildCircleNodeShader());
                graphics.node(function (node) {
                    return {
                        size: scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeSize,
                        color: RGBToHex(getNodeColor(node.data)),
                        border: scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeBorder
                    };
                });

                graphics.link(function (link) {
                    return {
                        color: linkColor
                    };
                });

                graphics.placeNode(function (ui, pos) {
                    // This callback is called by the renderer before it updates
                    // node coordinate. We can use it to update corresponding DOM
                    // label position;
                    // we create a copy of layout position

                    var domPos = {
                        x: pos.x + 8,
                        y: pos.y - 8
                    };
                    // And ask graphics to transform it to DOM coordinates:
                    graphics.transformGraphToClientCoordinates(domPos);

                    if (scope.chartCtrl.vivaGraph.vivaGraphOptions.labelToggle) {
                        // move corresponding dom label to its own position:
                        var label = labels[ui.node.id];
                        label.style.left = domPos.x + 'px';
                        label.style.top = domPos.y + 'px';
                    }
                });
            }

            /**
             * @name setGraphLayout
             * @param selectedLayout {String} the new layout to set
             * @desc sets the graph layout
             */
            function setGraphLayout(selectedLayout) {
                if (selectedLayout === 'radialTree') {
                    layout = Viva.Graph.Layout.radialTree(graph);
                } else if (selectedLayout === 'forceDirected') {
                    layout = Viva.Graph.Layout.forceDirected(graph, scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayoutOptions);
                } else if (scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayout === 'forceAtlas2') {
                    layout = Viva.Graph.Layout.forceAtlas2(graph, scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayoutOptions);
                }

                //if layout has functions to pin and set, do it
                if (layout.setNodePosition && layout.pinNode) {
                    graph.forEachNode(function (node) {
                        if ((node.data.propHash.X || node.data.propHash.X === 0) && (node.data.propHash.Y || node.data.propHash.Y === 0)) {

                            layout.setNodePosition(node.id, node.data.propHash.X * 10, node.data.propHash.Y * 10);
                            layout.pinNode(node, true)
                        }
                    });
                }


            }

            /**
             * @name setGraphEvents
             * @desc set events on the graph
             */
            function setGraphEvents(graphics, graph) {
                events = Viva.Graph.webglInputEvents(graphics, graph);

                events.dblClick(function (node) {
                    /*if (selectedLayout === 'radialTree') {
                     graph.beginUpdate();
                     layout.updateRadialLayout(node.id);
                     graph.forEachNode(function (node) {
                     graphics.getNodeUI(node.id).position = layout.getNodePosition(node.id);
                     });
                     graph.forEachLink(function (link) {
                     graphics.getLinkUI(link.id).pos = layout.getLinkPosition(link.id);
                     });
                     graph.endUpdate();
                     }*/
                    scope.selectNode(node.data);
                    highlightSelectedNodes([node]);
                    //legend highlight clear
                    d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
                        .attr("stroke-width", function (node) {
                            return 0;
                        }).attr("stroke", function (node) {
                        return node.propHash.VERTEX_TYPE_PROPERTY;
                    });
                });

                if (!scope.chartCtrl.vivaGraph.vivaGraphOptions.labelToggle) {
                    events.mouseEnter(function (node) {
                        tooltip.innerText = $filter('replaceUnderscores')(node.data.propHash.VERTEX_LABEL_PROPERTY);
                        tooltip.style.display = 'block';
                        tooltip.style.left = event.offsetX + 'px';
                        tooltip.style.top = event.offsetY - 9 + 'px';
                        tooltip.style.pointer = 'cursor';
                    });

                    events.mouseLeave(function (node) {
                        tooltip.style.display = 'none';
                    });
                }
            }

            /**
             * @name startMultiSelect
             * @desc initialize the multi select mode
             */
            function startMultiSelect(graph, renderer, layout) {
                var graphics = renderer.getGraphics();
                var domOverlay = document.querySelector("#" + scope.chartCtrl.chartName + "-graph-brush");
                var overlay = createOverlay(domOverlay);
                overlay.onAreaSelected(handleAreaSelected);
                overlay.onDragStop(filterGraphNodes);

                return overlay;

                function handleAreaSelected(area) {
                    // For the sake of this demo we are using silly O(n) implementation.
                    // Could be improved with spatial indexing if required.
                    var topLeft = graphics.transformClientToGraphCoordinates({
                        x: area.x,
                        y: area.y
                    });

                    var bottomRight = graphics.transformClientToGraphCoordinates({
                        x: area.x + area.width,
                        y: area.y + area.height
                    });

                    graph.forEachNode(highlightIfInside);
                    renderer.rerender();

                    return;

                    function highlightIfInside(node) {
                        var nodeUI = graphics.getNodeUI(node.id);
                        if (nodeUI) {
                            nodeUI.color = RGBToHex(getNodeColor(node.data));
                            if (isInside(node.id, topLeft, bottomRight)) {
                                nodeUI.size = 20;
                            } else {
                                nodeUI.size = scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeSize;
                            }
                        }
                    }
                }

                function filterGraphNodes(area) {
                    var topLeft = graphics.transformClientToGraphCoordinates({
                        x: area.x,
                        y: area.y
                    });

                    var bottomRight = graphics.transformClientToGraphCoordinates({
                        x: area.x + area.width,
                        y: area.y + area.height
                    });

                    var resetFilter = false;
                    var filteredConcepts = {};

                    graph.forEachNode(filterIfInside);
                    renderer.rerender();

                    function filterIfInside(node) {
                        if (isInside(node.id, topLeft, bottomRight)) {
                            var nodeConcept = node.data.propHash["VERTEX_TYPE_PROPERTY"];
                            if (!filteredConcepts[nodeConcept]) {
                                filteredConcepts[nodeConcept] = [];                            //
                            }
                            var instance = node.data.propHash["VERTEX_LABEL_PROPERTY"];
                            filteredConcepts[nodeConcept].push(instance);
                        }
                    }

                    if (Object.keys(filteredConcepts).length === 0 && filteredConcepts.constructor === Object) {
                        resetFilter = true;
                    }
                    console.log(filteredConcepts + " " + resetFilter);
                    scope.chartCtrl.filterOnBrushMode(filteredConcepts, resetFilter);
                }

                function isInside(nodeId, topLeft, bottomRight) {
                    var nodePos = layout.getNodePosition(nodeId);
                    return (topLeft.x < nodePos.x && nodePos.x < bottomRight.x &&
                    topLeft.y < nodePos.y && nodePos.y < bottomRight.y);
                }
            }

            /**
             * @name createOverlay
             * @desc initialize the multi select mode
             */
            function createOverlay(overlayDom) {
                var selectionClassName = 'viva-graph-selection-indicator';
                var selectionIndicator = overlayDom.querySelector('.' + selectionClassName);
                if (!selectionIndicator) {
                    selectionIndicator = document.createElement('div');
                    selectionIndicator.className = selectionClassName;
                    overlayDom.appendChild(selectionIndicator);
                }

                var dragstop = [];
                var notify = [];
                var dragndrop = Viva.Graph.Utils.dragndrop(overlayDom);
                var selectedArea = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
                var startX = 0;
                var startY = 0;

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
                    }
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
             * @desc render the graph
             */
            function renderGraph(graph, container, graphics, layout) {
                renderer = Viva.Graph.View.renderer(graph, {
                    "container": container,
                    "graphics": graphics,
                    "layout": layout,
                    "renderLinks": true
                });
                renderer.run();
            }

            /**
             * @name buildCircleNodeShader
             * @desc constructs nodes in webGL. this is using a custom node shader on top of vivagraph.js
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
                        '}'].join('\n'),

                    nodeFragmentShader = [
                        '#extension GL_OES_standard_derivatives : enable', //import this* (see load function)
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
                        //'         gl_FragColor = vec4( mix(noOutlineColor.rgba, color.rgba, stroke) );',
                        '         gl_FragColor = color;',
                        '      }',
                        '   } else {',
                        '      gl_FragColor = vec4(0);',
                        '   }',
                        '}'].join('\n');

                var program,
                    gl,
                    buffer,
                    locations,
                    webglUtils,
                    nodes = new Float32Array(64),
                    nodesCount = 0,
                    canvasWidth, canvasHeight, transform,
                    isCanvasDirty;

                return {
                    /**
                     * Called by webgl renderer to load the shader into gl context.
                     */
                    load: function (glContext) {
                        gl = glContext;
                        webglUtils = Viva.Graph.webgl(glContext);

                        gl.getExtension('OES_standard_derivatives'); //*need to get the extension

                        program = webglUtils.createProgram(nodeVertexShader, nodeFragmentShader);
                        gl.useProgram(program);
                        locations = webglUtils.getLocations(program, ['a_vertexPos', 'a_customAttributes', 'u_screenSize', 'u_transform']);

                        gl.enableVertexAttribArray(locations.vertexPos);
                        gl.enableVertexAttribArray(locations.customAttributes);

                        buffer = gl.createBuffer();
                    },

                    /**
                     * Called by webgl renderer when user resizes the canvas with nodes.
                     */
                    updateSize: function (newCanvasWidth, newCanvasHeight) {
                        canvasWidth = newCanvasWidth;
                        canvasHeight = newCanvasHeight;
                        isCanvasDirty = true;
                    },

                    /**
                     * Called by webgl renderer when user scales/pans the canvas with nodes.
                     */
                    updateTransform: function (newTransform) {
                        transform = newTransform;
                        isCanvasDirty = true;
                    },

                    /**
                     * Called by webgl renderer to notify us that the new node was created in the graph
                     */
                    createNode: function (node) {
                        nodes = webglUtils.extendArray(nodes, nodesCount, ATTRIBUTES_PER_PRIMITIVE);
                        nodesCount += 1;
                    },

                    /**
                     * Called by webgl renderer to notify us that the node was removed from the graph
                     */
                    removeNode: function (node) {
                        if (nodesCount > 0) {
                            nodesCount -= 1;
                        }

                        if (node.id < nodesCount && nodesCount > 0) {
                            // we do not really delete anything from the buffer.
                            // Instead we swap deleted node with the "last" node in the
                            // buffer and decrease marker of the "last" node. Gives nice O(1)
                            // performance, but make code slightly harder than it could be:
                            webglUtils.copyArrayPart(nodes, node.id * ATTRIBUTES_PER_PRIMITIVE, nodesCount * ATTRIBUTES_PER_PRIMITIVE, ATTRIBUTES_PER_PRIMITIVE);
                        }
                    },

                    /**
                     * This method is called by webgl renderer when it changes parts of its
                     * buffers. We don't use it here, but it's needed by API (see the comment
                     * in the removeNode() method)
                     */
                    replaceProperties: function (replacedNode, newNode) {

                    },

                    /**
                     * Called by webgl renderer to update node position in the buffer array
                     *
                     * @param {object} nodeUI - data model for the rendered node (WebGLCircle in this case)
                     * @param {object} pos - {x, y} coordinates of the node.
                     */
                    position: function (nodeUI, pos) {
                        var idx = nodeUI.id;
                        nodes[idx * ATTRIBUTES_PER_PRIMITIVE] = pos.x;
                        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 1] = -pos.y;
                        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 2] = nodeUI.color;
                        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 3] = nodeUI.size;
                        nodes[idx * ATTRIBUTES_PER_PRIMITIVE + 4] = nodeUI.border;
                    },

                    /**
                     * Request from webgl renderer to actually draw our stuff into the
                     * gl context. This is the core of our shader.
                     */
                    render: function () {
                        gl.useProgram(program);
                        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                        gl.bufferData(gl.ARRAY_BUFFER, nodes, gl.DYNAMIC_DRAW);

                        if (isCanvasDirty) {
                            isCanvasDirty = false;
                            gl.uniformMatrix4fv(locations.transform, false, transform);
                            gl.uniform2f(locations.screenSize, canvasWidth, canvasHeight);
                        }

                        gl.vertexAttribPointer(locations.vertexPos, 3, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 0);
                        gl.vertexAttribPointer(locations.customAttributes, 3, gl.FLOAT, false, ATTRIBUTES_PER_PRIMITIVE * Float32Array.BYTES_PER_ELEMENT, 2 * 4);

                        gl.drawArrays(gl.POINTS, 0, nodesCount);
                    }
                };
            }

            /**
             * @name timeoutGraphLayout
             * @desc locks the graph layout after a set number of seconds
             * @TODO do we pass in a parameter and do this based on layout? or number of nodes?
             */
            function timeoutGraphLayout() {

            }

            /**
             * @name configureGraphLabels
             * @param data {Object} item of the legend
             * @desc This function sets up the data we ng-repeat through in the Type Label table. It needs to be called when chartData is updated.
             */
            var configureGraphLabels = function (data) {
                var labelTypes = JSON.parse(JSON.stringify(scope.chartCtrl.vivaGraph.vivaGraphOptions.currentLabels));

                for (var node in data.nodes) {
                    var nodeType = data.nodes[node].propHash.VERTEX_TYPE_PROPERTY;
                    // If our type isn't in our current labels object, add it.
                    if (!scope.chartCtrl.vivaGraph.vivaGraphOptions.currentLabels[nodeType]) {
                        var valueArray = [];
                        valueArray.length = 0;
                        var currentLabelSelected = "VERTEX_LABEL_PROPERTY";
                        for (var key in data.nodes[node].propHash) {
                            valueArray.push(key);
                            if (key === labelTypes[nodeType]) {
                                currentLabelSelected = key;
                            }
                        }
                        scope.chartCtrl.vivaGraph.vivaGraphOptions.type.properties.push({
                            name: nodeType,
                            values: valueArray,
                            selected: currentLabelSelected
                        });

                        if (!labelTypes[nodeType]) {
                            scope.chartCtrl.vivaGraph.vivaGraphOptions.currentLabels[nodeType] = "VERTEX_LABEL_PROPERTY";
                        } else {
                            for (var type in labelTypes) {
                                if (nodeType === type) {
                                    scope.chartCtrl.vivaGraph.vivaGraphOptions.currentLabels[nodeType] = labelTypes[type];
                                }
                            }
                        }
                    }
                }
                //updateLabels();
            };

            /**
             * @name createLegend
             * @desc creates the legend
             */
            function createLegend() {
                var legendNodeSize = Object.keys(legendNodeCounts).length;

                if (svg) {
                    svg.remove();
                }

                svgContainer = d3.select("#" + scope.chartCtrl.chartName + "-viva-legend")
                    .style("height", (legendNodeSize * 20) + 25 + "px");

                svg = svgContainer.append("svg")
                    .attr("class", "editable-svg")
                    .attr("width", width)
                    .attr("height", (legendNodeSize * 20) + 25);

                legendBox = svg.append("g")
                    .attr("class", scope.chartCtrl.chartName + " legend")
                    .attr("height", 100)
                    .attr("width", 100);
            }

            /**
             * @name updateLegend
             * @desc updates the legend for new nodes
             */
            function updateLegend() {
                //legend update...
                legendNodes = newLegendNodes.filter(function (node) {
                    return legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] > 0;
                });

                var legend = legendBox.selectAll("circle")
                    .data(legendNodes, function (d) {
                        return d.propHash.VERTEX_TYPE_PROPERTY;
                    });

                //legend enter...
                legend.enter()
                    .append("circle")
                    .attr("r", 0)
                    .attr("r", 6)
                    .attr("stroke-width", 1)
                    .attr("stroke", function (d) {
                        return ('rgb(' + getNodeColor(d) + ')');
                    })
                    .style("fill", function (d) {
                        return ('rgb(' + getNodeColor(d) + ')');
                    });

                legend.transition().duration(1000).attr("transform", function (d, i) {
                    return "translate(15," + ((i * 20) + 15) + ")";
                });

                //legend exit...(move below with legendText exit?)
                legend.exit().transition()
                    .attr("r", 0)
                    .remove();

                //legendText update...
                var legendText = legendBox.selectAll("text")
                    .data(legendNodes, function (d) {
                        return d.propHash.VERTEX_TYPE_PROPERTY;
                    });

                //legendText enter...
                legendText.enter()
                    .append("text")
                    .attr("x", 12);

                legendText.transition().duration(1000).attr("transform", function (d, i) {
                        return "translate(15," + ((i * 20) + 19) + ")";
                    })
                    .text(function (d) {
                        return $filter("replaceUnderscores")(d.propHash.VERTEX_TYPE_PROPERTY) + " (" + legendNodeCounts[d.propHash.VERTEX_TYPE_PROPERTY] + ")";
                    });

                //legendText exit...
                legendText.exit().transition()
                    .remove();

                var legendTextArray = [];
                //setting array of just the name values of each type, then sending them to a controller function
                for (var i = 0; i < legendNodes.length; i++) {
                    legendTextArray.push(legendNodes[i].propHash.VERTEX_TYPE_PROPERTY);
                }
                //scope.sendLegend({data: legendTextArray});
                //need to combine this selectALL and the bottom selectAll into one group
                d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("text")
                    .style("cursor", "pointer")
                    .on("click", function (d) {
                        legendClick(d);
                    });

                d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
                    .style("cursor", "pointer")
                    .on("click", function (d) {
                        legendClick(d);
                    });
            }

            /**
             * @name legendClick
             * @param legendItem {Object} item of the legend
             * @desc when legend item is selected, it will highlight corresponding graph elements
             */
            function legendClick(legendItem) {
                var type = legendItem.propHash.VERTEX_TYPE_PROPERTY;
                selectedNodes = [];

                //fill the selected legend node
                d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
                    .attr("stroke-width", function (node) {
                        if (node.propHash.VERTEX_TYPE_PROPERTY === type) {
                            return 1.5;
                        } else {
                            return 0;
                        }
                    }).attr("stroke", function (node) {
                    if (node.propHash.VERTEX_TYPE_PROPERTY === type) {
                        return "black";
                    } else {
                        return node.propHash.VERTEX_TYPE_PROPERTY;
                    }
                });

                graph.forEachNode(function (node) {
                    if (node.data.propHash.VERTEX_TYPE_PROPERTY === type) {
                        selectedNodes.push(node);
                    }
                });

                highlightSelectedNodes(selectedNodes);

                var items = _.map(selectedNodes, function (node) {
                    return {
                        uri: node.data.uri,
                        engine: (scope.chartCtrl.data && scope.chartCtrl.data.core_engine) ? scope.chartCtrl.data.core_engine : {
                            name: '',
                            api: ''
                        },
                        concept: node.data.propHash ? node.data.propHash.VERTEX_TYPE_PROPERTY : "",
                        name: node.data.propHash ? node.data.propHash.VERTEX_LABEL_PROPERTY : "",
                        axisName: node.data.propHash ? node.data.propHash.VERTEX_TYPE_PROPERTY : ""
                    }
                });
                //dataNetwork
                var selectedUri = [];
                for (var i = 0; i < items.length; i++) {
                    selectedUri.push(items[i].uri)
                }

                $rootScope.$emit('data-network-tools-receive', 'force-graph-uri-selected', {
                    uri: selectedUri
                });

                setPropTable({
                    data: selectedNodes
                });

                scope.chartCtrl.highlightSelectedItem(items);
            }

            scope.registerTraversedOption = function (args) {
                var engine = args.db[0];
                var tripleObj = {relTriples: [], filter: {}};
                var temp = "";
                var concept = "";
                concept = scope.chartCtrl.data.nodes[scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedUri[0]].propHash.VERTEX_TYPE_PROPERTY;
                tripleObj.filter[concept] = [];
                for (var i = 0; i < scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedUri.length; i++) {
                    var instance = scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedUri[i];
                    //create the filter
                    tripleObj.filter[concept].push($filter("shortenValueFilter")(instance));
                }

                temp = args.equivalent;
                //concept
                if (args.direction === "downstream") {
                    tripleObj.relTriples.push([args.conceptualName, args.relation, temp]);
                } else if (args.direction === "upstream") {
                    tripleObj.relTriples.push([temp, args.relation, args.conceptualName]);
                }

                var existingConcept = $filter('shortenValueFilter')(temp);
                var joinConcept = $filter('shortenValueFilter')(temp);
                var joinType = "inner";
                var insightID = scope.chartCtrl.data.insightID;

                var pkqlObject = {};
                if (args.parentName) {//handles property as a concept
                    pkqlObject = {
                        engineName: engine.name,
                        selectors: [],
                        filters: tripleObj.filter,
                        joinType: [joinType],
                        triples: tripleObj.relTriples,
                        existingConcept: args.equivalent,
                        joinConcept: args.equivalent ? args.equivalent : undefined
                    };

                    if (tripleObj.relTriples[0].length === 1) {
                        pkqlObject.triples[0][0] = args.parentName + "__" + args.conceptualName;
                        pkqlObject.selectors.push(args.parentName + "__" + args.conceptualName);
                    } else {
                        if (args.conceptualName === tripleObj.relTriples[0][0]) {
                            pkqlObject.triples[0][0] = args.parentName + "__" + tripleObj.relTriples[0][0];
                        } else if (args.conceptualName === tripleObj.relTriples[0][2]) {
                            pkqlObject.triples[0][2] = args.parentName + "__" + tripleObj.relTriples[0][2];
                        }
                        pkqlObject.selectors.push(args.parentName);
                        pkqlObject.selectors.push(args.parentName + "__" + args.conceptualName);
                    }
                } else { //handles normal concepts
                    pkqlObject = {
                        engineName: engine.name,
                        selectors: [],
                        filters: tripleObj.filter,
                        joinType: [joinType],
                        triples: tripleObj.relTriples,
                        existingConcept: [args.equivalent], //might need to pass in the selected node's physicalName
                        joinConcept: [args.equivalent ? args.equivalent : undefined]
                    };

                    if (tripleObj.relTriples[0].length === 1) {
                        pkqlObject.selectors.push(tripleObj.relTriples[0][0]);
                    } else {
                        pkqlObject.selectors.push(tripleObj.relTriples[0][0]);
                        pkqlObject.selectors.push(tripleObj.relTriples[0][2]);
                    }
                }

                var pkqlQuery = pkqlService.generateDBImportPKQLQuery(pkqlObject);
                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, pkqlQuery);
            };

            /** Utility **/
            /**
             * @name generateDOMLabels
             * @desc creates labels for the graph nodes
             */
            function generateDOMLabels() {
                var labelHolder = {};
                graph.forEachNode(function (node) {
                    var label = document.createElement('span');
                    label.style.position = 'absolute';
                    label.style.pointerEvents = 'none';
                    //here we need to take into account the selections from the properties table
                    //label.innerText = $filter('replaceUnderscores')(node.data.propHash[scope.chartCtrl.vivaGraph.vivaGraphOptions.currentLabels[node.data.propHash.VERTEX_TYPE_PROPERTY]]);
                    label.innerText = $filter('replaceUnderscores')(node.data.propHash.VERTEX_LABEL_PROPERTY);
                    labelHolder[node.id] = label;
                    container.appendChild(label);
                });
                return labelHolder;
            }

            /**
             * @name RGBToHex
             * @param rgb {rgb} - the rbg value to convert
             * @desc converts rgb value to hex.
             */
            function RGBToHex(rgb) {
                rgb = rgb.match(/(\d+),\s*(\d+),\s*(\d+)$/);

                function hex(x) {
                    return ("0" + parseInt(x).toString(16)).slice(-2);
                }

                return ("0x" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]));
            }

            /**
             * @name getNodeColor
             * @param node
             * @desc returns node color
             */
            function getNodeColor(nodeData) {
                var color = color = "20,20,20";

                if (nodeData.propHash.VERTEX_COLOR_PROPERTY) {
                    color = nodeData.propHash.VERTEX_COLOR_PROPERTY
                }

                if (scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedColorGroup && nodeData.propHash[scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedColorGroup]) {
                    var colorArray = ["1,94,255", "12,196,2", "252,10,24", "174,167,165", "255,21,174", "217,159,7", "17,165,254", "3,126,67", "186,68,85", "209,10,255", "147,84,166", "123,109,43", "8,187,187", "149,180,45", "181,78,4", "238,116,255", "45,117,147", "225,151,114", "250,127,190", "254,3,91", "174,160,219", "144,94,118", "146,178,122", "3,194,98", "135,138,255", "74,118,98", "255,103,87", "254,133,4", "147,64,225", "42,134,2", "7,182,229", "210,17,112", "82,106,179", "255,8,226", "187,46,167", "228,145,159", "9,191,145", "144,98,76", "187,169,74", "162,108,5", "92,118,5", "223,137,231", "176,72,124", "238,147,69", "112,180,88", "177,155,113", "107,109,116", "236,82,6", "133,167,199", "255,103,140", "181,91,62", "128,84,204", "126,176,160", "196,128,179", "217,16,45", "90,120,63", "254,102,210", "188,19,200", "98,189,51", "184,171,3", "143,49,255", "253,133,129", "4,146,121", "116,115,156", "14,106,214", "116,113,81", "1,135,141", "3,128,191", "191,129,253", "139,161,251", "136,122,2", "192,155,181", "169,119,65", "208,64,150", "193,144,131", "165,131,218", "140,161,73", "177,99,104", "194,62,55", "253,123,64", "209,33,83", "178,76,210", "86,166,111", "93,175,189", "120,172,235", "35,117,254", "212,159,84", "234,65,211", "136,94,146", "132,104,253", "207,78,255", "201,55,22", "197,99,175", "214,104,134", "102,77,253", "70,133,48", "109,96,190", "250,138,100", "5,152,67", "255,85,161", "99,139,142", "189,109,46", "255,15,122", "63,147,255", "255,81,103", "143,154,127", "214,130,1", "139,144,84", "254,73,53", "157,126,133", "1,165,43", "89,185,155", "186,92,196", "75,190,115", "103,153,37", "185,144,35", "64,129,88", "250,86,254", "214,96,59", "131,144,4", "209,120,106", "203,65,112", "137,122,187", "142,140,161", "65,151,194", "168,142,73", "21,127,213", "186,107,255", "210,4,152", "218,109,16", "127,185,5", "189,114,141", "252,12,254", "245,21,144", "227,92,96", "126,104,94", "92,101,220", "104,134,195", "143,174,181", "17,179,249", "202,149,219", "171,29,231", "108,154,84", "234,139,180", "161,125,165", "104,125,220", "255,15,55", "110,155,119", "215,28,2", "147,120,78", "157,139,123", "252,8,198", "233,116,228", "68,162,152", "159,82,141", "159,105,207", "242,124,210", "14,195,57", "111,122,45", "170,114,183", "3,147,173", "67,112,159", "172,78,105", "112,125,113", "219,93,149", "85,187,79", "174,172,98", "168,175,62", "222,155,56", "183,123,93", "252,66,119", "254,130,153", "176,64,155", "135,105,16", "213,15,229", "245,71,174", "169,164,201", "151,101,101", "4,159,103", "229,138,205", "206,160,109", "96,119,143", "122,103,126", "214,47,68", "163,88,74", "211,104,111", "254,65,3", "83,157,1", "15,123,110", "102,126,90", "255,68,78", "147,143,55", "143,116,244", "165,152,26", "193,138,150", "156,93,56", "172,2,255", "184,104,4", "218,88,26", "209,80,207", "218,106,88", "191,148,254", "15,185,211", "75,93,233", "91,144,168", "200,106,154", "122,95,170", "212,77,229", "214,88,189", "210,121,81", "45,173,6", "140,182,74", "196,13,179", "154,96,30", "251,115,29", "226,148,139", "71,157,83", "168,172,126", "223,119,58", "68,123,2", "162,87,126", "75,131,253", "242,61,190", "243,100,183", "216,140,79", "108,113,61", "109,139,180", "71,155,54", "173,129,50", "94,151,231", "197,154,201", "151,76,187", "182,74,68", "248,141,46", "148,82,221", "224,67,57", "222,78,106", "54,118,128", "167,72,255", "245,96,58", "203,108,231", "174,157,237", "208,10,131", "15,127,34", "175,82,34", "136,143,145", "98,178,213", "164,177,5", "253,118,165", "121,184,112", "9,189,169", "236,71,130", "104,146,129", "159,151,252", "252,105,235", "192,157,159", "121,182,54", "215,149,180", "122,182,137", "195,50,121", "60,122,58", "191,130,4", "179,167,143", "201,165,30", "168,52,208", "242,2,67", "187,111,198", "197,130,47", "221,15,206", "154,173,161", "2,136,94", "141,157,227", "102,137,49", "16,163,174", "223,8,99", "141,90,255", "142,138,98", "119,148,95", "140,140,190", "164,127,102", "147,176,141", "241,142,118", "143,121,225", "182,118,108", "34,166,126", "203,160,129", "93,85,242", "103,104,161", "72,142,118", "254,124,107", "164,168,185", "111,113,8", "184,72,144", "115,133,210", "170,133,192", "92,191,7", "47,154,225", "150,167,219", "147,179,103", "168,100,224", "234,135,138", "171,61,180", "165,140,47", "255,111,127", "190,166,105", "195,120,225", "94,177,229", "220,2,177", "125,139,36", "114,158,2", "251,118,81", "54,111,176", "197,57,72", "137,103,49", "228,11,31", "132,101,109", "130,118,202", "167,121,145", "43,108,198", "130,105,77", "189,70,30", "225,9,75", "64,130,125", "166,108,151", "224,91,76", "72,148,159", "243,145,3", "180,46,189", "88,114,115", "154,119,5", "202,146,236", "48,193,77", "174,79,84", "107,121,254", "209,118,132", "109,165,165", "193,43,151", "158,88,107", "91,149,204", "84,162,125", "73,167,44", "120,149,255", "80,188,132", "14,147,40", "179,136,94", "133,160,44", "125,100,139", "29,124,170", "136,124,122", "123,145,74", "254,57,141", "220,104,172", "126,151,166", "57,180,90", "113,85,221", "169,87,12", "182,80,240", "215,112,206", "117,163,71", "201,139,89", "89,183,182", "187,76,51", "187,43,224", "238,82,85", "225,59,142", "229,69,29", "82,143,86", "245,49,243", "215,125,36", "168,150,162", "23,123,95", "205,38,99", "167,82,160", "192,77,107", "147,105,191", "180,109,62", "105,137,4", "144,128,71", "219,69,188", "204,99,241", "230,104,126", "198,120,190", "253,65,231", "236,131,159", "131,64,248", "174,112,123", "202,131,133", "83,103,206", "143,123,42", "156,121,112", "31,150,2", "9,160,218", "166,132,249", "228,116,161", "255,105,46", "196,158,68", "3,189,126", "238,141,85", "225,133,247", "27,103,224", "79,120,45", "227,93,135"],
                        colorLength = colorArray.length,
                        colorGroup = nodeData.propHash[scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedColorGroup] % colorLength;

                    color = colorArray[colorGroup]
                }
                return color
            }

            /**
             * @name highlightSelectedNodes
             * @param nodeData {Array} - array of nodes to select
             * @desc paints selected nodes from array with a black border
             * @TODO - move this to chartCtrl.highlightSelectedItem
             */
            function highlightSelectedNodes(nodeData) {
                //need to clear old highlighting
                graph.forEachNode(function (node) {
                    var nodeUI = graphics.getNodeUI(node.id);
                    nodeUI.color = RGBToHex(getNodeColor(node.data));
                    nodeUI.size = scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeSize;
                    nodeUI.border = scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeBorder;
                });

                for (var i = 0; i < nodeData.length; i++) {
                    var node = nodeData[i];
                    var nodeUI = graphics.getNodeUI(node.id);
                    //uncommenting will let the color and size change when a node is double clicked.
                    /*nodeUI.color = 0xFFA500ff;
                     nodeUI.size = 20;*/
                    nodeUI.border = 0.2;
                }
                renderer.rerender();
            }

            /**
             * @name setPropTable
             * @params nodeData
             * @desc sets values in the propTable
             */
            function setPropTable(nodeData) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.node.properties = [];

                //check to see if multiple nodes were selected
                if (nodeData.data.length === 1) {
                    //add node properties to this.node.properties - these properties are shown in table on page
                    for (var key in nodeData.data[0].propHash) {
                        if (_.isObject(nodeData.data[0].propHash[key])) {
                            scope.chartCtrl.vivaGraph.vivaGraphOptions.node.properties.push({
                                name: key,
                                value: nodeData.data[0].propHash[key].label
                            });
                        } else {
                            if (key !== "VERTEX_COLOR_PROPERTY") {
                                scope.chartCtrl.vivaGraph.vivaGraphOptions.node.properties.push({
                                    name: key,
                                    value: nodeData.data[0].propHash[key]
                                });
                            }
                        }
                    }
                }
            }


            /* Tool Functions */
            /**
             * @name selectNode
             * @param nodeData
             * @desc getsRelatedInstances to Node
             */
            scope.selectNode = function (nodeData) {
                setPropTable({
                    data: []
                });

                //TODO GET ENGINE FOR GRAPH
                var items = [{
                    uri: nodeData.uri,
                    engine: (scope.chartCtrl.data && scope.chartCtrl.data.core_engine) ? scope.chartCtrl.data.core_engine : {
                        name: '',
                        api: ''
                    },
                    concept: nodeData.propHash ? nodeData.propHash.VERTEX_TYPE_PROPERTY : "",
                    name: nodeData.propHash ? nodeData.propHash.VERTEX_LABEL_PROPERTY : "",
                    axisName: nodeData.propHash ? nodeData.propHash.VERTEX_TYPE_PROPERTY : ""
                }];

                scope.chartCtrl.highlightSelectedItem(items);

                //for dataNetwork
                var selectedUri = [];
                for (var i = 0; i < items.length; i++) {
                    selectedUri.push(items[i].uri)
                }

                $rootScope.$emit('data-network-tools-receive', 'force-graph-uri-selected', {
                    uri: selectedUri
                });
            }

            /**
             * @name searchGraph
             * @param searchTerm {String} - the search term
             * @desc searches for a given term to see if the node exists on the graph
             * @todo  - determine the 'best match' and center the graph around that node
             * renderer.zoomIn();
             * renderer.zoomOut();
             */
            scope.searchGraph = function (searchTerm) {
                //clear the search highlighting but only make one call to renderer.rerender
                graph.forEachNode(function (node) {
                    var nodeUI = graphics.getNodeUI(node.id);
                    nodeUI.color = RGBToHex(getNodeColor(node.data));
                });
                var foundNodes = [];
                var exactMatch = [];
                var isExactMatch = false;
                graph.forEachNode(function (node) {
                    var nodeString = $filter('replaceUnderscores')(node.data.propHash.VERTEX_LABEL_PROPERTY);
                    var isMatch = false;
                    //var regExp = new RegExp(searchTerm);

                    if (nodeString.indexOf(searchTerm) > -1) {
                        isMatch = true;
                    }
                    if (nodeString.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {
                        isMatch = true;
                    }

                    if (nodeString === searchTerm) {
                        isExactMatch = true;
                    }
                    if (nodeString.toLowerCase() === searchTerm.toLowerCase()) {
                        isExactMatch = true;
                    }

                    if (isMatch) {
                        //console.log("searchTerm: " + searchTerm + " found node: ");
                        //console.log(node);
                        foundNodes.push(node);
                    }
                    if (isExactMatch) {
                        exactMatch.push(node);
                    }
                });
                if (isExactMatch) {
                    scope.centerOnNode(exactMatch[0]);
                } else {
                    console.log(foundNodes);
                    if (foundNodes[0])
                        scope.centerOnNode(foundNodes[0]);
                }

                renderer.rerender();
            }

            /**
             * @name centerOnNode
             * @param {Object} node the selected node on which to center the graph
             * @desc given a node, centers the graph around that nodes position
             * @todo improve the viva api to get/set the scaleFactor to zoom in on a node
             */
            scope.centerOnNode = function (node) {
                var nodeId = node.id;
                if (graph.getNode(nodeId)) {
                    var pos = layout.getNodePosition(nodeId);
                    renderer.moveTo(pos.x, pos.y);
                    //need to set the scale...
                    //renderer.getGraphics().scale(2);
                    highlightNode(node);
                }
            }

            /**
             * @name highlightNode
             * @param node {Object} node
             * @desc highlight a specific node on the graph
             */
            function highlightNode(node) {
                graph.beginUpdate();
                var id = node.id;
                var ui = graphics.getNodeUI(id);
                ui.color = RGBToHex(getNodeColor(node.data));
                //need to preserve the opacity
                ui.color = RGBToHex("255,255,0");
                graph.endUpdate();
            }

            /**
             * @name clearSearchHighlighting
             * @desc clears all search highlighting
             */
            scope.clearSearchHighlighting = function () {
                //need to clear old highlighting
                graph.forEachNode(function (node) {
                    var nodeUI = graphics.getNodeUI(node.id);
                    nodeUI.color = RGBToHex(getNodeColor(node.data));
                });
                renderer.rerender();
            };

            /**
             * @name resetScale
             * @desc resets the zooming / panning level for the entire graph
             */
            scope.resetScale = function () {
                renderer.reset();
                renderer.rerender();
            };

            /**
             * @name toggleLayout
             * @param isPaused {String} id of the node
             * @desc pause or resume the layout motion
             */
            scope.toggleLayout = function (isPaused) {
                graph.forEachNode(function (node) {
                    layout.pinNode(node, isPaused)
                });

                return false;
            };

            /**
             * @name toggleLegend
             * @param isToggled {String} id of the node
             * @desc hide/show the legend on the graph  graph.forEachNode(function (node) {
                        layout.pinNode(node, isPaused)
                    });
             */
            scope.toggleLegend = function (isToggled) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.legendToggle = isToggled;
            };

            /**
             * @name toggleLabels
             * @param isToggled {String} id of the node
             * @desc hide/show the labels for the nodes
             * @TODO fix issue with label updating
             */
            scope.toggleLabels = function (isToggled) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.labelToggle = isToggled;
                drawGraph(addedNodes, addedEdges);
                //TODO update whats necessary..there is a bug here with the labels when zoom/layout changes
                /*setGraphics();
                 setGraphEvents(graphics, graph);
                 renderGraph(graph, container, graphics, layout);*/
            };

            /**
             * @name togglePropertiesTable
             * @param toggle {boolean} - true: show table, false: hide table
             * @desc toggles the properties table on or off
             */
            scope.togglePropertiesTable = function (toggle) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.showPropertiesTable = toggle;
            };

            /**
             * @name setCurrentLabels
             * @param type {String} - node type to set label
             * @param value {String} - value of the label
             * @desc changes the labels for the graph
             * @return {void}
             */
            scope.chartCtrl.vivaGraph.setCurrentLabels = function (type, value) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.currentLabels[type] = value;
                //here we should only need to call a function to change the label text instead of re-drawing the entire graph...
            };

            /**
             * @name resetNodeSizing
             * @desc sets the sizing of the input array of nodes to the default size
             */
            scope.chartCtrl.vivaGraph.resetNodeSizing = function () {
                //need to clear old highlighting
                graph.forEachNode(function (node) {
                    var nodeUI = graphics.getNodeUI(node.id);
                    nodeUI.color = RGBToHex(getNodeColor(node.data));
                    nodeUI.size = scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeSize;
                    nodeUI.border = scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeBorder;
                });
                renderer.rerender();
            };

            /**
             * @name resetNodeSizing
             * @param nodeProp {Object} - node prop obj for each row in the table
             * @desc handles resizing of nodes based on a particular node
             */
            scope.chartCtrl.vivaGraph.nodeResizeProperty = function (nodeProp) {
                //array to keep track of all elements associated with the selected property
                var nodeDomainArray = [];

                graph.forEachNode(function (node) {
                    if (node.data.propHash[nodeProp.propName]) {
                        nodeDomainArray.push(node);
                    }
                });

                console.log('nodeDomainArray ', nodeDomainArray);
                //set rScale domain based on domainArray just collected
                if (nodeDomainArray.length > 0) {
                    rScale.domain([d3.min(nodeDomainArray, function (node) {
                        return +node.data.propHash[nodeProp.propName];
                    }) - 1, d3.max(nodeDomainArray, function (node) {
                        return +node.data.propHash[nodeProp.propName];
                    })]);

                    graph.forEachNode(function (node) {
                        var nodeUI = graphics.getNodeUI(node.id);
                        if (node.data.propHash[nodeProp.propName]) {
                            nodeUI.size = rScale(node.data.propHash[nodeProp.propName]);
                        } else {
                            nodeUI.size = scope.chartCtrl.vivaGraph.vivaGraphOptions.defaultNodeSize;
                        }
                    });
                    renderer.rerender();
                }
            };

            /**
             * @name updateLayout
             * @param layout new layout
             * @desc update layout and redraw graph
             */
            scope.updateLayout = function (toolValue) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayout = toolValue.layout;
                scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayoutOptions = toolValue.options;
                drawGraph(addedNodes, addedEdges);
            };

            /**
             * @name updateLayoutOptions
             * @param layout new layout
             * @desc update layout and redraw graph
             */
            scope.updateLayoutOptions = function (toolValue) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayoutOptions = toolValue.options;
                if (toolValue.render) {
                    drawGraph(addedNodes, addedEdges);
                } else {
                    if (layout.simulator) {
                        for (var i in scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayoutOptions) {
                            layout.simulator[i] = scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedLayoutOptions[i];
                        }
                    }
                }
            };

            /**
             * @name colorBy
             * @param toolValue
             * @desc update layout and redraw graph
             */
            scope.colorBy = function (toolValue) {
                scope.chartCtrl.vivaGraph.vivaGraphOptions.selectedColorGroup = toolValue;

                //need to clear old highlighting
                graph.forEachNode(function (node) {
                    var nodeUI = graphics.getNodeUI(node.id);
                    nodeUI.color = RGBToHex(getNodeColor(node.data));
                });

                renderer.rerender();

                createLegend();
                updateLegend();
            };

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                console.log('destroying visualization...');
            });
        }

        function vivaGraphCtrl($scope) {
            var vivaGraphCtrl = this;
        }
    }

})();
