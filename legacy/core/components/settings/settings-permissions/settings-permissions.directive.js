'use strict';

import './settings-permissions.scss';
// import { database } from '../../../store/pixel/reactors';

export default angular
    .module('app.settings.settings-permissions', [])
    .directive('settingsPermissions', settingsPermissionsDirective);

settingsPermissionsDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$q',
    '$timeout',
];

function settingsPermissionsDirective(
    monolithService,
    semossCoreService,
    $q,
    $timeout
) {
    settingsPermissionsCtrl.$inject = ['$scope'];
    settingsPermissionsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./settings-permissions.directive.html'),
        controller: settingsPermissionsCtrl,
        link: settingsPermissionsLink,
        require: ['^settings'],
        scope: {},
        bindToController: {
            user: '=',
            type: '=',
            accessall: '=',
        },
        controllerAs: 'settingsPermissions',
    };

    function settingsPermissionsCtrl() {}

    function settingsPermissionsLink(scope, ele, attrs, ctrl) {
        scope.settingsCtrl = ctrl[0];
        scope.settingsPermissions.confirmAddPermissionsAll =
            confirmAddPermissionsAll;
        scope.settingsPermissions.setUserAppPermissions = setUserAppPermissions;
        scope.settingsPermissions.getUserPermissions = getUserPermissions;
        scope.settingsPermissions.setUserInsightPermissions =
            setUserInsightPermissions;
        scope.settingsPermissions.savePermissionsAll = savePermissionsAll;
        scope.settingsPermissions.closeAddProjectPermissionsOverlay =
            closeAddProjectPermissionsOverlay;
        scope.settingsPermissions.getInsights = getInsights;

        scope.settingsPermissions.DBList = [];
        scope.settingsPermissions.projectList = [];
        scope.settingsPermissions.projId = '';
        scope.settingsPermissions.queuedAdd = [];
        scope.settingsPermissions.insights = {
            list: [],
        };

        /**
         * @name closeAddProjectPermissionsOverlay
         * @desc close overlay for adding project permissions
         * @returns {void}
         */
        function closeAddProjectPermissionsOverlay() {
            scope.settingsCtrl.overlay.openAddAppPermissions = false;
            scope.settingsPermissions.getUserPermissions(
                scope.settingsPermissions.type
            );
        }

        /**
         * @name confirmAddPermissionsAll
         * @param {string} permission the permission to give
         * @param {string} isAddNew whether user will be granted access to dbs/projects/insights with new or existing privileges
         * @param {*} givePermissionTo user to give permission to
         * @param {string} type 'Projects', 'Insights', or 'Databases'
         * @desc add permissions for all of the users within an app
         * @returns {void}
         */
        function confirmAddPermissionsAll(
            permission,
            isAddNew,
            givePermissionTo,
            type
        ) {
            scope.settingsPermissions.accessAllOverlay = {
                show: true,
                isAddNew: isAddNew,
                permission: permission,
                type: type,
                givePermissionTo: givePermissionTo,
            };
        }

        /**
         * @name setUserAppPermissions
         * @param {*} item - the item to modify
         * @param {*} permission the permission to give
         * @returns {void}
         */
        function setUserAppPermissions(item, permission) {
            let hasExistingPermissions =
                    item.og_author || item.og_editor || item.og_read_only,
                ogValue = 'og_' + permission,
                dbPermission = '';

            if (permission === 'author') {
                dbPermission = 'OWNER';
            } else if (permission === 'editor') {
                dbPermission = 'EDIT';
            } else if (permission === 'read_only') {
                dbPermission = 'READ-ONLY';
            }

            scope.settingsPermissions.type === 'Projects';

            if (hasExistingPermissions) {
                // here we will either edit the user access level or delete them from a db. if the og value is true then we will delete them
                if (item[ogValue]) {
                    // user already has access to all the insights --> remove their access
                    const success = function () {
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Permission has been removed.',
                            });
                            if (!item.new) {
                                getUserPermissions(
                                    scope.settingsPermissions.type
                                );
                            }
                            item[ogValue] = false;
                        },
                        error = function (response) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text:
                                    response.data.errorMessage ||
                                    'An error occurred while removing permissions.',
                            });
                            if (!item.new) {
                                getUserPermissions(
                                    scope.settingsPermissions.type
                                );
                            }
                        };

                    if (scope.settingsPermissions.type === 'Projects') {
                        monolithService
                            .removeProjectUserPermission(
                                true,
                                item.project_id,
                                scope.settingsPermissions.user.id
                            )
                            .then(success, error);
                    } else if (scope.settingsPermissions.type === 'Databases') {
                        monolithService
                            .removeDBUserPermission(
                                true,
                                item.app_id,
                                scope.settingsPermissions.user.id
                            )
                            .then(success, error);
                    }
                } else {
                    const success = function () {
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Permission has been modified.',
                            });
                            if (item.new) {
                                // remove original checkmarks
                                if (item.og_author) {
                                    item.og_author = false;
                                    item.author = false;
                                } else if (item.og_editor) {
                                    item.og_editor = false;
                                    item.editor = false;
                                } else if (item.og_read_only) {
                                    item.og_read_only = false;
                                    item.read_only = false;
                                }
                                item[ogValue] = true;
                            } else {
                                getUserPermissions(
                                    scope.settingsPermissions.type
                                );
                            }
                        },
                        error = function (response) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text:
                                    response.data.errorMessage ||
                                    'An error occurred while modifying permissions.',
                            });
                            if (!item.new) {
                                getUserPermissions(
                                    scope.settingsPermissions.type
                                );
                            }
                        };

                    if (scope.settingsPermissions.type === 'Projects') {
                        monolithService
                            .editProjectUserPermission(
                                true,
                                item.project_id,
                                scope.settingsPermissions.user.id,
                                dbPermission
                            )
                            .then(success, error);
                    } else if (scope.settingsPermissions.type === 'Databases') {
                        monolithService
                            .editDBUserPermission(
                                true,
                                item.app_id,
                                scope.settingsPermissions.user.id,
                                dbPermission
                            )
                            .then(success, error);
                    }
                }
            } else {
                const success = function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Permission has been added.',
                        });

                        // user has no access to this db so we will add them
                        item[ogValue] = true;
                        item.new = true;
                    },
                    error = function (response) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text:
                                response.data.errorMessage ||
                                'An error occurred while adding permissions.',
                        });
                    };

                if (scope.settingsPermissions.type === 'Projects') {
                    monolithService
                        .addProjectUserPermission(
                            true,
                            item.project_id,
                            scope.settingsPermissions.user.id,
                            dbPermission
                        )
                        .then(success, error);
                } else if (scope.settingsPermissions.type === 'Databases') {
                    monolithService
                        .addDBUserPermission(
                            true,
                            item.app_id,
                            scope.settingsPermissions.user.id,
                            dbPermission
                        )
                        .then(success, error);
                }
            }
        }

        /**
         * @name setUserInsightPermissions
         * @param {any} app the associated app being modified
         * @param {number} index the index of insight to modify
         * @param {string} permission the permission to give
         * @returns {void}
         */
        function setUserInsightPermissions(app, index, permission) {
            let hasExistingPermissions =
                    app.og_author || app.og_editor || app.og_read_only,
                ogValue = 'og_' + permission,
                // insightObj = scope.settingsPermissions.DBList[index],
                dbPermission = '';

            // transform to how it's stored in the DB
            if (permission === 'author') {
                dbPermission = 'OWNER';
                app.editor = false;
                app.read_only = false;
            } else if (permission === 'editor') {
                dbPermission = 'EDIT';
                app.author = false;
                app.read_only = false;
            } else if (permission === 'read_only') {
                dbPermission = 'READ-ONLY';
                app.author = false;
                app.editor = false;
            }

            if (hasExistingPermissions) {
                // here we will either edit the user access level or delete them from a db. if the og value is true then we will delete them
                if (app[ogValue]) {
                    // delete their user access
                    monolithService
                        .removeInsightUserPermission(
                            app.project_id,
                            app.insight_id,
                            scope.settingsPermissions.user.id,
                            true
                        )
                        .then(
                            function () {
                                semossCoreService.emit('alert', {
                                    color: 'success',
                                    text: 'Permission has been removed.',
                                });
                            },
                            function (error) {
                                semossCoreService.emit('alert', {
                                    color: 'error',
                                    text:
                                        error.data.errorMessage ||
                                        'An error occurred while removing permissions.',
                                });
                            }
                        );
                } else {
                    // edit their user access
                    monolithService
                        .editInsightUserPermission(
                            app.project_id,
                            app.insight_id,
                            scope.settingsPermissions.user.id,
                            dbPermission,
                            true
                        )
                        .then(
                            function () {
                                semossCoreService.emit('alert', {
                                    color: 'success',
                                    text: 'Permission has been modified.',
                                });
                                // update OG status
                                if (app.og_author) {
                                    app.og_author = false;
                                } else if (app.og_editor) {
                                    app.og_editor = false;
                                } else if (app.og_read_only) {
                                    app.og_read_only = false;
                                }
                                app[ogValue] = true;
                            },
                            function (error) {
                                semossCoreService.emit('alert', {
                                    color: 'error',
                                    text:
                                        error.data.errorMessage ||
                                        'An error occurred while modifying permissions.',
                                });
                            }
                        );
                }
            } else {
                // user has no access to this db so we will add them as a user.
                monolithService
                    .addInsightUserPermission(
                        app.project_id,
                        app.insight_id,
                        scope.settingsPermissions.user.id,
                        dbPermission,
                        true
                    )
                    .then(
                        function () {
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Permission has been added.',
                            });
                        },
                        function (error) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text:
                                    error.data.errorMessage ||
                                    'An error occurred while adding permissions.',
                            });
                        }
                    );
            }
        }

        /**
         * @name savePermissionsAll
         * @param {boolean} isAddNew whether permissions are being added for new or existing users
         * @param {string} permission read-only, author, or editor
         * @param {string} givePermissionTo the project id
         * @param {string} type 'Projects', 'Insights', or 'Databases'
         * @desc Function to give DB permissions to all apps/insights for a user OR all users for an app/insight
         * Function will send object to BE for updates
         * @returns {void}
         */
        function savePermissionsAll(
            isAddNew,
            permission,
            givePermissionTo,
            type
        ) {
            // TODO: currently there is no separation between adding new vs existing users
            scope.settingsPermissions.accessAllOverlay.show = false;
            scope.settingsCtrl.overlay.openAddAppPermissions = false;

            if (type === 'Databases') {
                // TODO: this is currently setting all the permissions to read-only... need to investigate why
                monolithService
                    .grantAllDBs(givePermissionTo.id, permission, isAddNew)
                    .then(function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully added permission information for the database.',
                        });
                        $timeout(function () {
                            getUserPermissions('Databases');
                        }, 500);
                    });
            } else if (type === 'Insights') {
                monolithService
                    .grantAllProjectInsights(
                        scope.settingsPermissions.projId,
                        givePermissionTo.id,
                        permission,
                        isAddNew
                    )
                    .then(function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully added permission information for the insight.',
                        });
                        $timeout(function () {
                            getInsights(scope.settingsPermissions.projId);
                        }, 500);
                    });
            } else {
                // Projects
                monolithService
                    .grantAllProjects(givePermissionTo.id, permission, isAddNew)
                    .then(function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully added permission information for the project.',
                        });
                        $timeout(function () {
                            getAllProjects();
                        }, 500);
                    });
            }
        }

        /**
         * @name getAllDBs
         * @desc get all the available databases
         * @returns {void}
         */
        function getAllDBs() {
            monolithService.getDBs(true).then(function (data) {
                scope.settingsPermissions.DBList =
                    semossCoreService.utility.freeze(data.data);
                getUserPermissions('Databases');
            });
        }

        /**
         * @name getAllProjects
         * @desc get all the available projects
         * @returns {void}
         */
        function getAllProjects() {
            monolithService.getProjects(true).then(function (data) {
                scope.settingsPermissions.projectList =
                    semossCoreService.utility.freeze(data.data);
                getUserPermissions('Projects');
            });
        }

        /**
         * @name getUserPermissions
         * @param {string} type 'Projects' or 'Databases'
         * @desc gets the user's permissions
         * @returns {void}
         */
        function getUserPermissions(type) {
            if (type === 'Projects') {
                monolithService
                    .getAllUserProjects(scope.settingsPermissions.user.id)
                    .then(function (response) {
                        getUserPermissionsHelper(
                            scope.settingsPermissions.projectList,
                            response
                        );
                    });
            } else {
                monolithService
                    .getAllUserDbs(scope.settingsPermissions.user.id)
                    .then(function (response) {
                        getUserPermissionsHelper(
                            scope.settingsPermissions.DBList,
                            response
                        );
                    });
            }
        }

        /**
         * @name getUserPermissionsHelper
         * @param {*} itemList either the list of all databases (DBList) or the list of all projects (projectList)
         * @param {*} response the data returned from the getAllUserProjects / getAllUserDbs call
         * @desc gets the user's permissions
         * @returns {void}
         */
        function getUserPermissionsHelper(itemList, response) {
            // get the correct keys
            const id =
                    scope.settingsPermissions.type === 'Projects'
                        ? 'project_id'
                        : 'app_id',
                permission =
                    scope.settingsPermissions.type === 'Projects'
                        ? 'project_permission'
                        : 'app_permission';

            if (itemList.length === response.length) {
                scope.settingsCtrl.allAppAccess = true;
            } else {
                scope.settingsCtrl.allAppAccess = false;
            }

            if (response.length === 0) {
                scope.settingsPermissions.noAppAccess = true;
                return;
            }
            for (let i = 0; i < itemList.length; i++) {
                itemList[i].author = false;
                itemList[i].editor = false;
                itemList[i].read_only = false;

                itemList[i].og_author = false;
                itemList[i].og_editor = false;
                itemList[i].og_read_only = false;

                itemList[i].expanded = false;
                itemList[i].access = false;
                for (
                    let selectedIdx = 0;
                    selectedIdx < response.length;
                    selectedIdx++
                ) {
                    if (itemList[i][id] === response[selectedIdx][id]) {
                        // OWNER, EDIT, READ_ONLY
                        itemList[i].access = true;
                        itemList[i].author =
                            response[selectedIdx][permission] === 'OWNER';
                        itemList[i].editor =
                            response[selectedIdx][permission] === 'EDIT';
                        itemList[i].read_only =
                            response[selectedIdx][permission] === 'READ_ONLY';

                        // need to keep track of original values so we know whether to do add/edit/delete when values change
                        itemList[i].og_author = itemList[i].author;
                        itemList[i].og_editor = itemList[i].editor;
                        itemList[i].og_read_only = itemList[i].read_only;
                        break;
                    }
                }
            }
        }

        /**
         * @name getInsights
         * @param {string} projectId the project id to get insights for
         * @desc get the insights for the selected project id
         * @returns {void}
         */
        function getInsights(projectId) {
            monolithService
                .getAllProjectInsightUsers(
                    projectId,
                    scope.settingsPermissions.user.id
                )
                .then(function (response) {
                    for (let i = 0; i < response.data.length; i++) {
                        response.data[i].author = false;
                        response.data[i].editor = false;
                        response.data[i].read_only = false;
                        response.data[i].og_author = false;
                        response.data[i].og_editor = false;
                        response.data[i].og_read_only = false;

                        if (response.data[i].insight_permission === 'OWNER') {
                            response.data[i].author = true;
                            response.data[i].og_author = true;
                        } else if (
                            response.data[i].insight_permission === 'EDIT'
                        ) {
                            response.data[i].editor = true;
                            response.data[i].og_editor = true;
                        } else if (
                            response.data[i].insight_permission === 'READ_ONLY'
                        ) {
                            response.data[i].read_only = true;
                            response.data[i].og_read_only = true;
                        }
                    }
                    scope.settingsPermissions.insights.list = response.data;
                });
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.$watch('settingsPermissions.type', function () {
                // since settings-permission is used in the admin tab for multiple tabs, we want to make sure to reload when the tab changes
                scope.settingsPermissions.typeSingular =
                    scope.settingsPermissions.type.slice(0, -1);
                if (scope.settingsPermissions.type === 'Databases') {
                    getAllDBs();
                } else {
                    getAllProjects();
                }
            });
        }

        initialize();
    }
}
