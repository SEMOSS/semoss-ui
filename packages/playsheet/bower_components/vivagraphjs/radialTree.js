module.exports = createLayout;


/**
 * Creates force based layout for a given graph.
 *
 * @param {ngraph.graph} graph which needs to be laid out
 * @param {object} userSettings if you need custom settings
 * for physics simulator you can pass your own settings here. If it's not passed
 * a default one will be created.
 */
function createLayout(graph, userSettings) {
    if (!graph) {
        throw new Error('Graph structure cannot be undefined');
    }

    if (!userSettings) {
        userSettings = {}
    }

    if (!userSettings.rScale) {
        userSettings.rScale = 100
    }


    //initial variables
    var nodes = {}, links = {}, graphRect = {};

    graphRect = {
        x1: Number.MAX_VALUE,
        y1: Number.MAX_VALUE,
        x2: Number.MIN_VALUE,
        y2: Number.MIN_VALUE
    }

    //layout
    setRadialLayout(userSettings.rootId);
    graph.forEachNode(function (node) {
        var currentNode = nodes[node.id]
        updateGraphRect(currentNode.pos);
    });

    var api = {
        /**
         * Performs one step of iterative layout algorithm
         *
         * @returns {boolean} true if the system should be considered stable; Flase otherwise.
         * The system is stable if no further call to `step()` can improve the layout.
         */
        step: function () {
            return true;
        },

        /**
         * For a given `nodeId` returns position
         */
        getNodePosition: function (nodeId) {
            return nodes[nodeId].pos
        },

        /**
         * Sets position of a node to a given coordinates
         * @param {string} nodeId node identifier
         * @param {number} x position of a node
         * @param {number} y position of a node
         * @param {number=} z position of node (only if applicable to body)
         */
        setNodePosition: function (nodeId, x, y) {
            nodes[nodeId].pos.x = x;
            nodes[nodeId].pos.y = y;
        },

        /**
         * @returns {Object} Link position by link id
         * @returns {Object.from} {x, y} coordinates of link start
         * @returns {Object.to} {x, y} coordinates of link end
         */
        getLinkPosition: function (linkId) {
            return {
                from: this.getNodePosition(links[linkId].fromId),
                to: this.getNodePosition(links[linkId].toId)
            }
        },

        /**
         * @returns {Object} area required to fit in the graph. Object contains
         * `x1`, `y1` - top left coordinates
         * `x2`, `y2` - bottom right coordinates
         */
        getGraphRect: function () {
            return graphRect
        },

        /*
         * Requests layout algorithm to pin/unpin node to its current position
         * Pinned nodes should not be affected by layout algorithm and always
         * remain at their position
         */
        pinNode: function (node, isPinned) {
            nodes[node.id].isPinned = isPinned;
        },

        /**
         * Checks whether given graph's node is currently pinned
         */
        isNodePinned: function (node) {
            return nodes[node.id].isPinned;
        },

        /**
         * Request to release all resources
         */
        dispose: function () {
            console.log('dispose')
        },

        /**
         * Gets amount of movement performed during last step opeartion
         */
        lastMove: 0,

        //node
        updateRadialLayout: function (rootId) {
            setRadialLayout(rootId);
            graph.forEachNode(function (node) {
                var currentNode = nodes[node.id]
                updateGraphRect(currentNode.pos);
            });
        }
    };

    return api;

    /*** Helper **/
    function updateGraphRect(position) {
        if (position.x < graphRect.x1) {
            graphRect.x1 = position.x;
        }
        if (position.x > graphRect.x2) {
            graphRect.x2 = position.x;
        }
        if (position.y < graphRect.y1) {
            graphRect.y1 = position.y;
        }
        if (position.y > graphRect.y2) {
            graphRect.y2 = position.y;
        }
    }

    /*** Layout Functions **/
    function setRadialLayout(rootId) {
        nodes = [];
        links = [];
        graph.forEachNode(function (node) {
            nodes[node.id] = node;
            nodes[node.id].radialLayout = {
                added: false,
                start: 0,
                end: 2 * Math.PI,
                r: 1
            };
            nodes[node.id].added = false;
            nodes[node.id].pos = {
                x: 0, y: 0
            }
        });

        graph.forEachLink(function (link) {
            links[link.id] = link;
        });

        var treeStructure = {id: 'root', 'children': []};

        //if we have a pre defined root
        if (rootId) {
            var currentNode = nodes[rootId];
            if (currentNode && !currentNode.added) {
                //add current to tree
                treeStructure.children.push({id: currentNode.id, children: []});

                //add children to tree
                addToTree(false, treeStructure.children[treeStructure.children.length - 1]);
            }
        }


        for (var i in nodes) {
            var currentNode = nodes[i];
            if (!currentNode.added) {
                //add current to tree
                treeStructure.children.push({id: currentNode.id, children: []});

                //add children to tree
                addToTree(false, treeStructure.children[treeStructure.children.length - 1]);

            }
        }

        //if there is only one child of root, we don't need root.
        if (treeStructure.children.length === 1) {
            treeStructure = treeStructure.children[0]
        }


        //after in tree calculate position
        //do first level
        for (var i in treeStructure.children) {
            calculatePositionForBranch(treeStructure, treeStructure.children[i]);
        }

        //helper functions
        //create tree
        function addToTree(parentBranch, currentBranch) {
            //don't add if added
            var currentNode = nodes[currentBranch.id];
            if (currentNode.added) {
                return
            }
            currentNode.added = true;

            //search tree
            if (parentBranch) {
                parentBranch.children.push(currentBranch)
            }

            //look at children
            for (var i = 0; i < currentNode.links.length; i++) {
                var childBranch = false;
                if (currentNode.id === currentNode.links[i].fromId) {
                    childBranch = {id: currentNode.links[i].toId, children: []}
                }

                if (childBranch) {
                    addToTree(currentBranch, childBranch);
                }
            }
        }


        //position calculator
        function calculatePositionForBranch(parentBranch, currentBranch) {
            var parentNode = nodes[parentBranch.id], currentNode = nodes[currentBranch.id];


            if (!parentNode) {
                parentNode = {
                    radialLayout: {
                        added: false,
                        start: 0,
                        end: 2 * Math.PI,
                        r: 1
                    }
                }
            }

            //zone position
            currentNode.radialLayout.start = parentNode.radialLayout.start + (parentNode.radialLayout.end - parentNode.radialLayout.start) / parentBranch.children.length * (parentBranch.children.indexOf(currentBranch));
            currentNode.radialLayout.end = parentNode.radialLayout.start + (parentNode.radialLayout.end - parentNode.radialLayout.start) / parentBranch.children.length * (parentBranch.children.indexOf(currentBranch) + 1);

            //actual position
            currentNode.radialLayout.theta = currentNode.radialLayout.start + (currentNode.radialLayout.end - currentNode.radialLayout.start) / 2;

            //levels
            currentNode.radialLayout.r = parentNode.radialLayout.r + 1;


            //polar to x
            currentNode.pos.x = currentNode.radialLayout.r * Math.cos(currentNode.radialLayout.theta) * (userSettings.rScale);

            //polar to y
            currentNode.pos.y = currentNode.radialLayout.r * Math.sin(currentNode.radialLayout.theta) * (userSettings.rScale);

            //calculate children
            for (var i in currentBranch.children) {
                calculatePositionForBranch(currentBranch, currentBranch.children[i])
            }
        }


    }
}