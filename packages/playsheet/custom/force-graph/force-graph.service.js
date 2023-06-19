(function () {
    "use strict";

    angular.module("app.force-graph.service", [])
        .factory("forceGraphService", forceGraphService);

    forceGraphService.$inject = ["_"];

    function forceGraphService(_) {

        /**
         * @name parseNodeResizeProps
         * TODO: DOC
         */
        function parseNodeResizeProps(nodes, nodeResizeProps) {
            var propHash = {}, item = "", nodeName, propHashProperty;
            for (nodeName in nodes) {
                //console.log("node name: " + nodeName);
                propHash = {};
                propHash = nodes[nodeName].propHash;
                for (propHashProperty in propHash) {
                    //ignore any 'object' and 'string' types, only concerned with 'number' for now
                    if (typeof propHash[propHashProperty] !== "object" && typeof propHash[propHashProperty] !== "string") {
                        //console.log("propHash property: " + propHashProperty + ", value: " + propHash[propHashProperty]);
                        item = '';
                        //'find' if item already exists in array
                        item = _.find(nodeResizeProps, function (val) {
                            return val.propName === propHashProperty;
                        });
                        //item doesn't exist in array therefor add it
                        if (!item) {
                            nodeResizeProps.push({
                                nodeUri: nodeName,
                                propName: propHashProperty,
                                propValue: propHash[propHashProperty],
                                selected: false,
                                selectedNodeProp: ""
                            });
                        }
                    }
                }
            }
            return nodeResizeProps;
        }

        /**
         * @name parseEdgeResizeProps
         * TODO: DOC
         */
        function parseEdgeResizeProps(edges, edgeResizeProps) {
            var propHash = {}, item = "", propHashProperty;
            angular.forEach(edges, function (edge) {
                //console.log("edge: " + edge.uri);
                propHash = {};
                propHash = edge["propHash"];
                for (propHashProperty in propHash) {
                    //ignore any 'object' and 'string' types, only concerned with 'number' for now
                    if (typeof propHash[propHashProperty] !== "object" && typeof propHash[propHashProperty] !== "string") {
                        item = "";
                        //'find' if item already exists in array
                        item = _.find(edgeResizeProps, function (val) {
                            return val.propName === propHashProperty;
                        });
                        //item doesn't exist in array therefor add it
                        if (!item) {
                            edgeResizeProps.push({
                                propName: propHashProperty,
                                propValue: propHash[propHashProperty],
                                selected: false,
                                selectedEdgeProp: ""
                            });
                        }
                    }
                }
            });
            return edgeResizeProps;
        }

        /**
         * @name appendToCompleteGraph
         * TODO: DOC
         */
        function appendToCompleteGraph(data, completeGraphData) {
            var tempObj = $.extend(true, {}, completeGraphData);
            tempObj = $.extend(true, tempObj, data);
            //clear edges array from tempObj
            tempObj.edges = [];
            //reset 'edges' array with what 'data' responded with
            _.each(data.edges, function (element, index) {
                tempObj.edges.push($.extend(true, {}, element));
            });
            //reset 'edges' array with what is contained in 'completeGraphData'
            _.each(completeGraphData.edges, function (element, index) {
                tempObj.edges.push($.extend(true, {}, element));
            });

            //update the nodes inEdge and outEdge properties with the new edges
            _.each(data.nodes, function(newNode, index) {
                //updated nodes outEdge
                _.each(newNode.inEdge, function(edge, edgeIndex) {
                    tempObj.nodes[edge.source].outEdge.push(edge);
                });
                //updated nodes inEdge
                _.each(newNode.outEdge, function(edge, edgeIndex) {
                    tempObj.nodes[edge.target].inEdge.push(edge);
                });
            });

            //at this point tempObj contains the complete graph so reset 'completeGraphData' to it
            completeGraphData = $.extend(true, {}, tempObj);
            return tempObj;
        }

        //could be used?
        /**
         * @name removeFromCompleteGraph
         * TODO: DOC
         */
        function removeFromCompleteGraph(oldNodes, graphData) {
            var removeNode;
            for (var i=0; i<oldNodes.length; i++) {
                this.removeNode(oldNodes[i], graphData);
            }
            return graphData;
        }

        //find node by 'id' within nodes array
        /**
         * @name findNode
         * TODO: DOC
         */
        function findNode(id, graphData) {
            for (var i in graphData.nodes) {
                if (graphData.nodes[i]["uri"] === id) {
                    return graphData.nodes[i];
                }

            }
        }

        //remove node and all it's connected links
        /**
         * @name removeNode
         * TODO: DOC
         */
        function removeNode(id, graphData) {
            var i = 0,
                n = this.findNode(id, graphData);
            if (n) {
                while (i < graphData.edges.length) {
                    if ((graphData.edges[i]["source"].id === n.uri) || (graphData.edges[i]["target"].id == n.uri)) {
                        graphData.edges.splice(i, 1);
                    }
                    else {
                        i++;
                    }
                }
                delete graphData.nodes[id];
            }
        }

        /**
         * @name checkTraverseState
         * TODO: DOC
         */
        function checkTraverseState(currentStep, chartSteps) {
            var traverseCount = 0;
            var totalStepCount = chartSteps.length;

            //get the number of traversals we are off
            for (var i=currentStep; i<totalStepCount; i++) {
                if (chartSteps[i] === "Traverse") {
                    traverseCount++;
                }
            }

            return traverseCount;
        }

        /**
         * @name getConnectedNodes
         * TODO: DOC
         */
        function getConnectedNodes(engine, uri) {
            return monolithService.getConnectedNodes(engine, uri)
                .then(function (data) {
                    return data;
                });
        }

        /**
         * @name getEdgesForURI
         * @params newEdges {array} - the edges to add to the graph
         * @params uriArray {array} - selected uri array
         * @params direction {string} - traversal direction
         * @desc compare data sets to find the edges that need to be added to the graph
         * @returns {filteredEdges}
         */
        function getEdgesForURI(currNodes, newEdges, uriArray, direction) {
            var filteredEdges = [];
            var currNodeKeys = _.keys(currNodes);
            var newEdgesSourceURIs = _.uniq(_.map(newEdges, 'source'));
            var newEdgesTargetURIs = _.uniq(_.map(newEdges, 'target'));
            for (var i = 0; i < uriArray.length; i++) {
                if (direction === "downstream") {
                    if (_.includes(newEdgesTargetURIs, uriArray[i])) {
                        var edges = _.filter(newEdges, function (edge) {
                            return (edge.target === uriArray[i]) && (!_.includes(currNodeKeys, edge.source));
                        });
                        filteredEdges = filteredEdges.concat(edges);
                    }
                } 
                else if (direction === "upstream") {
                    if (_.includes(newEdgesSourceURIs, uriArray[i])) {
                        var edges = _.filter(newEdges, function (edge) {
                            return (edge.source === uriArray[i]) && (!_.includes(currNodeKeys, edge.target));
                        });
                        filteredEdges = filteredEdges.concat(edges);
                    }
                }
            }
            return filteredEdges;
        }

        /**
         * @name filterTraverseData
         * @params newNodes {array} - the edges to add to the graph
         * @params newEdges {array} - the edges to add to the graph
         * @params uriArray {array} - selected uri array
         * @params direction {string} - traversal direction
         * @desc compare data sets to find the edges that need to be added to the graph
         * @returns {filteredEdges}
         */
        function filterTraverseData(currNodes, newNodes, newEdges, uriArray, direction) {
            var newNodesAndEdges = {
                'nodes': {},
                'edges': this.getEdgesForURI(currNodes, newEdges, uriArray, direction)
            };

            //need to filter out the nodes based on the filtered edges
            var newNodeKeys = _.keys(newNodes);
            if (direction === "downstream") {
                var newEdgesSourceURIs = _.uniq(_.map(newNodesAndEdges.edges, 'source'));
                for (var i = 0; i < newEdgesSourceURIs.length; i++) {
                    newNodesAndEdges.nodes[newEdgesSourceURIs[i]] = newNodes[newEdgesSourceURIs[i]];
                }
            } else if (direction === "upstream") {
                var newEdgesTargetURIs = _.uniq(_.map(newNodesAndEdges.edges, 'target'));
                for (var i = 0; i < newEdgesTargetURIs.length; i++) {
                    newNodesAndEdges.nodes[newEdgesTargetURIs[i]] = newNodes[newEdgesTargetURIs[i]];
                }
            }

            return newNodesAndEdges;
        }

        /**
         * @name getRemovalGraphData
         * @params newData {object}
         * @params oldData {object}
         * @desc compare data sets to find the nodes and edges that need to be removed from the graph
         */
        function getRemovalGraphData(newData, oldData) {
            var removalData = {};
            var removalNodeURIs = _.difference(_.keys(oldData.nodes), _.keys(newData.nodes));
            var removalNodes = {};
            var removalEdges = [];
            //find nodes to remove
            for (var node in oldData.nodes) {
                if (_.includes(removalNodeURIs, node)) {
                    removalNodes[node] = oldData.nodes[node];
                }
            }
            //find edges to remove
            for (var i = 0; i < oldData.edges.length; i++) {
                var keepEdge = false;
                for (var j = 0; j < newData.edges.length; j++) {
                    if (oldData.edges[i].uri === newData.edges[j].uri) {
                        keepEdge = true;
                    }
                }

                if (!keepEdge) {
                    removalEdges.push(oldData.edges[i]);
                }
            }

            removalData.nodes = removalNodes;
            removalData.edges = removalEdges;
            return removalData;
        }

        /**
         * @name getNewEdges
         * @params newData {object}
         * @params oldData {object}
         * @desc compare data sets to find the nodes and edges that need to be added to the graph
         */
        function getAdditionalGraphData(newData, oldData) {
            var newAddtionalData = {};
            var newNodeURIs = _.difference(_.keys(newData.nodes), _.keys(oldData.nodes));
            var newNodes = {};
            var newEdges = [];
            //find nodes to add
            for (var node in newData.nodes) {
                if (_.includes(newNodeURIs, node)) {
                    newNodes[node] = newData.nodes[node];
                }
            }
            //find edges to add
            for (var i = 0; i < newData.edges.length; i++) {
                var addEdge = true;
                for (var j = 0; j < oldData.edges.length; j++) {
                    if (newData.edges[i].uri === oldData.edges[j].uri) {
                        addEdge = false;
                    }
                }

                if (addEdge) {
                    newEdges.push(newData.edges[i]);
                }
            }

            newAddtionalData.nodes = newNodes;
            newAddtionalData.edges = newEdges;
            return newAddtionalData;
        }

        return {
            parseNodeResizeProps: parseNodeResizeProps,
            parseEdgeResizeProps: parseEdgeResizeProps,
            appendToCompleteGraph: appendToCompleteGraph,
            removeFromCompleteGraph: removeFromCompleteGraph,
            findNode: findNode,
            removeNode: removeNode,
            checkTraverseState: checkTraverseState,
            getConnectedNodes: getConnectedNodes,
            getEdgesForURI: getEdgesForURI,
            filterTraverseData: filterTraverseData,
            getRemovalGraphData: getRemovalGraphData,
            getAdditionalGraphData: getAdditionalGraphData
        };
    }
})();