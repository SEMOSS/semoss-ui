(function () {
    "use strict";

    angular.module("app.directives.ousdmaster", [])
        .directive("ousdmaster", ousdmaster);

    ousdmaster.$inject = ['$rootScope', 'dataService'];

    function ousdmaster($rootScope, dataService) {
        ousdmasterController.$inject = ['$scope'];
        ousdmasterLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];
        return {
            restrict: 'E',
            require: [],
            bindToController: true,
            controllerAs: 'ousdmasterCtrl',
            controller: ousdmasterController,
            link: ousdmasterLink,
            templateUrl: "custom/specific/ousd/ousdmaster.html"
        };

        function ousdmasterController($scope) {
        }

        function ousdmasterLink(scope, ele, attrs, controllers) {


            function dataProcessor() {
                var currentWidget = dataService.getWidgetData();
                scope.ousdmasterCtrl.insightData = currentWidget.data.insightData;
                scope.ousdmasterCtrl.ganttData = currentWidget.data.chartData.data.charts[0];
                scope.ousdmasterCtrl.ganttInsightData = { label: scope.ousdmasterCtrl.ganttData['title'] };
                scope.ousdmasterCtrl.comboData = currentWidget.data.chartData.data.charts[1];
                scope.ousdmasterCtrl.comboInsightData = { label: scope.ousdmasterCtrl.comboData['title'] };
            }

            function initialize() {
                // listeners
                var chartUpdateListener = $rootScope.$on('update-visualization', function (event, data) {
                    dataProcessor();
                });

                scope.$on('$destroy', function () {
                    chartUpdateListener();
                });

                dataProcessor();
            }

            initialize();
        }

    }
})();