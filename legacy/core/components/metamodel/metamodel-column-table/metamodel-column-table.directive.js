'use strict';

export default angular
    .module('app.metamodel.metamodel-column-table', [])
    .directive('metamodelColumnTable', metamodelColumnTableDirective);

metamodelColumnTableDirective.$inject = ['$timeout', 'semossCoreService'];

import './metamodel-column-table.scss';

function metamodelColumnTableDirective($timeout, semossCoreService) {
    metamodelColumnTableCtrl.$inject = [];
    metamodelColumnTableLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./metamodel-column-table.directive.html'),
        scope: {},
        require: [],
        bindToController: {
            appId: '=?',
            open: '=',
            change: '&?',
            type: '=',
            metamodel: '=',
            allTables: '=',
            selectedTable: '=',
        },
        controllerAs: 'metamodelColumnTable',
        controller: metamodelColumnTableCtrl,
        link: metamodelColumnTableLink,
    };

    function metamodelColumnTableCtrl() {}

    function metamodelColumnTableLink(scope, ele, attrs, ctrl) {
        var instanceTimeout,
            defaultOptions =
                semossCoreService.visualization.getDefaultOptions();

        scope.metamodelColumnTable.setColumnTable = setColumnTable;
        scope.metamodelColumnTable.saveTable = saveTable;
        scope.metamodelColumnTable.setColumnGroup = setColumnGroup;
        scope.metamodelColumnTable.saveColumn = saveColumn;
        scope.metamodelColumnTable.closeColumnTable = closeColumnTable;
        scope.metamodelColumnTable.selectFormatType = selectFormatType;
        scope.metamodelColumnTable.predictDescription = predictDescription;
        scope.metamodelColumnTable.addLogical = addLogical;
        scope.metamodelColumnTable.removeLogical = removeLogical;
        scope.metamodelColumnTable.predictLogical = predictLogical;
        scope.metamodelColumnTable.filterInstances = filterInstances;
        scope.metamodelColumnTable.getMoreInstances = getMoreInstances;
        scope.metamodelColumnTable.setSelectedFormat = setSelectedFormat;
        scope.metamodelColumnTable.setFormatOptions = setFormatOptions;

        scope.metamodelColumnTable.tableInformation = {
            selected: '',
        };

        scope.metamodelColumnTable.columnInformation = {
            options: [],
            selected: [],
        };

        scope.metamodelColumnTable.group = 'Edit Columns';
        scope.metamodelColumnTable.format = {};
        scope.metamodelColumnTable.format.options = defaultOptions;
        scope.metamodelColumnTable.format.custom = '';
        scope.metamodelColumnTable.format.selectedOption = null;

        scope.metamodelColumnTable.formatOptions = {
            dimension: '',
            dimensionType: '',
            model: '',
            type: 'Default',
            delimiter: 'Default',
            prepend: '',
            append: '',
            round: 2,
            appliedString: '',
            layout: '',
            date: 'Default',
        };
        scope.metamodelColumnTable.customOptions =
            semossCoreService.visualization.getCustomOptions();

        /**
         * @name getSelectedFormat
         * @param {any} typeFormat the additional data type of the table column
         * @description Returns the format rules for the additional data type
         * @return {object} Default format of the selected type option
         */
        function getSelectedFormat(typeFormat) {
            // when saved custom formats returned as JSON string
            if (
                typeof typeFormat === 'string' &&
                typeFormat !== '' &&
                isJson(typeFormat)
            ) {
                scope.metamodelColumnTable.formatOptions =
                    JSON.parse(typeFormat);
                scope.metamodelColumnTable.updatedColumnTable.typeFormat =
                    'Custom';
            } else if (typeof typeFormat === 'object') {
                // custom formats haven't be saved yet still stored as obj
                scope.metamodelColumnTable.formatOptions = typeFormat;
                scope.metamodelColumnTable.updatedColumnTable.typeFormat =
                    'Custom';
            }
            const selectedFormat =
                scope.metamodelColumnTable.format.selectedOption.formats.find(
                    function (format) {
                        return (
                            format.value ===
                            scope.metamodelColumnTable.updatedColumnTable
                                .typeFormat
                        );
                    }
                );
            if (selectedFormat && selectedFormat.value === 'Custom') {
                selectedFormat.options =
                    scope.metamodelColumnTable.formatOptions;
            }
            return selectedFormat || getDefaultFormat();
        }

        /**
         * @name isJson
         * @param {string} str typeFormat of column
         * @desc checks if typeformat is a json obj of custom format rules
         * @returns {boolean} true or false
         */
        function isJson(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        }

        /**
         * @name getSelectedOption
         * @description Finds option for a given type
         * @param  {string} type Type to match
         * @return {object|null} Matched option if there is one
         */
        function getSelectedOption(type) {
            return scope.metamodelColumnTable.format.options.find(function (
                option
            ) {
                return option.value === type;
            });
        }

        /**
         * @name setFormatOptions
         * @description Set format options from the selected type option
         * @return {void}
         */
        function setFormatOptions() {
            scope.metamodelColumnTable.formatOptions =
                scope.metamodelColumnTable.format.selectedOption.selectedFormat
                    .options || {};
            scope.metamodelColumnTable.formatOptions.dimension =
                scope.metamodelColumnTable.updatedColumnTable.alias;
            scope.metamodelColumnTable.formatOptions.dimensionType =
                scope.metamodelColumnTable.updatedColumnTable.type;
        }

        /** Table Functions */

        /**
         * @name setColumnTable
         * @desc grabs the column information
         * @return {void}
         */
        function setColumnTable() {
            var columnMapping = {},
                table,
                column;

            // create the options (aka things that haven't been added)
            scope.metamodelColumnTable.columnInformation.options = [];

            // create a mapping
            for (table in scope.metamodelColumnTable.allTables) {
                if (
                    scope.metamodelColumnTable.allTables.hasOwnProperty(
                        table
                    ) &&
                    table ===
                        scope.metamodelColumnTable.tableInformation.selected
                ) {
                    for (column in scope.metamodelColumnTable.allTables[table]
                        .columns) {
                        // dont add the primary key column users shouldn't be able to remove this
                        if (
                            scope.metamodelColumnTable.allTables[
                                table
                            ].columns.hasOwnProperty(column) &&
                            !scope.metamodelColumnTable.allTables[table]
                                .columns[column].isPrimKey
                        ) {
                            columnMapping[column] =
                                scope.metamodelColumnTable.allTables[
                                    table
                                ].columns[column].alias;
                        }
                    }
                }
            }

            for (column in columnMapping) {
                if (columnMapping.hasOwnProperty(column)) {
                    scope.metamodelColumnTable.columnInformation.options.push({
                        column: column,
                        alias: columnMapping[column],
                    });
                }
            }

            // sort
            scope.metamodelColumnTable.columnInformation.options.sort(function (
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
            scope.metamodelColumnTable.columnInformation.selected = [];
            if (
                scope.metamodelColumnTable.metamodel.tables.hasOwnProperty(
                    scope.metamodelColumnTable.tableInformation.selected
                )
            ) {
                for (column in scope.metamodelColumnTable.metamodel.tables[
                    scope.metamodelColumnTable.tableInformation.selected
                ].columns) {
                    if (
                        scope.metamodelColumnTable.metamodel.tables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns.hasOwnProperty(column)
                    ) {
                        scope.metamodelColumnTable.columnInformation.selected.push(
                            scope.metamodelColumnTable.metamodel.tables[
                                scope.metamodelColumnTable.tableInformation
                                    .selected
                            ].columns[column].column
                        );
                    }
                }
            }
        }

        /**
         * @name openColumn
         * @desc sets the header to be formatted
         * @return {void}
         */
        function openColumn() {
            let table, selectedColumnTable;
            // find the selected table to store table options on
            for (table in scope.metamodelColumnTable.metamodel.tables) {
                if (
                    scope.metamodelColumnTable.metamodel.tables.hasOwnProperty(
                        table
                    ) &&
                    table === scope.metamodelColumnTable.selectedTable
                ) {
                    selectedColumnTable =
                        scope.metamodelColumnTable.metamodel.tables[table];
                }
            }
            scope.metamodelColumnTable.updatedColumnTable = JSON.parse(
                JSON.stringify(selectedColumnTable)
            );
            scope.metamodelColumnTable.format.selectedOption =
                getSelectedOption(
                    scope.metamodelColumnTable.updatedColumnTable.type
                );
            scope.metamodelColumnTable.format.selectedOption.selectedFormat =
                getSelectedFormat(
                    scope.metamodelColumnTable.updatedColumnTable.typeFormat
                );
            scope.metamodelColumnTable.format.custom = '';
            scope.metamodelColumnTable.newLogical = '';
            scope.metamodelColumnTable.instances = {
                loading: false,
                taskId: false,
                options: [], // all values on the dom for the alias
                search: '', // search term used
                limit: 50, // how many filter values to collect
                canCollect: true,
            };

            setFormatOptions();
            // set the selected table
            scope.metamodelColumnTable.tableInformation.selected =
                scope.metamodelColumnTable.selectedTable;
            if (scope.metamodelColumnTable.tableInformation.selected) {
                setColumnTable();
            }
        }

        /**
         * @name setColumnGroup
         * @desc set the column group
         * @param {string} group - group to view
         * @return {void}
         */
        function setColumnGroup(group) {
            scope.metamodelColumnTable.group = group;

            if (scope.metamodelColumnTable.group === 'Sample Instances') {
                getInstances();
            }
        }

        /**
         * @name saveTable
         * @desc save table column alias, description, and added or removed columns
         * @return {void}
         */
        function saveTable() {
            var columnMapping = {},
                i,
                len;

            // update table information
            if (
                scope.metamodelColumnTable.tableInformation.selected ===
                scope.metamodelColumnTable.updatedColumnTable.table
            ) {
                scope.metamodelColumnTable.metamodel.tables[
                    scope.metamodelColumnTable.tableInformation.selected
                ].alias = scope.metamodelColumnTable.updatedColumnTable.alias;
                scope.metamodelColumnTable.metamodel.tables[
                    scope.metamodelColumnTable.tableInformation.selected
                ].description =
                    scope.metamodelColumnTable.updatedColumnTable.description;
            }
            // create a mapping, this will help us update the tables (rather than replace)
            columnMapping = {};
            for (
                i = 0,
                    len =
                        scope.metamodelColumnTable.columnInformation.selected
                            .length;
                i < len;
                i++
            ) {
                columnMapping[
                    scope.metamodelColumnTable.columnInformation.selected[i]
                ] = i;
            }

            // remove columns that are missing
            for (i in scope.metamodelColumnTable.metamodel.tables[
                scope.metamodelColumnTable.tableInformation.selected
            ].columns) {
                // remove the relationship, that if a table in the mapping
                if (
                    !columnMapping.hasOwnProperty(
                        scope.metamodelColumnTable.metamodel.tables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns[i].column
                    )
                ) {
                    delete scope.metamodelColumnTable.metamodel.tables[
                        scope.metamodelColumnTable.tableInformation.selected
                    ].columns[i];
                }
            }

            // delete the column
            for (i in scope.metamodelColumnTable.metamodel.tables[
                scope.metamodelColumnTable.tableInformation.selected
            ].columns) {
                if (
                    !columnMapping.hasOwnProperty(
                        scope.metamodelColumnTable.metamodel.tables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns[i].column
                    )
                ) {
                    // remove the columns, that aren't in the mapping
                    delete scope.metamodelColumnTable.metamodel.tables[
                        scope.metamodelColumnTable.tableInformation.selected
                    ].columns[i];
                } else {
                    // delete the mapping value, because it is already added
                    delete columnMapping[
                        scope.metamodelColumnTable.metamodel.tables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns[i].column
                    ];
                }
            }

            // add the column that are remaining in the mapping
            for (i in columnMapping) {
                if (columnMapping.hasOwnProperty(i)) {
                    scope.metamodelColumnTable.metamodel.tables[
                        scope.metamodelColumnTable.tableInformation.selected
                    ].columns[i] = {
                        alias: scope.metamodelColumnTable.allTables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns[i].alias,
                        column: scope.metamodelColumnTable.allTables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns[i].column,
                        table: scope.metamodelColumnTable.tableInformation
                            .selected,
                        isPrimKey: false,
                        type: scope.metamodelColumnTable.allTables[
                            scope.metamodelColumnTable.tableInformation.selected
                        ].columns[i].type,
                        typeFormat:
                            scope.metamodelColumnTable.allTables[
                                scope.metamodelColumnTable.tableInformation
                                    .selected
                            ].columns[i].typeFormat,
                        description:
                            scope.metamodelColumnTable.allTables[
                                scope.metamodelColumnTable.tableInformation
                                    .selected
                            ].columns[i].description,
                        logical:
                            scope.metamodelColumnTable.allTables[
                                scope.metamodelColumnTable.tableInformation
                                    .selected
                            ].columns[i].logical,
                    };
                }
            }

            // save column changes
            saveColumn();
        }

        /**
         * @name saveColumn
         * @desc updates header to changes user has made
         * @return {void}
         */
        function saveColumn() {
            var format, option, type, typeFormat;

            option = scope.metamodelColumnTable.format.selectedOption;

            // set the type
            // type = scope.metamodelColumnTable.updatedColumnTable.type;
            type = option.value;
            format = option.selectedFormat;

            typeFormat = format.value;

            // set the format
            if (scope.metamodelColumnTable.format.custom) {
                typeFormat = scope.metamodelColumnTable.format.custom;
            } else if (typeFormat === 'Custom') {
                typeFormat = format.options;
            } else if (type === 'DATE' && typeFormat === null) {
                typeFormat = 'yyyy-MM-dd';
            }

            if (scope.metamodelColumnTable.change) {
                scope.metamodelColumnTable.change({
                    type: type,
                    typeFormat: typeFormat,
                    alias: scope.metamodelColumnTable.updatedColumnTable.alias,
                    description:
                        scope.metamodelColumnTable.updatedColumnTable
                            .description,
                    logical:
                        scope.metamodelColumnTable.updatedColumnTable.logical,
                    model: scope.metamodelColumnTable.metamodel,
                });
            }

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Table changes saved',
            });

            // Reset
            closeColumnTable();
        }

        /**
         * @name closeColumnTable
         * @desc cancel formatting
         * @return {void}
         */
        function closeColumnTable() {
            scope.metamodelColumnTable.open = false;
            scope.metamodelColumnTable.updatedColumnTable = {};
            scope.metamodelColumnTable.tableInformation = {
                selected: '',
            };

            scope.metamodelColumnTable.columnInformation = {
                options: [],
                selected: [],
            };
        }

        /** Format Functions */

        /**
         * @name getDefaultFormat
         * @description Returns the default format if a format is flagged with isDefault
         * @return {object} Default format of the selected type option
         */
        function getDefaultFormat() {
            const defaultFormat =
                scope.metamodelColumnTable.format.selectedOption.formats.find(
                    function (format) {
                        return format.isDefault;
                    }
                );

            return (
                defaultFormat || {
                    value: '',
                }
            );
        }

        /**
         * @name setSelectedFormat
         * @description Sets selected format option of the selected type option
         * @returns {void}
         */
        function setSelectedFormat() {
            scope.metamodelColumnTable.format.selectedOption.selectedFormat =
                getSelectedFormat(
                    scope.metamodelColumnTable.updatedColumnTable.typeFormat
                );
        }

        /**
         * @name selectFormatType
         * @param {object} format the format selected
         * @desc select the format and custom formatting
         * @return {void}
         */
        function selectFormatType(format) {
            scope.metamodelColumnTable.updatedColumnTable.typeFormat =
                format.value;
            scope.metamodelColumnTable.format.custom = '';
        }

        /** Description Functions */
        /**
         * @name predictDescription
         * @desc predict the description
         * @return {void}
         */
        function predictDescription() {
            var message = semossCoreService.utility.random('predict');

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output[0]) {
                    scope.metamodelColumnTable.updatedColumnTable.description =
                        output[0];
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'predictOwlDescription',
                        components: [
                            scope.metamodelColumnTable.appId,
                            scope.metamodelColumnTable.updatedColumnTable.table,
                            scope.metamodelColumnTable.updatedColumnTable.table,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Logical Functions */
        /**
         * @name addLogical
         * @desc add a logical name
         * @return {void}
         */
        function addLogical() {
            if (
                scope.metamodelColumnTable.newLogical &&
                scope.metamodelColumnTable.updatedColumnTable.logical.indexOf(
                    scope.metamodelColumnTable.newLogical
                ) === -1
            ) {
                scope.metamodelColumnTable.updatedColumnTable.logical.push(
                    scope.metamodelColumnTable.newLogical
                );
            }

            scope.metamodelColumnTable.newLogical = '';
        }

        /**
         * @name removeLogical
         * @param {number} index - the index to remove the logical from
         * @desc remove a logical name
         * @return {void}
         */
        function removeLogical(index) {
            scope.metamodelColumnTable.updatedColumnTable.logical.splice(
                index,
                1
            );
        }

        /**
         * @name predictLogical
         * @desc predict the logical names
         * @return {void}
         */
        function predictLogical() {
            var message = semossCoreService.utility.random('predict');

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                if (output) {
                    scope.metamodelColumnTable.updatedColumnTable.logical =
                        scope.metamodelColumnTable.updatedColumnTable.logical.concat(
                            output
                        );
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'predictOwlLogicalNames',
                        components: [
                            scope.metamodelColumnTable.appId,
                            scope.metamodelColumnTable.updatedColumnTable.table,
                            scope.metamodelColumnTable.updatedColumnTable.table,
                        ],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Instances */

        /**
         * @name getInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function getInstances() {
            var components = [],
                filterObj = {},
                message = semossCoreService.utility.random('meta-pixel');

            scope.metamodelColumnTable.instances.loading = true;
            scope.metamodelColumnTable.instances.taskId = false;
            scope.metamodelColumnTable.instances.options = [];
            scope.metamodelColumnTable.instances.canCollect = true;

            let selector = '';
            if (scope.metamodelColumnTable.type === 'GRAPH') {
                selector = `${scope.metamodelColumnTable.updatedColumnTable.table}`;
            }

            components.push(
                {
                    type: 'database',
                    components: [scope.metamodelColumnTable.appId],
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                selector: selector,
                                alias: scope.metamodelColumnTable
                                    .updatedColumnTable.table,
                            },
                        ],
                    ],
                }
            );

            if (scope.metamodelColumnTable.instances.search) {
                // search
                filterObj[selector] = {
                    comparator: '?like',
                    value: [scope.metamodelColumnTable.instances.search],
                };

                components.push({
                    type: 'filter',
                    components: [filterObj],
                });
            }

            components.push(
                {
                    type: 'sort',
                    components: [[selector]],
                },
                {
                    type: 'collect',
                    components: [scope.metamodelColumnTable.instances.limit],
                    terminal: true,
                }
            );

            // register message to come back to
            semossCoreService.once(message, function (response) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // add new ones
                for (let i = 0, len = output.data.values.length; i < len; i++) {
                    let temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.metamodelColumnTable.instances.options.push(temp);
                }

                scope.metamodelColumnTable.instances.taskId = output.taskId;
                scope.metamodelColumnTable.instances.canCollect =
                    output.numCollected === output.data.values.length;
                scope.metamodelColumnTable.instances.loading = false;
            });

            semossCoreService.emit('query-pixel', {
                commandList: components,
                response: message,
            });
        }

        /**
         * @name filterInstances
         * @desc filter instances for the selected column
         * @return {void}
         */
        function filterInstances() {
            if (instanceTimeout) {
                $timeout.cancel(instanceTimeout);
            }

            instanceTimeout = $timeout(function () {
                getInstances();
            }, 500);
        }

        /**
         * @name getMoreInstances
         * @desc get instances for the selected concept
         * @return {void}
         */
        function getMoreInstances() {
            var message = semossCoreService.utility.random('meta-pixel');

            if (!scope.metamodelColumnTable.instances.canCollect) {
                return;
            }

            scope.metamodelColumnTable.instances.loading = true;

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len,
                    temp;

                // add new ones
                for (i = 0, len = output.data.values.length; i < len; i++) {
                    temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.metamodelColumnTable.instances.options.push(
                        output.data.values[i][0]
                    );
                }

                scope.metamodelColumnTable.instances.taskId = output.taskId;
                scope.metamodelColumnTable.instances.canCollect =
                    output.numCollected === output.data.values.length;
                scope.metamodelColumnTable.instances.loading = false;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'task',
                        components: [
                            scope.metamodelColumnTable.instances.taskId,
                        ],
                    },
                    {
                        type: 'collect',
                        components: [
                            scope.metamodelColumnTable.instances.limit,
                        ],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /** Helpers */

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @return {void}
         */
        function initialize() {
            $timeout(function () {
                scope.$watch(
                    function () {
                        return scope.metamodelColumnTable.open;
                    },
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            if (open) {
                                openColumn();
                            }
                        }
                    }
                );

                if (open) {
                    openColumn();
                }
            });
        }

        initialize();
    }
}
