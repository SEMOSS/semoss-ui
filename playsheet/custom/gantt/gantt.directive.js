(function () {
    'use strict';

    angular.module('app.gantt.directive', [])
        .directive('gantt', gantt);

    gantt.$inject = ['_', '$compile', '$filter', 'widgetConfigService', 'VIZ_COLORS'];

    function gantt(_, $compile, $filter, widgetConfigService, VIZ_COLORS) {
        ganttLink.$inject = ['scope', 'ele', 'attrs', 'controllers'];
        ganttCtrl.$inject = [];

        return {
            restrict: 'A',
            require: ['chart'],
            priority: 300,
            link: ganttLink,
            controller: ganttCtrl
        };

        function ganttLink(scope, ele, attrs, ctrl) {
            // initialize and declare scope variables
            scope.chartController = ctrl[0];

            var ganttChart, html, k, tipConfig;

            // inserting div to allow d3 to bind
            html = '<div id=' + scope.chartController.chartName + '-append-viz' + '><div id=' + scope.chartController.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            // widget variables
            scope.chartController.margin = {
                top: 20,
                right: 40,
                bottom: 150,
                left: 40
            };

            // Widget Functions
            scope.chartController.dataProcessor = function (newData) {
                var localChartData = JSON.parse(JSON.stringify(newData));
                // filter dataTable
                for (k in localChartData.dataTableAlign) {
                    if (localChartData.dataTableAlign.hasOwnProperty(k)) {
                        localChartData.dataTableAlign[k] = $filter('shortenAndReplaceUnderscores')(localChartData.dataTableAlign[k]);
                    }
                }

                // Grab uiOptions from Viz Services if they do not exist
                if (_.isEmpty(localChartData.uiOptions)) {
                    localChartData.uiOptions = widgetConfigService.getDefaultToolOptions('Column');
                }

                scope.chartController.chartDiv.attr('class', 'full-width full-height chart-div absolute-size');

                scope.chartController.container = newData.panelSize;

                tipConfig = {
                    type: 'simple'
                };

                // create jv chart object
                ganttChart = new jvCharts({
                    type: 'gantt',
                    name: scope.chartController.chartName,
                    options: localChartData.uiOptions,
                    chartDiv: scope.chartController.chartDiv,
                    tipConfig: tipConfig
                });

                // ganttChart.options.color = ['#0c4ba2', '#15b994', 'green', '#E5C100', 'gray'];
                ganttChart.options.color = ['green', '#E5C100', 'gray', 'blue', 'red'];

                // Set Gantt chart data here
                ganttChart.setGanttData(localChartData.filteredData, localChartData.dataTableAlign, VIZ_COLORS.COLOR_SEMOSS);

                // Call update function to draw gantt
                update();
            };

            scope.chartController.resizeViz = function () {
                update();
            };

            function update() {
                ganttChart.paintGanttChart();

                scope.chartCtrl.addJvChartToToolBar(ganttChart);
            }


            scope.chartController.highlightSelectedItem = function () {
                // Do nothing
            };


            // when directive ends, make sure to clean out all $on watchers
            scope.$on('$destroy', function () {
            });
        }

        function ganttCtrl() { }
    }
})();
