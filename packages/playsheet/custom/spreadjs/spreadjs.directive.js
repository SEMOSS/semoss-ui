(function () {
    'use strict';

    /**
     * @name spreadjs
     * @desc Spreadsheet Directive
     */
    angular.module('app.spreadjs.directive', [])
        .directive('spreadjs', spreadjs);

    spreadjs.$inject = ['$rootScope', '$filter', '$timeout', 'monolithService', 'dataService', 'pkqlService'];

    function spreadjs($rootScope, $filter, $timeout, monolithService, dataService, pkqlService) {

        spreadjsCtrl.$inject = [];
        spreadjsLink.$inject = ["scope", "ele", "attrs", "ctrl"];

        return {
            restrict: 'A',
            require: ['^chart'],
            priority: 300,
            link: spreadjsLink,
            controller: spreadjsCtrl,
            templateUrl: "custom/spreadjs/spreadjs.directive.html"
        };


        function spreadjsLink(scope, ele, attrs, ctrl) {
            scope.chartCtrl = ctrl[0];

            /****************Data Functions*************************/
            scope.chartCtrl.dataProcessor = dataProcessor;

            /****************Resize Functions*************************/
            scope.chartCtrl.resizeViz = resizeViz;

            /****************Highlight Functions*************************/
            scope.chartCtrl.highlightSelectedItem = function () {
            };


            /****************Directive Content*************************/
            //variables
            var tableName = 'table',
                loadingData = false,
                localChartData = false;

            /**
             * @name addRule
             * @desc adds a conditional formatting rule
             */
            function addRule(data, sels) {
                console.log("adding rules");
                var sheet = $("#ss").data("spread").getActiveSheet();
                var selections = {};

                if (sels) {
                    selections = angular.copy(sheet.getSelections());
                    selections[0].col = sels[0].col;
                    selections[0].colCount = sels[0].colCount;
                    selections[0].row = sels[0].row;
                    selections[0].rowCount = sels[0].rowCount;
                } else {
                    selections = sheet.getSelections();
                }

                var cfs = sheet.getConditionalFormats();
                var style = new GcSpread.Sheets.Style();
                style.backColor = data.backColor;
                style.foreColor = data.foreColor;
                var operator = parseInt(data.options[data.selected].condition);

                switch (data.selected) {
                    case "CellValueRule":
                        var lowerBound = parseFloat(data.options[data.selected].lowerBound);
                        var upperBound = parseFloat(data.options[data.selected].upperBound);
                        cfs.addCellValueRule(operator, lowerBound, upperBound, style, selections);
                        break;
                    case "SpecificTextRule":
                        var text = data.options[data.selected].text;
                        cfs.addSpecificTextRule(operator, text, style, selections);
                        break;
                    case "DateOccurringRule":
                        cfs.addDateOccurringRule(operator, style, selections);
                        break;
                    case "FormulaRule":
                        var formula = data.options[data.selected].formula;
                        cfs.addFormulaRule(formula, style, selections);
                        break;
                    case "Top10Rule":
                        var number = data.options[data.selected].number;
                        cfs.addTop10Rule(operator, parseInt(number), style, selections);
                        break;
                    case "UniqueRule":
                        cfs.addUniqueRule(style, selections);
                        break;
                    case "DuplicateRule":
                        cfs.addDuplicateRule(style, selections);
                        break;
                    case "AverageRule":
                        cfs.addAverageRule(operator, style, selections);
                        break;
                    case "TwoScaleRule":
                        var minType = "",
                            minValue = "",
                            minColor = "",
                            maxType = "",
                            maxValue = "",
                            maxColor = "";

                        cfs.add2ScaleRule(minType, minValue, minColor, maxType, maxValue, maxColor, selections);
                        break;
                    case "ThreeScaleRule":
                        var minType = "",
                            minValue = "",
                            minColor = "",
                            midType = "",
                            midValue = "",
                            midColor = "",
                            maxType = "",
                            maxValue = "",
                            maxColor = "";
                        cfs.add3ScaleRule(minType, minValue, minColor, midType, midValue, midColor, maxType, maxValue, maxColor, selections);
                        break;
                    case "DataBarRule":
                        console.log("not implemented yet");
                        break;
                    case "IconSetRule":
                        console.log("not implemented yet");
                        break;
                    default:
                        console.log("selected rule is not available");
                        break;
                }

                sheet.repaint();
            }

            /**
             * @name removeRules
             * @desc removes all conditional formatting rules
             */
            function removeRules() {
                console.log("removing rules");
                var sheet = $("#ss").data("spread").getActiveSheet(),
                    cfs = sheet.getConditionalFormats(),
                    selections = sheet.getSelections();

                if (selections && selections.length > 0) {
                    var sel = selections[0];
                    cfs.removeRuleByRange(sel.row, sel.col, sel.rowCount, sel.colCount);
                }
            }

            /**
             * @name dataProcessor
             * @param data {string} - the new data for the grid
             * @desc sets the data for spreadjs when it changes
             */
            function dataProcessor(newData) {
                localChartData = JSON.parse(JSON.stringify(newData));


                var spread = $("#ss").data("spread");

                if (spread) {
                    refreshTable();
                } else {
                    //need this timeout so the angular spread directive can load....or we maybe just do it all through the jquery selector
                    $timeout(function () {
                        makeTable();
                        addCellFormulaListeners();
                    }, 800);
                }
            }

            /**
             * @name makeTable
             * @desc creates the table, adds events, resizes the table
             */
            function makeTable() {
                var spread = $("#ss").data("spread");
                //hide the tab strip (displays sheets, and add new sheet within the spreadJSwidget)
                spread.tabStripVisible(false);
                var sheet = spread.getActiveSheet();
                sheet.addTableByDataSource(tableName, 0, 0, localChartData.filteredData);

                autoFitColumns(sheet);
                setConditionalFormats();
                addScrollEvent(sheet);

                //Commenting out pkql filter for now. This code may be redundant due to ability to filter from the panel side as opposed to the grid.

                // sheet.bind(GcSpread.Sheets.Events.TableFiltered, function (e, info) {
                //     var filterOptions = {};
                //     filterOptions[info.table._columns[info.tableCol]._name] = {
                //         inputSearch: "",
                //         isCollapsed: false,
                //         isDisabled: false,
                //         isFiltered: true,
                //         list: [],
                //         selectAll: info.filterValues.length === info.table._bindingManager._dataSource.length
                //     };
                //
                //     for (var i = 0; i < info.filterValues.length; i++) {
                //         filterOptions[info.table._columns[info.tableCol]._name].list.push({
                //             selected: true,
                //             value: info.filterValues[i].replace(/ /g, "_")
                //         });
                //     }
                //
                //     var filterPKQL = '';
                //     for (var i in filterOptions) {
                //         filterPKQL += pkqlService.generateFilterQuery(filterOptions, i);
                //     }
                //     var currentWidget = dataService.getWidgetData();
                //     pkqlService.executePKQL(currentWidget.insightId, filterPKQL);
                // });
            }

            /**
             * @name autoFitColumns
             * @param sheet
             * @desc autofits columns for the sheet
             */
            function autoFitColumns(sheet) {
                var counter = 0;
                for (var col in localChartData.filteredData[0]) {
                    try { //there is something wrong with spreadjs's angular function for autoFitting. it needs to be surrounded by a try/catch in the library. since it's not, we will do it ourself.
                        sheet.autoFitColumn(counter);
                    } catch (err) {
                        console.log(err);
                    }
                    counter++;
                }
            }

            /**
             * @name setConditionalFormats
             * @desc applies conditional formatting
             */
            function setConditionalFormats() {
                if (localChartData.uiOptions && !_.isEmpty(localChartData.uiOptions) && localChartData.uiOptions.formatRules && !_.isEmpty(JSON.parse(localChartData.uiOptions.formatRules))) {
                    var formatRules = JSON.parse(localChartData.uiOptions.formatRules);
                    for (var column in formatRules) {
                        for (var rule in formatRules[column]) {
                            addRule(formatRules[column][rule].ruleSelections, formatRules[column][rule].selections);
                        }
                    }
                }
            }

            /**
             * @name addScrollEvent
             * @param sheet
             * @desc adds an on scroll event to the grid
             */
            function addScrollEvent(sheet) {
                sheet.bind(GcSpread.Sheets.Events.TopRowChanged, function (sender, args) {

                    //check to see if we are getting to the last row and also if there is any data to get
                    //(args.sheet.getRowCount() - 50)
                    if (args.newTopRow > (localChartData.data.length - 50)) {
                        dataService.loadData();
                    }
                });
            }

            /**
             * @name refreshTableData
             * @param tableName
             * @desc if table already exists need to just refresh the data
             */
            function refreshTableData(tableName) {
                var sheet = $("#ss").data("spread").getActiveSheet();
                sheet.findTableByName(tableName).refresh();
            }

            /**
             * @name refreshTable
             * @param data {string} - the new data for the grid
             * @desc sets the data for spreadjs when it changes
             */
            function refreshTable() {
                var sheet = $("#ss").data("spread").getActiveSheet(),
                    sheetTable = sheet.findTableByName(tableName);

                //this will overwrite the current table with new data, but we want to keep the formulas
                if (sheet) {
                    if (sheetTable) {
                        sheet.removeTable(sheetTable);
                    }
                    makeTable();
                    //addCellFormulaListeners();
                }
            }

            /**
             * @name resizeViz
             * @desc resizes the spreadjs element
             */
            function resizeViz() {
                $("#ss").wijspread("refresh");
            }

            /**
             * @name addCellFormulaListeners
             * @desc adds listeners for certain cell events - used to translate spreadjs formulas to PKQL
             * @TODO clean this up
             */
            function addCellFormulaListeners() {
                $("#ss").data("spread").getActiveSheet().bind(GcSpread.Sheets.Events.CellChanged, function (e, info) {
                    if (info.sheetArea === GcSpread.Sheets.SheetArea.viewport && info.newValue) {
                        //TODO: stop propagation of events to all cells


                        var sheet = $("#ss").data("spread").getActiveSheet(),
                            currentTable = sheet.findTableByName(tableName),
                            columnName = "Column";

                        //adding new column to table if necessary
                        columnName += currentTable._colCount + 1;

                        //update entire column
                        //currentTable.setColumnDataFormula(info.col, info.newValue);

                        //create the pkql query
                        var pkql = pkqlService.generateSpreadJSQuery(info.propertyName, info.newValue, _.map(localChartData.headers, "title"), tableName, columnName);
                        var currentWidget = dataService.getWidgetData();
                        if (pkql) {
                            pkqlService.executePKQL(currentWidget.insightId, pkql);
                        }


                    }
                });
            }


            /****************Listeners*************************/
            var spreadjsListener = $rootScope.$on('smss-grid-receive', function (event, message, data) {
                if (message === 'add-rules') {
                    addRule(data.ruleSelections);
                }
                else if (message === 'remove-rules') {
                    removeRules();
                }
            });

            //cleanup
            scope.$on('$destroy', function () {
                console.log('destroying spreadjs....');
                spreadjsListener();
            });

            //add listeners
            addCellFormulaListeners();
        }


        function spreadjsCtrl() {
        }
    }

})();