'use strict';

import { Grid } from 'ag-grid-community';

import './pipeline-merge.scss';

export default angular
    .module('app.pipeline.pipeline-merge', [])
    .directive('pipelineMerge', pipelineMergeDirective);

pipelineMergeDirective.$inject = ['$timeout', 'semossCoreService'];

function pipelineMergeDirective($timeout, semossCoreService) {
    pipelineMergeCtrl.$inject = [];
    pipelineMergeLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./pipeline-merge.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineMergeCtrl,
        controllerAs: 'pipelineMerge',
        bindToController: {},
        link: pipelineMergeLink,
    };

    function pipelineMergeCtrl() {}

    function pipelineMergeLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        var clickTimeout,
            grid = {};
        scope.pipelineMerge.disableAdd = false;
        scope.pipelineMerge.destination = {
            name: undefined,
            type: undefined,
            headers: [],
            joins: [],
        };

        scope.pipelineMerge.source = {
            name: undefined,
            type: undefined,
            headers: [],
            joins: [],
        };

        scope.pipelineMerge.joinOptions = {
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
        // JoinComparatorOptions to achieve complex joins
        scope.pipelineMerge.joinComparatorOptions = [
            {
                display: '==',
                value: '==',
                types: [
                    'NUMBER',
                    'DOUBLE',
                    'INT',
                    'STRING',
                    'FACTOR',
                    'DATE',
                    'TIMESTAMP',
                    'BOOLEAN',
                ],
            },
            {
                display: '!=',
                value: '!=',
                types: [
                    'NUMBER',
                    'DOUBLE',
                    'INT',
                    'STRING',
                    'FACTOR',
                    'DATE',
                    'TIMESTAMP',
                    'BOOLEAN',
                ],
            },
            {
                display: '<',
                value: '<',
                types: ['NUMBER', 'DOUBLE', 'INT', 'DATE', 'TIMESTAMP'],
            },
            {
                display: '<=',
                value: '<=',
                types: ['NUMBER', 'DOUBLE', 'INT', 'DATE', 'TIMESTAMP'],
            },
            {
                display: '>',
                value: '>',
                types: ['NUMBER', 'DOUBLE', 'INT', 'DATE', 'TIMESTAMP'],
            },
            {
                display: '>=',
                value: '>=',
                types: ['NUMBER', 'DOUBLE', 'INT', 'DATE', 'TIMESTAMP'],
            },
        ];

        scope.pipelineMerge.merge = [];
        scope.pipelineMerge.joinComparatorOptionsList = [];

        scope.pipelineMerge.addMerge = addMerge;
        scope.pipelineMerge.removeMerge = removeMerge;
        scope.pipelineMerge.previewMerge = previewMerge;
        scope.pipelineMerge.saveMerge = saveMerge;
        scope.pipelineMerge.showAllOperators = showAllOperators;

        /**
         * @name drawGrid
         * @param {string} type - type of grid to draw
         * @desc draw the grid
         * @returns {void}
         */
        function drawGrid(type) {
            grid[type] = {
                ele: ele[0].querySelector(
                    '#pipeline-merge__grid__content--' + type
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
         * @name clickGrid
         * @param {string} type - type of grid to draw
         * @param {event} e - click event
         * @desc grid has been clicked, update
         * @returns {void}
         */
        function clickGrid(type, e) {
            if (clickTimeout) {
                $timeout.cancel(clickTimeout);
            }

            clickTimeout = $timeout(
                function (type1, e1) {
                    if (type1 === 'source') {
                        scope.pipelineMerge.merge[
                            scope.pipelineMerge.merge.length - 1
                        ].from = String(e1.colDef.field).replace(/ /g, '_');
                    } else if (type1 === 'destination') {
                        scope.pipelineMerge.merge[
                            scope.pipelineMerge.merge.length - 1
                        ].to = String(e1.colDef.field).replace(/ /g, '_');
                    }
                }.bind(null, type, e),
                300
            );
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
         * @name updateSource
         * @desc update the source headers
         * @param {string} frame - frame to update
         * @returns {void}
         */
        function updateSource(frame) {
            let callback,
                selectors = [];

            scope.pipelineMerge.source = frame;

            if (!scope.pipelineMerge.source.name) {
                scope.widgetCtrl.alert('error', 'Source frame must be defined');
                return;
            }

            // update headers
            if (
                !scope.pipelineMerge.source.headers ||
                scope.pipelineMerge.source.headers.length === 0
            ) {
                scope.pipelineMerge.source.headers =
                    scope.widgetCtrl.getShared(
                        'frames.' + scope.pipelineMerge.source.name + '.headers'
                    ) || [];
            }

            // validateMergeFromUpdate('source');

            // update grid
            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                updateGrid('source', output.data);
            };

            for (
                let headerIdx = 0;
                headerIdx < scope.pipelineMerge.source.headers.length;
                headerIdx++
            ) {
                selectors.push({
                    selector:
                        scope.pipelineMerge.source.headers[headerIdx].header,
                    alias: scope.pipelineMerge.source.headers[headerIdx].alias,
                });
            }

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.pipelineMerge.source.name],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [selectors],
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
         * @name updateDestination
         * @desc update the destination headers
         * @param {string} frame - frame to update
         * @returns {void}
         */
        function updateDestination(frame) {
            var callback,
                selectors = [];

            scope.pipelineMerge.destination = frame;

            if (!scope.pipelineMerge.destination.name) {
                scope.widgetCtrl.alert(
                    'error',
                    'Destination frame must be defined'
                );
                return;
            }

            if (
                !scope.pipelineMerge.destination.headers ||
                scope.pipelineMerge.destination.headers.length === 0
            ) {
                scope.pipelineMerge.destination.headers =
                    scope.widgetCtrl.getShared(
                        'frames.' +
                            scope.pipelineMerge.destination.name +
                            '.headers'
                    );
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                updateGrid('destination', output.data);
            };

            for (
                let headerIdx = 0;
                headerIdx < scope.pipelineMerge.destination.headers.length;
                headerIdx++
            ) {
                selectors.push({
                    selector:
                        scope.pipelineMerge.destination.headers[headerIdx]
                            .header,
                    alias: scope.pipelineMerge.destination.headers[headerIdx]
                        .alias,
                });
            }

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.pipelineMerge.destination.name],
                        meta: true,
                    },
                    {
                        type: 'select2',
                        components: [selectors],
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
         * @name showAllOperators
         * @param {string} leftColumn - selected left column name
         * @param {string} rightColumn - selected right column name
         * @desc prepares all the operators based on dataType
         * @returns {void}
         */
        function showAllOperators(leftColumn, rightColumn) {
            // To get all the source and target table columns with headers
            const sourceComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                ),
                destinationComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.DESTINATION.value'
                ),
                // To get selected left and right column headers
                destinationColHeader =
                    leftColumn &&
                    destinationComponent.headers.filter(
                        (destinationCol) =>
                            destinationCol.alias === leftColumn &&
                            destinationCol.displayName === leftColumn
                    ),
                sourceColHeader =
                    rightColumn &&
                    sourceComponent.headers.filter(
                        (sourceCol) =>
                            sourceCol.alias === rightColumn &&
                            sourceCol.displayName === rightColumn
                    );

            scope.pipelineMerge.joinComparatorOptionsList = [];
            // looping the joinComparatorOptions based on data type of selected columns
            for (
                let index = 0;
                index < scope.pipelineMerge.joinComparatorOptions.length;
                index++
            ) {
                let availableTypes =
                    scope.pipelineMerge.joinComparatorOptions[index].types;
                if (
                    (destinationColHeader &&
                        availableTypes.indexOf(
                            destinationColHeader[0].dataType
                        ) > -1) ||
                    (sourceColHeader &&
                        availableTypes.indexOf(sourceColHeader[0].dataType) >
                            -1)
                ) {
                    scope.pipelineMerge.joinComparatorOptionsList.push(
                        scope.pipelineMerge.joinComparatorOptions[index]
                    );
                }
            }
        }

        /**
         * @name addMerge
         * @param {object} source - source component
         * @param {object} destination - destination component
         * @desc add a new field to merge on for the databases
         * @returns {void}
         */
        function addMerge(source, destination) {
            if (source && destination) {
                for (
                    let sourceIdx = 0, sourceLen = source.headers.length;
                    sourceIdx < sourceLen;
                    sourceIdx++
                ) {
                    const cleanedSourceHeader = stripString(
                        source.headers[sourceIdx].alias
                    );
                    for (
                        let destinationIdx = 0,
                            destinationLen = destination.headers.length;
                        destinationIdx < destinationLen;
                        destinationIdx++
                    ) {
                        const cleanedDestinationHeader = stripString(
                            destination.headers[destinationIdx].alias
                        );
                        if (cleanedSourceHeader === cleanedDestinationHeader) {
                            scope.pipelineMerge.merge.push({
                                from: destination.headers[destinationIdx].alias,
                                join: 'inner.join',
                                to: source.headers[sourceIdx].alias,
                                joinComparator: '==', // addding '==' as default joinComparator
                            });

                            break;
                        }
                    }
                }

                if (scope.pipelineMerge.merge.length === 0) {
                    scope.pipelineMerge.merge.push({
                        from: destination.headers[0].alias,
                        join: 'inner.join',
                        to: source.headers[0].alias,
                        joinComparator: '==', // addding '==' as default joinComparator
                    });
                }
            } else {
                scope.pipelineMerge.merge.push({
                    from: '',
                    join: 'inner.join',
                    to: '',
                    joinComparator: '==', // addding '==' as default joinComparator
                });
            }
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
         * @name removeMerge
         * @desc remove a merge for the databases
         * @param {number} idx - idx to remove
         * @returns {void}
         */
        function removeMerge(idx) {
            scope.pipelineMerge.merge.splice(idx, 1);
        }

        /**
         * @name validateMerge
         * @param {boolean} alert - message on errors
         * @desc validate the merge options
         * @returns {boolean} is the merge valid
         */
        function validateMerge(alert) {
            var mergeIdx, mergeLen;

            if (scope.pipelineMerge.source.headers.length === 0) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Source selectors are empty. Please select columns to merge.'
                    );
                }
                return false;
            }

            if (scope.pipelineMerge.destination.headers.length === 0) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Destination selectors are empty. Please select column to merge.'
                    );
                }
                return false;
            }

            for (
                mergeIdx = 0, mergeLen = scope.pipelineMerge.merge.length;
                mergeIdx < mergeLen;
                mergeIdx++
            ) {
                if (
                    !scope.pipelineMerge.merge[mergeIdx].from ||
                    !scope.pipelineMerge.merge[mergeIdx].join ||
                    !scope.pipelineMerge.merge[mergeIdx].to
                ) {
                    if (alert) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Merge options are not valid. Please check column to merge.'
                        );
                    }
                    return false;
                }
            }

            return true;
        }

        /**
         * @name previewMerge
         * @param {boolean} alert - message on errors
         * @desc import the query
         * @returns {void}
         */
        function previewMerge(alert) {
            var parameters = {};

            if (validateMerge(alert)) {
                parameters = buildParameters(true);
            }

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name saveMerge
         * @desc saveMerge the databases
         * @returns {void}
         */
        function saveMerge() {
            var parameters = {};

            if (!validateMerge(true)) {
                return;
            }

            parameters = buildParameters();

            scope.pipelineComponentCtrl.executeComponent(parameters, {});
        }

        /**
         * @name buildParameters
         * @param {boolean} preview - true if coming from preview
         * @desc build the parameters for the current module
         * @returns {object} - map of the paramters to value
         */
        function buildParameters(preview) {
            let selectors = [],
                remove = '',
                relations = [],
                frameJoins = scope.widgetCtrl.getFrame('joins') || [];

            // we always assume that alias doesn't have ' ' (always has '_')
            for (
                let headerIdx = 0,
                    headerLen = scope.pipelineMerge.source.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                selectors.push({
                    type: 'COLUMN',
                    content: {
                        column: scope.pipelineMerge.source.headers[headerIdx]
                            .alias,
                        alias: scope.pipelineMerge.source.headers[headerIdx]
                            .alias,
                    },
                });
            }

            if (frameJoins.length > 0) {
                relations = frameJoins.map((join) => [
                    join.fromNode,
                    join.joinType,
                    join.toNode,
                ]);
            }

            if (!preview) {
                remove = `RemoveFrame("${scope.pipelineMerge.source.name}");`;
            }

            return {
                SOURCE: scope.pipelineMerge.source,
                QUERY_STRUCT: {
                    qsType: '', // intentionally blank
                    isDistinct: true,
                    limit: -1,
                    offset: -1,
                    relations: relations,
                    orders: [],
                    queryAll: true,
                    selectors: selectors,
                    explicitFilters: [],
                    havingFilters: [],
                },
                JOINS: scope.pipelineMerge.merge,
                DESTINATION: scope.pipelineMerge.destination,
                REMOVE: remove,
            };
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var sourceComponent, destinationComponent, joinComponent;

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

            // validate the merge component
            joinComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.JOINS.value'
            );
            if (joinComponent) {
                const sourceHeaders = {},
                    destinationHeaders = {},
                    merge = [];

                // map all of the source headers
                for (
                    let headerIdx = 0,
                        headerLen = sourceComponent.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header = sourceComponent.headers[headerIdx];

                    sourceHeaders[header.alias] = true;
                }

                // map all of the desintation headers
                for (
                    let headerIdx = 0,
                        headerLen = destinationComponent.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header = destinationComponent.headers[headerIdx];

                    destinationHeaders[header.alias] = true;
                }

                for (
                    let joinIdx = 0, joinLen = joinComponent.length;
                    joinIdx < joinLen;
                    joinIdx++
                ) {
                    const join = joinComponent[joinIdx];

                    let from = '',
                        to = '',
                        joinComparator = '=='; // if joinComparator is not present addding '==' as default joinComparator

                    if (destinationHeaders[join.from]) {
                        from = join.from;
                    }

                    if (sourceHeaders[join.to]) {
                        to = join.to;
                    }

                    if (!from && !to) {
                        continue;
                    }
                    if (join.joinComparator) {
                        // if we get the joinComparator as '=' change it '=='
                        joinComparator = join.joinComparator;
                    }

                    merge.push({
                        from: from,
                        join: join.join,
                        to: to,
                        joinComparator: joinComparator,
                    });
                }

                scope.pipelineMerge.merge = merge;
            }

            if (sourceComponent.headers && sourceComponent.headers.length > 0) {
                scope.pipelineMerge.source.headers = sourceComponent.headers;
            }

            if (
                destinationComponent.headers &&
                destinationComponent.headers.length > 0
            ) {
                scope.pipelineMerge.destination.headers =
                    destinationComponent.headers;
            }

            // draw the grids
            drawGrid('source');
            drawGrid('destination');

            // TODO: merge source + destiniation functions
            updateSource(sourceComponent);
            updateDestination(destinationComponent);

            if (
                !scope.pipelineMerge.merge ||
                scope.pipelineMerge.merge.length === 0
            ) {
                addMerge(sourceComponent, destinationComponent);
            }

            scope.$watch(
                'pipelineMerge.merge',
                function (newValues, oldValues) {
                    if (!angular.equals(newValues, oldValues)) {
                        let lastItem = newValues.length - 1;
                        if (
                            newValues[lastItem].from &&
                            newValues[lastItem].to
                        ) {
                            scope.pipelineMerge.disableAdd = false;
                        } else {
                            scope.pipelineMerge.disableAdd = true;
                        }
                    }
                },
                true
            );
        }

        initialize();
    }
}
