(function () {
    'use strict';
    /**
     * @name cluster
     * @descCluster directive for creating and visualizing a cluster diagram
     */
    angular.module("app.cluster.directive", [])
        .directive("cluster", cluster);

    cluster.$inject = ["$filter"];

    function cluster($filter) {
        clusterLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'A',
            require: ["chart"],
            priority: 300,
            link: clusterLink
        };

        function clusterLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];
            scope.chartCtrl.margin = {left: 20, top: 20, right: 20, bottom: 20};

            var clusterData = {},
                numGroups = 0,
                label = '',
                groupingCategory = "ClusterID",
                groupingCategoryInstances = {},
                numberOfClusters = 0,
                w = scope.chartCtrl.container.width,
                h = scope.chartCtrl.container.height,
                force = d3.layout.force(),
                node;

            var zoom = d3.behavior.zoom()
                .scaleExtent([0.1, 10])
                .on("zoom", zoomed);

            var drag = d3.behavior.drag()
                .origin(function (d) {
                    return d;
                })
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragended);

            var tip = d3.tip().attr("class", "d3-tip")
                .attr("id", "cluster-d3-tip")
                .style("z-index", "10000")
                .html(function (d) {
                    var tooltipText = "<div>";

                    clusterData.headers.forEach(function (header) {
                        if (d[header.title]) {
                            tooltipText += "    <span class='light'>" + header.title + ": " + $filter('shortenAndReplaceUnderscores')(d[header.title]) + "</span><br/>";
                        }
                    });

                    tooltipText += "</div>";

                    return tooltipText;

                });

            var html = '<div style="overflow:hidden" class="append-viz" id=' + scope.chartCtrl.chartName + "-append-viz" + '><div class="absolute-size" id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append(html);

            var fill = d3.scale.category20();
            var vis = d3.select('#' + scope.chartCtrl.chartName).append("svg")
                .attr("width", scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right)
                .attr("height", scope.chartCtrl.container.height + scope.chartCtrl.margin.top + scope.chartCtrl.margin.bottom)
                .call(zoom)
                .on("dblclick.zoom", null);
            var container = vis.append("g");

            scope.chartCtrl.dataProcessor = function (data) {
                if (data == undefined || data == null || data.length == 0 || data == '') {
                    clusterData = {};
                } else {
                    if (clusterData != data) {
                        clusterData = JSON.parse(JSON.stringify(data));
                        label = clusterData.dataTableAlign['label'];
                        groupingCategory = clusterData.dataTableAlign['clusterID'];
                        update(clusterData.data);
                    }
                }
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
            };

            scope.chartCtrl.resizeViz = function () {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                w = scope.chartCtrl.container.width;
                h = scope.chartCtrl.container.height;
                d3.select("#" + scope.chartCtrl.chartName).select("svg")
                    .attr("width", scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right)
                    .attr("height", scope.chartCtrl.container.height + scope.chartCtrl.margin.top + scope.chartCtrl.margin.bottom);

                force.size([w, h]).resume();

            };

            scope.chartCtrl.filterAction = function () {
            };


            function zoomed() {
                container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }

            function dragstarted(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed("dragging", true);
            }

            function dragged(d) {
                d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
            }

            function dragended(d) {
                d3.select(this).classed("dragging", false);
            }

            var getCategoryInstances = function (cat, nodeData) {
                var categoryInstances = {};
                var j = 0;
                for (var i = 0; i < nodeData.length; i++) {
                    if (!(nodeData[i][cat] in categoryInstances)) {
                        categoryInstances[nodeData[i][cat]] = j;
                        j++;
                    }
                }
                numGroups = j + 1;

                return categoryInstances;
            };

            function update(updateData) {
                //set height and width
                d3.select('#' + scope.chartCtrl.chartName).select('svg').select('g').selectAll("*").remove();
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                w = scope.chartCtrl.container.width;
                h = scope.chartCtrl.container.height;

                var data = updateData;


                groupingCategoryInstances = getCategoryInstances(groupingCategory, data);
                numberOfClusters = Object.keys(groupingCategoryInstances).length;

                var groups = d3.nest().key(function (d) {
                    return d[groupingCategory];
                }).entries(data);

                var ordgroups = groups.sort(function (a, b) {
                    return parseFloat(a.key) - parseFloat(b.key)
                });


                force
                    .nodes(data)
                    .links([])
                    .size([w, h])
                    .charge(-8)
                    .start();

                node = container.selectAll("circle.node")
                    .data(data);


                node
                    .enter().append("circle")
                    .attr("class", "node")
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    })
                    .attr("r", 8)
                    .style("fill", function (d, i) {
                        return fill(d[groupingCategory]);
                    })
                    .style("stroke", function (d, i) {
                        return "#777";
                    })
                    .style("stroke-width", 1.5)
                    .call(force.drag);

                node
                    .on("mouseover", function (d) {
                        tip.show(d);

                        var currentNode = d;
                        node.each(function (d) {
                            if (currentNode[label] !== d[label]) {
                                d3.select(this)
                                    .attr('opacity', .4);
                            }
                        })

                    })
                    .on("mouseout", function (d) {
                        tip.hide(d);
                        node.each(function (d) {
                            d3.select(this)
                                .attr('opacity', 1);
                        })
                    });
                /*.on("dblclick", function (d) {
                 console.log(d)
                 })*/


                force.on("tick", function (e) {
                    var k = 4 * e.alpha;
                    var heightAmplification;
                    var heightOffset = -h / 2;
                    var widthAmplification;
                    var widthOffset = -w / 2;

                    if (numGroups > 20) {
                        heightAmplification = 0.020;
                        widthAmplification = 0.015;
                    } else if (numGroups > 10) {
                        heightAmplification = 0.010;
                        widthAmplification = 0.014;
                    } else if (numGroups > 5) {
                        heightAmplification = 0.009;
                        widthAmplification = 0.008;
                    } else {
                        heightAmplification = 0.005;
                        widthAmplification = 0.005;
                    }

                    function calculatePositionIncrements(i) {
                        var n = Math.ceil(Math.sqrt(numberOfClusters) + 1);
                        var j = Math.ceil((Math.pow(n, 2) / numberOfClusters) * (0.5 + i));
                        var yPositionIncrement = (heightOffset + Math.ceil(j / n) * (h / n)) * heightAmplification * k;
                        var xPositionIncrement = (widthOffset + (j % n) * (w / n)) * widthAmplification * k;
                        return {
                            yPositionIncrement: yPositionIncrement,
                            xPositionIncrement: xPositionIncrement
                        }
                    }

                    data.forEach(function (o, i) {
                        var index = groupingCategoryInstances[o[groupingCategory]];
                        var increments = calculatePositionIncrements(index);
                        o.y += increments.yPositionIncrement;
                        o.x += increments.xPositionIncrement;

                    });

                    node
                        .attr("cx", function (d) {
                            return d.x;
                        })
                        .attr("cy", function (d) {
                            return d.y;
                        });
                });

                vis.call(tip);
                scope.chartCtrl.resizeViz();
            }

            //cleaning up d3-tooltip
            scope.$on("$destroy", function () {
                d3.selectAll("#cluster-d3-tip").remove();
            });

        }
    }
})();