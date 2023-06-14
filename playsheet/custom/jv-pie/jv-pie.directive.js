(function () {
    "use strict";
    /**
     * @name jvPie
     * @desc jvPie chart directive for creating and visualizing a line chart
     */

    angular.module("app.jv-pie.directive", [])
        .directive("jvPie", jvPie);

    jvPie.$inject = ["$compile", 'VIZ_COLORS', '$filter'];

    function jvPie($compile, VIZ_COLORS, $filter) {
        pieChartLink.$inject = ["scope", "ele", "attrs", 'ctrl'];
        pieChartCtrl.$inject = ["$scope"];
        return {
            restrict: "A",
            require: ["^chart"],
            priority: 300,
            link: pieChartLink,
            controller: pieChartCtrl
        };

        function pieChartLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;
            /****************Tool Functions*************************/
            scope.chartCtrl.highlightSelectedItem = highlightSelectedItem;
            /****************Unused Scope Functions*****************/
            scope.chartCtrl.resizeViz = resizeViz;

            //declare and initialize local variables
            var pieChart,
                uriData,
                html = '<div id=' + scope.chartCtrl.chartName + "-append-viz" + '><div id=' + scope.chartCtrl.chartName + '></div></div>';

            ele.append($compile(html)(scope));


            /****************Data Functions*************************/

            /**dataProcessor gets called from chart and is where the data manipulation happens for the viz
             *
             * @param newData
             */
            function dataProcessor(newData) {
                var localChartData = JSON.parse(JSON.stringify(newData));
                scope.chartCtrl.chartDiv.attr('class', 'full-width full-height chart-div absolute-size');

                //return and alert the user if no data exists
                if (!localChartData.filteredData) {
                    console.log("No data returned from the backend");
                    return;
                }

                //uriData is used for related insights
                uriData = localChartData.data;

                //filter dataTable
                for (var k in  localChartData.dataTableAlign) {
                    localChartData.dataTableAlign[k] = $filter("shortenAndReplaceUnderscores")(localChartData.dataTableAlign[k]);
                }
                var tipConfig = {
                    type: "simple"
                };
                //create jv chart object
                pieChart = new jvCharts({
                    type: "pie",
                    name: scope.chartCtrl.chartName,
                    options: localChartData.uiOptions,
                    chartDiv: scope.chartCtrl.chartDiv,
                    tipConfig: tipConfig
                });

                pieChart.setPieData(localChartData.filteredData, localChartData.dataTableAlign, VIZ_COLORS.COLOR_SEMOSS);

                //TODO determine if sorting is needed
                //chartData.sort(function (a, b) {
                //    return a[label] < b[label] ? -1 : a[label] > b[label] ? 1 : 0;
                //});
                //uriData.sort(function (a, b) {
                //    return a[label] < b[label] ? -1 : a[label] > b[label] ? 1 : 0;
                //});
                
                update();
            }

            /****************Update Functions*************************/

            function update() {
                pieChart.drawPie();

                scope.chartCtrl.addJvChartToToolBar(pieChart);
                scope.chartCtrl.disableMode(['brush']);

                /***************************************** Declare local callback functions ***************************/
                /** localCallbackApplyAllEdits
                 *  @desc: function that applies edit mode options whenever the barChart changes / redraws
                 */
                //TODO see if there is a better way to do this
                pieChart.localCallbackApplyAllEdits = function () {
                    scope.chartCtrl.editMode.applyAllEdits();
                };

                pieChart.updateOptions = function(options){
                    scope.chartCtrl.updateOptions(options);
                }


                /** localCallbackRelatedInsights
                 *  @desc: function that makes backend call for related insights and then highlights item
                 */
                scope.chartCtrl.toolbar.localCallbackRelatedInsights = function () {
                    if (d3.event.target.tagName.toLowerCase() === 'path') {
                        var label = d3.event.target.__data__.data.label;
                        var indexOfLabel = pieChart.data.legendData.indexOf(label);
                        var ele = d3.event.target || d3.event.srcElement;
                        var object = [{
                            name: label,
                            uri: uriData[indexOfLabel][pieChart.data.dataTable.label],
                            axisName: pieChart.data.dataTable.label,
                            selectedElement: ele
                        }];

                        if (object) {
                            scope.chartCtrl.highlightSelectedItem(object);
                        }
                    }
                };
            }

            function resizeViz() {
                //Unused resize functionality
                pieChart.chartDiv = scope.chartCtrl.chartDiv;
                pieChart.drawPie();
                scope.chartCtrl.toolbar.addToolBarListener();
                scope.chartCtrl.editMode.applyAllEdits();
                scope.chartCtrl.commentMode.drawCommentNodes();
            }

            /****************Tool Functions*************************/
            function highlightSelectedItem(selectedItems) {
                for (var i = 0; i < selectedItems.length; i++) {
                    var item = selectedItems[i];
                    var highlightIndex = -1;

                    //use uri to determine chartData index
                    //then pass index to highlight item
                    for (var j = 0; j < pieChart.data.chartData.length; j++) {
                        if (pieChart.data.chartData[j][$filter('replaceUnderscores')(item.axisName)] === $filter('shortenAndReplaceUnderscores')(item.uri)) {
                            highlightIndex = j;
                        }
                    }
                    if (highlightIndex !== -1) {
                        pieChart.highlightItem(item, 'path', highlightIndex);
                    }
                }
            }

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                d3.selectAll("#semoss-d3-tip" + scope.chartCtrl.chartName).remove();
                if (pieChart) {
                    pieChart = {};
                }
            });
        }
    }

    function pieChartCtrl($scope) {
    }

})();
