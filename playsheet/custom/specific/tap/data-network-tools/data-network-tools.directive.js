(function () {
    'use strict';

    angular.module('app.tap.data-network-tools.directive', [])
        .directive('datanetworktools', datanetworktools);

    datanetworktools.$inject = ['$rootScope'];

    function datanetworktools($rootScope) {
        dataNetworkToolsLink.$inject = ['scope', 'ele', 'attrs', 'ctrls'];
        dataNetworkToolsCtrl.$inject = ['$scope'];

        return {
            restrict: 'EA',
            require: ['^toolPanel'],
            bindToController: true,
            templateUrl: 'custom/specific/tap/data-network-tools/data-network-tools.directive.html',
            controllerAs: 'dataNetworkToolsCtrl',
            controller: dataNetworkToolsCtrl,
            link: dataNetworkToolsLink
        };

        function dataNetworkToolsLink(scope, ele, attrs, ctrls) {
            scope.toolPanelCtrl = ctrls[0];

            scope.dataTimeStart = 0;
            scope.dataTimeValue = 0;
            scope.dataTimeEnd = 1000;
            scope.maxWeeks = scope.dataTimeEnd / 168;
            scope.maxDays = scope.dataTimeEnd / 7;
            scope.selectedUriText = "None";

            scope.loopEnabled = false;
            scope.islandEnabled = false;
            scope.dataLatencyEnabled = false;

            scope.updateVisualization = updateVisualization;
            scope.setInputValues = setInputValues;

            /**
             * @name updateVisualization
             * @desc generic function that requires the fn passed in to be a function in the directive
             */
            function updateVisualization(fn, data) {
                scope.toolPanelCtrl.toolUpdater(fn, data);
            }

            /**
             * @name setInputValues
             * @desc this function sets the values of the hours, days, and weeks input text fields
             */
            function setInputValues(sliderHourValue) {
                scope.weeks = Math.floor(sliderHourValue / 168);
                scope.days = Math.floor((sliderHourValue - (scope.weeks * 168)) / 24);
                scope.hours = Math.floor(sliderHourValue - (scope.weeks * 168) - (scope.days * 24));
            };

            //listeners
            var forceGraphToolsListener = $rootScope.$on('data-network-tools-receive', function (event, message, data) {
                if (message === 'force-graph-uri-selected') {
                    console.log('%cPUBSUB:', "color:blue", message, data);
                    if (data.uri.length == 1) {
                        scope.selectedUriText = data.uri[0];
                    } else if (data.uri.length > 1) {
                        scope.selectedUriText = "Mulitple nodes selected";
                    } else {
                        scope.selectedUriText = "None";
                    }

                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying related....');
                forceGraphToolsListener();
            });

            scope.setInputValues(0);
        };

        function dataNetworkToolsCtrl($scope) {
            var dataNetworkToolsCtrl = this;

            dataNetworkToolsCtrl.resetGraphEdges = resetGraphEdges;
            dataNetworkToolsCtrl.runLoopIdentifier = runLoopIdentifier;
            dataNetworkToolsCtrl.runIslandIdentifier = runIslandIdentifier;
            dataNetworkToolsCtrl.runDataLatencyAnalysis = runDataLatencyAnalysis;
            dataNetworkToolsCtrl.highlightEdges = highlightEdges;

            /**
             * @name resetGraphEdges
             * @desc resets the graph edges
             */
            function resetGraphEdges() {
                $scope.updateVisualization('resetHighlighting');
            }

            /**
             * @name runLoopIdentifier
             * @desc runs the loop identifier
             */
            function runLoopIdentifier(toggle) {
                $scope.updateVisualization('runLoopIdentifier', toggle);
            }

            /**
             * @name runIslandIdentifier
             * @desc runs the island identifier
             */
            function runIslandIdentifier(toggle) {
                $scope.updateVisualization('runIslandIdentifier', toggle);
            }

            /**
             * @name runDataLatencyAnalysis
             * @desc runs the data latency analysis
             */
            function runDataLatencyAnalysis(toggle) {
                $scope.dataTimeValue = 0;
                $scope.updateVisualization('runDataLatencyAnalysis', toggle);
            }

            /**
             * @name highlightEdges
             * @desc runs the island identifier
             */
            function highlightEdges(dataTimeValue) {
                $scope.updateVisualization('highlightEdges', dataTimeValue);
            }
        };

    }

})(); //end of controller IIFE
