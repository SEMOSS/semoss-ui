(function () {
    "use strict";

    /**
     * @name viva-graph.service.js
     * @desc service for the viva-graph visualization
     */
    angular.module("app.viva-graph.service", [])
        .factory("vivaGraphService", vivaGraphService);

    vivaGraphService.$inject = ["_"];

    function vivaGraphService(_) {

        /**
         * @name parseNodeResizeProps
         * @param nodes {Object} nodes for the graph
         * @param nodeResizeProps {Object} properties on the nodes that can be used to resize a node
         * @desc given the nodes and resize properties objects, parse the back-end input such that the properties are in the right format
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
                                nodeType: propHash["VERTEX_TYPE_PROPERTY"],
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
         * @param edges {Object} edges for the graph
         * @param edgeResizeProps {Object} properties on the edges that can be used to resize a node
         * @desc given the edges and resize properties objects, parse the back-end input such that the properties are in the right format
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

        return {
            parseNodeResizeProps: parseNodeResizeProps,
            parseEdgeResizeProps: parseEdgeResizeProps
        };
    }
})();