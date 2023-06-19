(function () {
    'use strict';
    /**
     * @name matrix regression
     * @desc directive that sets options for matrix regression
     */
    angular.module('app.matrixRegression.directive', [])
        .directive('matrixRegression', matrixRegression);

    matrixRegression.$inject = [];
    function matrixRegression() {

        matrixRegressionLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'A',
            scope: {},
            require: ['^analyticsPanel'],
            templateUrl: 'custom/matrix-regression/matrix-regression.directive.html',
            link: matrixRegressionLink
        };

        function matrixRegressionLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.analyticsPanel = ctrl[0];
        }
    }
}()); //end of controller IIFE
