/* File created by mhemani */

(function () {
    "use strict";

    angular.module("app.directives.iatddheatmap", [])
        .directive("iatddheatmap", iatddheatmap);

    iatddheatmap.$inject = ["$filter", "$compile", "$timeout", "$rootScope", "utilityService",  "_", 'VIZ_COLORS'];

    function iatddheatmap($filter, $compile, $timeout, $rootScope, utilityService, _, VIZ_COLORS) {

        HeatMapLink.$inject = ["scope", "ele", "attrs", "controllers"];
        heatMapCtrl.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ["^chart", "?^iatddqueuing"],
            link: HeatMapLink,
            controller: heatMapCtrl
        };

        function HeatMapLink(scope, ele, attrs, controllers) {
            scope.chartController = controllers[0];
            scope.iatddQueuingController = controllers[1];
            scope.sensitivityValue = "10";
            scope.domainArray = [];
            scope.localData = {};

            var select2Flag = false,
                dataString = {
                    data: [],
                    dataTableAlign: {}
                },
                uriMapX = {},
                uriMapY = {},
                roundValueArray = [],
                decimalToKeep = 0,
                quantiles = true,
                transLvl,
                opaqueRows = [],
                opaqueColumns = [],
                heatMap,
                xAxis,
                yAxis,
                chartData = [],
                toolData;


            //vars used in update function
            var xAxisName,
                yAxisName,
                value,
                xAxisArray = [],
                yAxisArray = [],
                dataArray = [],
                valueArray = [],
                truncY = [],
                truncX = [],
                roundValueArrayDiff = 0,
                decimalToKeepFlag = true,
                bucketMapper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                bucketCount = 1,
                svg,
                margin,
                xAxisData,
                yAxisData,
                gridSize,
                width,
                height,
                legendElementWidth,
                legendElementHeight;

            //set colors
            //start at 10 green
            var colors =  VIZ_COLORS.COLOR_HEATMAP_GREEN,
            //start at green color bucket
                colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_GREEN.slice(0);

            //inserting id for div
            var html = '<div ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\" style="overflow:auto"><div id=' + scope.chartController.chart + '></div></div>';
            ele.append($compile(html)(scope));

            //set visualType
            scope.selectedURI = "";

            var heatmapListener = $rootScope.$on('iatddheatmap-receive', function (event, message, data) {
                if (message === 'iatddHeatmapUpdate') {
                    scope.updateHeatmap(data);
                }
                if (message === 'iatddPackageRefresh'){
                    scope.iatddQueuingController.drawPackages();
                }
            });

            //widget functions
            scope.chartController.dataProcessor = function (newData) {
                if (!_.isEmpty(newData)) {
                    //set the tableData properly, this is sent to the directive
                    scope.localData.data = JSON.parse(JSON.stringify(newData.data.charts[1].data));
                    scope.localData.headers = JSON.parse(JSON.stringify(newData.data.charts[1].headers));

                    dataString.data = JSON.parse(JSON.stringify(scope.localData.data));
                    dataString.dataTableAlign = JSON.parse(JSON.stringify(newData.data.charts[1].dataTableAlign));
                    toolData = newData.uiOptions;

                    update(dataString);
                }
            };

            scope.updateHeatmap = function (newData) {
                if (!_.isEmpty(newData)) {
                    //set the tableData properly, this is sent to the directive
                    scope.localData.data = JSON.parse(JSON.stringify(newData.data.charts[1].data));
                    scope.localData.headers = JSON.parse(JSON.stringify(newData.data.charts[1].headers));
                    dataString.data = JSON.parse(JSON.stringify(scope.localData.data));
                    dataString.dataTableAlign = JSON.parse(JSON.stringify(newData.data.charts[1].dataTableAlign));

                    update(dataString);
                }
            };

            function update(dataString) {
                var data = dataString.data;
                xAxisName = dataString.dataTableAlign.x;
                yAxisName = dataString.dataTableAlign.y;
                value = dataString.dataTableAlign.heat;
                xAxisArray = [];
                yAxisArray = [];
                dataArray = [];
                valueArray = [];
                truncY = [];
                truncX = [];
                roundValueArrayDiff = 0;
                decimalToKeepFlag = true;
                bucketMapper = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                bucketCount = 1;

                transLvl = 0.25;
                opaqueRows = [];
                opaqueColumns = [];

                scope.heatmapTableData = [];
                scope.heatmapTableColumns = [];
                scope.filter_dict = [];

                //Evaluating what places to round heatmap values to
                for (var key in data) {
                    roundValueArray.push(parseFloat(data[key][value]));
                }

                function SortLowToHigh(a, b) {
                    return a - b;
                }

                roundValueArray.sort(SortLowToHigh);
                var valueArrayDiff = roundValueArray[Math.floor(roundValueArray.length * 3 / 4)] - roundValueArray[Math.floor(roundValueArray.length / 4)];
                if (valueArrayDiff > 10) {
                    decimalToKeepFlag = false;
                } else {
                    valueArrayDiff = valueArrayDiff.toPrecision(2);
                    if (valueArrayDiff > 0) {
                        while (valueArrayDiff < 10) {
                            valueArrayDiff = valueArrayDiff * 10;
                            decimalToKeep++;
                        }
                    }
                }

                decimalToKeep = 0;

                //business as usual
                for (var key in data) {
                    xAxisArray.push($filter('shortenValueFilter')($filter('replaceUnderscores')(data[key][xAxisName])));
                    yAxisArray.push($filter('shortenValueFilter')($filter('replaceUnderscores')(data[key][yAxisName])));
                    var round = Math.round(data[key][value] * Math.pow(10, decimalToKeep)) / Math.pow(10, decimalToKeep);
                    //This array stores the values as numbers
                    valueArray.push(data[key][value]);
                    dataArray.push({
                        yAxis: data[key][yAxisName],
                        Value: round,
                        xAxis: data[key][xAxisName],
                        xAxisName: $filter('shortenValueFilter')($filter('replaceUnderscores')(data[key][xAxisName])),
                        yAxisName: $filter('shortenValueFilter')($filter('replaceUnderscores')(data[key][yAxisName]))
                    });
                }

                var uniqueX = _.uniq(xAxisArray);
                var uniqueY = _.uniq(yAxisArray);
                xAxisArray = uniqueX.sort();
                yAxisArray = uniqueY.sort();

                /* Assign each name a number and place matrix coordinates inside of dataArray */
                for (var i = 0; i < dataArray.length; i++) {
                    for (var j = 0; j < xAxisArray.length; j++) {
                        if (xAxisArray[j] === dataArray[i].xAxisName) {
                            uriMapX[j] = dataArray[i].xAxis;
                            dataArray[i].xAxis = j;
                        }
                    }
                    for (var j = 0; j < yAxisArray.length; j++) {
                        if (yAxisArray[j] === dataArray[i].yAxisName) {
                            uriMapY[j] = dataArray[i].yAxis;
                            dataArray[i].yAxis = j;
                        }
                    }
                }

                /* Truncates */
                for (i = 0; i < yAxisArray.length; i++) {
                    if (yAxisArray[i].length > 20) {
                        truncY.push(yAxisArray[i].substring(0, 50) + '...');
                    } else {
                        truncY.push(yAxisArray[i]);
                    }
                }

                for (i = 0; i < xAxisArray.length; i++) {
                    if (xAxisArray[i].length > 30) {
                        truncX.push(xAxisArray[i].substring(0, 30) + '...');
                    } else {
                        truncX.push(xAxisArray[i]);
                    }
                }

                margin = {
                    top: 200,
                    right: 150,
                    bottom: 150,
                    left: 250
                };
                xAxisData = xAxisArray;
                yAxisData = yAxisArray;
                gridSize = 22;

                width = xAxisData.length * gridSize;
                height = (yAxisData.length * gridSize);

                //color selection
                legendElementHeight = 30;
                legendElementWidth = 20;

                d3.select("#" + scope.chartController.chart).select("svg").remove();
                svg = d3.select("#" + scope.chartController.chart).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                var yAxisTitle = svg.selectAll(".yAxisTitle")
                    .data([yAxisName]);
                yAxisTitle
                    .enter().append("text");
                yAxisTitle
                    .attr("class", "yAxisTitle")
                    .attr("x", -21)
                    .attr("y", -5)
                    .attr("text-anchor", "end")
                    .text(function (d) {
                        return d;
                    });
                yAxisTitle
                    .exit().remove();

                yAxis = svg.selectAll(".yAxis")
                    .data(truncY)
                    .enter().append("text")
                    .text(function (d) {
                        return d;
                    })
                    .attr("x", 0)
                    .attr("y", function (d, i) {
                        return i * gridSize;
                    })
                    .style("text-anchor", "end")
                    .attr("transform", "translate(-6," + gridSize / 1.5 + ")")
                    .attr("class", "yAxis")
                    .on("click", function (d, i) {

                        var selectedUri = {
                            uri: uriMapY[i],
                            name: d,
                            axisName: yAxisName,
                            id: scope.chartController.uniqueId
                        };

                        scope.chartController.highlightSelectedItem([selectedUri]);
                        console.log(selectedUri);

                    });

                var xAxisTitle = svg.selectAll(".xAxisTitle")
                    .data([xAxisName]);
                xAxisTitle
                    .enter().append("text");
                xAxisTitle
                    .attr("class", "xAxisTitle")
                    .attr("x", 12)
                    .attr("y", 5)
                    .attr("transform", function (d, i) {
                        return "translate(" + -gridSize + ", -6)rotate(-45)";
                    })
                    .text(function (d) {
                        return d;
                    });
                xAxisTitle
                    .exit().remove();

                xAxis = svg.selectAll(".xAxis")
                    .data(truncX)
                    .enter().append("svg:g");
                xAxis.append("text")
                    .text(function (d) {
                        return d;
                    })
                    .style("text-anchor", "start")
                    .attr("x", 5)
                    .attr("y", 6)
                    .attr("class", "xAxis pointer-cursor")
                    .attr("transform", function (d, i) {
                        return "translate(" + i * gridSize + ", -6)rotate(-45)";
                    })
                    .on("click", function (d, i) {
                        var selectedUri = {
                            uri: uriMapX[i],
                            name: d,
                            axisName: xAxisName,
                            id: scope.chartController.uniqueId
                        };

                        scope.chartController.highlightSelectedItem([selectedUri]);
                    });

                var roundedValue = function (d) {
                    if (decimalToKeepFlag === true) {
                        return d.Value.toFixed(decimalToKeep);
                    } else {
                        return d.Value.toFixed(0);
                    }
                };

                /* Initialize tooltip */
                var tip = d3.tip()
                 .attr('class', 'd3-tip')
                 .attr("id", "heatmap-d3-tip")
                 .html(function (d) {
                 return "<div class='sm-font'> <span class='light'>" + value + ":</span> " + roundedValue(d) + "</div>" + "<div class='sm-font'><span class='light'>" + xAxisName + ":</span> " + d.xAxisName + "</div>" + "<div class='sm-font'> <span class='light'>" + yAxisName + ":</span> " + d.yAxisName + "</div>";
                 });

                //vertical lines
                var vLine = svg.selectAll(".vline").data(d3.range(xAxisData.length + 1)).enter()
                    .append("line")
                    .attr("x1", function (d) {
                        return d * gridSize;
                    })
                    .attr("x2", function (d) {
                        return d * gridSize;
                    })
                    .attr("y1", function (d) {
                        return 0;
                    })
                    .attr("y2", function (d) {
                        return height;
                    })
                    .style("stroke", "#eee");

                // horizontal lines
                var hLine = svg.selectAll(".hline").data(d3.range(yAxisData.length + 1)).enter()
                    .append("line")
                    .attr("y1", function (d) {
                        return d * gridSize;
                    })
                    .attr("y2", function (d) {
                        return d * gridSize;
                    })
                    .attr("x1", function (d) {
                        return 0;
                    })
                    .attr("x2", function (d) {
                        return width;
                    })
                    .style("stroke", "#eee");

                //setting table data

                setTableData(dataArray);

                scope.valueArray = dataArray;


                heatMap = svg.selectAll(".heat")
                    .data(dataArray)
                    .enter().append("rect")
                    .attr("x", function (d) {
                        return (d.xAxis) * gridSize;
                    })
                    .attr("y", function (d) {
                        return (d.yAxis) * gridSize;
                    })
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .attr("class", "heat")
                    .attr("width", gridSize)
                    .attr("height", gridSize)
                    .style("fill", colors[0])
                    .style("stroke", "#E6E6E6")
                    .style("stroke-width", 2)
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                    .on('dblclick', function (d) {
                        var selectedUri = {};
                        scope.clickedX = d.xAxisName;
                        scope.clickedY = d.yAxisName;
                        scope.xAxisURI = uriMapX[d.xAxis];
                        scope.yAxisURI = uriMapY[d.yAxis];
                        var uriData = [{
                            uri: scope.xAxisURI
                        }, {
                            uri: scope.yAxisURI
                        }];
                        var items = [];
                        //TODO this sets selected URI as x if both x AND y are URIs
                        /*if (String(scope.xAxisURI).indexOf('http://') > -1 && String(scope.yAxisURI).indexOf('http://') > -1) {
                         selectedUri = {
                         uri: scope.xAxisURI,
                         name: scope.clickedX,
                         axisName: xAxisName
                         };
                         } else */
                        if (String(scope.xAxisURI).indexOf('http://') > -1) {
                            items.push({
                                uri: scope.xAxisURI,
                                name: scope.clickedX,
                                axisName: xAxisName,
                                id: scope.chartController.uniqueId,
                                x: d.xAxis
                            });
                        }/* else */
                        if (String(scope.yAxisURI).indexOf('http://') > -1) {
                            items.push({
                                uri: scope.yAxisURI,
                                name: scope.clickedY,
                                axisName: yAxisName,
                                id: scope.chartController.uniqueId,
                                y: d.yAxis
                            });
                        }
                        scope.chartController.highlightSelectedItem(items);
                        console.log(items);
                    })
                    .on('click', function (d) {
                        resetSelections();
                        if (scope.chartController.data.layout === 'SystemSimilarity') {
                            $rootScope.$broadcast('heatmap.init-bar-chart', d);
                        }
                    });

                /* Invoke the tooltip in the context of your visualization */
                svg.call(tip);

                $timeout(function () {
                    initiateFilter();
                });

                d3.select("#min" + scope.chartController.containerClass).select("text").remove();
                d3.select("#min" + scope.chartController.containerClass).append("text")
                    .text("" + roundValueArray[0].toFixed(decimalToKeep))
                    .attr("x", 20)
                    .attr("y", 0);

                d3.select("#max" + scope.chartController.containerClass).select("text").remove();
                d3.select("#max" + scope.chartController.containerClass).append("text")
                    .text("" + roundValueArray[roundValueArray.length - 1].toFixed(decimalToKeep))
                    .attr("x", 20)
                    .attr("y", 0);

                d3.select("#sensMin" + scope.chartController.containerClass + " text").remove();
                d3.select("#sensMin" + scope.chartController.containerClass).append("text")
                    .text("1")
                    .attr("x", 20)
                    .attr("y", 0);

                d3.select("#sensMax" + scope.chartController.containerClass + " text").remove();
                d3.select("#sensMax" + scope.chartController.containerClass).append("text")
                    .text("5")
                    .attr("x", 20)
                    .attr("y", 0);

                if(toolData) {
                    if(toolData.hasOwnProperty('sensitivity')) {
                        scope.sensitivityValue = toolData.sensitivity;
                        scope.organizeColors();
                    }
                }
                scope.refreshColor(100);
                scope.refreshLegend(scope.sensitivityValue);
                bucketCount = bucketMapper[scope.sensitivityValue - 1];
            } //end of update function


            scope.refreshColor = function (transitionTime) {
                scope.organizeColors(scope.sensitivityValue);
                if (quantiles === true) {
                    scope.colorScale = d3.scale.quantile()
                        .domain(valueArray)
                        .range(colors);

                    heatMap
                        .transition()
                        .duration(transitionTime)
                        .style("fill", function (d) {
                            if (scope.domainArray.length === 0 || (d.Value >= scope.domainArray[0] && d.Value <= scope.domainArray[1])) {
                                return scope.colorScale(d.Value);
                            } else {
                                return "white";
                            }

                        });
                } else {
                    var quantizedArray = quantized(roundValueArray[0], roundValueArray[roundValueArray.length - 1]);
                    heatMap
                        .transition()
                        .duration(transitionTime)
                        .style("fill", function (d) {
                            if (scope.domainArray.length === 0 || (d.Value >= scope.domainArray[0] && d.Value <= scope.domainArray[1])) {
                                return getQuantizedColor(quantizedArray, d.Value);
                            } else {
                                return "white";
                            }
                        });
                }

                //copy the domain array by value
                toolData.domainArray = [];
                for(var i =0; i < scope.domainArray.length; i ++){
                    toolData.domainArray.push(scope.domainArray[i]);
                }
            };

            scope.refreshLegend = function () {
                var legend = svg.selectAll(".legend");
                var legendText = svg.selectAll(".legendText");
                if (quantiles === true) {
                    legend = svg.selectAll(".legend")
                        .data([0].concat(scope.colorScale.quantiles()));
                    legendText = svg.selectAll(".legendText")
                        .data([0].concat(scope.colorScale.quantiles()));
                } else {
                    var sValue = scope.sensitivityValue;
                    bucketCount = bucketMapper[sValue - 1];
                    legend = svg.selectAll(".legend")
                        .data(quantized(roundValueArray[0], roundValueArray[roundValueArray.length - 1]));
                    legendText = svg.selectAll(".legendText")
                        .data(quantized(roundValueArray[0], roundValueArray[roundValueArray.length - 1]));
                }
                legend.enter().append("rect");
                legend.attr("class", "legend")
                    .attr("x", function (d, i) {
                        return legendElementWidth * i;
                    })
                    .attr("y", yAxisData.length * gridSize + 40)
                    .attr("width", legendElementWidth)
                    .attr("height", 20);

                legend.exit().remove();
                legend.style("fill", function (d, i) {
                    return colors[i];
                });

                var roundedLegendValue = function (d) {
                    if (decimalToKeepFlag === true) {
                        return d.toFixed(decimalToKeep);
                    } else {
                        return d.toFixed(0);
                    }
                };
                legendText.enter().append("text");

                //determine whether to rotate text
                var straightText = false;
                var maxTextLength;
                if (xAxisData.length < 35) {
                    maxTextLength = 5;
                    if (xAxisData.length < 25) {
                        maxTextLength = 3;
                        if (xAxisData.length < 15) {
                            maxTextLength = 2;
                        }
                    }
                } else {
                    maxTextLength = 9;
                }
                legendText.attr("class", "mono legendText")
                    .text(function (d) {
                        var text = "" + roundedLegendValue(d);
                        if(text.length > maxTextLength){
                            straightText = true;
                        }
                        return text;
                    });

                if(straightText){
                    var yHeight = yAxisData.length * gridSize + 75;
                    legendText.style("text-anchor", "start")
                        .attr("class", "xAxis")
                        .attr("transform", function (d, i) {
                            return "translate(" + i * legendElementWidth + ", "+yHeight+")rotate(45)";
                        });
                } else {
                    legendText.attr("x", function (d, i) {
                            return legendElementWidth * i;
                        })
                        .attr("y", yAxisData.length * gridSize + 75);

                }
                legendText.exit().remove();
                legendText.style("fill", "black");
            };

            scope.organizeColors = function () {
                var sValue = scope.sensitivityValue;
                bucketCount = bucketMapper[sValue - 1];
                var newColors = [];
                for (var i = 0; i < bucketCount; i++) {
                    if (i >= bucketCount / 2) {
                        newColors[i] = colorSelectedBucket[Math.round((i + 1) / bucketCount * 20) - 1];
                    } else {
                        newColors[i] = colorSelectedBucket[Math.round((i) / bucketCount * 20)];
                    }
                }
                colors = newColors.slice(0);
                toolData.sensitivity = sValue;
                toolData.colors = colorSelectedBucket;
            };

            scope.changeColor = function (selectedColor) {
                colorSelectedBucket.length = 0;
                if (selectedColor === 'Red') {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_RED.slice(0);
                } else if (selectedColor === 'Blue') {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_BLUE.slice(0);
                } else if (selectedColor === 'Traffic') {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_TRAFFIC.slice(0);
                } else {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_GREEN.slice(0);
                }
                scope.organizeColors();
                scope.refreshColor(500);
                scope.refreshLegend();
            };


            scope.chartController.highlightSelectedItem = function (selectedItem) {
                scope.iatddQueuingController.togglePackage(selectedItem[0]);
            };

            scope.chartController.filterAction = function (d, i, axis) {
                if (axis === 'x') {
                    scope.chartController.filterOptions[dataString.dataTableAlign.x].tempSelected = _.without(scope.chartController.filterOptions[dataString.dataTableAlign.x].tempSelected, uriMapX[i]);
                } else {
                    scope.chartController.filterOptions[dataString.dataTableAlign.y].tempSelected = _.without(scope.chartController.filterOptions[dataString.dataTableAlign.y].tempSelected, uriMapY[i]);
                }
                scope.chartController.applyFilter();
            };

            scope.chartController.resizeViz = function () {
                //Need To Add Resize Mechanism
            };

            //Send colorscale to the tools for the Sys Dup bar chart
            //TODO: remove the scope.watch
            scope.$watch('colorScale', function () {
                scope.chartController.colorScale = scope.colorScale;
            });

            function quantized(min, max) {
                var sectionValue = (max - min) / bucketCount;
                var quantizedArray = [];
                for (var i = 0; i < bucketCount; i++) {
                    quantizedArray[i] = min + i * sectionValue;
                }
                return quantizedArray;
            }

            function getQuantizedColor(quantizedArray, value) {
                for (var i = 1; i < quantizedArray.length; i++) {
                    if (value < quantizedArray[i]) {
                        return colors[i - 1];
                    }
                }
                return colors[quantizedArray.length - 1];
            }

            function setTableData(tableData) {
                var heatmapColumns = [{
                        title: xAxisName,
                        field: 'xAxisName',
                        alignRight: false
                    }, {
                        title: yAxisName,
                        field: 'yAxisName',
                        alignRight: false
                    }, {
                        title: 'Heat Value',
                        field: 'Value',
                        alignRight: true
                    }],
                    filterObject = {};
                filterObject['xAxisName'] = "";
                filterObject['yAxisName'] = "";
                filterObject['Value'] = "";
                scope.heatmapTableData = tableData;
                scope.heatmapTableColumns = heatmapColumns;
                scope.filter_dict = filterObject;
            }


            function highlightRow(dataIdx) {
                if (!_.includes(opaqueRows, dataIdx)) {
                    opaqueRows.push(dataIdx);
                } else {
                    for (var i = 0; i < opaqueRows.length; i++) {
                        if (opaqueRows[i] === dataIdx) {
                            opaqueRows.splice(i, 1);
                        }
                    }
                }
                yAxis.style("fill-opacity", function (d, i) {
                    if (opaqueRows.length === 0) {
                        return 1.0;
                    } else if (_.includes(opaqueRows, i)) {
                        return 1.0;
                    } else {
                        return 0.1;
                    }
                });
                refreshOpaqueColors();
            }

            function highlightColumn(dataIdx) {
                if (!_.includes(opaqueColumns, dataIdx)) {
                    opaqueColumns.push(dataIdx);
                } else {
                    for (var i = 0; i < opaqueColumns.length; i++) {
                        if (opaqueColumns[i] === dataIdx) {
                            opaqueColumns.splice(i, 1);
                        }
                    }
                }
                xAxis.style("fill-opacity", function (d, i) {
                    if (opaqueColumns.length === 0) {
                        return 1.0;
                    } else if (_.includes(opaqueColumns, i)) {
                        return 1.0;
                    } else {
                        return 0.1;
                    }
                });
                refreshOpaqueColors();
            }

            function refreshOpaqueColors() {
                heatMap.style("stroke", "#E6E6E6");
                heatMap.transition()
                    .duration(0)
                    .style("fill-opacity", function (d) {
                        if (opaqueRows.length === 0 && opaqueColumns.length === 0) {
                            return 1.0;
                        } else if (highlightNeeded(d)) {
                            return 1.0;
                        } else {
                            //if statements are used to change the opacity depending on the size of the value
                            //this fixes a bug where the svg's stack on top of each other and the opacity of .1
                            //becomes fully visible
                            if(d.Value < 10){
                                return 0.1;
                            }
                            if(d.Value < 25){
                                return 0.07;
                            }
                            if(d.Value < 50){
                                return 0.02;
                            }
                            if(d.Value < 100){
                                return 0.01;
                            }
                            return 0.006;
                        }
                    })
                    .style("stroke", function (d) {
                        if (opaqueRows.length === 0 && opaqueColumns.length === 0) {
                            return "#E6E6E6";
                        } else if (highlightNeeded(d)) {
                            return "black";
                        } else {
                            return "transparent";
                        }
                    });
            }

            function highlightNeeded(dataPoint){
                if (opaqueColumns.length === 0) {
                    return _.includes(opaqueRows, dataPoint.yAxis);
                } else if (opaqueRows.length === 0) {
                    return _.includes(opaqueColumns, dataPoint.xAxis);
                } else {
                    return _.includes(opaqueRows, dataPoint.yAxis) && _.includes(opaqueColumns, dataPoint.xAxis);
                }
            }

            function resetSelections() {
                opaqueRows.length = 0;
                opaqueColumns.length = 0;
                yAxis.style("fill-opacity", 1.0);
                xAxis.style("fill-opacity", 1.0);
                heatMap.style("stroke", "#E6E6E6");
                heatMap.transition()
                    .duration(250)
                    .style("fill-opacity", function (d) {
                        if (opaqueRows.length === 0 && opaqueColumns.length === 0) {
                            return 1.0;
                        }
                    });
            }

            function initiateFilter() {
            }

            //filter quantiles
            scope.toggleQuantile = function () {
                if (quantiles === true) {
                    jQuery('#quantile' + scope.chartController.containerClass).html('Filter Quantize');
                } else {
                    jQuery('#quantile' + scope.chartController.containerClass).html('Filter Quantile');
                }

                quantiles = !quantiles;
                toolData.quantiles = quantiles;
                scope.refreshColor(100);
                scope.refreshLegend(scope.sensitivityValue);
            };

            scope.getContextInsights = function () {
                var uriData = [{
                    uri: scope.selectedURI
                }];
                $rootScope.$broadcast('uri-selected', uriData);

                scope.selectedURI = "";
            };

            /* function that changes the value of a package from true to false if unchecked and vice versa
             function then calls drawPackages to visualize that change
             function also calls checkFormValues which allows for disabling and enabling of the buttons */
            scope.iatddQueuingController.togglePackage = function (selectedPackage) {
                scope.iatddQueuingController.variableFormValues.packages[selectedPackage.uri] = !scope.iatddQueuingController.variableFormValues.packages[selectedPackage.uri];
                scope.iatddQueuingController.drawPackages();
                scope.iatddQueuingController.checkFormValues();
            };

            /* function that takes in values from the iatddQueuingController about whether a product is checked or not
             and unhighlights or highlights columns to represent checked and unchecked */
            scope.iatddQueuingController.drawPackages = function () {
                var highlight = [];
                var highlightAxis = [];
                for (var i in scope.iatddQueuingController.variableFormValues.packages) {
                    if (scope.iatddQueuingController.variableFormValues.packages[i]) {
                        highlight.push($filter('shortenValueFilter')($filter('replaceUnderscores')(i)));
                        highlightAxis.push(i);
                    }
                }
                xAxis.style("fill-opacity", function (d, i) {
                    if (highlightAxis.length === 0) {
                        return .2
                    }
                    else if (_.includes(highlightAxis, uriMapX[i])) {
                        return 1
                    }
                    else {
                        return .2
                    }
                });

                heatMap.style("fill-opacity", function (d) {
                    if (highlight.length === 0) {
                        return .2
                    }
                    else if (_.includes(highlight, d.xAxisName)) {
                        return 1
                    }
                    else {
                        return .2
                    }
                });
            };

            //when directive ends, make sure to clean out all $on watchers
            scope.$on('$destroy', function heatMapDestroyer() {
                //cleaning up d3-tooltip
                heatmaptListener();
                d3.selectAll("#heatmap-d3-tip").remove();
                console.log("heatmap destroy");
            });

        }

        function heatMapCtrl($scope) {
            this.changeColor = function (selectedColor) {
                $scope.changeColor(selectedColor);
            };

            this.toggleQuantile = function () {
                $scope.toggleQuantile();
            };

            this.updateSensitivity = function (sensitivityValue) {
                $scope.sensitivityValue = sensitivityValue;
                $scope.organizeColors();
                $scope.refreshColor(0);
            };

            this.updateValue = function (value) {
                $scope.domainArray = value;
                $scope.refreshColor(0);
            };

            this.updateHeatmap = function (newData) {
                $scope.updateHeatmap(newData);
            }
        }
    }

})();
