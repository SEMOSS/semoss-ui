'use strict';

export default angular
    .module('app.mdm-column.directive', [])
    .directive('mdmColumn', mdmColumnDirective);

import './mdm-column.scss';

mdmColumnDirective.$inject = ['$timeout', 'semossCoreService'];

function mdmColumnDirective($timeout, semossCoreService) {
    mdmColumnController.$inject = [];
    mdmColumnLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        scope: {},
        require: ['^mdm'],
        controller: mdmColumnController,
        bindToController: {
            type: '@',
        },
        controllerAs: 'mdmColumn',
        link: mdmColumnLink,
        template: require('./mdm-column.directive.html'),
    };

    function mdmColumnController() {}

    function mdmColumnLink(scope, ele, attrs, ctrl) {
        scope.mdmCtrl = ctrl[0];

        var matchTimeout;

        scope.mdmColumn.hideOverlay = hideOverlay;
        scope.mdmColumn.filterMatches = filterMatches;
        scope.mdmColumn.sortMatches = sortMatches;
        scope.mdmColumn.changeMatchSensitivity = changeMatchSensitivity;
        scope.mdmColumn.highlightMatch = highlightMatch;
        scope.mdmColumn.showMatch = showMatch;
        scope.mdmColumn.hideMatch = hideMatch;
        scope.mdmColumn.getMatches = getMatches;
        scope.mdmColumn.getMoreMatches = getMoreMatches;
        scope.mdmColumn.addMatch = addMatch;
        scope.mdmColumn.rejectMatch = rejectMatch;

        /** Overlay */
        /**
         * @name showOverlay
         * @desc show the overlay
         * @returns {void}
         */
        function showOverlay() {
            var message = semossCoreService.utility.random('table');

            scope.mdmColumn.overlay = {
                open: true,
                selected: [],
                options: [],
            };

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    added = {},
                    i,
                    len;

                scope.mdmColumn.overlay.selected = [];
                scope.mdmColumn.overlay.options = [];
                for (i = 0, len = output.length; i < len; i++) {
                    if (!added.hasOwnProperty(output[i][0])) {
                        scope.mdmColumn.overlay.options.push({
                            name: String(output[i][0]).replace(/_/g, ' '),
                            value: output[i][0],
                        });

                        scope.mdmColumn.overlay.selected.push(output[i][0]);

                        added[output[i][0]] = true;
                    }
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        meta: true,
                        type: 'getDatabaseTableStructure',
                        components: [scope.mdmCtrl.appId],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name hideOverlay
         * @desc hide the overlay
         * @returns {void}
         */
        function hideOverlay() {
            scope.mdmColumn.overlay.open = false;

            findMatches(scope.mdmColumn.overlay.selected);
        }

        /** Matches */

        /**
         * @name findMatches
         * @desc find the best matches to federate on
         * @param {array} tables - tables to filter on
         * @returns {void}
         */
        function findMatches(tables) {
            var message, pixel;

            message = semossCoreService.utility.random('pixel');

            if (scope.mdmColumn.type === 'direct') {
                pixel =
                    'FindDirectOwlRelationships(database=["' +
                    scope.mdmCtrl.appId +
                    '"]';

                if (tables.length > 0) {
                    pixel += ', tables=' + JSON.stringify(tables) + '';
                }

                pixel += ', store=[' + scope.mdmCtrl.storageFrame + ']';

                pixel += ')';
            } else if (scope.mdmColumn.type === 'indirect') {
                pixel =
                    'FindIndirectOwlRelationships(database=["' +
                    scope.mdmCtrl.appId +
                    '"]';

                if (tables.length > 0) {
                    pixel += ', tables=' + JSON.stringify(tables) + '';
                }

                pixel += ', store=[' + scope.mdmCtrl.storageFrame + ']';

                pixel += ')';
            } else if (scope.mdmColumn.type === 'semantic-column') {
                pixel =
                    'FindSemanticColumnOwlRelationships(database=["' +
                    scope.mdmCtrl.appId +
                    '"]';

                if (tables.length > 0) {
                    pixel += ', tables=' + JSON.stringify(tables) + '';
                }

                pixel += ', store=[' + scope.mdmCtrl.storageFrame + ']';

                pixel += ')';
            } else if (scope.mdmColumn.type === 'semantic-instance') {
                pixel =
                    'FindSemanticInstanceOwlRelationships(database=["' +
                    scope.mdmCtrl.appId +
                    '"]';

                if (tables.length > 0) {
                    pixel += ', tables=' + JSON.stringify(tables) + '';
                }

                pixel += ', store=[' + scope.mdmCtrl.storageFrame + ']';

                pixel += ')';
            }

            if (!pixel) {
                console.error('Setup for ' + scope.mdmColumn.type);
                return;
            }

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // clear out the old ones
                scope.mdmColumn.matches = {
                    initialized: true,
                    frame: output.name,
                    taskId: false,
                    full: true,
                    count: '-',
                    total: '-',
                    options: [], // all values
                    rendered: [], // all values on the dom
                    sort: 'desc', // sort direction
                    filter: '', // filter subset?
                    search: '', // search term used - only used for search term in call, nothing else
                    limit: 200, // how many values to collect
                    canCollect: true, // flag to determine whether another call can be made - infinite scroll
                };

                scope.mdmColumn.selected = {
                    sensitivity: 80,
                    accepted: [],
                    rejected: [],
                };

                scope.mdmColumn.instances = {
                    open: false,
                    match: false,
                    source: [],
                    target: [],
                };

                getMatches();

                validate();
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                        meta: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name filterMatches
         * @desc filter the matches to federate on
         * @returns {void}
         */
        function filterMatches() {
            if (scope.mdmColumn.matches.filter === 'accept') {
                scope.mdmColumn.matches.filter = 'reject';
            } else if (scope.mdmColumn.matches.filter === 'reject') {
                scope.mdmColumn.matches.filter = '';
            } else {
                scope.mdmColumn.matches.filter = 'accept';
            }
            getMatches();
        }

        /**
         * @name sortMatches
         * @desc sort the matches to federate on
         * @returns {void}
         */
        function sortMatches() {
            if (scope.mdmColumn.matches.sort === 'asc') {
                scope.mdmColumn.matches.sort = 'desc';
            } else if (scope.mdmColumn.matches.sort === 'desc') {
                scope.mdmColumn.matches.sort = '';
            } else {
                scope.mdmColumn.matches.sort = 'asc';
            }

            getMatches();
        }

        /**
         * @name changeMatchSensitivity
         * @desc highlight based on the sensivitiy
         * @returns {void}
         */
        function changeMatchSensitivity() {
            // only need to requery when the filter is there
            if (scope.mdmColumn.matches.filter) {
                getMatches();
            } else {
                renderMatches();
            }
        }

        /**
         * @name highlightMatch
         * @desc highlight the match on the metamodel
         * @param {*} match - match to highlight
         * @returns {void}
         */
        function highlightMatch(match) {
            var source, target;

            if (match) {
                source = match.left.split('.');
                target = match.right.split('.');

                semossCoreService.emit('mdm-highlight', {
                    source: source[0] + '__' + source[1],
                    target: target[0] + '__' + target[1],
                });

                return;
            }

            semossCoreService.emit('mdm-highlight', {
                source: false,
                target: false,
            });
        }

        /**
         * @name showMatch
         * @desc show a deeper dive into the match
         * @param {*} match - match to select
         * @returns {void}
         */
        function showMatch(match) {
            var source, target, message;

            if (!match) {
                return;
            }

            source = match.left.split('.');
            target = match.right.split('.');

            scope.mdmColumn.instances = {
                match: match,
                open: true,
                source: [],
                target: [],
            };

            message = semossCoreService.utility.random('meta-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len,
                    temp;

                for (i = 0, len = output.data.values.length; i < len; i++) {
                    temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.mdmColumn.instances.source.push(temp);
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'database',
                        components: [scope.mdmCtrl.appId],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    selector: source[0] + '__' + source[1],
                                    alias: source[1],
                                },
                            ],
                        ],
                    },
                    {
                        type: 'sort',
                        components: [[source[0] + '__' + source[1]]],
                    },
                    {
                        type: 'collect',
                        components: [50],
                        terminal: true,
                    },
                ],
                response: message,
            });

            message = semossCoreService.utility.random('meta-pixel');

            // register message to come back to
            semossCoreService.once(message, function (response) {
                var output = response.pixelReturn[0].output,
                    i,
                    len,
                    temp;

                for (i = 0, len = output.data.values.length; i < len; i++) {
                    temp = output.data.values[i][0];

                    if (typeof temp === 'string') {
                        temp = temp.replace(/_/g, ' ');
                    }

                    scope.mdmColumn.instances.target.push(temp);
                }
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: [
                    {
                        type: 'database',
                        components: [scope.mdmCtrl.appId],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [
                            [
                                {
                                    selector: target[0] + '__' + target[1],
                                    alias: target[1],
                                },
                            ],
                        ],
                    },
                    {
                        type: 'sort',
                        components: [[target[0] + '__' + target[1]]],
                    },
                    {
                        type: 'collect',
                        components: [50],
                        terminal: true,
                    },
                ],
                response: message,
            });
        }

        /**
         * @name hideMatch
         * @desc hide the deeper dive into the match
         * @returns {void}
         */
        function hideMatch() {
            scope.mdmColumn.instances = {
                open: false,
                match: false,
                source: [],
                target: [],
            };
        }

        /**
         * @name getMatches
         * @desc get the matches
         * @returns {void}
         */
        function getMatches() {
            var message = semossCoreService.utility.random('pixel'),
                pixelComponents,
                filterObj;

            if (matchTimeout) {
                $timeout.cancel(matchTimeout);
            }

            // let it rest for a little before executing
            matchTimeout = $timeout(function () {
                if (!scope.mdmColumn.matches.frame) {
                    return;
                }

                // remove the old one
                if (scope.mdmColumn.matches.taskId) {
                    semossCoreService.emit('meta-pixel', {
                        insightID: scope.mdmCtrl.insightID,
                        commandList: [
                            {
                                type: 'removeTask',
                                components: [scope.mdmColumn.matches.taskId],
                                terminal: true,
                                meta: true,
                            },
                        ],
                    });
                }

                pixelComponents = [
                    {
                        type: 'frame',
                        components: [scope.mdmColumn.matches.frame],
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
                                    alias: 'sourceCol',
                                },
                                {
                                    alias: 'sourceTable',
                                },
                                {
                                    alias: 'targetCol',
                                },
                                {
                                    alias: 'targetTable',
                                },
                            ],
                        ],
                    },
                ];

                // add a filter on the searched instances
                if (scope.mdmColumn.matches.search) {
                    pixelComponents = pixelComponents.concat([
                        {
                            type: 'Pixel',
                            components: [
                                'Filter((sourceCol ?like "' +
                                    scope.mdmColumn.matches.search +
                                    '") OR (sourceTable ?like "' +
                                    scope.mdmColumn.matches.search +
                                    '") OR (targetCol ?like "' +
                                    scope.mdmColumn.matches.search +
                                    '") OR (targetTable ?like "' +
                                    scope.mdmColumn.matches.search +
                                    '"))',
                            ],
                        },
                    ]);
                }

                // add a filter based on full
                if (!scope.mdmColumn.matches.full) {
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
                if (scope.mdmColumn.matches.filter) {
                    filterObj = {};
                    if (scope.mdmColumn.matches.filter === 'accept') {
                        filterObj.distance = {
                            comparator: '<',
                            value: scope.mdmColumn.selected.sensitivity / 100,
                        };
                    } else if (scope.mdmColumn.matches.filter === 'reject') {
                        filterObj.distance = {
                            comparator: '>=',
                            value: scope.mdmColumn.selected.sensitivity / 100,
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
                if (scope.mdmColumn.matches.sort) {
                    pixelComponents = pixelComponents.concat([
                        {
                            type: 'sortOptions',
                            components: [
                                [
                                    {
                                        alias: 'distance',
                                        dir: scope.mdmColumn.matches.sort,
                                    },
                                ],
                            ],
                        },
                    ]);
                }

                pixelComponents = pixelComponents.concat({
                    type: 'collect',
                    components: [scope.mdmColumn.matches.limit],
                    terminal: true,
                });

                // register message to come back to
                semossCoreService.once(message, function (response) {
                    var output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    // clear out the matches
                    scope.mdmColumn.matches.options = [];

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    setMatchData(output);
                    renderMatches();
                });

                semossCoreService.emit('meta-pixel', {
                    insightID: scope.mdmCtrl.insightID,
                    commandList: pixelComponents,
                    response: message,
                });

                $timeout.cancel(matchTimeout);
            }, 300);
        }

        /**
         * @name getMoreMatches
         * @desc get the matches
         * @returns {void}
         */
        function getMoreMatches() {
            var message;

            if (scope.mdmColumn.matches.canCollect) {
                message = semossCoreService.utility.random('pixel');

                // register message to come back to
                semossCoreService.once(message, function (response) {
                    var output = response.pixelReturn[0].output,
                        type = response.pixelReturn[0].operationType;

                    if (type.indexOf('ERROR') > -1) {
                        return;
                    }

                    setMatchData(output);
                    renderMatches();
                });

                semossCoreService.emit('meta-pixel', {
                    insightID: scope.mdmCtrl.insightID,
                    commandList: [
                        {
                            type: 'task',
                            components: [scope.mdmColumn.matches.taskId],
                            meta: true,
                        },
                        {
                            type: 'collect',
                            components: [scope.mdmColumn.matches.limit],
                            terminal: true,
                        },
                    ],
                    response: message,
                });
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

            // assumed order is distance, sourceCol, sourceTable, targetCol, targetTable
            for (
                valueIdx = 0, valueLen = output.data.values.length;
                valueIdx < valueLen;
                valueIdx++
            ) {
                options.push({
                    match:
                        output.data.values[valueIdx][2] +
                        '.' +
                        output.data.values[valueIdx][1] +
                        '==' +
                        output.data.values[valueIdx][4] +
                        '.' +
                        output.data.values[valueIdx][3],
                    left:
                        output.data.values[valueIdx][2] +
                        '.' +
                        output.data.values[valueIdx][1],
                    right:
                        output.data.values[valueIdx][4] +
                        '.' +
                        output.data.values[valueIdx][3],
                    distance: output.data.values[valueIdx][0],
                });
            }

            scope.mdmColumn.matches.options =
                scope.mdmColumn.matches.options.concat(options);
            scope.mdmColumn.matches.taskId = output.taskId;
            scope.mdmColumn.matches.canCollect =
                output.numCollected === output.data.values.length;
        }

        /**
         * @name renderMatches
         * @desc render the matches
         * @returns {void}
         */
        function renderMatches() {
            var renderedMatches = semossCoreService.utility.freeze(
                    scope.mdmColumn.matches.options
                ),
                calculatedDistance,
                matchIdx,
                manualIdx,
                manualLen;

            for (
                manualIdx = 0,
                    manualLen = scope.mdmColumn.selected.accepted.length;
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
                        scope.mdmColumn.selected.accepted[manualIdx].match
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
                    manualLen = scope.mdmColumn.selected.rejected.length;
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
                        scope.mdmColumn.selected.rejected[manualIdx].match
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
                calculatedDistance = renderedMatches[matchIdx].distance * 100;
                renderedMatches[matchIdx].renderedDistance =
                    calculatedDistance + '%';
                renderedMatches[matchIdx].accepted =
                    calculatedDistance >= scope.mdmColumn.selected.sensitivity;
            }

            scope.mdmColumn.matches.rendered = renderedMatches;
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
                to = scope.mdmColumn.selected.accepted;
            } else {
                to = scope.mdmColumn.selected.rejected;
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

            hideMatch();
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
                from = scope.mdmColumn.selected.accepted;
            } else {
                from = scope.mdmColumn.selected.rejected;
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
            hideMatch();
        }

        /**
         * @name cancelMatches
         * @desc cancel your matching
         * @returns {void}
         */
        function cancelMatches() {
            // clear out the old ones
            scope.mdmColumn.matches = {
                initialized: false,
                frame: '',
                taskId: false,
                full: true,
                count: '-',
                total: '-',
                options: [], // all values
                rendered: [], // all values on the dom
                sort: 'desc', // sort direction
                filter: '', // filter subset?
                search: '', // search term used - only used for search term in call, nothing else
                limit: 200, // how many values to collect
                canCollect: true, // flag to determine whether another call can be made - infinite scroll
            };

            scope.mdmColumn.selected = {
                sensitivity: 80,
                accepted: [],
                rejected: [],
            };

            scope.mdmCtrl.updateStatus('incomplete');
            scope.mdmCtrl.navigate('previous');
        }

        /**
         * @name saveMatches
         * @desc save your matches
         * @returns {void}
         */
        function saveMatches() {
            var components = [],
                message,
                matchIdx,
                matchLen,
                start,
                end,
                startT,
                startC,
                endT,
                endC;

            if (!scope.mdmCtrl.valid) {
                return;
            }

            // add the bulk
            components.push({
                type: 'addBulkOwlRelationships',
                components: [
                    scope.mdmCtrl.appId,
                    scope.mdmColumn.matches.frame,
                    scope.mdmColumn.selected.sensitivity / 100,
                    scope.mdmCtrl.storageFrame,
                ],
                meta: true,
                terminal: true,
            });

            // add the manual
            matchLen = scope.mdmColumn.selected.accepted.length;
            if (matchLen > 0) {
                startT = [];
                startC = [];
                endT = [];
                endC = [];
                for (matchIdx = 0; matchIdx < matchLen; matchIdx++) {
                    start =
                        scope.mdmColumn.selected.accepted[matchIdx].left.split(
                            '.'
                        );
                    end =
                        scope.mdmColumn.selected.accepted[matchIdx].right.split(
                            '.'
                        );

                    startT.push(start[0]);
                    startC.push(start[1]);
                    endT.push(end[0]);
                    endC.push(end[1]);
                }

                components.push({
                    type: 'addOwlRelationship',
                    components: [
                        scope.mdmCtrl.appId,
                        startT,
                        startC,
                        endT,
                        endC,
                        scope.mdmCtrl.storageFrame,
                    ],
                    meta: true,
                    terminal: true,
                });
            }

            // remove the manual
            matchLen = scope.mdmColumn.selected.rejected.length;
            if (matchLen > 0) {
                startT = [];
                startC = [];
                endT = [];
                endC = [];
                for (matchIdx = 0; matchIdx < matchLen; matchIdx++) {
                    start =
                        scope.mdmColumn.selected.rejected[matchIdx].left.split(
                            '.'
                        );
                    end =
                        scope.mdmColumn.selected.rejected[matchIdx].right.split(
                            '.'
                        );

                    startT.push(start[0]);
                    startC.push(start[1]);
                    endT.push(end[0]);
                    endC.push(end[1]);
                }

                components.push({
                    type: 'removeOwlRelationship',
                    components: [
                        scope.mdmCtrl.appId,
                        startT,
                        startC,
                        endT,
                        endC,
                        scope.mdmCtrl.storageFrame,
                    ],
                    meta: true,
                    terminal: true,
                });
            }

            message = semossCoreService.utility.random('meta');
            semossCoreService.once(message, function (response) {
                var outputIdx, outputLen;

                for (
                    outputIdx = 0, outputLen = response.pixelReturn.length;
                    outputIdx < outputLen;
                    outputIdx++
                ) {
                    if (
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'ERROR'
                        ) > -1 ||
                        response.pixelReturn[outputIdx].operationType.indexOf(
                            'INVALID_SYNTAX'
                        ) > -1
                    ) {
                        return;
                    }
                }

                scope.mdmCtrl.updateStatus('complete');
                scope.mdmCtrl.navigate('next');
            });

            semossCoreService.emit('meta-pixel', {
                insightID: scope.mdmCtrl.insightID,
                commandList: components,
                response: message,
            });
        }

        /**
         * @name validate
         * @desc validate the form based on the selected options
         * @returns {void}
         */
        function validate() {
            if (
                !scope.mdmColumn.matches ||
                !scope.mdmColumn.matches.initialized
            ) {
                scope.mdmCtrl.valid = false;

                return;
            }

            scope.mdmCtrl.valid = true;
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            // set the override actions
            scope.mdmCtrl.next = saveMatches;
            scope.mdmCtrl.previous = cancelMatches;

            // update the metamodel
            scope.mdmCtrl.updateMetamodel();

            // update the status
            scope.mdmCtrl.updateStatus('inprogress');
            validate();

            showOverlay();
        }

        initialize();
    }
}
