(function () {
    "use strict";
    /**
     * @name jv-bar
     * @desc jv-bar directive for creating and visualizing a Bar Chart
     */

    angular.module("app.jv-bar.directive", [])
        .directive("jvBar", jvBar);

    jvBar.$inject = ["$compile", 'VIZ_COLORS', '$filter', '$timeout'];

    function jvBar($compile, VIZ_COLORS, $filter, $timeout) {
        barChartLink.$inject = ["scope", "ele", "attrs", 'ctrl'];
        barChartCtrl.$inject = ["$scope"];
        return {
            restrict: "A",
            require: ["^chart"],
            priority: 300,
            link: barChartLink,
            controller: barChartCtrl
        };

        function barChartLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;
            /****************Tool Functions*************************/
            scope.chartCtrl.highlightSelectedItem = highlightSelectedItem;
            /****************Unused Scope Functions*****************/
            scope.chartCtrl.resizeViz = resizeViz;

            //declare and initialize local variables
            var barChart,
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
                scope.chartCtrl.chartDiv.attr('class', 'chart-div absolute-size');

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
                barChart = new jvCharts({
                    type: "bar",
                    name: scope.chartCtrl.chartName,
                    options: localChartData.uiOptions,
                    chartDiv: scope.chartCtrl.chartDiv,
                    tipConfig: tipConfig
                });
                
                barChart.setBarData(localChartData.filteredData, localChartData.dataTableAlign, localChartData.dataTableKeys, VIZ_COLORS.COLOR_SEMOSS);
                update();
            }

            /****************Update Functions*************************/
            function update() {
                barChart.paintBarChart();

                scope.chartCtrl.addJvChartToToolBar(barChart);

                /***************************************** Declare local callback functions ***************************/
                /** localCallbackApplyAllEdits
                 *  @desc: function that applies edit mode options whenever the barChart changes / redraws
                 */
                barChart.localCallbackApplyAllEdits = function () {
                    scope.chartCtrl.editMode.applyAllEdits();
                };

                barChart.updateOptions = function (options) {
                    scope.chartCtrl.updateOptions(options);
                };


                /** localCallbackRelatedInsights
                 *  @desc: function that makes backend call for related insights and then highlights item
                 */
                scope.chartCtrl.toolbar.localCallbackRelatedInsights = function () {
                    //add uri back to the uri
                    var object = barChart.getRelatedInsights(d3.event, 'bar');
                    if (object) {
                        // object[0].uri = uriData[object[0].index][$filter('replaceSpaces')(object[0].axisName)];
                        scope.chartCtrl.highlightSelectedItem(object);
                    }
                };
            }

            function resizeViz() {
                //Unused resize functionality
                barChart.chartDiv = scope.chartCtrl.chartDiv;
                barChart.paintBarChart();
                scope.chartCtrl.toolbar.addToolBarListener();
                scope.chartCtrl.editMode.applyAllEdits();
                scope.chartCtrl.commentMode.drawCommentNodes();
            }


            /****************Tool Functions*************************/

            function highlightSelectedItem(selectedItems) {
                //need to make highlight work with axisName: 'title' and uri: 'http://..../MIB_3'
                for (var i = 0; i < selectedItems.length; i++) {
                    var item = selectedItems[i];
                    barChart.highlightItem(item, 'rect', -1, item.uri.replace(/\s/g, '_'));
                }
            }

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                //remove tooltip
                d3.selectAll("#semoss-d3-tip" + scope.chartCtrl.chartName).remove();
                if (barChart) {
                    barChart = null;
                }
            });
        }
    }

    function barChartCtrl($scope) {
    }

})();