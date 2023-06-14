'use strict';

export default angular
    .module('app.import-file-graph-old.directive', [])
    .directive('importFileGraphOld', importFileGraphOldDirective);

import './import-file-graph-old.scss';

importFileGraphOldDirective.$inject = ['semossCoreService'];

function importFileGraphOldDirective(semossCoreService) {
    importFileGraphOldController.$inject = [];
    importFileGraphOldLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importFileGraphOldController,
        bindToController: {},
        controllerAs: 'importFileGraphOld',
        link: importFileGraphOldLink,
        template: require('./import-file-graph-old.directive.html'),
    };

    function importFileGraphOldController() {}

    function importFileGraphOldLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importFileGraphOld.step = 1; // step of data
        scope.importFileGraphOld.file = {
            path: '',
        };

        scope.importFileGraphOld.metamodel = {
            tables: {},
            relationships: [],
        };

        scope.importFileGraphOld.setFile = setFile;
        scope.importFileGraphOld.checkFile = checkFile;
        scope.importFileGraphOld.loadFile = loadFile;
        scope.importFileGraphOld.checkGraph = checkGraph;
        scope.importFileGraphOld.loadGraph = loadGraph;
        scope.importFileGraphOld.resetGraph = resetGraph;
        scope.importFileGraphOld.importMetamodel = importMetamodel;

        /** Steps */
        /** Step 1 */
        /**
         * @name setFile
         * @desc reset the selected form
         * @return {void}
         */
        function setFile() {
            scope.importFileGraphOld.step = 1; // step of data

            scope.importFileGraphOld.file = {
                path: '',
            };

            scope.importFileGraphOld.graph = {
                type: '',
                name: '',
                options: [],
            };

            scope.importFileGraphOld.metamodel = {
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
                scope.importFileGraphOld.file.path
            );
        }

        /**
         * @name loadFile
         * @desc load the file details, validating that it is correct and grabbing the table information
         * @return {void}
         */
        function loadFile() {
            var callback;

            if (!checkFile()) {
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert('error', output);
                    return;
                }

                // open and shift the page
                scope.importFileGraphOld.graph.options = output;
                scope.importFileGraphOld.step = 2;
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'getGraphProperties',
                        components: [scope.importFileGraphOld.file.path],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /** Step 2 */
        /**
         * @name checkGraph
         * @desc validate the graph form
         * @return {boolean} is the file valid or not?
         */
        function checkGraph() {
            return (
                scope.importFileGraphOld.graph.type &&
                scope.importFileGraphOld.graph.name
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

                scope.importFileGraphOld.metamodel = {
                    tables: {},
                    relationships: [],
                };

                for (i in output.edges) {
                    if (output.edges.hasOwnProperty(i)) {
                        scope.importFileGraphOld.metamodel.relationships.push({
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
                        scope.importFileGraphOld.metamodel.tables[i] = {
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
                        scope.importFileGraphOld.metamodel.tables[i].columns[
                            i
                        ] = {
                            alias: i,
                            column: i,
                            table: i,
                            isPrimKey: true,
                            type: '',
                        };

                        for (j in output.nodes[i]) {
                            if (output.nodes[i].hasOwnProperty(j)) {
                                scope.importFileGraphOld.metamodel.tables[
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
                scope.importFileGraphOld.step = 3;
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'getGraphMetaModel',
                        components: [
                            scope.importFileGraphOld.file.path,
                            scope.importFileGraphOld.graph.type,
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
            scope.importFileGraphOld.graph.type = '';
            scope.importFileGraphOld.graph.name = '';

            scope.importFileGraphOld.metamodel = {
                tables: {},
                relationships: [],
            };

            scope.importFileGraphOld.step = 2; // step of data
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
                    len =
                        scope.importFileGraphOld.metamodel.relationships.length;
                i < len;
                i++
            ) {
                metamodel.edges[
                    scope.importFileGraphOld.metamodel.relationships[i]
                        .fromColumn +
                        '.' +
                        scope.importFileGraphOld.metamodel.relationships[i]
                            .toTable
                ] = [
                    scope.importFileGraphOld.metamodel.relationships[i]
                        .fromTable,
                    scope.importFileGraphOld.metamodel.relationships[i].toTable,
                ];
            }

            for (let i in scope.importFileGraphOld.metamodel.tables) {
                if (
                    scope.importFileGraphOld.metamodel.tables.hasOwnProperty(i)
                ) {
                    metamodel.nodes[
                        scope.importFileGraphOld.metamodel.tables[i].table
                    ] = {};

                    for (let j in scope.importFileGraphOld.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.importFileGraphOld.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            // skip the pimkey because it was already added in
                            if (
                                !scope.importFileGraphOld.metamodel.tables[i]
                                    .columns[j].isPrimKey
                            ) {
                                metamodel.nodes[
                                    scope.importFileGraphOld.metamodel.tables[
                                        i
                                    ].table
                                ][
                                    scope.importFileGraphOld.metamodel.tables[
                                        i
                                    ].columns[j].column
                                ] =
                                    scope.importFileGraphOld.metamodel.tables[
                                        i
                                    ].columns[j].type;
                            }
                        }
                    }

                    // save positions
                    positions[
                        scope.importFileGraphOld.metamodel.tables[i].table
                    ] = scope.importFileGraphOld.metamodel.tables[i].position;
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
                        scope.importFileGraphOld.file.path,
                        scope.importFileGraphOld.graph.type,
                        scope.importFileGraphOld.graph.name,
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

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            console.log(
                'TODO: Make this go through Drag and Drop via a zip. This will work better with the server'
            );
            setFile();
        }

        initialize();
    }
}
