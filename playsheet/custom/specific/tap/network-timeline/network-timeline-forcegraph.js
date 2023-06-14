(function () {
    'use strict';
    angular.module('app.tap.network-timeline-forcegraph.direcitve', [])
        .directive('timelineForcegraph', timelineForcegraph);
    timelineForcegraph.$inject = ['$rootScope', '$compile', 'networkTimelineService', '$filter', "_"];

    function timelineForcegraph($rootScope, $compile, networkTimelineService, $filter, _) {
        timelineForcegraphLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'EA',
            require: ['networkTimeline', 'chart'],
            link: timelineForcegraphLink,
            //bindtoController: true,
            controller: timelineforcegraphController,
            controllerAs: 'timeForce'
        };

        function timelineForcegraphLink(scope, ele, attrs, controllers) {
            scope.networkCtrl = controllers[0];
            scope.chartCtrl = controllers[1];

            var links = [],
                nodes = [],
                initialNodes = [],
                newNodes = [],
                newLinks = [],
                obj = {},
                linkedByIndex = {},
                interfaceCounts = [],
                legendNodes = [],
                margin = {
                    top: 100,
                    right: 100,
                    bottom: 100,
                    left: 100
                },
                allForceData,
                previousState = "Initial",
                dataNetworkViz = false,
                maxLOE,
                timeHashLocation;

            var html = '<div id="resizerRight-' + '" class="sidebarContentRight">' +
                '<div class="timeline-sidebar-title">' +
                '<div class="timeline-header-title text-center">' +
                'Network Transition Visualization' +
                '</div>' +
                '</div>' +
                '</div>';

            ele.append($compile(html)(scope));

            var width = parseInt(d3.select('.sidebarContentRight').style('width'));
            var height = parseInt(d3.select('.sidebarContentRight').style('height'));

            function dataProcessor() {
                if (!_.isEmpty(scope.forceData) && !_.isEmpty(scope.forceData)) {
                    //reset this val when data changes
                    //isSliderMade = false;
                    //fix the data initially...
                    var fixedData = JSON.parse(JSON.stringify(scope.forceData));
                    var nodeKeys = _.keys(scope.forceData.nodes);
                    for (var j = 0; j < nodeKeys.length; j++) {
                        var key = nodeKeys[j];
                        fixedData.nodes[key].id = key;
                    }
                    for (var i = 0; i < scope.forceData.edges.length; i++) {
                        var newEdge = JSON.parse(JSON.stringify(scope.forceData.edges[i]));
                        newEdge.source = fixedData.nodes[newEdge.source];
                        newEdge.target = fixedData.nodes[newEdge.target];
                        fixedData.edges[i] = newEdge;
                    }
                    //save all the data for later
                    allForceData = fixedData;
                    //if (visInitialized === false) {
                    initialNodes = JSON.parse(JSON.stringify(allForceData.nodes));
                    if (scope.forceData.title.indexOf("network") > -1)
                        dataNetworkViz = true;
                    //}
                    //toolService.setmaxLOE(calculateMaxLOE());
                    //scope.chartController.maxLOE = toolService.getmaxLOE();

                    maxLOE = networkTimelineService.getMaxLOE();

                    //reset nodes and links.
                    nodes.length = 0;
                    links.length = 0;
                    previousState = "Initial";
                    setForceData(allForceData, 0, previousState);
                }
            };

            function setForceData(newData, sliderValue, currentState) {

                if (sliderValue === 0 && previousState === "Initial" && (currentState !== "Transition" && currentState !== "Final")) {
                    //initial Edges is dependent on initial nodes, must go after
                    newNodes = getInitialNodes();
                    newLinks = removeEdgesFromRemovedNodes(getInitialEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes())));
                } else {
                    newLinks = newData.edges;
                    newNodes = {};
                    for (var i = 0; i < newData.nodes.length; i++) {
                        newNodes[newData.nodes[i]] = allForceData.nodes[newData.nodes[i]];
                    }
                }

                for (var prop in newNodes) {
                    obj = $.extend({}, newNodes[prop]);
                    obj.id = prop;
                    nodes.push(obj);
                }

                newLinks.forEach(function (link) {
                    //depending on if the link.source & link.target are already pointing to
                    //strings or object instances
                    link.source = findNode(link.source) || findNode(link.source.id);
                    link.target = findNode(link.target) || findNode(link.target.id);
                    links.push(link);
                });

                update(sliderValue);
            }

            scope.setSliderInitial = function (v) {

                if (previousState === "Final") {
                    setInitialFromFinal(v);
                } else if (previousState === "Transition") {
                    setInitialFromTransition();
                }

                previousState = "Initial";
            };

            scope.setSliderFinal = function (v) {
                if (previousState === "Initial") {
                    setFinalFromInitial(v);
                } else if (previousState === "Transition") {
                    setFinalFromTransition();
                }

                previousState = "Final";
            };

            scope.sliderChange = function (v) {
                if (previousState === "Initial") {
                    v = v ? v : 0;
                    $rootScope.$broadcast('timelineforcegraph.reset-slider', v);
                    setTransitionFromInitial(v);
                } else if (previousState === "Final") {
                    var max = networkTimelineService.getMaxLOE() === 1 ? 1 : networkTimelineService.getMaxLOE() + 1;
                    v = v ? v : max;
                    $rootScope.$broadcast('timelineforcegraph.reset-slider', v);
                    setTransitionFromFinal(v);
                }
                updateEdgeColor(v, getDependentICDs(v));
                updateNodeColor(v, getDependentICDs(v));

                previousState = "Transition";
            };

            function setInitialFromFinal(sliderVal) {
                var diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()));
                var diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getFinalEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()))));

                setForceData({
                    nodes: diffNodes,
                    edges: diffLinks
                }, sliderVal, "Initial");

                diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()));
                diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getInitialEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()))));

                removeEdges(diffLinks);
                removeNodes(diffNodes);

                toggleInterfaceInfoBox("Initial");
                update(sliderVal);
            }

            function setInitialFromTransition() {
                var diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()));
                var diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getInitialEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()))));

                removeEdges(diffLinks);
                removeNodes(diffNodes);

                updateEdgeColor(0, getDependentICDs(0));
                updateNodeColor(0, getDependentICDs(0));

                toggleInterfaceInfoBox("Initial");
                update(0);
            }

            function setFinalFromInitial(sliderVal) {
                var diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()));
                var diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getInitialEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()))));

                setForceData({
                    nodes: diffNodes,
                    edges: diffLinks
                }, sliderVal, "Final");

                diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()));
                diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getFinalEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()))));

                removeEdges(diffLinks);
                removeNodes(diffNodes);

                toggleInterfaceInfoBox("Final");
                update(sliderVal);
            }

            function setFinalFromTransition() {
                var diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()));
                var diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getFinalEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()))));

                removeEdges(diffLinks);
                removeNodes(diffNodes);

                var maxSliderVal = networkTimelineService.getMaxLOE() === 1 ? 1 : networkTimelineService.getMaxLOE() + 1;

                updateEdgeColor(maxSliderVal, getDependentICDs(maxSliderVal));
                updateNodeColor(maxSliderVal, getDependentICDs(maxSliderVal));

                toggleInterfaceInfoBox("Final");
                update(maxSliderVal);
            }

            function setTransitionFromInitial(sliderVal) {
                var diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()));
                var diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getInitialEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getInitialNodes()))));

                setForceData({
                    nodes: diffNodes,
                    edges: diffLinks
                }, sliderVal, "Transition");

                createInterfaceInfoBox();
                toggleInterfaceInfoBox("Transition");
            }

            function setTransitionFromFinal(sliderVal) {
                var diffNodes = _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()));
                var diffLinks = _.difference(allForceData.edges, removeEdgesFromRemovedNodes(getFinalEdges(), _.difference(_.keys(allForceData.nodes), _.keys(getFinalNodes()))));

                setForceData({
                    nodes: diffNodes,
                    edges: diffLinks
                }, sliderVal, "Transition");

                createInterfaceInfoBox();
                toggleInterfaceInfoBox("Transition");
            }

            var xScale = d3.scale.linear()
                .domain([0, width])
                .range([0, width]);

            var yScale = d3.scale.linear()
                .domain([0, height])
                .range([0, height]);

            var rScale = d3.scale.linear()
                .rangeRound([8, 16])
                .nice();

            var lScale = d3.scale.linear()
                .range([1.5, 4.5]);

            /*** Configure zoom behaviour ***/
            var zoomer = d3.behavior.zoom()
                .scaleExtent([0.1, 10])
                .x(xScale)
                .y(yScale)
                .on("zoom", zoom);

            var force = d3.layout.force()
                .size([width, height])
                .gravity(.09) //attraction to the center of the screen and within the screen layout
                .linkDistance(60)
                .charge(-200) //amount of node repulsion(negative) or attraction(positive)
                .on("tick", tick);

            var drag = force.drag()
                .origin(function (d) {
                    return d;
                }) //center of circle
                .on("dragstart", dragstarted)
                .on('drag.force', dragged)
                .on("drag", dragged)
                .on("dragend", dragended);

            var svg = d3.select("#resizerRight-").append("svg")
                .attr("width", "100%")
                .attr("height", "100%");

            var graph = svg.append("g")
                .attr("class", "graph")
                .call(zoomer)
                .on("dblclick.zoom", null); //Attach zoom behaviour.

            var rect = graph.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "white")
                //make transparent (vs black if commented-out)
                .style("pointer-events", "all");
            //respond to mouse, even when transparent

            var vis = graph.append("g")
                .attr("class", "plotting-area");

            // Per-type markers, as they don't inherit styles.
            /*var defs = vis.append("defs").selectAll("marker")
             .data(["end"])
             .enter().append("marker")
             .attr("id", function (d) {
             return d;
             })
             .attr("viewBox", "0 -5 10 10")
             .attr("refX", 15)
             .attr("refY", -1.5)
             .attr("markerWidth", 6)
             .attr("markerHeight", 6)
             .attr("orient", "auto")
             .append("path")
             .attr("d", "M0,-5L10,0L0,5")
             .style("pointer-events", "none"); //no events need to be fired off of marker*/

            //add legend
            var legendBox = svg.append("g")
                .attr("class", "legend")
                .attr("height", 100)
                .attr("width", 100);

            var interfaceLegend;

            var node = vis.selectAll(".node"),
                link = vis.selectAll(".link");

            nodes = force.nodes();
            links = force.links();

            function update(sliderVal) {
                /*** Configure zoom behaviour ***/
                var zoomer = d3.behavior.zoom()
                    .scaleExtent([0.1, 10])
                    .x(xScale)
                    .y(yScale)
                    .on("zoom", zoom);

                //highlight adjacent -> will be moved to a click event
                links.forEach(function (d) {
                    linkedByIndex[d.source.id + "," + d.target.id] = 1;
                });

                //link update...
                link = link.data(links, function (d) {
                    return d.source.id + "-" + d.target.id;
                });

                //link enter...
                link.enter()
                    .insert("path", ".node") //paths should always be placed before the group of nodes/text
                    .attr("class", "link")
                    /*.attr("marker-end", function () {
                     return "url(#end)";
                     })*/
                    .attr("id", function (d, i) {
                        return "linkId_" + i;
                    })
                    .style("fill", "#666");

                link.style("stroke", function (d) {
                        var color = getPhaseColor(d, sliderVal, getDependentICDs(sliderVal));
                        if (color)
                            dataNetworkViz = true;
                        return color ? color : '#666';
                    })
                    .style("stroke-width", 1.5);

                //link exit...
                link.exit()
                    .transition().duration(500)
                    .remove();

                //node update...
                node = node.data(nodes, function (d) {
                    return d.id;
                });

                //node enter g...
                var nodeEnter = node.enter().append("g")
                    .attr("class", function (d) {
                        var label = d.propHash.VERTEX_LABEL_PROPERTY.replace(/"/g, "").replace(/'/g, "").replace(/\(|\)/g, "");
                        return "node " + label + " " + d.id;
                    })
                    .call(drag);

                //node enter circle...
                nodeEnter.append("circle")
                    .attr("class", "node")
                    .attr("r", 0).transition().duration(1000)
                    .attr("r", 8)
                    .attr("fill", function (d) {
                        sliderVal = sliderVal || 0;
                        var color = getPhaseColor(d, sliderVal, getDependentICDs(sliderVal));
                        if (d.propHash.VERTEX_TYPE_PROPERTY === "SystemInterface") {
                            return color || "#9467bd";
                        }
                        else {
                            return color || ("rgb(" + d.propHash.VERTEX_COLOR_PROPERTY + ")");
                        }
                    })
                    .attr("stroke", "#777")
                    .attr("stroke-width", 1.5)
                    .attr("data-legend", function (d) {
                        return d.propHash.VERTEX_COLOR_PROPERTY;
                    });

                //node enter text...
                nodeEnter.append("text")
                    .attr("class", "nodetext")
                    .attr("x", 12)
                    .attr("dy", ".35em")
                    .attr("stroke", "none")
                    .style("font-size", "10px")
                    .text(function (d) {
                        return $filter('replaceUnderscores')(d.propHash.VERTEX_LABEL_PROPERTY);
                    });

                //node group removal with transition...
                node.exit()
                    .selectAll("circle")
                    .transition().duration(1000)
                    .attr("r", 0)
                    .remove();
                node.exit()
                    .selectAll("text")
                    .transition().duration(1000)
                    .style("font-size", "0px")
                    .remove();
                node.exit().transition().delay(1000).remove();

                //set up legendNodes array for legend
                var flags = {};
                legendNodes = nodes.filter(function (node) {
                    if (flags[node.propHash.VERTEX_TYPE_PROPERTY]) {
                        return false;
                    }
                    flags[node.propHash.VERTEX_TYPE_PROPERTY] = true;
                    return true;
                });

                //legend update...
                var legend = legendBox.selectAll('circle')
                    .data(legendNodes, function (d) {
                        return d.propHash.VERTEX_TYPE_PROPERTY;
                    });

                //legend enter...
                legend.enter()
                    .append("circle")
                    .attr("r", 0)
                    .transition().duration(1000)
                    .attr("r", 6)
                    .attr("stroke-width", 1)
                    .attr("stroke", function (d) {
                        if (d.propHash.VERTEX_TYPE_PROPERTY === "SystemInterface") {
                            return "#9467bd";
                        }
                        else {
                            return ("rgb(" + d.propHash.VERTEX_COLOR_PROPERTY + ")");
                        }
                    })
                    .attr("transform", function (d, i) {
                        return "translate(20," + ((i * 20) + 25) + ")";
                    })
                    .style("fill", function (d) {
                        if (d.propHash.VERTEX_TYPE_PROPERTY === "SystemInterface") {
                            return "#9467bd";
                        }
                        else {
                            return ("rgb(" + d.propHash.VERTEX_COLOR_PROPERTY + ")");
                        }
                    });

                //legend exit...(move below with legendText exit?)
                legend.exit().transition()
                    .attr("r", 0)
                    .remove();

                //legendText update...
                var legendText = legendBox.selectAll('text')
                    .data(legendNodes, function (d) {
                        return d.propHash.VERTEX_TYPE_PROPERTY;
                    });

                //legendText enter...
                legendText.enter()
                    .append("text")
                    .transition().duration(1000)
                    .attr("x", 12)
                    .attr("transform", function (d, i) {
                        return "translate(20," + ((i * 20) + 29) + ")";
                    })
                    .text(function (d) {
                        return d.propHash.VERTEX_TYPE_PROPERTY;
                    });

                //legendText exit...
                legendText.exit().transition()
                    .remove();

                force.start();
            }

            function createInterfaceInfoBox() {
                interfaceCounts = [{"Interfaces Added": 0}, {"Interfaces Decommissioned": 0}];
                nodes.forEach(function (node) {
                    var systemInterfaceCheck = (node.propHash.VERTEX_TYPE_PROPERTY === "SystemInterface");
                    if (dataNetworkViz)
                        systemInterfaceCheck = true;
                    if (node.propHash.timeHash !== undefined && systemInterfaceCheck) {
                        var index = 1;
                        var label = "Interfaces Decommissioned";
                        var keyArray = _.keys(node.propHash.timeHash);
                        if (keyArray.indexOf("Decommissioned") === -1) {
                            index = 0;
                            label = "Interfaces Added";
                        }
                        interfaceCounts[index][label] = interfaceCounts[index][label] + 1;
                    }
                });

                interfaceLegend = svg.append("g")
                    .attr("class", "interfaceLegend")
                    .attr("height", 100)
                    .attr("width", 250)
                    .attr("x", 20)
                    .attr("y", height - 115)
                    .attr("transform", "translate(" + 0 + "," + (height - 105) + ")");

                var interfaceLegendContainer = interfaceLegend.append("rect")
                    .transition().duration(500)
                    .attr("transform", "translate(" + 20 + "," + 0 + ")")
                    .attr("fill", "transparent")
                    .attr("stroke", "#CCC")
                    .attr("height", 60)
                    .attr("width", 200)
                    .attr("rx", 10)
                    .attr("ry", 10);

                var interfaceLegendText = interfaceLegend.selectAll('text')
                    .data(interfaceCounts);

                //legendText enter...
                interfaceLegendText.enter()
                    .append("text")
                    .transition().duration(500)
                    .attr("x", 12)
                    .attr("transform", function (d, i) {
                        return "translate(" + 20 + "," + ((i * 20) + 24) + ")";
                    })
                    .text(function (d, i) {
                        if (dataNetworkViz) {
                            if (i === 0)
                                return "Systems Added: 1";
                            else
                                return "Systems Decommissioned: " + d[_.keys(d)[0]];
                        }
                        return _.keys(d)[0] + ": " + d[_.keys(d)[0]];
                    });

                //legendText exit...
                interfaceLegendText.exit().transition()
                    .remove();
            }

            function toggleInterfaceInfoBox(state) {
                var selection = d3.select(".interfaceLegend");
                if (selection !== undefined) {
                    if (state !== "Transition")
                        selection.remove();
                }
            }

            //removes the edges that are connected to nodes that have been removed
            function removeEdgesFromRemovedNodes(edges, removedNodes) {
                var returnEdges = [];

                //loops through edges, if the edge is linked to the removed node (boolean) then it does not get returned
                for (var i = 0; i < edges.length; i++) {
                    for (var j = 0; j < removedNodes.length; j++) {
                        var linkedToRemovedNode = false;
                        if ((edges[i].source === removedNodes[j] || edges[i].source.id === removedNodes[j]) || (edges[i].target === removedNodes[j] || edges[i].target.id === removedNodes[j])) {
                            linkedToRemovedNode = true;
                            break;
                        }
                    }

                    if (!linkedToRemovedNode) {
                        returnEdges.push(edges[i]);
                    }
                }

                return returnEdges;
            }

            function getInitialEdges() {
                var edges = [];
                for (var i = 0; i < allForceData.edges.length; i++) {
                    if (!allForceData.edges[i].propHash.timeHash || (allForceData.edges[i].propHash.timeHash && allForceData.edges[i].propHash.timeHash["Decommissioned"])) {
                        edges.push(allForceData.edges[i]);
                    }
                }

                return edges;
            }

            function getFinalEdges() {
                var edges = [];
                for (var i = 0; i < allForceData.edges.length; i++) {
                    if (!allForceData.edges[i].propHash.timeHash || (allForceData.edges[i].propHash.timeHash && !allForceData.edges[i].propHash.timeHash["Decommissioned"])) {
                        edges.push(allForceData.edges[i]);
                    }
                }

                return edges;
            }

            function getInitialNodes() {
                var returnNodes = {};
                var initialEdges = getInitialEdges();

                //check if it nodes and/or edges have timeHash
                var nodesTimeHash = networkTimelineService.hasTimeHash(allForceData.nodes);
                var edgesTimeHash = networkTimelineService.hasTimeHash(allForceData.edges);

                if (nodesTimeHash && edgesTimeHash) {
                    timeHashLocation = "Both";
                } else if (nodesTimeHash || "") {
                    timeHashLocation = "Nodes";
                } else if (edgesTimeHash) {
                    timeHashLocation = "Edges";
                }

                //goes through all nodes and only return ones that don't have a timeHash or have a timeHash with Decommissioned
                for (var node in allForceData.nodes) {
                    if (!allForceData.nodes[node].propHash.timeHash || (allForceData.nodes[node].propHash.timeHash && allForceData.nodes[node].propHash.timeHash["Decommissioned"])) {
                        returnNodes[node] = allForceData.nodes[node];
                    }
                }

                //check all nodes to make sure that the edges of those nodes don't all have timeHash properties
                for (var node in returnNodes) {
                    //set the boolean to true so we are making the assumption there is only nonTimeHash
                    var bool = false;
                    //find the set of inEdges for the given node
                    var inEdges = _.filter(initialEdges, function (edge) {
                        return (edge.target.uri === node);
                    });
                    for (var j = 0; j < inEdges.length; j++) {
                        if (timeHashLocation === "Nodes") {
                            //check the nodes for timeHash
                            var connectedNode = findNodeinAllNodes(inEdges[j].source.uri);
                            bool = checkForNonTimeHash(connectedNode);
                            if (bool) {
                                break;
                            }
                        }
                        if (timeHashLocation === "Edges" || timeHashLocation === "Both") {
                            //check edges themselves for timeHash
                            bool = checkForNonTimeHash(inEdges[j]);
                            if (bool) {
                                break;
                            }
                        }
                    }

                    if (!bool) {
                        //find the set of outEdges for the given node
                        var outEdges = _.filter(initialEdges, function (edge) {
                            return (edge.source.uri === node);
                        });
                        for (var j = 0; j < outEdges.length; j++) {

                            if (timeHashLocation === "Nodes") {
                                //check nodes
                                var connectedNode = findNodeinAllNodes(outEdges[j].target.uri);
                                bool = checkForNonTimeHash(connectedNode);
                                if (bool) {
                                    break;
                                }
                            }

                            if (timeHashLocation === "Edges" || timeHashLocation === "Both") {
                                //check edges themselves for timeHash
                                bool = checkForNonTimeHash(outEdges[j]);
                                if (bool) {
                                    break;
                                }
                            }

                        }
                    }

                    //check for DHMSM node. not displaying this on initial state.
                    if (!bool) {
                        if ($filter('shortenValueFilter')(node) === "MHS_GENESIS") {
                            bool = false;
                            if (dataNetworkViz) {
                                delete initialNodes[node];
                            }
                        }
                    }

                    if (!bool) {
                        delete returnNodes[node];
                    }
                }
                if (dataNetworkViz)
                    return initialNodes;
                return returnNodes;
            }

            function checkForNonTimeHash(item) {
                var bool = false;
                if (!item.propHash.timeHash || (item.propHash.timeHash && item.propHash.timeHash["Decommissioned"])) {
                    bool = true;
                }
                return bool;
            }

            function findNodeinAllNodes(id) {
                for (var i in allForceData.nodes) {
                    if (allForceData.nodes[i]["uri"] === id)
                        return allForceData.nodes[i];
                }
            }

            function getFinalNodes() {
                var returnNodes = {};
                var finalEdges = getFinalEdges();

                if (timeHashLocation === "Nodes") {
                    for (var node in allForceData.nodes) {
                        if (!allForceData.nodes[node].propHash.timeHash || (allForceData.nodes[node].propHash.timeHash && !allForceData.nodes[node].propHash.timeHash["Decommissioned"])) {
                            returnNodes[node] = allForceData.nodes[node];
                        }
                    }
                    for (var node in returnNodes) {
                        var hasNormalConnection = false;
                        //find the set of inEdges for the given node
                        var inEdges = _.filter(finalEdges, function (edge) {
                            return (edge.target.uri === node);
                        });
                        for (var i = 0; i < inEdges.length; i++) {
                            var connectedNode = findNodeinAllNodes(inEdges[i].source.uri);
                            if (connectedNode.propHash.timeHash && connectedNode.propHash.timeHash["Decommissioned"]) {
                                continue;
                            } else {
                                hasNormalConnection = true;
                                break;
                            }
                        }
                        if (!hasNormalConnection) {
                            //find the set of outEdges for the given node
                            var outEdges = _.filter(finalEdges, function (edge) {
                                return (edge.source.uri === node);
                            });
                            for (var i = 0; i < outEdges.length; i++) {
                                var connectedNode = findNodeinAllNodes(outEdges[i].target.uri);
                                if (connectedNode.propHash.timeHash && connectedNode.propHash.timeHash["Decommissioned"]) {
                                    continue;
                                } else {
                                    hasNormalConnection = true;
                                    break;
                                }

                            }
                        }
                        if (!hasNormalConnection) {
                            delete returnNodes[node];
                        }
                    }
                } else if (timeHashLocation === "Edges") {
                    //loop through all nodes, looking at all the edges that node has and then making sure not all edges have a timeHash with Decommissioned
                    for (var node in allForceData.nodes) {
                        var hasNormalEdge = false;
                        //find the set of inEdges for the given node
                        var inEdges = _.filter(finalEdges, function (edge) {
                            return (edge.target.uri === node);
                        });
                        for (var i = 0; i < inEdges.length; i++) {
                            if (inEdges[i].propHash.timeHash && inEdges[i].propHash.timeHash["Decommissioned"]) {
                                continue;
                            }
                            //assume we run into an edge that's not decommissioned
                            else {
                                hasNormalEdge = true;
                                break;
                            }
                        }

                        if (!hasNormalEdge) {
                            //find the set of outEdges for the given node
                            var outEdges = _.filter(finalEdges, function (edge) {
                                return (edge.source.uri === node);
                            });
                            for (var i = 0; i < outEdges.length; i++) {
                                if (outEdges[i].propHash.timeHash && outEdges[i].propHash.timeHash["Decommissioned"]) {
                                    continue;
                                }
                                //assume we run into an edge that's not decommissioned
                                else {
                                    hasNormalEdge = true;
                                    break;
                                }

                            }
                        }

                        if (hasNormalEdge) {
                            returnNodes[node] = allForceData.nodes[node];
                        }
                    }
                } else if (timeHashLocation == "Both") {
                    var initialNodesSet = {};
                    //loop through all nodes and remove the nodes and only add ones that do not get decommissioned
                    for (var node in allForceData.nodes) {
                        if (!allForceData.nodes[node].propHash.timeHash || (allForceData.nodes[node].propHash.timeHash && !allForceData.nodes[node].propHash.timeHash["Decommissioned"])) {
                            initialNodesSet[node] = allForceData.nodes[node];
                        }
                    }

                    //loop through the nodes and return nodes that have edges that aren't decommissioned and have connections with nodes that aren't decommissioned
                    for (var node in initialNodesSet) {
                        var hasNormalEdge = false;
                        //find the set of inEdges for the given node
                        var inEdges = _.filter(finalEdges, function (edge) {
                            return (edge.target.uri === node);
                        });
                        for (var i = 0; i < inEdges.length; i++) {
                            var connectedNode = findNodeinAllNodes(inEdges[i].source.uri);
                            if ((inEdges[i].propHash.timeHash && inEdges[i].propHash.timeHash["Decommissioned"]) || (connectedNode.propHash.timeHash && connectedNode.propHash.timeHash["Decommissioned"])) {
                                continue;
                            }
                            //assume we run into an edge that's not decommissioned
                            else {
                                hasNormalEdge = true;
                                break;
                            }
                        }

                        //if the inEdge array didn't have any normal edges check the outEdge
                        if (!hasNormalEdge) {
                            //find the set of outEdges for the given node
                            var outEdges = _.filter(finalEdges, function (edge) {
                                return (edge.source.uri === node);
                            });
                            for (var i = 0; i < outEdges.length; i++) {
                                var connectedNode = findNodeinAllNodes(outEdges[i].source.uri);
                                if ((outEdges[i].propHash.timeHash && outEdges[i].propHash.timeHash["Decommissioned"]) || (connectedNode.propHash.timeHash && connectedNode.propHash.timeHash["Decommissioned"])) {
                                    continue;
                                }
                                //assume we run into an edge that's not decommissioned
                                else {
                                    hasNormalEdge = true;
                                    break;
                                }
                            }
                        }

                        if (hasNormalEdge) {
                            returnNodes[node] = initialNodesSet[node];
                        }
                    }
                }
                return returnNodes;
            }

            //remove edges
            function removeEdges(linksToRemove) {
                for (var j = 0; j < linksToRemove.length; j++) {
                    for (var i = 0; i < links.length; i++) {
                        if (links[i].source.id == linksToRemove[j].source.id && links[i].target.id == linksToRemove[j].target.id) {
                            links.splice(i, 1);
                        }
                    }
                }
            }

            //remove node and all it's connected links
            function removeNodes(nodesToRemove) {
                for (var j = 0; j < nodesToRemove.length; j++) {
                    var i = 0,
                        n = findNode(nodesToRemove[j]);
                    while (i < links.length) {
                        if ((links[i]['source'] == n) || (links[i]['target'] == n)) {
                            links.splice(i, 1);
                        } else {
                            i++;
                        }
                    }
                    var idArray = _.map(nodes, "id");
                    var index = idArray.indexOf(nodesToRemove[j]);
                    nodes.splice(index, 1);
                }
            }

            function updateEdgeColor(sliderValue, dependICDs) {
                d3.selectAll(".link")
                    .style("stroke", function (d) {
                        var color = getPhaseColor(d, sliderValue, dependICDs);
                        if (color)
                            dataNetworkViz = true;
                        return color ? color : '#666';
                    })
                    .style("fill", function (d) {
                        var color = getPhaseColor(d, sliderValue, dependICDs);
                        if (color)
                            dataNetworkViz = true;
                        return color ? color : '#666';
                    });
            }

            function updateNodeColor(sliderValue, dependICDs) {
                d3.selectAll(".node circle")
                    .attr("fill", function (d) {
                        var color = getPhaseColor(d, sliderValue, dependICDs);
                        if (d.propHash.VERTEX_TYPE_PROPERTY === "SystemInterface") {
                            return color ? color : "#9467bd";
                        }
                        else {
                            return color ? color : ("rgb(" + d.propHash.VERTEX_COLOR_PROPERTY + ")");
                        }

                    });
            }

            function getDependentICDs(sliderValue) {
                var dependICDs = [];

                //looping through all nodes to find the dependent ICDs based on where the slider is
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].propHash.timeHash && !nodes[i].propHash.timeHash["Decommissioned"]) {
                        for (var phase in nodes[i].propHash.timeHash) {
                            if (nodes[i].propHash.timeHash[phase].totalLOE < sliderValue && sliderValue > nodes[i].propHash.timeHash[phase].startLOE && phase == "Completed") {
                                for (var icd in nodes[i].propHash.timeHash[phase].dependICDS) {
                                    dependICDs.push(nodes[i].propHash.timeHash[phase].dependICDS[icd]);
                                }
                            }
                        }
                    }
                }

                //looping through all links to find the dependent ICDs based on where the slider is
                for (var i = 0; i < links.length; i++) {
                    if (links[i].propHash.timeHash && !links[i].propHash.timeHash["Decommissioned"]) {
                        for (var phase in links[i].propHash.timeHash) {
                            if (links[i].propHash.timeHash[phase].totalLOE < sliderValue && sliderValue > links[i].propHash.timeHash[phase].startLOE && phase == "Completed") {
                                for (var icd in links[i].propHash.timeHash[phase].dependICDS) {
                                    dependICDs.push(links[i].propHash.timeHash[phase].dependICDS[icd]);
                                }
                            }
                        }
                    }
                }

                return dependICDs;
            }

            function getPhaseColor(item, sliderValue, dependentICDs) {
                var color;
                if (item.propHash.timeHash) {

                    if (item.propHash.timeHash["Decommissioned"]) {
                        if (_.includes(dependentICDs, item.uri) || sliderValue >= networkTimelineService.getMaxLOE()) {
                            color = "#FF0000";
                        }
                    } else {
                        for (var phase in item.propHash.timeHash) {
                            if (item.propHash.timeHash[phase].totalLOE >= sliderValue && sliderValue > item.propHash.timeHash[phase].startLOE) {

                                if (phase == "Requirements") {
                                    color = "#ECF6BD";
                                } else if (phase == "Design") {
                                    color = "#C5E5A0";
                                } else if (phase == "Develop") {
                                    color = "#9FD483";
                                } else if (phase == "Test") {
                                    color = "#79C366";
                                } else if (phase == "Deploy") {
                                    color = "#52B149";
                                } else if (phase == "Completed") {

                                    if (item.propHash.VERTEX_TYPE_PROPERTY === "SystemInterface") {
                                        color = "#9467bd";
                                    }
                                    else {
                                        color = ("rgb(" + item.propHash.VERTEX_COLOR_PROPERTY + ")");
                                    }
                                }
                                //will color the node the initial color at beginning of requirements
                            } else if (sliderValue == 0 && sliderValue == item.propHash.timeHash[phase].startLOE && phase == "Requirements") {
                                color = "#ECF6BD";
                            }
                        }
                    }
                }
                return color;
            }

            //find node by 'id' within nodes array
            function findNode(id) {
                for (var i in nodes) {
                    if (nodes[i]["id"] === id)
                        return nodes[i];
                }
            }

            //Please comment
            function zoom() {
                tick();
            }

            //Please comment
            function tick() {
                link.attr("d", linkArc);
                node.attr("transform", function (d) {
                    return "translate(" + xScale(d.x) + "," + yScale(d.y) + ")";
                });
            }

            //create curved paths between nodes
            function linkArc(d) {
                var dx = xScale(d.target.x) - xScale(d.source.x),
                    dy = yScale(d.target.y) - yScale(d.source.y),
                    dr = Math.sqrt(dx * dx + dy * dy),
                    theta = Math.atan2(dy, dx) + Math.PI / 7.85,
                    d90 = Math.PI / 2,
                    dtxs = xScale(d.target.x) - 6 * Math.cos(theta),
                    dtys = yScale(d.target.y) - 6 * Math.sin(theta);

                return "M" + xScale(d.source.x) + "," + yScale(d.source.y) + "A" + dr + "," + dr + " 0 0 1," + xScale(d.target.x) + "," + yScale(d.target.y) + "A" + dr + "," + dr + " 0 0 0," + xScale(d.source.x) + "," + yScale(d.source.y) + "M" + dtxs + "," + dtys + "l" + (3.5 * Math.cos(d90 - theta) - 10 * Math.cos(theta)) + "," + (-3.5 * Math.sin(d90 - theta) - 10 * Math.sin(theta)) + "L" + (dtxs - 3.5 * Math.cos(d90 - theta) - 10 * Math.cos(theta)) + "," + (dtys + 3.5 * Math.sin(d90 - theta) - 10 * Math.sin(theta)) + "z";
            }

            scope.chartCtrl.resizeViz = function () {
                var newWidth = parseInt(d3.select('.sidebarContentRight').style('width')),
                    newHeight = parseInt(d3.select('.sidebarContentRight').style('height'));

                height = newHeight;
                width = newWidth;

                svg.attr("width", "100%")
                    .attr("height", "100%");
                rect.attr("width", newWidth)
                    .attr("height", newHeight);
                if (interfaceLegend) {
                    interfaceLegend.attr("transform", "translate(" + 0 + "," + (newHeight - 105) + ")");
                }
                force.size([newWidth, newHeight]).resume();
            };

            //Please comment
            function dragstarted(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed("dragging", true);
            }

            //Please comment
            function dragged(d) {
                var mouse = d3.mouse(vis.node());
                d.x = xScale.invert(mouse[0]);
                d.y = yScale.invert(mouse[1]);
                d.px = xScale.invert(mouse[0]);
                d.py = yScale.invert(mouse[1]);
                force.resume();

                tick(); //re-position this node and any links
            }

            //Please comment
            function dragended(d) {
                d3.select(this).classed("dragging", false);
            }

            /*scope.$on('freeze-nodes', function () {
             freezeAllNodes(d3.values(nodes));
             });

             scope.$on('unfreeze-nodes', function () {
             unfreezeAllNodes(d3.values(nodes));
             });*/

            /**
             * @name freezeAllNodes
             * @desc freeze all force nodes
             */
            function freezeAllNodes() {
                var nodeVals = d3.values(nodes);
                var nodesLength = nodeVals.length;

                for (var i = 0; i < nodesLength; i++) {
                    nodeVals[i].fixed = true;
                }
            }

            /**
             * @name unfreezeAllNodes
             * @desc unfreeze all force nodes
             */
            function unfreezeAllNodes() {
                var nodeVals = d3.values(nodes);
                var nodesLength = nodeVals.length;
                for (var i = 0; i < nodesLength; i++) {
                    nodeVals[i].fixed = false;
                }
                force.start();
            }

            d3.select(window).on("resize.timeline", scope.chartCtrl.resizeViz);

            //listeners
            var networkTimelineForceGraphListner = $rootScope.$on('network-timeline-forcegraph-receive', function (event, message) {
                if (message === 'update-data') {
                    console.log('%cPUBSUB:', "color:blue", message);
                    dataProcessor();
                }
            });

            scope.$on("destroy", function timelineforcegraph() {
                d3.select(window).on("resize.timeline", null);
                networkTimelineForceGraphListner();
                sliderChangeCleanUpFunc();
                resizeCleanUpFunc();
            });

            scope.networkCtrl.updateForceStateAndSlider = function (state, value) {
                if (state === 'Transition') {
                    scope.sliderChange(value);
                } else if (state === 'Initial') {
                    scope.setSliderInitial();
                } else if (state === 'Final') {
                    scope.setSliderFinal(value);
                }
            };

            scope.networkCtrl.toggleForceLabel = function (label) {
                if (label === true) {
                    d3.selectAll(".nodetext")
                        .attr("class", "nodetext show");
                } else {
                    d3.selectAll(".nodetext")
                        .attr("class", "nodetext hide");
                }
            };

            scope.networkCtrl.unfreezeNodes = unfreezeAllNodes;

            scope.networkCtrl.freezeNodes = freezeAllNodes;

            /*scope.networkCtrl.setCurrentLabels = function() {

             };*/

        }

        function timelineforcegraphController($scope) {

        }

    }

})();
