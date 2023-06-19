'use strict';

export default angular
    .module('app.metamodel.metamodel-table', [])
    .directive('metamodelTable', metamodelTableDirective);

import './metamodel-table.scss';

metamodelTableDirective.$inject = ['$timeout', 'semossCoreService'];

function metamodelTableDirective($timeout, semossCoreService) {
    metamodelTableCtrl.$inject = [];
    metamodelTableLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./metamodel-table.directive.html'),
        scope: {},
        require: [],
        controllerAs: 'metamodelTable',
        bindToController: {
            metamodel: '=',
            allTables: '=',
            selectedTable: '=',
            change: '&?',
            app: '=?',
            open: '=',
        },
        controller: metamodelTableCtrl,
        link: metamodelTableLink,
    };

    function metamodelTableCtrl() {}

    function metamodelTableLink(scope) {
        scope.metamodelTable.tableInformation = {
            options: [],
            selected: '',
        };

        scope.metamodelTable.columnInformation = {
            options: [],
            selected: [],
        };

        scope.metamodelTable.group = 'Add or Remove Columns';
        scope.metamodelTable.updatedTable = {
            table: '',
            alias: '',
            description: '',
        };

        // Generating Descriptions
        scope.metamodelTable.packagesInstalled = false;
        scope.metamodelTable.showDescriptionScreen = false;
        scope.metamodelTable.generatedDescriptions = [];
        scope.metamodelTable.selectedDesc = '';
        scope.metamodelTable.numDesc = 1;
        scope.metamodelTable.loadingDesc = false;
        scope.metamodelTable.callbackMessage = '';

        scope.metamodelTable.setColumn = setColumn;
        scope.metamodelTable.setColumnGroup = setColumnGroup;
        scope.metamodelTable.cancelTable = cancelTable;
        scope.metamodelTable.saveTable = saveTable;

        // Generating Descriptions - Functions
        scope.metamodelTable.openDescriptionScreen = openDescriptionScreen;
        scope.metamodelTable.getDescriptions = getDescriptions;
        scope.metamodelTable.submitDescription = submitDescription;
        scope.metamodelTable.resetDescription = resetDescription;
        scope.metamodelTable.descriptionChanged = descriptionChanged;

        /** Metamodel Functions */

        /** Table Functions */
        /**
         * @name setTable
         * @desc selects a column to grab data about
         * @return {void}
         */
        function setTable() {
            var table,
                keepSelected = false,
                tableDescription = '';

            // this is the selected information
            scope.metamodelTable.tableInformation.options = [];
            for (table in scope.metamodelTable.metamodel.tables) {
                if (
                    scope.metamodelTable.metamodel.tables.hasOwnProperty(table)
                ) {
                    // old metamodels won't have description so have to check
                    if (
                        scope.metamodelTable.metamodel.tables[
                            table
                        ].hasOwnProperty('description')
                    ) {
                        tableDescription =
                            scope.metamodelTable.metamodel.tables[table]
                                .description;
                    }
                    scope.metamodelTable.tableInformation.options.push({
                        table: scope.metamodelTable.metamodel.tables[table]
                            .table,
                        alias: scope.metamodelTable.metamodel.tables[table]
                            .alias,
                        description: tableDescription,
                    });

                    if (
                        scope.metamodelTable.selectedTable ===
                        scope.metamodelTable.metamodel.tables[table].table
                    ) {
                        keepSelected = true;
                    }
                }
            }

            // sort
            scope.metamodelTable.tableInformation.options.sort(function (a, b) {
                var textA = a.alias.toUpperCase(),
                    textB = b.alias.toUpperCase();

                if (textA < textB) {
                    return -1;
                }
                if (textA > textB) {
                    return 1;
                }

                return 0;
            });

            if (!keepSelected) {
                scope.metamodelTable.tableInformation.selected =
                    scope.metamodelTable.tableInformation.options[0].table;
            } else {
                scope.metamodelTable.tableInformation.selected =
                    scope.metamodelTable.selectedTable;
            }

            if (scope.metamodelTable.tableInformation.selected) {
                setColumn();
            }
        }

        /**
         * @name setColumn
         * @desc grabs the column information
         * @return {void}
         */
        function setColumn() {
            var columnMapping = {},
                table,
                column;

            // create the options (aka things that haven't been added)
            scope.metamodelTable.columnInformation.options = [];

            if (
                !scope.metamodelTable.app ||
                !scope.metamodelTable.app.database_name
            ) {
                // for new apps the user is creating, we need to display all columns as potential properties they can add.
                let tableCol = {};
                for (table in scope.metamodelTable.allTables) {
                    if (scope.metamodelTable.allTables.hasOwnProperty(table)) {
                        for (column in scope.metamodelTable.allTables[table]
                            .columns) {
                            if (
                                scope.metamodelTable.allTables[
                                    table
                                ].columns.hasOwnProperty(column)
                            ) {
                                tableCol =
                                    scope.metamodelTable.allTables[table]
                                        .columns[column];
                                if (!tableCol.added) {
                                    scope.metamodelTable.columnInformation.options.push(
                                        tableCol
                                    );
                                }
                            }
                        }
                    }
                }

                for (table in scope.metamodelTable.allTables) {
                    if (scope.metamodelTable.allTables.hasOwnProperty(table)) {
                        // set all options into the allTables's columns obj so it properly works in saveTable function
                        for (
                            let colIdx = 0;
                            colIdx <
                            scope.metamodelTable.columnInformation.options
                                .length;
                            colIdx++
                        ) {
                            const columnInfo = semossCoreService.utility.freeze(
                                scope.metamodelTable.columnInformation.options[
                                    colIdx
                                ]
                            );
                            // if this column is not already in the list, we will add it
                            if (
                                !scope.metamodelTable.allTables[
                                    table
                                ].columns.hasOwnProperty(columnInfo.column)
                            ) {
                                columnInfo.isPrimKey = false;
                                columnInfo.table = table;
                                columnInfo.added = true;
                                scope.metamodelTable.allTables[table].columns[
                                    columnInfo.column
                                ] = columnInfo;
                            }
                        }
                    }
                }
            } else {
                // for apps that have already been created, we will populate the properties as they come back from the BE
                // create a mapping
                for (table in scope.metamodelTable.allTables) {
                    if (
                        scope.metamodelTable.allTables.hasOwnProperty(table) &&
                        table === scope.metamodelTable.tableInformation.selected
                    ) {
                        for (column in scope.metamodelTable.allTables[table]
                            .columns) {
                            // dont add the primary key column users shouldn't be able to remove this
                            if (
                                scope.metamodelTable.allTables[
                                    table
                                ].columns.hasOwnProperty(column) &&
                                !scope.metamodelTable.allTables[table].columns[
                                    column
                                ].isPrimKey
                            ) {
                                columnMapping[column] =
                                    scope.metamodelTable.allTables[
                                        table
                                    ].columns[column].alias;
                            }
                        }
                    }
                }

                for (column in columnMapping) {
                    if (columnMapping.hasOwnProperty(column)) {
                        scope.metamodelTable.columnInformation.options.push({
                            column: column,
                            alias: columnMapping[column],
                        });
                    }
                }
            }

            // sort
            scope.metamodelTable.columnInformation.options.sort(function (
                a,
                b
            ) {
                var textA = a.alias.toUpperCase(),
                    textB = b.alias.toUpperCase();

                if (textA < textB) {
                    return -1;
                }
                if (textA > textB) {
                    return 1;
                }

                return 0;
            });

            // create the selected
            scope.metamodelTable.columnInformation.selected = [];
            if (
                scope.metamodelTable.metamodel.tables.hasOwnProperty(
                    scope.metamodelTable.tableInformation.selected
                )
            ) {
                for (column in scope.metamodelTable.metamodel.tables[
                    scope.metamodelTable.tableInformation.selected
                ].columns) {
                    if (
                        scope.metamodelTable.metamodel.tables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns.hasOwnProperty(column)
                    ) {
                        scope.metamodelTable.columnInformation.selected.push(
                            scope.metamodelTable.metamodel.tables[
                                scope.metamodelTable.tableInformation.selected
                            ].columns[column].column
                        );
                    }
                }
            }

            // refresh selected table information
            updateTableInformation();
        }

        /**
         * @name setColumnGroup
         * @desc set the column group
         * @param {string} group - group to view
         * @return {void}
         */
        function setColumnGroup(group) {
            scope.metamodelTable.group = group;
            if (group !== 'Settings') {
                resetDescription();
            }
        }

        /**
         * @name updateTableInformation
         * @desc set the selected table information
         * @return {void}
         */
        function updateTableInformation() {
            let tableIdx;

            for (
                tableIdx = 0;
                tableIdx < scope.metamodelTable.tableInformation.options.length;
                tableIdx++
            ) {
                if (
                    scope.metamodelTable.tableInformation.options[tableIdx]
                        .table ===
                    scope.metamodelTable.tableInformation.selected
                ) {
                    scope.metamodelTable.updatedTable =
                        scope.metamodelTable.tableInformation.options[tableIdx];
                }
            }
        }

        /**
         * @name cancelTable
         * @desc edit a column alias
         * @param {string} selected - selected table information
         * @return {void}
         */
        function cancelTable() {
            scope.metamodelTable.tableInformation = {
                options: [],
                selected: '',
            };

            scope.metamodelTable.columnInformation = {
                options: [],
                selected: [],
            };

            // push the changes via a callback
            if (scope.metamodelTable.change) {
                scope.metamodelTable.change({
                    model: scope.metamodelTable.metamodel,
                });
            }

            // Close overlay and reset UI
            scope.metamodelTable.open = false;
            resetDescription(true);
            scope.metamodelTable.group = 'Add or Remove Columns';
        }

        /**
         * @name saveTable
         * @desc edit a column alias
         * @return {void}
         */
        function saveTable() {
            var columnMapping = {},
                i,
                len;

            // update table information
            if (
                scope.metamodelTable.tableInformation.selected ===
                scope.metamodelTable.updatedTable.table
            ) {
                scope.metamodelTable.metamodel.tables[
                    scope.metamodelTable.tableInformation.selected
                ].alias = scope.metamodelTable.updatedTable.alias;
                scope.metamodelTable.metamodel.tables[
                    scope.metamodelTable.tableInformation.selected
                ].description = scope.metamodelTable.updatedTable.description;
            }
            // create a mapping, this will help us update the tables (rather than replace)
            columnMapping = {};
            for (
                i = 0,
                    len =
                        scope.metamodelTable.columnInformation.selected.length;
                i < len;
                i++
            ) {
                columnMapping[
                    scope.metamodelTable.columnInformation.selected[i]
                ] = i;
            }

            // remove columns that are missing
            for (i in scope.metamodelTable.metamodel.tables[
                scope.metamodelTable.tableInformation.selected
            ].columns) {
                // remove the relationship, that if a table in the mapping
                if (
                    !columnMapping.hasOwnProperty(
                        scope.metamodelTable.metamodel.tables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns[i].column
                    )
                ) {
                    delete scope.metamodelTable.metamodel.tables[
                        scope.metamodelTable.tableInformation.selected
                    ].columns[i];
                }
            }

            // delete the column
            for (i in scope.metamodelTable.metamodel.tables[
                scope.metamodelTable.tableInformation.selected
            ].columns) {
                if (
                    !columnMapping.hasOwnProperty(
                        scope.metamodelTable.metamodel.tables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns[i].column
                    )
                ) {
                    // remove the columns, that aren't in the mapping
                    delete scope.metamodelTable.metamodel.tables[
                        scope.metamodelTable.tableInformation.selected
                    ].columns[i];
                } else {
                    // delete the mapping value, because it is already added
                    delete columnMapping[
                        scope.metamodelTable.metamodel.tables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns[i].column
                    ];
                }
            }

            // add the column that are remaining in the mapping
            for (i in columnMapping) {
                if (columnMapping.hasOwnProperty(i)) {
                    scope.metamodelTable.metamodel.tables[
                        scope.metamodelTable.tableInformation.selected
                    ].columns[i] = {
                        alias: scope.metamodelTable.allTables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns[i].alias,
                        column: scope.metamodelTable.allTables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns[i].column,
                        table: scope.metamodelTable.tableInformation.selected,
                        isPrimKey: false,
                        type: scope.metamodelTable.allTables[
                            scope.metamodelTable.tableInformation.selected
                        ].columns[i].type,
                        typeFormat:
                            scope.metamodelTable.allTables[
                                scope.metamodelTable.tableInformation.selected
                            ].columns[i].typeFormat,
                        description:
                            scope.metamodelTable.allTables[
                                scope.metamodelTable.tableInformation.selected
                            ].columns[i].description,
                        logical:
                            scope.metamodelTable.allTables[
                                scope.metamodelTable.tableInformation.selected
                            ].columns[i].logical,
                    };
                }
            }

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Columns changes saved',
            });

            cancelTable();

            // TODO we need to do some cleanup in the end to remove any table that has been added as a property
        }
        /** Generating Descriptions Functions */
        /**
         * @name openDescriptionScreen
         * @desc opens the screen that auto generates descriptions
         * @returns {void}
         */
        function openDescriptionScreen() {
            scope.metamodelTable.showDescriptionScreen = true;
        }
        /**
         * @name getDescriptions
         * @desc called to auto generate descriptions
         * @returns {void}
         */
        function getDescriptions() {
            let message = semossCoreService.utility.random('execute-pixel');
            scope.metamodelTable.loadingDesc = true;
            scope.metamodelTable.callbackMessage = message;

            semossCoreService.once(message, function (response) {
                let type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;
                scope.metamodelTable.loadingDesc = false;
                scope.metamodelTable.callbackMessage = '';
                if (type.indexOf('ERROR') > -1) {
                    scope.metamodelTable.generatedDescriptions = [];
                    return;
                }
                scope.metamodelTable.generatedDescriptions = output;
                scope.metamodelTable.selectedDesc = output[0];
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'generateDescription',
                        components: [
                            'table',
                            scope.metamodelTable.app.database_id,
                            scope.metamodelTable.selectedTable,
                            scope.metamodelTable.numDesc,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }
        /**
         * @name submitDescription
         * @desc sets the description using the selected generated description
         * @returns {void}
         */
        function submitDescription() {
            scope.metamodelTable.updatedTable.description =
                scope.metamodelTable.selectedDesc;
            resetDescription();
        }
        /**
         * @name resetDescription
         * @desc resets the values for generating descriptions
         * @param {boolean} goBack - if true, will take user to original edit table screen
         * @returns {void}
         */
        function resetDescription(goBack = true) {
            if (goBack) {
                scope.metamodelTable.showDescriptionScreen = false;
            }
            // Reset fields and results
            scope.metamodelTable.loadingDesc = false;
            scope.metamodelTable.generatedDescriptions = [];
            scope.metamodelTable.selectedDesc = '';
            scope.metamodelTable.numDesc = 1;

            // Cancel previous callback response if in the middle of another call
            if (scope.metamodelTable.callbackMessage.length) {
                semossCoreService.off(scope.metamodelTable.callbackMessage);
                scope.metamodelTable.callbackMessage = '';
            }
        }
        /**
         * @name descriptionChanged
         * @desc Called when the textarea is focused or changed.
         * Syncs the selectedDesc so that the textarea and radio button stay in sync.
         * @param {string} desc - the description filled in the textarea
         * @returns {void}
         */
        function descriptionChanged(desc) {
            scope.metamodelTable.selectedDesc = desc;
        }
        /**
         * @name checkPackages
         * @desc checks to see if the required R packages for generating descriptions are installed
         * @returns {void}
         */
        function checkPackages() {
            const installedPackages =
                semossCoreService.getWidgetState('installedPackages');
            if (installedPackages) {
                if (installedPackages.hasOwnProperty('R')) {
                    if (installedPackages.R.indexOf('gpt2') > -1) {
                        scope.metamodelTable.packagesInstalled = true;
                    }
                }
            }
        }

        /** Helpers */
        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            checkPackages();
            $timeout(function () {
                scope.$watch(
                    function () {
                        return JSON.stringify(scope.metamodelTable.metamodel);
                    },
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            setTable();
                        }
                    }
                );

                setTable();
            });

            // Call setTable whenever the modal is opened
            scope.$watch('metamodelTable.open', function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    setTable();
                }
            });

            scope.$on('$destroy', function () {
                resetDescription();
            });
        }

        initialize();
    }
}
