(function () {
    'use strict';
    angular.module('app.tap.portratdsysdecom', [])
        .directive('portratSysDecom', portratSysDecom);

    portratSysDecom.$inject = ['$rootScope', 'notificationService'];

    function portratSysDecom($rootScope, notificationService) {
        
        PortRatSysDecomLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'E',
            require: ['^portrat'],
            scope: {
                containerClass: "=",
                sidebarActive: "=",
                data: "="
            },
            templateUrl: 'custom/specific/tap/portratdashboard/portratsysdecom/portratsysdecom.html',
            link: PortRatSysDecomLink
        }

        function PortRatSysDecomLink(scope, ele, attrs, controllers) {
            scope.portratController = controllers[0];
            var systemList = [];

            //ID constants for data updating
            scope.decomMap = "decomMap";
            scope.healthGrid = "healthGrid";
            scope.sysCoverage = "sysCoverage";

            var infoCleanUpFunc = scope.$watch('portratController.consolidatedInfoData', function () {
                if (!_.isEmpty(scope.portratController.consolidatedInfoData)) {
                    systemList = scope.portratController.portRatSystemList;
                    var infoData = JSON.parse(JSON.stringify(scope.portratController.consolidatedInfoData));

                    if (!_.isEmpty(infoData.dataBluInfo)) {
                        var indUpstreamSystems = [];
                        _(infoData.dataBluInfo.upstreamSystems).forEach(function (n) {
                            _(systemList).forEach(function (s) {
                                if (n === s.name)
                                    indUpstreamSystems.push(s);
                            });
                        });

                        var indDownstreamSystems = [];
                        _(infoData.dataBluInfo.downstreamSystems).forEach(function (n) {
                            _(systemList).forEach(function (s) {
                                if (n === s.name)
                                    indDownstreamSystems.push(s);
                            });
                        });

                        scope.dataBluInfo = infoData.dataBluInfo;
                        scope.dataBluInfo.bluProvided = infoData.dataBluInfo.bluCount;
                        scope.dataBluInfo.dataProvided = infoData.dataBluInfo.dataCount;
                        scope.dataBluInfo.upstreamSystems = indUpstreamSystems;
                        scope.dataBluInfo.downstreamSystems = indDownstreamSystems;
                        scope.decommissionInfo = infoData.decommissionInfo;
                        scope.budgetInfo = infoData.budgetInfo;
                        scope.budgetInfoChangeNumVal = scope.portratController.convertToNum(scope.budgetInfo.formattedCurrentSustVal) - scope.portratController.convertToNum(scope.budgetInfo.formattedFutureSustVal);
                    }
                }
            }.bind(this), true);

            var capabilityCleanUpFunc = scope.$watch('portratController.consolidatedCoverageData', function () {
                if (!_.isEmpty(scope.portratController.consolidatedCoverageData)) {
                    scope.systemCoverageData = scope.portratController.consolidatedCoverageData;
                    notificationService.notify('chart-data-change', scope.systemCoverageData, scope.sysCoverage);
                    $rootScope.$emit('vizContainerLoadScreenOff');
                }
            }.bind(this), true);

            var mapCleanUpFunc = scope.$watch('portratController.consolidatedDataMap', function () {
                if (!_.isEmpty(scope.portratController.consolidatedDataMap)) {
                    scope.recommendedActionMapData = scope.portratController.consolidatedDataMap;
                    scope.recommendedActionMapData.title = 'Future Site Map';
                    notificationService.notify('chart-data-change', scope.recommendedActionMapData, scope.decomMap);
                }
            }.bind(this), true);

            var healthGridCleanUpFunc = scope.$watch('portratController.consolidatedDataHealthGrid', function () {
                if (!_.isEmpty(scope.portratController.consolidatedDataHealthGrid)) {
                    scope.healthGridData = scope.portratController.consolidatedDataHealthGrid;
                    scope.healthGridData.title = 'Health of Systems';
                    notificationService.notify('chart-data-change', scope.healthGridData, scope.healthGrid);
                }
            }.bind(this), true);

            scope.$on("$destroy", function sysModDestroyer() {
                infoCleanUpFunc();
                capabilityCleanUpFunc();
                mapCleanUpFunc();
                healthGridCleanUpFunc();
            });

            scope.tabIndex = "coverage";
            scope.setView = function (view) {
                $rootScope.$broadcast("prd-sysdecom.set-view", view);
                scope.tabIndex = view;
            }
        }
    }
})(); //end of controller IIFE
