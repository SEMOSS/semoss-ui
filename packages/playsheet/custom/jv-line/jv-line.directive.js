(function () {
    "use strict";
    /**
     * @name jvLine
     * @desc jvLine chart directive for creating and visualizing a line chart
     */

    angular.module("app.jv-line.directive", [])
        .directive("jvLine", jvLine);

    jvLine.$inject = ["$compile", 'VIZ_COLORS', '$filter'];

    function jvLine($compile, VIZ_COLORS, $filter) {
        lineChartLink.$inject = ["scope", "ele", "attrs", 'ctrl'];
        lineChartCtrl.$inject = ["$scope"];
        return {
            restrict: "A",
            require: ["^chart"],
            priority: 300,
            link: lineChartLink,
            controller: lineChartCtrl
        };

        function lineChartLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;
            /****************Tool Functions*************************/
            scope.chartCtrl.highlightSelectedItem = highlightSelectedItem;
            /****************Unused Scope Functions*****************/
            scope.chartCtrl.resizeViz = resizeViz;

            //declare and initialize local variables
            var lineChart,
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
                lineChart = new jvCharts({
                    type: "line",
                    name: scope.chartCtrl.chartName,
                    options: localChartData.uiOptions,
                    chartDiv: scope.chartCtrl.chartDiv,
                    tipConfig: tipConfig
                });

                lineChart.setLineData(localChartData.filteredData, localChartData.dataTableAlign, VIZ_COLORS.COLOR_SEMOSS);
                update();
            }

            /****************Update Functions*************************/
            function update() {
                lineChart.paintLineChart();

                scope.chartCtrl.addJvChartToToolBar(lineChart);//(lineChart, comments, vizOptions)

                /***************************************** Declare local callback functions ***************************/
                /** localCallbackApplyAllEdits
                 *  @desc: function that applies edit mode options whenever the lineChart changes / redraws
                 */
                lineChart.localCallbackApplyAllEdits = function(){
                    scope.chartCtrl.editMode.applyAllEdits();
                };

                lineChart.updateOptions = function(options){
                    console.log("in updateOptions");
                    scope.chartCtrl.updateOptions(options);
                }


                /** localCallbackRelatedInsights
                 *  @desc: function that makes backend call for related insights and then highlights item
                 */
                scope.chartCtrl.toolbar.localCallbackRelatedInsights = function () {
                    //add uri back to the uri
                    var object = lineChart.getRelatedInsights(d3.event, 'line');
                    if (object) {
                        // object[0].uri = uriData[object[0].index][$filter('replaceSpaces')(object[0].axisName)];
                        scope.chartCtrl.highlightSelectedItem(object);
                    }
                };
            }

            function resizeViz() {
                //clear main div
                lineChart.chartDiv = scope.chartCtrl.chartDiv;
                lineChart.paintLineChart();
                scope.chartCtrl.toolbar.addToolBarListener();
                scope.chartCtrl.editMode.applyAllEdits();
                scope.chartCtrl.commentMode.drawCommentNodes();
            }


            /****************Tool Functions*************************/
            function highlightSelectedItem(selectedItems) {
                //need to make highlight work with axisName: 'title' and uri: 'http://..../MIB_3'
                for(var i =0; i < selectedItems.length; i ++) {
                    var item = selectedItems[i];
                    lineChart.highlightItem(item, 'circle', -1, item.uri.replace(/\s/g, '_'));
                }
            }

            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                d3.selectAll("#semoss-d3-tip" + scope.chartCtrl.chartName).remove();
                if (lineChart) {
                    lineChart = {};
                }
            });
        }
    }

    function lineChartCtrl($scope) {
    }

})();
