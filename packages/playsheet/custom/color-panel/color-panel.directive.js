(function () {
    'use strict';

    /**
     * @name tool-panel
     * @desc The tool panel for a given visualization
     */
    angular.module('app.color-panel.directive', [])
        .directive('colorPanel', colorPanel);

    colorPanel.$inject = ['$rootScope', 'widgetConfigService', 'VIZ_COLORS', 'dataService', 'pkqlService'];

    function colorPanel($rootScope, widgetConfigService, VIZ_COLORS, dataService, pkqlService) {

        colorPanelCtrl.$inject = ["$scope"];
        colorPanelLink.$inject = ["scope", "ele", "attrs", "controllers"];

        return {
            restrict: 'EA',
            scope: {},
            require: [],
            controllerAs: 'colorPanel',
            bindToController: {
            },
            templateUrl: 'custom/color-panel/color-panel.directive.html',
            controller: colorPanelCtrl,
            link: colorPanelLink
        };

        function colorPanelCtrl($scope) {
            var colorPanel = this;
            colorPanel.selectedData = null;//data of the selected viz
            colorPanel.loadScreen = false;
            colorPanel.showMore = false;
            colorPanel.colorToggle = false;

            //functions
            colorPanel.toolUpdater = toolUpdater;
            colorPanel.updateUiOptions = updateUiOptions;
            colorPanel.updateVizColor = updateVizColor;
            colorPanel.showHideColors = showHideColors;
            colorPanel.updateColor = updateColor;
            colorPanel.customColorUpdate = customColorUpdate;

            //Set up colors
            colorPanel.colorPanels = [];
            colorPanel.colorPanels.push({'name': 'Semoss', 'displayName': 'Semoss', 'colors': VIZ_COLORS.COLOR_SEMOSS});
            colorPanel.colorPanels.push({'name': 'One', 'displayName': 'Option 1', 'colors': VIZ_COLORS.COLOR_ONE});
            colorPanel.colorPanels.push({'name': 'Two', 'displayName': 'Option 2', 'colors': VIZ_COLORS.COLOR_TWO});
            colorPanel.colorPanels.push({'name': 'Three', 'displayName': 'Option 3', 'colors': VIZ_COLORS.COLOR_THREE});
            colorPanel.colorPanels.push({'name': 'Four', 'displayName': 'Option 4', 'colors': VIZ_COLORS.COLOR_FOUR});
            colorPanel.colorPanels.push({'name': 'Five', 'displayName': 'Option 5', 'colors': VIZ_COLORS.COLOR_FIVE});
            colorPanel.colorPanels.push({'name': 'Six', 'displayName': 'Option 6', 'colors': VIZ_COLORS.COLOR_SIX});


            /**
             * @name showHideColors
             * @desc function that expands the color palette selection to show all colors if a color is not shown
             *       by default
             */
            function showHideColors() {
                return (colorPanel.colorName === 'Three' || colorPanel.colorName === 'Four' || colorPanel.colorName === 'Five' || colorPanel.colorName === 'Six');
            }


            /**
             * @name toolUpdater
             * @desc notifies the store whenever a tool function is run. also sends the uiOptions to the store.
             */
            function toolUpdater() {
                //Run tool updater through pkql
                // make sure vizOptions and comments are removed
                if (colorPanel.selectedData.uiOptions['vizOptions']) {
                    delete colorPanel.selectedData.uiOptions['vizOptions'];
                }
                if (colorPanel.selectedData.uiOptions['comments']) {
                    delete colorPanel.selectedData.uiOptions['comments'];
                }
                var currentWidget = dataService.getWidgetData();
                var toolQuery = pkqlService.generateToolsQuery(currentWidget.panelId, colorPanel.selectedData.uiOptions);
                pkqlService.executePKQL(currentWidget.insightId, toolQuery);

            }

            /**
             * @name updateUiOptions
             * @param toolkey {String} tool name that is being updated
             * @param newValue {String} new value of updated tool
             * @desc function that is broadcasts to the sheet whenever a ui Option Changes
             */
            function updateUiOptions(toolKey, newValue) {
                console.log("Setting UI Options of " + toolKey + " to " + newValue);
                $scope.colorPanel.selectedData.uiOptions[toolKey] = newValue;
            }

            /**
             * @name customColorUpdate
             * @desc function that is called when the custom colors option is chosen.
             */
            function customColorUpdate(value) {
                console.log($scope);
                if ($scope.colorPanel.backgroundColor !== $scope.colorPanel.startingBackgroundColor) {
                    updateUiOptions('backgroundColor', $scope.colorPanel.backgroundColor);
                }
                updateUiOptions('color', $scope.colorPanel.customColors);
                updateUiOptions('colorName', value ? value : 'Custom');
                toolUpdater();
            }

            /**
             * @name updateColor
             * @desc function that updates the color when changed through the preset color palettes. value is the name
             *       of the color palette
             */
            function updateColor(value) {
                console.log($scope);
                updateVizColor(value);
                updateUiOptions('colorName', value);
                $scope.colorPanel.customColors = setCustomColors(colorPanel.selectedData);
                customColorUpdate(value);
            }

            /**
             * @name updateVizColor
             * @param newValue {String} new value of updated viz color
             * @desc controls updating the sheet color
             */
            function updateVizColor(newValue) {
                var colorArray = [];
                switch (newValue) {
                    case 'Semoss':
                        colorArray = VIZ_COLORS.COLOR_SEMOSS;
                        break;
                    case 'Blue':
                        colorArray = VIZ_COLORS.COLOR_BLUE;
                        break;
                    case "Red":
                        colorArray = VIZ_COLORS.COLOR_RED;
                        break;
                    case "Green":
                        colorArray = VIZ_COLORS.COLOR_GREEN;
                        break;
                    case 'One':
                        colorArray = VIZ_COLORS.COLOR_ONE;
                        break;
                    case "Two":
                        colorArray = VIZ_COLORS.COLOR_TWO;
                        break;
                    case "Three":
                        colorArray = VIZ_COLORS.COLOR_THREE;
                        break;
                    case "Four":
                        colorArray = VIZ_COLORS.COLOR_FOUR;
                        break;
                    case "Five":
                        colorArray = VIZ_COLORS.COLOR_FIVE;
                        break;
                    case "Six":
                        colorArray = VIZ_COLORS.COLOR_SIX;
                        break;
                    case "custom":
                        colorArray = 'aaa';
                        break;
                    default:
                        return;
                }
                colorPanel.updateUiOptions('color', colorArray);
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
            return widgetConfigService.getColorElements(selectedData.layout, selectedData.dataTableAlign, selectedData.filteredData);
        }

        /** setCustomColors
         *
         * @desc sets the color object that shows initial color selection if custom colors have been saved
         * @param selectedData
         * @returns object of colors
         */
        function setCustomColors(selectedData) {
            var customColors = {};

            var colorElements = widgetConfigService.getColorElements(selectedData.layout, selectedData.dataTableAlign, selectedData.filteredData);
            for (var i = 0; i < colorElements.length; i++) {
                customColors[colorElements[i]] = '#AAAAAA';
            }

            if (selectedData.uiOptions && selectedData.uiOptions.color) {
                //colors might come back from the backend as an array
                //if so we need to organize them properly in the object
                var color = selectedData.uiOptions.color;
                if (_.isArray(color)) {
                    var index = 0;
                    for (var key in customColors) {
                        customColors[key] = color[index];
                        index++;
                    }
                } else {
                    //if custom colors are an object, make sure to add them by key name in the custom colors object
                    for (var key in color) {
                        if (customColors.hasOwnProperty(key)) {
                            customColors[key] = color[key];
                        }
                    }
                }
            }
            return customColors;
        }

        function colorPanelLink(scope, ele, attrs, ctrl) {
            /**
             * @name initialize
             */
            function initialize() {
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.colorPanel.selectedData = currentWidget.data.chartData;
                }
                if (scope.colorPanel.selectedData) {
                    var selectedData = scope.colorPanel.selectedData;
                    scope.colorPanel.customColors = setCustomColors(selectedData);
                    scope.colorPanel.customColorLabels = setCustomColorLabels(selectedData);
                    if (selectedData.uiOptions && selectedData.uiOptions.backgroundColor) {
                        scope.colorPanel.backgroundColor = selectedData.uiOptions.backgroundColor;
                        scope.colorPanel.startingBackgroundColor = selectedData.uiOptions.backgroundColor;
                    } else {
                        scope.colorPanel.backgroundColor = '#FFFFFF';
                        scope.colorPanel.startingBackgroundColor = '#FFFFFF';
                    }

                }
            }

            initialize();


            //listeners
            var colorPanelUpdateListener = $rootScope.$on('update-widget', function (event) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-widget');
                var currentWidget = dataService.getWidgetData();
                if (currentWidget && currentWidget.data) {
                    scope.colorPanel.selectedData = currentWidget.data.chartData;
                }
                if (scope.colorPanel.selectedData) {
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying colorPanel....');
                colorPanelUpdateListener();
            });
        }

    }
})();
