(function () {
    "use strict";
    angular.module("app.tap.portratsystemcoverage", [])
        .directive("systemCoverage", systemCoverage);

    systemCoverage.$inject = ["$compile", "$filter", "$rootScope"];

    function systemCoverage($compile, $filter, $rootScope) {

        systemCoverageLink.$inject = ["scope", "ele", "attrs", "controllers"];
        systemCoverageController.$inject = [];
        return {
            restrict: "EA",
            require: ['portratchart', '^portrat'],
            priority: 300,
            link: systemCoverageLink,
            controller: systemCoverageController
        };

        function systemCoverageLink(scope, ele, attrs, controllers) {
            //declare/initialize scope variables
            scope.chartController = controllers[0];
            scope.chartController.chart = 'portrat-singleaxiscluster';
            scope.portratController = controllers[1];
            scope.localData = {};


            var decomSetViewCleanUpFunc = $rootScope.$on('prd-sysdecom.set-view', function (evt, view) {
                scope.tabIndex = view;
                scope.chartController.dataProcessor();
            });

            var capSetViewCleanUpFunc = $rootScope.$on('prd-cap.set-view', function (evt, view) {
                scope.tabIndex = view;
                scope.chartController.dataProcessor();
            });

            var modSetViewCleanUpFunc = $rootScope.$on('prd-mod.set-view', function (evt, view) {
                scope.tabIndex = view;
                scope.chartController.dataProcessor();
            });

            //For Data
            var i, n, cleanedData = [], cleanedDataObj = {},
                workingDataSet,
                splitData, splitDataKeys,
                xVar, xVarLabel1, xVarLabel2, yVar, zVar, colorVar, layout;

            //For Viz
            var width, height, spacing = 3,
                paddingX = 90,
                paddingY = 20,
                x, y, z, color, colorDomain, xAxis, noLine, svg, xrange, groupLegend, sizeLegend, clusterHeight, tip, tiptoggle;


            //inserting id for div
            var html = '<div class="append-viz" id=' + scope.chartController.chart + "-append-viz" + ' ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\"><div class="singleaxisclusterviz" id=' + scope.chartController.chart + '></div></div>';
            ele.append(html);

            //widget variables
            scope.chartController.margin = {
                top: 40,
                right: 40,
                bottom: 40,
                left: 40
            };

            //widget api functions
            scope.chartController.dataProcessor = function () {
                scope.localData = JSON.parse(JSON.stringify(scope.chartController.data));
                layout = JSON.parse(JSON.stringify(scope.chartController.data.layout));
                cleanedDataObj = JSON.parse(JSON.stringify(scope.localData.oldData));


                if (scope.tabIndex === 'coverage') {
                    xVar = "BLU & DO Covered";
                    xVarLabel1 = "BLU";
                    xVarLabel2 = "Data";
                    yVar = "y";
                    zVar = "z";
                    colorVar = "Recommendation";

                    cleanedData = [];
                    for (var i in cleanedDataObj) {
                        if (i !== "Uncovered") {
                            cleanedData.push(cleanedDataObj[i]);
                        }
                    }

                    cleanedData.forEach(function (d) {
                        d[xVar] = d[xVarLabel1].length + d[xVarLabel2].length;
                        d[yVar] = 0;
                        d[zVar] = 1;
                        d['group'] = d[colorVar].replace(/_/g," ");
                    });

                    workingDataSet = JSON.parse(JSON.stringify(cleanedData));
                }
                else if (scope.tabIndex === 'detailed') {
                    xVar = "Supported Systems";
                    xVarLabel1 = "System";
                    xVarLabel2 = "";
                    yVar = "y";
                    zVar = "z";
                    colorVar = "Recommendation";

                    var temp = {};
                    for (var i in cleanedDataObj) {
                        if (i !== "Uncovered") {
                            if (cleanedDataObj[i].BLU.length > 0) {
                                for (var j in cleanedDataObj[i].BLU) {
                                    if (!temp[cleanedDataObj[i].BLU[j]]) {
                                        temp[cleanedDataObj[i].BLU[j]] = {
                                            BLUDO: cleanedDataObj[i].BLU[j],
                                            System: [cleanedDataObj[i].System],
                                            SystemRecommendation: [cleanedDataObj[i].Recommendation],
                                            Type: "BLU"
                                        }
                                    } else {
                                        if (!_.includes(temp[cleanedDataObj[i].BLU[j]]['System'], cleanedDataObj[i].System)) {
                                            temp[cleanedDataObj[i].BLU[j]]['System'].push(cleanedDataObj[i].System);
                                            temp[cleanedDataObj[i].BLU[j]]['SystemRecommendation'].push(cleanedDataObj[i].Recommendation);
                                        }
                                    }
                                }
                            }
                            if (cleanedDataObj[i].Data.length > 0) {
                                for (var j in cleanedDataObj[i].Data) {
                                    if (!temp[cleanedDataObj[i].Data[j]]) {
                                        temp[cleanedDataObj[i].Data[j]] = {
                                            BLUDO: cleanedDataObj[i].Data[j],
                                            System: [cleanedDataObj[i].System],
                                            SystemRecommendation: [cleanedDataObj[i].Recommendation],
                                            Type: "DataObject"
                                        }
                                    } else {
                                        if (!_.includes(temp[cleanedDataObj[i].Data[j]]['System'], cleanedDataObj[i].System)) {
                                            temp[cleanedDataObj[i].Data[j]]['System'].push(cleanedDataObj[i].System);
                                            temp[cleanedDataObj[i].Data[j]]['SystemRecommendation'].push(cleanedDataObj[i].Recommendation);
                                        }
                                    }
                                }
                            }
                        }
                        else {
                            if (cleanedDataObj[i].BLU.length > 0) {
                                for (var j in cleanedDataObj[i].BLU) {
                                    temp[cleanedDataObj[i].BLU[j]] = {
                                        BLUDO: cleanedDataObj[i].BLU[j],
                                        System: [],
                                        SystemRecommendation: ["Recommended Consolidation"],
                                        Type: "BLU"
                                    }
                                }
                            }
                            if (cleanedDataObj[i].Data.length > 0) {
                                for (var j in cleanedDataObj[i].Data) {
                                    temp[cleanedDataObj[i].Data[j]] = {
                                        BLUDO: cleanedDataObj[i].Data[j],
                                        System: [],
                                        SystemRecommendation: ["Recommended Consolidation"],
                                        Type: "DataObject"
                                    }
                                }
                            }
                        }

                    }

                    for (var i in temp) {
                        var rec = "Unsupported DO or BLU";
                        for (var j in temp[i]["SystemRecommendation"]) {
                            if (temp[i]["SystemRecommendation"][j] === "Recommended Sustain") {
                                rec = 'Supported DO or BLU';
                                break;
                            }
                        }
                        temp[i]["Recommendation"] = rec;
                    }

                    cleanedData = [];
                    for (var i in temp) {
                        cleanedData.push(temp[i]);
                    }

                    cleanedData.forEach(function (d) {
                        if (d[colorVar] === 'Supported DO or BLU') {
                            d[xVar] = d[xVarLabel1].length;
                        }
                        else {
                            d[xVar] = 0;
                        }
                        d[yVar] = 0;
                        d[zVar] = 1;
                        d['group'] = d[colorVar];
                    });

                    workingDataSet = JSON.parse(JSON.stringify(cleanedData));
                }

                /*** Set Up Viz ***/
                scope.chartController.containerSize(scope.chartController.containerClass, scope.chartController.container, scope.chartController.margin);
                scope.splitDataFunc();
            };

            scope.chartController.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartController.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartController.resizeViz = function () {
                scope.chartController.containerSize(scope.chartController.containerClass, scope.chartController.container, scope.chartController.margin);
                scope.splitDataFunc();
            };


            //viz functions
            /*** Draw Viz ***/
            scope.splitDataFunc = function () {
                clearViz();

                clusterHeight = (scope.chartController.container.height - paddingY) / 2;
                n = 1;
                height = clusterHeight * (n + 1) + paddingY * n;
                width = scope.chartController.container.width;
                drawAxis(cleanedData);
                drawViz(0, cleanedData, "***Condensed***");
            };

            function drawAxis(wholeData) {
                //Setup Parameters
                x = d3.scale.linear()
                    .range([0, width - paddingX]);

                xrange = d3.extent(wholeData, function (d) {
                    return d[xVar];
                });

                if (xrange[0] === xrange[1]) {
                    //x = d3.scale.linear().range([( width - paddingX) / 2, ( width - paddingX) / 2]);
                    /*xrange[0] = wholeData[0][xVar] - 1;
                     xrange[1] = wholeData[0][xVar] + 1;*/
                }

                y = d3.scale.linear()
                    .range([height - paddingY * n, 0]);

                z = d3.scale.linear()
                    .range([5, 25]);

                color = function (d) {
                    if (d === 'Recommended Consolidation') {
                        return 'rgb(255, 127, 14)';
                    }
                    if (d === 'Recommended Sustain') {
                        return 'rgb(31, 119, 180)';
                    }
                    if (d === 'Supported DO or BLU') {
                        return 'rgb(0, 153, 0)';
                    }
                    if (d === 'Unsupported DO or BLU') {
                        return 'rgb(219, 0, 0)';
                    }
                    if (d === 'Recommended_Consolidation') {
                        return 'rgb(255, 127, 14)';
                    }
                    if (d === 'Recommended_Sustain') {
                        return 'rgb(31, 119, 180)';
                    }
                    if (d === 'Supported_DO_or_BLU') {
                        return 'rgb(0, 153, 0)';
                    }
                    if (d === 'Unsupported_DO_or_BLU') {
                        return 'rgb(219, 0, 0)';
                    }
                };

                if (scope.tabIndex === 'coverage') {
                    colorDomain = [{
                        color: 'rgb(255, 127, 14)',
                        text: 'Recommended Consolidation'
                    }, {color: 'rgb(31, 119, 180)', text: 'Recommended Sustain'}];
                }
                else if (scope.tabIndex === 'detailed') {
                    colorDomain = [{
                        color: 'rgb(219, 0, 0)',
                        text: 'Unsupported DO or BLU'
                    }, {color: 'rgb(0, 153, 0)', text: 'Supported DO or BLU'}];
                }

                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom");

                noLine = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .tickSize([clusterHeight]);

                if (xrange[0] === xrange[1]) {
                    xrange[0] = wholeData[0][xVar] - 1;
                    xrange[1] = wholeData[0][xVar] + 1;
                    xAxis.ticks(1);
                    noLine.ticks(1);
                }

                svg = d3.select("#" + scope.chartController.chart).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .style("margin", scope.chartController.margin.top + "px auto 0 auto")
                    .append("g")
                    .attr("transform", "translate(" + scope.chartController.margin.left + "," + scope.chartController.margin.top + ")");

                x.domain([Math.floor(xrange[0] * 10) / 10, Math.ceil(xrange[1] * 10) / 10]).nice();

                y.domain(d3.extent(wholeData, function (d) {
                    return d[yVar];
                })).nice();

                z.domain(d3.extent(wholeData, function (d) {
                    return d[zVar];
                })).nice();

                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0," + 0 + ")")
                    .call(xAxis)
                    .append("text")
                    .attr("class", "label")
                    .attr("x", width - paddingX)
                    .attr("y", -6)
                    .style("text-anchor", "end")
                    .text(xVar);

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

                groupLegend = svg.selectAll(".groupLegend")
                    .data(colorDomain)
                    .enter().append("g")
                    .attr("class", "groupLegend")
                    .attr("transform", function (d, i) {
                        return "translate(" + (i * 175 + 50) + "," + (height - 60) + ")";
                    });

                groupLegend.append("circle")
                    .attr("cx", 15)
                    .attr("cy", 10)
                    .attr("r", 4.5)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 1)
                    .attr("stroke-opacity", 0.7)
                    .attr("fill-opacity", 0.7)
                    .style("fill", function (d) {
                        return d.color;
                    });

                groupLegend.append("text")
                    .attr("class", "label")
                    .attr("x", 25)
                    .attr("y", 10)
                    .attr("dy", ".35em")
                    .style("text-anchor", "start")
                    .text(function (d) {
                        return d.text;
                    });

                svg.selectAll('#portrat-singleaxiscluster path')
                    .style("fill", "none")
                    .style("stroke", "#000")
                    .style("shape-rendering", "crispEdges");
            }

            function drawViz(i, selectedData, selectedDataLabel) {
                var node, force, nodeLayer;
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


                if (selectedDataLabel !== "***Condensed***") {
                    nodeLayer.append("text")
                        .attr("transform", "translate(0," + (clusterHeight / 2 - 5) + ")")
                        .attr("class", "label")
                        .style("font-weight", "normal")
                        .text(scope.splitDataSelection + " : " + selectedDataLabel);
                }

                //Tooltip
                if (tip) {
                    tip.hide();
                }

                tip = d3.tip()
                    .attr('class', 'd3-tip')
                    .attr("id", "coverage-d3-tip")
                    .direction('n')
                    .html(function (d) {
                        var html = '';

                        if (scope.tabIndex === 'coverage') {
                            html += '<span>' + '<text  class="light">' + 'Selected: ' + '</text>' + $filter('shortenAndReplaceUnderscores')(d["System"]) + '</span><br/>';
                            if (d[xVarLabel1].length > 0) {
                                html += '<span class="light">' + 'BLU: ' + '</span>';
                                for (var i in d[xVarLabel1]) {
                                    html += $filter('shortenAndReplaceUnderscores')(d[xVarLabel1][i]) + ', ';
                                }
                                html = html.slice(0, -2); // trimming off trailing comma & space
                                if (d[xVarLabel2].length > 0) {
                                    html += '<br/>';
                                }
                            }
                            if (d[xVarLabel2].length > 0) {
                                html += '<span class="light">' + 'DO: ' + '</span>';
                                for (var i in d[xVarLabel2]) {
                                    html += $filter('shortenAndReplaceUnderscores')(d[xVarLabel2][i]) + ', ';
                                }
                                html = html.slice(0, -2); // trimming off trailing comma & space
                            }

                            if (d[xVarLabel1].length <= 0 && d[xVarLabel2].length <= 0) {
                                html += 'No BLU or DO';
                            }

                            return '<div class="coverage-tooltip">' + html + '</div>';
                        } else if (scope.tabIndex === 'detailed') {
                            html += '<span>' + '<text  class="light">' + 'Selected: ' + '</text>' + $filter('shortenAndReplaceUnderscores')(d["BLUDO"]) + ' (' + d['Type'] + ')</span><br/>';
                            if (d[xVarLabel1].length > 0) {
                                html += '<span class="light">' + 'Systems: ' + '</span>';
                                for (var i in d[xVarLabel1]) {
                                    html += $filter('shortenAndReplaceUnderscores')(d[xVarLabel1][i]) + ', ';
                                }
                                html = html.slice(0, -2); // trimming off trailing comma & space
                            }

                            if (d[xVarLabel1].length <= 0) {
                                html += 'No Systems';
                            }

                            return '<div class="coverage-tooltip">' + html + '</div>';
                        } else {
                            return '';
                        }
                    });

                //Draw Nodes
                node = nodeLayer.selectAll(".dot")
                    .data(selectedData)
                    .enter().append("circle")
                    .attr("class", "dot")
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
                    .on("click", function (d) {
                        tiptoggle = !tiptoggle;
                        if (tiptoggle) {
                            tip.show(d);
                        } else {
                            tip.hide(d);
                        }
                    });


                svg.call(tip);
                force.start();

                function tick(e) {
                    node.each(moveTowardDataPosition(e.alpha));
                    node.each(collide(e.alpha));
                    node.attr("cx", function (d) {
                        return d.x || 0;
                    }).attr("cy", function (d) {
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
                d3.select("#" + scope.chartController.chart).selectAll("*").remove();
                cleanedData = JSON.parse(JSON.stringify(workingDataSet));
            }


            //CleanUp
            scope.$on("$destroy", function () {
                //cleaning up d3-tooltip
                d3.selectAll("#coverage-d3-tip").remove();
                decomSetViewCleanUpFunc();
                capSetViewCleanUpFunc();
                modSetViewCleanUpFunc();
                d3.select("#" + scope.chartController.chart).selectAll("*").remove();
            });
        }

        function systemCoverageController() {

        }
    }
})();