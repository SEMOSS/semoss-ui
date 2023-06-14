(function () {
    'use strict';

    /**
     * @name visual-panel
     * @desc Visual Panel Directive used to switch between visualizations
     */

    angular.module('app.single-axis-cluster-tools.directive', [])
        .directive('singleAxisClusterTools', singleAxisClusterTools);

    singleAxisClusterTools.$inject = ['_', '$filter'];

    function singleAxisClusterTools(_, $filter) {

        singleAxisClusterToolsCtrl.$inject = ["$scope"];
        singleAxisClusterToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'singleAxisClusterTools',
            bindToController: {},
            templateUrl: 'custom/single-axis-cluster/single-axis-cluster-tools.directive.html',
            controller: singleAxisClusterToolsCtrl,
            link: singleAxisClusterToolsLink
        };
        function singleAxisClusterToolsCtrl($scope) {
            var singleAxisClusterTools = this;
            singleAxisClusterTools.colorSplitOptions = [];
            singleAxisClusterTools.showColorSplit = false;

            //functions
            singleAxisClusterTools.updateVisualization = updateVisualization;
            singleAxisClusterTools.getColorSplitOptions = getColorSplitOptions;

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                $scope.toolPanelCtrl.updateUiOptions(fn, data);
                $scope.toolPanelCtrl.toolUpdater(fn, data);
            }


            /**
             * @name getColorSplitOptions
             * @desc function sets values for picking in single axis cluster
             * TO DO - update to be in the html itself
             */
            function getColorSplitOptions() {
                //updated color category
                //WHY?
                // updateVisualization('colorDataCategory', $scope.toolPanelCtrl.selectedData.uiOptions.colorDataCategory);
                singleAxisClusterTools.showColorSplit = true;

                //figure out color split options
                var options = [];

                for (var item in $scope.toolPanelCtrl.selectedData.data) {
                    var dataObject = $scope.toolPanelCtrl.selectedData.data[item];
                    options.push(dataObject[$scope.toolPanelCtrl.selectedData.uiOptions.colorDataCategory]);
                }

                //remove duplicates in color split options
                singleAxisClusterTools.colorSplitOptions = removeDuplicates(options);


                for (var i = 0; i < singleAxisClusterTools.colorSplitOptions.length; i++) {
                    singleAxisClusterTools.colorSplitOptions[i] = $filter('shortenAndReplaceUnderscores')(singleAxisClusterTools.colorSplitOptions[i])
                }
            }

            /**
             * @name removeDuplicates
             * @desc function to remove duplicate values
             */
            function removeDuplicates(arr) {
                var obj = {};
                for (var i = 0; i < arr.length; i++) {
                    obj[arr[i]] = true;
                }
                arr = [];
                for (var key in obj) {
                    arr.push(key);
                }
                return arr;
            }

            /**
             * @name initialize
             * @desc function that is called on directive load
             */
            function initialize() {
                console.log('single-axis-cluter-tools')
            }

            initialize();

        }

        function singleAxisClusterToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

            var visualValues = _.values(scope.toolPanelCtrl.selectedData.dataTableAlign);
            var displayCurrentHeader = false; //Tracks if header element is displayed as split/color option
            var newHeader = [];//stores header elements to be displayed in split/color options in tools
            //
            //var values in
            for (var i = 0; i < scope.toolPanelCtrl.selectedData.headers.length; i++) {
                displayCurrentHeader = false;
                for (var j = 0; j < visualValues.length; j++) {
                    if (scope.toolPanelCtrl.selectedData.headers[i].title === visualValues[j]) {
                        displayCurrentHeader = true;
                    }
                }
                if (displayCurrentHeader) {
                    newHeader.push(scope.toolPanelCtrl.selectedData.headers[i]);
                }
            }
            scope.toolPanelCtrl.selectedData.headers = newHeader;
        }

    }
})();
