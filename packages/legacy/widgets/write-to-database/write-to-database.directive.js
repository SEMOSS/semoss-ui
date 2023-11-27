'use strict';

import { CONNECTORS } from '@/core/constants.js';

import './write-to-database.scss';

export default angular
    .module('app.write-to-database.directive', [])
    .directive('writeToDatabase', writeToDatabase);

writeToDatabase.$inject = ['semossCoreService'];

function writeToDatabase(semossCoreService) {
    writeToDatabaseCtrl.$inject = [];
    writeToDatabaseLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '?^pipelineComponent'],
        template: require('./write-to-database.directive.html'),
        scope: {},
        bindToController: {},
        controllerAs: 'writeToDatabase',
        controller: writeToDatabaseCtrl,
        link: writeToDatabaseLink,
    };

    function writeToDatabaseCtrl() {}

    function writeToDatabaseLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        // VARIABLES
        scope.writeToDatabase.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.writeToDatabase.targetDatabase = '';
        scope.writeToDatabase.targetTable = '';
        scope.writeToDatabase.override = false;
        scope.writeToDatabase.showInput = false;
        scope.writeToDatabase.showTables = false;
        scope.writeToDatabase.useColAsKey = false;
        // scope.writeToDatabase.allowColAsKey = false;
        scope.writeToDatabase.insertKey = false;
        scope.writeToDatabase.saveOption = '';
        scope.writeToDatabase.allowInsertKey = true;

        scope.writeToDatabase.group = [];
        scope.writeToDatabase.panelInfo = [];
        scope.writeToDatabase.keys = [];
        scope.writeToDatabase.databaseList = [];
        scope.writeToDatabase.frameHeaders = [];

        scope.writeToDatabase.saveOptionList = [
            {
                option: 'Create a New Table',
                value: 'new',
            },
            {
                option: 'Override an Existing Table',
                value: 'override',
            },
            {
                option: 'Append to an Existing Table',
                value: 'append',
            },
        ];
        // FUNCTIONS
        scope.writeToDatabase.submit = submit;
        // scope.writeToDatabase.updateUseColAsKey = updateUseColAsKey;
        scope.writeToDatabase.updateSaveOption = updateSaveOption;

        // PIPELINE related functions
        scope.writeToDatabase.cancel = cancel;

        /**
         * @name buildParams
         * @desc builds params for pipeline
         * @param {string} preview - preview the data
         * @return {object} the params and their values
         */
        function buildParams(preview) {
            let params = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
            };

            if (!preview) {
                if (
                    scope.writeToDatabase.targetDatabase &&
                    scope.writeToDatabase.targetTable
                ) {
                    params.WRITE_TO_DATABASE = {
                        targetDatabase: scope.writeToDatabase.targetDatabase,
                        targetTable: scope.writeToDatabase.targetTable,
                        override: scope.writeToDatabase.override,
                        insertId: scope.writeToDatabase.insertKey,
                    };
                }
            }

            params.SELECT = scope.writeToDatabase.frameHeaders;

            return params;
        }

        /**
         * @name getFrameHeaders
         * @desc gets the frame headers
         * @returns {void}
         */
        function getFrameHeaders() {
            var headers = scope.widgetCtrl.getFrame('headers') || [],
                i,
                len;

            scope.writeToDatabase.frameHeaders = [];
            if (headers && headers.length > 0) {
                for (i = 0, len = headers.length; i < len; i++) {
                    scope.writeToDatabase.frameHeaders.push({
                        selector: headers[i].displayName,
                        alias: headers[i].alias,
                    });
                }
            }
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         * @return {void}
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name submit
         * @desc run the pixel to write to database
         * @returns {void}
         */
        function submit() {
            var pixelComponents = [],
                callback,
                components;

            if (scope.writeToDatabase.PIPELINE) {
                components = buildParams(false);
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                pixelComponents.push(
                    {
                        meta: true,
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'select2',
                        components: [scope.writeToDatabase.keys],
                    }
                );

                if (scope.writeToDatabase.group.length > 0) {
                    pixelComponents.push({
                        type: 'group',
                        components: [scope.writeToDatabase.group],
                    });
                }

                pixelComponents.push({
                    type: 'toDatabase',
                    components: [
                        scope.writeToDatabase.targetDatabase,
                        scope.writeToDatabase.targetTable,
                        scope.writeToDatabase.override,
                        scope.writeToDatabase.insertKey,
                    ],
                    terminal: true,
                });

                callback = function (response) {
                    if (
                        response.pixelReturn[0].operationType.indexOf(
                            'ERROR'
                        ) === -1
                    ) {
                        // success
                        scope.widgetCtrl.alert(
                            'success',
                            'Successfully wrote to database.'
                        );
                    }
                };

                scope.widgetCtrl.meta(pixelComponents, callback);
            }
        }

        /**
         * @name getPanel
         * @desc get the current panel's selected data to write to a database
         * @returns {void}
         */
        function getPanel() {
            var active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                i,
                j;

            scope.writeToDatabase.keys = scope.widgetCtrl.getWidget(
                'view.' + active + '.keys.' + layout
            );
            // if(active !== 'pipeline') {
            if (layout !== 'Grid' && active !== 'pipeline') {
                for (i = 0; i < scope.writeToDatabase.keys.length; i++) {
                    if (scope.writeToDatabase.keys[i].groupBy.length > 0) {
                        for (
                            j = 0;
                            j < scope.writeToDatabase.keys[i].groupBy.length;
                            j++
                        ) {
                            scope.writeToDatabase.group[j] = String(
                                scope.writeToDatabase.keys[i].groupBy[j]
                            );
                        }
                        break;
                    }
                }
            }
            // } else {

            // }
        }

        /**
         * @name updateSaveOption
         * @desc updates the save option (new table, override table, append to table)
         * @returns {void}
         */
        function updateSaveOption() {
            scope.writeToDatabase.targetTable = '';
            scope.writeToDatabase.tables = [];
            scope.writeToDatabase.useColAsKey = false;
            scope.writeToDatabase.insertKey = false;
            scope.writeToDatabase.showTables = false;

            if (scope.writeToDatabase.saveOption === 'new') {
                scope.writeToDatabase.showInput = true;
                scope.writeToDatabase.showTables = false;
                scope.writeToDatabase.override = false;
                // scope.writeToDatabase.allowColAsKey = true;
                scope.writeToDatabase.allowInsertKey = true;
            } else if (scope.writeToDatabase.saveOption === 'override') {
                getTableNames();
                scope.writeToDatabase.showInput = false;
                scope.writeToDatabase.showTables = true;
                scope.writeToDatabase.override = true;
                // scope.writeToDatabase.allowColAsKey = false;
                scope.writeToDatabase.allowInsertKey = true;
            } else if (scope.writeToDatabase.saveOption === 'append') {
                getTableNames();
                scope.writeToDatabase.showInput = false;
                scope.writeToDatabase.showTables = true;
                scope.writeToDatabase.override = false;
                // scope.writeToDatabase.allowColAsKey = false;
                scope.writeToDatabase.allowInsertKey = true;
            }
        }

        // /**
        //  * @name updateUseColAsKey
        //  * @desc update variables if user toggles between using the primary column as the key/table name
        //  * @returns
        //  */
        // function updateUseColAsKey() {

        //     if(scope.writeToDatabase.useColAsKey) {
        //         scope.writeToDatabase.targetTable = scope.writeToDatabase.keys[0].alias.replace(/_/g, ' ');
        //         scope.writeToDatabase.insertKey = false;
        //     } else {
        //         scope.writeToDatabase.targetTable = '';
        //         // scope.writeToDatabase.tables = [];
        //     }
        // }

        /**
         * @name getTableNames
         * @desc run the pixel to write to list of tables in selected DB to override
         * @returns {void}
         */
        function getTableNames() {
            var callback = function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len;

                // was there an error?
                if (response.pixelReturn[0].operationType === 'ERROR') {
                    return;
                }

                // loop through the output
                for (i = 0, len = output.length; i < len; i++) {
                    scope.writeToDatabase.tables.push(
                        String(output[i]).replace(/_/g, ' ')
                    );
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getDatabaseConcepts',
                        components: [scope.writeToDatabase.targetDatabase],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        function getDatabaseList() {
            var callback = function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len,
                    selectedApp = semossCoreService.app.get('selectedApp');

                if (response.pixelReturn[0].operationType === 'ERROR') {
                    return;
                }

                for (i = 0, len = output.length; i < len; i++) {
                    if (
                        !CONNECTORS[output[i].app_subtype] || 
                        !CONNECTORS[output[i].app_subtype].type === 'RDBMS'
                    ) {
                        continue;
                    }

                    scope.writeToDatabase.databaseList.push({
                        name: String(output[i].app_name).replace(/_/g, ' '),
                        value: output[i].app_id,
                    });
                }

                if (scope.writeToDatabase.databaseList.length > 0) {
                    scope.writeToDatabase.targetDatabase =
                        selectedApp && selectedApp !== 'NEWSEMOSSAPP'
                            ? selectedApp
                            : scope.writeToDatabase.databaseList[0].value;
                }
            };
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'getDatabaseList',
                        components: [],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name loadPreview
         * @desc loads preview
         * @return {void}
         */
        function loadPreview() {
            var pixel;

            pixel = buildParams(true);
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var srcComponent;

            getDatabaseList();
            getFrameHeaders();
            getPanel();

            if (scope.writeToDatabase.PIPELINE) {
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (!srcComponent) {
                    scope.pipelineComponentCtrl.closeComponent();
                    return;
                }

                loadPreview();
            }
        }

        initialize();
    }
}
