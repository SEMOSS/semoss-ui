'use strict';

import './settings-insights.scss';

export default angular
    .module('app.settings.settings-insights', [])
    .directive('settingsInsights', settingsInsightsDirective);

settingsInsightsDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$q',
    '$timeout',
];

function settingsInsightsDirective(
    monolithService,
    semossCoreService,
    $q,
    $timeout
) {
    settingsInsightsCtrl.$inject = ['$scope'];
    settingsInsightsLink.$inject = [];

    return {
        restrict: 'E',
        template: require('./settings-insights.directive.html'),
        controller: settingsInsightsCtrl,
        link: settingsInsightsLink,
        require: ['^settings'],
        scope: {},
        bindToController: {
            insightSearchterm: '=',
            userSearchterm: '=',
        },
        controllerAs: 'settingsInsights',
    };

    function settingsInsightsCtrl() {}

    function settingsInsightsLink(scope, ele, attrs, ctrl) {
        scope.settingsCtrl = ctrl[0];
        scope.settingsInsights.deleteInsightOverlay = {
            show: false,
        };
        scope.settingsInsights.deleteUserOverlay = {
            show: false,
            userId: '',
        };
        scope.settingsInsights.insights = {};
        scope.settingsInsights.newUser = {
            id: '',
            permission: 'READ_ONLY',
        };
        scope.settingsInsights.addUserPerm = [];
        scope.settingsInsights.getInsights = getInsights;
        scope.settingsInsights.getCurrentUsers = getCurrentUsers;
        scope.settingsInsights.updateInsight = updateInsight;
        scope.settingsInsights.openDeleteInsightOverlay =
            openDeleteInsightOverlay;
        scope.settingsInsights.openDeleteInsightUserOverlay =
            openDeleteInsightUserOverlay;
        scope.settingsInsights.cancelDeleteInsightUser =
            cancelDeleteInsightUser;
        scope.settingsInsights.deleteInsight = deleteInsight;
        scope.settingsInsights.savePermissionsAdd = savePermissionsAdd;
        scope.settingsInsights.savePermissionsAll = savePermissionsAll;
        scope.settingsInsights.addInsightUser = addInsightUser;
        scope.settingsInsights.editInsightUser = editInsightUser;
        scope.settingsInsights.deleteInsightUser = deleteInsightUser;
        scope.settingsInsights.closeAddInsightPermissionsOverlay =
            closeAddInsightPermissionsOverlay;

        /**
         * @name savePermissionsAdd
         * @param {boolean} insight insight to add to
         * @desc Function to save any changes in DB permissions
         * Function will send object to BE for updates
         * @returns {void}
         */
        function savePermissionsAdd(insight) {
            let addIdx,
                queuedAdd = [],
                admin = scope.settingsCtrl.selectedPage === 'admin-permissions'; // TODO: is this a security issue?

            for (
                addIdx = 0;
                addIdx < scope.settingsInsights.addUserPerm.length;
                addIdx++
            ) {
                queuedAdd.push(
                    monolithService.addInsightUserPermission(
                        insight.project_id,
                        insight.project_insight_id,
                        scope.settingsInsights.addUserPerm[addIdx].id,
                        scope.settingsInsights.addUserPerm[addIdx].permission,
                        admin
                    )
                );
            }

            if (queuedAdd.length > 0) {
                $q.all(queuedAdd).then(
                    function (response) {
                        for (
                            let respIdx = 0;
                            respIdx < response.length;
                            respIdx++
                        ) {
                            if (response[respIdx].success) {
                                semossCoreService.emit('alert', {
                                    color: 'success',
                                    text: 'Successfully added user to insight.',
                                });
                            } else {
                                semossCoreService.emit('alert', {
                                    color: 'error',
                                    text: response[respIdx].data.errorMessage,
                                });
                            }
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

            scope.settingsInsights.addUserPerm = [];
        }

        /**
         * @name addInsightUser
         * @param {any} dbUser the user to add to insight
         * @param {string} permission the access level to give user
         * @desc add user to insight
         * @returns {void}
         */
        function addInsightUser(dbUser, permission) {
            let admin = scope.settingsCtrl.selectedPage === 'admin-permissions';
            // check if another permission has already been selected
            if (
                permission === 'OWNER' &&
                (dbUser.permissions.editor || dbUser.permissions.viewer)
            ) {
                dbUser.permissions.editor = false;
                dbUser.permissions.viewer = false;
                removeTempAddUser(dbUser.id); // remove previously added permission
                editInsightUser(
                    scope.settingsInsights.insight,
                    dbUser.id,
                    permission,
                    admin
                );
                return;
            } else if (
                permission === 'EDIT' &&
                (dbUser.permissions.owner || dbUser.permissions.viewer)
            ) {
                dbUser.permissions.owner = false;
                dbUser.permissions.viewer = false;
                removeTempAddUser(dbUser.id); // remove previously added permission
                editInsightUser(
                    scope.settingsInsights.insight,
                    dbUser.id,
                    permission,
                    admin
                );
                return;
            } else if (
                permission === 'READ_ONLY' &&
                (dbUser.permissions.owner || dbUser.permissions.editor)
            ) {
                dbUser.permissions.owner = false;
                dbUser.permissions.editor = false;
                removeTempAddUser(dbUser.id); // remove previously added permission
                editInsightUser(
                    scope.settingsInsights.insight,
                    dbUser.id,
                    permission,
                    admin
                );
                return;
            }

            scope.settingsInsights.addUserPerm.push({
                // add updated permission
                id: dbUser.id,
                permission: permission,
            });
        }

        /**
         * @name removeTempAddUser
         * @param {string} userId the user to remove
         * @desc remove existing permission associated with a user from the list of users to give permissions to
         * @returns {void}
         */
        function removeTempAddUser(userId) {
            for (
                let addIdx = 0;
                addIdx < scope.settingsInsights.addUserPerm.length;
                addIdx++
            ) {
                if (scope.settingsInsights.addUserPerm[addIdx].id === userId) {
                    scope.settingsInsights.addUserPerm.splice(addIdx, 1);
                    break;
                }
            }
        }

        /**
         * @name editInsightUser
         * @param {object} insight the insight to edit
         * @param {string} userId the user to edit
         * @param {string} permission the access level to edit
         * @param {boolean} admin the access level to edit
         * @desc edit user for insight
         * @returns {void}
         */
        function editInsightUser(insight, userId, permission, admin) {
            monolithService
                .editInsightUserPermission(
                    insight.project_id,
                    insight.project_insight_id,
                    userId,
                    permission,
                    admin
                )
                .then(
                    function (response) {
                        if (response.success) {
                            // refresh current users list
                            getCurrentUsers(insight);

                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Successfully edited user permission.',
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
         * @name openDeleteInsightUserOverlay
         * @param {*} userId id of the user to delete
         * @desc open overlay to prepare to delete user
         * @returns {void}
         */
        function openDeleteInsightUserOverlay(userId) {
            scope.settingsInsights.deleteUserOverlay.show = true;
            scope.settingsInsights.deleteUserOverlay.userId = userId;
        }

        /**
         * @name cancelDeleteInsightUser
         * @desc cancel deleting and reset data
         * @returns {void}
         */
        function cancelDeleteInsightUser() {
            scope.settingsInsights.deleteUserOverlay.show = false;
            scope.settingsInsights.deleteUserOverlay.userId = '';
        }

        /**
         * @name deleteInsightUser
         * @param {*} insight the insight to delete user from
         * @param {*} userId the user to delete
         * @desc delete the user from the insight
         * @returns {void}
         */
        function deleteInsightUser(insight, userId) {
            let admin = scope.settingsCtrl.selectedPage === 'admin-permissions';
            scope.settingsInsights.deleteUserOverlay.show = false;
            monolithService
                .removeInsightUserPermission(
                    insight.project_id,
                    insight.project_insight_id,
                    userId,
                    admin
                )
                .then(
                    function (response) {
                        if (response.success) {
                            // refresh current users list
                            getCurrentUsers(insight);

                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Successfully removed user permission.',
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
         * @name deleteInsight
         * @param {*} insight insight to delete
         * @desc delete the insight
         * @returns {void}
         */
        function deleteInsight(insight) {
            scope.settingsInsights.deleteInsightOverlay.show = false;
            let admin = scope.settingsCtrl.selectedPage === 'admin-permissions';
            if (admin) {
                monolithService
                    .deleteAdminInsight(insight.project_id, [
                        insight.project_insight_id,
                    ])
                    .then(
                        function (response) {
                            if (response.success) {
                                scope.settingsInsights.deleteInsightOverlay.show = false;

                                // refresh current users list
                                getInsights(insight.project_id, true);

                                semossCoreService.emit('alert', {
                                    color: 'success',
                                    text: 'Successfully deleted the insight.',
                                });
                            }
                        },
                        function (response) {
                            scope.settingsInsights.deleteInsightOverlay.show = false;
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: response.data.errorMessage,
                            });
                        }
                    );
            } else {
                let message = semossCoreService.utility.random('query-pixel');

                semossCoreService.once(message, function (response) {
                    var type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        scope.settingsInsights.deleteInsightOverlay.show = false;
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: 'An error occurred deleting the insight.',
                        });
                    } else {
                        scope.settingsInsights.deleteInsightOverlay.show = false;
                        // refresh current users list
                        getInsights(insight.project_id, true);

                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Successfully deleted the insight.',
                        });
                    }
                });
                semossCoreService.emit('query-pixel', {
                    commandList: [
                        {
                            meta: true,
                            type: 'deleteInsight',
                            components: [
                                insight.project_id,
                                [insight.project_insight_id],
                            ],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
            }
        }

        /**
         * @name getCurrentUsers
         * @param {object} insight the insight to get users for
         * @desc get the list of current users for this insight
         * @returns {void}
         */
        function getCurrentUsers(insight) {
            monolithService
                .getInsightUsers(insight.project_id, insight.project_insight_id)
                .then(function (response) {
                    for (let i = 0; i < response.data.length; i++) {
                        response.data[i].author = false;
                        response.data[i].editor = false;
                        response.data[i].read_only = false;
                        response.data[i].og_author = false;
                        response.data[i].og_editor = false;
                        response.data[i].og_read_only = false;

                        if (response.data[i].permission === 'OWNER') {
                            response.data[i].author = true;
                            response.data[i].og_author = true;
                        } else if (response.data[i].permission === 'EDIT') {
                            response.data[i].editor = true;
                            response.data[i].og_editor = true;
                        } else if (
                            response.data[i].permission === 'READ_ONLY'
                        ) {
                            response.data[i].read_only = true;
                            response.data[i].og_read_only = true;
                        }
                    }

                    scope.settingsInsights.currentUsers = response.data.members;
                    scope.settingsCtrl.noInsightUsers =
                        scope.settingsInsights.currentUsers.length === 0;
                    scope.settingsCtrl.allUserAccess =
                        scope.settingsCtrl.allUsers.length ===
                        scope.settingsInsights.currentUsers.length;
                });
        }

        /**
         * @name updateInsight
         * @param {object} insight the insight to edit
         * @desc open the overlay to edit the insight
         * @returns {void}
         */
        function updateInsight(insight) {
            scope.settingsCtrl.selectedInsight = insight;
            scope.settingsInsights.addUserPerm = [];
            getCurrentUsers(insight);
            scope.settingsInsights.insight = insight;
        }

        /**
         * @name openDeleteInsightOverlay
         * @param {object} insight the insight to delete
         * @desc open the overlay to confirm deletion of insight
         * @returns {void}
         */
        function openDeleteInsightOverlay(insight) {
            scope.settingsInsights.deleteInsightOverlay.show = true;
            scope.settingsInsights.deleteInsightOverlay = {
                show: true,
                insight: insight,
            };
        }

        /**
         * @name getInsights
         * @param {*} projectId project id to get insights for
         * @param {boolean} refresh whether or not to refresh
         * @desc get the insights for this app
         * @returns {void}
         */
        function getInsights(projectId, refresh) {
            let admin = scope.settingsCtrl.selectedPage === 'admin-permissions';
            if (!scope.settingsInsights.insights[projectId] || refresh) {
                monolithService
                    .getProjectInsights(projectId, admin)
                    .then(function (response) {
                        scope.settingsInsights.insights[projectId] =
                            response.data;
                        scope.settingsCtrl.noInsights =
                            response.data.length === 0;
                    });
            }
        }

        /**
         * @name savePermissionsAll
         * @param {string} isAddNew whether permissions are being added for new or existing users
         * @param {string} permission read-only, author, or editor
         * @param {string} givePermissionTo the project id
         * @desc Function to give permissions to all insights for a user
         * @returns {void}
         */
        function savePermissionsAll(isAddNew, permission, givePermissionTo) {
            scope.settingsCtrl.accessAllOverlay.show = false;
            scope.settingsCtrl.overlay.openAddInsightPermissions = false;

            monolithService
                .addInsightAllUserPermissions(
                    givePermissionTo.project_id,
                    givePermissionTo.project_insight_id,
                    permission,
                    isAddNew
                )
                .then(function () {
                    // TODO: confirm this still works
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully added permission information for the insight.',
                    });
                    $timeout(function () {
                        getCurrentUsers(givePermissionTo);
                    }, 500);
                });
        }

        /**
         * @name closeAddInsightPermissionsOverlay
         * @desc close the overlay
         * @returns {void}
         */
        function closeAddInsightPermissionsOverlay() {
            scope.settingsInsights.getCurrentUsers(
                scope.settingsInsights.insight
            );
            scope.settingsCtrl.overlay.openAddInsightPermissions = false;
            scope.settingsInsights.addUserPerm = [];
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            scope.settingsInsights.projectId =
                scope.settingsCtrl.project.project_id;
            scope.settingsInsights.getInsights(
                scope.settingsInsights.projectId
            );
        }

        initialize();
    }
}
