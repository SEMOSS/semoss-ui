'use strict';

export default angular
    .module('app.settings.settings-table', [])
    .directive('settingsTable', settingsTableDirective);

settingsTableDirective.$inject = [
    'monolithService',
    'semossCoreService',
    '$q',
    '$timeout',
];

function settingsTableDirective() {
    settingsTableCtrl.$inject = ['$scope'];
    settingsTableLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./settings-table.directive.html'),
        controller: settingsTableCtrl,
        link: settingsTableLink,
        require: ['^settings'],
        scope: {},
        bindToController: {
            admin: '=',
            item: '=',
            users: '=',
            searchterm: '=',
            type: '=',
        },
        controllerAs: 'settingsTable',
    };

    function settingsTableCtrl() {}

    function settingsTableLink(scope, ele, attrs, ctrl) {
        scope.settingsCtrl = ctrl[0];
        scope.settingsTable.updatePermissions = updatePermissions;
        scope.settingsTable.showConfirmDeleteOverlay = showConfirmDeleteOverlay;
        scope.settingsTable.cancelDelete = cancelDelete;
        scope.settingsTable.deleteUser = deleteUser;

        /**
         * @name showConfirmDeleteOverlay
         * @param {*} user user to delete
         * @desc Prepare overlay to display confirmation of user being deleted
         * @returns {void}
         */
        function showConfirmDeleteOverlay(user) {
            scope.settingsCtrl.removeFromTempPerm(
                user,
                scope.settingsTable.admin
            );
            scope.settingsCtrl.confirmDeleteOverlay.show = true;
            scope.settingsCtrl.confirmDeleteOverlay.isAdmin =
                scope.settingsTable.admin;
        }

        /**
         * @name cancelDelete
         * @desc Reset delete data and close the overlay
         * @returns {void}
         */
        function cancelDelete() {
            scope.settingsCtrl.confirmDeleteOverlay.show = false;
            scope.settingsCtrl.confirmDeleteOverlay.isAdmin =
                scope.settingsTable.admin;
            scope.settingsCtrl.removeUserPerm = [];
        }

        /**
         * @name deleteUser
         * @desc Remove the user from the project/db
         * @returns {void}
         */
        function deleteUser() {
            scope.settingsCtrl.confirmDeleteOverlay.show = false;
            scope.settingsCtrl.confirmDeleteOverlay.isAdmin =
                scope.settingsTable.admin;
            let selected =
                scope.settingsTable.type === 'Projects'
                    ? scope.settingsCtrl.project
                    : scope.settingsCtrl.db; // select the correct item to save (project or database)
            scope.settingsCtrl.savePermissions(
                scope.settingsCtrl.confirmDeleteOverlay.isAdmin,
                selected.id,
                scope.settingsTable.type
            );
        }

        /**
         * @name updatePermissions
         * @param {*} user user to update
         * @param {*} permission permission to update
         * @desc Update the permissions for a user
         * @returns {void}
         */
        function updatePermissions(user, permission) {
            if (scope.settingsTable.admin) {
                scope.settingsCtrl.updatePermissions(
                    user,
                    permission,
                    scope.settingsTable.admin,
                    scope.settingsTable.item,
                    scope.settingsTable.type
                );
            } else {
                scope.settingsCtrl.changeTempPerm(user, permission, false);
                scope.settingsCtrl.savePermissions(
                    false,
                    scope.settingsTable.item.id,
                    scope.settingsTable.type
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
