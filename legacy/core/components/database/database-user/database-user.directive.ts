'use strict';

import angular from 'angular';

export default angular
    .module('app.database.database-user', [])
    .directive('databaseUser', databaseUserDirective);

import './database-user.scss';

databaseUserDirective.$inject = ['semossCoreService', 'monolithService', '$q'];

function databaseUserDirective(semossCoreService, monolithService, $q) {
    databaseUserCtrl.$inject = [];
    databaseUserLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: ['^database'],
        restrict: 'E',
        template: require('./database-user.directive.html'),
        bindToController: {
            database: '=',
        },
        controller: databaseUserCtrl,
        controllerAs: 'databaseUser',
        link: databaseUserLink,
    };

    function databaseUserCtrl() {}

    function databaseUserLink(scope, ele, attrs, ctrl) {
        scope.databaseCtrl = ctrl[0];

        const PERMISSIONS = {
            OWNER: 'Author',
            EDIT: 'Editor',
            READ_ONLY: 'Viewer',
        };
        scope.databaseUser.permissions = [
            { display: PERMISSIONS.OWNER, value: 'OWNER' },
            { display: PERMISSIONS.EDIT, value: 'EDIT' },
            { display: PERMISSIONS.READ_ONLY, value: 'READ_ONLY' },
        ];
        scope.databaseUser.adminUser = false;
        scope.databaseUser.privacy = false;
        scope.databaseUser.discoverable =
            scope.databaseCtrl.appInfo.database_discoverable || false;

        scope.databaseUser.users = {
            raw: {},
            filtered: {},
        };
        scope.databaseUser.searchTerm = '';

        scope.databaseUser.searchUsers = searchUsers;
        scope.databaseUser.changePermission = changePermission;

        /** Remove Users */
        scope.databaseUser.isRemoveOpen = false;
        scope.databaseUser.removedUser = undefined;
        scope.databaseUser.showRemove = showRemove;
        scope.databaseUser.hideRemove = hideRemove;
        scope.databaseUser.removeUser = removeUser;

        /** Add New Users */
        scope.databaseUser.isAddOpen = false;
        scope.databaseUser.showAlert = false;
        scope.databaseUser.allUsers = [];
        scope.databaseUser.newUsers = [];
        scope.databaseUser.tempUser = {
            user: '',
            permission: '',
        };
        scope.databaseUser.searchAllUsers = searchAllUsers;
        scope.databaseUser.isUsersFilteredEmpty = isUsersFilteredEmpty;
        scope.databaseUser.setDatabasePrivacy = setDatabasePrivacy;
        scope.databaseUser.setDatabaseDiscoverable = setDatabaseDiscoverable;
        scope.databaseUser.addTempUser = addTempUser;
        scope.databaseUser.addUsers = addUsers;
        scope.databaseUser.removeNewUser = removeNewUser;
        scope.databaseUser.showAdd = showAdd;
        scope.databaseUser.hideAdd = hideAdd;

        /**
         * @name searchUsers
         * @desc filters the list of users by the searchterm and will organize by permission into a map
         */
        function searchUsers(): void {
            scope.databaseUser.users.filtered = {};
            for (let i = 0; i < scope.databaseUser.users.raw.length; i++) {
                const user: any = scope.databaseUser.users.raw[i];
                const permission: string = PERMISSIONS[user.permission]
                    ? PERMISSIONS[user.permission]
                    : user.raw.permission;
                if (scope.databaseUser.searchTerm.length > 0) {
                    if (
                        user.name
                            .toUpperCase()
                            .indexOf(
                                scope.databaseUser.searchTerm.toUpperCase()
                            ) > -1
                    ) {
                        if (
                            scope.databaseUser.users.filtered.hasOwnProperty(
                                permission
                            )
                        ) {
                            scope.databaseUser.users.filtered[permission].push(
                                user
                            );
                        } else {
                            scope.databaseUser.users.filtered[permission] = [
                                user,
                            ];
                        }
                    }
                } else {
                    if (
                        scope.databaseUser.users.filtered.hasOwnProperty(
                            permission
                        )
                    ) {
                        scope.databaseUser.users.filtered[permission].push(
                            user
                        );
                    } else {
                        scope.databaseUser.users.filtered[permission] = [user];
                    }
                }
            }
        }

        /**
         * @name isUsersFilteredEmpty
         * @desc checks whether filtered users list is empty
         */
        function isUsersFilteredEmpty() {
            return Object.keys(scope.databaseUser.users.filtered).length === 0;
        }

        /**
         * @name changePermission
         * @desc changes the user's permission
         * @param user - the user to update
         */
        function changePermission(user: any): void {
            monolithService
                .editDBUserPermission(
                    scope.databaseUser.adminUser,
                    scope.databaseUser.database,
                    user.id,
                    user.permission
                )
                .then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Permission has been modified.',
                        });
                        getDatabaseUsers();
                        scope.databaseCtrl.checkLoggedInUserPermission();
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

        /**
         * @name getDatabasePrivacy
         * @desc Function to get the privacy of the current database
         * @returns {void}
         */
        function getDatabasePrivacy() {
            monolithService
                .getDBs(
                    scope.databaseUser.adminUser,
                    scope.databaseUser.database
                )
                .then(
                    function (data) {
                        for (let idx = 0; idx < data.data.length; idx++) {
                            if (
                                data.data[idx].app_id ===
                                scope.databaseUser.database
                            ) {
                                scope.databaseUser.privacy =
                                    !data.data[idx].app_global;
                                return;
                            }
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
         * @name setDatabasePrivacy
         * @desc set db to public or private
         * @returns {void}
         */
        function setDatabasePrivacy() {
            const isPublic = !scope.databaseUser.privacy;
            monolithService
                .setDBGlobal(
                    scope.databaseUser.adminUser,
                    scope.databaseUser.database,
                    isPublic
                )
                .then(
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

        /**
         * @name setDatabaseDiscoverable
         * @desc set db to discoverable or not
         * @returns {void}
         */
        function setDatabaseDiscoverable() {
            const isDiscoverable = scope.databaseUser.discoverable;
            monolithService
                .setDBDiscoverable(
                    scope.databaseUser.adminUser,
                    scope.databaseUser.database,
                    isDiscoverable
                )
                .then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text:
                                'You have successfully made the database ' +
                                (isDiscoverable
                                    ? 'discoverable.'
                                    : 'not discoverable.'),
                        });
                        scope.databaseUser.discoverable = isDiscoverable;
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                        scope.databaseUser.discoverable = !isDiscoverable;
                        scope.databaseCtrl.updateFilteredItemField(
                            scope.databaseUser.database,
                            'discoverable',
                            scope.databaseUser.discoverable
                        );
                    }
                );
        }

        /**
         * @name getDatabaseUsers
         * @desc gets the list of users for a database
         */
        function getDatabaseUsers(): void {
            monolithService
                .getDBUsers(
                    scope.databaseUser.adminUser,
                    scope.databaseUser.database
                )
                .then(
                    function (data) {
                        scope.databaseUser.users = {
                            raw: {},
                            filtered: {},
                        };
                        scope.databaseUser.users.raw = data.data;
                        searchUsers();
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
        }

        /** Remove Users Functions */

        /**
         * @name showRemove
         * @desc opens the remove overlay and sets the user to delete
         * @param user - the user to remove
         */
        function showRemove(user: any): void {
            scope.databaseUser.removedUser = user;
            scope.databaseUser.isRemoveOpen = true;
        }

        /**
         * @name hideRemove
         * @desc closes the remove overlary
         */
        function hideRemove(): void {
            scope.databaseUser.removedUser = undefined;
            scope.databaseUser.isRemoveOpen = false;
        }

        /**
         * @name removeUser
         * @desc removes the user from the database
         */
        function removeUser(): void {
            monolithService
                .removeDBUserPermission(
                    scope.databaseUser.adminUser,
                    scope.databaseUser.database,
                    scope.databaseUser.removedUser.id
                )
                .then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Member has been removed.',
                        });
                        getDatabaseUsers();
                    },
                    function (error) {
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text:
                                error.data.errorMessage ||
                                'An error occurred while removing member.',
                        });
                    }
                );
            hideRemove();
        }

        /** Add New Users Functions */

        /**
         * @name showAdd
         * @desc opens the add users overlay
         */
        function showAdd() {
            scope.databaseUser.isAddOpen = true;
        }

        /**
         * @name hideAdd
         * @desc closes the add user overlay and resets values
         */
        function hideAdd() {
            scope.databaseUser.newUsers = [];
            scope.databaseUser.tempUser = {
                user: '',
                permission: '',
            };
            scope.databaseUser.showAlert = false;
            scope.databaseUser.isAddOpen = false;
        }

        /**
         * @name searchAllUsers
         * @desc gets all SEMOSS users
         * @param search - search term
         */
        function searchAllUsers(search: string): void {
            scope.databaseUser.allUsers = [];

            monolithService.getUserInformation(search).then(function (data) {
                scope.databaseUser.allUsers = data.map((user) => {
                    user.display = user.name + ' | ' + user.email;
                    return user;
                });
            });
        }

        /**
         * @name addTempUser
         * @desc adds the temporary user to the list of new users to add
         */
        function addTempUser(): void {
            for (let i = 0; i < scope.databaseUser.newUsers.length; i++) {
                if (
                    scope.databaseUser.tempUser.user.id ===
                    scope.databaseUser.newUsers[i].user.id
                ) {
                    scope.databaseUser.showAlert = true;
                    return;
                }
            }
            scope.databaseUser.newUsers.push(scope.databaseUser.tempUser);
            scope.databaseUser.tempUser = {
                user: '',
                permission: '',
            };
        }

        /**
         * @name addUsers
         * @desc adds the new users to the database
         */
        function addUsers(): void {
            const promises: ng.IPromise<any>[] = [];
            for (let i = 0; i < scope.databaseUser.newUsers.length; i++) {
                const user: string = scope.databaseUser.newUsers[i].user.id;
                const permission: string =
                    scope.databaseUser.newUsers[i].permission.value;
                promises.push(
                    monolithService.addDBUserPermission(
                        scope.databaseUser.adminUser,
                        scope.databaseUser.database,
                        user,
                        permission
                    )
                );
            }
            $q.all(promises).then(
                function () {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully added members to database.',
                    });
                    getDatabaseUsers();
                },
                function (error) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text:
                            error.data.errorMessage ||
                            'Error adding members to database.',
                    });
                }
            );
        }

        /**
         * @name removeNewUser
         * @desc removes the user from the list of new users to add
         * @param index index of user in the list
         */
        function removeNewUser(index: number) {
            scope.databaseUser.newUsers.splice(index, 1);
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            monolithService.isAdmin().then(function (adminUser) {
                scope.databaseUser.adminUser = adminUser;
                getDatabasePrivacy();
                if (
                    scope.databaseUser.database &&
                    scope.databaseUser.database.length
                ) {
                    getDatabaseUsers();
                    searchAllUsers('');
                }
            });
        }

        initialize();
    }
}
