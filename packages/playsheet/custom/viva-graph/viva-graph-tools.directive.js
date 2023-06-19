(function () {
    'use strict';

    angular.module('app.viva-graph-tools.directive', [])
        .directive('vivaGraphTools', vivaGraphTools);

    vivaGraphTools.$inject = ['$rootScope', 'monolithService', 'alertService', '$filter', '$timeout'];

    function vivaGraphTools($rootScope, monolithService, alertService, $filter, $timeout) {

        vivaGraphToolsCtrl.$inject = ["$scope"];
        vivaGraphToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: ['^toolPanel'],
            controllerAs: 'vivaGraphTools',
            bindToController: {},
            templateUrl: 'custom/viva-graph/viva-graph-tools.directive.html',
            controller: vivaGraphToolsCtrl,
            link: vivaGraphToolsLink
        };

        function vivaGraphToolsCtrl($scope) {
            var vivaGraphTools = this;

            vivaGraphTools.searchInput = "";
            vivaGraphTools.layoutToggle = false;
            vivaGraphTools.legendToggle = true;
            vivaGraphTools.labelToggle = false;

            vivaGraphTools.selectedColorGroup = false;
            vivaGraphTools.colorOptions = {
                false: {
                    'name': false,
                    'label': 'Default'
                },
                'CLUSTER': {
                    'name': 'CLUSTER',
                    'label': 'Cluster'
                }
            };

            vivaGraphTools.selectedLayout = 'forceDirected';
            vivaGraphTools.selectedLayoutOptions = {
                springLength: 80,
                springCoeff: 0.0002,
                gravity: -1.2,
                theta: 0.8,
                dragCoeff: 0.02,
                timeStep: 20,
                stableThreshold: .009
            };

            vivaGraphTools.layoutOptions = {
                'forceDirected': {
                    'name': 'forceDirected',
                    'label': 'Force Directed',
                    'defaultOptions': {
                        springLength: 80,
                        springCoeff: 0.0002,
                        gravity: -1.2,
                        theta: 0.8,
                        dragCoeff: 0.02,
                        timeStep: 20,
                        stableThreshold: .009
                    }

                },
                'forceAtlas2': {
                    'name': 'forceAtlas2',
                    'label': 'Force Atlas',
                    'defaultOptions': {
                        linLogMode: false,
                        outboundAttractionDistribution: false,
                        adjustSizes: false,
                        edgeWeightInfluence: 0,
                        scalingRatio: 1,
                        strongGravityMode: false,
                        gravity: 1,
                        slowDown: 1,
                        barnesHutOptimize: false,
                        barnesHutTheta: 0.5,
                        startingIterations: 1,
                        iterationsPerRender: 1
                    }
                },
                'radialTree': {
                    'name': 'radialTree',
                    'label': 'Radial Tree',
                    'defaultOptions': {}
                }

            };

            vivaGraphTools.highlightOptions = {
                disabled: true,
                selected: "",
                list: [
                    {display: "Highlight Adjacent", value: "Upstream and Downstream"},
                    {display: "Upstream", value: "Upstream"},
                    {display: "Downstream", value: "Downstream"}//,
                    //{display: "All Downstream" , value: "All"}
                ]
            };

            //functions
            vivaGraphTools.searchGraph = searchGraph;
            vivaGraphTools.clearSearchHighlighting = clearSearchHighlighting;
            vivaGraphTools.toggleLegend = toggleLegend;
            vivaGraphTools.toggleLabels = toggleLabels;
            vivaGraphTools.toggleLayout = toggleLayout;
            vivaGraphTools.resetScale = resetScale;
            vivaGraphTools.togglePropertiesTable = togglePropertiesTable;
            vivaGraphTools.unFreezeLayout = unFreezeLayout;
            vivaGraphTools.freezeLayout = freezeLayout;
            vivaGraphTools.updateLayout = updateLayout;
            vivaGraphTools.updateLayoutOptions = updateLayoutOptions;
            vivaGraphTools.highlightAdjacent = highlightAdjacent;
            vivaGraphTools.resetHighlighting = resetHighlighting;
            vivaGraphTools.colorBy = colorBy;
            vivaGraphTools.isEmpty = isEmpty;

            /**
             * @name searchGraph
             * @desc pass the searchInput to the search method
             */
            function searchGraph() {
                $scope.toolPanelCtrl.toolUpdater('searchGraph', vivaGraphTools.searchInput);
            }

            /**
             * @name clearSearchHighlighting
             * @desc clears highlighted nodes via search
             */
            function clearSearchHighlighting() {
                vivaGraphTools.searchInput = "";
                $scope.toolPanelCtrl.toolUpdater('clearSearchHighlighting');
            }

            /**
             * @name toggleLegend
             * @desc show/hide the legend
             */
            function toggleLegend() {
                vivaGraphTools.legendToggle = !vivaGraphTools.legendToggle;
                $scope.toolPanelCtrl.toolUpdater('toggleLegend', vivaGraphTools.legendToggle);
            }

            /**
             * @name toggleLabels
             * @desc show/hide the labels
             */
            function toggleLabels() {
                vivaGraphTools.labelToggle = !vivaGraphTools.labelToggle;
                $scope.toolPanelCtrl.toolUpdater('toggleLabels', vivaGraphTools.labelToggle);
            }

            /**
             * @name toggleLayout
             * @desc triggers the showing/hiding of the properties table
             */
            function toggleLayout() {
                vivaGraphTools.layoutToggle = !vivaGraphTools.layoutToggle;
                $scope.toolPanelCtrl.toolUpdater('toggleLayout', vivaGraphTools.layoutToggle);
            }

            /**
             * @name toggleLayout
             * @desc triggers the showing/hiding of the properties table
             */
            function resetScale() {
                $scope.toolPanelCtrl.toolUpdater('resetScale');
            }

            /**
             * @name togglePropertiesTable
             * @desc triggers the showing/hiding of the properties table
             */
            function togglePropertiesTable() {
                $scope.toolPanelCtrl.updateUiOptions('propertiesTableToggle', !$scope.toolPanelCtrl.selectedData.uiOptions.propertiesTableToggle);
                $scope.toolPanelCtrl.toolUpdater('togglePropertiesTable', $scope.toolPanelCtrl.selectedData.uiOptions.propertiesTableToggle);
            }

            /**
             * @name unFreezeLayout
             * @desc triggers unlocking of nodes on the network graph
             */
            function unFreezeLayout() {
                $scope.toolPanelCtrl.toolUpdater('toggleLayout', false);
            }

            /**
             * @name freezeLayout
             * @desc triggers locking of nodes on the network graph
             */
            function freezeLayout() {
                $scope.toolPanelCtrl.toolUpdater('toggleLayout', true);
            }

            /**
             * @name updateLayout
             * @desc updates layout
             */

            function updateLayout(layout) {
                console.log(layout);
                vivaGraphTools.selectedLayout = layout;
                vivaGraphTools.selectedLayoutOptions = vivaGraphTools.layoutOptions[layout].defaultOptions;
                $scope.toolPanelCtrl.toolUpdater('updateLayout', {
                    layout: vivaGraphTools.selectedLayout,
                    options: vivaGraphTools.selectedLayoutOptions
                });
                $scope.toolPanelCtrl.updateUiOptions('selectedLayout', vivaGraphTools.selectedLayout);
                $scope.toolPanelCtrl.updateUiOptions('selectedLayoutOptions', vivaGraphTools.selectedLayoutOptions);
            }

            /**
             * @name updateLayoutOptions
             * @desc updates layout
             */

            function updateLayoutOptions(render) {
                for (var i in  vivaGraphTools.selectedLayoutOptions) {
                    vivaGraphTools.selectedLayoutOptions[i] = +vivaGraphTools.selectedLayoutOptions[i]
                }
                $scope.toolPanelCtrl.toolUpdater('updateLayoutOptions', {
                    options: vivaGraphTools.selectedLayoutOptions,
                    render: render
                });
                $scope.toolPanelCtrl.updateUiOptions('selectedLayoutOptions', vivaGraphTools.selectedLayoutOptions);
            }

            /**
             * @name highlightAdjacent
             * @param highlightOpt {object} - the type of highlighting to perform on the graph
             * @desc requires a selected node to run. will perform the selected highlight option for selected nodes
             */
            function highlightAdjacent(highlightOpt) {
                /*$scope.toolPanelCtrl.updateUiOptions('highlightOption', highlightOpt.value);
                 $scope.toolPanelCtrl.toolUpdater('highlightAdjacent', highlightOpt.value);
                 this.highlightOptions.selected = "";*/
            }

            /**
             * @name resetHighlighting
             * @param item {object} - the selected traverse option
             * @desc resets the highlighting of edges on the graph
             */
            function resetHighlighting() {
                /*$scope.toolPanelCtrl.toolUpdater('resetHighlighting');*/
            }

            /**
             * @name colorBy
             * @desc colors by
             */
            function colorBy() {
                $scope.toolPanelCtrl.toolUpdater('colorBy', vivaGraphTools.selectedColorGroup);
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

        function vivaGraphToolsLink(scope, ele, attrs, ctrl) {
            //declare/initialize scope variables
            scope.toolPanelCtrl = ctrl[0];

            /**
             * @name initialize
             * @desc called on directive load. populates the traverse list from ui options
             */
            function initialize() {
                if (scope.toolPanelCtrl.selectedData.uiOptions) {
                    scope.vivaGraphTools.selectedLayout = scope.toolPanelCtrl.selectedData.uiOptions.selectedLayout || 'forceDirected';
                    scope.vivaGraphTools.selectedLayoutOptions = scope.toolPanelCtrl.selectedData.uiOptions.selectedLayoutOptions || {
                            springLength: 80,
                            springCoeff: 0.0002,
                            gravity: -1.2,
                            theta: 0.8,
                            dragCoeff: 0.02,
                            timeStep: 20,
                            stableThreshold: .009
                        };

                    scope.vivaGraphTools.selectedColorGroup = scope.toolPanelCtrl.selectedData.uiOptions.selectedColorGroup || false
                }
            }

            initialize();

            //listeners
            /*var vivaGraphToolsListener = $rootScope.$on('viva-graph-tools-receive', function (event, message, data) {
             if (message === 'viva-graph-uri-selected') {
             scope.vivaGraphTools.getTraverseOptions(data);
             }
             });*/

            //initialize
            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying force-graph-tools....');
                //vivaGraphToolsListener();
            });
        }

    }

})(); //end of controller IIFE
