(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.sunburst-tools.directive', [])
        .directive('sunburstTools', sunburstTools);

    sunburstTools.$inject = ['VIZ_COLORS'];

    function sunburstTools(VIZ_COLORS) {

        sunburstToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        sunburstToolsCtrl.$inject = ["$scope"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'sunburstTools',
            bindToController: {},
            templateUrl: 'custom/sunburst/sunburst-tools.directive.html',
            controller: sunburstToolsCtrl,
            link: sunburstToolsLink
        };

        function sunburstToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

            setToolData();

            /**
             * @name setToolData
             * @desc function that pulls the data from uiOptions into tools so that tools will display the updated state of
             *       the chart
             */
            function setToolData() {
                scope.sunburstTools.labelOnButton = scope.toolPanelCtrl.selectedData.uiOptions.labelOnButton;
            }

        }

        function sunburstToolsCtrl($scope) {
            var sunburstTools = this;
            
            //variables
            sunburstTools.color = [];
            sunburstTools.colorName = 'Semoss';
            sunburstTools.updateColor = updateColor;
            sunburstTools.labelOnButton = "true";
            sunburstTools.showMore = false;


            //functions
            sunburstTools.showHideColors = showHideColors;
            sunburstTools.updateColor = updateColor;
            sunburstTools.updateVisualization = updateVisualization;

            //set up colors
            sunburstTools.colorPanels = [];

            sunburstTools.colorPanels.push({'name': 'Semoss', 'displayName': 'Semoss', 'colors': VIZ_COLORS.COLOR_SEMOSS});
            sunburstTools.colorPanels.push({'name': 'One', 'displayName': 'Option 1', 'colors': VIZ_COLORS.COLOR_ONE});
            sunburstTools.colorPanels.push({'name': 'Two', 'displayName': 'Option 2', 'colors': VIZ_COLORS.COLOR_TWO});
            sunburstTools.colorPanels.push({'name': 'Three', 'displayName': 'Option 3', 'colors': VIZ_COLORS.COLOR_THREE});
            sunburstTools.colorPanels.push({'name': 'Four', 'displayName': 'Option 4', 'colors': VIZ_COLORS.COLOR_FOUR});
            sunburstTools.colorPanels.push({'name': 'Five', 'displayName': 'Option 5', 'colors': VIZ_COLORS.COLOR_FIVE});
            sunburstTools.colorPanels.push({'name': 'Six', 'displayName': 'Option 6', 'colors': VIZ_COLORS.COLOR_SIX});

            //If a color not shown by default is chosen, expand the color palette selection to show all
            function showHideColors(){
                if(sunburstTools.colorName === 'Three' || sunburstTools.colorName === 'Four' || sunburstTools.colorName === 'Five' || sunburstTools.colorName === 'Six'){
                    sunburstTools.showMore = true;
                }
                return sunburstTools.showMore;
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
