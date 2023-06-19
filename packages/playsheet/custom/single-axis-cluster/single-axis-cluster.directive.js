(function () {
    "use strict";
    angular.module("app.single-axis-cluster.directive", [])
        .directive("singleAxisCluster", singleAxisCluster);

    singleAxisCluster.$inject = ['$filter', 'alertService'];

    function singleAxisCluster($filter, alertService) {

        singleAxisClusterLink.$inject = ["scope", "ele", "attrs"];

        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            link: singleAxisClusterLink
        };

        function singleAxisClusterLink(scope, ele, attrs, ctrl) {
            /*** Define Variables **/

                //Scope Variables
            scope.chartCtrl = ctrl[0];

            //For Data
            var localData = {}, i, n, cleanedData = [],
                workingDataSet,
                splitData, splitDataKeys,
                xVar, yVar, zVar, layout, headerArray = [];

            //For Viz
            var width, height, spacing = 3,
                paddingX = 50,
                paddingY = 20,
                x, y, z, color, xAxis, noLine, svg, xrange, groupLegend, sizeLegend, clusterHeight;

            //For Tools
            var splitDataSelection, splitColorSelectionCategory, splitColorSelectionInstance;


            //inserting id for div
            var html = '<div class="append-viz" id=' + scope.chartCtrl.chartName + "-append-viz" + '><div class="absolute-size" id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append(html);

            //widget variables
            scope.chartCtrl.margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            };

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                //need to invoke tool functions
                scope[toolUpdateConfig.fn](toolUpdateConfig.args);

            };

            //widget api functions
            scope.chartCtrl.dataProcessor = function (data) {
                localData = JSON.parse(JSON.stringify(data));

                headerArray = [];
                for (var i in localData.headers) {
                    headerArray.push(localData.headers[i].title)
                }


                cleanedData = JSON.parse(JSON.stringify(localData.data));

                xVar = localData.dataTableAlign['x-axis'];
                yVar = "y";
                zVar = localData.dataTableAlign['size'];

                if (!localData.uiOptions) {
                    localData.uiOptions = {'splitData': '', 'colorDataCategory': '', 'colorDataInstance': ''};
                }


                splitDataSelection = localData.uiOptions['splitData'] || '';
                splitColorSelectionCategory = localData.uiOptions['colorDataCategory'] || '';
                splitColorSelectionInstance = localData.uiOptions['colorDataInstance'] || '';

                //TODO Generalize
                if (_.isNaN(+cleanedData[0][xVar])) {
                    alertService('X-Axis Must be Numerical', "Error", "toast-error", 3000);
                    return
                }


                cleanedData.forEach(function (d) {
                    d[xVar] = Math.round(100 * (+d[xVar] || 0)) / 100;
                    d[yVar] = 0;
                    d[zVar] = +d[zVar] || 1;
                    d['group'] = 'Explanatory';
                });

                workingDataSet = JSON.parse(JSON.stringify(cleanedData));
                /*** Set Up Viz ***/
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                scope.splitDataFunc();
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartCtrl.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartCtrl.resizeViz = function () {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                scope.splitDataFunc();
            };

            scope.splitData = function (splitOn) {
                console.log(splitOn);
                if(typeof splitOn !== undefined && splitOn !== null){
                    splitDataSelection = splitOn.title;
                    scope.splitDataFunc();
                }
            };

            scope.colorDataCategory = function (category) {
                console.log(category);
                if(typeof category !== undefined && category !== null) {
                    splitColorSelectionCategory = category.title;
                    scope.splitDataFunc();
                }
            };

            scope.colorDataInstance = function (colorInstance) {
                console.log(colorInstance);
                splitColorSelectionInstance = colorInstance;
                scope.splitDataFunc();
            };

            //viz functions


            /*** Draw Viz ***/
            scope.splitDataFunc = function () {
                clearViz();
                if (_.isEmpty(splitDataSelection)) {
                    cleanedData.forEach(function (d) {
                        if ($filter('shortenAndReplaceUnderscores')(d[splitColorSelectionCategory]) === splitColorSelectionInstance) {
                            d[xVar] = Math.round(100 * +d[xVar]) / 100;
                            d[yVar] = 0;
                            d[zVar] = +d[zVar];
                            d['group'] = 'Selected';
                        } else {
                            d[xVar] = Math.round(100 * +d[xVar]) / 100;
                            d[yVar] = 0;
                            d[zVar] = +d[zVar];
                            d['group'] = 'Explanatory';
                        }
                    });

                    clusterHeight = (scope.chartCtrl.container.height - paddingY) / 2;
                    n = 1;
                    height = clusterHeight * (n + 1) + paddingY * n;
                    width = scope.chartCtrl.container.width - 200;

                    drawAxis(cleanedData);
                    drawViz(0, cleanedData, splitDataSelection);
                } else {
                    cleanedData.forEach(function (d) {
                        if ($filter('shortenAndReplaceUnderscores')(d[splitColorSelectionCategory]) === splitColorSelectionInstance) {
                            d[xVar] = Math.round(100 * +d[xVar]) / 100;
                            d[yVar] = 0;
                            d[zVar] = +d[zVar];
                            d['group'] = 'Selected';
                        } else {
                            d[xVar] = Math.round(100 * +d[xVar]) / 100;
                            d[yVar] = 0;
                            d[zVar] = +d[zVar];
                            d['group'] = 'Explanatory';
                        }
                    });

                    clusterHeight = 100;
                    splitData = _.groupBy(cleanedData, function (g) {
                        return g[splitDataSelection]
                    });
                    splitDataKeys = _.keys(splitData);
                    n = splitDataKeys.length;

                    height = clusterHeight * (n + 1) + paddingY * n;
                    width = scope.chartCtrl.container.width - 200;

                    drawAxis(cleanedData);
                    for (i = 0; i < n; i++) {
                        drawViz(i, splitData[splitDataKeys[i]], splitDataKeys[i]);
                    }
                }
            };


            function drawAxis(wholeData) {
                //Setup Parameters
                x = d3.scale.linear()
                    .range([0, width - paddingX]);

                y = d3.scale.linear()
                    .range([height - paddingY * n, 0]);

                z = d3.scale.linear()
                    .range([5, 25]);

                color = d3.scale.category10();
                color.domain(['Explanatory'], ['Selected'])

                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                noLine = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickSize([clusterHeight]);

                svg = d3.select("#" + scope.chartCtrl.chartName).append("svg")
                    .attr("width", width + 200)
                    .attr("height", height)
                    .style("margin", "0px auto 0 auto")
                    .append("g")
                    .attr("transform", "translate(" + scope.chartCtrl.margin.left + "," + scope.chartCtrl.margin.top + ")");

                xrange = d3.extent(wholeData, function (d) {
                    return d[xVar];
                });

                if (xrange[0] === xrange[1]) {
                    xrange[0] = 0;
                }

                x.domain([Math.floor(xrange[0] * 10) / 10, Math.ceil(xrange[1] * 10) / 10]).nice();

                y.domain(d3.extent(wholeData, function (d) {
                    return d[yVar];
                })).nice();

                z.domain(d3.extent(wholeData, function (d) {
                    return d[zVar];
                })).nice();

                svg.append("g")
                    .attr("id", "axis")
                    .attr("transform", "translate(0," + 0 + ")")
                    .call(xAxis)
                    .append("text")
                    .attr("class", "label")
                    .attr("x", width - paddingX)
                    .attr("y", -6)
                    .style("text-anchor", "end")
                    .text(xVar);


                svg.selectAll('#axis line, #axis path')
                    .style("fill", "none")
                    .style("stroke", "#000")
                    .style("shape-rendering", "crispEdges");

                wholeData.forEach(function (d) {
                    d.x = x(d[xVar]);
                    d.y = y(d[yVar]);
                    d.color = color(d.group);
                    d.radius = z(d[zVar]);
                });

                svg.append("text")
                    .attr("transform", "translate(" + (width) + "," + 140 + ")")
                    .attr("class", "label")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("dy", ".35em")
                    .style("text-anchor", "middle")
                    .text("Group");

                groupLegend = svg.selectAll("#groupLegend")
                    .data(color.domain())
                    .enter().append("g")
                    .attr("id", "groupLegend")
                    .attr("transform", function (d, i) {
                        return "translate(" + (width - paddingY / 2) + "," + (i * 25 + 160) + ")";
                    });

                groupLegend.append("rect")
                    .attr("x", 0)
                    .attr("width", 20)
                    .attr("height", 20)
                    .style("fill", color);

                groupLegend.append("text")
                    .attr("class", "label")
                    .attr("x", 25)
                    .attr("y", 10)
                    .attr("dy", ".35em")
                    .style("text-anchor", "start")
                    .text(function (d) {
                        return d;
                    });


                //Draw sizeLegend
                var minSize = _.min(wholeData, function (d) {
                    return d[zVar];
                })[zVar];


                var maxSize = _.max(wholeData, function (d) {
                    return d[zVar];
                })[zVar];

                var middleSize = (maxSize - minSize) / 2

                if (maxSize != minSize) {
                    var sizeLegendData = [{
                        r: 5,
                        y: 10,
                        text: minSize
                    }, {
                        r: 12.5,
                        y: 17.5,
                        text: middleSize
                    }, {
                        r: 25,
                        y: 45,
                        text: maxSize
                    }]
                } else {
                    var sizeLegendData = [{
                        r: 5,
                        y: 10,
                        text: minSize
                    }]
                }


                svg.append("text")
                    .attr("transform", "translate(" + (width) + "," + -10 + ")")
                    .attr("class", "label")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("dy", ".35em")
                    .style("text-anchor", "middle")
                    .text(zVar);

                sizeLegend = svg.selectAll("#sizeLegend")
                    .data(sizeLegendData)
                    .enter().append("g")
                    .attr("id", "sizeLegend")
                    .attr("transform", function (d, i) {
                        return "translate(" + (width) + "," + (i * 20 + 10) + ")";
                    });


                sizeLegend.append("circle")
                    .attr("id", "dot")
                    .style("stroke", "#000")
                    .style("stroke-opacity", ".7")
                    .style("fill-opacity", ".7")
                    .attr("r", function (d) {
                        return d.r;
                    })
                    .attr("cx", function (d) {
                        return 0;
                    })
                    .attr("cy", function (d, i) {
                        return d.y;
                    })
                    .style("fill", function (d) {
                        return "#aaa";
                    });

                sizeLegend.append("text")
                    .attr("class", "label")
                    .attr("x", 30)
                    .attr("y", function (d) {
                        return d.y;
                    })
                    .attr("dy", ".35em")
                    .style("text-anchor", "start")
                    .text(function (d) {
                        return d.text;
                    });

            }

            function drawViz(i, selectedData, selectedDataLabel) {
                var node, force, nodeLayer, tip;
                // Set initial positions
                force = d3.layout.force()
                    .nodes(selectedData)
                    .size([width, clusterHeight])
                    .on("tick", tick)
                    .charge(-1)
                    .gravity(0)
                    .chargeDistance(5);

                nodeLayer = svg.append("g")
                    .attr("transform", "translate(0," + (paddingY + clusterHeight) * i + ")");
                nodeLayer.append("g")
                    .attr("id", "noLine")
                    .attr("transform", "translate(0," + clusterHeight / 2 + ")")
                    .call(noLine);

                nodeLayer.selectAll('#noLine text, #noLine path')
                    .style("display", "none");

                nodeLayer.selectAll('#noLine line')
                    .style("fill", "none")
                    .style("stroke", "#aaa")
                    .style("shape-rendering", "crispEdges");


                if (!_.isEmpty(selectedDataLabel)) {
                    nodeLayer.append("text")
                        .attr("transform", "translate(0," + (clusterHeight / 2 - 5) + ")")
                        .attr("class", "label")
                        .style("font-weight", "normal")
                    .text(function(){
                        return splitDataSelection + " : " + $filter('shortenAndReplaceUnderscores')(selectedDataLabel);
                    });
                }

                //Tooltip
                tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .attr("id", "singleaxiscluster-d3-tip")
                    .direction('e')
                    .html(function (d) {
                        var html = '';
                        for (var i in localData.headers) {
                            html += '<span class="light">' + $filter('replaceUnderscores')(headerArray[i]) + ':</span> ' + $filter('shortenAndReplaceUnderscores')(d[headerArray[i]]) + '<br/>'
                        }
                        return '<div>' + html + '</div>'
                    });

                //Draw Nodes
                node = nodeLayer.selectAll("#dot")
                    .data(selectedData)
                    .enter().append("circle")
                    .style("stroke", "#000")
                    .style("stroke-opacity", ".7")
                    .style("fill-opacity", ".7")
                    .attr("r", function (d) {
                        return d.radius;
                    })
                    .attr("cx", function (d) {
                        return x(d[xVar]);
                    })
                    .attr("cy", function (d) {
                        return y(d[yVar]);
                    })
                    .style("fill", function (d) {
                        return d.color;
                    })
                    .on("mouseover", function (d) {
                        tip.show(d);
                    })
                    .on("mouseout", function (d) {
                        tip.hide(d);
                    });


                svg.call(tip);
                force.start();

                function tick(e) {
                    node.each(moveTowardDataPosition(e.alpha));
                    node.each(collide(e.alpha));
                    node.attr("cx", function (d) {
                            return d.x;
                        })
                        .attr("cy", function (d) {
                            return d.y - clusterHeight * n;
                        });
                }

                //On Draw Move Points
                function moveTowardDataPosition(alpha) {
                    return function (d) {
                        d.x += (x(d[xVar]) - d.x) * .1 * alpha;
                        d.y += (y(d[yVar]) - d.y) * .05 * alpha;
                    };
                }

                // Resolve Collisions between nodes.
                function collide(alpha) {
                    var quadtree = d3.geom.quadtree(selectedData);
                    return function (d) {
                        var r = d.radius * 2 + spacing,
                            nx1 = d.x - r,
                            nx2 = d.x + r,
                            ny1 = d.y - r,
                            ny2 = d.y + r;
                        quadtree.visit(function (quad, x1, y1, x2, y2) {
                            if (quad.point && (quad.point !== d)) {
                                var x = d.x - quad.point.x,
                                    y = d.y - quad.point.y,
                                    l = Math.sqrt(x * x + y * y),
                                    r = d.radius + quad.point.radius + spacing;
                                if (l < r) {
                                    l = (l - r) / l * alpha;
                                    d.x -= x *= l;
                                    d.y -= y *= l;
                                    quad.point.x += x;
                                    quad.point.y += y;
                                }
                            }
                            return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                        });
                    };
                }
            }

            //Clear Viz and Reset Data
            function clearViz() {
                d3.select("#" + scope.chartCtrl.chartName).selectAll("*").remove();
                cleanedData = JSON.parse(JSON.stringify(workingDataSet));
            }

            //CleanUp
            scope.$on("$destroy", function () {
                //cleaning up d3-tooltip
                d3.selectAll("#singleaxiscluster-d3-tip").remove();
                d3.select("#" + scope.chartCtrl.chartName).selectAll("*").remove();
            });
        }
    }

})();
