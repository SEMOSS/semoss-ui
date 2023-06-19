(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.gantt-tools.directive', [])
        .directive('ganttTools', ganttTools);

    ganttTools.$inject = ['$filter', 'VIZ_COLORS'];

    function ganttTools($filter, VIZ_COLORS) {

        ganttToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        ganttToolsCtrl.$inject = ["$scope"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'ganttTools',
            bindToController: {},
            templateUrl: 'custom/gantt/gantt-tools.directive.html',
            controller: ganttToolsCtrl,
            link: ganttToolsLink
        };

        function ganttToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

            setToolData();

            /**
             * @name setToolData
             * @desc function that pulls the data from uiOptions into tools so that tools will display the updated state of
             *       the chart
             */
            function setToolData() {
                scope.ganttTools.labelOnButton = scope.toolPanelCtrl.selectedData.uiOptions.labelOnButton;
            }

        }

        function ganttToolsCtrl($scope) {
            var ganttTools = this;

            //variables
            ganttTools.color = [];
            ganttTools.colorName = 'Semoss';
            ganttTools.updateColor = updateColor;
            ganttTools.labelOnButton = "true";
            ganttTools.showMore = false;


            //functions
            ganttTools.showHideColors = showHideColors;
            ganttTools.updateColor = updateColor;
            ganttTools.updateVisualization = updateVisualization;

            //set up colors
            ganttTools.colorPanels = [];

            ganttTools.colorPanels.push({'name': 'Semoss', 'displayName': 'Semoss', 'colors': VIZ_COLORS.COLOR_SEMOSS});
            ganttTools.colorPanels.push({'name': 'One', 'displayName': 'Option 1', 'colors': VIZ_COLORS.COLOR_ONE});
            ganttTools.colorPanels.push({'name': 'Two', 'displayName': 'Option 2', 'colors': VIZ_COLORS.COLOR_TWO});
            ganttTools.colorPanels.push({'name': 'Three', 'displayName': 'Option 3', 'colors': VIZ_COLORS.COLOR_THREE});
            ganttTools.colorPanels.push({'name': 'Four', 'displayName': 'Option 4', 'colors': VIZ_COLORS.COLOR_FOUR});
            ganttTools.colorPanels.push({'name': 'Five', 'displayName': 'Option 5', 'colors': VIZ_COLORS.COLOR_FIVE});
            ganttTools.colorPanels.push({'name': 'Six', 'displayName': 'Option 6', 'colors': VIZ_COLORS.COLOR_SIX});

            //If a color not shown by default is chosen, expand the color palette selection to show all
            function showHideColors(){
                if(ganttTools.colorName === 'Three' || ganttTools.colorName === 'Four' || ganttTools.colorName === 'Five' || ganttTools.colorName === 'Six'){
                    ganttTools.showMore = true;
                }
                return ganttTools.showMore;
            }

            function updateColor(value){
                $scope.toolPanelCtrl.updateVizColor(value);
                $scope.toolPanelCtrl.updateUiOptions('colorName',value);
                $scope.toolPanelCtrl.toolUpdater('colorChange',  $scope.toolPanelCtrl.selectedData.uiOptions.color);
            }

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                $scope.toolPanelCtrl.updateUiOptions(fn, data);
                $scope.toolPanelCtrl.toolUpdater(fn, data);
            }



            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
            }

            initialize();

        }
    }

})();
