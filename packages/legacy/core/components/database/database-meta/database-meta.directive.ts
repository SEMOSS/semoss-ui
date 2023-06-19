'use strict';

import angular from 'angular';
import '../database-user/database-user.directive';
import '../database-details/database-details.directive';
import '../database-physical/database-physical.directive';

import { GRAPH_TYPES } from '@/core/constants';

import './database-meta.scss';

export default angular
    .module('app.database.database-meta', [
        'app.database.database-user',
        'app.database.database-details',
        'app.database.database-physical',
    ])
    .directive('databaseMeta', databaseMetaDirective);

databaseMetaDirective.$inject = [
    '$transitions',
    '$stateParams',
    '$ocLazyLoad',
    'semossCoreService',
    'monolithService',
];

function databaseMetaDirective(
    $transitions,
    $stateParams,
    $ocLazyLoad,
    semossCoreService: SemossCoreService,
    monolithService
) {
    databaseMetaCtrl.$inject = [];
    databaseMetaLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: ['^database'],
        restrict: 'E',
        template: require('./database-meta.directive.html'),
        controllerAs: 'databaseMeta',
        scope: {},
        bindToController: {},
        controller: databaseMetaCtrl,
        link: databaseMetaLink,
    };

    function databaseMetaCtrl() {}

    function databaseMetaLink(scope, ele, attrs, ctrl) {
        const defaultOptions =
            semossCoreService.visualization.getDefaultOptions();

        scope.databaseCtrl = ctrl[0];
        //scope.database.appInfo = scope.databaseCtrl.appInfo;

        scope.databaseMeta.hasMetamodelChanged = hasMetamodelChanged;
        scope.databaseMeta.resetMetamodel = resetMetamodel;
        scope.databaseMeta.saveMetamodel = saveMetamodel;
        scope.databaseMeta.editItem = editItem;
        scope.databaseMeta.changeColumn = changeColumn;
        scope.databaseMeta.changeColumnTable = changeColumnTable;
        scope.databaseMeta.getExternalTablesAndViews =
            getExternalTablesAndViews;
        scope.databaseMeta.loadExternalMetamodel = loadExternalMetamodel;
        scope.databaseMeta.toggleTabs = toggleTabs;
        scope.databaseMeta.verifyQuery = verifyQuery;
        scope.databaseMeta.verifyRequest = verifyRequest;
        scope.databaseMeta.updateSmssFile = updateSmssFile;

        scope.databaseMeta.localChangesApplied = false;

        scope.databaseMeta.appInfo = {};
        scope.databaseMeta.information = {
            type: '',
            original: {
                tables: {},
                relationships: [],
            },
            // physical db modifications
            // physical: {

            // },
            metamodel: {
                // containers rendered information
                tables: {},
                relationships: [],
                externalChangesApplied: false,
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
            selectedColumn: false,
            externalDb: false,
        };
        scope.databaseMeta.tabs = [
            'Details',
            'Access',
            'Metamodel',
            'Replace Data',
            'Query Data',
            // 'Modify Data',
            'Update SMSS',
        ];
        scope.databaseMeta.selectedTab = 'Details';
        scope.databaseMeta.tourId = {
            Details: 'details',
            Access: 'access',
            Metamodel: 'metamodel',
            'Replace Data': 'replace',
            'Query Data': 'query',
            'Modify Data': 'modify',
        };
        scope.databaseMeta.input = {
            query: {
                value: '',
                error: '',
            },
            collect: {
                value: -1,
                show: false,
                error: '',
            },
        };
        scope.databaseMeta.display = '';
        scope.databaseMeta.headers = [];
        scope.databaseMeta.values = [];
        scope.databaseMeta.smssText = '';

        /**
         * @name updateSmssFile
         * @desc executes the query that updates the Smss file
         * @returns {void}
         */
        function updateSmssFile() {
            monolithService
                .updateDatabaseSmssFile(
                    scope.databaseMeta.appId,
                    scope.databaseMeta.smssText
                )
                .then(function () {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Database SMSS File has been updated.',
                    });
                });
        }

        /**
         * @name updateNavigation
         * @desc called when a route changes
         * @returns {void}
         */
        function updateNavigation(): void {
            // save the appId
            scope.databaseMeta.appId = $stateParams.database;

            if (!scope.databaseMeta.appId) {
                return;
            }

            getMetamodel();
        }

        /**
         * @name verifyQuery
         * @desc check whether the query contains SELECT, and if so update the pixel parameters and input display
         * @returns {void}
         */
        function verifyQuery() {
            if (
                scope.databaseMeta.input.query.value
                    .toUpperCase()
                    .includes('SELECT')
            ) {
                scope.databaseMeta.input.collect.value = 100;
                scope.databaseMeta.input.collect.show = true;
            } else {
                scope.databaseMeta.input.collect.value = -1;
                scope.databaseMeta.input.collect.show = false;
            }
        }

        /**
         * @name verifyRequest
         * @desc check whether the query contains SELECT, and if so update the pixel parameters and input display
         * @returns {void}
         */
        function verifyRequest() {
            scope.databaseMeta.input.query.error = '';
            scope.databaseMeta.input.collect.error = '';

            if (!scope.databaseMeta.input.query.value) {
                scope.databaseMeta.input.query.error = 'Please enter a query';
            } else if (
                !scope.databaseMeta.input.collect.value &&
                scope.databaseMeta.input.collect.show
            ) {
                scope.databaseMeta.input.collect.error =
                    'Please enter a number greater than 0';
            } else {
                execute();
            }
        }

        /**
         * @name execute
         * @desc execute the query
         */
        function execute(): void {
            const message = semossCoreService.utility.random('query-pixel');
            const commandList = [
                {
                    type: 'database',
                    components: [scope.databaseMeta.appId],
                    terminal: false,
                },
                {
                    type: 'query',
                    components: [scope.databaseMeta.input.query.value],
                    terminal: false,
                },
            ];

            if (scope.databaseMeta.input.collect.value > 0) {
                commandList.push({
                    type: 'collect',
                    components: [scope.databaseMeta.input.collect.value],
                    terminal: true,
                });
            } else {
                commandList.push({
                    type: 'execute',
                    components: [],
                    terminal: true,
                });
            }

            semossCoreService.once(message, function (response) {
                let output, type;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    scope.databaseMeta.display = 'error';
                    scope.databaseMeta.error = output;
                } else {
                    if (output.data) {
                        scope.databaseMeta.headers = output.data.headers;
                        scope.databaseMeta.values = output.data.values;
                        if (scope.databaseMeta.values.length > 0) {
                            scope.databaseMeta.display = 'table';
                        }
                    } else {
                        scope.databaseMeta.display = 'success';
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: commandList,
                response: message,
            });
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
                    scope.databaseMeta.appInfo = output;
                }

                output = response.pixelReturn[1].output;
                type = response.pixelReturn[1].operationType;
                if (type.indexOf('ERROR') === -1) {
                    scope.databaseMeta.information = {
                        type:
                            GRAPH_TYPES.indexOf(
                                scope.databaseMeta.appInfo.database_type
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
                        selectedTable: false,
                        selectedColumn: false,
                        externalDb:
                            GRAPH_TYPES.indexOf(
                                scope.databaseMeta.appInfo.database_type
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
                            scope.databaseMeta.information.metamodel.relationships.push(
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

                            scope.databaseMeta.information.metamodel.tables[
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
                            scope.databaseMeta.information.allTables[
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

                                scope.databaseMeta.information.metamodel.tables[
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

                                scope.databaseMeta.information.allTables[
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
                    scope.databaseMeta.localChangesApplied = false;
                    scope.databaseMeta.information.metamodel.externalChangesApplied =
                        false;
                    // save copy
                    scope.databaseMeta.information.original = JSON.parse(
                        JSON.stringify(scope.databaseMeta.information.metamodel)
                    );
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'databaseInfo',
                        components: [scope.databaseMeta.appId],
                        terminal: true,
                    },
                    {
                        type: 'getDatabaseMetamodel',
                        components: [
                            scope.databaseMeta.appId,
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
         * @name loadExternalMetamodel
         * @desc load the external db metamodel
         * @return {void}
         */
        function loadExternalMetamodel() {
            // we will only run rdbmsExternalUpload if external changes have been applied
            scope.databaseMeta.information.metamodel.externalChangesApplied =
                true;

            // close modal
            scope.databaseMeta.information.external.open = false;

            if (
                scope.databaseMeta.information.external.tableModel.length ===
                    0 &&
                scope.databaseMeta.information.external.viewModel.length === 0
            ) {
                return;
            }

            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType,
                    tableMapping,
                    i,
                    len,
                    j,
                    len2;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Unable to connect to external db',
                    });
                    scope.databaseMeta.information.external.open = true;
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
                        scope.databaseMeta.information.metamodel.relationships
                            .length - 1;
                    i >= 0;
                    i--
                ) {
                    // remove the relationship, that if a table in the mapping
                    if (
                        !tableMapping.hasOwnProperty(
                            scope.databaseMeta.information.metamodel
                                .relationships[i].fromTable
                        ) ||
                        !tableMapping.hasOwnProperty(
                            scope.databaseMeta.information.metamodel
                                .relationships[i].toTable
                        )
                    ) {
                        scope.databaseMeta.information.metamodel.relationships.splice(
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
                                scope.databaseMeta.information.metamodel
                                    .relationships.length;
                        j < len2;
                        j++
                    ) {
                        // already exists
                        if (
                            scope.databaseMeta.information.metamodel
                                .relationships[j].fromTable ===
                                output.relationships[i].fromTable &&
                            scope.databaseMeta.information.metamodel
                                .relationships[j].fromColumn ===
                                output.relationships[i].fromCol &&
                            scope.databaseMeta.information.metamodel
                                .relationships[j].toTable ===
                                output.relationships[i].toTable &&
                            scope.databaseMeta.information.metamodel
                                .relationships[j].toColumn ===
                                output.relationships[i].toCol
                            // TODO missing alias? relationships.relation?
                        ) {
                            continue relLoop;
                        }
                    }

                    scope.databaseMeta.information.metamodel.relationships.push(
                        {
                            fromTable: output.relationships[i].fromTable,
                            fromColumn: output.relationships[i].fromCol,
                            toTable: output.relationships[i].toTable,
                            toColumn: output.relationships[i].toCol,
                            alias: '',
                        }
                    );
                }

                for (i in scope.databaseMeta.information.metamodel.tables) {
                    if (
                        !tableMapping.hasOwnProperty(
                            scope.databaseMeta.information.metamodel.tables[i]
                                .table
                        )
                    ) {
                        // remove the tables, that aren't in the mapping
                        delete scope.databaseMeta.information.metamodel.tables[
                            i
                        ];
                    }
                }

                // add the tables that are remaining in the mapping
                for (i in tableMapping) {
                    if (
                        tableMapping.hasOwnProperty(i) &&
                        output.tables[tableMapping[i]].columns
                    ) {
                        scope.databaseMeta.information.metamodel.tables[
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
                            // TODO externalJdbcSchema does not return descriptions
                            description: '',
                            columns: {},
                        };

                        // update all tables
                        scope.databaseMeta.information.allTables[
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
                            // TODO externalJdbcSchema does not return descriptions
                            description: '',
                            columns: {},
                        };

                        // add other columns
                        for (
                            j = 0,
                                len2 =
                                    output.tables[tableMapping[i]].columns
                                        .length;
                            j < len2;
                            j++
                        ) {
                            scope.databaseMeta.information.metamodel.tables[
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
                                typeFormat: '',
                                description: '',
                                logical: [],
                                // TODO externalJdbcSchema does not return additionalDataTypes, descriptions, or logical
                                // typeFormat: output.tables[tableMapping[i]].additionalDataTypes[j],
                                // description: output.tables[tableMapping[i]].descriptions[j],
                                // logical: output.tables[tableMapping[i]].logicalNames[j]
                            };

                            scope.databaseMeta.information.allTables[
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
                                typeFormat: '',
                                description: '',
                                logical: [],
                                // TODO externalJdbcSchema does not return additionalDataTypes, descriptions, or logical
                                // typeFormat: output.tables[tableMapping[i]].additionalDataTypes[j],
                                // description: output.tables[tableMapping[i]].descriptions[j],
                                // logical: output.tables[tableMapping[i]].logicalNames[j]
                            };
                        }
                    }
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'externalUpdateJdbcSchema',
                        components: [
                            scope.databaseMeta.appId,
                            scope.databaseMeta.information.external.tableModel.concat(
                                scope.databaseMeta.information.external
                                    .viewModel
                            ),
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name getExternalTablesAndViews
         * @desc get a copy of the metamodel
         */
        function getExternalTablesAndViews(): void {
            let existingTables, existingViews;

            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: 'Unable to connect to external db',
                    });
                    return;
                }

                if (output.views.length === 0 && output.tables.length === 0) {
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'Unable to find Tables or Views for external db',
                    });
                    return;
                }

                // add the external tables and views options
                scope.databaseMeta.information.external.tableOptions =
                    JSON.parse(JSON.stringify(output.tables));
                scope.databaseMeta.information.external.viewOptions =
                    JSON.parse(JSON.stringify(output.views));

                // find the existing tables and views to set as model for checklist
                // only reset selection on first load
                if (
                    !scope.databaseMeta.information.metamodel
                        .externalChangesApplied
                ) {
                    existingTables = [];
                    existingViews = [];

                    for (const table in scope.databaseMeta.information.metamodel
                        .tables) {
                        if (output.tables.indexOf(table) > -1) {
                            existingTables.push(table);
                        }
                        if (output.views.indexOf(table) > -1) {
                            existingViews.push(table);
                        }
                    }

                    scope.databaseMeta.information.external.tableModel =
                        JSON.parse(JSON.stringify(existingTables));
                    scope.databaseMeta.information.external.viewModel =
                        JSON.parse(JSON.stringify(existingViews));
                }
                scope.databaseMeta.information.external.open = true;
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'externalUpdateJdbcTablesAndViews',
                        components: [scope.databaseMeta.appId],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name saveExternalChanges
         * @desc update the owl file
         * @return {void}
         */
        function saveExternalChanges() {
            let metamodel = {
                    relationships: [] as any,
                    tables: {},
                },
                pixel = '',
                positions = {};

            // we need to construt an object for the metamodel (special format)
            for (
                let i = 0,
                    len =
                        scope.databaseMeta.information.metamodel.relationships
                            .length;
                i < len;
                i++
            ) {
                //metamodel.relationships.push({
                const newRelationship = {
                    relName:
                        scope.databaseMeta.information.metamodel.relationships[
                            i
                        ].fromColumn +
                        '.' +
                        scope.databaseMeta.information.metamodel.relationships[
                            i
                        ].toColumn,
                    toTable:
                        scope.databaseMeta.information.metamodel.relationships[
                            i
                        ].toTable,
                    fromTable:
                        scope.databaseMeta.information.metamodel.relationships[
                            i
                        ].fromTable,
                };
                metamodel.relationships.push(newRelationship);
            }

            for (const i in scope.databaseMeta.information.metamodel.tables) {
                // if columns exist in this table, then we process it
                if (
                    scope.databaseMeta.information.metamodel.tables.hasOwnProperty(
                        i
                    ) &&
                    scope.databaseMeta.information.metamodel.tables[i]
                        .columns &&
                    Object.keys(
                        scope.databaseMeta.information.metamodel.tables[i]
                            .columns
                    ).length > 0
                ) {
                    let primKey = '',
                        concat = '';

                    // assume that the first primkey is the important one. The user can change it later on
                    for (const j in scope.databaseMeta.information.metamodel
                        .tables[i].columns) {
                        if (
                            scope.databaseMeta.information.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            if (
                                scope.databaseMeta.information.metamodel.tables[
                                    i
                                ].columns[j].isPrimKey
                            ) {
                                primKey =
                                    scope.databaseMeta.information.metamodel
                                        .tables[i].columns[j].column;
                                break;
                            }
                        }
                    }

                    // if there is no primKey, we assume it is the first one... SQL Tables always have a column
                    if (!primKey) {
                        primKey =
                            scope.databaseMeta.information.metamodel.tables[i]
                                .columns[
                                Object.keys(
                                    scope.databaseMeta.information.metamodel
                                        .tables[i].columns
                                )[0]
                            ].column;
                    }

                    concat =
                        scope.databaseMeta.information.metamodel.tables[i]
                            .table +
                        '.' +
                        primKey;

                    metamodel.tables[concat] = [];
                    for (const j in scope.databaseMeta.information.metamodel
                        .tables[i].columns) {
                        if (
                            scope.databaseMeta.information.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            metamodel.tables[concat].push(
                                scope.databaseMeta.information.metamodel.tables[
                                    i
                                ].columns[j].column
                            );
                        }
                    }

                    // save positions
                    positions[
                        scope.databaseMeta.information.metamodel.tables[i].table
                    ] =
                        scope.databaseMeta.information.metamodel.tables[
                            i
                        ].position;
                }
            }

            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: output,
                    });
                    return;
                }

                getMetamodel();
            });

            pixel += `RdbmsExternalUpload(database=["${
                scope.databaseMeta.appId
            }"], metamodel=[${JSON.stringify(metamodel)}], existing=[true]);`;

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                    {
                        type: 'saveOwlPositions',
                        components: [scope.databaseMeta.appId, positions],
                        meta: true,
                        terminal: true,
                    },
                    {
                        type: 'syncDatabaseWithLocalMaster',
                        components: [scope.databaseMeta.appId],
                        meta: true,
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name saveMetamodel
         * @desc save a copy of the metamodel
         */
        function saveMetamodel(): void {
            const addedNodes: any[] = [],
                removedNodes: any[] = [],
                addedProperties = {},
                removedProperties = {},
                changeAlias = {},
                changeTableAlias = {},
                changeDataTypes = {},
                changeTableDataTypes = {},
                changeDescription = {},
                changeTableDescription = {},
                changeLogical = {},
                changeTableLogical = {},
                currentRelationships = {},
                addedRelationships: any[] = [],
                removedRelationships: any[] = [],
                originalPositions = {},
                updatedPositions = {},
                components: any[] = [];

            // compare original and current
            if (!hasMetamodelChanged()) {
                // no changes
                return;
            }
            // run rdbms upload if external changes, otherwise do normal metamodel save changes
            if (
                scope.databaseMeta.information.metamodel.externalChangesApplied
            ) {
                saveExternalChanges();
                return;
            }

            // check if a node has been added or removed
            // check if a property has been added or removed
            // check if the properties have been updated
            // check if the relationships have added or removed
            for (const table in scope.databaseMeta.information.original
                .tables) {
                if (
                    scope.databaseMeta.information.original.tables.hasOwnProperty(
                        table
                    )
                ) {
                    // doesn't exist in the metamodel it is a removed node
                    if (
                        !scope.databaseMeta.information.metamodel.tables.hasOwnProperty(
                            table
                        )
                    ) {
                        removedNodes.push(
                            scope.databaseMeta.information.original.tables[
                                table
                            ]
                        );
                    } else {
                        // check if table properties (alias and description) have changed
                        if (
                            scope.databaseMeta.information.original.tables[
                                table
                            ].alias !==
                            scope.databaseMeta.information.metamodel.tables[
                                table
                            ].alias
                        ) {
                            if (!changeTableAlias.hasOwnProperty(table)) {
                                changeTableAlias[table] = [];
                            }

                            changeTableAlias[table] =
                                scope.databaseMeta.information.metamodel.tables[
                                    table
                                ];
                        }

                        if (
                            scope.databaseMeta.information.metamodel.tables[
                                table
                            ].hasOwnProperty('description')
                        ) {
                            // this is the first time a description has been added so original metamodel won't have this property
                            // OR new description doesn't match original
                            if (
                                !scope.databaseMeta.information.original.tables[
                                    table
                                ].hasOwnProperty('description') ||
                                (scope.databaseMeta.information.original.tables[
                                    table
                                ].hasOwnProperty('description') &&
                                    scope.databaseMeta.information.original
                                        .tables[table].description !==
                                        scope.databaseMeta.information.metamodel
                                            .tables[table].description)
                            ) {
                                if (
                                    !changeTableDescription.hasOwnProperty(
                                        table
                                    )
                                ) {
                                    changeTableDescription[table] = [];
                                }

                                changeTableDescription[table] =
                                    scope.databaseMeta.information.metamodel.tables[
                                        table
                                    ];
                            }
                        }

                        // for non-rdbms check if logical, additional data types, have changed
                        if (!scope.databaseMeta.information.externalDb) {
                            if (
                                scope.databaseMeta.information.metamodel.tables[
                                    table
                                ].hasOwnProperty('logical')
                            ) {
                                // this is the first time a logical has been added to the table so original metamodel won't have this property
                                // OR new logical doesn't match original
                                if (
                                    !scope.databaseMeta.information.original.tables[
                                        table
                                    ].hasOwnProperty('logical') ||
                                    (scope.databaseMeta.information.original.tables[
                                        table
                                    ].hasOwnProperty('logical') &&
                                        JSON.stringify(
                                            scope.databaseMeta.information
                                                .original.tables[table].logical
                                        ) !==
                                            JSON.stringify(
                                                scope.databaseMeta.information
                                                    .metamodel.tables[table]
                                                    .logical
                                            ))
                                ) {
                                    if (
                                        !changeTableLogical.hasOwnProperty(
                                            table
                                        )
                                    ) {
                                        changeTableLogical[table] = [];
                                    }

                                    changeTableLogical[table] =
                                        scope.databaseMeta.information.metamodel.tables[
                                            table
                                        ];
                                }
                            }

                            if (
                                scope.databaseMeta.information.metamodel.tables[
                                    table
                                ].hasOwnProperty('type')
                            ) {
                                // this is the first time a type has been added so original metamodel won't have this property
                                // OR new type doesn't match original
                                if (
                                    !scope.databaseMeta.information.original.tables[
                                        table
                                    ].hasOwnProperty('type') ||
                                    (scope.databaseMeta.information.original.tables[
                                        table
                                    ].hasOwnProperty('type') &&
                                        (scope.databaseMeta.information.original
                                            .tables[table].type !==
                                            scope.databaseMeta.information
                                                .metamodel.tables[table].type ||
                                            scope.databaseMeta.information
                                                .original.tables[table]
                                                .typeFormat !==
                                                scope.databaseMeta.information
                                                    .metamodel.tables[table]
                                                    .typeFormat))
                                ) {
                                    if (
                                        !changeTableDataTypes.hasOwnProperty(
                                            table
                                        )
                                    ) {
                                        changeTableDataTypes[table] = [];
                                    }

                                    changeTableDataTypes[table] =
                                        scope.databaseMeta.information.metamodel.tables[
                                            table
                                        ];
                                }
                            }
                        }

                        // chekck what properties are removed
                        for (const column in scope.databaseMeta.information
                            .original.tables[table].columns) {
                            if (
                                scope.databaseMeta.information.original.tables[
                                    table
                                ].columns.hasOwnProperty(column)
                            ) {
                                if (
                                    !scope.databaseMeta.information.metamodel.tables[
                                        table
                                    ].columns.hasOwnProperty(column)
                                ) {
                                    if (
                                        !removedProperties.hasOwnProperty(table)
                                    ) {
                                        removedProperties[table] = [];
                                    }

                                    removedProperties[table].push(
                                        scope.databaseMeta.information.original
                                            .tables[table].columns[column]
                                    );
                                }
                            }
                        }

                        // check what properties exists now
                        for (const column in scope.databaseMeta.information
                            .metamodel.tables[table].columns) {
                            if (
                                scope.databaseMeta.information.metamodel.tables[
                                    table
                                ].columns.hasOwnProperty(column)
                            ) {
                                if (
                                    !scope.databaseMeta.information.original.tables[
                                        table
                                    ].columns.hasOwnProperty(column)
                                ) {
                                    if (
                                        !addedProperties.hasOwnProperty(table)
                                    ) {
                                        addedProperties[table] = [];
                                    }

                                    addedProperties[table].push(
                                        scope.databaseMeta.information.metamodel
                                            .tables[table].columns[column]
                                    );
                                } else {
                                    if (
                                        scope.databaseMeta.information.original
                                            .tables[table].columns[column]
                                            .type !==
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column].type ||
                                        scope.databaseMeta.information.original
                                            .tables[table].columns[column]
                                            .typeFormat !==
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column].typeFormat
                                    ) {
                                        if (
                                            !changeDataTypes.hasOwnProperty(
                                                table
                                            )
                                        ) {
                                            changeDataTypes[table] = [];
                                        }

                                        changeDataTypes[table].push(
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column]
                                        );
                                    }

                                    if (
                                        scope.databaseMeta.information.original
                                            .tables[table].columns[column]
                                            .alias !==
                                        scope.databaseMeta.information.metamodel
                                            .tables[table].columns[column].alias
                                    ) {
                                        if (
                                            !changeAlias.hasOwnProperty(table)
                                        ) {
                                            changeAlias[table] = [];
                                        }

                                        changeAlias[table].push(
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column]
                                        );
                                    }

                                    if (
                                        scope.databaseMeta.information.original
                                            .tables[table].columns[column]
                                            .description !==
                                        scope.databaseMeta.information.metamodel
                                            .tables[table].columns[column]
                                            .description
                                    ) {
                                        if (
                                            !changeDescription.hasOwnProperty(
                                                table
                                            )
                                        ) {
                                            changeDescription[table] = [];
                                        }

                                        changeDescription[table].push(
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column]
                                        );
                                    }

                                    if (
                                        JSON.stringify(
                                            scope.databaseMeta.information
                                                .original.tables[table].columns[
                                                column
                                            ].logical
                                        ) !==
                                        JSON.stringify(
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column].logical
                                        )
                                    ) {
                                        if (
                                            !changeLogical.hasOwnProperty(table)
                                        ) {
                                            changeLogical[table] = [];
                                        }

                                        changeLogical[table].push(
                                            scope.databaseMeta.information
                                                .metamodel.tables[table]
                                                .columns[column]
                                        );
                                    }
                                }
                            }
                        }
                    }

                    // capture original
                    originalPositions[table] =
                        scope.databaseMeta.information.original.tables[
                            table
                        ].position;
                }
            }

            // save teh positions as a map
            for (const table in scope.databaseMeta.information.metamodel
                .tables) {
                if (
                    scope.databaseMeta.information.metamodel.tables.hasOwnProperty(
                        table
                    )
                ) {
                    // doesn't exist in the original it is a new node
                    if (
                        !scope.databaseMeta.information.original.tables.hasOwnProperty(
                            table
                        )
                    ) {
                        addedNodes.push(
                            scope.databaseMeta.information.metamodel.tables[
                                table
                            ]
                        );
                    }
                }

                // capture the updated
                updatedPositions[table] =
                    scope.databaseMeta.information.metamodel.tables[
                        table
                    ].position;
            }

            // map the current relationships
            for (
                let relationshipIdx = 0,
                    relationshipLen =
                        scope.databaseMeta.information.metamodel.relationships
                            .length;
                relationshipIdx < relationshipLen;
                relationshipIdx++
            ) {
                const relation =
                        scope.databaseMeta.information.metamodel.relationships[
                            relationshipIdx
                        ],
                    name = `${relation.fromTable}__${relation.fromColumn}.${relation.toTable}__${relation.toColumn}`;

                currentRelationships[name] = relation;
            }

            // see what was removed
            for (
                let relationshipIdx = 0,
                    relationshipLen =
                        scope.databaseMeta.information.original.relationships
                            .length;
                relationshipIdx < relationshipLen;
                relationshipIdx++
            ) {
                const relation =
                        scope.databaseMeta.information.original.relationships[
                            relationshipIdx
                        ],
                    name = `${relation.fromTable}__${relation.fromColumn}.${relation.toTable}__${relation.toColumn}`;

                if (!currentRelationships[name]) {
                    removedRelationships.push(relation);
                } else {
                    delete currentRelationships[name];
                }
            }

            // see what was added
            for (const name in currentRelationships) {
                if (currentRelationships.hasOwnProperty(name)) {
                    addedRelationships.push(currentRelationships[name]);
                }
            }

            // remove, add, modify (but do it out in - highest level -> lowest -> highest)
            if (removedRelationships.length > 0) {
                const startTable: any[] = [],
                    startColumn: any[] = [],
                    endTable: any[] = [],
                    endColumn: any[] = [];

                for (
                    let relationshipIdx = 0,
                        relationshipLen = removedRelationships.length;
                    relationshipIdx < relationshipLen;
                    relationshipIdx++
                ) {
                    const relation = removedRelationships[relationshipIdx];

                    startTable.push(relation.fromTable);
                    startColumn.push(relation.fromColumn || relation.fromTable);

                    endTable.push(relation.toTable);
                    endColumn.push(relation.toColumn || relation.toTable);
                }

                components.push({
                    type: 'removeOwlRelationship',
                    components: [
                        scope.databaseMeta.appId,
                        startTable,
                        startColumn,
                        endTable,
                        endColumn,
                    ],
                    meta: true,
                    terminal: true,
                });
            }

            // remove based on the split
            for (const table in removedProperties) {
                if (removedProperties.hasOwnProperty(table)) {
                    for (
                        let columnIdx = 0,
                            columnLen = removedProperties[table].length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        components.push({
                            type: 'removeOwlProperty',
                            components: [
                                scope.databaseMeta.appId,
                                removedProperties[table][columnIdx].table,
                                removedProperties[table][columnIdx].column,
                            ],
                            meta: true,
                            terminal: true,
                        });
                    }
                }
            }

            // remove based on the conceptual name aka the table.
            for (
                let conceptIdx = 0, conceptLen = removedNodes.length;
                conceptIdx < conceptLen;
                conceptIdx++
            ) {
                components.push({
                    type: 'removeOwlConcept',
                    components: [
                        scope.databaseMeta.appId,
                        removedNodes[conceptIdx].table,
                    ],
                    meta: true,
                    terminal: true,
                });
            }

            for (
                let conceptIdx = 0, conceptLen = addedNodes.length;
                conceptIdx < conceptLen;
                conceptIdx++
            ) {
                components.push({
                    type: 'addOwlConcept',
                    components: [
                        scope.databaseMeta.appId,
                        addedNodes[conceptIdx].table,
                        addedNodes[conceptIdx].table,
                        addedNodes[conceptIdx].columns[
                            addedNodes[conceptIdx].table
                        ].type,
                        addedNodes[conceptIdx].columns[
                            addedNodes[conceptIdx].table
                        ].typeFormat,
                        addedNodes[conceptIdx].columns[
                            addedNodes[conceptIdx].table
                        ].alias,
                        addedNodes[conceptIdx].columns[
                            addedNodes[conceptIdx].table
                        ].description,
                        addedNodes[conceptIdx].columns[
                            addedNodes[conceptIdx].table
                        ].logical,
                    ],
                    meta: true,
                    terminal: true,
                });

                for (const column in addedNodes[conceptIdx].columns) {
                    if (addedNodes[conceptIdx].columns.hasOwnProperty(column)) {
                        if (column !== addedNodes[conceptIdx].table) {
                            components.push({
                                type: 'addOwlProperty',
                                components: [
                                    scope.databaseMeta.appId,
                                    addedNodes[conceptIdx].table,
                                    addedNodes[conceptIdx].columns[column]
                                        .column,
                                    addedNodes[conceptIdx].columns[column].type,
                                    addedNodes[conceptIdx].columns[column]
                                        .typeFormat,
                                    addedNodes[conceptIdx].columns[column]
                                        .alias,
                                    addedNodes[conceptIdx].columns[column]
                                        .description,
                                    addedNodes[conceptIdx].columns[column]
                                        .logical,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        }
                    }
                }
            }

            for (const table in addedProperties) {
                if (addedProperties.hasOwnProperty(table)) {
                    for (
                        let columnIdx = 0,
                            columnLen = addedProperties[table].length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        components.push({
                            type: 'addOwlProperty',
                            components: [
                                scope.databaseMeta.appId,
                                table,
                                addedProperties[table][columnIdx].column,
                                addedProperties[table][columnIdx].type,
                                addedProperties[table][columnIdx].typeFormat,
                                addedProperties[table][columnIdx].alias,
                                addedProperties[table][columnIdx].description,
                                addedProperties[table][columnIdx].logical,
                            ],
                            meta: true,
                            terminal: true,
                        });
                    }
                }
            }

            if (addedRelationships.length > 0) {
                const startTable: any[] = [],
                    startColumn: any[] = [],
                    endTable: any[] = [],
                    endColumn: any[] = [];

                for (
                    let relationshipIdx = 0,
                        relationshipLen = addedRelationships.length;
                    relationshipIdx < relationshipLen;
                    relationshipIdx++
                ) {
                    const relation = addedRelationships[relationshipIdx];

                    startTable.push(relation.fromTable);
                    startColumn.push(relation.fromColumn || relation.fromTable);

                    endTable.push(relation.toTable);
                    endColumn.push(relation.toColumn || relation.toTable);
                }

                components.push({
                    type: 'addOwlRelationship',
                    components: [
                        scope.databaseMeta.appId,
                        startTable,
                        startColumn,
                        endTable,
                        endColumn,
                    ],
                    meta: true,
                    terminal: true,
                });
            }

            // change table alias
            for (const table in changeTableAlias) {
                if (changeTableAlias.hasOwnProperty(table)) {
                    components.push({
                        type: 'editOwlConceptConceptualName',
                        components: [
                            scope.databaseMeta.appId,
                            changeTableAlias[table].table,
                            changeTableAlias[table].alias,
                        ],
                        meta: true,
                        terminal: true,
                    });
                }
            }

            // change table description
            for (const table in changeTableDescription) {
                if (changeTableDescription.hasOwnProperty(table)) {
                    components.push({
                        type: 'editOwlDescription',
                        components: [
                            scope.databaseMeta.appId,
                            changeTableDescription[table].table,
                            false,
                            changeTableDescription[table].description,
                        ],
                        meta: true,
                        terminal: true,
                    });
                }
            }

            // change table logical
            for (const table in changeTableLogical) {
                if (changeTableLogical.hasOwnProperty(table)) {
                    components.push({
                        type: 'editOwlLogicalNames',
                        components: [
                            scope.databaseMeta.appId,
                            changeTableLogical[table].table,
                            false,
                            changeTableLogical[table].logical,
                        ],
                        meta: true,
                        terminal: true,
                    });
                }
            }

            // change table data types
            for (const table in changeTableDataTypes) {
                if (changeTableDataTypes.hasOwnProperty(table)) {
                    components.push({
                        type: 'editOwlConceptDataType',
                        components: [
                            scope.databaseMeta.appId,
                            changeTableDataTypes[table].table,
                            changeTableDataTypes[table].type,
                            changeTableDataTypes[table].typeFormat,
                        ],
                        meta: true,
                        terminal: true,
                    });
                }
            }

            for (const table in changeDataTypes) {
                if (changeDataTypes.hasOwnProperty(table)) {
                    for (
                        let columnIdx = 0,
                            columnLen = changeDataTypes[table].length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        if (changeDataTypes[table][columnIdx].isPrimKey) {
                            components.push({
                                type: 'editOwlConceptDataType',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeDataTypes[table][columnIdx].table,
                                    changeDataTypes[table][columnIdx].type,
                                    changeDataTypes[table][columnIdx]
                                        .typeFormat,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        } else {
                            components.push({
                                type: 'editOwlPropertyDataType',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeDataTypes[table][columnIdx].table,
                                    changeDataTypes[table][columnIdx].column,
                                    changeDataTypes[table][columnIdx].type,
                                    changeDataTypes[table][columnIdx]
                                        .typeFormat,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        }
                    }
                }
            }

            for (const table in changeAlias) {
                if (changeAlias.hasOwnProperty(table)) {
                    for (
                        let columnIdx = 0,
                            columnLen = changeAlias[table].length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        if (changeAlias[table][columnIdx].isPrimKey) {
                            components.push({
                                type: 'editOwlConceptConceptualName',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeAlias[table][columnIdx].table,
                                    changeAlias[table][columnIdx].alias,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        } else {
                            components.push({
                                type: 'editOwlPropertyConceptualName',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeAlias[table][columnIdx].table,
                                    changeAlias[table][columnIdx].column,
                                    changeAlias[table][columnIdx].alias,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        }
                    }
                }
            }

            for (const table in changeDescription) {
                if (changeDescription.hasOwnProperty(table)) {
                    for (
                        let columnIdx = 0,
                            columnLen = changeDescription[table].length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        if (changeDescription[table][columnIdx].isPrimKey) {
                            components.push({
                                type: 'editOwlDescription',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeDescription[table][columnIdx].table,
                                    false,
                                    changeDescription[table][columnIdx]
                                        .description,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        } else {
                            components.push({
                                type: 'editOwlDescription',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeDescription[table][columnIdx].table,
                                    changeDescription[table][columnIdx].column,
                                    changeDescription[table][columnIdx]
                                        .description,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        }
                    }
                }
            }

            for (const table in changeLogical) {
                if (changeLogical.hasOwnProperty(table)) {
                    for (
                        let columnIdx = 0,
                            columnLen = changeLogical[table].length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        if (changeLogical[table][columnIdx].isPrimKey) {
                            components.push({
                                type: 'editOwlLogicalNames',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeLogical[table][columnIdx].table,
                                    false,
                                    changeLogical[table][columnIdx].logical,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        } else {
                            components.push({
                                type: 'editOwlLogicalNames',
                                components: [
                                    scope.databaseMeta.appId,
                                    changeLogical[table][columnIdx].table,
                                    changeLogical[table][columnIdx].column,
                                    changeLogical[table][columnIdx].logical,
                                ],
                                meta: true,
                                terminal: true,
                            });
                        }
                    }
                }
            }

            if (
                JSON.stringify(originalPositions) !==
                JSON.stringify(updatedPositions)
            ) {
                components.push({
                    type: 'saveOwlPositions',
                    components: [scope.databaseMeta.appId, updatedPositions],
                    meta: true,
                    terminal: true,
                });
            }

            if (components.length === 0) {
                return;
            }

            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                const type = response.pixelReturn[0].operationType;

                // if there is an error, don't reset
                if (type.indexOf('ERROR') > -1) {
                    return;
                }
                getMetamodel();
            });

            components.push({
                type: 'syncDatabaseWithLocalMaster',
                components: [scope.databaseMeta.appId],
                meta: true,
                terminal: true,
            });

            semossCoreService.emit('query-pixel', {
                commandList: components,
                response: message,
            });
        }

        /**
         * @name hasMetamodelChanged
         * @desc check if the metamodel has changed
         */
        function hasMetamodelChanged(): boolean {
            if (
                !scope.databaseMeta.information.metamodel.externalChangesApplied
            ) {
                if (
                    JSON.stringify(
                        scope.databaseMeta.information.original.tables
                    ) !==
                    JSON.stringify(
                        scope.databaseMeta.information.metamodel.tables
                    )
                ) {
                    scope.databaseMeta.localChangesApplied = true;
                }
            }
            return (
                JSON.stringify(scope.databaseMeta.information.original) !==
                JSON.stringify(scope.databaseMeta.information.metamodel)
            );
        }

        /**
         * @name resetMetamodel
         * @desc reset the changes
         */
        function resetMetamodel(): void {
            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Reset Metamodel',
            });

            scope.databaseMeta.information.metamodel = JSON.parse(
                JSON.stringify(scope.databaseMeta.information.original)
            );
            scope.databaseMeta.localChangesApplied = false;
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

        /** Edit */
        /**
        /**
          * @name editItem
          * @desc selects a column to grab data about
          * @param type - type of edit (table, column)
          * @param options - options to save
         */
        function editItem(type: 'table' | 'column', options: any): void {
            if (type === 'table') {
                if (scope.databaseMeta.information.externalDb) {
                    scope.databaseMeta.information.showEditTable = true;
                } else {
                    scope.databaseMeta.information.showEditColumnTable = true;
                }

                scope.databaseMeta.information.selectedTable = options.table;
            } else if (type === 'column') {
                scope.databaseMeta.information.showEditColumn = true;

                scope.databaseMeta.information.selectedTable = options.table;
                scope.databaseMeta.information.selectedColumn = options.column;
            }
        }

        /**
         * @name changeColumn
         * @param type - type that was formatted
         * @param typeFormat - new typeformat
         * @param alias - new alias for the column
         * @param description - new description for the column
         * @param logical - new logical for the column
         * @desc callback for header formatting
         */
        function changeColumn(
            type: string,
            typeFormat: string,
            alias: string,
            description: string,
            logical: string[]
        ): void {
            // update the values
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].columns[scope.databaseMeta.information.selectedColumn].type =
                type;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].columns[
                scope.databaseMeta.information.selectedColumn
            ].typeFormat = typeFormat;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].columns[scope.databaseMeta.information.selectedColumn].alias =
                alias;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].columns[
                scope.databaseMeta.information.selectedColumn
            ].description = description;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].columns[scope.databaseMeta.information.selectedColumn].logical =
                logical;

            // reset
            scope.databaseMeta.information.showEditColumn = false;
        }

        /**
         * @name changeColumnTable
         * @param type - type that was formatted
         * @param typeFormat - new typeformat
         * @param alias - new alias for the table
         * @param description - new description for the table
         * @param logical - new logical for the table
         * @desc callback for header formatting for non-rdbms tables
         */
        function changeColumnTable(
            type: string,
            typeFormat: string,
            alias: string,
            description: string,
            logical: string[]
        ): void {
            // update the values
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].type = type;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].typeFormat = typeFormat;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].alias = alias;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].description = description;
            scope.databaseMeta.information.metamodel.tables[
                scope.databaseMeta.information.selectedTable
            ].logical = logical;

            // reset
            scope.databaseMeta.information.showEditColumnTable = false;
        }

        /**
         * @name toggleTabs
         * @param tab - tab being selected
         * @desc switch tabs and update data accordingly
         */
        function toggleTabs(tab: string): void {
            scope.databaseMeta.selectedTab = tab;
        }

        /** Utility */
        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
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

            // load import chunk
            scope.databaseMeta.loadImport = false;
            import(
                /* webpackChunkName: "components/import" */ '../../import/import.directive.js'
            )
                .then((module) => {
                    $ocLazyLoad.load(module.default);
                    scope.databaseMeta.loadImport = true;
                })
                .catch((err) => {
                    console.error('Error: ', err);
                });
        }

        initialize();
    }
}
