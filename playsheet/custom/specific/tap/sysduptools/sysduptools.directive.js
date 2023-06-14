(function () {
    'use strict';

    angular.module('app.tap.sysduptools.directive', [])
        .directive('sysduptools', sysduptools);

    sysduptools.$inject = ['$rootScope', '$filter', '_', 'monolithService', 'alertService'];

    function sysduptools($rootScope, $filter, _, monolithService, alertService) {

        SysDupToolsCtrl.$inject = ['$scope', 'tapService'];
        SysDupToolsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            require: ['^toolPanel', '^heatmapTools'],
            bindToController: {},
            templateUrl: 'custom/specific/tap/sysduptools/sysduptools.directive.html',
            controllerAs: 'sysdupTools',
            controller: SysDupToolsCtrl,
            link: SysDupToolsLink
        };

        function SysDupToolsCtrl($scope, tapService) {
            var sysdupTools = this;
            sysdupTools.tapService = tapService;

            sysdupTools.specifiedWeights = {};
            sysdupTools.specifiedWeights = {};
            sysdupTools.similarityCategories = {};
            //these are the bar chart vars that were used to create the heatmap
            sysdupTools.barChartVars = [];

            sysdupTools.refreshHeatMap = refreshHeatMap;
            sysdupTools.updateCategoryArray = updateCategoryArray;

            function refreshHeatMap() {
                var dataToSend = {
                    "selectedVars": [],
                    "specifiedWeights": {}
                };

                var keys = _.keys($scope.sysdupTools.similarityCategories);
                for (var j = 0; j < keys.length; j++) {
                    if ($scope.sysdupTools.similarityCategories[keys[j]].checked === true) { //if the box is checked
                        dataToSend.selectedVars.push(keys[j]);
                        dataToSend.specifiedWeights[keys[j]] = $scope.sysdupTools.similarityCategories[keys[j]].value;
                    }
                }

                sysdupTools.barChartVars = JSON.parse(JSON.stringify(dataToSend.selectedVars));

                monolithService.runPlaySheetMethod($scope.toolPanelCtrl.selectedData.core_engine, $scope.toolPanelCtrl.selectedData.insightID, dataToSend, "refreshSysSimData")
                    .then(function (response) {
                        if (response.data != null && !_.isEmpty(response.data)) {
                            $scope.toolPanelCtrl.toolUpdater('updateHeatmap', response);
                        } else {
                            alertService("No data available for your selection", 'Error', 'toast-error', 7000);
                        }
                    }.bind());
            };

            function updateCategoryArray(category, value) {
                if (_.includes($scope.selectedVars, category)) {
                    $scope.selectedVars = _.without($scope.selectedVars, category);
                } else {
                    $scope.selectedVars.push(category);
                }
            };
        };

        function SysDupToolsLink(scope, ele, attrs, ctrl) {
            scope.toolPanelCtrl = ctrl[0];
            scope.heatmapToolsCtrl = ctrl[1];

            scope.refresh = function () {
                //clear the old bar
                side.remove();
                loadSimilarityBar();
                scope.sysdupTools.refreshHeatMap();
            }

            var sysDupToolsListener = $rootScope.$on('sys-dup-tools-receive', function (event, message, data) {
                if (message === 'heatmap-set-color-scale') {
                    console.log('%cPUBSUB:', "color:blue", message, data);
                    scope.colorScale = data;
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying sheet....');
                sysDupToolsListener();
            });         

            var side;

            var loadSimilarityBar = function () {
                var barW = 222;
                var barH = 190;
                side = d3.select("#" + "simBarCanvas")
                    .append("svg")
                    .attr("width", '100%')
                    .attr("height", '100%')
                    .style("background-color", "#fff");
            };

            loadSimilarityBar();

            scope.$on('heatmap.init-bar-chart', function (event, d) {
                popover(d);
            });

            var popover = function (param) {
                var cellKey = param.xAxisName.replace(/ /g, "_") + '-' + param.yAxisName.replace(/ /g, "_");

                //send back the configuration of variables used to create the heatmap (barCharVars)
                var dataToSend = {
                    "cellKey": cellKey,
                    "categoryArray": scope.sysdupTools.barChartVars,
                    "thresh": scope.sysdupTools.specifiedWeights
                };

                //the service call needs to be made here. Set the response to chartData.
                var response = monolithService.runPlaySheetMethod(scope.toolPanelCtrl.selectedData.core_engine, scope.toolPanelCtrl.selectedData.insightID, dataToSend, "getSysSimBarData")
                    .then(function (response) {
                        barChart(response.barData, param.xAxisName, param.yAxisName);
                    }.bind());
            };

            var barChart = function (data, system1Name, system2Name) {
                scope.colorScale = scope.sysdupTools.tapService.getSysDupColorScale();
                var barPadding = 1;
                var barHeight = 20;
                var barSpacing = barHeight + barPadding;

                var system1 = side.selectAll("text.system1")
                    .data([system1Name]);

                system1.enter()
                    .append("text");

                system1.text("System1: ")
                    .attr("class", "system1")
                    .attr("font-weight", "bold")
                    .attr("text-anchor", "start")
                    .attr("y", 10)
                    .attr("x", 0);

                system1.append("tspan").text(system1Name)
                    .attr("font-weight", "normal");

                system1.exit().remove();

                var system2 = side.selectAll("text.system2")
                    .data([system2Name]);

                system2.enter()
                    .append("text");

                system2.text("System2: ")
                    .attr("class", "system2")
                    .attr("font-weight", "bold")
                    .attr("text-anchor", "start")
                    .attr("y", 25)
                    .attr("x", 0);

                system2.append("tspan").text(system2Name)
                    .attr("font-weight", "normal");

                system2.exit().remove();

                var bar = side.selectAll("rect.bar")
                    .data(data);
                bar.enter()
                    .append("rect");
                bar.attr("class", "bar")
                    .attr("y", function (d, i) {
                        return 40 + (i * (barHeight + barPadding));
                    })
                    .attr("x", 137)
                    .attr("height", barHeight)
                    .attr("fill", function (d) {
                        return scope.colorScale(d.Score);
                    });
                bar.transition()
                    .duration(600)
                    .attr("width", function (d) {
                        return d.Score * .8;
                    });
                bar.exit().remove();

                var barLabel = side.selectAll("text.labels")
                    .data(data);
                barLabel.enter()
                    .append("text");
                barLabel
                    .text(function (d) {
                        var ret = "";
                        if (d.key.length > 24) {
                            ret = (d.key.substring(0, 20) + '...');
                        } else {
                            ret = d.key;
                        }
                        return $filter('replaceUnderscores')(ret);
                    })
                    .attr("text-anchor", "end")
                    .style("font-size", "11px")
                    .attr("class", "labels")
                    .attr("y", function (d, i) {
                        return (i * barSpacing) + 55;
                    })
                    .attr("x", 130);
                barLabel.exit().remove();

                var barValue = side.selectAll("text#barValue")
                    .data(data);
                barValue.enter()
                    .append("text");

                barValue.attr("text-anchor", "start")
                    .attr("id", "barValue");

                barValue.attr("class", function (d) {
                    if (d.Score > scope.colorScale.quantiles(d.Score)[3]) {
                        return "sys-dup-bar-label-light";
                    } else {
                        return "sys-dup-bar-label-dark";
                    }
                })
                    .style("font-size", "11px")
                    .attr("y", function (d, i) {
                        return (i * barSpacing) + 55;
                    })
                    .attr("x", 140)
                    .text(function (d) {
                        return Math.round(d.Score * 100) / 100;
                    });

                barValue.exit().remove();

                d3.select("#" + "simBarCanvas")
                    .select("svg")
                    .attr("height", data.length * 27)
            }; //End bar chart function

            function initialize() {
                scope.sysdupTools.barChartVars = JSON.parse(JSON.stringify(scope.toolPanelCtrl.selectedData.specificData.dimData));

                //initialize similarityCategories
                for (var i = 0; i < scope.sysdupTools.barChartVars.length; i++) {
                    var categoryObject = {
                        checked: true,
                        value: undefined,
                        name: scope.sysdupTools.barChartVars[i]
                    };
                    scope.sysdupTools.similarityCategories[scope.sysdupTools.barChartVars[i]] = categoryObject;
                }
            }

            initialize();
        };
        
    }
})(); //end of controller IIFE