'use strict';

import angular from 'angular';

export default angular
    .module('app.project.project-user', [])
    .directive('projectUser', projectUserDirective);

import './project-user.scss';

projectUserDirective.$inject = ['semossCoreService', 'monolithService', '$q'];

function projectUserDirective(semossCoreService, monolithService, $q) {
    projectUserCtrl.$inject = [];
    projectUserLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: ['^landing', '^project'],
        restrict: 'E',
        template: require('./project-user.directive.html'),
        bindToController: {
            project: '=',
        },
        controller: projectUserCtrl,
        controllerAs: 'projectUser',
        link: projectUserLink,
    };

    function projectUserCtrl() {}

    function projectUserLink(scope, ele, attrs, ctrl) {
        scope.landingCtrl = ctrl[0];
        scope.projectCtrl = ctrl[1];
        const PERMISSIONS = {
            OWNER: 'Author',
            EDIT: 'Editor',
            READ_ONLY: 'Viewer',
        };
        scope.projectUser.permissions = [
            { display: PERMISSIONS.OWNER, value: 'OWNER' },
            { display: PERMISSIONS.EDIT, value: 'EDIT' },
            { display: PERMISSIONS.READ_ONLY, value: 'READ_ONLY' },
        ];
        scope.projectUser.adminUser = false;
        scope.projectUser.privacy = 'PRIVATE';
        scope.projectUser.userPermission = 'READ_ONLY';
        scope.projectUser.users = {
            raw: {},
            filtered: {},
        };
        scope.projectUser.searchTerm = '';

        scope.projectUser.searchUsers = searchUsers;
        scope.projectUser.changePermission = changePermission;
        scope.projectUser.setProjectPrivacy = setProjectPrivacy;

        /** Remove Users */
        scope.projectUser.isRemoveOpen = false;
        scope.projectUser.removedUser = undefined;
        scope.projectUser.showRemove = showRemove;
        scope.projectUser.hideRemove = hideRemove;
        scope.projectUser.removeUser = removeUser;

        /** Add New Users */
        scope.projectUser.isAddOpen = false;
        scope.projectUser.showAlert = false;
        scope.projectUser.allUsers = [];
        scope.projectUser.newUsers = [];
        scope.projectUser.tempUser = {
            user: '',
            permission: '',
        };
        scope.projectUser.searchAllUsers = searchAllUsers;
        scope.projectUser.isUsersFilteredEmpty = isUsersFilteredEmpty;
        scope.projectUser.addTempUser = addTempUser;
        scope.projectUser.addUsers = addUsers;
        scope.projectUser.removeNewUser = removeNewUser;
        scope.projectUser.showAdd = showAdd;
        scope.projectUser.hideAdd = hideAdd;
        scope.projectUser.adminOnlyProjectSetPublic = false;

        /**
         * @name searchUsers
         * @desc filters the list of users by the searchterm and will organize by permission into a map
         */
        function searchUsers(): void {
            scope.projectUser.users.filtered = {};
            for (let i = 0; i < scope.projectUser.users.raw.length; i++) {
                const user: any = scope.projectUser.users.raw[i];
                const permission: string = PERMISSIONS[user.permission]
                    ? PERMISSIONS[user.permission]
                    : user.raw.permission;
                if (scope.projectUser.searchTerm.length > 0) {
                    if (
                        user.name
                            .toUpperCase()
                            .indexOf(
                                scope.projectUser.searchTerm.toUpperCase()
                            ) > -1
                    ) {
                        if (
                            scope.projectUser.users.filtered.hasOwnProperty(
                                permission
                            )
                        ) {
                            scope.projectUser.users.filtered[permission].push(
                                user
                            );
                        } else {
                            scope.projectUser.users.filtered[permission] = [
                                user,
                            ];
                        }
                    }
                } else {
                    if (
                        scope.projectUser.users.filtered.hasOwnProperty(
                            permission
                        )
                    ) {
                        scope.projectUser.users.filtered[permission].push(user);
                    } else {
                        scope.projectUser.users.filtered[permission] = [user];
                    }
                }
            }
        }

        /**
         * @name isUsersFilteredEmpty
         * @desc checks whether filtered users list is empty
         */
        function isUsersFilteredEmpty() {
            return Object.keys(scope.projectUser.users.filtered).length === 0;
        }

        /**
         * @name changePermission
         * @desc changes the user's permission
         * @param user - the user to update
         */
        function changePermission(user: any): void {
            monolithService
                .editProjectUserPermission(
                    scope.projectUser.adminUser,
                    scope.projectUser.project,
                    user.id,
                    user.permission
                )
                .then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Permission has been modified.',
                        });
                        scope.projectCtrl.currentUserPermission(false);
                        scope.landingCtrl.getProjects();
                        getProjectUsers();
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
         * @name getProjectPrivacy
         * @desc Function to get the privacy of the current project
         * @returns {void}
         */
        function getProjectPrivacy() {
            monolithService
                .getProjects(
                    scope.projectUser.adminUser,
                    scope.projectUser.project
                )
                .then(
                    function (data) {
                        for (let idx = 0; idx < data.data.length; idx++) {
                            if (
                                data.data[idx].project_id ===
                                scope.projectUser.project
                            ) {
                                data.data[idx].project_global
                                    ? (scope.projectUser.privacy = 'PUBLIC')
                                    : (scope.projectUser.privacy = 'PRIVATE');
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
         * @name setProjectPrivacy
         * @desc set project to public or private
         * @returns {void}
         */
        function setProjectPrivacy() {
            const isPublic = scope.projectUser.privacy === 'PUBLIC';
            monolithService
                .setProjectGlobal(
                    scope.projectUser.adminUser,
                    scope.projectUser.project,
                    isPublic
                )
                .then(
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
        }

        /**
         * @name getProjectUsers
         * @desc gets the list of users for a project
         */
        function getProjectUsers(): void {
            monolithService
                .getProjectUsers(
                    scope.projectUser.adminUser,
                    scope.projectUser.project
                )
                .then(
                    function (data) {
                        scope.projectUser.users = {
                            raw: {},
                            filtered: {},
                        };
                        scope.projectUser.users.raw = data.data.members;
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
            scope.projectUser.removedUser = user;
            scope.projectUser.isRemoveOpen = true;
        }

        /**
         * @name hideRemove
         * @desc closes the remove overlary
         */
        function hideRemove(): void {
            scope.projectUser.removedUser = undefined;
            scope.projectUser.isRemoveOpen = false;
        }

        /**
         * @name removeUser
         * @desc removes the user from the project
         */
        function removeUser(): void {
            monolithService
                .removeProjectUserPermission(
                    scope.projectUser.adminUser,
                    scope.projectUser.project,
                    scope.projectUser.removedUser.id
                )
                .then(
                    function () {
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'Member has been removed.',
                        });
                        scope.projectCtrl.currentUserPermission(true);
                        scope.landingCtrl.getProjects();
                        getProjectUsers();
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
            scope.projectUser.isAddOpen = true;
        }

        /**
         * @name hideAdd
         * @desc closes the add user overlay and resets values
         */
        function hideAdd() {
            scope.projectUser.newUsers = [];
            scope.projectUser.tempUser = {
                user: '',
                permission: '',
            };
            scope.projectUser.showAlert = false;
            scope.projectUser.isAddOpen = false;
        }

        /**
         * @name searchAllUsers
         * @desc gets all SEMOSS users
         * @param search - search term
         */
        function searchAllUsers(search: string): void {
            scope.projectUser.allUsers = [];

            monolithService.getUserInformation(search).then(function (data) {
                scope.projectUser.allUsers = data.map((user) => {
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
            for (let i = 0; i < scope.projectUser.newUsers.length; i++) {
                if (
                    scope.projectUser.tempUser.user.id ===
                    scope.projectUser.newUsers[i].user.id
                ) {
                    scope.projectUser.showAlert = true;
                    return;
                }
            }
            scope.projectUser.newUsers.push(scope.projectUser.tempUser);
            scope.projectUser.tempUser = {
                user: '',
                permission: '',
            };
        }

        /**
         * @name addUsers
         * @desc adds the new users to the project
         */
        function addUsers(): void {
            const promises: ng.IPromise<any>[] = [];
            for (let i = 0; i < scope.projectUser.newUsers.length; i++) {
                const user: string = scope.projectUser.newUsers[i].user.id;
                const permission: string =
                    scope.projectUser.newUsers[i].permission.value;
                promises.push(
                    monolithService.addProjectUserPermission(
                        scope.projectUser.adminUser,
                        scope.projectUser.project,
                        user,
                        permission
                    )
                );
            }
            $q.all(promises).then(
                function () {
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully added members to project.',
                    });
                    getProjectUsers();
                },
                function (error) {
                    semossCoreService.emit('alert', {
                        color: 'error',
                        text:
                            error.data.errorMessage ||
                            'Error adding members to project.',
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
            scope.projectUser.newUsers.splice(index, 1);
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            monolithService.isAdmin().then(function (adminUser) {
                scope.projectUser.adminUser = adminUser;
                getProjectPrivacy();
                if (
                    scope.projectUser.project &&
                    scope.projectUser.project.length
                ) {
                    getProjectUsers();
                    searchAllUsers('');
                }
            });
        }

        initialize();
    }
}
