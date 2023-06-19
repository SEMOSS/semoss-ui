(function () {
    "use strict";
    /**
     * @name dendrogram
     * @desc Dendrogram directive for flattening and visualizing a dendrogram
     */

    angular.module("app.dendrogram.directive", [])
        .directive("dendrogram", dendrogram);

    dendrogram.$inject = ["$compile"];

    function dendrogram($compile) {
        DendrogramLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: "A",
            require: ["chart"],
            priority: 300,
            link: DendrogramLink
        };


        function DendrogramLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            var html = '<div class="append-viz overflow-hidden" id=' + scope.chartCtrl.chartName + "-append-viz" + '><div class="absolute-size" id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            var width, height, viz,
                svg,
                margin = {top: 20, right: 120, bottom: 20, left: 120},
                nodeHeightSpace = 20,   //This is an arbitrary but tested value by which we scale the height
                nodeWidthSpace = 180;   //This is an arbitrary but tested value by which we scale the width

            //Widget Functions
            scope.chartCtrl.dataProcessor = function (data) {
                if (!(data === undefined || data === null || data === {} || data === '')) {
                    d3.select("#" + scope.chartCtrl.chartName).selectAll("*").remove();
                    var rootData;
                    if (!data.specificData || _.isEmpty(data.specificData)) {
                        var headers = [];
                        if (data.dataTableAlign) {
                            for (var header in data.dataTableAlign) {
                                headers.push(data.dataTableAlign[header]);
                            }
                        } else {
                            for (var header in data.headers) {
                                headers.push(data.headers[header].title);
                            }
                        }
                        rootData = processTableData(JSON.parse(JSON.stringify(data.filteredData)), headers);
                    } else {
                        rootData = JSON.parse(JSON.stringify(data.specificData));
                    }
                    setConfig(rootData);
                    update(rootData);
                } else {
                    console.log("no data");
                }
            };

            //pass in all of the tabular data and the selected levels (dataTableAlign); we will set up the tree data according to the order of the data table align
            function processTableData(data, tableHeaders) {
                var allHash = {}, list = [], rootMap = {}, currentMap = {};

                for (var i in data) { //all of this is to change it to a tree structure and then call makeTree to structure the data appropriately for this viz
                    var count = 0;

                    for (var j = 0; j < tableHeaders.length; j++) {
                        var currentValue = data[i][tableHeaders[j].replace(/[_]/g, " ")].toString().replace(/["]/g, ""), nextMap = {};

                        if (count === 0) { // will take care of the first level and put into rootmap if it doesnt already exist in rootmap
                            currentMap = rootMap[currentValue];

                            if (!currentMap) {
                                currentMap = {};
                                rootMap[currentValue] = currentMap;
                            }

                            nextMap = currentMap;
                            count++;
                        } else {
                            nextMap = currentMap[currentValue];

                            if (!nextMap) {
                                nextMap = {};
                                currentMap[currentValue] = nextMap;
                            }

                            currentMap = nextMap;
                        }
                    }
                }

                makeTree(rootMap, list);

                allHash["name"] = "root";
                allHash["children"] = list;
                return allHash;
            }

            function makeTree(map, list) {
                var keyset = Object.keys(map),
                    childSet = [];

                for (var key in keyset) {
                    var childMap = map[keyset[key]],
                        dataMap = {};

                    dataMap["name"] = keyset[key];

                    if (_.isEmpty(childMap)) {
                        list.push(dataMap);
                    } else {
                        dataMap["children"] = childSet;
                        list.push(dataMap);

                        makeTree(childMap, childSet);
                        childSet = [];
                    }
                }
            }

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartCtrl.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartCtrl.resizeViz = function () {
                //console.log('Need To Add Resize Mechanism')
            };

            function zoom() {
                svg.attr("transform", "translate("
                    + d3.event.translate
                    + ")scale(" + d3.event.scale + ")");
            }

            function setConfig(rootData) {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                var countHeight = 0;
                var countWidth = 1; //Every Dendrogram has at least one level

                //The treeHeightCount function returns the number of instances in the last level of the tree
                function treeHeightCount(dataset) { //recursive funciton
                    if (dataset.children) {
                        for (var i = 0; i < dataset.children.length; i++) {
                            treeHeightCount(dataset.children[i]);
                        }
                    } else {
                        countHeight++;
                    }
                    return countHeight;
                }

                //The treeWidthCount function returns the number of levels in the tree
                function treeWidthCount(dataset) {	//recursive function
                    if (dataset.children) {
                        countWidth++;	//If there exists a level below the current level, add 1 to the countWidth (number of levels in Dendrogram).
                        for (var i = 0; i < dataset.children.length; i++) {
                            treeWidthCount(dataset.children[i]);
                            return countWidth;
                        }
                    }
                }

                var heightCount = treeHeightCount(rootData);
                var widthCount = treeWidthCount(rootData);

                width = widthCount * nodeWidthSpace;
                height = heightCount * nodeHeightSpace;

                var chartWidth = width > scope.chartCtrl.container.width ? width : scope.chartCtrl.container.width;
                var chartHeight = height > scope.chartCtrl.container.height ? height : scope.chartCtrl.container.height;

                //create the svg
                viz = d3.select("#" + scope.chartCtrl.chartName).append("svg")
                    .attr("class", "full-width full-height")
                    .call(
                        d3.behavior.zoom()
                            .scaleExtent([.1, 10])
                            .on("zoom", zoom)
                    );

                svg = viz.append("g")
                    .attr("transform", "translate(" + margin.left * 3 + "," + margin.top * 3 + ")");

                //clear the elements inside of the directive
                svg.selectAll('*').remove();
            }

            function update(rootData) {
                var i = 0,
                    duration = 750,
                    root;

                var tree = d3.layout.tree()
                    .size([height, width]);

                var diagonal = d3.svg.diagonal()
                    .projection(function (d) {
                        return [d.y, d.x];
                    });

                // d3.json(data, function(error, flare) {
                root = rootData;
                root.x0 = height / 2;
                root.y0 = 0;

                function collapse(d) {
                    if (d.children) {
                        d._children = d.children;
                        d._children.forEach(collapse);
                        //d.children = null;
                    }
                }

                root.children.forEach(collapse);
                updateviz(root);
                //  });

                d3.select(self.frameElement).style("height", "800px");

                function updateviz(source) {

                    // Compute the new tree layout.
                    var nodes = tree.nodes(root).reverse(),
                        links = tree.links(nodes);

                    // Normalize for fixed-depth.
                    nodes.forEach(function (d) {
                        d.y = d.depth * 180;
                    });

                    // Update the nodes…
                    var node = svg.selectAll("g.node")
                        .data(nodes, function (d) {
                            return d.id || (d.id = ++i);
                        });

                    // Enter any new nodes at the parent's previous position.
                    var nodeEnter = node.enter().append("g")
                        .attr("class", "node")
                        .style("cursor", "pointer")
                        .attr("transform", function (d) {
                            return "translate(" + source.y0 + "," + source.x0 + ")";
                        })
                        .on("click", click);

                    nodeEnter.append("circle")
                        .attr("r", 1e-6)
                        .style("fill", function (d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        })
                        .style("stroke", "steelblue")
                        .style("stroke-width", "1.5px");

                    nodeEnter.append("text")
                        .attr("x", function (d) {
                            return d.children || d._children ? -10 : 10;
                        })
                        .attr("dy", ".35em")
                        .attr("text-anchor", function (d) {
                            return d.children || d._children ? "end" : "start";
                        })
                        .text(function (d) {
                            return d.name;
                        })
                        .style("fill-opacity", 1e-6)
                        .style("font", "10px san-serif");

                    // Transition nodes to their new position.
                    var nodeUpdate = node.transition()
                        .duration(duration)
                        .attr("transform", function (d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        });

                    nodeUpdate.select("circle")
                        .attr("r", 4.5)
                        .style("fill", function (d) {
                            return d._children ? "lightsteelblue" : "#fff";
                        });

                    nodeUpdate.select("text")
                        .style("fill-opacity", 1);

                    // Transition exiting nodes to the parent's new position.
                    var nodeExit = node.exit().transition()
                        .duration(duration)
                        .attr("transform", function (d) {
                            return "translate(" + source.y + "," + source.x + ")";
                        })
                        .remove();

                    nodeExit.select("circle")
                        .attr("r", 1e-6);

                    nodeExit.select("text")
                        .style("fill-opacity", 1e-6);

                    // Update the links…
                    var link = svg.selectAll("path.link")
                        .data(links, function (d) {
                            return d.target.id;
                        });

                    // Enter any new links at the parent's previous position.
                    link.enter().insert("path", "g")
                        .attr("class", "link")
                        .attr("d", function (d) {
                            var o = {x: source.x0, y: source.y0};
                            return diagonal({source: o, target: o});
                        })
                        .style("fill", "none")
                        .style("stroke", "#ccc")
                        .style("stroke-width", "1.5px");

                    // Transition links to their new position.
                    link.transition()
                        .duration(duration)
                        .attr("d", diagonal);

                    // Transition exiting nodes to the parent's new position.
                    link.exit().transition()
                        .duration(duration)
                        .attr("d", function (d) {
                            var o = {x: source.x, y: source.y};
                            return diagonal({source: o, target: o});
                        })
                        .remove();

                    // Stash the old positions for transition.
                    nodes.forEach(function (d) {
                        d.x0 = d.x;
                        d.y0 = d.y;
                    });

                    //draw special Legend
                    if (rootData.stats) {
                        var legend = viz.selectAll(".legend")
                            .data(rootData.stats);

                        //enter legend g
                        var legendEnter = legend.enter().append("g")
                            .attr("class", "legend");

                        legendEnter.append("text")
                            .attr("x", function (d, i) {
                                return (margin.right / 2 + 1);
                            })
                            .attr("y", function (d, i) {
                                return (margin.top + 15 * (i + 1));
                            })
                            .attr("dy", ".25em")
                            .style("text-anchor", "start")
                            .text(function (d) {
                                var statKey = _.keys(d)[0];
                                return statKey + ": " + d[statKey];
                            });
                    }
                }

                // Toggle children on click.
                function click(d) {
                    if (d.children) {
                        d._children = d.children;
                        d.children = null;
                    } else {
                        d.children = d._children;
                        d._children = null;
                    }
                    updateviz(d);
                }

                /*var insertLinebreaks = function (d) {
                 var el = d3.select(this);
                 var words = d.split(' ');
                 el.text('');

                 for (var i = 0; i < words.length; i++) {
                 var tspan = el.append('tspan').text(words[i]);
                 if (i > 0)
                 tspan.attr('x', 0).attr('dy', '15');
                 }
                 };*/
            }
        }
    }
})();