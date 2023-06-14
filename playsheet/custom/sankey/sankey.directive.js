(function () {
    "use strict";

    angular.module("app.sankey.directive",[])
        .directive("sankey", sankey);

    sankey.$inject = ["$rootScope", "$filter", "$timeout", "$compile"];


    function sankey($rootScope, $filter, $timeout, $compile) {

        sankeyLink.$inject = ["scope", "ele", "attrs", "controllers"];
        sankeyCtrl.$inject = ["$scope"];

        return {
            restrict: "EA",
            require: ['^chart'],
            priority: 300,
            link: sankeyLink,
            controller: sankeyCtrl
        };

        function sankeyLink(scope, ele, attrs, controllers) {
            scope.chartController = controllers[0];

            //widget variables
            scope.chartController.margin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            };

            var localData, graph, chartwidth, chartheight, nodeMap, sankey, viz, svg, path, margin, width, height, link;

            var units = "Widgets";

            var formatNumber = d3.format(",.0f"),    // zero decimal places
                format = function (d) {
                    return formatNumber(d) + " " + units;
                },
                color = d3.scale.category20();

            //inserting id for div
            var html = '<div class="append-viz" id=' + scope.chartController.chartName + "-append-viz" + ' ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\"><div class="absolute-size sankey" id=' + scope.chartController.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            //Widget functions
            scope.chartController.dataProcessor = function () {
                if (!_.isEmpty(scope.chartController.data.data)) {
                    scope.chartController.containerSize(scope.chartController.container, scope.chartController.margin);
                    update();
                }
            };

            scope.chartController.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartController.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartController.resizeViz = function () {
                scope.chartController.containerSize(scope.chartController.container, scope.chartController.margin);
                update();
            };

            //update
            function update() {
                d3.select("#" + scope.chartController.chartName).selectAll("*").remove();

                localData = JSON.parse(JSON.stringify(scope.chartController.data));

                console.log(scope.chartController.data);
                console.log(localData);

                graph = {"nodes": [], "links": []};
                nodeMap = {};

                var top = scope.chartController.margin.top;
                var right = scope.chartController.margin.right;
                var bottom = scope.chartController.margin.bottom;
                var left = scope.chartController.margin.left;
                scope.chartController.containerSize(scope.chartController.container, scope.chartController.margin);
                var chartHeight = scope.chartController.container.height;
                var chartWidth = scope.chartController.container.width;

                margin = {top: top, right: right, bottom: bottom, left: left};
                width = chartWidth - margin.left - margin.right;
                height = chartHeight - margin.top - margin.bottom;

                //loop through and if value is not a numerical value, change it to 1 as default

                console.log(localData.specificData.links);
                console.log(localData);
                for (var index in localData.specificData.links) {
                    if (!parseInt(localData.specificData.links[index].value)) {
                        localData.specificData.links[index].value = 1;
                    }
                }

                graph.nodes = localData.specificData.nodes;
                graph.links = localData.specificData.links;

                sankey = d3.sankey()
                    .nodeWidth(10)
                    .nodePadding(15)
                    .size([width, height]);

                path = sankey.link();

                viz = d3.select("#" + scope.chartController.chartName).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .call(d3.behavior.zoom()
                        .scaleExtent([.1, 10])
                        .on("zoom", zoom));

                svg = viz.append("g")
                    .attr("transform",
                        "translate(" + margin.left + "," + margin.top + ")");

                processData();
                draw();
            }

            function zoom() {
                svg.attr("transform", "translate("
                    + d3.event.translate
                    + ")scale(" + d3.event.scale + ")");
            }

            //Add ids to each node and link
            function processData() {

                graph.nodes.forEach(function (x, i) {
                    nodeMap[x.name] = x;
                    nodeMap[x.name].id = "node-" + i;
                });

                graph.links = graph.links.map(function (x, i) {
                    return {
                        source: nodeMap[x.source],
                        target: nodeMap[x.target],
                        value: x.value,
                        id: "link-" + i
                    };
                });

                sankey
                    .nodes(graph.nodes)
                    .links(graph.links)
                    .layout(32);
            }

            //render diagram on canvas
            function draw() {
                // add in the links
                link = svg.append("g").selectAll(".link")
                    .data(graph.links)
                    .enter().append("path")
                    .attr("class", "link")
                    .attr("d", path)
                    .style("stroke-width", function (d) {
                        return Math.max(1, d.dy);
                    })
                    .sort(function (a, b) {
                        return b.dy - a.dy;
                    });

                // add the link titles
                link.append("title")
                    .text(function (d) {
                        return $filter("shortenAndReplaceUnderscores")(d.source.name) + " → " +
                            $filter("shortenAndReplaceUnderscores")(d.target.name) + "\n" + format(d.value);
                    });

                // add in the nodes
                var node = svg.append("g").selectAll(".node")
                    .data(graph.nodes)
                    .enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    })
                    .call(d3.behavior.drag()
                        .origin(function (d) {
                            return d;
                        })
                        .on("dragstart", function () {
                            d3.event.sourceEvent.stopPropagation();
                            this.parentNode.appendChild(this);
                        })
                        .on("drag", dragmove));

                // add the rectangles for the nodes
                node.append("rect")
                    .attr("height", function (d) {
                        var hy = Math.abs(d.dy);
                        return hy;
                    })
                    .attr("transform", function (d) {
                        return "translate(" + 0 + "," +  0 + ")";
                    })
                    .attr("width", sankey.nodeWidth())
                    .style("fill", function (d) {
                        return d.color = color(d.name.replace(/ .*/, ""));
                    })
                    .style("stroke", function (d) {
                        return d3.rgb(d.color).darker(2);
                    })
                    .append("title")
                    .text(function (d) {
                        return $filter("shortenAndReplaceUnderscores")(d.name) + "\n" + format(d.value);
                    });

                // add in the title for the nodes
                node.append("text")
                    .attr("x", -6)
                    .attr("y", function (d) {
                        return d.dy / 2;
                    })
                    .attr("dy", ".35em")
                    .attr("text-anchor", "end")
                    .attr("transform", null)
                    .text(function (d) {
                        /*
                         var newString;
                         if(d.name.length > 22)
                         newString = [d.name.slice(0, 22), "<br>", d.name.slice(22)].join('');
                         */
                        return $filter("shortenAndReplaceUnderscores")(d.name);
                    })
                    .filter(function (d) {
                        return d.x < width / 2;
                    })
                    .attr("x", 6 + sankey.nodeWidth())
                    .attr("text-anchor", "start");
            }

            function dragmove(d) {
                d3.select(this).attr("transform",
                    "translate(" + (
                        d.x = Math.max(0, Math.min(width - d.dx, d3.event.x))
                    ) + "," + (
                        d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
                    ) + ")");
                sankey.relayout();
                link.attr("d", path);
            }
        }

        function sankeyCtrl($scope) {

        }
    }
})();