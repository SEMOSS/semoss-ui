(function () {
    'use strict';
    angular.module('app.tap.portratsysmod', [])
        .directive('portratSysMod', portratSysMod);

    portratSysMod.$inject = ['$rootScope', 'notificationService'];

    function portratSysMod($rootScope, notificationService) {

        PortRatSysModLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'E',
            require: ['^portrat'],
            scope: {
                containerClass: "=",
                sidebarActive: "=",
                data: "="
            },
            templateUrl: 'custom/specific/tap/portratdashboard/portratsysmod/portratsysmod.html',
            link: PortRatSysModLink
        }

        function PortRatSysModLink(scope, ele, attrs, controllers) {
            scope.portratController = controllers[0];
            var systemList = [];

            //ID constants for data updating
            scope.modMap = "modMap";
            scope.healthGrid = "healthGrid";
            scope.sysCoverage = "sysCoverage";

            var infoCleanUpFunc = scope.$watch('portratController.sustainedInfoData', function () {
                if (!_.isEmpty(scope.portratController.sustainedInfoData)) {
                    systemList = scope.portratController.portRatSystemList;
                    var infoData = JSON.parse(JSON.stringify(scope.portratController.sustainedInfoData));

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

            var capabilityCleanUpFunc = scope.$watch('portratController.sustainedCapabilityData', function () {
                if (!_.isEmpty(scope.portratController.sustainedCapabilityData)) {
                    scope.systemCoverageData = scope.portratController.sustainedCapabilityData;
                    $rootScope.$emit('vizContainerLoadScreenOff');
                    notificationService.notify('chart-data-change', scope.systemCoverageData, scope.sysCoverage);
                }
            }.bind(this), true);

            var mapCleanUpFunc = scope.$watch('portratController.sustainedDataMap', function () {
                if (!_.isEmpty(scope.portratController.sustainedDataMap)) {
                    scope.recommendedActionMapData = scope.portratController.sustainedDataMap;
                    scope.recommendedActionMapData.title = 'Future Site Map';
                    notificationService.notify('chart-data-change', scope.recommendedActionMapData, scope.modMap);
                }
            }.bind(this), true);

            var healthGridCleanUpFunc = scope.$watch('portratController.sustainedDataHealthGrid', function () {
                if (!_.isEmpty(scope.portratController.sustainedDataHealthGrid)) {
                    scope.healthGridData = scope.portratController.sustainedDataHealthGrid;
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
                $rootScope.$broadcast("prd-mod.set-view", view);
                scope.tabIndex = view;
            }
        }
    }
})(); //end of controller IIFE
