(function () {
    'use strict';

    /**
     * @name smss-grid
     * @desc Table Directive
     */

    angular.module('app.smss-grid.directive', [])
        .directive('smssGrid', smssGrid);

    smssGrid.$inject = ['$rootScope', '$filter', 'monolithService', '$timeout', 'hotRegisterer', 'alertService', 'dataService'];

    function smssGrid($rootScope, $filter, monolithService, $timeout, hotRegisterer, alertService, dataService) {

        smssGridCtrl.$inject = ["$scope"];
        smssGridLink.$inject = ["scope", "ele", "attrs", "ctrl"];


        return {
            restrict: 'A',
            require: ['^chart'],
            priority: 300,
            templateUrl: "standard/smss-grid/smss-grid.directive.html",
            controller: smssGridCtrl,
            link: smssGridLink
        };
        function smssGridLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];
            scope.chartCtrl.smssGrid = {};


            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;

            /****************Resize Functions*************************/
            scope.chartCtrl.resizeViz = resizeViz;

            /****************Highlight Functions*************************/
            scope.chartCtrl.highlightSelectedItem = function () {
            };

            /****************Directive Content*************************/
            //variables
            //TODO: Look Into Performance
            var tableInstance = false;
            //variables
            scope.chartCtrl.smssGrid.localChartData = false;
            scope.chartCtrl.smssGrid.settings = {
                readOnly: true,
                columnSorting: true,
                sortIndicator: true,
                manualRowResize: true,
                manualColumnResize: true,
                colWidths: 200,
                stretchH: "all",
                cells: function (row, col, prop) {
                    var cellProperties = {};

                    cellProperties.renderer = function (instance, td, row, col, prop, value, cellProperties) {
                        td.title = value;
                        td.innerHTML = value;
                        //Adding in double click...
                        td.ondblclick = function () {
                            var selectedItem = scope.chartCtrl.smssGrid.localChartData.data[row][prop];
                            if (selectedItem && _.isString(selectedItem) && selectedItem.indexOf("http://") > -1) {
                                var data = {
                                    selectedItem: {uri: selectedItem}
                                };

                                scope.chartCtrl.highlightSelectedItem(data);
                            }
                            else {
                                alertService("No URI available for your selection", 'Warning', 'toast-warning', 7000);
                            }
                        };
                    };

                    return cellProperties;
                },
                afterGetColHeader: function (col, TH) {
                    if (!scope.chartCtrl.smssGrid.stepMapping) {
                        return; //either not in create or the remove icon has already been appended
                    }

                    var ele = document.createElement('i');
                    //TODO add back remove icon when pkql can handle it
                    ele.className = 'fa fa-times fa-lg pull-right pointer xs-top-margin red-font hide';
                    if (TH.childNodes[0].childNodes.length > 1) {
                        TH.childNodes[0].removeChild(TH.childNodes[0].childNodes[1]);
                    }
                    if (scope.chartCtrl.smssGrid.stepMapping.length > 0 && scope.chartCtrl.smssGrid.stepMapping[scope.chartCtrl.smssGrid.stepMapping.length - 1].property) {
                        if ($filter("shortenAndReplaceUnderscores")(scope.chartCtrl.smssGrid.stepMapping[scope.chartCtrl.smssGrid.stepMapping.length - 1].property) !== TH.innerText.trim()) {
                            ele.className += " hide";
                        }
                    } else if (scope.chartCtrl.smssGrid.stepMapping.length > 0 && scope.chartCtrl.smssGrid.stepMapping[scope.chartCtrl.smssGrid.stepMapping.length - 1].node) {
                        if ($filter("shortenAndReplaceUnderscores")(scope.chartCtrl.smssGrid.stepMapping[scope.chartCtrl.smssGrid.stepMapping.length - 1].node) !== TH.innerText.trim()) {
                            ele.className += " hide";
                        }
                    } else {
                        ele.className += " hide";
                    }
                    TH.childNodes[0].appendChild(ele);
                },
                afterScrollVertically: function () {
                    tableInstance.colOffset();

                }
            };
            //pagination vars
            scope.chartCtrl.smssGrid.displayData = [{}];
            scope.chartCtrl.smssGrid.currentPage = 1;
            scope.chartCtrl.smssGrid.limit = 100;
            scope.chartCtrl.smssGrid.loadMore = false;

            //functions
            scope.chartCtrl.smssGrid.addMoreRows = addMoreRows;

            /*** Data Functions **/
            /**
             * @name dataProcessor
             * @param {object} newData
             * @desc Function triggered when the visualization data has changed and we need to update
             */
            function dataProcessor(newData) {
                if (!tableInstance) {
                    tableInstance = hotRegisterer.getInstance('smss-grid');
                }

                scope.chartCtrl.smssGrid.localChartData = JSON.parse(JSON.stringify(newData));


                //scope.chartCtrl.smssGrid.refreshData();
            }

            /*** Table Functions **/
            /**
             * @name resizeViz
             * @desc Function that resizes grid
             */
            function resizeViz() {
                var container = d3.select("#smss-grid");
                var width = parseInt(container.style("width"));
                var height = parseInt(container.style("height"));
                var currentWidget = dataService.getWidgetData();

                if (scope.chartCtrl.smssGrid.localChartData.layout !== 'create' && currentWidget.rowOffset.end <= scope.chartCtrl.smssGrid.localChartData.data.length) {
                    scope.chartCtrl.smssGrid.loadMore = true;
                    height -= 37;
                }
                else {
                    scope.chartCtrl.smssGrid.loadMore = false;
                }

                tableInstance.updateSettings({
                    height: height,
                    width: width
                });
                tableInstance.render();
            }

            /**
             * @name refreshData
             * @desc refresh the data
             */
            function refreshData() {
                var offset = (scope.chartCtrl.smssGrid.currentPage - 1) * scope.chartCtrl.smssGrid.limit;
                if (scope.chartCtrl.smssGrid.localChartData.filteredData) {
                    scope.chartCtrl.smssGrid.displayData = scope.chartCtrl.smssGrid.localChartData.filteredData.slice(offset, offset + scope.chartCtrl.smssGrid.limit);
                }
            }

            /**
             * @desc this will add 500 more rows to the current grid and update the row offset
             */
            function addMoreRows() {
                dataService.loadData();
            }

            /**
             * @name initialize
             * @desc function that is called on directive loadc
             */

            function initialize() {
                if (!tableInstance) {
                    tableInstance = hotRegisterer.getInstance('smss-grid');
                }

                //first load resize
                var resizeTimer = $timeout(function () {
                    resizeViz();
                    $timeout.cancel(resizeTimer);
                }, 400);
            }

            initialize();

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying smssGrid....');
                console.warn('destroy table instance')
            });
        }

        function smssGridCtrl($scope) {
        }


    }
})();
