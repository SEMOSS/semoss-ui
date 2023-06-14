'use strict';

export default angular
    .module('app.metamodel.metamodel-relationships', [])
    .directive('metamodelRelationships', metamodelRelationshipsDirective);

import './metamodel-relationships.scss';

metamodelRelationshipsDirective.$inject = ['$timeout', 'semossCoreService'];

function metamodelRelationshipsDirective($timeout, semossCoreService) {
    metamodelRelationshipsCtrl.$inject = [];
    metamodelRelationshipsLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./metamodel-relationships.directive.html'),
        scope: {},
        require: [],
        controllerAs: 'metamodelRelationships',
        bindToController: {
            metamodel: '=',
            type: '=',
            change: '&?',
            open: '=',
        },
        controller: metamodelRelationshipsCtrl,
        link: metamodelRelationshipsLink,
    };

    function metamodelRelationshipsCtrl() {}

    function metamodelRelationshipsLink(scope, ele, attrs, ctrl) {
        scope.metamodelRelationships.relationshipInformation = {
            tableMapping: [],
            columnMapping: {},
            relationships: [],
            valid: true,
            new: {
                fromTable: '',
                fromColumn: '',
                toTable: '',
                toColumn: '',
                alias: '',
                valid: false,
            },
        };

        scope.metamodelRelationships.checkTableRelationship =
            checkTableRelationship;
        scope.metamodelRelationships.checkNewRelationship =
            checkNewRelationship;
        scope.metamodelRelationships.addRelationship = addRelationship;
        scope.metamodelRelationships.deleteRelationship = deleteRelationship;
        scope.metamodelRelationships.cancelRelationship = cancelRelationship;
        scope.metamodelRelationships.saveRelationship = saveRelationship;

        /** Metamodel Functions */

        /** Relationship Functions */
        /**
         * @name showRelationship
         * @desc selects a column to grab data about
         * @return {void}
         */
        function showRelationship() {
            var i, j;

            // create the mapping
            scope.metamodelRelationships.relationshipInformation.tableMapping =
                [];
            scope.metamodelRelationships.relationshipInformation.columnMapping =
                {};

            for (i in scope.metamodelRelationships.metamodel.tables) {
                if (
                    scope.metamodelRelationships.metamodel.tables.hasOwnProperty(
                        i
                    )
                ) {
                    scope.metamodelRelationships.relationshipInformation.tableMapping.push(
                        {
                            table: scope.metamodelRelationships.metamodel
                                .tables[i].table,
                            alias: scope.metamodelRelationships.metamodel
                                .tables[i].alias,
                        }
                    );

                    scope.metamodelRelationships.relationshipInformation.columnMapping[
                        scope.metamodelRelationships.metamodel.tables[i].table
                    ] = [];
                    for (j in scope.metamodelRelationships.metamodel.tables[i]
                        .columns) {
                        if (
                            scope.metamodelRelationships.metamodel.tables[
                                i
                            ].columns.hasOwnProperty(j)
                        ) {
                            scope.metamodelRelationships.relationshipInformation.columnMapping[
                                scope.metamodelRelationships.metamodel.tables[i]
                                    .table
                            ].push({
                                column: scope.metamodelRelationships.metamodel
                                    .tables[i].columns[j].column,
                                alias: scope.metamodelRelationships.metamodel
                                    .tables[i].columns[j].alias,
                            });
                        }
                    }

                    // sort
                    scope.metamodelRelationships.relationshipInformation.columnMapping[
                        scope.metamodelRelationships.metamodel.tables[i].table
                    ].sort(function (a, b) {
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
                }
            }

            // sort
            scope.metamodelRelationships.relationshipInformation.tableMapping.sort(
                function (a, b) {
                    var textA = a.alias.toUpperCase(),
                        textB = b.alias.toUpperCase();

                    if (textA < textB) {
                        return -1;
                    }
                    if (textA > textB) {
                        return 1;
                    }

                    return 0;
                }
            );

            scope.metamodelRelationships.relationshipInformation.relationships =
                JSON.parse(
                    JSON.stringify(
                        scope.metamodelRelationships.metamodel.relationships
                    )
                );

            scope.metamodelRelationships.relationshipInformation.new = {
                fromTable: '',
                fromColumn: '',
                toTable: '',
                toColumn: '',
                alias: '',
                valid: false,
            };

        }

        /**
         * @name checkTableRelationship
         * @desc is the new relationship valid
         * @param {number} relIdx - index of the relationship
         * @param {string} type - type of change
         * @return {void} valid or not
         */
        function checkTableRelationship(relIdx, type) {
            var selected, column;

            if (scope.metamodelRelationships.type === 'GRAPH') {
                scope.metamodelRelationships.relationshipInformation.valid = true;
                return;
            }

            selected =
                scope.metamodelRelationships.relationshipInformation
                    .relationships[relIdx];

            if (selected) {
                if (type === 'from') {
                    if (
                        scope.metamodelRelationships.relationshipInformation
                            .columnMapping[selected.fromTable] &&
                        scope.metamodelRelationships.relationshipInformation
                            .columnMapping[selected.toTable][0]
                    ) {
                        column =
                            scope.metamodelRelationships.relationshipInformation
                                .columnMapping[selected.fromTable][0].column;
                    }

                    if (column) {
                        selected.fromColumn = column;
                        scope.metamodelRelationships.relationshipInformation.valid = true;
                        return;
                    }
                } else if (type === 'to') {
                    if (
                        scope.metamodelRelationships.relationshipInformation
                            .columnMapping[selected.toTable] &&
                        scope.metamodelRelationships.relationshipInformation
                            .columnMapping[selected.toTable][0]
                    ) {
                        column =
                            scope.metamodelRelationships.relationshipInformation
                                .columnMapping[selected.toTable][0].column;
                    }

                    if (column) {
                        selected.toColumn = column;
                        scope.metamodelRelationships.relationshipInformation.valid = true;
                        return;
                    }
                }
            }

            scope.metamodelRelationships.relationshipInformation.valid = false;
        }

        /**
         * @name checkNewRelationship
         * @desc is the new relationship valid
         * @return {void} valid or not
         */
        function checkNewRelationship() {
            if (scope.metamodelRelationships.type === 'GRAPH') {
                scope.metamodelRelationships.relationshipInformation.new.valid =
                    scope.metamodelRelationships.relationshipInformation.new
                        .fromTable &&
                    scope.metamodelRelationships.relationshipInformation.new
                        .toTable;

                return;
            }

            scope.metamodelRelationships.relationshipInformation.new.valid =
                scope.metamodelRelationships.relationshipInformation.new
                    .fromTable &&
                scope.metamodelRelationships.relationshipInformation.new
                    .fromColumn &&
                scope.metamodelRelationships.relationshipInformation.new
                    .toTable &&
                scope.metamodelRelationships.relationshipInformation.new
                    .toColumn;
        }

        /**
         * @name addRelationship
         * @desc selects a column to grab data about
         * @return {void}
         */
        function addRelationship() {
            var add = true,
                i,
                len;

            // make sure it isn't added in
            // loop over relationships
            for (
                i = 0,
                    len =
                        scope.metamodelRelationships.relationshipInformation
                            .relationships;
                i < len;
                i++
            ) {
                if (
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].fromTable ===
                        scope.metamodelRelationships.relationshipInformation.new
                            .fromTable &&
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].fromColumn ===
                        scope.metamodelRelationships.relationshipInformation.new
                            .fromColumn &&
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].toTable ===
                        scope.metamodelRelationships.relationshipInformation.new
                            .toTable &&
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].toColumn ===
                        scope.metamodelRelationships.relationshipInformation.new
                            .toColumn
                ) {
                    add = false;
                    semossCoreService.emit('alert', {
                        color: 'warn',
                        text: 'Relationship already added',
                    });
                    break;
                }
            }

            // add it
            if (add) {
                scope.metamodelRelationships.relationshipInformation.relationships.push(
                    {
                        fromTable:
                            scope.metamodelRelationships.relationshipInformation
                                .new.fromTable,
                        fromColumn:
                            scope.metamodelRelationships.relationshipInformation
                                .new.fromColumn,
                        toTable:
                            scope.metamodelRelationships.relationshipInformation
                                .new.toTable,
                        toColumn:
                            scope.metamodelRelationships.relationshipInformation
                                .new.toColumn,
                        alias: scope.metamodelRelationships
                            .relationshipInformation.new.alias,
                    }
                );
            }



            // clear out
            scope.metamodelRelationships.relationshipInformation.new = {
                fromTable: '',
                fromColumn: '',
                toTable: '',
                toColumn: '',
                alias: '',
                valid: false,
            };
        }

        /**
         * @name deleteRelationship
         * @desc selects a column to grab data about
         * @param {number} idx - idx to delete
         * @return {void}
         */
        function deleteRelationship(idx) {
            scope.metamodelRelationships.relationshipInformation.relationships.splice(
                idx,
                1
            );
        }

        /**
         * @name cancelRelationship
         * @desc edit a column alias
         * @param {string} selected - selected table information
         * @return {void}
         */
        function cancelRelationship() {
            scope.metamodelRelationships.relationshipInformation = {
                tableMapping: [],
                columnMapping: {},
                relationships: [],
                valid: true,
                new: {
                    fromTable: '',
                    fromColumn: '',
                    toTable: '',
                    toColumn: '',
                    alias: '',
                    valid: false,
                },
            };

            // push the changes via a callback
            if (scope.metamodelRelationships.change) {
                scope.metamodelRelationships.change({
                    model: scope.metamodelRelationships.metamodel,
                });
            }

            // Close overlay
            scope.metamodelRelationships.open = false;
        }

        /**
         * @name saveRelationship
         * @desc edit a column alias
         * @return {void}
         */
        function saveRelationship() {
            var added = {},
                temp,
                i;

            // make sure it isn't added in
            for (
                i =
                    scope.metamodelRelationships.relationshipInformation
                        .relationships.length - 1;
                i >= 0;
                i--
            ) {
                temp =
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].fromTable +
                    '.' +
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].fromColumn +
                    '..' +
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].toTable +
                    '.' +
                    scope.metamodelRelationships.relationshipInformation
                        .relationships[i].toColumn;

                if (added[temp]) {
                    scope.metamodelRelationships.relationshipInformation.relationships.splice(
                        i,
                        1
                    );
                }

                added[temp] = true;
            }

            // set the new value
            scope.metamodelRelationships.metamodel.relationships =
                scope.metamodelRelationships.relationshipInformation.relationships;

            semossCoreService.emit('alert', {
                color: 'success',
                text: 'Relationship changes saved',
            });

            cancelRelationship();
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
                        return JSON.stringify(
                            scope.metamodelRelationships.metamodel
                        );
                    },
                    function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            showRelationship();
                        }
                    }
                );

                showRelationship();
            });

            // Call showRelationship whenever the modal is opened
            scope.$watch(
                'metamodelRelationships.open',
                function (newValue, oldValue) {
                    if (!angular.equals(newValue, oldValue) && newValue) {
                        showRelationship();
                    }
                }
            );
        }

        initialize();
    }
}
