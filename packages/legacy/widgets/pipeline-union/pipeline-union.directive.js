'use strict';

import { Grid } from 'ag-grid-community';

import './pipeline-union.scss';

export default angular
    .module('app.pipeline.pipeline-union', [])
    .directive('pipelineUnion', pipelineUnionDirective);

pipelineUnionDirective.$inject = ['$timeout', 'semossCoreService'];

function pipelineUnionDirective($timeout, semossCoreService) {
    pipelineUnionCtrl.$inject = [];
    pipelineUnionLink.$inject = ['scope', 'ele'];

    return {
        restrict: 'E',
        template: require('./pipeline-union.directive.html'),
        scope: {},
        require: ['^widget', '^pipelineComponent'],
        controller: pipelineUnionCtrl,
        controllerAs: 'pipelineUnion',
        bindToController: {},
        link: pipelineUnionLink,
    };

    function pipelineUnionCtrl() {}

    function pipelineUnionLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        var clickTimeout,
            grid = {};
        scope.pipelineUnion.disableAdd = false;
        scope.pipelineUnion.frame1 = {
            name: undefined,
            type: undefined,
            headers: [],
            unions: [],
        };
        scope.pipelineUnion.frame2 = {
            name: undefined,
            type: undefined,
            headers: [],
            unions: [],
        };

        scope.pipelineUnion.union = [];
        scope.pipelineUnion.unionType = false;
        scope.pipelineUnion.addUnion = addUnion;
        scope.pipelineUnion.removeUnion = removeUnion;
        scope.pipelineUnion.previewUnion = previewUnion;
        scope.pipelineUnion.saveUnion = saveUnion;
        scope.pipelineUnion.selectedOption = selectedOption;

        /**
         * @name drawGrid
         * @param {string} type - type of grid to draw
         * @desc draw the grid
         * @returns {void}
         */
        function drawGrid(type) {
            grid[type] = {
                ele: ele[0].querySelector(
                    '#pipeline-union__grid__content--' + type
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
                    if (type1 === 'frame1') {
                        scope.pipelineUnion.union[
                            scope.pipelineUnion.union.length - 1
                        ].from = String(e1.colDef.field).replace(/ /g, '_');
                    } else if (type1 === 'frame2') {
                        scope.pipelineUnion.union[
                            scope.pipelineUnion.union.length - 1
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
         * @name updateFrame1
         * @desc update the frame 1 headers
         * @param {string} frame - frame to update
         * @returns {void}
         */
        function updateFrame1(frame) {
            let callback,
                selectors = [];

            scope.pipelineUnion.frame1 = frame;

            if (!scope.pipelineUnion.frame1.name) {
                scope.widgetCtrl.alert('error', 'Frame 1 must be defined');
                return;
            }

            // update headers
            if (
                !scope.pipelineUnion.frame1.headers ||
                scope.pipelineUnion.frame1.headers.length === 0
            ) {
                scope.pipelineUnion.frame1.headers =
                    scope.widgetCtrl.getShared(
                        'frames.' + scope.pipelineUnion.frame1.name + '.headers'
                    ) || [];
            }

            // update grid
            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                updateGrid('frame1', output.data);
            };

            for (
                let headerIdx = 0;
                headerIdx < scope.pipelineUnion.frame1.headers.length;
                headerIdx++
            ) {
                selectors.push({
                    selector:
                        scope.pipelineUnion.frame1.headers[headerIdx].header,
                    alias: scope.pipelineUnion.frame1.headers[headerIdx].alias,
                });
            }

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.pipelineUnion.frame1.name],
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
         * @name updateFrame2
         * @desc update the frame 2 headers
         * @param {string} frame - frame to update
         * @returns {void}
         */
        function updateFrame2(frame) {
            var callback,
                selectors = [];

            scope.pipelineUnion.frame2 = frame;

            if (!scope.pipelineUnion.frame2.name) {
                scope.widgetCtrl.alert('error', 'Frame 2 must be defined');
                return;
            }

            if (
                !scope.pipelineUnion.frame2.headers ||
                scope.pipelineUnion.frame2.headers.length === 0
            ) {
                scope.pipelineUnion.frame2.headers = scope.widgetCtrl.getShared(
                    'frames.' + scope.pipelineUnion.frame2.name + '.headers'
                );
            }

            // register message to come back to
            callback = function (response) {
                var output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                updateGrid('frame2', output.data);
            };

            for (
                let headerIdx = 0;
                headerIdx < scope.pipelineUnion.frame2.headers.length;
                headerIdx++
            ) {
                selectors.push({
                    selector:
                        scope.pipelineUnion.frame2.headers[headerIdx].header,
                    alias: scope.pipelineUnion.frame2.headers[headerIdx].alias,
                });
            }

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'frame',
                        components: [scope.pipelineUnion.frame2.name],
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
         * @name addUnion
         * @param {object} frame1 - frame1 component
         * @param {object} frame2 - frame2 component
         * @desc add a new field to union on for the databases
         * @returns {void}
         */
        function addUnion(frame1, frame2) {
            if (frame1 && frame2) {
                for (
                    let frame1Idx = 0, frameLen = frame1.headers.length;
                    frame1Idx < frameLen;
                    frame1Idx++
                ) {
                    const cleanedFrame1Header = stripString(
                        frame1.headers[frame1Idx].alias
                    );
                    for (
                        let frame2Idx = 0, frame2Len = frame2.headers.length;
                        frame2Idx < frame2Len;
                        frame2Idx++
                    ) {
                        const cleanedFrame2Header = stripString(
                            frame2.headers[frame2Idx].alias
                        );
                        if (cleanedFrame1Header === cleanedFrame2Header) {
                            scope.pipelineUnion.union.push({
                                from: frame2.headers[frame2Idx].alias,
                                fromDataType:
                                    frame2.headers[frame2Idx].dataType,
                                to: frame1.headers[frame1Idx].alias,
                                toDataType: frame1.headers[frame1Idx].dataType,
                            });

                            break;
                        }
                    }
                }

                if (scope.pipelineUnion.union.length === 0) {
                    scope.pipelineUnion.union.push({
                        from: frame2.headers[0].alias,
                        fromDataType: frame2.headers[0].dataType,
                        to: frame1.headers[0].alias,
                        toDataType: frame1.headers[0].dataType,
                    });
                }
            } else {
                scope.pipelineUnion.union.push({
                    from: '',
                    fromDataType: '',
                    to: '',
                    toDataType: '',
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
         * @name removeUnion
         * @desc remove a union for the databases
         * @param {number} idx - idx to remove
         * @returns {void}
         */
        function removeUnion(idx) {
            scope.pipelineUnion.union.splice(idx, 1);
        }

        /**
         * @name validateUnion
         * @param {boolean} alert - message on errors
         * @desc validate the union options
         * @returns {boolean} is the union valid
         */
        function validateUnion(alert) {
            var unionIdx, unionLen;

            if (scope.pipelineUnion.frame1.headers.length === 0) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Frame 1 selectors are empty. Please select columns to union.'
                    );
                }
                return false;
            }

            if (scope.pipelineUnion.frame2.headers.length === 0) {
                if (alert) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Frame 2 selectors are empty. Please select column to union.'
                    );
                }
                return false;
            }

            for (
                unionIdx = 0, unionLen = scope.pipelineUnion.union.length;
                unionIdx < unionLen;
                unionIdx++
            ) {
                if (
                    !scope.pipelineUnion.union[unionIdx].from ||
                    !scope.pipelineUnion.union[unionIdx].to
                ) {
                    if (alert) {
                        scope.widgetCtrl.alert(
                            'warn',
                            'Union options are not valid. Please check column to union.'
                        );
                    }
                    return false;
                }
            }

            return true;
        }

        /**
         * @name previewUnion
         * @param {boolean} alert - message on errors
         * @desc import the query
         * @returns {void}
         */
        function previewUnion(alert) {
            var parameters = {};

            if (validateUnion(alert)) {
                parameters = buildParameters(true);
            }

            scope.pipelineComponentCtrl.previewComponent(parameters);
        }

        /**
         * @name selectedOption
         * @desc moving the columns position up
         * @param {string} frameType - Determine if it the frame is to or from
         * @param {number} selectedIndex - selected index
         * @param {object} selectedObj - Which frame in this swap called
         * @returns {void}
         */
        function selectedOption(frameType, selectedIndex, selectedObj) {
            var SelectedframeType = frameType + 'DataType';
            scope.pipelineUnion.union[selectedIndex][SelectedframeType] =
                selectedObj.dataType;
        }
        /**
         * @name saveUnion
         * @desc saveUnion the databases
         * @returns {void}
         */
        function saveUnion() {
            var parameters = {};

            if (!validateUnion(true)) {
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
                relations = [],
                frameUnions = scope.widgetCtrl.getFrame('unions') || [],
                unionDetails = {
                    unions: scope.pipelineUnion.union,
                    unionType:
                        scope.pipelineUnion.unionType === true
                            ? 'unionall'
                            : 'union',
                };

            // we always assume that alias doesn't have ' ' (always has '_')
            for (
                let headerIdx = 0,
                    headerLen = scope.pipelineUnion.frame1.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                selectors.push({
                    type: 'COLUMN',
                    content: {
                        column: scope.pipelineUnion.frame1.headers[headerIdx]
                            .alias,
                        alias: scope.pipelineUnion.frame1.headers[headerIdx]
                            .alias,
                    },
                });
            }

            if (frameUnions.length > 0) {
                relations = frameUnions.map((union) => [
                    union.fromNode,
                    union.unionType,
                    union.toNode,
                ]);
            }

            unionDetails['frame1'] = scope.pipelineUnion.frame1.name;
            unionDetails['frame2'] = scope.pipelineUnion.frame2.name;

            return {
                UNIONS: unionDetails,
            };
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var frame1Component, frame2Component, unionComponent;

            frame1Component = scope.pipelineComponentCtrl.getComponent(
                'parameters.FRAME1.value'
            );
            frame2Component = scope.pipelineComponentCtrl.getComponent(
                'parameters.FRAME2.value'
            );
            if (!frame1Component || !frame2Component) {
                console.error('TODO: Allow to select a frame1/frame2 manually');
                scope.pipelineComponentCtrl.closeComponent();
                return;
            }

            // validate the union component
            unionComponent = scope.pipelineComponentCtrl.getComponent(
                'parameters.JOINS.value'
            );
            if (unionComponent) {
                const frame1Headers = {},
                    frame2Headers = {},
                    unionArr = [];

                // map all of the frame1 headers
                for (
                    let headerIdx = 0,
                        headerLen = frame1Component.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header = frame1Component.headers[headerIdx];
                    frame1Headers[header.alias] = true;
                }

                // map all of the frame2 headers
                for (
                    let headerIdx = 0,
                        headerLen = frame2Component.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header = frame2Component.headers[headerIdx];
                    frame2Headers[header.alias] = true;
                }

                for (
                    let unionIdx = 0, unionLen = unionComponent.length;
                    unionIdx < unionLen;
                    unionIdx++
                ) {
                    const union = unionComponent[unionIdx];

                    let from = '',
                        to = '',
                        fromDataType = '',
                        toDataType = '';

                    if (frame1Headers[union.to]) {
                        to = union.to;
                        to = union.toDataType;
                    }

                    if (frame2Headers[union.from]) {
                        from = union.from;
                        fromDataType = union.fromDataType;
                    }

                    if (!from && !to) {
                        continue;
                    }
                    unionArr.push({
                        from: from,
                        fromDataType: fromDataType,
                        to: to,
                        toDataType: toDataType,
                    });
                }

                scope.pipelineUnion.union = unionArr;
            }

            if (frame1Component.headers && frame1Component.headers.length > 0) {
                scope.pipelineUnion.frame1.headers = frame1Component.headers;
            }

            if (frame2Component.headers && frame2Component.headers.length > 0) {
                scope.pipelineUnion.frame2.headers = frame2Component.headers;
            }

            // draw the grids
            drawGrid('frame1');
            drawGrid('frame2');

            // TODO: union source + destiniation functions
            updateFrame1(frame1Component);
            updateFrame2(frame2Component);

            if (
                !scope.pipelineUnion.union ||
                scope.pipelineUnion.union.length === 0
            ) {
                addUnion(frame1Component, frame2Component);
            }

            scope.$watch(
                'pipelineUnion.union',
                function (newValues, oldValues) {
                    if (!angular.equals(newValues, oldValues)) {
                        let lastItem = newValues.length - 1;
                        if (
                            newValues[lastItem].from &&
                            newValues[lastItem].to
                        ) {
                            scope.pipelineUnion.disableAdd = false;
                        } else {
                            scope.pipelineUnion.disableAdd = true;
                        }
                    }
                },
                true
            );
        }

        initialize();
    }
}
