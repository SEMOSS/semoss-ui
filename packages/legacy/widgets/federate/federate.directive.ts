'use strict';

import angular from 'angular';
import './federate.scss';
import Pixel from '../../core/store/pixel/pixel';

export default angular
    .module('app.federate.directive', [])
    .directive('federate', federateDirective);

federateDirective.$inject = [
    'semossCoreService',
    'ENDPOINT',
    '$timeout',
    'monolithService',
];

function federateDirective(
    semossCoreService,
    ENDPOINT,
    $timeout,
    monolithService
) {
    federateCtrl.$inject = [];
    federateLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./federate.directive.html'),
        controller: federateCtrl,
        link: federateLink,
        scope: {},
        bindToController: {
            frameInfo: '=?',
        },
        controllerAs: 'federate',
        require: ['^widget', '?^pipeline'],
    };

    function federateCtrl() {}
    function federateLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineCtrl = ctrl[1];

        const _JOINTYPES = {
            'inner.join': {
                display: 'Inner Join',
                value: 'inner.join',
                img: require('images/inner_join.svg'),
            },
            'left.outer.join': {
                display: 'Left Join',
                value: 'left.outer.join',
                img: require('images/left_join.svg'),
            },
            'right.outer.join': {
                display: 'Right Join',
                value: 'right.outer.join',
                img: require('images/right_join.svg'),
            },
            'outer.join': {
                display: 'Outer Join',
                value: 'outer.join',
                img: require('images/outer_join.svg'),
            },
        };

        scope.federate.highlight = highlight;
        scope.federate.resetSelections = resetSelections;
        scope.federate.setJoinOptions = setJoinOptions;
        scope.federate.getTraversedColumns = getTraversedColumns;
        scope.federate.toggleDbExpand = toggleDbExpand;
        scope.federate.toggleTableExpand = toggleTableExpand;
        scope.federate.removeJoin = removeJoin;
        scope.federate.removeColumn = removeColumn;
        scope.federate.addNewJoin = addNewJoin;
        scope.federate.navigate = navigate;
        scope.federate.addData = addData;
        scope.federate.addMore = addMore;
        scope.federate.cancel = cancel;
        scope.federate.isJoinDisabled = isJoinDisabled;
        scope.federate.hasSelections = hasSelections;
        scope.federate.previewData = previewData;
        scope.federate.importData = importData;
        scope.federate.visualize = visualize;
        scope.federate.toggleTraversal = toggleTraversal;
        scope.federate.getMetamodel = getMetamodel;
        scope.federate.setOverview = setOverview;

        scope.federate.appMapping = {};
        scope.federate.source = {
            frameHeaders: [],
            selected: [],
            traversedMeta: [],
        };
        scope.federate.add = {
            options: {},
            apps: {
                list: [],
                selected: {},
            },
            showAll: true,
            isFreeTraversal: false,
        };
        // tempStore will cache the traversal options
        scope.federate.tempStore = {
            // normal traversal options
            traversals: {
                apps: {
                    list: [],
                    selected: {},
                },
                options: {},
            },
            // free traversal options
            freeTraversals: {
                apps: {
                    list: [],
                    selected: {},
                },
                options: {},
            },
        };
        scope.federate.joins = {
            joinTypes: _JOINTYPES,
            mergeColumns: [],
            list: [],
            combinedColumns: [],
            newColumns: [],
            highlight: false,
        };

        scope.federate.overview = {
            frameHeaders: [],
            database: [],
            showFilter: false,
            showAll: true,
        };

        scope.federate.step = 'source'; // 'source', 'add', 'join', 'overview'

        /**
         * @name
         */
        function highlight(): void {
            if (scope.federate.joins.highlight) {
                $timeout.cancel(scope.federate.joins.highlight);
            }

            scope.federate.joins.highlight = $timeout(function () {
                scope.federate.joins.highlight = false;
            }, 1000);
        }

        /**
         * @name toggleTraversal
         * @desc toggles the traversal option and cache the previous options
         */
        function toggleTraversal() {
            let tempApps: any;
            let tempOptions: any;

            if (scope.federate.add.isFreeTraversal) {
                tempApps = semossCoreService.utility.freeze(
                    scope.federate.tempStore.freeTraversals.apps
                );
                tempOptions = semossCoreService.utility.freeze(
                    scope.federate.tempStore.freeTraversals.options
                );

                scope.federate.tempStore.traversals.apps =
                    semossCoreService.utility.freeze(scope.federate.add.apps);
                scope.federate.tempStore.traversals.options =
                    semossCoreService.utility.freeze(
                        scope.federate.add.options
                    );
            } else {
                tempApps = semossCoreService.utility.freeze(
                    scope.federate.tempStore.traversals.apps
                );
                tempOptions = semossCoreService.utility.freeze(
                    scope.federate.tempStore.traversals.options
                );

                scope.federate.tempStore.freeTraversals.apps =
                    semossCoreService.utility.freeze(scope.federate.add.apps);
                scope.federate.tempStore.freeTraversals.options =
                    semossCoreService.utility.freeze(
                        scope.federate.add.options
                    );
            }

            scope.federate.add.apps = tempApps;
            scope.federate.add.options = tempOptions;

            // indicates this is the first time toggling to free traversal, so we will get all the apps and then get the metamodel
            // the metamodel output then gets converted to the appropriate structure to work with the rest of the logic in this directive
            if (scope.federate.add.apps.list.length === 0) {
                getAllApps();
            }
        }

        /**
         * @name getAllApps
         * @desc get all of the apps available
         * @returns {void}
         */
        function getAllApps(): void {
            let callback: Function;

            callback = function (response: any) {
                const output: any = response.pixelReturn[0].output;
                let appIdx: number;
                scope.federate.add.apps.list = [];
                scope.federate.add.apps.selected = {};
                for (appIdx = 0; appIdx < output.length; appIdx++) {
                    scope.federate.add.apps.list.push({
                        database_id: output[appIdx].database_id,
                        database_name: output[appIdx].database_name,
                        appImage:
                            semossCoreService.app.generateDatabaseImageURL(
                                output[appIdx].database_id
                            ),
                    });
                }

                // set selected app
                if (scope.federate.add.apps.list.length > 0) {
                    scope.federate.add.apps.selected =
                        scope.federate.add.apps.list[0];
                    // get the metamodel for the selected app
                    getMetamodel(scope.federate.add.apps.selected);
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'myDatabases',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getMetamodel
         * @param {*} app the app to get metamodel for
         * @desc get the metamodel information for the selected app
         * @returns {void}
         */
        function getMetamodel(app: any): void {
            let callback: Function;

            callback = function (response: any) {
                const edges: any = response.pixelReturn[0].output.edges;
                const tables: any = response.pixelReturn[0].output.nodes;

                let edgeIdx: number;
                let tableIdx: number;
                let propIdx: number;

                scope.federate.add.options[app.database_id] = {
                    tables: {},
                };

                for (tableIdx = 0; tableIdx < tables.length; tableIdx++) {
                    if (
                        !scope.federate.add.options[app.database_id].tables[
                            tables[tableIdx].conceptualName
                        ]
                    ) {
                        scope.federate.add.options[app.database_id].tables[
                            tables[tableIdx].conceptualName
                        ] = {
                            options: [],
                            selected: [],
                            show: true,
                            tableName: tables[tableIdx].conceptualName,
                        };

                        for (
                            propIdx = 0;
                            propIdx < tables[tableIdx].propSet.length;
                            propIdx++
                        ) {
                            scope.federate.add.options[app.database_id].tables[
                                tables[tableIdx].conceptualName
                            ].options.push({
                                database_id: app.database_id,
                                database_name: app.database_name,
                                appImage:
                                    semossCoreService.app.generateDatabaseImageURL(
                                        app.database_id
                                    ),
                                table: tables[tableIdx].conceptualName,
                                alias: tables[tableIdx].propSet[propIdx],
                                name: tables[tableIdx].propSet[propIdx],
                                qs:
                                    tables[tableIdx].conceptualName +
                                    '__' +
                                    tables[tableIdx].propSet[propIdx],
                                type: 'property',
                                equivalentQs: '',
                                equivalentAlias: '',
                                fromJoinQs: '',
                                toJoinQs: '',
                                filters: [],
                            });
                        }
                    } else {
                    }
                }

                /**
                 * TODO need to save this edge information if users wants to federate across tables
                 * we would need to loop through the selected columns and then check to see if they have different
                 * tables. if so, we will have to loop through these edges and setup the appropriate joins.
                 */
                // for (edgeIdx = 0; edgeIdx < edges.length; edgeIdx++) {

                // }

                setJoinOptions();
            };

            // is free traversal AND metamodel not filled?
            if (
                scope.federate.add.isFreeTraversal &&
                !scope.federate.add.options[app.database_id]
            ) {
                scope.widgetCtrl.meta(
                    [
                        {
                            type: 'getDatabaseMetamodel',
                            components: [app.database_id],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name getFrameHeaders
         * @desc gets the frame headers
         * @returns {void}
         */
        function getFrameHeaders(): void {
            let callback: Function,
                pixelComponents: any = [];

            // headers already passed in, so no need to get
            if (scope.federate.frameInfo.headers) {
                scope.federate.source.frameHeaders =
                    scope.federate.frameInfo.headers;
            } else {
                // get the headers
                pixelComponents = [
                    {
                        type: 'frame',
                        components: [scope.federate.frameInfo.frame || ''], // use the passed in frame or the default Frame()
                        terminal: false,
                        meta: true,
                    },
                    {
                        type: 'frameHeaders',
                        components: [],
                        terminal: true,
                    },
                ];

                callback = function (response: any) {
                    const output = response.pixelReturn[0].output;
                    if (
                        output &&
                        output.headerInfo.headers &&
                        output.headerInfo.headers.length > 0
                    ) {
                        scope.federate.source.frameHeaders =
                            output.headerInfo.headers;
                    } else {
                        scope.federate.source.frameHeaders = [];
                    }
                };

                scope.widgetCtrl.meta(pixelComponents, callback);
            }
        }

        /**
         * @name toggleTableExpand
         * @param {boolean} bool set expand to true/false
         */
        function toggleTableExpand(bool: boolean): void {
            let table: string;
            const currentTables: any =
                scope.federate.add.options[
                    scope.federate.add.apps.selected.database_id
                ].tables;

            scope.federate.add.showAll = bool;

            for (table in currentTables) {
                if (currentTables.hasOwnProperty(table)) {
                    currentTables[table].show = bool;
                }
            }
        }

        /**
         * @name setDbName
         * @param appId the app id to get name for
         * @desc get the app name for the app id
         * @returns {void}
         */
        function setDbName(appId: string): void {
            const pixel = Pixel.build([
                {
                    type: 'databaseInfo',
                    components: [appId],
                    terminal: true,
                    meta: true,
                },
            ]);

            monolithService
                .runPixel(scope.widgetCtrl.insightID, pixel)
                .then(function (response) {
                    if (
                        response.pixelReturn[0].operationType.indexOf(
                            'ERROR'
                        ) === -1
                    ) {
                        scope.federate.appMapping[appId] =
                            response.pixelReturn[0].output.database_name;
                    }
                });
        }

        /**
         * @name getTraversedColumns
         * @desc check the selected columns and set the meta information
         * @returns {void}
         */
        function getTraversedColumns(): void {
            let selectIdx: number;
            let dbList: any = [];
            let db: string;

            scope.federate.source.traversedMeta = [];
            for (
                selectIdx = 0;
                selectIdx < scope.federate.source.selected.length;
                selectIdx++
            ) {
                dbList = [];
                for (db in scope.federate.source.selected[selectIdx].qsName) {
                    if (
                        scope.federate.source.selected[
                            selectIdx
                        ].qsName.hasOwnProperty(db)
                    ) {
                        if (!scope.federate.appMapping[db]) {
                            // get the app name
                            setDbName(db);
                        }
                        dbList.push(db);
                    }
                }

                scope.federate.source.traversedMeta.push({
                    name: scope.federate.source.selected[selectIdx].displayName,
                    dbList: dbList,
                });
            }
        }

        /**
         * @name getTraversalOptions
         * @desc get the traverse options
         * @returns {void}
         */
        function getTraversalOptions(): void {
            let pixelComponents: any = [];
            let callback: Function;

            /**
             * @name _setApps
             * @param {any} options list of traversal options
             * @desc loop through traversal options and pull out the unique apps
             * @returns {void}
             */
            function _setApps(options: any): void {
                let optionIdx: number;
                let found: boolean;
                let appIdx: number;

                scope.federate.add.apps.list = [];
                scope.federate.add.apps.selected = {};
                for (optionIdx = 0; optionIdx < options.length; optionIdx++) {
                    found = false;
                    for (
                        appIdx = 0;
                        appIdx < scope.federate.add.apps.list.length;
                        appIdx++
                    ) {
                        if (
                            scope.federate.add.apps.list[appIdx].database_id ===
                            options[optionIdx].database_id
                        ) {
                            found = true;
                        }
                    }

                    if (!found) {
                        scope.federate.add.apps.list.push({
                            database_id: options[optionIdx].database_id,
                            database_name: options[optionIdx].database_name,
                            appImage:
                                semossCoreService.app.generateDatabaseImageURL(
                                    options[optionIdx].database_id
                                ),
                        });
                    }
                }

                if (scope.federate.add.apps.list.length > 0) {
                    scope.federate.add.apps.selected =
                        scope.federate.add.apps.list[0];
                }
            }

            callback = function (response: any) {
                let outputIdx: number;
                const output = response.pixelReturn[0].output;
                let columnType = '';
                let fromJoinQs = '';
                let toJoinQs = '';
                let columnQs = '';
                let columnAlias = '';
                let columnPk = false;
                let equivalentQs = '';
                let equivalentAlias = '';
                let traverseOption: any;

                // first we construct the available tables
                for (outputIdx = 0; outputIdx < output.length; outputIdx++) {
                    _setApps(output);
                    columnType = output[outputIdx].type;

                    // add the actual values
                    if (columnType === 'property') {
                        fromJoinQs = '';
                        toJoinQs = '';

                        // is it a concept?
                        if (output[outputIdx].pk) {
                            columnQs = output[outputIdx].table;
                            columnAlias = String(output[outputIdx].table);
                            columnType = 'concept';
                            columnPk = true;
                        } else {
                            columnQs =
                                output[outputIdx].table +
                                '__' +
                                output[outputIdx].column;
                            columnAlias = String(output[outputIdx].column);
                            columnPk = false;
                        }

                        if (output[outputIdx].equivPk) {
                            equivalentQs = output[outputIdx].equivTable;
                            equivalentAlias = String(
                                output[outputIdx].equivTable
                            );
                        } else {
                            equivalentQs =
                                output[outputIdx].equivTable +
                                '__' +
                                output[outputIdx].equivColumn;
                            equivalentAlias = String(
                                output[outputIdx].equivColumn
                            );
                        }
                    } else if (columnType === 'downstream') {
                        columnQs = output[outputIdx].table;
                        columnAlias = String(output[outputIdx].table);
                        columnPk = true;
                        fromJoinQs = output[outputIdx].equivTable;
                        toJoinQs = columnQs;
                        equivalentQs = output[outputIdx].equivTable;
                        equivalentAlias = String(output[outputIdx].equivTable);
                    } else if (columnType === 'upstream') {
                        columnQs = output[outputIdx].table;
                        columnAlias = String(output[outputIdx].table);
                        columnPk = true;
                        fromJoinQs = columnQs;
                        toJoinQs = output[outputIdx].equivTable;
                        equivalentQs = output[outputIdx].equivTable;
                        equivalentAlias = String(output[outputIdx].equivTable);
                    }

                    traverseOption = {
                        database_id: output[outputIdx].database_id,
                        database_name: output[outputIdx].database_name,
                        appImage:
                            semossCoreService.app.generateDatabaseImageURL(
                                output[outputIdx].database_id
                            ),
                        table: output[outputIdx].table,
                        alias: columnAlias,
                        name: columnAlias,
                        qs: columnQs,
                        type: columnType,
                        equivalentQs: equivalentQs,
                        equivalentAlias: equivalentAlias,
                        fromJoinQs: fromJoinQs,
                        toJoinQs: toJoinQs,
                        filters: [],
                    };

                    if (
                        scope.federate.add.options[
                            output[outputIdx].database_id
                        ]
                    ) {
                        if (
                            scope.federate.add.options[
                                output[outputIdx].database_id
                            ].tables[traverseOption.table]
                        ) {
                            scope.federate.add.options[
                                output[outputIdx].database_id
                            ].tables[traverseOption.table].options.push(
                                traverseOption
                            );
                        } else {
                            scope.federate.add.options[
                                traverseOption.database_id
                            ].tables[traverseOption.table] = {};
                            scope.federate.add.options[
                                traverseOption.database_id
                            ].tables[traverseOption.table].show = true;
                            scope.federate.add.options[
                                traverseOption.database_id
                            ].tables[traverseOption.table].tableName =
                                traverseOption.table;
                            scope.federate.add.options[
                                traverseOption.database_id
                            ].tables[traverseOption.table].options = [];
                            scope.federate.add.options[
                                traverseOption.database_id
                            ].tables[traverseOption.table].options.push(
                                traverseOption
                            );
                        }
                    } else {
                        scope.federate.add.options[traverseOption.database_id] =
                            {};
                        scope.federate.add.options[
                            traverseOption.database_id
                        ].tables = {};
                        scope.federate.add.options[
                            traverseOption.database_id
                        ].tables[traverseOption.table] = {};
                        scope.federate.add.options[
                            traverseOption.database_id
                        ].tables[traverseOption.table].show = true;
                        scope.federate.add.options[
                            traverseOption.database_id
                        ].tables[traverseOption.table].tableName =
                            traverseOption.table;
                        scope.federate.add.options[
                            traverseOption.database_id
                        ].tables[traverseOption.table].options = [];
                        scope.federate.add.options[
                            traverseOption.database_id
                        ].tables[traverseOption.table].options.push(
                            traverseOption
                        );
                    }

                    scope.federate.add.options[
                        traverseOption.database_id
                    ].tables[traverseOption.table].selected = [];
                }

                setJoinOptions();
            };

            const traversals: any = [];
            let selectIdx: number;

            for (
                selectIdx = 0;
                selectIdx < scope.federate.source.selected.length;
                selectIdx++
            ) {
                traversals.push(
                    scope.federate.source.selected[selectIdx].alias
                );
            }

            pixelComponents = [
                {
                    type: 'getDatabaseConnections',
                    components: [traversals],
                    terminal: true,
                    meta: true,
                },
            ];

            // database --> table --> columns
            scope.federate.add.options = {};
            scope.widgetCtrl.meta(pixelComponents, callback);
        }

        /**
         * @name addNewJoins
         * @desc add a new join
         * @returns {void}
         */
        function addNewJoin(): void {
            scope.federate.joins.list.push({
                frameColumns: {
                    list: scope.federate.source.frameHeaders,
                    selected: '',
                },
                joinType: 'inner.join',
                mergeColumns: {
                    list: scope.federate.joins.list[0].mergeColumns.list,
                    selected: '',
                },
                id: semossCoreService.utility.random('JOIN'),
                disabled: false,
            });
        }

        /**
         * @name removeJoin
         * @param {string} joinId the id to remove
         * @desc remove the join
         * @returns {void}
         */
        function removeJoin(joinId: string): void {
            let joinIdx: number;

            for (
                joinIdx = 0;
                joinIdx < scope.federate.joins.list.length;
                joinIdx++
            ) {
                if (scope.federate.joins.list[joinIdx].id === joinId) {
                    scope.federate.joins.list.splice(joinIdx, 1);
                    break;
                }
            }
        }

        /**
         * @name resetSelections
         * @desc resets all of the selected columns
         * @returns {void}
         */
        function resetSelections(): void {
            let db: string;
            let table: string;
            let tables: any;
            let joinIdx: number;

            // wipe any selected joins
            for (
                joinIdx = 0;
                joinIdx < scope.federate.joins.list.length;
                joinIdx++
            ) {
                scope.federate.joins.list[joinIdx].mergeColumns.selected = '';
            }

            for (db in scope.federate.add.options) {
                if (scope.federate.add.options.hasOwnProperty(db)) {
                    tables = scope.federate.add.options[db].tables;
                    for (table in tables) {
                        if (tables.hasOwnProperty(table)) {
                            tables[table].selected = [];
                        }
                    }
                }
            }
        }

        /**
         * @name setJoinOptions
         * @desc set the join options to be displayed
         * @returns {void}
         */
        function setJoinOptions(): void {
            // ***need to optimize some of these data structures; causing way too many loops***
            const mergeColumns: any = [];
            let mergeIdx: number;
            let traverseIdx: number;
            let joinIdx: number;
            let table: string;
            let columnIdx: number;
            const tables: any = scope.federate.add.options[
                scope.federate.add.apps.selected.database_id
            ]
                ? scope.federate.add.options[
                      scope.federate.add.apps.selected.database_id
                  ].tables
                : {};
            const tempJoins = semossCoreService.utility.freeze(
                scope.federate.joins.list
            );
            scope.federate.joins.list = [];
            scope.federate.joins.newColumns = [];

            // checks to see if column already exists in the list
            function _columnExists(columns: any, compareColumn: any): boolean {
                let existingCol = false;
                let mergeIdx: number;
                for (mergeIdx = 0; mergeIdx < columns.length; mergeIdx++) {
                    if (columns[mergeIdx].alias === compareColumn) {
                        existingCol = true;
                        break;
                    }
                }

                return existingCol;
            }

            // need to set the equivalent columns to the merge column list
            function _setEquivalentColumns(
                mergeColumns: any,
                tempTableColumn: any
            ): void {
                let traverseIdx: number;
                for (
                    traverseIdx = 0;
                    traverseIdx < scope.federate.source.selected.length;
                    traverseIdx++
                ) {
                    // if (scope.federate.source.selected[traverseIdx].alias === tempTableColumn.equivalentAlias) {
                    if (
                        !_columnExists(
                            mergeColumns,
                            tempTableColumn.equivalentAlias
                        )
                    ) {
                        mergeColumns.push({
                            table: tempTableColumn.equivalentQs.split('__')[0],
                            name:
                                tempTableColumn.equivalentQs.split('__')[1] ||
                                tempTableColumn.equivalentAlias,
                            qs: tempTableColumn.equivalentQs,
                            alias: tempTableColumn.equivalentAlias,
                            database_id: tempTableColumn.database_id,
                            database_name: tempTableColumn.database_name,
                            appImage: tempTableColumn.appImage,
                            filters: [],
                            hide: true,
                        });
                    }
                    // }
                }
            }

            // set the initial join list based on what the user traversed from
            for (
                traverseIdx = 0;
                traverseIdx < scope.federate.source.selected.length;
                traverseIdx++
            ) {
                scope.federate.joins.list.push({
                    frameColumns: {
                        list: scope.federate.source.frameHeaders,
                        selected: scope.federate.source.selected[traverseIdx],
                    },
                    joinType: 'inner.join',
                    mergeColumns: {
                        list: [],
                        selected: tempJoins[traverseIdx]
                            ? tempJoins[traverseIdx].mergeColumns.selected
                            : '',
                    },
                    disabled: scope.federate.joins.list.length === 0,
                    id: semossCoreService.utility.random('JOIN'),
                });
            }

            // set the merge options to be all columns in the database that returned
            for (table in tables) {
                if (tables.hasOwnProperty(table)) {
                    for (
                        columnIdx = 0;
                        columnIdx < tables[table].options.length;
                        columnIdx++
                    ) {
                        _setEquivalentColumns(
                            mergeColumns,
                            tables[table].options[columnIdx]
                        );

                        if (
                            !_columnExists(
                                mergeColumns,
                                tables[table].options[columnIdx].alias
                            )
                        ) {
                            mergeColumns.push(
                                semossCoreService.utility.freeze(
                                    tables[table].options[columnIdx]
                                )
                            );
                        }
                    }

                    // store the new columns to be combined later
                    for (
                        columnIdx = 0;
                        columnIdx < tables[table].selected.length;
                        columnIdx++
                    ) {
                        scope.federate.joins.newColumns.push(
                            semossCoreService.utility.freeze(
                                tables[table].selected[columnIdx]
                            )
                        );
                    }
                }
            }

            // set the options in the join list
            // auto populate the selected merge column
            for (
                joinIdx = 0;
                joinIdx < scope.federate.joins.list.length;
                joinIdx++
            ) {
                scope.federate.joins.list[joinIdx].mergeColumns.list =
                    semossCoreService.utility.freeze(mergeColumns);
                for (mergeIdx = 0; mergeIdx < mergeColumns.length; mergeIdx++) {
                    if (
                        scope.federate.joins.list[
                            joinIdx
                        ].frameColumns.selected.alias.toUpperCase() ===
                            mergeColumns[mergeIdx].alias.toUpperCase() &&
                        !scope.federate.joins.list[joinIdx].mergeColumns
                            .selected
                    ) {
                        scope.federate.joins.list[
                            joinIdx
                        ].mergeColumns.selected = semossCoreService.utility.freeze(
                            mergeColumns[mergeIdx]
                        );
                    }
                }
            }

            setCombinedColumns();
        }

        /**
         * @name setCombinedColumns
         * @desc combine columns from existing and new columns
         * @returns {void}
         */
        function setCombinedColumns(): void {
            let newColIdx: number;
            // setup the combined results
            scope.federate.joins.combinedColumns =
                semossCoreService.utility.freeze(
                    scope.federate.source.frameHeaders
                );
            for (
                newColIdx = 0;
                newColIdx < scope.federate.joins.newColumns.length;
                newColIdx++
            ) {
                // scope.federate.joins.newColumns[newColIdx].displayName = scope.federate.joins.newColumns[newColIdx].alias;
                scope.federate.joins.combinedColumns.push(
                    scope.federate.joins.newColumns[newColIdx]
                );
            }
        }

        /**
         * @name toggleDbExpand
         * @param {boolean} bool expand or collapse
         * @returns {void}
         */
        function toggleDbExpand(bool: boolean): void {
            let dbIdx: number;

            for (
                dbIdx = 0;
                dbIdx < scope.federate.overview.database.length;
                dbIdx++
            ) {
                scope.federate.overview.database[dbIdx].show = bool;
            }
            scope.federate.overview.showAll = bool;
        }

        /**
         * @name setOverview
         * @desc set the overview page
         * @returns {void}
         */
        function setOverview(): void {
            let joinIdx: number;
            const joins: any = [];
            const newColumns: any = [];
            let newColIdx: number;
            let tempColIdx: number;

            scope.federate.overview.frameHeaders =
                scope.federate.source.frameHeaders;

            for (
                joinIdx = 0;
                joinIdx < scope.federate.joins.list.length;
                joinIdx++
            ) {
                // only push into overview if both have selections
                if (
                    scope.federate.joins.list[joinIdx].frameColumns.selected &&
                    scope.federate.joins.list[joinIdx].frameColumns.selected
                        .displayName &&
                    scope.federate.joins.list[joinIdx].mergeColumns.selected &&
                    scope.federate.joins.list[joinIdx].mergeColumns.selected
                        .alias
                ) {
                    joins.push({
                        frameColumn:
                            scope.federate.joins.list[joinIdx].frameColumns
                                .selected.displayName,
                        joinType: scope.federate.joins.list[joinIdx].joinType,
                        mergeColumn:
                            scope.federate.joins.list[joinIdx].mergeColumns
                                .selected.alias,
                    });
                }
            }

            // add in the equivalent columns because we need them in the selector when building pixel
            for (
                newColIdx = 0;
                newColIdx < scope.federate.joins.newColumns.length;
                newColIdx++
            ) {
                if (newColumns.length === 0) {
                    // if its free traversal, we need to use the selected join as the column to bring it because we dont have a valid equivalentQs
                    if (scope.federate.add.isFreeTraversal) {
                        newColumns.push(
                            scope.federate.joins.list[0].mergeColumns.selected
                        );
                    } else {
                        newColumns.push({
                            table: scope.federate.joins.newColumns[
                                newColIdx
                            ].equivalentQs.split('__')[0],
                            name:
                                scope.federate.joins.newColumns[
                                    newColIdx
                                ].equivalentQs.split('__')[1] ||
                                scope.federate.joins.newColumns[newColIdx]
                                    .equivalentAlias,
                            qs: scope.federate.joins.newColumns[newColIdx]
                                .equivalentQs,
                            alias: scope.federate.joins.newColumns[newColIdx]
                                .equivalentAlias,
                            database_id:
                                scope.federate.joins.newColumns[newColIdx]
                                    .database_id,
                            database_name:
                                scope.federate.joins.newColumns[newColIdx]
                                    .database_name,
                            appImage:
                                scope.federate.joins.newColumns[newColIdx]
                                    .appImage,
                            filters: [],
                            hide: true,
                        });
                    }
                } else {
                    let foundColumn = false;
                    for (
                        tempColIdx = 0;
                        tempColIdx < newColumns.length;
                        tempColIdx++
                    ) {
                        // if no equivalentAlias then we do not add it as a newcolumn
                        if (
                            !scope.federate.joins.newColumns[newColIdx]
                                .equivalentAlias ||
                            scope.federate.joins.newColumns[newColIdx]
                                .equivalentAlias ===
                                newColumns[tempColIdx].alias
                        ) {
                            foundColumn = true;
                            break;
                        }
                    }

                    if (!foundColumn) {
                        newColumns.push({
                            table: scope.federate.joins.newColumns[
                                newColIdx
                            ].equivalentQs.split('__')[0],
                            name:
                                scope.federate.joins.newColumns[
                                    newColIdx
                                ].equivalentQs.split('__')[1] ||
                                scope.federate.joins.newColumns[newColIdx]
                                    .equivalentAlias,
                            qs: scope.federate.joins.newColumns[newColIdx]
                                .equivalentQs,
                            alias: scope.federate.joins.newColumns[newColIdx]
                                .equivalentAlias,
                            database_id:
                                scope.federate.joins.newColumns[newColIdx]
                                    .database_id,
                            database_name:
                                scope.federate.joins.newColumns[newColIdx]
                                    .database_name,
                            appImage:
                                scope.federate.joins.newColumns[newColIdx]
                                    .appImage,
                            filters: [],
                            hide: true,
                        });
                    }
                }

                newColumns.push(
                    semossCoreService.utility.freeze(
                        scope.federate.joins.newColumns[newColIdx]
                    )
                );
            }

            scope.federate.overview.database.push({
                database_name:
                    scope.federate.joins.list[0].mergeColumns.list[0]
                        .database_name,
                appImage:
                    scope.federate.joins.list[0].mergeColumns.list[0].appImage,
                database_id:
                    scope.federate.joins.list[0].mergeColumns.list[0]
                        .database_id,
                list: newColumns,
                show: true,
                joins: joins,
            });
        }

        /**
         * @name showFilter
         * @param {*} column the column to filter
         * @desc show the filter options
         */
        function showFilter(column: any): void {
            scope.federate.overview.showFilter = true;
            // get the instace values for the selected column

            // bind filter values to the model so no need to have another function to confirm the added filters
        }

        /**
         * @name removeColumn
         * @param {array} list the list to remove from
         * @param {number} column the column to remove
         * @param {number} database the database to remove if list of selected columns becomes 0
         * @desc remove specified index in the list of columns, if list becomes empty, we will remove the database as well
         * @returns {void}
         */
        function removeColumn(list: any, column: any, database: any): void {
            let colIdx: number;
            let dbIdx: number;

            for (colIdx = 0; colIdx < list.length; colIdx++) {
                if (list[colIdx].alias === column.alias) {
                    list.splice(colIdx, 1);
                    break;
                }
            }

            // one left is the just the hidden column (equivalent column that is traversed from and used for merge)
            if (list.length === 1) {
                // remove the database
                for (
                    dbIdx = 0;
                    dbIdx < scope.federate.overview.database.length;
                    dbIdx++
                ) {
                    if (
                        scope.federate.overview.database[dbIdx].database_id ===
                        database.database_id
                    ) {
                        scope.federate.overview.database.splice(dbIdx, 1);
                        break;
                    }
                }
            }
        }

        /**
         * @name navigate
         * @param {string} step step to navigate to
         * @desc navigate the different steps
         * @returns {void}
         */
        function navigate(step: string, direction: string): void {
            scope.federate.step = step;
            if (direction === 'forward') {
                if (scope.federate.step === 'source') {
                    // wipe source's model to start fresh
                    scope.federate.source.selected = [];
                    // } else if (scope.federate.step === 'add') {
                    //     // wipe add's model to start fresh
                    //     getTraversalOptions();
                } else if (scope.federate.step === 'join') {
                    // wipe add's model to start fresh
                    getTraversalOptions();
                } else if (scope.federate.step === 'overview') {
                    // reset all of the previous steps data selections
                    setOverview();
                }
            }
        }

        /**
         * @name hasSelections
         * @desc checks to see if the add step has selections
         * @returns {boolean} true/false
         */
        function hasSelections(): boolean {
            let table: string;
            let returnValue = false;
            const tables: any = scope.federate.add.options[
                scope.federate.add.apps.selected.database_id
            ]
                ? scope.federate.add.options[
                      scope.federate.add.apps.selected.database_id
                  ].tables
                : {};
            for (table in tables) {
                if (tables.hasOwnProperty(table)) {
                    if (
                        tables[table].selected &&
                        tables[table].selected.length > 0
                    ) {
                        returnValue = true;
                        break;
                    }
                }
            }

            return returnValue;
        }

        /**
         * @name isJoinDisabled
         * @desc checks the join options and make sure required fields are all filled in
         */
        function isJoinDisabled(): boolean {
            let isDisabled = false;
            let joinIdx: number;

            for (
                joinIdx = 0;
                joinIdx < scope.federate.joins.list.length;
                joinIdx++
            ) {
                if (
                    semossCoreService.utility.isEmpty(
                        scope.federate.joins.list[joinIdx].frameColumns.selected
                    ) ||
                    semossCoreService.utility.isEmpty(
                        scope.federate.joins.list[joinIdx].mergeColumns.selected
                    )
                ) {
                    isDisabled = true;
                    break;
                }
            }

            if (scope.federate.joins.newColumns.length === 0) {
                isDisabled = true;
            }

            return isDisabled;
        }

        /**
         * @name addData
         * @desc add data to join
         * @returns {void}
         */
        function addData(): void {
            navigate('overview', 'forward');
        }

        /**
         * @name addMore
         * @desc add more joins
         * @returns {void}
         */
        function addMore(): void {
            navigate('source', 'forward');
        }

        /**
         * @name getFrameComponents
         * @desc loop through the overview and construct the component to do the merge and return it
         * @returns {*} the array of components needed to generate the pixel to do the merge
         */
        function getFrameComponents(columns: any, isMeta: boolean): any {
            // first we will create a new frame to host the new data
            const newFrameName: string = scope.pipelineCtrl.createFrameName(
                columns.database_name
            ); // semossCoreService.utility.random('FRAME');
            let columnIdx: number;
            const pixelComponents: any = [];
            const selectors: any = [];
            const filters: any = [];
            const joins: any = [];
            let appId = '';

            for (columnIdx = 0; columnIdx < columns.list.length; columnIdx++) {
                if (!appId) {
                    appId = columns.list[columnIdx].database_id;
                }
                selectors.push({
                    selector: columns.list[columnIdx].qs,
                    alias: columns.list[columnIdx].alias,
                });

                if (
                    columns.list[columnIdx].type === 'downstream' ||
                    columns.list[columnIdx].type === 'upstream'
                ) {
                    joins.push({
                        fromColumn: columns.list[columnIdx].fromJoinQs,
                        joinType: 'inner.join',
                        toColumn: columns.list[columnIdx].toJoinQs,
                    });
                }
            }

            // create the new frame
            pixelComponents.push({
                type: 'createSource',
                components: [
                    'Frame',
                    scope.federate.frameInfo.type || 'GRID',
                    newFrameName,
                ],
                terminal: true,
                meta: isMeta,
            });

            // set the database
            pixelComponents.push({
                type: 'database',
                components: [appId],
                meta: isMeta,
            });

            // set the selectors
            pixelComponents.push({
                type: 'select2',
                components: [selectors],
            });

            // set the filters
            // pixelComponents.push();

            // set the joins
            if (joins.length > 0) {
                pixelComponents.push({
                    type: 'join',
                    components: [joins],
                });
            }

            // set the import
            pixelComponents.push({
                type: 'import',
                components: [newFrameName],
                terminal: true,
            });

            return pixelComponents;
        }

        /**
         * @name getMergeComponents
         * @desc run the frames and join them
         * @returns {*} a list of components for merging
         */
        function getMergeComponents(
            frame: any,
            joins: any,
            previousFrame: string,
            isMeta: boolean
        ): any {
            // create new frame to merge into
            const pixelComponents: any = [];
            let joinIdx: number;

            for (joinIdx = 0; joinIdx < joins.length; joinIdx++) {
                pixelComponents.push(
                    {
                        type: 'frame',
                        components: [previousFrame],
                        meta: isMeta,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                    },
                    {
                        type: 'merge',
                        components: [
                            [
                                {
                                    fromColumn: joins[joinIdx].mergeColumn,
                                    joinType: joins[joinIdx].joinType,
                                    toColumn: joins[joinIdx].frameColumn,
                                },
                            ],
                            frame[0].components[2],
                        ],
                        terminal: true,
                    }
                );

                // if (previousFrame) {
                //     // remove the unused frame
                //     pixelComponents.push({
                //         type: 'removeFrame',
                //         components: [previousFrame],
                //         terminal: true,
                //         meta: isMeta
                //     });
                // }
            }

            return pixelComponents;
        }

        /**
         * @name preview Data
         * @desc preview the the merge and send to the preview directive.
         * @returns {void}
         */
        function previewData(): void {
            const frames: any = [];
            const merges: any = [];
            let finalComponents: any = [];
            let databaseIdx: number;
            let frameIdx: number;
            let mergeIdx: number;
            let callback: Function;
            let previousFrame = '';

            callback = function () {
                // lets load the preview
                scope.widgetCtrl.emit('load-preview', {
                    pixelComponents: [
                        {
                            type: 'frame',
                            components: [
                                frames[frames.length - 1][0].components[2],
                            ],
                            meta: true,
                        },
                        {
                            type: 'queryAll',
                            components: [],
                        },
                        {
                            type: 'collect',
                            components: [scope.pipelineCtrl.previewLimit],
                            terminal: true,
                        },
                    ],
                    totalCountPixelComponents: [
                        {
                            type: 'frame',
                            components: [
                                frames[frames.length - 1][0].components[2],
                            ],
                            meta: true,
                        },
                        {
                            type: 'select2',
                            components: [
                                [
                                    {
                                        alias: 'TotalCount',
                                        math: 'Count',
                                        calculatedBy:
                                            scope.federate.joins.newColumns[0]
                                                .alias,
                                    },
                                ],
                            ],
                        },
                        {
                            type: 'collect',
                            components: [-1],
                            terminal: true,
                        },
                    ],
                });
                // ****TODO ONCE WE SHOW THE PREVIEW WE NEED TO REMOVE THE LAST FRAME THAT WAS CREATED****
            };

            for (
                databaseIdx = 0;
                databaseIdx < scope.federate.overview.database.length;
                databaseIdx++
            ) {
                // our first frame is the source component so we dont want to remove it. other frames we will remove as we create them and merge
                if (databaseIdx > 0) {
                    previousFrame = frames[frames.length - 1][0].components[2];
                }

                frames.push(
                    getFrameComponents(
                        scope.federate.overview.database[databaseIdx],
                        true
                    )
                );
                merges.push(
                    getMergeComponents(
                        frames[frames.length - 1],
                        scope.federate.overview.database[databaseIdx].joins,
                        previousFrame,
                        true
                    )
                );
            }

            // TODO fix how this works...too confusing
            // need to merge from the source frame to the first frame.
            // kicking off the first merge, which needs to be from scope.federate.frame to the first frame
            merges[0] = [
                {
                    type: 'frame',
                    components: [scope.federate.frameInfo.frame || ''],
                    meta: true,
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'merge',
                    components: [
                        merges[0][2].components[0], // using the same merges
                        frames[0][0].components[2], // this is the name of the frame
                    ],
                    terminal: true,
                },
            ];

            for (frameIdx = 0; frameIdx < frames.length; frameIdx++) {
                finalComponents = finalComponents.concat(frames[frameIdx]);
            }

            for (mergeIdx = 0; mergeIdx < merges.length; mergeIdx++) {
                finalComponents = finalComponents.concat(merges[mergeIdx]);
            }

            scope.widgetCtrl.execute(finalComponents, callback);

            scope.federate.frameInfo.importHeight = 70;
            scope.federate.frameInfo.previewHeight = 30;
        }

        /**
         * @name importData
         * @param {boolean} visualize visualize after import
         * @desc loop through overview and mimic the different steps of adding the components and merging.
         * @returns {void}
         */
        function importData(visualize: boolean): void {
            const frames: any = [];
            const merges: any = [];
            let previousFrame = '';
            let finalComponents: any = [];

            const callback = function () {
                if (!visualize) {
                    scope.pipelineCtrl.federate.open = false;
                } else {
                    scope.widgetCtrl.execute(
                        [
                            {
                                type: 'panel',
                                components: [scope.widgetCtrl.panelId],
                            },
                            {
                                type: 'setPanelView',
                                components: ['visualization'],
                                terminal: true,
                            },
                            {
                                type: 'frame',
                                components: [
                                    merges[merges.length - 1][2].components[1], // this is the frame being merged into so we will query this
                                ],
                            },
                            {
                                type: 'queryAll',
                                components: [],
                            },
                            {
                                type: 'autoTaskOptions',
                                components: [scope.widgetCtrl.panelId, 'Grid'],
                            },
                            {
                                type: 'collect',
                                components: [
                                    scope.widgetCtrl.getOptions('limit'),
                                ],
                                terminal: true,
                            },
                        ],
                        () => scope.widgetCtrl.open('widget-tab', 'view')
                    );
                }
            };

            for (
                let databaseIdx = 0;
                databaseIdx < scope.federate.overview.database.length;
                databaseIdx++
            ) {
                // our first frame is the source component so we dont want to remove it. other frames we will remove as we create them and merge
                if (databaseIdx > 0) {
                    previousFrame = frames[frames.length - 1][0].components[2];
                }

                frames.push(
                    getFrameComponents(
                        scope.federate.overview.database[databaseIdx],
                        false
                    )
                );
                merges.push(
                    getMergeComponents(
                        frames[frames.length - 1],
                        scope.federate.overview.database[databaseIdx].joins,
                        previousFrame,
                        false
                    )
                );
            }

            // TODO fix how this works...too confusing
            // need to merge from the source frame to the first frame.
            // kicking off the first merge, which needs to be from scope.federate.frame to the first frame
            merges[0] = [
                {
                    type: 'frame',
                    components: [scope.federate.frameInfo.frame || ''],
                },
                {
                    type: 'queryAll',
                    components: [],
                },
                {
                    type: 'merge',
                    components: [
                        merges[0][2].components[0], // using the same merges
                        frames[0][0].components[2], // this is the name of the frame
                    ],
                    terminal: true,
                },
            ];

            for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
                finalComponents = finalComponents.concat(frames[frameIdx]);
            }

            for (let mergeIdx = 0; mergeIdx < merges.length; mergeIdx++) {
                finalComponents = finalComponents.concat(merges[mergeIdx]);
            }

            scope.widgetCtrl.execute(finalComponents, callback);
        }

        /**
         * @name visualize
         * @desc import the merge and then visualize
         * @returns {void}
         */
        function visualize(): void {
            importData(true);
        }

        /**
         * @name cancel
         * @desc exit out of the view
         * @returns {void}
         */
        function cancel(): void {
            scope.pipelineCtrl.federate.open = false;
        }

        /**
         * @name initialize
         * @desc run on initialization
         * @returns {void}
         */
        function initialize(): void {
            getFrameHeaders();
        }

        initialize();
    }
}
