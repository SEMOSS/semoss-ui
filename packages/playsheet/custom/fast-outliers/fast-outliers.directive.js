
(function () {
    'use strict';
    /**
     * @name fast outliers
     * @desc directive that sets options for fast outliers
     */
    angular.module('app.fastOutliers.directive', [])
        .directive('fastOutliers', fastOutliers);

    fastOutliers.$inject = [];


    function fastOutliers() {

        fastOutliersLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        return {
            restrict: 'A',
            scope: {},
            require: ['^analyticsPanel'],
            templateUrl: 'custom/fast-outliers/fast-outliers.directive.html',
            link: fastOutliersLink
        };

        function fastOutliersLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.analyticsPanel = ctrl[0];
        }
    }
}()); //end of controller IIFE