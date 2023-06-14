(function () {
    "use strict";

    angular.module("app.directives.ousdmaster.ousdcombo", [])
        .directive("ousdcombo", ousdcombo);

    ousdcombo.$inject = ["$filter", "_", "$compile", "utilityService"];

    function ousdcombo($filter, _, $compile, utilityService) {

        ousdComboLink.$inject = ["scope", "ele", "attrs", "controllers"];
        ousdComboController.$inject = ["$scope"];

        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            link: ousdComboLink,
            controller: ousdComboController
        };

        function ousdComboLink(scope, ele, attrs, controllers) {
            //initialize and declare scope variables
            scope.chartController = controllers[0];
            scope.sortBySelected = {selected: ''};

            //initialize and declare local variables
            var chart,
                xFormat = "",
                localChartData = {};

            //url of special template
            /*scope.chartController.chartNameTemplate = '';*/

            //ele.append('<div class=id=' + scope.chartController.chartName + '></div>');
            var html = '<div class="append-viz" id=' + scope.chartController.chartName + "-append-viz" + ' ng-class=\"{\'viz-hide\': chartController.isTableShown, \'viz-show\': !chartController.isTableShown}\"><div id=' + scope.chartController.chartName + '></div></div>';
            ele.append($compile(html)(scope));

            //widget variables
            scope.chartController.margin = {
                top: 10,
                right: 10,
                bottom: 10,
                left: 10
            };

            scope.chartController.SHOW_SOCIAL_SHARING = false;
            //Widget Functions
            scope.chartController.dataProcessor = function () {
                if (!_.isEmpty(scope.chartController.data.data)) {

                    var formattedData = utilityService.formatTableData(scope.chartController.data.headers, scope.chartController.data.data, true);
                    angular.extend(scope.chartController.data, formattedData);


                    localChartData = scope.chartController.data;

                    var cumulativeSavings = 0;
                    localChartData.filteredData = localChartData.filteredData.map(function (obj) {
                        if (obj['Annual Expenses'] === 0) {
                            return obj;
                        }
                        //obj['Annual Expenses'] = -obj['Annual Expenses'];
                        return obj
                    });

                    update()
                } //end of scope.data empty check
            };

            scope.chartController.highlightSelectedItem = function (selectedItem) {

                /*   var notSelectedPoints = d3.select("#" + scope.chartController.chartName).selectAll(".c3-circle"),
                 selectedPoints = [];

                 if (scope.chartController.isDataBound || scope.chartController.containerClass !== "graph-canvas") {
                 var selectedIndex = chart.categories().indexOf($filter("shortenAndReplaceUnderscores")(selectedItem[i].uri));
                 for (var i in selectedItem) {
                 selectedPoints.push(d3.select("#" + scope.chartController.chartName).selectAll(".c3-circle-" + selectedIndex));
                 }
                 } else {
                 for (var i in selectedItem) {
                 selectedPoints.push(d3.select("#" + scope.chartController.chartName).selectAll(".c3-circle-" + selectedItem.index));
                 }
                 }

                 notSelectedPoints.style({
                 "stroke-width": 0
                 });

                 for (var i in selectedPoints) {
                 selectedPoints[i].style({
                 "stroke": "black",
                 "stroke-width": 2.5
                 });
                 }*/
            };

            scope.chartController.filterAction = function () {

            };

            scope.chartController.resizeViz = function () {
                scope.chartController.containerSize(scope.chartController.container, scope.chartController.margin);
                chart.resize({
                    height: scope.chartController.container.height - 10,
                    width: scope.chartController.container.width - 10
                });
            };

            function update() {
                scope.chartController.containerSize(scope.chartController.container, scope.chartController.margin);


                chart = c3.generate({
                    bindto: "#" + scope.chartController.chartName,
                    data: {
                        json: localChartData.filteredData,
                        keys: {
                            x: "Transition Year",
                            value: ["Annual Savings", "Annual Expenses", "Annual Cash Flow", "Cumulative Net Savings"]
                        },
                        type: 'bar',
                        types: {'Cumulative Net Savings': 'line'},
                        xFormat: xFormat,
                        colors: {
                            'Annual Savings': '#2ca02c',
                            'Annual Expenses': '#d62728',
                            'Annual Cash Flow': '#ff7f0e',
                            'Cumulative New Savings': '#000000'
                        }
                    },
                    axis: {
                        y: {
                            tick: {
                                format: d3.format('$,')
                            }
                        }
                    },
                    zoom: {
                        enabled: true
                    },
                    size: {
                        width: scope.chartController.container.width - 10,
                        height: scope.chartController.container.height - 10
                    },
                    legend: {
                        position: "bottom",
                        item: {}
                    },
                    line: {
                        connectNull: true
                    },
                    grid: {
                        y: {
                            lines: [
                                {value: 0, text: '', position: 'left'}
                            ]
                        }
                    },
                    tooltip: {
                        format: {
                            title: function (d) {
                                return 'Data ' + d;
                            },
                            value: function (value, ratio, id) {
                                var format = d3.format('$,');
                                return format(value);
                            }
                        }
                    }
                });
            }

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                chart.destroy();
            });
        }

        function ousdComboController($scope) {

        }
    }
})();
