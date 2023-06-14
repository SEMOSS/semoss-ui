'use strict';

export default angular
    .module('app.settings.settings-admin', [])
    .directive('settingsAdmin', settingsAdminDirective);

settingsAdminDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$q',
    '$timeout',
];

function settingsAdminDirective(
    monolithService,
    semossCoreService,
    $q,
    $timeout
) {
    settingsAdminCtrl.$inject = ['$scope'];
    settingsAdminLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./settings-admin.directive.html'),
        controller: settingsAdminCtrl,
        link: settingsAdminLink,
        require: ['^settings'],
        scope: {},
        bindToController: {
            items: '=',
        },
        controllerAs: 'settingsAdmin',
    };

    function settingsAdminCtrl() {}

    function settingsAdminLink(scope, ele, attrs, ctrl) {
        scope.settingsCtrl = ctrl[0];

        // Tabs for admin pages
        scope.settingsAdmin.adminTabs = ['Databases', 'Projects', 'Members'];
        scope.settingsAdmin.selectedAdminTab = 'Projects';
        // Tabs for selected user
        scope.settingsAdmin.adminUserTabs = [
            'Member Settings',
            'Databases',
            'Projects',
            'Insights',
        ];
        scope.settingsAdmin.selectedAdminUserTab = 'Member Settings';
        // Tabs for selected Project or Database
        scope.settingsAdmin.itemTabs = [
            'Project Permissions',
            'Insight Permissions',
        ];
        scope.settingsAdmin.selectedItemTab = 'Project Permissions';

        scope.settingsAdmin.userSearchterm = '';
        scope.settingsAdmin.insightSearchterm = '';
        scope.settingsAdmin.insightUserSearchterm = '';
        scope.settingsAdmin.pristine = false;
        scope.settingsAdmin.displayPasswordHeader = false;
        scope.settingsAdmin.editNameMode = false;
        scope.settingsAdmin.editEmailMode = false;
        scope.settingsAdmin.updateUser = {};
        scope.settingsAdmin.addUserList = [{}];
        scope.settingsAdmin.userProject = {
            list: [],
            user: '',
            userName: '',
        };
        scope.settingsAdmin.overlay = {
            openAddUser: false,
            openAddAppPermissions: false,
            openDeleteUser: false,
            resetEditUser: false, // TODO: take this out of overlay
        };
        scope.settingsAdmin.showValidation = false;
        scope.settingsAdmin.accessAll = false;
        scope.settingsAdmin.searchAdminUsers = '';
        scope.settingsAdmin.searchAdminProjects = { name: '' };
        scope.settingsAdmin.searchAdminDBs = { name: '' };

        scope.settingsAdmin.switchAdminTabs = switchAdminTabs;
        scope.settingsAdmin.openAddUserOverlay = openAddUserOverlay;
        scope.settingsAdmin.closeAddUserOverlay = closeAddUserOverlay;
        scope.settingsAdmin.getAllProjectUserData = getAllProjectUserData;
        scope.settingsAdmin.updateUserData = updateUserData;
        scope.settingsAdmin.updateUserInfo = updateUserInfo;
        scope.settingsAdmin.cloneUser = cloneUser;
        scope.settingsAdmin.resetForm = resetForm;
        scope.settingsAdmin.resetUserForm = resetUserForm;
        scope.settingsAdmin.setUserProjectList = setUserProjectList;
        scope.settingsAdmin.addCacUser = addCacUser;
        scope.settingsAdmin.setPasswordHeaderVisibility =
            setPasswordHeaderVisibility;
        scope.settingsAdmin.passwordValidate = passwordValidate;
        scope.settingsAdmin.removeAdminUser = removeAdminUser;
        scope.settingsAdmin.updateSelectedItem = updateSelectedItem;
        scope.settingsAdmin.savePermissionsAll = savePermissionsAll;

        /**
         * @name updateSelectedItem
         * @desc updates the UI when a new item from the list is selected
         * @param {*} item - selected item
         * @param {string} tab - tab name
         * @returns {void}
         */
        function updateSelectedItem(item, tab) {
            scope.settingsAdmin.userSearchterm = '';
            scope.settingsAdmin.insightSearchterm = '';
            scope.settingsAdmin.insightUserSearchterm = '';
            scope.settingsAdmin.selectedItemTab = 'Project Permissions';
            scope.settingsCtrl.updateItemData(item, true, tab);
        }

        /**
         * @name switchAdminTabs
         * @desc switch between 'Projects', 'Databases', and  'Members' tabs and update data accordingly
         * @param {string} tab the tab being swtiched to
         * @returns {void}
         */
        function switchAdminTabs(tab) {
            scope.settingsAdmin.selectedAdminTab = tab;
            scope.settingsAdmin.userSearchterm = '';
            scope.settingsAdmin.insightSearchterm = '';
            scope.settingsAdmin.insightUserSearchterm = '';
            if (tab === 'Members') {
                updateUserData(scope.settingsCtrl.allUsers[0]);
            } else if (tab === 'Projects') {
                updateSelectedItem(
                    scope.settingsCtrl.projectAdminOwnInfo[0],
                    tab
                ); // select the first project to display its info
            } else if (tab === 'Databases') {
                if (scope.settingsCtrl.DBAdminOwnInfo.length === 0) {
                    // we have not yet loaded the DBs
                    scope.settingsCtrl.getDBs(true); // load the databases and the select the first DB as the selected db
                } else {
                    updateSelectedItem(
                        scope.settingsCtrl.DBAdminOwnInfo[0],
                        tab
                    ); // select the first db to display its info
                }
            }
        }

        /**
         * @name openAddUserOverlay
         * @desc open the overlay
         * @returns {void}
         */
        function openAddUserOverlay() {
            scope.settingsAdmin.overlay.openAddUser = true;
            scope.settingsAdmin.addUser = {};
        }

        /**
         * @name closeAddUserOverlay
         * @desc close the overlay
         * @returns {void}
         */
        function closeAddUserOverlay() {
            scope.settingsAdmin.overlay.openAddUser = false;
            scope.settingsAdmin.displayPasswordHeader = false;
        }

        /**
         * @name getAllProjectUserData
         * @desc Function to get group data from BE
         * @returns {void}
         */
        function getAllProjectUserData() {
            monolithService.getAllUsers().then(
                function (data) {
                    scope.settingsAdmin.allProjectUserData = data;
                    let user = scope.settingsAdmin.allProjectUserData[0];
                    scope.settingsAdmin.userProject.user = {
                        id: user.id,
                        name: user.name,
                    };
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
         * @name updateUserData
         * @desc update the data displayed for a given user
         * @param {any} user the user being switched to
         * @returns {void}
         */
        function updateUserData(user) {
            scope.settingsAdmin.selectedAdminUserTab = 'Member Settings';
            scope.settingsAdmin.user = user;
            scope.settingsAdmin.cloneUser(user);
            scope.settingsAdmin.editEmailMode = false;
            scope.settingsAdmin.editNameMode = false;
            scope.settingsAdmin.pristine = true;

            scope.settingsAdmin.name = user.name;
            scope.settingsAdmin.userProject.user = {
                id: user.id,
                name: user.name,
            };
        }

        /**
         * @name setUserProjectList
         * @desc sets the projects for this user and their permission
         * @returns {void}
         */
        function setUserProjectList() {
            monolithService
                .getAllUserProjects(scope.settingsAdmin.userProject.user)
                .then(function (response) {
                    let appIdx, selectedIdx;

                    for (
                        appIdx = 0;
                        appIdx < scope.settingsAdmin.userProject.list.length;
                        appIdx++
                    ) {
                        scope.settingsAdmin.userProject.list[
                            appIdx
                        ].author = false;
                        scope.settingsAdmin.userProject.list[
                            appIdx
                        ].editor = false;
                        scope.settingsAdmin.userProject.list[
                            appIdx
                        ].read_only = false;

                        scope.settingsAdmin.userProject.list[
                            appIdx
                        ].og_author = false;
                        scope.settingsAdmin.userProject.list[
                            appIdx
                        ].og_editor = false;
                        scope.settingsAdmin.userProject.list[
                            appIdx
                        ].og_read_only = false;

                        scope.settingsAdmin.accessAll =
                            scope.settingsAdmin.userProject.list.length ===
                            response.length;
                        for (
                            selectedIdx = 0;
                            selectedIdx < response.length;
                            selectedIdx++
                        ) {
                            if (
                                scope.settingsAdmin.userProject.list[appIdx]
                                    .app_id === response[selectedIdx].app_id
                            ) {
                                //   OWNER, EDIT, READ_ONLY
                                scope.settingsAdmin.userProject.list[
                                    appIdx
                                ].author =
                                    response[selectedIdx].project_permission ===
                                    'OWNER';
                                scope.settingsAdmin.userProject.list[
                                    appIdx
                                ].editor =
                                    response[selectedIdx].project_permission ===
                                    'EDIT';
                                scope.settingsAdmin.userProject.list[
                                    appIdx
                                ].read_only =
                                    response[selectedIdx].project_permission ===
                                    'READ_ONLY';

                                // need to keep track of original values so we know whether to do add/edit/delete when values change
                                scope.settingsAdmin.userProject.list[
                                    appIdx
                                ].og_author =
                                    scope.settingsAdmin.userProject.list[
                                        appIdx
                                    ].author;
                                scope.settingsAdmin.userProject.list[
                                    appIdx
                                ].og_editor =
                                    scope.settingsAdmin.userProject.list[
                                        appIdx
                                    ].editor;
                                scope.settingsAdmin.userProject.list[
                                    appIdx
                                ].og_read_only =
                                    scope.settingsAdmin.userProject.list[
                                        appIdx
                                    ].read_only;
                            }
                        }
                    }
                });
        }

        /**
         * @name cloneUser
         * @desc do not update values until click on update button
         * @param  {object} user the user
         * @returns {void}
         */
        function cloneUser(user) {
            scope.settingsAdmin.updateUser = angular.copy(user);
            scope.settingsAdmin.updateUser.originalID =
                scope.settingsAdmin.updateUser.id;
            scope.settingsAdmin.updateUser.originalEmail =
                scope.settingsAdmin.updateUser.email;
            scope.settingsAdmin.updateUser.originalUsername =
                scope.settingsAdmin.updateUser.username;
            scope.settingsAdmin.updateUser.password = '';
        }

        /**
         * @name resetForm
         * @desc reset form to pristine
         * @param  {object} updateForm form
         * @returns {boolean} return bool
         */
        function resetForm(updateForm) {
            if (
                updateForm &&
                scope.settingsAdmin.pristine &&
                scope.settingsAdmin.overlay.resetEditUser
            ) {
                // TODO: see if overlay can be moved to admin
                updateForm.$setPristine();
                updateForm.$setUntouched();
                scope.settingsAdmin.pristine = false;
            } else if (scope.settingsAdmin.overlay.resetEditUser) {
                scope.settingsAdmin.overlay.resetEditUser = false;
                return false;
            }
            return !scope.settingsAdmin.overlay.resetEditUser;
        }

        /**
         * @name resetUserForm
         * @desc reset form to pristine
         * @param  {object} addUserForm form
         * @returns {boolean} return bool
         */
        function resetUserForm(addUserForm) {
            if (
                addUserForm &&
                scope.settingsAdmin.overlay.openAddUser &&
                scope.settingsAdmin.pristine
            ) {
                // TODO: see if overlay can be moved to admin
                addUserForm.$setPristine();
                addUserForm.$setUntouched();
                scope.settingsAdmin.pristine = false;
            }
            return scope.settingsAdmin.overlay.openAddUser;
        }

        /**
         * @name updateUserInfo
         * @desc function that is called to update user information
         * @param  {string} updateUserForm - form name
         * @returns {void}
         */
        function updateUserInfo(updateUserForm) {
            let newId, newEmail, newUsername;
            newId =
                scope.settingsAdmin.updateUser.id ===
                scope.settingsAdmin.updateUser.originalID
                    ? ''
                    : scope.settingsAdmin.updateUser.id; // if the id has not changed, just pass in an empty string
            newEmail =
                scope.settingsAdmin.updateUser.email ===
                scope.settingsAdmin.updateUser.originalEmail
                    ? ''
                    : scope.settingsAdmin.updateUser.email;
            newUsername =
                scope.settingsAdmin.updateUser.username ===
                scope.settingsAdmin.updateUser.originalUsername
                    ? ''
                    : scope.settingsAdmin.updateUser.username;

            if (scope.settingsAdmin.updateUser.originalUsername === 'null') {
                scope.settingsAdmin.updateUser.originalUsername = '';
            }

            if (scope.settingsAdmin.updateUser.publisher === 'null') {
                scope.settingsAdmin.updateUser.publisher = false;
            }

            if (scope.settingsAdmin.updateUser.exporter === 'null') {
                scope.settingsAdmin.updateUser.exporter = false;
            }

            if (scope.settingsAdmin.updateUser.phone === 'null') {
                scope.settingsAdmin.updateUser.phone = null;
            }
            if (scope.settingsAdmin.updateUser.phoneextension === 'null') {
                scope.settingsAdmin.updateUser.phoneextension = null;
            }
            if (scope.settingsAdmin.updateUser.countrycode === 'null') {
                scope.settingsAdmin.updateUser.countrycode = null;
            }

            monolithService
                .updateUser(
                    scope.settingsAdmin.updateUser.originalID,
                    scope.settingsAdmin.updateUser.name,
                    scope.settingsAdmin.updateUser.originalEmail,
                    scope.settingsAdmin.updateUser.password,
                    scope.settingsAdmin.updateUser.makeadmin,
                    scope.settingsAdmin.updateUser.publisher,
                    scope.settingsAdmin.updateUser.exporter,
                    scope.settingsAdmin.updateUser.type,
                    scope.settingsAdmin.updateUser.phone,
                    scope.settingsAdmin.updateUser.phoneextension,
                    scope.settingsAdmin.updateUser.countrycode,
                    scope.settingsAdmin.updateUser.originalUsername,
                    newId,
                    newEmail,
                    newUsername
                )
                .then(
                    function () {
                        if (updateUserForm) {
                            // updateUserForm.$setPristine();
                            updateUserForm.$setUntouched();
                        }
                        scope.settingsAdmin.getAllProjectUserData();
                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'You have successfully updated user information',
                        });
                    },
                    function (error) {
                        scope.settingsAdmin.getAllProjectUserData();
                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
        }

        /**
         * @name addCacUser
         * @desc function that is called to create new user
         * @returns {void}
         */
        function addCacUser() {
            let addIdx,
                queuedAdd = [];

            for (
                addIdx = 0;
                addIdx < scope.settingsAdmin.addUserList.length;
                addIdx++
            ) {
                const user = scope.settingsAdmin.addUserList[addIdx];
                if (user.cacId) {
                    // only send rows with valid user ids
                    if (
                        user.type === 'Native' &&
                        user.password &&
                        user.password.length > 0
                    ) {
                        // password can only be set for native users
                        queuedAdd.push(
                            monolithService.addNewUser(
                                user.cacId,
                                user.admin,
                                user.publisher,
                                user.exporter,
                                user.name,
                                user.email,
                                user.type,
                                user.password
                            )
                        );
                    } else {
                        queuedAdd.push(
                            monolithService.addNewUser(
                                user.cacId,
                                user.admin,
                                user.publisher,
                                user.exporter,
                                user.name,
                                user.email,
                                user.type
                            )
                        );
                    }
                }
            }

            if (queuedAdd.length > 0) {
                $q.all(queuedAdd).then(
                    function () {
                        scope.settingsAdmin.addUser = {};
                        scope.settingsAdmin.addUserList = [{}];
                        scope.settingsAdmin.getAllProjectUserData();
                        scope.settingsAdmin.closeAddUserOverlay();

                        semossCoreService.emit('alert', {
                            color: 'success',
                            text: 'You have successfully added new user(s)',
                        });
                    },
                    function (error) {
                        scope.settingsAdmin.getAllProjectUserData();

                        semossCoreService.emit('alert', {
                            color: 'error',
                            text: error.data.errorMessage,
                        });
                    }
                );
            } else {
                scope.settingsAdmin.closeAddUserOverlay();
                semossCoreService.emit('alert', {
                    color: 'error',
                    text: 'No new users to add',
                });
            }
        }

        /**
         * @name setPasswordHeaderVisibility
         * @desc show or hide the password header in the add users overlay
         * @returns {void}
         */
        function setPasswordHeaderVisibility() {
            scope.settingsAdmin.displayPasswordHeader = false;
            for (
                let userIdx = 0;
                userIdx < scope.settingsAdmin.addUserList.length;
                userIdx++
            ) {
                if (
                    scope.settingsAdmin.addUserList[userIdx].type === 'Native'
                ) {
                    scope.settingsAdmin.displayPasswordHeader = true;
                    return;
                }
            }
        }

        /**
         * @name passwordValidate
         * @desc function that validate password strength for user registration
         * @returns {void}
         */
        function passwordValidate() {
            scope.settingsAdmin.showValidation = true;
            // When the user starts to type something inside the password field
            let inputpwd = ele[0].querySelector('#psw'),
                letter = ele[0].querySelector('#letter'),
                capital = ele[0].querySelector('#capital'),
                number = ele[0].querySelector('#number'),
                special = ele[0].querySelector('#special'),
                length = ele[0].querySelector('#length'),
                lowerCaseLetters = /[a-z]/g,
                upperCaseLetters = /[A-Z]/g,
                numbers = /[0-9]/g,
                specials = /[!@#\$%\^&\*]/g;

            // When the user clicks on the password field, show the message box
            ele[0].querySelector('#settings-message').style.display = 'block';

            if (inputpwd.value.match(lowerCaseLetters)) {
                letter.classList.remove('smss-color--error');
                letter.classList.add('smss-color--success');
            } else {
                letter.classList.remove('smss-color--success');
                letter.classList.add('smss-color--error');
            }

            if (inputpwd.value.match(upperCaseLetters)) {
                capital.classList.remove('smss-color--error');
                capital.classList.add('smss-color--success');
            } else {
                capital.classList.remove('smss-color--success');
                capital.classList.add('smss-color--error');
            }

            if (inputpwd.value.match(numbers)) {
                number.classList.remove('smss-color--error');
                number.classList.add('smss-color--success');
            } else {
                number.classList.remove('smss-color--success');
                number.classList.add('smss-color--error');
            }

            if (inputpwd.value.match(specials)) {
                special.classList.remove('smss-color--error');
                special.classList.add('smss-color--success');
            } else {
                special.classList.remove('smss-color--success');
                special.classList.add('smss-color--error');
            }
            // Validate length
            if (inputpwd.value.length >= 8) {
                length.classList.remove('smss-color--error');
                length.classList.add('smss-color--success');
            } else {
                length.classList.remove('smss-color--success');
                length.classList.add('smss-color--error');
            }
        }

        /**
         * @name removeAdminUser
         * @desc Function to remove user
         * @param {string} userId the user id
         * @param {string} type the type of user login
         * @returns {void}
         */
        function removeAdminUser(userId, type) {
            monolithService.removeAdminUser(userId, type).then(
                function () {
                    // get updated information back from BE
                    scope.settingsAdmin.getAllProjectUserData();
                    semossCoreService.emit('alert', {
                        color: 'success',
                        text: 'Successfully removed user',
                    });
                },
                function (error) {
                    // get updated information back from BE
                    scope.settingsAdmin.getAllProjectUserData();

                    semossCoreService.emit('alert', {
                        color: 'error',
                        text: error.data.errorMessage,
                    });
                }
            );
        }

        /**
         * @name savePermissionsAll
         * @param {boolean} isNewAdd whether permissions are being granted for new or existing users
         * @param {string} permission read-only, author, or editor
         * @param {string} givePermissionTo the project id
         * @param {string} type 'Projects' or 'Databases'
         * @desc Function to give project permissions to all apps/insights for a user OR all users for an app/insight
         * Function will send object to BE for updates
         * @returns {void}
         */
        function savePermissionsAll(
            isNewAdd,
            permission,
            givePermissionTo,
            type
        ) {
            if (type === 'Projects') {
                monolithService
                    .addProjectAllUserPermissions(
                        givePermissionTo.project_id,
                        permission,
                        isNewAdd
                    )
                    .then(
                        function () {
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Successfully added permission information for the project.',
                            });
                            $timeout(function () {
                                scope.settingsCtrl.getProjectUsers(
                                    true,
                                    givePermissionTo.project_id
                                );
                            });
                        },
                        function (response) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: response.data.errorMessage,
                            });
                            $timeout(function () {
                                scope.settingsCtrl.getProjectUsers(
                                    true,
                                    givePermissionTo.project_id
                                );
                            });
                        }
                    );
            } else {
                // DBs
                monolithService
                    .addDBAllUserPermissions(
                        givePermissionTo.app_id,
                        permission,
                        isNewAdd
                    )
                    .then(
                        function () {
                            semossCoreService.emit('alert', {
                                color: 'success',
                                text: 'Successfully added permission information for the database.',
                            });
                            $timeout(function () {
                                scope.settingsCtrl.getDBUsers(
                                    true,
                                    givePermissionTo.app_id
                                );
                            });
                        },
                        function (response) {
                            semossCoreService.emit('alert', {
                                color: 'error',
                                text: response.data.errorMessage,
                            });
                            $timeout(function () {
                                scope.settingsCtrl.getDBUsers(
                                    true,
                                    givePermissionTo.app_id
                                );
                            });
                        }
                    );
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {}

        initialize();
    }
}
