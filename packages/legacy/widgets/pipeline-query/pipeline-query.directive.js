'use strict';

import { PREVIEW_LIMIT } from '@/core/constants.js';
import './pipeline-query.scss';

export default angular
    .module('app.pipeline.pipeline-query', [])
    .directive('pipelineQuery', pipelineQueryDirective);

pipelineQueryDirective.$inject = [
    '$filter',
    '$timeout',
    'ENDPOINT',
    'semossCoreService',
];

function pipelineQueryDirective(
    $filter,
    $timeout,
    ENDPOINT,
    semossCoreService
) {
    pipelineQueryCtrl.$inject = [];
    pipelineQueryLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-query.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineQueryCtrl,
        controllerAs: 'pipelineQuery',
        bindToController: {},
        link: pipelineQueryLink,
    };

    function pipelineQueryCtrl() {}

    function pipelineQueryLink(scope, ele, attrs, ctrl) {
        let ace,
            editorEle = HTMLElement,
            editor,
            editorLanguageTools;

        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.pipelineQuery.frameType = undefined;
        scope.pipelineQuery.customFrameName = {
            name: '',
            valid: true,
            message: '',
        };
        scope.pipelineQuery.selectedApp = '';
        scope.pipelineQuery.query = '';
        scope.pipelineQuery.updateFrame = updateFrame;
        scope.pipelineQuery.updateApp = updateApp;
        scope.pipelineQuery.previewQuery = previewQuery;
        scope.pipelineQuery.importQuery = importQuery;
        scope.pipelineQuery.validateFrameName = validateFrameName;
        scope.pipelineQuery.structure = {
            searchTerm: '',
            searched: [],
            open: false,
            tables: [],
            toggle: true,
        };
        scope.pipelineQuery.toggleTable = toggleTable;
        scope.pipelineQuery.checkToggle = checkToggle;
        scope.pipelineQuery.search = search;
        scope.pipelineQuery.clearQuery = clearQuery;

        /**
         * @name setFrameData
         * @desc set the frame type
         * @return {void}
         */
        function setFrameData() {
            scope.pipelineQuery.frameType =
                scope.widgetCtrl.getOptions('initialFrameType');
        }

        /**
         * @name updateFrame
         * @param {string} type - type
         * @desc update the frame type
         * @return {void}
         */
        function updateFrame(type) {
            scope.widgetCtrl.setOptions('initialFrameType', type);
        }

        /**
         * @name getApps
         * @desc set the initial data
         * @returns {void}
         */
        function getApps() {
            let selectedApp = semossCoreService.app.get('selectedApp'),
                keepSelected = false,
                reset = true,
                qsComponent;

            qsComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.QUERY_STRUCT.value'
            );

            if (
                scope.pipelineComponentCtrl.getComponent(
                    'parameters.SELECTED_APP.value'
                )
            ) {
                scope.pipelineQuery.selectedApp =
                    scope.pipelineComponentCtrl.getComponent(
                        'parameters.SELECTED_APP.value'
                    );
                if (qsComponent && qsComponent.engineName) {
                    keepSelected = true;
                    reset = false;
                }
            } else if (selectedApp && selectedApp !== 'NEWSEMOSSAPP') {
                scope.pipelineQuery.selectedApp = selectedApp;
            }

            if (reset || keepSelected) {
                updateApp(reset);
            }
        }

        /**
         * @name getAppData
         * @param {string} engineName The App Identifier
         * @desc Fetches the app data
         * @returns {void}
         */
        function getAppData(engineName) {
            const callback = function (response) {
                    // Emptying the structure again as it was adding the last app data after app reselection
                    scope.pipelineQuery.structure = {
                        searchTerm: '',
                        searched: [],
                        open: false,
                        tables: [],
                        toggle: true,
                    };
                    const tableStructure = response.pixelReturn[0].output,
                        tables = [];

                    if (tableStructure.length > 0) {
                        // Looping throught the TableStructure to get the columns and types of the respective tables
                        for (
                            let tableIdx = 0, tableLen = tableStructure.length;
                            tableIdx < tableLen;
                            tableIdx++
                        ) {
                            var tablePresesnt = true,
                                tableData = {
                                    table: '',
                                    open: true,
                                    columns: [],
                                };
                            tableData.table = tableStructure[tableIdx][5];
                            tableData.columns.push({
                                column: tableStructure[tableIdx][4],
                                type: tableStructure[tableIdx][2],
                            });

                            // Checking if the table had already been added to the list
                            for (
                                let index = 0;
                                index < tables.length;
                                index++
                            ) {
                                if (tables[index].table === tableData.table) {
                                    tables[index].columns.push({
                                        column: tableStructure[tableIdx][4],
                                        type: tableStructure[tableIdx][2],
                                    });
                                    tablePresesnt = false;
                                    break;
                                }
                            }
                            // Do not add the table to list as it already exists.
                            if (tablePresesnt) {
                                tables.push(tableData);
                            }
                        }
                    }

                    // Putting all the tables in the structure
                    scope.pipelineQuery.structure.tables = tables;

                    // Calling the search function
                    search();

                    // Calling the Autocomplete to add the column names and table names
                    updateAutocomplete();
                },
                // get the source
                source = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
            // set the source
            if (source && source.name) {
                scope.pipelineQuery.source.value = source.name;
            }
            var components = [
                {
                    type: 'getDatabaseTableStructure',
                    components: [engineName],
                    terminal: true,
                    meta: true,
                },
            ];
            scope.widgetCtrl.meta(components, callback);
        }

        /**
         * @name search
         * @desc search the structure list and update the options
         * @returns {void}
         */
        function search() {
            // if nothing is searched we can just used the original
            if (!scope.pipelineQuery.structure.searchTerm) {
                scope.pipelineQuery.structure.searched =
                    semossCoreService.utility.freeze(
                        scope.pipelineQuery.structure.tables
                    );
                return;
            }

            // if it is searched, we only check the column
            const cleanedSearch = String(
                scope.pipelineQuery.structure.searchTerm
            ).replace(/ /g, '_'); // name is already w/o spaces

            scope.pipelineQuery.structure.searched = [];
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineQuery.structure.tables.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                const table = semossCoreService.utility.freeze(
                    scope.pipelineQuery.structure.tables[tableIdx]
                );
                table.columns = $filter('filter')(
                    semossCoreService.utility.freeze(table.columns),
                    {
                        column: cleanedSearch,
                    }
                );

                if (table.columns.length > 0) {
                    scope.pipelineQuery.structure.searched.push(table);
                }
            }
        }

        /**
         * @name toggleTable
         * @desc toggle the traversal tables to be open/close (All Table)
         * @returns {void}
         */
        function toggleTable() {
            scope.pipelineQuery.structure.toggle =
                !scope.pipelineQuery.structure.toggle;

            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineQuery.structure.searched.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                scope.pipelineQuery.structure.searched[tableIdx].open =
                    scope.pipelineQuery.structure.toggle;
            }
        }

        /**
         * @name checkToggle
         * @desc check to see if any of the traversal tables are expanded and set the toggle accordingly (Table Specific)
         * @returns {void}
         */
        function checkToggle() {
            for (
                let tableIdx = 0,
                    tableLen = scope.pipelineQuery.structure.tables.length;
                tableIdx < tableLen;
                tableIdx++
            ) {
                if (scope.pipelineQuery.structure.tables[tableIdx].open) {
                    scope.pipelineQuery.structure.toggle = true;
                    return;
                }
            }

            scope.pipelineApp.traversal.toggle = false;
        }

        /**
         * @name clearQuery
         * @desc Empties the Query Box
         * @return {void}
         */
        function clearQuery() {
            scope.pipelineQuery.query = '';
            if (editor) {
                editor.setValue('');
            }
        }

        /** Editor */
        /**
         * @name initializeEditor
         * @desc sets up ace editor
         * @return {void}
         */
        function initializeEditor() {
            editorLanguageTools = ace.require('ace/ext/language_tools');
            editor = ace.edit(editorEle);
            editor.setTheme('ace/theme/chrome');
            editor.setShowPrintMargin(false);
            editor.setFontSize(16);
            editor.session.setMode('ace/mode/sql');
            // editor.session.setUseWrapMode(scope.pipelineQuery.state.wordWrap);
            editor.setOptions({
                enableBasicAutocompletion: true,
                // enableSnippets: true,
                enableLiveAutocompletion: true,
                autoScrollEditorIntoView: true,
                wrap: true,
                useWorker: false,
            });
            // need this to turn off an ace message clogging up console
            editor.$blockScrolling = Infinity;

            // Adding this if to preserve the query on edit after import.
            if (scope.pipelineQuery.query) {
                editor.setValue(scope.pipelineQuery.query);
            }

            // Passing the data to exisiting scope variable to use the existing code flow.
            editor.session.on('change', function () {
                scope.pipelineQuery.query = editor.getValue();
            });

            // Adding the App specific tables and columns.
            updateAutocomplete();
        }

        /**
         * @name updateAutocomplete
         * @desc update the information based on the selected APP
         * @returns {void}
         */
        function updateAutocomplete() {
            // Add the Columns and Table
            let editorPixelCompleter,
                reactorAutoComplete = [];

            // Adding Missing Keywords
            const keywords = ['distinct', 'like', 'trim', 'between'];
            for (
                let keywordIdx = 0, keywordLen = keywords.length;
                keywordIdx < keywordLen;
                keywordIdx++
            ) {
                let keyword = keywords[keywordIdx];

                reactorAutoComplete.push({
                    name: keyword,
                    value: keyword,
                    meta: 'keyword',
                    score: 0,
                });
            }

            if (typeof scope.pipelineQuery.structure.tables !== 'undefined') {
                // Looping the tables
                for (
                    let tableIdx = 0,
                        tableLen = scope.pipelineQuery.structure.tables.length;
                    tableIdx < tableLen;
                    tableIdx++
                ) {
                    const table =
                        scope.pipelineQuery.structure.tables[tableIdx];

                    reactorAutoComplete.push({
                        name: table.table,
                        value: table.table,
                        meta: 'TableName',
                        score: 0,
                    });

                    // Looping the Columns
                    for (
                        let columnIdx = 0, columnLen = table.columns.length;
                        columnIdx < columnLen;
                        columnIdx++
                    ) {
                        const column = table.columns[columnIdx];

                        reactorAutoComplete.push({
                            name: column.column,
                            value: column.column,
                            meta: 'ColumnName',
                            score: 0,
                        });
                    }
                }
            }

            editorPixelCompleter = {
                id: 'pixel',
                getCompletions: function (e, s, p, pre, cb) {
                    cb(null, reactorAutoComplete);
                },
            };
            if (
                typeof reactorAutoComplete !== 'undefined' &&
                typeof editorLanguageTools !== 'undefined'
            ) {
                // set the completer
                editorLanguageTools.setCompleters([
                    editorLanguageTools.snippetCompleter,
                    editorLanguageTools.textCompleter,
                    editorLanguageTools.keyWordCompleter,
                    editorPixelCompleter,
                ]);
            }
        }

        /**
         * @name updateApp
         * @desc update the information based on the selected APP
         * @param {boolean} reset - should we reset the information or use the information from the QUERY_STRUCT
         * @returns {void}
         */
        function updateApp(reset) {
            const queryComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.QUERY_STRUCT.value'
                ),
                frameName = scope.pipelineComponentCtrl.getComponent(
                    'parameters.IMPORT_FRAME.value.name'
                );

            // Triggering the getAppData
            if (scope.pipelineQuery.selectedApp) {
                getAppData(scope.pipelineQuery.selectedApp.value);
            }

            // scope.pipelineQuery.customFrameName.name = scope.pipelineComponentCtrl.createFrameName(scope.pipelineQuery.selectedApp.display);
            if (reset || !queryComponent.query) {
                scope.pipelineQuery.query = '';
            } else if (queryComponent.query) {
                scope.pipelineQuery.query = queryComponent.query;
            }

            if (frameName) {
                scope.pipelineQuery.customFrameName.name = frameName;
            } else {
                scope.pipelineQuery.customFrameName.name =
                    scope.pipelineComponentCtrl.createFrameName(
                        scope.pipelineQuery.selectedApp.display
                    );
                validateFrameName();
            }

            previewQuery();
        }

        /**
         * @name previewQuery
         * @param {boolean} alert - message on errors
         * @desc import the query
         * @returns {void}
         */
        function previewQuery(alert) {
            var parameters = {},
                valid = true;

            if (scope.pipelineQuery.query.length === 0) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Query is empty. Please enter a query.'
                    );
                }
                valid = false;
            }

            if (valid) {
                parameters = buildParameters(true);
            }

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name importQuery
         * @param {boolean} visualize if true visualize frame
         * @desc import the query
         * @returns {void}
         */
        function importQuery(visualize) {
            let callback,
                parameters,
                options = {};

            if (scope.pipelineQuery.query.length === 0) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Query is empty. Please enter a query.'
                );
                return;
            }

            parameters = buildParameters();

            options = {};
            options.name = scope.pipelineQuery.selectedApp.display;
            options.icon = scope.pipelineQuery.selectedApp.image;

            if (visualize) {
                callback = scope.pipelineComponentCtrl.visualizeComponent;
            }

            scope.pipelineComponentCtrl.executeComponent(
                parameters,
                options,
                callback
            );
        }

        /**
         * @name buildParameters
         * @param {boolean} preview - true if coming from preview
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(preview) {
            return {
                IMPORT_FRAME: {
                    name:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.name'
                        ) || scope.pipelineQuery.customFrameName.name,
                    type:
                        scope.pipelineComponentCtrl.getComponent(
                            'parameters.IMPORT_FRAME.value.type'
                        ) || scope.widgetCtrl.getOptions('initialFrameType'),
                    override: true,
                },
                QUERY_STRUCT: {
                    qsType: 'RAW_ENGINE_QUERY',
                    engineName: scope.pipelineQuery.selectedApp.value,
                    query: scope.pipelineQuery.query,
                    limit: preview ? PREVIEW_LIMIT : -1,
                },
                SELECTED_APP: scope.pipelineQuery.selectedApp,
            };
        }

        /**
         * @name validateFrameName
         * @desc checks if the frame name entered by the user is valid
         * @returns {void}
         */
        function validateFrameName() {
            let results = scope.pipelineComponentCtrl.validateFrameName(
                scope.pipelineQuery.customFrameName.name
            );
            scope.pipelineQuery.customFrameName.valid = results.valid;
            scope.pipelineQuery.customFrameName.message = results.message;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            // Setting the focus on the editor
            ele[0]
                .querySelector('#pipeline-query__content__right__editor')
                .focus();
            setFrameData();
            getApps();

            // get the editor div
            editorEle = ele[0].querySelector(
                '#pipeline-query__content__right__editor'
            );

            // Importing ace js
            import(
                /* webpackChunkName: "ace"  */ /* webpackPrefetch: true */ '../../core/components/terminal/ace'
            )
                .then((module) => {
                    ace = module.ace;
                    // initialize the editor
                    initializeEditor();
                })
                .catch((err) => {
                    console.error('Error: ', err);
                });
        }

        initialize();
    }
}
