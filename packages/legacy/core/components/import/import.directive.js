'use strict';

import { CONNECTORS } from '@/core/constants';

import './import.scss';

import './import-file/import-file.directive';
import './import-file-flat/import-file-flat.directive';
import './import-file-metamodel/import-file-metamodel.directive';
import './import-file-graph-old/import-file-graph-old.directive';
import './import-file-graph/import-file-graph.directive';
import './import-file-table/import-file-table.directive';
import './import-external/import-external.directive';
import './import-external-datastax/import-external-datastax.directive';
import './import-copy/import-copy.directive';
import './import-app/import-app.directive';

export default angular
    .module('app.import.directive', [
        'app.import-file.directive',
        'app.import-file-flat.directive',
        'app.import-file-metamodel.directive',
        'app.import-file-graph-old.directive',
        'app.import-file-graph.directive',
        'app.import-file-table.directive',
        'app.import-external.directive',
        'app.import-external-datastax.directive',
        'app.import-copy.directive',
        'app.import-app.directive',
    ])
    .directive('import', importDirective);

importDirective.$inject = [
    '$state',
    '$filter',
    'ENDPOINT',
    'semossCoreService',
    'CONFIG',
    'monolithService',
];

function importDirective(
    $state,
    $filter,
    ENDPOINT,
    semossCoreService,
    CONFIG,
    monolithService
) {
    importController.$inject = ['$scope'];
    importLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: [],
        controller: importController,
        bindToController: {
            replace: '=?',
        },
        controllerAs: 'import',
        link: importLink,
        template: require('./import.directive.html'),
    };

    function importController() {
        var importVM = this;

        importVM.name = {
            value: '',
            valid: false,
            message: '',
        };

        importVM.meta = {
            description: '',
            tags: [],
            all: [],
        };

        importVM.validateName = validateName;
        importVM.alert = alert;
        importVM.query = query;
        importVM.exit = exit;

        /**
         * @name validateName
         * @desc makes sure app name is unique and does not containe special chars
         * @returns {void}
         */
        function validateName() {
            var name, i, len;

            // TODO need to use the getApps monolith call for a valid list of apps
            name = importVM.name.value;

            if (!name) {
                importVM.name.valid = false;
                importVM.name.message = 'Name is required';
                return;
            }

            name = name.replace(/_/g, ' ');

            for (i = 0, len = importVM.appList.length; i < len; i++) {
                if (importVM.appList[i].name === name) {
                    importVM.name.valid = false;
                    importVM.name.message = 'Database Name is not unique';
                    return;
                }
            }

            if (name.match(/[-\/\\^$*+?.()|[\]{}]/g)) {
                importVM.name.valid = false;
                importVM.name.message =
                    'Database Name must not contain special characters';
                return;
            }

            importVM.name.valid = true;
            importVM.name.message = '';
        }

        /**
         * @name alert
         * @param {string} color - color of the alert
         * @param {string} text - text of the alert
         * @desc emit alert from the widget
         * @returns {void}
         */
        function alert(color, text) {
            semossCoreService.emit('alert', {
                color: color,
                text: text,
            });
        }

        /**
         * @name query
         * @param {array} commandList - components to run
         * @param {function} callback - callback to trigger when done
         * @param {array} listeners - listeners for the execute-pixel (loading screens)
         * @desc query a meta pixel
         * @returns {void}
         */
        function query(commandList, callback, listeners) {
            let payload = {
                commandList: commandList,
                listeners: listeners ? listeners : undefined,
            };
            if (callback) {
                payload.response =
                    semossCoreService.utility.random('execute-pixel');
                semossCoreService.once(payload.response, callback);
            }

            semossCoreService.emit('query-pixel', payload);
        }

        /**
         * @name exit
         * @param {string} appInfo app info
         * @desc leaves import and enters the app imported
         * @return {void}
         */
        function exit(appInfo) {
            if (!appInfo) {
                // open new insight
                semossCoreService.emit('open', {
                    type: 'new',
                    options: {},
                });
            } else {
                $state.go('home.catalog.database', {
                    database: appInfo.database_id,
                });
            }
        }
    }

    function importLink(scope) {
        scope.import.loaded = false;
        scope.import.appList = [];
        scope.import.accordionSettings = {
            first: {
                name: 'Select a Starting Point',
                size: 20,
            },
            second: {
                name: '',
                size: 20,
            },
            third: {
                name: '',
                size: 60,
            },
        };

        scope.import.first = {
            list: [
                {
                    name: 'Drag and Drop Data',
                    value: 'file',
                    image: require('images/file.svg'),
                },
                {
                    name: 'Connect to an External Datasource',
                    value: 'external',
                    image: require('images/external.svg'),
                },
                // {
                //     name: 'Add to an Existing Database',
                //     value: 'add',
                //     image: require('images/database.svg')
                // },
                {
                    name: 'Copy Database',
                    value: 'copy',
                    image: require('images/copy.svg'),
                },
                {
                    name: 'Upload Database',
                    value: 'upload',
                    image: require('images/upload.svg'),
                },
            ],
            selected: '',
        };

        scope.import.selectFirstStep = selectFirstStep;
        scope.import.searchApp = searchApp;
        scope.import.selectApp = selectApp;
        scope.import.searchExternal = searchExternal;
        scope.import.selectExternal = selectExternal;
        scope.import.searchFile = searchFile;
        scope.import.selectFile = selectFile;
        scope.import.sendFile = sendFile;
        scope.import.navigateToCatalog = navigateToCatalog;
        scope.import.adminOnlyDbAdd = CONFIG['adminOnlyDbAdd'];
        scope.import.validateUserPermission = validateUserPermission;

        /**
         * @name navigateToCatalog
         * @desc goes to the Data Catalog page
         * @returns {void}
         */
        function navigateToCatalog() {
            $state.go('home.catalog');
        }

        /** Steps */
        /**
         * @name resetVars
         * @desc Helper function that resets all the user-entered variables
         * @returns {void}
         */
        function resetVars() {
            scope.import.app = {
                raw: [],
                searchTerm: '',
                searched: [],
                selected: '',
            };

            scope.import.external = {
                raw: [],
                searchTerm: '',
                searched: [],
                selected: '',
            };

            scope.import.file = {
                raw: [],
                searchTerm: '',
                searched: [],
                selected: '',
            };
        }

        /**
         * @name selectFirstStep
         * @desc select the second step based on the first step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectFirstStep(opt) {
            if (opt && scope.import.first.selected === opt.value) {
                return;
            }

            resetVars();

            scope.import.first.selected = opt.value;

            scope.import.accordionSettings.second.name = opt.name;

            // reset sizing
            scope.import.accordionSettings.first.size = 20;
            scope.import.accordionSettings.second.size = 20;
            scope.import.accordionSettings.third.size = 60;

            if (scope.import.first.selected === 'add') {
                getApps();
            } else if (scope.import.first.selected === 'external') {
                getExternal();
            } else if (scope.import.first.selected === 'file') {
                getFile();
            } else if (
                scope.import.first.selected === 'copy' ||
                scope.import.first.selected === 'upload'
            ) {
                scope.import.accordionSettings.second.size = 80;
                scope.import.accordionSettings.third.size = 0;
                scope.import.accordionSettings.third.name = '';
            }
        }
        /** App */
        /**
         * @name getApps
         * @desc updates the second step
         * @returns {void}
         */
        function getApps() {
            scope.import.app.raw = JSON.parse(
                JSON.stringify(scope.import.appList)
            );

            searchApp();

            if (scope.import.app.searched.length > 0) {
                selectApp(scope.import.app.searched[0]);
            }
        }

        /**
         * @name validateUserPermission
         * @desc restrict non admin user to create DB
         * @returns {void}
         */
        function validateUserPermission() {
            if (scope.import.adminOnlyDbAdd === true) {
                monolithService.isAdmin().then(function (adminUser) {
                    if (adminUser === false) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'User does not have permission to view this page.',
                        });
                        $state.go('home.catalog');
                    }
                });
            }
        }

        /**
         * @name searchApp
         * @desc updates the app list
         * @returns {void}
         */
        function searchApp() {
            var cleanedSearch = String(scope.import.app.searchTerm).replace(
                /_/g,
                ' '
            );
            scope.import.app.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.import.app.raw),
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
            scope.import.accordionSettings.third.name = opt.name;
            scope.import.app.selected = opt.value;
        }

        /** External */
        /**
         * @name getExternal
         * @desc updates the second step
         * @returns {void}
         */
        function getExternal() {
            var c;

            scope.import.external = {
                raw: [],
                searchTerm: '',
                searched: [],
                selected: '',
            };

            // set the connector information
            for (c in CONNECTORS) {
                if (CONNECTORS.hasOwnProperty(c)) {
                    scope.import.external.raw.push({
                        name: CONNECTORS[c].name,
                        image: CONNECTORS[c].image,
                        value: CONNECTORS[c].driver,
                    });
                }
            }

            searchExternal();

            if (scope.import.external.searched.length > 0) {
                selectExternal(scope.import.external.searched[0]);
            }
        }

        /**
         * @name searchExternal
         * @desc updates the external list
         * @returns {void}
         */
        function searchExternal() {
            var cleanedSearch = String(
                scope.import.external.searchTerm
            ).replace(/ /g, '_');
            scope.import.external.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.import.external.raw),
                {
                    value: cleanedSearch,
                }
            );
        }

        /**
         * @name selectExternal
         * @desc select options for the second step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectExternal(opt) {
            scope.import.accordionSettings.third.name = opt.name;
            scope.import.external.selected = opt.value;
        }

        /** File */
        /**
         * @name getFile
         * @desc updates the second step
         * @returns {void}
         */
        function getFile() {
            scope.import.file = {
                raw: [
                    {
                        name: 'CSV',
                        value: 'CSV',
                        image: require('images/CSV.svg'),
                    },
                    {
                        name: 'Excel',
                        value: 'EXCEL',
                        image: require('images/EXCEL.png'),
                    },
                    {
                        name: 'TSV',
                        value: 'TSV',
                        image: require('images/TSV.svg'),
                    },
                    {
                        name: 'SQLite',
                        value: 'SQLITE',
                        image: require('images/SQLITE.png'),
                    },
                    {
                        name: 'H2',
                        value: 'H2_DB',
                        image: require('images/H2_DB.png'),
                    },
                    {
                        name: 'Neo4J',
                        value: 'NEO4J',
                        image: require('images/NEO4J.png'),
                    },
                    {
                        name: 'Tinker',
                        value: 'TINKER',
                        image: require('images/TINKER.png'),
                    },
                ],
                searchTerm: '',
                searched: [],
                selected: '',
            };

            searchFile();

            if (scope.import.file.searched.length > 0) {
                selectFile(scope.import.file.searched[0]);
            }
        }

        /**
         * @name searchFile
         * @desc updates the file list
         * @returns {void}
         */
        function searchFile() {
            var cleanedSearch = String(scope.import.file.searchTerm).replace(
                / /g,
                '_'
            );
            scope.import.file.searched = $filter('filter')(
                semossCoreService.utility.freeze(scope.import.file.raw),
                {
                    value: cleanedSearch,
                }
            );
        }

        /**
         * @name selectFile
         * @desc select options for the second step
         * @param {*} opt - selected option
         * @returns {void}
         */
        function selectFile(opt) {
            scope.import.accordionSettings.third.name = opt.name;
            scope.import.file.selected = opt.value;
        }

        /**
         * @name sendFile
         * @desc select options for the second step
         * @param {*} $file - angularJS file object
         * @returns {void}
         */
        function sendFile($file) {
            scope.import.fileData = $file;

            selectFirstStep(scope.import.first.list[0]);
            selectFile(scope.import.file.raw[0]);
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var callback;

            // register message to come back to
            callback = function (response) {
                let output = response.pixelReturn[0].output,
                    allTags = [];

                if (output) {
                    for (
                        let outputIdx = 0, outputLen = output.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        let appTags = output[outputIdx].tags
                            ? output[outputIdx].tags
                            : [];

                        scope.import.appList.push({
                            cost: output[outputIdx].app_cost,
                            name: String(output[outputIdx].app_name).replace(
                                /_/g,
                                ' '
                            ),
                            value: output[outputIdx].app_id,
                            type: output[outputIdx].app_type,
                            image: semossCoreService.app.generateDatabaseImageURL(
                                output[outputIdx].app_id
                            ),
                            secondaryImage: CONNECTORS[
                                output[outputIdx].app_type
                            ]
                                ? CONNECTORS[output[outputIdx].app_type].image
                                : '',
                            tags: appTags,
                        });

                        if (appTags.length) {
                            for (
                                let tagIdx = 0, tagLen = appTags.length;
                                tagIdx < tagLen;
                                tagIdx++
                            ) {
                                if (allTags.indexOf(appTags[tagIdx]) === -1) {
                                    allTags.push(appTags[tagIdx]);
                                }
                            }
                        }
                    }
                }

                scope.import.meta.all = allTags;

                resetVars();
                if (scope.import.first.list.length > 0) {
                    selectFirstStep(scope.import.first.list[0]);
                }

                scope.import.loaded = true;
            };

            scope.import.query(
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
            validateUserPermission();
        }

        initialize();
    }
}
