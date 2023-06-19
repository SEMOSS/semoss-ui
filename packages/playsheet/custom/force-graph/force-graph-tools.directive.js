(function () {
    'use strict';

    angular.module('app.force-graph-tools.directive', [])
        .directive('forceGraphTools', forceGraphTools);

    forceGraphTools.$inject = ['$rootScope', 'monolithService', 'alertService', '$filter', '$timeout'];

    function forceGraphTools($rootScope, monolithService, alertService, $filter, $timeout) {

        forceGraphToolsCtrl.$inject = ["$scope"];
        forceGraphToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'forceGraphTools',
            bindToController: {},
            templateUrl: 'custom/force-graph/force-graph-tools.directive.html',
            controller: forceGraphToolsCtrl,
            link: forceGraphToolsLink
        };

        function forceGraphToolsCtrl($scope) {
            var forceGraphTools = this;

            forceGraphTools.highlightOptions = {
                selected: "",
                list: [
                    {display: "Highlight Adjacent", value: "Upstream and Downstream"},
                    {display: "Upstream", value: "Upstream"},
                    {display: "Downstream", value: "Downstream"}//,
                    //{display: "All Downstream" , value: "All"}
                ]
            };

            //functions
            forceGraphTools.togglePropertiesTable = togglePropertiesTable;
            forceGraphTools.unFreezeAllNodes = unFreezeAllNodes;
            forceGraphTools.freezeAllNodes = freezeAllNodes;
            forceGraphTools.highlightAdjacent = highlightAdjacent;
            forceGraphTools.resetHighlighting = resetHighlighting;
            forceGraphTools.isEmpty = isEmpty;

            /**
             * @name togglePropertiesTable
             * @desc triggers the showing/hiding of the properties table
             */
            function togglePropertiesTable() {
                $scope.toolPanelCtrl.updateUiOptions('propertiesTableToggle', !$scope.toolPanelCtrl.selectedData.uiOptions.propertiesTableToggle);
                $scope.toolPanelCtrl.toolUpdater('toggleTable', $scope.toolPanelCtrl.selectedData.uiOptions.propertiesTableToggle);
            }

            /**
             * @name unFreezeAllNodes
             * @desc triggers unlocking of nodes on the network graph
             */
            function unFreezeAllNodes() {
                $scope.toolPanelCtrl.updateUiOptions('graphLockToggle', false);
                $scope.toolPanelCtrl.toolUpdater('unFreezeAllNodes');
            }

            /**
             * @name freezeAllNodes
             * @desc triggers locking of nodes on the network graph
             */
            function freezeAllNodes() {
                $scope.toolPanelCtrl.updateUiOptions('graphLockToggle', true);
                $scope.toolPanelCtrl.toolUpdater('freezeAllNodes');
            }

            /**
             * @name highlightAdjacent
             * @param highlightOpt {object} - the type of highlighting to perform on the graph
             * @desc requires a selected node to run. will perform the selected highlight option for selected nodes
             */
            function highlightAdjacent(highlightOpt) {
                $scope.toolPanelCtrl.updateUiOptions('highlightOption', highlightOpt.value);
                $scope.toolPanelCtrl.toolUpdater('highlightAdjacent', highlightOpt.value);
                this.highlightOptions.selected = "";
            }

            /**
             * @name resetHighlighting
             * @param item {object} - the selected traverse option
             * @desc resets the highlighting of edges on the graph
             */
            function resetHighlighting() {
                $scope.toolPanelCtrl.toolUpdater('resetHighlighting');
            }

            /**
             * @name isEmpty
             * @params i {object, array} variable to check
             * @desc performs lodash isEmpty check
             */
            function isEmpty(i) {
                return _.isEmpty(i);
            }
        }

        function forceGraphToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

            /**
             * @name initialize
             * @desc called on directive load
             */
            function initialize() {
            }

            initialize();


            //initialize
            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying force-graph-tools....');
            });
        }

    }

})(); //end of controller IIFE
