(function () {
    "use strict";

    angular.module("app.force-graph.directive", [])
        .directive("forceGraph", forceGraph);

    forceGraph.$inject = ["$rootScope", "$location", "monolithService", "_", "$filter", "forceGraphService", '$compile', 'alertService', 'pkqlService', 'dataService'];

    function forceGraph($rootScope, $location, monolithService, _, $filter, forceGraphService, $compile, alertService, pkqlService, dataService) {

        forceGraphLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        forceGraphCtrl.$inject = ["$scope"];

        return {
            restrict: 'A',
            require: ['chart'],
            controller: forceGraphCtrl,
            link: forceGraphLink,
            templateUrl: 'custom/force-graph/force-graph.directive.html',
            priority: 300
        };

        function forceGraphLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];
            scope.chartCtrl.forcegraph = {};

            var html = '<div class="append-viz" id=' + scope.chartCtrl.chartName + "-append-viz" + '><div class="absolute-size" id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            scope.chartCtrl.forcegraph.labelToggle = true;

            scope.chartCtrl.forcegraph.forceGraphOptions = {
                chartData: {},
                currentLabels: {},
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
                filteredData: {},
                completeGraphData: {},
                graph: {
                    nodeResizeProperties: [],
                    edgeResizeProperties: []
                },
                node: {
                    properties: []
                }
            };

            scope.isNewGraph = {
                value: false,
                undoCounter: 0,
                redoCounter: 0,
                redo: false,
                undo: false,
                redoBtnFlag: false,
                undoBtnFlag: false
            };

            //widget functions
            scope.chartCtrl.dataProcessor = function (newData, oldData) {
                //disable comment mode in forcegraph
                scope.chartCtrl.disableMode(['comment']);

                newData = JSON.parse(JSON.stringify(newData));
                if (!scope.chartCtrl.vizInput) {
                    scope.chartCtrl.vizInput = { updateType: "" };
                }
                //if its a different  questions, meaning it was a related insight, need to create new graph
                if (!oldData || newData.insightID !== oldData.insightID) {
                    scope.chartCtrl.vizInput.updateType = "new";
                }
                if (scope.chartCtrl.vizInput && scope.chartCtrl.vizInput.updateType === "undo") {
                    var removalData = forceGraphService.getRemovalGraphData(newData, oldData);
                    updateGraph(removalData);
                } else if (scope.chartCtrl.vizInput && (scope.chartCtrl.vizInput.updateType === "redo" || scope.chartCtrl.vizInput.updateType === "traverse")) {
                    var newAdditionalData = forceGraphService.getAdditionalGraphData(newData, oldData);
                    updateGraph(newAdditionalData);
                } else { // updateType == "new"
                    scope.chartCtrl.data = newData;
                    updateGraph(JSON.parse(JSON.stringify(scope.chartCtrl.data)));
                }

                if (newData.uiOptions) {
                    //Prop Table Hide / Show
                    if (newData.uiOptions.hasOwnProperty('propertiesTableToggle')) {
                        scope.toggleTable(newData.uiOptions.propertiesTableToggle);
                    }
                    //Lock / Unlock graph
                    if (newData.uiOptions.hasOwnProperty('graphLockToggle')) {
                        if (newData.uiOptions.graphLockToggle) {
                            scope.freezeAllNodes();
                        } else {
                            scope.unFreezeAllNodes();
                        }
                    }
                    //Edge Highlighting
                    if (newData.uiOptions.hasOwnProperty('highlightOption')) {

                    }
                    //Selected Node / Nodes
                    if (!_.isEmpty(newData.uiOptions.selectedNode)) {
                        selectedNodes.push(newData.uiOptions.selectedNode);
                    }
                }

            };

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                //need to invoke tool functions
                scope[toolUpdateConfig.fn](toolUpdateConfig.args);
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartCtrl.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartCtrl.resizeViz = function () {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);

                svg.attr("width", scope.chartCtrl.container.width)
                    .attr("height", scope.chartCtrl.container.height);
                svg.selectAll(".header-box")
                    .selectAll("text")
                    .attr("transform", function (d, i) {
                        return "translate(" + (scope.chartCtrl.container.width / 2) + "," + (19) + ")";
                    });
                svg.selectAll(".footer-box")
                    .selectAll("text")
                    .attr("transform", function (d, i) {
                        return "translate(" + (scope.chartCtrl.container.width / 2) + "," + (scope.chartCtrl.container.height - 10) + ")";
                    });

                rect.attr("width", scope.chartCtrl.container.width)
                    .attr("height", scope.chartCtrl.container.height);

                container.attr("width", width)
                    .attr("height", scope.chartCtrl.container.height);

                force.size([scope.chartCtrl.container.width, scope.chartCtrl.container.height]).resume();
            };

            scope.chartCtrl.forcegraph.setCurrentLabels = function (type, value) {
                scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels[type] = value;
                updateLabels();
            };

            // This function sets up the data we ng-repeat through in the Type Label table. It needs to be called when chartData is updated.
            var setGraphLabels = function (data) {
                var labelTypes = JSON.parse(JSON.stringify(scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels));

                for (var indNode in data.nodes) {
                    var nodeType = data.nodes[indNode].propHash.VERTEX_TYPE_PROPERTY;
                    // If our type isn't in our current labels object, add it.
                    if (!scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels[nodeType]) {
                        var valueArray = [];
                        valueArray.length = 0;
                        var currentLabelSelected = "VERTEX_LABEL_PROPERTY";
                        for (var key in data.nodes[indNode].propHash) {
                            valueArray.push(key);
                            if (key === labelTypes[nodeType]) {
                                currentLabelSelected = key;
                            }
                        }
                        scope.chartCtrl.forcegraph.forceGraphOptions.type.properties.push({
                            name: nodeType,
                            values: valueArray,
                            selected: currentLabelSelected
                        });

                        if (!labelTypes[nodeType]) {
                            scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels[nodeType] = "VERTEX_LABEL_PROPERTY";
                        } else {
                            for (var type in labelTypes) {
                                if (nodeType === type) {
                                    scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels[nodeType] = labelTypes[type];
                                }
                            }
                        }
                    }
                }
                updateLabels();
            };

            /**
             * @name setPropTable
             * @params nodeData
             * @desc sets values in the propTable
             */
            function setPropTable(nodeData) {
                scope.chartCtrl.forcegraph.forceGraphOptions.node.properties = [];

                //check to see if multiple nodes were selected
                if (nodeData.data.length === 1) {
                    //add node properties to this.node.properties - these properties are shown in table on page
                    for (var key in nodeData.data[0].propHash) {
                        if (_.isObject(nodeData.data[0].propHash[key])) {
                            scope.chartCtrl.forcegraph.forceGraphOptions.node.properties.push({
                                name: key,
                                value: nodeData.data[0].propHash[key].label
                            });
                        } else {
                            if (key !== "VERTEX_COLOR_PROPERTY") {
                                scope.chartCtrl.forcegraph.forceGraphOptions.node.properties.push({
                                    name: key,
                                    value: nodeData.data[0].propHash[key]
                                });
                            }
                        }
                    }
                }
            }

            /**
             * @name toggleTable
             * @params toggle {boolean} - true: show table, false: hide table
             * @desc toggles the properties table on or off
             */
            scope.toggleTable = function (toggle) {
                scope.chartCtrl.forcegraph.forceGraphOptions.showPropertiesTable = toggle;
            };

            var links = [],
                nodes = [],
                newNodes = [],
                newLinks = [],
                obj = {},
                linkedByIndex = {},
                legendNodes = [],
                newLegendNodes = [],
                legendNodeCounts = {},
                selectedNodes = [],
                dataLatencyObject = {};

            /*** Start of exposed API to communicate with ForceGraph ***/
            scope.chartCtrl.forcegraph.internalControl = {};

            scope.chartCtrl.forcegraph.internalControl.toggleAllLabelSwitch = function () {
                toggleLabels();
            };

            scope.chartCtrl.forcegraph.internalControl.resetNodeProps = function (nodes) {
                nodes.forEach(function (nodeObj) {
                    nodeObj.selected = false;
                });
                scope.resetNodeResizeProps();
            };

            scope.resetNodeResizeProps = function () {
                node.each(function (d, i) {
                    //reset 'r' of nodes to default size of '8'
                    d3.select(this).select('circle')
                        .attr('r', 8)
                        .attr('opacity', 1);
                    d3.select(this).select('text')
                        .attr("opacity", 1);
                });
            };

            scope.clearSelectedNodes = function () {
                selectedNodes = [];
                var allCircles = d3.selectAll("circle.node").filter("." + scope.chartCtrl.chartName);
                //set all circles (and previously selected nodes) to default stroke & stroke-width
                allCircles.attr({
                    "stroke": "#777",
                    "stroke-width": 1.5
                });

                //clear legend selections
                d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
                    .attr("stroke-width", 0)
                    .attr("stroke", function (node) {
                        return node.propHash.VERTEX_TYPE_PROPERTY;
                    });
            };

            scope.chartCtrl.forcegraph.internalControl.nodeResizeProperty = function (nodeProp) {
                //array to keep track of all elements associated with the selected property
                var nodeDomainArray = [];

                //find all nodes with 'nodeProp.propName' and set their 'r' after passing to rScale domain
                node.each(function (d, i) {
                    //populate array with values of selected property
                    if (d.propHash[nodeProp.propName]) {
                        nodeDomainArray.push(d);
                    }
                    //reset 'r' of nodes to default size of '8'
                    d3.select(this).select('circle')
                        .transition().duration(1000)
                        .attr('r', 8);
                });

                //set rScale domain based on domainArray just collected
                if (nodeDomainArray.length > 0) {
                    rScale.domain([d3.min(nodeDomainArray, function (node) {
                        return +node.propHash[nodeProp.propName];
                    }) - 1, d3.max(nodeDomainArray, function (node) {
                        return +node.propHash[nodeProp.propName];
                    })]);
                    node.each(function (d, i) {
                        if (d.propHash[nodeProp.propName]) {
                            d3.select(this).select('circle')
                                .transition().duration(1000)
                                .attr('r', function (d) {
                                    return rScale(d.propHash[nodeProp.propName]);
                                });
                        } else { //undefined - property doesn't exist on node
                            d3.select(this).select('circle')
                                .transition().duration(1000)
                                .attr('r', 8);
                        }
                    });
                }
            };

            scope.chartCtrl.forcegraph.internalControl.resetEdgeProps = function (edges) {
                edges.forEach(function (edgeObj) {
                    edgeObj.selected = false;
                });
                scope.chartCtrl.forcegraph.internalControl.resetEdgeResizeProps();
            };

            scope.chartCtrl.forcegraph.internalControl.resetEdgeResizeProps = function () {
                link.each(function (d, i) {
                    //reset 'stroke-width' to default size of '1.5'
                    d3.select(this)
                        .attr("stroke-width", 1.5);
                });
            };

            scope.chartCtrl.forcegraph.internalControl.edgeResizeProperty = function (edgeProp) {
                var linkDomainArray = [];

                link.each(function (d, i) {
                    if (d.propHash[edgeProp.propName] || d.propHash[edgeProp.propName] === 0) {
                        linkDomainArray.push(d.propHash[edgeProp.propName]);
                    }
                    //reset 'stroke-width' to default size of '1.5'
                    d3.select(this)
                        .transition().duration(1000)
                        .attr("stroke-width", 1.5);
                });

                if (linkDomainArray.length > 0) {
                    lScale.domain([d3.min(linkDomainArray), d3.max(linkDomainArray)]);
                    link.each(function (d, i) {
                        if (d.propHash[edgeProp.propName] || d.propHash[edgeProp.propName] === 0) {
                            d3.select(this)
                                .transition().duration(1000)
                                .attr("stroke-width", function (d) {
                                    return lScale(d.propHash[edgeProp.propName]);
                                });
                        }
                    });
                }
            };

            //if a node is selected, this function will highlight adjacent links & nodes
            scope.highlightAdjacent = function (type) {
                var highlightNodes = [],
                    highlightEdges = [],
                    UPSTREAM_STR = "Upstream",
                    DOWNSTREAM_STR = "Downstream";

                //find nodes and edges to highlight based on selectedNodes
                selectedNodes.forEach(function (node) {
                    //add the selectedNode
                    highlightNodes.push(node.uri);
                    //need to use scope.chartCtrl.data because nodes data doesn't get updated with all new edges
                    if (type.indexOf(DOWNSTREAM_STR) > -1) {
                        var outEdges = _.filter(links, function (edge) {
                            return (edge.source.uri === node.uri);
                        });
                        highlightNodes = highlightNodes.concat(_.map(_.map(JSON.parse(JSON.stringify(outEdges)), 'target'), 'uri'));
                        highlightEdges = highlightEdges.concat(_.map(JSON.parse(JSON.stringify(outEdges)), 'uri'));
                    }
                    if (type.indexOf(UPSTREAM_STR) > -1) {
                        var inEdges = _.filter(links, function (edge) {
                            return (edge.target.uri === node.uri);
                        });
                        highlightNodes = highlightNodes.concat(_.map(_.map(JSON.parse(JSON.stringify(inEdges)), 'source'), 'uri'));
                        highlightEdges = highlightEdges.concat(_.map(JSON.parse(JSON.stringify(inEdges)), 'uri'));
                    }
                });

                //loop through all links and highlight the correct ones
                for (var i = 0; i < link[0].length; i++) {
                    if (_.includes(highlightEdges, link[0][i].__data__.uri)) {
                        //highlight the link
                        d3.select(link[0][i]).transition().duration(1000).attr("stroke-width", 2.5).attr("stroke", "black").attr("opacity", 1);
                    } else {
                        d3.select(link[0][i]).transition().duration(1000).attr("stroke-width", 1.5).attr("stroke", "#666").attr("opacity", 0.2);
                    }
                }

                //highlight the necessary nodess
                node.each(function (d, i) {
                    //populate array with values of selected property
                    if (!_.includes(highlightNodes, d.uri)) {
                        //lower the opacity of nodes that aren't highlighted, reset selections
                        d3.select(this).select('circle')
                            .transition().duration(800)
                            .attr({
                                "opacity": 0.5,
                                "stroke": "#777",
                                "stroke-width": 1.5
                            });
                        d3.select(this).select('text')
                            .transition().duration(800)
                            .attr("opacity", 0.5);
                    } else {
                        //highlight the node on the graph, push adjacent nodes to the selected nodes array
                        selectedNodes.push(d);
                        d3.select(this).select('circle')
                            .transition().duration(800)
                            .attr({
                                "opacity": 1,
                                "stroke": "black",
                                "stroke-width": 2.0
                            });
                        d3.select(this).select('text')
                            .transition().duration(800)
                            .attr("opacity", 1);
                    }
                });
            };

            //highlights edges based on type of algorithm selected
            scope.runEdgeIdentifier = function (type, disabled) {
                scope.resetGraphEdges();
                scope.resetNodeResizeProps();
                if (disabled) return;
                var engine = { api: '', name: '' };
                if (scope.chartCtrl.data.core_engine) {
                    engine = scope.chartCtrl.data.core_engine;
                }
                var insightID = JSON.parse(JSON.stringify(scope.chartCtrl.data.insightID));
                var dataToSend = {};
                if ((type === "island") && (selectedNodes.length > 0))
                    dataToSend["selectedNodes"] = selectedNodes;
                var method = "runLoopIdentifer";
                if (type === "island")
                    method = "runIslandIdentifier";
                monolithService.runPlaySheetMethod(engine, insightID, dataToSend, method).then(function (response) {
                    var linksToHighlight = _.keys(response);
                    var includedNodes = [];
                    //get the nodes included in the response
                    _(response).forEach(function (n, key) {
                        includedNodes.push(n.source);
                        includedNodes.push(n.target);
                    });
                    var nodesToHighlight = _.uniq(includedNodes);

                    for (var i = 0; i < link[0].length; i++) {
                        if (_.includes(linksToHighlight, link[0][i].__data__.uri)) {
                            //highlight the link
                            d3.select(link[0][i]).transition().duration(1000).attr("stroke-width", 2.5).attr("stroke", "black").attr("opacity", 1);
                        } else {
                            d3.select(link[0][i]).transition().duration(1000).attr("stroke-width", 1.5).attr("stroke", "#666").attr("opacity", 0.2);
                        }
                    }

                    node.each(function (d, i) {
                        //populate array with values of selected property
                        if (!_.includes(nodesToHighlight, d.uri)) {
                            //lower the opacity of nodes that aren't highlighted
                            d3.select(this).select('circle')
                                .transition().duration(800)
                                .attr("opacity", 0.5);
                            d3.select(this).select('text')
                                .transition().duration(800)
                                .attr("opacity", 0.5);
                        }
                    });
                }.bind());
            };

            //resets all edges on the graph to the default size
            scope.resetGraphEdges = function () {
                d3.selectAll("path").attr("stroke-width", 1.5).attr("stroke", "#666").attr("opacity", 1);
            };

            scope.runDataLatencyAnalysis = function (disabled) {
                scope.resetGraphEdges();
                scope.resetNodeResizeProps();
                if (disabled) return;
                var engine = { api: '', name: '' };
                if (scope.chartCtrl.data.core_engine) {
                    engine = scope.chartCtrl.data.core_engine;
                }
                var layout = JSON.parse(JSON.stringify(scope.chartCtrl.data.insightID));
                var dataToSend = {};
                dataToSend["type"] = "DataLatency";
                if (selectedNodes.length > 0)
                    dataToSend["selectedNodes"] = selectedNodes;

                //Here is where the service call needs to be made to get the edges to highlight.
                //Send all the data to the tools in an Object of {edge-key, hour-value} and highlight edges accordingly
                monolithService.runPlaySheetMethod(engine, layout, dataToSend, "runDataLatency").then(function (response) {
                    dataLatencyObject = response;
                    scope.highlightEdges(0);
                });
            };

            //Edge highlighting is done in the for loop.  Also need to broadcast the proper time values to the tools to update the slider.
            scope.highlightEdges = function (dataTimeValue) {
                if (!_.isEmpty(dataLatencyObject)) {
                    var highlightScores = _.keys(dataLatencyObject);
                    var highlightedLinks = [];
                    var highlightedNodes = [];

                    for (var i = 0; i < highlightScores.length; i++) {
                        var linksToHighlight = [];
                        var includedNodes = [];
                        var edgeArray = dataLatencyObject[highlightScores[i] + ""];
                        _(edgeArray).forEach(function (n) {
                            includedNodes.push(n.source);
                            includedNodes.push(n.target);
                            linksToHighlight.push(n.uri);
                        });
                        var nodesToHighlight = _.uniq(includedNodes);
                        //highlightedNodes = highlightedNodes.concat(nodesToHighlight);
                        if ((highlightScores[i] != null) && (highlightScores[i] <= dataTimeValue)) {
                            for (var j = 0; j < link[0].length; j++) {
                                if (_.includes(linksToHighlight, link[0][j].__data__.uri)) {
                                    //highlight the link
                                    highlightedLinks.push(link[0][j].__data__.uri);
                                    d3.select(link[0][j]).attr("stroke-width", 2.5).attr("stroke", "black").attr("opacity", 1);
                                }
                            }
                            node.each(function (d, i) {
                                //populate array with values of selected property
                                if (_.includes(nodesToHighlight, d.uri)) {
                                    //set the opacity of nodes that are highlighted
                                    highlightedNodes.push(d.uri);
                                    d3.select(this).select('circle')
                                        .attr("opacity", 1);
                                    d3.select(this).select('text')
                                        .attr("opacity", 1);
                                }
                            });
                        } else if (dataTimeValue < scope.prevDataTimeValue) {
                            for (var j = 0; j < link[0].length; j++) {
                                if (_.includes(linksToHighlight, link[0][j].__data__.uri)) {
                                    //reset the link
                                    var index = highlightedLinks.indexOf(link[0][j].__data__.uri);
                                    if (index > -1) {
                                        highlightedLinks.splice(index, 1);
                                    }
                                    d3.select(link[0][j]).attr("stroke-width", 1.5).attr("stroke", "#666").attr("opacity", 1);
                                }
                            }
                        }
                    }

                    for (var j = 0; j < link[0].length; j++) {
                        if (!_.includes(highlightedLinks, link[0][j].__data__.uri)) {
                            d3.select(link[0][j]).attr("stroke-width", 1.5).attr("stroke", "#666").attr("opacity", 0.2);
                        }
                    }

                    node.each(function (d, i) {
                        //populate array with values of selected property
                        if (!_.includes(highlightedNodes, d.uri)) {
                            d3.select(this).select('circle')
                                .attr("opacity", 0.5);
                            d3.select(this).select('text')
                                .attr("opacity", 0.5);
                        }
                    });

                    scope.prevDataTimeValue = dataTimeValue;
                }
            };
            /*** End of exposed API to communicate with ForceGraph ***/

            //TODO: this needs to be refactored to use container and margin objects
            scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
            var width = scope.chartCtrl.container.width;
            var height = scope.chartCtrl.container.height;


            function updateGraph(data) {
                //this watches all of the data in existing graphs, so we want to limit the update of the graph to the graph we're currently on by checking the containerClass and the selected canvas
                //the long check at the end is to make sure we're not updating the gridster when we are on graph-canvas; so if either the container or the selected canvas is graph-canvas, don't update; but we do want to update multiple gridsters
                //when we go back to the dashboard. this happens when we expand a graph-->create new graph-->pin the new graph: we're going to update both the expanded graph and then pin the new graph.
                if (_.isEmpty(data) || ((typeof data.nodes === 'undefined') && (typeof data.edges === 'undefined'))) {
                    //links = [];
                    //nodes = [];
                } else {
                    if (links !== data) {
                        scope.chartCtrl.forcegraph.forceGraphOptions.graph.nodeResizeProperties = forceGraphService.parseNodeResizeProps(JSON.parse(JSON.stringify(scope.chartCtrl.data.nodes)), scope.chartCtrl.forcegraph.forceGraphOptions.graph.nodeResizeProperties);
                        scope.chartCtrl.forcegraph.forceGraphOptions.graph.edgeResizeProperties = forceGraphService.parseEdgeResizeProps(JSON.parse(JSON.stringify(scope.chartCtrl.data.edges)), scope.chartCtrl.forcegraph.forceGraphOptions.graph.edgeResizeProperties);

                        newNodes = data.nodes;
                        newLinks = data.edges;
                        legendNodes.length = 0;
                        legendNodeCounts = {};
                        //TODO: Consolidate these if statements
                        if (scope.chartCtrl.vizInput && (scope.chartCtrl.vizInput.updateType === "new" || scope.chartCtrl.vizInput.updateType === "update")) {
                            scope.isNewGraph.value = true;
                            scope.chartCtrl.vizInput.updateType = "";
                        }
                        if (scope.isNewGraph.value) {
                            //creating a new graph so need to empty all previous nodes & links
                            nodes.length = 0;
                            links.length = 0;

                            scope.isNewGraph.value = false;
                            //clear values in the properties table
                            scope.chartCtrl.forcegraph.forceGraphOptions.type.properties = [];
                            scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels = {};
                            scope.chartCtrl.forcegraph.forceGraphOptions.node.properties = [];
                        }
                        if ((newLinks && newLinks.length > 0) || (newNodes && !_.isEmpty(newNodes))) {
                            //if (!scope.isNewGraph.undo) {
                            if (scope.chartCtrl.vizInput.updateType !== "undo") {
                                for (var prop in newNodes) {
                                    obj = angular.extend({}, newNodes[prop]);
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
                                //scope.isNewGraph.redo = false;
                                //} else if (scope.isNewGraph.undo) {
                            } else if (scope.chartCtrl.vizInput.updateType === "undo") {
                                for (var removeNodeId in newNodes) {
                                    //remove node from 'nodes' and it's associated edges from 'links'
                                    removeNode(removeNodeId);
                                }
                                //remove any additional edges/links
                                newLinks.forEach(function (link) {
                                    removeEdge(link.source, link.target);
                                });
                                scope.isNewGraph.undo = false;
                            }
                            scope.chartCtrl.vizInput.updateType = "";
                            //set up legendNodes array for legend
                            newLegendNodes = nodes.filter(function (node) {
                                if (legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] > 0) {
                                    legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] = legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] + 1;
                                    return false;
                                }
                                legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] = 1;
                                return true;
                            });
                            update();
                            setGraphLabels(data);
                            scope.resetGraphEdges();
                            scope.resetNodeResizeProps();
                        }
                    }
                }
                //if there is one node (explore an instance, select it)
                if (nodes.length === 1) { //_.keys(scope.chartCtrl.data.nodes).length
                    //TODO: this needs to actually highlight the node....currently doesnt
                    //onNodeClick(nodes[0]);
                }
            }

            //-------BEGINNING OF WATCHES---------
            /* scope.$watch('labels', function () {
             updateLabels();
             }, true);*/

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
                .gravity(0.09) //attraction to the center of the screen and within the screen layout
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

            //set no overflow in mashup
            if (d3.select("#" + scope.chartCtrl.chartName + "-append-viz")) {
                d3.select("#" + scope.chartCtrl.chartName + "-append-viz").style("overflow", "hidden");
            }

            var svg = d3.select("#" + scope.chartCtrl.chartName).append("svg")
                .attr('class', 'editable-svg')
                .attr("width", width)
                .attr("height", height);

            var graph = svg.append("g")
                .attr("class", "graph")
                .call(zoomer).on("dblclick.zoom", null); //Attach zoom behaviour.

            var rect = graph.append("rect")
                .attr('class', 'editable-svg')
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                //make transparent (vs black if commented-out)
                .style("pointer-events", "all");

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
             .attr("refX", 18)
             .attr("refY", -1.5)
             .attr("markerUnits", "userSpaceOnUse")
             .attr("markerWidth", 10)
             .attr("markerHeight", 10)
             .attr("orient", "auto")
             .append("path")
             .attr("d", "M0,-5L10,0L0,5")
             .style("pointer-events", "none"); //no events need to be fired off of marker*/

            var container = svg.append("g");

            var linkG = vis.append("g"),
                nodeG = vis.append("g");

            var link = linkG.selectAll(".link"),
                node = nodeG.selectAll(".node");

            links = force.links();
            nodes = force.nodes();

            var translateX = 0,
                translateY = 0;
            //add legend
            var legendBox = svg.append("g")
                .attr("class", scope.chartCtrl.chartName + " legend")
                .attr("height", 100)
                .attr("width", 100)
                .attr("transform", "translate(" + translateX + "," + translateY + ")");

            //Not used. Need to refactor this handler
            /*function onNodeClick(d) {
             var allCircles = d3.selectAll("circle.node").filter("." + scope.chartCtrl.chartName),
             selectedCircle = d3.select(this).select("circle"),
             selectedIdx = _.indexOf(selectedNodes, d);

             //set all circles (and previously selected nodes) to default stroke & stroke-width
             allCircles.attr({
             "stroke": "#777",
             "stroke-width": 1.5
             });

             //clear legend selections
             d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
             .attr("stroke-width", 0)
             .attr("stroke", function (node) {
             return node.propHash.VERTEX_TYPE_PROPERTY;
             });

             //remove node if you select it again, if multiple nodes selected it will only select one
             if (selectedIdx > -1 && selectedNodes.length < 2) {
             selectedNodes.splice(selectedIdx, 1);
             //for data network
             $rootScope.$emit('data-network-tools-receive', 'force-graph-uri-selected', {
             id: scope.chartCtrl.widgetId,
             uri: ["None"]
             });
             } else {
             selectedNodes = [];
             selectedNodes.push(d);

             //set selected node to <color> and <border> size
             selectedCircle.attr({
             "stroke": "black",
             "stroke-width": 2.0
             });

             //toggling freeze/unfreeze of nodes
             for (var i = 0; i < selectedNodes.length; i++) {
             selectedNodes[i].fixed = !selectedNodes[i].fixed;
             }

             getNeighborInstance({
             data: [d]
             });

             var items = [{
             uri: d.uri,
             name: d.propHash ? d.propHash.VERTEX_LABEL_PROPERTY : "",
             axisName: d.propHash ? d.propHash.VERTEX_TYPE_PROPERTY : "",
             id: scope.chartCtrl.widgetId
             }];

             scope.chartCtrl.highlightSelectedItem(items);
             }
             }*/

            function update() {
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
                    .attr("fill", "#666")
                    .attr("stroke", "#666")
                    .attr("stroke-width", 1.5)
                    .attr("id", function (d, i) {
                        return "linkId_" + i;
                    });
                /*.attr("marker-end", function (d) {
                 return "url(#end)";
                 });*/

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
                        return "node " + d.id;
                    })
                    .call(drag);

                //node enter circle...
                nodeEnter.append("circle")
                    .attr("class", scope.chartCtrl.chartName + " node")
                    .attr("r", 0).transition().duration(1000)
                    .attr("r", 8)
                    .attr("fill", function (d) {
                        var tempNodeColor = d.propHash.VERTEX_COLOR_PROPERTY;
                        if (_.isEmpty(tempNodeColor)) {
                            console.log('Back End is not sending VERTEX_COLOR_PROPERTY')
                            tempNodeColor = '238,238,238'
                        }

                        return ("rgb(" + tempNodeColor + ")");
                    })
                    .attr("stroke", "#777")
                    .attr("stroke-width", 1.5)
                    .style("cursor", "pointer")
                    .attr("data-legend", function (d) {
                        var tempNodeColor = d.propHash.VERTEX_COLOR_PROPERTY;
                        if (_.isEmpty(tempNodeColor)) {
                            tempNodeColor = '238,238,238'
                        }

                        return ("rgb(" + tempNodeColor + ")");
                    });

                nodeEnter.on("dblclick", function (d) {
                    var allCircles = d3.selectAll("circle.node").filter("." + scope.chartCtrl.chartName),
                        selectedCircle = d3.select(this).select("circle"),
                        selectedIdx = _.indexOf(selectedNodes, d);

                    //set all circles (and previously selected nodes) to default stroke & stroke-width
                    allCircles.attr({
                        "stroke": "#777",
                        "stroke-width": 1.5
                    });

                    //clear legend selections
                    d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
                        .attr("stroke-width", 0)
                        .attr("stroke", function (node) {
                            return node.propHash.VERTEX_TYPE_PROPERTY;
                        });

                    //remove node if you select it again, if multiple nodes selected it will only select one
                    if (selectedIdx > -1 && selectedNodes.length < 2) {
                        selectedNodes.splice(selectedIdx, 1);

                        setPropTable({
                            data: []
                        });

                        var items = [];
                        scope.chartCtrl.highlightSelectedItem(items);

                        //for dataNetwork
                        var selectedUri = [];
                        for (var i = 0; i < items.length; i++) {
                            selectedUri.push(items[i].uri)
                        }

                        $rootScope.$emit('data-network-tools-receive', 'force-graph-uri-selected', {
                            uri: selectedUri
                        });

                    } else {
                        selectedNodes = [];
                        selectedNodes.push(d);

                        //set selected node to <color> and <border> size
                        selectedCircle.attr({
                            "stroke": "black",
                            "stroke-width": 2.0
                        });

                        //toggling freeze/unfreeze of nodes
                        for (var i = 0; i < selectedNodes.length; i++) {
                            selectedNodes[i].fixed = !selectedNodes[i].fixed;
                        }
                        //TODO GET ENGINE FOR GRAPH
                        var items = [{
                            uri: d.uri,
                            engine: (scope.chartCtrl.data && scope.chartCtrl.data.core_engine) ? scope.chartCtrl.data.core_engine : {
                                name: '',
                                api: ''
                            },
                            concept: d.propHash ? d.propHash.VERTEX_TYPE_PROPERTY : "",
                            name: d.propHash ? d.propHash.VERTEX_LABEL_PROPERTY : "",
                            axisName: d.propHash ? d.propHash.VERTEX_TYPE_PROPERTY : ""
                        }];


                        setPropTable({
                            data: [d]
                        });


                        var selectedUri = [];
                        for (var i = 0; i < items.length; i++) {
                            selectedUri.push(items[i].uri)
                        }

                        $rootScope.$emit('data-network-tools-receive', 'force-graph-uri-selected', {
                            uri: selectedUri
                        });

                        scope.chartCtrl.highlightSelectedItem(items);
                    }
                });

                //node enter text...
                nodeEnter.append("text")
                    .attr("class", "nodetext")
                    .attr("class", scope.chartCtrl.chartName + " force-labels show") //make labels canvas-specific with scope.chartCtrl.containerClass
                    .attr("x", 12)
                    .attr("dy", ".35em")
                    .attr("stroke", "none")
                    .attr("font-size", "10px");

                toggleLabels();
                updateLabels();

                //node group removal with transition...
                node.exit()
                    .selectAll("circle")
                    .transition().duration(1000)
                    .attr("r", 0)
                    .remove();
                node.exit()
                    .selectAll("text")
                    .transition().duration(1000)
                    .attr("font-size", "0px")
                    .remove();
                node.exit().transition().delay(1000).remove();

                //legend update...
                legendNodes = newLegendNodes.filter(function (node) {
                    return legendNodeCounts[node.propHash.VERTEX_TYPE_PROPERTY] > 0;
                });

                var legend = legendBox.selectAll('circle')
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
                        var tempNodeColor = d.propHash.VERTEX_COLOR_PROPERTY;
                        if (_.isEmpty(tempNodeColor)) {
                            tempNodeColor = '238,238,238'
                        }

                        return ("rgb(" + tempNodeColor + ")");
                    })
                    .style("fill", function (d) {
                        var tempNodeColor = d.propHash.VERTEX_COLOR_PROPERTY;
                        if (_.isEmpty(tempNodeColor)) {
                            tempNodeColor = '238,238,238'
                        }

                        return ("rgb(" + tempNodeColor + ")");
                    });

                legend.transition().duration(1000).attr("transform", function (d, i) {
                    return "translate(20," + ((i * 20) + 25) + ")";
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
                    .attr("x", 12);

                legendText.transition().duration(1000).attr("transform", function (d, i) {
                    return "translate(20," + ((i * 20) + 29) + ")";
                })
                    .text(function (d) {
                        return $filter('replaceUnderscores')(d.propHash.VERTEX_TYPE_PROPERTY) + " (" + legendNodeCounts[d.propHash.VERTEX_TYPE_PROPERTY] + ")";
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
                    .on("dblclick", function (d) {
                        legendClick(d);
                    });

                d3.select("." + scope.chartCtrl.chartName + ".legend").selectAll("circle")
                    .style("cursor", "pointer")
                    .on("dblclick", function (d) {
                        legendClick(d);
                    });

                force.start();

            } //end of update function

            //when legend item is selected, it will highlight corresponding graph elements
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

                //increase stroke width and change color for nodes that are the selected type
                d3.selectAll("circle.node").filter("." + scope.chartCtrl.chartName)
                    .attr("stroke", function (node) {
                        if (node.propHash.VERTEX_TYPE_PROPERTY === type) {
                            selectedNodes.push(node);
                            return "black";
                        } else {
                            return '#777';
                        }
                    })
                    .attr("stroke-width", function (node) {
                        if (node.propHash.VERTEX_TYPE_PROPERTY === type) {
                            return 2.0;
                        } else {
                            return 1.5;
                        }
                    });

                var items = _.map(selectedNodes, function (node) {
                    return {
                        uri: node.uri,
                        engine: (scope.chartCtrl.data && scope.chartCtrl.data.core_engine) ? scope.chartCtrl.data.core_engine : {
                            name: '',
                            api: ''
                        },
                        concept: node.propHash ? node.propHash.VERTEX_TYPE_PROPERTY : "",
                        name: node.propHash ? node.propHash.VERTEX_LABEL_PROPERTY : "",
                        axisName: node.propHash ? node.propHash.VERTEX_TYPE_PROPERTY : ""
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

            //Please comment
            function zoom() {
                tick();
            }

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

                //return "M" + xScale(d.source.x) + "," + yScale(d.source.y) + "A" + dr + "," + dr + " 0 0,1 " + xScale(d.target.x) + "," + yScale(d.target.y);
            }

            //Highlight adjacent utility function
            function isConnected(a, b) {
                return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id] || a.id === b.id;
            }

            //find node by 'id' within nodes array
            function findNode(id) {
                for (var i in nodes) {
                    if (nodes[i].id === id) {
                        return nodes[i];
                    }
                }
            }

            //remove node and all it's connected links
            function removeNode(id) {
                var i = 0,
                    n = findNode(id);
                while (i < links.length) {
                    if ((links[i].source === n) || (links[i].target === n)) {
                        links.splice(i, 1);
                    } else {
                        i++;
                    }
                }
                nodes.splice(findNodeIndex(id), 1);
            }

            //finds node in nodes array based on passed in 'id'
            function findNodeIndex(id) {
                for (var i in nodes) {
                    if (nodes[i].id === id) {
                        return i;
                    }
                }
            }

            //remove edges
            function removeEdge(source, target) {
                for (var i = 0; i < links.length; i++) {
                    if (links[i].source.id === source && links[i].target.id === target) {
                        links.splice(i, 1);
                        break;
                    }
                }
            }

            //updates graph with new labels
            function updateLabels() {
                d3.selectAll(".force-labels").filter("." + scope.chartCtrl.chartName) //this graphs all force-labels and then filter to update labels specific to the container
                    .text(function (d) {
                        for (var type in scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels) {
                            var valuesForType = scope.chartCtrl.forcegraph.forceGraphOptions.currentLabels[type];
                            if (type === d.propHash.VERTEX_TYPE_PROPERTY) {
                                if (_.isObject(d.propHash[valuesForType])) {
                                    return d.propHash[valuesForType].label;
                                } else {
                                    if (valuesForType === "URI") {
                                        return d.propHash[valuesForType];
                                    } else
                                        return $filter('replaceUnderscores')(d.propHash[valuesForType]);
                                }
                            }
                        }
                    });
            }

            //shows/hides the node text
            function toggleLabels() {
                if (scope.chartCtrl.forcegraph.labelToggle === true) {
                    d3.selectAll(".force-labels").filter("." + scope.chartCtrl.chartName)
                        .attr("class", scope.chartCtrl.chartName + " force-labels show");
                } else {
                    d3.selectAll(".force-labels").filter("." + scope.chartCtrl.chartName)
                        .attr("class", scope.chartCtrl.chartName + " force-labels hide");
                }
            }

            scope.freezeAllNodes = function () {
                var selectAllNodes = d3.values(nodes);
                var nodesLength = selectAllNodes.length;
                for (var i = 0; i < nodesLength; i++) {
                    selectAllNodes[i].fixed = true;
                }
            };

            scope.unFreezeAllNodes = function () {
                var selectAllNodes = d3.values(nodes);
                var nodesLength = selectAllNodes.length;
                for (var i = 0; i < nodesLength; i++) {
                    selectAllNodes[i].fixed = false;
                }
                force.start();
            };

            scope.resetHighlighting = function () {
                scope.resetGraphEdges();
                scope.resetNodeResizeProps();
                //scope.clearSelectedNodes();
            };

            //*********Data Network Functions**********
            scope.runLoopIdentifier = function (enabled) {
                scope.runEdgeIdentifier("loop", enabled);
            };

            scope.runIslandIdentifier = function (enabled) {
                scope.runEdgeIdentifier("island", enabled);
            };

            scope.$on("$destroy", function forcegraphDestroyer() {
                console.log("force graph destroyed");
            });
        }

        function forceGraphCtrl($scope) {

            this.isNewGraph = {
                value: false,
                undoCounter: 0,
                redoCounter: 0,
                redo: false,
                undo: false,
                redoBtnFlag: false,
                undoBtnFlag: false
            };

            $scope.setIsNewGraph = function () {
                this.isNewGraph = $scope.isNewGraph;
            }.bind(this);

            this.toggleTable = function () {
                $scope.toggleTable();
            };
        }
    }
})();
