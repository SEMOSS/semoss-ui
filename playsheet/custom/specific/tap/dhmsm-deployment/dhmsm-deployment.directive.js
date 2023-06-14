(function () {
    'use strict';
    angular.module('app.tap.dhmsm-deployment.directive', [])
        .directive('dhmsmDeployment', dhmsmDeployment);

    dhmsmDeployment.$inject = ['$rootScope', 'ngTableParams', '$filter', '$timeout', 'monolithService', 'dataService'];

    function dhmsmDeployment($rootScope, ngTableParams, $filter, $timeout, monolithService, dataService) {

        DHMSMDeploymentCtrl.$inject = ['$scope', '$rootScope'];

        return {
            restrict: 'EA',
            require: ['chart'],
            bindToController: true,
            link: DHMSMDeploymentLink,
            controller: DHMSMDeploymentCtrl,
            controllerAs: "dhmsmCtrl",
            templateUrl: "custom/specific/tap/dhmsm-deployment/dhmsm-deployment.directive.html"
        };

        function DHMSMDeploymentLink(scope, ele, attrs, ctrls) {
            var toolFunctions = {
                updateYear: updateYear,
                setBaseMapLayer: setBaseMapLayer,
                updateInitialYear: updateInitialYear,
                reportRefreshFunc: reportRefreshFunc,
                changeView: changeView
            };
            scope.chartCtrl = ctrls[0];

            //set scope variables
            scope.chartCtrl.loadScreen = false;
            scope.chartCtrl.showMapToggle = true;
            scope.chartCtrl.showSystemAnalysisToggle = false;
            scope.chartCtrl.showSiteAnalysisToggle = false;
            scope.chartCtrl.dataUpdater = [];
            scope.chartCtrl.selectedLayer = {
                selected: ""
            };
            scope.chartCtrl.tableOptions = {
                scrollable: true,
                filterType: "dropdown",
                condenseTable: false,
                paginationOptions: {
                    currentPage: 1,
                    count: 10
                }
            };

            scope.dhmsmCtrl.visualizationData = {};
            scope.dhmsmCtrl.selectedYear = 2016;

            var reportRefresh = false;

            scope.chartCtrl.dataProcessor = function () {
                if (!reportRefresh) {
                    scope.chartCtrl.refreshData();
                }
            };

            scope.chartCtrl.toolUpdateProcessor = function (toolUpdateConfig) {
                //need to invoke tool functions
                toolFunctions[toolUpdateConfig.fn](toolUpdateConfig.args);
            };

            scope.chartCtrl.refreshData = function () {
                if (!_.isEmpty(scope.chartCtrl.data) && !_.isEmpty(scope.chartCtrl.data.data.mapData)) {
                    //set the map data via update, set system and site analysis data via the response....this is a cumbersome payload and needs to be revisited
                    scope.dhmsmCtrl.visualizationData = scope.chartCtrl.data.data.mapData;

                    var sysAnalysisDataCopy = JSON.parse(JSON.stringify(scope.chartCtrl.data.data.systemAnalysisData));
                    sysAnalysisDataCopy.filteredData = JSON.parse(JSON.stringify(sysAnalysisDataCopy.data));

                    var siteAnalysisDataCopy = JSON.parse(JSON.stringify(scope.chartCtrl.data.data.siteAnalysisData));
                    siteAnalysisDataCopy.filteredData = JSON.parse(JSON.stringify(siteAnalysisDataCopy.data));

                    scope.chartCtrl.systemAnalysisData = sysAnalysisDataCopy;
                    scope.chartCtrl.siteAnalysisData = siteAnalysisDataCopy

                    update(scope.dhmsmCtrl.visualizationData, reportRefresh);
                }
                if (reportRefresh) {
                    //TODO: refresh the grids
                    //notificationService.notify('chart-data-change', scope.chartCtrl.systemAnalysisData, 'system');
                    //notificationService.notify('chart-data-change', scope.chartCtrl.siteAnalysisData, 'site');
                }
            }

            function getNgTableData() {
                return scope.chartCtrl.dataUpdater;
            }

            scope.chartCtrl.tableParams = new ngTableParams({
                page: 1,
                count: 10,          // count per page
                filter: {
                    name: ''       // initial filter
                },
                sorting: {
                    name: 'asc'     // initial sorting
                }
            }, {
                total: scope.chartCtrl.dataUpdater.length, // length of data
                getData: function ($defer, params) {
                    var data = getNgTableData();
                    // use build-in angular filter
                    var filteredData = params.filter() ? $filter('filter')(data, params.filter()) : data;
                    var orderedData = params.sorting() ? $filter('orderBy')(filteredData, params.orderBy()) : data;
                    params.total(orderedData.length); // set total for recalc pagination
                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
            });

            function update(mapData, initializeTable) {
                var dataString = mapData.data;

                //determine the type of chart
                var chartType = mapData.label;
                if (chartType === "savings") {
                    scope.chartCtrl.costTitle = 'Current Year Savings ($)';
                } else {
                    scope.chartCtrl.costTitle = 'Cumulative Cost ($)';
                }

                //TODO: refactor this to tower model
                $rootScope.$broadcast('dhmsmdeploymentmaptools.report-refresh', mapData.data);

                var newYearKeys = _.map(Object.keys(dataString), function (n) {
                    return parseInt(n);
                });
                if (!_.includes(newYearKeys, scope.dhmsmCtrl.selectedYear)) {
                    scope.dhmsmCtrl.selectedYear = _.min(newYearKeys);
                }

                var data = dataRefresh(scope.dhmsmCtrl.selectedYear, dataString);
                scope.chartCtrl.dataUpdater = data;
                //only initialize table if report is being run...not if the map slider is changing to update values
                if (!initializeTable) {
                    //scope.chartCtrl.tableParams.settings().$scope = scope;
                } else {
                    scope.chartCtrl.tableParams.reload();
                }
            }

            //refresh the data for the report
            var dataRefresh = function (year, dataString) {
                var data = [];
                for (var system in dataString[year].system) {
                    dataString[year].system[system]['TCostSystem'] = numberWithCommas(dataString[year].system[system]['TCostSystem']);
                    data.push({
                        name: system,
                        totalSystemCost: dataString[year].system[system]['TCostSystem'],
                        aggregatedStatus: dataString[year].system[system]['AggregatedStatus']
                    });
                }
                scope.chartCtrl.dataUpdater = data;
                return data;
            };

            //formats numbers for the grid
            function numberWithCommas(x) {
                var parts = x.toString().split(".");
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return parts.join(".");
            };

            //takes in the config object from the user selections in tools and refreshes the data for the report
            function reportRefreshFunc(config) {
                dataService.showWidgetLoadScreen(true);
                reportRefresh = true;
                monolithService.runPlaySheetMethod(config.engine, config.layout, config.dataToSend, config.method).then(function (response) {
                    scope.chartCtrl.data.data = response.data;
                    scope.chartCtrl.refreshData();
                    dataService.showWidgetLoadScreen(false);
                });
            };

            //called when the slider value changes
            function updateYear(year) {
                var data = dataRefresh(year, scope.dhmsmCtrl.visualizationData.data);
                scope.chartCtrl.dataUpdater = data;
                scope.chartCtrl.tableParams.reload();
                scope.dhmsmCtrl.updateYear(year);
            };

            function setBaseMapLayer(layer) {
                scope.dhmsmCtrl.setBaseMapLayer(layer);
            };

            function updateInitialYear(year) {
                scope.dhmsmCtrl.selectedYear = year;
            };

            //toggle the analysis selection between map system and site
            function changeView(viewSelection) {
                scope.chartCtrl.showMapToggle = false;
                scope.chartCtrl.showSystemAnalysisToggle = false;
                scope.chartCtrl.showSiteAnalysisToggle = false;

                if (viewSelection === "Map") {
                    scope.chartCtrl.showMapToggle = true;
                } else if (viewSelection === "System") {
                    scope.chartCtrl.showSystemAnalysisToggle = true;
                } else if (viewSelection === "Site") {
                    scope.chartCtrl.showSiteAnalysisToggle = true;
                }
            };
        }

        function DHMSMDeploymentCtrl($scope, $rootScope) {
            var dhmsmCtrl = this;

            dhmsmCtrl.updateYear = function() {};
            dhmsmCtrl.setBaseMapLayer = function() {};
        }

    }

})(); //end of controller IIFE
