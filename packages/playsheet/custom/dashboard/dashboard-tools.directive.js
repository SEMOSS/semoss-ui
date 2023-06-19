(function () {
    'use strict';

    /**
     * @name dashboardTools
     * @desc dashboardTools
     */

    angular.module('app.dashboard-tools.directive', [])
        .directive('dashboardTools', dashboardTools);

    dashboardTools.$inject = ['VIZ_COLORS'];

    function dashboardTools(VIZ_COLORS) {

        dashboardToolsCtrl.$inject = ["$scope"];
        dashboardToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'dashboardTools',
            bindToController: {},
            templateUrl: 'custom/jv-bar/jv-bar-tools.directive.html',
            controller: dashboardToolsCtrl,
            link: dashboardToolsLink
        };
        function dashboardToolsCtrl($scope) {
            var dashboardTools = this;          
            dashboardTools.customColorUpdate = customColorUpdate;
            dashboardTools.showHideColors = showHideColors;
            dashboardTools.updateAscDesc = updateAscDesc;
            dashboardTools.updateColor = updateColor;
            dashboardTools.updateCustomColor = updateCustomColor;
            dashboardTools.updateStackGroup = updateStackGroup;
            dashboardTools.updateVisualization = updateVisualization;
            dashboardTools.backgroundColorUpdate = backgroundColorUpdate;

            dashboardTools.colorName = 'Semoss';
            dashboardTools.backgroundColor = '#FFFFFF';
            dashboardTools.colorToggle = false;
            dashboardTools.customColor = false;
            dashboardTools.showMore = false;
            dashboardTools.stackToggle = 'group-data';


            //Set up colors
            dashboardTools.colorPanels = [];
            dashboardTools.colorPanels.push({'name': 'Semoss', 'displayName': 'Semoss', 'colors': VIZ_COLORS.COLOR_SEMOSS});
            dashboardTools.colorPanels.push({'name': 'One', 'displayName': 'Option 1', 'colors': VIZ_COLORS.COLOR_ONE});
            dashboardTools.colorPanels.push({'name': 'Two', 'displayName': 'Option 2', 'colors': VIZ_COLORS.COLOR_TWO});
            dashboardTools.colorPanels.push({'name': 'Three', 'displayName': 'Option 3', 'colors': VIZ_COLORS.COLOR_THREE});
            dashboardTools.colorPanels.push({'name': 'Four', 'displayName': 'Option 4', 'colors': VIZ_COLORS.COLOR_FOUR});
            dashboardTools.colorPanels.push({'name': 'Five', 'displayName': 'Option 5', 'colors': VIZ_COLORS.COLOR_FIVE});
            dashboardTools.colorPanels.push({'name': 'Six', 'displayName': 'Option 6', 'colors': VIZ_COLORS.COLOR_SIX});

            /**
             * @name backgroundColorUpdate
             * @desc function that is called when the background color option is changed.
             */
            function backgroundColorUpdate() {
                $scope.toolPanelCtrl.updateUiOptions('backgroundColor', dashboardTools.backgroundColor);
                $scope.toolPanelCtrl.toolUpdater('backgroundColor', dashboardTools.backgroundColor);
            }

            /**
             * @name customColorUpdate
             * @desc function that is called when the custom colors option is chosen.
             */
            function customColorUpdate() {
                $scope.toolPanelCtrl.updateUiOptions('color', $scope.customColors);
                $scope.toolPanelCtrl.updateUiOptions('colorName', 'Custom');
                $scope.toolPanelCtrl.toolUpdater('customColors', $scope.customColors);
            }

            /**
             * @name showHideColors
             * @desc function that expands the color palette selection to show all colors if a color is not shown
             *       by default
             */
            function showHideColors() {
                if (dashboardTools.colorName === 'Three' || dashboardTools.colorName === 'Four' || dashboardTools.colorName === 'Five' || dashboardTools.colorName === 'Six') {
                    dashboardTools.showMore = true;
                }
                return dashboardTools.showMore;
            }

            /**
             * @name updateAscDesc
             * @desc function specifically for the ascending / descending of bar chart.
             *       It is responsible for updating the ui Options: sortType to be 'ascending' / 'descending' and sortLabel
             *       to be the variable that is being sorted on
             */
            function updateAscDesc(fn, data) {
                if (fn === 'sortAscending' || fn === 'sortDescending') {
                    $scope.toolPanelCtrl.updateUiOptions('sortType', fn);
                    $scope.toolPanelCtrl.updateUiOptions('sortLabel', data.filteredTitle);
                    $scope.toolPanelCtrl.toolUpdater(fn, data.filteredTitle);
                }

            }

            /**
             * @name updateColor
             * @desc function that updates the color when changed through the preset color palettes. value is the name
             *       of the color palette
             */
            function updateColor(value) {
                $scope.toolPanelCtrl.updateVizColor(value);
                $scope.toolPanelCtrl.updateUiOptions('colorName', value);
                $scope.toolPanelCtrl.toolUpdater('colorChange', $scope.toolPanelCtrl.selectedData.uiOptions.color);
            }

            /**
             * @name updateCustomColor
             * @desc function that handles custom colors when changed in the UI. title is the name of the category
             *       being updated and value color
             */
            function updateCustomColor(title, value) {
                $scope.customColors[title] = value;
                $scope.toolPanelCtrl.updateUiOptions('color', $scope.customColors);
                $scope.toolPanelCtrl.updateUiOptions('colorName', 'Custom');
                $scope.toolPanelCtrl.toolUpdater('customColors', $scope.customColors);
            }

            //define custom Tools
            /**
             * @name updateStackGroup
             * @desc function specifically for the stacking / grouping functionality of bar chart.
             *       It is responsible for updating the ui Options stackToggle variable to be true or false
             *       Also calls the toolUpdater without the data
             */
            function updateStackGroup(fn) {
                //below functionality can be included in the html to remove $scope
                if (fn === 'stackData') {
                    $scope.toolPanelCtrl.updateUiOptions('stackToggle', 'stack-data');
                    //$scope.toolPanelCtrl.selectedData.uiOptions.stackToggle = 'group-data';
                }
                if (fn === 'groupData') {
                    $scope.toolPanelCtrl.updateUiOptions('stackToggle', 'group-data');
                    //$scope.toolPanelCtrl.selectedData.uiOptions.stackToggle = 'stack-data';
                }
                $scope.toolPanelCtrl.toolUpdater(fn);
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
                console.log('bar-chart-tools')
            }


            initialize();

        }

        function dashboardToolsLink(scope, ele, attrs, ctrl) {
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
                var selectedData = scope.toolPanelCtrl.selectedData;
                scope.dashboardTools.stackToggle = selectedData.uiOptions.stackToggle;
                scope.dashboardTools.colorName = selectedData.uiOptions.colorName;
                scope.customColors = setCustomColors(selectedData);
                scope.customColorLabels = setCustomColorLabels(selectedData);
                scope.dashboardTools.backgroundColor = setBackgroundColor(selectedData.uiOptions);
                scope.dashboardTools.sortLabel = setSortLabel(selectedData);
            }

            /*********************Set Tool Data Functions*******************************/
            /** setCustomColorLabels
             *
             * @desc sets the labels that show in the tool panel for custom colors
             * @param selectedData
             * @returns array of labels
             */
            function setCustomColorLabels(selectedData) {
                var labels = [];
                for (var i = 0; i < selectedData.headers.length; i++) {
                    if (selectedData.headers[i].filteredTitle !== selectedData.dataTableAlign.label) {
                        labels.push(selectedData.headers[i].filteredTitle);
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
            function setCustomColors(selectedData) {
                var customColors = {};

                //If custom colors haven't already been chosen, fill custom color array with gray
                if (selectedData.uiOptions.colorName !== 'Custom') {
                    for (var i = 0; i < selectedData.headers.length; i++) {
                        if (selectedData.headers[i].filteredTitle !== selectedData.dataTableAlign.label) {
                            customColors[selectedData.headers[i].filteredTitle] = '#AAAAAA';
                        }
                    }
                } else if (selectedData.uiOptions.colorName === 'Custom') {
                    var color = selectedData.uiOptions.color;
                    if (_.isArray(color)) {
                        for (var i = 0; i < selectedData.uiOptions.colorLabels.length; i++) {
                            customColors[selectedData.uiOptions.colorLabels[i]] = color[i];
                        }
                    } else {
                        customColors = color;
                    }
                }
                return customColors;
            }

            /** setSortLabel
             *
             * @desc sets the default sort label in the tool panel
             * @param selectedData
             * @returns object of selected label
             */
            function setSortLabel(selectedData) {
                var sortLabel = selectedData.headers[0];
                //set sort label if it exists
                if (selectedData.uiOptions.sortLabel && selectedData.uiOptions.sortLabel !== "none" && typeof selectedData.uiOptions.sortLabel === 'string') {
                    //loop to find object for sort label
                    for (var i = 0; i < selectedData.headers.length; i++) {
                        if (selectedData.headers[i].filteredTitle === selectedData.uiOptions.sortLabel) {
                            sortLabel = selectedData.headers[i];
                        }
                    }
                }
                return sortLabel;
            }

            /** setBackgroundColor
             *
             * @desc sets the default sort label in the tool panel
             * @param toolData
             * @returns string of background color, either white or the saved background color
             */
            function setBackgroundColor(toolData) {
                var backgroundColor = 'FFFFFF';
                if (toolData.backgroundColor) {
                    backgroundColor = toolData.backgroundColor;
                }
                return backgroundColor;
            }

        }

    }
})();
