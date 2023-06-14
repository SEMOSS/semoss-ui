'use strict';

export default angular
    .module('app.import-file-table.directive', [])
    .directive('importFileTable', importFileTableDirective);

import './import-file-table.scss';

importFileTableDirective.$inject = [
    '$timeout',
    'monolithService',
    'semossCoreService',
];

function importFileTableDirective(
    $timeout,
    monolithService,
    semossCoreService
) {
    importFileTableController.$inject = [];
    importFileTableLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importFileTableController,
        bindToController: {
            fileType: '=',
            sentFileData: '=',
        },
        controllerAs: 'importFileTable',
        link: importFileTableLink,
        template: require('./import-file-table.directive.html'),
    };

    function importFileTableController() {}

    function importFileTableLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importFileTable.rawFiles;
        scope.importFileTable.step = 'initial'; // step of data
        scope.importFileTable.connection = {
            dbDriver: '',
            hostname: '',
            schema: '',
            username: '',
            password: '',
            additional: '',
        };

        scope.importFileTable.filter = {
            open: false,
            viewOptions: [],
            viewModel: [],
            tableOptions: [],
            tableModel: [],
        };

        scope.importFileTable.metamodel = {
            tables: {},
            relationships: [],
        };

        scope.importFileTable.setFile = setFile;
        scope.importFileTable.checkFileExtension = checkFileExtension;
        scope.importFileTable.cancelFiles = cancelFiles;
        scope.importFileTable.checkFile = checkFile;
        scope.importFileTable.uploadFile = uploadFile;
        scope.importFileTable.loadMetamodel = loadMetamodel;
        scope.importFileTable.importMetamodel = importMetamodel;

        /** Steps */
        /** Initial */
        /**
         * @name setFileType
         * @desc reset the selected form when the type changes
         * @return {void}
         */
        function setFileType() {
            var fileIdx = scope.importFileTable.rawFiles.files.length;

            while (fileIdx--) {
                if (
                    !checkFileExtension(
                        scope.importFileTable.rawFiles.files[fileIdx]
                    )
                ) {
                    cancelFiles(scope.importFileTable.rawFiles.files[fileIdx]);
                }
            }

            setFile();
        }

        /**
         * @name setFile
         * @desc reset the selected form
         * @return {void}
         */
        function setFile() {
            scope.importFileTable.step = 'initial'; // step of data

            scope.importFileTable.connection = {
                dbDriver: '',
                hostname: '',
                schema: '',
                username: '',
                password: '',
                additional: '',
            };

            scope.importFileTable.filter = {
                open: false,
                viewOptions: [],
                viewModel: [],
                tableOptions: [],
                tableModel: [],
            };

            scope.importFileTable.metamodel = {
                tables: {},
                relationships: [],
            };
        }

        /**
         * @name checkFile
         * @desc validate the connection form
         * @return {boolean} is the connection valid or not?
         */
        function checkFile() {
            return (
                scope.importCtrl.name.valid &&
                scope.importFileTable.rawFiles.files.length > 0
            );
        }

        /**
         * @name checkFileExtension
         * @param {file} file - flow file
         * @desc checks file extension (must be csv) and makes sure there is only one file added
         * @returns {boolean} - checks wether it is an acceptable file
         */
        function checkFileExtension(file) {
            var fileExtension = getFileExtension(file);

            if (fileExtension) {
                if (scope.importFileTable.fileType === 'H2_DB') {
                    if (fileExtension === 'db') {
                        return true;
                    }

                    scope.importCtrl.alert(
                        'error',
                        'File must be a valid H2 format (.db). ' +
                            file.name +
                            ' is not a valid file'
                    );
                    return false;
                } else if (scope.importFileTable.fileType === 'SQLITE') {
                    if (fileExtension === 'sqlite') {
                        return true;
                    }

                    scope.importCtrl.alert(
                        'error',
                        'File must be a valid SQLite format (.sqlite). ' +
                            file.name +
                            ' is not a valid file'
                    );
                    return false;
                }
            }

            scope.importCtrl.alert(
                'error',
                'File must be valid. ' + file.name + ' is not a valid file'
            );
            return false;
        }
        /**
         * @name getFileExtension
         * @param {file|string} file - flow file
         * @desc gets the file extension type
         * @returns {*} - gets the file type from the extension
         */
        function getFileExtension(file) {
            var fileExtension;

            if (!file) {
                return 'not a file';
            }
            if (typeof file === 'string') {
                fileExtension = file.substr(file.lastIndexOf('.') + 1);
            } else {
                fileExtension = file.getExtension();
            }

            return fileExtension;
        }

        /**
         * @name cancelFiles
         * @param {file} file - flow file
         * @desc cancel the files
         * @returns {void}
         */
        function cancelFiles(file) {
            if (file) {
                file.cancel();
            }
        }

        /**
         * @name uploadFile
         * @desc set correct options when the database changes
         * @param {boolean} reset - reset the connection?
         * @return {void}
         */
        function uploadFile(reset) {
            // using the jobid to be the same as the insight id
            var jobId = semossCoreService.get('queryInsightID');

            semossCoreService.emit('start-polling', {
                id: jobId,
                listeners: [jobId],
            });

            monolithService
                .uploadFile(scope.importFileTable.rawFiles.files, jobId)
                .then(
                    function (data) {
                        try {
                            if (data.length === 0) {
                                scope.importCtrl.alert(
                                    'error',
                                    'No File Found'
                                );
                                return;
                            }

                            scope.importFileTable.connection.hostname =
                                data[0].fileLocation;
                            setTable(reset);
                        } finally {
                            semossCoreService.emit('stop-polling', {
                                id: jobId,
                                listeners: [jobId],
                            });
                        }
                    },
                    function () {
                        // if call errors out, stop the polling
                        semossCoreService.emit('stop-polling', {
                            id: jobId,
                            listeners: [jobId],
                        });
                    }
                );
        }

        /**
         * @name setTable
         * @desc load the connection details, validating that it is correct and grabbing the table information
         * @param {boolean} reset - reset the connection?
         * @return {void}
         */
        function setTable(reset) {
            var callback;

            if (!scope.importFileTable.connection.hostname) {
                scope.importCtrl.alert('error', 'Unable to find file to load');
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert(
                        'error',
                        'Unable to connect to ' + scope.importCtrl.name.value
                    );
                    return;
                }

                if (output.views.length === 0 && output.tables.length === 0) {
                    scope.importCtrl.alert(
                        'warn',
                        'Unable to find Tables or View for ' +
                            scope.importCtrl.name.value
                    );
                    return;
                }

                scope.importFileTable.filter.viewOptions = JSON.parse(
                    JSON.stringify(output.views)
                );
                scope.importFileTable.filter.tableOptions = JSON.parse(
                    JSON.stringify(output.tables)
                );
                if (reset) {
                    scope.importFileTable.filter.viewModel = JSON.parse(
                        JSON.stringify(output.views)
                    );
                    scope.importFileTable.filter.tableModel = JSON.parse(
                        JSON.stringify(output.tables)
                    );
                }

                // open and shift the page
                scope.importFileTable.step = 'metamodel';
                scope.importFileTable.filter.open = true;
            };

            // generate map of connection details to pass to reactor
            scope.importFileTable.connection.dbDriver =
                scope.importFileTable.fileType;

            scope.importCtrl.query(
                [
                    {
                        type: 'externalJdbcTablesAndViews',
                        components: [
                            semossCoreService.utility.freeze(
                                scope.importFileTable.connection
                            ),
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Step 2 */
        /**
         * @name loadMetamodel
         * @desc load the metamodel
         * @return {void}
         */
        function loadMetamodel() {
            var callback;

            if (
                scope.importFileTable.filter.tableModel.length === 0 &&
                scope.importFileTable.filter.viewModel.length === 0
            ) {
                return;
            }

            // close the filter
            scope.importFileTable.filter.open = false;

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    tableMapping,
                    i,
                    len,
                    j,
                    len2;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert(
                        'error',
                        'Unable to connect to ' + scope.importCtrl.name.value
                    );
                    scope.importFileTable.filter.open = true;
                    return;
                }

                // create a mapping, this will help us update the tables (rather than replace)
                tableMapping = {};
                for (i = 0, len = output.tables.length; i < len; i++) {
                    tableMapping[output.tables[i].table] = i;
                }

                // remove relationships that are between tables that are missing
                for (
                    i =
                        scope.importFileTable.metamodel.relationships.length -
                        1;
                    i >= 0;
                    i--
                ) {
                    // remove the relationship, that if a table in the mapping
                    if (
                        !tableMapping.hasOwnProperty(
                            scope.importFileTable.metamodel.relationships[i]
                                .fromTable
                        ) ||
                        !tableMapping.hasOwnProperty(
                            scope.importFileTable.metamodel.relationships[i]
                                .toTable
                        )
                    ) {
                        scope.importFileTable.metamodel.relationships.splice(
                            i,
                            1
                        );
                    }
                }

                // add relationships if they do not exist
                relLoop: for (
                    i = 0, len = output.relationships.length;
                    i < len;
                    i++
                ) {
                    // look at all of them
                    for (
                        j = 0,
                            len2 =
                                scope.importFileTable.metamodel.relationships
                                    .length;
                        j < len2;
                        j++
                    ) {
                        // already exists
                        if (
                            scope.importFileTable.metamodel.relationships[j]
                                .fromTable ===
                                output.relationships[i].fromTable &&
                            scope.importFileTable.metamodel.relationships[j]
                                .fromColumn ===
                                output.relationships[i].fromCol &&
                            scope.importFileTable.metamodel.relationships[j]
                                .toTable === output.relationships[i].toTable &&
                            scope.importFileTable.metamodel.relationships[j]
                                .toColumn === output.relationships[i].toCol
                        ) {
                            continue relLoop;
                        }
                    }

                    scope.importFileTable.metamodel.relationships.push({
                        fromTable: output.relationships[i].fromTable,
                        fromColumn: output.relationships[i].fromCol,
                        toTable: output.relationships[i].toTable,
                        toColumn: output.relationships[i].toCol,
                        alias: '',
                    });
                }

                // delete the tables
                for (i in scope.importFileTable.metamodel.tables) {
                    if (
                        !tableMapping.hasOwnProperty(
                            scope.importFileTable.metamodel.tables[i].table
                        )
                    ) {
                        // remove the tables, that aren't in the mapping
                        delete scope.importFileTable.metamodel.tables[i];
                    } else {
                        // delete the mapping value, because it is already added
                        delete tableMapping[
                            scope.importFileTable.metamodel.tables[i].table
                        ];
                    }
                }

                // add the tables that are remaining in the mapping
                for (i in tableMapping) {
                    if (tableMapping.hasOwnProperty(i)) {
                        scope.importFileTable.metamodel.tables[
                            output.tables[tableMapping[i]].table
                        ] = {
                            alias: output.tables[tableMapping[i]].table,
                            table: output.tables[tableMapping[i]].table,
                            position:
                                output.positions &&
                                output.positions[
                                    output.tables[tableMapping[i]].table
                                ]
                                    ? output.positions[
                                          output.tables[tableMapping[i]].table
                                      ]
                                    : {
                                          top: 0,
                                          left: 0,
                                      },
                            columns: {},
                        };

                        for (
                            j = 0,
                                len2 =
                                    output.tables[tableMapping[i]].columns
                                        .length;
                            j < len2;
                            j++
                        ) {
                            scope.importFileTable.metamodel.tables[
                                output.tables[tableMapping[i]].table
                            ].columns[
                                output.tables[tableMapping[i]].columns[j]
                            ] = {
                                alias: output.tables[tableMapping[i]].columns[
                                    j
                                ],
                                column: output.tables[tableMapping[i]].columns[
                                    j
                                ],
                                table: output.tables[tableMapping[i]].table,
                                isPrimKey:
                                    output.tables[tableMapping[i]].isPrimKey[j],
                                type: output.tables[tableMapping[i]].type[j],
                            };
                        }
                    }
                }
            };
            // generate map of connection details to pass to reactor
            scope.importFileTable.connection.dbDriver =
                scope.importFileTable.fileType;

            scope.importCtrl.query(
                [
                    {
                        type: 'externalJdbcSchema',
                        components: [
                            semossCoreService.utility.freeze(
                                scope.importFileTable.connection
                            ),
                            scope.importFileTable.filter.tableModel.concat(
                                scope.importFileTable.filter.viewModel
                            ),
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name importMetamodel
         * @desc import the metamodel
         * @return {void}
         */
        function importMetamodel() {
            var metamodel = {
                    relationships: [],
                    tables: {},
                },
                callback,
                pixel = '',
                metadata = {},
                positions = {};

            // we need to construt an object for the metamodel (special format)
            for (
                let i = 0,
                    len = scope.importFileTable.metamodel.relationships.length;
                i < len;
                i++
            ) {
                metamodel.relationships.push({
                    relName:
                        scope.importFileTable.metamodel.relationships[i]
                            .fromColumn +
                        '.' +
                        scope.importFileTable.metamodel.relationships[i]
                            .toColumn,
                    toTable:
                        scope.importFileTable.metamodel.relationships[i]
                            .toTable,
                    fromTable:
                        scope.importFileTable.metamodel.relationships[i]
                            .fromTable,
                });
            }

            for (let i in scope.importFileTable.metamodel.tables) {
                if (scope.importFileTable.metamodel.tables.hasOwnProperty(i)) {
                    let primKey = '',
                        concat = '';

                    // assume that the first primkey is the important one. The user can change it later on
                    for (let j in scope.importFileTable.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.importFileTable.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            if (
                                scope.importFileTable.metamodel.tables[i]
                                    .columns[j].isPrimKey
                            ) {
                                primKey =
                                    scope.importFileTable.metamodel.tables[i]
                                        .columns[j].column;
                                break;
                            }
                        }
                    }

                    // if there is no primKey, we assume it is the first one... SQL Tables always have a column
                    if (!primKey) {
                        primKey =
                            scope.importFileTable.metamodel.tables[i].columns[
                                Object.keys(
                                    scope.importFileTable.metamodel.tables[i]
                                        .columns
                                )[0]
                            ].column;
                    }

                    concat =
                        scope.importFileTable.metamodel.tables[i].table +
                        '.' +
                        primKey;

                    metamodel.tables[concat] = [];
                    for (let j in scope.importFileTable.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.importFileTable.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            metamodel.tables[concat].push(
                                scope.importFileTable.metamodel.tables[i]
                                    .columns[j].column
                            );
                        }
                    }

                    // save positions
                    positions[scope.importFileTable.metamodel.tables[i].table] =
                        scope.importFileTable.metamodel.tables[i].position;
                }
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                scope.importCtrl.alert('success', 'Success');
                scope.importCtrl.exit(output);
            };

            // generate map of connection details to pass to reactor
            scope.importFileTable.connection.dbDriver =
                scope.importFileTable.fileType;

            pixel += 'databaseVar = ';
            pixel += semossCoreService.pixel.build([
                {
                    type: 'rdbmsExternalUpload',
                    components: [
                        semossCoreService.utility.freeze(
                            scope.importFileTable.connection
                        ),
                        scope.importCtrl.name.value,
                        metamodel,
                    ],
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

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            scope.$watch(
                'importFileTable.fileType',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        setFileType();
                    }
                }
            );

            setFile();

            if (
                scope.importFileTable.sentFileData &&
                scope.importFileTable.sentFileData.file
            ) {
                $timeout(function () {
                    scope.importFileTable.rawFiles.addFile(
                        scope.importFileTable.sentFileData.file
                    );
                });
            }
        }

        initialize();
    }
}
