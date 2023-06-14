(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.jv-scatter-tools.directive', [])
        .directive('jvScatterTools', jvScatterTools);

    jvScatterTools.$inject = [];

    function jvScatterTools() {

        jvScatterToolsCtrl.$inject = ["$scope"];
        jvScatterToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'jvScatterTools',
            bindToController: {},
            templateUrl: 'custom/jv-scatter/jv-scatter-tools.directive.html',
            controller: jvScatterToolsCtrl,
            link: jvScatterToolsLink
        };
        function jvScatterToolsCtrl($scope) {
            var jvScatterTools = this;
            jvScatterTools.updateVisualization = updateVisualization;


            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                $scope.toolPanelCtrl.updateUiOptions(fn, data);
                $scope.toolPanelCtrl.toolUpdater(fn, data);
            }
        }

        function jvScatterToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];
        }

    }
})();
