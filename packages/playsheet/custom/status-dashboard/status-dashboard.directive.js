(function () {
    "use strict";
    /**
     * @name statusDashboard
     * @desc statusDashboard shows the status of the system
     */

    angular.module("app.status-dashboard.directive", [])
        .directive("statusDashboard", statusDashboard);

    statusDashboard.$inject = ["$rootScope", "$compile", 'VIZ_COLORS', '$filter', 'dataService', 'alertService', 'monolithService', 'vizdataService', 'utilityService'];

    function statusDashboard($rootScope, $compile, VIZ_COLORS, $filter, dataService, alertService, monolithService, vizdataService, utilityService) {
        statusDashboardLink.$inject = ["scope", "ele", "attrs", 'ctrl'];
        statusDashboardCtrl.$inject = ["$rootScope", "$scope"];
        return {
            restrict: "A",
            require: ["^chart"],
            priority: 300,
            templateUrl: 'custom/status-dashboard/status-dashboard.directive.html',
            link: statusDashboardLink,
            controller: statusDashboardCtrl
        };

        function statusDashboardLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];
            var statusDashboard = this;

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

            scope.heatValueColor = 5;

            //scope.getGroupSystemRelation = getGroupSystemRelation;


            //declare and initialize local variables
            var statusDashboard,
                uriData,
                html = '<div id=' + scope.chartCtrl.chartName + "-append-viz" + ' style="overflow:auto"><div id=' + scope.chartCtrl.chartName + '></div></div>';

            ele.append($compile(html)(scope));

            scope.painPoints = "";
            scope.filterPainPointOn = "";
            scope.dataTableAlign;
            //scope.painPoint = "";//Single selected pain point

            //JQuery that sets overflow to auto on widget level only for status dashboard widgets
            $('.heat-table-container').parents("div.absolute-size.white-fill.hidden-overflow").css("overflow", "auto");
            /****************Data Functions*************************/


            /**dataProcessor gets called from chart and is where the data manipulation happens for the viz
             *
             * @param newData
             */
            function dataProcessor(newData) {

                console.log(newData);

                //var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                //angular.extend(newData, formattedData);

                scope.headers = newData.headers;
                scope.dashboardData = newData.data;
                scope.dataTableAlign = newData.dataTableAlign;
                scope.styling = newData.styling;//use this for styling
                scope.layout = newData.layout;
                scope.systemOwners = newData.SystemOwner;

                if(scope.styling === "Anthem"){
                    scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);

                    if(scope.layout === "prerna.ui.components.specific.anthem.AnthemPainpointsPlaysheet"){
                        scope.source = scope.getSourceList(scope.dashboardData);
                        scope.filteredPainPoints = scope.getPainpoint();
                    }

                    if(scope.layout === "prerna.ui.components.specific.anthem.AnthemInitiativePlaysheet"){
                        scope.filteredInitiatives = scope.getInitiatives();
                        scope.initiativeDomain = scope.getInitiativeDomain(scope.dashboardData);
                    }

                }
                else{
                    scope.system = newData.System;
                    //scope.selectedDate = scope.getMostRecentUpload(newData.UploadDate);
                    //scope.uploadDate = newData.UploadDate;
                    scope.SDLCList = JSON.parse(JSON.stringify(newData["SDLCList"]));
                    scope.levelOneHeaders = newData["SDLCList"];//scope.getHeaders(scope.dashboardData, scope.headers);
                }

                update();

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
                    if (newData !== ""){
                        var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                        scope.headers = formattedData.headers;
                        scope.dashboardData = formattedData.data;
                        scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);
                    }
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
                    if(newData !== ""){
                        var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                        scope.headers = formattedData.headers;
                        scope.dashboardData = formattedData.data;
                        scope.levelOneHeaders = scope.getHeaders(scope.dashboardData, scope.headers);
                    }
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

        function statusDashboardCtrl($rootScope, $scope) {
            var statusDashboard = this;

            $scope.getGroups = getGroups;
            $scope.getDhaGroups = getDhaGroups;
            $scope.getHeaders = getHeaders;
            $scope.getHeatScore = getHeatScore;
            $scope.getHeatScoreStyle = getHeatScoreStyle;
            $scope.getMinValue = getMinValue;
            $scope.getMinActivityVal = getMinActivityVal;
            $scope.getPainpoint = getPainpoint;
            $scope.getInitiatives = getInitiatives;
            $scope.colorPainPoint = colorPainPoint;
            $scope.colorInitiative = colorInitiative;
            $scope.isPainPoint = isPainPoint;
            $scope.isInitiative = isInitiative;
            $scope.openGantt = openGantt;
            $scope.displayInfo = displayInfo;
            $scope.filterPainPoints = filterPainPoints;
            $scope.filterInitiative = filterInitiative;
            $scope.colorDHAGroups = colorDHAGroups;
            $scope.getMostRecentUpload = getMostRecentUpload;
            //$scope.formatUploadDate = formatUploadDate;
            $scope.getSourceList = getSourceList;
            $scope.getInitiativeDomain = getInitiativeDomain;
            $scope.containsPainPoint = containsPainPoint;
            $scope.containsInitiative = containsInitiative;
            $scope.getStartDate = getStartDate;
            $scope.getEndDate = getEndDate;
            $scope.getSlackOrDelay = getSlackOrDelay;
            $scope.isBoxActive = isBoxActive;

            statusDashboard.createViz = createViz;
            statusDashboard.getChartData = getChartData;

            //Initialize heat value color at 0
            $scope.heatValueColor = 0;
            $scope.painPoint = "None Selected";


            /**
             * @name createViz
             * @params insight {object} the selected insight to create - selected by the user from the insight list
             * @desc begins the process to create a visualization
             */
            function createViz(insight, paramList) {
                statusDashboard.selectedInsight = JSON.parse(JSON.stringify(insight));
                statusDashboard.mainLoadingScreen = true;
                vizdataService.createViz(statusDashboard.selectedInsight).then(function (output) {
                    if (output.state === "noParams") {
                        statusDashboard.selectedInsight.params = {};
                        statusDashboard.getChartData(statusDashboard.selectedInsight);
                    }
                    else if (output.state === "notAllSelected") {
                        //param modal needs to show up
                        statusDashboard.selectedInsight.params = output.paramList;
                        statusDashboard.mainLoadingScreen = false;
                        //statusDashboard.openParamSelection(); //***comment this out for param-in-widget, comment in the line below

                        statusDashboard.selectedInsight.params[$scope.dataTableAlign["levelTwo"]].selected = $filter("replaceSpaces")(paramList[$scope.dataTableAlign["levelTwo"]]);
                        statusDashboard.selectedInsight.params[$scope.dataTableAlign["levelThree"]].selected = $filter("replaceSpaces")(paramList[$scope.dataTableAlign["levelThree"]]);
                        statusDashboard.selectedInsight.params[$scope.dataTableAlign["levelOne"]].selected = $filter("replaceSpaces")(paramList[$scope.dataTableAlign["levelOne"]]);
                        statusDashboard.getChartData(statusDashboard.selectedInsight);
                        //$rootScope.$emit('playbook-receive', 'search-add-params-viz', statusDashboard.selectedInsight);
                    }
                    else if (output.state === "AllSelected") {
                        search.selectedInsight.params = output.paramList;
                        search.getChartData(search.selectedInsight);
                    }
                }, function (errMsg) {
                    statusDashboard.mainLoadingScreen = false;
                    alertService(errMsg, "Error", "toast-error", 3000);
                });
            }

            /**
             * @name getChartData
             * @params insight {object} the selected insight to create - selected by the user from the insight list
             * @desc makes the call to vizdataService to pull the data associated with a specific insight. tells the playbook that there is new data
             */
            function getChartData(insight) {
                statusDashboard.mainLoadingScreen = true;
                statusDashboard.showSearch = false;
                $rootScope.$emit("pub-sub-receive", "add-new-widget",{insightData: insight});
                //TODO ville determine if data.mashup stuff is used below
                // vizdataService.getChartData(insight).then(function (insight, data) {
                //     statusDashboard.mainLoadingScreen = false;
                //     if (data) {
                //         if (data.mashup) {
                //             data.mashup.specificData = data.mashup.specificData.replace(/\n/g, "");
                //             vizdataService.getDashboardData(JSON.parse(data.mashup.specificData)).then(function (data) {
                //                 $rootScope.$emit('playbook-receive', 'widget-add', data);
                //             });
                //         } else {
                //             console.log(insight);
                //             console.log(data);
                //             var dataToSend = {
                //                 groupedData: {
                //                     label: "Original",
                //                     insightData: insight,
                //                     chartData: data.chartData,
                //                     comments: {list: {}, maxId: 0},
                //                     panelConfig: {}
                //                 }
                //                 ,
                //                 showCreate: false
                //             };
                //
                //             var pkqlDataToSend = data.pkqlOutput;
                //
                //
                //
                //             //Make call to data service to addnewwidgettosheet
                //             // dataService.addWidgetToSheet(dataToSend, pkqlDataToSend);
                //
                //             //$rootScope.$emit('playbook-receive', 'search-get-chart-data', dataToSend);
                //         }
                //     }
                // }.bind({}, insight));
            }

            function openGantt(header, group, dhaGroup){

                //If it is not the MHS status dash, don't open a new insight
                if($scope.styling !== "MHS"){
                    return;
                }


                var insight = {
                    core_engine: "Tap_Readiness_Database",
                    core_engine_id: "12"
                };

                var paramList = {ActivityGroup: group, DHAGroup: dhaGroup, SDLCPhase: header};

                statusDashboard.createViz(insight, paramList);

                //$scope.getGroupSystemRelation();
            }

            function getHeaders(data, headers){

                var headersObject = _.uniqBy(data, $scope.dataTableAlign["levelOne"]);
                var levelOneHeaders = [];
                var j=0;
                for(var i=0; i < headersObject.length; i++)
                {
                    if(headersObject[i][$scope.dataTableAlign["levelOne"]]){
                        levelOneHeaders[j] = headersObject[i][$scope.dataTableAlign["levelOne"]]
                        j++;
                    }
                }

                if($scope.styling === 'Anthem') {
                    return levelOneHeaders;
                }
                else{
                    //Make a copy of ordered SDLC List
                    var orderedHeaders = JSON.parse(JSON.stringify($scope.SDLCList));
                    var finalHeaders = [];

                    //Reorder the selected headers based on the original list passed in
                    for(var i = 0; i < orderedHeaders.length; i++) {
                        for(var j = 0; j < levelOneHeaders.length; j++){
                            if(orderedHeaders[i] === levelOneHeaders[j]) {
                                finalHeaders.push(levelOneHeaders[j]);
                            }
                        }

                    }

                    return finalHeaders;
                }
            }

            function getGroups(data, phaseName){
                var keyValue = String($scope.dataTableAlign["levelOne"]);
                var filterObject = {[keyValue] : phaseName};
                var findObject = _.filter(data, filterObject);
                var groupNames = [];

                for(var i = 0; i < findObject.length;i++){
                    groupNames.push(findObject[i][$scope.dataTableAlign["levelTwo"]]);
                }
                var filteredGroupNames = _.uniq(groupNames);
                return filteredGroupNames;
            }

            function getDhaGroups(data, phaseName, groupName){
                var keyValueOne=String($scope.dataTableAlign["levelOne"]);
                var keyValueTwo=String($scope.dataTableAlign["levelTwo"]);

                var filterObjectOne = {[keyValueOne]: phaseName};
                var filterObjectTwo = {[keyValueTwo]: groupName};
                var findObject = _.filter(data, filterObjectOne);
                var findDha = _.filter(findObject, filterObjectTwo);
                var groupNames = [];
                var keyValueThree = String($scope.dataTableAlign["levelThree"]);

                for(var i = 0; i < findDha.length;i++){
                    groupNames.push(findDha[i][keyValueThree]);
                }

                var filteredGroupNames = _.uniq(groupNames);
                return filteredGroupNames;
                //return findDha;

            }

            function getPainpoint(){
                var painPoints = [];
                var j = 0;
                for(var i=0; i < $scope.dashboardData.length; i++){
                    if($scope.dashboardData[i]['PAIN_POINT_DESCRIPTION']){
                        painPoints[j] = $scope.dashboardData[i]['PAIN_POINT_DESCRIPTION'];
                        j++;
                    }
                }
                return _.uniq(painPoints);
            }

            function getInitiatives(){
                var initiatives = [];
                for(var i=0; i < $scope.dashboardData.length; i++){
                    initiatives[i] = $scope.dashboardData[i]['INITIATIVE_NAME'];
                }
                return _.uniq(initiatives);
            }

            function colorPainPoint(painPoint){
                var keyValue = "PAIN_POINT_DESCRIPTION";

                var filterObject = {[keyValue]: painPoint};
                var filteredData = _.filter($scope.dashboardData, filterObject);
                $scope.painPoints = filteredData;
                $scope.selectedPainPoint = painPoint;
            }

            function colorInitiative(initiative){
                var keyValue = "INITIATIVE_NAME";

                var filterObject = {[keyValue]: initiative};
                var filteredData = _.filter($scope.dashboardData, filterObject);
                $scope.initiatives = filteredData;
                $scope.selectedInitiative = initiative;
            }

            function isPainPoint(param){
                if(param == null || $scope.painPoints == null){
                    return "";
                }
                else{
                    for(var i=0; i < $scope.painPoints.length;i++){
                        if(param === $scope.painPoints[i][$scope.headers[2].title]){
                            return "pain-point-l3";
                        }
                    }
                    return "";
                }
            }

            function isInitiative(param){
                if(param == null || $scope.initiatives == null){
                    return "";
                }
                else{
                    for(var i=0; i < $scope.initiatives.length;i++){
                        if(param === $scope.initiatives[i]["OBA_L2"]){

                            if($scope.initiatives[i]["IMPACT_TYPE"] === "High"){
                                //orange
                                return "init-high-l3";
                            }
                            else if($scope.initiatives[i]["IMPACT_TYPE"] === "Medium"){
                                //yellow
                                return "init-medium-l3";
                            }
                            else if($scope.initiatives[i]["IMPACT_TYPE"] === "Low"){
                                //green
                                return "init-low-l3";
                            }
                            else if($scope.initiatives[i]["IMPACT_TYPE"] === "Opportunity"){
                                //Blue
                                return "init-opportunity-l3";
                            }
                            else if($scope.initiatives[i]["IMPACT_TYPE"] === "Dependency"){
                                //Purple
                                return "init-dependency-l3";
                            }
                            else{
                                return "";
                            }

                        }
                    }
                    return "";
                }
            }

            function getHeatScore(data, levelOne, levelTwo, levelThree){
                var headers = $scope.headers;

                var filteredObject = [];

                for(var i=0; i < data.length; i++){
                    if(data[i][$scope.dataTableAlign["levelOne"]]=== levelOne){
                        filteredObject.push(data[i]);
                    }
                }
                var filteredObject2 = [];

                for(i=0; i < filteredObject.length; i++){
                    if(filteredObject[i][$scope.dataTableAlign["levelTwo"]] === levelTwo){
                        filteredObject2.push(filteredObject[i]);
                    }
                }

                var filteredObject3 = [];

                for(i=0; i < filteredObject2.length; i++){
                    if(filteredObject2[i][$scope.dataTableAlign["levelThree"]] === levelThree){
                        filteredObject3.push(filteredObject2[i]);
                    }
                }

                if(filteredObject3[0][$scope.dataTableAlign['STATUS']] === 'completed' && filteredObject3[0][$scope.dataTableAlign['heatValue']] < 1) {
                    return "-";
                }

                return filteredObject3[0][$scope.dataTableAlign['heatValue']];
            }

            function getHeatScoreStyle(data, levelOne, levelTwo, levelThree){
                var headers = $scope.headers;

                var filteredObject = [];

                for(var i=0; i < data.length; i++){
                    if(data[i][$scope.dataTableAlign["levelOne"]]=== levelOne){
                        filteredObject.push(data[i]);
                    }
                }
                var filteredObject2 = [];

                for(i=0; i < filteredObject.length; i++){
                    if(filteredObject[i][$scope.dataTableAlign["levelTwo"]] === levelTwo){
                        filteredObject2.push(filteredObject[i]);
                    }
                }

                var filteredObject3 = [];

                for(i=0; i < filteredObject2.length; i++){
                    if(filteredObject2[i][$scope.dataTableAlign["levelThree"]] === levelThree){
                        filteredObject3.push(filteredObject2[i]);
                    }
                }

                if(filteredObject3[0][$scope.dataTableAlign['STATUS']] === "completed"){

                    if(filteredObject3[0][$scope.dataTableAlign['heatValue']] > 0) {
                        return "red";
                    }
                    else{
                        return "black";
                    }
                }
                else if(filteredObject3[0][$scope.dataTableAlign['heatValue']] === $scope.heatValueColor){
                    return "black";
                }
                else if(filteredObject3[0][$scope.dataTableAlign['heatValue']] < $scope.heatValueColor){
                    return "red";
                }
                else if(filteredObject3[0][$scope.dataTableAlign['heatValue']] > $scope.heatValueColor){
                    return "green";
                }
                else{
                    return "black";
                }
            }

            function getMinActivityVal(dashboardData,header, group, dha){

            }

            function getMinValue(data, levelOne, levelTwo, levelThree){

                var filteredObject = [];

                for(var i=0; i < data.length; i++){
                    if(data[i][$scope.dataTableAlign["levelOne"]]=== levelOne){
                        filteredObject.push(data[i]);
                    }
                }
                var filteredObject2 = [];

                for(i=0; i < filteredObject.length; i++){
                    if(filteredObject[i][$scope.dataTableAlign["levelTwo"]] === levelTwo){
                        filteredObject2.push(filteredObject[i]);
                    }
                }

                var filteredObject3 = [];

                for(i=0; i < filteredObject2.length; i++){
                    if(filteredObject2[i][$scope.dataTableAlign["levelThree"]] === levelThree){
                        filteredObject3.push(filteredObject2[i]);
                    }
                }
                return filteredObject3[0][$scope.dataTableAlign['minValue']];
            }

            function displayInfo(){
                if($scope.displayInfoBoolean){
                    $scope.displayInfoBoolean = false;
                }
                else{
                    $scope.displayInfoBoolean = true;
                }
            }

            function filterPainPoints(filterOn){

                if(filterOn == null) {
                    var data = JSON.parse(JSON.stringify($scope.dashboardData));
                    var filteredPainPoints = [];
                    for(var i = 0; i < data.length; i++){
                        if(data[i]["PAIN_POINT_DESCRIPTION"]){
                            filteredPainPoints.push(data[i]["PAIN_POINT_DESCRIPTION"]);
                        }
                    }

                }
                else{//Only return pain points on this filter
                    var painPoints = $scope.getPainpoint();
                    var data = JSON.parse(JSON.stringify($scope.dashboardData));

                    var filteredPainPoints = [];
                    for(var i = 0 ; i < data.length; i++) {
                        if(data[i]['SOURCE_DOMAIN_FK'] === filterOn){
                            if(data[i]["PAIN_POINT_DESCRIPTION"]){
                                filteredPainPoints.push(data[i]["PAIN_POINT_DESCRIPTION"]);
                            }
                        }
                    }

                }

                filteredPainPoints = _.uniq(filteredPainPoints);
                $scope.filteredPainPoints = filteredPainPoints;
                return filteredPainPoints.sort();


            }

            function filterInitiative(filterOn){
                if(filterOn == null) {
                    var data = JSON.parse(JSON.stringify($scope.dashboardData));
                    var filteredInitiatives = [];
                    for(var i = 0; i < data.length; i++){
                        filteredInitiatives.push(data[i]["INITIATIVE_NAME"]);
                    }

                }
                else{//Only return pain points on this filter
                    var data = JSON.parse(JSON.stringify($scope.dashboardData));

                    var filteredInitiatives = [];
                    for(var i = 0 ; i < data.length; i++) {
                        if(data[i]['INITIATIVE_DOMAIN_FK'] === filterOn){
                            filteredInitiatives.push(data[i]["INITIATIVE_NAME"]);
                        }
                    }

                }

                filteredInitiatives = _.uniq(filteredInitiatives);
                $scope.filteredInitiatives = filteredInitiatives;
                return filteredInitiatives.sort();
            }

            function colorDHAGroups(selectedValue){
                //set heat value color to slider value
                $scope.heatValueColor = selectedValue;


            }

            function getMostRecentUpload(dateList){


                ///get greatest year

                //get greatest month

                //get greatest day


                console.log(dateList);
                var dateArray = [];

                for(var i = 0; i < dateList.length; i++){
                    dateArray.push(new Date(dateList[i][0]));
                }

                dateArray.sort(function(a,b){
                    return b-a;
                });

                var mostRecent = dateArray[0]

                var dd = mostRecent.getDate();
                var mm = mostRecent.getMonth()+1; //January is 0!

                var yyyy = mostRecent.getFullYear();
                if(dd<10){
                    dd='0'+dd
                }
                //if(mm<10){
                //    mm='0'+mm
                //}
                var mostRecent = mm+'-'+dd+'-'+yyyy;
                return "6-29-2016";
            }


            function getSourceList(data){
                var sourceList = [];
                var sources = []

                for(var i = 0; i < data.length; i++){
                    if(data[i]["SOURCE_DOMAIN_FK"]){
                        sourceList.push(data[i]["SOURCE_DOMAIN_FK"]);
                    }
                }

                sourceList = _.uniq(sourceList);

                return sourceList.sort();
            }

            function getInitiativeDomain(data){
                var sourceList = [];
                for(var i = 0; i < data.length; i++){
                    if (data[i]["INITIATIVE_DOMAIN_FK"]){
                        sourceList.push(data[i]["INITIATIVE_DOMAIN_FK"]);
                    }
                }

                sourceList = _.uniq(sourceList);

                return sourceList.sort();
            }

            function containsPainPoint(level, value) {
                var data = JSON.parse(JSON.stringify($scope.dashboardData));
                var dataTableAlign = $scope.dataTableAlign;
                var painPoint = $scope.selectedPainPoint;
                if(level === 'levelOne'){
                    //if this contains paint point in sub group, return pain-point-l1
                    var newData = _.filter(data, [dataTableAlign['levelOne'], value]);
                    //Check if an entry contains a painPoint
                    for(var i = 0; i < newData.length; i ++){
                        if(newData[i]['PAIN_POINT_DESCRIPTION'] === painPoint){
                            return "pain-point-l1";
                        }
                    }
                }
                else if(level === 'levelTwo'){
                    //if this contains paint point in sub group, return pain-point-l1
                    var newData = _.filter(data, [dataTableAlign['levelTwo'], value]);
                    //Check if an entry contains a painPoint
                    for(var i = 0; i < newData.length; i ++){
                        if(newData[i]['PAIN_POINT_DESCRIPTION'] === painPoint){
                            return "pain-point-l2";
                        }
                    }
                }
            }

            function containsInitiative(level, value) {
                var data = JSON.parse(JSON.stringify($scope.dashboardData));
                var dataTableAlign = $scope.dataTableAlign;
                var initiative = $scope.selectedInitiative;
                if(level === 'levelOne'){
                    var newData = _.filter(data, [dataTableAlign['levelOne'], value]);
                    //Check if an entry contains a painPoint
                    for(var i = 0; i < newData.length; i ++){
                        if(newData[i]['INITIATIVE_NAME'] === initiative){
                            //If strucutre for all colors
                            if(newData[i]['IMPACT_TYPE'] === "High"){
                                //orange
                                return "init-high-l1";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Medium"){
                                //yellow
                                return "init-medium-l1";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Low"){
                                //green
                                return "init-low-l1";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Opportunity"){
                                //Blue
                                return "init-opportunity-l1";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Dependency"){
                                //Purple
                                return "init-dependency-l1";
                            }
                            else{
                                return "";
                            }
                        }

                    }
                }
                else if(level === 'levelTwo'){
                    //if this contains paint point in sub group, return pain-point-l1
                    var newData = _.filter(data, [dataTableAlign['levelTwo'], value]);
                    //Check if an entry contains a painPoint
                    for(var i = 0; i < newData.length; i ++){
                        if(newData[i]['INITIATIVE_NAME'] === initiative){
                            if(newData[i]['IMPACT_TYPE'] === "High"){
                                //orange
                                return "init-high-l2";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Medium"){
                                //yellow
                                return "init-medium-l2";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Low"){
                                //green
                                return "init-low-l2";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Opportunity"){
                                //Blue
                                return "init-opportunity-l2";
                            }
                            else if(newData[i]['IMPACT_TYPE'] === "Dependency"){
                                //Purple
                                return "init-dependency-l2";
                            }
                            else{
                                return "";
                            }
                        }

                    }
                }
            }

            function getStartDate(data, levelOne, levelTwo, levelThree){
                var dataTableAlign = $scope.dataTableAlign;
                var dataObject = getDataObject(data, levelOne, levelTwo, levelThree);
                dataObject = dataObject[0];


                //TODO convert to a short date
                return dataObject[$scope.dataTableAlign['earlyStart']];
            }

            function getEndDate(data, levelOne, levelTwo, levelThree){
                var dataTableAlign = $scope.dataTableAlign;
                var dataObject = getDataObject(data, levelOne, levelTwo, levelThree);
                dataObject = dataObject[0];

                //TODO convert to a short date
                return dataObject[$scope.dataTableAlign['lateFinish']];
            }

            function getSlackOrDelay(data, levelOne, levelTwo, levelThree) {
                var dataTableAlign = $scope.dataTableAlign;
                var dataObject = getDataObject(data, levelOne, levelTwo, levelThree);
                dataObject = dataObject[0];

                var status = dataObject[$scope.dataTableAlign['STATUS']];

                //return status;

                var returnValue = "";
                if(status === "completed") {
                    returnValue = "Delay: ";
                }
                else if(status === "projected") {
                    returnValue = "Slack: ";
                }
                else if(status === "active") {
                    returnValue = "Slack: ";
                }

                return returnValue;
            }

            function isBoxActive(data, levelOne, levelTwo, levelThree) {
                var dataTableAlign = $scope.dataTableAlign;
                var dataObject = getDataObject(data, levelOne, levelTwo, levelThree);
                dataObject = dataObject[0];

                var styleClass = dataObject[$scope.dataTableAlign['STATUS']];

                if(styleClass === "completed") {
                    return "completed-box";
                }
                else if (styleClass === "active") {
                    return "active-box";
                }
                else{
                    return "projected-box";
                }
            }

            function getDataObject(data, levelOne, levelTwo, levelThree){
                var filteredObject = [];

                for(var i=0; i < data.length; i++){
                    if(data[i][$scope.dataTableAlign["levelOne"]]=== levelOne){
                        filteredObject.push(data[i]);
                    }
                }
                var filteredObject2 = [];

                for(i=0; i < filteredObject.length; i++){
                    if(filteredObject[i][$scope.dataTableAlign["levelTwo"]] === levelTwo){
                        filteredObject2.push(filteredObject[i]);
                    }
                }

                var filteredObject3 = [];

                for(i=0; i < filteredObject2.length; i++){
                    if(filteredObject2[i][$scope.dataTableAlign["levelThree"]] === levelThree){
                        filteredObject3.push(filteredObject2[i]);
                    }
                }

                return filteredObject3;
            }


        }
    }

})();
