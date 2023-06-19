(function () {
    "use strict";

    /**
     * @name healthGrid
     * @desc ScatterPlot directive for creating and visualizing D3 scatter plots
     */
    angular.module("app.tap.health-grid.directive", [])
        .directive("healthGrid", healthGrid);

    healthGrid.$inject = ["$filter", "$compile", 'VIZ_COLORS', '_'];

    function healthGrid($filter, $compile, VIZ_COLORS, _) {

        healthGridLink.$inject = ["scope", "ele", "attrs", "controllers"];
        healthGridController.$inject = ['$scope'];
        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            templateUrl: 'custom/specific/tap/health-grid/health-grid.directive.html',
            link: healthGridLink,
            controller: healthGridController
        };

        function healthGridLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.chartCtrl = ctrl[0];

            scope.lineGuide = toggleLineGuide;

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
                labelText = "",
                xAxisText = "",
                yAxisText = "",
                zAxisText = "",
                seriesText = "",
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
                ZIndexToggle = false,
                lineGuideToggle = true,
                unFilteredDataSeriesArray = [],
                uriMap = {},
                legendLabel = '',
                chartData = [],
                legendEnter,
                toolData,
                colorTitles = {},
                customColors = {},
                xScale,
                yScale,
                xAxis,
                yAxis,
                tip,
                originalAxis = {},
                customAxis = false,
                insightIDClean = "",
                colorsArray = VIZ_COLORS.COLOR_SEMOSS,
                uiCustomColors,
                legendIndex = 1,
                legendIndexMax = 1,
                numShownLegend;

            //inserting id for div
            //var html = '<div class="append-viz" id=' + scope.chartCtrl.chartName + "-append-viz" + '><div id=' + scope.chartCtrl.chartName + '></div></div>';
            var html = '<div class="append-viz" id=' + scope.chartCtrl.chartName + "-append-viz" + ' style="overflow:hidden"><div id=' + scope.chartCtrl.chartName + '></div></div>';

            ele.append($compile(html)(scope));
            //ele.remove(id); //remove attribute

            //Widget Variables
            scope.chartCtrl.margin = {
                top: 60,
                right: 125,
                bottom: 120,
                left: 100
            };

            //Widget Functions
            scope.chartCtrl.dataProcessor = function (newData) {
                if (!_.isEmpty(newData)) {
                    uriMap = {};
                    legendLabel = '';

                    chartData = JSON.parse(JSON.stringify(newData));
                    unFilteredDataSeriesArray = JSON.parse(JSON.stringify(formattedData(chartData.dataTableAlign, chartData.data)));
                    var scatterData = JSON.parse(JSON.stringify(chartData.dataTableAlign));

                    //create clean insight id to give the svgs a unique identifier for when using in a dashboard
                    //use to fix a bug where toggling quadrants afftected multiple scatter plots
                    //'a' needs to be added to the front because svg classes cannot be only numbers
                    insightIDClean = "a" + chartData.insightID;
                    insightIDClean = insightIDClean.replace(/\./g, '');
                    insightIDClean = insightIDClean.replace(/\s/g, '');

                    labelText = $filter("replaceUnderscores")(scatterData && scatterData.label ? scatterData.label : chartData && chartData.specificData ? chartData.specificData.label : "No label given");
                    //Axes Titles
                    xAxisText = $filter("replaceUnderscores")(scatterData && scatterData.x ? scatterData.x : chartData && chartData.specificData ? chartData.specificData.xAxisTitle : "No xAxisTitle given");
                    yAxisText = $filter("replaceUnderscores")(scatterData && scatterData.y ? scatterData.y : chartData && chartData.specificData ? chartData.specificData.yAxisTitle : "No yAxisTitle given");

                    seriesText = $filter("replaceUnderscores")(scatterData && scatterData.series ? scatterData.series : chartData && chartData.specificData ? chartData.specificData.series : "");

                    labelHeader = chartData.dataTableAlign.label;
                    zAxisText = scatterData.z;
                    uiCustomColors = {};

                    //check tool data
                    toolData = chartData.uiOptions;
                    if (toolData) {
                        if (toolData.hasOwnProperty('color') && toolData.color != 'none') {
                            if(!_.isArray(toolData.color)) {
                                uiCustomColors = toolData.color;
                            }
                            colorsArray = toolData.color;
                        }
                        if (toolData.hasOwnProperty('toggleZ')) {
                            ZIndexToggle = toolData.toggleZ;
                        }
                        if (toolData.hasOwnProperty('lineGuide')) {
                            lineGuideToggle = toolData.lineGuide;
                        }
                        if (toolData.hasOwnProperty('customAxisNeeded')) {
                            customAxis = toolData.customAxisNeeded;
                        }
                        if(toolData.hasOwnProperty('customColors')){
                            uiCustomColors = toolData.customColors;
                        }
                    }

                    if (chartData.dataTableAlign.x) {
                        type = "scatter";
                        updateDataSeries(unFilteredDataSeriesArray);
                    } else {
                        type = "gridscatter";
                        updateDataSeries(chartData.specificData.dataSeries);
                    }
                    scope.chartCtrl.colorLabels = _.keys(colorTitles);
                }
            };

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                //need to invoke tool functions
                scope[toolUpdateConfig.fn](toolUpdateConfig.args);
            };

            //we need to reformat so label, x, y, z, series are mapped
            var formattedData = function (dataTableAlign, tableData) {
                var dataArray = [],
                    label = dataTableAlign.label,
                    x = dataTableAlign.x,
                    y = dataTableAlign.y,
                    z,
                    series;

                if (dataTableAlign.z || dataTableAlign.z === 0) {
                    z = dataTableAlign.z;
                }

                if (dataTableAlign.series) {
                    series = dataTableAlign.series;
                    legendLabel = series;
                }

                for (var key in tableData) {
                    if (tableData.hasOwnProperty(key)) {
                        //This array stores the values as numbers
                        dataArray.push({
                            label: tableData[key][label],
                            x: Number(tableData[key][x]),
                            y: Number(tableData[key][y]),
                            z: Number(tableData[key][z]),
                            series: tableData[key][series]
                        });

                        //setting z and series to empty string if they're undefined.
                        if (!dataArray[key].z && dataArray[key].z !== 0) {
                            dataArray[key].z = "";
                        }

                        if (!dataArray[key].series) {
                            dataArray[key].series = "";
                        }
                    }
                }
                return dataArray;
            };

            function updateDataSeries(newDataSeries) {
                dataSeriesArray = JSON.parse(JSON.stringify(newDataSeries));

                //x,y Min & x,y Max axis values
                //check for health grid data
                if (!_.isEmpty(chartData.specificData)) {
                    xAxisMin = chartData.specificData.xAxisMin;
                    yAxisMin = chartData.specificData.yAxisMin;
                    xAxisMax = chartData.specificData.xAxisMax;
                    yAxisMax = chartData.specificData.yAxisMax;
                    xLineVal = chartData.specificData.xLineVal;
                    yLineVal = chartData.specificData.yLineVal;
                    zAxisText = chartData.specificData.zAxisTitle;
                } else {
                    xAxisMin = calculateMin(dataSeriesArray, "x");
                    yAxisMin = calculateMin(dataSeriesArray, "y");
                    xAxisMax = calculateMax(dataSeriesArray, "x");
                    yAxisMax = calculateMax(dataSeriesArray, "y");
                    xLineVal = calculateAvg(dataSeriesArray, "x");
                    yLineVal = calculateAvg(dataSeriesArray, "y");

                }

                if (customAxis) {
                    //x,y Min & x,y Max axis values
                    xAxisMin = toolData.customAxis.xMin;
                    yAxisMin = toolData.customAxis.yMin;
                    xAxisMax = toolData.customAxis.xMax;
                    yAxisMax = toolData.customAxis.yMax;
                }
                //set original axis data
                originalAxis.xMin = xAxisMin;
                originalAxis.xMax = xAxisMax;
                originalAxis.yMin = yAxisMin;
                originalAxis.yMax = yAxisMax;

                legendArray.length = 0;

                update();
            }

            //node radius scale
            var rScale = d3.scale.linear()
                .rangeRound([NODE_MIN_SIZE, NODE_MAX_SIZE])
                .nice();

            //function to setup x
            function xValue(d) {
                if (isNaN(d.x)) {
                    return 0;
                }
                return d.x;
            }

            //function to setup y
            function yValue(d) {
                if (type !== "scatter") {
                    return d["y-external stability"] * TM_EXTERNAL_STABILITY_MULTIPLIER + d["y-architectural complexity"] * TM_ARCHITECTURAL_COMPLEXITY_MULTIPLIER + d["y-information assurance"] * TM_INFORMATION_ASSURANCE_MULTIPLIER + d["y-nonfunctional requirements"] * TM_NONFUNCTIONAL_REQUIREMENTS_MULTIPLIER;
                } else {
                    if (isNaN(d.y)) {
                        return 0;
                    } else {
                        return d.y;
                    }
                }
            }

            //setup fill color
            function colorValue(d) {
                if (chartData.specificData && chartData.specificData.highlight === d.label) {
                    return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label));
                } else if (d.label.uriString && chartData.specificData.highlight === d.label.uriString) {
                    return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.label.uriString));
                }
                return $filter("shortenValueFilter")($filter("replaceUnderscores")(d.series)) || labelHeader;
            }

            /* Initialize tooltip */
            function initializeTooltip() {
                tip = d3.tip().attr("class", "d3-tip")
                    .attr("id", "scatter-d3-tip")
                    .style("z-index", "10000")
                    .html(function (d) {
                        var title = "",
                            tooltipText,
                            businessValue = 0,
                            xValue = 0,
                            zValue = 0,
                            seriesValue = d.series || "";

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

                        tooltipText = "<div>";
                        tooltipText += "<span class='light'>" + $filter("replaceUnderscores")(labelText) + ":</span> " + title + "<br/>";
                        tooltipText += "<span class='light'>" + $filter("replaceUnderscores")(yAxisText) + ":</span> " + businessValue + "<br/>";
                        tooltipText += "<span class='light'>" + $filter("replaceUnderscores")(xAxisText) + ":</span> " + xValue + "<br/>";

                        if (zValue && zAxisText) {
                            tooltipText += "<span class='light'>" + $filter("replaceUnderscores")(zAxisText) + ":</span> " + zValue + "<br/>";
                        }

                        if (seriesValue) {
                            tooltipText += "<span class='light'>" + $filter("replaceUnderscores")(seriesText) + ":</span> " + $filter("shortenAndReplaceUnderscores")(seriesValue);
                            +"<br/>";
                        }

                        tooltipText += "</div>";

                        return tooltipText;
                    });
            }

            function xMap(d) {
                return xScale(xValue(d));
            }

            function yMap(d) {
                return yScale(yValue(d));
            }

            //Display Title and Controls for visualization when selected in Mash-Up View
            /*scope.$watch("chartCtrl.selectedViz", function () {
             if (scope.chartCtrl.selectedViz) {
             if (scope.chartCtrl.selectedViz === scope.chartCtrl.containerClass) {
             scope.chartCtrl.showTitle = true;
             } else if (scope.chartCtrl.selectedViz !== scope.chartCtrl.containerClass) {
             scope.showTitle = false;
             }
             }
             });*/

            // add the graph canvas to the body of the webpage
            var svg = d3.select("#" + scope.chartCtrl.chartName).append("svg")
                .attr("class", "editable-svg")
                .attr("id", scope.chartCtrl.chartName)
                .attr("width", scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right)
                .attr("height", scope.chartCtrl.container.height + scope.chartCtrl.margin.top + scope.chartCtrl.margin.bottom)
                .append("g")
                .attr("transform", "translate(" + scope.chartCtrl.margin.left + "," + (scope.chartCtrl.margin.top-30) + ")");

            //x axis
            var xAxisGroup = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + scope.chartCtrl.container.height + ")");
            //x axis text/label
            svg.selectAll("g.x.axis").append("text")
                .attr("class", "label")
                .attr("x", scope.chartCtrl.container.width - 40)
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
                colorIndex = 0;
                //set up x and y axis
                xScale = d3.scale.linear().rangeRound([0, scope.chartCtrl.container.width]);
                yScale = d3.scale.linear().rangeRound([scope.chartCtrl.container.height, 0]);
                xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(6);
                yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(10);

                initializeTooltip();

                //set container width and height
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);
                svg.selectAll(".legend").remove();
                svg.selectAll(".node").remove();

                //adding a copy y min variable to fix a bug issue where the min kept decreasing by 1 with every call of the update function
                //this copy var keeps the yAxisMin intact
                //if statements check how close the min is to 0. This avoids the bug where all the scatter points are at
                //the top of the graph with the old default of subtracting 1 from the min

                var copyYmin = yAxisMin;
                if (yAxisMax >= 10) {
                    copyYmin = yAxisMin - 1;
                } else if (yAxisMax >= 5) {
                    copyYmin = yAxisMin - 0.5;
                } else {
                    copyYmin = yAxisMin;
                }

                if (customAxis) {
                    xScale.domain([xAxisMin, xAxisMax]);
                    yScale.domain([yAxisMin, yAxisMax]);
                } else {
                    xScale.domain([
                            d3.min(dataSeriesArray, function (value) {
                                if (type !== "scatter") {
                                    return xAxisMin;
                                }
                                return +value.x;
                            }), //- 1,
                            d3.max(dataSeriesArray, function (value) {
                                return +value.x;
                            }) + 1
                        ])
                        .nice();
                    yScale.domain([copyYmin, d3.max(dataSeriesArray, function (value) {
                        if (type !== "scatter") {
                            return 10;
                        }
                        return +value.y;
                    })]).nice();
                }

                rScale.domain([d3.min(dataSeriesArray, function (value) {
                    if ((!value.z && value.z !== 0) || isNaN(value.z)) {
                        value.z = NODE_MIN_SIZE;
                    }

                    return value.z;

                }), d3.max(dataSeriesArray, function (value) {
                    if ((!value.z && value.z !== 0) || isNaN(value.z)) {
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

                currentLeftMargin = Math.max(scope.chartCtrl.margin.left + AXIS_LABEL_PADDING, maxWidth + AXIS_LABEL_PADDING);
                currentWidth = scope.chartCtrl.container.width - (currentLeftMargin - scope.chartCtrl.margin.left);
                //svg.attr("transform", "translate(" + currentLeftMargin + "," + scope.chartCtrl.margin.top + ")");

                callAxesGroup();

                //x axis text
                svg.select("g.x.axis text").text(xAxisText);

                //y axis text
                svg.select("g.y.axis text").text(yAxisText);

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
                    .transition().duration(500)
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
                nodesEnter = nodes.enter().insert("circle")
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
                        var colorVal = colorValue(d);
                        //if there is a system to highlight, fill it with another color.
                        legendArray.push({
                            "color": colorVal,
                            "zIndexFlag": null
                        });
                        return getColors(colorVal);
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
                        var items = [];
                        //add the label uri
                        //always make sure the label is first
                        items.push({
                            uri: d.label,
                            axisName: labelHeader
                        });

                        //add the series to selectedItem if available
                        if (d.series) {
                            items.push({
                                uri: d.series,
                                axisName: seriesText
                            });
                        }

                        scope.chartCtrl.highlightSelectedItem(items);
                    })
                    .transition().duration(500);

                //exiting nodes
                nodes.exit()
                    .transition().duration(500)
                    .attr("r", 0)
                    .remove();

                svg.call(tip);
                scope.chartCtrl.resizeViz();

                scope.toggleZ(ZIndexToggle);

                toggleLineGuide(lineGuideToggle);

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

            var colorIndex = 0;

            function getColors(name) {
                if(!_.isEmpty(uiCustomColors) && !_.isEmpty(uiCustomColors[name])){
                    return uiCustomColors[name];
                }
                //this function chooses the colors from the colorsArray

                //checks the colorTitles to see if this data point already belongs to a certain color
                //if not, assign the next color and increment the index
                if (!colorTitles.hasOwnProperty(name)) {
                    colorTitles[name] = colorIndex;
                    colorIndex++;
                }

                //make sure the color indexes are withing the supplied colorsArray
                //the while statement below will make sure that the colorI is within the range of the colorsArray
                var colorI = colorTitles[name];
                while (colorI >= colorsArray.length) {
                    colorI -= colorsArray.length;
                }
                return (colorsArray[colorI]);
            }

            function drawLegend(svg) {
                //legend array with only unique values

                legendArray = _.unionBy(legendArray, function (item) {
                    return item.color;
                });

                legendArray.sort(function(a, b){
                    var nameA = a.color, nameB = b.color;
                    if (nameA < nameB) //sort string ascending
                        return -1;
                    if (nameA > nameB)
                        return 1;
                    return 0; //default return value (no sorting)
                });

                svg.selectAll(".legend").remove();

                //draw legend
                var legend = svg.selectAll(".legend")
                    .data(legendArray)

                var counter = 0;

                //Enter logic to determine legend columns on the size of the panel
                var legendColumns = 4;
                var panelWidth = scope.chartCtrl.container.width;
                if (panelWidth < 300){
                    legendColumns = 2;
                } else if (panelWidth < 600) {
                    legendColumns = 3;
                } else if (panelWidth < 755) {
                    legendColumns = 4;
                } else if (panelWidth < 905) {
                    legendColumns = 5;
                } else if (panelWidth < 1062) {
                    legendColumns = 6;
                } else if (panelWidth < 1220) {
                    legendColumns = 7;
                } else if (panelWidth < 1378) {
                    legendColumns = 8;
                } else {
                    legendColumns = 9;
                }
                var columnSpacing = 170;

                //enter legend g
                numShownLegend = legendColumns * 3;
                legendIndexMax = Math.ceil((legendArray.length)/(numShownLegend));
                var legendEnter = legend.enter().append("g")
                    .attr("class", "legend")
                    .filter(function(d,i){
                        return i >= (legendIndex-1)*numShownLegend && i < numShownLegend*legendIndex;
                    })
                    .attr("transform", function (d, i) {
                        var xVal = scope.chartCtrl.margin.left / 2 - currentLeftMargin + (i * columnSpacing) - (counter * (legendColumns * columnSpacing));
                        var yVal = 50 + (counter * 20);
                        var rowLimit = 2;
                        if (((i + 1) % legendColumns) === 0 && counter < rowLimit) {
                            counter = counter + 1;
                        }
                        return "translate(" + xVal + "," + yVal + ")";
                    });

                // enter legend colored circles
                legendEnter.append("circle")
                    .attr("cx", function () {
                        return (scope.chartCtrl.margin.right - 75);
                    })
                    .attr("cy", function () {
                        return (scope.chartCtrl.container.height + scope.chartCtrl.margin.top - scope.chartCtrl.margin.bottom / 2 - 11);
                    })
                    .attr("r", NODE_MIN_SIZE)
                    .attr("stroke", "#777")
                    .attr("stroke-width", 1)
                    .style("fill", function (d) {
                        return getColors(d.color);
                    })
                    .on("click", function (d) {
                        var circles = d3.select("#" + scope.chartCtrl.chartName).selectAll("circle.node"),
                            selectedLgdCircle = d3.select(this);

                        circles
                            .transition().duration(500)
                            .attr("r", function (circleData) {
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
                                                return getColors(d.color);
                                            });
                                        if (ZIndexToggle === true) {
                                            return NODE_MIN_SIZE;
                                        } else {
                                            return rScale(circleDataR);
                                        }
                                    }
                                } else {
                                    return d3.select(this).attr("r");
                                }
                            });
                    });

                // enter legend text
                legendEnter.append("text")
                    .attr("x", function () {
                        return (scope.chartCtrl.margin.right / 2 + 1);
                    })
                    .attr("y", function () {
                        return (scope.chartCtrl.container.height + scope.chartCtrl.margin.top - scope.chartCtrl.margin.bottom / 2 - 10);
                    })
                    .attr("dy", ".25em")
                    .style("text-anchor", "start")
                    .text(function (d) {
                        return $filter("reduceStringLength")(d.color);
                    });

                if (legendIndexMax > 1){
                    drawCarousel(svg);
                }
                else{//remove carousel navigation items from page if they exist
                    svg.selectAll("polygon").remove();
                    svg.selectAll(".breadcrumbs").remove();
                    svg.selectAll("#text-scatter-index").remove();
                }

                legend.exit().remove();
            }

            function drawCarousel(svg) {
                svg.selectAll("polygon").remove();
                svg.selectAll(".breadcrumbs").remove();
                svg.selectAll("#text-scatter-index").remove();

                svg.append("polygon")
                    .attr("id", "leftChevron")
                    .style("fill", "#c2c2d6")
                    .attr("points", "0,10, 20,0, 20,20")
                    .attr("transform", "translate(" + ((scope.chartCtrl.container.width/2) - 50) +","+ (scope.chartCtrl.container.height + 100) + ")")
                    .on("click", function (d){
                        if(legendIndex > 1){
                            legendIndex--;
                        }
                        drawLegend(svg);
                    })
                    .attr({
                        display: function(d){
                            if (legendIndex === 1){
                                return "none";
                            }
                            else {
                                return "all";
                            }
                        }
                    });

                svg.append("text")
                    .attr("id", "text-scatter-index")
                    .attr("x", (scope.chartCtrl.container.width/2) - 5)
                    .attr("y", (scope.chartCtrl.container.height + 115))
                    .style("text-anchor", "start")
                    .attr("font-size", "14px")
                    .text(function (d) {
                        return legendIndex + " / " + legendIndexMax;
                    });

                svg.append("polygon")
                    .attr("id", "rightChevron")
                    .style("fill", "#c2c2d6")
                    //.attr("points", "750,440, 720,415, 720, 465")
                    .attr("points","20,10, 0,0, 0,20")
                    .attr("transform", "translate(" + ((scope.chartCtrl.container.width/2) + 50) +","+ (scope.chartCtrl.container.height + 100) + ")")
                    .on("click", function (d){
                        if(legendIndex <= legendIndexMax)
                        {
                            legendIndex++;
                        }
                        drawLegend(svg);
                    })
                    .attr({
                        display: function(d){
                            if (legendIndex === legendIndexMax){
                                return "none";
                            }
                            else {
                                return "all";
                            }
                        }
                    });
                // for (var i = 0; i < legendIndexMax; i++){
                //     svg.append("circle")
                //         .attr("class", "breadcrumbs")
                //         .attr("cx", function () {
                //             return (scope.chartCtrl.margin.right - 75);
                //         })
                //         .attr("cy", function () {
                //             return (scope.chartCtrl.container.height + scope.chartCtrl.margin.top - scope.chartCtrl.margin.bottom / 2 - 11);
                //         })
                //         .attr("r", NODE_MIN_SIZE)
                //         .style("fill", "#000")
                //         .attr("stroke", "#000")
                //         .attr("stroke-width", 1)
                //         .attr("transform", "translate(" + (scope.chartCtrl.container.width + 50) +","+ (scope.chartCtrl.container.height + 50) + ")")
                //     }

            }

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                scope.highlightSelectedItem(selectedItem);
            };

            scope.chartCtrl.filterAction = function () {
                //console.log('Need to Add Filtering Viz Feature')
            };

            scope.chartCtrl.resizeViz = function () {
                scope.resizeViz();
            };

            scope.highlightSelectedItem = function (selectedItem) {
                var allCircles = d3.select("#" + scope.chartCtrl.chartName).selectAll("circle.node"), selectedCircles = [];

                for (var i in selectedItem) {
                    selectedCircles.push(d3.select("#" + scope.chartCtrl.chartName).selectAll("circle.node").filter(function (d) {
                        return ($filter("shortenAndReplaceUnderscores")(d.label) === $filter("shortenAndReplaceUnderscores")(selectedItem[i].uri)) || ($filter("shortenAndReplaceUnderscores")(d.series) === $filter("shortenAndReplaceUnderscores")(selectedItem[i].uri));
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

            scope.resizeViz = function () {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);

                var updateSvg = d3.select("#" + scope.chartCtrl.chartName).select("svg")
                    .attr("width", scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 20)
                    .attr("height", scope.chartCtrl.container.height + scope.chartCtrl.margin.top + scope.chartCtrl.margin.bottom - 20);

                xScale.rangeRound([0, scope.chartCtrl.container.width]);
                yScale.rangeRound([scope.chartCtrl.container.height, 0]);

                //x axis
                xAxisGroup.attr("transform", "translate(0," + scope.chartCtrl.container.height + ")");
                updateSvg.selectAll("g.x.axis text")
                    .attr("x", scope.chartCtrl.container.width - 40);

                callAxesGroup();

                /*var legendRect = updateSvg.selectAll(".legend circle").attr("cx", (margin.right - 25)).attr("cy", (scope.chartCtrl.container.height + scope.chartCtrl.margin.top - scope.chartCtrl.margin.bottom / 2 - 11));
                 var legendText = updateSvg.selectAll(".legend text").attr("x", (margin.right / 2 + 1)).attr("y", (scope.chartCtrl.container.height + scope.chartCtrl.margin.top - scope.chartCtrl.margin.bottom / 2 - 10));
                 var zIndexText = updateSvg.selectAll(".scattercontrols text").attr("x", scope.chartCtrl.container.width);*/

                toggleLineGuide(lineGuideToggle);

                updateSvg.selectAll("circle.node")
                    .attr("cx", xMap)
                    .attr("cy", yMap);

                drawLegend(svg);
            };

            // pull out the z from the JSON object and to then find min and max in scale function
            scope.toggleZ = function (toggleBoolean) {
                ZIndexToggle = toggleBoolean;
                // scale the radii based on the minimum and maximum of the z values that are passed in through dataSeriesArray on click
                //toolDataService.setToolData(toolData, chartData.insightID);

                if (ZIndexToggle === false) {
                    //ZIndexToggle = true;
                    var NewDataSeriesArray = [];
                    for (var i = 0; i < dataSeriesArray.length; i++) {
                        NewDataSeriesArray.push(dataSeriesArray[i].z);
                    }
                    //var svgSelect = d3.select("svg");
                    //var zToggleSelection = svgSelect.select("#" + scope.chartCtrl.chartName);

                    var rScale = d3.scale.linear()
                        .domain([d3.min(NewDataSeriesArray), d3.max(NewDataSeriesArray)])
                        .rangeRound([NODE_MIN_SIZE, NODE_MAX_SIZE])
                        .nice();

                    //use the local rScale to update the nodes
                    var zIndexUpdate = d3.select("#" + scope.chartCtrl.chartName).selectAll(".node");

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
                    //ZIndexToggle = false;
                    var zIndexUpdate = d3.select("#" + scope.chartCtrl.chartName).selectAll(".node");

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
                    .duration(300)
                    .call(xAxis);

                //y axis
                yAxisGroup
                    .transition()
                    .duration(300)
                    .call(yAxis);
            }



            function toggleLineGuide(lineGuideBool) {
                lineGuideToggle = lineGuideBool;
                createLineGuide(xLineVal, yLineVal, dataSeriesArray);
                //ADD TYPE IF THEN STATEMENT, if the type is scatter then we need to create the line guide, then opaque and unopaque the guide
                //if the type is not scatter then we just need to opaque and unopaque the guide

                var lineSelectX = svg.select(".lineguide.x").select("line");
                var lineSelectY = svg.select(".lineguide.y").select("line");

                if (lineGuideToggle === true) {
                    lineSelectX.transition().style("opacity", OPACITY_VALUE);
                    lineSelectY.transition().style("opacity", OPACITY_VALUE);
                } else {
                    lineSelectX.transition().style("opacity", 0);
                    lineSelectY.transition().style("opacity", 0);
                }
            }

            function createLineGuide(xLineVal, yLineVal) {
                svg.selectAll("g.lineguide.x").remove();
                svg.selectAll("g.lineguide.y").remove();


                //x line group for crosshair
                var lineGuideX = svg.append("g")
                    .attr("class", "lineguide x")
                    .append("line")
                    .style("stroke", "gray")
                    .style("stroke-dasharray", ("3, 3"))
                    .style("opacity", 0)
                    .style("fill", "black");

                //y line group for crosshair
                var lineGuideY = svg.append("g")
                    .attr("class", "lineguide y")
                    .append("line")
                    .style("stroke", "gray")
                    .style("stroke-dasharray", ("3, 3"))
                    .style("opacity", 0)
                    .style("fill", "black");

                //create crosshair based on median x (up/down) 'potentially' passed with data
                lineGuideX
                    .attr("x1", xScale(xLineVal))
                    .attr("y1", 0)
                    .attr("x2", xScale(xLineVal))
                    .attr("y2", scope.chartCtrl.container.height);
                // .attr("y2", yScale(d3.max(dataSeriesArray,function(value){
                //     return value.y;
                // })+1 ));

                //create crosshair based on median y (left/right) 'potentially' passed with data
                lineGuideY
                    .attr("x1", xScale(0))
                    .attr("y1", yScale(yLineVal))
                    .attr("x2", scope.chartCtrl.container.width)
                    // .attr("x2", xScale(d3.max(dataSeriesArray, function(value) {
                    //     return value.x;
                    // }) + 1))
                    .attr("y2", yScale(yLineVal));
            }

            function calculateAvg(dataSeriesArray, propKey) {
                return d3.mean(dataSeriesArray, function (value) {
                    return +value[propKey];
                });
            }

            function calculateMin(dataSeriesArray, propKey) {
                return d3.min(dataSeriesArray, function (value) {
                    return +value[propKey];
                });
            }

            function calculateMax(dataSeriesArray, propKey) {
                return d3.max(dataSeriesArray, function (value) {
                    return +value[propKey];
                });
            }

            scope.colorChange = function (colorParam) {
                uiCustomColors = '';
                colorsArray = colorParam;
                colorIndex = 0;
                update();
            };

            scope.customColors = function (customColors) {
                uiCustomColors = customColors;
                colorIndex = 0;
                update();
            };

            scope.updateAxis = function (xMin, xMax, yMin, yMax, original) {
                if (original === true) {
                    xAxisMin = originalAxis.xMin;
                    xAxisMax = originalAxis.xMax;
                    yAxisMin = originalAxis.yMin;
                    yAxisMax = originalAxis.yMax;
                    customAxis = false;
                } else {
                    //check if any of the params are undefined
                    //if they are assign them to the original min and max
                    if (!xMin || isNaN(parseFloat(xMin))) {
                        xMin = xAxisMin;
                    }
                    if (!xMax || isNaN(parseFloat(xMax))) {
                        xMax = xAxisMax;
                    }
                    if (!yMin || isNaN(parseFloat(yMin))) {
                        yMin = yAxisMin;
                    }
                    if (!yMax || isNaN(parseFloat(yMax))) {
                        yMax = yAxisMax;
                    }
                    xAxisMin = parseFloat(xMin);
                    xAxisMax = parseFloat(xMax);
                    yAxisMin = parseFloat(yMin);
                    yAxisMax = parseFloat(yMax);
                    customAxis = true;
                }

                toolData.customAxis = {};
                toolData.customAxis.xMin = xAxisMin;
                toolData.customAxis.yMin = yAxisMin;
                toolData.customAxis.xMax = xAxisMax;
                toolData.customAxis.yMax = yAxisMax;

                //no need to call the tooldata service here because tool data gets
                //assigned at the end of the update function
                update();
            };

            //cleaning up d3-tooltip
            scope.$on("$destroy", function () {
                d3.selectAll("#scatter-d3-tip").remove();
            });

            scope.colorLabels = ['aaa', 'aaa', 'bbb'];
        }

        function healthGridController($scope) {

            this.getColorLabels = function() {
                return $scope.colorLabels;
            };

            this.changeColorCustom = function (label, value) {
                $scope.changeColorCustom(label, value);
            };

            this.updateAxis = function (xMin, xMax, yMin, yMax, original) {
                $scope.updateAxis(xMin, xMax, yMin, yMax, original);
            };
        }
    }
})();