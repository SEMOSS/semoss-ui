(function () {
    'use strict';

    /**
     * @name dhmsm-grid
     * @desc Table Directive
     */

    angular.module('app.dhmsm-grid.directive', [])
        .directive('dhmsmGrid', dhmsmGrid);

    dhmsmGrid.$inject = ['$rootScope', '$filter', 'monolithService', '$timeout', 'hotRegisterer', 'alertService', 'dataService'];

    function dhmsmGrid($rootScope, $filter, monolithService, $timeout, hotRegisterer, alertService, dataService) {

        dhmsmGridCtrl.$inject = ["$scope"];
        dhmsmGridLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'EA',
            scope: {},
            require: [],
            controllerAs: 'dhmsmGrid',
            bindToController: {
                data: "=",
                stepMapping: "=",
                editable: "="
            },
            templateUrl: "custom/specific/tap/dhmsm-deployment/dhmsm-grid.directive.html",
            controller: dhmsmGridCtrl,
            link: dhmsmGridLink
        };

        function dhmsmGridCtrl($scope) {
            //TODO: Look Into Performance
            var dhmsmGrid = this,
                loadingData = false,
                insightID;

            //variables
            dhmsmGrid.tableInstance = null;
            dhmsmGrid.settings = {
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
                        if (!dhmsmGrid.editable) {
                            td.ondblclick = function () {
                                dhmsmGrid.selectCell(row, prop)
                            };
                        }

                    };

                    return cellProperties;
                },
                afterGetColHeader: function (col, TH) {
                    if (!dhmsmGrid.stepMapping) {
                        return; //either not in create or the remove icon has already been appended
                    }

                    var ele = document.createElement('i');
                    //TODO add back remove icon when pkql can handle it
                    ele.className = 'fa fa-times fa-lg pull-right pointer xs-top-margin red-font hide';
                    if (TH.childNodes[0].childNodes.length > 1) {
                        TH.childNodes[0].removeChild(TH.childNodes[0].childNodes[1]);
                    }
                    if (dhmsmGrid.stepMapping.length > 0 && dhmsmGrid.stepMapping[dhmsmGrid.stepMapping.length - 1].property) {
                        if ($filter("shortenAndReplaceUnderscores")(dhmsmGrid.stepMapping[dhmsmGrid.stepMapping.length - 1].property) !== TH.innerText.trim()) {
                            ele.className += " hide";
                        }
                    } else if (dhmsmGrid.stepMapping.length > 0 && dhmsmGrid.stepMapping[dhmsmGrid.stepMapping.length - 1].node) {
                        if ($filter("shortenAndReplaceUnderscores")(dhmsmGrid.stepMapping[dhmsmGrid.stepMapping.length - 1].node) !== TH.innerText.trim()) {
                            ele.className += " hide";
                        }
                    } else {
                        ele.className += " hide";
                    }
                    TH.childNodes[0].appendChild(ele);
                },
                afterScrollVertically: function () {
                    dhmsmGrid.tableInstance.colOffset();

                }
            };
            dhmsmGrid.height = null;
            dhmsmGrid.width = null;
            dhmsmGrid.rawData = null;
            dhmsmGrid.tableHeaders = [];
            dhmsmGrid.tableData = [{}];
            //pagination vars
            dhmsmGrid.displayData = [{}];
            dhmsmGrid.currentPage = 1;
            dhmsmGrid.limit = 100;
            dhmsmGrid.loadMore = false;
            //functions
            dhmsmGrid.dataChange = dataChange;
            dhmsmGrid.selectCell = selectCell;
            dhmsmGrid.resizeViz = resizeViz;
            dhmsmGrid.prevPage = prevPage;
            dhmsmGrid.nextPage = nextPage;
            dhmsmGrid.refreshData = refreshData;
            dhmsmGrid.addMoreRows = addMoreRows;
            /*** Data Functions **/
            /**
             * @name dataChange
             *
             * @param {object} data
             * @desc Function triggered when the visualization data has changed and we need to update
             */
            function dataChange(data) {
                dhmsmGrid.rawData = data.chartData.data;
                dhmsmGrid.tableHeaders = data.chartData.headers;
                dhmsmGrid.tableData = data.chartData.filteredData;
                dhmsmGrid.layout = data.chartData.layout;
                insightID = data.chartData.insightID;
                //dhmsmGrid.refreshData();
            }

            /*** Table Functions **/
            /**
             * @name selectCell
             * @param row {number} position of selected item
             * @param prop {String} header of selected item
             * @desc Function triggered when a cell is selected, causing related insights to be called
             */
            function selectCell(row, prop) {
                var selectedItem = dhmsmGrid.rawData[row][prop];

                if (selectedItem && _.isString(selectedItem) && selectedItem.indexOf("http://") > -1) {
                    var data = {
                        selectedItem: {uri: selectedItem}
                    };
                    dataService.dataPointSelected(data);
                }
                else {
                    alertService("No URI available for your selection", 'Warning', 'toast-warning', 7000);
                }
            }

            /**
             * @name resizeViz
             * @desc Function that resizes grid
             */
            function resizeViz() {
                var container = d3.select("#dhmsm-grid-");
                var width = parseInt(container.style("width"));
                var height = parseInt(container.style("height"));
                var currentWidget = dataService.getWidgetData();

                if (currentWidget.rowOffset.end <= dhmsmGrid.rawData.length) {
                    dhmsmGrid.loadMore = true;
                    height -= 37;
                }
                else {
                    dhmsmGrid.loadMore = false;
                }

                dhmsmGrid.tableInstance.updateSettings({
                    height: height,
                    width: width
                });
                dhmsmGrid.tableInstance.render();
            }

            /**
             * @name prevPage
             * @desc paginate to previous page
             */
            function prevPage() {
                if (dhmsmGrid.currentPage > 1) {
                    dhmsmGrid.currentPage--;
                    dhmsmGrid.refreshData();
                }
            }

            /**
             * @name nextPage
             * @desc paginate to next page
             */
            function nextPage() {
                if (dhmsmGrid.currentPage * dhmsmGrid.limit < dhmsmGrid.tableData.length) {
                    dhmsmGrid.currentPage++;
                    dhmsmGrid.refreshData();
                }
            }

            /**
             * @name refreshData
             * @desc refresh the data
             */
            function refreshData() {
                var offset = (dhmsmGrid.currentPage - 1) * dhmsmGrid.limit;
                if (dhmsmGrid.tableData) {
                    dhmsmGrid.displayData = dhmsmGrid.tableData.slice(offset, offset + dhmsmGrid.limit);
                }
            }

            /**
             * @desc this will add 500 more rows to the current grid and update the row offset
             */
            function addMoreRows() {
                dataService.loadData();
            }
        }

        function dhmsmGridLink(scope, ele, attrs, ctrl) {
            //listeners
            var dhmsmGridUpdateListener = $rootScope.$on('update-visualization', function (event, data) {
                console.log('%cPUBSUBV2:', "color:lightseagreen", 'update-visualization', data);
                scope.dhmsmGrid.dataChange(data);
            });

            var dhmsmGridListener = $rootScope.$on('dhmsm-grid-receive', function (event, message) {
                console.log('%cPUBSUB:', "color:blue", message);
                if (message === 'sheet-resize-viz') {
                    if (_.isEmpty(scope.dhmsmGrid.tableData)) {
                        //grab data from data service to update with
                        var widgetData = dataService.getWidgetData();
                        scope.dhmsmGrid.dataChange(widgetData.data);
                    }
                    scope.dhmsmGrid.resizeViz(ele);
                } else if (message === 'update-data') {
                    var widgetData = dataService.getWidgetData();
                    scope.dhmsmGrid.dataChange(widgetData.data);
                }

            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying dhmsmGrid....')
                dhmsmGridUpdateListener();
                dhmsmGridListener();
            });


            /**
             * @name initialize
             * @desc function that is called on directive loadc
             */

            function initialize() {
                scope.dhmsmGrid.tableInstance = hotRegisterer.getInstance('dhmsm-grid-');
                if (_.isEmpty(scope.dhmsmGrid.data)) {
                    console.log('no data');

                }
                scope.dhmsmGrid.dataChange({chartData: scope.dhmsmGrid.data});

                //first load resize
                scope.dhmsmGrid.contentLoading = true;
                var resizeTimer = $timeout(function () {
                    scope.dhmsmGrid.resizeViz();
                    $timeout.cancel(resizeTimer);
                }, 400);
            }

            initialize();
        }

    }
})();
