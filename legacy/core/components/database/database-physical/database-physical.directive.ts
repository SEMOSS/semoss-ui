'use strict';

import angular from 'angular';
import '../database-user/database-user.directive.ts';
import '../database-details/database-details.directive.ts';
import '../../metamodel/metamodel.directive.ts';

import { GRAPH_TYPES } from '../../../constants.js';

import './database-physical.scss';

export default angular
    .module('app.database.database-physical', ['app.metamodel.directive'])
    .directive('databasePhysical', databasePhysicalDirective);

databasePhysicalDirective.$inject = [
    '$transitions',
    '$stateParams',
    '$ocLazyLoad',
    'semossCoreService',
];

function databasePhysicalDirective(
    $transitions,
    $stateParams,
    $ocLazyLoad,
    semossCoreService: SemossCoreService
) {
    databasePhysicalCtrl.$inject = [];
    databasePhysicalLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: ['^database'],
        restrict: 'E',
        template: require('./database-physical.directive.html'),
        controllerAs: 'databasePhysical',
        scope: {},
        bindToController: {},
        controller: databasePhysicalCtrl,
        link: databasePhysicalLink,
    };

    function databasePhysicalCtrl() {}

    function databasePhysicalLink(scope, ctrl) {
        // let metamodelGraphEle: HTMLElement,
        //     metamodelEle: HTMLElement,
        //     matchArray: any[] = [],
        //     zoom;

        const defaultOptions =
            semossCoreService.visualization.getDefaultOptions();

        scope.databaseCtrl = ctrl[0];

        // scope for getMetamodel data
        scope.databasePhysical.localChangesApplied = false;

        scope.databasePhysical.appInfo = {};
        scope.databasePhysical.information = {
            type: '',
            original: {
                tables: {},
                relationships: [],
            },
            metamodel: {
                // containers rendered information
                tables: {},
                relationships: [],
                externalChangesApplied: false,
                searched: '',
            },
            external: {
                open: false,
                reset: true,
                viewOptions: [],
                viewModel: [],
                tableOptions: [],
                tableModel: [],
            },
            allTables: {},
            showEditTables: false,
            showAddColumns: false,
            showEditRelationships: false,
            showEditTable: false,
            showEditColumn: false,
            showEditColumnTable: false,
            selectedTable: false,
            // selectedColumn: false,
            externalDb: false,
        };
        scope.databasePhysical.tableColumns = {}; // help model table columns

        // scope for Modify DB UI
        scope.databasePhysical.display = '';
        scope.databasePhysical.headers = [];
        scope.databasePhysical.values = [];
        // scope.databasePhysical.addColumn = addColumn;
        scope.databasePhysical.newColumnArray = []; // to store columns to be added
        scope.databasePhysical.executeColumnQuery = executeColumnQuery;
        scope.databasePhysical.queryValue = ''; // holds query from Modify Data UI
        scope.databasePhysical.operation = '';

        // Add Columns / Delete Columns: Column info for Tables
        scope.databasePhysical.columnsInformation = {
            table: '',
            options: [],
            model: [],
            selectedToDelete: [],
            headers: [
                'name',
                'type',
                'format',
                'default value',
                'primary',
                'null',
            ], // used for UI table when visualizing column's to be edited/deleted/added
            subheaders: ['name', 'type', 'primary'],
        };

        // MODIFY TABLE BUTTON CLICK
        scope.databasePhysical.showModifyTable = false; // handles show/hide html
        scope.databasePhysical.closeModifyTable = closeModifyTable; // cancel and close overlay

        // modify table: edit columns
        // scope.databasePhysical.dbTables = dbTables;
        scope.databasePhysical.dbTables = {}; // store db tables to assist with data manipulation / selection
        scope.databasePhysical.dbColumnOptions = {}; // store column options to assist with data manipulation / selection

        scope.databasePhysical.modifyTable = {
            // manage modifications
            newTableName: '',
            table: '',
            colsToAdd: [], // tracks cols to add to this existing table
            colsToDelete: [],
            colOptions: [], // tracks column object options to be displayed in UI
            existingColumns: [], // tracks column names that exist in table
            newColumn: {
                operation: '',
                alias: '',
                column: '',
                description: '',
                table: '',
                type: '',
                typeFormat: '',
                valid: false,
            },
        };
        scope.databasePhysical.dbTableOptions = []; // store table options for db
        scope.databasePhysical.modifyTable.tableSelectedHandler =
            tableSelectedHandler; // handles setting the table to update col options and checking if col is valid after selecting table

        // Handle Add Columns functionality within Modify Table
        scope.databasePhysical.showColAdd = false; // show/hide Add Column overlay
        scope.databasePhysical.cancelColumnAdd = cancelColumnAdd; // cancel column add overlay and reset data
        scope.databasePhysical.dataTypeOptions = defaultOptions; // data type options for column modifications
        scope.databasePhysical.modifyTable.addNewColumn = addNewColumn;
        scope.databasePhysical.modifyTable.validateNewColumn =
            validateNewColumn;
        scope.databasePhysical.modifyTable.saveNewColumns = saveNewColumns; // execute pixel to add columns to table in physical db
        scope.databasePhysical.removeColumn = removeColumn; // remove column from columns to delete / add list

        // Handle Delete Columns functionality within Modify Table
        scope.databasePhysical.modifyTable.showColDelete = false; // show/hide Delete Column overlay
        scope.databasePhysical.handleColDeleteChange = handleColDeleteChange; // manages colsToDelete array on change

        // Handle Edit Table Info: Name, Description, Type
        scope.databasePhysical.modifyTable.showEditTableName = false; // show/hide overlay
        scope.databasePhysical.modifyTable.cancelChangeTableName =
            cancelChangeTableName;
        scope.databasePhysical.modifyTable.changeTableName = changeTableName;

        // ADD TABLE BUTTON CLICK
        scope.databasePhysical.showAddTable = false;
        scope.databasePhysical.dbTypeOptions = '';
        scope.databasePhysical.addTable = {
            // store info for new table to be added
            newTable: {
                operation: '',
                alias: '',
                table: '',
                description: '',
                columns: [],
                colsToAdd: [], // tracks columns to add to this new table
                db: '',
                type: '',
                dbTypeOptions: scope.databasePhysical.dbTypeOptions || '',
            },
            newColumn: {
                operation: '',
                alias: '',
                column: '',
                description: '',
                table: '',
                type: '',
                typeFormat: '',
                valid: false,
                isPrimKey: false,
                canBeNull: false,
            },
        };
        scope.databasePhysical.validateNewTableColumn = validateNewTableColumn; // method to validate new table's column which is triggered by on change event
        scope.databasePhysical.addTable.addNewTableColumn = addNewTableColumn; // method to add column to list of columns to be added to the new table
        scope.databasePhysical.addTable.cancelNewTableColumn =
            cancelNewTableColumn; // method to remove column from list of columns to be added to the new table
        scope.databasePhysical.cancelNewTable = cancelNewTable; // closes the Add Table overlay
        scope.databasePhysical.addTable.saveNewTable = saveNewTable; // execute pixel to add table to physical database

        // DELETE TABLE BUTTON CLICK
        scope.databasePhysical.showTableDelete = false; // show/hide overlay
        scope.databasePhysical.tablesToDelete = []; // track list of tables to delete
        scope.databasePhysical.cancelTableDelete = cancelTableDelete; // cancel action and close overlay
        scope.databasePhysical.deleteTables = deleteTables; // execute pixel to delete tables from physical db
        scope.databasePhysical.removeTable = removeTable;
        scope.databasePhysical.tablesInformation = {
            options: [],
            model: [],
            selectedToDelete: [],
        };

        // TABLE GRAPH UI ACTIONS

        // Delete Specific Table directly from TABLE GRAPH UI
        scope.databasePhysical.showConfirmDeleteTable = false; // show/hide overlay
        // uses cancelTableDelete function from above to cancel action and close overlay
        scope.databasePhysical.confirmTableDelete = confirmTableDelete; // execut pixel to delete table from physical db

        // Delete Specific Column directly from TABLE GRAPH UI
        scope.databasePhysical.showConfirmDeleteColumn = false; // show/hide overlay
        // uses modifyTable.colsToDelete[0] to manage column to be deleted
        scope.databasePhysical.cancelColumnDelete = cancelColumnDelete; // cancel action and close overlay
        scope.databasePhysical.confirmColumnDelete = confirmColumnDelete; // execute pixel to delete column from physical db

        // EDIT SPECIFIC TABLE DIRECTLY FROM TABLE GRAPH UI

        // Delete Multiple COLUMNS
        scope.databasePhysical.showConfirmDeleteColumns = false; // show/hide overlay
        scope.databasePhysical.closeShowColDelete = closeShowColDelete; // X clicked close overlay and clear data
        scope.databasePhysical.cancelColumnsDelete = cancelColumnsDelete; // cancel and close overlay
        scope.databasePhysical.deleteColumns = deleteColumns; // execute pixel to delete columns from physical db
        scope.databasePhysical.closeDeleteColumns = closeDeleteColumns; // close overlay and clear data on X click on confirm overlay

        // Edit Specific Column directly from TABLE GRAPH UI
        scope.databasePhysical.editItem = editItem; // passed into metamodel module, handles showing type of data structure to edit (column vs table) and the operation type (edit vs delete)
        scope.databasePhysical.showColEdit = false; // show/hide col edit overlay

        scope.databasePhysical.colToEdit = {
            // tracks info on col edits
            originalName: '',
            name: '',
            originalType: [],
            type: [],
            format: {},
            formatOptions: [],
            table: '',
            primaryKey: null,
            defaultValue: null,
            description: '',
            changeType: false,
            changeName: false,
        };

        scope.databasePhysical.cancelChange = cancelChange; // reset colToEdit and close overlay
        scope.databasePhysical.saveColumnModifications =
            saveColumnModifications; // execute pixel(s) to change column name and/or column type
        // scope.databasePhysical.setTable = setTable;
        scope.databasePhysical.tableColumnOptions = [];
        scope.databasePhysical.colsToDeleteDetailed = []; // help track columns to be deleted

        // FUNCTIONS TO CHANGE COLUMN NAME AND TYPE IN PHYSICAL DB
        scope.databasePhysical.changeColumnName = changeColumnName;
        scope.databasePhysical.changeColumnType = changeColumnType;

        function cancelChangeTableName() {
            scope.databasePhysical.modifyTable.newTableName = '';
            scope.databasePhysical.modifyTable.showEditTableName = false;
        }

        function cancelColumnDelete() {
            scope.databasePhysical.showConfirmDeleteColumn = false;
            scope.databasePhysical.modifyTable.colsToDelete = [];
        }

        function closeShowColDelete() {
            scope.databasePhysical.modifyTable.colsToDelete = [];
            scope.databasePhysical.colsToDeleteDetailed = [];
            scope.databasePhysical.modifyTable.showColDelete = false;
        }

        function closeDeleteColumns() {
            scope.databasePhysical.modifyTable.colsToDelete = [];
            scope.databasePhysical.colsToDeleteDetailed = [];
            scope.databasePhysical.showConfirmDeleteColumns = false;
        }

        /**
         * @name handleColDeleteChange
         * @desc add column object to colsToDeleteDetailed array and manages removal of unchecked columns from colsToDeleteDetailed
         */
        function handleColDeleteChange() {
            const colArr: string[] = [];

            // add cols from colsToDelete to colsToDeleteDetailed
            for (
                let i = 0;
                i < scope.databasePhysical.modifyTable.colsToDelete.length;
                i += 1
            ) {
                const col = scope.databasePhysical.modifyTable.colsToDelete[i];

                const colObject =
                    scope.databasePhysical.information.allTables[
                        scope.databasePhysical.modifyTable.table
                    ].columns[col.column];
                // if colObject already exists on detailed, do nothing
                if (
                    scope.databasePhysical.colsToDeleteDetailed.indexOf(
                        colObject
                    ) > -1
                ) {
                    // no-op
                    // else add colObject to detailed
                } else {
                    scope.databasePhysical.colsToDeleteDetailed.push(colObject);
                }
                // add col to colArr
                colArr.push(col.column);
            }

            // since the actual model for the checklist  modifyTable.colsToDelete, will need to manually remove unchecked cols from colsToDeleteDetailed
            for (
                let i = 0;
                i < scope.databasePhysical.colsToDeleteDetailed.length;
                i += 1
            ) {
                const detailedCol =
                    scope.databasePhysical.colsToDeleteDetailed[i].column;

                // if detailedCol does not exist on colsToDelete, delete detailedCol
                if (colArr.indexOf(detailedCol) === -1) {
                    scope.databasePhysical.colsToDeleteDetailed.splice(i, 1);
                }
            }
        }

        function cancelColumnAdd() {
            scope.databasePhysical.showColAdd = false;
            scope.databasePhysical.modifyTable.colsToAdd = [];

            scope.databasePhysical.modifyTable.newColumn = {
                operation: '',
                alias: '',
                column: '',
                description: '',
                table: '',
                type: '',
                typeFormat: '',
                valid: false,
                isPrimKey: false,
                canBeNull: false,
            };
        }

        function cancelChange() {
            // reset colToEdit
            scope.databasePhysical.colToEdit = {
                name: '',
                type: [],
                format: {},
                formatOptions: [],
                table: '',
                primaryKey: null,
                defaultValue: null,
                description: '',
            };
            scope.databasePhysical.showColEdit = false;
        }

        // scope.databasePhysical.information.metamodel.switchTableZoom = switchTableZoom;
        // scope.databasePhysical.information.metamodel.tableZoom = tableZoom;
        // scope.databasePhysical.information.metamodel.searchMetamodel = searchMetamodel;

        //  /**
        //  * @name tableZoom
        //  * @desc move the zoom to the next search match
        //  */
        //  function tableZoom(table): void {
        //     const clientRect = table.tableEle.getBoundingClientRect();
        //     let cx = clientRect.left + clientRect.width / 2;
        //     let cy = clientRect.top + clientRect.height / 2;

        //     const container = metamodelEle.getBoundingClientRect();
        //     cx = cx - container.left;
        //     cy = cy - container.top;
        //     const dx = container.width / 2 - cx;
        //     const dy = container.height / 2 - cy;

        //     zoom.moveBy(dx, dy, true);
        // }

        //   /**
        //  * @name switchTableZoom
        //  * @param {event} $event - DOM event
        //  * @desc zoom to next table element when enter key pressed - handles keydown events for search element
        //  * @returns {void}
        //  */
        //   function switchTableZoom() {
        //     let firstSelection = true,
        //         lastTable;

        //     if (scope.databasePhysical.information.searched) {
        //         for (let i = 0; i < matchArray.length - 1; i++) {
        //             const table = matchArray[i];
        //             if (table.selected) {
        //                 firstSelection = false;
        //                 // reset old match
        //                 table.selected = false;
        //                 matchArray[i].tableEle.style.border = 'none';
        //                 // set next match
        //                 matchArray[i + 1].selected = true;
        //                 matchArray[i + 1].tableEle.style.border =
        //                     '1px solid #000000';
        //                 tableZoom(matchArray[i + 1]);
        //                 return;
        //             }
        //         }
        //         // start loop over if last match is currently selected
        //         if (matchArray.length > 0) {
        //             lastTable = matchArray[matchArray.length - 1];
        //             if (lastTable.selected) {
        //                 lastTable.selected = false;
        //                 firstSelection = true;
        //             }
        //         }
        //         // for first match or last match, select the first in the array
        //         if (matchArray.length > 0 && firstSelection) {
        //             matchArray[0].selected = true;
        //             matchArray[0].tableEle.style.border = '1px solid #000000';
        //             // console.log('match array: ', matchArray)
        //             tableZoom(matchArray[0]);
        //         }
        //     }
        // }

        // /**
        //  * @name searchMetamodel
        //  * @desc search the metamodel
        //  */
        // function searchMetamodel(): void {
        //     if (metamodelGraphEle) {
        //         const tables =
        //             metamodelGraphEle.querySelectorAll<HTMLElement>(
        //                 '[metamodel-alias]'
        //             ) || [];

        //         matchArray = [];
        //         const len = tables.length;
        //         if (len > 0) {
        //             let searchString = scope.metamodel.searched || '';
        //             searchString = searchString
        //                 .toUpperCase()
        //                 .replace(/ /g, '_');

        //             for (let i = 0; i < len; i++) {
        //                 // clear the old
        //                 let temp =
        //                     tables[i].getAttribute('metamodel-alias') || '';
        //                 temp = temp.toUpperCase().replace(/ /g, '_');

        //                 if (
        //                     temp.indexOf(searchString) === -1 ||
        //                     !searchString
        //                 ) {
        //                     tables[i].style.backgroundColor = 'transparent';
        //                     tables[i].style.border = 'none';
        //                 } else {
        //                     tables[i].style.backgroundColor = '#ffff00';
        //                     const newColumn = {
        //                         column: temp,
        //                         tableEle: tables[i],
        //                         selected: false,
        //                     };
        //                     // add exact matches to the top
        //                     if (temp === searchString) {
        //                         matchArray.unshift(newColumn);
        //                     } else {
        //                         matchArray.push(newColumn);
        //                     }
        //                 }
        //             }
        //         }
        //     }
        // }

        /** Edit */
        /** TODO:
         *          1. edit column functionality (currently deletes column)
         *          2. delete table functionality
         *          3* potentially an additional ADD Table button
         *          4* potentially
        /**
          * @name editItem
          * @desc selects a table or column to edit
          * @param type - type of edit (table, column)
          * @param options - options to save
         */
        function editItem(
            type: 'table' | 'column',
            options: any,
            isDelete: boolean,
            colObject: any
        ): void {
            if (type === 'table') {
                // set table to modify
                scope.databasePhysical.modifyTable.table = options.table;
                if (isDelete) {
                    // show deleteTable
                    scope.databasePhysical.showConfirmDeleteTable = true;
                    // scope.databasePhysical.showTableDelete = true;
                } else {
                    // prepare data for modifyTable: update col options
                    tableSelectedHandler();
                    // show modifyTable
                    scope.databasePhysical.showModifyTable = true;
                }
            } else if (type === 'column') {
                scope.databasePhysical.modifyTable.table = options.table;

                // scope.databasePhysical.modifyTable.colOptions = scope.databasePhysical.dbColumnOptions[scope.databasePhysical.modifyTable.table];
                scope.databasePhysical.colOptions =
                    scope.databasePhysical.dbColumnOptions[
                        scope.databasePhysical.modifyTable.table
                    ];

                if (isDelete) {
                    scope.databasePhysical.modifyTable.colsToDelete = [];
                    // build col to delete
                    const colToDel = {
                        alias: options.column,
                        column: options.column,
                        dataTypeOptions: [],
                    };
                    scope.databasePhysical.modifyTable.colsToDelete.push(
                        colToDel
                    );
                    scope.databasePhysical.showConfirmDeleteColumn = true;
                } else {
                    // store current/original column name
                    scope.databasePhysical.colToEdit.originalName =
                        options.column;

                    // update colType
                    // dataTypeOptions: [{display: '', formats: [], value: ''}]
                    // loop over dataTypeOptions, if display matches colType, set type as dataTypeOptions[colType]

                    for (const typeOption of scope.databasePhysical
                        .dataTypeOptions) {
                        // ???have the second conditional bc when calling editDatabasePropertyType it impacts the colType differently???
                        if (
                            typeOption.display.toLowerCase() ===
                                colObject.colType.toLowerCase() ||
                            typeOption.value.toLowerCase() ===
                                colObject.colType.toLowerCase()
                        ) {
                            scope.databasePhysical.colToEdit.type = typeOption;
                            scope.databasePhysical.colToEdit.originalType =
                                typeOption;
                            // scope.databasePhysical.colToEdit.formatOptions = typeOption.formats;

                            break;
                        }
                    }
                    scope.databasePhysical.colToEdit.table = options.table;
                    scope.databasePhysical.colToEdit.name = options.column;
                    scope.databasePhysical.colToEdit.description =
                        colObject.description;

                    // scope.databasePhysical.colToEdit.primaryKey = colObject.isPrimKey;
                    // scope.databasePhysical.colToEdit.type = colObject.colType
                    // scope.databasePhysical.colToEdit.format = colObject.colFormat

                    scope.databasePhysical.showColEdit = true;
                }
            }
        }

        /**
         * TODO: account for other column params like default value, can be null, and primary key
         * @name saveNewTable
         * @desc creates new table and saves it to the db
         */
        function saveNewTable() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // scope.databasePhysical.appInfo = output;
                // getMetamodel();

                // resetColumns(); // call to reset newColumn, newColumnsArray, and close overlay

                scope.databasePhysical.showAddTable = false;
                // reset newTable
                scope.databasePhysical.addTable = {
                    newTable: {
                        operation: '',
                        alias: '',
                        table: '',
                        description: '',
                        columns: [],
                        colsToAdd: [],
                        db: '',
                        type: '',
                        dbTypeOptions:
                            scope.databasePhysical.dbTypeOptions || '',
                    },
                    newColumn: {
                        operation: '',
                        alias: '',
                        column: '',
                        description: '',
                        table: '',
                        type: '',
                        typeFormat: '',
                        valid: false,
                        isPrimKey: false,
                        canBeNull: false,
                    },
                };

                // commented out to force user to go to 'refresh metamodel'
                // initialize();
            });

            // create Cols to add
            const colsToAddObj = {};
            for (
                let i = 0;
                i < scope.databasePhysical.addTable.newTable.colsToAdd.length;
                i++
            ) {
                const colObj =
                    scope.databasePhysical.addTable.newTable.colsToAdd[i];
                colsToAddObj[colObj.column] = colObj.type.value;
            }

            const tableObj = {};
            tableObj[scope.databasePhysical.addTable.newColumn.table] =
                colsToAddObj;

            // add column and type into string and add string to array
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'addDatabaseStructure',
                        components: [scope.databasePhysical.appId, tableObj],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         *
         * @name addNewTableColumn
         * @desc method of addTable that adds new column to list of columns to be added to new table
         */
        function addNewTableColumn() {
            // confirm that the new column does not already exist in the columns to be added

            const col = scope.databasePhysical.addTable.newColumn;
            const colsToAdd =
                scope.databasePhysical.addTable.newTable.colsToAdd;
            const len = colsToAdd.length;
            for (let i = 0; i < len; i++) {
                const colName = colsToAdd[i].column;
                if (colName === col.column) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Column name already exists in columns to be added to this table. Please change column name to proceed.',
                    });
                    return;
                }
            }

            scope.databasePhysical.addTable.newColumn.operation = 'ADD';

            // scope.databasePhysical.newColumnArray.push(scope.databasePhysical.newColumn);
            scope.databasePhysical.addTable.newTable.colsToAdd.push(col);
            // showNewColumn();

            // scope.databasePhysical.newColumnArray = []

            // reset newColumn
            scope.databasePhysical.addTable.newColumn = {
                operation: '',
                alias: '',
                column: '',
                description: '',
                table: scope.databasePhysical.addTable.newColumn.table,
                type: '',
                typeFormat: '',
                valid: false,
                isPrimKey: false,
                canBeNull: false,
            };
            return;
        }

        function closeModifyTable() {
            scope.databasePhysical.showModifyTable = false;
            scope.databasePhysical.modifyTable.table = '';
            return;
        }

        /**
         * @name tableSelectedHandler
         * @desc method on modifyTable, which runs when a table is selected, that: 1. checks if the new column is valid; 2. updates colOptions;  3. adds columns to existing columns
         */
        function tableSelectedHandler() {
            // set table graph search
            scope.databasePhysical.information.metamodel.searched =
                scope.databasePhysical.modifyTable.table;
            // scope.databasePhysical.metamodel.searchMetamodel();
            // scope.databasePhysical.information.metamodel.switchTableZoom();

            // check new column
            // scope.databasePhysical.checkNewColumn();

            // update colOptions based on table selected
            // scope.databasePhysical.modifyTable.colOptions = scope.databasePhysical.dbColumnOptions[scope.databasePhysical.modifyTable.table];
            scope.databasePhysical.colOptions =
                scope.databasePhysical.dbColumnOptions[
                    scope.databasePhysical.modifyTable.table
                ];

            // const cols = scope.databasePhysical.modifyTable.colOptions;
            const cols = scope.databasePhysical.colOptions;
            const len = cols.length;

            // loop through col options, add column to existingColumns array (which tracks column names that exist in table)
            for (let i = 0; i < len; i++) {
                scope.databasePhysical.modifyTable.existingColumns.push(
                    cols[i].column
                );
            }
        }

        /**
         * @name deleteColumns
         * @desc delete columns from table in physical database
         * @return {void}
         */
        function deleteColumns() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // scope.databasePhysical.dbTableOptions = [];

                // reset table
                scope.databasePhysical.modifyTable.table = '';
                // close colDeletion modal
                scope.databasePhysical.modifyTable.showColDelete = false;
                // close modify table modal
                scope.databasePhysical.showModifyTable = false;
                scope.databasePhysical.showConfirmDeleteColumns = false;
                scope.databasePhysical.modifyTable.colsToDelete = [];
                // initialize();
            });
            const colsToDelete =
                scope.databasePhysical.modifyTable.colsToDelete;
            // create array of only col names
            const cols: any = [];
            for (const col of colsToDelete) {
                cols.push(col.column);
            }
            // create array of table names
            // const tableArr: any = [];
            const tableObj = {};

            tableObj[scope.databasePhysical.modifyTable.table] = cols;

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteDatabaseStructure',
                        components: [scope.databasePhysical.appId, tableObj],
                        terminal: true,
                        meta: false,
                    },
                ],
                response: message,
            });
        }

        // replace value for string data type to be VARCHAR
        for (
            let i = 0;
            i < scope.databasePhysical.dataTypeOptions.length;
            i++
        ) {
            if (scope.databasePhysical.dataTypeOptions[i].display == 'String') {
                scope.databasePhysical.dataTypeOptions[i].value = 'VARCHAR';
                // return;
            }
        }

        /**
         * @name cancelNewTable
         * @todo isolate state by functionality (table actions vs column actions i.e. use newTable to track sub-newColumns rather than newColumn or existingColumns)
         * @desc cancels adding a new table and resets the relevant scope
         * @returns
         */
        function cancelNewTable() {
            // close overlay
            scope.databasePhysical.showAddTable = false;
            // reset scope: newColumn, newTable, existing columns
            scope.databasePhysical.addTable = {
                newTable: {
                    operation: '',
                    alias: '',
                    table: '',
                    description: '',
                    columns: [],
                    colsToAdd: [],
                    db: '',
                    type: '',
                    dbTypeOptions: scope.databasePhysical.dbTypeOptions || '',
                },
                newColumn: {
                    operation: '',
                    alias: '',
                    column: '',
                    description: '',
                    table: '',
                    type: '',
                    typeFormat: '',
                    valid: false,
                    isPrimKey: false,
                    canBeNull: false,
                },
            };
        }

        /**
         * @name cancelColumnsDelete
         * @desc modify table method that cancels column deletion modal within modify table view
         */
        function cancelColumnsDelete() {
            // console log
            // reset colsToDelete
            scope.databasePhysical.modifyTable.colsToDelete = [];
            scope.databasePhysical.colsToDeleteDetailed = [];
            // close modal
            scope.databasePhysical.modifyTable.showColDelete = false;
            scope.databasePhysical.showConfirmDeleteColumns = false;
        }

        /**
         * @name removeTable
         * @desc removes selected table from tables selected to delete
         * @param idx index of the table
         * @returns
         */
        function removeTable(idx) {
            // remove the column at the idx from existing column)
            scope.databasePhysical.tablesInformation.selectedToDelete.splice(
                idx,
                1
            );
            return;
        }

        /**
         * @name cancelNewTableColumn
         * @desc removes selected column from columns selected to add to new table
         * @param idx index of the column
         * @returns
         */
        function cancelNewTableColumn(idx) {
            // remove the column at the idx from existing column)
            scope.databasePhysical.addTable.colsToAdd.splice(idx, 1);
            // scope.databasePhysical.existingColumns.splice(idx, 1);
            // scope.databasePhysical.newColumnArray.splice(idx, 1);
            return;
        }

        /**
         * @name removeColumn
         * @desc removes column from list of columns to delete
         * @param idx index of column to delete
         * @param operationType add/delete: used to determine if we are in Add Col overlay or Delete Col overlay
         * @returns
         */
        function removeColumn(idx, operationType) {
            if (operationType === 'delete') {
                if (
                    scope.databasePhysical.modifyTable.colsToDelete.length > 0
                ) {
                    // remove the col selected to be removed
                    scope.databasePhysical.modifyTable.colsToDelete.splice(
                        idx,
                        1
                    );

                    // have to also remove the col from colsToDeleteDetailed array
                    scope.databasePhysical.colsToDeleteDetailed.splice(idx, 1);
                }

                // if after removing this column from the colsToDelete array there are no cols to delete
                if (
                    scope.databasePhysical.modifyTable.colsToDelete.length <
                        1 &&
                    scope.databasePhysical.colsToDeleteDetailed.length < 1
                ) {
                    // close Delete Col overlay
                    scope.databasePhysical.cancelColumnsDelete();
                }

                return;
            }

            // else operationType is 'add'
            // if there are cols to add
            if (scope.databasePhysical.modifyTable.colsToAdd.length > 0) {
                // remove the col selected to be removed
                scope.databasePhysical.modifyTable.colsToAdd.splice(idx, 1);
            }

            // if after removing this column from the colsToAdd array there are no cols to add
            if (scope.databasePhysical.modifyTable.colsToAdd.length < 1) {
                // close Add Col overlay
                scope.databasePhysical.cancelColumnAdd();
            }

            return;
        }

        /**
         * @name confirmColumnDelete
         * @desc delete on column specified by the user
         */
        function confirmColumnDelete() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.databasePhysical.showConfirmDeleteColumn = false;
                scope.databasePhysical.modifyTable.colsToDelete = [];
                // initialize();
            });

            // create array of only col names
            const cols: string[] = [];
            cols.push(
                scope.databasePhysical.modifyTable.colsToDelete[0].column
            );
            // create array of table names
            // const tableArr: any = [];
            const tableObj = {};

            tableObj[scope.databasePhysical.modifyTable.table] = cols;

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteDatabaseStructure',
                        components: [scope.databasePhysical.appId, tableObj],
                        terminal: true,
                        meta: false,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name confirmTableDelete
         * @desc delete one table specified by the user
         */
        function confirmTableDelete() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.databasePhysical.showConfirmDeleteTable = false;
                scope.databasePhysical.modifyTable.table = '';
                // initialize();
            });

            const tableObj = {};
            const table = scope.databasePhysical.modifyTable.table;
            const colArr = Object.keys(
                scope.databasePhysical.information.allTables[table].columns
            );
            tableObj[table] = colArr;

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteDatabaseStructure',
                        components: [scope.databasePhysical.appId, tableObj],
                        terminal: true,
                        meta: false,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name deleteTables
         * @desc deletes selected tables from physical db on click
         */

        function deleteTables() {
            // prompt user with confirmation screen

            // delete tables
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.databasePhysical.showTableDelete = false;
                scope.databasePhysical.tablesInformation.selectedToDelete;

                // initialize();
            });

            // create array of table names
            const tableArr: any = [];
            const tableObj = {};

            for (const table of scope.databasePhysical.tablesInformation
                .selectedToDelete) {
                tableArr.push(table.table);
            }

            // for each table in allTables, build column array
            for (const table of tableArr) {
                const colArr = Object.keys(
                    scope.databasePhysical.information.allTables[table].columns
                );
                tableObj[table] = colArr;
            }

            // add column and type into string and add string to array
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'deleteDatabaseStructure',
                        components: [scope.databasePhysical.appId, tableObj],
                        terminal: true,
                        meta: false,
                    },
                ],
                response: message,
            });
        }

        function cancelTableDelete() {
            // reset table selections
            scope.databasePhysical.tablesInformation.selectedToDelete = [];
            scope.databasePhysical.modifyTable.table = '';
            // hide overlow
            scope.databasePhysical.showTableDelete = false;
            scope.databasePhysical.showConfirmDeleteTable = false;
        }

        /**
         * @name executeColumnQuery
         * @desc execute query to add column(s) to a db
         */
        function executeColumnQuery(): void {
            const message = semossCoreService.utility.random('query-pixel');
            const commandList = [
                {
                    type: 'database',
                    components: [scope.databasePhysical.appId],
                    terminal: false,
                },
                {
                    type: 'query',
                    components: [scope.databasePhysical.queryValue],
                    terminal: false,
                },
                {
                    type: 'execute',
                    components: [],
                    terminal: true,
                },
            ];

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    scope.databasePhysical.display = 'error';
                    scope.databasePhysical.error = output;
                } else {
                    if (output.data) {
                        scope.databasePhysical.headers = output.data.headers;
                        scope.databasePhysical.values = output.data.values;
                        if (scope.databasePhysical.values.length > 0) {
                            scope.databasePhysical.display = 'table';
                        }
                    } else {
                        scope.databasePhysical.display = 'success';
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: commandList,
                response: message,
            });
        }

        /**
         *
         * @name addNewColumn
         * @desc adds validated column to colsToAdd
         */
        function addNewColumn() {
            // by this point, column should already be validated.

            scope.databasePhysical.modifyTable.newColumn.operation = 'ADD';
            scope.databasePhysical.modifyTable.newColumn.table =
                scope.databasePhysical.modifyTable.table;

            // push new column into array of columns to be added to table
            scope.databasePhysical.modifyTable.colsToAdd.push(
                scope.databasePhysical.modifyTable.newColumn
            );

            // reset new column
            scope.databasePhysical.modifyTable.newColumn = {
                operation: '',
                alias: '',
                column: '',
                description: '',
                table: '',
                type: '',
                typeFormat: '',
                valid: false,
                isPrimKey: false,
                canBeNull: false,
            };

            return;
        }

        /**
         * @name saveNewColumns
         * @desc method on modifyTable to save new columns to table
         * @return {void}
         */
        function saveNewColumns() {
            // validate that the columns are still valid:
            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // scope.databasePhysical.appInfo = output;

                // save: 1) externalUpdate, 2) RdbmsExternalUpload, 3) getMetamodel();

                scope.databasePhysical.modifyTable.table = '';
                scope.databasePhysical.modifyTable.colsToAdd = [];
                scope.databasePhysical.showColAdd = false;
                scope.databasePhysical.showModifyTable = false; // do we want to close the modify table modal as well? or keep it for table deletion?
                // scope.databasePhysical.dbTableOptions = [];
                // initialize();
            });

            // create Cols to add
            const colsToAddObj = {};
            for (
                let i = 0;
                i < scope.databasePhysical.modifyTable.colsToAdd.length;
                i++
            ) {
                const colObj = scope.databasePhysical.modifyTable.colsToAdd[i];
                colsToAddObj[colObj.column] = colObj.type.value;
            }
            const tableObj = {};
            tableObj[scope.databasePhysical.modifyTable.table] = colsToAddObj;

            // add column and type into string and add string to array
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'addDatabaseStructure',
                        components: [scope.databasePhysical.appId, tableObj],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name changeTableName
         * @desc makes pixel call to change the table name
         */
        function changeTableName() {
            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // scope.databasePhysical.modyfTable
                scope.databasePhysical.showModifyTable = false;
                scope.databasePhysical.modifyTable = {
                    newTableName: '',
                    table: '',
                    colsToAdd: [], // tracks cols to add to this existing table
                    colsToDelete: [],
                    colOptions: [], // tracks column object options to be displayed in UI
                    existingColumns: [], // tracks column names that exist in table
                    newColumn: {
                        operation: '',
                        alias: '',
                        column: '',
                        description: '',
                        table: '',
                        type: '',
                        typeFormat: '',
                        valid: false,
                    },
                };
                // scope.databasePhysical.dbTableOptions = [];]
                // initialize();
            });

            // create argument to pass
            const currentTableName = scope.databasePhysical.modifyTable.table;
            const newTableName =
                scope.databasePhysical.modifyTable.newTableName;

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'renameTable',
                        components: [
                            scope.databasePhysical.appId,
                            currentTableName,
                            newTableName,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }
        /**
         * @name changeColumnName
         * @desc makes pixel call to change the column name
         */
        function changeColumnName() {
            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // scope.databasePhysical.appInfo = output;

                // save: 1) externalUpdate, 2) RdbmsExternalUpload, 3) getMetamodel();

                scope.databasePhysical.colToEdit = {
                    originalName: '',
                    name: '',
                    type: [],
                    format: {},
                    formatOptions: [],
                    table: '',
                    primaryKey: null,
                    defaultValue: null,
                    description: '',
                };
                scope.databasePhysical.showColEdit = false;
                // scope.databasePhysical.dbTableOptions = [];
                // initialize();
            });

            // change type:
            // create argument to pass
            // concept = table
            const concept = scope.databasePhysical.colToEdit.table;
            const newColumnName = scope.databasePhysical.colToEdit.name;
            const currentColumnName =
                scope.databasePhysical.colToEdit.originalName;

            // column = name
            // dataType = type.display

            // // add column and type into string and add string to array
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'renameColumn',
                        components: [
                            scope.databasePhysical.appId,
                            concept,
                            currentColumnName,
                            newColumnName,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name changeColumnType
         * @desc change column's data type
         * @return {void}
         */
        function changeColumnType() {
            const message = semossCoreService.utility.random('query-pixel');
            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output;
                const type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                // scope.databasePhysical.appInfo = output;

                // save: 1) externalUpdate, 2) RdbmsExternalUpload, 3) getMetamodel();

                scope.databasePhysical.colToEdit = {
                    name: '',
                    type: [],
                    format: {},
                    formatOptions: [],
                    table: '',
                    primaryKey: null,
                    defaultValue: null,
                    description: '',
                };
                scope.databasePhysical.showColEdit = false;
                // scope.databasePhysical.dbTableOptions = [];
                // initialize();
            });

            // change type:
            // create argument to pass
            // concept = table
            const concept = scope.databasePhysical.colToEdit.table;
            const column = scope.databasePhysical.colToEdit.originalName;
            const dataType =
                scope.databasePhysical.colToEdit.type.value.toUpperCase();
            // column = name
            // dataType = type.display

            // // add column and type into string and add string to array
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'editDatabasePropertyDataType',
                        components: [
                            scope.databasePhysical.appId,
                            concept,
                            column,
                            dataType,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name saveColumnModifications
         * @desc saves column modifications
         */
        function saveColumnModifications(): any {
            if (
                scope.databasePhysical.colToEdit.originalType.display !=
                scope.databasePhysical.colToEdit.type.display
            ) {
                // call changeColumnType
                changeColumnType();
            }
            if (
                scope.databasePhysical.colToEdit.originalName !=
                scope.databasePhysical.colToEdit.name
            ) {
                // call changeColumnName
                changeColumnName();
            }

            return;
        }

        /**
         * @name validateNewTableColumn
         * @desc check that new column is valid
         * @returns valid: true if valid, false if not
         */

        // TODO: add columns property to newTable to keep track of newColumnsToAdd and compare new column name against the newColumnsToAdd
        function validateNewTableColumn(): any {
            // if (!scope.databasePhysical.addTable.newColumn.table) {
            //     scope.databasePhysical.addTable.newColumn.table = scope.databasePhysical.addTable.newTable.table;
            // }
            // check that column name does not already exist in list of columns to be added to the existing table
            if (
                scope.databasePhysical.addTable.newTable.colsToAdd.indexOf(
                    scope.databasePhysical.addTable.newColumn.column
                ) >= 0
            ) {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: 'Column name already exists in columns to be added to this table',
                });
                return;
            }
            // check if newColumn has a name, table, and type
            if (
                scope.databasePhysical.addTable.newColumn.column &&
                scope.databasePhysical.addTable.newColumn.table &&
                scope.databasePhysical.addTable.newColumn.type.value
            ) {
                scope.databasePhysical.addTable.newColumn.valid = true;
                // set column.table
            } else {
                scope.databasePhysical.addTable.newColumn.valid = false;
            }

            scope.databasePhysical.addTable.newTable.table =
                scope.databasePhysical.addTable.newColumn.table;

            return;
        }

        /**
         * @name validateNewColumn
         * @desc modifyTable method that checks that new column is valid
         * @returns valid: true if valid, false if not
         */

        // TODO: add columns property to newTable to keep track of newColumnsToAdd and compare new column name against the newColumnsToAdd
        function validateNewColumn(): any {
            // check that column name does not already exists in table
            if (
                scope.databasePhysical.modifyTable.existingColumns.indexOf(
                    scope.databasePhysical.modifyTable.newColumn.column
                ) > -1
            ) {
                semossCoreService.emit('alert', {
                    color: 'warn',
                    text: 'Column name already exists in columns in this table',
                });
                return;
            }

            // chedck that column name does already exist in columns to be added to the table
            for (const col of scope.databasePhysical.modifyTable.colsToAdd) {
                if (
                    col.column ===
                    scope.databasePhysical.modifyTable.newColumn.column
                ) {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'Column name already exists in columns to be added to this table',
                    });
                    return;
                }
            }

            // check if newColumn has a name and type, if so, mark as valid
            if (
                scope.databasePhysical.modifyTable.newColumn.column &&
                scope.databasePhysical.modifyTable.table &&
                scope.databasePhysical.modifyTable.newColumn.type.value
            ) {
                scope.databasePhysical.modifyTable.newColumn.valid = true;
            } else {
                scope.databasePhysical.modifyTable.newColumn.valid = false;
            }
            return;
        }

        /**
         * @name updateNavigation
         * @desc called when a route changes
         * @returns {void}
         */
        function updateNavigation(): void {
            // save the appId
            scope.databasePhysical.appId = $stateParams.database;

            if (!scope.databasePhysical.appId) {
                return;
            }

            getMetamodel();
        }

        /** Metamodel */
        /**
         * @name getMetamodel
         * @desc get a copy of the metamodel
         */
        function getMetamodel(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let output, type;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.databasePhysical.appInfo = output;
                }

                output = response.pixelReturn[1].output;
                scope.databasePhysical.tableColumns.dataTypes =
                    output.dataTypes;
                scope.databasePhysical.tableColumns.physicalTypes =
                    output.physicalTypes;
                type = response.pixelReturn[1].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.databasePhysical.information = {
                        type:
                            GRAPH_TYPES.indexOf(
                                scope.databasePhysical.appInfo.database_type
                            ) > -1
                                ? 'GRAPH'
                                : 'RDBMS',
                        original: {
                            tables: {},
                            relationships: [],
                        },
                        metamodel: {
                            tables: {},
                            relationships: [],
                            externalChangesApplied: false,
                        },
                        external: {
                            open: false,
                            viewOptions: [],
                            viewModel: [],
                            tableOptions: [],
                            tableModel: [],
                        },
                        allTables: {},
                        showEditTables: false,
                        showEditRelationships: false,
                        showEditTable: false,
                        showEditColumn: false,
                        showEditColumnTable: false,
                        // selectedTable: false,
                        // selectedColumn: false,
                        externalDb:
                            GRAPH_TYPES.indexOf(
                                scope.databasePhysical.appInfo.database_type
                            ) > -1
                                ? false
                                : true,
                    };

                    // add the rendered information
                    // add the relationships
                    if (output.edges) {
                        for (
                            let edgeIdx = 0, edgeLen = output.edges.length;
                            edgeIdx < edgeLen;
                            edgeIdx++
                        ) {
                            scope.databasePhysical.information.metamodel.relationships.push(
                                {
                                    fromTable: output.edges[edgeIdx].source,
                                    fromColumn:
                                        output.edges[edgeIdx].sourceColumn ||
                                        '',
                                    toTable: output.edges[edgeIdx].target,
                                    toColumn:
                                        output.edges[edgeIdx].targetColumn ||
                                        '',
                                    alias: output.edges[edgeIdx].relation,
                                }
                            );
                        }
                    }

                    // add the props
                    if (output.nodes) {
                        for (
                            let nodeIdx = 0, nodeLen = output.nodes.length;
                            nodeIdx < nodeLen;
                            nodeIdx++
                        ) {
                            const typeInformation = getTypeInformation(
                                output.dataTypes[
                                    output.nodes[nodeIdx].conceptualName
                                ],
                                output.additionalDataTypes[
                                    output.nodes[nodeIdx].conceptualName
                                ]
                            );

                            scope.databasePhysical.information.metamodel.tables[
                                output.nodes[nodeIdx].conceptualName
                            ] = {
                                alias: output.nodes[nodeIdx].conceptualName,
                                table: output.nodes[nodeIdx].conceptualName,
                                position:
                                    output.positions &&
                                    output.positions[
                                        output.nodes[nodeIdx].conceptualName
                                    ]
                                        ? output.positions[
                                              output.nodes[nodeIdx]
                                                  .conceptualName
                                          ]
                                        : {
                                              top: 0,
                                              left: 0,
                                          },
                                description: output.descriptions[
                                    output.nodes[nodeIdx].conceptualName
                                ]
                                    ? output.descriptions[
                                          output.nodes[nodeIdx].conceptualName
                                      ]
                                    : '',
                                // non-rdbms need type, typeFormat, and logical properties for each table
                                type: typeInformation.type,
                                typeFormat: typeInformation.typeFormat,
                                logical: output.logicalNames[
                                    output.nodes[nodeIdx].conceptualName
                                ]
                                    ? output.logicalNames[
                                          output.nodes[nodeIdx].conceptualName
                                      ]
                                    : [],
                                columns: {},
                            };

                            // All Tables
                            scope.databasePhysical.information.allTables[
                                output.nodes[nodeIdx].conceptualName
                            ] = {
                                alias: output.nodes[nodeIdx].conceptualName,
                                table: output.nodes[nodeIdx].conceptualName,
                                position:
                                    output.positions &&
                                    output.positions[
                                        output.nodes[nodeIdx].conceptualName
                                    ]
                                        ? output.positions[
                                              output.nodes[nodeIdx]
                                                  .conceptualName
                                          ]
                                        : {
                                              top: 0,
                                              left: 0,
                                          },
                                description: output.descriptions[
                                    output.nodes[nodeIdx].conceptualName
                                ]
                                    ? output.descriptions[
                                          output.nodes[nodeIdx].conceptualName
                                      ]
                                    : '',
                                // non-rdbms need type, typeFormat, and logical properties for each table
                                type: typeInformation.type,
                                typeFormat: typeInformation.typeFormat,
                                logical: output.logicalNames[
                                    output.nodes[nodeIdx].conceptualName
                                ]
                                    ? output.logicalNames[
                                          output.nodes[nodeIdx].conceptualName
                                      ]
                                    : [],
                                columns: {},
                            };

                            // NOTE: There may be a PROP that is the same as the TABLE. We overwrite this prop. It is OKAY.
                            for (
                                let propIdx = 0,
                                    propLen =
                                        output.nodes[nodeIdx].propSet.length;
                                propIdx < propLen;
                                propIdx++
                            ) {
                                const column =
                                    output.nodes[nodeIdx].propSet[propIdx];
                                const concept = `${output.nodes[nodeIdx].conceptualName}__${column}`;

                                const typeInformation = getTypeInformation(
                                    output.dataTypes[concept],
                                    output.additionalDataTypes[concept]
                                );

                                scope.databasePhysical.information.metamodel.tables[
                                    output.nodes[nodeIdx].conceptualName
                                ].columns[column] = {
                                    alias: column,
                                    column: column,
                                    table: output.nodes[nodeIdx].conceptualName,
                                    isPrimKey: false,
                                    type: typeInformation.type,
                                    typeFormat: typeInformation.typeFormat,
                                    description: output.descriptions[concept]
                                        ? output.descriptions[concept]
                                        : '',
                                    logical: output.logicalNames[concept]
                                        ? output.logicalNames[concept]
                                        : [],
                                };

                                scope.databasePhysical.information.allTables[
                                    output.nodes[nodeIdx].conceptualName
                                ].columns[column] = {
                                    alias: column,
                                    column: column,
                                    table: output.nodes[nodeIdx].conceptualName,
                                    isPrimKey: false,
                                    type: typeInformation.type,
                                    typeFormat: typeInformation.typeFormat,
                                    description: output.descriptions[concept]
                                        ? output.descriptions[concept]
                                        : '',
                                    logical: output.logicalNames[concept]
                                        ? output.logicalNames[concept]
                                        : [],
                                };
                            }
                        }
                    }
                    // reset changes boolean for banner
                    scope.databasePhysical.localChangesApplied = false;
                    scope.databasePhysical.information.metamodel.externalChangesApplied =
                        false;
                    // save copy
                    scope.databasePhysical.information.original = JSON.parse(
                        JSON.stringify(
                            scope.databasePhysical.information.metamodel
                        )
                    );
                }

                // create dbTableOptions
                // make array of table name to check against
                const tableNamesArr = Object.keys(
                    scope.databasePhysical.information.allTables
                );

                // reset dbtableoptions to avoid duplicates
                scope.databasePhysical.dbTableOptions = [];

                // // loop over key of allTables
                for (const key in scope.databasePhysical.information
                    .allTables) {
                    // if dbTableOptions is empty
                    if (!scope.databasePhysical.dbTableOptions.length) {
                        // { key: { alias: 'key', table: 'key}}
                        const obj = { alias: key, table: key };

                        // obj[key] = { alias: key, table: key}
                        scope.databasePhysical.dbTableOptions.push(obj);
                    } else {
                        // if key does not exist in dbTableOptions, create obj and push obj into dbTableOptions
                        for (let i = 0; i < tableNamesArr.length; i++) {
                            if (scope.databasePhysical.dbTableOptions[i]) {
                                if (
                                    tableNamesArr.indexOf(
                                        scope.databasePhysical.dbTableOptions[i]
                                            .table
                                    )
                                ) {
                                    // NO-OP
                                } else {
                                    // { key: { alias: 'key', table: 'key}}
                                    const obj = { alias: key, table: key };

                                    // obj[key] = { alias: key, table: key}
                                    scope.databasePhysical.dbTableOptions.push(
                                        obj
                                    );
                                }
                            }
                        }
                    }
                }

                // sort
                scope.databasePhysical.dbTableOptions.sort(function (a, b) {
                    const textA = a.alias.toUpperCase(),
                        textB = b.alias.toUpperCase();

                    if (textA < textB) {
                        return -1;
                    }
                    if (textA > textB) {
                        return 1;
                    }

                    return 0;
                });

                // create dbColumnOptions
                // loop over allTables
                for (const table in scope.databasePhysical.information
                    .allTables) {
                    // if table does not exist on dbColumnOptions object add { alias: column, column: column } to object
                    if (!scope.databasePhysical.dbColumnOptions[table]) {
                        scope.databasePhysical.dbColumnOptions[table] = [];
                        // loop over columns, create an option object, push into array
                        for (const column in scope.databasePhysical.information
                            .allTables[table].columns) {
                            const obj = { alias: column, column: column };
                            scope.databasePhysical.dbColumnOptions[table].push(
                                obj
                            );
                        }
                    } else {
                        // NO-OP
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'databaseInfo',
                        components: [scope.databasePhysical.appId],
                        terminal: true,
                    },
                    {
                        type: 'getDatabaseMetamodel',
                        components: [
                            scope.databasePhysical.appId,
                            [
                                'dataTypes',
                                'additionalDataTypes',
                                'logicalNames',
                                'descriptions',
                                'positions',
                            ],
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name getTypeInformation
         * @param type - data type to set
         * @param typeFormat - typeFormat
         * @returns map - containing the type information
         */
        function getTypeInformation(
            type: string,
            typeFormat: string
        ): { type: string; typeFormat: string } {
            let newType = type,
                newTypeFormat = typeFormat || '';

            // if (newType === 'INT' || newType === 'DOUBLE') {
            //     // ui considers int and double a type format for number,
            //     newTypeFormat = type;
            //     newType = 'NUMBER';
            // }

            if (
                (newType === 'DATE' || newType === 'TIMESTAMP') &&
                !typeFormat
            ) {
                // needs type format, must tell user
            }

            if (!newType) {
                newType = 'STRING';
                newTypeFormat = '';
            }

            return {
                type: newType,
                typeFormat: newTypeFormat,
            };
        }

        /** Utility */
        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // getMetamodel();
            const navigationListener = $transitions.onSuccess(
                {},
                updateNavigation
            );
            const filterListener = semossCoreService.on(
                'update-catalog-filters',
                updateNavigation
            );

            scope.$on('$destroy', function () {
                navigationListener();
                filterListener();
            });
            updateNavigation();

            scope.databasePhysical.loadImport = false;
            import('../../import/import.directive.js')
                .then((module) => {
                    $ocLazyLoad.load(module.default);
                    scope.databasePhysical.loadImport = true;
                })
                .catch((err) => {
                    console.error('Error', err);
                });
        }

        initialize();
    }
}
