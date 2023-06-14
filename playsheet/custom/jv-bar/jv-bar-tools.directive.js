(function () {
    'use strict';

    /**
     * @name jvBarTools
     * @desc jvBarTools
     */

    angular.module('app.jv-bar-tools.directive', [])
        .directive('jvBarTools', jvBarTools);

    jvBarTools.$inject = [];

    function jvBarTools() {
        jvBarToolsCtrl.$inject = ["$scope"];
        jvBarToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'jvBarTools',
            bindToController: {},
            templateUrl: 'custom/jv-bar/jv-bar-tools.directive.html',
            controller: jvBarToolsCtrl,
            link: jvBarToolsLink
        };
        
        function jvBarToolsCtrl($scope) {
            var jvBarTools = this;
            jvBarTools.updateAscDesc = updateAscDesc;
            jvBarTools.updateVisualization = updateVisualization;

            /**
             * @name updateAscDesc
             * @desc function specifically for the ascending / descending of bar chart.
             *       It is responsible for updating the ui Options: sortType to be 'ascending' / 'descending' and sortLabel
             *       to be the variable that is being sorted on
             */
            function updateAscDesc(sortType, sortLabel) {
                if (sortType === 'sortAscending' || sortType === 'sortDescending') {
                    $scope.toolPanelCtrl.updateUiOptions('sortType', sortType);
                    $scope.toolPanelCtrl.updateUiOptions('sortLabel', sortLabel.filteredTitle);
                    $scope.toolPanelCtrl.toolUpdater();
                }
            }

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                $scope.toolPanelCtrl.updateUiOptions(fn, data);
                $scope.toolPanelCtrl.toolUpdater();
            }
        }

        function jvBarToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];
            initialize();

            /**
             * @name initialize
             * @desc function that pulls the data from uiOptions into tools so that tools will display the updated state of
             *       the chart
             */
            function initialize() {
                var selectedData = scope.toolPanelCtrl.selectedData;
                scope.jvBarTools.stackToggle = selectedData.uiOptions.stackToggle ? selectedData.uiOptions.stackToggle : 'group-data';
                scope.jvBarTools.sortLabel = setSortLabel(selectedData);
            }

            /*********************Set Tool Data Functions*******************************/
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
        }
    }
})();
