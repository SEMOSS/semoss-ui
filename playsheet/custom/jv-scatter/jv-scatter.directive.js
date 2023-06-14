(function () {
    "use strict";
    /**
     * @name scatterPlot
     * @desc ScatterPlot directive for creating and visualizing D3 scatter plots
     */
    angular.module("app.jv-scatter.directive", [])
        .directive("jvScatter", jvScatter);

    jvScatter.$inject = ["$filter", "$compile", 'VIZ_COLORS'];

    function jvScatter($filter, $compile, VIZ_COLORS) {

        scatterPlotLink.$inject = ["scope", "ele", "attrs", "controllers"];
        scatterPlotController.$inject = ['$scope'];
        return {
            restrict: "A",
            require: ['chart'],
            priority: 300,
            link: scatterPlotLink,
            controller: scatterPlotController
        };

        function scatterPlotLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;
            /****************Tool Functions*************************/
            scope.chartCtrl.highlightSelectedItem = highlightSelectedItem;
            /****************Unused Scope Functions*****************/
            scope.chartCtrl.resizeViz = resizeViz;

            //declare and initialize local variables
            var scatterPlot,
                uriData,
                html = '<div id=' + scope.chartCtrl.chartName + "-append-viz" + '><div id=' + scope.chartCtrl.chartName + '></div></div>';

            ele.append($compile(html)(scope));

            /****************Data Functions*************************/

            /**dataProcessor gets called from chart and is where the data manipulation happens for the viz
             *
             * @param newData
             */
            function dataProcessor (newData) {
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

                scatterPlot = new jvCharts({
                    type: "scatterplot",
                    name: scope.chartCtrl.chartName,
                    options: localChartData.uiOptions,
                    chartDiv: scope.chartCtrl.chartDiv,
                    tipConfig: tipConfig
                });

                scatterPlot.setScatterData(localChartData.filteredData, localChartData.dataTableAlign, VIZ_COLORS.COLOR_SEMOSS);

                update();
            }

            /****************Update Functions*************************/
            function update() {
                scatterPlot.drawScatter();

                scope.chartCtrl.addJvChartToToolBar(scatterPlot);

                /***************************************** Declare local callback functions ***************************/
                /** localCallbackApplyAllEdits
                 *  @desc: function that applies edit mode options whenever the barChart changes / redraws
                 */
                scatterPlot.localCallbackApplyAllEdits = function () {
                    scope.chartCtrl.editMode.applyAllEdits();
                };

                scatterPlot.updateOptions = function (options) {
                    
                    scope.chartCtrl.updateOptions(options);
                };


                /** localCallbackRelatedInsights
                 *  @desc: function that makes backend call for related insights and then highlights item
                 */
                scope.chartCtrl.toolbar.localCallbackRelatedInsights = function () {
                    //add uri back to the uri
                    var object = scatterPlot.getRelatedInsights(d3.event, 'scatter');
                    if (object) {
                        object[0].uri = uriData[object[0].index][$filter('replaceSpaces')(scatterPlot.currentData.dataTable.label)];
                        scope.chartCtrl.highlightSelectedItem(object);
                    }
                };
            }

            function resizeViz() {
                //Unused resize functionality
                scatterPlot.chartDiv = scope.chartCtrl.chartDiv;
                scatterPlot.drawScatter();
                scope.chartCtrl.toolbar.addToolBarListener();
                scope.chartCtrl.editMode.applyAllEdits();
                scope.chartCtrl.commentMode.drawCommentNodes();
            }

            /****************Tool Functions*************************/

            function highlightSelectedItem(selectedItems) {
                console.log(selectedItems);
                for(var i=0; i < selectedItems.length; i++) {
                    var item = selectedItems[i];
                    var highlightIndex = selectedItems[i].index;

                    if(highlightIndex) {
                        scatterPlot.highlightItem(item, 'circle', highlightIndex);
                    }
                }
            }


            //when directive ends, make sure to clean out all $on watchers
            scope.$on("$destroy", function () {
                //remove tooltip
                d3.selectAll("#semoss-d3-tip" + scope.chartCtrl.chartName).remove();
                if (scatterPlot) {
                    scatterPlot = null;
                }
            });
        }

        function scatterPlotController($scope) {

        }
    }
})();