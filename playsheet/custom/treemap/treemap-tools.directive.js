(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.treemap-tools.directive', [])
        .directive('treeMapTools', treeMapTools);

    treeMapTools.$inject = ['VIZ_COLORS'];

    function treeMapTools(VIZ_COLORS) {

        treeMapToolsCtrl.$inject = ["$scope"];
        treeMapToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'treeMapTools',
            bindToController: {},
            templateUrl: 'custom/treemap/treemap-tools.directive.html',
            controller: treeMapToolsCtrl,
            link: treeMapToolsLink
        };

        function treeMapToolsCtrl($scope) {
            var treeMapTools = this;
            treeMapTools.color = [];
            treeMapTools.colorName = 'Semoss';
            treeMapTools.backgroundColor = '#FFFFFF';
            treeMapTools.updateCustomColor = updateCustomColor;
            treeMapTools.updateColor = updateColor;
            treeMapTools.showHideColors = showHideColors;
            treeMapTools.colorToggle = false;
            treeMapTools.showMore = false;
            treeMapTools.customColor = false;
            treeMapTools.customColorUpdate = customColorUpdate;
            treeMapTools.backgroundColorUpdate = backgroundColorUpdate;

            //set up colors
            treeMapTools.colorPanels = [];

            treeMapTools.colorPanels.push({'name': 'Semoss', 'displayName': 'Semoss', 'colors': VIZ_COLORS.COLOR_SEMOSS});
            treeMapTools.colorPanels.push({'name': 'One', 'displayName': 'Option 1', 'colors': VIZ_COLORS.COLOR_ONE});
            treeMapTools.colorPanels.push({'name': 'Two', 'displayName': 'Option 2', 'colors': VIZ_COLORS.COLOR_TWO});
            treeMapTools.colorPanels.push({'name': 'Three', 'displayName': 'Option 3', 'colors': VIZ_COLORS.COLOR_THREE});
            treeMapTools.colorPanels.push({'name': 'Four', 'displayName': 'Option 4', 'colors': VIZ_COLORS.COLOR_FOUR});
            treeMapTools.colorPanels.push({'name': 'Five', 'displayName': 'Option 5', 'colors': VIZ_COLORS.COLOR_FIVE});
            treeMapTools.colorPanels.push({'name': 'Six', 'displayName': 'Option 6', 'colors': VIZ_COLORS.COLOR_SIX});


            function backgroundColorUpdate() {
                $scope.toolPanelCtrl.updateUiOptions('backgroundColor', treeMapTools.backgroundColor);
                $scope.toolPanelCtrl.toolUpdater('backgroundColor', treeMapTools.backgroundColor);
            }

            function updateCustomColor(title, value) {
                $scope.customColors[title] = value;
                $scope.toolPanelCtrl.updateUiOptions('color', $scope.customColors);
                $scope.toolPanelCtrl.updateUiOptions('colorName', 'Custom');
                $scope.toolPanelCtrl.toolUpdater('customColors', $scope.customColors);
            }

            function updateColor(value){
                $scope.toolPanelCtrl.updateVizColor(value);
                $scope.toolPanelCtrl.updateUiOptions('colorName',value);
                $scope.toolPanelCtrl.toolUpdater('colorChange',  $scope.toolPanelCtrl.selectedData.uiOptions.color);
            }

            function customColorUpdate(){
                $scope.toolPanelCtrl.updateUiOptions('color', $scope.customColors);
                $scope.toolPanelCtrl.updateUiOptions('colorName', 'Custom');
                $scope.toolPanelCtrl.toolUpdater('customColors', $scope.customColors);
            }

            //If a color not shown by default is chosen, expand the color palette selection to show all
            function showHideColors(){
                if(treeMapTools.colorName === 'Three' || treeMapTools.colorName === 'Four' || treeMapTools.colorName === 'Five' || treeMapTools.colorName === 'Six'){
                    treeMapTools.showMore = true;
                }
                return treeMapTools.showMore;
            }


            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
            }

            initialize();
        }

        function treeMapToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

            setToolData();

            /**
             * @name setToolData
             * @desc function that pulls the data from uiOptions into tools so that tools will display the updated state of
             *       the chart
             */
            function setToolData() {
                var selectedData = scope.toolPanelCtrl.selectedData;
                var toolData = selectedData.uiOptions;
                scope.treeMapTools.colorName = toolData.colorName;
                scope.customColorLabels = setCustomColorLabels(selectedData);
                scope.customColors = setCustomColors(toolData, scope.customColorLabels);
                scope.treeMapTools.backgroundColor = setBackgroundColor(selectedData.uiOptions);
            }
        }
        

        /*********************Set Tool Data Functions*******************************/
        /** setCustomColorLabels
         *
         * @desc sets the labels that show in the tool panel for custom colors
         * @param selectedData
         * @returns array of labels
         */
        function setCustomColorLabels(selectedData) {
            //this function is different for pie than for the other jv viz's

            var labels = [];
            for (var i = 0; i < selectedData.filteredData.length; i++) {
                if(labels.indexOf(selectedData.filteredData[i][selectedData.dataTableAlign.group]) == -1) {
                    labels.push(selectedData.filteredData[i][selectedData.dataTableAlign.group]);
                }
            }
            return labels;
        }

        /** setCustomColors
         *
         * @desc sets the color object that shows initial color selection if custom colors have been saved
         * @param selectedData
         * @returns object of colors
         */
        function setCustomColors(toolData, labels) {
            var customColors = {};

            //If custom colors haven't already been chosen, fill custom color array with gray
            if(toolData.colorName !== 'Custom') {
                for (var i = 0; i < labels.length; i++) {
                    customColors[labels[i]] = '#AAAAAA';
                }
            } else if(toolData.colorName === 'Custom') {
                var color = toolData.color;
                if(_.isArray(color)) {
                    for (var i = 0; i < toolData.colorLabels.length; i++) {
                        customColors[toolData.colorLabels[i]] = color[i];
                    }
                } else {
                    customColors = color;
                }
            }
            return customColors;
        }

        /** setBackgroundColor
         *
         * @desc sets the default sort label in the tool panel
         * @param toolData
         * @returns string of background color, either white or the saved background color
         */
        function setBackgroundColor(toolData){
            var backgroundColor = 'FFFFFF';
            if(toolData.backgroundColor) {
                backgroundColor = toolData.backgroundColor;
            }
            return backgroundColor;
        }

    }
})();
