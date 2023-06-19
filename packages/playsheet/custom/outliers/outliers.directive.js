(function () {
    'use strict';
    /**
     * @name outliers
     * @desc directive that sets options for outliers
     */
    angular.module('app.outliers.directive', [])
        .directive('outliers', outliers);

    outliers.$inject = [];
    function outliers() {

        outliersLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'A',
            scope: {},
            require: ['^analyticsPanel'],
            templateUrl: 'custom/outliers/outliers.directive.html',
            link: outliersLink
        };

        function outliersLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.analyticsPanel = ctrl[0];
        }


    }
})(); //end of controller IIFE
