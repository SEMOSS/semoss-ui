(function () {
    'use strict';

    /**
     * @name vjvLineTools
     * @desc jvLineTools line chart directive using jv library
     */

    angular.module('app.jv-line-tools.directive', [])
        .directive('jvLineTools', jvLineTools);

    jvLineTools.$inject = [];

    function jvLineTools() {
        jvLineToolsCtrl.$inject = ["$scope"];
        jvLineToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'jvLineTools',
            bindToController: {},
            templateUrl: 'custom/jv-line/jv-line-tools.directive.html',
            controller: jvLineToolsCtrl,
            link: jvLineToolsLink
        };

        function jvLineToolsCtrl($scope) {
            var jvLineTools = this;
            jvLineTools.updateAscDesc = updateAscDesc;
            jvLineTools.updateVisualization = updateVisualization;

            /**
             * @name updateAscDesc
             * @desc function specifically for the ascending / descending of line chart.
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

        function jvLineToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];
            initialize();

            /**
             * @name setToolData
             * @desc function that pulls the data from uiOptions into tools so that tools will display the updated state of
             *       the chart
             */
            function initialize() {
                var selectedData = scope.toolPanelCtrl.selectedData;
                scope.jvLineTools.sortLabel = setSortLabel(selectedData);
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
                    for(var i =0; i < selectedData.headers.length; i ++) {
                        if(selectedData.headers[i].filteredTitle === selectedData.uiOptions.sortLabel) {
                            scope.jvLineTools.sortLabel = selectedData.headers[i];
                        }
                    }
                }
                return sortLabel;
            }
        }
    }
})();
