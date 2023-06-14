'use strict';

import './settings.scss';

import './settings-insights/settings-insights.directive.js';
import './settings-theme/settings-theme.directive.js';
import './settings-query/settings-query.directive.js';
import './settings-social/settings-social.directive.js';
import './settings-permissions/settings-permissions.directive.js';
import './settings-general/settings-general.directive.js';
import './settings-admin/settings-admin.directive.js';
import './settings-table/settings-table.directive.js';
import './settings-list-item/settings-list-item.directive.js';

export default angular
    .module('app.settings.directive', [
        'app.settings.settings-insights',
        'app.settings.settings-theme',
        'app.settings.settings-query',
        'app.settings.settings-social',
        'app.settings.settings-permissions',
        'app.settings.settings-general',
        'app.settings.settings-admin',
        'app.settings.settings-table',
        'app.settings.settings-list-item',
    ])
    .directive('settings', settingsDirective);

settingsDirective.$inject = [
    'monolithService',
    '$state',
    'semossCoreService',
    '$q',
    'CONFIG',
    '$timeout',
];

function settingsDirective(
    monolithService,
    $state,
    semossCoreService,
    $q,
    CONFIG,
    $timeout
) {
    settingsCtrl.$inject = [];
    settingsLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./settings.directive.html'),
        controller: settingsCtrl,
        link: settingsLink,
        scope: {},
        bindToController: {},
        controllerAs: 'settings',
    };

    function settingsCtrl() {}

    function settingsLink(scope) {
        scope.settings.securityEnabled = true;
        scope.settings.TRUE = true;
        scope.settings.FALSE = false;
        scope.settings.CONFIG = CONFIG;
        scope.settings.selectedPage = 'project-permissions';
        scope.settings.allUsers = [];
        scope.settings.projectOwnInfo = [];
        scope.settings.projectAdminOwnInfo = [];
        scope.settings.DBAdminOwnInfo = [];
        scope.settings.DBOwnInfo = [];
        scope.settings.permissionInfo = [];
        scope.settings.permissionTemp = {};
        scope.settings.tempPerm = [];
        scope.settings.addUserPerm = [];
        scope.settings.editUserPerm = [];
        scope.settings.userInfo = [];
        scope.settings.removeUser = false;
        scope.settings.editPermissions = false;
        scope.settings.adminUser = false;
        scope.settings.userRegistrationState = false;
        scope.settings.editUserClose = false;
        scope.settings.overlay = {
            openAddInsightPermissions: false,
            openUserProject: false,
            openAddAppPermissions: false,
        };
        scope.settings.addUserPermissionsOverlay = {
            show: false,
            item: {},
            type: '',
            isAdminTab: false,
        };
        scope.settings.confirmDeleteOverlay = {
            show: false,
            isAdmin: false,
        };

        scope.settings.changePage = changePage;
        scope.settings.confirmAddPermissionsAll = confirmAddPermissionsAll;
        scope.settings.exitSettings = exitSettings;
        scope.settings.getDBs = getDBs;
        scope.settings.getProjects = getProjects;
        scope.settings.getInsightUsersNoCredentials =
            getInsightUsersNoCredentials;
        scope.settings.getItemUsersNoCredentials = getItemUsersNoCredentials;
        scope.settings.getDBUsers = getDBUsers;
        scope.settings.getProjectUsers = getProjectUsers;
        scope.settings.setTempPerm = setTempPerm;
        scope.settings.savePermissions = savePermissions;
        scope.settings.updatePermissions = updatePermissions;
        scope.settings.changeTempPerm = changeTempPerm;
        scope.settings.removeFromTempPerm = removeFromTempPerm;
        scope.settings.updateItemData = updateItemData;
        scope.settings.demoteSelf = demoteSelf;
        scope.settings.setInsightGlobal = setInsightGlobal;
        scope.settings.getAllUsers = getAllUsers;
        scope.settings.openAddUserPermOverlay = openAddUserPermOverlay;
        scope.settings.closeAddUserPermOverlay = closeAddUserPermOverlay;

        scope.settings.permissionOptions = [
            {
                display: 'Author',
                value: 'OWNER',
            },
            {
                display: 'Editor',
                value: 'EDIT',
            },
            {
                display: 'Read-Only',
                value: 'READ_ONLY',
            },
        ];

        /**
         * @name changePage
         * @desc changes the page when a tab is selected
         * @param {string} page selected page
         * @returns {void}
         */
        function changePage(page) {
            scope.settings.selectedPage = page;

            scope.settings.getAllUsers(); // TODO: do we need to get the list of users every time?
            if (page === 'database-permissions') {
                scope.settings.getDBs(false);
            } else if (page === 'project-permissions') {
                scope.settings.getProjects(false);
            } else if (page === 'admin-permissions') {
                scope.settings.getProjects(true); // Projects is the default tab for admin permissions, so we grab the projects first
            }
        }

        /**
         * @name confirmAddPermissionsAll
         * @param {string} permission the permission to give
         * @param {boolean} isNewAdd whether the users/projects/dbs being added are new or existing
         * @param {*} givePermissionTo app, user, or insight to give permission to
         * @param {string} type 'Databases', 'Projects', 'Insights', ir 'Users'
         * @desc add permissions for all of the users within an app
         * @returns {void}
         */
        function confirmAddPermissionsAll(
            permission,
            isNewAdd,
            givePermissionTo,
            type
        ) {
            scope.settings.accessAllOverlay = {
                show: true,
                permission: permission,
                isNewAdd: isNewAdd,
                type: type,
                givePermissionTo: givePermissionTo,
            };
        }
        /**
         * @name openAddUserPermOverlay
         * @desc prepares the data that is used in the add user permissions overlay
         * @param {any} item the selected db / project that is being updated
         * @param {string} type 'Databases' or 'Projects'
         * @param {boolean} isAdminTab whether we are on the Admin Permissions tab or not
         * @returns {void}
         */
        function openAddUserPermOverlay(item, type, isAdminTab) {
            scope.settings.getItemUsersNoCredentials(isAdminTab, item.id, type); // load the users that don't have currently have access to the db / project
            scope.settings.addUserPermissionsOverlay = {
                show: true,
                item: item,
                type: type,
                isAdminTab: isAdminTab,
            };
        }

        /**
         * @name closeAddUserPermOverlay
         * @desc closes the add user permissions overlay and resets its data
         * @returns {void}
         */
        function closeAddUserPermOverlay() {
            clearPermissionInfo(); // clear the saved info
            // reload the project / database users
            if (scope.settings.addUserPermissionsOverlay.type === 'Projects') {
                scope.settings.getProjectUsers(
                    false,
                    scope.settings.addUserPermissionsOverlay.item.id
                );
            } else {
                scope.settings.getDBUsers(
                    false,
                    scope.settings.addUserPermissionsOverlay.item.id
                );
            }
            // reset the overlay data
            scope.settings.addUserPermissionsOverlay = {
                show: false,
                item: {},
                type: '',
                isAdminTab: false,
            };
            // clear the list of users who do not have permissions to the project/db
            scope.settings.noCredentialsUserData = [];
        }

        /**
         * @name getAllUsers
         * @desc Function to get group data from BE
         * @returns {void}
         */
        function getAllUsers() {
            if (scope.settings.adminUser) {
                // TODO: does this mean that non-admin users cannot add a new user to a project/db?
                monolithService.getAllUsers().then(
                    function (data) {
                        scope.settings.allUsers = data;
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
         * @name updateItemData
         * @desc update the data displayed for a given app
         * @param {any} selected the app being swtiched to
         * @param {boolean} admin the app being swtiched to
         * @param {any} itemType Projects or Databases
         * @returns {void}
         */
        function updateItemData(selected, admin, itemType) {
            if (itemType === 'Projects') {
                scope.settings.project = selected; // update to the selected project
                if (selected.project_permission !== 'READ_ONLY') {
                    // (if project is read only, we can't view its users)
                    getProjectUsers(admin, selected.project_id); // get the users for the selected project
                }
                scope.settings.selectedInsight = null;
            } else {
                // DBs
                scope.settings.db = selected; // updated to the selected DB
                if (selected.app_permission !== 'READ_ONLY') {
                    // (if db is read only, we can't view its users)
                    getDBUsers(admin, selected.app_id); // get the users for the selected db
                }
            }
        }

        /**
         * @name demoteSelf
         * @param {string} type Projects or Databases
         * @desc demote my own priveleges and close the self demote overlay
         * @returns {void}
         */
        function demoteSelf(type) {
            if (type === 'Projects') {
                changeTempPerm(
                    scope.settings.confirmPermission,
                    scope.settings.confirmPermission.permission,
                    false
                );
                savePermissions(false, scope.settings.project.project_id, type);
                scope.settings.project.project_permission =
                    scope.settings.confirmPermission.permission;
            } else {
                // DB
                changeTempPerm(
                    scope.settings.confirmPermission,
                    scope.settings.confirmPermission.permission,
                    false
                );
                savePermissions(false, scope.settings.db.app_id, type);
                scope.settings.db.app_permission =
                    scope.settings.confirmPermission.permission;
            }
            scope.settings.warnSelfDemote = false;
        }

        /**
         * @name exitSettings
         * @desc return to home page
         * @returns {void}
         */
        function exitSettings() {
            $state.go('home.landing');
        }

        /**
         * @name isAdmin
         * @desc check if user is admin
         * @returns {void}
         */
        function isAdmin() {
            monolithService.isAdmin().then(function (adminUser) {
                scope.settings.adminUser = adminUser;
                getAllUsers();
            });
        }

        /**
         * @name setInsightGlobal
         * @param {string} project the id of the project
         * @param {string} id the insight id
         * @param {*} bool toggle the boolean for public
         * @param {*} admin whether to execute request as admin or not
         * @desc toggle the insight public
         * @returns {void}
         */
        function setInsightGlobal(project, id, bool, admin) {
            monolithService.setInsightGlobal(project, id, bool, admin).then(
                function (response) {
                    if (response.success) {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text:
                                'Successfully made the insight ' +
                                (bool ? 'public.' : 'private.'),
                        });
                    }
                },
                function (response) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: response.data.errorMessage,
                    });
                }
            );
        }

        /**
         * @name setTempPerm
         * @desc Function to set the temporary array for permissions
         * @returns {void}
         */
        function setTempPerm() {
            scope.settings.tempPerm = scope.settings.permissionInfo;
            scope.settings.addUserPerm = [];
            scope.settings.editUserPerm = [];
            scope.settings.removeUserPerm = [];
            scope.settings.addGroupPerm = [];
            scope.settings.removeGroupPerm = [];
        }

        /**
         * @name getProjects
         * @param {boolean} admin admin call or regular call
         * @desc Function to get all projects I own from the BE
         * @returns {void}
         */
        function getProjects(admin) {
            // TODO: should we separate these?
            monolithService.getProjects(admin).then(
                function (data) {
                    let idx,
                        tempData = data.data;

                    if (admin) {
                        tempData.forEach(function (item) {
                            item.name = item.project_name; // generalize the keys so that we can use them more abstractly
                            item.id = item.project_id;
                            item.global = item.project_global;
                        });
                        scope.settings.projectAdminOwnInfo = tempData;
                        getProjectUsers(
                            scope.settings.adminUser,
                            scope.settings.projectAdminOwnInfo[0].project_id
                        );
                        scope.settings.project =
                            scope.settings.projectAdminOwnInfo[0];
                    } else {
                        tempData.forEach(function (item) {
                            item.name = item.project_name;
                            item.id = item.project_id;
                            item.global = item.project_global;
                            item.visibility = item.project_visibility;
                        });

                        // changing the name to reflect what we want to show in the UI
                        for (idx = 0; idx < tempData.length; idx++) {
                            tempData[idx].permissions = {
                                author:
                                    tempData[idx].project_permission ===
                                    'OWNER',
                                editor:
                                    tempData[idx].project_permission === 'EDIT',
                                viewer:
                                    tempData[idx].project_permission ===
                                    'READ_ONLY',
                            };
                        }

                        scope.settings.projectOwnInfo = tempData;
                        getProjectUsers(
                            false,
                            scope.settings.projectOwnInfo[0].project_id
                        );
                        scope.settings.project =
                            scope.settings.projectOwnInfo[0];
                    }
                },
                function (error) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: error.data.errorMessage,
                    });
                }
            );
        }

        /**
         * @name getDBs
         * @param {boolean} admin admin call or regular call
         * @desc Function to get all projects I own from the BE
         * @returns {void}
         */
        function getDBs(admin) {
            monolithService.getDBs(admin).then(
                function (data) {
                    let idx,
                        tempData = data.data;

                    if (admin) {
                        tempData.forEach(function (item) {
                            item.name = item.app_name;
                            item.id = item.app_id;
                            item.global = item.app_global;
                        });
                        scope.settings.DBAdminOwnInfo = tempData;
                        getDBUsers(
                            scope.settings.adminUser,
                            scope.settings.DBAdminOwnInfo[0].app_id
                        );
                        scope.settings.db = scope.settings.DBAdminOwnInfo[0];
                    } else {
                        tempData.forEach(function (item) {
                            item.name = item.app_name;
                            item.id = item.app_id;
                            item.global = item.app_global;
                            item.visibility = item.app_visibility;
                        });

                        // changing the name to reflect what we want to show in the UI
                        for (idx = 0; idx < tempData.length; idx++) {
                            tempData[idx].permissions = {
                                author:
                                    tempData[idx].app_permission === 'OWNER',
                                editor: tempData[idx].app_permission === 'EDIT',
                                viewer:
                                    tempData[idx].app_permission ===
                                    'READ_ONLY',
                            };
                        }

                        scope.settings.DBOwnInfo = tempData;
                        getDBUsers(false, scope.settings.DBOwnInfo[0].app_id);
                        scope.settings.db = scope.settings.DBOwnInfo[0];
                    }
                },
                function (error) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: error.data.errorMessage,
                    });
                }
            );
        }

        /**
         * @name getProjectUsers
         * @param {boolean} admin admin making the call
         * @desc Function to get permission info for a specific project from BE
         * @param {string} projectId project id
         * @returns {void}
         */
        function getProjectUsers(admin, projectId) {
            scope.settings.permissionInfo = [];

            monolithService.getProjectUsers(admin, projectId).then(
                function (data) {
                    scope.settings.permissionInfo = data.data.members;
                    scope.settings.allUserAccess =
                        scope.settings.allUsers.length ===
                        scope.settings.permissionInfo.length;
                    for (
                        let i = 0;
                        i < scope.settings.permissionInfo.length;
                        i++
                    ) {
                        scope.settings.permissionInfo[i].permissions = {
                            owner:
                                scope.settings.permissionInfo[i].permission ===
                                'OWNER',
                            editor:
                                scope.settings.permissionInfo[i].permission ===
                                'EDIT',
                            viewer:
                                scope.settings.permissionInfo[i].permission ===
                                'READ_ONLY',
                        };
                    }
                    scope.settings.setTempPerm();
                },
                function (error) {
                    scope.settings.permissionInfo = [];
                    scope.settings.setTempPerm();

                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: error.data.errorMessage,
                    });
                }
            );
        }

        /**
         * @name getDBUsers
         * @param {boolean} admin admin making the call
         * @desc Function to get permission info for a specific project from BE
         * @param {string} dbId project id
         * @returns {void}
         */
        function getDBUsers(admin, dbId) {
            scope.settings.permissionInfo = [];

            monolithService.getDBUsers(admin, dbId).then(
                function (data) {
                    scope.settings.permissionInfo = data.data;
                    scope.settings.allUsers.length ===
                    scope.settings.permissionInfo.length
                        ? (scope.settings.allUserAccess = true)
                        : (scope.settings.allUserAccess = false);
                    for (
                        let i = 0;
                        i < scope.settings.permissionInfo.length;
                        i++
                    ) {
                        scope.settings.permissionInfo[i].permissions = {
                            owner:
                                scope.settings.permissionInfo[i].permission ===
                                'OWNER',
                            editor:
                                scope.settings.permissionInfo[i].permission ===
                                'EDIT',
                            viewer:
                                scope.settings.permissionInfo[i].permission ===
                                'READ_ONLY',
                        };
                    }
                    scope.settings.setTempPerm();
                },
                function (error) {
                    scope.settings.permissionInfo = [];
                    scope.settings.setTempPerm();

                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: error.data.errorMessage,
                    });
                }
            );
        }

        /**
         * @name getItemUsersNoCredentials
         * @param {boolean} admin admin making the call
         * @param {string} projectId project id
         * @param {string} itemType Projects or Databases
         * @desc Function to get permission info for a specific project from BE
         * @returns {void}
         */
        function getItemUsersNoCredentials(admin, projectId, itemType) {
            if (itemType === 'Projects') {
                monolithService
                    .getProjectUsersNoCredentials(admin, projectId)
                    .then(
                        function (data) {
                            scope.settings.noCredentialsUserData = data.data;
                            for (
                                let i = 0;
                                i < scope.settings.noCredentialsUserData.length;
                                i++
                            ) {
                                scope.settings.noCredentialsUserData[
                                    i
                                ].permissions = {
                                    owner: false,
                                    editor: false,
                                    viewer: false,
                                };
                                scope.settings.noCredentialsUserData[
                                    i
                                ].new = true;
                            }
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
                monolithService.getDBUsersNoCredentials(admin, projectId).then(
                    function (data) {
                        scope.settings.noCredentialsUserData = data.data;
                        for (
                            let i = 0;
                            i < scope.settings.noCredentialsUserData.length;
                            i++
                        ) {
                            scope.settings.noCredentialsUserData[
                                i
                            ].permissions = {
                                owner: false,
                                editor: false,
                                viewer: false,
                            };
                            scope.settings.noCredentialsUserData[i].new = true;
                        }
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
         * @name getInsightUsersNoCredentials
         * @param {boolean} admin whether or not an admin
         * @param {*} projectId app id to get insights for
         * @param {*} insightId insight id to get users for
         * @desc get the users who do not have access to this insight
         * @returns {void}
         */
        function getInsightUsersNoCredentials(admin, projectId, insightId) {
            monolithService
                .getInsightUsersNoCredentials(admin, projectId, insightId)
                .then(
                    function (data) {
                        scope.settings.noCredentialsInsightUserData = data.data;
                        for (
                            let i = 0;
                            i <
                            scope.settings.noCredentialsInsightUserData.length;
                            i++
                        ) {
                            scope.settings.noCredentialsInsightUserData[
                                i
                            ].permissions = {
                                owner: false,
                                editor: false,
                                viewer: false,
                            };
                            scope.settings.noCredentialsInsightUserData[
                                i
                            ].new = true;
                        }
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
        }

        /**
         * @name removeFromTempPerm
         * @desc Function to remove a user or group permission from the temporary object
         * Function removes the user from the object BE will receive
         * @param {string} permission permission tp remove
         * @returns {void}
         */
        function removeFromTempPerm(permission) {
            let addIdx,
                tempPermission = semossCoreService.utility.freeze(permission),
                editIdx;
            if (tempPermission.new) {
                for (
                    addIdx = 0;
                    addIdx < scope.settings.addUserPerm.length;
                    addIdx++
                ) {
                    if (
                        scope.settings.addUserPerm[addIdx].idx ===
                        tempPermission.idx
                    ) {
                        scope.settings.addUserPerm.splice(addIdx, 1);
                        break;
                    }
                }
            } else {
                tempPermission.new = true;
                scope.settings.removeUserPerm.push(tempPermission);
            }

            for (
                editIdx = 0;
                editIdx < scope.settings.editUserPerm.length;
                editIdx++
            ) {
                if (
                    scope.settings.editUserPerm[editIdx].id ===
                    tempPermission.id
                ) {
                    scope.settings.editUserPerm.splice(editIdx, 1);
                    break;
                }
            }
        }

        /**
         * @name changeTempPerm
         * @desc Function to change the permission of a user or group in the temporary object
         * Function adds the old permission to removal object and adds the new permission to adding object for BE
         * @param {string} permission permission selected
         * @param {string} type type of permission to update to (OWNER, EDIT, or READ_ONLY)
         * @param {boolean} admin whether changing permissions as admin or not
         * @returns {void}
         */
        function changeTempPerm(permission, type, admin) {
            let addIdx;
            if (!admin) {
                if (
                    permission.id === scope.settings.username &&
                    (permission.permission === 'OWNER' ||
                        (permission.permission === 'EDIT' &&
                            type === 'READ_ONLY'))
                ) {
                    // user is trying to demote their own access
                    scope.settings.warnSelfDemote = true; // make sure that the user actually wants to demote themselves before changing permissions
                    scope.settings.confirmPermission = permission;
                    scope.settings.confirmPermission.permission = type;
                    return;
                }
            }
            permission.permission = type;
            if (permission.new) {
                for (
                    addIdx = 0;
                    addIdx < scope.settings.addUserPerm.length;
                    addIdx++
                ) {
                    if (
                        scope.settings.addUserPerm[addIdx].id === permission.id
                    ) {
                        // user is in the 'add users' mode and has already given the user permissions --> edit permissions instead
                        removeFromTempPerm(permission);
                        scope.settings.editUserPerm.push(permission);
                        return;
                    }
                }
                scope.settings.addUserPerm.push(permission);
            } else {
                scope.settings.editUserPerm.push(permission);
            }
        }

        /**
         * @name updatePermissions
         * @desc Function to change the permission of a user or group in the temporary object
         * Function adds the old permission to removal object and adds the new permission to adding object for BE
         * @param {string} user user being updated
         *  @param {string} checkedBox permission that was selected
         *  @param {boolean} admin whether user is admin or not
         *  @param {any} selectedItem  the selected db or project
         *  @param {string} type 'Databases' or 'Projects'
         * @returns {void}
         */
        function updatePermissions(
            user,
            checkedBox,
            admin,
            selectedItem,
            type
        ) {
            if (checkedBox === 'OWNER') {
                if (!user.permissions.owner) {
                    // user already has this permission
                    user.permissions.owner = true;
                    return;
                }
                user.permissions.editor = false;
                user.permissions.viewer = false;
            } else if (checkedBox === 'EDIT') {
                if (!user.permissions.editor) {
                    // user already has this permission
                    user.permissions.editor = true;
                    return;
                }
                user.permissions.owner = false;
                user.permissions.viewer = false;
            } else if (checkedBox === 'READ_ONLY') {
                if (!user.permissions.viewer) {
                    // user already has this permission
                    user.permissions.viewer = true;
                    return;
                }
                user.permissions.editor = false;
                user.permissions.owner = false;
            }
            user.permission = checkedBox;

            changeTempPerm(user, user.permission, admin); // TODO: confirm this change makes sense
            savePermissions(admin, selectedItem.id, type);
        }

        /**
         * @name savePermissions
         * @param {boolean} admin if admin made the call
         * @param {string} itemId the project id
         * @param {string} type 'Projects' or 'Databases'
         * @desc Function to save any changes in project permissions
         * Function will send object to BE for updates
         * @returns {void}
         */
        function savePermissions(admin, itemId, type) {
            let addIdx,
                editIdx,
                removeIdx,
                queued = [];

            for (
                addIdx = 0;
                addIdx < scope.settings.addUserPerm.length;
                addIdx++
            ) {
                if (type === 'Projects') {
                    queued.push(
                        monolithService.addProjectUserPermission(
                            admin,
                            itemId,
                            scope.settings.addUserPerm[addIdx].id,
                            scope.settings.addUserPerm[addIdx].permission
                        )
                    );
                } else {
                    // DBs
                    queued.push(
                        monolithService.addDBUserPermission(
                            admin,
                            itemId,
                            scope.settings.addUserPerm[addIdx].id,
                            scope.settings.addUserPerm[addIdx].permission
                        )
                    );
                }
            }

            for (
                editIdx = 0;
                editIdx < scope.settings.editUserPerm.length;
                editIdx++
            ) {
                if (type === 'Projects') {
                    queued.push(
                        monolithService.editProjectUserPermission(
                            admin,
                            itemId,
                            scope.settings.editUserPerm[editIdx].id,
                            scope.settings.editUserPerm[editIdx].permission
                        )
                    );
                } else {
                    // DBs
                    queued.push(
                        monolithService.editDBUserPermission(
                            admin,
                            itemId,
                            scope.settings.editUserPerm[editIdx].id,
                            scope.settings.editUserPerm[editIdx].permission
                        )
                    );
                }
            }

            for (
                removeIdx = 0;
                removeIdx < scope.settings.removeUserPerm.length;
                removeIdx++
            ) {
                if (type === 'Projects') {
                    queued.push(
                        monolithService.removeProjectUserPermission(
                            admin,
                            itemId,
                            scope.settings.removeUserPerm[removeIdx].id
                        )
                    );
                } else {
                    // DB
                    queued.push(
                        monolithService.removeDBUserPermission(
                            admin,
                            itemId,
                            scope.settings.removeUserPerm[removeIdx].id
                        )
                    );
                }
            }

            if (queued.length > 0) {
                $q.all(queued).then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully updated permission information for the project.',
                        });
                        clearPermissionInfo();
                        $timeout(function () {
                            // refresh the user data
                            if (type === 'Projects') {
                                getProjectUsers(admin, itemId);
                            } else {
                                getDBUsers(admin, itemId);
                            }
                        });
                    },
                    function (response) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: response.data.errorMessage,
                        });
                        clearPermissionInfo();
                        $timeout(function () {
                            // refresh the user data
                            if (type === 'Projects') {
                                getProjectUsers(admin, itemId);
                            } else {
                                getDBUsers(admin, itemId);
                            }
                        });
                    }
                );
            }
        }

        /**
         * @name clearPermissionInfo
         * @desc Function to save any changes in project permissions
         * Function will send object to BE for updates
         * @returns {void}
         */
        function clearPermissionInfo() {
            scope.settings.addUserPerm = [];
            scope.settings.editUserPerm = [];
            scope.settings.removeUserPerm = [];
            scope.settings.tempPerm = [];
            scope.settings.permissionInfo = [];
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            semossCoreService.isSecurityEnabled().then(function (response) {
                scope.settings.securityEnabled = response;
                if (scope.settings.securityEnabled) {
                    scope.settings.selectedPage = 'project-permissions';
                    getProjects(false);
                    isAdmin();
                    let logins = semossCoreService.getCurrentLogins();
                    scope.settings.username = semossCoreService.utility.isEmpty(
                        logins
                    )
                        ? ''
                        : logins[Object.keys(logins)[0]];
                } else {
                    scope.settings.selectedPage = 'social-edit';
                }
            });
        }

        initialize();
    }
}
