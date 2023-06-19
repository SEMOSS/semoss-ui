(function() {
    'use strict';
    angular.module('app.tap.portratcap', [])
        .directive('portratCap', portratCap);

    portratCap.$inject = ['$rootScope', 'portratdashboardService'];

    function portratCap($rootScope, portratdashboardService) {
        PortRatCapLink.$inject = ['scope', 'ele', 'attrs'];

        function PortRatCapLink(scope, ele, attrs) {
            //keeping dummy data structure for now
            /*scope.systemCoverageData = { "ABTS": { "BLU": ["Patient Recognition", "Assessment Correlation"], "Data": ["Patient ID"] }, "CAROUSEL": { "BLU": ["Patient Recognition"], "Data": ["Patient ID", "Patient Immunization", "Allergy Medicine"] }, "CCS": { "BLU": ["Assessment Correlation"], "Data": ["Order Set Generation", "Prescription Compliance Validation", "Patient Prescription", "Adverse Drugs Interaction Warning"] }, "CCQAS": { "BLU": ["Patient Test", "Patient Prescription Adjustment", "Patient Record Management", "Patient Immunization Recommendation", "Generate Form"], "Data": ["Patient ID", "Allergy Information", "Patient Vital Signs", "Patient Prescription"] }, "BIONUMERICS": { "BLU": ["Treatment Plan Generation", "Patient Result Validation", "Vendor Filtering", "Task Assignment Generation", "Training Recommendation", "Warfighter Equipment Recommendation"], "Data": ["Patient ID", "Allergy Information", "Patient Prescription"] }, "AHLTA-M": { "BLU": ["Task Assignment Generation", "Patient Result Validation", "Vendor Filtering"], "Data": ["Patient ID", "Prescription Compliance Validation", "Patient Vital Signs"] }, "VISIX": { "BLU": ["Vendor Filtering", "Patient Immunization Recommendation"], "Data": ["Adverse Drugs Interaction Warning", "Patient Vital Signs"] }, "DAENARYS": { "BLU": ["Training Recommendation", "Information Technology Performance Validation", "Assessment Correlation"], "Data": ["Patient ID", "Allergy Information", "Patient Vital Signs", "Allergy Medicine"] }, "ICDB": { "BLU": ["Materiel Management", "Patient Result Validation", "Lab Test Drug Restriction", "Warfighter Equipment Recommendation", "Generate Form", "Patient Record Management"], "Data": ["Patient ID", "Allergy Information", "Patient Vital Signs", "Adverse Drugs Interaction Warning", ""] }, "OMNICELL": { "BLU": ["Materiel Management", "Patient Prescription Adjustment", "Warfighter Equipment Recommendation", "Generate Form", "Vendor Filtering"], "Data": ["Order Set Generation", "Allergy Information", "Patient Vital Signs", "Prescription Compliance Validation", "Order Set Generation"] }, "Uncovered": { "BLU": ["uncoveredblu1", "uncoveredblu2", "uncoveredblu3", "uncoveredblu4", "uncoveredblu5"], "Data": ["uncovereddata1", "uncovereddata2"] } };*/

            var infoCleanUpFunc = $rootScope.$on('prd-capability-info-data', function(evt) {
                var infoData = portratdashboardService.getCapabilityDataInfo();
                scope.dataBluInfo = infoData.dataBluInfo;
                scope.capabilityDesc = infoData.capabilityDesc;
                scope.budgetInfo = infoData.budgetInfo;
            });

            var coverageCleanUpFunc = $rootScope.$on('prd-capability-coverage-data', function(evt) {
                scope.systemCoverageData = portratdashboardService.getCapabilityDataCoverage();
            });

            var healthGridCleanUpFunc = $rootScope.$on('prd-capability-healthGrid-data', function(evt) {
                scope.healthGridData = portratdashboardService.getCapabilityDataHealthGrid();
            });

            var mapCleanUpFunc = $rootScope.$on('prd-capability-map-data', function(evt) {
                scope.recommendedActionMapData = portratdashboardService.getCapabilityDataMap();
            });

            scope.$on("$destroy", function prdCapDestroyer() {
                infoCleanUpFunc();
                coverageCleanUpFunc();
                mapCleanUpFunc();
                healthGridCleanUpFunc();
            });

            scope.tabIndex = "coverage";
            scope.setView = function(view) {
                $rootScope.$broadcast("prd-cap.set-view", view);
                scope.tabIndex = view;
            }
        }

        return {
            restrict: 'E',
            scope: {
                containerClass: "=",
                sidebarActive: "=",
                data: "="
            },
            templateUrl: 'custom/specific/tap/portratdashboard/portratcap/portratcap.html',
            link: PortRatCapLink
        };
    }
})(); //end of controller IIFE
