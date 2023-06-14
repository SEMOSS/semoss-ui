(function () {
    "use strict";
    /**
     * @name dashboard
     * @desc dashboard shows the status of the system
     */

    angular.module("app.dashboard.directive", [])
        .directive("dashboard", dashboard);

    dashboard.$inject = ["$rootScope", "$compile", 'VIZ_COLORS', '$filter', 'alertService', 'monolithService', 'vizdataService', 'utilityService'];

    function dashboard($rootScope, $compile, VIZ_COLORS, $filter, alertService, monolithService, vizdataService, utilityService) {
        dashboardLink.$inject = ["scope", "ele", "attrs", 'ctrl'];
        dashboardCtrl.$inject = ["$rootScope", "$scope"];
        return {
            restrict: "A",
            require: ["^chart"],
            priority: 300,
            templateUrl: 'custom/dashboard/dashboard.directive.html',
            link: dashboardLink,
            controller: dashboardCtrl
        };

        function dashboardLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];
            var dashboard = this;

            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;
            scope.chartCtrl.toolUpdateProcessor = toolUpdateProcessor;
            scope.getData = getData;
            scope.updateData = updateData;
            scope.clearFilter = clearFilter;
            scope.unfilter = unfilter;
            scope.createGantt = createGantt;
            scope.applySystemFilter = applySystemFilter;
            scope.filterOnDate = filterOnDate;

            //scope.getGroupSystemRelation = getGroupSystemRelation;


            //declare and initialize local variables
            var dashboard,
                uriData;
                // html = '<div id=' + scope.chartCtrl.chartName + "-append-viz" + ' style="overflow:auto"><div id=' + scope.chartCtrl.chartName + '></div></div>';

            // ele.append($compile(html)(scope));

            scope.painPoints = "";
            scope.filterPainPointOn = "";
            scope.dataTableAlign;
            //scope.painPoint = "";//Single selected pain point

            //JQuery that sets overflow to auto on widget level only for status dashboard widgets
            $('.dashboard-table-container').parents("div.absolute-size.white-fill.overflow-y-auto.overflow-x-auto").css("overflow", "auto");
            /****************Data Functions*************************/


            /**dataProcessor gets called from chart and is where the data manipulation happens for the viz
             *
             * @param newData
             */
            function dataProcessor(newData) {

                var headers = [];
                if (newData.dataTableAlign) {
                    for (var header in newData.dataTableAlign) {
                        headers.push(newData.dataTableAlign[header]);
                    }
                } else {
                    for (var header in newData.headers) {
                        headers.push(newData.headers[header].title);
                    }
                }
                newData.treeData = processTableData(JSON.parse(JSON.stringify(newData.filteredData)), headers);

                // newData.filteredData = formatObjectToTreeStructure(newData, newData.dataTableAlign.group1, newData.dataTableAlign.group2);

                scope.newData = newData;

                console.log(newData);

                update();

            }

            //pass in all of the tabular data and the selected levels (dataTableAlign); we will set up the tree data according to the order of the data table align
            function processTableData(data, tableHeaders) {
                var allHash = {}, list = [], rootMap = {}, currentMap = {};

                for (var i in data) { //all of this is to change it to a tree structure and then call makeTree to structure the data appropriately for this viz
                    var count = 0;

                    for (var j = 0; j < tableHeaders.length; j++) {
                        if(tableHeaders[j] != ""){
                            var currentValue = data[i][tableHeaders[j].replace(/[_]/g, " ")].toString().replace(/["]/g, ""), nextMap = {};

                            if (count === 0) { // will take care of the first level and put into rootmap if it doesnt already exist in rootmap
                                currentMap = rootMap[currentValue];

                                if (!currentMap) {
                                    currentMap = {};
                                    rootMap[currentValue] = currentMap;
                                }

                                nextMap = currentMap;
                                count++;
                            } else {
                                nextMap = currentMap[currentValue];

                                if (!nextMap) {
                                    nextMap = {};
                                    currentMap[currentValue] = nextMap;
                                }

                                currentMap = nextMap;
                            }
                        }
                    }
                }

                makeTree(rootMap, list);

                allHash["name"] = "root";
                allHash["children"] = list;
                return allHash;
            }

            function makeTree(map, list) {
                var keyset = Object.keys(map),
                    childSet = [];

                for (var key in keyset) {
                    var childMap = map[keyset[key]],
                        dataMap = {};

                    dataMap["name"] = keyset[key];

                    if (_.isEmpty(childMap)) {
                        list.push(dataMap);
                    } else {
                        dataMap["children"] = childSet;
                        list.push(dataMap);

                        makeTree(childMap, childSet);
                        childSet = [];
                    }
                }
            }

            function toolUpdateProcessor (toolUpdateConfig) {
                //console.log(toolUpdateConfig);
                scope[toolUpdateConfig.fn](toolUpdateConfig.args);

                //if (toolUpdateConfig.fn === 'color-change') {
                //    scope.chartCtrl.dataProcessor(toolUpdateConfig.args);
                //} else {
                //    //need to invoke tool functions
                //    scope[toolUpdateConfig.fn](toolUpdateConfig.args);
                //}
            };

            function getData(){
                monolithService.runPlaySheetMethod(null, scope.chartCtrl.data.insightID, {}, "getData").then(function (response) {
                    var testVar = JSON.parse(JSON.stringify(response));
                    //console.log("IN GET DATA");
                    //console.log(testVar);
                    scope.styling = testVar['Styling'];
                    var formattedData = utilityService.formatTableData(testVar.headers, testVar.data, true);
                    scope.headers = formattedData.headers;
                    scope.dashboardData = formattedData.data;
                    scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);
                }.bind());

            }

            function updateData(args){
                var keyName = args.Name;
                var toolData = {};// [keyName, args.Value];
                toolData[keyName] = args.Value;
                monolithService.runPlaySheetMethod(null, scope.chartCtrl.data.insightID, args, "filter").then(function (response) {
                    var newData = JSON.parse(JSON.stringify(response));
                    var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                    scope.headers = formattedData.headers;
                    scope.dashboardData = formattedData.data;
                    scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);
                }.bind());
            }

            function createGantt(){
                monolithService.runPlaySheetMethod(null, scope.chartCtrl.data.insightID, {"SDLC" : "Requirement", "GROUP": "Funding", "DHA" : "SDD"}, "createGanttInsight").then(function (response) {
                    var newData = JSON.parse(JSON.stringify(response));
                    //var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                }.bind());
            }

            function clearFilter(){
                update();
            }

            function unfilter(){
                monolithService.runPlaySheetMethod(null, scope.chartCtrl.data.insightID, {}, "unfilter").then(function (response) {
                    var testVar = JSON.parse(JSON.stringify(response));
                    scope.styling = testVar.styling;
                    var formattedData = utilityService.formatTableData(testVar.headers, testVar.data, true);
                    scope.headers = formattedData.headers;
                    scope.dashboardData = formattedData.data;
                    //scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);
                    scope.levelOneHeaders = scope.SDLCList;
                }.bind());

            }

            function applySystemFilter(system){
                monolithService.runPlaySheetMethod(null, scope.chartCtrl.data.insightID, system, "filter").then(function (response) {
                    var newData = JSON.parse(JSON.stringify(response));
                    var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                    scope.headers = formattedData.headers;
                    scope.dashboardData = formattedData.data;
                    scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);


                }.bind());
            }

            function filterOnDate(date){

                var sendToFilter = {"UploadDate": [date[0]]};
                monolithService.runPlaySheetMethod(null, scope.chartCtrl.data.insightID, sendToFilter, "filter").then(function (response) {
                    var newData = JSON.parse(JSON.stringify(response));
                    var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                    scope.headers = formattedData.headers;
                    scope.dashboardData = formattedData.data;
                    scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);
                }.bind());

            }


            /****************Update Functions*************************/
            function update() {
                //scope.getData();

                //scope.getGroupSystemRelation();
            }
            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
            });
        }

        function dashboardCtrl($rootScope, $scope) {
            var dashboard = this;
            var newData;
            $scope.filterData = filterData;
            $scope.getGroups = getGroups;

            function filterData(data, filter) {

                var filterList = [], constructedObject = [];

                data.children = data.data;

                for (var index = 0; index < data.children.length; index++) {
                    var filterindex = filterList.indexOf(data.children[index][filter]);

                    if (filterindex == -1) {
                        filterList.push(data.children[index][filter]);

                        var tempChildren = {};
                        tempChildren[data.dataTableAlign.group1] = data.children[index][filter];

                        constructedObject.push(tempChildren);

                    }


                }

                return constructedObject;
            }

            function getGroups(data, header, filter) {

                var filterList = [], constructedObject = [];

                data.children = data.data;

                for (var index = 0; index < data.children.length; index++) {

                    if(header[filter] == data.children[index][filter]){
                        var tempChildren = {};
                        tempChildren[data.dataTableAlign.group2] = data.children[index][data.dataTableAlign.group2];

                        if(filterList.indexOf(tempChildren[data.dataTableAlign.group2]) == -1){
                            constructedObject.push(tempChildren);
                            filterList.push(tempChildren[data.dataTableAlign.group2]);
                        }
                    }
                }

                return constructedObject;
            }
        }
    }

})();
