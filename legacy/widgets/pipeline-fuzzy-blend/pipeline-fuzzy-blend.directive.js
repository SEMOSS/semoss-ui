'use strict';
import { Grid } from 'ag-grid-community';
import './pipeline-fuzzy-blend.scss';

/**
 * @name pipeline-fuzzy-blend.js
 * @desc federate view
 */
export default angular
    .module('app.pipeline.pipeline-fuzzy-blend', [])
    .directive('pipelineFuzzyBlend', pipelineFuzzyBlendDirective);

pipelineFuzzyBlendDirective.$inject = ['$q', '$timeout', 'semossCoreService'];

function pipelineFuzzyBlendDirective($q, $timeout, semossCoreService) {
    pipelineFuzzyBlendCtrl.$inject = [];
    pipelineFuzzyBlendLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        require: ['^widget', '^pipelineComponent'],
        template: require('./pipeline-fuzzy-blend.directive.html'),
        controller: pipelineFuzzyBlendCtrl,
        link: pipelineFuzzyBlendLink,
        scope: {},
        bindToController: {},
        controllerAs: 'pipelineFuzzyBlend',
    };

    function pipelineFuzzyBlendCtrl() {}

    function pipelineFuzzyBlendLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        var matchTimeout,
            clickTimeout,
            grid = {};

        scope.pipelineFuzzyBlend.source = {
            name: undefined,
            headers: undefined,
            type: undefined,
            create: false,
        };

        scope.pipelineFuzzyBlend.destination = {
            name: undefined,
            headers: undefined,
            type: undefined,
            create: false,
        };

        scope.pipelineFuzzyBlend.taskIdList = [];

        scope.pipelineFuzzyBlend.selectColumn = selectColumn;
        scope.pipelineFuzzyBlend.selectFrameHeader = selectFrameHeader;
        scope.pipelineFuzzyBlend.cancelMatches = cancelMatches;
        scope.pipelineFuzzyBlend.findMatches = findMatches;
        scope.pipelineFuzzyBlend.sortMatches = sortMatches;
        scope.pipelineFuzzyBlend.getMatches = getMatches;
        scope.pipelineFuzzyBlend.getMoreMatches = getMoreMatches;
        scope.pipelineFuzzyBlend.addMatch = addMatch;
        scope.pipelineFuzzyBlend.rejectMatch = rejectMatch;
        scope.pipelineFuzzyBlend.blendMatches = blendMatches;
        scope.pipelineFuzzyBlend.joinType = 'inner.join';
        scope.pipelineFuzzyBlend.joinOptions = {
            'inner.join': {
                display: 'Inner Join',
                img: require('images/inner_join.svg'),
            },
            'left.outer.join': {
                display: 'Left Join',
                img: require('images/left_join.svg'),
            },
            'right.outer.join': {
                display: 'Right Join',
                img: require('images/right_join.svg'),
            },
            'outer.join': {
                display: 'Outer Join',
                img: require('images/outer_join.svg'),
            },
        };
        scope.pipelineFuzzyBlend.filterOptions = [
            {
                display: 'Show All',
                value: '',
            },
            {
                display: 'Accepted',
                value: 'accept',
            },
            {
                display: 'Rejected',
                value: 'reject',
            },
        ];
        /** General */
        /**
         * @name resetVars
         * @desc Helper function that resets all the user-entered variables
         * @returns {void}
         */
        function resetVars() {
            scope.pipelineFuzzyBlend.page = 1;

            scope.pipelineFuzzyBlend.app = {
                raw: [],
                selected: '',
            };

            scope.pipelineFuzzyBlend.concept = {
                raw: [],
                selected: '',
            };

            scope.pipelineFuzzyBlend.column = {
                raw: [],
                selected: '',
                otherOptions: [],
                otherSelected: [],
            };

            scope.pipelineFuzzyBlend.frame = {
                raw: [],
                selected: '',
            };

            scope.pipelineFuzzyBlend.matches = {
                frame: '',
                loading: false,
                taskId: false,
                full: true,
                count: '-',
                total: '-',
                options: [], // all values
                rendered: [], // all values on the dom
                sort: '', // sort direction
                filter: '', // filter subset?
                search: '', // search term used - only used for search term in call, nothing else
                limit: 50, // how many values to collect
                canCollect: true, // flag to determine whether another call can be made - infinite scroll
            };

            scope.pipelineFuzzyBlend.selected = {
                sensitivity: 80,
                accepted: [],
                rejected: [],
            };

            scope.pipelineFuzzyBlend.joinType = 'inner.join';
        }

        /** Column */
        /**
         * @name selectColumn
         * @desc select the column  to join on
         * @param {string} column - selected column
         * @returns {void}
         */
        function selectColumn(column) {
            var otherCols = [],
                colIdx,
                colLen;

            // set the new one
            scope.pipelineFuzzyBlend.destination.selectedHeader = column;
            // set the other ones
            for (
                colIdx = 0,
                    colLen =
                        scope.pipelineFuzzyBlend.destination.headers.length;
                colIdx < colLen;
                colIdx++
            ) {
                if (
                    scope.pipelineFuzzyBlend.destination.headers[colIdx]
                        .header !==
                    scope.pipelineFuzzyBlend.destination.selectedHeader.header
                ) {
                    otherCols.push(
                        scope.pipelineFuzzyBlend.destination.headers[colIdx]
                    );
                }
            }

            scope.pipelineFuzzyBlend.destination.otherSelectedHeader =
                semossCoreService.utility.freeze(otherCols);
            scope.pipelineFuzzyBlend.destination.otherOptions =
                semossCoreService.utility.freeze(otherCols);
        }

        /** Frame */
        /**
         * @name getFrameHeaders
         * @param {string} which - source | destination
         * @desc get the frame headers that are available to join on
         * @returns {void}
         */
        function getFrameHeaders(which) {
            scope.pipelineFuzzyBlend[which.toLowerCase()].headers =
                scope.pipelineComponentCtrl.getComponent(
                    `parameters.${which}.value.headers`
                );

            if (which === 'DESTINATION') {
                selectColumn(
                    scope.pipelineFuzzyBlend[which.toLowerCase()].headers[0]
                );
            }
        }

        /**
         * @name selectFrameHeader
         * @desc select the frame column to join on
         * @param {string} alias - selected alias
         * @returns {void}
         */
        function selectFrameHeader(alias) {
            // set the new one
            scope.pipelineFuzzyBlend.frame.selected = alias;
        }

        /** Matches */
        /**
         * @name cancelMatches
         * @desc cancel your matching
         * @returns {void}
         */
        function cancelMatches() {
            // clear out the old ones
            scope.pipelineFuzzyBlend.matches = {
                frame: '',
                loading: false,
                taskId: false,
                full: true,
                count: '-',
                total: '-',
                options: [], // all values
                rendered: [], // all values on the dom
                sort: '', // sort direction
                filter: '', // filter subset?
                search: '', // search term used - only used for search term in call, nothing else
                limit: 50, // how many values to collect
                canCollect: true, // flag to determine whether another call can be made - infinite scroll
            };

            scope.pipelineFuzzyBlend.selected = {
                sensitivity: 80,
                accepted: [],
                rejected: [],
            };

            scope.pipelineFuzzyBlend.joinType = 'inner.join';

            scope.pipelineFuzzyBlend.page = 1;
        }

        /**
         * @name findMatches
         * @desc find the best matches to federate on
         * @returns {void}
         */
        function findMatches() {
            var callback, selectors;
            selectors = [
                {
                    selector:
                        scope.pipelineFuzzyBlend.destination.selectedHeader
                            .header,
                    alias: scope.pipelineFuzzyBlend.destination.selectedHeader
                        .displayName,
                },
            ].concat(
                scope.pipelineFuzzyBlend.destination.otherSelectedHeaders.map(
                    (column) => ({
                        selector: column.header,
                        alias: column.displayName,
                    })
                )
            );

            if (
                !(
                    scope.pipelineFuzzyBlend.destination.selectedHeader &&
                    scope.pipelineFuzzyBlend.frame.selected
                )
            ) {
                scope.widgetCtrl.alert('warn', 'Check Required Inputs');
                return;
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // clear out the old ones
                scope.pipelineFuzzyBlend.matches = {
                    frame: output.name,
                    loading: false,
                    taskId: false,
                    full: true,
                    count: '-',
                    total: '-',
                    options: [], // all values
                    rendered: [], // all values on the dom
                    sort: '', // sort direction
                    filter: '', // filter subset?
                    search: '', // search term used - only used for search term in call, nothing else
                    limit: 50, // how many values to collect
                    canCollect: true, // flag to determine whether another call can be made - infinite scroll
                };

                scope.pipelineFuzzyBlend.selected = {
                    sensitivity: 80,
                    accepted: [],
                    rejected: [],
                };

                getMatches();
                getMatchCounts();
                scope.pipelineFuzzyBlend.page = 2;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.pipelineFuzzyBlend.destination.name],
                    },
                    {
                        type: 'select2',
                        components: [selectors],
                    },
                    {
                        type: 'fuzzyMatches',
                        components: [
                            semossCoreService.utility.random('FRAME') + 'adFed',
                            scope.pipelineFuzzyBlend.frame.selected.header,
                            scope.pipelineFuzzyBlend.source.name,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name sortMatches
         * @desc sort the matches to federate on
         * @returns {void}
         */
        function sortMatches() {
            if (scope.pipelineFuzzyBlend.matches.sort === 'asc') {
                scope.pipelineFuzzyBlend.matches.sort = 'desc';
            } else if (scope.pipelineFuzzyBlend.matches.sort === 'desc') {
                scope.pipelineFuzzyBlend.matches.sort = '';
            } else {
                scope.pipelineFuzzyBlend.matches.sort = 'asc';
            }

            getMatches();
        }

        /**
         * @name getMatches
         * @desc get the matches
         * @returns {void}
         */
        function getMatches() {
            var filterObj;

            if (matchTimeout) {
                $timeout.cancel(matchTimeout);
            }

            // let it rest for a little before executing
            matchTimeout = $timeout(function () {
                var pixelComponents,
                    callback,
                    taskIdx,
                    removeTaskComponent = [];

                if (!scope.pipelineFuzzyBlend.matches.frame) {
                    return;
                }

                // remove the old ones
                if (scope.pipelineFuzzyBlend.taskIdList.length > 0) {
                    for (
                        taskIdx = 0;
                        taskIdx < scope.pipelineFuzzyBlend.taskIdList.length;
                        taskIdx++
                    ) {
                        removeTaskComponent.push({
                            type: 'removeTask',
                            components: [
                                scope.pipelineFuzzyBlend.taskIdList[taskIdx],
                            ],
                            terminal: true,
                            meta: true,
                        });
                    }

                    scope.pipelineFuzzyBlend.taskIdList = [];
                }

                pixelComponents = removeTaskComponent.concat([
                    {
                        type: 'frame',
                        components: [scope.pipelineFuzzyBlend.matches.frame],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    alias: 'distance',
                                },
                                {
                                    alias: 'col1',
                                },
                                {
                                    alias: 'col2',
                                },
                            ],
                        ],
                    },
                ]);

                // add a filter on the searched instances
                if (scope.pipelineFuzzyBlend.matches.search) {
                    let searchTerm =
                        scope.pipelineFuzzyBlend.matches.search.replace(
                            / /g,
                            '_'
                        );
                    pixelComponents = pixelComponents.concat([
                        {
                            type: 'Pixel',
                            components: [
                                'Filter((col1 ?like "' +
                                    searchTerm +
                                    '") OR (col2 ?like "' +
                                    searchTerm +
                                    '"))',
                            ],
                        },
                    ]);
                }

                // add a filter based on full
                if (!scope.pipelineFuzzyBlend.matches.full) {
                    filterObj = {};
                    filterObj.distance = {
                        comparator: '!=',
                        value: 0,
                    };

                    pixelComponents = pixelComponents.concat([
                        {
                            type: 'filter',
                            components: [filterObj],
                        },
                    ]);
                }

                // add a filter based on accept or reject (related to the propagation score)
                if (scope.pipelineFuzzyBlend.matches.filter) {
                    filterObj = {};
                    if (scope.pipelineFuzzyBlend.matches.filter === 'accept') {
                        filterObj.distance = {
                            comparator: '<',
                            value:
                                1 -
                                scope.pipelineFuzzyBlend.selected.sensitivity /
                                    100,
                        };
                    } else if (
                        scope.pipelineFuzzyBlend.matches.filter === 'reject'
                    ) {
                        filterObj.distance = {
                            comparator: '>=',
                            value:
                                1 -
                                scope.pipelineFuzzyBlend.selected.sensitivity /
                                    100,
                        };
                    }

                    pixelComponents = pixelComponents.concat([
                        {
                            type: 'filter',
                            components: [filterObj],
                        },
                    ]);
                }

                // add a sort based on sensitivity
                if (scope.pipelineFuzzyBlend.matches.sort) {
                    pixelComponents = pixelComponents.concat([
                        {
                            type: 'sortOptions',
                            components: [
                                [
                                    {
                                        alias: 'distance',
                                        dir: scope.pipelineFuzzyBlend.matches
                                            .sort,
                                    },
                                ],
                            ],
                        },
                    ]);
                }

                pixelComponents = pixelComponents.concat({
                    type: 'collect',
                    components: [scope.pipelineFuzzyBlend.matches.limit],
                    terminal: true,
                });

                // register message to come back to
                callback = function (response) {
                    var collectIdx = response.pixelReturn.length - 1,
                        output = response.pixelReturn[collectIdx].output,
                        type = response.pixelReturn[collectIdx].operationType;

                    // clear out the matches
                    scope.pipelineFuzzyBlend.matches.options = [];

                    if (type.indexOf('ERROR') > -1) {
                        scope.pipelineFuzzyBlend.matches.loading = false;
                        return;
                    }

                    setMatchData(output);
                    renderMatches();
                    scope.pipelineFuzzyBlend.matches.loading = false;
                };

                scope.pipelineFuzzyBlend.matches.loading = true;

                scope.widgetCtrl.meta(pixelComponents, callback);

                $timeout.cancel(matchTimeout);
            }, 300);
        }

        /**
         * @name getMatchCounts
         * @desc get the counts
         * @returns {void}
         */
        function getMatchCounts() {
            var callback;

            if (!scope.pipelineFuzzyBlend.matches.frame) {
                return;
            }

            // register message to come back to
            callback = function (response) {
                var countOutput = response.pixelReturn[0].output,
                    totalOutput = response.pixelReturn[1].output;

                scope.pipelineFuzzyBlend.matches.count = '-';
                if (
                    countOutput &&
                    countOutput.data &&
                    countOutput.data.values &&
                    countOutput.data.values.length > 0
                ) {
                    scope.pipelineFuzzyBlend.matches.count =
                        countOutput.data.values[0][0];
                }

                scope.pipelineFuzzyBlend.matches.total = '-';
                if (
                    totalOutput &&
                    totalOutput.data &&
                    totalOutput.data.values &&
                    totalOutput.data.values.length > 0
                ) {
                    scope.pipelineFuzzyBlend.matches.total =
                        totalOutput.data.values[0][0];
                }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            'Frame(' +
                                scope.pipelineFuzzyBlend.matches.frame +
                                ')|Select(Count(col1)).as([Count])|Filter(distance==0)|Collect(1);Frame(' +
                                scope.pipelineFuzzyBlend.matches.frame +
                                ')|Select(Count(col1)).as([Count])|Collect(1)',
                        ],
                        terminal: true,
                        meta: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getMoreMatches
         * @desc get the matches
         * @returns {void}
         */
        function getMoreMatches() {
            var callback;

            if (scope.pipelineFuzzyBlend.matches.canCollect) {
                scope.pipelineFuzzyBlend.matches.loading = true;

                // register message to come back to
                callback = function (response) {
                    var output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        scope.pipelineFuzzyBlend.matches.loading = false;
                        return;
                    }

                    setMatchData(output);
                    renderMatches();
                    scope.pipelineFuzzyBlend.matches.loading = false;
                };

                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'task',
                            components: [
                                scope.pipelineFuzzyBlend.matches.taskId,
                            ],
                        },
                        {
                            type: 'collect',
                            components: [
                                scope.pipelineFuzzyBlend.matches.limit,
                            ],
                            terminal: true,
                        },
                    ],
                    callback
                );
            }
        }

        /**
         * @name setMatchData
         * @desc set the matches data
         * @param {object} output - output from the select query
         * @returns {void}
         */
        function setMatchData(output) {
            var options = [],
                valueIdx,
                valueLen;

            // assumed order is distance, col1, col2
            for (
                valueIdx = 0, valueLen = output.data.values.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                options.push({
                    match:
                        output.data.values[valueIdx][1] +
                        '==' +
                        output.data.values[valueIdx][2],
                    left: String(output.data.values[valueIdx][1]).replace(
                        /_/g,
                        ' '
                    ),
                    right: String(output.data.values[valueIdx][2]).replace(
                        /_/g,
                        ' '
                    ),
                    distance: output.data.values[valueIdx][0],
                });
            }

            scope.pipelineFuzzyBlend.matches.options =
                scope.pipelineFuzzyBlend.matches.options.concat(options);
            scope.pipelineFuzzyBlend.matches.taskId = output.taskId;
            scope.pipelineFuzzyBlend.taskIdList.push(output.taskId);
            scope.pipelineFuzzyBlend.matches.canCollect =
                output.numCollected === output.data.values.length;
        }

        /**
         * @name renderMatches
         * @desc render the matches
         * @returns {void}
         */
        function renderMatches() {
            var renderedMatches = semossCoreService.utility.freeze(
                    scope.pipelineFuzzyBlend.matches.options
                ),
                calculatedDistance,
                matchIdx,
                manualIdx,
                manualLen;

            for (
                manualIdx = 0,
                    manualLen =
                        scope.pipelineFuzzyBlend.selected.accepted.length;
                manualIdx < manualLen;
                manualIdx++
            ) {
                for (
                    matchIdx = renderedMatches.length - 1;
                    matchIdx >= 0;
                    matchIdx--
                ) {
                    // already accepted, so we must remove
                    if (
                        renderedMatches[matchIdx].match ===
                        scope.pipelineFuzzyBlend.selected.accepted[manualIdx]
                            .match
                    ) {
                        // remove
                        renderedMatches.splice(matchIdx, 1);
                        // go to the next one
                        break;
                    }
                }
            }

            for (
                manualIdx = 0,
                    manualLen =
                        scope.pipelineFuzzyBlend.selected.rejected.length;
                manualIdx < manualLen;
                manualIdx++
            ) {
                for (
                    matchIdx = renderedMatches.length - 1;
                    matchIdx >= 0;
                    matchIdx--
                ) {
                    // already rejected, so we must remove
                    if (
                        renderedMatches[matchIdx].match ===
                        scope.pipelineFuzzyBlend.selected.rejected[manualIdx]
                            .match
                    ) {
                        // remove
                        renderedMatches.splice(matchIdx, 1);
                        // go to the next one
                        break;
                    }
                }
            }

            // update sensitivity
            for (
                matchIdx = renderedMatches.length - 1;
                matchIdx >= 0;
                matchIdx--
            ) {
                calculatedDistance =
                    (1 - renderedMatches[matchIdx].distance) * 100;
                renderedMatches[matchIdx].renderedDistance =
                    calculatedDistance + '%';
                renderedMatches[matchIdx].accepted =
                    calculatedDistance >=
                    scope.pipelineFuzzyBlend.selected.sensitivity;
            }

            scope.pipelineFuzzyBlend.matches.rendered = renderedMatches;
        }

        /**
         * @name addMatch
         * @desc add a match
         * @param {object} match - match to accept or reject
         * @param {string} type - accept or reject the match?
         * @returns {void}
         */
        function addMatch(match, type) {
            var to, added, matchIdx, matchLen;

            // reference
            if (type === 'accepted') {
                to = scope.pipelineFuzzyBlend.selected.accepted;
            } else {
                to = scope.pipelineFuzzyBlend.selected.rejected;
            }

            added = semossCoreService.utility.freeze(match);

            if (added) {
                // is it already added
                for (
                    matchIdx = 0, matchLen = to.length;
                    matchIdx < matchLen;
                    matchIdx++
                ) {
                    if (to[matchIdx].match === added.match) {
                        return;
                    }
                }

                to.push(added);

                renderMatches();
            }
        }

        /**
         * @name rejectMatch
         * @desc reject a match
         * @param {object} match - to remove
         * @param {string} type - accept or reject the match?
         * @returns {void}
         */
        function rejectMatch(match, type) {
            var from,
                idx = -1,
                matchIdx,
                matchLen;

            // reference
            if (type === 'accepted') {
                from = scope.pipelineFuzzyBlend.selected.accepted;
            } else {
                from = scope.pipelineFuzzyBlend.selected.rejected;
            }

            for (
                matchIdx = 0, matchLen = from.length;
                matchIdx < matchLen;
                matchIdx++
            ) {
                if (from[matchIdx].match === match.match) {
                    idx = matchIdx;
                    break;
                }
            }

            // not there
            if (idx === -1) {
                return;
            }

            // remove
            from.splice(idx, 1);

            // need to recategorize since the propagation didn't.
            renderMatches();
        }

        /**
         * @name buildBlend
         * @param {string} type - 'prview' or ''
         * @desc build the blend component
         * @returns {array} pixel components of
         */
        function buildBlend() {
            let acceptedMatches = [],
                rejectedMatches = [],
                matchIdx,
                matchLen,
                blendObj = {},
                remove = '';

            for (
                matchIdx = 0,
                    matchLen =
                        scope.pipelineFuzzyBlend.selected.accepted.length;
                matchIdx < matchLen;
                matchIdx++
            ) {
                acceptedMatches.push(
                    '"' +
                        scope.pipelineFuzzyBlend.selected.accepted[matchIdx]
                            .match +
                        '"'
                );
            }

            for (
                matchIdx = 0,
                    matchLen =
                        scope.pipelineFuzzyBlend.selected.rejected.length;
                matchIdx < matchLen;
                matchIdx++
            ) {
                rejectedMatches.push(
                    '"' +
                        scope.pipelineFuzzyBlend.selected.rejected[matchIdx]
                            .match +
                        '"'
                );
            }

            blendObj.SOURCE = {
                name: scope.pipelineFuzzyBlend.source.name,
            };

            blendObj.QUERY_STRUCT = {
                qsType: 'FRAME',
                frameName: scope.pipelineFuzzyBlend.source.name,
            };
            if (
                !scope.pipelineFuzzyBlend.frame.selected ||
                !scope.pipelineFuzzyBlend.matches.frame
            ) {
                blendObj.FUZZY_MERGE = undefined;
            } else {
                blendObj.FUZZY_MERGE = {
                    fedFrame: scope.pipelineFuzzyBlend.matches.frame,
                    joins:
                        '(' +
                        scope.pipelineFuzzyBlend.destination.selectedHeader
                            .header +
                        ', ' +
                        scope.pipelineFuzzyBlend.joinType +
                        ', ' +
                        scope.pipelineFuzzyBlend.frame.selected.header +
                        ')',
                    frame: scope.pipelineFuzzyBlend.destination.name,
                    matches: acceptedMatches.join(','),
                    nonMatches: rejectedMatches.join(','),
                    propagation: scope.pipelineFuzzyBlend.selected.sensitivity,
                };
            }

            return blendObj;
        }

        /**
         * @name blendMatches
         * @desc blend your matches
         * @returns {void}
         */
        function blendMatches() {
            var pixelComponents = [];

            pixelComponents = buildBlend();

            scope.pipelineComponentCtrl.executeComponent(pixelComponents, {});
        }

        function clickGrid(type, e) {
            if (clickTimeout) {
                $timeout.cancel(clickTimeout);
            }

            clickTimeout = $timeout(
                function (type1, e1) {
                    var selectedItem = String(e1.colDef.field).replace(
                            / /g,
                            '_'
                        ),
                        selectedObject,
                        sourceHeaders = scope.pipelineFuzzyBlend.source.headers,
                        destHeaders =
                            scope.pipelineFuzzyBlend.destination.headers;
                    if (type1 === 'source') {
                        selectedObject = sourceHeaders.find(function (obj) {
                            return obj.displayName === selectedItem;
                        });
                        scope.pipelineFuzzyBlend.frame.selected =
                            selectedObject;
                    } else if (type1 === 'destination') {
                        selectedObject = destHeaders.find(function (obj) {
                            return obj.displayName === selectedItem;
                        });
                        scope.pipelineFuzzyBlend.destination.selectedHeader =
                            selectedObject;
                    }
                }.bind(null, type, e),
                300
            );
        }

        /**
         * @name drawGrid
         * @param {string} type - type of grid to draw
         * @desc draw the grid
         * @returns {void}
         */
        function drawGrid(type) {
            grid[type] = {
                ele: ele[0].querySelector(
                    '#pipeline-fuzzy-blend__grid__content--' + type
                ),
                rendered: null,
            };
            const options = {
                rowData: [],
                columnDefs: [],
            };

            grid[type].rendered = new Grid(grid[type].ele, options);

            if (grid[type].rendered.gridOptions.api) {
                grid[type].rendered.gridOptions.api.addEventListener(
                    'cellClicked',
                    clickGrid.bind(null, type)
                );
            }
        }
        /**
         * @name updateGrid
         * @param {string} type - type of grid to draw
         * @param {object} data - data to update the grid with
         * @desc draw the grid
         * @returns {void}
         */
        function updateGrid(type, data) {
            var headerIdx,
                headerLen,
                schema = [],
                gridData = [];

            for (
                headerIdx = 0, headerLen = data.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                schema.push({
                    field: data.headers[headerIdx],
                    headerName: String(data.headers[headerIdx]).replace(
                        /_/g,
                        ' '
                    ),
                });
            }

            if (schema.length === 0) {
                // empty data
                gridData = [];
            } else {
                const tableData = semossCoreService.visualization.getTableData(
                    data.headers,
                    data.values,
                    data.rawHeaders
                );
                gridData = tableData.rawData;
            }
            if (grid[type].rendered.gridOptions.api) {
                grid[type].rendered.gridOptions.api.setColumnDefs(schema);
                grid[type].rendered.gridOptions.api.setRowData(gridData);
            }
        }
        /**
         * @name getGridData
         * @desc update the source headers
         * @param {string} frame - frame to update
         * @param {string} gridType - frame to update
         * @returns {void}
         */
        function getGridData(frame, gridType) {
            var callback = false;
            scope.pipelineFuzzyBlend[gridType] = frame;

            if (!scope.pipelineFuzzyBlend[gridType].name) {
                scope.widgetCtrl.alert('error', 'Source frame must be defined');
                return;
            }

            // update grid
            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                updateGrid(gridType, output.data);
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.pipelineFuzzyBlend[gridType].name],
                        meta: true,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                    },
                    {
                        type: 'limit',
                        components: [100],
                    },
                    {
                        type: 'collect',
                        components: [500],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name setInitialMerge
         * @desc if matching columns set the merge to them
         * @return {void}
         */
        function setInitialMerge() {
            const srcHeaders = scope.pipelineFuzzyBlend.source.headers,
                destHeaders = scope.pipelineFuzzyBlend.destination.headers;
            let from, to;
            for (let i = 0; i < srcHeaders.length; i++) {
                let stripSrcHeader = stripString(srcHeaders[i].alias);
                for (let j = 0; j < destHeaders.length; j++) {
                    let stripDestHeader = stripString(destHeaders[j].alias);

                    if (stripSrcHeader === stripDestHeader) {
                        from = srcHeaders[i];
                        to = destHeaders[j];

                        break;
                    }
                }
            }

            if (!from) {
                from = srcHeaders[0];
                to = destHeaders[0];
            }

            scope.pipelineFuzzyBlend.frame.selected = from;
            scope.pipelineFuzzyBlend.destination.selectedHeader = to;
        }

        /**
         * @name stripString
         * @param {str} str - str to strip
         * @desc uppercase string and remove all _ and whitespace
         * @return {string} the stripped string
         */
        function stripString(str) {
            return str.toUpperCase().replace(/ /g, '').replace(/_/g, '');
        }

        /**
         * @name initialize
         * @desc initialize the moduel
         * @returns {void}
         */
        function initialize() {
            var updateFrameListener, sourceComponent, destinationComponent;

            sourceComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.SOURCE.value'
            );
            destinationComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.DESTINATION.value'
            );

            if (!sourceComponent || !destinationComponent) {
                console.error(
                    'TODO: Allow to select a source/destination manually'
                );
                scope.pipelineComponentCtrl.closeComponent();
                return;
            }

            drawGrid('source');
            drawGrid('destination');
            getGridData(sourceComponent, 'source');
            getGridData(destinationComponent, 'destination');
            resetVars();

            scope.pipelineFuzzyBlend.source = sourceComponent;
            scope.pipelineFuzzyBlend.destination = destinationComponent;
            scope.pipelineFuzzyBlend.destination.otherSelectedHeaders = [];
            scope.pipelineFuzzyBlend.destination.otherOptions = [];

            getFrameHeaders('SOURCE');
            getFrameHeaders('DESTINATION');
            setInitialMerge();

            scope.$on('$destroy', function () {
                if (updateFrameListener) {
                    updateFrameListener();
                }
            });
        }

        initialize();
    }
}
