'use strict';
import { CONNECTORS } from '@/core/constants.js';

import './grid-delta.scss';
import './search/grid-delta-search.directive.js';
import { Grid } from 'ag-grid-community';
/**
 * @name gridDelta
 * @desc gridDelta
 */

export default angular
    .module('app.grid-delta.directive', ['app.grid-delta-search.directive'])
    .directive('gridDelta', gridDelta);

gridDelta.$inject = ['$timeout', 'semossCoreService'];

function gridDelta($timeout, semossCoreService) {
    gridDeltaLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    return {
        template: require('./grid-delta.directive.html'),
        restrict: 'E',
        require: ['^widget'],
        priority: 300,
        link: gridDeltaLink,
        scope: {
            data: '=',
        },
    };

    function gridDeltaLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var updateTaskListener,
            addDataListener,
            previousScroll = 0;

        /** **************Tool Functions*************************/
        scope.localStore = {
            sortInfo: false,
        };
        scope.localChartData = {};
        scope.newColumnAnimationObj = {
            numColumns: 0,
            headers: [],
        };
        scope.newRow = {};
        scope.headerColumnsToStyle = [];
        scope.linkColumnsToStyle = [];
        scope.isInsertingRow = false;
        scope.isSaving = false;
        scope.collectionAmount = 50;
        scope.totalCollectionAmount = scope.collectionAmount;
        scope.taskHasMoreData = true;
        scope.grid = false;
        scope.history = {
            readOnly: [0],
            actions: [],
            actionIndex: -1,
        };
        scope.gridOptions = {
            rowData: [],
            columnDefs: [],
            suppressMovableColumns: true,
            suppressScrollOnNewData: true,
            stopEditingWhenGridLosesFocus: true,
            defaultColDef: {
                resizable: true,
                editable: true,
            },
        };
        scope.gridPixelComponents = [];
        scope.sortOptions = {
            options: [],
            selected: '',
        };
        scope.filterOptions = {
            taskId: '',
            options: [],
            instanceOptions: [],
            selectedColumn: '',
            selectedInstances: [],
        };
        scope.busyLoading = false;
        scope.sortDetails = {};

        scope.setTable = setTable;
        scope.setData = setData;
        scope.insertRow = insertRow;
        scope.deleteRow = deleteRow;
        scope.hideDeleteRow = hideDeleteRow;
        scope.stopToSave = stopToSave;
        scope.showSort = showSort;
        scope.showFilter = showFilter;
        scope.getInstances = getInstances;
        scope.getMoreInstances = getMoreInstances;
        scope.displayInsertRow = displayInsertRow;
        scope.updateData = updateData;
        scope.getGrid = getGrid;
        scope.navigate = navigate;
        scope.sort = sort;
        scope.filter = filter;
        scope.validateInput = validateInput;

        /**
         * @name validateInput
         * @param {*} e the event
         * @param {object} data the data to check against
         * @desc check to see if the new input is valid
         * @returns {void}
         */
        function validateInput(e, data) {
            var column = e.colDef ? e.colDef.field : data.column,
                validationIdx,
                regex,
                invalid = false,
                newValue;
            if (e.value || !data || !data.newValue) {
                newValue = e.value;
            } else {
                newValue = data.newValue;
            }
            if (
                scope.gridConfigurations &&
                scope.gridConfigurations.config &&
                scope.gridConfigurations.config[column] &&
                scope.gridConfigurations.config[column].validation &&
                scope.gridConfigurations.config[column].validation.length > 0
            ) {
                for (
                    validationIdx = 0;
                    validationIdx <
                    scope.gridConfigurations.config[column].validation.length;
                    validationIdx++
                ) {
                    regex = new RegExp(
                        scope.gridConfigurations.config[column].validation[
                            validationIdx
                        ]
                    );
                    // if it doesn't pass this regex test then we will warn the user and prevent from progressing
                    if (!regex.test(newValue)) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Invalid value was entered. Please correct the value before continuing.'
                        );
                        invalid = true;
                        scope.gridOptions.api.stopEditing(true);
                        break;
                    }
                }

                if (data && data.refData) {
                    data.refData.invalid = invalid;
                }
            }
        }

        /**
         * @name _updateCell
         * @param {object} e - canvas data grid event object for endedit event
         * @desc adds an update query to editsAsPixel array
         * @return {void}
         */
        function _updateCell(e) {
            // checking to make sure there is a change
            // otherwise there is nothing to update
            if (e.newValue !== e.oldValue) {
                _addAction('update', e, e.rowIndex);
                _reflectUpdate(e);
            }
        }

        /**
         * @name deleteRow
         * @param {number} rowNumber - number of row to delete
         * @desc deletes row from grid and adds delete query to editsAsPixel array
         * @return {void}
         */
        function deleteRow(rowNumber) {
            _addAction('delete', false, rowNumber);
            _reflectDelete(rowNumber);
        }

        /**
         * @name insertRow
         * @desc adds a row to the grid and adds insert query to editsAsPixel array
         * @return {void}
         */
        function insertRow() {
            var headers = scope.localChartData.keys.map(function (key) {
                    return key.alias;
                }),
                headerIdx,
                keyIdx;

            for (
                keyIdx = 0;
                keyIdx < scope.localChartData.keys.length;
                keyIdx++
            ) {
                if (scope.localChartData.keys[keyIdx].invalid) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Please update ' +
                            scope.localChartData.keys[keyIdx].alias +
                            ' before continuing.'
                    );
                    return;
                }
            }

            _addAction('insert');
            navigate('refresh');
            // clear new row data
            for (headerIdx = 0; headerIdx < headers.length; headerIdx++) {
                scope.newRow[headers[headerIdx]] = '';
            }

            scope.isInsertingRow = false;
        }

        /**
         * @name _addAction
         * @param {string} type - delete | insert | update depending on db transaction
         * @param {object} e - canvas data grid event for insert
         * @param {number} rowNumber - row number for deletion
         * @desc look at the action performed and then queue it in a list
         * @return {void}
         */
        function _addAction(type, e, rowNumber) {
            var actionObject = {},
                pixel = 'META | Frame(frame=[' + scope.frame + ']) | ',
                dbPixel =
                    'META | Database(database=["' +
                    scope.selectedApp.app_id +
                    '"]) | ',
                tempRow = {},
                headers = scope.localChartData.keys.map(function (key) {
                    return key.alias;
                }),
                node = scope.gridOptions.api.getRowNode(rowNumber);

            actionObject.type = type;
            actionObject.rowId = rowNumber;

            if (type === 'insert') {
                pixel += _buildInsertRowPixel(
                    headers,
                    semossCoreService.utility.freeze(scope.newRow),
                    'frame'
                );
                dbPixel += _buildInsertRowPixel(
                    headers,
                    semossCoreService.utility.freeze(scope.newRow),
                    'database'
                );
                actionObject.newRow = semossCoreService.utility.freeze(
                    scope.newRow
                );
            } else if (type === 'update') {
                pixel += _buildUpdatePixel(headers, e, 'frame');
                dbPixel += _buildUpdatePixel(headers, e, 'database');

                // e.data reflects the new row values.
                // To get the old row back, we will make a copy of the new row and then set the cell that was changed back to what it was previously.
                tempRow = semossCoreService.utility.freeze(e.data);
                tempRow[e.colDef.field] = e.oldValue;

                actionObject.newRow = semossCoreService.utility.freeze(e.data);
                actionObject.oldRow = semossCoreService.utility.freeze(tempRow);
                actionObject.currentRow = semossCoreService.utility.freeze(
                    e.data
                );
                actionObject.columnName = e.colDef.field;

                _updateActionData(
                    semossCoreService.utility.freeze(tempRow),
                    semossCoreService.utility.freeze(e.data)
                );
            } else if (type === 'delete') {
                pixel += _buildDeletePixel(headers, node.rowIndex, 'frame');
                dbPixel += _buildDeletePixel(
                    headers,
                    node.rowIndex,
                    'database'
                );

                tempRow = scope.localChartData.values[node.rowIndex];

                actionObject.oldRow = semossCoreService.utility.freeze(tempRow);
            }

            // insert doesn't have ExecQuery...should standardize with maher
            if (type !== 'insert') {
                pixel += ') | ExecQuery();';
                dbPixel += ') | ExecQuery();';
            } else {
                pixel += ');';
                dbPixel += ');';
            }

            actionObject.pixel = pixel;
            actionObject.dbPixel = dbPixel;
            actionObject.active = true;
            // drop all actions beyond the actionIndex.
            scope.history.actions.length = scope.history.actionIndex + 1;
            scope.history.actions.push(actionObject);
            scope.history.actionIndex++;
            scope.gridOptions.api.refreshCells({ force: true });
        }

        /**
         * @name _updateActionData
         * @param {object} currentRow the current row data
         * @param {object} updatedRow the new updated row data
         * @desc update all of the actions to reflect what the current action is
         * @returns {void}
         */
        function _updateActionData(currentRow, updatedRow) {
            var i;

            for (i = 0; i < scope.history.actions.length; i++) {
                if (_isEqual(scope.history.actions[i].currentRow, currentRow)) {
                    scope.history.actions[i].currentRow = updatedRow;
                }
            }
        }

        /**
         * @name _isEqual
         * @param {*} row1 row to compare
         * @param {*} row2 row to compare
         * @returns {boolean} true or false on if two objects are equal
         */
        function _isEqual(row1, row2) {
            var row1Values = [],
                row2Values = [];

            if (!row1 || !row2) {
                return false;
            }

            row1Values = Object.keys(row1)
                .map(function (key) {
                    return row1[key];
                })
                .sort();
            row2Values = Object.keys(row2)
                .map(function (key) {
                    return row2[key];
                })
                .sort();
            if (Object.keys(row1).length !== Object.keys(row2).length) {
                return false;
            }

            if (JSON.stringify(row1Values) === JSON.stringify(row2Values)) {
                return true;
            }

            return false;
        }

        /**
         * @name _getNewFramePixel
         * @desc get the pixel components for creating a new frame
         * @returns {object} the pixel components
         */
        function _getNewFramePixel() {
            var pixelComponents = [];
            pixelComponents = [
                {
                    meta: true,
                    type: 'createSource',
                    components: ['Frame', 'GRID', scope.frame, true],
                    terminal: true,
                },
                {
                    type: 'database',
                    components: [scope.selectedApp.app_id],
                },
                {
                    type: 'select2',
                    components: [scope.selectors],
                },
                {
                    type: 'import',
                    components: [scope.frame],
                    terminal: true,
                },
            ];

            return pixelComponents;
        }

        /**
         * @name _getActionPixels
         * @param {number} index the index to get pixels up until
         * @desc get the pixel components for the actions
         * @returns {object} the pixel components
         */
        function _getActionPixels(index) {
            var actionIdx,
                pixelComponents = [],
                pixel = '';

            for (
                actionIdx = 0;
                actionIdx < scope.history.actions.length && actionIdx < index;
                actionIdx++
            ) {
                pixel += scope.history.actions[actionIdx].pixel;
            }

            pixelComponents.push({
                type: 'Pixel',
                components: [pixel],
                terminal: true,
            });

            return pixelComponents;
        }

        /**
         * @name _getDbActionPixels
         * @param {number} index the index to get pixels up until
         * @desc get the pixel components for the actions
         * @returns {object} the pixel components
         */
        function _getDbActionPixels(index) {
            var actionIdx,
                pixelComponents = [],
                pixel = '';

            for (
                actionIdx = 0;
                actionIdx < scope.history.actions.length && actionIdx < index;
                actionIdx++
            ) {
                pixel += scope.history.actions[actionIdx].dbPixel;
            }

            if (pixel) {
                pixelComponents.push({
                    type: 'Pixel',
                    components: [pixel],
                    terminal: true,
                });
            }

            return pixelComponents;
        }

        /**
         * @name _getGridDataPixel
         * @param {object} sortDetails the options we're passing to create the grid
         * @desc get the pixel components for the grid data
         * @returns {object} the pixel components
         */
        function _getGridDataPixel() {
            var filterOptions = {};
            scope.gridPixelComponents = [
                {
                    meta: true,
                    type: 'frame',
                    components: [scope.frame],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
            ];

            if (
                scope.sortDetails &&
                scope.sortDetails.column &&
                scope.sortDetails.direction
            ) {
                scope.gridPixelComponents.push({
                    type: 'sort',
                    components: [
                        [scope.sortDetails.column],
                        [scope.sortDetails.direction],
                    ],
                });
            } else {
                scope.gridPixelComponents.push({
                    type: 'sort',
                    components: [[scope.selectors[0].alias], ['asc']],
                });
            }

            if (
                scope.filterOptions &&
                scope.filterOptions.selectedColumn &&
                scope.filterOptions.selectedInstances
            ) {
                filterOptions[scope.filterOptions.selectedColumn] = {
                    comparator: '==',
                    value: scope.filterOptions.selectedInstances,
                };
                scope.gridPixelComponents.push({
                    type: 'filter',
                    components: [filterOptions],
                });
            }

            scope.gridPixelComponents.push({
                type: 'collect',
                components: [scope.totalCollectionAmount],
                terminal: true,
            });

            return scope.gridPixelComponents;
        }

        /**
         * @name _getConceptualHeaders
         * @param {array} headers a list of headers to get conceptual name for
         * @desc get the conceptual names for each header so that we can apply the changes to the database
         * @returns {array} the list of conceptual names for the headers
         */
        function _getConceptualHeaders(headers) {
            var headerIdx,
                headerIdx2,
                tempHeaders = [];
            // find the primKey first
            for (
                headerIdx = 0;
                headerIdx < scope.localChartData.keys.length;
                headerIdx++
            ) {
                for (
                    headerIdx2 = 0;
                    headerIdx2 < headers.length;
                    headerIdx2++
                ) {
                    if (
                        headers[headerIdx2] ===
                        scope.localChartData.keys[headerIdx].alias
                    ) {
                        // if it's the table name itself...we will remove the whole '__' string we append
                        if (
                            scope.selectedApp.app_table ===
                            scope.localChartData.keys[headerIdx].raw
                        ) {
                            tempHeaders.push(
                                scope.localChartData.keys[headerIdx].raw
                            );
                        } else {
                            tempHeaders.push(
                                scope.selectedApp.app_table +
                                    '__' +
                                    scope.localChartData.keys[headerIdx].raw
                            );
                        }
                    }
                }
            }

            return tempHeaders;
        }

        /**
         * @name _buildDeletePixel
         * @param {string[]} headers - grid header names
         * @param {number} rowNumber - number of row to remove
         * @param {string} queryType - frame or database query to make
         * @desc builds pixel to delete data
         * @return {string} the pixel
         */
        function _buildDeletePixel(headers, rowNumber, queryType) {
            var pixel = 'Delete(from=["' + scope.selectedApp.app_table + '"])',
                values = semossCoreService.utility.freeze(
                    scope.localChartData.values[rowNumber]
                ),
                dbHeaders = _getConceptualHeaders(headers);

            pixel += ' | Filter(';

            if (queryType === 'frame') {
                headers.forEach(function (header, idx) {
                    if (values[idx] !== null) {
                        pixel +=
                            '(' +
                            header +
                            '==["' +
                            String(values[idx]).replace(/"/g, '\\"') +
                            '"]' +
                            ') ';
                    } else {
                        pixel +=
                            '(' + header + '==[' + values[idx] + ']' + ') ';
                    }
                    if (idx !== headers.length - 1) {
                        pixel += ', ';
                    }
                });
            } else if (queryType === 'database') {
                dbHeaders.forEach(function (header, idx) {
                    if (values[idx] !== null) {
                        pixel +=
                            '(' +
                            header +
                            '==["' +
                            String(values[idx]).replace(/"/g, '\\"') +
                            '"]' +
                            ') ';
                    } else {
                        pixel +=
                            '(' + header + '==[' + values[idx] + ']' + ') ';
                    }
                    if (idx !== headers.length - 1) {
                        pixel += ', ';
                    }
                });
            }

            return pixel;
        }

        /**
         * @name _buildInsertRowPixel
         * @param {string[]} headers - grid header names
         * @param {object} newRow - the new row
         * @param {string} queryType - frame or database query to make
         * @desc builds pixel to insert row
         * @return {string} pixel
         */
        function _buildInsertRowPixel(headers, newRow, queryType) {
            var pixel = 'Insert(into=[',
                values = [],
                dbHeaders = _getConceptualHeaders(headers);

            if (queryType === 'frame') {
                pixel += headers.join(', ') + '], values=';
            } else if (queryType === 'database') {
                pixel += dbHeaders.join(', ') + '], values=';
            }

            headers.forEach(function (header) {
                values.push(newRow[header]);
            });

            pixel += JSON.stringify(values);

            return pixel;
        }

        /**
         * @name _buildUpdatePixel
         * @param {string[]} headers - grid header names
         * @param {object} e - canvas data grid event
         * @param {string} queryType - frame or database query to make
         * @desc builds pixel to update a value
         * @return {string} pixel
         */
        function _buildUpdatePixel(headers, e, queryType) {
            var pixel = 'Update(',
                editedHeader = e.colDef.field,
                prevValue = e.oldValue,
                dbHeaders = _getConceptualHeaders(headers),
                dbEditedHeader = '',
                headerIdx;

            for (
                headerIdx = 0;
                headerIdx < scope.localChartData.keys.length;
                headerIdx++
            ) {
                if (
                    scope.localChartData.keys[headerIdx].alias === editedHeader
                ) {
                    // if it's the table name itself...we will remove the whole '__' string we append
                    if (
                        scope.selectedApp.app_table ===
                        scope.localChartData.keys[headerIdx].raw
                    ) {
                        dbEditedHeader =
                            scope.localChartData.keys[headerIdx].raw;
                    } else {
                        dbEditedHeader =
                            scope.selectedApp.app_table +
                            '__' +
                            scope.localChartData.keys[headerIdx].raw;
                    }
                }
            }

            if (queryType === 'frame') {
                pixel += 'columns=[' + editedHeader + '], values=[';
            } else if (queryType === 'database') {
                pixel += 'columns=[' + dbEditedHeader + '], values=[';
            }

            pixel += _formatPixelValue(e.value, editedHeader);
            pixel += ']) | Filter(';

            if (queryType === 'frame') {
                headers.forEach(function (header, idx) {
                    if (header === editedHeader) {
                        // filter on old value
                        pixel +=
                            '(' +
                            editedHeader +
                            '==[' +
                            _formatPixelValue(prevValue, editedHeader) +
                            ']' +
                            ') ';
                    } else {
                        // make sure updating correct row
                        pixel +=
                            '(' +
                            header +
                            '==[' +
                            _formatPixelValue(e.data[header], header) +
                            ']' +
                            ') ';
                    }

                    if (idx !== headers.length - 1) {
                        pixel += ', ';
                    }
                });
            } else if (queryType === 'database') {
                dbHeaders.forEach(function (header, idx) {
                    if (header === dbEditedHeader) {
                        // filter on old value
                        pixel +=
                            '(' +
                            dbEditedHeader +
                            '==[' +
                            _formatPixelValue(prevValue, dbEditedHeader) +
                            ']' +
                            ') ';
                    } else {
                        // make sure updating correct row
                        pixel +=
                            '(' +
                            header +
                            '==[' +
                            _formatPixelValue(e.data[headers[idx]], header) +
                            ']' +
                            ') ';
                    }

                    if (idx !== headers.length - 1) {
                        pixel += ', ';
                    }
                });
            }

            return pixel;
        }

        /**
         * @name _reflectDelete
         * @param {number} rowId - row number to delete
         * @desc syncs grid and local chart data with the delete pixel
         * @return {void}
         */
        function _reflectDelete(rowId) {
            const rowNumber = Number(rowId),
                node = scope.gridOptions.api.getRowNode(rowId);

            scope.gridOptions.api.updateRowData({
                remove: [node.data],
            });
            scope.rowToDelete = {
                display: '',
                value: '',
            };
            scope.isDeletingRow = false;
            scope.localChartData.values.splice(node.rowIndex, 1);

            scope.widgetCtrl.emit('update-search-map');
        }

        /**
         * @name _reflectUpdate
         * @param {object} e - canvas data grid event object
         * @desc syncs grid and local chart data with the update pixel
         * @return {void}
         */
        function _reflectUpdate(e) {
            let allColumns = scope.gridOptions.columnApi
                    .getColumnState()
                    .map((col) => col.colId),
                columns = allColumns.filter(
                    (col) => col !== 'row_index' && col !== 'Delete'
                ),
                columnIndex = columns.indexOf(e.colDef.field);
            scope.localChartData.values[e.rowIndex][columnIndex] = e.value;

            scope.widgetCtrl.emit('update-search-map');
        }

        /**
         * @name saveChanges
         * @desc executes all the pixels in the editsAsPixel array, then clears it out
         * @return {void}
         */
        function saveChanges() {
            var callback, pixelComponent;

            pixelComponent = _getDbActionPixels(scope.history.actions.length);

            if (pixelComponent.length === 0) {
                return;
            }

            callback = function (res) {
                if (
                    res.pixelReturn[0].operationType[0] !== 'ERROR' &&
                    res.pixelReturn[0].operationType[0] !== 'INVALID_SYNTAX'
                ) {
                    // scope.history.actions = [];
                    // scope.history.actionIndex = -1;
                    setData();
                    scope.widgetCtrl.alert(
                        'success',
                        'Data has been successfully updated'
                    );
                }
            };

            scope.widgetCtrl.meta(pixelComponent, callback);
        }

        /**
         * @name stopToSave
         * @desc Stop editing and set flag to save
         * @return {void}
         */
        function stopToSave() {
            // Flag required to perform save
            scope.isSaving = true;

            // Trigger cellEditingStopped listener to perform save
            scope.gridOptions.api.dispatchEvent(
                new Event('cellEditingStopped')
            );
        }

        /**
         * @name _formatPixelValue
         * @param {string | number} value - pixel param
         * @param {string} header the header to format
         * @desc if it is a string, wrap it in quotes and replace spaces with underscores otherwise as is
         * @return {string | number} pixel friendly param
         */
        function _formatPixelValue(value, header) {
            var pixel = '',
                headerIdx,
                alias = header;

            if (alias.indexOf('__') > -1) {
                alias = alias.split('__')[1];
            }

            for (
                headerIdx = 0;
                headerIdx < scope.localChartData.keys.length;
                headerIdx++
            ) {
                if (scope.localChartData.keys[headerIdx].alias === alias) {
                    if (
                        value === null ||
                        scope.localChartData.keys[headerIdx].type === 'NUMBER'
                    ) {
                        pixel += value;
                    } else {
                        pixel += '"';
                        pixel +=
                            typeof value === 'string'
                                ? value.replace(/"/g, '\\"')
                                : value; // if there is '"' or '\' we will escape it
                        pixel += '"';
                    }
                    break;
                }
            }

            return pixel;
        }

        /**
         * @name paint
         * @desc called to do the actual painting
         * @returns {void}
         */
        function paint() {
            var column,
                pixelComponents = [];

            if (scope.gridConfigurations.config) {
                for (column in scope.gridConfigurations.config) {
                    if (
                        scope.gridConfigurations.config[column][
                            'selection-type'
                        ] === 'database' &&
                        (!scope.gridConfigurations.config[column].selections ||
                            scope.gridConfigurations.config[column].selections
                                .length === 0)
                    ) {
                        pixelComponents = pixelComponents.concat(
                            {
                                meta: true,
                                type: 'frame',
                                components: [scope.frame],
                            },
                            {
                                type: 'select2',
                                components: [
                                    [
                                        {
                                            alias: column,
                                        },
                                    ],
                                ],
                            },
                            {
                                type: 'collect',
                                components: [-1],
                                terminal: true,
                            }
                        );
                    }
                }
            }

            if (pixelComponents.length === 0) {
                let schema = scope.localChartData.keys.map(_buildSchema),
                    data = scope.localChartData.values.map(_buildGridData);
                schema.unshift({
                    headerName: 'Delete',
                    field: 'Delete',
                    width: 65,
                    pinned: 'left',
                    colId: 'Delete',
                    cellRenderer: function () {
                        return '<i class="fa fa-trash-o"></i>';
                    },
                    cellStyle: {
                        'text-align': 'center',
                    },
                    editable: false,
                });
                schema.unshift({
                    headerName: '',
                    field: 'row_index',
                    pinned: 'left',
                    colId: 'row_index',
                    width: 60,
                    valueGetter: function (row) {
                        return row.node.rowIndex + 1;
                    },
                    editable: false,
                });
                scope.gridOptions.api.setColumnDefs(schema);
                scope.gridOptions.api.setRowData(data);
            } else {
                let callback = function (response) {
                    var tempData = response.pixelReturn[0].output.data,
                        responseIdx;
                    for (
                        responseIdx = 0;
                        responseIdx < response.pixelReturn.length;
                        responseIdx++
                    ) {
                        tempData =
                            response.pixelReturn[responseIdx].output.data;
                        // set the instances to the config obj and we will use it in the build schema function
                        scope.gridConfigurations.config[
                            tempData.headers[0]
                        ].selections = [].concat.apply([], tempData.values);
                    }
                    let schema = scope.localChartData.keys.map(_buildSchema),
                        data = scope.localChartData.values.map(_buildGridData);
                    schema.unshift({
                        headerName: 'Delete',
                        field: 'Delete',
                        width: 60,
                        pinned: 'left',
                        colId: 'Delete',
                        cellRenderer: function () {
                            return '<i class="fa fa-trash-o"></i>';
                        },
                        cellStyle: {
                            'text-align': 'center',
                        },
                        editable: false,
                    });
                    schema.unshift({
                        headerName: '',
                        field: 'row_index',
                        pinned: 'left',
                        colId: 'row_index',
                        width: 60,
                        valueGetter: function (row) {
                            return row.node.rowIndex + 1;
                        },
                        editable: false,
                    });
                    scope.gridOptions.api.setColumnDefs(schema);
                    scope.gridOptions.api.setRowData(data);
                };

                scope.widgetCtrl.meta(pixelComponents, callback);
            }
        }

        /**
         * @name _buildSchema
         * @param {object} key - semoss data key
         * @desc build schema objects for canvas data grid based on semoss data keys
         * @return {object} canvas data grid object
         */
        function _buildSchema(key) {
            var schema = {
                headerName: key.alias,
                field: key.alias,
                colId: key.alias,
                cellStyle: setCellStyle,
                valueParser: function (params) {
                    if (angular.isNumber(params.oldValue)) {
                        return Number(params.newValue);
                    }

                    return params.newValue;
                },
            };

            if (
                scope.gridConfigurations &&
                scope.gridConfigurations.config &&
                scope.gridConfigurations.config[key.alias] &&
                scope.gridConfigurations.config[key.alias]['read-only']
            ) {
                schema.editable = false;
            }

            // make column into dropdown selections
            if (
                scope.gridConfigurations &&
                scope.gridConfigurations.config &&
                scope.gridConfigurations.config[key.alias] &&
                scope.gridConfigurations.config[key.alias].selections
            ) {
                schema.cellEditor = 'agSelectCellEditor';
                schema.cellEditorParams = {
                    values: scope.gridConfigurations.config[key.alias]
                        .selections,
                };
            }

            return schema;
        }

        /**
         * @name _buildGridData
         * @param {[][]} values - semoss data values
         * @desc build canvas data grid objects from semoss data values
         * @return {object} canvas data grid object
         */
        function _buildGridData(values) {
            var row = {};

            values.forEach(function (val, idx) {
                row[scope.localChartData.keys[idx].alias] = val;
            });

            return row;
        }

        /**
         * @name _scrollEvent
         * @desc add the scroll event
         * @param {event} e - canvas data event
         * @returns {void}
         */
        function _scrollEvent() {
            var scrollContainer = scope.chartDiv.querySelector(
                    '.ag-full-width-container'
                ),
                bottomScrollPosition =
                    scope.gridOptions.api.getVerticalPixelRange().bottom;

            if (
                0.9 * scrollContainer.scrollHeight <= bottomScrollPosition &&
                previousScroll < bottomScrollPosition &&
                scope.localChartData.values.length > 0
            ) {
                // if (0.8 * scrollContainer.scrollHeight <= e.top && previousScroll < e.top) {
                if (scope.taskHasMoreData) {
                    if (!scope.busyLoading) {
                        scope.busyLoading = true;

                        let callback = function (response) {
                            var values =
                                response.pixelReturn[0].output.data.values;
                            scope.taskId =
                                response.pixelReturn[0].output.taskId;
                            scope.localChartData.values =
                                scope.localChartData.values.concat(values);
                            scope.totalCollectionAmount +=
                                scope.collectionAmount;

                            if (
                                response.pixelReturn[0].output.numCollected <
                                scope.collectionAmount
                            ) {
                                scope.taskHasMoreData = false;
                            }

                            paint();
                            scope.busyLoading = false;
                            scope.widgetCtrl.emit('update-search-map');
                        };

                        scope.widgetCtrl.meta(
                            [
                                {
                                    type: 'task',
                                    components: [scope.taskId],
                                },
                                {
                                    type: 'collect',
                                    components: [scope.collectionAmount],
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
         * @name renderCellEvent
         * @desc add a rendercell event
         * @param {event} e - canvas data event
         * @returns {void}
         */
        function setCellStyle(e) {
            var i,
                style = {};

            for (i = 0; i < scope.history.actions.length; i++) {
                const action = scope.history.actions[i];

                if (action.type === 'delete') {
                    continue;
                }

                if (
                    e.value === action.newRow[action.columnName] &&
                    _rowMatches(e.data, action.currentRow)
                ) {
                    style = {
                        'background-color': '#f9A825',
                    };
                }

                // new row highlight
                if (
                    action.type === 'insert' &&
                    _rowMatches(e.data, action.newRow)
                ) {
                    style = {
                        'background-color': '#f9A825',
                    };
                }
            }

            return style;
        }

        /**
         * @name _rowMatches
         * @param {object} rowA - canvas data grid row object
         * @param {object} rowB - canvas data grid row object
         * @desc determines if rowA matches rowB
         * @return {boolean} true if match false otherwise
         */
        function _rowMatches(rowA, rowB) {
            var rowsMatch = true,
                i,
                tempA = semossCoreService.utility.freeze(rowA),
                tempB = semossCoreService.utility.freeze(rowB);

            for (i in tempA) {
                if (tempA.hasOwnProperty(i)) {
                    // convert tempA to string so we do proper comparison...FE stores it as string but it goes into the db and imported into frame as its original data type.
                    if (tempA[i] + '' !== tempB[i] + '') {
                        rowsMatch = false;
                        break;
                    }
                }
            }

            return rowsMatch;
        }

        /**
         * @name _setLocalChartData
         * @param {object} data - semoss data
         * @param {object[]} keys - semoss data keys
         * @return {void}
         */
        function _setLocalChartData(data, keys) {
            var tempSortOptions;

            scope.localChartData = {
                values: data.values,
                keys: keys.map(function (key) {
                    key.raw = key.alias;

                    return key;
                }),
            };

            tempSortOptions = semossCoreService.utility.freeze(
                scope.localChartData.keys
            );
            // tempSortOptions.shift();

            if (
                scope.sortOptions.options.length === 0 &&
                !scope.sortOptions.selected
            ) {
                scope.sortOptions = {
                    options: tempSortOptions,
                    selected: tempSortOptions[0].alias,
                };
            }

            if (
                scope.filterOptions.options.length === 0 &&
                !scope.filterOptions.selectedColumn
            ) {
                scope.filterOptions = {
                    taskId: '',
                    options: tempSortOptions,
                    selectedColumn: tempSortOptions[0].alias,
                    instanceOptions: [],
                    selectedInstances: [],
                };
            }

            scope.localChartData.keys.forEach(function (key) {
                scope.newRow[key.alias] = '';
            });
        }

        /**
         * @name showFilter
         * @desc show the filter overlay
         * @returns {void}
         */
        function showFilter() {
            if (!scope.filterOptions.selectedColumn) {
                scope.filterOptions.selectedColumn =
                    scope.filterOptions.options[0].alias;
            }
            scope.isFiltering = true;
            if (scope.filterOptions.instanceOptions.length === 0) {
                getInstances();
            }
        }

        /**
         * @name getInstance
         * @param {string} searchTerm the search term to use to search the list of instances
         * @desc get the instances for the selected filter column
         * @returns {void}
         */
        function getInstances(searchTerm) {
            var callback,
                pixelComponents = [
                    {
                        meta: true,
                        type: 'select2',
                        components: [
                            [
                                {
                                    selector:
                                        scope.filterOptions.selectedColumn,
                                    alias: scope.filterOptions.selectedColumn,
                                },
                            ],
                        ],
                    },
                ],
                filterOptions = {},
                searchTerms = [],
                cleanedTerm = searchTerm;

            if (searchTerm) {
                searchTerms.push(cleanedTerm);
                // search values with underscore as well if there are spaces in the search term
                if (cleanedTerm !== cleanedTerm.replace(/ /g, '_')) {
                    searchTerms.push(cleanedTerm.replace(/ /g, '_'));
                }

                filterOptions[scope.filterOptions.selectedColumn] = {
                    comparator: '?like',
                    value: searchTerms,
                };
                pixelComponents.push({
                    type: 'filter',
                    components: [filterOptions],
                });
            }
            pixelComponents.push({
                type: 'collect',
                components: [100],
                terminal: true,
            });

            scope.filterOptions.instanceOptions = [];
            scope.filterOptions.selectedInstances = [];

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    idx;
                scope.filterOptions.taskId = output.taskId;
                if (output.data.values) {
                    for (idx = 0; idx < output.data.values.length; idx++) {
                        scope.filterOptions.instanceOptions.push(
                            output.data.values[idx][0]
                        );
                    }
                }
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        function getMoreInstances() {
            var callback;

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    idx;
                if (output.data.values) {
                    for (idx = 0; idx < output.data.values.length; idx++) {
                        scope.filterOptions.instanceOptions.push(
                            output.data.values[idx][0]
                        );
                    }
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'task',
                        components: [scope.filterOptions.taskId],
                    },
                    {
                        type: 'collect',
                        components: [100],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name showSort
         * @desc shows sort panel, needs timeout to trigger digest
         * @return {void}
         */
        function showSort() {
            $timeout(function () {
                scope.isSorting = true;
            });
        }

        /**
         * @name displayInsertRow
         * @param {boolean} show - show or hide panel
         * @desc shows insert row panel, needs timeout to trigger digest
         * @return {void}
         */
        function displayInsertRow(show) {
            $timeout(function () {
                scope.isInsertingRow = show;
            });
        }

        /**
         * @name hideDeleteRow
         * @desc hides the delete panel, needs timeout to trigger digest
         * @return {void}
         */
        function hideDeleteRow() {
            $timeout(function () {
                scope.isDeletingRow = false;
            });
        }

        /**
         * @name _showDelete
         * @param {object} e - canvas data grid event object
         * @desc shows the delete panel and sets the row to delete,
         *       needs timeout to trigger digest
         * @return {void}
         */
        function _showDelete(e) {
            if (e.colDef.field === 'Delete') {
                $timeout(function () {
                    scope.isDeletingRow = true;
                    scope.rowToDelete = {
                        value: e.node.id,
                        display: Number(e.node.id) + 1,
                    };
                });
            }
        }

        /**
         * @name getGrid
         * @desc returns the canvas data grid instance. used in grid-delta-search
         * @return {object} canvas data grid instance
         */
        function getGrid() {
            return scope.grid;
        }

        /**
         * @name initialize
         * @returns {void}
         * @desc initialize gets called from chart and is where the data manipulation happens for the viz
         */
        function initialize() {
            var callback;

            // set the grid configs to be used
            scope.gridConfigurations = semossCoreService.getWidget(
                scope.widgetCtrl.widgetId,
                'view.grid-delta.options'
            );
            // if you change HTML confirm this is <div id="chart-container"></div>
            scope.chartDiv = ele[0].firstElementChild.childNodes[3];
            scope.chartDiv.className += ' ag-theme-balham';
            updateTaskListener = scope.widgetCtrl.on('update-task', setData);
            addDataListener = scope.widgetCtrl.on('added-data', setData);

            callback = function (res) {
                var appIdx,
                    selectedAppId = '';
                scope.apps = res.pixelReturn[0].output.filter(function (app) {
                    return (
                        CONNECTORS[app.app_subtype] && 
                        CONNECTORS[app.app_subtype].type === 'RDBMS'
                    );
                });

                if (scope.gridConfigurations.database) {
                    for (appIdx = 0; appIdx < scope.apps.length; appIdx++) {
                        if (
                            scope.apps[appIdx].app_id ===
                            scope.gridConfigurations.database
                        ) {
                            scope.selectedApp = scope.apps[appIdx];
                        }
                    }
                    setTable();

                    if (scope.gridConfigurations.table) {
                        scope.selectedApp.app_table =
                            scope.gridConfigurations.table;
                        setData();
                    }
                }

                // if no app selected, we will see what app they came from and select it
                if (!scope.selectedApp || !scope.selectedApp.app_id) {
                    selectedAppId = semossCoreService.app.get('selectedApp');
                    if (selectedAppId) {
                        for (appIdx = 0; appIdx < scope.apps.length; appIdx++) {
                            if (scope.apps[appIdx].app_id === selectedAppId) {
                                scope.selectedApp = scope.apps[appIdx];
                                setTable();
                            }
                        }
                    }
                }
            };

            scope.widgetCtrl.query(
                [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );

            // when directive ends, make sure to clean out excess listeners and dom elements outside of the scope
            scope.$on('$destroy', function () {
                if (scope.gridOptions.api) {
                    scope.gridOptions.api.destroy();
                }
                updateTaskListener();
                addDataListener();
                scope.chartDiv.innerHTML = '';
            });
        }

        /**
         * @name setTable
         * @desc runs once database has been selected so user can choose a table
         * @return {void}
         */
        function setTable() {
            var callback;

            callback = function (response) {
                scope.localStore.sortInfo = false;
                scope.tables = response.pixelReturn[0].output;

                if (
                    !scope.selectedApp.app_table &&
                    scope.selectedApp &&
                    scope.selectedApp.app_id
                ) {
                    scope.selectedApp.app_table = scope.tables[0];
                    setData();
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getDatabaseConcepts',
                        components: [scope.selectedApp.app_id],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name setData
         * @desc setData for the visualization and paints
         * @returns {void}
         */
        function setData() {
            var callback;

            // reset the actions
            scope.history = {
                readOnly: [0],
                actions: [],
                actionIndex: -1,
            };

            callback = function (response) {
                var pixelComponents,
                    output,
                    i,
                    filterOptions = {},
                    callback2;

                scope.localStore.sortInfo = false;
                scope.frame = semossCoreService.utility.random('FRAME');
                scope.selectors = [];

                output = response.pixelReturn[0].output.filter(function (
                    selector
                ) {
                    return selector[0] === scope.selectedApp.app_table;
                });

                for (i = 0; i < output.length; i++) {
                    scope.selectors.push({
                        alias:
                            '"' + String(output[i][1]).replace(/_/g, ' ') + '"',
                        selector: output[i][3]
                            ? output[i][1]
                            : output[i][0] + '__' + output[i][1],
                        column: output[i][1],
                    });
                }

                pixelComponents = [
                    {
                        meta: true,
                        type: 'createSource',
                        components: ['Frame', 'GRID', scope.frame, true],
                        terminal: true,
                    },
                    {
                        type: 'database',
                        components: [scope.selectedApp.app_id],
                    },
                    {
                        type: 'select2',
                        components: [scope.selectors],
                    },
                    {
                        type: 'import',
                        components: [scope.frame],
                        terminal: true,
                    },
                    {
                        type: 'frame',
                        components: [scope.frame],
                    },
                    {
                        type: 'queryAll',
                        components: [],
                    },
                ];

                if (scope.sortDetails.column) {
                    pixelComponents.push({
                        type: 'sort',
                        components: [
                            [scope.sortDetails.column],
                            [scope.sortDetails.direction],
                        ],
                    });
                } else {
                    pixelComponents.push({
                        type: 'sort',
                        components: [[scope.selectors[0].column], ['asc']],
                    });
                }

                if (
                    scope.filterOptions.selectedColumn &&
                    scope.filterOptions.selectedInstances &&
                    scope.filterOptions.selectedInstances.length > 0
                ) {
                    filterOptions[scope.filterOptions.selectedColumn] = {
                        comparator: '==',
                        value: scope.filterOptions.selectedInstances,
                    };
                    pixelComponents.push({
                        type: 'filter',
                        components: [filterOptions],
                    });
                }

                pixelComponents.push({
                    type: 'collect',
                    components: [scope.totalCollectionAmount],
                    terminal: true,
                });

                callback2 = function (responseData) {
                    var keys = responseData.pixelReturn[2].output.headerInfo,
                        data = responseData.pixelReturn[2].output.data;
                    scope.taskId = responseData.pixelReturn[2].output.taskId;

                    if (
                        responseData.pixelReturn[2].output.numCollected <
                        scope.collectionAmount
                    ) {
                        scope.taskHasMoreData = false;
                    }
                    if (data.values.length === 0) {
                        // add in empty data so the grid will paint
                    }

                    // need to remove so that the sort options
                    // and the filter options get reset
                    scope.sortOptions.options.length = [];
                    scope.sortOptions.selected = undefined;
                    scope.filterOptions.options.length = [];
                    scope.filterOptions.selectedColumn = undefined;

                    _setLocalChartData(data, keys);

                    if (!scope.grid) {
                        scope.grid = new Grid(
                            scope.chartDiv,
                            scope.gridOptions
                        );
                        _addGridEvents();
                    }

                    paint();
                };

                scope.widgetCtrl.meta(pixelComponents, callback2);
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getDatabaseTableStructure',
                        components: [scope.selectedApp.app_id],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name updateData
         * @param {any[]} values - grid values
         * @desc updates values and paints, used in grid-delta-sort
         * @return {void}
         */
        function updateData(values) {
            scope.localChartData.values = values;
            paint();
        }

        /**
         * @name navigate
         * @param {*} direction the direction to navigate
         * @desc sets up the pixel to undo/redo the changes in the frame
         * @returns {void}
         */
        function navigate(direction) {
            var pixelComponents = [],
                callback;

            pixelComponents = pixelComponents.concat(_getNewFramePixel());

            if (direction === 'undo') {
                // if it's less than 0 don't do anything
                if (
                    !scope.history.actions[scope.history.actionIndex - 1] &&
                    scope.history.actionIndex !== 0
                ) {
                    return;
                }

                scope.history.actions[scope.history.actionIndex].active = false;
                scope.history.actionIndex--;
                pixelComponents = pixelComponents.concat(
                    _getActionPixels(scope.history.actionIndex + 1)
                );
                _updateActionData(
                    semossCoreService.utility.freeze(
                        scope.history.actions[scope.history.actionIndex + 1]
                            .currentRow
                    ),
                    semossCoreService.utility.freeze(
                        scope.history.actions[scope.history.actionIndex + 1]
                            .oldRow
                    )
                );
            } else if (direction === 'redo') {
                // if it goes beyong # of changes, don't do anything
                if (!scope.history.actions[scope.history.actionIndex + 1]) {
                    return;
                }

                scope.history.actionIndex++;
                scope.history.actions[scope.history.actionIndex].active = true;
                pixelComponents = pixelComponents.concat(
                    _getActionPixels(scope.history.actionIndex + 1)
                );
                _updateActionData(
                    semossCoreService.utility.freeze(
                        scope.history.actions[scope.history.actionIndex]
                            .currentRow
                    ),
                    semossCoreService.utility.freeze(
                        scope.history.actions[scope.history.actionIndex].newRow
                    )
                );
            } else if (direction === 'refresh') {
                pixelComponents = pixelComponents.concat(
                    _getActionPixels(scope.history.actions.length)
                );
            }

            pixelComponents = pixelComponents.concat(_getGridDataPixel());

            callback = function (response) {
                var lastTaskId = response.pixelReturn.length - 1,
                    keys = response.pixelReturn[lastTaskId].output.headerInfo,
                    data = response.pixelReturn[lastTaskId].output.data,
                    lastAction = response.pixelReturn.length - 2;
                scope.taskId = response.pixelReturn[lastTaskId].output.taskId;
                scope.isSorting = false;
                scope.isFiltering = false;
                if (
                    response.pixelReturn[lastTaskId].output.numCollected <
                    scope.collectionAmount
                ) {
                    scope.taskHasMoreData = false;
                }

                _setLocalChartData(data, keys);
                const gridData =
                    scope.localChartData.values.map(_buildGridData);
                if (scope.gridOptions.api) {
                    scope.gridOptions.api.setRowData(gridData);
                }

                if (
                    response.pixelReturn[lastAction].operationType.indexOf(
                        'ERROR'
                    ) > -1
                ) {
                    scope.history.actions.splice(
                        scope.history.actions.length - 1,
                        1
                    );
                    scope.history.actionIndex--;
                }
                $timeout(function () {
                    scope.widgetCtrl.emit('update-search-map');
                });
            };

            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name sort
         * @param {object} direction direction of the sort; asc or desc
         * @desc sort the grid
         * @returns {void}
         */
        function sort(direction) {
            var sortDetails = {
                column: scope.sortOptions.selected,
                direction: direction,
            };
            scope.sortDetails = sortDetails;

            navigate('refresh');
        }

        /**
         * @name filter
         * @desc filter the grid delta
         * @returns {void}
         */
        function filter() {
            navigate('refresh');
        }

        /**
         * @name _addGridEvents
         * @desc adds canvas data grid specific events
         * @return {void}
         */
        function _addGridEvents() {
            if (scope.gridOptions.api) {
                scope.gridOptions.api.addEventListener(
                    'bodyScroll',
                    _scrollEvent
                );
                scope.gridOptions.api.addEventListener(
                    'cellClicked',
                    _showDelete
                );
                scope.gridOptions.api.addEventListener(
                    'cellValueChanged',
                    validateInput
                );
                scope.gridOptions.api.addEventListener(
                    'cellValueChanged',
                    _updateCell
                );
                scope.gridOptions.api.addEventListener(
                    'cellEditingStopped',
                    function () {
                        if (scope.isSaving) {
                            scope.isSaving = false;

                            saveChanges();
                        }
                    }
                );
            }
        }

        initialize();
    }
}
