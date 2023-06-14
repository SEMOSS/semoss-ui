(function () {
    'use strict';

    angular.module('app.tap.portrat', [])
        .directive('portrat', portrat);

    portrat.$inject = ['$rootScope'];

    function portrat($rootScope) {
        portratLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];
        portratCtrl.$inject = ['$scope', 'monolithService', 'utilityService', 'dataService'];

        return {
            restrict: 'A',
            require: ['portratmaster'],
            controllerAs: 'prd',
            bindToController: {
                data: '=',
                chartName: '='
            },
            controller: portratCtrl,
            link: portratLink,
            priority: 550,
            templateUrl: 'custom/specific/tap/portratdashboard/portrat.html'
        };

        function portratLink(scope, ele, attrs, controllers) {
            scope.portratmasterCtrl = controllers[0];
            scope.prd.setWidgetData();
            scope.prd.checkSetting();


            //listeners
            $rootScope.$on('update-visualization', function (event, data) {
                scope.prd.setWidgetData();
                scope.prd.checkSetting();
            });
        }

        function portratCtrl($scope, monolithService, utilityService, dataService) {
            //ng-if toggles for panels & dashboard
            this.showParamPanel = false;
            this.showReturnToSelectToggle = false;
            this.showSelectPanel = false;
            this.showDash = false;
            this.loadScreen = false;

            //General Dashboard Data
            this.widgetData = {};
            this.chartData = {};
            this.insightData = {};

            this.portRatSystemList = [];
            this.currentSystemData = '';
            this.capabilitySelection = '';

            //Overview Data
            this.overviewInfoData = {};
            this.overviewCostData = {};
            this.overviewMapData = {};
            this.overviewCapabilityMapData = {};
            this.overviewDataHealthGrid = {};
            this.overviewCoverageData = {};

            //Sustained Sys Data
            this.sustainedInfoData = {};
            this.sustainedCapabilityData = {};
            this.sustainedDataMap = {};
            this.sustainedDataHealthGrid = {};
            this.sustainedATO = '';
            this.sustainedDesc = '';
            this.sustainedRec = '';

            //Consolidated Sys Data
            this.consolidatedInfoData = {};
            this.consolidatedCoverageData = {};
            this.consolidatedDataMap = {};
            this.consolidatedDataHealthGrid = {};
            this.consolidatedATO = '';
            this.consolidatedDesc = '';
            this.consolidatedRec = '';

            this.setWidgetData = function (idata) {
                this.widgetData = dataService.getWidgetData();
                this.insightData = this.widgetData.data.insightData;
                this.chartData = this.widgetData.data.chartData;
            };

            this.checkSetting = function () {
                var selectedSettingsParam = this.widgetData.data.insightData.params.Settings.selected[0];
                if (selectedSettingsParam === 'Customized') {
                    this.showParamPanel = true;
                } else if (selectedSettingsParam === 'Default') {
                    this.loadScreen = true;
                    this.runDefaultOptimization();
                }
            };

            //Service Calls for Port Rat
            this.runDefaultOptimization = function () {
                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {}, 'runDefaultOpt').then(function (response) {
                    $scope.prd.portRatSystemList = [];
                    $scope.prd.portRatSystemList = JSON.parse(JSON.stringify(response));
                    $scope.prd.showSelectPanel = true;
                    $scope.prd.showParamPanel = false;
                    $scope.prd.showDash = true;
                    $scope.prd.loadScreen = false;
                }.bind());
            };

            this.getOverviewData = function () {
                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, { 'type': 'info' }, 'getOverviewPageData').then(function (response) {
                    $scope.prd.overviewInfoData = response;
                    $scope.prd.loadScreen = false;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, { 'type': 'map' }, 'getOverviewPageData').then(function (response) {
                    if (!_.isEmpty((response.Savings))) {
                        var savingsMapData = JSON.parse(JSON.stringify(response.Savings));
                    }
                    if (!_.isEmpty((response.CapCoverage))) {
                        var capCoverageMapData = JSON.parse(JSON.stringify(response.CapCoverage));
                    }
                    if (savingsMapData.headers != undefined) {
                        var formattedData = utilityService.formatTableData(savingsMapData.headers, savingsMapData.data, true);
                        angular.extend(savingsMapData, formattedData);
                    }
                    if (capCoverageMapData != undefined) {
                        var formattedData = utilityService.formatTableData(capCoverageMapData.headers, capCoverageMapData.data, true);
                        angular.extend(capCoverageMapData, formattedData);
                        $scope.prd.overviewCapabilityMapData = capCoverageMapData;
                    }
                    $scope.prd.overviewMapData = savingsMapData;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, { 'type': 'healthGrid' }, 'getOverviewPageData').then(function (response) {
                    if (response != undefined) {
                        var healthGridData = response;
                        healthGridData.layout = 'prerna.ui.components.specific.tap.HealthGridSheetPortRat';
                        var formattedData = utilityService.formatTableData(healthGridData.headers, healthGridData.data, true);
                        angular.extend(healthGridData, formattedData);
                        $scope.prd.overviewDataHealthGrid = healthGridData;
                    }
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, { 'type': 'coverage' }, 'getOverviewPageData').then(function (response) {
                    var obj = response.data;
                    var cleanedData = [],
                        key;
                    for (key in obj) {
                        obj[key].System = key;
                        cleanedData.push(obj[key]);
                    }
                    $scope.prd.overviewCoverageData = response;
                    $scope.prd.overviewCoverageData.title = 'System Coverage';
                    $scope.prd.overviewCoverageData.data = cleanedData;
                    $scope.prd.overviewCoverageData.headers = [
                        {
                            'title': 'System',
                            'filteredTitle': 'System',
                            'filter': {
                                'System': ''
                            }
                        },
                        {
                            'title': 'BLU',
                            'filteredTitle': 'BLU',
                            'filter': {
                                'BLU': ''
                            }
                        },
                        {
                            'title': 'Data',
                            'filteredTitle': 'Data',
                            'filter': {
                                'Data': ''
                            }
                        },
                        {
                            'title': 'Recommendation',
                            'filteredTitle': 'Recommendation',
                            'filter': {
                                'Recommendation': ''
                            }
                        }

                    ];
                    $scope.prd.overviewCoverageData.dataTableAlign = {
                        'System': 'System',
                        'BLU': 'BLU',
                        'Data': 'Data',
                        'Recommendation': 'Recommendation'
                    };
                    $scope.prd.overviewCoverageData.id = '';
                    $scope.prd.overviewCoverageData.layout = 'prerna.ui.components.specific.tap.SysCoverageSheetPortRat';
                    $scope.prd.overviewCoverageData.oldData = obj;
                }.bind());
            };

            this.getSustainedSysData = function (sys) {
                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'info',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    $scope.prd.sustainedInfoData = response;
                    $scope.prd.sustainedATO = response.decommissionInfo.atoDate;
                    $scope.prd.sustainedDesc = response.decommissionInfo.systemDesc;
                    $scope.prd.sustainedRec = response.decommissionInfo.recommendation;
                    $scope.prd.loadScreen = false;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'coverage',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    var obj = response.data;
                    var cleanedData = [],
                        key;
                    for (key in obj) {
                        obj[key].System = key;
                        cleanedData.push(obj[key]);
                    }
                    //.push(key : obj[key];
                    $scope.prd.sustainedCapabilityData = response;
                    $scope.prd.sustainedCapabilityData.title = 'System Coverage';
                    $scope.prd.sustainedCapabilityData.data = cleanedData;
                    $scope.prd.sustainedCapabilityData.headers = [
                        {
                            'title': 'System',
                            'filteredTitle': 'System',
                            'filter': {
                                'System': ''
                            }
                        },
                        {
                            'title': 'BLU',
                            'filteredTitle': 'BLU',
                            'filter': {
                                'BLU': ''
                            }
                        },
                        {
                            'title': 'Data',
                            'filteredTitle': 'Data',
                            'filter': {
                                'Data': ''
                            }
                        },
                        {
                            'title': 'Recommendation',
                            'filteredTitle': 'Recommendation',
                            'filter': {
                                'Recommendation': ''
                            }
                        }

                    ];
                    $scope.prd.sustainedCapabilityData.dataTableAlign = {
                        'System': 'System',
                        'BLU': 'BLU',
                        'Data': 'Data',
                        'Recommendation': 'Recommendation'
                    };
                    $scope.prd.sustainedCapabilityData.id = '';
                    $scope.prd.sustainedCapabilityData.layout = 'prerna.ui.components.specific.tap.SysCoverageSheetPortRat';
                    $scope.prd.sustainedCapabilityData.oldData = obj;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'map',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    var formattedData = utilityService.formatTableData(response.headers, response.data, true);
                    angular.extend(response, formattedData);
                    $scope.prd.sustainedDataMap = response;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'healthGrid',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    var healthGridData = response;
                    healthGridData.layout = 'prerna.ui.components.specific.tap.HealthGridSheetPortRat';
                    var formattedData = utilityService.formatTableData(healthGridData.headers, healthGridData.data, true);
                    angular.extend(healthGridData, formattedData);
                    $scope.prd.sustainedDataHealthGrid = healthGridData;
                }.bind());
            };

            this.getConsolidatedSysData = function (sys) {
                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'info',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    $scope.prd.consolidatedInfoData = response;
                    $scope.prd.consolidatedATO = response.decommissionInfo.atoDate;
                    $scope.prd.consolidatedDesc = response.decommissionInfo.systemDesc;
                    $scope.prd.consolidatedRec = response.decommissionInfo.recommendation;
                    $scope.prd.loadScreen = false;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'coverage',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    var obj = response.data;
                    var cleanedData = [],
                        key;
                    for (key in obj) {
                        obj[key].System = key;
                        cleanedData.push(obj[key]);
                    }
                    $scope.prd.consolidatedCoverageData = response;
                    $scope.prd.consolidatedCoverageData.title = 'System Coverage';
                    $scope.prd.consolidatedCoverageData.data = cleanedData;
                    $scope.prd.consolidatedCoverageData.headers = [
                        {
                            'title': 'System',
                            'filteredTitle': 'System',
                            'filter': {
                                'System': ''
                            }
                        },
                        {
                            'title': 'BLU',
                            'filteredTitle': 'BLU',
                            'filter': {
                                'BLU': ''
                            }
                        },
                        {
                            'title': 'Data',
                            'filteredTitle': 'Data',
                            'filter': {
                                'Data': ''
                            }
                        },
                        {
                            'title': 'Recommendation',
                            'filteredTitle': 'Recommendation',
                            'filter': {
                                'Recommendation': ''
                            }
                        }

                    ];
                    $scope.prd.consolidatedCoverageData.dataTableAlign = {
                        'System': 'System',
                        'BLU': 'BLU',
                        'Data': 'Data',
                        'Recommendation': 'Recommendation'
                    };
                    $scope.prd.consolidatedCoverageData.id = '';
                    $scope.prd.consolidatedCoverageData.layout = 'prerna.ui.components.specific.tap.SysCoverageSheetPortRat';
                    $scope.prd.consolidatedCoverageData.oldData = obj;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'healthGrid',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    var healthGridData = response;
                    healthGridData.layout = 'prerna.ui.components.specific.tap.HealthGridSheetPortRat';
                    var formattedData = utilityService.formatTableData(healthGridData.headers, healthGridData.data, true);
                    angular.extend(healthGridData, formattedData);
                    $scope.prd.consolidatedDataHealthGrid = healthGridData;
                }.bind());

                monolithService.runPlaySheetMethod(this.insightData.engine, this.chartData.insightID, {
                    'type': 'map',
                    'system': sys.name,
                    'ind': sys.ind
                }, 'getSystemPageData').then(function (response) {
                    if (response === '') {
                        return;
                    }
                    var formattedData = utilityService.formatTableData(response.headers, response.data, true);
                    angular.extend(response, formattedData);
                    $scope.prd.consolidatedDataMap = response;
                }.bind());
            };

            this.convertToNum = function (value) {
                var result = Number(value.replace(/[^0-9\.]+/g, ''));
                return result;
            };
        }
    }
})();
