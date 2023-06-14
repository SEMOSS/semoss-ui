'use strict';
import { Grid, ColDef, GridOptions } from 'ag-grid-community';
import { CustomHeaderComp } from './CustomHeaderComp';
import { CustomTextFilterComp } from './CustomTextFilterComp';
import { CustomNumberFilterComp } from './CustomNumberFilterComp';
import { SortedColumn, LocalChartOptions } from './GridTypes';
import './grid-standard.scss';
import angular from 'angular';
export default angular
    .module('app.grid-standard.directive', [])
    .directive('gridStandard', gridStandard);

gridStandard.$inject = [
    '$compile',
    '$rootScope',
    '$timeout',
    'semossCoreService',
];

function gridStandard($compile, $rootScope, $timeout, semossCoreService) {
    gridStandardLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: gridStandardLink,
        scope: {
            data: '=',
        },
    };

    function gridStandardLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        let spanData = {};
        let maxSpan = 1;
        let dataTypes;

        /** **************Main Event Listeners*************************/
        let resizeVizListener,
            updateTaskListener,
            updateOrnamentsListener,
            shiftCleanGridListener,
            addDataListener,
            localChartData: LocalChartOptions,
            events = {},
            previousScroll: number,
            clickTimeout,
            busy = false,
            contextMenuEle,
            contextMenuScope;

        /** **************Tool Functions*************************/
        scope.grid;
        scope.newColumnAnimationObj = {
            numColumns: 0,
            headers: [],
        };
        scope.previousColumnState = [];
        scope.headerColumnsToStyle = [];
        scope.linkColumnsToStyle = [];
        scope.sortOptions = [];
        scope.columnProperties = {};
        scope.columnFilters = {};
        scope.onFilterColumn = onFilterColumn;
        /** **************Data Functions*************************/
        /**
         * @name initialize
         * @desc initialize gets called from chart and is where the data manipulation happens for the viz
         */
        function initialize(): void {
            scope.chartDiv = ele[0].firstElementChild;

            resizeVizListener = scope.widgetCtrl.on('resize-widget', resizeViz);
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                setData
            );
            addDataListener = scope.widgetCtrl.on('added-data', setData);
            events = scope.widgetCtrl.getEventCallbacks();
            shiftCleanGridListener = scope.widgetCtrl.on(
                'shift-clean-grid',
                shiftCleanGrid
            );
            document.addEventListener('click', onDocumentClick);
            if (scope.mode) {
                scope.widgetCtrl.emit('change-mode', {
                    mode: scope.mode,
                });
            }
            setData();

            // when directive ends, make sure to clean out excess listeners and dom elements outside of the scope
            scope.$on('$destroy', function () {
                closeContextMenu();
                document.removeEventListener('click', onDocumentClick);
                scope.grid.gridOptions.api.destroy();
                resizeVizListener();
                updateTaskListener();
                updateOrnamentsListener();
                addDataListener();
                shiftCleanGridListener();
                scope.chartDiv.innerHTML = '';
            });
        }

        /**
         * @name shiftCleanGrid
         * @param payload - payload with the column
         * @desc when selecting a column in clean statistics, shifts the grid to show that column on the left
         */
        function shiftCleanGrid(payload: any): void {
            const colId: string = payload.column;
            scope.grid.gridOptions.api.ensureColumnVisible(colId);
        }

        /**
         * @name getCurrentMode
         * @desc return the selected mode
         * @param mode - current mode
         */
        function getCurrentMode(mode: string): string {
            switch (mode) {
                case 'brush-mode':
                    return 'brushMode';
                case 'comment-mode':
                    return 'commentMode';
                case 'edit-mode':
                    return 'editMode';
                default:
                    return 'defaultMode';
            }
        }

        /**
         * @name getCurrentEvents
         * @desc return the selected event
         */
        function getCurrentEvents(): any {
            return events[getCurrentMode(scope.widgetCtrl.getMode('selected'))];
        }

        /**
         * @name getCellStyle
         * @desc Sets background color if there are columns to color by value
         * @param cell - the cell to be styled
         * @return style - the css to apply the styles
         */
        function getCellStyle(cell: any): any {
            function passedSimpleFilterCheck(
                rowData,
                selectedColumn,
                selectedValue,
                comparator
            ): boolean {
                let isValid = true;
                if (typeof rowData[selectedColumn] === 'undefined') {
                    isValid = false;
                } else if (comparator === '==') {
                    isValid =
                        selectedValue.indexOf(rowData[selectedColumn]) > -1;
                } else if (comparator === '!=') {
                    isValid =
                        selectedValue.indexOf(rowData[selectedColumn]) === -1;
                } else if (comparator === '>') {
                    isValid = rowData[selectedColumn] > selectedValue;
                } else if (comparator === '<') {
                    isValid = rowData[selectedColumn] < selectedValue;
                } else if (comparator === '>=') {
                    isValid = rowData[selectedColumn] >= selectedValue;
                } else if (comparator === '<=') {
                    isValid = rowData[selectedColumn] <= selectedValue;
                } else if (comparator === '?like') {
                    isValid = rowData[selectedColumn]
                        .toLowerCase()
                        .includes(selectedValue);
                }

                return isValid;
            }
            function isColoringValid(rule, rowData): boolean {
                let isValid = true;
                const filter = rule.filters[0];

                if (filter.filterObj.filterType === 'SIMPLE') {
                    const selectedColumn = filter.filterObj.left.value;
                    const selectedValue = filter.filterObj.right.value;
                    const comparator = filter.filterObj.comparator;

                    isValid = passedSimpleFilterCheck(
                        rowData,
                        selectedColumn,
                        selectedValue,
                        comparator
                    );
                } else if (filter.filterObj.filterType === 'AND') {
                    // NOTE ::: WE ARE NOT HANDLING NESTED AND/OR's. will need to build out the logic to recursively go through the filters
                    // NOTE ::: to check at the deepest level outwards.
                    const filters = filter.filterObj.value;
                    for (
                        let filterIdx = 0;
                        filterIdx < filters.length;
                        filterIdx++
                    ) {
                        const selectedColumn = filters[filterIdx].left.value;
                        const selectedValue = filters[filterIdx].right.value;
                        const comparator = filters[filterIdx].comparator;
                        // if one is false, we will return false.
                        if (
                            !passedSimpleFilterCheck(
                                rowData,
                                selectedColumn,
                                selectedValue,
                                comparator
                            )
                        ) {
                            isValid = false;
                            break;
                        }
                    }
                } else if (filter.filterObj.filterType === 'OR') {
                    // NOTE ::: WE ARE NOT HANDLING NESTED AND/OR's. will need to build out the logic to recursively go through the filters
                    // NOTE ::: to check at the deepest level outwards.
                    const filters = filter.filterObj.value;
                    // toggle it false first, we will set it in the next check if it's true
                    isValid = false;
                    for (
                        let filterIdx = 0;
                        filterIdx < filters.length;
                        filterIdx++
                    ) {
                        const selectedColumn = filters[filterIdx].left.value;
                        const selectedValue = filters[filterIdx].right.value;
                        const comparator = filters[filterIdx].comparator;

                        // if one is true, we will return true.
                        if (
                            passedSimpleFilterCheck(
                                rowData,
                                selectedColumn,
                                selectedValue,
                                comparator
                            )
                        ) {
                            isValid = true;
                            break;
                        }
                    }
                }

                return isValid;
            }

            let colorByValue = localChartData.uiOptions.colorByValue,
                style = {};
            if (colorByValue.length > 0) {
                for (let i = 0; i < colorByValue.length; i++) {
                    let colorRow: boolean, colorCell: boolean;

                    // restricting coloring to be based on the selected filtered values if its in the view
                    if (
                        colorByValue[i].restrict &&
                        cell.data[colorByValue[i].valuesColumn]
                    ) {
                        // loop through this row and check the fitered column to see if values falls within the selection/range
                        if (!isColoringValid(colorByValue[i], cell.data)) {
                            continue;
                        }
                    }

                    (colorRow =
                        colorByValue[i].highlightRow &&
                        colorByValue[i].valuesToColor.indexOf(
                            cell.data[colorByValue[i].colorOn]
                        ) > -1),
                        (colorCell =
                            !colorByValue[i].highlightRow &&
                            colorByValue[i].valuesToColor.indexOf(cell.value) >
                                -1 &&
                            colorByValue[i].colorOn === cell.colDef.field);

                    if (colorRow || colorCell) {
                        style = { background: colorByValue[i].color };
                    }
                }
            }
            return style;
        }

        /**
         * @name getRowIndex
         * @desc Uses the row's index to set the row number column (row header)
         * @param row - the row data
         * @return the value to set as the row number
         */
        function getRowIndex(row: any): any {
            if (row.node.rowPinned) {
                return '';
            }
            return row.node.rowIndex + 1;
        }

        /**
         * @name getHeaderClass
         * @desc If the column's header is highlighted, then add the className to style it
         * @param header - the header data
         * @return the classname
         */
        function getHeaderClass(header: any): string {
            if (scope.headerColumnsToStyle.indexOf(header.colDef.field) > -1) {
                return 'grid-standard__header--highlight';
            }
            return '';
        }

        function applyHeaderColor() {
            let backgroundColor = '#40A0FF',
                fontColor = '#FFFFFF';

            if (localChartData.uiOptions.gridHeaderColor) {
                backgroundColor = localChartData.uiOptions.gridHeaderColor;
            }

            if (localChartData.uiOptions.gridHeaderFontColor) {
                fontColor = localChartData.uiOptions.gridHeaderFontColor;
            }
            const headers = document.querySelectorAll(
                '.grid-standard__header--highlight'
            );

            headers.forEach(function (element: any) {
                element.style.background = backgroundColor;
                element.style.color = fontColor;
            });
        }

        function applyBackgroundClass() {
            if (localChartData.uiOptions.gridSpanRows) {
                return true;
            }
            return false;
        }

        /**
         * @name applyLinkClass
         * @desc If the cell is styled as a link, then apply the link class
         * @param cell - the cell data
         * @return If true, the link style class will be applied to the cell
         */
        function applyLinkClass(cell: any): boolean {
            if (
                scope.linkColumnsToStyle.indexOf(cell.colDef.field) > -1 ||
                (scope.widgetCtrl.panelId === 999 &&
                    cell.colDef.field === 'URL')
            ) {
                return true;
            }
            return false;
        }

        /**
         * @name applyWrapClass
         * @desc If the cell's content is to be wrapped, then apply the class
         * @param cell - the cell data
         * @return If true, the wrap style class will be applied to the cell
         */
        function applyWrapClass(cell: any): boolean {
            if (
                localChartData.uiOptions.gridWrapCols &&
                localChartData.uiOptions.gridWrapCols.length > 0 &&
                localChartData.uiOptions.gridWrapCols.indexOf(
                    cell.colDef.field
                ) > -1
            ) {
                return true;
            }
            return false;
        }

        /**
         * @name applySpanBorderClass
         * @desc If row spanning is active, apply borders to all cells
         * @return If true, the cell span style class will be applied to the cell
         */
        function applySpanBorderClass(): boolean {
            if (localChartData.uiOptions.gridSpanRows) {
                return true;
            }
            return false;
        }

        /**
         * @name applySpanClass
         * @desc If row spanning widget is active, apply background color
         * @param cell - the cell data
         * @return If true, the cell span group style class will be applied to the spanned cell
         */
        function applySpanClass(cell: any): boolean {
            let field,
                paramsRowIdx = 0;

            if (localChartData.uiOptions.gridSpanRows) {
                field = cell.colDef.field;

                // get the row index
                paramsRowIdx = parseInt(cell.node.id);
                // ignore filtered out rows
                if (!spanData[paramsRowIdx]) {
                    return false;
                }
                // only apply background cell styling for spanned rows
                if (
                    !isNaN(spanData[paramsRowIdx][field].value) &&
                    spanData[paramsRowIdx][field].value !== 1
                ) {
                    return true;
                } else {
                    return false;
                }
            }
            return false;
        }

        /**
         * @name formatCellValue
         * @desc Format the value displayed to the user
         * @param cell - the cell data
         * @return the formatted value
         */
        function formatCellValue(cell: any): string {
            const selectedTab = scope.widgetCtrl.getWidgetTab('selected');

            // if it is clean, return the 'raw' value
            if (selectedTab === 'clean') {
                return cell.value;
            }

            // format otherwise
            if (cell.colDef.field) {
                return semossCoreService.visualization.formatValue(
                    cell.value,
                    dataTypes[cell.colDef.field]
                );
            }

            return cell.value;
        }

        /**
         * @name getRowSpanCounts
         * @desc Format the value displayed to the user
         * @param cell - the cell data
         * @return the formatted value
         */
        function getRowSpanCounts(tableData: any): void {
            let colName,
                rowIdx,
                currentCol,
                previousColRawName,
                rawColName = '',
                i = 1,
                k,
                j,
                n,
                getGroups = true,
                currentColIdx,
                colNameArray,
                columns;

            // don't run if table is empty
            if (
                Object.keys(tableData.labelData).length &&
                tableData.rawData.length !== 0
            ) {
                colNameArray = Object.keys(tableData.labelData);
                columns = tableData.labelData;
                spanData = JSON.parse(JSON.stringify(tableData.rawData));

                // reset span data column values to empty objects
                for (k = 0; k < Object.keys(spanData).length; k++) {
                    for (j in spanData[k]) {
                        spanData[k][j] = {};
                    }
                }

                //loop through columns
                for (colName in columns) {
                    currentCol = columns[colName];
                    currentColIdx = colNameArray.indexOf(colName);
                    getGroups = true;

                    for (rowIdx = 0; rowIdx < currentCol.length; rowIdx++) {
                        rawColName = colName.replace(/ /g, '_');
                        // for all other columns besides the first, check the previous column
                        if (currentColIdx !== 0) {
                            previousColRawName = colNameArray[
                                currentColIdx - 1
                            ].replace(/ /g, '_');
                            // get groups for all rows in the current column before assigning span values
                            if (getGroups) {
                                for (n = 0; n < currentCol.length; n++) {
                                    // for all rows except the last row
                                    if (n + 1 !== currentCol.length) {
                                        if (
                                            spanData[n][previousColRawName]
                                                .group ||
                                            currentCol[n] !== currentCol[n + 1]
                                        ) {
                                            // if previous column group ends here or current row does not equal next row then end group
                                            spanData[n][rawColName].group =
                                                true;
                                        } else {
                                            // if next row equals current row, do NOT end group span
                                            spanData[n][rawColName].group =
                                                false;
                                        }
                                    } else {
                                        // last row is always span 1 and end of groups
                                        spanData[n][rawColName].value = 1;
                                        spanData[n][rawColName].group = true;
                                    }
                                }
                                getGroups = false;
                            }
                            // after groups are defined, get span values
                            // span for first row in each group will be the count of subsequent rows with equal values
                            // span is 1 for all subsequent rows with equal values as the starting row
                            i = 1;
                            while (
                                currentCol[rowIdx] === currentCol[rowIdx + i] &&
                                !spanData[rowIdx][rawColName].group
                            ) {
                                // next row value equals current row value and current row is NOT the end of a group
                                spanData[rowIdx + i][rawColName].value = 1;
                                // if next row ends the group, still include in the row span count "i" then break
                                if (spanData[rowIdx + i][rawColName].group) {
                                    i++;
                                    break;
                                }
                                i++;
                            }
                            // only set values for rows that are in a new group i.e. do not have values yet
                            if (
                                !spanData[rowIdx][rawColName].hasOwnProperty(
                                    'value'
                                )
                            ) {
                                spanData[rowIdx][rawColName].value = i;
                                if (i > maxSpan) {
                                    maxSpan = i;
                                }
                            }
                        } else {
                            // for first column do not need to check previous columns
                            // identify groups first
                            if (rowIdx + 1 !== currentCol.length) {
                                if (
                                    currentCol[rowIdx] ===
                                    currentCol[rowIdx + 1]
                                ) {
                                    spanData[rowIdx][rawColName].group = false;
                                } else {
                                    // end group at the last row with value = current row value
                                    spanData[rowIdx][rawColName].group = true;
                                }
                            } else {
                                //last row is always span 1 and end of groups
                                spanData[rowIdx][rawColName].value = 1;
                                spanData[rowIdx][rawColName].group = true;
                            }

                            //get span for first row in each group
                            i = 1;
                            while (
                                currentCol[rowIdx] === currentCol[rowIdx + i]
                            ) {
                                spanData[rowIdx + i][rawColName].value = 1;
                                i++;
                            }
                            // only set values for rows that are in a new group i.e. do not have values yet
                            if (
                                !spanData[rowIdx][rawColName].hasOwnProperty(
                                    'value'
                                )
                            ) {
                                spanData[rowIdx][rawColName].value = i;
                                if (i > maxSpan) {
                                    maxSpan = i;
                                }
                            }
                        }
                    }
                }
            }
        }

        /**
         * @name getSortInfo
         * @desc called after sorting to get the updated sort information for the panel
         */
        function getSortInfo(): void {
            const callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') !== -1) {
                    return;
                }
                const sortInfo: any = [];
                try {
                    for (let i = 0; i < output.length; i++) {
                        if (output[i]['type'] !== 'CUSTOM') {
                            sortInfo.push({
                                alias: output[i].content.alias,
                                dir: output[i].content.direction.toLowerCase(),
                            });
                        } else {
                            sortInfo.push({
                                alias: output[i].content.columnToSort.content.alias,
                                dir: 'desc',
                            });
                        }
                    }
                } catch (error) {
                    console.error(
                        'Error occurred while processing sort details:',
                        error,
                    );
                } finally {
                    console.log('Sort details processed.');
                }
                scope.sortOptions = sortInfo;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'panel',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'getPanelSort',
                        components: [],
                        terminal: true,
                    },
                ],
                callback,
            );
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         */
        function setData(): void {
            let active: string,
                individualTools,
                sharedTools,
                keys,
                data,
                tasks,
                frame,
                uiOptions,
                pinnedPixelComponent = {},
                colorBy = [],
                selectedLayout: string,
                styleColumns = false,
                selectedTab: string,
                filterColumns: any[],
                layerIndex = 0;

            if (!scope.data) {
                getSortInfo();
                active = scope.widgetCtrl.getWidget('active');
                selectedLayout = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                );
                individualTools =
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tools.individual.' + selectedLayout
                    ) || {};
                sharedTools = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tools.shared'
                );
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.Grid'
                );
                tasks = scope.widgetCtrl.getWidget('view.' + active + '.tasks');
                frame = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.frame'
                );
                data = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.data'
                );
                colorBy = scope.widgetCtrl.getWidget(
                    'view.visualization.colorByValue'
                );
                uiOptions = angular.extend(sharedTools, individualTools);
                uiOptions.colorByValue = colorBy;
                filterColumns = scope.widgetCtrl.getWidget(
                    'view.visualization.tasks.' + layerIndex + '.filterInfo'
                );

                dataTypes = semossCoreService.visualization.getFormat(
                    keys,
                    uiOptions
                );

                // Create an object to track the filters based on the widget's filterInfo
                if (filterColumns) {
                    if (filterColumns.length === 0) {
                        scope.columnFilters = {};
                    }
                    for (let i = 0; i < filterColumns.length; i++) {
                        const col = filterColumns[i].filterObj;
                        if (col.filterType === 'SIMPLE') {
                            scope.columnFilters[col.left.value] = [
                                col.right.value,
                                col.comparator,
                            ];
                        }
                    }
                }

                if (uiOptions.pinnedCols) {
                    pinnedPixelComponent['pinnedCols'] = uiOptions.pinnedCols; // add pinned cols to panel ornament data to be sent
                }

                if (uiOptions.pinnedRows) {
                    pinnedPixelComponent['pinnedRows'] = uiOptions.pinnedRows; // add pinned rows to panel ornament data to be sent
                }

                selectedTab = scope.widgetCtrl.getWidgetTab('selected');
                if (uiOptions.gridColStyle) {
                    styleColumns = true;
                }
                // Grid styling
                if (styleColumns) {
                    if (uiOptions.gridColStyle === 'Rows as links') {
                        scope.linkColumnsToStyle = uiOptions.gridStylingCols;
                    } else if (uiOptions.gridColStyle === 'Highlight header') {
                        scope.headerColumnsToStyle = uiOptions.gridStylingCols;
                    }
                    // Only go through this logic if we have styles existing
                    // and we get a pixel saying we shouldn't be styling
                } else if (
                    (scope.linkColumnsToStyle.length > 0 ||
                        scope.headerColumnsToStyle.length > 0) &&
                    !styleColumns
                ) {
                    scope.linkColumnsToStyle = [];
                    scope.headerColumnsToStyle = [];

                    // Reset default handle if it is open
                    scope.widgetCtrl.emit('reset-grid');
                }

                const tableData = semossCoreService.visualization.getTableData(
                        data.headers,
                        data.values,
                        data.rawHeaders
                    ),
                    // Create the column definition for the row header column that displays the row number
                    columnDef: ColDef[] = [
                        {
                            headerName: '',
                            field: '',
                            lockPosition: true,
                            valueGetter: getRowIndex,
                            cellClass: 'locked-col',
                            pinned: 'left',
                            width: 50,
                            minWidth: 32,
                            suppressSizeToFit: true,
                            filter: false,
                            colId: '',
                        },
                    ];

                //get row spans only if widget is active
                if (uiOptions.gridSpanRows) {
                    getRowSpanCounts(tableData);
                }
                // set row buffer only after grid has been set
                if (scope.hasOwnProperty('grid')) {
                    if (uiOptions.gridSpanRows) {
                        scope.grid.gridOptions.rowBuffer = maxSpan;
                    } else {
                        // default when toggled off
                        scope.grid.gridOptions.rowBuffer = 32;
                    }
                }

                // Create the column definitions for all the columns in the data
                for (let i = 0; i < data.headers.length; i++) {
                    const field: string = data.headers[i],
                        // Only set autoHeight to true if the column is wrapped because of performance
                        autoHeight: boolean =
                            uiOptions.gridWrapCols &&
                            uiOptions.gridWrapCols.length > 0 &&
                            uiOptions.gridWrapCols.indexOf(field) > -1,
                        def: ColDef = {
                            headerName:
                                selectedTab !== 'clean'
                                    ? String(field).replace(/_/g, ' ')
                                    : String(field),
                            field: field,
                            cellStyle: getCellStyle,
                            headerClass: getHeaderClass,
                            cellClassRules: {
                                'grid-standard__link': applyLinkClass,
                                'grid-standard__wrap': applyWrapClass,
                                'grid-standard__cell-span--group':
                                    applySpanClass,
                                'grid-standard__cell-span':
                                    applySpanBorderClass,
                            },
                            rowSpan: function (params) {
                                let field,
                                    returnSpan,
                                    paramsRowIdx = 0;

                                // return 1 if widget not active or table span data is empty
                                if (
                                    uiOptions.gridSpanRows &&
                                    Object.keys(spanData).length
                                ) {
                                    field = params.colDef.field;
                                    // get the row index
                                    paramsRowIdx = parseInt(params.node.id);
                                    // ignore filtered out cells
                                    if (!spanData[paramsRowIdx]) {
                                        return 1;
                                    }
                                    if (
                                        params.data.hasOwnProperty(field) &&
                                        !isNaN(
                                            spanData[paramsRowIdx][field].value
                                        )
                                    ) {
                                        returnSpan =
                                            spanData[paramsRowIdx][field].value;
                                        return returnSpan;
                                    }
                                    return 1;
                                }
                                return 1;
                            },
                            autoHeight: autoHeight,
                            lockPinned: false,
                            pinned:
                                uiOptions.pinnedCols &&
                                uiOptions.pinnedCols.length > 0 &&
                                uiOptions.pinnedCols.indexOf(field) > -1
                                    ? 'left'
                                    : undefined,
                            colId: field,
                            valueFormatter: formatCellValue,
                            cellRenderer: function (params) {
                                let html =
                                    '<span>' +
                                    params.valueFormatted +
                                    '</span>';
                                if (
                                    scope.linkColumnsToStyle.indexOf(
                                        params.colDef.field
                                    ) > -1
                                ) {
                                    html =
                                        '<a class="grid-standard__link" title="Click to Follow Link" href="' +
                                        params.value +
                                        '">' +
                                        params.valueFormatted +
                                        '</a>';
                                }

                                return html;
                            },
                        };
                    // Set column width
                    if (
                        uiOptions.columnProperties &&
                        uiOptions.columnProperties[field]
                    ) {
                        def.width = uiOptions.columnProperties[field];
                    } else {
                        def.width = 200;
                    }
                    // Set the filter based on data type, by default will use the Text Filter
                    const colId = data.headers.indexOf(field);
                    if (keys[colId] && keys[colId].type === 'NUMBER') {
                        def.filter = 'agNumberColumnFilter';
                    } else {
                        def.filter = 'agTextColumnFilter';
                    }
                    // Add column definition
                    columnDef.push(def);
                }

                if (!uiOptions.hasOwnProperty('showNewColumn')) {
                    columnDef.push({
                        headerName: 'New Column',
                        field: 'New_Column',
                        filter: false,
                        colId: 'New_Column',
                        lockPinned: true,
                        suppressMovable: true,
                    });
                }

                localChartData = {
                    headers: data.headers,
                    values: data.values,
                    keys: keys,
                    data: tableData.rawData,
                    columnDef: columnDef,
                    callbacks: scope.widgetCtrl.getEventCallbacks(),
                    uiOptions: uiOptions,
                };
            } else {
                localChartData = scope.data;
            }

            if (!scope.grid) {
                // Grid options
                const options: GridOptions = {
                    rowClassRules: {
                        'grid-standard__cell-span--group': applyBackgroundClass,
                    },
                    suppressRowTransform: true,
                    rowData: localChartData.data,
                    defaultColDef: {
                        resizable: true,
                        sortable: true,
                        headerComponentParams: {
                            scope: scope,
                            compile: $compile,
                            sort: sort,
                        },
                        filterParams: {
                            scope: scope,
                            compile: $compile,
                        },
                        filter: true,
                    },
                    columnDefs: localChartData.columnDef,
                    components: {
                        agColumnHeader: CustomHeaderComp,
                        agTextColumnFilter: CustomTextFilterComp,
                        agNumberColumnFilter: CustomNumberFilterComp,
                    },
                    enableCellTextSelection: true,
                    preventDefaultOnContextMenu: true,
                    suppressDragLeaveHidesColumns: true,
                    suppressScrollOnNewData: true,
                    icons: {
                        columnMovePin: '<i class="fa fa-arrows"></i>',
                        columnMoveHide: '<i class="fa fa-arrows"></i>',
                        columnMoveMove: '<i class="fa fa-arrows"></i>',
                        columnMoveLeft: '<i class="fa fa-arrow-left"></i>',
                        columnMoveRight: '<i class="fa fa-arrow-right"></i>',
                    },
                };
                scope.chartDiv.className +=
                    ' ag-theme-balham grid-standard__chart';
                scope.grid = new Grid(scope.chartDiv, options);

                if (scope.grid.gridOptions.api) {
                    scope.grid.gridOptions.api.addEventListener(
                        'bodyScroll',
                        scrollEvent
                    );
                    scope.grid.gridOptions.api.addEventListener(
                        'cellClicked',
                        clickEvent
                    );
                    scope.grid.gridOptions.api.addEventListener(
                        'cellDoubleClicked',
                        dblClickEvent
                    );
                    scope.grid.gridOptions.api.addEventListener(
                        'columnResized',
                        columnResizeEvent
                    );
                    scope.grid.gridOptions.api.addEventListener(
                        'cellContextMenu',
                        openContextMenu
                    );
                    scope.grid.gridOptions.api.addEventListener(
                        'dragStopped',
                        onColumnMoved
                    );
                    scope.grid.gridOptions.api.setPinnedTopRowData(
                        uiOptions.pinnedRows
                    );
                }
            } else {
                const tableData = semossCoreService.visualization.getTableData(
                    data.headers,
                    data.values,
                    data.rawHeaders
                );
                scope.grid.gridOptions.api.setColumnDefs(
                    localChartData.columnDef
                );
                scope.grid.gridOptions.api.setRowData(tableData.rawData);
                // Move "New_Column" to the end
                scope.grid.gridOptions.columnApi.moveColumn(
                    'New_Column',
                    localChartData.columnDef.length - 1
                );
                // Reorder columns
                scope.grid.gridOptions.columnApi.moveColumns(
                    localChartData.headers,
                    1
                );
                // Refresh headers if any changes to existing columns were made (styling, renaming, etc)
                scope.grid.gridOptions.api.refreshHeader();
                // Pin columns and/or rows
                scope.grid.gridOptions.columnApi.setColumnsPinned(
                    uiOptions.pinnedCols,
                    'left'
                );
                scope.grid.gridOptions.api.setPinnedTopRowData(
                    uiOptions.pinnedRows
                );
            }

            if (localChartData.uiOptions.gridFullWidth) {
                scope.grid.gridOptions.api.sizeColumnsToFit();
            }
            if (
                localChartData.uiOptions.gridWrapCols &&
                localChartData.uiOptions.gridWrapCols.length > 0
            ) {
                scope.grid.gridOptions.api.resetRowHeights();
            }

            // Sets the column order state
            if (scope.grid.gridOptions) {
                const columnState =
                        scope.grid.gridOptions.columnApi.getColumnState(),
                    order = columnState.map((col) => col.colId);
                scope.previousColumnState = order;
            }

            applyHeaderColor();
        }
        /**
         * @name onDocumentClick
         * @desc Called when the body is clicked. If the context menu is not clicked, then close the context menu.
         * @param event - onclick event object
         */
        function onDocumentClick(event: any): void {
            if (
                event &&
                event.target &&
                contextMenuEle &&
                contextMenuEle.contains(event.target)
            ) {
                return;
            }
            closeContextMenu();
        }
        /**
         * @name closeContextMenu
         * @desc - closes the context menu by removing it from the DOM
         */
        function closeContextMenu(): void {
            // remove the old scope
            if (contextMenuScope) {
                contextMenuScope.$destroy();
                contextMenuScope = undefined;
            }

            // remove the oldEle
            if (contextMenuEle) {
                if (contextMenuEle.parentNode !== null) {
                    contextMenuEle.parentNode.removeChild(contextMenuEle);
                }
                contextMenuEle = undefined;
            }

            applyHeaderColor();
        }
        /**
         * @name openContextMenu
         * @desc Called when a cell is right-clicked. Will create and add the context menu.
         * @param event - contextmenu event
         */
        function openContextMenu(event: any): void {
            let x: number = event.event.pageX,
                y: number = event.event.pageY,
                height: number = window.innerHeight / 2,
                width = 225,
                header: string = event.colDef.field,
                value: any = event.value,
                contextMenuHTML: string,
                contextMenu: JQLite,
                linkFn,
                top: number,
                left: number;
            // Set selected column
            const cellIndex = localChartData.headers.indexOf(
                event.colDef.field
            );
            scope.widgetCtrl.emit('change-selected', {
                selected: [
                    {
                        alias: localChartData.keys[cellIndex].alias,
                        instances: [event.value],
                    },
                ],
                row: getRowData(event.data),
            });
            // Remove old context-menu element from DOM
            closeContextMenu();
            // Create new scope
            contextMenuScope = $rootScope.$new(true);
            if (contextMenuScope) {
                contextMenuScope.gridContextMenu = [
                    // filter
                    {
                        title: 'Filter - Keep Only ' + '"' + value + '"',
                        click: filterOnCell.bind(null, event),
                    },
                    {
                        title: 'Filter - Exclude ' + '"' + value + '"',
                        click: filterAwayCell.bind(null, event),
                    },
                    // unfilter
                    {
                        title: 'Unfilter',
                        click: unfilter.bind(null, event),
                    },
                    // convert case
                    {
                        title: 'Convert to Uppercase',
                        click: toUpperCase.bind(null, event),
                    },
                    {
                        title: 'Convert to Lowercase',
                        click: toLowerCase.bind(null, event),
                    },
                    // extract letters or numbers
                    {
                        title: 'Extract Letters',
                        click: extractLettersNumbers.bind(
                            null,
                            event,
                            'ExtractLetters'
                        ),
                    },
                    {
                        title: 'Extract Numbers',
                        click: extractLettersNumbers.bind(
                            null,
                            event,
                            'ExtractNumbers'
                        ),
                    },
                    {
                        title: 'Duplicate Column ' + '"' + header + '"',
                        click: duplicateCol.bind(null, event),
                    },
                    {
                        title: 'Hide Column ' + '"' + header + '"',
                        click: hideColumnEvent.bind(null, event),
                    },
                    {
                        title: 'Add Column',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-add-col'
                        ),
                    },
                    {
                        title: 'Rename Column',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-rename-col'
                        ),
                    },
                    {
                        title: 'Change Column Type',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-change-col-type'
                        ),
                    },
                    {
                        title: 'Pin Column ' + '"' + header + '"',
                        click: pinCol.bind(null, event),
                    },
                    {
                        title: 'Unpin Column ' + '"' + header + '"',
                        click: unpinCol.bind(null, event),
                    },
                    {
                        title: 'Pin Row',
                        click: pinRow.bind(null, event),
                    },
                    {
                        title: 'Unpin Row',
                        click: unpinRow.bind(null, event),
                    },
                    {
                        title: 'Update Row',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-update-row'
                        ),
                    },
                    {
                        title: 'Drop Rows',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-drop-rows'
                        ),
                    },
                    {
                        title: 'Split',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-split'
                        ),
                    },
                    {
                        title: 'Join',
                        click: openCleanRoutine.bind(null, event, 'clean-join'),
                    },
                    {
                        title: 'Pivot',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-pivot'
                        ),
                    },
                    {
                        title: 'Unpivot',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-unpivot'
                        ),
                    },
                    {
                        title: 'Split Unpivot',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-split-unpivot'
                        ),
                    },
                    {
                        title: 'Count If',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-count-if'
                        ),
                    },
                    {
                        title: 'Transpose',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-transpose'
                        ),
                    },
                    {
                        title: 'Remove Duplicate Rows',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-remove-duplicate-rows'
                        ),
                    },
                    {
                        title: 'Replace',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-replace'
                        ),
                    },
                    {
                        title: 'Filter Empty Values',
                        click: openCleanRoutine.bind(
                            null,
                            event,
                            'clean-filter-empty'
                        ),
                    },
                    {
                        title: 'Trim',
                        click: trim.bind(null, event),
                    },
                    {
                        title: 'Purge',
                        click: openPanel.bind(null, 'purge'),
                    },
                ];
            }

            if (x + width > window.innerWidth) {
                left = x - width;
            } else {
                left = x;
            }

            if (y + height > window.innerHeight) {
                top = y - height;
            } else {
                top = y;
            }
            contextMenuHTML = `
                <div style="height: ${height}px; width: ${width}px; top: ${top}px; left: ${left}px;"
                    id="grid-context-menu"
                    class="grid-standard__context-menu">
                    <div class="grid-standard__context-menu__header">
                        ${header} : ${value}
                    </div>
                    <ul class="grid-standard__context-menu__list">
                        <li ng-repeat="opt in gridContextMenu"
                            ng-click="opt.click()"
                            class="grid-standard__context-menu__list__option">
                            {{opt.title}}
                        </li>
                    </ul>
                </div>
            `;
            contextMenuEle = $compile(contextMenuHTML)(contextMenuScope)[0];
            document.body.appendChild(contextMenuEle);
            // Trigger digest because ag-grid doesn't fire events within angular digest cycle
            if (contextMenuScope) {
                contextMenuScope.$apply();
            }
        }

        /**
         * @name openCleanRoutine
         * @desc open a clean routine
         * @param e - canvas data event
         * @param widgetName - name of the widget to be displayed within the panel
         */

        function openCleanRoutine(e: any, widgetName: string): void {
            const frameType: string = scope.widgetCtrl.getFrame('type');

            if (frameType !== 'R' && frameType !== 'PY') {
                const frameName = scope.widgetCtrl.getFrame('name'),
                    callback = openPanel.bind(null, widgetName);

                const commandList: PixelCommand[] = [
                    {
                        type: 'variable',
                        components: [frameName],
                    },
                    {
                        type: 'convert',
                        components: ['R', frameName],
                        terminal: true,
                    },
                ];

                scope.widgetCtrl.execute(commandList, callback);
            } else {
                openPanel(widgetName);
            }
        }

        /**
         * @name openPanel
         * @desc Called for routines which cannot be executed from the grid alone -- pulls open the panel and displays the widget option
         * @param widgetName - name of the widget to be displayed within the panel
         */

        function openPanel(widgetName: string): void {
            closeContextMenu();
            // force a digetst
            $timeout(
                function (name) {
                    scope.widgetCtrl.open('handle', name);
                }.bind(null, widgetName)
            );
        }

        /**
         * @name extractLettersNumbers
         * @desc creates copy of specified column with only alphabetic characters
         * @param e - canvas data event
         * @param LorN - Letters or Numbers, sets the pixel for either letter or number extraction
         */

        function extractLettersNumbers(e: any, LorN: string): void {
            const frameName: string = scope.widgetCtrl.getFrame('name'),
                frameType: string = scope.widgetCtrl.getFrame('type'),
                commandList: PixelCommand[] = [],
                limit: number = scope.widgetCtrl.getOptions('limit');

            if (frameType !== 'R' && frameType !== 'PY') {
                commandList.push(
                    {
                        type: 'variable',
                        components: [frameName],
                    },
                    {
                        type: 'convert',
                        components: ['R', frameName],
                        terminal: true,
                    }
                );
            }

            commandList.push(
                {
                    type: 'Pixel',
                    components: [
                        LorN +
                            '(columns=["' +
                            e.colDef.field.replace(/ /g, '_') +
                            '"],override=[false])',
                    ],
                    terminal: true,
                },
                {
                    type: 'frame',
                    components: [frameName],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'autoTaskOptions',
                    components: [scope.widgetCtrl.panelId, 'Grid'],
                },
                {
                    type: 'collect',
                    components: [limit],
                    terminal: true,
                }
            );

            scope.widgetCtrl.execute(commandList);

            closeContextMenu();
        }

        /**
         * @name trim
         * @desc removes excess spaces around values within the specified column
         * @param e - canvas data event
         */

        function trim(e: any): void {
            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        'TrimColumns("' +
                            e.colDef.field.replace(/ /g, '_') +
                            '")',
                    ],
                    terminal: true,
                },
                {
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
            ]);

            closeContextMenu();
        }

        /**
         * @name pinCol
         * @desc pins the column to the left
         * @param e - canvas data event
         */

        function pinCol(e: any): void {
            if (e.colDef.pinned) {
                //column has already been pinned -- no need to repin
                closeContextMenu();
                return;
            }
            const pinnedComponent = localChartData.uiOptions.pinnedCols
                ? localChartData.uiOptions.pinnedCols
                : [];
            pinnedComponent.push(e.colDef.field);

            const sharedComponent = {
                pinnedCols: pinnedComponent,
            };
            scope.widgetCtrl.execute(
                getPanelOrnamentComponent(sharedComponent)
            );
            closeContextMenu();
        }

        /**
         * @name pinRow
         * @desc pins the row to the top
         * @param e - canvas data event
         */
        function pinRow(e: any): void {
            if (e.rowPinned) {
                //row has already been pinned
                closeContextMenu();
                return;
            }

            const pinnedComponent = localChartData.uiOptions.pinnedRows
                ? localChartData.uiOptions.pinnedRows
                : [];
            pinnedComponent.push(e.data);

            const sharedComponent = {
                pinnedRows: pinnedComponent,
            };
            scope.widgetCtrl.execute(
                getPanelOrnamentComponent(sharedComponent)
            );
            closeContextMenu();
        }

        /**
         * @name unpinCol
         * @desc unpins the column from the left to its original position
         * @param e - canvas data event
         */

        function unpinCol(e: any): void {
            if (!localChartData.uiOptions.pinnedCols || !e.colDef.pinned) {
                closeContextMenu();
                return;
            }

            e.colDef.pinned = undefined;
            const pinnedComponent = localChartData.uiOptions.pinnedCols;

            for (let i = 0; i < pinnedComponent.length; i++) {
                if (pinnedComponent[i] === e.colDef.field) {
                    pinnedComponent.splice(i, 1);
                    scope.grid.gridOptions.columnApi.setColumnPinned(
                        e.colDef.field,
                        undefined
                    );
                }
            }

            const sharedComponent = {
                pinnedCols: pinnedComponent,
            };
            scope.widgetCtrl.execute(
                getPanelOrnamentComponent(sharedComponent)
            );
            closeContextMenu();
        }

        /**
         * @name unpinRow
         * @desc unpins the row from the top
         * @param e - canvas data event
         */

        function unpinRow(e: any): void {
            if (!localChartData.uiOptions.pinnedRows || !e.rowPinned) {
                closeContextMenu();
                return;
            }

            e.rowPinned = undefined;
            const pinnedComponent = localChartData.uiOptions.pinnedRows;

            for (let i = 0; i < pinnedComponent.length; i++) {
                if (pinnedComponent[i] === e.data) {
                    pinnedComponent.splice(i, 1);
                }
            }

            const sharedComponent = {
                pinnedRows: pinnedComponent,
            };
            scope.widgetCtrl.execute(
                getPanelOrnamentComponent(sharedComponent)
            );
            closeContextMenu();
        }

        /**
         * @name addPanelOrnament
         * @param {*} sharedComponent the panel ornament to run
         * @desc add a panel ornament and reload the data
         * @returns {array} the list of components to run
         */
        function getPanelOrnamentComponent(sharedComponent: any): any {
            return [
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'addPanelOrnaments',
                    components: [
                        {
                            tools: {
                                shared: sharedComponent,
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
            ];
        }

        // TODO: duplicated column only appears when data clean panel is opened -- presumably a pixel query needs to be fired to bring new column to view

        /**
         * @name duplicateCol
         * @desc creates copy of indicated column
         * @param e - canvas data event
         */
        function duplicateCol(e: any): void {
            const frameName: string = scope.widgetCtrl.getFrame('name'),
                frameType: string = scope.widgetCtrl.getFrame('type'),
                commandList: PixelCommand[] = [],
                limit: number = scope.widgetCtrl.getOptions('limit');

            if (frameType !== 'R' && frameType !== 'PY') {
                commandList.push(
                    {
                        type: 'variable',
                        components: [frameName],
                    },
                    {
                        type: 'convert',
                        components: ['R', frameName],
                        terminal: true,
                    }
                );
            }

            commandList.push(
                {
                    type: 'Pixel',
                    components: [
                        'DuplicateColumn("' +
                            e.colDef.field.replace(/ /g, '_') +
                            '","' +
                            e.colDef.field.replace(/ /g, '_') +
                            '_COPY")',
                    ],
                    terminal: true,
                },
                {
                    type: 'frame',
                    components: [frameName],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'autoTaskOptions',
                    components: [scope.widgetCtrl.panelId, 'Grid'],
                },
                {
                    type: 'collect',
                    components: [limit],
                    terminal: true,
                }
            );

            scope.widgetCtrl.execute(commandList);

            closeContextMenu();
        }

        /**
         * @name toUpperCase
         * @desc converts the contents of the cells within the specified column to uppercase
         * @param e - canvas data event
         */
        function toUpperCase(e: any): void {
            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        'ToUpperCase(' +
                            '["' +
                            e.colDef.field.replace(/ /g, '_') +
                            '"]' +
                            ')',
                    ],
                    terminal: true,
                },
                {
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
            ]);

            closeContextMenu();
        }

        /**
         * @name toLowerCase
         * @desc converts the contents of the cells within the specified column to lowercase
         * @param e - canvas data event
         */

        function toLowerCase(e: any): void {
            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        'ToLowerCase(' +
                            '["' +
                            e.colDef.field.replace(/ /g, '_') +
                            '"]' +
                            ')',
                    ],
                    terminal: true,
                },
                {
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
            ]);
            closeContextMenu();
        }

        /**
         * @name filterOnCell
         * @desc filters on value of clicked cell by calling filterValue function
         * @param e - canvas data event
         */

        function filterOnCell(e: any): void {
            filterValue(e, '==');
        }

        /**
         * @name filterAwayCell
         * @desc filters away value of clicked cell by calling filterValue function
         * @param e - canvas data event
         */

        function filterAwayCell(e: any): void {
            filterValue(e, '!=');
        }

        /**
         * @name filterValue
         * @desc applies filter to grid based on arguments passed in
         * @param e - canvas data event
         * @param comparator - equal to either '==' or '!=' - determines whether it will filter on or away selected value
         */

        function filterValue(e: any, comparator: string): void {
            const components: PixelCommand[] = [],
                panels = scope.widgetCtrl.getShared('panels');

            scope.isFiltered = true;

            components.push(
                {
                    type: 'variable',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'setFrameFilter',
                    components: [
                        [
                            {
                                type: 'value',
                                alias: e.colDef.field.replace(/ /g, '_'),
                                comparator: comparator,
                                values: e.value,
                            },
                        ],
                    ],
                    terminal: true,
                }
            );

            if (components.length > 0) {
                // refresh
                for (let i = 0, len = panels.length; i < len; i++) {
                    components.push({
                        type: 'refresh',
                        components: [panels[i].widgetId],
                        terminal: true,
                    });
                }

                scope.widgetCtrl.execute(components);
            }

            closeContextMenu();
        }
        /**
         * @name createFilterObject
         * @desc creates the filter object for the filter reactor
         * @param newFilter - the new filter to add
         * @param clearColumn - the column name if the filter is removed
         */
        function createFilterObject(): any;
        function createFilterObject(newFilter: any, clearColumn: string): any;
        function createFilterObject(
            newFilter?: any,
            clearColumn?: string
        ): any {
            let active: string = scope.widgetCtrl.getWidget('active'),
                layerIndex = 0,
                filterInfo = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.filterInfo'
                ),
                filterObj = {},
                i;
            // If filters already exist, add to the filter object
            if (filterInfo && filterInfo.length > 0) {
                for (i = 0; i < filterInfo.length; i++) {
                    // only handling simple filters for now
                    if (filterInfo[i].filterObj.filterType === 'SIMPLE') {
                        // If the column filter is cleared, then do not add to the filter object
                        if (
                            !clearColumn ||
                            (clearColumn &&
                                filterInfo[i].filterObj.left.value !==
                                    clearColumn)
                        ) {
                            filterObj[filterInfo[i].filterObj.left.value] = {
                                comparator: filterInfo[i].filterObj.comparator,
                                value: filterInfo[i].filterObj.right.value,
                            };
                        }
                    } else {
                        filterObj[filterInfo[i].filterStr] = {
                            isFilterString: true,
                            value: filterInfo[i].filterStr,
                        };
                    }
                }
            }
            // If there is a new filter, add it to the filter object
            if (newFilter) {
                filterObj[newFilter.left] = {
                    comparator: newFilter.comparator,
                    value: [newFilter.right[0]],
                };
            }
            return filterObj;
        }

        function onFilterColumn(newFilter: any, clearColumn: string) {
            let active: string = scope.widgetCtrl.getWidget('active'),
                layout: string = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                layerIndex = 0,
                filterObj = createFilterObject(newFilter, clearColumn),
                alreadySelected: any[] = [],
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.groupByInfo'
                ),
                taskOptionsComponent,
                selectComponent,
                groupComponent,
                options,
                i: number,
                len: number,
                format: string = scope.widgetCtrl.getWidget(
                    'view.' +
                        active +
                        '.tasks.' +
                        layerIndex +
                        '.meta.dataFormat'
                ),
                limit: number = scope.widgetCtrl.getOptions('limit');
            taskOptionsComponent = {};
            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: layout,
                alignment: {},
            };
            if (format === 'graph') {
                options = [
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tasks.' +
                            layerIndex +
                            '.meta.options'
                    ),
                ];
            } else {
                options = false;
            }

            selectComponent = [];
            groupComponent = [];

            for (i = 0, len = keys.length; i < len; i++) {
                if (
                    !taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        keys[i].model
                    ]
                ) {
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        keys[i].model
                    ] = [];
                }

                if (keys[i].math) {
                    // add in the group component
                    if (groupComponent.length === 0) {
                        groupComponent = keys[i].groupBy;
                    }
                }

                // add in the select component if not already added
                if (alreadySelected.indexOf(keys[i].alias) === -1) {
                    if (keys[i].calculatedBy) {
                        selectComponent.push({
                            calculatedBy: keys[i].calculatedBy,
                            math: keys[i].math,
                            alias: keys[i].alias,
                        });
                    } else {
                        selectComponent.push({
                            alias: keys[i].alias,
                        });
                    }

                    alreadySelected.push(keys[i].alias);
                }

                // add to the view component
                taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                    keys[i].model
                ].push(keys[i].alias);
            }

            // if group by exists, add to task
            if (groupByInfo && groupByInfo.viewType) {
                taskOptionsComponent[scope.widgetCtrl.panelId].groupByInfo = {};
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.selectedDim = groupByInfo.selectedDim;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.viewType = groupByInfo.viewType;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.instanceIndex = groupByInfo.instanceIndex;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.selectComponent = groupByInfo.selectComponent;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.groupComponent = groupByInfo.groupComponent;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.uniqueInstances = groupByInfo.uniqueInstances;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'frame',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'select2',
                    components: [selectComponent],
                },
                {
                    type: 'sortOptions',
                    components: [scope.sortOptions],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'group',
                    components: [groupComponent],
                },
                {
                    type: 'with',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'format',
                    components: [format, options],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                {
                    type: 'collect',
                    components: [limit],
                    terminal: true,
                },
            ]);
        }
        /**
         * @name unfilter
         * @desc removes any applied filters
         */
        function unfilter(): void {
            scope.widgetCtrl.execute([
                {
                    type: 'variable',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'unfilterFrame',
                    components: [],
                    terminal: true,
                },
                {
                    type: 'refresh',
                    components: [scope.widgetCtrl.widgetId],
                    terminal: true,
                },
            ]);

            closeContextMenu();
        }

        /**
         * @name hideColumnEvent
         * @desc hide the selected column
         * @param e - canvas data event
         */
        function hideColumnEvent(e: any): void {
            let active: string = scope.widgetCtrl.getWidget('active'),
                layout: string = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                ),
                layerIndex = 0,
                filterObj = createFilterObject(),
                alreadySelected: any[] = [],
                groupByInfo = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.groupByInfo'
                ),
                taskOptionsComponent,
                selectComponent,
                groupComponent,
                options,
                i: number,
                len: number,
                format: string = scope.widgetCtrl.getWidget(
                    'view.' +
                        active +
                        '.tasks.' +
                        layerIndex +
                        '.meta.dataFormat'
                ),
                taskId: string = scope.widgetCtrl.getWidget(
                    'view.' + active + '.tasks.' + layerIndex + '.taskId'
                ),
                limit: number = scope.widgetCtrl.getOptions('limit');

            if (format) {
                format = format.toLowerCase();
            }

            // if no keys...then no selectors which then means the query will become invalid. in which case we will just not run it.
            if (keys.length === 0) {
                return;
            }

            // create components
            taskOptionsComponent = {};
            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: layout,
                alignment: {},
            };
            if (format === 'graph') {
                options = [
                    scope.widgetCtrl.getWidget(
                        'view.visualization.tasks.' +
                            layerIndex +
                            '.meta.options'
                    ),
                ];
            } else {
                options = false;
            }

            selectComponent = [];
            groupComponent = [];

            for (i = 0, len = keys.length; i < len; i++) {
                // skip over hidden column
                if (keys[i].alias === e.colDef.field) {
                    continue;
                }

                if (
                    !taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        keys[i].model
                    ]
                ) {
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        keys[i].model
                    ] = [];
                }

                if (keys[i].math) {
                    // add in the group component
                    if (groupComponent.length === 0) {
                        groupComponent = keys[i].groupBy;
                    }
                }

                // add in the select component if not already added
                if (alreadySelected.indexOf(keys[i].alias) === -1) {
                    if (keys[i].calculatedBy) {
                        selectComponent.push({
                            calculatedBy: keys[i].calculatedBy,
                            math: keys[i].math,
                            alias: keys[i].alias,
                        });
                    } else {
                        selectComponent.push({
                            alias: keys[i].alias,
                        });
                    }

                    alreadySelected.push(keys[i].alias);
                }

                // add to the view component
                taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                    keys[i].model
                ].push(keys[i].alias);
            }

            // if group by exists, add to task
            if (groupByInfo && groupByInfo.viewType) {
                taskOptionsComponent[scope.widgetCtrl.panelId].groupByInfo = {};
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.selectedDim = groupByInfo.selectedDim;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.viewType = groupByInfo.viewType;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.instanceIndex = groupByInfo.instanceIndex;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.selectComponent = groupByInfo.selectComponent;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.groupComponent = groupByInfo.groupComponent;
                taskOptionsComponent[
                    scope.widgetCtrl.panelId
                ].groupByInfo.uniqueInstances = groupByInfo.uniqueInstances;
            }

            scope.widgetCtrl.execute([
                {
                    type: 'frame',
                    components: [scope.widgetCtrl.getFrame('name')],
                },
                {
                    type: 'select2',
                    components: [selectComponent],
                },
                {
                    type: 'sortOptions',
                    components: [scope.sortOptions],
                },
                {
                    type: 'filter',
                    components: [filterObj],
                },
                {
                    type: 'group',
                    components: [groupComponent],
                },
                {
                    // add in with to grab sorts and filters applied to the panel
                    type: 'with',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'format',
                    components: [format, options],
                },
                {
                    type: 'taskOptions',
                    components: [taskOptionsComponent],
                },
                {
                    type: 'collect',
                    components: [limit],
                    terminal: true,
                },
                {
                    type: 'removeTask',
                    components: [taskId],
                    terminal: true,
                    meta: true,
                },
            ]);
            closeContextMenu();
        }

        /**
         * @name sort
         * @desc Runs approprite pixel to fire a filter statement to the backend.
         * @param e - canvas data event
         * @param dir - ascending or descending sort order
         */
        function sort(e: any, dir: string): void {
            let layout: string = scope.widgetCtrl.getWidget(
                    'view.visualization.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.visualization.keys.' + layout
                ),
                taskOptionsComponent,
                selectComponent,
                groupComponent,
                i: number,
                len: number,
                panelSortType: string,
                limit: number = scope.widgetCtrl.getOptions('limit'),
                columnsToSort: SortedColumn[] = [],
                filterObj = createFilterObject();

            // create components
            taskOptionsComponent = {};
            taskOptionsComponent[scope.widgetCtrl.panelId] = {
                layout: layout,
                alignment: {},
            };

            selectComponent = [];
            groupComponent = [];

            for (i = 0, len = keys.length; i < len; i++) {
                // add in the model
                if (
                    !taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        keys[i].model
                    ]
                ) {
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        keys[i].model
                    ] = [];
                }

                if (keys[i].math) {
                    // add in the group component
                    if (groupComponent.length === 0) {
                        groupComponent = keys[i].groupBy;
                    }
                }

                // add in the select component
                if (keys[i].calculatedBy) {
                    selectComponent.push({
                        calculatedBy: keys[i].calculatedBy,
                        math: keys[i].math,
                        alias: keys[i].alias,
                    });
                } else {
                    selectComponent.push({
                        alias: keys[i].alias,
                    });
                }

                // add to the view component
                taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                    keys[i].model
                ].push(keys[i].alias);
            }

            // Set which columns to sort, add existing sorted columns
            for (let j = 0; j < scope.sortOptions.length; j++) {
                if (scope.sortOptions[j].alias !== e) {
                    columnsToSort.push(scope.sortOptions[j]);
                }
            }
            // If the new column is not being unsorted, add to columns to sort
            if (dir.length > 0) {
                columnsToSort.push({
                    alias: e,
                    dir: dir,
                });
            }

            // Set sort type
            panelSortType = 'setPanelSort';
            // If there are no columns to sort, then unsort
            if (columnsToSort.length === 0) {
                panelSortType = 'unsortPanel';
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: panelSortType,
                    components: [columnsToSort],
                    terminal: true,
                },
                // fix to use the same object for grid sort and sort widget
                {
                    type: 'Pixel',
                    components: [
                        `Panel(${scope.widgetCtrl.panelId}) | RefreshPanelTask()`,
                    ],
                    terminal: true,
                },
            ]);
            closeContextMenu();
        }

        /**
         * @name scrollEvent
         * @desc add the scroll event
         * @param e - canvas data event
         */
        function scrollEvent(e: any): void {
            closeContextMenu();
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
                    //     scope.widgetCtrl.execute(
                    //         [
                    //             {
                    //                 type: 'task',
                    //                 components: [tasks.taskId]
                    //             },
                    //             {
                    //                 type: 'collect',
                    //                 components: [scope.widgetCtrl.getOptions('limit')],
                    //                 terminal: true
                    //             }
                    //         ]
                    //     );
                    // }
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
                                    meta: true,
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

        function getRowData(data) {
            if (!data && semossCoreService.utility.isEmpty(data)) {
                return [];
            }

            return Object.keys(data).map((key, i) => {
                return {
                    alias: localChartData.keys[i],
                    instances: [data[key]],
                };
            });
        }

        /**
         * @name clickEvent
         * @desc add a click event
         * @param e - canvas data event
         */
        function clickEvent(e: any): void {
            closeContextMenu();
            if (clickTimeout) {
                $timeout.cancel(clickTimeout);
            }

            clickTimeout = $timeout(
                function (cell) {
                    let currentEvents,
                        clickObj = {
                            data: {},
                        },
                        cellIndex: number;
                    if (cell) {
                        // check if cell is hyperlinked
                        if (
                            scope.linkColumnsToStyle.indexOf(
                                cell.colDef.field
                            ) > -1
                        ) {
                            let adrs = cell.value;
                            // check to see if the url has http[s] in the url. if not, we will prepend to make it a valid url.
                            if (!adrs.match(/^https?:\/\//i)) {
                                adrs = 'http://' + adrs;
                            }
                            window.open(adrs);
                        }
                        cellIndex = localChartData.headers.indexOf(
                            cell.colDef.field
                        );
                        if (cellIndex === -1) {
                            // Return if cell is rowHeader or New Column
                            return;
                        }
                        if (
                            cell.data &&
                            !semossCoreService.utility.isEmpty(cell.data)
                        ) {
                            scope.widgetCtrl.emit('change-selected', {
                                selected: [
                                    {
                                        alias: localChartData.keys[cellIndex]
                                            .alias,
                                        instances: [cell.value],
                                    },
                                ],
                                row: getRowData(cell.data),
                            });
                        }
                        currentEvents = getCurrentEvents();
                        if (typeof currentEvents.onClick === 'function') {
                            if (localChartData.keys[cellIndex]) {
                                clickObj.data[
                                    localChartData.keys[cellIndex].alias
                                ] = [cell.value];
                                getCurrentEvents().onClick(clickObj);
                            }
                        }
                    }
                }.bind(null, e),
                300
            );
        }

        /**
         * @name dblClickEvent
         * @desc add a dblclick event
         * @param e - canvas data event
         */
        function dblClickEvent(e: any): void {
            if (clickTimeout) {
                $timeout.cancel(clickTimeout);
            }

            clickTimeout = $timeout(
                function (cell) {
                    let currentEvents,
                        clickObj = {
                            data: {},
                        },
                        cellIndex: number;
                    if (cell) {
                        // check if cell is hyperlinked
                        if (
                            scope.linkColumnsToStyle.indexOf(
                                cell.colDef.field
                            ) > -1
                        ) {
                            let adrs = cell.value;

                            // check to see if the url has http[s] in the url. if not, we will prepend to make it a valid url.
                            if (!adrs.match(/^https?:\/\//i)) {
                                adrs = 'http://' + adrs;
                            }
                            window.open(adrs);
                        }
                        cellIndex = localChartData.headers.indexOf(
                            cell.colDef.field
                        );
                        currentEvents = getCurrentEvents();
                        if (typeof currentEvents.onDoubleClick === 'function') {
                            if (localChartData.keys[cellIndex]) {
                                clickObj.data[
                                    localChartData.keys[cellIndex].alias
                                ] = [cell.value];
                                getCurrentEvents().onDoubleClick(clickObj);
                            }
                        }

                        if (
                            localChartData.keys[cellIndex] &&
                            localChartData.keys[cellIndex].type === 'URL'
                        ) {
                            window.top.open(cell.value, '_blank');
                        }

                        if (
                            !localChartData.keys[cellIndex] &&
                            cell.colDef.field === 'New_Column'
                        ) {
                            scope.widgetCtrl.open('handle', 'add');
                        }
                    }
                }.bind(null, e),
                300
            );
        }

        /**
         * @name resizeViz
         * @desc resize the grid
         */
        function resizeViz(): void {
            if (localChartData.uiOptions.gridFullWidth) {
                scope.grid.gridOptions.api.sizeColumnsToFit();
            }
            scope.grid.gridOptions.api.resetRowHeights();
        }

        /**
         * @name onColumnMoved
         * @desc Called onDraggedEnd event. If the column order has changed, then it will call a pixel to reset the order.
         */
        function onColumnMoved(): void {
            const columnState =
                    scope.grid.gridOptions.columnApi.getColumnState(),
                order = columnState.map((col) => col.colId),
                pinned = columnState.map((col) => col.pinned);
            if (
                scope.previousColumnState.length &&
                !angular.equals(order, scope.previousColumnState)
            ) {
                scope.previousColumnState = order.slice();
                let limit: number = scope.widgetCtrl.getOptions('limit'),
                    taskOptionsComponent = {},
                    i: number,
                    len: number,
                    layout: string = scope.widgetCtrl.getWidget(
                        'view.visualization.layout'
                    ),
                    keys = scope.widgetCtrl.getWidget(
                        'view.visualization.keys.' + layout
                    ),
                    filterObj = createFilterObject(),
                    groupComponent: any[] = [],
                    selectComponent: any[] = [],
                    pinnedComponent: any[] = [];
                // Remove New_Column
                if (order[order.length - 1] === 'New_Column') {
                    order.pop();
                    pinned.pop();
                }
                // Remove Row Index Column
                order.shift();
                pinned.shift();
                taskOptionsComponent[scope.widgetCtrl.panelId] = {
                    layout: layout,
                    alignment: {},
                };
                for (i = 0, len = order.length; i < len; i++) {
                    // add in the model
                    const key = keys.find((col) => col.alias === order[i]);
                    if (
                        !taskOptionsComponent[scope.widgetCtrl.panelId]
                            .alignment[key.model]
                    ) {
                        taskOptionsComponent[
                            scope.widgetCtrl.panelId
                        ].alignment[key.model] = [];
                    }
                    // add to the view component
                    taskOptionsComponent[scope.widgetCtrl.panelId].alignment[
                        key.model
                    ].push(order[i]);

                    if (key.calculatedBy) {
                        selectComponent.push({
                            calculatedBy: key.calculatedBy,
                            math: key.math,
                            alias: key.alias,
                        });
                    } else {
                        selectComponent.push({
                            alias: key.alias,
                        });
                    }

                    if (key.groupBy && key.groupBy.length > 0) {
                        groupComponent = key.groupBy;
                    }

                    if (pinned[i] === 'left') {
                        pinnedComponent.push(key.alias);
                    }
                }

                let pixelComponents = [
                    {
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'select2',
                        components: [selectComponent],
                    },
                    {
                        type: 'group',
                        components: [groupComponent],
                    },
                    {
                        type: 'with',
                        components: [scope.widgetCtrl.panelId],
                    },
                    {
                        type: 'filter',
                        components: [filterObj],
                    },
                    {
                        type: 'format',
                        components: ['table'],
                    },
                    {
                        type: 'taskOptions',
                        components: [taskOptionsComponent],
                    },
                    {
                        type: 'collect',
                        components: [limit],
                        terminal: true,
                    },
                ];

                if (pinnedComponent.length > 0) {
                    const sharedComponent = { pinnedCols: pinnedComponent };
                    pixelComponents = pixelComponents.concat(
                        getPanelOrnamentComponent(sharedComponent)
                    );
                }

                scope.widgetCtrl.execute(pixelComponents);
            }
        }
        initialize();
    }
}
