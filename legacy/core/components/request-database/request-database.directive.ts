'use strict';

import angular from 'angular';
import smssColorPickerDirective from '../../../style/src/smss-color-picker/smss-color-picker.directive';

export default angular
    .module('app.request-database.directive', [])
    .directive('requestDatabase', requestDatabaseDirective);

import './request-database.scss';

requestDatabaseDirective.$inject = [
    'semossCoreService',
    'monolithService',
    '$q',
];

function requestDatabaseDirective(semossCoreService, monolithService, $q) {
    requestDatabaseCtrl.$inject = [];
    requestDatabaseLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        require: ['^database'],
        restrict: 'E',
        template: require('./request-database.directive.html'),
        bindToController: {
            open: '=',
            db: '=',
        },
        controller: requestDatabaseCtrl,
        controllerAs: 'requestDatabase',
        link: requestDatabaseLink,
    };

    function requestDatabaseCtrl() {}

    function requestDatabaseLink(scope, ele, attrs, ctrl) {
        scope.databaseCtrl = ctrl[0];
        const PERMISSIONS = {
            OWNER: 'Author',
            EDIT: 'Editor',
            READ_ONLY: 'Viewer',
        };

        scope.requestDatabase.permissions = [
            { display: PERMISSIONS.OWNER, value: 'OWNER' },
            { display: PERMISSIONS.EDIT, value: 'EDIT' },
            { display: PERMISSIONS.READ_ONLY, value: 'READ_ONLY' },
        ];
        scope.requestDatabase.discoverable = false;

        scope.requestDatabase.users = {
            raw: {},
            filtered: {},
        };
        scope.requestDatabase.searchTerm = '';

        /** Request */
        scope.requestDatabase.open = false;
        scope.requestDatabase.showAlert = false;
        scope.requestDatabase.allUsers = [];
        scope.requestDatabase.newUsers = [];

        // scope.requestDatabase.addUsers = addUsers;
        scope.requestDatabase.requestAccess = requestAccess;
        scope.requestDatabase.hideRequest = hideRequest;

        /** Request Functions */

        /**
         * @name hideRequest
         * @desc closes the add user overlay and resets values
         */
        function hideRequest() {
            scope.requestDatabase.newUsers = [];
            scope.requestDatabase.tempUser = {
                user: '',
                permission: '',
            };
            scope.requestDatabase.showAlert = false;
            scope.requestDatabase.open = false;
        }

        /**
         * @name requestAccess
         * @desc Requests Access to the current database
         */
        function requestAccess(): void {
            const message = semossCoreService.utility.random('request');

            semossCoreService.emit('meta-pixel', {
                insightID: 'new',
                commandList: [
                    {
                        meta: true,
                        type: 'requestDatabase',
                        components: [
                            scope.requestDatabase.db.database_id,
                            scope.requestDatabase.tempUser.permission.value,
                        ],
                        terminal: true,
                    },
                ],
                listeners: [],
                response: message,
            });
        }
    }
}
