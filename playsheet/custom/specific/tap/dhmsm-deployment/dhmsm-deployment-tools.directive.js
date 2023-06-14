(function () {
    'use strict';

    angular.module('app.tap.dhmsm-deployment-tools.directive', [])
        .directive('dhmsmDeploymentTools', dhmsmDeploymentTools);

    dhmsmDeploymentTools.$inject = ['$rootScope', 'dataService', 'alertService'];

    function dhmsmDeploymentTools($rootScope, dataService, alertService) {

        DHMSMDeploymentToolsLink.$inject = ['scope', 'ele', 'attrs', 'ctrls'];
        DHMSMDeploymentToolsCtrl.$inject = ['$scope'];

        return {
            restrict: 'A',
            require: ['^toolPanel'],
            scope: {},
            bindToController: true,
            templateUrl: 'custom/specific/tap/dhmsm-deployment/dhmsm-deployment-tools.directive.html',
            link: DHMSMDeploymentToolsLink,
            controller: DHMSMDeploymentToolsCtrl,
            controllerAs: "dhmsmdeploymenttools"
        };

        function DHMSMDeploymentToolsLink(scope, ele, attrs, ctrls) {
            scope.toolPanelCtrl = ctrls[0];

            scope.viewSelection = "Map";
            scope.viewSelectionMap = "Map";
            scope.viewSelectionSystem = "System";
            scope.viewSelectionSite = "Site";
            //don't create the slider until we have the slider data
            scope.createSlider = false;
            scope.updateVisualization = updateVisualization;

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                scope.toolPanelCtrl.toolUpdater(fn, data);
            }

            /**
             * @name findMinMaxYear
             * @desc finds the min and max year given the data
             */
            function findMinMaxYear(dataString) {
                var maxYear = 0;
                var minYear = 3000;
                var hop = 1;

                for (var year in dataString) {
                    if (year < minYear)
                        minYear = year;
                    if (year > maxYear)
                        maxYear = year;
                }

                var toolData = {
                    'min': minYear,
                    'max': maxYear,
                    'hop': hop
                };

                return toolData;
            };

            scope.setSliderData = function (data) {
                //set the data and assign slider variables
                scope.createSlider = false;
                var toolData = findMinMaxYear(data);
                scope.yearMin = parseInt(toolData.min);
                scope.yearMax = parseInt(toolData.max);
                scope.hop = parseInt(toolData.hop);

                scope.updateVisualization('updateInitialYear', scope.yearMin);
                scope.dhmsmdeploymenttools.selectedYear = scope.yearMin;
                //the filter data gets passed in here before the slider is created
                scope.createSlider = true;
            };            

            var scheduleCleanUpFunc = scope.$on('dhmsmdeploymentmaptools.report-refresh', function (event, data) {
                scope.setSliderData(data);
            });

            scope.$on("$destroy", function dhmsmDeploymentToolsDestroyer() {
                scheduleCleanUpFunc();
            });

            //Initialize
            scope.setSliderData(scope.toolPanelCtrl.selectedData.data.mapData.data);
            scope.dhmsmdeploymenttools.setDefaultScheduleData();
        }

        function DHMSMDeploymentToolsCtrl($scope) {
            this.quarterList = [1, 2, 3, 4];
            this.yearList = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038, 2039, 2040];
            this.layers = {
                "Street Layer": "streets",
                "Topographic Layer": "topo",
                "Satellite Layer": "satellite",
                "Hybrid Layer": "hybrid",
                "Gray Layer": "gray",
                "National Geographic": "national-geographic",
                "Terrain Layer": "terrain",
                "Ocean Layer": "oceans"
            };
            this.selectedLayer = {
                selected: ""
            };
            this.regionSelectionEnabled = false;
            this.defaultRegionData = {};
            this.defaultDeploymentData = {};
            this.deploymentDefaultRegions = {};
            this.selectedYear = 2016;

            this.yearUpdater = function (year) {
                $scope.updateVisualization('updateYear', year);
            }

            this.changeView = function (viewSelection) {
                $scope.viewSelection = viewSelection;
                $scope.updateVisualization('changeView', viewSelection);
            }

            this.updateBaseLayer = function (selectedLayer) {
                $scope.updateVisualization('setBaseMapLayer', selectedLayer);
            };

            this.setDefaultScheduleData = function () {
                var data = $scope.toolPanelCtrl.selectedData.data.defaultScheduleData;
                var formattedData = {};
                var deploymentData = {};
                _(data.regions).forEach(function (reg) {
                    var valObj = {};
                    valObj["startQuarter"] = data.startQuarter[reg];
                    valObj["startYear"] = parseInt('20' + data.startYear[reg]);
                    valObj["endQuarter"] = data.endQuarter[reg];
                    valObj["endYear"] = parseInt('20' + data.endYear[reg]);
                    formattedData[reg] = valObj;
                    var deploymentValObj = {};
                    if (reg === "West") {
                        deploymentValObj["quarter"] = data.startQuarter[reg];
                        deploymentValObj["year"] = parseInt('20' + data.startYear[reg]);
                        deploymentValObj["id"] = reg + " Start";
                        deploymentData[reg] = deploymentValObj;
                    }
                    if (reg === "Pacific") {
                        deploymentValObj["quarter"] = data.endQuarter[reg];
                        deploymentValObj["year"] = parseInt('20' + data.endYear[reg]);
                        deploymentValObj["id"] = reg + " End";
                        deploymentData[reg] = deploymentValObj;
                    }
                });

                this.defaultRegionData = JSON.parse(JSON.stringify(formattedData));
                this.defaultDeploymentData = JSON.parse(JSON.stringify(deploymentData));
                this.regions = formattedData;
                this.deploymentDefaultRegions = deploymentData;
            };

            this.restoreDefaults = function () {
                this.regions = JSON.parse(JSON.stringify(this.defaultRegionData));
                this.deploymentDefaultRegions = JSON.parse(JSON.stringify(this.defaultDeploymentData));
            };

            this.dhmsmCSVExport = function() {
                exportToCSV($scope.toolPanelCtrl.selectedData.data.systemAnalysisData.data, $scope.toolPanelCtrl.selectedData.data.systemAnalysisData.headers, 'system_analysis');
                exportToCSV($scope.toolPanelCtrl.selectedData.data.siteAnalysisData.data, $scope.toolPanelCtrl.selectedData.data.siteAnalysisData.headers, 'site_analysis');
            };

            function exportToCSV(data, headers, fileName) {
                if (data) {
                    var unparsedData = '', csvData;
                    //add in headers
                    for (var i = 0; i < headers.length; i++) {
                        var header = headers[i].filteredTitle;
                        if(typeof header === 'string' && header.indexOf(',')) {
                            header = '"'+header+'"'
                        }

                        unparsedData += (header + ',')
                    }
                    unparsedData += '\r\n';

                    //add in rows
                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < headers.length; j++) {
                            var d = data[i][headers[j].filteredTitle];
                            if(typeof d === 'string' && d.indexOf(',')) {
                                d = '"'+d+'"'
                            }
                            unparsedData += (d + ',')
                        }
                        unparsedData += '\r\n';
                    }

                    //create blob
                    csvData = new Blob([unparsedData], {type: 'text/csv;charset=utf-8;'});

                    //export for download
                    //IE11 & Edge
                    if (navigator.msSaveBlob) {
                        navigator.msSaveBlob(csvData, fileName + '.csv');
                    } else {
                        //In FF link must be added to DOM to be clicked
                        var link = document.createElement('a');
                        link.href = window.URL.createObjectURL(csvData);
                        link.setAttribute('download', fileName + '.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                } else {
                    alertService('No Filtered Data', 'Warning', 'toast-warning', 3000);
                }
            }                    

            //creates Array of Arrays for CSV exporting
            function sortDataByHeaders(data, headers) {
                var newData = [];
                _(data).forEach(function (row) {
                    var newRow = [];
                    _(headers).forEach(function (header) {
                        newRow.push(row[header.title]);
                    });
                    newData.push(newRow);
                });
                return newData;
            };

            //this is called when the user updates the deployment strategy, and recalculates all the data needed for this report via a back end call
            this.createNewStrategy = function () {
                //send values to the back-end based on the type of configuration specified
                //dataToSend will contain the type of the refresh, and the key value pairs for the region start&end date values
                var dataToSend = {};
                var engineName = $scope.toolPanelCtrl.selectedData.core_engine.name;
                var layout = $scope.toolPanelCtrl.selectedData.insightID;

                var config = {
                    "engine": engineName,
                    "layout": layout,
                    "dataToSend": dataToSend
                };

                if (this.regionSelectionEnabled) { //populate the object with region values
                    _(this.regions).forEach(function (reg, key) {
                        var newObj = {};
                        _(reg).forEach(function (val, valKey) {
                            var newValue = parseInt(val);
                            newObj[valKey] = newValue;
                        });
                        dataToSend[key] = newObj;
                    });
                    config["method"] = "refreshDataRegion";
                } else {
                    _(this.deploymentDefaultRegions).forEach(function (reg, key) {
                        var newObj = {};
                        _(reg).forEach(function (val, valKey) {
                            if (valKey !== "id") {
                                var newValue = parseInt(val);
                                newObj[valKey] = newValue;
                            }
                        });
                        dataToSend[key] = newObj;
                    });
                    config["method"] = "refreshDataDeployment";
                }

                $scope.updateVisualization('reportRefreshFunc', config);
            };
        }
    }

})(); //end of controller IIFE