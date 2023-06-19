'use strict';

export default angular
    .module('app.import-external-datastax.directive', [])
    .directive('importExternalDatastax', importExternalDatastaxDirective);

import { CONNECTORS } from '@/core/constants';

import './import-external-datastax.scss';

importExternalDatastaxDirective.$inject = [];

function importExternalDatastaxDirective() {
    importExternalDatastaxController.$inject = [];
    importExternalDatastaxLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importExternalDatastaxController,
        bindToController: {
            driver: '=',
        },
        controllerAs: 'importExternalDatastax',
        link: importExternalDatastaxLink,
        template: require('./import-external-datastax.directive.html'),
    };

    function importExternalDatastaxController() {}

    function importExternalDatastaxLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importExternalDatastax.step = 1; // step of data
        scope.importExternalDatastax.connection = {
            hostname: '',
            port: '',
            graph: '',
            username: '',
            password: '',
        };

        scope.importExternalDatastax.metamodel = {
            tables: {},
            relationships: [],
        };

        scope.importExternalDatastax.setConnection = setConnection;
        scope.importExternalDatastax.checkConnection = checkConnection;
        scope.importExternalDatastax.loadConnection = loadConnection;
        scope.importExternalDatastax.checkGraph = checkGraph;
        scope.importExternalDatastax.loadGraph = loadGraph;
        scope.importExternalDatastax.resetGraph = resetGraph;
        scope.importExternalDatastax.importMetamodel = importMetamodel;

        /** Steps */
        /** Step 1 */
        /**
         * @name setConnection
         * @desc reset the selected form
         * @return {void}
         */
        function setConnection() {
            if (
                !scope.importExternalDatastax.driver ||
                !CONNECTORS.hasOwnProperty(scope.importExternalDatastax.driver)
            ) {
                console.error('Correct driver is not selected');
                return;
            }

            scope.importExternalDatastax.step = 1; // step of data

            scope.importExternalDatastax.connection = {
                name: CONNECTORS[scope.importExternalDatastax.driver].name,
                img: CONNECTORS[scope.importExternalDatastax.driver].image,
                driver: CONNECTORS[scope.importExternalDatastax.driver].driver,
                type: CONNECTORS[scope.importExternalDatastax.driver].type,
                hostname: '',
                port: '',
                graph: '',
                username: '',
                password: '',
            };

            scope.importExternalDatastax.graph = {
                type: '',
                name: '',
                options: [],
            };

            scope.importExternalDatastax.metamodel = {
                tables: {},
                relationships: [],
            };
        }

        /**
         * @name checkConnection
         * @desc validate the connection form
         * @return {boolean} is the connection valid or not?
         */
        function checkConnection() {
            return (
                scope.importCtrl.name.valid &&
                scope.importExternalDatastax.connection.hostname &&
                scope.importExternalDatastax.connection.port &&
                scope.importExternalDatastax.connection.graph
            );
        }

        /**
         * @name loadConnection
         * @desc load the connection details, validating that it is correct and grabbing the table information
         * @return {void}
         */
        function loadConnection() {
            var callback;

            if (!checkConnection()) {
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
                scope.importExternalDatastax.graph.options = output;
                scope.importExternalDatastax.step = 2;
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'getDSEGraphProperties',
                        components: [
                            scope.importExternalDatastax.connection.hostname,
                            scope.importExternalDatastax.connection.port,
                            scope.importExternalDatastax.connection.graph,
                            scope.importExternalDatastax.connection.username,
                            scope.importExternalDatastax.connection.password,
                        ],
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
         * @return {boolean} is the connection valid or not?
         */
        function checkGraph() {
            return (
                scope.importExternalDatastax.graph.type &&
                scope.importExternalDatastax.graph.name
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

                scope.importExternalDatastax.metamodel = {
                    tables: {},
                    relationships: [],
                };

                for (i in output.edges) {
                    if (output.edges.hasOwnProperty(i)) {
                        scope.importExternalDatastax.metamodel.relationships.push(
                            {
                                fromTable: output.edges[i][0],
                                fromColumn: '',
                                toTable: output.edges[i][1],
                                toColumn: '',
                                alias: '',
                            }
                        );
                    }
                }

                for (i in output.nodes) {
                    if (output.nodes.hasOwnProperty(i)) {
                        scope.importExternalDatastax.metamodel.tables[i] = {
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
                        scope.importExternalDatastax.metamodel.tables[
                            i
                        ].columns[i] = {
                            alias: i,
                            column: i,
                            table: i,
                            isPrimKey: true,
                            type: '',
                        };

                        for (j in output.nodes[i]) {
                            if (output.nodes[i].hasOwnProperty(j)) {
                                scope.importExternalDatastax.metamodel.tables[
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
                scope.importExternalDatastax.step = 3;
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'getDSEGraphMetaModel',
                        components: [
                            scope.importExternalDatastax.connection.hostname,
                            scope.importExternalDatastax.connection.port,
                            scope.importExternalDatastax.connection.graph,
                            scope.importExternalDatastax.connection.username,
                            scope.importExternalDatastax.connection.password,
                            scope.importExternalDatastax.graph.type,
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
            scope.importExternalDatastax.graph.type = '';
            scope.importExternalDatastax.graph.name = '';

            scope.importExternalDatastax.metamodel = {
                tables: {},
                relationships: [],
            };

            scope.importExternalDatastax.step = 2; // step of data
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
                        scope.importExternalDatastax.metamodel.relationships
                            .length;
                i < len;
                i++
            ) {
                metamodel.edges[
                    scope.importExternalDatastax.metamodel.relationships[i]
                        .fromColumn +
                        '.' +
                        scope.importExternalDatastax.metamodel.relationships[i]
                            .toTable
                ] = [
                    scope.importExternalDatastax.metamodel.relationships[i]
                        .fromTable,
                    scope.importExternalDatastax.metamodel.relationships[i]
                        .toTable,
                ];
            }

            for (let i in scope.importExternalDatastax.metamodel.tables) {
                if (
                    scope.importExternalDatastax.metamodel.tables.hasOwnProperty(
                        i
                    )
                ) {
                    metamodel.nodes[
                        scope.importExternalDatastax.metamodel.tables[i].table
                    ] = {};

                    for (let j in scope.importExternalDatastax.metamodel.tables[
                        i
                    ].columns) {
                        if (
                            scope.importExternalDatastax.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            // skip the pimkey because it was already added in
                            if (
                                !scope.importExternalDatastax.metamodel.tables[
                                    i
                                ].columns[j].isPrimKey
                            ) {
                                metamodel.nodes[
                                    scope.importExternalDatastax.metamodel.tables[
                                        i
                                    ].table
                                ][
                                    scope.importExternalDatastax.metamodel.tables[
                                        i
                                    ].columns[j].column
                                ] =
                                    scope.importExternalDatastax.metamodel.tables[
                                        i
                                    ].columns[j].type;
                            }
                        }
                    }

                    // save positions
                    positions[
                        scope.importExternalDatastax.metamodel.tables[i].table
                    ] =
                        scope.importExternalDatastax.metamodel.tables[
                            i
                        ].position;
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

            pixel += `databaseVar = CreateExternalDSEGraphDatabase(host=["${
                scope.importExternalDatastax.connection.hostname
            }"], port=["${
                scope.importExternalDatastax.connection.port
            }"], graphName=["${
                scope.importExternalDatastax.connection.graph
            }"], username=["${
                scope.importExternalDatastax.connection.username
            }"], password=["${
                scope.importExternalDatastax.connection.password
            }"], graphTypeId=["${
                scope.importExternalDatastax.graph.type
            }"], graphNameId=["${
                scope.importExternalDatastax.graph.name
            }"], graphMetamodel=[${JSON.stringify(metamodel)}'], app=["${
                scope.importCtrl.name.value
            }"])`;

            if (scope.importCtrl.meta.description) {
                metadata['description'] = scope.importCtrl.meta.description;
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
            setConnection();
        }

        initialize();
    }
}
