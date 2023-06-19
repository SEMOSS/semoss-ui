(function () {
    'use strict';

    angular.module('app.create-metamodel.directive', [])
        .directive('createMetamodel', createMetamodel);

    createMetamodel.$inject = ['$filter', '$compile', 'createPanelService'];

    function createMetamodel($filter, $compile, createPanelService) {

        createMetamodelCtrl.$inject = ['$scope', '$element'];

        return {
            restrict: 'E',
            controller: createMetamodelCtrl,
            link: createMetamodelLink,
            scope: {
                create: "=create"
            },
            bindToController: {},
            controllerAs: 'dbMetamodel'
        };

        function createMetamodelCtrl($scope, $element) {
            //TODO syncing up data in this directive with data in create-panel.directive needs to be more seamless...the best way is to use the same object rather than holding nodes in different objects and then trying to sync
            var dbMetamodel = this,
                selectedNodes = [],
                allEdges,
                allNodes,
                newNodes = [],
                newEdges = [],
                selectedEngine = {};
            var create = $scope.create;

            create.dbMetamodel.addNode = addNode;
            create.dbMetamodel.addProperty = addProperty;
            create.dbMetamodel.initializeMetamodel = initializeMetamodel;
            create.dbMetamodel.orderedNodeList = [];
            create.dbMetamodel.orderedPropList = [];
            create.unselectable = unselectable;
            create.removeNode = removeNode;
            create.removeProperty = removeProperty;

            /**
             * @name setNewGraphData
             * @param data nodes and edges for the graph
             * @desc set the new nodes and edges and then update the graph
             */
            function setNewGraphData(data) {
                if (_.isEmpty(data)) {
                    newEdges = [];
                    newNodes = [];
                } else {
                    newNodes = data.nodes;
                    newEdges = data.edges;
                    selectedNodes = [];
                    selectedEngine = data.selectedEngine;
                    update();
                }
            }

            // Create a new directed graph
            var g = new dagreD3.graphlib.Graph().setGraph({});

            //create the svg
            var svg = d3.select($element[0]).append("svg")
                .attr("id", '#db-svg')
                .attr("width", "100%")
                .attr("height", "100%");

            //create inner graph inside svg
            var svgGraph = svg.append("g")
                .attr("class", "graph");

            // Set up zoom support
            var zoom = d3.behavior.zoom().on("zoom", function() {
                svgGraph.attr("transform", "translate(" + d3.event.translate + ")" +
                    "scale(" + d3.event.scale + ")");
            });
            svg.call(zoom).on("dblclick.zoom", null);

            // Create the renderer
            var render = new dagreD3.render();

            /**
             * @name update
             * @desc sets up the graph and then draw
             */
            function update() {
                //clear the visualization
                svgGraph.selectAll("*").remove();

                //add back the graph
                svgGraph = svg.append("g")
                    .attr("class", "graph")
                    .attr("transform", "translate(20,20) scale(1)");

                //reset all the graph data
                g = new dagreD3.graphlib.Graph().setGraph({});

                //setting the layout
                g.graph().rankDir = "TB";
                g.graph().nodeSep = 20;

                //add the new graph data to dagre
                setGraphData();

                //set global variable that houses all nodes/edges
                allNodes = g._nodes;
                allEdges = g._edgeObjs;

                // Run the renderer. This is what draws the final graph.
                render(svgGraph, g);
            }

            /**
             * @name setGraphData
             * @desc sets the nodes and edges in the graph
             */
            function setGraphData() {
                for(var node in newNodes) {
                    g.setNode(newNodes[node].name, {
                        label: function (node) {
                            return $compile(create.nodeLabelMaker(newNodes[node], true))($scope)[0];
                        }.bind(null, node),
                        labelType: "html",
                        data: newNodes[node],
                        rx: 5,
                        ry: 5,
                        style: "fill: #fff; opacity: 1; stroke: #000; stroke-width: 1"
                    });
                }

                //add edges to graph
                var edgeLength = newEdges.length;
                for (var i = 0; i < edgeLength; i++) {
                    g.setEdge($filter("shortenValueFilter")(newEdges[i].source), $filter("shortenValueFilter")(newEdges[i].target), {
                        label: "",
                        propHash: newEdges[i].propHash,
                        lineInterpolate: "cardinal",
                        arrowhead: "normal",
                        style: "fill: none; stroke: #000; stroke-opacity: .3"
                    });
                }
            }

            /**
             * @name unselectable
             * @param node
             * @desc returns true or false based on whether its in create.pkqlComponents or not
             */
            function unselectable(node) {
                var lastAddedNode = "";

                if(create.dbMetamodel.orderedNodeList.length !== 0) {
                    lastAddedNode = create.dbMetamodel.orderedNodeList[create.dbMetamodel.orderedNodeList.length - 1];
                }

                for(var index = 0; index < create.pkqlComponents.length; index++) {
                    //only the last selected node can be unselected
                    for(var node2 in create.pkqlComponents[index]) {
                        if (node2 === node && node2 === lastAddedNode) {
                            return true;
                        }
                    }
                }

                return false;
            }

            /**
             * @name addNode
             * @desc add the node to dagre and then make a call to create's equivalent function to sync
             */
            function addNode() {
                if(create.dbMetamodel.metamodelObject) {
                    highlightNodes();
                }
            }

            /**
             * @name removeNode
             * @desc remove the node in dagre and then make a call to create's equivalent function to sync
             */
            function removeNode(node, parent) {
                create.dbMetamodel.orderedNodeList.pop();

                for(var index = 0; index < create.pkqlComponents.length; index++) {
                    if(!create.pkqlComponents[index][node]) {
                        continue;
                    }
                    //remove from create.pkqlComponents along with all its properties -- toggle them back to selected = false
                    if(create.pkqlComponents[index][node].properties) {
                        for(var prop in create.pkqlComponents[index][node].properties) {
                            var propName = create.pkqlComponents[index][node].properties[prop].replace(node+"__", "");
                            create.dbMetamodel.metamodelObject.nodes[node].properties[propName].selected = false;
                            //delete the edges for the properties
                            for(var edgeIndex=0; edgeIndex < create.addedEdges.length; edgeIndex++) {
                                if(create.addedEdges[edgeIndex].target === propName) {
                                    create.addedEdges.splice(edgeIndex, 1);
                                    create.removeNodeFromDagre(propName);
                                    delete create.addedNodes[propName];
                                }
                            }
                        }
                    }

                    //remove the edge for this node
                    for(var edgeIndex2=0; edgeIndex2 < create.addedEdges.length; edgeIndex2++) {
                        if(create.addedEdges[edgeIndex2].target === node || create.addedEdges[edgeIndex2].source === node) {
                            create.removeEdgeFromDagre(create.addedEdges[edgeIndex2].source, create.addedEdges[edgeIndex2].target, create.addedEdges[edgeIndex2].source+create.addedEdges[edgeIndex2].target);
                            create.addedEdges.splice(edgeIndex2, 1);
                            break;
                        }
                    }

                    delete create.pkqlComponents[index][node];
                    if(_.isEmpty(create.pkqlComponents[index])) {
                        create.pkqlComponents.splice(index, 1);
                    }
                }

                delete create.addedNodes[node];
                create.removeNodeFromDagre(node);
                create.showInstances = false;
                create.showConcept = true;
                highlightNodes();
            }

            /**
             * @name removeProperty
             * @param prop
             * @param parent
             * @desc toggle the property off in dagre and then make a call to create's equivalent function to sync
             */
            function removeProperty(prop, parent) {
                create.dbMetamodel.metamodelObject.nodes[parent].properties[prop].selected = false;
                for(var edgeIndex=0; edgeIndex < create.addedEdges.length; edgeIndex++) {
                    if(create.addedEdges[edgeIndex].target === prop) {
                        create.addedEdges.splice(edgeIndex, 1);
                        create.removeNodeFromDagre(prop);
                        delete create.addedNodes[prop];
                    }
                }

                for(var index = 0; index < create.pkqlComponents.length; index++) {
                    if(!create.pkqlComponents[index][parent]) {
                        continue;
                    }

                    for (var propIdx in create.pkqlComponents[index][parent].properties) {
                        if(create.pkqlComponents[index][parent].properties[propIdx].replace(parent+"__", "") === prop) {
                            create.pkqlComponents[index][parent].properties.splice(propIdx, 1);
                            break;
                        }
                    }
                }

                //unselect prop from single view
                if(create.addedNodes[parent].properties) {
                    for (var idx = 0; idx < create.addedNodes[parent].properties.length; idx++) {
                        if(create.addedNodes[parent].properties[idx].name === prop && create.addedNodes[parent].properties[idx].db[0].name === create.selectedNode.db[0].name){
                            create.addedNodes[parent].properties[idx].selected = false;
                        }
                    }
                }

                create.dbMetamodel.orderedPropList.splice(create.dbMetamodel.orderedPropList.indexOf(prop), 1);
                create.showInstances = false;
                create.showConcept = true;
            }

            /**
             * @name addProperty
             * @desc toggle the property on in dagre and then make a call to create's equivalent function to sync
             */
            function addProperty() {
                console.log("addProperty dbMetamodel");
                //highlightNodes();
            }

            /**
             * @name addEvents
             * @desc adds event listeners to every rendered node to highlight and get connections on click
             */
            function addEvents() {
                var nodes = svgGraph.selectAll(".node");
                nodes.each(function (d) {
                    var node = d3.select(this);
                    node.on('click', function (d) {
                        if(g._nodes[d].style === "fill: #fff; opacity: 1; stroke: #000; stroke-width: 1") {
                            addConcept(d);
                        }
                    })
                })
            }

            /**
             * @name addConcept
             * @param d {String} the selected node to traverse to
             * @desc add the selected node
             */
            function addConcept(d) {
                var selectedAndConnectedEdges = [], tempNode = {}, chosenEdge = {};
                create.resetInstanceList();
                create.dbMetamodel.orderedNodeList.push(d);

                for(var edge in g._edgeObjs) {
                    if(g._edgeObjs[edge].v === d && g._nodes[g._edgeObjs[edge].w].style === "fill:  rgba(79, 164, 222, 0.75); opacity: 1; stroke: #000; stroke-width: 1") { //upstream and selected
                        //TODO add additional check to loop through addedNodes and see which is the last one+use that one as part of triple
                        //TODO loop aginst addedNodes and get their equivalent position in addedNodes; grab the largest value/sum
                        selectedAndConnectedEdges.push(edge);
                    } else if (g._edgeObjs[edge].w === d && g._nodes[g._edgeObjs[edge].v].style === "fill:  rgba(79, 164, 222, 0.75); opacity: 1; stroke: #000; stroke-width: 1") { //downstream and selected
                        //TODO add additional check to loop through addedNodes and see which is the last one+use that one as part of triple
                        //TODO loop aginst addedNodes and get their equivalent position in addedNodes; grab the largest value/sum
                        selectedAndConnectedEdges.push(edge);
                    }
                }

                chosenEdge = findEdgeToConnect(selectedAndConnectedEdges, d);

                if(!_.isEmpty(chosenEdge)) {
                    if(g._edgeObjs[chosenEdge].v === d) {
                        tempNode = angular.copy(create.dbMetamodel.metamodelObject.nodes[d]);
                        tempNode.equivalentURI = {physicalName: create.dbMetamodel.metamodelObject.nodes[g._edgeObjs[chosenEdge].w].physicalName, name: create.dbMetamodel.metamodelObject.nodes[g._edgeObjs[chosenEdge].w].name};
                        tempNode.relation = g._edgeLabels[chosenEdge].propHash.URI;
                        tempNode.direction = "downstream";

                        create.highlightedNode = create.dbMetamodel.metamodelObject.nodes[g._edgeObjs[chosenEdge].w];
                        create.selectNode(tempNode);
                    } else if (g._edgeObjs[chosenEdge].w === d) {
                        tempNode = angular.copy(create.dbMetamodel.metamodelObject.nodes[d]);
                        tempNode.equivalentURI = {physicalName: create.dbMetamodel.metamodelObject.nodes[g._edgeObjs[chosenEdge].v].physicalName, name: create.dbMetamodel.metamodelObject.nodes[g._edgeObjs[chosenEdge].v].name};
                        tempNode.relation = g._edgeLabels[chosenEdge].propHash.URI;
                        tempNode.direction = "upstream";

                        create.highlightedNode = create.dbMetamodel.metamodelObject.nodes[g._edgeObjs[chosenEdge].v];
                        create.selectNode(tempNode);
                    }
                } else if (_.isEmpty(create.addedNodes)) {
                    tempNode = angular.copy(create.dbMetamodel.metamodelObject.nodes[d]);
                    create.highlightedNode = create.dbMetamodel.metamodelObject.nodes[d];
                    create.selectNode(tempNode);
                }
            }

            /**
             * @name findEdgeToConnect
             * @param selectedAndConnectedEdges {Array} list of edges connected to d
             * @param d {String} the selected node to traverse to
             * @desc returns the edge we want to use to traverse which is based on the last selected node
             */
            function findEdgeToConnect(selectedAndConnectedEdges, d) {
                var chosenEdge = {}, newEdgeIndex = -1, chosenEdgeIndex = -1;

                //grab the triple for the last selected node by looping through addedNodes backwards
                if(selectedAndConnectedEdges.length === 1) {
                    chosenEdge = selectedAndConnectedEdges[0];
                } else if (selectedAndConnectedEdges.length > 1) {
                    for(var e in selectedAndConnectedEdges) {
                        if(_.isEmpty(chosenEdge)) { //if no chosenEdges
                            chosenEdge = selectedAndConnectedEdges[e];
                        } else {
                            //set the chosenEdge to the highest index, which means its the latest added node
                            if(g._edgeObjs[selectedAndConnectedEdges[e]].v === d) {
                                newEdgeIndex = _.findIndex(create.stepMapping, {'node': g._edgeObjs[selectedAndConnectedEdges[e]].w});
                            } else if (g._edgeObjs[selectedAndConnectedEdges[e]].w === d) {
                                newEdgeIndex = _.findIndex(create.stepMapping, {'node': g._edgeObjs[selectedAndConnectedEdges[e]].v});
                            }

                            chosenEdgeIndex = -1;
                            //we want to check where the existing node (d) is and then grab the connected node because we know it exists
                            if(g._edgeObjs[chosenEdge].w === d) {
                                chosenEdgeIndex = _.findIndex(create.stepMapping, {'node': g._edgeObjs[chosenEdge].v});
                            } else if (g._edgeObjs[chosenEdge].v === d) {
                                chosenEdgeIndex = _.findIndex(create.stepMapping, {'node': g._edgeObjs[chosenEdge].w});
                            }

                            if(newEdgeIndex > chosenEdgeIndex) {
                                chosenEdge = selectedAndConnectedEdges[e];
                            }
                        }
                    }
                }

                return chosenEdge;
            }

            /**
             * @name highlightNodes
             * @desc highlights the nodes in create.addedNodes
             */
            function highlightNodes() {
                for(var mmNode in create.dbMetamodel.metamodelObject.nodes) { //TODO too many loops in here....not much to optimize since the list will be small but worth considering
                    g._nodes[create.dbMetamodel.metamodelObject.nodes[mmNode].name].style = "fill: #fff; opacity: 1; stroke: #000; stroke-width: 1"; //unhighlight all then highlight if node is in create.addedNodes
                    for(var node in create.addedNodes) {
                        if((create.addedNodes[node].name === create.dbMetamodel.metamodelObject.nodes[mmNode].name) /*&& (_.findIndex(create.addedNodes[node].db, {'name': create.dbMetamodel.metamodelObject.nodes[mmNode].db[0].name}) > -1)*/) {
                            g._nodes[create.addedNodes[node].name].style = "fill:  rgba(79, 164, 222, 0.75); opacity: 1; stroke: #000; stroke-width: 1";
                        }
                    }
                }

                render(svgGraph, g);
                addEvents();
            }

            /**
             * @name initializeMetamodel
             * @desc intialize dagre with engine's metamodel view and also reformat the nodes to follow create's format
             */
            function initializeMetamodel(engine) {
                if(engine.name === "All_DBs") {
                    return; //not an engine so we will not do anything
                }

                create.joinQueuedNodes();

                selectedEngine = engine;
                createPanelService.getEngineMetaModel(selectedEngine)
                    .then(function (data) {
                        create.dbMetamodel.metamodelObject = {nodes: {}, edges: data.data.edges};
                        for(var node in data.data.nodes){
                            if($filter("shortenValueFilter")(node) === "Concept") continue;

                            create.dbMetamodel.metamodelObject.nodes[$filter("shortenValueFilter")(data.data.nodes[node].uri)] = {
                                name: $filter("shortenValueFilter")(data.data.nodes[node].uri),
                                uri: data.data.nodes[node].uri,
                                physicalName: data.data.nodes[node].propHash.PhysicalName,
                                db: [selectedEngine],
                                properties: {},
                                selectedPropertiesSheet: 0
                            };

                            var propHash = data.data.nodes[node].propHash.propUriHash;
                            if(propHash) {
                                for(var prop in propHash) {
                                    var propertySelected = false;
                                    if(create.addedNodes[prop] && _.findIndex(create.addedNodes[prop].db, {'name': selectedEngine.name}) > -1) {
                                        propertySelected = true;
                                    }
                                    create.dbMetamodel.metamodelObject.nodes[$filter("shortenValueFilter")(data.data.nodes[node].uri)].properties[prop] = {
                                        name: prop,
                                        db: [selectedEngine],
                                        varKey: data.data.nodes[node].propHash[prop],
                                        uri: propHash[prop],
                                        physicalName: data.data.nodes[node].propHash.PhysicalName + "__" + data.data.nodes[node].propHash[prop],
                                        SubjectVar: data.data.nodes[node].propHash.PhysicalName,
                                        selected: propertySelected
                                    };
                                }
                            }
                        }

                        setNewGraphData(create.dbMetamodel.metamodelObject);
                        highlightNodes();
                    });
            }

            if(create.dbTitle === "All_DBs" || create.dbTitle === "None Found") {
                if(create.highlightedNode) {
                    selectedEngine = create.highlightedNode.db[0];
                }
            } else {
                selectedEngine = {name: create.dbTitle};
            }

            if(!_.isEmpty(selectedEngine)) {
                initializeMetamodel(selectedEngine);
            }
        }

        function createMetamodelLink(scope, ele, attrs) {
        }
    }
})();