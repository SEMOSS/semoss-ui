(function () {
    'use strict';
    /**
     * @name clustering
     * @desc directive that sets options for clustering
     */
    angular.module('app.clustering.directive', [])
        .directive('clustering', clustering);

    clustering.$inject = [];
    function clustering() {

        clusteringLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'A',
            scope: {},
            require: ['^analyticsPanel'],
            templateUrl: 'custom/clustering/clustering.directive.html',
            link: clusteringLink
        };

        function clusteringLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.analyticsPanel = ctrl[0];
        }


    }
})(); //end of controller IIFE
