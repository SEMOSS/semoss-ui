(function () {
    "use strict";

    angular.module("app.heatmap.directive", [])
        .directive("heatmap", heatmap);

    heatmap.$inject = ["$filter", "$compile", "$timeout", "$rootScope", "utilityService", "_", 'VIZ_COLORS', 'tapService'];

    function heatmap($filter, $compile, $timeout, $rootScope, utilityService, _, VIZ_COLORS, tapService) {

        HeatMapLink.$inject = ["scope", "ele", "attrs", "controllers"];
        heatMapCtrl.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ["^chart"],
            link: HeatMapLink,
            controller: heatMapCtrl
        };

        function HeatMapLink(scope, ele, attrs, controllers) {
            scope.chartCtrl = controllers[0];
            scope.sensitivityValue = 10;
            scope.domainArray = [];
            scope.localData = {};
            scope.filterMin = 0;
            scope.FilterMax = 0;

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
                legendContainer,
                margin,
                xAxisData,
                yAxisData,
                gridSize,
                width,
                height,
                legendElementWidth,
                legendElementHeight;

            //set colors
            //start at 10 red
            var colors = VIZ_COLORS.COLOR_HEATMAP_RED,
            //start at red color bucket
                colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_RED.slice(0);

            //inserting id for div
            var html = '<div class = "append-viz" ng-class=\"{\'viz-hide\': chartCtrl.isTableShown, \'viz-show\': !chartCtrl.isTableShown}\" style="overflow:auto"><div id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            //set visualType
            scope.selectedURI = "";

            //widget functions
            scope.chartCtrl.dataProcessor = function (newData) {
                if (!_.isEmpty(newData)) {

                    //set the tableData properly, this is sent to the directive
                    scope.localData.data = JSON.parse(JSON.stringify(newData.data));
                    scope.localData.headers = JSON.parse(JSON.stringify(newData.headers));

                    dataString.data = JSON.parse(JSON.stringify(scope.localData.data));
                    dataString.dataTableAlign = JSON.parse(JSON.stringify(newData.dataTableAlign));
                    //set tooldata
                    toolData = newData.uiOptions;

                    if (toolData) {
                        if (toolData.hasOwnProperty('quantiles')) {
                            quantiles = toolData.quantiles;
                        } else {
                            quantiles = true;
                        }
                        if (toolData.hasOwnProperty('color')) {
                            //Set colors = array of t
                            //colors = toolData.color;
                        }
                        if (toolData.hasOwnProperty('domainArray')) {
                            scope.domainArray = toolData.domainArray;
                        }
                        if (toolData.hasOwnProperty('colors')) {
                            colorSelectedBucket = [];
                            for (var c in toolData.colors) {
                                colorSelectedBucket.push(toolData.colors[c]);
                            }
                        }
                        if (toolData.hasOwnProperty('buckets')) {
                            scope.sensitivityValue = toolData.buckets;
                        }
                    } else {
                        toolData = {};
                    }

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
                    //roundValueArray.push(data[key][value]);
                }

                function SortLowToHigh(a, b) {
                    return a - b;
                }

                decimalToKeep = 0;
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
                        truncY.push(yAxisArray[i].substring(0, 20) + '...');
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
                    top: 20,
                    right: 350,
                    bottom: 350,
                    left: 15
                };
                xAxisData = xAxisArray;
                yAxisData = yAxisArray;
                gridSize = 22;

                width = xAxisData.length * gridSize;
                height = (yAxisData.length * gridSize);

                //color selection
                legendElementHeight = 30;
                legendElementWidth = 20;

                d3.select(ele[0]).select("#" + scope.chartCtrl.chartName).select("svg").remove();
                svg = d3.select("#" + scope.chartCtrl.chartName).append("svg")
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + (margin.left) + "," + margin.top + ")");

                var svgContainer = svg.append("g").attr("transform", "translate(250,150)");
                var legendContainer = svg.append("g").attr("transform", "translate(0,150)");

                var yAxisTitle = svgContainer.selectAll(".yAxisTitle")
                    .data([yAxisName]);
                yAxisTitle
                    .enter().append("text");
                yAxisTitle
                    .attr("class", "yAxisTitle bold")
                    .attr("x", -21)
                    .attr("y", -5)
                    .attr("text-anchor", "end")
                    .text(function (d) {
                        return d;
                    });
                yAxisTitle
                    .exit().remove();

                yAxis = svgContainer.selectAll(".yAxis")
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
                    .attr("class", "yAxis pointer")
                    .on("click", function (d, i) {
                        //TODO: isDataBound check??
                        var selectedUri = {
                            uri: uriMapY[i],
                            name: d,
                            axisName: yAxisName
                        };

                        if (scope.chartCtrl.data.layout === "SystemSimilarity") {
                            selectedUri.uri = "http://health.mil/ontologies/Concept/System/" + uriMapY[i].replace(/ /g, '_');
                        }

                        scope.chartCtrl.highlightSelectedItem([selectedUri]);
                    });

                var xAxisTitle = svgContainer.selectAll(".xAxisTitle")
                    .data([xAxisName]);
                xAxisTitle
                    .enter().append("text");
                xAxisTitle
                    .attr("class", "xAxisTitle bold")
                    .attr("x", 6)
                    .attr("y", 9)
                    .attr("transform", function (d, i) {
                        return "translate(" + -gridSize + ", -6)rotate(-45)";
                    })
                    .text(function (d) {
                        return d;
                    });
                xAxisTitle
                    .exit().remove();

                xAxis = svgContainer.selectAll(".xAxis")
                    .data(truncX)
                    .enter().append("svg:g");
                xAxis.append("text")
                    .text(function (d) {
                        return d;
                    })
                    .style("text-anchor", "start")
                    .attr("x", 6)
                    .attr("y", 7)
                    .attr("class", "xAxis pointer")
                    .attr("transform", function (d, i) {
                        return "translate(" + i * gridSize + ", -6)rotate(-45)";
                    })
                    .on("click", function (d, i) {
                        //TODO: isDataBound check??
                        var selectedUri = {
                            uri: uriMapX[i],
                            name: d,
                            axisName: xAxisName
                        };

                        if (scope.chartCtrl.data.layout === "SystemSimilarity") {
                            selectedUri.uri = "http://health.mil/ontologies/Concept/System/" + uriMapX[i].replace(/ /g, '_');
                        }

                        scope.chartCtrl.highlightSelectedItem([selectedUri]);
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
                        return "<div> <span class='light'>" + value + ":</span> " + roundedValue(d) + "</div>" + "<div><span class='light'>" +
                            xAxisName + ":</span> " + d.xAxisName + "</div>" + "<div> <span class='light'>" + yAxisName + ":</span> " + d.yAxisName + "</div>";
                    });

                //vertical lines
                var vLine = svgContainer.selectAll(".vline").data(d3.range(xAxisData.length + 1)).enter()
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
                var hLine = svgContainer.selectAll(".hline").data(d3.range(yAxisData.length + 1)).enter()
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

                heatMap = svgContainer.selectAll(".heat")
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
                        if (scope.chartCtrl.data.layout === "SystemSimilarity") {
                            items.push({
                                uri: "http://health.mil/ontologies/Concept/System/" + scope.xAxisURI.replace(/ /g, '_'),
                                axisName: xAxisName,
                                x: d.xAxis
                            }, {
                                uri: "http://health.mil/ontologies/Concept/System/" + scope.yAxisURI.replace(/ /g, '_'),
                                axisName: yAxisName,
                                y: d.yAxis
                            });
                        } else {
                            // if (String(scope.xAxisURI).indexOf('http://') > -1) {
                            if (String(scope.xAxisURI)) {
                                items.push({
                                    uri: scope.xAxisURI,
                                    name: scope.clickedX,
                                    axisName: xAxisName,
                                    x: d.xAxis
                                });
                            }
                            /* else */
                            // if (String(scope.yAxisURI).indexOf('http://') > -1) {
                            if (String(scope.yAxisURI)) {
                                items.push({
                                    uri: scope.yAxisURI,
                                    name: scope.clickedY,
                                    axisName: yAxisName,
                                    y: d.yAxis
                                });
                            }
                        }
                        scope.chartCtrl.highlightSelectedItem(items);
                    })
                    .on('click', function (d) {
                        resetSelections();
                        if (scope.chartCtrl.data.layout === 'SystemSimilarity') {
                            $rootScope.$broadcast('heatmap.init-bar-chart', d);
                        }
                    });

                /* Invoke the tooltip in the context of your visualization */
                svgContainer.call(tip);

                $timeout(function () {
                    initiateFilter();
                });

                d3.select("#min" + scope.chartCtrl.containerClass).select("text").remove();
                d3.select("#min" + scope.chartCtrl.containerClass).append("text")
                    .text("" + roundValueArray[0].toFixed(decimalToKeep))
                    .attr("x", 20)
                    .attr("y", 0);

                d3.select("#max" + scope.chartCtrl.containerClass).select("text").remove();
                d3.select("#max" + scope.chartCtrl.containerClass).append("text")
                    .text("" + roundValueArray[roundValueArray.length - 1].toFixed(decimalToKeep))
                    .attr("x", 20)
                    .attr("y", 0);

                d3.select("#sensMin" + scope.chartCtrl.containerClass + " text").remove();
                d3.select("#sensMin" + scope.chartCtrl.containerClass).append("text")
                    .text("1")
                    .attr("x", 20)
                    .attr("y", 0);

                d3.select("#sensMax" + scope.chartCtrl.containerClass + " text").remove();
                d3.select("#sensMax" + scope.chartCtrl.containerClass).append("text")
                    .text("5")
                    .attr("x", 20)
                    .attr("y", 0);

                if (toolData) {
                    if (toolData.hasOwnProperty('sensitivity')) {
                        scope.sensitivityValue = toolData.sensitivity;
                        scope.organizeColors();
                    }

                }
                scope.refreshColor(100);
                scope.refreshLegend(scope.sensitivityValue);
                bucketCount = bucketMapper[scope.sensitivityValue - 1];
                //save tool data
                //toolDataService.setToolData(toolData, scope.localData.insightID);
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
                            if (scope.domainArray.length == 0 || (d.Value >= scope.domainArray[0] && d.Value <= scope.domainArray[1])) {
                                return getQuantizedColor(quantizedArray, d.Value);
                            }
                            else {
                                return "white";
                            }
                        });
                    //    if (scope.domainArray.length === 0 || (d.Value >= scope.domainArray[0] && d.Value <= scope.domainArray[1])) {
                    //copy the domain array by value
                    toolData.domainArray = [];
                    for (var i = 0; i < scope.domainArray.length; i++) {
                        toolData.domainArray.push(scope.domainArray[i]);
                    }
                    //toolDataService.setToolData(toolData, scope.localData.insightID);
                }
                if (scope.chartCtrl.data.layout === "SystemSimilarity") {
                    //Send colorscale to the tools for the SystemSimilarity bar chart
                    tapService.setSysDupColorScale(scope.colorScale);
                }
            };

            scope.refreshLegend = function (sensitivityValue) {
                //svg.select(".legendXAxis").remove();
                //svg.select("legend").remove();
                var legendTranslation = {x: 0, y: 15};

                var legend = svg.selectAll(".legend");
                var legendText = svg.selectAll(".legendText");
                if (quantiles === true) {
                    legend = svg.selectAll(".legend")
                        .data([0].concat(scope.colorScale.quantiles()));
                    legendText = svg.selectAll(".legendText")
                        .data([0].concat(scope.colorScale.quantiles()));
                }
                else {
                    bucketCount = bucketMapper[sensitivityValue - 1];
                    legend = svg.selectAll(".legend")
                        .data(quantized(roundValueArray[0], roundValueArray[roundValueArray.length - 1]));
                    legendText = svg.selectAll(".legendText")
                        .data(quantized(roundValueArray[0], roundValueArray[roundValueArray.length - 1]));
                }
                //Legend Text should start at lowest number in set
                legend.enter().append("rect");
                legend.attr("class", "legend")
                    .attr("x", 3)
                    .attr("y", function (d, i) {
                        return (gridSize) * i * 1.5;
                    })
                    .attr("width", legendElementWidth)
                    .attr("height", legendElementHeight)
                    .attr("transform", "translate(" + legendTranslation.x + "," + (legendTranslation.y - 5) + ")");

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
                legendText.attr("class", "legendText")
                    .attr("transform", "translate(" + legendTranslation.x + "," + legendTranslation.y + ")")
                    .text(function (d) {
                        var text = " " + roundedLegendValue(d);
                        if (text.length > maxTextLength) {
                            straightText = true;
                        }
                        return text;
                    });

                //if(!straightText){
                //    var yHeight = yAxisData.length * gridSize + 75;
                //    legendText.style("text-anchor", "start")
                //        .attr("class", "legendXAxis")
                //        .attr("transform", function (d, i) {
                //            return "translate(" + i * legendElementWidth + ", "+yHeight+")rotate(45)";
                //        });
                //}
                // else {
                legendText.attr("x", legendElementWidth + 5)
                    .attr("y", function (d, i) {
                        return (legendElementHeight * i) * 1.1;
                    });

                //}
                legendText.exit().remove();
                legendText.style("fill", "black");
            };

            scope.organizeColors = function (sensitivityValue) {
                //if(quantiles===true)
                //{
                //    var sValue = sensitivityValue;
                //    bucketCount = sensitivityValue;
                //    var newColors = [];
                //    for (var i = 0; i < bucketCount; i++) {
                //        if (i >= bucketCount / 2) {
                //            newColors[i] = colorSelectedBucket[Math.round((i + 1) / bucketCount * 20) - 1];
                //        } else {
                //            newColors[i] = colorSelectedBucket[Math.round((i) / bucketCount * 20)];
                //        }
                //    }
                //    colors = newColors.slice(0); //todo fix colors
                //    toolData.sensitivity = sValue;
                //    toolData.colors = colorSelectedBucket;
                //}
                //else
                //{
                var sValue = sensitivityValue;
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
                //    toolData.colors = colorSelectedBucket;
                //}
                //toolDataService.setToolData(toolData, scope.localData.insightID);
            };

            scope.colorChange = function (selectedColor) {
                colors = selectedColor;
                colorSelectedBucket.length = 0;
                if (selectedColor === 'Green') {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_GREEN.slice(0);
                } else if (selectedColor === 'Blue') {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_BLUE.slice(0);
                } else if (selectedColor === 'Traffic') {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_TRAFFIC.slice(0);
                } else {
                    colorSelectedBucket = VIZ_COLORS.COLOR_HEATMAP_RED.slice(0);
                }
                scope.organizeColors(scope.sensitivityValue);
                scope.refreshColor(500);
                scope.refreshLegend(scope.sensitivityValue);
            };

            scope.getColors = function (selectedColor) {
                //something
            };

            scope.updateSensitivity = function (sensitivityValue) {
                scope.sensitivityValue = sensitivityValue;
                scope.refreshColor(0);
                scope.organizeColors(scope.sensitivityValue);
                scope.refreshLegend(scope.sensitivityValue);

            };

            scope.updateValue = function (value) {
                scope.domainArray = value;
                scope.organizeColors(scope.sensitivityValue);
                scope.refreshColor(100);
                scope.refreshLegend(scope.sensitivityValue);
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                if (_.isArray(selectedItem)) {
                    if (selectedItem.length === 1 && !_.isEmpty(selectedItem[0].uri)) {
                        //resetSelections();
                        var uriX = _.findKey(uriMapX, function (k) {
                                return $filter("shortenAndReplaceUnderscores")(k) === $filter("shortenAndReplaceUnderscores")(selectedItem[0].uri);
                            }) || -1;

                        var uriY = _.findKey(uriMapY, function (k) {
                                return $filter("shortenAndReplaceUnderscores")(k) === $filter("shortenAndReplaceUnderscores")(selectedItem[0].uri);
                            }) || -1;

                        if (+uriX > -1 && +uriY > -1) {
                            if (selectedItem[0].axisName === xAxisName) {
                                highlightColumn(+uriX);
                            } else if (selectedItem[0].axisName === yAxisName) {
                                highlightRow(+uriY);
                            }
                        } else {
                            if (+uriX > -1) {
                                highlightColumn(+uriX);
                            }
                            if (+uriY > -1) {
                                highlightRow(+uriY);
                            }
                        }
                    } else {
                        highlightRow(selectedItem[1].y);
                        highlightColumn(selectedItem[0].x);
                    }
                } else {
                    if (!_.isEmpty(selectedItem.uri)) {
                        //resetSelections();
                        var uriX = _.findKey(uriMapX, function (k) {
                                return $filter("shortenAndReplaceUnderscores")(k) === $filter("shortenAndReplaceUnderscores")(selectedItem.uri);
                            }) || -1;

                        var uriY = _.findKey(uriMapY, function (k) {
                                return $filter("shortenAndReplaceUnderscores")(k) === $filter("shortenAndReplaceUnderscores")(selectedItem.uri);
                            }) || -1;

                        if (+uriX > -1 && +uriY > -1) {
                            if (selectedItem.axisName === xAxisName) {
                                highlightColumn(+uriX);
                            } else if (selectedItem.axisName === yAxisName) {
                                highlightRow(+uriY);
                            }
                        } else {
                            if (+uriX > -1) {
                                highlightColumn(+uriX);
                            }
                            if (+uriY > -1) {
                                highlightRow(+uriY);
                            }
                        }
                    }
                }
            };

            scope.chartCtrl.filterAction = function (d, i, axis) {
                if (axis === 'x') {
                    scope.chartCtrl.filterOptions[dataString.dataTableAlign.x].tempSelected = _.without(scope.chartCtrl.filterOptions[dataString.dataTableAlign.x].tempSelected, uriMapX[i]);
                } else {
                    scope.chartCtrl.filterOptions[dataString.dataTableAlign.y].tempSelected = _.without(scope.chartCtrl.filterOptions[dataString.dataTableAlign.y].tempSelected, uriMapY[i]);
                }
                scope.chartCtrl.applyFilter();
            };

            scope.chartCtrl.resizeViz = function () {
                //Need To Add Resize Mechanism
            };

            function quantized(min, max) {
                bucketCount = scope.sensitivityValue;
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
                            if (d.Value < 10) {
                                return 0.1;
                            }
                            if (d.Value < 25) {
                                return 0.07;
                            }
                            if (d.Value < 50) {
                                return 0.02;
                            }
                            if (d.Value < 100) {
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

            function highlightNeeded(dataPoint) {
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
                scope.chartCtrl.toolData = {};
                //select2Flag used so that the select2 dropdown is not recreated, this isn't ideal but will have to do for now
                //if (select2Flag === false) {
                //    jQuery("select.color-selector" + scope.chartCtrl.containerClass).select2();
                //    select2Flag = true;
                //}
                //
                //if (roundValueArray[0] === roundValueArray[roundValueArray.length - 1]) {
                //    jQuery(".slider" + scope.chartCtrl.containerClass + "#slider").slider('disable');
                //    d3.select('#dataslider')
                //        .style('opacity', 0.5);
                //}
                //if (roundValueArray[0] !== roundValueArray[roundValueArray.length - 1]) {
                //    d3.select('#dataslider')
                //        .style('opacity', 1);
                //}
                scope.chartCtrl.toolData.dataSliderInfo = {
                    min: roundValueArray[0],
                    max: roundValueArray[roundValueArray.length - 1],
                    step: Math.pow(10, -1 * decimalToKeep),
                    formater: function (value) {
                        return value.toFixed(decimalToKeep);
                    }
                };
                $rootScope.$broadcast('heatmap.heatmapToolData');
            }

            //filter quantiles
            scope.toggleQuantile = function () {
                if (quantiles === true) {
                    jQuery('#quantile' + scope.chartCtrl.containerClass).html('Filter Quantile');
                } else {
                    jQuery('#quantile' + scope.chartCtrl.containerClass).html('Filter Quantize');
                }
                quantiles = !quantiles;
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

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                scope[toolUpdateConfig.fn](toolUpdateConfig.args);

            };

            //refresh data for sysDup
            scope.updateHeatmap = function (newData) {
                dataString.data = newData.data;
                var order = [scope.chartCtrl.data.dataTableAlign.x, scope.chartCtrl.data.dataTableAlign.y, scope.chartCtrl.data.dataTableAlign.heat];
                scope.localData = utilityService.formatTableData(order, dataString.data, true);
                scope.localData["dataTableAlign"] = scope.chartCtrl.data.dataTableAlign;
                update(scope.localData);
            };

            //when directive ends, make sure to clean out all $on watchers
            scope.$on('$destroy', function heatMapDestroyer() {
                //cleaning up d3-tooltip
                d3.selectAll("#heatmap-d3-tip").remove();
                console.log("heatmap destroy");
            });
        }

        function heatMapCtrl($scope) {
            this.updateHeatmap = function (newData) {
                $scope.updateHeatmap(newData);
            }
        }
    }

})();
