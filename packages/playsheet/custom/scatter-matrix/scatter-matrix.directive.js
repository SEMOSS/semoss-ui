(function () {
    "use strict";
    angular.module("app.scatter-matrix.directive", [])
        .directive("scatterMatrix", scatterMatrix);

    scatterMatrix.$inject = ['$compile', "$filter", "alertService"];

    function scatterMatrix($compile, $filter, alertService) {

        scatterMatrixLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            link: scatterMatrixLink

        };

        function scatterMatrixLink(scope, ele, attrs, ctrl) {
            //initialize and declare scope variables
            scope.chartCtrl = ctrl[0];

            /*** Define Variables **/
            //For Data
            var localData = {}, i, j, k, dirtyData, cleanedData = [], specificData,
                cleanedEquations, domainByKey = {},
                originalDomainByKey = {},
                keys = [],
                n, names = [],
                namesIndexes = [],
                cleanedNames = [],
                dirtyNames = [],
                yVal, z;

            //For Viz
            var padding, spacing, size, x, y, xAxis, yAxis, lineGenerator, areaGenerator, brushCell, brush, svg, cell, celltop, cellbottom, oneRow = false;

            //inserting id for divtable;
            var html = '<div class="append-viz" id=' + scope.chartCtrl.chartName + "-append-viz" + '><div class="absolute-size" id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            //widget variables
            scope.chartCtrl.margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            };

            //widget api functions
            scope.chartCtrl.dataProcessor = function (newData) {
                if (!_.isEmpty(newData)) {
                    localData = JSON.parse(JSON.stringify(newData));
                    d3.select("#" + scope.chartCtrl.chartName).selectAll("*").remove();
                    formatData(localData.data);
                }
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                //console.log('Need to Add Highlighting Feature')
            };

            scope.chartCtrl.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartCtrl.resizeViz = function () {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                size = setSVGSize(scope.chartCtrl.container);
                drawViz();
            };


            //viz functions
            function formatData(unformatedData) {
                /*** Clean Data **/
                dirtyNames = [];
                dirtyData = JSON.parse(JSON.stringify(unformatedData));
                for (var i in dirtyData) {
                    for (var j in dirtyData[i]) {
                        if (!_.isNaN(+dirtyData[i][j])) {
                            dirtyData[i][j] = +dirtyData[i][j];
                        } else {
                            if (dirtyNames.indexOf(j) === -1) {
                                dirtyNames.push(j)
                            }
                        }
                    }
                }

                dirtyNames = _.uniq(dirtyNames);
                cleanedData = JSON.parse(JSON.stringify(dirtyData));
                names = _.keys(dirtyData[0]);
                cleanedNames = _.intersection(_.uniq(_.xor(names, dirtyNames)), _.values(localData.dataTableAlign));

                j = 0;
                namesIndexes = [];
                for (i in names) {
                    namesIndexes.push(j)
                    j++
                }

                for (var i in dirtyNames) {
                    _.remove(namesIndexes, function (n) {
                        return n == _.indexOf(names, dirtyNames[i]);
                    });
                }

                if (!_.isEmpty(localData.specificData)) {
                    specificData = JSON.parse(JSON.stringify(localData.specificData));
                    oneRow = specificData['one-row'];
                    if (oneRow) {
                        cleanedEquations = [];
                        for (i in namesIndexes) {
                            var equationObject = {
                                x: localData.headers[localData.headers.length - 1 - i].title,
                                y: localData.headers[localData.headers.length - 1].title,
                                m: specificData.coefficients[specificData.coefficients.length - 1 - i],
                                b: specificData.coefficients[specificData.coefficients.length - 1],
                                shifts: specificData.shifts[specificData.coefficients.length - 1 - i],
                                correlation: specificData.correlations[specificData.coefficients.length - 1 - i]
                            }
                            cleanedEquations.push(equationObject);
                        }
                    } else {
                        cleanedEquations = cross(cleanedNames, cleanedNames);
                        for (k in cleanedEquations) {
                            if (!_.isUndefined(specificData.correlations[cleanedNames.length - 1 - cleanedEquations[k].i])) {
                                if (!_.isNaN(+specificData.correlations[cleanedNames.length - 1 - cleanedEquations[k].i][cleanedNames.length - 1 - cleanedEquations[k].j])) {
                                    cleanedEquations[k]['correlation'] = +specificData.correlations[cleanedNames.length - 1 - cleanedEquations[k].i][cleanedNames.length - 1 - cleanedEquations[k].j];
                                } else {
                                    cleanedEquations[k]['correlation'] = undefined;
                                }
                            } else {
                                cleanedEquations[k]['correlation'] = undefined;
                            }
                        }
                    }
                }

                keys = [];
                for (var i in cleanedNames) {
                    keys.push(cleanedNames[i])
                }
                n = keys.length;


                if (oneRow) {
                    z = 1;
                } else {
                    z = n;
                }

                if (z === 0 || n === 0) {
                    alertService("Invalid Data. Selected Columns Must be Numerical", 'Error', 'toast-error', 7000);
                    return
                }


                domainByKey = {};
                keys.forEach(function (key) {
                    domainByKey[key] = d3.extent(cleanedData, function (d) {
                        return d[key];
                    });

                });

                originalDomainByKey = JSON.parse(JSON.stringify(domainByKey));

                for (var i in domainByKey) {
                    domainByKey[i][0] -= .03 * (domainByKey[i][1] - domainByKey[i][0]);
                    domainByKey[i][1] += .03 * (domainByKey[i][1] - domainByKey[i][0]);
                }

                /*** Set Up Viz ***/
                padding = 15;
                spacing = 15;
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                size = setSVGSize(scope.chartCtrl.container);
                drawViz();
            }

            function drawViz() {
                d3.select("#" + scope.chartCtrl.chartName).selectAll("*").remove();

                x = d3.scale.linear()
                    .range([padding / 2, size - padding / 2]);

                y = d3.scale.linear()
                    .range([size - padding / 2, padding / 2]);

                xAxis = d3.svg.axis()
                    .scale(x)
                    .orient("bottom")
                    .ticks(5);

                yAxis = d3.svg.axis()
                    .scale(y)
                    .orient("left")
                    .ticks(5);

                xAxis.tickSize((spacing + size) * z);
                yAxis.tickSize(-size * n);

                lineGenerator = d3.svg.line()
                    .x(function (d) {
                        return x(d.x);
                    })
                    .y(function (d) {
                        return y(d.y);
                    })
                    .interpolate("linear");

                areaGenerator = d3.svg.area()
                    .x(function (d) {
                        return x(d.x);
                    })
                    .y0(function (d) {
                        return y(d.y0);
                    })
                    .y1(function (d) {
                        return y(d.y1);
                    });

                brush = d3.svg.brush()
                    .x(x)
                    .y(y)
                    .on("brushstart", brushstart)
                    .on("brush", brushmove)
                    .on("brushend", brushend);

                if (oneRow) {
                    yVal = [keys[n - 1]];
                } else {
                    yVal = keys;
                }
                svg = d3.select("#" + scope.chartCtrl.chartName).append("svg")
                    .attr("width", size * n + padding * 2 + spacing * 2)
                    .attr("height", (spacing + size) * z + padding * 2 + spacing * 2)
                    .style("margin", "0 auto 0 auto")
                    .style("font", "10px san-serif")
                    .style("padding", "10px")
                    .append("g")
                    .attr("transform", "translate(" + (padding / 2 + spacing) + "," + padding / 2 +
                        ")");

                svg.selectAll(".x.axis")
                    .data(keys)
                    .enter().append("g")
                    .attr("class", "x axis")
                    .attr("transform", function (d, i) {
                        return "translate(" + (n - i - 1) * size + ",0)";
                    })
                    .each(function (d) {
                        x.domain(domainByKey[d]);
                        d3.select(this).call(xAxis).selectAll("text").style("text-anchor", "end").attr("transform", function (g, i) {
                            return "rotate(-25 0," + z * (size + spacing) + ")"
                        });
                    })

                svg.selectAll(".y.axis")
                    .data(yVal)
                    .enter().append("g")
                    .attr("class", "y axis")
                    .attr("transform", function (d, i) {
                        return "translate(0," + (z - i - 1) * (size + spacing) + ")";
                    })
                    .each(function (d) {
                        y.domain(domainByKey[d]);
                        d3.select(this).call(yAxis).selectAll("text").attr("transform", function (d) {
                            return "rotate(-65)"
                        });
                    })

                //axis styling
                svg.selectAll(".axis")
                    .style("shape-rendering", "crispEdges");

                svg.selectAll(".axis line")
                    .style("stroke", "#ddd");

                svg.selectAll(".axis path")
                    .style("display", "none");


                cell = svg.selectAll(".cell")
                    .data(cross(keys, keys))
                    .enter().append("g")
                    .attr("class", "cell")
                    .attr("transform", function (d) {
                        return "translate(" + (n - d.i - 1) * size + "," + ((n - d.j - 1) * (size + spacing)) + ")";
                    });

                //Draws Each Cell
                celltop = cell.append("g")
                    .each(plot);

                //Adding correlation to cell background
                var cellCorrelation = cell.append("text")
                    .attr("transform", "translate(" + (size / 2) + "," + size / 2 + ")")
                    .attr("font-size", "" + size / 3 + "px")
                    .attr("fill", "#737373")
                    .attr("font-weight", "bold")
                    .attr("opacity", "0.5")
                    .attr("text-anchor", "middle")
                    .text(function (d) {
                        console.log(d);
                        if (d.x === d.y) //If the cell is on the diagonal, don't display any text
                        {
                            return "";
                        }
                        else {
                            return getCorrelation(d);
                        }

                    })
                    .on('mouseover', function (d, i) {
                        d3.select(this)
                            .attr("opacity", "1")
                            .style("fill", "#737373");
                    })
                    .on('mouseout', function (d, i) {
                        d3.select(this)
                            .attr("opacity", "0.5")
                            .style("fill", "#737373")
                    });


                // Titles for Diagonal
                celltop.filter(function (d) {
                        return d.i === d.j;
                    })
                    .append("foreignObject")
                    .attr("width", size - padding)
                    .attr("height", size - padding)
                    .attr("x", padding / 2)
                    .attr("y", padding / 2)
                    .html(function (d) {
                        return "<div style='display:table;table-layout:fixed;text-align:center;text-overflow:ellipsis;word-wrap:break-word;width:" + (size - padding) + "px;height:" + (size - padding) + "px'><span style='display:table-cell;vertical-align:middle'>" + $filter('shortenAndReplaceUnderscores')(d.x) + "</span></div>";
                    });

                //Brushing for non-Diagonals
                celltop.filter(function (d) {
                    return d.i !== d.j;
                }).call(brush);

                if (oneRow) {
                    cell.append("g").filter(function (d) {
                        return d.i !== d.j;
                    }).append("foreignObject")
                        .attr("x", padding / 2)
                        .attr("y", padding / 2)
                        .attr("width", size - padding)
                        .attr("height", spacing - 2)
                        .html(function (d) {
                            return "<div style='display:table;table-layout:fixed;text-align:center;text-overflow:ellipsis;word-wrap:break-word;font-size:15px;width:" + (size - padding) + "px;height:" + (spacing - 2) + "px'><span style='display:table-cell;vertical-align:middle'>" + $filter('shortenAndReplaceUnderscores')(d.x) + "</span></div>";
                        });
                }

                //Bottom Label
                //cellbottom = cell.append("g");
                //
                //cellbottom.append("rect")
                //    .attr("class", "frame")
                //    .attr("x", padding / 2)
                //    .attr("y", size - padding / 2 + 2)
                //    .attr("width", size - padding)
                //    .attr("height", spacing - 2)
                //    .style("fill", "none")
                //    .style("stroke", "#aaa")
                //    .style("shape-rendering", "crispEdges");
                //
                //cellbottom.filter(function (d) {
                //    return d.i !== d.j;
                //}).append("foreignObject")
                //    .attr("x", padding / 2)
                //    .attr("y", size - padding / 2 + 2)
                //    .attr("width", size - padding)
                //    .attr("height", spacing - 2)
                //    .html(function (d) {
                //        if (!specificData) {
                //            return
                //        }
                //        return "<div style='display:table;table-layout:fixed;text-align:center;text-overflow:ellipsis;word-wrap:break-word;font-size:15px;width:" + (size - padding) + "px;height:" + (spacing - 2) + "px'><span style='display:table-cell;vertical-align:middle'>" + 'Correlation:' + getCorrelation(d) + "</span></div>";
                //    });

                //cellbottom.filter(function (d) {
                //    return d.i === d.j;
                //}).append("foreignObject")
                //    .attr("x", padding / 2)
                //    .attr("y", size - padding / 2 + 2)
                //    .attr("width", size - padding)
                //    .attr("height", spacing - 2)
                //    .html(function (d) {
                //        if (!specificData) {
                //            return
                //        }
                //        var Interest = getInterest(d);
                //        return "<div style='display:table;table-layout:fixed;text-align:center;text-overflow:ellipsis;word-wrap:break-word;font-size:15px;width:" + (size - padding) + "px;height:" + (spacing - 2) + "px;color:" + Interest[0] + "'><span style='display:table-cell;vertical-align:middle'>" + Interest[1] + "</span></div>";
                //    });


                //extent styling
                svg.selectAll('.extent')
                    .style("fill", "#000")
                    .style("fill-opacity", ".30")
                    .style("stroke", "#fff");
            }

            /*** Setup Functions *R**/

            //CleanUp
            scope.$on("$destroy", function () {
                d3.select("#" + scope.chartCtrl.chartName).selectAll("*").remove();
            });

            //Sets Size of SVG Based on Width and Height
            function setSVGSize(containerObj) {
                var sizeBasedOnW, sizeBasedOnH;
                sizeBasedOnW = (containerObj.width - padding * 2 - spacing * 2) / n;
                sizeBasedOnH = (containerObj.height - padding * 2 - spacing * z) / z;
                if (105 < sizeBasedOnW && sizeBasedOnW < sizeBasedOnH) {
                    return sizeBasedOnW;
                } else if (105 < sizeBasedOnH)
                    return sizeBasedOnH;
                else {
                    return 105;
                }
            }

            /*** Draw Functions ***/

            //Cross Each Variable
            function cross(a, b) {
                var c = [],
                    n = a.length,
                    m = b.length,
                    i, j, jVal;

                if (oneRow) {
                    jVal = m - 2;
                } else {
                    jVal = -1;
                }

                for (i = -1; ++i < n;)
                    for (j = jVal; ++j < m;) c.push({
                        x: a[i],
                        i: i,
                        y: b[j],
                        j: j
                    });
                return c;
            }

            //Plot Each Point
            function plot(p) {
                var celltop;
                celltop = d3.select(this);
                x.domain(domainByKey[p.x]);
                y.domain(domainByKey[p.y]);

                celltop.append("rect")
                    .attr("class", "frame")
                    .attr("x", padding / 2)
                    .attr("y", padding / 2)
                    .attr("width", size - padding)
                    .attr("height", size - padding)
                    .style("fill", "none")
                    .style("stroke", "#aaa")
                    .style("shape-rendering", "crispEdges");


                if (p.x !== p.y) {
                    celltop.selectAll("circle")
                        .data(cleanedData)
                        .enter().append("circle")
                        .attr("cx", function (d) {
                            return x(d[p.x]);
                        })
                        .attr("cy", function (d) {
                            return y(d[p.y]);
                        })
                        .attr("r", 3)
                        .style("fill", "rgb(26, 152, 80)")
                        .style("fill-opacity", "1")
                        .style("stroke", "#aaa");

                    celltop.append("path")
                        .attr("d", lineGenerator(getPoints(p)))
                        .attr("id", "regressionline")
                        .attr("stroke", "black")
                        .attr("stroke-width", "2px")
                        .style("opacity", 0.8);

                    celltop.append("path")
                        .attr("d", areaGenerator(getPoints(p, "shade")))
                        .attr("id", "shader")
                        .attr("class", "shader")
                        .attr("opacity", 0.4)
                        .style("fill", "#4575b4");
                }
            }


            //Gets Point for Line and Shade
            function getPoints(p, shade) {
                var i, cleanedLinePoints = [],
                    lineM, lineB, lineShift, minX, maxX, minY, maxY, point;
                x.domain(domainByKey[p.x]);
                y.domain(domainByKey[p.y]);

                //Get Coefficients (Linear - y = mx + b)
                for (i in cleanedEquations) {
                    if (cleanedEquations[i].x === p.x && cleanedEquations[i].y === p.y && _.isNumber(cleanedEquations[i].m)) {
                        lineM = +cleanedEquations[i].m;
                        lineB = +cleanedEquations[i].b;
                        lineShift = +cleanedEquations[i].shifts;
                        minX = originalDomainByKey[p.x][0];
                        maxX = originalDomainByKey[p.x][1];
                        minY = originalDomainByKey[p.y][0];
                        maxY = originalDomainByKey[p.y][1];

                        //Generate Points
                        for (i = 0; i < 1001; i++) {
                            point = {};
                            if (shade === "shade") {
                                point['x'] = minX + (maxX - minX) * i / 1000;
                                point['y0'] = lineM * (point['x']) + lineB - lineShift;
                                point['y1'] = lineM * (point['x']) + lineB + lineShift;
                                if ((minY <= point['y0'] && point['y0'] <= maxY) || (minY <= point['y1'] && point['y1'] <= maxY)) {
                                    if (point['y0'] <= maxY && maxY <= point['y1']) {
                                        point['y1'] = maxY;
                                    } else if (minY <= point['y1'] && point['y0'] <= minY) {
                                        point['y0'] = minY;
                                    }
                                    cleanedLinePoints.push(point);
                                }
                            } else {
                                point['x'] = minX + (maxX - minX) * i / 1000;
                                point['y'] = lineM * (point['x']) + lineB;
                                if (minY <= point['y'] && point['y'] <= maxY) {
                                    cleanedLinePoints.push(point);
                                }
                            }

                        }
                        break;
                    }
                }
                return cleanedLinePoints;
            }

            //Returns Correlation from Graph
            function getCorrelation(p) {
                var i;
                for (i in cleanedEquations) {
                    if (cleanedEquations[i].x === p.x && cleanedEquations[i].y === p.y) {
                        return Math.round(+cleanedEquations[i].correlation * 100) / 100;
                    }
                }
            }

            //Assigns Variable of Interest
            function getInterest(p) {
                var i, interestVariables;
                for (i in cleanedNames) {
                    interestVariables = ["black", "Variable"];
                    return interestVariables;
                }
            }

            // Clear Previous Brush (if any) and Start New
            function brushstart(p) {
                if (brushCell !== this) {
                    d3.select(brushCell).call(brush.clear());
                    x.domain(domainByKey[p.x]);
                    y.domain(domainByKey[p.y]);
                    brushCell = this;
                }
            }

            //Highlight Circles in Selected Area
            function brushmove(p) {
                var e;
                e = brush.extent();
                svg.selectAll("circle")
                    .each(function (d) {
                        if (e[0][0] > d[p.x] || d[p.x] > e[1][0] || e[0][1] > d[p.y] || d[p.y] > e[1][1]) {
                            d3.select(this).style("fill", "#ccc")
                        }
                    });
            }

            //Selects All if Brush Empty
            function brushend(p) {
                var e, selectedPoint = [];
                e = brush.extent();

                if (!brush.empty()) {
                    svg.selectAll("circle").each(function (d) {
                        if (e[0][0] < d[p.x] && d[p.x] < e[1][0] && e[0][1] < d[p.y] && d[p.y] < e[1][1]) {
                            d3.select(this).style("fill", "rgb(26, 152, 80)")
                        }
                    });
                }

                if (brush.empty()) {
                    svg.selectAll("circle").each(function (d) {
                        d3.select(this).style("fill", "rgb(26, 152, 80)")
                    });
                }
                scope.$apply();
            }

        }
    }

})();
