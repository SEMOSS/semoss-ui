'use strict';

export default angular
    .module('app.import-file-flat.directive', [])
    .directive('importFileFlat', importFileFlatDirective);

importFileFlatDirective.$inject = ['semossCoreService'];

import './import-file-flat.scss';

function importFileFlatDirective(semossCoreService) {
    importFileFlatCtrl.$inject = [];
    importFileFlatLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./import-file-flat.directive.html'),
        scope: {},
        require: ['^import', '^importFile'],
        bindToController: {},
        controllerAs: 'importFileFlat',
        controller: importFileFlatCtrl,
        link: importFileFlatLink,
    };

    function importFileFlatCtrl() {}

    function importFileFlatLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];
        scope.importFileCtrl = ctrl[1];

        scope.importFileFlat.importData = importData;
        scope.importFileFlat.toggleSheet = toggleSheet;
        scope.importFileFlat.editColumn = editColumn;
        scope.importFileFlat.changeColumn = changeColumn;
        scope.importFileFlat.previewCustomRange = previewCustomRange;

        scope.importFileFlat.column = {
            open: false,
            selected: {},
        };

        /** General */
        /**
         * @name setFlat
         * @desc calls function to get header information from BE
         * @returns {void}
         */
        function setFlat() {
            var fileIdx, fileLen, sheet, table, column;

            for (
                fileIdx = 0, fileLen = scope.importFileCtrl.parsedFiles.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                for (sheet in scope.importFileCtrl.parsedFiles[fileIdx]
                    .sheets) {
                    if (
                        scope.importFileCtrl.parsedFiles[
                            fileIdx
                        ].sheets.hasOwnProperty(sheet)
                    ) {
                        scope.importFileCtrl.parsedFiles[fileIdx].sheets[
                            sheet
                        ].availableTables = [];

                        for (table in scope.importFileCtrl.parsedFiles[fileIdx]
                            .sheets[sheet].tables) {
                            if (
                                scope.importFileCtrl.parsedFiles[
                                    fileIdx
                                ].sheets[sheet].tables.hasOwnProperty(table)
                            ) {
                                for (column in scope.importFileCtrl.parsedFiles[
                                    fileIdx
                                ].sheets[sheet].tables[table].columns) {
                                    if (
                                        scope.importFileCtrl.parsedFiles[
                                            fileIdx
                                        ].sheets[sheet].tables[
                                            table
                                        ].columns.hasOwnProperty(column)
                                    ) {
                                        scope.importFileCtrl.parsedFiles[
                                            fileIdx
                                        ].sheets[sheet].tables[table].columns[
                                            column
                                        ].selected = true;
                                    }
                                }
                                scope.importFileCtrl.parsedFiles[
                                    fileIdx
                                ].sheets[sheet].availableTables.push(table);
                            }
                        }

                        scope.importFileCtrl.parsedFiles[fileIdx].sheets[
                            sheet
                        ].closed = false;
                        scope.importFileCtrl.parsedFiles[fileIdx].sheets[
                            sheet
                        ].selected = true;
                        scope.importFileCtrl.parsedFiles[fileIdx].sheets[
                            sheet
                        ].selectedTable = table;
                        scope.importFileCtrl.parsedFiles[fileIdx].sheets[
                            sheet
                        ].availableTables.push('Custom Range');
                        scope.importFileCtrl.parsedFiles[fileIdx].sheets[
                            sheet
                        ].customRange = '';
                    }
                }
            }
        }

        /**
         * @name validateFlat
         * @desc validates flat
         * @returns {string} error string
         */
        function validateFlat() {
            var fileIdx,
                fileLen,
                sheet,
                table,
                column,
                duplicate = {};

            for (
                fileIdx = 0, fileLen = scope.importFileCtrl.parsedFiles.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                for (sheet in scope.importFileCtrl.parsedFiles[fileIdx]
                    .sheets) {
                    if (
                        scope.importFileCtrl.parsedFiles[
                            fileIdx
                        ].sheets.hasOwnProperty(sheet)
                    ) {
                        for (table in scope.importFileCtrl.parsedFiles[fileIdx]
                            .sheets[sheet].tables) {
                            if (
                                scope.importFileCtrl.parsedFiles[
                                    fileIdx
                                ].sheets[sheet].tables.hasOwnProperty(table)
                            ) {
                                duplicate = {};
                                for (column in scope.importFileCtrl.parsedFiles[
                                    fileIdx
                                ].sheets[sheet].tables[table].columns) {
                                    if (
                                        scope.importFileCtrl.parsedFiles[
                                            fileIdx
                                        ].sheets[sheet].tables[
                                            table
                                        ].columns.hasOwnProperty(column)
                                    ) {
                                        if (
                                            !scope.importFileCtrl.parsedFiles[
                                                fileIdx
                                            ].sheets[sheet].tables[table]
                                                .columns[column].selected
                                        ) {
                                            continue;
                                        }

                                        if (
                                            !scope.importFileCtrl.parsedFiles[
                                                fileIdx
                                            ].sheets[sheet].tables[table]
                                                .columns[column].alias
                                        ) {
                                            return (
                                                'Warning: Missing an alias in File: ' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .fileName +
                                                ' Sheet:' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .sheets[sheet].alias +
                                                ' Table:' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .sheets[sheet].tables[table]
                                                    .alias +
                                                ' Column:' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .sheets[sheet].tables[table]
                                                    .columns[column].column
                                            );
                                        }

                                        if (
                                            duplicate[
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .sheets[sheet].tables[table]
                                                    .columns[column].alias
                                            ]
                                        ) {
                                            return (
                                                'Warning: Duplicate alias in File: ' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .fileName +
                                                ' Sheet:' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .sheets[sheet].alias +
                                                ' Table:' +
                                                scope.importFileCtrl
                                                    .parsedFiles[fileIdx]
                                                    .sheets[sheet].tables[table]
                                                    .alias
                                            );
                                        }

                                        duplicate[
                                            scope.importFileCtrl.parsedFiles[
                                                fileIdx
                                            ].sheets[sheet].tables[
                                                table
                                            ].columns[column].alias
                                        ] = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return '';
        }

        /**
         * @name importData
         * @desc validate the header information and then load the data
         * @return {void}
         */
        function importData() {
            var error = validateFlat(),
                pixel = '',
                callback,
                newHeaders,
                additionalDataTypes,
                descriptionMap,
                logicalNamesMap,
                dataTypeMap,
                first = false,
                fileIdx,
                fileLen,
                sheet,
                table,
                column;

            if (error) {
                scope.importCtrl.alert('warn', error);
                return;
            }

            if (
                scope.importFileCtrl.fileType === 'CSV' ||
                scope.importFileCtrl.fileType === 'TSV'
            ) {
                for (
                    fileIdx = 0,
                        fileLen = scope.importFileCtrl.parsedFiles.length;
                    fileIdx < fileLen;
                    fileIdx++
                ) {
                    dataTypeMap = {};
                    additionalDataTypes = {};
                    newHeaders = {};
                    descriptionMap = {};
                    logicalNamesMap = {};

                    // right now this assums that there is only 1 sheet, 1 table...
                    for (sheet in scope.importFileCtrl.parsedFiles[fileIdx]
                        .sheets) {
                        if (
                            scope.importFileCtrl.parsedFiles[
                                fileIdx
                            ].sheets.hasOwnProperty(sheet)
                        ) {
                            for (table in scope.importFileCtrl.parsedFiles[
                                fileIdx
                            ].sheets[sheet].tables) {
                                if (
                                    scope.importFileCtrl.parsedFiles[
                                        fileIdx
                                    ].sheets[sheet].tables.hasOwnProperty(table)
                                ) {
                                    if (
                                        table ===
                                        scope.importFileCtrl.parsedFiles[
                                            fileIdx
                                        ].sheets[sheet].selectedTable
                                    ) {
                                        for (column in scope.importFileCtrl
                                            .parsedFiles[fileIdx].sheets[sheet]
                                            .tables[table].columns) {
                                            if (
                                                scope.importFileCtrl.parsedFiles[
                                                    fileIdx
                                                ].sheets[sheet].tables[
                                                    table
                                                ].columns.hasOwnProperty(column)
                                            ) {
                                                if (
                                                    !scope.importFileCtrl
                                                        .parsedFiles[fileIdx]
                                                        .sheets[sheet].tables[
                                                        table
                                                    ].columns[column].selected
                                                ) {
                                                    continue;
                                                }

                                                setHeaderPixelData(
                                                    scope.importFileCtrl
                                                        .parsedFiles[fileIdx]
                                                        .sheets[sheet].tables[
                                                        table
                                                    ].columns[column],
                                                    dataTypeMap,
                                                    additionalDataTypes,
                                                    newHeaders,
                                                    descriptionMap,
                                                    logicalNamesMap
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // nothing to send
                    if (
                        Object.keys(dataTypeMap).length === 0 &&
                        Object.keys(additionalDataTypes).length === 0 &&
                        Object.keys(newHeaders).length === 0 &&
                        Object.keys(descriptionMap).length === 0 &&
                        Object.keys(logicalNamesMap).length === 0
                    ) {
                        continue;
                    }

                    if (!first) {
                        pixel += 'databaseVar = ';
                    }
                    if (scope.importFileCtrl.databaseType.selected === 'R') {
                        pixel += semossCoreService.pixel.build([
                            {
                                type: scope.importCtrl.replace
                                    ? 'rReplaceDatabaseCsvUpload'
                                    : 'rCsvUpload',
                                components: [
                                    scope.importCtrl.replace
                                        ? scope.importCtrl.replace.app_id
                                        : scope.importCtrl.name.value,
                                    scope.importFileCtrl.parsedFiles[fileIdx]
                                        .fileLocation,
                                    scope.importFileCtrl.delimiter,
                                    dataTypeMap,
                                    newHeaders,
                                    additionalDataTypes,
                                    descriptionMap,
                                    logicalNamesMap,
                                    first,
                                    first ? 'databaseVar' : '',
                                ],
                                terminal: true,
                            },
                        ]);
                    } else {
                        pixel += semossCoreService.pixel.build([
                            {
                                type: scope.importCtrl.replace
                                    ? 'rdbmsReplaceDatabaseUploadTable'
                                    : 'rdbmsUploadTableData',
                                components: [
                                    scope.importCtrl.replace
                                        ? scope.importCtrl.replace.app_id
                                        : scope.importCtrl.name.value,
                                    scope.importFileCtrl.parsedFiles[fileIdx]
                                        .fileLocation,
                                    scope.importFileCtrl.delimiter,
                                    dataTypeMap,
                                    newHeaders,
                                    additionalDataTypes,
                                    descriptionMap,
                                    logicalNamesMap,
                                    first,
                                    first ? 'databaseVar' : '',
                                ],
                                terminal: true,
                            },
                        ]);
                    }

                    first = true;
                }
            } else if (scope.importFileCtrl.fileType === 'EXCEL') {
                // loop through all of the files
                for (
                    fileIdx = 0,
                        fileLen = scope.importFileCtrl.parsedFiles.length;
                    fileIdx < fileLen;
                    fileIdx++
                ) {
                    dataTypeMap = {};
                    additionalDataTypes = {};
                    newHeaders = {};
                    descriptionMap = {};
                    logicalNamesMap = {};

                    for (sheet in scope.importFileCtrl.parsedFiles[fileIdx]
                        .sheets) {
                        if (
                            scope.importFileCtrl.parsedFiles[
                                fileIdx
                            ].sheets.hasOwnProperty(sheet)
                        ) {
                            dataTypeMap[sheet] = {};
                            additionalDataTypes[sheet] = {};
                            newHeaders[sheet] = {};
                            descriptionMap[sheet] = {};
                            logicalNamesMap[sheet] = {};

                            for (table in scope.importFileCtrl.parsedFiles[
                                fileIdx
                            ].sheets[sheet].tables) {
                                if (
                                    scope.importFileCtrl.parsedFiles[
                                        fileIdx
                                    ].sheets[sheet].tables.hasOwnProperty(table)
                                ) {
                                    if (
                                        table ===
                                        scope.importFileCtrl.parsedFiles[
                                            fileIdx
                                        ].sheets[sheet].selectedTable
                                    ) {
                                        dataTypeMap[sheet][table] = {};
                                        additionalDataTypes[sheet][table] = {};
                                        newHeaders[sheet][table] = {};
                                        descriptionMap[sheet][table] = {};
                                        logicalNamesMap[sheet][table] = {};

                                        for (column in scope.importFileCtrl
                                            .parsedFiles[fileIdx].sheets[sheet]
                                            .tables[table].columns) {
                                            if (
                                                scope.importFileCtrl.parsedFiles[
                                                    fileIdx
                                                ].sheets[sheet].tables[
                                                    table
                                                ].columns.hasOwnProperty(column)
                                            ) {
                                                if (
                                                    !scope.importFileCtrl
                                                        .parsedFiles[fileIdx]
                                                        .sheets[sheet].tables[
                                                        table
                                                    ].columns[column].selected
                                                ) {
                                                    continue;
                                                }

                                                setHeaderPixelData(
                                                    scope.importFileCtrl
                                                        .parsedFiles[fileIdx]
                                                        .sheets[sheet].tables[
                                                        table
                                                    ].columns[column],
                                                    dataTypeMap[sheet][table],
                                                    additionalDataTypes[sheet][
                                                        table
                                                    ],
                                                    newHeaders[sheet][table],
                                                    descriptionMap[sheet][
                                                        table
                                                    ],
                                                    logicalNamesMap[sheet][
                                                        table
                                                    ]
                                                );
                                            }
                                        }

                                        // delete if nothing is added in
                                        if (
                                            Object.keys(
                                                dataTypeMap[sheet][table]
                                            ).length === 0
                                        ) {
                                            delete dataTypeMap[sheet][table];
                                        }

                                        if (
                                            Object.keys(
                                                additionalDataTypes[sheet][
                                                    table
                                                ]
                                            ).length === 0
                                        ) {
                                            delete additionalDataTypes[sheet][
                                                table
                                            ];
                                        }

                                        if (
                                            Object.keys(
                                                newHeaders[sheet][table]
                                            ).length === 0
                                        ) {
                                            delete newHeaders[sheet][table];
                                        }

                                        if (
                                            Object.keys(
                                                descriptionMap[sheet][table]
                                            ).length === 0
                                        ) {
                                            delete descriptionMap[sheet][table];
                                        }

                                        if (
                                            Object.keys(
                                                logicalNamesMap[sheet][table]
                                            ).length === 0
                                        ) {
                                            delete logicalNamesMap[sheet][
                                                table
                                            ];
                                        }
                                    }
                                }
                            }

                            // delete if nothing is added in
                            if (Object.keys(dataTypeMap[sheet]).length === 0) {
                                delete dataTypeMap[sheet];
                            }

                            if (
                                Object.keys(additionalDataTypes[sheet])
                                    .length === 0
                            ) {
                                delete additionalDataTypes[sheet];
                            }

                            if (Object.keys(newHeaders[sheet]).length === 0) {
                                delete newHeaders[sheet];
                            }

                            if (
                                Object.keys(descriptionMap[sheet]).length === 0
                            ) {
                                delete descriptionMap[sheet];
                            }

                            if (
                                Object.keys(logicalNamesMap[sheet]).length === 0
                            ) {
                                delete logicalNamesMap[sheet];
                            }
                        }
                    }

                    // nothing to send
                    if (
                        Object.keys(dataTypeMap).length === 0 &&
                        Object.keys(additionalDataTypes).length === 0 &&
                        Object.keys(newHeaders).length === 0 &&
                        Object.keys(descriptionMap).length === 0 &&
                        Object.keys(logicalNamesMap).length === 0
                    ) {
                        continue;
                    }

                    if (!first) {
                        pixel += 'databaseVar = ';
                    }

                    pixel += semossCoreService.pixel.build([
                        {
                            type: scope.importCtrl.replace
                                ? 'rdbmsReplaceDatabaseExcelUpload'
                                : 'rdbmsUploadExcelData',
                            components: [
                                scope.importCtrl.replace
                                    ? scope.importCtrl.replace.app_id
                                    : scope.importCtrl.name.value,
                                scope.importFileCtrl.parsedFiles[fileIdx]
                                    .fileLocation,
                                dataTypeMap,
                                newHeaders,
                                additionalDataTypes,
                                descriptionMap,
                                logicalNamesMap,
                                first,
                                first ? 'databaseVar' : '',
                            ],
                            terminal: true,
                        },
                    ]);

                    first = true;
                }
            }

            if (pixel.length === 0) {
                scope.importCtrl.alert(
                    'warn',
                    'Nothing to upload. Please select atleast one header.'
                );
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    metadata = {};

                pixel = '';

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert('error', output);
                    return;
                }

                pixel += semossCoreService.pixel.build([
                    {
                        type: 'extractDatabaseMeta',
                        components: ['', false, 'databaseVar'],
                        terminal: true,
                    },
                ]);

                if (scope.importCtrl) {
                    if (scope.importCtrl.meta.description) {
                        metadata['description'] =
                            scope.importCtrl.meta.description;
                    }
                    if (
                        scope.importCtrl.meta.tags &&
                        scope.importCtrl.meta.tags.length > 0
                    ) {
                        metadata['tags'] = scope.importCtrl.meta.tags;
                    }
                    if (Object.keys(metadata).length > 0) {
                        pixel += `SetDatabaseMetadata(database=[databaseVar], meta=[${JSON.stringify(
                            metadata
                        )}]);`;
                    }
                }

                scope.importCtrl.query([
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ]);

                scope.importCtrl.alert('success', 'Success');
                if (!scope.importCtrl.replace) {
                    scope.importCtrl.exit(output);
                }
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Sheets */
        /**
         * @name toggleSheet
         * @param {object} sheet sheet to hide / close headers
         * @description hides/shows sheet for uploading
         * @return {void}
         */
        function toggleSheet(sheet) {
            var table, column;

            sheet.selected = !sheet.selected;

            for (table in sheet.tables) {
                if (sheet.tables.hasOwnProperty(table)) {
                    for (column in sheet.tables[table].columns) {
                        if (
                            sheet.tables[table].columns.hasOwnProperty(column)
                        ) {
                            sheet.tables[table].columns[column].selected =
                                sheet.selected;
                        }
                    }
                }
            }
        }

        /** * Column Functions */
        /**
         * @name editColumn
         * @param {object} column - column to be edited
         * @desc sets the column to be edited
         * @return {void}
         */
        function editColumn(column) {
            scope.importFileFlat.column.selected = column;
            scope.importFileFlat.column.open = true;
        }

        /**
         * @name changeColumn
         * @param {string} type - new type
         * @param {string} typeFormat - new type format
         * @param {string} alias - new alias for the column
         * @param {string} description - new description for the column
         * @param {array} logical - new logical for the column
         * @desc callback for column editing
         * @return {void}
         */
        function changeColumn(type, typeFormat, alias, description, logical) {
            scope.importFileFlat.column.selected.type = type;
            scope.importFileFlat.column.selected.typeFormat = typeFormat;
            scope.importFileFlat.column.selected.alias = alias;
            scope.importFileFlat.column.selected.description = description;
            scope.importFileFlat.column.selected.logical = logical;
        }

        /** Excel */
        /**
         * @name previewCustomRange
         * @param {object} sheet - sheet in question
         * @param {object} file - file in question
         * @desc preview the custom range in the excel file
         * @returns {void}
         */
        function previewCustomRange(sheet, file) {
            var callback;

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    column,
                    typeInformation;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                sheet.tables[sheet.customRange] = {
                    alias: sheet.customRange,
                    table: sheet.customRange,
                    columns: {},
                };

                for (column in output.dataTypes) {
                    if (output.dataTypes.hasOwnProperty(column)) {
                        typeInformation =
                            scope.importFileCtrl.getParsedTypeInformation(
                                output.dataTypes[column],
                                output.additionalDataTypes[column]
                            );

                        sheet.tables[sheet.customRange].columns[column] = {
                            alias: column,
                            column: column,
                            table: sheet.customRange,
                            type: typeInformation.type,
                            typeFormat: typeInformation.typeFormat,
                            description: '',
                            logical: [],
                            selected: true,
                        };
                    }
                }

                sheet.selectedTable = sheet.customRange;
            };

            scope.importCtrl.query(
                [
                    {
                        meta: true,
                        type: 'predictExcelRangeMetadata',
                        components: [
                            file.fileLocation,
                            sheet.sheet,
                            sheet.customRange,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Utility */
        /**
         * @name setHeaderPixelData
         * @desc sets the header data (for import)
         * @param {object} header - raw header
         * @param {object} dataTypeMap -
         * @param {object} additionalDataTypes -
         * @param {object} newHeaders -
         * @param {object} descriptionMap -
         * @param {object} logicalNamesMap -
         * @returns {void}
         */
        function setHeaderPixelData(
            header,
            dataTypeMap,
            additionalDataTypes,
            newHeaders,
            descriptionMap,
            logicalNamesMap
        ) {
            if (header.type === 'NUMBER') {
                if (header.typeFormat) {
                    dataTypeMap[header.alias] = header.typeFormat;
                } else {
                    dataTypeMap[header.alias] = 'DOUBLE';
                }
            } else {
                dataTypeMap[header.alias] = header.type;
            }

            // TODO excel uploads typeformat is returned as m/d/yy which is incorrect
            if (
                header.type === 'DATE' &&
                header.typeFormat &&
                header.typeFormat === 'm/d/yy'
            ) {
                header.typeFormat = 'M/d/yyyy';
            }

            // set the format
            if (header.type !== 'NUMBER') {
                if (header.typeFormat) {
                    additionalDataTypes[header.alias] = header.typeFormat;
                }
            }

            // set the naming
            if (header.column !== header.alias) {
                newHeaders[header.alias] = header.column;
            }

            // set the description
            if (header.description) {
                descriptionMap[header.alias] = header.description;
            }

            // set the logical
            if (header.logical && header.logical.length > 0) {
                logicalNamesMap[header.alias] = header.logical;
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @return {void}
         */
        function initialize() {
            setFlat();
        }

        initialize();
    }
}
