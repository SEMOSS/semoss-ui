'use strict';

export default angular
    .module('app.import-external.directive', [])
    .directive('importExternal', importExternalDirective);

import { CONNECTORS } from '@/core/constants';

import './import-external.scss';

importExternalDirective.$inject = ['semossCoreService'];

function importExternalDirective(semossCoreService) {
    importExternalController.$inject = [];
    importExternalLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^import'],
        controller: importExternalController,
        bindToController: {
            driver: '=',
        },
        controllerAs: 'importExternal',
        link: importExternalLink,
        template: require('./import-external.directive.html'),
    };

    function importExternalController() {}

    function importExternalLink(scope, ele, attrs, ctrl) {
        scope.importCtrl = ctrl[0];

        scope.importExternal.step = 1; // step of data
        scope.importExternal.appInfo = {
            name: '',
            img: '',
            requiredValid: false,
            type: '',
        };
        scope.importExternal.connection = {
            dbDriver: '',
            additional: '',
            connectionString: '',
        };
        scope.importExternal.advancedConnection = {};

        scope.importExternal.filter = {
            open: false,
            viewOptions: [],
            viewModel: [],
            tableOptions: [],
            tableModel: [],
        };

        scope.importExternal.metamodel = {
            tables: {},
            relationships: [],
        };

        scope.importExternal.advancedSettings = {
            open: false,
            showButton: false,
        };

        scope.importExternal.inputs = [];
        scope.importExternal.advancedInputs = [];

        scope.importExternal.setConnection = setConnection;
        scope.importExternal.checkConnection = checkConnection;
        scope.importExternal.loadConnection = loadConnection;
        scope.importExternal.loadMetamodel = loadMetamodel;
        scope.importExternal.importMetamodel = importMetamodel;
        scope.importExternal.updateConnectionDetails = updateConnectionDetails;

        /** Steps */
        /** Step 1 */

        /**
         * @name setRequiredInputs
         * @desc update the connection detail inputs required for the selected connector
         * @return {void}
         */
        function setRequiredInputs() {
            // setup the dynamic model for the inputs required for the driver
            let input, advancedInput;

            scope.importExternal.inputs = [];
            scope.importExternal.advancedInputs = [];
            scope.importExternal.advancedSettings.showButton = false;

            // standard inputs
            for (
                let i = 0;
                CONNECTORS[scope.importExternal.driver].inputs &&
                i < CONNECTORS[scope.importExternal.driver].inputs.length;
                i++
            ) {
                input = CONNECTORS[scope.importExternal.driver].inputs[i];

                scope.importExternal.inputs.push({
                    display: input.display,
                    visible: true,
                    value: input.defaultValue,
                    required: input.required,
                    description: input.description,
                    secret: input.secret || false,
                    type: input.type || 'text',
                    advanced: input.advanced,
                    alias: input.alias,
                });
            }
            // advanced settings
            for (
                let k = 0;
                CONNECTORS[scope.importExternal.driver].advancedInputs &&
                k <
                    CONNECTORS[scope.importExternal.driver].advancedInputs
                        .length;
                k++
            ) {
                advancedInput =
                    CONNECTORS[scope.importExternal.driver].advancedInputs[k];
                scope.importExternal.advancedSettings.showButton = true;

                scope.importExternal.advancedInputs.push({
                    display: advancedInput.display,
                    visible: true,
                    value: advancedInput.defaultValue,
                    required: advancedInput.required,
                    description: advancedInput.description,
                    secret: advancedInput.secret || false,
                    type: advancedInput.type || 'text',
                    alias: advancedInput.alias,
                });
            }
        }

        /**
         * @name setConnection
         * @desc reset the selected form
         * @return {void}
         */
        function setConnection() {
            if (
                !scope.importExternal.driver ||
                !CONNECTORS.hasOwnProperty(scope.importExternal.driver)
            ) {
                console.error('Correct driver is not selected');
                return;
            }

            // dynamically set the model for the inputs required for the selected driver
            setRequiredInputs();

            scope.importExternal.step = 1; // step of data

            scope.importExternal.appInfo = {
                name: CONNECTORS[scope.importExternal.driver].name,
                img: CONNECTORS[scope.importExternal.driver].image,
                type: CONNECTORS[scope.importExternal.driver].type,
                requiredValid: false,
            };
            scope.importExternal.connection = {
                dbDriver: CONNECTORS[scope.importExternal.driver].driver,
                additional: '',
                connectionString: '',
            };

            scope.importExternal.filter = {
                open: false,
                viewOptions: [],
                viewModel: [],
                tableOptions: [],
                tableModel: [],
            };

            scope.importExternal.metamodel = {
                tables: {},
                relationships: [],
            };
        }

        /**
         * @name updateConnectionDetails
         * @desc save inputted connection details on the scope
         * @return {void}
         */
        function updateConnectionDetails() {
            let valid = true;

            for (let i = 0; i < scope.importExternal.inputs.length; i++) {
                const input = scope.importExternal.inputs[i];

                // save input on scope
                scope.importExternal.connection[input.alias] = input.value;

                // check if required fields are populated
                if (input.required && !input.value) {
                    valid = false;
                }
            }
            // add advanced options if selected
            for (
                let k = 0;
                k < scope.importExternal.advancedInputs.length;
                k++
            ) {
                const input = scope.importExternal.advancedInputs[k];
                // save input on scope
                if (input.value !== '') {
                    scope.importExternal.advancedConnection[input.alias] =
                        input.value;
                }
            }

            // are all required fields provided?
            scope.importExternal.appInfo.requiredValid = valid;
        }

        /**
         * @name checkConnection
         * @desc validate the connection form
         * @return {boolean} is the connection valid or not?
         */
        function checkConnection() {
            return (
                (scope.importCtrl.name.valid &&
                    scope.importExternal.appInfo.requiredValid) ||
                (scope.importCtrl.name.valid &&
                    scope.importExternal.connection.connectionString)
            );
        }

        /**
         * @name loadConnection
         * @desc load the connection details, validating that it is correct and grabbing the table information
         * @param {boolean} reset - reset the connection?
         * @return {void}
         */
        function loadConnection(reset) {
            var callback;

            if (!checkConnection()) {
                return;
            }

            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    scope.importCtrl.alert(
                        'error',
                        'Unable to connect to ' +
                            scope.importExternal.appInfo.name
                    );
                    return;
                }

                if (output.views.length === 0 && output.tables.length === 0) {
                    scope.importCtrl.alert(
                        'warn',
                        'Unable to find Tables or View for ' +
                            scope.importExternal.appInfo.name
                    );
                    return;
                }

                scope.importExternal.filter.viewOptions = JSON.parse(
                    JSON.stringify(output.views)
                );
                scope.importExternal.filter.tableOptions = JSON.parse(
                    JSON.stringify(output.tables)
                );
                if (reset) {
                    scope.importExternal.filter.viewModel = JSON.parse(
                        JSON.stringify(output.views)
                    );
                    scope.importExternal.filter.tableModel = JSON.parse(
                        JSON.stringify(output.tables)
                    );
                }

                // open and shift the page
                scope.importExternal.step = 2;
                scope.importExternal.filter.open = true;
            };

            scope.importCtrl.query(
                [
                    {
                        type: 'externalJdbcTablesAndViews',
                        components: [
                            semossCoreService.utility.freeze(
                                scope.importExternal.connection
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
                scope.importExternal.filter.tableModel.length === 0 &&
                scope.importExternal.filter.viewModel.length === 0
            ) {
                return;
            }

            // close the filter
            scope.importExternal.filter.open = false;

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
                        'Unable to connect to ' +
                            scope.importExternal.appInfo.name
                    );
                    scope.importExternal.filter.open = true;
                    return;
                }

                // create a mapping, this will help us update the tables (rather than replace)
                tableMapping = {};
                for (i = 0, len = output.tables.length; i < len; i++) {
                    tableMapping[output.tables[i].table] = i;
                }

                // remove relationships that are between tables that are missing
                for (
                    i = scope.importExternal.metamodel.relationships.length - 1;
                    i >= 0;
                    i--
                ) {
                    // remove the relationship, that if a table in the mapping
                    if (
                        !tableMapping.hasOwnProperty(
                            scope.importExternal.metamodel.relationships[i]
                                .fromTable
                        ) ||
                        !tableMapping.hasOwnProperty(
                            scope.importExternal.metamodel.relationships[i]
                                .toTable
                        )
                    ) {
                        scope.importExternal.metamodel.relationships.splice(
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
                                scope.importExternal.metamodel.relationships
                                    .length;
                        j < len2;
                        j++
                    ) {
                        // already exists
                        if (
                            scope.importExternal.metamodel.relationships[j]
                                .fromTable ===
                                output.relationships[i].fromTable &&
                            scope.importExternal.metamodel.relationships[j]
                                .fromColumn ===
                                output.relationships[i].fromCol &&
                            scope.importExternal.metamodel.relationships[j]
                                .toTable === output.relationships[i].toTable &&
                            scope.importExternal.metamodel.relationships[j]
                                .toColumn === output.relationships[i].toCol
                        ) {
                            continue relLoop;
                        }
                    }

                    scope.importExternal.metamodel.relationships.push({
                        fromTable: output.relationships[i].fromTable,
                        fromColumn: output.relationships[i].fromCol,
                        toTable: output.relationships[i].toTable,
                        toColumn: output.relationships[i].toCol,
                        alias: '',
                    });
                }

                // delete the tables
                for (i in scope.importExternal.metamodel.tables) {
                    if (
                        !tableMapping.hasOwnProperty(
                            scope.importExternal.metamodel.tables[i].table
                        )
                    ) {
                        // remove the tables, that aren't in the mapping
                        delete scope.importExternal.metamodel.tables[i];
                    } else {
                        // delete the mapping value, because it is already added
                        delete tableMapping[
                            scope.importExternal.metamodel.tables[i].table
                        ];
                    }
                }

                // add the tables that are remaining in the mapping
                for (i in tableMapping) {
                    if (
                        tableMapping.hasOwnProperty(i) &&
                        output.tables[tableMapping[i]].columns
                    ) {
                        scope.importExternal.metamodel.tables[
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
                            scope.importExternal.metamodel.tables[
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

            scope.importCtrl.query(
                [
                    {
                        type: 'externalJdbcSchema',
                        components: [
                            semossCoreService.utility.freeze(
                                scope.importExternal.connection
                            ),
                            scope.importExternal.filter.tableModel.concat(
                                scope.importExternal.filter.viewModel
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
            let metamodel = {
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
                    len = scope.importExternal.metamodel.relationships.length;
                i < len;
                i++
            ) {
                metamodel.relationships.push({
                    relName:
                        scope.importExternal.metamodel.relationships[i]
                            .fromColumn +
                        '.' +
                        scope.importExternal.metamodel.relationships[i]
                            .toColumn,
                    toTable:
                        scope.importExternal.metamodel.relationships[i].toTable,
                    fromTable:
                        scope.importExternal.metamodel.relationships[i]
                            .fromTable,
                });
            }

            for (let i in scope.importExternal.metamodel.tables) {
                // if columns exist in this table, then we process it
                if (
                    scope.importExternal.metamodel.tables.hasOwnProperty(i) &&
                    scope.importExternal.metamodel.tables[i].columns &&
                    Object.keys(
                        scope.importExternal.metamodel.tables[i].columns
                    ).length > 0
                ) {
                    let primKey = '',
                        concat = '';

                    // assume that the first primkey is the important one. The user can change it later on
                    for (let j in scope.importExternal.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.importExternal.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            if (
                                scope.importExternal.metamodel.tables[i]
                                    .columns[j].isPrimKey
                            ) {
                                primKey =
                                    scope.importExternal.metamodel.tables[i]
                                        .columns[j].column;
                                break;
                            }
                        }
                    }

                    // if there is no primKey, we assume it is the first one... SQL Tables always have a column
                    if (!primKey) {
                        primKey =
                            scope.importExternal.metamodel.tables[i].columns[
                                Object.keys(
                                    scope.importExternal.metamodel.tables[i]
                                        .columns
                                )[0]
                            ].column;
                    }

                    concat =
                        scope.importExternal.metamodel.tables[i].table +
                        '.' +
                        primKey;

                    metamodel.tables[concat] = [];
                    for (let j in scope.importExternal.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.importExternal.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            metamodel.tables[concat].push(
                                scope.importExternal.metamodel.tables[i]
                                    .columns[j].column
                            );
                        }
                    }

                    // save positions
                    positions[scope.importExternal.metamodel.tables[i].table] =
                        scope.importExternal.metamodel.tables[i].position;
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

            // combined advanced settings into connection details if present
            if (
                Object.keys(scope.importExternal.advancedConnection).length > 0
            ) {
                Object.assign(
                    scope.importExternal.connection,
                    scope.importExternal.advancedConnection
                );
            }

            pixel += 'databaseVar = ';
            pixel += semossCoreService.pixel.build([
                {
                    type: 'rdbmsExternalUpload',
                    components: [
                        semossCoreService.utility.freeze(
                            scope.importExternal.connection
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
            scope.$watch(
                'importExternal.driver',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue)) {
                        setConnection();
                    }
                }
            );

            setConnection();
        }

        initialize();
    }
}
