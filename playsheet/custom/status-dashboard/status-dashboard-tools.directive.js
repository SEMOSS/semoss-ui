(function () {
    'use strict';

    angular.module('app.status-dashboard-tools.directive', [])
        .directive('statusDashboardTools', statusDashboardTools);

    statusDashboardTools.$inject = ['$filter', 'monolithService'];

    function statusDashboardTools($filter, monolithService) {

        statusDashboardToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        statusDashboardToolsCtrl.$inject =["$scope"];

        return {
            restrict: 'EA',
            require: ['^toolPanel'],
            bindToController: {},
            templateUrl: 'custom/status-dashboard/status-dashboard-tools.directive.html',
            controllerAs: 'statusDashboardTools',
            controller: statusDashboardToolsCtrl,
            link: statusDashboardToolsLink
        };

        function statusDashboardToolsCtrl($scope) {
            //don't create the slider until we have the slider data
            var statusDashboardTools = this;
            statusDashboardTools.levelOneSortLabel = "";
            statusDashboardTools.selectedSystem = "";
            statusDashboardTools.selectedSystemOwner = "";
            statusDashboardTools.activeOrAll = "All";


            $scope.$on('$destroy', function heatMapToolsDestroyer() {
                //toolUpdateCleanUpFunc();
            });

        }

        function statusDashboardToolsLink(scope, ele, attrs, ctrl){
            scope.toolPanelCtrl = ctrl[0];

            scope.getLevelOneFilter = getLevelOneFilter;
            scope.statusDashboardTools.getLevelTwoFilter = getLevelTwoFilter;
            scope.statusDashboardTools.getLevelThreeFilter = getLevelThreeFilter;
            scope.statusDashboardTools.clearFilter = clearFilter;
            scope.statusDashboardTools.applyFilter = applyFilter;
            scope.statusDashboardTools.getSystemFilter = getSystemFilter;
            scope.statusDashboardTools.applySystemFilter = applySystemFilter;
            scope.statusDashboardTools.getMinValue = getMinValue;
            scope.statusDashboardTools.getMaxValue = getMaxValue;
            scope.statusDashboardTools.colorDHAGroups = colorDHAGroups;
            scope.statusDashboardTools.setActiveOrAll = setActiveOrAll;

            setToolData();


            function setToolData() {
                var selectedData = scope.toolPanelCtrl.selectedData;

                scope.statusDashboardTools.systemList = selectedData.System;

                statusDashboardTools.minValue = getMinValue();
                statusDashboardTools.maxValue = getMaxValue();
                statusDashboardTools.sliderSelectedValue = 5;

                scope.statusDashboardTools.systemOwners = selectedData.SystemOwner;

                scope.statusDashboardTools.levelOneFilter = selectedData.SDLCList;
                scope.statusDashboardTools.levelTwoFilter = getLevelTwoFilter();

            }

            function getLevelOneFilter(){
                var selectedData = scope.toolPanelCtrl.selectedData;
                var headersObject = _.uniqBy(selectedData.filteredData, 'SDLCPhase');
                var levelOneHeaders = [];

                for(var i=0; i < headersObject.length; i++){
                    levelOneHeaders[i] = headersObject[i]['SDLCPhase'];
                }
                return levelOneHeaders;
            }

            function getLevelTwoFilter(levelOneFilter){
                if(levelOneFilter == null){
                    return "";
                }
                var selectedData = scope.toolPanelCtrl.selectedData;
                var filteredData = [];
                for(var i=0; i < selectedData.data.length; i++){
                    for(var j=0; j < levelOneFilter.length;j++){
                        if(selectedData.data[i]['SDLCPhase'] === levelOneFilter[j]){
                            filteredData.push(selectedData.data[i]["ActivityGroup"]);
                        }
                    }
                }
                var levelTwoFilter =(_.uniq(filteredData));
                return levelTwoFilter.sort();
            }

            function getLevelThreeFilter(levelOneFilter, levelTwoFilter){
                if(levelOneFilter == null || levelTwoFilter == null){
                    return "";
                }
                var selectedData = scope.toolPanelCtrl.selectedData;
                var filteredData = [];
                for(var i=0; i < selectedData.data.length; i++){
                    for(var j=0; j < levelOneFilter.length;j++){
                        if(selectedData.data[i]["SDLCPhase"] === levelOneFilter[j]){
                            filteredData.push(selectedData.data[i]);
                        }
                    }
                }
                var filteredDataLevelTwo = [];
                for(var i=0; i < filteredData.length;i++){
                    for(var j=0; j < levelTwoFilter.length;j++){
                        if(filteredData[i]["ActivityGroup"] === levelTwoFilter[j]){
                            filteredDataLevelTwo.push(filteredData[i]["DHAGroup"]);
                        }
                    }
                }
                var levelThreeFilter = _.uniq(filteredDataLevelTwo);
                return levelThreeFilter.sort();
            }

            function getSystemFilter(){

                monolithService.runPlaySheetMethod(null, scope.toolPanelCtrl.selectedData.insightID, {}, "getData").then(function (response) {
                    var newData = JSON.parse(JSON.stringify(response));

                    //var formattedData = utilityService.formatTableData(newData.headers, newData.data, true);
                }.bind());

                //scope.toolPanelCtrl.toolUpdater('updateData', sendToFilter);


            }


            function clearFilter(){

                //Set sort labels to all
                scope.statusDashboardTools.levelOneSortLabel = [];
                scope.statusDashboardTools.levelTwoSortLabel = [];
                scope.statusDashboardTools.levelThreeSortLabel = [];

                //Set system filter and system owner filter to all
                scope.statusDashboardTools.selectedSystem = "";
                scope.statusDashboardTools.selectedSystemOwner = "";

                //Set the slider back to 0 and update colors
                scope.statusDashboardTools.sliderSelectedValue = 0;
                colorDHAGroups(scope.statusDashboardTools.sliderSelectedValue);

                scope.toolPanelCtrl.toolUpdater('unfilter', null);
            }

            //function apply
            //make call to backend to get new data sent back
            function applyFilter(){
                //Apply filters and make call to backend to repaint the status dashboard


                //SDLC
                if(scope.statusDashboardTools.levelOneSortLabel){
                    for(var i=0; i < scope.statusDashboardTools.levelOneSortLabel.length; i++){
                        scope.statusDashboardTools.levelOneSortLabel[i] = $filter('replaceSpaces')(scope.statusDashboardTools.levelOneSortLabel[i]);
                    }
                }
                //ActivityGroup
                if(scope.statusDashboardTools.levelTwoSortLabel){
                    for(var i=0; i < scope.statusDashboardTools.levelTwoSortLabel.length; i++){
                        scope.statusDashboardTools.levelTwoSortLabel[i] = $filter('replaceSpaces')(scope.statusDashboardTools.levelTwoSortLabel[i]);
                    }
                }
                //DHA
                if(scope.statusDashboardTools.levelThreeSortLabel){
                    for(var i=0; i < scope.statusDashboardTools.levelThreeSortLabel.length; i++){
                        scope.statusDashboardTools.levelThreeSortLabel[i] = $filter('replaceSpaces')(scope.statusDashboardTools.levelThreeSortLabel[i]);
                    }
                }

                var system = "System";
                var systemOwner = "SystemOwner";
                var level1 = "SDLCPhase_FK";//scope.toolPanelCtrl.selectedData.headers[0].filteredTitle;
                var level2 = "ActivityGroup_FK";//scope.toolPanelCtrl.selectedData.headers[1].filteredTitle;
                var level3 = "DHAGroup_FK";//scope.toolPanelCtrl.selectedData.headers[2].filteredTitle;

                var sendToFilter = new Object();
                //Only add value to map if not null
                if(scope.statusDashboardTools.selectedSystem && scope.statusDashboardTools.hasOwnProperty('selectedSystem')){
                    sendToFilter[system] = scope.statusDashboardTools.selectedSystem;
                }
                if(scope.statusDashboardTools.selectedSystemOwner && scope.statusDashboardTools.hasOwnProperty('selectedSystemOwner')){
                    sendToFilter[systemOwner] = scope.statusDashboardTools.selectedSystemOwner;
                }

                if(scope.statusDashboardTools.levelOneSortLabel && scope.statusDashboardTools.hasOwnProperty('levelOneSortLabel')){
                    sendToFilter[level1] = scope.statusDashboardTools.levelOneSortLabel;
                }
                //ActivityGroup
                if(scope.statusDashboardTools.levelTwoSortLabel && scope.statusDashboardTools.hasOwnProperty('levelTwoSortLabel')){
                    sendToFilter[level2] = scope.statusDashboardTools.levelTwoSortLabel;
                }
                //DHA
                if(scope.statusDashboardTools.levelThreeSortLabel && scope.statusDashboardTools.hasOwnProperty('levelThreeSortLabel')){
                    sendToFilter[level3] = scope.statusDashboardTools.levelThreeSortLabel;
                }

                scope.toolPanelCtrl.toolUpdater('updateData', sendToFilter);


                //Put spaces back into sort labels so they are properly selected
                if(scope.statusDashboardTools.levelOneSortLabel){
                    for(var i=0; i < scope.statusDashboardTools.levelOneSortLabel.length; i++){
                        scope.statusDashboardTools.levelOneSortLabel[i] = $filter('replaceUnderscores')(scope.statusDashboardTools.levelOneSortLabel[i]);
                    }
                }
                if(scope.statusDashboardTools.levelTwoSortLabel){
                    for(var i=0; i < scope.statusDashboardTools.levelTwoSortLabel.length; i++){
                        scope.statusDashboardTools.levelTwoSortLabel[i] = $filter('replaceUnderscores')(scope.statusDashboardTools.levelTwoSortLabel[i]);
                    }
                }
                if(scope.statusDashboardTools.levelThreeSortLabel){
                    for(var i=0; i < scope.statusDashboardTools.levelThreeSortLabel.length; i++){
                        scope.statusDashboardTools.levelThreeSortLabel[i] = $filter('replaceUnderscores')(scope.statusDashboardTools.levelThreeSortLabel[i]);
                    }
                }
            }

            function applySystemFilter(name, value){
                var sys = [];

                if(value){
                    sys.push(value[0]);
                }

                var sendToFilter = {[name]: sys};

                scope.toolPanelCtrl.toolUpdater('applySystemFilter', sendToFilter);
            }

            function getMinValue(){
                var selectedData = scope.toolPanelCtrl.selectedData;
                var dataTableAlign = scope.toolPanelCtrl.selectedData.dataTableAlign;

                var minValue = _.minBy(selectedData.data, dataTableAlign['heatValue']);

                return minValue[dataTableAlign['heatValue']];

            }

            function getMaxValue(){
                var selectedData = scope.toolPanelCtrl.selectedData;

                var dataTableAlign = scope.toolPanelCtrl.selectedData.dataTableAlign;

                var maxValue = _.maxBy(selectedData.data, dataTableAlign['heatValue']);

                return maxValue[dataTableAlign['heatValue']];


            }


            function colorDHAGroups(selectedValue){
                //Colors the DHA Groups based on the slider
                scope.toolPanelCtrl.toolUpdater('colorDHAGroups', selectedValue);
            }

            function setActiveOrAll(value){
                console.log(value);
            }

        }
    }


})(); //end of controller IIFE
