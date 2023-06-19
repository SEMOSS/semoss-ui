'use strict';

import './settings-list-item.scss';
import Utility from '../../../utility/utility';

export default angular
    .module('app.settings.settings-list-item', [])
    .directive('settingsListItem', settingsListItemDirective);

settingsListItemDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$q',
    '$timeout',
];

function settingsListItemDirective(monolithService, semossCoreService) {
    settingsListItemCtrl.$inject = ['$scope'];
    settingsListItemLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./settings-list-item.directive.html'),
        controller: settingsListItemCtrl,
        link: settingsListItemLink,
        require: ['^settings'],
        scope: {},
        bindToController: {
            type: '=',
            item: '=',
            admin: '=',
            selected: '=',
        },
        controllerAs: 'settingsListItem',
    };

    function settingsListItemCtrl() {}

    function settingsListItemLink(scope, ele, attrs, ctrl) {
        scope.settingsCtrl = ctrl[0];
        scope.settingsListItem.openDelete = openDelete;
        scope.settingsListItem.removeDB = removeDB;
        scope.settingsListItem.removeProject = removeProject;
        scope.settingsListItem.setItemVisibility = setItemVisibility;
        scope.settingsListItem.setItemGlobal = setItemGlobal;

        scope.settingsListItem.typeSingular = '';
        scope.settingsListItem.openDeleteApp = {
            open: false,
            name: '',
            app: '',
        };

        /**
         * @name setItemVisibility
         * @param {string} itemId the project/db id
         * @param {boolean} visibility visibility of item
         * @param {any} itemType visibility of item
         * @desc Function to set visibility for projects/dbs
         * @returns {void}
         */
        function setItemVisibility(itemId, visibility, itemType) {
            if (itemType === 'Projects') {
                monolithService.setProjectVisibility(itemId, visibility).then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Updated project visibility',
                        });
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
            } else {
                // DB
                monolithService.setDBVisibility(itemId, visibility).then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Updated database visibility',
                        });
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
            }
        }

        /**
         * @name setItemGlobal
         * @param {boolean} admin true or false
         * @param {string} itemId - id of project
         * @param {boolean} isPublic - boolean
         * @param {string} itemType - 'Projects' or 'Databases'
         * @desc set db to public or private
         * @returns {void}
         */
        function setItemGlobal(admin, itemId, isPublic, itemType) {
            if (itemType === 'Projects') {
                monolithService.setProjectGlobal(admin, itemId, isPublic).then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text:
                                'You have successfully made the project ' +
                                (isPublic ? 'public.' : 'private.'),
                        });
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
            } else {
                // DB
                monolithService.setDBGlobal(admin, itemId, isPublic).then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text:
                                'You have successfully made the database ' +
                                (isPublic ? 'public.' : 'private.'),
                        });
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
            }
        }

        /**
         * @name openDelete
         * @desc Opens or closes the delete overlay and sets the app id to delete
         * @param {string} app - the app to delete
         * @param {string} name - name of the app to delete
         * @returns {void}
         */
        function openDelete(app, name) {
            scope.settingsListItem.openDeleteApp = {
                open: true,
                name: name,
                app: app,
            };
        }

        /**
         * @name removeDB
         * @desc deletes database
         * @param {string} dbId - the database to delete
         * @returns {void}
         */
        function removeDB(dbId) {
            const message = Utility.random('delete-app-start');
            scope.settingsListItem.openDeleteApp.open = false;
            scope.settingsListItem.openDeleteApp.app = '';
            semossCoreService.once(message, (response) => {
                const opType = response.pixelReturn[0].operationType;
                if (opType.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully deleted database.',
                    });
                    scope.settingsCtrl.getDBs(scope.settingsListItem.admin);
                }
            });
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'deleteDatabase',
                        components: [[dbId]],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name removeProject
         * @desc deletes project
         * @param {string} projId - the project to delete
         * @returns {void}
         */
        function removeProject(projId) {
            const message = Utility.random('delete-project-start');
            scope.settingsListItem.openDeleteApp.open = false;
            scope.settingsListItem.openDeleteApp.app = '';
            semossCoreService.once(message, (response) => {
                const opType = response.pixelReturn[0].operationType;
                if (opType.indexOf('ERROR') === -1) {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully deleted project.',
                    });
                    scope.settingsCtrl.getProjects(
                        scope.settingsListItem.admin
                    );
                }
            });
            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        meta: true,
                        type: 'deleteProject',
                        components: [[projId]],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.settingsListItem.typeSingular =
                scope.settingsListItem.type.slice(0, -1);
        }

        initialize();
    }
}
