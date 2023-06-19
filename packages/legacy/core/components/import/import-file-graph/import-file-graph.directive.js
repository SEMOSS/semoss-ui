'use strict';

export default angular
    .module('app.import-file-graph.directive', [])
    .directive('importFileGraph', importFileGraphDirective);

import './import-file-graph.scss';

importFileGraphDirective.$inject = [
    '$timeout',
    'monolithService',
    'semossCoreService',
];

function importFileGraphDirective(
    $timeout,
    monolithService,
    semossCoreService
) {
    importFileGraphController.$inject = [];
    importFileGraphLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importFileGraphController,
        bindToController: {
            fileType: '=',
            sentFileData: '=',
        },
        controllerAs: 'importFileGraph',
        link: importFileGraphLink,
        template: require('./import-file-graph.directive.html'),
    };

    function importFileGraphController() {}

    function importFileGraphLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importFileGraph.step = 'initial'; // step of data

        scope.importFileGraph.loadedFile = {};
        scope.importFileGraph.graph = {
            type: '',
            name: '',
            options: [],
        };
        scope.importFileGraph.metamodel = {
            tables: {},
            relationships: [],
        };

        scope.importFileGraph.setFile = setFile;
        scope.importFileGraph.checkFileExtension = checkFileExtension;
        scope.importFileGraph.cancelFiles = cancelFiles;
        scope.importFileGraph.checkFile = checkFile;
        scope.importFileGraph.uploadFile = uploadFile;
        scope.importFileGraph.checkGraph = checkGraph;
        scope.importFileGraph.loadGraph = loadGraph;
        scope.importFileGraph.resetGraph = resetGraph;
        scope.importFileGraph.importMetamodel = importMetamodel;

        /** Steps */
        /** Step 1 */
        /**
         * @name setFileType
         * @desc reset the selected form when the type changes
         * @return {void}
         */
        function setFileType() {
            var fileIdx = scope.importFileGraph.rawFiles.files.length;

            while (fileIdx--) {
                if (
                    !checkFileExtension(
                        scope.importFileGraph.rawFiles.files[fileIdx]
                    )
                ) {
                    cancelFiles(scope.importFileGraph.rawFiles.files[fileIdx]);
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
            scope.importFileGraph.step = 'initial'; // step of data

            scope.importFileGraph.loadedFile = {};

            scope.importFileGraph.graph = {
                type: '',
                name: '',
                options: [],
            };

            scope.importFileGraph.metamodel = {
                tables: {},
                relationships: [],
            };
        }

        /**
         * @name checkFile
         * @desc validate the file form
         * @return {boolean} is the file valid or not?
         */
        function checkFile() {
            return (
                scope.importCtrl.name.valid &&
                scope.importFileGraph.rawFiles.files.length > 0
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
                if (scope.importFileGraph.fileType === 'NEO4J') {
                    if (fileExtension === 'zip') {
                        return true;
                    }

                    scope.importCtrl.alert(
                        'error',
                        'File must be a zip. ' +
                            file.name +
                            ' is not a valid file'
                    );
                    return false;
                } else if (scope.importFileGraph.fileType === 'TINKER') {
                    if (
                        fileExtension === 'tg' ||
                        fileExtension === 'xml' ||
                        fileExtension === 'json'
                    ) {
                        return true;
                    }

                    scope.importCtrl.alert(
                        'error',
                        'File must be a valid Tinker format (tg, xml, or json). ' +
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
         * @return {void}
         */
        function uploadFile() {
            // using the jobid to be the same as the insight id
            var jobId = semossCoreService.get('queryInsightID');

            scope.importFileGraph.loadedFile = {};

            semossCoreService.emit('start-polling', {
                id: jobId,
                listeners: [jobId],
            });

            monolithService
                .uploadFile(scope.importFileGraph.rawFiles.files, jobId)
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

                            scope.importFileGraph.loadedFile = {
                                fileName: data[0].fileName,
                                fileLocation: data[0].fileLocation,
                            };

                            setGraph();
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
         * @name setGraph
         * @desc set the graph information for the second step
         * @return {void}
         */
        function setGraph() {
            var callback;

            callback = function (response) {
                var type = response.pixelReturn[0].operationType,
                    output = response.pixelReturn[0].output;

                if (
                    type.indexOf('ERROR') > -1 ||
                    type.indexOf('INVALID_SYNTAX') > -1
                ) {
                    return;
                }

                // open and shift the page
                scope.importFileGraph.graph.options = output;

                if (scope.importFileGraph.graph.options.length > 0) {
                    if (
                        scope.importFileGraph.graph.options.indexOf(
                            scope.importFileGraph.graph.type
                        ) === -1
                    ) {
                        scope.importFileGraph.graph.type =
                            scope.importFileGraph.graph.options[0];
                    }

                    if (
                        scope.importFileGraph.graph.options.indexOf(
                            scope.importFileGraph.graph.name
                        ) === -1
                    ) {
                        scope.importFileGraph.graph.name =
                            scope.importFileGraph.graph.options[0];
                    }
                } else {
                    scope.importFileGraph.graph.type = '';
                    scope.importFileGraph.graph.name = '';
                }

                scope.importFileGraph.step = 'options';
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'getGraphProperties',
                        components: [
                            scope.importFileGraph.loadedFile.fileLocation,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name loadGraph
         * @desc load the graph form
         * @return {void}
         */
        function loadGraph() {
            var callback;

            if (!checkGraph()) {
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    i,
                    j;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert('error', output);
                    return;
                }

                scope.importFileGraph.metamodel = {
                    tables: {},
                    relationships: [],
                };

                for (i in output.edges) {
                    if (output.edges.hasOwnProperty(i)) {
                        scope.importFileGraph.metamodel.relationships.push({
                            fromTable: output.edges[i][0],
                            fromColumn: '',
                            toTable: output.edges[i][1],
                            toColumn: '',
                            alias: '',
                        });
                    }
                }

                for (i in output.nodes) {
                    if (output.nodes.hasOwnProperty(i)) {
                        scope.importFileGraph.metamodel.tables[i] = {
                            alias: i,
                            table: i,
                            position:
                                output.positions && output.positions[i]
                                    ? output.positions[i]
                                    : {
                                          top: 0,
                                          left: 0,
                                      },
                            columns: {},
                        };

                        // add the pk
                        scope.importFileGraph.metamodel.tables[i].columns[i] = {
                            alias: i,
                            column: i,
                            table: i,
                            isPrimKey: true,
                            type: '',
                        };

                        for (j in output.nodes[i]) {
                            if (output.nodes[i].hasOwnProperty(j)) {
                                scope.importFileGraph.metamodel.tables[
                                    i
                                ].columns[j] = {
                                    alias: j,
                                    column: j,
                                    table: i,
                                    isPrimKey: false,
                                    type: output.nodes[i][j],
                                };
                            }
                        }
                    }
                }
                // open and shift the page
                scope.importFileGraph.step = 'metamodel';
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'getGraphMetaModel',
                        components: [
                            scope.importFileGraph.loadedFile.fileLocation,
                            scope.importFileGraph.graph.type,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name resetGraph
         * @desc reset the graph form
         * @return {void}
         */
        function resetGraph() {
            scope.importFileGraph.graph.type = '';
            scope.importFileGraph.graph.name = '';

            scope.importFileGraph.metamodel = {
                tables: {},
                relationships: [],
            };

            scope.importFileGraph.step = 'options'; // step of data
        }

        /**
         * @name checkGraph
         * @desc validate the graph form
         * @return {boolean} is the file valid or not?
         */
        function checkGraph() {
            return (
                scope.importFileGraph.graph.type &&
                scope.importFileGraph.graph.name
            );
        }

        /**
         * @name importMetamodel
         * @desc import the metamodel
         * @return {void}
         */
        function importMetamodel() {
            let metamodel = {
                    nodes: {},
                    edges: {},
                },
                callback,
                pixel = '',
                metadata = {},
                positions = {};

            // we need to construt an object for the metamodel (special format)
            for (
                let i = 0,
                    len = scope.importFileGraph.metamodel.relationships.length;
                i < len;
                i++
            ) {
                metamodel.edges[
                    scope.importFileGraph.metamodel.relationships[i]
                        .fromColumn +
                        '.' +
                        scope.importFileGraph.metamodel.relationships[i].toTable
                ] = [
                    scope.importFileGraph.metamodel.relationships[i].fromTable,
                    scope.importFileGraph.metamodel.relationships[i].toTable,
                ];
            }

            for (let i in scope.importFileGraph.metamodel.tables) {
                if (scope.importFileGraph.metamodel.tables.hasOwnProperty(i)) {
                    metamodel.nodes[
                        scope.importFileGraph.metamodel.tables[i].table
                    ] = {};

                    for (let j in scope.importFileGraph.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.importFileGraph.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            // skip the pimkey because it was already added in
                            if (
                                !scope.importFileGraph.metamodel.tables[i]
                                    .columns[j].isPrimKey
                            ) {
                                metamodel.nodes[
                                    scope.importFileGraph.metamodel.tables[
                                        i
                                    ].table
                                ][
                                    scope.importFileGraph.metamodel.tables[
                                        i
                                    ].columns[j].column
                                ] =
                                    scope.importFileGraph.metamodel.tables[
                                        i
                                    ].columns[j].type;
                            }
                        }
                    }

                    // save positions
                    positions[scope.importFileGraph.metamodel.tables[i].table] =
                        scope.importFileGraph.metamodel.tables[i].position;
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

            pixel += 'databaseVar = ';
            pixel += semossCoreService.pixel.build([
                {
                    type: 'createExternalGraphDatabase',
                    components: [
                        scope.importFileGraph.loadedFile.fileLocation,
                        scope.importFileGraph.graph.type,
                        scope.importFileGraph.graph.name,
                        metamodel,
                        scope.importCtrl.name.value,
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

        /** helpers */

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            scope.$watch(
                'importFileGraph.fileType',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        setFileType();
                    }
                }
            );

            setFile();

            if (
                scope.importFileGraph.sentFileData &&
                scope.importFileGraph.sentFileData.file
            ) {
                $timeout(function () {
                    scope.importFileGraph.rawFiles.addFile(
                        scope.importFileGraph.sentFileData.file
                    );
                });
            }
        }

        initialize();
    }
}
