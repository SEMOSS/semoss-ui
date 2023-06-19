'use strict';

import angular from 'angular';

import './xray-match.scss';

export default angular
    .module('app.xray-match.directive', [])
    .directive('xrayMatch', xrayMatch);

xrayMatch.$inject = ['$filter', 'semossCoreService'];

function xrayMatch(
    $filter: ng.IFilterService,
    semossCoreService: SemossCoreService
) {
    xrayMatchLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    xrayMatchCtrl.$inject = [];

    return {
        restrict: 'E',
        template: require('./xray-match.directive.html'),
        scope: {},
        require: ['^widget'],
        bindToController: {},
        controllerAs: 'xrayMatch',
        controller: xrayMatchCtrl,
        link: xrayMatchLink,
    };

    function xrayMatchCtrl() {}

    function xrayMatchLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.xrayMatch.app = '';
        scope.xrayMatch.available = {
            search: '',
            toggle: false,
            options: [],
            searched: [],
            filtered: [],
        };

        scope.xrayMatch.selected = {
            options: [],
        };
        scope.xrayMatch.sameDb = false;
        scope.xrayMatch.rowComparison = false;
        scope.xrayMatch.similarity = 1;
        scope.xrayMatch.candidate = 1;

        scope.xrayMatch.getAvailable = getAvailable;
        scope.xrayMatch.searchAvailable = searchAvailable;
        scope.xrayMatch.toggleAvailable = toggleAvailable;
        scope.xrayMatch.checkAvailableToggle = checkAvailableToggle;
        scope.xrayMatch.addSelectedApp = addSelectedApp;
        scope.xrayMatch.addSelectedTable = addSelectedTable;
        scope.xrayMatch.addSelectedColumn = addSelectedColumn;
        scope.xrayMatch.resetSelected = resetSelected;
        scope.xrayMatch.removeSelectedTable = removeSelectedTable;
        scope.xrayMatch.removeSelectedColumn = removeSelectedColumn;
        scope.xrayMatch.executeMatch = executeMatch;

        /**
         * @name resetPanel
         * @desc updates the initial panel options
         */
        function resetPanel(): void {
            // set the data based on the app
            setApp();
        }

        /** App */
        /**
         * @name setApp
         * @desc update the information
         */
        function setApp(): void {
            const selected = semossCoreService.app.get('selectedApp');

            if (selected && selected !== 'NEWSEMOSSAPP') {
                const app = semossCoreService.app.getApp(selected);
                if (app) {
                    scope.xrayMatch.app = {
                        display: app.name,
                        image: app.image,
                        value: app.app_id,
                    };
                }
            }

            if (scope.xrayMatch.app) {
                getAvailable();
            }
        }

        /** Available */
        /**
         * @name getAvailable
         * @desc update the information based on the selected APP
         */
        function getAvailable(): void {
            let callback;

            // clear out
            scope.xrayMatch.available.options = [];

            if (!scope.xrayMatch.app) {
                return;
            }

            // register message to come back to
            callback = function (response) {
                const output = response.pixelReturn[0].output,
                    mapping = {};

                for (
                    let outputIdx = 0, outputLen = output.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    // 0 index = table
                    // 1 index = column
                    // 2 index = data type
                    // 3 index = isTable?

                    let table, column, columnQs, columnAlias, columnPk;

                    table = output[outputIdx][0];
                    column = output[outputIdx][1];

                    if (!mapping.hasOwnProperty(table)) {
                        // track the index
                        mapping[table] =
                            scope.xrayMatch.available.options.length;

                        // add the table
                        scope.xrayMatch.available.options.push({
                            app: scope.xrayMatch.app,
                            alias: String(table).replace(/_/g, ' '),
                            table: table,
                            open: true,
                            columns: [],
                        });
                    }

                    if (output[outputIdx][3]) {
                        columnQs = column;
                        columnAlias = String(column).replace(/_/g, ' ');
                        columnPk = true;
                    } else {
                        columnQs = `${table}__${column}`;
                        columnAlias = String(column).replace(/_/g, ' ');
                        columnPk = false;
                    }

                    // add the column
                    scope.xrayMatch.available.options[
                        mapping[table]
                    ].columns.push({
                        app: scope.xrayMatch.app,
                        alias: columnAlias,
                        table: table,
                        column: column,
                        concept: columnQs,
                        isPrimKey: columnPk,
                        type: output[outputIdx][2],
                    });
                }

                // sort
                semossCoreService.utility.sort(
                    scope.xrayMatch.available.options,
                    'alias'
                );

                // search
                searchAvailable();
            };

            scope.widgetCtrl.query(
                [
                    {
                        type: 'getDatabaseTableStructure',
                        components: [scope.xrayMatch.app.value],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name searchAvailable
         * @desc search the available tables and columns
         */
        function searchAvailable(): void {
            let cleanedSearch: string;

            if (!scope.xrayMatch.available.search) {
                scope.xrayMatch.available.searched =
                    semossCoreService.utility.freeze(
                        scope.xrayMatch.available.options
                    );

                filterAvailable();
                return;
            }

            // if it is searched, we only check the column
            cleanedSearch = String(scope.xrayMatch.available.search).replace(
                /_/g,
                ' '
            ); // name is already w/o spaces

            // clear it out
            scope.xrayMatch.available.searched = [];
            for (
                let tableIdx = 0,
                    tableLen = scope.xrayMatch.available.options.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                const table = semossCoreService.utility.freeze(
                    scope.xrayMatch.available.options[tableIdx]
                );
                table.columns = $filter('filter')(
                    semossCoreService.utility.freeze(table.columns),
                    {
                        alias: cleanedSearch,
                    }
                );

                if (table.columns.length > 0) {
                    scope.xrayMatch.available.searched.push(table);
                }
            }

            filterAvailable();
        }

        /**
         * @name filterAvailable
         * @desc filter selected tables from available
         */
        function filterAvailable(): void {
            let addedAppIdx = -1;

            // copy
            scope.xrayMatch.available.filtered =
                semossCoreService.utility.freeze(
                    scope.xrayMatch.available.searched
                );

            // if it is already added, we need to remove columns from it
            for (
                let appIdx = 0,
                    appLen = scope.xrayMatch.selected.options.length;
                appIdx < appLen;
                appIdx++
            ) {
                if (
                    scope.xrayMatch.selected.options[appIdx].app ===
                    scope.xrayMatch.app.value
                ) {
                    addedAppIdx = appIdx;
                    break;
                }
            }

            // not added
            if (addedAppIdx === -1) {
                return;
            }

            for (
                let tableIdx = 0,
                    tableLen =
                        scope.xrayMatch.selected.options[addedAppIdx].tables
                            .length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                // look through the tables;
                for (
                    let availableTableIdx =
                        scope.xrayMatch.available.filtered.length - 1;
                    availableTableIdx >= 0;
                    availableTableIdx--
                ) {
                    // tables match, now remove duplicated columns
                    if (
                        scope.xrayMatch.available.filtered[availableTableIdx]
                            .table ===
                        scope.xrayMatch.selected.options[addedAppIdx].tables[
                            tableIdx
                        ].table
                    ) {
                        for (
                            let columnIdx = 0,
                                columnLen =
                                    scope.xrayMatch.selected.options[
                                        addedAppIdx
                                    ].tables[tableIdx].columns.length;
                            columnIdx < columnLen;
                            columnIdx++
                        ) {
                            for (
                                let availableColumnIdx =
                                    scope.xrayMatch.available.filtered[
                                        availableTableIdx
                                    ].columns.length - 1;
                                availableColumnIdx >= 0;
                                availableColumnIdx--
                            ) {
                                // columns match, remove it
                                if (
                                    scope.xrayMatch.available.filtered[
                                        availableTableIdx
                                    ].columns[availableColumnIdx].column ===
                                    scope.xrayMatch.selected.options[
                                        addedAppIdx
                                    ].tables[tableIdx].columns[columnIdx].column
                                ) {
                                    scope.xrayMatch.available.filtered[
                                        availableTableIdx
                                    ].columns.splice(availableColumnIdx, 1);
                                }
                            }
                        }

                        // no more columns remove the table
                        if (
                            scope.xrayMatch.available.filtered[
                                availableTableIdx
                            ].columns.length === 0
                        ) {
                            scope.xrayMatch.available.filtered.splice(
                                availableTableIdx,
                                1
                            );
                        }
                    }
                }
            }
        }

        /**
         * @name toggleAvailable
         * @desc toggle the available tables to be open/close
         */
        function toggleAvailable(): void {
            scope.xrayMatch.available.toggle =
                !scope.xrayMatch.available.toggle;

            for (
                let tableIdx = 0,
                    tableLen = scope.xrayMatch.available.filtered.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                scope.xrayMatch.available.filtered[tableIdx].open =
                    scope.xrayMatch.available.toggle;
            }
        }

        /**
         * @name checkAvailableToggle
         * @desc check to see if any of the available tables are expanded and set the toggle accordingly
         */
        function checkAvailableToggle(): void {
            for (
                let tableIdx = 0,
                    tableLen = scope.xrayMatch.available.filtered.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (scope.xrayMatch.available.filtered[tableIdx].open) {
                    scope.xrayMatch.available.toggle = true;
                    return;
                }
            }

            scope.xrayMatch.available.toggle = false;
        }

        /** Selected */
        /**
         * @name addSelectedApp
         * @desc add all the whole available app
         */
        function addSelectedApp(): void {
            for (
                let tableIdx = 0,
                    tableLen = scope.xrayMatch.available.filtered.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                addSelectedTable(
                    scope.xrayMatch.available.filtered[tableIdx],
                    false
                );
            }

            filterAvailable();
        }

        /**
         * @name addSelectedTable
         * @desc add all the whole available table
         * @param tableObj - table that you are adding from
         * @param update - update the available list to remove what is added
         */
        function addSelectedTable(tableObj: any, update: boolean): void {
            for (
                let columnIdx = 0, columnLen = tableObj.columns.length;
                columnIdx < columnLen;
                columnIdx++
            ) {
                addSelectedColumn(tableObj, tableObj.columns[columnIdx], false);
            }

            if (update) {
                filterAvailable();
            }
        }

        /**
         * @name addSelectedColumn
         * @desc add the column to the selected
         * @param tableObj - table that you are adding from
         * @param columnObj - column that you want to add
         * @param update - update the available list to remove what is added
         */
        function addSelectedColumn(
            tableObj: any,
            columnObj: any,
            update: boolean
        ): void {
            let addedAppIdx = -1,
                addedTableIdx = -1;

            // if it is already added, we add it to the same group
            for (
                let appIdx = 0,
                    appLen = scope.xrayMatch.selected.options.length;
                appIdx < appLen;
                appIdx++
            ) {
                if (
                    scope.xrayMatch.selected.options[appIdx].app ===
                    columnObj.app.value
                ) {
                    addedAppIdx = appIdx;
                    break;
                }
            }

            // add a new one
            if (addedAppIdx === -1) {
                addedAppIdx = scope.xrayMatch.selected.options.length;

                scope.xrayMatch.selected.options.push({
                    alias: columnObj.app.display,
                    image: columnObj.app.image,
                    app: columnObj.app.value,
                    tables: [],
                });
            }

            // if it is already added, we add it to the same group
            for (
                let tableIdx = 0,
                    tableLen =
                        scope.xrayMatch.selected.options[addedAppIdx].tables
                            .length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.xrayMatch.selected.options[addedAppIdx].tables[
                        tableIdx
                    ].table === columnObj.table
                ) {
                    addedTableIdx = tableIdx;
                    break;
                }
            }

            // add a new one
            if (addedTableIdx === -1) {
                addedTableIdx =
                    scope.xrayMatch.selected.options[addedAppIdx].tables.length;

                scope.xrayMatch.selected.options[addedAppIdx].tables.push({
                    alias: tableObj.alias,
                    table: tableObj.table,
                    open: true,
                    columns: [],
                });
            }

            // add the column
            scope.xrayMatch.selected.options[addedAppIdx].tables[
                addedTableIdx
            ].columns.push(semossCoreService.utility.freeze(columnObj));

            if (update) {
                filterAvailable();
            }
        }

        /**
         * @name resetSelected
         * @desc reset selected
         * @param columnObj - column that you want to add
         */
        function resetSelected(): void {
            scope.xrayMatch.selected.options = [];

            // update
            filterAvailable();
        }

        /**
         * @name removeSelectedTable
         * @desc add the column to the selected
         * @param tableObj - table that you want to remove
         */
        function removeSelectedTable(tableObj: any): void {
            // gotta go backwards (reference)
            for (
                let columnIdx = tableObj.columns.length - 1;
                columnIdx >= 0;
                columnIdx--
            ) {
                removeSelectedColumn(tableObj.columns[columnIdx], false);
            }

            // update
            filterAvailable();
        }

        /**
         * @name removeSelectedColumn
         * @desc remove the column from the selected
         * @param columnObj - column that you want to remove
         * @param update - update the available list to remove what is added
         */
        function removeSelectedColumn(columnObj: any, update: boolean): void {
            let addedAppIdx = -1,
                addedTableIdx = -1;

            // if it is already added, we add it to the same group
            for (
                let appIdx = 0,
                    appLen = scope.xrayMatch.selected.options.length;
                appIdx < appLen;
                appIdx++
            ) {
                if (
                    scope.xrayMatch.selected.options[appIdx].app ===
                    columnObj.app.value
                ) {
                    addedAppIdx = appIdx;
                    break;
                }
            }

            // not there
            if (addedAppIdx === -1) {
                return;
            }

            // if it is already added, we add it to the same group
            for (
                let tableIdx = 0,
                    tableLen =
                        scope.xrayMatch.selected.options[addedAppIdx].tables
                            .length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (
                    scope.xrayMatch.selected.options[addedAppIdx].tables[
                        tableIdx
                    ].table === columnObj.table
                ) {
                    addedTableIdx = tableIdx;
                    break;
                }
            }

            // not there
            if (addedTableIdx === -1) {
                return;
            }

            // remove the column
            for (
                let columnIdx =
                    scope.xrayMatch.selected.options[addedAppIdx].tables[
                        addedTableIdx
                    ].columns.length - 1;
                columnIdx >= 0;
                columnIdx--
            ) {
                if (
                    scope.xrayMatch.selected.options[addedAppIdx].tables[
                        addedTableIdx
                    ].columns[columnIdx].column === columnObj.column
                ) {
                    scope.xrayMatch.selected.options[addedAppIdx].tables[
                        addedTableIdx
                    ].columns.splice(columnIdx, 1);
                    break;
                }
            }

            // if no more columns, remove the table
            if (
                scope.xrayMatch.selected.options[addedAppIdx].tables[
                    addedTableIdx
                ].columns.length === 0
            ) {
                scope.xrayMatch.selected.options[addedAppIdx].tables.splice(
                    addedTableIdx,
                    1
                );
            }

            // if no more tables, remove the app
            if (
                scope.xrayMatch.selected.options[addedAppIdx].tables.length ===
                0
            ) {
                scope.xrayMatch.selected.options.splice(addedTableIdx, 1);
            }

            if (update) {
                filterAvailable();
            }
        }

        /** Matches */
        /**
         * @name executeMatch
         * @desc runs the query using all the defined values
         */
        function executeMatch(): void {
            let config = {},
                similarity = 10,
                candidate = 10;

            similarity = scope.xrayMatch.similarity / 100;
            if (similarity < 0 || 1 < similarity) {
                scope.widgetCtrl.alert(
                    'error',
                    'Similarity must be between 0 and 100'
                );
                return;
            }

            candidate = scope.xrayMatch.candidate / 100;
            if (candidate < 0 || 1 < candidate) {
                scope.widgetCtrl.alert(
                    'error',
                    'Candidate must be between 0 and 100'
                );
                return;
            }

            for (
                let appIdx = 0,
                    appLen = scope.xrayMatch.selected.options.length;
                appIdx < appLen;
                appIdx++
            ) {
                config[scope.xrayMatch.selected.options[appIdx].app] = [];

                for (
                    let tableIdx = 0,
                        tableLen =
                            scope.xrayMatch.selected.options[appIdx].tables
                                .length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    for (
                        let columnIdx = 0,
                            columnLen =
                                scope.xrayMatch.selected.options[appIdx].tables[
                                    tableIdx
                                ].columns.length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        config[
                            scope.xrayMatch.selected.options[appIdx].app
                        ].push(
                            scope.xrayMatch.selected.options[appIdx].tables[
                                tableIdx
                            ].columns[columnIdx].concept
                        );
                    }
                }
            }

            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        `XRAY_FRAME = (GenerateXRayMatching(filePath=[${
                            scope.xrayMatch.file && scope.xrayMatch.file.path
                                ? `"${scope.xrayMatch.file.path}"`
                                : ''
                        }], space=[${
                            scope.xrayMatch.file && scope.xrayMatch.file.space
                                ? `"${scope.xrayMatch.file.space}"`
                                : ''
                        }], database=${JSON.stringify(
                            Object.keys(config)
                        )}, matchSameDb=[${
                            scope.xrayMatch.sameDb
                        }], rowComparison=[${
                            scope.xrayMatch.rowComparison
                        }], similarity=[${similarity}], candidate=[${candidate}], config=[${JSON.stringify(
                            config
                        )}]))`,
                    ],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        `AddPanelIfAbsent(0); Panel ( 0 ) | SetPanelView ( "visualization" ) ; Frame ( frame = [ XRAY_FRAME ] ) | Select ( Score , Source_Database_Id , Source_Table , Source_Property , Target_Database_Id , Target_Table , Target_Property , Match_Count , Source_Instances , Target_Instances ) .as ( [ Score , Source_Database_Id , Source_Table , Source_Property , Target_Database_Id , Target_Table , Target_Property , Match_Count , Source_Instances , Target_Instances ] ) | Sort(columns=[Score], sort=[desc]) | Format ( type = [ 'table' ] ) | TaskOptions ( { "0" : { "layout" : "Grid" , "alignment" : { "label" : [ "Score" , "Source_Database_Id" , "Source_Table" , "Source_Property" , "Target_Database_Id" , "Target_Table" , "Target_Property" , "Match_Count" , "Source_Instances" , "Target_Instances" ] } } } ) | Collect ( 2000 ) ;`,
                    ],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        `AddPanelIfAbsent(1); Panel ( 1 ) | SetPanelView ( "visualization" ) ; Frame ( frame = [ XRAY_FRAME ] ) | Select ( Score , Source_Database_Id , Source_Table , Source_Property , Target_Property , Target_Table , Target_Database_Id ) .as ( [ Score , Source_Database_Id , Source_Table , Source_Property , Target_Property , Target_Table , Target_Database_Id ] ) | Format ( type = [ 'table' ] ) | TaskOptions ( { "1" : { "layout" : "ParallelCoordinates" , "alignment" : { "dimension" : [ "Score" , "Source_Database_Id" , "Source_Table" , "Source_Property" , "Target_Property" , "Target_Table" , "Target_Database_Id" ] , "series" : [ ] , "facet" : [ ] } } } ) | Collect ( 2000 ) ;`,
                    ],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        `AddPanelIfAbsent(2); Panel ( 2 ) | SetPanelView ( "visualization" ) ;  Frame ( frame = [ XRAY_FRAME ] ) | Select ( Source_GUID , Target_GUID , Score ) .as ( [ Source_GUID , Target_GUID , Score ] ) | Format ( type = [ 'table' ] ) | TaskOptions ( { "2" : { "layout" : "HeatMap" , "alignment" : { "x" : [ "Source_GUID" ] , "y" : [ "Target_GUID" ] , "heat" : [ "Score" ] , "facet" : [ ] , "tooltip" : [ ] } } } ) | Collect ( 2000 ) ;`,
                    ],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        `Panel ( 0 ) | SetPanelPosition ( { "top" : 50 , "left" : 0 , "width" : 100 , "height" : 50 } ) ;Panel ( 1 ) | SetPanelPosition ( { "top" : 0 , "left" : 0 , "width" : 50 , "height" : 50 } ) ;Panel ( 2 ) | SetPanelPosition ( { "top" : 0 , "left" : 50 , "width" : 50 , "height" : 50 } ) ; `,
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize() {
            let updateFrameListener;

            // register listeners
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                function () {
                    resetPanel();
                }
            );

            scope.$on('$destroy', function () {
                updateFrameListener();
            });

            resetPanel();
        }

        initialize();
    }
}
