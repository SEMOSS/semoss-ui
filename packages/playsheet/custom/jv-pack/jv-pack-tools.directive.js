(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.jv-pack-tools.directive', [])
        .directive('jvPackTools', jvPackTools);

    jvPackTools.$inject = ['VIZ_COLORS'];

    function jvPackTools(VIZ_COLORS) {

        jvPackToolsCtrl.$inject = ["$scope"];
        jvPackToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'jvPackTools',
            bindToController: {},
            templateUrl: 'custom/jv-pack/jv-pack-tools.directive.html',
            controller: jvPackToolsCtrl,
            link: jvPackToolsLink
        };

        function jvPackToolsCtrl($scope) {
            var jvPackTools = this;
            jvPackTools.color = [];
            jvPackTools.colorName = 'Semoss';
            jvPackTools.backgroundColor = '#FFFFFF';
            jvPackTools.updateCustomColor = updateCustomColor;
            jvPackTools.updateColor = updateColor;
            jvPackTools.showHideColors = showHideColors;
            jvPackTools.colorToggle = false;
            jvPackTools.showMore = false;
            jvPackTools.customColor = false;
            jvPackTools.customColorUpdate = customColorUpdate;
            jvPackTools.backgroundColorUpdate = backgroundColorUpdate;

            //set up colors
            jvPackTools.colorPanels = [];

            jvPackTools.colorPanels.push({'name': 'Semoss', 'displayName': 'Semoss', 'colors': VIZ_COLORS.COLOR_SEMOSS});
            jvPackTools.colorPanels.push({'name': 'One', 'displayName': 'Option 1', 'colors': VIZ_COLORS.COLOR_ONE});
            jvPackTools.colorPanels.push({'name': 'Two', 'displayName': 'Option 2', 'colors': VIZ_COLORS.COLOR_TWO});
            jvPackTools.colorPanels.push({'name': 'Three', 'displayName': 'Option 3', 'colors': VIZ_COLORS.COLOR_THREE});
            jvPackTools.colorPanels.push({'name': 'Four', 'displayName': 'Option 4', 'colors': VIZ_COLORS.COLOR_FOUR});
            jvPackTools.colorPanels.push({'name': 'Five', 'displayName': 'Option 5', 'colors': VIZ_COLORS.COLOR_FIVE});
            jvPackTools.colorPanels.push({'name': 'Six', 'displayName': 'Option 6', 'colors': VIZ_COLORS.COLOR_SIX});


            function backgroundColorUpdate() {
                $scope.toolPanelCtrl.updateUiOptions('backgroundColor', jvPackTools.backgroundColor);
                $scope.toolPanelCtrl.toolUpdater('backgroundColor', jvPackTools.backgroundColor);
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
                if(jvPackTools.colorName === 'Three' || jvPackTools.colorName === 'Four' || jvPackTools.colorName === 'Five' || jvPackTools.colorName === 'Six'){
                    jvPackTools.showMore = true;
                }
                return jvPackTools.showMore;
            }


            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
            }

            initialize();
        }

        function jvPackToolsLink(scope, ele, attrs, ctrl) {
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
                scope.jvPackTools.colorName = toolData.colorName;
                scope.customColorLabels = setCustomColorLabels(selectedData);
                scope.customColors = setCustomColors(toolData, scope.customColorLabels);
                scope.jvPackTools.backgroundColor = setBackgroundColor(selectedData.uiOptions);
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
