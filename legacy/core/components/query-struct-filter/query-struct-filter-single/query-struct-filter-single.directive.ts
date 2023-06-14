import angular from 'angular';

import './query-struct-filter-single.scss';

import { COMPARATOR } from '../../../constants';

export default angular
    .module('app.query-struct-filter.single', [])
    .directive('queryStructFilterSingle', queryStructFilterSingleDirective);

queryStructFilterSingleDirective.$inject = [
    '$timeout',
    '$q',
    'semossCoreService',
];

function queryStructFilterSingleDirective($timeout: ng.ITimeoutService) {
    queryStructFilterSingleCtrl.$inject = [];
    queryStructFilterSingleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./query-struct-filter-single.directive.html'),
        scope: {},
        require: ['^queryStructFilter'],
        controller: queryStructFilterSingleCtrl,
        controllerAs: 'queryStructFilterSingle',
        bindToController: {
            key: '=',
            filter: '=',
        },
        link: queryStructFilterSingleLink,
        replace: true,
    };

    function queryStructFilterSingleCtrl() {}

    function queryStructFilterSingleLink(scope, ele, attrs, ctrl) {
        let searchTimeout;

        scope.queryStructFilterCtrl = ctrl[0];

        scope.queryStructFilterSingle.selectColumn = selectColumn;
        scope.queryStructFilterSingle.selectComparator = selectComparator;
        scope.queryStructFilterSingle.searchEquality = searchEquality;
        scope.queryStructFilterSingle.getMoreEquality = getMoreEquality;
        scope.queryStructFilterSingle.searchMatch = searchMatch;
        scope.queryStructFilterSingle.getMoreMatch = getMoreMatch;

        scope.queryStructFilterSingle.taskToRemove = '';

        /** Filter */
        /**
         * @name resetFilter
         * @desc reset the filter
         */
        function resetFilter() {
            // set selected
            if (scope.queryStructFilterSingle.filter.selected) {
                selectComparator(
                    scope.queryStructFilterSingle.filter.comparator
                );
            }
        }

        /** Comparator */
        /**
         * @name selectColumn
         * @desc get a list of options available for the filter
         * @param comparator - selected comparator
         */
        function selectColumn(column: unknown): void {
            // clear the existing filter
            scope.queryStructFilterSingle.filter = {
                selected: column,
                comparator: '==',
                comparatorOptions: [],
                active: '',
                equality: {
                    loading: false,
                    taskId: false,
                    model: [],
                    options: [],
                    search: '',
                    limit: 20,
                    canCollect: true,
                },
                numerical: {
                    model: '',
                },
                date: {
                    model: '',
                },
                timestamp: {
                    model: '',
                },
                match: {
                    loading: false,
                    taskId: '',
                    model: '',
                    options: [], // all values on the dom for the alias
                    limit: 20, // how many values to collect
                    canCollect: true, // infinite scroll,
                },
            };

            selectComparator(scope.queryStructFilterSingle.filter.comparator);
        }

        /** Comparator */
        /**
         * @name selectComparator
         * @desc get a list of options available for the filter
         * @param comparator - selected comparator
         */
        function selectComparator(comparator: string): void {
            // set the comparator
            // get the correct list of comparators
            scope.queryStructFilterSingle.filter.comparatorOptions = [];

            for (
                let comparatorIdx = 0, comparatorLen = COMPARATOR.length;
                comparatorIdx < comparatorLen;
                comparatorIdx++
            ) {
                if (
                    COMPARATOR[comparatorIdx].types.indexOf(
                        scope.queryStructFilterSingle.filter.selected.type
                    ) > -1
                ) {
                    scope.queryStructFilterSingle.filter.comparatorOptions.push(
                        {
                            display:
                                COMPARATOR[comparatorIdx].display.toLowerCase(),
                            value: COMPARATOR[comparatorIdx].value,
                            types: COMPARATOR[comparatorIdx].types,
                        }
                    );
                }
            } // set a default comparator

            scope.queryStructFilterSingle.filter.comparator = '';

            if (comparator) {
                for (
                    let optIdx = 0,
                        optLen =
                            scope.queryStructFilterSingle.filter
                                .comparatorOptions.length;
                    optIdx < optLen;
                    optIdx++
                ) {
                    if (
                        scope.queryStructFilterSingle.filter.comparatorOptions[
                            optIdx
                        ].value === comparator
                    ) {
                        scope.queryStructFilterSingle.filter.comparator =
                            comparator;
                    }
                }
            }

            if (
                !scope.queryStructFilterSingle.filter.comparator &&
                scope.queryStructFilterSingle.filter.comparatorOptions.length >
                    0
            ) {
                scope.queryStructFilterSingle.filter.comparator =
                    scope.queryStructFilterSingle.filter.comparatorOptions[0].value;
            }

            if (
                scope.queryStructFilterSingle.filter.comparator === '==' ||
                scope.queryStructFilterSingle.filter.comparator === '!='
            ) {
                if (
                    !Array.isArray(
                        scope.queryStructFilterSingle.filter.equality.model
                    )
                ) {
                    scope.queryStructFilterSingle.filter.equality.model = [];
                }

                // already initialized, so no need to do not need to grab the data again
                if (
                    scope.queryStructFilterSingle.filter.active === 'equality'
                ) {
                    return;
                }

                resetEquality();
            } else if (
                (scope.queryStructFilterSingle.filter.comparator === '<' ||
                    scope.queryStructFilterSingle.filter.comparator === '<=' ||
                    scope.queryStructFilterSingle.filter.comparator === '>' ||
                    scope.queryStructFilterSingle.filter.comparator === '>=') &&
                (scope.queryStructFilterSingle.filter.selected.type ===
                    'NUMBER' ||
                    scope.queryStructFilterSingle.filter.selected.type ===
                        'DOUBLE' ||
                    scope.queryStructFilterSingle.filter.selected.type ===
                        'INT')
            ) {
                if (
                    typeof scope.queryStructFilterSingle.filter.numerical
                        .model !== 'number'
                ) {
                    scope.queryStructFilterSingle.filter.numerical.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (
                    scope.queryStructFilterSingle.filter.active === 'numerical'
                ) {
                    return;
                }

                resetNumerical();
            } else if (
                (scope.queryStructFilterSingle.filter.comparator === '<' ||
                    scope.queryStructFilterSingle.filter.comparator === '<=' ||
                    scope.queryStructFilterSingle.filter.comparator === '>' ||
                    scope.queryStructFilterSingle.filter.comparator === '>=') &&
                scope.queryStructFilterSingle.filter.selected.type === 'DATE'
            ) {
                if (
                    typeof scope.queryStructFilterSingle.filter.date.model !==
                    'string'
                ) {
                    scope.queryStructFilterSingle.filter.date.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (scope.queryStructFilterSingle.filter.active === 'date') {
                    return;
                }

                resetDate();
            } else if (
                (scope.queryStructFilterSingle.filter.comparator === '<' ||
                    scope.queryStructFilterSingle.filter.comparator === '<=' ||
                    scope.queryStructFilterSingle.filter.comparator === '>' ||
                    scope.queryStructFilterSingle.filter.comparator === '>=') &&
                scope.queryStructFilterSingle.filter.selected.type ===
                    'TIMESTAMP'
            ) {
                if (
                    typeof scope.queryStructFilterSingle.filter.timestamp
                        .model !== 'string'
                ) {
                    scope.queryStructFilterSingle.filter.timestamp.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (
                    scope.queryStructFilterSingle.filter.active === 'timestamp'
                ) {
                    return;
                }

                resetTimestamp();
            } else if (
                scope.queryStructFilterSingle.filter.comparator === '?like' ||
                scope.queryStructFilterSingle.filter.comparator === '?begins' ||
                scope.queryStructFilterSingle.filter.comparator === '?ends'
            ) {
                if (
                    typeof scope.queryStructFilterSingle.filter.match.model !==
                    'string'
                ) {
                    scope.queryStructFilterSingle.filter.match.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (scope.queryStructFilterSingle.filter.active === 'match') {
                    return;
                }

                resetMatch();
            } else {
                scope.queryStructFilterSingle.filter.active = '';
            }
        }

        /** Equality */
        /**
         * @name resetEquality
         * @desc updates filter model for this filter
         */
        function resetEquality(): void {
            const components: PixelCommand[] = [];

            //it has been initialized
            scope.queryStructFilterSingle.filter.active = 'equality';

            scope.queryStructFilterSingle.filter.equality.loading = true;

            // remove the old task before running the new task
            removeTask();

            components.push(
                {
                    type:
                        scope.queryStructFilterCtrl.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.queryStructFilterCtrl.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: scope.queryStructFilterSingle.filter
                                    .selected.selector,
                            },
                        ],
                    ],
                },
                {
                    type: 'implicitFilterOverride',
                    components: [true],
                }
            );

            if (scope.queryStructFilterSingle.filter.equality.search) {
                const filterObj = {};
                const values = [
                    scope.queryStructFilterSingle.filter.equality.search,
                ];

                // pass in the version with underscore as well to search for
                if (
                    scope.queryStructFilterSingle.filter.equality.search !==
                    scope.queryStructFilterSingle.filter.equality.search.replace(
                        / /g,
                        '_'
                    )
                ) {
                    values.push(
                        scope.queryStructFilterSingle.filter.equality.search.replace(
                            / /g,
                            '_'
                        )
                    );
                }

                // search
                filterObj[
                    scope.queryStructFilterSingle.filter.selected.selector
                ] = {
                    comparator: '?like',
                    value: values,
                };

                components.push({
                    type: 'filter',
                    components: [filterObj],
                });
            }

            components.push({
                type: 'collect',
                components: [
                    scope.queryStructFilterSingle.filter.equality.limit,
                ],
                terminal: true,
            });

            // register message to come back to
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                // reset it
                scope.queryStructFilterSingle.taskToRemove = '';
                scope.queryStructFilterSingle.filter.equality.options = [];
                scope.queryStructFilterSingle.filter.equality.loading = false;
                scope.queryStructFilterSingle.filter.equality.taskId = '';
                scope.queryStructFilterSingle.filter.equality.canCollect =
                    false;

                if (type.indexOf('ERROR') === -1) {
                    if (output) {
                        // add new ones
                        for (
                            let valueIdx = 0,
                                valueLen = output.data.values.length;
                            valueIdx < valueLen;
                            valueIdx++
                        ) {
                            scope.queryStructFilterSingle.filter.equality.options.push(
                                output.data.values[valueIdx][0]
                            );
                        }

                        // save the task
                        scope.queryStructFilterSingle.taskToRemove =
                            output.taskId;

                        // update filter control variables
                        scope.queryStructFilterSingle.filter.equality.taskId =
                            output.taskId;
                        scope.queryStructFilterSingle.filter.equality.canCollect =
                            output.numCollected === output.data.values.length;
                    }
                }
            };

            scope.queryStructFilterCtrl.meta(components, callback, []);
        }

        /**
         * @name searchEquality
         * @desc search for the options based on searchTerm
         */
        function searchEquality(search): void {
            scope.queryStructFilterSingle.filter.equality.search = search;

            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }
            searchTimeout = $timeout(function () {
                // reset vars
                resetEquality();
                $timeout.cancel(searchTimeout);
            }, 500);
        }

        /**
         * @name getMoreEquality
         * @desc get the next set of options
         */
        function getMoreEquality(): void {
            if (!scope.queryStructFilterSingle.filter.equality.canCollect) {
                return;
            }

            scope.queryStructFilterSingle.filter.equality.loading = true;

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'task',
                    components: [
                        scope.queryStructFilterSingle.filter.equality.taskId,
                    ],
                },
                {
                    type: 'collect',
                    components: [
                        scope.queryStructFilterSingle.filter.equality.limit,
                    ],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                scope.queryStructFilterSingle.filter.equality.loading = false;
                scope.queryStructFilterSingle.filter.equality.taskId = '';
                scope.queryStructFilterSingle.filter.equality.canCollect =
                    false;

                if (type.indexOf('ERROR') === -1) {
                    // add new ones
                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        scope.queryStructFilterSingle.filter.equality.options.push(
                            output.data.values[valueIdx][0]
                        );
                    }

                    // update filter control variables
                    scope.queryStructFilterSingle.filter.equality.taskId =
                        output.taskId;
                    scope.queryStructFilterSingle.filter.equality.canCollect =
                        output.numCollected === output.data.values.length;
                }
            };

            scope.queryStructFilterCtrl.meta(components, callback, []);
        }

        /** Numerical */
        /**
         * @name resetNumerical
         * @desc updates filter model for this filter
         */
        function resetNumerical(): void {
            scope.queryStructFilterSingle.filter.active = 'numerical';
        }

        /** Date */
        /**
         * @name resetDate
         * @desc updates filter model for this filter
         */
        function resetDate(): void {
            scope.queryStructFilterSingle.filter.active = 'date';
        }

        /** Timestamp */
        /**
         * @name resetTimestamp
         * @desc updates filter model for this filter
         */
        function resetTimestamp(): void {
            scope.queryStructFilterSingle.filter.active = 'timestamp';
        }

        /** Match */
        /**
         * @name resetMatch
         * @desc updates filter model for this filter
         */
        function resetMatch(): void {
            scope.queryStructFilterSingle.filter.match.loading = true;

            //it has been initialized
            scope.queryStructFilterSingle.filter.active = 'match';

            // remove the old task before running the new task
            removeTask();

            const components: PixelCommand[] = [
                {
                    type:
                        scope.queryStructFilterCtrl.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.queryStructFilterCtrl.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: scope.queryStructFilterSingle.filter
                                    .selected.selector,
                            },
                        ],
                    ],
                },
                {
                    type: 'implicitFilterOverride',
                    components: [true],
                },
            ];

            if (scope.queryStructFilterSingle.filter.match.model) {
                const filterObj = {};

                // search
                filterObj[
                    scope.queryStructFilterSingle.filter.selected.selector
                ] = {
                    comparator: scope.queryStructFilterSingle.filter.comparator,
                    value: [scope.queryStructFilterSingle.filter.match.model],
                };

                components.push({
                    type: 'filter',
                    components: [filterObj],
                });
            }

            components.push({
                type: 'collect',
                components: [scope.queryStructFilterSingle.filter.match.limit],
                terminal: true,
            });

            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                // reset it
                scope.queryStructFilterSingle.taskToRemove = '';
                scope.queryStructFilterSingle.filter.match.options = [];
                scope.queryStructFilterSingle.filter.match.loading = false;
                scope.queryStructFilterSingle.filter.match.taskId = '';
                scope.queryStructFilterSingle.filter.match.canCollect = false;

                if (type.indexOf('ERROR') === -1) {
                    if (output) {
                        // add new ones
                        for (
                            let valueIdx = 0,
                                valueLen = output.data.values.length;
                            valueIdx < valueLen;
                            valueIdx++
                        ) {
                            scope.queryStructFilterSingle.filter.match.options.push(
                                output.data.values[valueIdx][0]
                            );
                        }

                        // save the task
                        scope.queryStructFilterSingle.taskToRemove =
                            output.taskId;

                        // update filter control variables
                        scope.queryStructFilterSingle.filter.match.taskId =
                            output.taskId;
                        scope.queryStructFilterSingle.filter.match.canCollect =
                            output.numCollected === output.data.values.length;
                    }
                }
            };

            scope.queryStructFilterCtrl.meta(components, callback, []);
        }

        /**
         * @name searchMatch
         * @desc search for the options based on searchTerm
         */
        function searchMatch(): void {
            if (searchTimeout) {
                $timeout.cancel(searchTimeout);
            }
            searchTimeout = $timeout(function () {
                // reset vars
                resetMatch();
                $timeout.cancel(searchTimeout);
            }, 500);
        }

        /**
         * @name getMoreMatch
         * @desc get the next set of options
         */
        function getMoreMatch(): void {
            if (!scope.queryStructFilterSingle.filter.match.canCollect) {
                return;
            }

            scope.queryStructFilterSingle.filter.match.loading = true;

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'task',
                    components: [
                        scope.queryStructFilterSingle.filter.match.taskId,
                    ],
                },
                {
                    type: 'collect',
                    components: [
                        scope.queryStructFilterSingle.filter.match.limit,
                    ],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                scope.queryStructFilterSingle.filter.match.loading = false;
                scope.queryStructFilterSingle.filter.match.taskId = '';
                scope.queryStructFilterSingle.filter.match.canCollect = false;

                if (type.indexOf('ERROR') === -1) {
                    if (output) {
                        // add new ones
                        for (
                            let valueIdx = 0,
                                valueLen = output.data.values.length;
                            valueIdx < valueLen;
                            valueIdx++
                        ) {
                            scope.queryStructFilterSingle.filter.match.options.push(
                                output.data.values[valueIdx][0]
                            );
                        }

                        // update filter control variables
                        scope.queryStructFilterSingle.filter.match.taskId =
                            output.taskId;
                        scope.queryStructFilterSingle.filter.match.canCollect =
                            output.numCollected === output.data.values.length;
                    }
                }
            };

            scope.queryStructFilterCtrl.meta(components, callback, []);
        }

        /**
         * @name removeTask
         * @desc remove the old task if possible
         */
        function removeTask(): void {
            // remove the old task before running the new task
            if (scope.queryStructFilterSingle.taskToRemove) {
                const task = scope.queryStructFilterSingle.taskToRemove;

                // clear it
                scope.queryStructFilterSingle.taskToRemove = '';

                scope.queryStructFilterCtrl.meta(
                    [
                        {
                            type: 'removeTask',
                            components: [task],
                            terminal: true,
                            meta: true,
                        },
                    ],
                    () => null,
                    []
                );
            }
        }

        /**
         * @name initialize
         * @desc initialize the module
         */
        function initialize(): void {
            resetFilter();
        }

        initialize();
    }
}
