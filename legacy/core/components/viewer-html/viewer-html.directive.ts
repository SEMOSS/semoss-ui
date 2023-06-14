import angular from 'angular';

/**
 * @name viewer
 * @desc viewer
 */
export default angular
    .module('app.viewer-html.directive', [])
    .directive('viewerHtml', viewerHtmlDirective);

import './viewer-html.scss';

viewerHtmlDirective.$inject = [
    '$q',
    '$location',
    '$timeout',
    'semossCoreService',
    'monolithService',
];

function viewerHtmlDirective(
    $q,
    $location,
    $timeout,
    semossCoreService,
    monolithService
) {
    viewerHtmlCtrl.$inject = [];
    viewerHtmlLink.$inject = ['scope'];

    return {
        restrict: 'EA',
        template: require('./viewer-html.directive.html'),
        scope: {},
        require: [],
        controller: viewerHtmlCtrl,
        controllerAs: 'viewerHtml',
        bindToController: {},
        link: viewerHtmlLink,
    };

    function viewerHtmlCtrl() {}

    function viewerHtmlLink(scope) {
        scope.viewerHtml.loading = {
            open: true,
            messages: ['Loading'],
        };

        /**
         * @name render
         * @desc function that is called on directive load
         * @param insightID - insight id
         */
        function render(insightID: string): void {
            let widgetId;

            const panels = semossCoreService.getShared(insightID, 'panels');
            for (
                let panelIdx = 0, panelLen = panels.length;
                panelIdx < panelLen;
                panelIdx++
            ) {
                const panel = panels[panelIdx];

                if (panel.panelId === scope.viewerHtml.panelId) {
                    widgetId = panel.widgetId;
                    break;
                }
            }

            if (!widgetId) {
                scope.viewerHtml.content = '';
                scope.viewerHtml.loading.open = false;
                return;
            }

            scope.viewerHtml.loading.open = false;
            scope.viewerHtml.content = constructExport(insightID, widgetId);
        }

        /** Export */

        /**
         * @name constructExport
         * @desc export the grid as a table
         */
        function constructExport(insightID: string, widgetId: string): string {
            let html = '',
                output = {
                    data: {
                        headers: semossCoreService.getWidget(
                            widgetId,
                            'view.visualization.tasks.0.data.headers'
                        ),
                        values: semossCoreService.getWidget(
                            widgetId,
                            'view.visualization.tasks.0.data.values'
                        ),
                        pivotData: semossCoreService.getWidget(
                            widgetId,
                            'view.visualization.tasks.0.data.pivotData'
                        ),
                    },
                };
            const layout = semossCoreService.getWidget(
                widgetId,
                'view.visualization.layout'
            );

            if (layout === 'Grid') {
                html = generateGridHTML(widgetId, output);
            } else if (layout === 'PivotTable') {
                html = generatePivotHTML(widgetId, output);
            }

            return html;
        }

        /**
         * @name buildRefreshPixel
         * @desc build the pixel to refresh the panel
         * @returns {string} the pixel to run
         */
        function buildRefreshPixel(panelId: string): string {
            let pixel = '',
                components: any = [];

            components = [
                {
                    type: 'panel',
                    components: [panelId],
                    meta: true,
                },
                {
                    type: 'refreshPanelTask',
                    components: [-1],
                    terminal: true,
                },
            ];

            pixel = semossCoreService.pixel.build(components);

            return pixel;
        }

        /**
         * @name generateGridHTML
         * @desc generate HTML for the grid
         */
        function generateGridHTML(widgetId: string, output: any): string {
            let html = '';

            // get the options
            const active = semossCoreService.getWidget(widgetId, 'active'),
                layout = semossCoreService.getWidget(
                    widgetId,
                    'view.visualization.layout'
                ),
                individualTools =
                    semossCoreService.getWidget(
                        widgetId,
                        'view.visualization.tools.individual.' + layout
                    ) || {},
                sharedTools = semossCoreService.getWidget(
                    widgetId,
                    'view.' + active + '.tools.shared'
                ),
                colorBy = semossCoreService.getWidget(
                    widgetId,
                    'view.visualization.colorByValue'
                ),
                uiOptions = angular.extend(sharedTools, individualTools),
                keys = semossCoreService.getWidget(
                    widgetId,
                    'view.visualization.keys.' + layout
                );

            // add the color by value
            uiOptions.colorByValue = colorBy;

            const dataTypes = semossCoreService.visualization.getFormat(
                keys,
                uiOptions
            );

            // now we have the data, create the table
            html += '<table>';

            // create the header
            html += '<thead>';
            html += '<tr>';

            // map the header to idx
            const headerMapping = {};

            for (
                let headerIdx = 0, headerLen = output.data.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                const header = output.data.headers[headerIdx];

                // map it
                headerMapping[header] = headerIdx;

                // style for the header
                const style: Partial<CSSStyleDeclaration> = {
                    width: '200px',
                };

                // add in a width if possible
                if (
                    uiOptions.columnProperties &&
                    uiOptions.columnProperties[header]
                ) {
                    style.width = `${uiOptions.columnProperties[header]}px`;
                }

                // add color if possible
                if (uiOptions.gridHeaderColor) {
                    style.backgroundColor = uiOptions.gridHeaderColor;
                }

                if (uiOptions.gridHeaderFontColor) {
                    style.color = uiOptions.gridHeaderFontColor;
                }

                html += `<th ${
                    Object.keys(style).length > 0
                        ? `style="${toCSSString(style)}"`
                        : ''
                }>${String(header).replace(/_/g, ' ')}</th>`;
            }

            html += '</tr>';
            html += '</thead>';

            // create the body
            html += '<tbody>';

            // keep track of the rows
            const rowSpan = {};

            for (
                let rowIdx = 0, rowLen = output.data.values.length;
                rowIdx < rowLen;
                rowIdx++
            ) {
                const row = output.data.values[rowIdx];

                html += '<tr>';
                for (
                    let colIdx = 0, colLen = row.length;
                    colIdx < colLen;
                    colIdx++
                ) {
                    const cell = row[colIdx],
                        header = output.data.headers[colIdx];

                    if (uiOptions.gridSpanRows) {
                        // skip this if we need to
                        if (rowSpan[colIdx] > 1) {
                            rowSpan[colIdx]--;
                            continue;
                        }

                        // restart the spanning
                        rowSpan[colIdx] = 1;

                        // look at the next row
                        for (
                            let nextIdx = rowIdx + 1;
                            nextIdx < rowLen;
                            nextIdx++
                        ) {
                            const next = output.data.values[nextIdx][colIdx];

                            if (next !== cell) {
                                break;
                            }

                            // increment
                            rowSpan[colIdx]++;
                        }
                    }

                    // style for the cell
                    const style: Partial<CSSStyleDeclaration> = {};

                    // add in a width if possible
                    if (
                        uiOptions.columnProperties &&
                        uiOptions.columnProperties[header]
                    ) {
                        style.width = `${uiOptions.columnProperties[header]}px`;
                    }

                    // wrap the columns if necessary
                    if (
                        uiOptions.gridWrapCols &&
                        uiOptions.gridWrapCols.length > 0 &&
                        uiOptions.gridWrapCols.gridWrapCols.indexOf(header) > -1
                    ) {
                        style.wordWrap = 'break-work';
                    }

                    // add color by value
                    const colorByValue = uiOptions.colorByValue;
                    for (
                        let ruleIdx = 0, ruleLen = colorByValue.length;
                        ruleIdx < ruleLen;
                        ruleIdx++
                    ) {
                        const rule = colorByValue[ruleIdx],
                            colorRow =
                                rule.highlightRow &&
                                rule.valuesToColor &&
                                typeof headerMapping[rule.colorOn] !==
                                    'undefined' &&
                                rule.valuesToColor.indexOf(
                                    row[headerMapping[rule.colorOn]]
                                ) > -1,
                            colorCell =
                                !rule.highlightRow &&
                                typeof headerMapping[rule.colorOn] !==
                                    'undefined' &&
                                headerMapping[rule.colorOn] === colIdx &&
                                rule.valuesToColor.indexOf(cell) > -1;

                        if (colorRow || colorCell) {
                            style.backgroundColor = rule.color;
                        }
                    }

                    const value = semossCoreService.visualization.formatValue(
                        cell,
                        dataTypes[header]
                    );

                    // construct the element
                    html += `<td ${
                        Object.keys(style).length > 0
                            ? `style="${toCSSString(style)}"`
                            : ''
                    } ${
                        rowSpan[colIdx] > 1
                            ? `rowspan="${rowSpan[colIdx]}"`
                            : ''
                    }>${value}</td>`;
                }
                html += '</tr>';
            }
            html += '</tbody>';
            html += '</table>';

            return html;
        }

        /**
         * @name generatePivotHTML
         * @desc generate HTML for the grid
         */
        function generatePivotHTML(widgetId: string, output: any): string {
            let html = '',
                pivotData = output.data.values,
                tableData = [];

            // get the options
            const active = semossCoreService.getWidget(widgetId, 'active'),
                layout = semossCoreService.getWidget(
                    widgetId,
                    'view.visualization.layout'
                ),
                individualTools =
                    semossCoreService.getWidget(
                        widgetId,
                        'view.visualization.tools.individual.' + layout
                    ) || {},
                sharedTools = semossCoreService.getWidget(
                    widgetId,
                    'view.' + active + '.tools.shared'
                ),
                colorBy = semossCoreService.getWidget(
                    widgetId,
                    'view.visualization.colorByValue'
                ),
                uiOptions = angular.extend(sharedTools, individualTools),
                keys = semossCoreService.getWidget(
                    widgetId,
                    'view.visualization.keys.' + layout
                );

            // add the color by value
            uiOptions.colorByValue = colorBy;

            const dataTypes = semossCoreService.visualization.getFormat(
                keys,
                uiOptions
            );

            // format data type for All Total column will match the first calculation dimensions added to the pivot table
            for (const key in dataTypes) {
                if (
                    dataTypes.hasOwnProperty(key) &&
                    dataTypes[key].model === 'calculations' &&
                    key === output.data.pivotData.values[0].alias
                ) {
                    dataTypes['All Total'] = JSON.parse(
                        JSON.stringify(dataTypes[key])
                    );
                }
            }

            // try to parse the result, if it cannot be parsed, then we assume its html
            try {
                // change it to a valid json and then parse..
                pivotData = JSON.parse(pivotData);
            } catch {
                console.log('Cannot parse output.');
            }

            if (typeof pivotData === 'object' && pivotData.length > 0) {
                tableData = getAllPivot(
                    pivotData,
                    output.data.pivotData,
                    uiOptions
                );

                // now we have the data, create the table
                for (
                    let tableIdx = 0;
                    tableIdx < tableData.length;
                    tableIdx++
                ) {
                    const table: any = tableData[tableIdx];

                    html += '<table>';

                    // create the header
                    html += '<thead>';

                    // add the title if more than 1 table
                    if (tableData.length > 1) {
                        // add a blank row between multiple tables
                        if (tableIdx > 0) {
                            html += '<tr></tr>';
                        }
                        html += '<tr>';
                        html += `<th style="font-weight: bold;">${table.title}</th>`;
                        html += '</tr>';
                    }

                    for (
                        let headerRowIdx = 0,
                            headerRowLen = table.headers.length;
                        headerRowIdx < headerRowLen;
                        headerRowIdx++
                    ) {
                        html += '<tr>';

                        const headerRow = table.headers[headerRowIdx];

                        for (
                            let headerIdx = 0, headerLen = headerRow.length;
                            headerIdx < headerLen;
                            headerIdx++
                        ) {
                            const header = headerRow[headerIdx] + '';
                            let colSpan;

                            // get colSpan
                            colSpan =
                                table.headerConfig[headerRowIdx][headerIdx]
                                    .colspan;

                            // style for the header
                            const style: Partial<CSSStyleDeclaration> = {
                                width: '200px',
                            };

                            // add color if possible
                            if (uiOptions.gridPivotStyle.headerColor) {
                                style.backgroundColor =
                                    uiOptions.gridPivotStyle.headerColor;
                            }
                            if (uiOptions.gridPivotStyle.fontColor) {
                                style.color =
                                    uiOptions.gridPivotStyle.fontColor;
                            }

                            // bold totals
                            if (header.indexOf('Total') > -1) {
                                style.fontWeight = 'bold';
                            }

                            // only add headers with colspan
                            if (colSpan > 0) {
                                html += `<th colspan="${colSpan}" ${
                                    Object.keys(style).length > 0
                                        ? `style="${toCSSString(style)}"`
                                        : ''
                                }>${String(header).replace(/_/g, ' ')}</th>`;
                            }
                        }
                        html += '</tr>';
                    }
                    html += '</thead>';

                    // create the body
                    html += '<tbody>';

                    for (
                        let rowIdx = 0, rowLen = table.data.length;
                        rowIdx < rowLen;
                        rowIdx++
                    ) {
                        const row = table.data[rowIdx];

                        html += '<tr>';
                        for (
                            let vHeadIdx = 0,
                                vHeadLen = table.vHeaders[rowIdx].length;
                            vHeadIdx < vHeadLen;
                            vHeadIdx++
                        ) {
                            const vHeader =
                                table.vHeaders[rowIdx][vHeadIdx] + '';
                            let vColSpan, showHeader;

                            // style for the cell
                            const style: Partial<CSSStyleDeclaration> = {};

                            // add color if possible
                            if (uiOptions.gridPivotStyle.headerColor) {
                                style.backgroundColor =
                                    uiOptions.gridPivotStyle.headerColor;
                            }
                            if (uiOptions.gridPivotStyle.fontColor) {
                                style.color =
                                    uiOptions.gridPivotStyle.fontColor;
                            }
                            // bold totals
                            if (vHeader.indexOf('Total') > -1) {
                                style.fontWeight = 'bold';
                            }

                            vColSpan =
                                vHeader.indexOf('Total') > -1 ? vHeadLen : 1;
                            showHeader =
                                ('' + table.vHeaders[rowIdx][0]).indexOf(
                                    'Total'
                                ) > 1
                                    ? vHeadIdx === 0
                                    : true;

                            if (showHeader) {
                                html += `<th colspan="${vColSpan}" ${
                                    Object.keys(style).length > 0
                                        ? `style="${toCSSString(style)}"`
                                        : ''
                                }>${String(vHeader).replace(/_/g, ' ')}</th>`;
                            }
                        }

                        for (
                            let colIdx = 0, colLen = row.length;
                            colIdx < colLen;
                            colIdx++
                        ) {
                            let value;
                            const cell = row[colIdx],
                                numVHeaders = table.vHeaders[0].length,
                                valueHeader =
                                    table.headers[0][colIdx + numVHeaders];

                            // style for the cell
                            const style: Partial<CSSStyleDeclaration> = {};

                            // bold grand totals / sub totals rows and columns
                            if (
                                ('' + table.vHeaders[rowIdx][0]).indexOf(
                                    'Total'
                                ) > -1 ||
                                (rowIdx === table.data.length - 1 &&
                                    (uiOptions.gridPivotStyle.grandTotals ||
                                        uiOptions.gridPivotStyle
                                            .grandTotalsColumns)) ||
                                (colIdx === row.length - 1 &&
                                    (uiOptions.gridPivotStyle.grandTotals ||
                                        uiOptions.gridPivotStyle
                                            .grandTotalsRows))
                            ) {
                                style.fontWeight = 'bold';
                            }

                            // value header is dimension in first header row at col idx
                            if (valueHeader) {
                                value =
                                    semossCoreService.visualization.formatValue(
                                        cell,
                                        dataTypes[valueHeader]
                                    );
                            } else {
                                value = cell;
                            }

                            // construct the element
                            html += `<td ${
                                Object.keys(style).length > 0
                                    ? `style="${toCSSString(style)}"`
                                    : ''
                            }>${value}</td>`;
                        }
                        html += '</tr>';
                    }
                    html += '</tbody>';
                    html += '</table>';
                }
            }
            return html;
        }

        /**
         *
         * @param {*} data the data returned from the BE
         * @param {*} pivotData the selections for the pivot
         */
        function getAllPivot(data: any, pivotData: any, uiOptions: any): any {
            let tableData: any = [],
                tempTable: any,
                tempTitle = '';

            // index 1 is the pivot table information
            // index 0 is the pivot table title
            for (let tableIdx = 0; tableIdx < data[1].length; tableIdx++) {
                tempTable = getPivotTableData(
                    data[1][tableIdx],
                    pivotData,
                    uiOptions
                );

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
        function getPivotTableData(
            data: any,
            pivotData: any,
            uiOptions: any
        ): any {
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

        /** Utility */
        /**
         * @name toCSSString
         * @desc convert the grid to an HTML Table
         */
        function toCSSString(cssObject: Partial<CSSStyleDeclaration>): string {
            let cssString = '';
            for (const c in cssObject) {
                cssString += `${c
                    .split(/(?=[A-Z])/)
                    .join('-')
                    .toLowerCase()}:${cssObject[c]};`;
            }

            return cssString;
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let urlParams = $location.search(),
                postQuery = '',
                initialLoadListener: () => {},
                syncInsightListener: () => {},
                syncCoreListener: () => {};

            scope.viewerHtml.appId = urlParams.engine;
            scope.viewerHtml.appInsightId = urlParams.id;
            scope.viewerHtml.panelId = urlParams.panel;
            scope.viewerHtml.insightId = urlParams.insightId;
            scope.viewerHtml.sheetId = urlParams.sheet;

            if (
                (!scope.viewerHtml.appId || !scope.viewerHtml.appInsightId) &&
                (!scope.viewerHtml.insightId ||
                    typeof scope.viewerHtml.panelId === 'undefined' ||
                    typeof scope.viewerHtml.sheetId === 'undefined')
            ) {
                scope.viewerHtml.loading.messages = ['Url is incorrect'];
                return;
            }

            // add listener
            // if there are any issues upon initialization of the insight, we will show the message in the loading bar.
            initialLoadListener = semossCoreService.once(
                'alert',
                function (payload) {
                    scope.viewerHtml.loading.messages = [payload.text];
                }
            );

            syncInsightListener = semossCoreService.on(
                'sync-insight',
                function (payload) {
                    const initialized = semossCoreService.getShared(
                        payload.insightID,
                        'initialized'
                    );
                    if (initialized) {
                        render(payload.insightID);
                        syncInsightListener();
                    }
                }
            );

            if (!scope.viewerHtml.insightId) {
                // off load event
                window.onbeforeunload = function () {
                    semossCoreService.emit('close-all');
                };

                // drop via a function
                window['dropInsights'] = function (callback: () => {}) {
                    semossCoreService.once('close-all-complete', callback);
                    semossCoreService.emit('close-all');
                };

                // resize
                window.onresize = function () {
                    $timeout(); // widget view will take care of it
                };
            }

            // cleanup
            scope.$on('$destroy', function () {
                if (initialLoadListener) {
                    initialLoadListener();
                }

                if (syncInsightListener) {
                    syncInsightListener();
                }

                if (syncCoreListener) {
                    syncCoreListener();
                }
            });

            if (!scope.viewerHtml.insightId) {
                semossCoreService.emit('open', {
                    type: 'insight',
                    options: {
                        app_name: scope.viewerHtml.appId,
                        app_id: scope.viewerHtml.appId, // for playsheet....
                        app_insight_id: scope.viewerHtml.appInsightId,
                        postQuery: postQuery,
                        parameters: scope.viewerHtml.parameters,
                    },
                    newSheet: true,
                });
            } else {
                semossCoreService.emit('execute-pixel', {
                    insightID: scope.viewerHtml.insightId,
                    commandList: [
                        {
                            type: 'cachedSheet',
                            components: [scope.viewerHtml.sheetId],
                            terminal: true,
                            meta: true,
                        },
                        {
                            type: 'cachedPanel',
                            components: [scope.viewerHtml.panelId],
                            terminal: true,
                            meta: true,
                        },
                        {
                            type: 'Pixel',
                            components: [
                                buildRefreshPixel(scope.viewerHtml.panelId),
                            ],
                            terminal: true,
                        },
                    ],
                    disableLogging: true,
                });
            }
        }

        initialize();
    }
}
