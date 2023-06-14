(function () {
    "use strict";

    angular.module("app.tap.portratchart", [])
        .directive("portratchart", chart);

    chart.$inject = ["$rootScope", "$timeout", "$filter", "utilityService", "monolithService", "notificationService"];
    function chart($rootScope, $timeout, $filter, utilityService, monolithService, notificationService) {
        chartLink.$inject = ["scope", "ele", "attrs", "controllers"];
        chartCtrl.$inject = ["$scope", "monolithService", "$filter", "alertService", "$window", "$document"];

        return {
            restrict: "E",
            require: ["?^dashboard"],
            scope: {},
            controllerAs: "chartCtrl",
            bindToController: {
                data: "=",
                insightData: "=",
                containerClass: "=",
                showTitle: "=",
                chart: "=?",
                sidebarActive: "=?",
                selectedViz: "=",
                selectedEngine: "=?",
                uniqueId: "=",
                visualType: "=",
                explore: "=?",
                viewType: "=",
                vizInput: "=",
                expandViz: "&",
                removeViz: "&"
            },
            controller: chartCtrl,
            link: chartLink,
            priority: 500,
            templateUrl: "custom/specific/tap/portratdashboard/portratchart.html"
        };


        function chartLink(scope, ele, attrs, controllers) {
            var singleContent;

            //console.time("chartLink");
            //check for controllers
            scope.dashboardController = controllers[0] || {};
            scope.dashboardController.getChartFilterOptions = function () {
                return scope.chartCtrl.filterOptions;
            };

            scope.chartCtrl.selectedUri = {};

            var timer;

            //watch the change in data, but only update originialData based on boolean variable
            //filterpanel uses originalData and updates scope.data, so need to know when its new data vs filtered data
            var dataChange = function (event, data, id) {
                if (scope.chartCtrl.uniqueId === id) {
                    scope.chartCtrl.data = data;
                    if (!_.isEmpty(scope.chartCtrl.data)) {

                        //certain data hasn't been updated since we are waiting on a broadcast event
                        /*if (scope.chartCtrl.viewType === "single") {
                            scope.chartCtrl.insightData = singleViewService.getSingleViewInsightData();
                        } else {
                            scope.chartCtrl.insightData = multiViewService.getMultiViewInsightData(scope.chartCtrl.uniqueId);
                        }*/

                        if (!scope.chartCtrl.data.isFiltered && scope.chartCtrl.menuOptions.tableEnabled && !_.isEmpty(scope.chartCtrl.data.data)) {
                            //makes the filters
                            scope.chartCtrl.originalData = JSON.parse(JSON.stringify(scope.chartCtrl.data)); //TODO: when scope.chartCtrl.data is large (scope.chartCtrl.data.length > 1000), significant performance hit
                            //set Original Data in the service
                            singleViewService.setOriginalData(scope.chartCtrl.originalData);

                            //if there are filters already here
                            if (scope.chartCtrl.data.filterOptions) {
                                scope.chartCtrl.originalData.keepFilter = scope.chartCtrl.data.filterOptions;
                                delete scope.chartCtrl.data.filterOptions;
                                //pass in current data because it should be original at the time
                                scope.chartCtrl.data.data = updateDataFromFilter(scope.chartCtrl.data.data, scope.chartCtrl.originalData.keepFilter);
                            }
                        }

                        //Only call update insight list if the insight has a parameter
                        if (!_.isEmpty(scope.chartCtrl.insightData)) {
                            if (!_.isEmpty(scope.chartCtrl.insightData.params)) {
                                scope.chartCtrl.updateInsightList();
                            } else {
                                scope.chartCtrl.masterParamList = [];
                            }
                        }

                        if (scope.chartCtrl.data.layout !== "Graph" && scope.chartCtrl.data.layout !== "prerna.ui.components.specific.tap.InterfaceGraphPlaySheet" && scope.chartCtrl.data.layout !== "Dendrogram") {
                            //cleaning the data to check for duplicates
                            var cleanedNewData = JSON.parse(JSON.stringify(scope.chartCtrl.data)); //TODO: when newData.data is large (newData.data.length > 1000), significant performance hit
                            cleanedNewData.data = utilityService.removeDuplicateData(cleanedNewData);
                            if (cleanedNewData.filteredData && cleanedNewData.data.length !== cleanedNewData.filteredData.length) {
                                cleanedNewData.filteredData = utilityService.filterTableUriData(cleanedNewData.data);
                            }
                            scope.chartCtrl.dataProcessor(cleanedNewData);
                        } else {
                            var prevData = {};
                            if (singleViewService.getSingleViewStep() - 1 > 0) {
                                prevData = singleViewService.getSpecificSingleViewChartData(singleViewService.getPreviousSingleViewStep() - 1);
                                scope.chartCtrl.dataProcessor(scope.chartCtrl.data, prevData);
                            }
                            else {
                                scope.chartCtrl.dataProcessor(scope.chartCtrl.data, prevData);
                            }
                        }

                        //set the chart title
                        if (scope.chartCtrl.data.layout !== 'prerna.ui.components.playsheets.OCONUSMapPlaySheet' && scope.chartCtrl.data.layout !== 'prerna.ui.components.specific.tap.SysCoverageSheetPortRat'
        && scope.chartCtrl.data.layout !== 'prerna.ui.components.specific.tap.HealthGridSheetPortRat') {
                            scope.chartCtrl.data.title = $filter('replaceUnderscores')(scope.chartCtrl.data.title || "Untilted Visualization");
                        } else {
                            scope.chartCtrl.data.title = $filter('replaceUnderscores')(scope.chartCtrl.data.title);
                        }

                        scope.chartCtrl.setEditMode();
                        //console.timeEnd("chartCtrlWatch");
                    }
                }
            };

            var resizeCleanUpFunc = $rootScope.$on("resize-viz", function () {
                if (scope.chartCtrl.containerClass) {
                    if (angular.element("." + scope.chartCtrl.containerClass).length > 0) {
                        timer = $timeout(function () {
                            scope.chartCtrl.resizeViz();
                        }, 350);
                    }
                }
            });

            d3.select(window).on("resize." + scope.chartCtrl.chart, scope.chartCtrl.resizeViz);

            var fromPainter = scope.chartCtrl.highlightSelectedItem;

            scope.chartCtrl.highlightSelectedItem = function (selectedItem) {
                //check if item is bound
                if (scope.chartCtrl.isDataBound) {
                    //always take the first item
                    if (!_.isEmpty(selectedItem[0])) {
                        //joinDataService.setSelectedUri(JSON.parse(JSON.stringify(multiViewService.getBoundID(scope.chartCtrl.uniqueId))), JSON.parse(JSON.stringify(selectedItem)));
                        notificationService.notify('join-select-change');
                    }
                } else {
                    fromPainter(selectedItem);
                    if (selectedItem) {
                        //singleViewService.setSingleViewSelectedData(selectedItem);
                    }
                }
            };

            /*
            * used to update visualizations data if they were once bound and a binding has changed
            */
            var checkBoundID = function (event, vizToReset, vizRemovedID) {
                var newID, uniqueID = scope.chartCtrl.uniqueId;

                //chartCtrl.uniqueId isn't updated at this point and we need to check if its value should be decremented
                if (!_.isUndefined(vizToReset)) {

                    if (vizToReset === scope.chartCtrl.uniqueId) {
                        //if the removed viz was before the current viz uniqueId then we have to decrement the value
                        if (scope.chartCtrl.uniqueId > vizRemovedID) {
                            uniqueID--;
                        }
                    } else {
                        return;
                    }

                }

                newID = multiViewService.getBoundID(uniqueID);

                //checks if the new vs old ID is different and only if the ID is -1 (meaning its unbound now) do we reset the filters and data
                if (parseInt(newID) === -1) {

                    //reset all binding variables
                    scope.chartCtrl.boundValue = "";
                    scope.chartCtrl.isDataBound = checkBound();

                    //check if the param was changed, if so set back data to whats in multiViewService
                    if (scope.chartCtrl.data.isParamModified) {
                        scope.chartCtrl.data.isParamModified = false;
                        scope.chartCtrl.data.isFiltered = false;
                        scope.chartCtrl.data = JSON.parse(JSON.stringify(multiViewService.getMultiViewChartData(uniqueID)));
                        notificationService.notify('chart-data-change', scope.chartCtrl.data, scope.chartCtrl.uniqueId);
                    } else {
                        //set filterOptions back to original
                        scope.chartCtrl.filterOptions = utilityService.resetFilters(scope.chartCtrl.filterOptions);

                        //set data to original
                        scope.chartCtrl.data.isFiltered = false;
                        scope.chartCtrl.data = JSON.parse(JSON.stringify(multiViewService.getMultiViewChartData(uniqueID)));
                        notificationService.notify('chart-data-change', scope.chartCtrl.data, scope.chartCtrl.uniqueId);

                        //the applyFilter won't work anymore because it goes through the backend and we were filtering the viz on the front end
                        //scope.chartCtrl.applyFilter();
                    }

                } else if (parseInt(newID) > -1) {
                    //if previously the param was modified, but now we have a new binding, we need to reset the data
                    if (scope.chartCtrl.data.isParamModified) {
                        scope.chartCtrl.data.isParamModified = false;
                        scope.chartCtrl.data.isFiltered = false;
                        scope.chartCtrl.data = JSON.parse(JSON.stringify(multiViewService.getMultiViewChartData(uniqueID)));
                        scope.chartCtrl.data.filteredData = utilityService.filterTableUriData(scope.chartCtrl.data);
                        notificationService.notify('chart-data-change', scope.chartCtrl.data, scope.chartCtrl.uniqueId);
                    }
                    scope.chartCtrl.boundValue = joinDataService.getBoundOn(newID)[uniqueID];
                    scope.chartCtrl.isDataBound = checkBound();
                }

            };

            function checkBoundSelectedUri() {
                var boundID = multiViewService.getBoundID(scope.chartCtrl.uniqueId),
                    selectedItem = joinDataService.getSelectedUri(boundID);
                if (!_.isEmpty(selectedItem) && !_.isEmpty(selectedItem[0]) && !_.isEmpty(selectedItem[0].uri)) {
                    var boundOn = joinDataService.getBoundOn(boundID);

                    //check and see if the current visualization is bound on an object
                    if (_.isObject(boundOn[scope.chartCtrl.uniqueId])) {

                        if (boundOn[scope.chartCtrl.uniqueId].parameter) {
                            //check if the selected item is bound on the same value as the selected axis
                            if (boundOn[selectedItem[0].id] === selectedItem[0].axisName || boundOn[selectedItem[0].id].parameter === selectedItem[0].axisName) {
                                scope.chartCtrl.updateParameter(selectedItem[0]);
                            } else {
                                fromPainter(selectedItem);
                            }
                        } else if (boundOn[scope.chartCtrl.uniqueId].selectFilter && scope.chartCtrl.uniqueId !== selectedItem[0].id) {
                            var item;

                            //since we could have multiple selected items, have to find the one that could apply to this join
                            //check if the selected item is bound on the same value as the selected axis
                            for (var i=0; i<selectedItem.length; i++) {
                                if (boundOn[selectedItem[i].id].selectFilter === selectedItem[i].axisName) {
                                    item = selectedItem[i];
                                    scope.dashboardController.isDataClean = false;
                                    break;
                                }
                            }

                            //if we found the right item, start the filtering
                            if (item) {
                                //get the value and axis and update this visualizations filters
                                var boundVal = boundOn[scope.chartCtrl.uniqueId].selectFilter;
                                scope.chartCtrl.filterOptions[boundVal].tempSelected = [item.uri];
                                scope.chartCtrl.filterOptions[boundVal].selectAll = false;

                                var allData = utilityService.filterDataWithFilterOptions(JSON.parse(JSON.stringify(multiViewService.getMultiViewChartData(scope.chartCtrl.uniqueId).data)), scope.chartCtrl.filterOptions);

                                scope.chartCtrl.data.isFiltered = true;
                                scope.chartCtrl.data.data = allData;
                                scope.chartCtrl.data.filteredData = utilityService.filterTableUriData(allData);
                                notificationService.notify('chart-data-change', scope.chartCtrl.data, scope.chartCtrl.uniqueId);

                            } else {
                                fromPainter(selectedItem);
                            }
                        } else {
                            fromPainter(selectedItem);
                        }

                    } else {
                        fromPainter(selectedItem);
                    }
                } else {
                    //maybe have both of
                }
            }

            function checkBound() {
                return multiViewService.getBoundID(scope.chartCtrl.uniqueId) > -1;
            }

            var updateDataFromFilter = function(data, filteredColumns) {
                //normal filtering process
                for (var key in filteredColumns) {
                    if (filteredColumns[key].selectAll === true)
                        continue;
                    if (filteredColumns[key].tempSelected.length > 0) {
                        for (var i = 0; i < data.length; i++) {
                            if (data[i][key] && !_.includes(filteredColumns[key].tempSelected, data[i][key])) {
                                data.splice(i, 1);
                                i--;
                            }
                        }
                    }
                }

                return data;
            };

            //Watchers
            notificationService.subscribe(scope, 'chart-data-change', dataChange);
            notificationService.subscribe(scope, 'multi-id-change', checkBoundID);
            notificationService.subscribe(scope, 'join-select-change', checkBoundSelectedUri);

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                resizeCleanUpFunc();
                $timeout.cancel(timer);
                //notificationService.notify('multi-id-change');
                d3.select(window).on("resize." + scope.chartCtrl.chart, null);
            });

            //console.timeEnd("chartLink");
            scope.chartCtrl.saveVisualization = function () {
                //overriden in editstandardmode
            };

            //open the visual tab by default in explore mode
            if (scope.chartCtrl.explore)
                scope.chartCtrl.toggleMenu('visual');

            var portRatChartListener = $rootScope.$on('chart-receive', function (event, message) {
                if (message === 'sheet-resize-viz') {
                        console.log('%cPUBSUB:', "color:blue", message);
                        scope.chartCtrl.resizeViz();
                }
            });

            scope.$on('$destroy', function () {
                console.log('destroying port rat chart....');
                portRatChartListener();
            });

            dataChange(null, scope.chartCtrl.data, scope.chartCtrl.uniqueId);
        }

        function chartCtrl($scope, monolithService, $filter, alertService, $window, $document) {
            //console.time("chartCtrl");
            var chartCtrl = this;
            chartCtrl.fixedRight = true;
            /*Initial Functions Used to Copy Data*/
            chartCtrl.originalData = {}; //Original Data houses Unmodified Data. While, this.data is the modified Data
            //chartCtrl.insightData = singleViewService.getSingleViewInsightData(chartCtrl.data.insightKey); //Original Insight Data
            chartCtrl.menuOptions = false; //Disabled by default
            chartCtrl.mashupEnabled = false;
            /*** Social Functions **/

            chartCtrl.filterColumn = "";

            chartCtrl.margin = {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            };

            chartCtrl.container = {
                width: 0,
                height: 0
            };
            //Specific Chart Template (Used in special cases when additional functionality is needed
            chartCtrl.chartTemplate = "";

            chartCtrl.tableOptions = {
                scrollable: true,
                filterType: "",
                condenseTable: false,
                paginationOptions: {
                    currentPage: 1,
                    count: 10
                }
            };

            chartCtrl.modalOpen = false;

            /****** Joining functions *******/
                //TODO Fix
            chartCtrl.isDataBound = false;
            chartCtrl.isDataClean = true;

            chartCtrl.toggleFixedRight = function () {
                chartCtrl.fixedRight = !chartCtrl.fixedRight;
            };
            chartCtrl.draggable = true;
            chartCtrl.toggleIsDraggable = function () {
                chartCtrl.draggable = !chartCtrl.draggable;
            };

            chartCtrl.resetFilters = function () {
                var boundID = multiViewService.getBoundID(chartCtrl.uniqueId);
                var boundFilters = joinDataService.getBoundFilter(boundID);
                if (_.isEmpty(boundFilters)) {
                    //set filterOptions back to original
                    chartCtrl.filterOptions = utilityService.resetFilters(chartCtrl.filterOptions);

                    //set data to original
                    chartCtrl.data.isFiltered = true;
                    chartCtrl.data = JSON.parse(JSON.stringify(multiViewService.getMultiViewChartData(chartCtrl.uniqueId)));
                    notificationService.notify('chart-data-change', chartCtrl.data, chartCtrl.uniqueId);

                } else {
                    joinDataService.resetBoundFilter(boundID);
                    notificationService.notify('join-filter-change', boundID);
                }
            };

            /****** Sets up toggle of Menu Items and menuMode *******/
            if (chartCtrl.viewType === "single") {
                chartCtrl.toggleMode = singleViewService.getToggleMode();
                chartCtrl.menuMode = singleViewService.getMenuMode();
            }
            else {
                chartCtrl.toggleMode = "hidden";
                chartCtrl.menuMode = false;
            }

            chartCtrl.highlightBoundGrid = function (highlight) {
                if (highlight) {
                    var boundGrids = _.keys(joinDataService.getBoundOn(multiViewService.getBoundID(chartCtrl.uniqueId)));
                    $scope.dashboardController.highlightGrid({index: boundGrids});
                } else {
                    $scope.dashboardController.highlightGrid({index: []});
                }
            };

            chartCtrl.toggleMenu = function (mode) {
                if (chartCtrl.toggleMode === mode) {
                    chartCtrl.toggleMode = "hidden";
                } else {
                    chartCtrl.toggleMode = mode;
                }
                singleViewService.setToggleMode(chartCtrl.toggleMode);
            };

            chartCtrl.setMenuService = function () {
                singleViewService.setMenuMode(chartCtrl.menuMode);
            };

            chartCtrl.addToDashboard = function () {
                multiViewService.setMultiViewChartData(JSON.parse(JSON.stringify($scope.chartCtrl.data)));
                multiViewService.setMultiViewInsightData(JSON.parse(JSON.stringify($scope.chartCtrl.insightData)));
                $rootScope.$broadcast("browse.activate-dashboard-badge", multiViewService.getDashboardItemCount());
            };

            //explore bool. Should be removed.
            if (chartCtrl.explore) {
                chartCtrl.isExplore = chartCtrl.explore;
            } else {
                chartCtrl.isExplore = false;
            }

            if (chartCtrl.isExplore) {
                chartCtrl.selectedEngine = "";
            }

            /****** Data table functions *******/
            chartCtrl.isTableShown = (chartCtrl.visualType === "GridTable" || chartCtrl.visualType === "GridRAWTable");
            chartCtrl.toggleDataTable = function () {
                chartCtrl.isTableShown = !chartCtrl.isTableShown;
            };

            /****** Saving SVG  *******/
            chartCtrl.savesvg = function () {

                //Code to save viz as an html instead of SVG

                    //downloadCurrentDocument("#chart-graph-canvas");
                    //
                    //function downloadCurrentDocument(id) {
                    //    var html = getElementChildrenAndStyles(id);
                    //    var base64doc = btoa(unescape(encodeURIComponent(html))),
                    //        a = document.createElement('a'),
                    //        e = document.createEvent("HTMLEvents");
                    //
                    //    a.download = 'doc.html';
                    //    a.href = 'data:text/html;base64,' + base64doc;
                    //    e.initEvent('click');
                    //    a.dispatchEvent(e);
                    //}
                    //
                    //function getElementChildrenAndStyles(selector) {
                    //    var html = '';
                    //
                    //    function outerHTML(node) {
                    //        return node.outerHTML || new XMLSerializer().serializeToString(node);
                    //    }
                    //
                    //    var element = document.getElementById('chart-graph-canvas');
                    //    if (!element) {
                    //        element = document.getElementById('singleContent')
                    //    }
                    //    html += outerHTML(element);
                    //    selector = selector.split(",").map(function (subselector) {
                    //        return subselector + "," + subselector + " *";
                    //    }).join(",");
                    //    var elts = angular.element(selector);
                    //    var rulesUsed = [];
                    //    // main part: walking through all declared style rules
                    //    // and checking, whether it is applied to some element
                    //    var sheets = document.styleSheets;
                    //    for (var c = 0; c < sheets.length; c++) {
                    //        var rules = sheets[c].rules || sheets[c].cssRules;
                    //        if (rules) {
                    //            for (var r = 0; r < rules.length; r++) {
                    //                var selectorText = rules[r].selectorText;
                    //                if (selectorText && selectorText.indexOf('[ng:cloak]') < 0) {
                    //                    var matchedElts = $(selectorText);
                    //                    for (var i = 0; i < elts.length; i++) {
                    //                        if (matchedElts.index(elts[i]) != -1) {
                    //                            rulesUsed.push(rules[r]);
                    //                            break;
                    //                        }
                    //                    }
                    //                }
                    //            }
                    //
                    //        }
                    //    }
                    //    var style = rulesUsed.map(function (cssRule) {
                    //        var cssText;
                    //        if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
                    //            cssText = cssRule.style.cssText.toLowerCase();
                    //        } else {
                    //            cssText = cssRule.cssText;
                    //        }
                    //        // some beautifying of css
                    //        return cssText.replace(/(\{|;)\s+/g, "\$1\n  ").replace(/\A\s+}/, "}");
                    //        //                 set indent for css here ^
                    //    }).join("\n");
                    //
                    //    var script = '';
                    //    var canvases = document.getElementsByTagName("canvas");
                    //    if (canvases.length > 0) {
                    //        var canvasContexts = [];
                    //        for (var i = 0; i < canvases.length; i++) {
                    //            canvasContexts.push("'" + canvases[i].toDataURL() + "'");
                    //        }
                    //        //add script to add canvas
                    //        script += '' +
                    //            'window.onload = function() {\n' +
                    //            '    var canvases = document.getElementsByTagName("canvas");\n' +
                    //            '    var passedInImg=[' + canvasContexts + ']; \n' +
                    //            '    for(var i=0; i<canvases.length;i++){\n' +
                    //            '        var ctx=canvases[i].getContext("2d");\n' +
                    //            '        var img=new Image; \n' +
                    //            '        img.onload=function(){ctx.drawImage(this,0,0)};\n' +
                    //            '        img.src=passedInImg[i];\n' +
                    //            '    }' +
                    //            '}';
                    //
                    //    } else {
                    //        //add script for dynamic sizing of the svgs
                    //        script += '' +
                    //            'window.onresize = resize;\n' +
                    //            'function resize() {\n' +
                    //            '    var svgs = document.getElementsByTagName("svg");\n' +
                    //            '    for(var i =0; i <svgs.length; i ++){\n' +
                    //            '        var svg = svgs[i];\n' +
                    //            '        svg.setAttribute("width", "95%");\n' +
                    //            '        svg.setAttribute("height", "95%");\n' +
                    //            '    }\n' +
                    //            '}\n' +
                    //            'window.onload = function() {\n' +
                    //            '    var svgs = document.getElementsByTagName("svg");\n' +
                    //            '    for(var i =0; i <svgs.length; i ++){\n' +
                    //            '        var svg = svgs[i];\n' +
                    //            '        var w = svg.getAttribute("width").replace("px", "");\n' +
                    //            '        var h = svg.getAttribute("height").replace("px", "");\n' +
                    //            '        svg.setAttribute("viewBox", "0 0 " + w + " " + h);\n' +
                    //            '        svg.setAttribute("preserveAspectRatio", "xMinYMin meet");\n' +
                    //            '        svg.setAttribute("width", "95%");\n' +
                    //            '        svg.setAttribute("height", "95%");\n' +
                    //            '    }\n' +
                    //            '}';
                    //    }
                    //    return "<style>\n" + style + "\n</style>\n\n<script>\n" + script + "\n</script>\n\n" + html;
                    //}

                //Original Save SVG code

                var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

                $window.URL = ($window.URL || $window.webkitURL);

                var body = document.body,
                    emptySvg;

                var prefix = {
                    xmlns: "http://www.w3.org/2000/xmlns/",
                    xlink: "http://www.w3.org/1999/xlink",
                    svg: "http://www.w3.org/2000/svg"
                };

                initialize();

                function initialize() {
                    var documents = [$window.document],
                        SVGSources = [],
                        iframes = document.querySelectorAll("iframe"),
                        objects = document.querySelectorAll("object");

                    // add empty svg element
                    emptySvg = $window.document.createElementNS(prefix.svg, "svg");
                    $window.document.body.appendChild(emptySvg);
                    var emptySvgDeclarationComputed = getComputedStyle(emptySvg);

                    [].forEach.call(iframes, function (el) {
                        try {
                            if (el.contentDocument) {
                                documents.push(el.contentDocument);
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    });

                    [].forEach.call(objects, function (el) {
                        try {
                            if (el.contentDocument) {
                                documents.push(el.contentDocument);
                            }
                        } catch (err) {
                            console.log(err);
                        }
                    });

                    documents.forEach(function (doc) {
                        var newSources = getSources(doc, emptySvgDeclarationComputed);
                        // because of prototype on NYT pages
                        for (var i = 0; i < newSources.length; i++) {
                            SVGSources.push(newSources[i]);
                        }
                    });
                    if (SVGSources.length > 0) {
                        download(SVGSources[0]);
                    } else {
                        alert("The Crowbar couldn't find any SVG nodes.");
                    }

                }

                function getSources(doc, emptySvgDeclarationComputed) {
                    var svgInfo = [],
                        svgs = d3.select("#chart-graph-canvas").select("svg")[0];

                    [].forEach.call(svgs, function (svg) {

                        svg.setAttribute("version", "1.1");

                        // removing attributes so they aren't doubled up
                        svg.removeAttribute("xmlns");
                        svg.removeAttribute("xlink");

                        // These are needed for the svg
                        if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
                            svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
                        }

                        if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
                            svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
                        }

                        var source = (new XMLSerializer()).serializeToString(svg);
                        var rect = svg.getBoundingClientRect();
                        svgInfo.push({
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            class: svg.getAttribute("class"),
                            id: svg.getAttribute("id"),
                            childElementCount: svg.childElementCount,
                            source: [doctype + source]
                        });
                    });
                    return svgInfo;
                }

                function download(source) {
                    var url = $window.URL.createObjectURL(new Blob(source.source, {"type": "text\/xml"}));

                    var a = document.createElement("a");
                    body.appendChild(a);
                    a.setAttribute("download", "semoss" + ".svg");
                    a.setAttribute("href", url);
                    a.style["display"] = "none";
                    a.click();

                    $timeout(function () {
                        $window.URL.revokeObjectURL(url);
                    }, 10);
                }

            };

            chartCtrl.applyFilter = function () {
                if (!_.isEmpty($scope.dashboardController) && chartCtrl.isDataBound && !isDataBoundOnParameter()) {
                    //check to see if any bound items are objects (meaning it was bound on a parameter)
                    if (isDataBoundOnObject()) {
                        //filter regularly if bound on param
                        var allData = utilityService.filterDataWithFilterOptions(JSON.parse(JSON.stringify(multiViewService.getMultiViewChartData(chartCtrl.uniqueId).data)), chartCtrl.filterOptions);

                        chartCtrl.data.isFiltered = true;
                        chartCtrl.data.data = allData;
                        chartCtrl.data.filteredData = utilityService.filterTableUriData(allData);
                        notificationService.notify('chart-data-change', chartCtrl.data, chartCtrl.uniqueId);
                    } else {
                        //get what chartCtrl visualization is boundOn
                        var boundID = multiViewService.getBoundID(chartCtrl.uniqueId);
                        //perform joint filter for regular joins
                        joinDataService.setBoundFilter(boundID, JSON.parse(JSON.stringify(chartCtrl.filterOptions)));
                        notificationService.notify('join-filter-change', boundID);
                    }
                } else {
                    //no need to filter the data if the filter column is empty
                    if(!_.isEmpty(chartCtrl.filterColumn)) {
                        // This code block makes filter hit the backend
                        var filterData = {};
                        filterData[chartCtrl.filterColumn] = {};
                        filterData[chartCtrl.filterColumn]["values"] = [];
                        filterData[chartCtrl.filterColumn]["selectAll"] = chartCtrl.filterOptions[chartCtrl.filterColumn].selectAll;

                        if (!chartCtrl.filterOptions[chartCtrl.filterColumn].selectAll) {
                            for (var val in chartCtrl.filterOptions[chartCtrl.filterColumn].tempSelected) {
                                filterData[chartCtrl.filterColumn]["values"].push($filter("shortenValueFilter")(chartCtrl.filterOptions[chartCtrl.filterColumn].tempSelected[val]));
                            }
                        }

                        var insightID = chartCtrl.data.insightID;
                        monolithService.filterData(chartCtrl.insightData.engine, filterData, {insightID: insightID}, true)
                            .then(function (data) {
                                //for each header, determine available values & selected values for fpanel based on what the call returns
                                for (var header in data.unfilteredValues) {
                                    //available values
                                    chartCtrl.filterOptions[header].list = _.union(data.unfilteredValues[header], data.filteredValues[header]);
                                    //selected values
                                    chartCtrl.filterOptions[header].tempSelected = data.unfilteredValues[header];
                                    chartCtrl.filterOptions[header].selected = data.unfilteredValues[header];
                                    //select all
                                    if (chartCtrl.filterOptions[header].tempSelected.length === chartCtrl.filterOptions[header].list.length)
                                        chartCtrl.filterOptions[header].selectAll = true;
                                    else {
                                        chartCtrl.filterOptions[header].selectAll = false;
                                    }
                                    //isFiltered Check
                                    if (!_.isEmpty(data.filteredValues[header]))
                                        chartCtrl.filterOptions[header].isFiltered = true;
                                    else {
                                        chartCtrl.filterOptions[header].isFiltered = false;
                                    }
                                }
                                //actually filter the data
                                chartCtrl.filterData(chartCtrl.filterOptions);
                                chartCtrl.filterColumn = ""; //set this to empty so it doesn't make unnecesary calls if user click apply filter again with same options
                            });
                        // End block
                    }
                }
            };

            //takes the filterColumns and filters out the data that was removed and updates scope.data
            chartCtrl.filterData = function (filteredColumns) {
                //pulling the filtered data from the Btree
                monolithService.getTableFromBTree(chartCtrl.insightData.engine, chartCtrl.data.insightID).then(function (filteredData) {
                    //set the updated data so that the watch will be triggered and redraw the visualization
                    chartCtrl.data.isFiltered = true;
                    chartCtrl.data.data = filteredData.data;
                    chartCtrl.data.filteredData = utilityService.filterTableUriData(filteredData.data);
                    if (chartCtrl.viewType !== "single") {
                        multiViewService.setFilterOptions(chartCtrl.uniqueId, filteredColumns);
                    }
                    notificationService.notify('chart-data-change', chartCtrl.data, chartCtrl.uniqueId);
                });
            };

            //creates function for the join to join the correct rows
            var createAccessor = function (accessor) {
                return function (obj) {
                    return obj[accessor];
                };
            };

            /****** Utility Function  *******/
            chartCtrl.isEmpty = function (o) {
                return _.isEmpty(o);
            };

            chartCtrl.containerSize = function (containerClass, containerObj, marginObj) {
                containerObj.width = parseInt(d3.select("#" + chartCtrl.chart + "-append-viz").style("width"));
                containerObj.height = parseInt(d3.select("#" + chartCtrl.chart + "-append-viz").style("height"));

                containerObj.width = containerObj.width - marginObj.left - marginObj.right;
                containerObj.height = containerObj.height - marginObj.top - marginObj.bottom;
            };

            chartCtrl.downloadDataCSV = function () {
                var csvData = Papa.unparse(gridData()),
                    hiddenElement = document.createElement('a');

                hiddenElement.href = 'data:attachment/csv,' + encodeURI(csvData);
                hiddenElement.target = '_blank';
                hiddenElement.download = 'tableData.csv';
                hiddenElement.click();
            };

            var gridData = function () {
                return this.data.filteredData;
            }.bind(this);

            //set container width and height

            //whether or not to show the refresh button
            chartCtrl.checkDataClean = function () {
                var clean = true;

                if (isDataBoundOnParameter()) {
                    return true;
                }

                _.forEach(chartCtrl.filterOptions, function (filter) {
                    if (!filter.selectAll) {
                        clean = false;
                    }
                });
                return clean;
            };

            var isDataBoundOnParameter = function () {
                //get what chartCtrl visualization is boundOn
                var boundID = multiViewService.getBoundID(chartCtrl.uniqueId);
                var boundObj = joinDataService.getBoundOn(boundID);
                //check to see if any bound items are objects (meaning it was bound on a parameter)
                return _.some(boundObj, 'parameter');
            };

            var isDataBoundOnObject = function() {
                //get what chartCtrl visualization is boundOn
                var boundID = multiViewService.getBoundID(chartCtrl.uniqueId);
                var boundObj = joinDataService.getBoundOn(boundID);
                //check to see if any bound items are objects (meaning it was bound on a parameter)
                return _.some(boundObj, _.isObject);
            };

            //overwrite these functions in each specific viz to enable functionality
            //Processes data into correct format, allowing it to be rendered on a visualization
            chartCtrl.dataProcessor = function () {
                //console.log("Need to Add Function for Data Processing")
            };
            //highlights selected piece on a graph when a specific instance is selected
            chartCtrl.highlightSelectedItem = function (selectedItem) {
                //console.log("Need to Add Highlighting Feature")
            };
            //action that dynamically filters viz from viz (more useful in join)
            chartCtrl.filterAction = function () {
                //console.log("Need to Add Filtering Viz Feature")
            };
            //resizes visualization
            chartCtrl.resizeViz = function () {
                //console.log("Need To Add Resize Mechanism")
            };
            //seteditstandardmode
            chartCtrl.setEditMode = function () {
                //will be overriden in editstandardmode
            };

            chartCtrl.switchToBar = function () {
                chartCtrl.data.layout = "Column";
                chartCtrl.data.data.splice(0, 1);
                singleViewService.setSingleViewChartData(chartCtrl.data, singleViewService.getSingleViewStep(), 'Bar');
            };

            chartCtrl.switchToPie = function () {
                chartCtrl.data.layout = "Pie";
                chartCtrl.data.data.splice(0, 1);
                singleViewService.setSingleViewChartData(chartCtrl.data, singleViewService.getSingleViewStep(), 'Pie');
            };

            chartCtrl.updateParameter = function (selectedParam) {
                var paramGroup = joinDataService.getBoundOn(multiViewService.getBoundID(chartCtrl.uniqueId))[chartCtrl.uniqueId].parameter;
                registerSelectedParam(selectedParam.uri, paramGroup);
            };

            //check if item is bound, then perform correct operation
            chartCtrl.selectParam = function (paramValue, paramGroup) {
                if (chartCtrl.isDataBound) {
                    var boundId = multiViewService.getBoundID(chartCtrl.uniqueId);
                    var boundOn = joinDataService.getBoundOn(boundId)[chartCtrl.uniqueId];
                    if (_.isObject(boundOn)) {
                        joinDataService.setSelectedUri(JSON.parse(JSON.stringify(boundId)), [{uri: paramValue, id: chartCtrl.uniqueId, axisName: {parameter: paramGroup}}]);
                        notificationService.notify('join-select-change');
                    } else {
                        registerSelectedParam(paramValue, paramGroup);
                    }
                } else {
                    registerSelectedParam(paramValue, paramGroup);
                }
            };

            //update the selected item and check to see if all required params are selected
            var registerSelectedParam = function (paramValue, paramGroup) {
                //need to correctly set the selected value if it has the "depends" property
                if (chartCtrl.insightData.params[paramGroup].param.depends == "true") {
                    chartCtrl.insightData.params[paramGroup].selected[0] = paramValue;
                } else {
                    chartCtrl.insightData.params[paramGroup].selected = paramValue;
                }

                browseService.registerSelectedParam(chartCtrl.insightData.params[paramGroup].param, chartCtrl.insightData).then(function () {
                    updateInsightData();
                });
            };

            //check and see if all params are selected - update the chart if so
            var updateInsightData = function () {
                var allParamsSelected = true;
                chartCtrl.updateInsightList();
                for (var key in chartCtrl.insightData.params) {
                    if (chartCtrl.insightData.params[key].selected === "" || chartCtrl.insightData.params[key].selected.length === 0) {
                        allParamsSelected = false;
                        break;
                    }
                }
                if (allParamsSelected) {
                    updateChartData();
                }
            };

            //sets the insight list items
            chartCtrl.updateInsightList = function () {
                chartCtrl.masterParamList = [];

                for (var key in chartCtrl.insightData.params) {
                    var tempList = [];

                    //TODO: make sure the param list gets loaded when its a dashboard
                    if (chartCtrl.insightData.params[key].list) {
                        for (var i = 0; i < chartCtrl.insightData.params[key].list.length; i++) {
                            var paramUri, paramName, paramObj = {};

                            if (chartCtrl.insightData.params[key].param.depends == "true") {
                                paramName = $filter("shortenValueFilter")(chartCtrl.insightData.params[key].list[i][0]);
                                paramUri = chartCtrl.insightData.params[key].list[i][0]
                            }
                            else {
                                paramName = $filter("shortenValueFilter")(chartCtrl.insightData.params[key].list[i]);
                                paramUri = chartCtrl.insightData.params[key].list[i];
                            }

                            paramObj = {
                                name: paramName,
                                value: paramUri
                            };

                            tempList.push(paramObj);
                        }
                    }

                    tempList = _.sortByAll(tempList, ["name"]);

                    var selectedParamName = "";
                    if (!Array.isArray(chartCtrl.insightData.params[key].selected)) {
                        selectedParamName = chartCtrl.insightData.params[key].selected;
                    }
                    else {
                        if(!_.isEmpty(chartCtrl.insightData.params[key].selected)) { //TODO don't need this if statement once we switch to muti select
                            selectedParamName = chartCtrl.insightData.params[key].selected[0];
                        }
                    }

                    var selectedNameFinal = "";
                    if (selectedParamName !== "") {
                        selectedNameFinal = $filter("shortenValueFilter")(selectedParamName);
                    }

                    chartCtrl.masterParamList.push({
                        paramName: key,
                        selected: chartCtrl.insightData.params[key].selected,
                        selectedName: selectedNameFinal,
                        list: tempList
                    });
                }
            };

            //queries data with the new updated parameter
            var updateChartData = function () {
                chartCtrl.mainLoadingScreen = true;

                //make sure to update deleted data when in single mode
                if (chartCtrl.viewType === "single") {
                    var undoData = singleViewService.getSingleViewChartDataDeletion();
                    var undoProcessArray = [];

                    for (var i in undoData) {
                        if (undoData[i].stepID) {
                            undoProcessArray.push(undoData[i].stepID);
                        }
                    }

                    if (undoProcessArray.length > 0) {
                    }
                    monolithService.undoInsightProcess(singleViewService.getSpecificSingleViewInsightData(0).engine, singleViewService.getSpecificSingleViewChartData(0).insightID, undoProcessArray)
                        .then(function (data) {
                            getChartData();
                        }.bind(this));
                } else {
                    getChartData();
                }
            };

            var getChartData = function () {
                browseService.getChartData(chartCtrl.insightData, 'Updated Param', chartCtrl.viewType)
                    .then(function (success) {
                        chartCtrl.mainLoadingScreen = false;

                        if (success.viewtype != "multiView") {
                            chartCtrl.relatedInsights = [];
                        }
                        else if (success.viewtype === "multiView") {
                            if (chartCtrl.isDataBound) {
                                chartCtrl.data = JSON.parse(JSON.stringify(success.data));
                                chartCtrl.data.isParamModified = true;
                            } else {
                                multiViewService.setMultiViewInsightDataByIndex(chartCtrl.uniqueId, chartCtrl.insightData);
                                //TODO Get URI for an Insight
                                chartCtrl.relatedInsights = [];
                                multiViewService.setMultiViewChartDataByIndex(chartCtrl.uniqueId, success.data);
                                chartCtrl.insightData = JSON.parse(JSON.stringify(chartCtrl.insightData));
                                chartCtrl.data = JSON.parse(JSON.stringify(success.data));
                            }
                            notificationService.notify('chart-data-change', chartCtrl.data, chartCtrl.uniqueId);
                        }
                    });
            };
        }
    }
})();
