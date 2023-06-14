(function () {
    'use strict';

    angular.module('app.heatmap-tools.directive', [])
        .directive('heatmapTools', heatmapTools);

    heatmapTools.$inject = ['VIZ_COLORS', '$timeout'];

    function heatmapTools(VIZ_COLORS, $timeout) {

        heatmapToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];
        heatmapToolsCtrl.$inject = ["$scope"];

        return {
            restrict: 'EA',
            require: ['^toolPanel'],
            bindToController: {},
            templateUrl: 'custom/heatmap/heatmap-tools.directive.html',
            controllerAs: 'heatmapTools',
            controller: heatmapToolsCtrl,
            link: heatmapToolsLink
        };

        function heatmapToolsCtrl($scope) {
            //don't create the slider until we have the slider data
            var heatmapTools = this;
            heatmapTools.createValueSlider = false;
            heatmapTools.color = "Red";
            heatmapTools.colors = "";
            heatmapTools.sensitivityValue = 10;
            heatmapTools.sliderValue = 10;
            heatmapTools.quantiles = true;
            heatmapTools.valueMin = 0;
            heatmapTools.valueMax = 10;

            //functions
            heatmapTools.changeColor = changeColor;
            heatmapTools.isQuantileTrue = isQuantileTrue;
            heatmapTools.toggleQuantile = toggleQuantile;
            heatmapTools.updateSensitivity = updateSensitivity;
            heatmapTools.updateToolData = updateToolData;
            heatmapTools.updateValue = updateValue;

            //Set up colors
            heatmapTools.colorPanels = [];
            heatmapTools.colorPanels.push({
                'name': 'Red',
                'displayName': 'Red',
                'colors': VIZ_COLORS.COLOR_HEATMAP_RED
            });
            heatmapTools.colorPanels.push({
                'name': 'Blue',
                'displayName': 'Blue',
                'colors': VIZ_COLORS.COLOR_HEATMAP_BLUE
            });
            heatmapTools.colorPanels.push({
                'name': 'Green',
                'displayName': 'Green',
                'colors': VIZ_COLORS.COLOR_HEATMAP_GREEN
            });
            heatmapTools.colorPanels.push({
                'name': 'Traffic',
                'displayName': 'Traffic Light',
                'colors': VIZ_COLORS.COLOR_HEATMAP_TRAFFIC
            });

            heatmapTools.updateToolData();

            /**
             * @name changeColor
             * @desc function that changes the color of the chart when a predefined color palette is selected
             */
            function changeColor(selectedColor) {
                //TODO why do we have color and colors???
                $scope.color = selectedColor;
                heatmapTools.color = selectedColor;
                $scope.colors = getColorsArray(selectedColor);
                $scope.toolPanelCtrl.updateUiOptions('color', selectedColor);
                $scope.toolPanelCtrl.updateUiOptions('colors', getColorsArray(selectedColor));
                $scope.toolPanelCtrl.toolUpdater('colorChange', selectedColor);
            }

            /**
             * @name getColorsArray
             * @desc function that returns an array of colors to be used in chart
             */
            function getColorsArray(selectedColor) {
                if (selectedColor === 'Green') {
                    heatmapTools.colors = VIZ_COLORS.COLOR_HEATMAP_GREEN.slice(0);
                } else if (selectedColor === 'Blue') {
                    heatmapTools.colors = VIZ_COLORS.COLOR_HEATMAP_BLUE.slice(0);
                } else if (selectedColor === 'Traffic') {
                    heatmapTools.colors = VIZ_COLORS.COLOR_HEATMAP_TRAFFIC.slice(0);
                } else {
                    heatmapTools.colors = VIZ_COLORS.COLOR_HEATMAP_RED.slice(0);
                }
                return heatmapTools.colors;
            }

            /**
             * @name isQuantileTrue
             * @desc function that returns true if quantile is selected and is true
             */
            function isQuantileTrue() {
                return heatmapTools.quantiles;
            }

            /**
             * @name toggleQuantile
             * @desc function that handles switching between quantile and quantize
             */
            function toggleQuantile() {
                heatmapTools.quantiles = !heatmapTools.quantiles;
                $scope.toolPanelCtrl.updateUiOptions('quantiles', heatmapTools.quantiles);
                $scope.toolPanelCtrl.toolUpdater('toggleQuantile', null);
            }

            /**
             * @name updateSensitivity
             * @desc function that handles changes to the number of buckets
             */
            function updateSensitivity(sensitivityValue) {//Called when number of buckets is changed on slider
                $scope.sensitivityValue = sensitivityValue;
                $scope.toolPanelCtrl.updateUiOptions('buckets', sensitivityValue);
                $scope.toolPanelCtrl.toolUpdater('updateSensitivity', sensitivityValue);
            }

            //the filter data gets passed in here before the slider is created
            /**
             * @name updateToolData
             * @desc function that updates the tools to match the current state of the chart
             */
            function updateToolData() {
                var toolData = $scope.toolPanel.selectedData;
                if (!_.isEmpty(toolData)) {
                    heatmapTools.valueStep = toolData.uiOptions.step;
                    heatmapTools.dataValue = [this.valueMin, this.valueMax];
                    heatmapTools.createValueSlider = true;
                }
            }

            /**
             * @name updateValue
             * @desc function that handles changes to the Filter by Value slider in tools
             */
            function updateValue(value) {//Called when filter by value slider is changed
                $scope.toolPanelCtrl.updateUiOptions('domainArray', value);
                $scope.toolPanelCtrl.toolUpdater('updateValue', value);
            }

            var toolUpdateCleanUpFunc = $scope.$on('heatmap.heatmapToolData', function (event) {
                if (heatmapTools.createValueSlider === false) {
                    heatmapTools.updateToolData();
                }
            });

            $scope.$on('$destroy', function heatMapToolsDestroyer() {
                toolUpdateCleanUpFunc();
            });
        }

        function heatmapToolsLink(scope, ele, attrs, ctrl) {
            scope.toolPanelCtrl = ctrl[0];
            setMinMaxStepValues();

            /**
             * @name setMinMaxStepValues
             * @desc sets the minimum and maximum values in the tool panel for the value filter
             */
            function setMinMaxStepValues() {
                if (scope.toolPanelCtrl.selectedData.uiOptions) {
                    scope.heatmapTools.valueMax = getMaxValue(scope.toolPanelCtrl.selectedData);//Math.round(scope.toolPanelCtrl.selectedData.uiOptions.max);
                    scope.heatmapTools.valueMin = getMinValue(scope.toolPanelCtrl.selectedData);//Math.round(scope.toolPanelCtrl.selectedData.uiOptions.min);
                    if (scope.toolPanelCtrl.selectedData.layout === "SystemSimilarity") {
                        scope.heatmapTools.valueMax = 100;
                        scope.heatmapTools.valueMin = 0;
                    }
                    var domain = scope.toolPanelCtrl.selectedData.uiOptions.domainArray;
                    if (_.isArray(domain)) {
                        $timeout(function () {
                            scope.heatmapTools.sliderValue = domain;
                        });
                    }
                    scope.heatmapTools.sensitivityValue = scope.toolPanelCtrl.selectedData.uiOptions.buckets;
                    scope.heatmapTools.color = scope.toolPanelCtrl.selectedData.uiOptions.color;
                    scope.heatmapTools.quantiles = scope.toolPanelCtrl.selectedData.uiOptions.quantiles;
                }
            }

            /**
             * @name getMaxValue
             * @desc gets the max value of the data to be used in slider to filter by value
             */
            function getMaxValue(data){
                var dataTableAlign = data.dataTableAlign;
                var selectedData = data.data;
                var maxVal = 0;

                for(var i = 0; i < selectedData.length; i++) {
                    if(selectedData[i][dataTableAlign['heat']] > maxVal){
                        maxVal = selectedData[i][dataTableAlign['heat']];
                    }
                }
                return Math.round(maxVal);
            }

            /**
             * @name getMinValue
             * @param {object} data Semoss data
             * @desc gets the minimum value based on the data
             * @return {number} the minimum value
             */
            function getMinValue(data){
                var dataTableAlign = data.dataTableAlign;
                var selectedData = data.data;
                var minVal;
                if(selectedData){
                    minVal = selectedData[0][dataTableAlign['heat']];
                }
                else{
                    minVal = 100;
                }

                for(var i = 0; i < selectedData.length; i++) {
                    if(selectedData[i][dataTableAlign['heat']] < minVal){
                        minVal = selectedData[i][dataTableAlign['heat']];
                    }
                }
                return Math.round(minVal);
            }
        }

    }

})(); //end of controller IIFE
