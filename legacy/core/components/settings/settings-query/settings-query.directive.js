'use strict';

export default angular
    .module('app.settings.settings-query', [])
    .directive('settingsQuery', settingsQueryDirective);

import './settings-query.scss';

settingsQueryDirective.$inject = ['semossCoreService'];

function settingsQueryDirective(semossCoreService) {
    settingsQueryCtrl.$inject = [];
    settingsQueryLink.$inject = ['scope'];

    return {
        restrict: 'E',
        template: require('./settings-query.directive.html'),
        controller: settingsQueryCtrl,
        link: settingsQueryLink,
        scope: {},
        bindToController: {},
        controllerAs: 'settingsQuery',
    };

    function settingsQueryCtrl() {}

    function settingsQueryLink(scope) {
        scope.settingsQuery.input = {
            database: {
                selected: '',
                options: [
                    'LocalMasterDatabase',
                    'security',
                    'scheduler',
                    'themes',
                    'UserTrackingDatabase',
                ],
                error: '',
            },
            query: {
                value: '',
                error: '',
            },
            collect: {
                value: -1,
                show: false,
                error: '',
            },
        };
        scope.settingsQuery.display = '';
        scope.settingsQuery.headers = [];
        scope.settingsQuery.values = [];

        scope.settingsQuery.verifyQuery = verifyQuery;
        scope.settingsQuery.verifyRequest = verifyRequest;

        /**
         * @name verifyQuery
         * @desc check whether the query contains SELECT, and if so update the pixel parameters and input display
         * @returns {void}
         */
        function verifyQuery() {
            scope.settingsQuery.input.query.value =
                scope.settingsQuery.input.query.value.trim();
            if (
                scope.settingsQuery.input.query.value
                    .toUpperCase()
                    .startsWith('SELECT')
            ) {
                scope.settingsQuery.input.collect.value = 100;
                scope.settingsQuery.input.collect.show = true;
            } else {
                scope.settingsQuery.input.collect.value = -1;
                scope.settingsQuery.input.collect.show = false;
            }
        }

        /**
         * @name verifyRequest
         * @desc check whether the query contains SELECT, and if so update the pixel parameters and input display
         * @returns {void}
         */
        function verifyRequest() {
            scope.settingsQuery.input.database.error = '';
            scope.settingsQuery.input.query.error = '';
            scope.settingsQuery.input.collect.error = '';

            if (!scope.settingsQuery.input.database.selected) {
                scope.settingsQuery.input.database.error =
                    'Please select a database';
            } else if (!scope.settingsQuery.input.query.value) {
                scope.settingsQuery.input.query.error = 'Please enter a query';
            } else if (
                !scope.settingsQuery.input.collect.value &&
                scope.settingsQuery.input.collect.show
            ) {
                scope.settingsQuery.input.collect.error =
                    'Please enter a number greater than 0';
            } else {
                execute();
            }
        }

        /**
         * @name execute
         * @desc execute the query
         * @returns {void}
         */
        function execute() {
            const message = semossCoreService.utility.random('query-pixel');

            semossCoreService.once(message, function (response) {
                let output, type;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    scope.settingsQuery.display = 'error';
                    scope.settingsQuery.error = output;
                }
                // if we have a select query returning data
                else if (output instanceof Object) {
                    scope.settingsQuery.headers = output.data.headers;
                    scope.settingsQuery.values = output.data.values;
                    scope.settingsQuery.display = 'table';
                }
                // if we have a non-select query
                else {
                    scope.settingsQuery.display = 'success';
                }
            });

            semossCoreService.emit('query-pixel', {
                commandList: [
                    {
                        type: 'adminDatabase',
                        components: [
                            scope.settingsQuery.input.database.selected,
                            scope.settingsQuery.input.query.value,
                            scope.settingsQuery.input.collect.value,
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /** Initialize */
        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {}

        initialize();
    }
}
