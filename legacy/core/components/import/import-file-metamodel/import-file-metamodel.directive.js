'use strict';

export default angular
    .module('app.import-file-metamodel.directive', [])
    .directive('importFileMetamodel', importFileMetamodelDirective);

importFileMetamodelDirective.$inject = ['semossCoreService'];

import './import-file-metamodel.scss';

function importFileMetamodelDirective(semossCoreService) {
    importFileMetamodelCtrl.$inject = [];
    importFileMetamodelLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./import-file-metamodel.directive.html'),
        scope: {},
        require: ['^import', '^importFile'],
        bindToController: {},
        controllerAs: 'importFileMetamodel',
        controller: importFileMetamodelCtrl,
        link: importFileMetamodelLink,
    };

    function importFileMetamodelCtrl() {}

    function importFileMetamodelLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];
        scope.importFileCtrl = ctrl[1];

        scope.importFileMetamodel.selectedFile = '';

        scope.importFileMetamodel.changeSelectedFile = changeSelectedFile;
        scope.importFileMetamodel.importData = importData;
        scope.importFileMetamodel.editItem = editItem;
        scope.importFileMetamodel.changeColumn = changeColumn;

        /**
         * @name changeSelectedFile
         * @desc change the selectedFile
         * @param {string} fileLocation - location of the file
         * @returns{void}
         */
        function changeSelectedFile(fileLocation) {
            var fileIdx, fileLen;

            scope.importFileMetamodel.selectedFile = fileLocation;

            for (
                fileIdx = 0, fileLen = scope.importFileCtrl.parsedFiles.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                if (
                    scope.importFileCtrl.parsedFiles[fileIdx].fileLocation ===
                    fileLocation
                ) {
                    if (
                        scope.importFileCtrl.parsedFiles[fileIdx].metamodel &&
                        scope.importFileCtrl.parsedFiles[fileIdx].metamodel
                            .tables &&
                        Object.keys(
                            scope.importFileCtrl.parsedFiles[fileIdx].metamodel
                                .tables
                        ).length === 0
                    ) {
                        scope.importFileCtrl.parsedFiles[
                            fileIdx
                        ].showEditTables = true;
                    }

                    break;
                }
            }
        }

        /**
         * @name importData
         * @desc validate the header information and then load the data
         * @returns{void}
         */
        function importData() {
            // CODE for drop flat table. Creates DB through pkql
            var pixel = '',
                component,
                callback,
                newHeaders,
                additionalDataTypes,
                descriptionMap,
                logicalNamesMap,
                dataTypeMap,
                metamodel,
                i,
                len,
                table,
                column,
                relationshipIdx,
                relationshipLen,
                positions = {},
                first = false;

            if (
                scope.importFileCtrl.fileType === 'CSV' ||
                scope.importFileCtrl.fileType === 'TSV'
            ) {
                for (
                    i = 0, len = scope.importFileCtrl.parsedFiles.length;
                    i < len;
                    i++
                ) {
                    dataTypeMap = {};
                    additionalDataTypes = {};
                    newHeaders = {};
                    descriptionMap = {};
                    logicalNamesMap = {};
                    metamodel = {
                        relation: [],
                        nodeProp: {},
                    };

                    for (table in scope.importFileCtrl.parsedFiles[i].metamodel
                        .tables) {
                        if (
                            scope.importFileCtrl.parsedFiles[
                                i
                            ].metamodel.tables.hasOwnProperty(table)
                        ) {
                            metamodel.nodeProp[
                                scope.importFileCtrl.parsedFiles[
                                    i
                                ].metamodel.tables[table].columns[table].alias
                            ] = [];

                            for (column in scope.importFileCtrl.parsedFiles[i]
                                .metamodel.tables[table].columns) {
                                if (
                                    scope.importFileCtrl.parsedFiles[
                                        i
                                    ].metamodel.tables[
                                        table
                                    ].columns.hasOwnProperty(column)
                                ) {
                                    setHeaderPixelData(
                                        scope.importFileCtrl.parsedFiles[i]
                                            .metamodel.tables[table].columns[
                                            column
                                        ],
                                        dataTypeMap,
                                        additionalDataTypes,
                                        newHeaders,
                                        descriptionMap,
                                        logicalNamesMap
                                    );

                                    if (column !== table) {
                                        metamodel.nodeProp[
                                            scope.importFileCtrl.parsedFiles[i]
                                                .metamodel.tables[table]
                                                .columns[table].alias
                                        ].push(
                                            scope.importFileCtrl.parsedFiles[i]
                                                .metamodel.tables[table]
                                                .columns[column].alias
                                        );
                                    }
                                }
                            }

                            positions[
                                scope.importFileCtrl.parsedFiles[
                                    i
                                ].metamodel.tables[table].alias
                            ] =
                                scope.importFileCtrl.parsedFiles[
                                    i
                                ].metamodel.tables[table].position;
                        }
                    }

                    for (
                        relationshipIdx = 0,
                            relationshipLen =
                                scope.importFileCtrl.parsedFiles[i].metamodel
                                    .relationships.length;
                        relationshipIdx < relationshipLen;
                        relationshipIdx++
                    ) {
                        metamodel.relation.push({
                            fromTable:
                                scope.importFileCtrl.parsedFiles[i].metamodel
                                    .tables[
                                    scope.importFileCtrl.parsedFiles[i]
                                        .metamodel.relationships[
                                        relationshipIdx
                                    ].fromTable
                                ].columns[
                                    scope.importFileCtrl.parsedFiles[i]
                                        .metamodel.relationships[
                                        relationshipIdx
                                    ].fromTable
                                ].alias,
                            toTable:
                                scope.importFileCtrl.parsedFiles[i].metamodel
                                    .tables[
                                    scope.importFileCtrl.parsedFiles[i]
                                        .metamodel.relationships[
                                        relationshipIdx
                                    ].toTable
                                ].columns[
                                    scope.importFileCtrl.parsedFiles[i]
                                        .metamodel.relationships[
                                        relationshipIdx
                                    ].toTable
                                ].alias,
                            relName:
                                scope.importFileCtrl.parsedFiles[i].metamodel
                                    .relationships[relationshipIdx].alias,
                        });
                    }

                    if (!first) {
                        pixel += 'databaseVar = ';
                    }

                    if (scope.importFileCtrl.databaseType.selected === 'H2') {
                        component = {
                            type: scope.importCtrl.replace
                                ? 'rdbmsReplaceDatabaseCsvUpload'
                                : 'rdbmsCsvUpload',
                            components: [
                                scope.importCtrl.replace
                                    ? scope.importCtrl.replace.app_id
                                    : scope.importCtrl.name.value,
                                scope.importFileCtrl.parsedFiles[i]
                                    .fileLocation,
                                scope.importFileCtrl.delimiter,
                                '',
                                metamodel,
                                dataTypeMap,
                                newHeaders,
                                additionalDataTypes,
                                descriptionMap,
                                logicalNamesMap,
                                first,
                                first ? 'databaseVar' : '',
                            ],
                            terminal: true,
                        };
                    } else if (
                        scope.importFileCtrl.databaseType.selected === 'RDF'
                    ) {
                        component = {
                            type: scope.importCtrl.replace
                                ? 'rdfReplaceDatabaseCsvUpload'
                                : 'rdfCsvUpload',
                            components: [
                                scope.importCtrl.replace
                                    ? scope.importCtrl.replace.app_id
                                    : scope.importCtrl.name.value,
                                scope.importFileCtrl.parsedFiles[i]
                                    .fileLocation,
                                scope.importFileCtrl.delimiter,
                                '',
                                metamodel,
                                dataTypeMap,
                                newHeaders,
                                additionalDataTypes,
                                descriptionMap,
                                logicalNamesMap,
                                scope.importFileCtrl.databaseType.specific.uri,
                                first,
                                first ? 'databaseVar' : '',
                            ],
                            terminal: true,
                        };
                    } else if (
                        scope.importFileCtrl.databaseType.selected === 'Tinker'
                    ) {
                        component = {
                            type: scope.importCtrl.replace
                                ? 'tinkerReplaceDatabaseCsvUpload'
                                : 'tinkerCsvUpload',
                            components: [
                                scope.importCtrl.replace
                                    ? scope.importCtrl.replace.app_id
                                    : scope.importCtrl.name.value,
                                scope.importFileCtrl.parsedFiles[i]
                                    .fileLocation,
                                scope.importFileCtrl.delimiter,
                                '',
                                metamodel,
                                dataTypeMap,
                                newHeaders,
                                additionalDataTypes,
                                descriptionMap,
                                logicalNamesMap,
                                scope.importFileCtrl.databaseType.specific
                                    .selected,
                                first,
                                first ? 'databaseVar' : '',
                            ],
                            terminal: true,
                        };
                    }

                    pixel += semossCoreService.pixel.build([component]);

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

                if (scope.importCtrl.meta.description) {
                    metadata['description'] = scope.importCtrl.meta.description;
                }
                if (scope.importCtrl.meta.tags) {
                    metadata['tags'] = scope.importCtrl.meta.tags;
                }
                if (
                    Object.keys(metadata).length > 0 &&
                    scope.importCtrl.meta.tags.length > 0
                ) {
                    pixel += `SetDatabaseMetadata(database=[databaseVar], meta=[${JSON.stringify(
                        metadata
                    )}]);`;
                }

                if (Object.keys(positions).length > 0) {
                    pixel += `SaveOwlPositions(database=[databaseVar], positionMap=[${JSON.stringify(
                        positions
                    )}]);`;
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

        /** Edit */
        /**
        /**
          * @name editItem
          * @desc selects a column to grab data about
          * @param {object} file - selected file
          * @param {string} type - type of edit (table, column)
          * @param {string} options - options to save
          * @return {void}
         */
        function editItem(file, type, options) {
            // we are only selected the table
            if (type === 'table') {
                file.showEditTable = true;

                file.selectedTable = options.table;
            } else if (type === 'column') {
                file.showEditColumn = true;

                file.selectedTable = options.table;
                file.selectedColumn = options.column;
            }
        }

        /**
         * @name changeColumn
         * @param {object} file - file to change
         * @param {string} type - type that was formatted
         * @param {string} typeFormat - new typeformat
         * @param {string} alias - new alias for the column
         * @param {string} description - new description for the column
         * @param {array} logical - new logical for the column
         * @desc callback for header formatting
         * @return {void}
         */
        function changeColumn(
            file,
            type,
            typeFormat,
            alias,
            description,
            logical
        ) {
            // update the values
            file.metamodel.tables[file.selectedTable].columns[
                file.selectedColumn
            ].type = type;
            file.metamodel.tables[file.selectedTable].columns[
                file.selectedColumn
            ].typeFormat = typeFormat;
            file.metamodel.tables[file.selectedTable].columns[
                file.selectedColumn
            ].alias = alias;
            file.metamodel.tables[file.selectedTable].columns[
                file.selectedColumn
            ].description = description;
            file.metamodel.tables[file.selectedTable].columns[
                file.selectedColumn
            ].logical = logical;

            // reset
            file.showEditColumn = false;
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
            var fileIdx, fileLen;

            // add specific information
            for (
                fileIdx = 0, fileLen = scope.importFileCtrl.parsedFiles.length;
                fileIdx < fileLen;
                fileIdx++
            ) {
                scope.importFileCtrl.parsedFiles[
                    fileIdx
                ].showEditTables = false;
                scope.importFileCtrl.parsedFiles[
                    fileIdx
                ].showEditRelationships = false;
                scope.importFileCtrl.parsedFiles[fileIdx].showEditTable = false;
                scope.importFileCtrl.parsedFiles[
                    fileIdx
                ].showEditColumn = false;
                scope.importFileCtrl.parsedFiles[fileIdx].selectedTable = false;
                scope.importFileCtrl.parsedFiles[
                    fileIdx
                ].selectedColumn = false;
            }

            // select a file
            if (scope.importFileCtrl.parsedFiles.length > 0) {
                changeSelectedFile(
                    scope.importFileCtrl.parsedFiles[0].fileLocation
                );
            }
        }

        initialize();
    }
}
