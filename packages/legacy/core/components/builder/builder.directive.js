'use strict';

/**
 * @name builder
 * @desc builds widget through drag and drop
 */
export default angular
    .module('app.builder.directive', [])
    .directive('builder', builderDirective);

import { CONNECTORS } from '@/core/constants';

import './builder.scss';

builderDirective.$inject = [
    'ENDPOINT',
    '$timeout',
    '$filter',
    'semossCoreService',
    'monolithService',
    'CONFIG',
];

function builderDirective(
    ENDPOINT,
    $timeout,
    $filter,
    semossCoreService,
    monolithService,
    CONFIG
) {
    builderLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^widget'],
        template: require('./builder.directive.html'),
        link: builderLink,
    };

    function builderLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        scope.builder = {};
        scope.builder.formType = 'wysiwyg';

        scope.builder.app = {
            list: [],
            searched: [],
            searchTerm: '',
            selected: {},
        };

        scope.builder.project = {
            selected: {},
        };

        scope.builder.next = next;
        scope.builder.back = back;

        scope.builder.searchApp = searchApp;
        scope.builder.selectApp = selectApp;
        scope.builder.searchTable = searchTable;
        scope.builder.selectTable = selectTable;

        scope.builder.setView = setView;
        scope.builder.previewFormHTML = previewFormHTML;
        scope.builder.editFormHTML = editFormHTML;

        /** Navigation */

        // app, view, data, preview
        /**
         * @name next
         * @desc set the next step
         * @returns {void}
         */
        function next() {
            if (
                !scope.builder.app.selected.value ||
                !scope.builder.table.selected.value
            ) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please select database and a table to build from'
                );
                return;
            }

            scope.builder.step = 'build-wysiwyg';
        }

        /**
         * @name back
         * @desc go back a next step
         * @returns {void}
         */
        function back() {
            initializeVariables();

            scope.builder.step = 'app';
            resetApps();
        }

        /** App */
        /**
         * @name resetApps
         * @desc reset the apps to the initial state
         * @returns {void}
         */
        function resetApps() {
            scope.builder.app = {
                list: [],
                searched: [],
                searchTerm: '',
                selected: scope.builder.app.selected,
            };

            scope.builder.project = {
                selected: {},
            };

            getApps();
        }

        /**
         * @name getApps
         * @desc updates the second step
         * @returns {void}
         */
        function getApps() {
            var message = semossCoreService.utility.random('query-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    j,
                    len,
                    add;

                for (i = 0, len = output.length; i < len; i++) {
                    scope.builder.app.list.push({
                        cost: output[i].app_cost,
                        name: String(output[i].app_name).replace(/_/g, ' '),
                        value: output[i].app_id,
                        type: output[i].app_type,
                        disable:
                            !CONNECTORS[output[i].app_subtype] ||
                            CONNECTORS[output[i].app_subtype].type !== 'RDBMS',
                        image: semossCoreService.app.generateDatabaseImageURL(
                            output[i].app_id
                        ),
                        secondaryImage: CONNECTORS[output[i].app_subtype]
                            ? CONNECTORS[output[i].app_subtype].image
                            : '',
                    });

                    if (
                        scope.builder.app.selected.value &&
                        scope.builder.app.selected.value === output[i].app_id
                    ) {
                        scope.builder.app.selected =
                            scope.builder.app.list[
                                scope.builder.app.list.length - 1
                            ];
                    }
                }

                if (scope.builder.app.searched.length > 0) {
                    i = 0;
                    add = true;
                    while (scope.builder.app.searched[i] && add) {
                        let selectedApp =
                            semossCoreService.app.get('selectedApp');
                        if (selectedApp && selectedApp !== 'NEWSEMOSSAPP') {
                            if (
                                scope.builder.app.searched[i].value ===
                                selectedApp
                            ) {
                                selectApp(
                                    scope.builder.app.selected.value
                                        ? scope.builder.app.selected
                                        : scope.builder.app.searched[i]
                                );
                                add = false;
                            }
                        } else if (!scope.builder.app.searched[i].disable) {
                            selectApp(
                                scope.builder.app.selected.value
                                    ? scope.builder.app.selected
                                    : scope.builder.app.searched[i]
                            );
                            add = false;
                        }
                        i++;
                    }
                }

                if (CONFIG.security) {
                    // make sure user has edit or owner access to db. otherwise they won't be able to save after they have created their form.
                    monolithService.getDBs().then(function (response2) {
                        for (i = 0; i < scope.builder.app.list.length; i++) {
                            for (j = 0; j < response2.data.length; j++) {
                                if (
                                    scope.builder.app.list[i].value ===
                                    response2.data[j].app_id
                                ) {
                                    scope.builder.app.list[i].disable = scope
                                        .builder.app.list[i].disable
                                        ? scope.builder.app.list[i].disable
                                        : response2.data[j].app_permission ===
                                          'READ_ONLY';
                                }
                            }
                        }
                        searchApp();
                    });
                } else {
                    searchApp();
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name searchApp
         * @desc updates the app list
         * @returns {void}
         */
        function searchApp() {
            const cleanedSearch = String(scope.builder.app.searchTerm).replace(
                /_/g,
                ' '
            );
            scope.builder.app.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.builder.app.list),
                {
                    name: cleanedSearch,
                }
            );
        }

        /**
         * @name searchApp
         * @desc select options for the second step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectApp(opt) {
            scope.builder.app.selected = opt;

            getTables();
        }

        /** Table */
        /**
         * @name getTables
         * @desc updates the second step
         * @returns {void}
         */
        function getTables() {
            var message = semossCoreService.utility.random('query-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    added = {},
                    i,
                    len;

                scope.builder.table.list = [];
                scope.builder.columns.list = [];
                for (i = 0, len = output.length; i < len; i++) {
                    if (!added.hasOwnProperty(output[i][0])) {
                        scope.builder.table.list.push({
                            name: String(output[i][0]).replace(/_/g, ' '),
                            value: output[i][0],
                        });

                        added[output[i][0]] = true;
                    }

                    scope.builder.columns.list.push({
                        name: String(output[i][1]).replace(/_/g, ' '),
                        value: output[i][3]
                            ? output[i][1]
                            : output[i][0] + '__' + output[i][1],
                        isPK: output[i][3],
                        dataType: output[i][2],
                        table: output[i][0],
                    });
                }

                searchTable();

                if (scope.builder.table.searched.length > 0) {
                    selectTable(scope.builder.table.searched[0]);
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseTableStructure',
                        components: [scope.builder.app.selected.value],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name searchTable
         * @desc updates the app list
         * @returns {void}
         */
        function searchTable() {
            var cleanedSearch = String(scope.builder.table.searchTerm).replace(
                /_/g,
                ' '
            );
            scope.builder.table.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.builder.table.list),
                {
                    name: cleanedSearch,
                }
            );
        }

        /**
         * @name searchTable
         * @desc select options for the second step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectTable(opt) {
            var selectors = [],
                colIdx,
                colLen;

            scope.builder.table.selected = opt;

            // preview
            for (
                colIdx = 0, colLen = scope.builder.columns.list.length;
                colIdx < colLen;
                colIdx++
            ) {
                if (scope.builder.columns.list[colIdx].table === opt.value) {
                    selectors.push({
                        selector: scope.builder.columns.list[colIdx].value,
                        alias: String(
                            scope.builder.columns.list[colIdx].name
                        ).replace(/ /g, '_'),
                    });
                }
            }

            scope.widgetCtrl.emit('load-preview', {
                pixelComponents: [
                    {
                        meta: true,
                        type: 'database',
                        components: [scope.builder.app.selected.value],
                    },
                    {
                        type: 'select2',
                        components: [selectors],
                    },
                    {
                        type: 'limit',
                        components: [100],
                    },
                    {
                        type: 'collect',
                        components: [500],
                        terminal: true,
                    },
                ],
            });
        }

        /**
         * @name setView
         * @desc update the panel to be the form
         * @returns {void}
         */
        function setView() {
            semossCoreService.emit('form-set-view');
        }

        /**
         * @name previewFormHTML
         * @desc preview the form html
         * @returns {void}
         */
        function previewFormHTML() {
            semossCoreService.emit('form-preview');
        }

        /**
         * @name editFormHTML
         * @desc preview the form html
         * @returns {void}
         */
        function editFormHTML() {
            semossCoreService.emit('form-edit-source');
        }

        /**
         * @name initializeVariables
         * @desc initialize/reset the variables
         * @returns {void}
         */
        function initializeVariables() {
            scope.builder.table = {
                list: [],
                searched: [],
                searchTerm: '',
                selected: {},
            };
            scope.builder.columns = {
                list: [],
            };
            scope.builder.accordion = {
                first: 25,
                second: 25,
                third: 50,
            };
        }

        /**
         * @name setNewForm
         * @desc set the new form configurations
         * @returns {void}
         */
        function setNewForm() {
            var dataModel,
                insightDetails = semossCoreService.getShared(
                    scope.widgetCtrl.insightID,
                    'insight'
                );

            // we are in edit
            if (scope.widgetCtrl.getWidget('view.builder.options.json')) {
                scope.builder.wysiwygJSON = scope.widgetCtrl.getWidget(
                    'view.builder.options.json'
                );
                // select the app and table by looping through the data
                for (dataModel in scope.builder.wysiwygJSON.data) {
                    if (
                        scope.builder.wysiwygJSON.data.hasOwnProperty(dataModel)
                    ) {
                        if (
                            scope.builder.wysiwygJSON.data[dataModel].config &&
                            scope.builder.wysiwygJSON.data[dataModel].config.app
                        ) {
                            scope.builder.app.selected =
                                scope.builder.wysiwygJSON.data[
                                    dataModel
                                ].config.app;
                        }

                        if (
                            scope.builder.wysiwygJSON.data[dataModel].config &&
                            scope.builder.wysiwygJSON.data[dataModel].config
                                .table
                        ) {
                            scope.builder.table.selected.value =
                                scope.builder.wysiwygJSON.data[
                                    dataModel
                                ].config.table;
                        }
                    }
                }

                if (
                    scope.builder.app.selected.value &&
                    scope.builder.table.selected.value
                ) {
                    scope.builder.formName = insightDetails.name;
                    // go to next step
                    next();
                }
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            resetApps();

            // check options service and see if we have a form to edit
            // optionsService.get(...);

            scope.builder.step = 'app';

            // we will go to the new html form if it's coming from a widget via a set panel view
            // normal form will not have a set panel since it's a core component view, not a set panel view.
            // we will then check to see if any configurations were passed into the builder, if so we will set them
            if (scope.widgetCtrl.getWidget('active') === 'builder') {
                setNewForm();
            }
        }

        initializeVariables();
        initialize();
    }
}
