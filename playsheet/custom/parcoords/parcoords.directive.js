(function () {
    'use strict';

    angular.module("app.parcoords.directive", [])
        .directive("d3Parcoords", d3Parcoords);

    d3Parcoords.$inject = ["$filter", "$rootScope", "$timeout", "utilityService", "_", "$compile", "alertService", "dataService", "pkqlService", "filterService"];
    parcoordsCtrl.$inject = ["$scope"];

    function d3Parcoords($filter, $rootScope, $timeout, utilityService, _, $compile, alertService, dataService, pkqlService, filterService) {
        parcoordsLink.$inject = ["scope", "ele", "attrs", "controllers"];

        return {
            restrict: 'A',
            require: ["^chart"],
            link: parcoordsLink,
            bindToController: true,
            controllerAs: 'parcoordsCtrl',
            controller: parcoordsCtrl
        };

        function parcoordsLink(scope, ele, attrs, controllers) {

            scope.chartCtrl = controllers[0];

            //inserting id for div
            var html = '<div class="append-viz" id="' + scope.chartCtrl.chartName + '-append-viz"><div class="parcoords absolute-size" id=' + scope.chartCtrl.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            //declare and initialize scope variables
            scope.viz = {};
            scope.potentialInput = "";
            scope.committedInput = "";
            //scope.parcoordsState = parcoordsToolsService.getparcoordsToolState(); //Changed to local variable

            //TODO: do we need spaceAtScreenBottom? If not, remove it all-together from this directive
            if (!scope.spaceAtScreenBottom) {
                scope.spaceAtScreenBottom = 0;
            }

            //declare/initialize local variables
            var parcoordsData = [],
            //sidebarOpen = scope.chartCtrl.sidebarActive !== null ? scope.chartCtrl.sidebarActive : true,
            //parWidth = parseInt(d3.select('.' + scope.chartCtrl.containerClass).style('width'), 10) - 5 - parseInt(scope.spaceAtScreenBottom, 10),
                parWidth = scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - parseInt(scope.spaceAtScreenBottom, 10),
            //parHeight = parseInt(d3.select('.' + scope.chartCtrl.containerClass).style('height'), 10) - 50,
                parHeight = scope.chartCtrl.container.height + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 50,
                heightToggle = false,
                widthToggle = false,
                updateStatus = false,
                numcols = 0,
                parcoordsHighlightData = [],
                uniqueRowCount = 0,
                uriMap = {},
                tip,
                bottomMargin = 40;

            var parcoords = d3.parcoords()('#' + scope.chartCtrl.chartName)
                .alpha(0.8)
                .mode("queue") // progressive rendering
                .rate(300)
                .height(d3.max([parHeight, 500]))
                .width(d3.max([parWidth, 700]))
                .margin({
                    top: 60,
                    left: 130,
                    right: 0,
                    bottom: bottomMargin
                });

            //widget variables
            scope.chartCtrl.margin = {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            };

            //watches for changes in the data variable
            scope.chartCtrl.dataProcessor = function (newData) {
                if (!_.isEmpty(newData) && parcoordsData[0] !== newData) {
                    //sets all tools to original values
                    uniqueRowCount = 0;
                    heightToggle = false;
                    widthToggle = false;
                    parcoordsData = [];

                    var dataTableAlignArray = [];
                    for (var i in newData.dataTableAlign) {
                        dataTableAlignArray.push(newData.dataTableAlign[i])
                    }

                    //set parcoords data to the correct format
                    var tempData = [];
                    for (var datum in newData.data) {
                        var tempDatum = {};
                        for (var key in newData.data[datum]) {
                            if (dataTableAlignArray.indexOf(key) > -1) {
                                //var filteredKey = $filter('replaceUnderscores')(key);
                                var uri = '' + newData.data[datum][key];
                                var filteredUri = $filter('shortenValueFilter')(uri);
                                tempDatum[key] = filteredUri; // may need to change key back to filtered
                                if (uri.indexOf('http://') > -1) {
                                    uriMap[filteredUri] = {
                                        uri: uri,
                                        header: key
                                    };
                                }
                            }
                        }
                        tempData[datum] = tempDatum;
                    }

                    parcoordsData[0] = tempData;
                    setUniqueRowNumber();
                    var dimCount;
                    if (typeof scope.chartCtrl.data.specificData === "undefined") {
                        scope.chartCtrl.data.specificData = {};
                    }
                    if (scope.chartCtrl.data.specificData.countEnabled) {
                        scope.createOverlap(scope.chartCtrl.data.specificData.countOptions);
                        dimCount = parcoords.dimensions().length - 1;
                    } else {
                        update(parcoordsData[0], false, true);
                        dimCount = parcoords.dimensions().length;
                    }
                    if (dimCount != _.size(parcoordsData[0][0])) {
                        alertService("Some axes are not shown because they have too many distinct values to display. Please filter/reduce your data to see axes.", "Warning", "toast-warning", 3000);
                    }
                    if (newData.uiOptions) {
                        if (newData.uiOptions.heightFitToScreen === true) {
                            scope.heightFitToScreen();
                        } else if (newData.uiOptions.widthFitToScreen === true) {
                            scope.widthFitToScreen();
                        }

                    }
                }
            };

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                var allLabels = d3.select('#' + scope.chartCtrl.chartName).selectAll("text:not(.label)"), selectedPLabel = [];

                for (var i in selectedItem) {
                    selectedPLabel.push(d3.select('#' + scope.chartCtrl.chartName).selectAll("text:not(.label)").filter(function (d) {
                        return d === $filter("shortenAndReplaceUnderscores")(selectedItem[i].uri);
                    }));
                }

                allLabels.style({
                    "font-weight": "normal"
                });

                for (var i in selectedPLabel) {
                    selectedPLabel[i].style({
                        "font-weight": "bold"
                    });
                }


                var tempData = parcoords.data(), selectedObjects = [];

                for (var i in selectedItem) {
                    selectedObjects.push(tempData.filter(function (obj) {
                        if (_.includes(_.values(obj), $filter("shortenAndReplaceUnderscores")(selectedItem[i].uri))) {
                            return true;
                        }
                    }));
                }

                for (var i in selectedObjects) {
                    if (!_.isEmpty(selectedObjects[i])) {
                        parcoords.highlight(selectedObjects[i]);
                    }
                }
            };

            scope.chartCtrl.resizeViz = function () {
                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);

                d3.selectAll("#parcoords-d3-tip").remove();

                var height = scope.chartCtrl.container.height + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 5 - parseInt(scope.spaceAtScreenBottom);

                if (heightToggle === false && widthToggle === false) {
                    parcoords
                        .autoscale()
                        .render()
                        .shadows()
                        .reorderable()
                        .brushable();

                    parcoords
                        .height(scope.chartCtrl.container.height + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 5 - parseInt(scope.spaceAtScreenBottom + 40))
                        .width(scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 50)
                        .reorderable();
                } else if (heightToggle === true && widthToggle === false) {
                    parcoords
                        .autoscale()
                        .height(Math.max(uniqueRowCount * 15 + 50, height))
                        .width(scope.chartCtrl.container.width + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 50)
                        .render()
                        .shadows()
                        .reorderable()
                        .brushable();
                } else if (heightToggle === false && widthToggle === true) {
                    parcoords
                        .autoscale()
                        .height(scope.chartCtrl.container.height + scope.chartCtrl.margin.left + scope.chartCtrl.margin.right - 5 - parseInt(scope.spaceAtScreenBottom))
                        .width(numcols * 320)
                        .render()
                        .shadows()
                        .reorderable()
                        .brushable();
                } else {
                    parcoords
                        .autoscale()
                        .height(Math.max(uniqueRowCount * 15 + 50, height))
                        .width(d3.max([uniqueRowCount * 10, numcols * 320]))
                        .render()
                        .shadows()
                        .reorderable()
                        .brushable();
                }

                if (parcoordsHighlightData.length > 0) {
                    parcoords.highlight(parcoordsHighlightData);
                }

                initializeTooltip();

                d3.selectAll(".parcoords .axis text").call(tip);
                d3.selectAll(".parcoords .axis text")
                    .attr("title", function (d) {
                        if (isNaN(d)) {
                            return $filter('shortenAndReplaceUnderscores')(d);
                        } else {
                            if (d > 1) {
                                return d3.format(",")(d);
                            }
                            return d3.format(",.2f")(d);
                        }

                    })
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide);

                //reattach the dblclick event when resizing; it gets removed when you resize height/width
                d3.select('#' + scope.chartCtrl.chartName).selectAll("text:not(.label)")
                    .on("dblclick", function (element) {
                        var filteredEle = $filter("replaceSpaces")(element);
                        if (uriMap[filteredEle]) {
                            var selectedItem = [{
                                uri: uriMap[filteredEle].uri,
                                name: (element),
                                axisName: uriMap[filteredEle].header
                            }];
                            scope.chartCtrl.highlightSelectedItem(selectedItem);
                        }
                    });


            };

            /* Initialize tooltip */
            function initializeTooltip() {
                tip = d3.tip()
                    .attr("class", "d3-tip")
                    .attr("id", "parcoords-d3-tip")
                    //.style("z-index", "10000")
                    .html(function (d) {
                        if (isNaN(d)) {
                            return $filter('shortenAndReplaceUnderscores')(d);
                        } else {
                            if (d > 1) {
                                return d3.format(",")(d);
                            }
                            return d3.format(",.2f")(d);
                        }
                    });
            }

            //var tip = d3.tip()
            //    .attr('class', 'd3-tip')
            //    .attr("id", "heatmap-d3-tip")
            //    .html(function (d) {
            //        return "<div> <span class='light'>" + value + ":</span> " + roundedValue(d) + "</div>" + "<div><span class='light'>" +
            //            xAxisName + ":</span> " + d.xAxisName + "</div>" + "<div> <span class='light'>" + yAxisName + ":</span> " + d.yAxisName + "</div>";
            //    });

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function parcoordsDestroyer() {
                d3.selectAll("#parcoords-d3-tip").remove();
                console.log("parcoords destroyed")
            });

            scope.resetFilters = function () {
                scope.chartCtrl.data.data = JSON.parse(JSON.stringify(scope.chartCtrl.data.originalData.data));
                scope.chartCtrl.data.filteredData = utilityService.filterTableUriData(scope.chartCtrl.data.data);
            };

            function getTableData() {
                if (scope.parcoordsTableData.length > 0) {
                    return scope.parcoordsTableData;
                }

                return [];
            }

            // color scale for zscores
            var zcolorscale = d3.scale.linear()
                .domain([-2, -0.05, 0.05, 2])
                .range(["brown", "#999", "#999", "steelblue"])
                .interpolate(d3.interpolateLab);

            // update color
            function change_color(dimension) {
                parcoords.svg.selectAll(".dimension")
                    .style("font-weight", "normal")
                    .filter(function (d) {
                        return d === dimension;
                    })
                    .style("font-weight", "bold");
                parcoords.color(zcolor(parcoords.data(), dimension)).render();
            }

            // return color function based on plot and dimension
            function zcolor(col, dimension) {
                var z = zscore(_.map(col, dimension).map(parseFloat));
                return function (d) {
                    return zcolorscale(z(d[dimension]));
                };
            }

            // color by zscore
            function zscore(col) {
                var n = col.length,
                    mean = _.mean(col),
                    sigma = _.stdDeviation(col);
                return function (d) {
                    return (d - mean) / sigma;
                };
            }

            function setUniqueRowNumber() {
                for (var i = 0; i < scope.chartCtrl.data.headers.length; i++) {
                    var key = scope.chartCtrl.data.headers[i].title,
                        uniqueCount = _.uniq(_.map(parcoordsData[0], key)).length;

                    uniqueRowCount = uniqueRowCount < uniqueCount ? uniqueCount : uniqueRowCount;
                }
            }

            scope.dropDownChange = function (ddValue) {
                //var ddValue = this.options[this.selectedIndex].value;
                if (ddValue === "") {
                    parcoords.render().color("steelblue");
                } else {
                    change_color(ddValue);
                }

                if (parcoordsHighlightData.length !== 0) {
                    parcoords.highlight(parcoordsHighlightData);
                }
            };

            scope.heightFitToScreen = function () {
                if (heightToggle === true) {
                    heightToggle = false;
                    scope.chartCtrl.resizeViz();
                } else {
                    heightToggle = true;
                    scope.chartCtrl.resizeViz();
                }
            };

            scope.widthFitToScreen = function () {
                if (widthToggle === true) {
                    widthToggle = false;
                    scope.chartCtrl.resizeViz();
                } else {
                    widthToggle = true;
                    scope.chartCtrl.resizeViz();
                }
            };

            parcoords.on("brushend", function (d) {
                tableDataUpdate(d);
            });

            function tableDataUpdate(tableData) {
                scope.parcoordsTableData = utilityService.addUnderscoresToTableData(tableData);
                //scope.changeTableCount();
                scope.parcoordsTableColumns = [];
                scope.filter_dict = {};
                var tempTableColumns = [];
                var tempFilterData = {};
                for (var key in tableData[0]) {
                    if (key !== "$$hashKey" && key !== "$selected") {
                        var objectTemplate = {};
                        objectTemplate.title = $filter('replaceSpaces')(key);
                        objectTemplate.field = $filter('replaceSpaces')(key);
                        objectTemplate.visible = true;
                        if (typeof tableData[0][key] === 'number') {
                            objectTemplate.alignRight = true;
                        } else {
                            objectTemplate.alignRight = false;
                        }
                        tempTableColumns.push(objectTemplate);
                        tempFilterData[$filter('replaceSpaces')(key)] = "";
                    }
                }
                scope.filter_dict = tempFilterData;
                scope.parcoordsTableColumns = tempTableColumns;
                //scope.tableParams.reload();
            }

            scope.drillDown = function (currentToolIndex) {

                d3.selectAll(".extent") //grabs the brushed rectangles
                    .each(function (d, i) { //loop through and find the column that has been brushed
                        if (d3.select(this).attr("height") > 0) {
                            //TODO this sets the filterColumn correctly but if user drills down a second time, before they "applyFilter" it will only take account of the latest filterColumn when "apply filter" is run
                            scope.chartCtrl.filterColumn = d.replace(/ /g, "_"); //set this filterColumn for apply filter functionality; adds _ in place of space for column name
                        }
                    });

                parcoordsData = parcoordsData.slice(0, currentToolIndex);

                //only drill down with highlighted data
                if (_.isEmpty(scope.parcoordsTableData)) {
                    alertService('No highlighted data to filter', 'Warning', 'toast-warning', 3000);

                    //TODO find way to push error back to tools
                    //currently copying another array so the back / forward / reset buttons are not thrown off
                    var copyData = parcoordsData[currentToolIndex - 1];
                    parcoordsData.push(copyData);
                } else {
                    parcoords.unhighlight(parcoordsHighlightData);
                    if (parcoordsHighlightData.length > 0) {
                        scope.parcoordsTableData = parcoordsHighlightData;
                    }
                    for (var i = 0; i < scope.parcoordsTableData.length; i++) {
                        delete scope.parcoordsTableData[i]["$selected"];
                    }
                    parcoordsData.push(scope.parcoordsTableData);
                    //update(scope.parcoordsTableData, true);
                    heightToggle = false;

                    // ***BEGIN: Filter backend data

                    if (typeof scope.chartCtrl.data.specificData === "undefined") {
                        scope.chartCtrl.data.specificData = {};
                    }
                    scope.chartCtrl.data.specificData.parcoordsFilterData = {};
                    scope.chartCtrl.data.specificData.parcoordsFilterData.headers = scope.parcoordsTableColumns;
                    scope.chartCtrl.data.specificData.parcoordsFilterData.data = scope.parcoordsTableData;

                    //var unfilteredData = {};
                    //var filterOptions = {};
                    //for (var i = 0; i < scope.chartCtrl.data.specificData.parcoordsFilterData.headers.length; i++) {
                    //    var header = scope.chartCtrl.data.specificData.parcoordsFilterData.headers[i].title;
                    //    if (header === "Count") {
                    //        continue;
                    //    }
                    //    unfilteredData[header] = [];
                    //}
                    //for (var i = 0; i < scope.chartCtrl.data.specificData.parcoordsFilterData.data.length; i++) {
                    //    for (var header in unfilteredData) {
                    //        if (_.indexOf(unfilteredData[header], scope.chartCtrl.data.specificData.parcoordsFilterData.data[i][header]) < 0) {
                    //            unfilteredData[header].push(scope.chartCtrl.data.specificData.parcoordsFilterData.data[i][header]);
                    //        }
                    //    }
                    //}
                    //for (var header in unfilteredData) {
                    //    filterOptions[header] = {
                    //        values: [],
                    //        selectAll: false
                    //    };
                    //    for (var j = 0; j < unfilteredData[header].length; j++) {
                    //        filterOptions[header]["values"].push(unfilteredData[header][j]);
                    //    }
                    //}

                    //monolithService.filterData(filterOptions, scope.chartCtrl.data.insightID, true).then(
                    filterService.createFilterOptions(scope.chartCtrl.data).then(function (filterModel) {
                        var unfilteredData = {};
                        var filterOptions = {};
                        for (var i = 0; i < scope.chartCtrl.data.specificData.parcoordsFilterData.headers.length; i++) {
                            var header = scope.chartCtrl.data.specificData.parcoordsFilterData.headers[i].title;
                            if (header === "Count") {
                                continue;
                            }
                            unfilteredData[header] = [];
                        }
                        for (var i = 0; i < scope.chartCtrl.data.specificData.parcoordsFilterData.data.length; i++) {
                            for (var header in unfilteredData) {
                                if (_.indexOf(unfilteredData[header], scope.chartCtrl.data.specificData.parcoordsFilterData.data[i][header]) < 0) {
                                    unfilteredData[header].push(scope.chartCtrl.data.specificData.parcoordsFilterData.data[i][header]);
                                }
                            }
                        }

                        for (var header in unfilteredData) {
                            filterOptions[header] = {
                                inputSearch: "",
                                isCollapsed: false,
                                isDisabled: false,
                                isFiltered: true,
                                list: [],
                                selectAll: false
                            };
                            for (var i = 0; i < filterModel.filters[header].list.length; i++) {
                                if (_.indexOf(unfilteredData[header], $filter('shortenValueFilter')(filterModel.filters[header].list[i].value)) > -1) {
                                    filterOptions[header]["list"].push({
                                        selected: true,
                                        value: filterModel.filters[header].list[i].value
                                    });
                                }
                            }
                        }

                        var filterPKQL = '';
                        for (var i in filterOptions) {
                            filterPKQL += pkqlService.generateFilterQuery(filterOptions, i);
                        }
                        var currentWidget = dataService.getWidgetData();
                        pkqlService.executePKQL(currentWidget.insightId, filterPKQL);


                        /* $rootScope.$emit('sheet-receive', 'update-data', {
                         type: "filter",
                         call: function () {
                         },
                         callBack: function () {
                         return sendData;
                         }
                         });*/
                    });
                    //);


                    //*** END: Filter backend data

                    //clear highlighted data after drill down
                    scope.parcoordsTableData = [];
                    parcoordsHighlightData = [];


                }
            };

            scope.createOverlap = function (input) {
                if (typeof scope.chartCtrl.data.specificData === "undefined") {
                    scope.chartCtrl.data.specificData = {};
                }
                scope.chartCtrl.data.specificData.countEnabled = true;
                scope.chartCtrl.data.specificData.countOptions = input;
                var selectedConcept = input[0];
                var relatedConcept = input[1];
                var toolState = input[2];

                var data = parcoordsData[0];

                var filteredData = [],
                    headerKeys = _.keys(data[0]);

                data.forEach(function (item) {
                    var newObj = {};

                    for (var i = 0; i < headerKeys.length; i++) {
                        newObj[headerKeys[i]] = $filter("shortenValueFilter")(item[headerKeys[i]]);
                    }

                    filteredData.push(newObj);
                });

                data = filteredData;

                scope.parcoordsCtrl.countData = {}; // used to store counts for overlap

                for (var i in data) {
                    var selectedInstance = data[i][selectedConcept];
                    var relatedInstance = data[i][relatedConcept];
                    if (!(selectedInstance in scope.parcoordsCtrl.countData)) {
                        scope.parcoordsCtrl.countData[selectedInstance] = {
                            count: 0,
                            relation: []
                        };
                    }
                    var countObject = scope.parcoordsCtrl.countData[selectedInstance];
                    if (!(_.includes(countObject.relation, relatedInstance))) {
                        countObject.count++;
                        countObject.relation.push(relatedInstance);
                    }
                }
                var label = "Count";
                for (var i = 0; i < data.length; i++) {
                    data[i][label] = scope.parcoordsCtrl.countData[/*$filter('replaceUnderscores')*/(data[i][selectedConcept])].count;
                }

                for (var i = 0; i < data.length; i++) {
                    delete data[i]["$selected"];
                }

                parcoordsData = parcoordsData.slice(0, toolState + 1);
                parcoordsData.push(data);

                heightToggle = false;

                update(data, false, true);

            };


            scope.resetPerspective = function () {
                //call reset through pkql
                //generateFilterQuery
                var filterPKQL = '';
                for (var i = 0; i < scope.chartCtrl.data.headers.length; i++) {
                    var filterOptions = {};
                    filterOptions[scope.chartCtrl.data.headers[i].title] = {
                        inputSearch: "",
                        isCollapsed: false,
                        isDisabled: false,
                        isFiltered: true,
                        list: [],
                        selectAll: true
                    };
                    filterPKQL += pkqlService.generateFilterQuery(filterOptions, scope.chartCtrl.data.headers[i].title);
                }

                var currentWidget = dataService.getWidgetData();
                pkqlService.executePKQL(currentWidget.insightId, filterPKQL);
            };

            scope.changeBackForward = function (state) {
                parcoordsHighlightData = [];

                update(parcoordsData[state], false);
            };

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                return scope[toolUpdateConfig.fn](toolUpdateConfig.args);
            };


            scope.clearDropDown = function () {
                scope.parcoordsCtrl.clearDropDown();
                if (parcoordsHighlightData.length !== 0) {
                    parcoords.highlight(parcoordsHighlightData);
                }
            };

            scope.clearOverlapDropDown = function () {
                scope.parcoordsCtrl.clearOverlapDropDown();
                if (parcoordsHighlightData.length !== 0) {
                    parcoords.highlight(parcoordsHighlightData);
                }
            };

            function update(updateData, drillDownBoolean, noFilters) {
                scope.parcoordsCtrl.populateDropDown(parcoordsData[0]);
                scope.parcoordsCtrl.populateOverlapDropDown(parcoordsData[0]);
                scope.parcoordsCtrl.resetTools();

                scope.chartCtrl.containerSize(scope.chartCtrl.container, scope.chartCtrl.margin);

                var dimensions = [];

                //if its not the first time data is loaded (create button pressed 1+n times) and not drilling down (aka reset function or new data passed)
                if (updateStatus && !drillDownBoolean) {
                    parcoords.unhighlight(parcoordsHighlightData);
                    parcoordsHighlightData = [];
                }


                if (updateStatus && !noFilters) {
                    /* update filterpanel's checkboxes */
                    // 1. grab all data selected
                    var checkboxesToKeep = {};

                    //loop through each column, set filter options to the correctly selected items
                    //for (var j in scope.chartCtrl.data.dataTableAlign) {
                    //    //try {
                    //        var axis = scope.chartCtrl.data.dataTableAlign[j];
                    //
                    //        //get the selected items for the property at scope.chartCtrl.data.dataTableAlign[j]
                    //        checkboxesToKeep[axis] = _.uniq(_.map(updateData[0], axis));
                    //
                    //        //clear the filterOptions
                    //        console.log(scope.chartCtrl.filterOptions[axis].list);
                    //        console.log(checkboxesToKeep[axis]);
                    //        var testVar = scope.chartCtrl.filterOptions[axis].list.length;
                    //        console.log(testVar);
                    //        var testVar2 = checkboxesToKeep[axis].length
                    //        console.log(testVar2);
                    //        if (scope.chartCtrl.filterOptions[axis].list.length != checkboxesToKeep[axis].length) {
                    //            scope.chartCtrl.filterOptions[axis].selectAll = false;
                    //        } else {
                    //            scope.chartCtrl.filterOptions[axis].selectAll = true;
                    //        }
                    //        scope.chartCtrl.filterOptions[axis].tempSelected = [];
                    //
                    //        //match the checkboxesToKeep with the values in the filterOptions list at the given column
                    //        for (var i = 0; i < scope.chartCtrl.filterOptions[axis].list.length; i++) {
                    //            //get shortened URI value (string after last slash)
                    //            var filteredValue = $filter('shortenValueFilter')(scope.chartCtrl.filterOptions[axis].list[i]);
                    //
                    //            //add to tempSelected if the value is going to be kept
                    //            if (checkboxesToKeep[axis].indexOf(filteredValue) > -1) {
                    //                scope.chartCtrl.filterOptions[axis].tempSelected.push(scope.chartCtrl.filterOptions[axis].list[i]);
                    //            }
                    //        }
                    //    //} catch (err) {
                    //        console.log(axis + " does not exist in database.");
                    //    //}
                    //}
                }
                //create button pressed at least once
                updateStatus = true;

                //set the dimensions for the data
                for (var key in updateData[0]) {
                    if (key !== "$$hashKey" && key !== "$selected") {
                        dimensions.push(key);
                    }
                }
                numcols = dimensions.length;

                var filteredData = utilityService.filterTableUriData(updateData);
                for (var i = 0; i < dimensions.length; i++) {
                    dimensions[i] = $filter('shortenAndReplaceUnderscores')(dimensions[i]);
                }

                parcoords
                    .data(filteredData)
                    .detectDimensions()
                    .dimensions(dimensions);

                scope.chartCtrl.resizeViz();

                //if not drilling down (aka reset function or new data passed)
                if (!drillDownBoolean) {
                    parcoords.color("steelblue");
                    scope.clearDropDown();
                }
                parcoords.brushReset();

                //we're using a timeout here to add the dblclick event because the full graph does not get
                //created right away. before we selectAll, we need the elements to be on the canvas.
                $timeout(function () {
                    d3.select('#' + scope.chartCtrl.chartName).selectAll("text:not(.label)")
                        .on("dblclick", function (element) {
                            var filteredEle = $filter("replaceSpaces")(element);
                            if (uriMap[filteredEle]) {
                                var selectedItem = [{
                                    uri: uriMap[filteredEle].uri,
                                    name: element,
                                    axisName: uriMap[filteredEle].header
                                }];
                                scope.chartCtrl.highlightSelectedItem(selectedItem);
                            }
                        });
                });

                //Array.prototype.forEach.call(document.querySelectorAll('.d3-tip'), (t) => t.parentNode.removeChild(t));

            } //end of update function

            scope.changeSelection = function (user) {
                var newUser = {},
                    highlightIndex = -1;
                for (var key in user) {
                    if (key !== "$selected") {
                        newUser[$filter('replaceUnderscores')(key)] = $filter('replaceUnderscores')(user[key]);
                    }
                }

                for (var i = 0; i < parcoordsHighlightData.length; i++) {
                    if (JSON.stringify(parcoordsHighlightData[i]) === JSON.stringify(newUser)) {
                        highlightIndex = i;
                        break;
                    }
                }
                if (highlightIndex <= -1) {
                    parcoordsHighlightData.push(newUser);
                } else {
                    parcoordsHighlightData.splice(highlightIndex, 1);
                }
                //if you just spliced the last highlighted element, unhighlight it, and then put shadows back in. Else, no shadows while highlighted are active
                if (parcoordsHighlightData.length === 0) {
                    var lastUser = [];
                    lastUser.push(newUser);
                    parcoords.unhighlight(lastUser);
                    parcoords.shadows();
                } else {
                    parcoords.highlight(parcoordsHighlightData);
                    parcoords.clear("shadows");
                }
            };

        }
    }

    function parcoordsCtrl($scope) {

        this.dropDownChange = function (selected) {
            $scope.dropDownChange(selected);
        };
        //***Follwoing functions will be overwritten in tools

        this.populateDropDown = function (data) {
            this.dropDownData = data;
        };

        this.populateOverlapDropDown = function (data) {
            this.overlapData = data;
        };

        this.clearDropDown = function () {
        };

        this.clearOverlapDropDown = function () {
        };

        this.resetTools = function () {
        };
        //
        //this.setState = function (type, bool) {
        //};

    }
})();