'use strict';

export default angular
    .module('app.metamodel.metamodel-tables', [])
    .directive('metamodelTables', metamodelTablesDirective);

import angular from 'angular';
import './metamodel-tables.scss';

metamodelTablesDirective.$inject = ['$timeout', 'semossCoreService'];

function metamodelTablesDirective($timeout, semossCoreService) {
    metamodelTablesCtrl.$inject = [];
    metamodelTablesLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./metamodel-tables.directive.html'),
        scope: {},
        require: [],
        controllerAs: 'metamodelTables',
        bindToController: {
            metamodel: '=',
            allTables: '=',
            change: '&?',
            open: '=',
        },
        controller: metamodelTablesCtrl,
        link: metamodelTablesLink,
    };

    function metamodelTablesCtrl() {}

    function metamodelTablesLink(scope, ele, attrs, ctrl) {
        scope.metamodelTables.tablesInformation = {
            options: [],
            model: [],
        };

        scope.metamodelTables.cancelTable = cancelTable;
        scope.metamodelTables.saveTable = saveTable;

        /** Metamodel Functions */

        /** Table Functions */
        /**
         * @name setTable
         * @desc selects a column to grab data about
         * @return {void}
         */
        function setTable() {
            var tableMapping = {},
                table,
                column;

            // create the options (aka things that haven't been added)
            scope.metamodelTables.tablesInformation.options = [];

            // create a mapping
            for (table in scope.metamodelTables.allTables) {
                if (scope.metamodelTables.allTables.hasOwnProperty(table)) {
                    tableMapping[table] =
                        scope.metamodelTables.allTables[table].alias;
                }
            }

            // delete from the mapping if it is already there (only the columns)
            for (table in scope.metamodelTables.metamodel.tables) {
                if (
                    scope.metamodelTables.metamodel.tables.hasOwnProperty(table)
                ) {
                    // delete the options, but not the tables
                    for (column in scope.metamodelTables.metamodel.tables[table]
                        .columns) {
                        if (
                            scope.metamodelTables.metamodel.tables[
                                table
                            ].columns.hasOwnProperty(column)
                        ) {
                            if (tableMapping.hasOwnProperty(column)) {
                                if (table !== column) {
                                    delete tableMapping[column];
                                }
                            }
                        }
                    }
                }
            }

            for (table in tableMapping) {
                if (tableMapping.hasOwnProperty(table)) {
                    scope.metamodelTables.tablesInformation.options.push({
                        table: table,
                        alias: tableMapping[table],
                    });
                }
            }

            // sort
            scope.metamodelTables.tablesInformation.options.sort(function (
                a,
                b
            ) {
                var textA = a.alias.toUpperCase(),
                    textB = b.alias.toUpperCase();

                if (textA < textB) {
                    return -1;
                }
                if (textA > textB) {
                    return 1;
                }

                return 0;
            });

            // this is the selected information
            scope.metamodelTables.tablesInformation.model = [];
            for (table in scope.metamodelTables.metamodel.tables) {
                if (
                    scope.metamodelTables.metamodel.tables.hasOwnProperty(table)
                ) {
                    scope.metamodelTables.tablesInformation.model.push(
                        scope.metamodelTables.metamodel.tables[table].table
                    );
                }
            }
        }
        /**
         * @name cancelTable
         * @desc edit a column alias
         * @param {string} selected - selected table information
         * @return {void}
         */
        function cancelTable() {
            scope.metamodelTables.tablesInformation = {
                options: [],
                model: [],
            };

            // push the changes via a callback
            if (scope.metamodelTables.change) {
                scope.metamodelTables.change({
                    model: scope.metamodelTables.metamodel,
                });
            }

            // Close the overlay
            scope.metamodelTables.open = false;
        }

        /**
         * @name saveTable
         * @desc edit a column alias
         * @return {void}
         */
        function saveTable() {
            var tableMapping, i, len;

            // create a mapping, this will help us update the tables (rather than replace)
            tableMapping = {};
            for (
                i = 0,
                    len = scope.metamodelTables.tablesInformation.model.length;
                i < len;
                i++
            ) {
                tableMapping[scope.metamodelTables.tablesInformation.model[i]] =
                    i;
            }

            // remove relationships that are between tables that are missing
            for (
                i = scope.metamodelTables.metamodel.relationships.length - 1;
                i >= 0;
                i--
            ) {
                // remove the relationship, that if a table in the mapping
                if (
                    !tableMapping.hasOwnProperty(
                        scope.metamodelTables.metamodel.relationships[i]
                            .fromTable
                    ) ||
                    !tableMapping.hasOwnProperty(
                        scope.metamodelTables.metamodel.relationships[i].toTable
                    )
                ) {
                    scope.metamodelTables.metamodel.relationships.splice(i, 1);
                }
            }

            // delete the tables
            for (i in scope.metamodelTables.metamodel.tables) {
                if (
                    !tableMapping.hasOwnProperty(
                        scope.metamodelTables.metamodel.tables[i].table
                    )
                ) {
                    // remove the tables, that aren't in the mapping
                    delete scope.metamodelTables.metamodel.tables[i];
                } else {
                    // delete the mapping value, because it is already added
                    delete tableMapping[
                        scope.metamodelTables.metamodel.tables[i].table
                    ];
                }
            }

            // add the tables that are remaining in the mapping
            for (i in tableMapping) {
                if (tableMapping.hasOwnProperty(i)) {
                    scope.metamodelTables.metamodel.tables[i] = JSON.parse(
                        JSON.stringify(scope.metamodelTables.allTables[i])
                    );
                }
            }

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Table changes saved',
            });

            cancelTable();
        }

        /** Helpers */
        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            $timeout(function () {
                scope.$watch(
                    function () {
                        return JSON.stringify(scope.metamodelTables.metamodel);
                    },
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            setTable();
                        }
                    }
                );

                setTable();
            });

            // Call setTable whenever the modal is opened
            scope.$watch('metamodelTables.open', function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && newValue) {
                    setTable();
                }
            });
        }

        initialize();
    }
}
