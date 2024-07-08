'use strict';

import angular from 'angular';

import './database.scss';

// import './database-collab/database-collab.directive';
import './database-meta/database-meta.directive';
import './database-physical/database-physical.directive';

export default angular
    .module('app.database.directive', [
        // 'app.database.database-collab',
        'app.database.database-meta',
        'app.database.database-physical',
    ])
    .directive('database', databaseDirective);

databaseDirective.$inject = [
    'semossCoreService',
    '$transitions',
    '$state',
    '$stateParams',
    '$timeout',
    'PLAYGROUND',
    'monolithService',
    'CONFIG',
];

function databaseDirective(
    semossCoreService,
    $transitions,
    $state,
    $stateParams,
    $timeout,
    PLAYGROUND,
    monolithService,
    CONFIG
) {
    databaseCtrl.$inject = ['$scope'];
    databaseLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: ['^catalog'],
        restrict: 'E',
        template: require('./database.directive.html'),
        controller: databaseCtrl,
        link: databaseLink,
        scope: {},
        bindToController: {},
        controllerAs: 'database',
        transclude: true,
    };

    function databaseCtrl() {}

    function databaseLink(scope, ele, attrs, ctrl, state) {
        scope.database.catalogCtrl = ctrl[0];

        scope.database.appInfo = {};

        scope.database.CONFIG = CONFIG;

        scope.database.PLAYGROUND = PLAYGROUND;

        scope.database.states = [
            {
                name: 'Data',
                state: 'home.database.meta',
            },
            {
                name: 'Data',
                state: 'home.database.physical',
            },
            // {
            //     name: 'Collaboration',
            //     state: 'home.database.collab'
            // }
        ];

        scope.database.appUsers = {
            authors: [],
            editors: [],
            viewers: [],
            authorsClean: '',
            editorsClean: '',
            viewersClean: '',
        };

        scope.database.edit = {
            open: false,
            app: undefined,
        };

        scope.database.request = {
            open: false,
            app: undefined,
        };

        scope.database.defaultFieldOptions = {
            options: [
                'blue',
                'orange',
                'teal',
                'purple',
                'yellow',
                'pink',
                'violet',
                'olive',
            ],
            mapping: {},
        };
        scope.database.fields = [];
        scope.database.fieldOptions = {};

        scope.database.navigateState = navigateState;
        scope.database.openEdit = openEdit;
        scope.database.openRequest = openRequest;
        scope.database.exportApp = exportApp;
        scope.database.printMetadata = printMetadata;
        scope.database.checkLoggedInUserPermission =
            checkLoggedInUserPermission;
        scope.database.updateFilteredItemField =
            scope.database.catalogCtrl.updateFilteredItemField;
        scope.database.refreshFilterFields =
            scope.database.catalogCtrl.refreshFilterFields;
        scope.database.loggedInUser = { permission: '' };
        scope.database.adminOnlyDbSetPublic = CONFIG['adminOnlyDbSetPublic'];
        scope.database.adminOnlyDbSetDiscoverable =
            CONFIG['adminOnlyDbSetDiscoverable'];
        scope.database.adminOnlyDbAddAccess = CONFIG['adminOnlyDbAddAccess'];
        scope.database.adminOnlyDbAdd = CONFIG['adminOnlyDbAdd'];
        scope.database.adminOnlyDbDelete = CONFIG['adminOnlyDbDelete'];
        scope.database.security = false;
        if (CONFIG.hasOwnProperty('security')) {
            scope.database.security = CONFIG.security;
        }

        /** State */
        /**
         * @name updateNavigation
         * @desc called when a route changes
         * @returns {void}
         */
        function updateNavigation(): void {
            // save the state
            scope.database.state = $state.current.name;

            // save the appId
            scope.database.appId = $stateParams.database;

            if (!scope.database.appId) {
                $state.go('home.catalog');
                return;
            }

            updateApp();
        }

        /**
         * @name navigateState
         * @desc navigate to a new state
         * @param state - state to navigate to
         */
        function navigateState(state: string): void {
            $state.go(state);
        }

        /** Updates */
        /**
         * @name updateApp
         * @desc grab the app information
         */
        function updateApp(): void {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    let output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    scope.database.fields.forEach(function (item) {
                        if (output[item]) {
                            if (
                                scope.database.fieldOptions[item]
                                    .display_options !== 'markdown' &&
                                scope.database.fieldOptions[item]
                                    .display_options !== 'textarea' &&
                                scope.database.fieldOptions[item]
                                    .display_options !== 'input' &&
                                scope.database.fieldOptions[item]
                                    .display_options !== 'single-typeahead'
                            ) {
                                // if single - setup as an array
                                if (!Array.isArray(output[item])) {
                                    output[item] = [output[item]];
                                }
                                for (let i = 0; i < output[item].length; i++) {
                                    setFieldOptionColor(output[item][i], item);
                                }
                            }
                        }
                    });

                    scope.database.appInfo = output;
                    getDatabaseImage();

                    if (response.pixelReturn[1]) {
                        output = response.pixelReturn[1].output;
                        type = response.pixelReturn[1].operationType;

                        if (type.indexOf('ERROR') > -1) {
                            return;
                        }

                        formatUsers(output);
                    }
                }
            );

            const commandList = [
                {
                    meta: true,
                    type: 'databaseInfo',
                    components: [scope.database.appId],
                    terminal: true,
                },
            ];

            if (scope.database.loggedInUser.permission) {
                commandList.push({
                    meta: true,
                    type: 'databaseUsers',
                    components: [scope.database.appId],
                    terminal: true,
                });
            }
            semossCoreService.emit('query-pixel', {
                commandList: commandList,
                response: message,
            });
        }

        /**
         * @name getDatabaseImage
         * @desc gets the url for the database's image
         */
        function getDatabaseImage() {
            const imageUpdates = semossCoreService.getOptions('imageUpdates');

            if (imageUpdates[scope.database.appInfo.database_id]) {
                scope.database.appInfo.image =
                    imageUpdates[scope.database.appInfo.database_id];
            } else {
                scope.database.appInfo.image =
                    semossCoreService.app.generateDatabaseImageURL(
                        scope.database.appInfo.database_id
                    );
            }
        }

        /** Edit */

        /**
         * @name openEdit
         * @desc open the overlay
         */
        function openEdit(): void {
            scope.database.edit.open = true;
        }

        /** Request*/

        /**
         * @name openRequest
         * @desc open the overlay
         */
        function openRequest(): void {
            scope.database.request.open = true;
        }

        /** Export */
        /**
         * @name exportApp
         * @desc Generates a ZIP file containing the given database and prompts user to save
         */
        function exportApp(): void {
            const message = semossCoreService.utility.random('export');

            // register message to come back to
            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    const output = response.pixelReturn[0].output,
                        insightID = response.insightID;

                    monolithService.downloadFile(insightID, output);

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully exported database: ' +
                            scope.database.appId,
                    });
                }
            );

            semossCoreService.emit('meta-pixel', {
                insightID: 'new',
                commandList: [
                    {
                        meta: true,
                        type: 'exportDatabase',
                        components: [scope.database.appId],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /**
         * @name exportApp
         * @desc Generates a ZIP file containing the given database and prompts user to save
         */
        function printMetadata(): void {
            const message = semossCoreService.utility.random('printMetadata');

            // register message to come back to
            semossCoreService.once(
                message,
                function (response: PixelReturnPayload) {
                    const output = response.pixelReturn[0].output,
                        insightID = response.insightID;

                    monolithService.downloadFile(insightID, output);

                    semossCoreService.emit('alert', {
                        color: 'success',
                        text:
                            'Successfully exported metadata: ' +
                            scope.database.appId,
                    });
                }
            );

            semossCoreService.emit('meta-pixel', {
                insightID: 'new',
                commandList: [
                    {
                        meta: true,
                        type: 'printMetadata',
                        components: [scope.database.appId],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }

        /** Utility */

        /**
         * @name formatUsers
         * @desc format list of users
         * @param  users  array of users
         */
        function formatUsers(users: any[]): void {
            scope.database.appUsers = {
                // wipe app users to start anew
                authors: [],
                editors: [],
                viewers: [],
                authorsClean: '',
                editorsClean: '',
                viewersClean: '',
            };

            for (let i = 0, len = users.length; i < len; i++) {
                if (users[i].permission === 'OWNER') {
                    scope.database.appUsers.authors.push(users[i]);
                    if (scope.database.appUsers.authors.length === 1) {
                        scope.database.appUsers.authorsClean += users[i].name;
                    } else {
                        scope.database.appUsers.authorsClean +=
                            ', ' + users[i].name;
                    }
                } else if (users[i].permission === 'EDIT') {
                    scope.database.appUsers.editors.push(users[i]);
                    if (scope.database.appUsers.editors.length === 1) {
                        scope.database.appUsers.editorsClean += users[i].name;
                    } else {
                        scope.database.appUsers.editorsClean +=
                            ', ' + users[i].name;
                    }
                } else if (users[i].permission === 'READ_ONLY') {
                    scope.database.appUsers.viewers.push(users[i]);
                    if (scope.database.appUsers.viewers.length === 1) {
                        scope.database.appUsers.viewersClean += users[i].name;
                    } else {
                        scope.database.appUsers.viewersClean +=
                            ', ' + users[i].name;
                    }
                }
            }
        }

        /**
         * @name setFieldOptionColor
         * @desc sets the field color pseudo-randomly
         * @param option - field option
         * @param field - metakey field
         */
        function setFieldOptionColor(opt: string, field: string): void {
            if (
                !scope.database.fieldOptions[field].mapping.hasOwnProperty(opt)
            ) {
                const charCode = opt
                    .split('')
                    .map((x) => x.charCodeAt(0))
                    .reduce((a, b) => a + b);
                const color =
                    scope.database.fieldOptions[field].options[charCode % 8];
                scope.database.fieldOptions[field].mapping[opt] = color;
            }
        }

        /*
         ** getting the permissions of logged in user
         */
        function checkLoggedInUserPermission() {
            if (!$stateParams.database) return;
            monolithService
                .getUserDBPermission($stateParams.database)
                .then(function (response) {
                    if (
                        response.data.permission &&
                        scope.database.loggedInUser &&
                        scope.database.loggedInUser.permission !==
                            response.data.permission
                    ) {
                        if (
                            scope.database.loggedInUser.permission !==
                                response.data.permission &&
                            scope.database.loggedInUser.permission !== ''
                        ) {
                            scope.database.catalogCtrl.updateFilteredItemsPermission(
                                scope.database.appId,
                                response.data.permission
                            );
                        }
                        scope.database.loggedInUser.permission =
                            response.data.permission;
                    }
                });
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            const navigationListener = $transitions.onSuccess(
                    {},
                    updateNavigation
                ),
                databaseListener = semossCoreService.on(
                    'update-app',
                    function () {
                        getDatabaseImage();
                    }
                );

            
            // app-defined filter fields
            scope.database.CONFIG.databaseMetaKeys.forEach(function (item) {
                const metaKey = item.metakey;
                scope.database.fields.push(metaKey);
                scope.database.fieldOptions[metaKey] = {
                    ...item,
                    ...scope.database.defaultFieldOptions,
                };

                // update 'tag' color
                if (
                    item.display_options !== 'markdown' &&
                    item.display_options !== 'textarea' &&
                    item.display_options !== 'input' &&
                    item.display_options !== 'single-typeahead'
                ) {
                    const watched = `database.appInfo["${metaKey}"]`;
                    scope.$watch(watched, function (newValue, oldValue) {
                        if (newValue && !angular.equals(newValue, oldValue)) {
                            const newVal = newValue
                                ? !Array.isArray(newValue)
                                    ? [newValue]
                                    : newValue
                                : [];
                            for (let i = 0; i < newVal.length; i++) {
                                setFieldOptionColor(newVal[i], metaKey);
                            }
                        }
                    });
                }
            });

            scope.$on('$destroy', function () {
                navigationListener();
                databaseListener();
            });

            checkLoggedInUserPermission();
            updateNavigation();
        }

        initialize();
    }
}
