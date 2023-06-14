(function () {
    'use strict';
    angular.module('app.tap.portratdashboard', [])
        .directive('portratdashboard', portratdashboard);

    portratdashboard.$inject = ['$rootScope', '$filter'];

    function portratdashboard($rootScope, $filter) {

        PortRatDashboardCtrl.$inject = ["$rootScope", "$scope"];
        PortRatDashboardLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];

        return {
            restrict: 'E',
            require: ['^portrat'],
            templateUrl: 'custom/specific/tap/portratdashboard/portratdashboard/portratdashboard.html',
            bindToController: {
                chartName: "="
            },
            link: PortRatDashboardLink,
            controller: PortRatDashboardCtrl,
            controllerAs: 'prdash'
        }        

        function PortRatDashboardCtrl($rootScope, $scope) {
            this.viewType = "Overview";
            this.capabilitySelection = "";
        }        

        function PortRatDashboardLink(scope, ele, attrs, controllers) {
            scope.portratController = controllers[0];
            scope.title = "Recommendations Overview";
            if (scope.portratController.insightData.params.Capability !== undefined) {
                scope.portratController.capabilitySelection = $filter('replaceUnderscores')($filter('shortenAndReplaceUnderscores')(scope.portratController.insightData.params.Capability.selected));
                scope.prdash.capabilitySelection = scope.portratController.capabilitySelection;
                scope.title = scope.title + " - " + scope.portratController.capabilitySelection;
            }
            scope.systemDisposition = "";

            //set the title of the current view
            function setTitle(selection) {
                if (selection.ind === "Overview") {
                    scope.title = "Recommendations Overview";
                    scope.systemDisposition = "";
                } else if (selection.ind === "Recommended Consolidation") {
                    scope.title = selection.name + " Function View - ";
                    scope.systemDisposition = "Consolidate";

                } else if (selection.ind === "Recommended Sustain") {
                    scope.title = selection.name + " Function View - ";
                    scope.systemDisposition = "Sustain";
                }
            };

            //set to either system - decom , system - modernize, capability, or overview
            scope.setViewType = function (selection) {
                setTitle(selection);

                if (selection.ind != undefined) {
                    selection.ind = selection.ind.replace(/_/g," ");
                    scope.prdash.viewType = selection.ind;
                }
                if (selection.ind === "Overview") {
                    scope.portratController.getOverviewData()
                } else if (selection.ind === "Recommended Consolidation") {
                    scope.portratController.getConsolidatedSysData(selection);

                } else if (selection.ind === "Recommended Sustain") {
                    scope.portratController.getSustainedSysData(selection);

                }
            };

            var viewTypeSysCleanUpFunc = scope.$watch('portratController.currentSystemData', function () {
                if (scope.portratController.currentSystemData != undefined) {
                    scope.setViewType(scope.portratController.currentSystemData);
                }
            }.bind(this), true);

            var sysSustainedDescriptionCleanUp = scope.$watch('portratController.sustainedATO', function () {
                if (scope.portratController.sustainedATO != "") {
                    scope.atoDate = scope.portratController.sustainedATO;
                    scope.recommendation = scope.portratController.sustainedRec;
                    scope.systemDesc = scope.portratController.sustainedDesc;
                }
            }.bind(this), true);

            var sysConsolidatedDescriptionCleanUp = scope.$watch('portratController.consolidatedATO', function () {
                if (scope.portratController.consolidatedATO != "") {
                    scope.atoDate = scope.portratController.consolidatedATO;
                    scope.recommendation = scope.portratController.consolidatedRec;
                    scope.systemDesc = scope.portratController.consolidatedDesc;
                }
            }.bind(this), true);

            scope.portratController.getOverviewData();

            scope.$on("$destroy", function portRatDashboardLinkDestroyer() {
                viewTypeSysCleanUpFunc();
                sysSustainedDescriptionCleanUp()
                sysConsolidatedDescriptionCleanUp();
            });
        }
    }

})(); //end of controller IIFE
