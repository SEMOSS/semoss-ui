(function () {
    "use strict";

    angular.module("app.directives.ousdmaster.timelinechart", [])
        .directive("timelinechart", timelinechart);

    timelinechart.$inject = ["_", "$compile", "$filter", "utilityService"];

    function timelinechart(_, $compile, $filter, utilityService) {

        timelineChartLink.$inject = ["scope", "ele", "attrs", "controllers"];
        timelineController.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            link: timelineChartLink,
            controller: timelineController
        };

        function timelineChartLink(scope, ele, attrs, controllers) {
            //initialize and declare scope variables
            scope.chartController = controllers[0];

            var dirtyData, localChartData, localChartDataTableAlign, localChartDataTypes, localChartDataTypesCount, localChartDataTimeGroupings, painted, paintedTypes, paintedTypesCount, paintedTimeGroupings;

            var axis, viz, box, boxWidth, w, h, dateFormat, dateTicks, timeScale, globalStartTime, globalStartTimeValues, globalEndTime, globalEndTimeValues, colorScale, barHeight = 20, gap = 4, axisHeight = 25, boxHeight = 90, labelPadding = 150, rectPadding = 35;

            //inserting div to allow c3 to bind
            var html = '<div class="append-viz" id=' + scope.chartController.chartName + "-append-viz" + ' ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\"><div id=' + scope.chartController.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            //widget variables
            scope.chartController.margin = {
                top: 20,
                right: 40,
                bottom: 20,
                left: 40
            };

            scope.chartController.SHOW_SOCIAL_SHARING = false;
            //Widget Functions
            scope.chartController.dataProcessor = function () {
                if (!_.isEmpty(scope.chartController.data.data)) {

                    var formattedData = utilityService.formatTableData(scope.chartController.data.headers, scope.chartController.data.data, true);
                    angular.extend(scope.chartController.data, formattedData);

                    dirtyData = scope.chartController.data.data;
                    dirtyData = _.groupBy(dirtyData, 'Decommissioned System');

                    var semiDirtyData = {};
                    for (var i in dirtyData) {
                        semiDirtyData[i] = {
                            "Decommissioned System": i,
                            "Start Transition Year": 0,
                            "End Transition Year": 0,
                            "targets": []
                        };

                        for (var j in dirtyData[i]) {
                            if (dirtyData[i][j]['Start Transition Year'] < semiDirtyData[i]['Start Transition Year'] || (semiDirtyData[i]['Start Transition Year'] === 0)) {
                                semiDirtyData[i]['Start Transition Year'] = dirtyData[i][j]['Start Transition Year'];
                            }

                            if (dirtyData[i][j]['End Transition Year'] > semiDirtyData[i]['End Transition Year'] || (semiDirtyData[i]['End Transition Year'] === 0)) {
                                semiDirtyData[i]['End Transition Year'] = dirtyData[i][j]['End Transition Year'];
                            }


                            semiDirtyData[i]["targets"].push({
                                'target': dirtyData[i][j]['Target System'],
                                "startTime": dirtyData[i][j]['Start Transition Year'],
                                "endTime": dirtyData[i][j]['End Transition Year'],
                                'type': dirtyData[i][j]['Decommissioned System']
                            })
                        }
                    }


                    localChartData = [];
                    for (var i in semiDirtyData) {
                        localChartData.push({
                            task: semiDirtyData[i]['Decommissioned System'],
                            type: semiDirtyData[i]['Decommissioned System'],
                            startTime: String((semiDirtyData[i]['Start Transition Year'])),
                            endTime: String(semiDirtyData[i]['End Transition Year']),
                            targets: semiDirtyData[i]['targets']
                        })
                    }

                    localChartData = _.sortBy(localChartData, 'startTime');
                    localChartDataTypes = _.groupBy(localChartData, 'type');
                    localChartDataTypesCount = {};
                    for (var i in localChartDataTypes) {
                        localChartDataTypesCount[i] = localChartDataTypes[i].length;
                    }
                    localChartDataTypes = _.keys(localChartDataTypes);
                    localChartDataTimeGroupings = _.groupBy(_.flatten(_.map(localChartData, 'targets')), 'endTime');

                    globalStartTime = d3.min(localChartData, function (d) {
                        return d.startTime;
                    });
                    globalEndTime = d3.max(localChartData, function (d) {
                        return d.endTime;
                    });

                    //paintedDate
                    painted = JSON.parse(JSON.stringify(localChartData));
                    paintedTypes = JSON.parse(JSON.stringify(localChartDataTypes));
                    paintedTypesCount = JSON.parse(JSON.stringify(localChartDataTypesCount));
                    paintedTimeGroupings = JSON.parse(JSON.stringify(localChartDataTimeGroupings));

                    scope.vizSearch = "";
                    scope.selectedAxis = "";

                    update();
                }
            };


            scope.chartController.highlightSelectedItem = function (selectedItem) {

            };


            scope.chartController.filterAction = function () {

            };

            scope.chartController.resizeViz = function () {
                update();
            };


            function update() {
                scope.chartController.containerSize(scope.chartController.container, scope.chartController.margin);

                d3.select("#" + scope.chartController.chartName).selectAll("*").remove();

                d3.select("#" + scope.chartController.chartName).append("div")
                    .attr("id", 'axis')
                    .attr("style", "position:absolute;top:" + scope.chartController.margin.top + "px;height:" + axisHeight + "px;" + "left:" + scope.chartController.margin.left + "px;right:" + scope.chartController.margin.right + "px;");
                d3.select("#" + scope.chartController.chartName).append("div")
                    .attr("id", 'viz')
                    .attr("style", "overflow-y:auto;position:absolute;top:" + (axisHeight + scope.chartController.margin.top) + "px;height:" + (scope.chartController.container.height - axisHeight - boxHeight) + "px;" + "left:" + scope.chartController.margin.left + "px;right:" + scope.chartController.margin.right + "px;");
                d3.select("#" + scope.chartController.chartName).append("div")
                    .attr("id", 'box')
                    .attr("style", "position:absolute;bottom:" + scope.chartController.margin.bottom + "px;height:" + (boxHeight - 2) + "px;" + "left:" + scope.chartController.margin.left + "px;right:" + scope.chartController.margin.right + "px;");


                w = scope.chartController.container.width;
                h = scope.chartController.container.height;

                dateFormat = d3.time.format("%Y");
                dateTicks = d3.time.years;
                timeScale = d3.time.scale()
                    .domain([dateFormat.parse(globalStartTime), dateFormat.parse(globalEndTime)])
                    .range([0, w - labelPadding - rectPadding]);


                globalEndTimeValues = timeScale.ticks();
                globalEndTimeValues = globalEndTimeValues.map(function (year) {
                    return +dateFormat(year)
                });
                globalEndTimeValues = _.uniq(globalEndTimeValues);
                globalEndTimeValues.shift();


                globalStartTimeValues = timeScale.ticks();
                globalStartTimeValues = globalStartTimeValues.map(function (year) {
                    return +dateFormat(year)
                });
                globalStartTimeValues = _.uniq(globalStartTimeValues);
                globalStartTimeValues.pop();

                colorScale = ["#fed976"];

                boxWidth = (w - labelPadding - rectPadding) / (globalEndTimeValues.length)


                drawAxis();
                drawRects();
                drawBoxInfo();
            }

            function drawAxis() {
                axis = d3.select("#" + scope.chartController.chartName).select("#axis");


                axis.append("div")
                    .attr("style", "position:absolute;top:0px;bottom:0px;left:0px;width:" + (labelPadding) + "px;")
                    .append(function () {
                        var compiledNode = $compile("<input ng-model='vizSearch' ng-change='vizSearchFunc(vizSearch, selectedAxis)' placeholder='Filter' style=\';height:100%;width:" + (labelPadding - 15) + "px\' >")(scope);
                        return compiledNode[0]
                    });


                for (var i = 0; i < globalEndTimeValues.length; i++) {
                    var axisHolder = axis.append("div")
                        .attr("style", "font-size:11px;position:absolute;top:0px;bottom:0px;left:" + (labelPadding + i * boxWidth) + "px;width:" + (boxWidth) + "px;")
                        .append(function () {
                            var compiledNode = $compile("<div class='center' style='width:100%'><text class='pointer' ng-click='vizSearchFunc(vizSearch,\"" + globalEndTimeValues[i] + "\")'>" + globalStartTimeValues[i] + "</text>" + "<i class='fa fa-times pointer' style='position:absolute;top:2px;margin-left:5px' ng-show=\'\"" + globalEndTimeValues[i] + "\"===selectedAxis\' ng-click='vizSearchFunc(vizSearch, false)\'></i>" + "</div>")(scope);
                            return compiledNode[0]
                        });

                }
            }

            function drawRects() {
                viz = d3.select("#" + scope.chartController.chartName).select("#viz").append("svg")
                    .attr("width", scope.chartController.container.width - rectPadding)
                    .attr("height", (gap + barHeight) * painted.length + axisHeight);

                var vizAxis = d3.svg.axis()
                    .scale(timeScale)
                    .orient('top')
                    .ticks(dateTicks, 1)
                    .tickSize(-((gap + barHeight) * painted.length - 4), 0, 0)
                    .tickFormat(d3.time.format(""));

                var grid = viz.append('g')
                    .attr('class', 'timeline-grid')
                    .attr('transform', 'translate(' + labelPadding + ', ' + axisHeight + ')')
                    .call(vizAxis);

                var rectGroup = viz.append("g")
                    .attr('transform', 'translate(' + 0 + ', ' + axisHeight + ')');
                var bigRects = rectGroup.append("g")
                    .selectAll("rect")
                    .data(painted)
                    .enter()
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", function (d, i) {
                        return i * (gap + barHeight) - 2;
                    })
                    .attr("width", function (d) {
                        return w - 0 - rectPadding;
                    })
                    .attr("height", (gap + barHeight))
                    .attr("stroke", "none")
                    .attr("fill", function (d) {
                        for (var i = 0; i < paintedTypes.length; i++) {
                            if (d['type'] == paintedTypes[i]) {
                                if (i % 2 == 0) {
                                    return "#d6d6d6"
                                }
                                else {
                                    return "#eeeeee"
                                }
                            }
                        }
                    })
                    .attr("opacity", .5);


                var rectangles = rectGroup.append('g')
                    .selectAll("rect")
                    .data(painted)
                    .enter();


                var innerStartRects = rectangles.append("rect")
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("x", function (d) {
                        return timeScale(dateFormat.parse(d.startTime)) + labelPadding;
                    })
                    .attr("y", function (d, i) {
                        return i * (gap + barHeight);
                    })
                    .attr("width", function (d) {
                        return (timeScale(dateFormat.parse(d.endTime)) - timeScale(dateFormat.parse(d.startTime)));
                    })
                    .attr("height", barHeight)
                    .attr("stroke", "none")
                    .attr("fill", colorScale)
                    .attr("id", function (d) {
                        return d['type'];
                    });

                var innerEndRects = rectangles.append("rect")
                    .attr("rx", 3)
                    .attr("ry", 3)
                    .attr("x", function (d) {
                        return timeScale(dateFormat.parse(d.endTime)) + labelPadding;
                    })
                    .attr("y", function (d, i) {
                        return i * (gap + barHeight);
                    })
                    .attr("width", function (d) {
                        return timeScale(dateFormat.parse(globalEndTime)) - (timeScale(dateFormat.parse(d.endTime)));
                    })
                    .attr("height", barHeight)
                    .attr("stroke", "none")
                    .attr("fill", "#CCCCCC");


                if (painted.length <= 0) {
                    viz.append("g")
                        .attr('transform', 'translate(' + (w - labelPadding - rectPadding) / 2 + ', ' + axisHeight + ')')
                        .append('text')
                        .attr("text-anchor", "middle")
                        .attr("font-size", "ll")
                        .text('No Results')
                }


                /*  var rectText = rectangles.append("text")
                 .text(function (d) {
                 return d.task;
                 })
                 .attr("x", function (d) {
                 return (timeScale(dateFormat.parse(d.endTime)) - timeScale(dateFormat.parse(d.startTime))) / 2 + timeScale(dateFormat.parse(d.startTime));
                 })
                 .attr("y", function (d, i) {
                 return i * (gap + barHeight) + 14;
                 })
                 .attr("font-size", 11)
                 .attr("text-anchor", "middle")
                 .attr("text-height", barHeight)
                 .attr("fill", "#000");*/

                var prevGap = axisHeight;
                var prevCount = 0;
                var numOccurances = [];

                for (var i in paintedTypesCount) {
                    numOccurances.push({type: i, count: paintedTypesCount[i], prevCount: prevCount});
                    prevCount += paintedTypesCount[i];
                }

                var axisText = viz.append("g")
                    .selectAll("text")
                    .data(numOccurances)
                    .enter()
                    .append('foreignObject')
                    .attr("x", 0)
                    .attr("y", function (d) {
                        return d['prevCount'] * (gap + barHeight);
                    })
                    .attr("height", function (d) {
                        return d['count'] * (gap + barHeight);
                    })
                    .attr("width", labelPadding)
                    .attr('transform', 'translate(' + 0 + ', ' + axisHeight + ')')
                    .append("xhtml:div")
                    .attr("height", function (d) {
                        return d['count'] * (gap + barHeight);
                    })
                    .attr("width", labelPadding - 15)
                    .append(function (d) {
                        var nodeUri = "http://semoss.org/ontologies/Concept/System/" + $filter('replaceSpaces')(d['type']);
                        var compiledNode = $compile("<div><text class='pointer' style='font-size:11px'" + "ng-dblclick='chartController.highlightSelectedItem([{name:" + "\"" + d['type'] + "\"" + ",uri:" + "\"" + nodeUri + "\"" + "}])\'" + "ng-click='vizHighlightType({name:" + "\"" + d['type'] + "\"" + ",uri:" + "\"" + nodeUri + "\"" + "})\'>" + d['type'] + "</text><i class='fa fa-times pull-right pointer' style='padding-top:1.5px; margin-right:1.5px' ng-show=\'\"" + d['type'] + "\"===selectedType.name\' ng-click='clearVizHighlightType(\"\", true)\'></i></div>")(scope);
                        return compiledNode[0]
                    })


                if (!_.isEmpty(scope.selectedType)) {
                    scope.vizHighlightType(scope.selectedType)
                }

            }

            function drawBoxInfo() {
                box = d3.select("#" + scope.chartController.chartName).select("#box");

                box.append("div")
                    .attr("style", "border-right:1px solid lightgrey;position:absolute;top:0px;bottom:0px;left:0px;width:" + (labelPadding) + "px;");

                for (var i = 0; i < globalEndTimeValues.length; i++) {
                    var boxHolder = box.append("div")
                        .attr("style", "font-size:11px;border-right:1px solid lightgrey;position:absolute;top:0px;bottom:0px;left:" + (labelPadding + i * boxWidth) + "px;width:" + (boxWidth) + "px;");


                    if (paintedTimeGroupings[globalEndTimeValues[i]]) {
                        boxHolder.append("div")
                            .attr("class", "center")
                            .attr("style", "width:100% height:45px")
                            .html("<div style='font-style:italic;'>" + _.uniq(_.map(paintedTimeGroupings[globalEndTimeValues[i]], 'type')).length + " Decommissioned Systems</div><div style='font-weight:bold;'>Replacing Systems:</div>")


                        var tempGroupings = [];
                        for (var j = 0; j < paintedTimeGroupings[globalEndTimeValues[i]].length; j++) {
                            tempGroupings.push(paintedTimeGroupings[globalEndTimeValues[i]][j]['target']);
                        }

                        tempGroupings = _.uniq(tempGroupings);

                        var html = "";
                        for (var j = 0; j < tempGroupings.length; j++) {
                            if (j === (tempGroupings.length - 1)) {
                                html += (tempGroupings[j]);
                            }
                            else {
                                html += (tempGroupings[j] + ", ");
                            }
                        }


                        boxHolder.append("div")
                            .attr("style", "overflow:auto;width:100%;height:" + (boxHeight - 45) + "px")
                            .html(html);
                    }
                    else {
                        /* boxHolder.append("div")
                         .attr("class", "center")
                         .attr("style", "width:100% height:45px")
                         .html("<div style='font-style:italic;'>0 Decommissioned Systems</div><br><div style='font-weight:bold;'>Replacing Systems:</div>")

                         boxHolder.append("div")
                         .attr("style", "overflow:auto;width:100%;height:" + (boxHeight - 45) + "px")
                         .html("<div class='center'> N/A </div>");*/
                    }
                }


            }

            scope.vizSearchFunc = function (search, year) {
                scope.selectedAxis = year;

                var localSearch = search.toUpperCase();

                if (_.isEmpty(localSearch) && _.isEmpty(year)) {
                    painted = JSON.parse(JSON.stringify(localChartData));
                    paintedTypes = JSON.parse(JSON.stringify(localChartDataTypes));
                    paintedTypesCount = JSON.parse(JSON.stringify(localChartDataTypesCount));
                    paintedTimeGroupings = JSON.parse(JSON.stringify(localChartDataTimeGroupings));


                } else {
                    painted = _.filter(localChartData, function (d) {
                        if (!_.isEmpty(localSearch) && !_.isEmpty(year)) {
                            return (d['task'].toUpperCase().indexOf(localSearch) > -1) && (d['endTime'] === year);
                        }

                        if (!_.isEmpty(localSearch) && _.isEmpty(year)) {
                            return d['task'].toUpperCase().indexOf(localSearch) > -1;

                        }
                        if (_.isEmpty(localSearch) && !_.isEmpty(year)) {
                            return d['endTime'] === year;

                        }
                    });

                    paintedTypes = _.groupBy(painted, 'type');
                    paintedTypesCount = {};
                    for (var i in paintedTypes) {
                        paintedTypesCount[i] = paintedTypes[i].length;
                    }
                    paintedTypes = _.keys(paintedTypes);
                    paintedTimeGroupings = _.groupBy(_.flatten(_.map(painted, 'targets')), 'endTime');


                }
                //clear out existing vizs
                d3.select("#" + scope.chartController.chartName).select("#viz").selectAll("*").remove();
                d3.select("#" + scope.chartController.chartName).select("#box").selectAll("*").remove();

                drawRects();
                drawBoxInfo();

            };

            scope.vizHighlightType = function (selectedItem) {
                scope.selectedType = selectedItem;

                d3.select("#" + scope.chartController.chartName).select("#viz").selectAll("rect").style({
                    "stroke-width": 0
                });
                d3.select("#" + scope.chartController.chartName).select("#viz").select("rect[id='" + selectedItem.name + "']").style({
                    "stroke": "black",
                    "stroke-width": 1
                });


                vizHighlightProcessor();
            };


            scope.clearVizHighlightType = function (item) {
                scope.selectedType = item;

                d3.select("#" + scope.chartController.chartName).select("#viz").selectAll("rect").style({
                    "stroke-width": 0
                });
                vizHighlightProcessor();
            };


            function vizHighlightProcessor() {
                var highlightTypePainted = false;
                for (var i in painted) {
                    if (painted[i]['type'] === scope.selectedType.name) {
                        highlightTypePainted = true;
                        break;
                    }
                }

                if (!highlightTypePainted) {
                    scope.selectedType = ""
                }

                paintedTimeGroupings = _.groupBy(_.filter(_.flatten(_.map(painted, 'targets')), function (d) {
                    if (_.isEmpty(scope.selectedType)) {
                        return true
                    }

                    return d['type'] === scope.selectedType.name
                }), 'endTime');

                d3.select("#" + scope.chartController.chartName).select("#box").selectAll("*").remove();
                drawBoxInfo();
            }


            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
            });
        }

        function timelineController($scope) {

        }
    }
})();
