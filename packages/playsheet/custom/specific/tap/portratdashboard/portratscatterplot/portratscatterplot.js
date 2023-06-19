(function () {
    "use strict";
    angular.module("app.tap.portratscatterplot", [])
        .directive("portratscatterplot", portratscatterplot);

    portratscatterplot.$inject = ["$filter", "$compile", "_"];

    function portratscatterplot($filter, $compile, _) {

        portratscatterplotLink.$inject = ["scope", "ele", "attrs", "controllers"];
        portratscatterplotController.$inject = [];
        return {
            restrict: "A",
            require: ['portratchart', '^portrat'],
            priority: 300,
            link: portratscatterplotLink,
            controller: portratscatterplotController
        };

        function portratscatterplotLink(scope, ele, attrs, controllers) {
            //declare/initialize scope variables
            scope.chartController = controllers[0];
            scope.portratController = controllers[1];

            //local variables

            var width = 0,
                height = 0,
                dataSeriesArray = [],
                legendArray = [],
                type = "",
                xAxisMin = 0,
                xAxisMax = 0,
                yAxisMin = 0,
                yAxisMax = 0,
                xLineVal = 0,
                yLineVal = 0,
                xAxisText = "",
                yAxisText = "",
                zAxisText = "",
                labelHeader = "",
                AXIS_LABEL_PADDING = 15,
                OPACITY_VALUE = 1,
                TM_EXTERNAL_STABILITY_MULTIPLIER = 0.3,
                TM_ARCHITECTURAL_COMPLEXITY_MULTIPLIER = 0.1,
                TM_INFORMATION_ASSURANCE_MULTIPLIER = 0.3,
                TM_NONFUNCTIONAL_REQUIREMENTS_MULTIPLIER = 0.3,
                NODE_MIN_SIZE = 4.5,
                NODE_MAX_SIZE = 35,
                EMPTY_Z = 0,
                currentLeftMargin = 0,
                currentWidth = 0,
                nodesEnter,
                ZIndexToggle = true,
                lineGuideToggle = false,
                unFilteredDataSeriesArray = [],
                uriMap = {},
                legendLabel = '';

            //inserting id for div
            var html = '<div class="append-viz" id=' + scope.chartController.chart + "-append-viz" + ' ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\"><div id=' + scope.chartController.chart + '></div></div>';
            ele.append($compile(html)(scope));
            //ele.remove(id); //remove attribute

            //Widget Variables
            scope.chartController.margin = {
                top: 50,
                right: 40,
                bottom: 100,
                left: 55
            };

            //Widget Functions
            scope.chartController.dataProcessor = function () {
                if (!_.isEmpty(scope.chartController.data)) {
                    uriMap = {};
                    legendLabel = '';

                    var data = JSON.parse(JSON.stringify(scope.chartController.data));
                    unFilteredDataSeriesArray = JSON.parse(JSON.stringify(formattedData(data.dataTableAlign, data.data)));
                    var scatterData = JSON.parse(JSON.stringify(data.dataTableAlign));

                    //Axes Titles
                    xAxisText = $filter("replaceUnderscores")(scatterData.x || data.specificData.xAxisTitle || "No xAxisTitle given");
                    yAxisText = $filter("replaceUnderscores")(scatterData.y || data.specificData.yAxisTitle || "No yAxisTitle given");
                    zAxisText = scatterData.z || data.specificData.zAxisTitle;
                    labelHeader = data.dataTableAlign.label;
                    //x,y Min & x,y Max axis values
                    xAxisMin = data.specificData.xAxisMin;
                    yAxisMin = data.specificData.yAxisMin;
                    xAxisMax = data.specificData.xAxisMax;
                    yAxisMax = data.specificData.yAxisMax;
                    xLineVal = data.specificData.xLineVal;
                    yLineVal = data.specificData.yLineVal;

                    if (data.dataTableAlign.x) {
                        type = "scatter";
                        updateDataSeries(unFilteredDataSeriesArray);
                    } else {
                        type = "gridscatter";
                        updateDataSeries(data.specificData.dataSeries);
                    }

                    //Highlight Current System
                    if (scope.portratController.currentSystemData.name != "Overview") {
                        var allCircles = d3.selectAll("circle.node"),
                            selectedCircle = d3.selectAll("circle.node").filter(function (d) {
                                return $filter("shortenAndReplaceUnderscores")(d.label) === $filter("shortenAndReplaceUnderscores")("http://health.mil/ontologies/Concept/System/" + scope.portratController.currentSystemData.name);
                            });

                        //set all circles (and previously selected nodes) to default stroke & stroke-width
                        allCircles.attr({
                            "stroke-width": 0
                        });
                        //set selected node to <color> and <border> size
                        selectedCircle.attr({
                            "stroke": "black",
                            "stroke-width": 2.0
                        });
                    }
                }
            };

            scope.chartController.highlightSelectedItem = function (selectedItem) {
                var allCircles = d3.selectAll("circle.node"), selectedCircles = [];

                for (var i in selectedItem) {
                    selectedCircles.push(d3.selectAll("circle.node").filter(function (d) {
                        return $filter("shortenAndReplaceUnderscores")(d.label) === $filter("shortenAndReplaceUnderscores")(selectedItem[i].uri);
                    }));
                }


                //set all circles (and previously selected nodes) to default stroke & stroke-width
                allCircles.attr({
                    "stroke-width": 0
                });
                //set selected node to <color> and <border> size
                for (var i in selectedCircles) {
                    selectedCircles[i].attr({
                        "stroke": "black",
                        "stroke-width": 2.0
                    });
                }
            };

            scope.chartController.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartController.resizeViz = function () {
                scope.chartController.containerSize(scope.chartController.containerClass, scope.chartController.container, scope.chartController.margin);

                var updateSvg = d3.select("#" + scope.chartController.chart).select("svg")
                    .attr("width", scope.chartController.container.width + scope.chartController.margin.left + scope.chartController.margin.right - 30)
                    .attr("height", scope.chartController.container.height + scope.chartController.margin.top + scope.chartController.margin.bottom - 30);

                xScale.rangeRound([0, scope.chartController.container.width]);
                yScale.rangeRound([scope.chartController.container.height, 0]);

                //x axis
                xAxisGroup.attr("transform", "translate(0," + scope.chartController.container.height + ")");
                updateSvg.selectAll("g.x.axis text")
                    .attr("x", scope.chartController.container.width - 40);

                callAxesGroup();

                /*
                 var legendRect = updateSvg.selectAll(".legend circle").attr("cx", (margin.right - 25)).attr("cy", (scope.chartController.container.height + margin.top - margin.bottom / 2 - 11));
                 var legendText = updateSvg.selectAll(".legend text").attr("x", (margin.right / 2 + 1)).attr("y", (scope.chartController.container.height + margin.top - margin.bottom / 2 - 10));
                 var zIndexText = updateSvg.selectAll(".scattercontrols text").attr("x", scope.chartController.container.width);*/

                if (lineGuideToggle === false) {
                    //remove former crosshairs
                    d3.selectAll("g.lineguide.x").remove();
                    d3.selectAll("g.lineguide.y").remove();
                    //call to create crosshair
                    createLineGuide(xLineVal, yLineVal, dataSeriesArray);

                }

                var nodes = updateSvg.selectAll("circle.node")
                    .attr("cx", xMap)
                    .attr("cy", yMap);

                drawLegend(svg);
            };

            scope.chartController.drawZIndex = function () {
                scope.drawZIndex();
            };

            scope.chartController.toggleLineGuide = function () {
                scope.toggleLineGuide();
            };

            //we need to reformat so label, x, y, z, series are mapped
            var formattedData = function (dataTableAlign, tableData) {
                var dataArray = [],
                    label = dataTableAlign.label,
                    x = dataTableAlign.x,
                    y = dataTableAlign.y,
                    z,
                    series;

                if (dataTableAlign.z) {
                    z = dataTableAlign.z;
                }

                if (dataTableAlign.series) {
                    series = dataTableAlign.series;
                    legendLabel = series;
                }

                for (var key in tableData) {
                    //This array stores the values as numbers
                    dataArray.push({
                        label: tableData[key][label],
                        x: Number(tableData[key][x]),
                        y: Number(tableData[key][y]),
                        z: Number(tableData[key][z]),
                        series: tableData[key][series]
                    });

                    //setting z and series to empty string if they're undefined.
                    if (!dataArray[key].z) {
                        dataArray[key].z = "";
                    }

                    if (!dataArray[key].series) {
                        dataArray[key].series = "";
                    }
                }
                return dataArray;
            };

            function updateDataSeries(newDataSeries) {
                dataSeriesArray = JSON.parse(JSON.stringify(newDataSeries));

                //x,y Min & x,y Max axis values
                xAxisMin = xAxisMin || calculateMin(dataSeriesArray, "x");
                yAxisMin = yAxisMin || calculateMin(dataSeriesArray, "y");
                xAxisMax = xAxisMax || calculateMax(dataSeriesArray, "x");
                yAxisMax = yAxisMax || calculateMax(dataSeriesArray, "y");
                xLineVal = xLineVal || calculateAvg(dataSeriesArray, "x");
                yLineVal = yLineVal || calculateAvg(dataSeriesArray, "y");

                legendArray.length = 0;

                update();
            }

            //node radius scale
            var rScale = d3.scale.linear()
                .rangeRound([NODE_MIN_SIZE, NODE_MAX_SIZE])
                .nice();

            //setup x
            var xValue = function (d) {
                    if (isNaN(d.x)) {
                        return 0;
                    }
                    return d.x;
                },
                xScale = d3.scale.linear().rangeRound([0, scope.chartController.container.width]),
                xMap = function (d) {
                    return xScale(xValue(d));
                },
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);

            //setup y
            var yValue = function (d) {
                    if (type !== "scatter") {
                        return d["y-external stability"] * TM_EXTERNAL_STABILITY_MULTIPLIER + d["y-architectural complexity"] * TM_ARCHITECTURAL_COMPLEXITY_MULTIPLIER + d["y-information assurance"] * TM_INFORMATION_ASSURANCE_MULTIPLIER + d["y-nonfunctional requirements"] * TM_NONFUNCTIONAL_REQUIREMENTS_MULTIPLIER;
                    } else {
                        if (isNaN(d.y)) {
                            return 0;
                        } else {
                            return d.y;
                        }
                    }
                },
                yScale = d3.scale.linear().rangeRound([scope.chartController.container.height, 0]),
                yMap = function (d) {
                    return yScale(yValue(d));
                },
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);

            //setup fill color
            var colorValue = function (d) {
                    if (scope.chartController.data.specificData.highlight === d.label) {
                        return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label));
                    } else if (d.label.uriString && scope.chartController.data.specificData.highlight === d.label.uriString) {
                        return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label.uriString));
                    }
                    return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.series)) || labelHeader;
                },
                color = d3.scale.category10();


            /* Initialize tooltip */
            var tip = d3.tip().attr("class", "d3-tip")
                .attr("id", "prd-scatter-d3-tip")
                .style("z-index", "10000")
                .html(function (d) {
                    var title = "",
                        tooltipText = "",
                        businessValue = 0,
                        xValue = 0,
                        zValue = 0;

                    if (d.label.uriString) {
                        title = $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label.uriString));
                    } else {
                        title = $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label));
                    }

                    if (d["y-external stability"] !== undefined) {
                        businessValue = d["y-external stability"] * TM_EXTERNAL_STABILITY_MULTIPLIER + d["y-architectural complexity"] * TM_ARCHITECTURAL_COMPLEXITY_MULTIPLIER + d["y-information assurance"] * TM_INFORMATION_ASSURANCE_MULTIPLIER + d["y-nonfunctional requirements"] * TM_NONFUNCTIONAL_REQUIREMENTS_MULTIPLIER;
                        xValue = d.x;
                        zValue = d.z || 0;
                    } else if (d.y !== undefined) {
                        businessValue = d.y;
                        xValue = d.x;
                        zValue = d.z || 0;
                    }

                    tooltipText = "<div>" +
                        "    <span class='light'>" + title + "</span><br/>" +
                        "    <span class='light'>" + yAxisText + ":</span> " + $filter("number")(businessValue, 3) + "<br/>" +
                        "    <span class='light'>" + xAxisText + ":</span> " + $filter("number")(xValue, 3) + "<br/>";

                    if (zValue && zValue !== NODE_MIN_SIZE) {
                        tooltipText += "    <span class='light'>" + zAxisText + ":</span> " + zValue + "<br/>";
                    }

                    tooltipText += "</div>";

                    return tooltipText;

                });

            //Display Title and Controls for visualization when selected in Mash-Up View
            /*scope.$watch("chartController.selectedViz", function () {
             if (scope.chartController.selectedViz) {
             if (scope.chartController.selectedViz === scope.chartController.containerClass) {
             scope.chartController.showTitle = true;
             } else if (scope.chartController.selectedViz !== scope.chartController.containerClass) {
             scope.showTitle = false;
             }
             }
             });*/

            // add the graph canvas to the body of the webpage
            var svg = d3.select("#" + scope.chartController.chart).append("svg")
                .attr("width", scope.chartController.container.width + scope.chartController.margin.left + scope.chartController.margin.right - 30)
                .attr("height", scope.chartController.container.height + scope.chartController.margin.top + scope.chartController.margin.bottom - 30)
                .append("g")


            //x axis
            var xAxisGroup = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + scope.chartController.container.height + ")");
            //x axis text/label
            svg.selectAll("g.x.axis").append("text")
                .attr("class", "label")
                .attr("x", scope.chartController.container.width - 40)
                .attr("y", -6)
                .style("text-anchor", "end")
                .text("");

            //y axis
            var yAxisGroup = svg.append("g")
                .attr("class", "y axis");
            //y axis text/label
            svg.selectAll("g.y.axis").append("text")
                .attr("class", "label")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("");

            //where all the magic happens
            function update() {
                //set container width and height
                scope.chartController.containerSize(scope.chartController.containerClass, scope.chartController.container, scope.chartController.margin);
                svg.selectAll(".legend").remove();
                svg.selectAll(".node").remove();
                xScale.domain([
                    d3.min(dataSeriesArray, function (value) {
                        if (type !== "scatter") {
                            return xAxisMin;
                        }
                        return +value.x;
                    }) - 1,
                    d3.max(dataSeriesArray, function (value) {
                        return +value.x;
                    }) + 1
                ])
                    .nice();

                if (yAxisMax >= 1) {
                    yAxisMin = yAxisMin - 1;
                }

                yScale.domain([yAxisMin, d3.max(dataSeriesArray, function (value) {
                    if (type !== "scatter") {
                        return 10;
                    }

                    return +value.y;
                })]).nice();

                rScale.domain([d3.min(dataSeriesArray, function (value) {
                    if (!value.z || isNaN(value.z)) {
                        value.z = NODE_MIN_SIZE;
                    }

                    return value.z;

                }), d3.max(dataSeriesArray, function (value) {
                    if (!value.z || isNaN(value.z)) {
                        value.z = NODE_MIN_SIZE;
                    }

                    return value.z;
                })]);

                //Bill Sutton wanted this functionality for this movie db, which has obscenely long y axis label values
                var maxWidth = 0;

                svg.selectAll("text.foo")
                    .data(yScale.ticks())
                    .enter().append("text")
                    .text(function (d) {
                        return yScale.tickFormat()(d);
                    })
                    .each(function (d) {
                        maxWidth = Math.max(this.getBBox().width + yAxis.tickSize() + yAxis.tickPadding(), maxWidth);
                    })
                    .remove();

                currentLeftMargin = Math.max(scope.chartController.margin.left + AXIS_LABEL_PADDING, maxWidth + AXIS_LABEL_PADDING);
                currentWidth = scope.chartController.container.width - (currentLeftMargin - scope.chartController.margin.left);
                svg.attr("transform", "translate(" + currentLeftMargin + "," + scope.chartController.margin.top + ")");

                callAxesGroup();

                //x axis text
                svg.select("g.x.axis text").text(xAxisText);

                //y axis text
                svg.select("g.y.axis text").text(yAxisText);

                d3.selectAll("g.lineguide.x").remove();
                d3.selectAll("g.lineguide.y").remove();
                //call to create crosshair
                if (type !== "scatter") {
                    createLineGuide(xLineVal, yLineVal, dataSeriesArray);
                }

                //sort data in descending order so that smaller nodes put on svg after larger ones
                //(allows for tooltip on smaller overlapping nodes)
                dataSeriesArray = dataSeriesArray.sort(function (a, b) {
                    return d3.descending(a.z, b.z);
                });

                //draw circles - data join
                var nodes = svg.selectAll(".node")
                    .data(dataSeriesArray, function (d) {
                        if (d.label.uriString) {
                            return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label.uriString));
                        } else if (d.label) {
                            return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label));
                        } else if (d.uriString) {
                            return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.uriString));
                        }
                    });

                //update
                nodes.attr("cx", xMap)
                    .attr("cy", yMap)
                    .transition().duration(1000)
                    .attr("r", function (d) {
                        //while calculating the radius resize for nodes, also set the legend array b/c it will be empty
                        //on update
                        var colorVal = $filter("shortenValueFilter")($filter("replaceUnderscores")(d.series)) || labelHeader;
                        uriMap[colorVal] = d.series || labelHeader;
                        legendArray.push({
                            "color": colorVal,
                            "zIndexFlag": null
                        });

                        if (isNaN(d.z)) {
                            return rScale(0);
                        }

                        if (d.z) {
                            return rScale(+d.z);
                        } else {
                            return rScale(0);
                        }

                    });

                //entering nodes
                nodesEnter = nodes.enter().insert("circle", ".legend")
                    .attr("class", "node unselectable")
                    .attr("cx", xMap)
                    .attr("cy", yMap)
                    .attr("opacity", 0.8)
                    .attr("r", 0)
                    .attr("r", function (d) {
                        if (isNaN(d.z)) {
                            return rScale(0);
                        }

                        if (d.z) {
                            return rScale(+d.z);
                        } else {
                            return rScale(0);
                        }
                    })
                    .style("fill", function (d) {
                        var colorVal = "";
                        //if there is a system to highlight, fill it with another color.
                        if (scope.chartController.data.specificData.highlight === d.label || (d.label.uriString && scope.chartController.data.specificData.highlight === d.label.uriString)) {
                            colorVal = $filter("shortenValueFilter")($filter("replaceUnderscores")(scope.chartController.data.specificData.highlight));
                            uriMap[colorVal] = JSON.parse(JSON.stringify(scope.chartController.data.specificData.highlight));
                        } else {
                            colorVal = $filter("shortenValueFilter")($filter("replaceUnderscores")(d.series)) || labelHeader;
                            uriMap[colorVal] = d.series || labelHeader;
                        }

                        legendArray.push({
                            "color": colorVal,
                            "zIndexFlag": null
                        });

                        if (d.series === "Recommended Consolidation") {
                            return "#ff7f0e";
                        }
                        else {
                            return "#1f77b4";
                        }
                    })
                    .on("mouseover", function (d) { // Transitions in D3 don't support the 'on' function They only exist on selections. So need to move that event listener above transition and after append
                        var circle = d3.select(this);
                        //transition to increase size/opacity of bubble
                        circle
                            .transition().duration(100)
                            .style("opacity", 1);
                        tip.show(d);
                    })
                    .on("mouseout", function (d) {
                        var circle = d3.select(this);

                        // go back to original size and opacity
                        circle
                            .transition().duration(100)

                            .style("opacity", 0.8);

                        tip.hide(d);
                    })
                    .on("dblclick", function (d) {
                        //check if the data is bound
                        if (scope.chartController.isDataBound) {
                            /*joinDataService.setSelectedUri(multiViewService.getBoundID(scope.chartController.uniqueId), [{
                                uri: d.label,
                                index: '',
                                name: ''
                            }]);*/
                            scope.$apply();
                        } else {
                            scope.chartController.highlightSelectedItem([{
                                uri: d.label
                            }]);
                        }

                        var selectedSys = {"name": d.label.substr(d.label.lastIndexOf('/') + 1), "ind": d.series};
                        scope.portratController.currentSystemData = selectedSys;
                        scope.portratController.loadScreen = true;
                        scope.$apply();
                    })
                    .transition().duration(1000);

                //exiting nodes
                var nodesExit = nodes.exit()
                    .transition().duration(1000)
                    .attr("r", 0)
                    .remove();

                drawLegend(svg);

                svg.call(tip);
                scope.chartController.resizeViz();

                //styling for x and y axis
                d3.selectAll('.axis line')
                    .style('fill', 'none')
                    .style('stroke', '#000')
                    .style('shape-rendering', 'crispEdges');

                d3.selectAll('.axis path')
                    .style('fill', 'none')
                    .style('stroke', '#000')
                    .style('shape-rendering', 'crispEdges');
            } //end of update function()

            function drawLegend(svg) {
                //legend array with only unique values
                legendArray = _.uniqBy(legendArray, "color");

                svg.selectAll(".legend").remove();
                //draw legend
                var legend = svg.selectAll(".legend")
                    .data(legendArray);

                var counter = 0;
                var legendColumns = 9;
                var columnSpacing = 170;

                //enter legend g
                var legendEnter = legend.enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", function (d, i) {
                        var xVal = scope.chartController.margin.left / 2 - currentLeftMargin + (i * columnSpacing) - (counter * (legendColumns * columnSpacing));
                        var yVal = 50 + (counter * 20);
                        if (((i + 1) % legendColumns) === 0) {
                            counter = counter + 1;
                        }
                        return "translate(" + xVal + "," + yVal + ")";
                    });

                // enter legend colored circles
                legendEnter.append("circle")
                    .attr("cx", function (d, i) {
                        return (scope.chartController.margin.right - 25);
                    })
                    .attr("cy", function (d, i) {
                        return (scope.chartController.container.height + scope.chartController.margin.top - scope.chartController.margin.bottom / 2 - 11);
                    })
                    .attr("r", NODE_MIN_SIZE)
                    .attr("stroke", "#777")
                    .attr("stroke-width", 1)
                    .style("fill", function (d) {
                        if (d.color === "Recommended Consolidation") {
                            return "#ff7f0e";
                        }
                        else {
                            return "#1f77b4";
                        }
                    })
                    .on("click", function (d) {
                        if (scope.chartController.isDataBound) {
                            scope.chartController.filterOptions[legendLabel].tempSelected = _.without(scope.chartController.filterOptions[legendLabel].tempSelected, uriMap[d.color]);
                            scope.chartController.applyFilter();
                        } else {
                            var circles = d3.selectAll("circle.node"),
                                selectedLgdCircle = d3.select(this);

                            circles
                                .transition().duration(500)
                                .attr("r", function (circleData, i) {
                                    var colorVal = $filter("shortenValueFilter")($filter("replaceUnderscores")(circleData.series)) || labelHeader,
                                        circleDataR = circleData.z || EMPTY_Z,
                                        circleR = d3.select(this).attr("r");

                                    if (d.color === colorVal) {
                                        if (circleR > 0) {
                                            selectedLgdCircle
                                                .transition().duration(500)
                                                .style("fill", "white");
                                            return 0;
                                        } else {
                                            selectedLgdCircle
                                                .transition().duration(500)
                                                .style("fill", function (d) {
                                                    return color(d.color);
                                                });
                                            if (ZIndexToggle === false) {
                                                return NODE_MIN_SIZE;
                                            } else {
                                                return rScale(circleDataR);
                                            }
                                        }
                                    } else {
                                        return d3.select(this).attr("r");
                                    }
                                });
                        }
                    });

                // enter legend text
                legendEnter.append("text")
                    .attr("x", function (d, i) {
                        return (scope.chartController.margin.right / 2 + 1);
                    })
                    .attr("y", function (d, i) {
                        return (scope.chartController.container.height + scope.chartController.margin.top - scope.chartController.margin.bottom / 2 - 10);
                    })
                    .attr("dy", ".25em")
                    .style("text-anchor", "start")
                    .text(function (d) {
                        return $filter("reduceStringLength")(d.color);
                    });

                var legendExit = legend.exit().remove();
            }

            // pull out the z from the JSON object and to then find min and max in scale function
            scope.drawZIndex = function () {
                // scale the radii based on the minimum and maximum of the z values that are passed in through dataSeriesArray on click

                if (ZIndexToggle === false) {
                    ZIndexToggle = true;
                    var NewDataSeriesArray = [];
                    for (var i = 0; i < dataSeriesArray.length; i++) {
                        NewDataSeriesArray.push(dataSeriesArray[i].z);
                    }
                    var rScale = d3.scale.linear()
                        .domain([d3.min(NewDataSeriesArray), d3.max(NewDataSeriesArray)])
                        .rangeRound([NODE_MIN_SIZE, NODE_MAX_SIZE])
                        .nice();

                    //use the local rScale to update the nodes
                    var zIndexUpdate = d3.selectAll(".node");

                    zIndexUpdate.transition().duration(400).attr("r", function (dataSeriesArray) {
                        var circleRadius = d3.select(this).attr("r");
                        if (circleRadius === 0) {
                            return 0;
                        } else if (isNaN(circleRadius)) {
                            return NODE_MIN_SIZE;
                        } else {
                            if (dataSeriesArray.z) {
                                return rScale(dataSeriesArray.z);
                            } else {
                                return rScale(0);
                            }
                        }
                    });
                } else {
                    ZIndexToggle = false;
                    var zIndexUpdate = d3.selectAll(".node");

                    zIndexUpdate.transition().duration(400).attr("r", function (d) {
                        var circleRadius = d3.select(this).attr("r");
                        if (circleRadius === 0) {
                            return 0;
                        } else return NODE_MIN_SIZE;
                    });

                }
            };


            function callAxesGroup() {
                //x axis
                xAxisGroup
                    .transition()
                    .duration(1000)
                    .call(xAxis);

                //y axis
                yAxisGroup
                    .transition()
                    .duration(1000)
                    .call(yAxis);
            }

            scope.toggleLineGuide = function () {

                //ADD TYPE IF THEN STATEMENT, if the type is scatter then we need to create the line guide, then opaque and unopaque the guide
                //if the type is not scatter then we just need to opaque and unopaque the guide
                var svgSelect = d3.select("svg");

                var lineSelectX = svgSelect.select(".lineguide.x").select("line");
                var lineSelectY = svgSelect.select(".lineguide.y").select("line");

                if (type !== "scatter") {
                    if (lineGuideToggle == false) {
                        lineGuideToggle = true;
                        lineSelectX.transition().style("opacity", 0);
                        lineSelectY.transition().style("opacity", 0);

                    } else {
                        lineGuideToggle = false;
                        lineSelectX.transition().style("opacity", OPACITY_VALUE);
                        lineSelectY.transition().style("opacity", OPACITY_VALUE);

                    }
                } else {
                    if (lineGuideToggle == false) {
                        lineGuideToggle = true;
                        createLineGuide(xLineVal, yLineVal, dataSeriesArray);

                    } else {
                        lineGuideToggle = false;
                        d3.selectAll("g.lineguide.x").remove();
                        d3.selectAll("g.lineguide.y").remove();

                    }
                }
            };

            function createLineGuide(xLineVal, yLineVal, dataSeriesArray) {

                //x line group for crosshair
                var lineGuideX = svg.append("g")
                    .attr("class", "lineguide x")
                    .append("line")
                    .style("stroke", "gray")
                    .style("stroke-dasharray", ("3, 3"))
                    .style("opacity", OPACITY_VALUE)
                    .style("fill", "black");

                //y line group for crosshair
                var lineGuideY = svg.append("g")
                    .attr("class", "lineguide y")
                    .append("line")
                    .style("stroke", "gray")
                    .style("stroke-dasharray", ("3, 3"))
                    .style("opacity", OPACITY_VALUE)
                    .style("fill", "black");

                //create crosshair based on median x (up/down) 'potentially' passed with data
                lineGuideX
                    .transition()
                    .duration(1000)
                    .attr("x1", xScale(xLineVal))
                    .attr("y1", 0)
                    .attr("x2", xScale(xLineVal))
                    .attr("y2", scope.chartController.container.height);
                // .attr("y2", yScale(d3.max(dataSeriesArray,function(value){
                //     return value.y;
                // })+1 ));

                //create crosshair based on median y (left/right) 'potentially' passed with data
                lineGuideY
                    .transition()
                    .duration(1000)
                    .attr("x1", xScale(xAxisMin - 1))
                    .attr("y1", yScale(yLineVal))
                    .attr("x2", scope.chartController.container.width)
                    // .attr("x2", xScale(d3.max(dataSeriesArray, function(value) {
                    //     return value.x;
                    // }) + 1))
                    .attr("y2", yScale(yLineVal));
            }

            function calculateAvg(dataSeriesArray, propKey) {
                var temp = d3.mean(dataSeriesArray, function (value) {
                    return +value[propKey];
                });
                return temp;
            }

            function calculateMin(dataSeriesArray, propKey) {
                var temp = d3.min(dataSeriesArray, function (value) {
                    return +value[propKey];
                });
                return temp;
            }

            function calculateMax(dataSeriesArray, propKey) {
                var temp = d3.max(dataSeriesArray, function (value) {
                    return +value[propKey];
                });
                return temp;
            }

            //cleaning up d3-tooltip
            scope.$on("$destroy", function () {
                d3.selectAll("#prd-scatter-d3-tip").remove();
            });
        }

        function portratscatterplotController() {

        }
    }
})();
/**
 * Created by kevchang on 7/22/2015.
 */
