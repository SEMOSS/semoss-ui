import angular from 'angular';

import './pipeline-app-filter-single.scss';

import { COMPARATOR } from '../../../../core/constants';

export default angular
    .module('app.pipeline.pipeline-app.filter.single', [])
    .directive('pipelineAppFilterSingle', pipelineAppFilterSingleDirective);

pipelineAppFilterSingleDirective.$inject = [
    '$timeout',
    '$q',
    'semossCoreService',
];

function pipelineAppFilterSingleDirective(
    $timeout: ng.ITimeoutService,
    $q: ng.IQService,
    semossCoreService: SemossCoreService
) {
    pipelineAppFilterSingleCtrl.$inject = [];
    pipelineAppFilterSingleLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./pipeline-app-filter-single.directive.html'),
        scope: {},
        require: ['^insight'],
        controller: pipelineAppFilterSingleCtrl,
        controllerAs: 'pipelineAppFilterSingle',
        bindToController: {
            type: '=',
            source: '=',
            filter: '=',
        },
        link: pipelineAppFilterSingleLink,
    };

    function pipelineAppFilterSingleCtrl() {}

    function pipelineAppFilterSingleLink(scope, ele, attrs, ctrl) {
        let searchTimeout;

        scope.insightCtrl = ctrl[0];

        scope.pipelineAppFilterSingle.selectComparator = selectComparator;
        scope.pipelineAppFilterSingle.searchEquality = searchEquality;
        scope.pipelineAppFilterSingle.getMoreEquality = getMoreEquality;
        scope.pipelineAppFilterSingle.searchMatch = searchMatch;
        scope.pipelineAppFilterSingle.getMoreMatch = getMoreMatch;

        scope.pipelineAppFilterSingle.taskToRemove = '';

        /** Filter */
        /**
         * @name resetFilter
         * @desc reset the filter
         */
        function resetFilter() {
            // set selected
            selectComparator(scope.pipelineAppFilterSingle.filter.comparator);
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
            scope.pipelineAppFilterSingle.filter.comparatorOptions = [];

            for (
                let comparatorIdx = 0, comparatorLen = COMPARATOR.length;
                comparatorIdx < comparatorLen;
                comparatorIdx++
            ) {
                if (
                    COMPARATOR[comparatorIdx].types.indexOf(
                        scope.pipelineAppFilterSingle.filter.selected.type
                    ) > -1
                ) {
                    scope.pipelineAppFilterSingle.filter.comparatorOptions.push(
                        COMPARATOR[comparatorIdx]
                    );
                }
            } // set a default comparator

            scope.pipelineAppFilterSingle.filter.comparator = '';

            if (comparator) {
                for (
                    let optIdx = 0,
                        optLen =
                            scope.pipelineAppFilterSingle.filter
                                .comparatorOptions.length;
                    optIdx < optLen;
                    optIdx++
                ) {
                    if (
                        scope.pipelineAppFilterSingle.filter.comparatorOptions[
                            optIdx
                        ].value === comparator
                    ) {
                        scope.pipelineAppFilterSingle.filter.comparator =
                            comparator;
                    }
                }
            }

            if (
                !scope.pipelineAppFilterSingle.filter.comparator &&
                scope.pipelineAppFilterSingle.filter.comparatorOptions.length >
                    0
            ) {
                scope.pipelineAppFilterSingle.filter.comparator =
                    scope.pipelineAppFilterSingle.filter.comparatorOptions[0].value;
            }

            if (
                scope.pipelineAppFilterSingle.filter.comparator === '==' ||
                scope.pipelineAppFilterSingle.filter.comparator === '!='
            ) {
                if (
                    !Array.isArray(
                        scope.pipelineAppFilterSingle.filter.equality.model
                    )
                ) {
                    scope.pipelineAppFilterSingle.filter.equality.model = [];
                }

                // already initialized, so no need to do not need to grab the data again
                if (
                    scope.pipelineAppFilterSingle.filter.active === 'equality'
                ) {
                    return;
                }

                resetEquality();
            } else if (
                (scope.pipelineAppFilterSingle.filter.comparator === '<' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '<=' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '>' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '>=') &&
                (scope.pipelineAppFilterSingle.filter.selected.type ===
                    'NUMBER' ||
                    scope.pipelineAppFilterSingle.filter.selected.type ===
                        'DOUBLE' ||
                    scope.pipelineAppFilterSingle.filter.selected.type ===
                        'INT')
            ) {
                if (
                    typeof scope.pipelineAppFilterSingle.filter.numerical
                        .model !== 'number'
                ) {
                    scope.pipelineAppFilterSingle.filter.numerical.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (
                    scope.pipelineAppFilterSingle.filter.active === 'numerical'
                ) {
                    return;
                }

                resetNumerical();
            } else if (
                (scope.pipelineAppFilterSingle.filter.comparator === '<' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '<=' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '>' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '>=') &&
                scope.pipelineAppFilterSingle.filter.selected.type === 'DATE'
            ) {
                if (
                    typeof scope.pipelineAppFilterSingle.filter.date.model !==
                    'string'
                ) {
                    scope.pipelineAppFilterSingle.filter.date.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (scope.pipelineAppFilterSingle.filter.active === 'date') {
                    return;
                }

                resetDate();
            } else if (
                (scope.pipelineAppFilterSingle.filter.comparator === '<' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '<=' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '>' ||
                    scope.pipelineAppFilterSingle.filter.comparator === '>=') &&
                scope.pipelineAppFilterSingle.filter.selected.type ===
                    'TIMESTAMP'
            ) {
                if (
                    typeof scope.pipelineAppFilterSingle.filter.timestamp
                        .model !== 'string'
                ) {
                    scope.pipelineAppFilterSingle.filter.timestamp.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (
                    scope.pipelineAppFilterSingle.filter.active === 'timestamp'
                ) {
                    return;
                }

                resetTimestamp();
            } else if (
                scope.pipelineAppFilterSingle.filter.comparator === '?like' ||
                scope.pipelineAppFilterSingle.filter.comparator === '?begins' ||
                scope.pipelineAppFilterSingle.filter.comparator === '?ends'
            ) {
                if (
                    typeof scope.pipelineAppFilterSingle.filter.match.model !==
                    'string'
                ) {
                    scope.pipelineAppFilterSingle.filter.match.model = '';
                }

                // already initialized, so no need to do not need to grab the data again
                if (scope.pipelineAppFilterSingle.filter.active === 'match') {
                    return;
                }

                resetMatch();
            } else {
                scope.pipelineAppFilterSingle.filter.active = '';
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
            scope.pipelineAppFilterSingle.filter.active = 'equality';

            scope.pipelineAppFilterSingle.filter.equality.loading = true;

            // remove the old task before running the new task
            removeTasks();

            components.push(
                {
                    type:
                        scope.pipelineAppFilterSingle.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.pipelineAppFilterSingle.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: scope.pipelineAppFilterSingle.filter
                                    .selected.concept,
                            },
                        ],
                    ],
                }
            );

            if (scope.pipelineAppFilterSingle.filter.equality.search) {
                const filterObj = {};
                const values = [
                    scope.pipelineAppFilterSingle.filter.equality.search,
                ];

                // pass in the version with underscore as well to search for
                if (
                    scope.pipelineAppFilterSingle.filter.equality.search !==
                    scope.pipelineAppFilterSingle.filter.equality.search.replace(
                        / /g,
                        '_'
                    )
                ) {
                    values.push(
                        scope.pipelineAppFilterSingle.filter.equality.search.replace(
                            / /g,
                            '_'
                        )
                    );
                }

                // search
                filterObj[
                    scope.pipelineAppFilterSingle.filter.selected.concept
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
                    scope.pipelineAppFilterSingle.filter.equality.limit,
                ],
                terminal: true,
            });

            // register message to come back to
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output;

                // no need to clear out because we are loading infinite
                scope.pipelineAppFilterSingle.filter.equality.options = [];

                scope.pipelineAppFilterSingle.filter.equality.loading = false;

                if (output) {
                    // add new ones
                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        scope.pipelineAppFilterSingle.filter.equality.options.push(
                            output.data.values[valueIdx][0]
                        );
                    }

                    // save the task
                    scope.pipelineAppFilterSingle.taskToRemove = output.taskId;

                    // update filter control variables
                    scope.pipelineAppFilterSingle.filter.equality.taskId =
                        output.taskId;
                    scope.pipelineAppFilterSingle.filter.equality.canCollect =
                        output.numCollected === output.data.values.length;
                }
            };

            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name searchEquality
         * @desc search for the options based on searchTerm
         */
        function searchEquality(): void {
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
            if (!scope.pipelineAppFilterSingle.filter.equality.canCollect) {
                return;
            }

            scope.pipelineAppFilterSingle.filter.equality.loading = true;

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'task',
                    components: [
                        scope.pipelineAppFilterSingle.filter.equality.taskId,
                    ],
                },
                {
                    type: 'collect',
                    components: [
                        scope.pipelineAppFilterSingle.filter.equality.limit,
                    ],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output;

                // add new ones
                for (
                    let valueIdx = 0, valueLen = output.data.values.length;
                    valueIdx < valueLen;
                    valueIdx++
                ) {
                    scope.pipelineAppFilterSingle.filter.equality.options.push(
                        output.data.values[valueIdx][0]
                    );
                }

                // update filter control variables
                scope.pipelineAppFilterSingle.filter.equality.taskId =
                    output.taskId;
                scope.pipelineAppFilterSingle.filter.equality.canCollect =
                    output.numCollected === output.data.values.length;
                scope.pipelineAppFilterSingle.filter.equality.loading = false;
            };

            scope.insightCtrl.meta(components, callback);
        }

        /** Numerical */
        /**
         * @name resetNumerical
         * @desc updates filter model for this filter
         */
        function resetNumerical(): void {
            scope.pipelineAppFilterSingle.filter.numerical.loading = true;

            //it has been initialized
            scope.pipelineAppFilterSingle.filter.active = 'numerical';

            const components: PixelCommand[] = [
                {
                    type:
                        scope.pipelineAppFilterSingle.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.pipelineAppFilterSingle.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                math: 'Max',
                                alias:
                                    'Max_of_' +
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                                calculatedBy:
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                            },
                            {
                                math: 'Min',
                                alias:
                                    'Min_of_' +
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                                calculatedBy:
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                            },
                        ],
                    ],
                },
                {
                    type: 'collect',
                    components: [-1],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output;

                scope.pipelineAppFilterSingle.filter.numerical.max =
                    output.data.values[0][0];
                scope.pipelineAppFilterSingle.filter.numerical.min =
                    output.data.values[0][1];

                scope.pipelineAppFilterSingle.filter.numerical.loading = false;
            };

            scope.insightCtrl.meta(components, callback);
        }

        /** Date */
        /**
         * @name resetDate
         * @desc updates filter model for this filter
         */
        function resetDate(): void {
            scope.pipelineAppFilterSingle.filter.date.loading = true;

            //it has been initialized
            scope.pipelineAppFilterSingle.filter.active = 'date';

            const components: PixelCommand[] = [
                {
                    type:
                        scope.pipelineAppFilterSingle.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.pipelineAppFilterSingle.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                math: 'Max',
                                alias:
                                    'Max_of_' +
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                                calculatedBy:
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                            },
                            {
                                math: 'Min',
                                alias:
                                    'Min_of_' +
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                                calculatedBy:
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                            },
                        ],
                    ],
                },
                {
                    type: 'collect',
                    components: [-1],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output;

                scope.pipelineAppFilterSingle.filter.date.max =
                    output.data.values[0][0];
                scope.pipelineAppFilterSingle.filter.date.min =
                    output.data.values[0][1];

                scope.pipelineAppFilterSingle.filter.date.loading = false;
            };

            scope.insightCtrl.meta(components, callback);
        }

        /** Timestamp */
        /**
         * @name resetTimestamp
         * @desc updates filter model for this filter
         */
        function resetTimestamp(): void {
            scope.pipelineAppFilterSingle.filter.timestamp.loading = true;

            //it has been initialized
            scope.pipelineAppFilterSingle.filter.active = 'timestamp';

            const components: PixelCommand[] = [
                {
                    type:
                        scope.pipelineAppFilterSingle.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.pipelineAppFilterSingle.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                math: 'Max',
                                alias:
                                    'Max_of_' +
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                                calculatedBy:
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                            },
                            {
                                math: 'Min',
                                alias:
                                    'Min_of_' +
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                                calculatedBy:
                                    scope.pipelineAppFilterSingle.filter
                                        .selected.concept,
                            },
                        ],
                    ],
                },
                {
                    type: 'collect',
                    components: [-1],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output;

                scope.pipelineAppFilterSingle.filter.timestamp.max =
                    output.data.values[0][0];
                scope.pipelineAppFilterSingle.filter.timestamp.min =
                    output.data.values[0][1];

                scope.pipelineAppFilterSingle.filter.timestamp.loading = false;
            };

            scope.insightCtrl.meta(components, callback);
        }

        /** Match */
        /**
         * @name resetMatch
         * @desc updates filter model for this filter
         */
        function resetMatch(): void {
            scope.pipelineAppFilterSingle.filter.match.loading = true;

            //it has been initialized
            scope.pipelineAppFilterSingle.filter.active = 'match';

            // remove the old task before running the new task
            removeTasks();

            const components: PixelCommand[] = [
                {
                    type:
                        scope.pipelineAppFilterSingle.type === 'database'
                            ? 'database'
                            : 'frame',
                    components: [scope.pipelineAppFilterSingle.source],
                    meta: true,
                },
                {
                    type: 'select2',
                    components: [
                        [
                            {
                                alias: scope.pipelineAppFilterSingle.filter
                                    .selected.concept,
                            },
                        ],
                    ],
                },
            ];

            if (scope.pipelineAppFilterSingle.filter.match.model) {
                const filterObj = {};

                // search
                filterObj[
                    scope.pipelineAppFilterSingle.filter.selected.concept
                ] = {
                    comparator: scope.pipelineAppFilterSingle.filter.comparator,
                    value: [scope.pipelineAppFilterSingle.filter.match.model],
                };

                components.push({
                    type: 'filter',
                    components: [filterObj],
                });
            }

            components.push({
                type: 'collect',
                components: [scope.pipelineAppFilterSingle.filter.match.limit],
                terminal: true,
            });

            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output;

                // no need to clear out because we are loading infinite
                scope.pipelineAppFilterSingle.filter.match.options = [];

                scope.pipelineAppFilterSingle.filter.match.loading = false;

                if (output) {
                    // add new ones
                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        scope.pipelineAppFilterSingle.filter.match.options.push(
                            output.data.values[valueIdx][0]
                        );
                    }

                    // save the task
                    scope.pipelineAppFilterSingle.taskToRemove = output.taskId;

                    // update filter control variables
                    scope.pipelineAppFilterSingle.filter.match.taskId =
                        output.taskId;
                    scope.pipelineAppFilterSingle.filter.match.canCollect =
                        output.numCollected === output.data.values.length;
                }
            };

            scope.insightCtrl.meta(components, callback);
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
            if (!scope.pipelineAppFilterSingle.filter.match.canCollect) {
                return;
            }

            scope.pipelineAppFilterSingle.filter.match.loading = true;

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'task',
                    components: [
                        scope.pipelineAppFilterSingle.filter.match.taskId,
                    ],
                },
                {
                    type: 'collect',
                    components: [
                        scope.pipelineAppFilterSingle.filter.match.limit,
                    ],
                    terminal: true,
                },
            ];

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output;

                scope.pipelineAppFilterSingle.filter.match.loading = false;

                if (output) {
                    // add new ones
                    for (
                        let valueIdx = 0, valueLen = output.data.values.length;
                        valueIdx < valueLen;
                        valueIdx++
                    ) {
                        scope.pipelineAppFilterSingle.filter.match.options.push(
                            output.data.values[valueIdx][0]
                        );
                    }

                    // update filter control variables
                    scope.pipelineAppFilterSingle.filter.match.taskId =
                        output.taskId;
                    scope.pipelineAppFilterSingle.filter.match.canCollect =
                        output.numCollected === output.data.values.length;
                }
            };

            scope.insightCtrl.meta(components, callback);
        }

        /**
         * @name removeTasks
         * @desc remove old tasks
         */
        function removeTasks() {
            const components: any = [];

            if (scope.pipelineAppFilterSingle.taskToRemove) {
                components.push({
                    type: 'removeTask',
                    components: [scope.pipelineAppFilterSingle.taskToRemove],
                    terminal: true,
                    meta: true,
                });

                scope.pipelineAppFilterSingle.taskToRemove = '';
            }

            if (components.length > 0) {
                scope.insightCtrl.meta(components);
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
