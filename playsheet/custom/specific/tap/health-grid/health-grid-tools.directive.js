(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.tap.health-grid-tools.directive', [])
        .directive('healthGridTools', healthGridTools);

    healthGridTools.$inject = ['$filter', 'VIZ_COLORS'];

    function healthGridTools($filter, VIZ_COLORS) {

        healthGridToolsCtrl.$inject = ["$scope"];
        healthGridToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'healthGridTools',
            bindToController: {},
            templateUrl: 'custom/specific/tap/health-grid/health-grid-tools.directive.html',
            controller: healthGridToolsCtrl,
            link: healthGridToolsLink
        };
        function healthGridToolsCtrl($scope) {
            var healthGridTools = this;
            healthGridTools.updateVisualization = updateVisualization;

            healthGridTools.showMore = false;
            healthGridTools.toggleZ = false;

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                $scope.toolPanelCtrl.toolUpdater(fn, data);
                $scope.toolPanelCtrl.updateUiOptions(fn, data);
            }


            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
            }

            initialize();

        }

        function healthGridToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];
            scope.customColors = {};

            setToolData();

            /**
             * @name setToolData
             * @desc function that pulls the data from uiOptions into tools so that tools will display the updated state of
             *       the chart
             */
            function setToolData() {
                var additionalToolData = scope.toolPanelCtrl.selectedData.uiOptions;

            }

        }

    }
})();
