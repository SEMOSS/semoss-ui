(function () {
    'use strict';
    angular.module('app.tap.portratoverview', [])
        .directive('portratOverview', portratOverview);

    portratOverview.$inject = ['$rootScope', 'utilityService', 'portratdashboardService', 'notificationService'];

    function portratOverview($rootScope, utilityService, portratdashboardService, notificationService) {

        PortRatOverviewLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'E',
            require: ['^portrat', '^portratdashboard'],
            scope: {
                chartName: "="
            },
            controllerAs: "prd-overview",
            templateUrl: 'custom/specific/tap/portratdashboard/portratoverview/portratoverview.html',
            link: PortRatOverviewLink
        }        

        function PortRatOverviewLink(scope, ele, attrs, controllers) {
            scope.portratController = controllers[0];
            scope.prdController = controllers[1];
            scope.capToggleToggle = false;

            //ID constants for data updating
            scope.overviewMap = "overviewMap";
            scope.capCoverageMap = "capCoverageMap";
            scope.healthGrid = "healthGrid";
            scope.sysCoverage = "sysCoverage";

            var infoCleanUpFunc = scope.$watch('portratController.overviewInfoData', function () {
                if (!_.isEmpty(scope.portratController.overviewInfoData)) {
                    var systemInfo = scope.portratController.overviewInfoData.systemInfo;
                    //systemInfo.yearsToTransition = systemInfo.yearsToTransition;
                    scope.systemInfo = systemInfo;
                    scope.budgetInfo = scope.portratController.overviewInfoData.budgetInfo;
                    scope.budgetInfoChangeNumVal = scope.portratController.convertToNum(scope.budgetInfo.formattedCurrentSustVal) - scope.portratController.convertToNum(scope.budgetInfo.formattedFutureSustVal);
                }
            }.bind(this), true);

            var healthGridCleanUpFunc = scope.$watch('portratController.overviewDataHealthGrid', function () {
                if (!_.isEmpty(scope.portratController.overviewDataHealthGrid)) {
                    scope.healthGridData = scope.portratController.overviewDataHealthGrid;
                    scope.healthGridData.title = 'Health of Systems';
                    notificationService.notify('chart-data-change', scope.healthGridData, scope.healthGrid);
                }
            }.bind(this), true);

            var mapCleanUpFunc = scope.$watch('portratController.overviewMapData', function () {
                if (!_.isEmpty(scope.portratController.overviewMapData)) {
                    scope.recommendedActionMapData = scope.portratController.overviewMapData;
                    scope.recommendedActionMapData.title = 'Future Site Map';
                    scope.recommendedActionMapData.layout = 'WorldMap';
                    if (scope.prdController.capabilitySelection !== "")
                        scope.capToggleToggle = true;
                    notificationService.notify('chart-data-change', scope.recommendedActionMapData, scope.overviewMap);
                    $rootScope.$emit('vizContainerLoadScreenOff');
                }
            }.bind(this), true);

            var capMapCleanUpFunc = scope.$watch('portratController.overviewCapabilityMapData', function () {
                if (!_.isEmpty(scope.portratController.overviewCapabilityMapData)) {
                    scope.capabilityMapData = scope.portratController.overviewCapabilityMapData;
                    scope.capabilityMapData.title = 'Future Site Map';
                    scope.capabilityMapData.layout = 'WorldMap';
                    notificationService.notify('chart-data-change', scope.capabilityMapData, scope.capCoverageMap);
                    $rootScope.$emit('vizContainerLoadScreenOff');
                }
            }.bind(this), true);

            var sysCoverageCleanUpFunc = scope.$watch('portratController.overviewCoverageData', function () {
                if (!_.isEmpty(scope.portratController.overviewCoverageData)) {
                    scope.overviewSystemCoverage = scope.portratController.overviewCoverageData;
                    notificationService.notify('chart-data-change', scope.overviewSystemCoverage, scope.sysCoverage);
                    $rootScope.$emit('vizContainerLoadScreenOff');
                }
            }.bind(this), true);

            function convertToYears(value) {
                var totalDays = value * 365;
                var years = Math.floor(totalDays / 365);
                var months = Math.floor((totalDays - (years * 365)) / 30);
                var result = years + " years, " + months + " months";
                if (years === 0)
                    result = months + " months";
                return result;
            };

            scope.tabIndex = "coverage";
            scope.setView = function (view) {
                $rootScope.$broadcast("prd-mod.set-view", view);
                scope.tabIndex = view;
            };

            scope.mapViewToggle = "savings";
            scope.setMapView = function (mapView) {
                scope.mapViewToggle = mapView;
            };

            scope.$on('$destroy', function () {
                infoCleanUpFunc();
                healthGridCleanUpFunc();
                mapCleanUpFunc();
                capMapCleanUpFunc();
                sysCoverageCleanUpFunc();
            });
        }
    }
})(); //end of controller IIFE