'use strict';
import { Grid, ColDef, GridOptions } from 'ag-grid-community';
import { SortedColumn, LocalChartOptions } from './GridTypes';
import './grid-pivot.scss';
import angular from 'angular';
export default angular
    .module('app.grid-pivot.directive', [])
    .directive('gridPivot', gridPivot);

gridPivot.$inject = ['$compile', '$rootScope', '$timeout', 'semossCoreService'];

function gridPivot($compile, $rootScope, $timeout, semossCoreService) {
    gridPivotLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: gridPivotLink,
        scope: {
            data: '=',
        },
    };

    function gridPivotLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        let pivotDataTypes;

        /** **************Main Event Listeners*************************/
        let resizeVizListener,
            updateTaskListener,
            updateOrnamentsListener,
            addDataListener,
            localChartData: LocalChartOptions,
            previousScroll: number,
            busy = false;

        /** **************Tool Functions*************************/
        scope.grid;
        scope.newColumnAnimationObj = {
            numColumns: 0,
            headers: [],
        };
        scope.columnProperties = {};
        scope.pivotTableData = {};

        /** **************Data Functions*************************/
        /**
         * @name initialize
         * @desc initialize gets called from chart and is where the data manipulation happens for the viz
         */
        function initialize(): void {
            scope.chartDiv = ele[0].firstElementChild;

            resizeVizListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', paint);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                paint
            );
            addDataListener = scope.widgetCtrl.on('added-data', paint);
            if (scope.mode) {
                scope.widgetCtrl.emit('change-mode', {
                    mode: scope.mode,
                });
            }
            paint();

            // when directive ends, make sure to clean out excess listeners and dom elements outside of the scope
            scope.$on('$destroy', function () {
                scope.grid.gridOptions.api.destroy();
                resizeVizListener();
                updateTaskListener();
                updateOrnamentsListener();
                addDataListener();
                scope.chartDiv.innerHTML = '';
            });
        }

        /** **************View Loader Functions*************************/
        /**
         * @name paint
         * @desc paints the visualization
         */
        function paint(): void {
            let tasks = scope.widgetCtrl.getWidget('view.visualization.tasks'),
                output = tasks[0].data.values[0],
                tableData = {};

            scope.pivotTableData = {};

            // try to parse the result, if it cannot be parsed, then we assume its html
            try {
                // change it to a valid json and then parse..
                output = JSON.parse(output);
            } catch {
                console.log('Cannot parse output.');
            }

            if (typeof output === 'object' && output.length > 0) {
                tableData = getAllPivot(output, tasks[0].data.pivotData);
                scope.pivotTableData.keys = tasks[0].data.pivotData;
                scope.pivotTableData.data = JSON.parse(
                    JSON.stringify(tableData)
                );
                if (tableData) {
                    setPivotData();
                }
            }
        }

        /**
         *
         * @param {*} data the data returned from the BE
         * @param {*} pivotData the selections for the pivot
         */
        function getAllPivot(data: any, pivotData: any): any {
            let tableData: any = [],
                tempTable: any,
                tempTitle = '';

            // index 1 is the pivot table information
            // index 0 is the pivot table title
            for (let tableIdx = 0; tableIdx < data[1].length; tableIdx++) {
                tempTable = getPivotTableData(data[1][tableIdx], pivotData);

                if (pivotData.sections && pivotData.sections.length > 0) {
                    tempTitle =
                        pivotData.sections[0] + ' - ' + data[0][tableIdx];
                } else {
                    tempTitle = data[0][tableIdx];
                }

                tempTable.title = tempTitle;
                tempTable.headerConfig = getHeaderConfig(tempTable);

                tableData.push(tempTable);
            }

            return tableData;
        }

        /**
         * @name getHeaderConfig
         * @desc get header configurations such as col span
         * @returns {*} the config object
         */
        function getHeaderConfig(tableData: any): any {
            // lets get the colspan for the horizontal headers. we want to group them
            let config: any = [],
                colSpanCount = 1,
                beginningCol = 0;

            for (let rowIdx = 0; rowIdx < tableData.headers.length; rowIdx++) {
                // initial column in the row
                config[rowIdx] = [
                    {
                        colspan: 1,
                    },
                ];
                beginningCol = 0;
                colSpanCount = 1;
                for (
                    let colIdx = 1;
                    colIdx < tableData.headers[rowIdx].length;
                    colIdx++
                ) {
                    config[rowIdx][colIdx] = {
                        colspan: 0,
                    };

                    if (
                        tableData.headers[rowIdx][colIdx] !==
                        tableData.headers[rowIdx][colIdx - 1]
                    ) {
                        config[rowIdx][beginningCol].colspan = colSpanCount;

                        // set the new beginning col to calculate span for and reset the span count
                        beginningCol = colIdx;
                        colSpanCount = 1;
                    } else {
                        colSpanCount++;
                    }
                }

                // add in the last column
                config[rowIdx][beginningCol].colspan = colSpanCount;
            }

            return config;
        }

        /**
         * @name calculateTotals
         * @param data
         * @desc calculate the totals for the column
         * @returns {*} the modified totals
         */
        function calculateTotals(data: any): any {
            let isGrouped = true,
                totals: any = [];
            // need to add to data.index and data.data
            if (typeof data.index[0] !== 'object') {
                isGrouped = false;
            }

            for (let dataIdx = 0; dataIdx < data.data.length; dataIdx++) {
                for (
                    let dataInstanceIdx = 0;
                    dataInstanceIdx < data.data[dataIdx].length;
                    dataInstanceIdx++
                ) {
                    if (!totals[dataInstanceIdx]) {
                        totals[dataInstanceIdx] = 0;
                    }
                    totals[dataInstanceIdx] +=
                        data.data[dataIdx][dataInstanceIdx] || 0;
                }
            }

            // push into the index
            if (isGrouped) {
                data.index.push(['All Total']);
                for (let i = 1; i < data.index[0].length; i++) {
                    data.index[data.index.length - 1].push('');
                }
            } else {
                data.index.push('All Total');
            }

            // push into the data
            data.data.push(totals);

            return data;
        }

        /**
         * @name calculateTotals
         * @param data
         * @desc calculate the totals for the column
         * @returns {*} the modified totals
         */
        function calculateSubtotals(data: any): any {
            let subtotal: any = [],
                indexToCheck = 0;

            for (let indexIdx = 0; indexIdx < data.index.length; indexIdx++) {
                for (
                    let dataIdx = 0;
                    dataIdx < data.data[indexIdx].length;
                    dataIdx++
                ) {
                    if (
                        data.index[indexToCheck] &&
                        data.index[indexIdx][0] !== data.index[indexToCheck][0]
                    ) {
                        const tempIndex = [
                            data.index[indexIdx - 1][0] + ' Total',
                        ];

                        for (let i = 1; i < data.index[0].length; i++) {
                            tempIndex.push('');
                        }

                        data.data.splice(
                            indexIdx,
                            0,
                            semossCoreService.utility.freeze(subtotal)
                        );
                        data.index.splice(indexIdx, 0, tempIndex);
                        subtotal = [];
                        indexToCheck = indexIdx + 1;
                        break;
                    }

                    if (!subtotal[dataIdx]) {
                        subtotal[dataIdx] = 0;
                    }

                    subtotal[dataIdx] += data.data[indexIdx][dataIdx] || 0;
                    indexToCheck = indexIdx;
                }

                // the last one is All Total, so don't add it
                // // add the last subtotal
                // if (indexIdx === data.index.length - 1) {
                //     let tempIndex = [data.index[indexIdx - 1][0] + ' Total'];

                //     for (let i = 1; i < data.index[0].length; i++) {
                //         tempIndex.push('');
                //     }
                //     data.data.splice(indexIdx + 1, 0, semossCoreService.utility.freeze(subtotal));
                //     data.index.splice(indexIdx + 1, 0, tempIndex);
                //     break;
                // }
            }

            return data;
        }

        /**
         * @name calculateTotals
         * @param data
         * @desc calculate the totals for the column
         * @returns {*} the modified totals
         */
        function calculateRowTotals(data: any): any {
            let rowTotal = 0;
            const tempColumn = ['All Total'];

            // if there's just one column, we'll convert it to look like it has multiple so we don't mess with the logic.
            if (
                data.columns.length > 0 &&
                typeof data.columns[0] === 'string'
            ) {
                const tempColumns: any = [];

                for (let i = 0; i < data.columns.length; i++) {
                    tempColumns.push([data.columns[i]]);
                }
                data.columns = tempColumns;
            }

            for (
                let i = 1;
                data.columns[0] && i < data.columns[0].length;
                i++
            ) {
                tempColumn.push('');
            }

            data.columns.push(tempColumn);
            for (let dataIdx = 0; dataIdx < data.data.length; dataIdx++) {
                rowTotal = 0;
                for (
                    let dataInstanceIdx = 0;
                    dataInstanceIdx < data.data[dataIdx].length;
                    dataInstanceIdx++
                ) {
                    rowTotal += data.data[dataIdx][dataInstanceIdx] || 0;
                }

                data.data[dataIdx].push(rowTotal);
            }

            return data;
        }

        /**
         * @name getPivotTableData
         * @param {*} data the data sent from BE for us to turn into table
         * @param {*} pivotData the headers used in the data
         * @returns {object} {headers, data} after being processed. returns list of headers and list of rows
         */
        function getPivotTableData(data: any, pivotData: any): any {
            const active = scope.widgetCtrl.getWidget('active'),
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                uiOptions = angular.extend(sharedTools, individualTools);

            const returnData: any = {
                headers: [],
                vHeaders: [],
                data: [],
            };

            // always calculate all totals, needed for last row of subtotals but well pop off if not shown
            data = calculateTotals(semossCoreService.utility.freeze(data));

            if (
                uiOptions.gridPivotStyle.subTotals &&
                typeof data.index[0] === 'object'
            ) {
                data = calculateSubtotals(
                    semossCoreService.utility.freeze(data)
                );
            }

            // for old pivot tables without grandTotals rows and columns option we need to check
            if (
                uiOptions.gridPivotStyle.grandTotals ||
                (uiOptions.gridPivotStyle.hasOwnProperty('grandTotalsRows') &&
                    uiOptions.gridPivotStyle.grandTotalsRows)
            ) {
                // if rows are grouped, we will calculate the sub totals
                data = calculateRowTotals(
                    semossCoreService.utility.freeze(data)
                );
            }

            // if there's just one column, we'll convert it to look like it has multiple so we don't mess with the logic.
            if (
                data.columns.length > 0 &&
                typeof data.columns[0] === 'string'
            ) {
                const tempColumns: any = [];

                for (let i = 0; i < data.columns.length; i++) {
                    tempColumns.push([data.columns[i]]);
                }
                data.columns = tempColumns;
            }

            // for old pivot tables without grandtotals rows and columns option we need to check
            if (
                (!uiOptions.gridPivotStyle.hasOwnProperty(
                    'grandTotalsColumns'
                ) &&
                    !uiOptions.gridPivotStyle.grandTotals) ||
                (uiOptions.gridPivotStyle.hasOwnProperty(
                    'grandTotalsColumns'
                ) &&
                    !uiOptions.gridPivotStyle.grandTotalsColumns)
            ) {
                // remove all total bottom row, was needed to calculate last row of subtotals but now can remove
                data.data.pop();
                data.index.pop();
            }

            // setup the column headers
            for (let colIdx = 0; colIdx < data.columns.length; colIdx++) {
                for (
                    let colInstanceIdx = 0;
                    colInstanceIdx < data.columns[colIdx].length;
                    colInstanceIdx++
                ) {
                    if (!returnData.headers[colInstanceIdx]) {
                        if (colInstanceIdx === 0) {
                            returnData.headers[colInstanceIdx] = [''];
                            for (
                                let blankIdx = 1;
                                blankIdx < pivotData.rowGroups.length;
                                blankIdx++
                            ) {
                                returnData.headers[colInstanceIdx].push('');
                            }
                        } else {
                            returnData.headers[colInstanceIdx] = [];
                            for (
                                let blankIdx = 1;
                                blankIdx < pivotData.rowGroups.length;
                                blankIdx++
                            ) {
                                returnData.headers[colInstanceIdx].push('');
                            }
                            returnData.headers[colInstanceIdx] =
                                returnData.headers[colInstanceIdx].concat([
                                    pivotData.columns[colInstanceIdx - 1],
                                ]);
                        }
                    }

                    returnData.headers[colInstanceIdx].push(
                        data.columns[colIdx][colInstanceIdx]
                    );
                }
            }

            returnData.headers.push([]);
            // add in the last column header
            for (
                let colIdx = 0;
                colIdx < returnData.headers[0].length;
                colIdx++
            ) {
                returnData.headers[returnData.headers.length - 1].push(
                    pivotData.rowGroups[colIdx] || ''
                );
            }

            // now lets add the vertical headers
            for (let rowIdx = 0; rowIdx < data.index.length; rowIdx++) {
                if (typeof data.index[rowIdx] !== 'object') {
                    returnData.vHeaders[rowIdx] = [data.index[rowIdx]];
                } else {
                    returnData.vHeaders[rowIdx] = [];
                    for (
                        let rowInstanceIdx = 0;
                        rowInstanceIdx < data.index[rowIdx].length;
                        rowInstanceIdx++
                    ) {
                        returnData.vHeaders[rowIdx].push(
                            data.index[rowIdx][rowInstanceIdx]
                        );
                    }
                }
            }

            // finally add the data
            for (let dataIdx = 0; dataIdx < data.data.length; dataIdx++) {
                returnData.data[dataIdx] = data.data[dataIdx];
            }

            return returnData;
        }

        /** **************Pivot Table Functions*************************/
        /**
         * @name mapPivotValueKeys
         * @desc change value dimension keys to type double if math is calculation that could produce decimal values
         * @param {object} keys - keys from task data
         * @param {object} pivotKeys - keys from view loader pivot-table which store math operation
         */
        function mapPivotValueKeys(keys, pivotKeys) {
            let key;

            for (let keyIdx = 0; keyIdx < keys.length; keyIdx++) {
                key = keys[keyIdx];

                if (
                    pivotKeys.hasOwnProperty('values') &&
                    pivotKeys.values.length > 0
                ) {
                    for (
                        let valueIdx = 0;
                        valueIdx < pivotKeys.values.length;
                        valueIdx++
                    ) {
                        if (
                            pivotKeys.values[valueIdx].alias === key.header &&
                            key.dataType === 'INT'
                        ) {
                            // set round to 2 decimals for INT that may have decimals because of math
                            if (
                                pivotKeys.values[valueIdx].math === 'Average' ||
                                pivotKeys.values[valueIdx].math ===
                                    'UniqueAverage' ||
                                pivotKeys.values[valueIdx].math ===
                                    'StandardDeviation'
                            ) {
                                key.dataType = 'DOUBLE';
                            }
                        }
                    }
                }
            }
        }

        /**
         * @name formatPivotData
         * @desc structure data returned by pivot table so grid can paint in 'pivot-table' format
         */
        function formatPivotData(pivotData): void {
            let formattedData,
                headerNames = [] as any,
                headerArr = [] as any;

            formattedData = {
                values: [],
                headers: [],
                rawHeaders: [],
                topRow: [],
                lastLevel: 0,
            };

            // add vertical headers to row data
            for (let rowIdx = 0; rowIdx < pivotData.data.length; rowIdx++) {
                const currentRow = pivotData.data[rowIdx];
                for (
                    let vHeadIdx = pivotData.vHeaders[rowIdx].length - 1;
                    vHeadIdx >= 0;
                    vHeadIdx--
                ) {
                    currentRow.unshift(pivotData.vHeaders[rowIdx][vHeadIdx]);
                }
            }

            // get header group / children information
            for (
                let headerRowIdx = 0;
                headerRowIdx < pivotData.headers.length - 1;
                headerRowIdx++
            ) {
                let headerRow = pivotData.headers[headerRowIdx],
                    colSpanArr = pivotData.headerConfig[headerRowIdx],
                    headerIdx = 0,
                    hideHeaderName = false;

                while (headerIdx < headerRow.length) {
                    let colSpan = colSpanArr[headerIdx].colspan,
                        newHeader = {};

                    // replace blank column headers with unique header place holder to assign values
                    // we will set the header names to be blank on display
                    if (headerRow[headerIdx] === '') {
                        // reset colSpan since for the first header row it spans blank columns but we need to seperate them
                        // if multiple row dimensions selected
                        colSpan = 1;
                        hideHeaderName = true;
                        headerRow[headerIdx] =
                            pivotData.headers[pivotData.headers.length - 1][
                                headerIdx
                            ];
                    } else {
                        colSpan = colSpanArr[headerIdx].colspan;
                        hideHeaderName = false;
                    }

                    // find all the parents for the current header
                    let parentIdx = 1,
                        parent = '',
                        valueParent = '';

                    while (parentIdx <= headerRowIdx) {
                        // find header at current index for all the header rows before the current header row
                        parent =
                            parent +
                            pivotData.headers[headerRowIdx - parentIdx][
                                headerIdx
                            ] +
                            '[' +
                            (headerRowIdx - parentIdx) +
                            ']';
                        // value parent is name of dimension at the current index in the first header row
                        if (headerRowIdx === parentIdx) {
                            valueParent = pivotData.headers[0][headerIdx];
                        }
                        parentIdx = parentIdx + 1;
                    }

                    newHeader = {
                        // columnName is what we display as header name
                        columnName: headerRow[headerIdx],
                        // alias is used for pivot table title if sections added
                        alias:
                            headerRowIdx === 0 && headerIdx === 0
                                ? pivotData.title
                                : '',
                        // unique column identifier = column name + level + parent
                        uniqueId:
                            headerRowIdx === 0
                                ? headerRow[headerIdx] + '[0]'
                                : headerRow[headerIdx] +
                                  '[' +
                                  headerRowIdx +
                                  ']' +
                                  parent,
                        // unique parent column identifier = parent column name + parent level + parent's parent
                        parent: parent,
                        // value parent used to identify which data format to apply
                        valueParent: valueParent
                            ? valueParent
                            : headerRow[headerIdx],
                        level: headerRowIdx,
                        colIdx: headerIdx,
                        numChildren:
                            headerRowIdx === pivotData.headers.length - 2
                                ? 0
                                : colSpan,
                        hidden: hideHeaderName,
                    };

                    // for last header row we need to grab every column, otherwise skip duplicates for higher level header rows
                    if (headerRowIdx === pivotData.headers.length - 2) {
                        headerIdx = headerIdx + 1;
                    } else {
                        headerIdx = headerIdx + colSpan;
                    }
                    headerArr.push(newHeader);
                }
            }
            // use unique identifier as fields when storing data to account for duplicate columns
            for (let k = 0; k < headerArr.length; k++) {
                if (headerArr[k].level === pivotData.headers.length - 2) {
                    headerNames.push(headerArr[k].uniqueId);
                }
            }

            formattedData.values = pivotData.data;
            formattedData.headers = headerArr;
            formattedData.rawHeaders = headerNames;
            // top row holds row group headers and is pinned to top of grid instead of adding another header layer
            formattedData.topRow =
                pivotData.headers[pivotData.headers.length - 1];
            formattedData.lastLevel = pivotData.headers.length - 2;
            return formattedData;
        }

        /**
         * @name getHeaderChildren
         * @desc find the children column defs for the selected columnDef
         */
        function getHeaderChildren(headers, lastLevel, uiOptions) {
            const headerArr = {};

            // add all headers to the array before finding children
            for (let hdr = 0; hdr < headers.length; hdr++) {
                headerArr[headers[hdr].uniqueId] = {
                    children: [],
                };
            }
            // find the lowest level children first then move up levels and add them to parent header
            while (lastLevel > 0) {
                for (
                    let headerIdx = 0;
                    headerIdx < headers.length;
                    headerIdx++
                ) {
                    const header = headers[headerIdx];
                    if (header.level === lastLevel) {
                        const childDef = getPivotColDef(header, uiOptions);
                        // lowest level has no children
                        if (header.numChildren !== 0) {
                            childDef.children =
                                headerArr[header.uniqueId].children;
                        }
                        headerArr[header.parent].children.push(childDef);
                    }
                }
                lastLevel = lastLevel - 1;
            }

            return headerArr;
        }

        /**
         * @name setPivotData
         * @desc setData for the visualization and paints
         */
        function setPivotData(): void {
            let active = scope.widgetCtrl.getWidget('active'),
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {},
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.PivotTable'
                ),
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                ),
                uiOptions = angular.extend(sharedTools, individualTools),
                headerChildrenArr,
                data;

            uiOptions.colorByValue = colorBy;

            // clear out old grids to repaint
            if (scope.grid) {
                const container = scope.chartDiv;
                while (container.firstChild) {
                    container.removeChild(container.lastChild);
                }
            }

            if (scope.pivotTableData.data) {
                // update value keys
                mapPivotValueKeys(keys, scope.pivotTableData.keys);

                // add scrollbar if multiple tables
                if (scope.pivotTableData.data.length > 1) {
                    const parent = ele[0];
                    parent.style.position = 'absolute';
                    parent.style.top = '0';
                    parent.style.right = '0';
                    parent.style.bottom = '0';
                    parent.style.left = '0';
                    parent.style.overflowY = 'auto';
                }

                for (
                    let gridIdx = 0;
                    gridIdx < scope.pivotTableData.data.length;
                    gridIdx++
                ) {
                    // set chart height in case theres more than 1 grid
                    scope.chartDiv.style.height =
                        scope.pivotTableData.data.length > 1 ? '46%' : '100%';

                    // structure the data so it can be painted in the grid as expected
                    data = formatPivotData(
                        JSON.parse(
                            JSON.stringify(scope.pivotTableData.data[gridIdx])
                        )
                    );

                    // find the children
                    headerChildrenArr = getHeaderChildren(
                        data.headers,
                        data.lastLevel,
                        uiOptions
                    );

                    // get data type rules
                    pivotDataTypes = semossCoreService.visualization.getFormat(
                        keys,
                        uiOptions
                    );
                    // format data type for All Total column will match the first calculation dimensions added to the pivot table
                    for (const key in pivotDataTypes) {
                        if (
                            pivotDataTypes.hasOwnProperty(key) &&
                            pivotDataTypes[key].model === 'calculations' &&
                            key === scope.pivotTableData.keys.values[0].alias
                        ) {
                            pivotDataTypes['All Total'] = JSON.parse(
                                JSON.stringify(pivotDataTypes[key])
                            );
                        }
                    }

                    const tableData =
                        semossCoreService.visualization.getTableData(
                            data.rawHeaders,
                            data.values,
                            data.rawHeaders
                        );
                    const columnDef: ColDef[] = [];

                    // Create the column definitions for all the columns in the data
                    for (let i = 0; i < data.headers.length; i++) {
                        if (data.headers[i].level === 0) {
                            // get default col def
                            const def = getPivotColDef(
                                data.headers[i],
                                uiOptions
                            );

                            // add children
                            if (
                                headerChildrenArr.hasOwnProperty(
                                    data.headers[i].uniqueId
                                ) &&
                                headerChildrenArr[data.headers[i].uniqueId]
                                    .children.length > 0
                            ) {
                                def.children =
                                    headerChildrenArr[
                                        data.headers[i].uniqueId
                                    ].children;
                            }

                            // Add column definition
                            columnDef.push(def);
                        }
                    }

                    localChartData = {
                        headers: data.rawHeaders,
                        values: data.values,
                        keys: keys,
                        data: tableData.rawData,
                        columnDef: columnDef,
                        callbacks: scope.widgetCtrl.getEventCallbacks(),
                        uiOptions: uiOptions,
                    };

                    const options: GridOptions = {
                        rowData: localChartData.data,
                        pinnedTopRowData: getPinnedTopRow(
                            data.topRow,
                            localChartData.headers
                        ),
                        getRowClass: function (params) {
                            // always bold last row unless there is only 1 row (null sections)
                            if (
                                localChartData.data.length !== 1 &&
                                params.rowIndex ===
                                    localChartData.data.length - 1 &&
                                (uiOptions.gridPivotStyle.grandTotals ||
                                    uiOptions.gridPivotStyle.grandTotalsColumns)
                            ) {
                                return 'grid-pivot__pivot-total';
                            }
                            // multiple row groups added we need to bold sub total rows
                            if (
                                scope.pivotTableData.keys.rowGroups.length > 1
                            ) {
                                const firstCol =
                                        params.data[localChartData.headers[0]],
                                    secondCol =
                                        params.data[localChartData.headers[1]];

                                // bold row when first column cell value ends in 'Total' and second column cell value is blank
                                if (
                                    uiOptions.gridPivotStyle.subTotals &&
                                    firstCol &&
                                    secondCol === '' &&
                                    firstCol.length > 5 &&
                                    firstCol.substring(firstCol.length - 5) ===
                                        'Total'
                                ) {
                                    return 'grid-pivot__pivot-total';
                                }
                            }
                            // set font settings to match header styling for pinned top row
                            if (
                                params.node.hasOwnProperty('rowPinned') &&
                                params.node.rowPinned === 'top'
                            ) {
                                return 'grid-pivot__pivot-top-row';
                            }
                            return '';
                        },
                        defaultColDef: {
                            resizable: true,
                            sortable: false,
                            filter: false,
                            editable: false,
                        },
                        rowBuffer: localChartData.values.length,
                        columnDefs: localChartData.columnDef,
                        suppressMovableColumns: true,
                        enableCellTextSelection: false,
                        preventDefaultOnContextMenu: true,
                        suppressScrollOnNewData: true,
                        icons: {
                            columnMovePin: '<i class="fa fa-arrows"></i>',
                            columnMoveHide: '<i class="fa fa-arrows"></i>',
                            columnMoveMove: '<i class="fa fa-arrows"></i>',
                            columnMoveLeft: '<i class="fa fa-arrow-left"></i>',
                            columnMoveRight:
                                '<i class="fa fa-arrow-right"></i>',
                        },
                    };
                    scope.chartDiv.className +=
                        ' ag-theme-balham grid-pivot__chart';
                    scope.grid = new Grid(scope.chartDiv, options);

                    if (scope.grid.gridOptions.api) {
                        scope.grid.gridOptions.api.addEventListener(
                            'bodyScroll',
                            scrollEvent
                        );
                        scope.grid.gridOptions.api.addEventListener(
                            'columnResized',
                            columnResizeEvent
                        );
                    }

                    if (localChartData.uiOptions.gridPivotStyle.gridFullWidth) {
                        scope.grid.gridOptions.api.sizeColumnsToFit();
                    }

                    applyPivotHeaderColor();

                    // add titles if sections
                    if (scope.pivotTableData.data.length > 1) {
                        // create a new div element and insert before the respective child ele
                        const newDiv = document.createElement('div');
                        newDiv.innerHTML =
                            '&nbsp&nbsp' +
                            scope.pivotTableData.data[gridIdx].title.replace(
                                /_/g,
                                ' '
                            );
                        newDiv.style.fontWeight = 'bold';
                        newDiv.style.fontSize = '1em';
                        if (gridIdx === 0) {
                            newDiv.style.paddingTop = '5px';
                        }
                        scope.chartDiv.insertBefore(
                            newDiv,
                            scope.chartDiv.children[gridIdx + gridIdx]
                        );
                    }
                }
            }
        }

        /**
         * @name applyPivotTotalClass
         * @desc bold formatting applied to all total column
         */
        function applyPivotTotalClass(cell: any) {
            if (
                cell.colDef.colId === 'All Total' &&
                !cell.node.hasOwnProperty('rowPinned') &&
                !cell.colDef.hasOwnProperty('pinned')
            ) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @name applyPivotVerticalHeaderClass
         * @desc apply white background to all other cells beside bolded 'total' column cells
         */
        function applyPivotVerticalHeaderClass(cell: any) {
            if (
                cell.colDef.hasOwnProperty('pinned') &&
                cell.colDef.pinned === 'left' &&
                !cell.node.hasOwnProperty('rowPinned') &&
                cell.colDef.colId !== 'All Total'
            ) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @name applyPivotCellClass
         * @desc apply white background to all other cells beside bolded 'total' column cells
         */
        function applyPivotCellClass(cell: any) {
            if (
                cell.colDef.colId !== 'All Total' &&
                !cell.node.hasOwnProperty('rowPinned') &&
                !cell.colDef.hasOwnProperty('pinned')
            ) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @name applyPivotHeaderColor
         * @desc apply selected background color
         */
        function applyPivotHeaderColor() {
            const backgroundColor =
                    localChartData.uiOptions.gridPivotStyle.headerColor,
                fontColor = localChartData.uiOptions.gridPivotStyle.fontColor;

            const headers = scope.chartDiv.querySelectorAll('.ag-header'),
                topRow = scope.chartDiv.querySelectorAll('.ag-floating-top'),
                verticalHeaders = scope.chartDiv.querySelectorAll(
                    '.grid-pivot__pivot-vertical-header'
                );

            headers.forEach(function (element: any) {
                element.style.background = backgroundColor;
                element.style.color = fontColor;
            });

            topRow.forEach(function (element: any) {
                element.style.background = backgroundColor;
                element.style.color = fontColor;
            });

            verticalHeaders.forEach(function (element: any) {
                element.style.background = backgroundColor;
                element.style.color = fontColor;
            });
        }

        /**
         * @name getPinnedTopRow
         * @desc format top row pinned data to match row data
         */
        function getPinnedTopRow(topRow, headers) {
            const returnRow = [] as any,
                newRow = {};
            for (let headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                newRow[headers[headerIdx]] = topRow[headerIdx].replace(
                    /_/g,
                    ' '
                );
            }
            returnRow.push(newRow);
            return returnRow;
        }

        /**
         * @name getPivotColDef
         * @desc get default column def for pivot table columns
         */
        function getPivotColDef(header, uiOptions) {
            const field: string = header.uniqueId,
                // Only set autoHeight to true if the column is wrapped because of performance
                autoHeight: boolean =
                    uiOptions.gridWrapCols &&
                    uiOptions.gridWrapCols.length > 0 &&
                    uiOptions.gridWrapCols.indexOf(header.columnName) > -1;

            const colDef: ColDef = {
                headerName: header.hidden
                    ? ''
                    : String(header.columnName).replace(/_/g, ' '),
                field: field,
                colId: header.valueParent,
                editable: false,
                cellClassRules: {
                    'grid-pivot__pivot-total': applyPivotTotalClass,
                    'grid-pivot__pivot-vertical-header':
                        applyPivotVerticalHeaderClass,
                    'grid-pivot__pivot-value': applyPivotCellClass,
                },
                autoHeight: autoHeight,
                valueFormatter: formatPivotCellValue,
            };
            // Set column width, min is 200
            if (
                uiOptions.columnProperties &&
                uiOptions.columnProperties[field]
            ) {
                colDef.width = uiOptions.columnProperties[field];
            } else {
                colDef.width = 200;
            }

            // vertical 'row' headers pin to left
            if (header.colIdx < scope.pivotTableData.keys.rowGroups.length) {
                colDef.lockPinned = true;
                colDef.lockPosition = true;
                colDef.pinned = 'left';
                //colDef.suppressSizeToFit = true;
            }

            return colDef;
        }

        /**
         * @name formatPivotCellValue
         * @desc Format the value displayed to the user
         * @param cell - the cell data
         * @return the formatted value
         */
        function formatPivotCellValue(cell: any): string {
            const selectedTab = scope.widgetCtrl.getWidgetTab('selected');

            // if it is clean, return the 'raw' value
            if (selectedTab === 'clean') {
                return cell.value;
            }

            // pinned top row is actually header do not apply formats
            if (
                cell.node.hasOwnProperty('rowPinned') &&
                cell.node.rowPinned === 'top'
            ) {
                return cell.value;
            }

            // apply formats - colId is where we store the valueParent column aka which dimension we need to format by
            // since column field might not match the value dimension for a pivot table
            if (
                cell.colDef.colId &&
                pivotDataTypes.hasOwnProperty(cell.colDef.colId)
            ) {
                return semossCoreService.visualization.formatValue(
                    cell.value,
                    pivotDataTypes[cell.colDef.colId]
                );
            }

            return cell.value;
        }

        /**
         * @name scrollEvent
         * @desc add the scroll event
         * @param e - canvas data event
         */
        function scrollEvent(e: any): void {
            let active: string,
                tasks,
                layerIndex = 0,
                scrollContainer = scope.chartDiv.querySelector(
                    '.ag-full-width-container'
                ),
                bottomScrollPosition: number =
                    scope.grid.gridOptions.api.getVerticalPixelRange().bottom;
            if (
                0.9 * scrollContainer.scrollHeight <= bottomScrollPosition &&
                previousScroll < bottomScrollPosition &&
                scope.grid.gridOptions.rowData.length > 0
            ) {
                active = scope.widgetCtrl.getWidget('active');
                tasks = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex
                );
                if (tasks.available) {
                    if (!busy) {
                        busy = true;

                        const callback = () => {
                            busy = false;
                        };

                        scope.widgetCtrl.execute(
                            [
                                {
                                    type: 'load',
                                    components: [scope.widgetCtrl.widgetId],
                                    terminal: true,
                                },
                            ],
                            callback
                        );
                    }
                }
            }
            previousScroll = bottomScrollPosition;
        }

        /**
         * @name columnResizeEvent
         * @desc saves column width
         * @param event - grid api event
         */

        function columnResizeEvent(event: any): void {
            let currentColumn: any,
                header = '',
                colSize: number,
                finished: boolean = event.finished,
                source: string = event.source;

            for (let colIdx = 0; colIdx < event.columns.length; colIdx++) {
                currentColumn = event.columns[colIdx];
                header = currentColumn.colDef.field;
                colSize = currentColumn ? currentColumn.actualWidth : 200;

                if (finished && source === 'uiColumnDragged') {
                    scope.columnProperties[header] = colSize;
                    scope.widgetCtrl.execute([
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                        },
                        {
                            type: 'addPanelOrnaments',
                            components: [
                                {
                                    tools: {
                                        shared: {
                                            columnProperties:
                                                scope.columnProperties,
                                        },
                                    },
                                },
                            ],
                            terminal: true,
                        },
                        {
                            type: 'panel',
                            components: [scope.widgetCtrl.panelId],
                        },
                        {
                            type: 'retrievePanelOrnaments',
                            components: ['tools.shared'],
                            terminal: true,
                        },
                    ]);
                }
            }
        }

        /**
         * @name resizeViz
         * @desc resize the grid
         */
        function resizeViz(): void {
            if (localChartData.uiOptions.gridPivotStyle.gridFullWidth) {
                scope.grid.gridOptions.api.sizeColumnsToFit();
            }
            scope.grid.gridOptions.api.resetRowHeights();
        }

        initialize();
    }
}
