'use strict';

import './preview.scss';
import '../total-instances/total-instances.directive';
import { Grid } from 'ag-grid-community';
import '@/widgets/grid-standard/grid-standard.scss';
/**
 * @name preview.directive.js
 * @desc federate view
 */
angular
    .module('app.preview.directive', ['app.total-instances.directive'])
    .directive('preview', previewDirective);

previewDirective.$inject = ['$timeout', 'semossCoreService'];

function previewDirective($timeout, semossCoreService) {
    previewCtrl.$inject = [];
    previewLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'E',
        template: require('./preview.directive.html'),
        controller: previewCtrl,
        link: previewLink,
        require: ['^widget'],
        scope: {},
        bindToController: {},
        controllerAs: 'preview',
        replace: true,
    };

    function previewCtrl() {}

    function previewLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        var clickTimeout,
            previewCounter = 0,
            previewTotalCounter = 0,
            currentDataCounter = -1,
            currentTotalDataCounter = -1;

        scope.preview.loading = false;
        scope.preview.grid = undefined;

        /**
         * @name drawPreview
         * @returns {void}
         * @desc draw the preview grid
         */
        function drawPreview() {
            var previewGridEle = ele[0].querySelector('#preview__grid');
            previewGridEle.className += ' ag-theme-balham';
            const options = {
                rowData: [],
                columnDefs: [],
            };
            scope.preview.grid = new Grid(previewGridEle, options);
            if (scope.preview.grid.gridOptions.api) {
                scope.preview.grid.gridOptions.api.addEventListener(
                    'cellClicked',
                    clickEvent
                );
            }
        }

        /**
         * @name clearPreview
         * @returns {void}
         * @desc clear the data for preview
         */
        function clearPreview() {
            scope.preview.grid.gridOptions.api.setColumnDefs([]);
            scope.preview.grid.gridOptions.api.setRowData([]);
        }

        /**
         * @name setPreview
         * @desc set the data for preview
         * @param {object} data - data to load into the view
         * @returns {void}
         */
        function setPreview(data) {
            var schema, values, headerIdx, headerLen;

            if (
                typeof data === 'undefined' ||
                typeof data.headers === 'undefined' ||
                typeof data.values === 'undefined' ||
                data.headers.length === 0
            ) {
                clearPreview();
                return;
            }

            schema = [];
            for (
                headerIdx = 0, headerLen = data.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                schema.push({
                    headerName: String(data.headers[headerIdx]).replace(
                        /_/g,
                        ' '
                    ),
                    field: data.headers[headerIdx],
                    valueFormatter: formatCellValue,
                    cellStyle: function (params) {
                        if (params.value === null) {
                            return {
                                color: 'DimGray',
                                fontStyle: 'italic',
                                fontSize: '0.8125em',
                            };
                        }

                        return null;
                    },
                });
            }

            values = semossCoreService.visualization.getTableData(
                data.headers,
                data.values,
                data.rawHeaders
            );

            // Paint
            scope.preview.grid.gridOptions.api.setColumnDefs(schema);
            scope.preview.grid.gridOptions.api.setRowData(values.rawData);
        }

        /**
         * @name formatPreview
         * @desc load the data for preview
         * @param {array} response - pixel response to extra data from
         * @returns {object} data - data to extra
         */
        function formatPreview(response) {
            var data, stepIdx;

            // backwards look at task
            for (
                stepIdx = response.pixelReturn.length - 1;
                stepIdx >= 0;
                stepIdx--
            ) {
                if (
                    response.pixelReturn[stepIdx].operationType.indexOf(
                        'TASK_DATA'
                    ) > -1
                ) {
                    data = response.pixelReturn[stepIdx].output.data;
                    break;
                } else if (
                    response.pixelReturn[stepIdx].operationType.indexOf(
                        'NEW_EMPTY_INSIGHT'
                    ) > -1
                ) {
                    data = formatPreview(
                        response.pixelReturn[stepIdx].output.insightData
                    );
                    if (typeof data !== 'undefined') {
                        break;
                    }
                } else if (
                    response.pixelReturn[stepIdx].operationType.indexOf(
                        'QUERY_ROW_COUNT'
                    ) > -1
                ) {
                    // account for query row count
                    // which returns just a straight integer value
                    data = { values: [[response.pixelReturn[stepIdx].output]] };
                    break;
                }
            }

            return data;
        }

        /**
         * @name formatCellValue
         * @desc Format the value displayed to the user
         * @param {any} cell - the cell data
         * @return {string} the formatted value
         */
        function formatCellValue(cell) {
            var value = cell.value;

            if (value === null) {
                value = 'null';
            }

            return value;
        }

        /**
         * @name loadPreview
         * @desc load the data for preview
         * @param {array} pixelComponents - pixelComponents to run
         * @param {array} totalCountPixelComponents - run to get the total count
         * @param {boolean} newInsight to run the preview in new insight
         * @returns {void}
         */
        function loadPreview(
            pixelComponents,
            totalCountPixelComponents,
            newInsight
        ) {
            var callback, totalCountCallback;

            if (!pixelComponents || pixelComponents.length === 0) {
                clearPreview();
                scope.preview.loading = false;
                return;
            }

            // register message to come back to
            callback = function (boundCounter, response) {
                // lets check the previewCounter here to make sure we only set the data for the latest preview that was run.
                // this will resolve issues with a task that comes back later than the latest task that ran
                if (boundCounter < currentDataCounter) {
                    return;
                }

                // we look at the last one
                var data = formatPreview(response);

                if (typeof data === 'undefined') {
                    clearPreview();
                    scope.preview.loading = false;
                    return;
                }
                scope.preview.data = data;

                setPreview(data);
                scope.preview.loading = false;
                // register which preview data is current set
                currentDataCounter = boundCounter;
            };

            totalCountCallback = function (boundCounter, response) {
                var data = formatPreview(response);

                // lets check the previewCounter here to make sure we only set the data for the latest preview that was run.
                // this will resolve issues with a task that comes back later than the latest task that ran
                if (boundCounter < currentTotalDataCounter) {
                    return;
                }

                if (typeof data !== 'undefined' && data.values) {
                    scope.preview.totalCount = data.values[0][0];
                    scope.widgetCtrl.emit('preview-total-count', {
                        data: scope.preview.totalCount,
                    });
                }

                // register which preview total is currently set
                currentTotalDataCounter = boundCounter;
            };

            if (pixelComponents.length > 0) {
                scope.preview.loading = true;

                scope.widgetCtrl.meta(
                    pixelComponents,
                    callback.bind(null, previewCounter),
                    [],
                    newInsight ? 'new' : ''
                );
                previewCounter++;
                if (totalCountPixelComponents) {
                    scope.widgetCtrl.meta(
                        totalCountPixelComponents,
                        totalCountCallback.bind(null, previewTotalCounter),
                        [],
                        newInsight ? 'new' : ''
                    );
                    previewTotalCounter++;
                }
            }
        }

        /**
         * @name clickEvent
         * @desc add a click event
         * @param {event} e - canvas data event
         * @returns {void}
         */
        function clickEvent(e) {
            if (clickTimeout) {
                $timeout.cancel(clickTimeout);
            }

            clickTimeout = $timeout(
                function (cell) {
                    if (cell) {
                        scope.widgetCtrl.emit('select-preview', [
                            {
                                display: String(cell.colDef.field).replace(
                                    /_/g,
                                    ' '
                                ),
                            },
                        ]);
                    }
                }.bind(null, e),
                300
            );
        }

        /**
         * @name initialize
         * @desc initialize the module
         * @returns {void}
         */
        function initialize() {
            var initListener, initComponents, loadListener;

            scope.preview.loading = true;

            initListener = scope.widgetCtrl.on(
                'load-preview',
                function (payload) {
                    initComponents = payload.pixelComponents;
                }
            );

            // destroy the initListiner
            initListener();

            drawPreview();
            if (initComponents) {
                loadPreview(initComponents);
            }

            loadListener = scope.widgetCtrl.on(
                'load-preview',
                function (payload) {
                    if (scope.preview.grid) {
                        loadPreview(
                            payload.pixelComponents,
                            payload.totalCountPixelComponents,
                            payload.newInsight
                        );
                    }
                }
            );

            scope.$on('$destroy', function () {
                scope.preview.grid.gridOptions.api.destroy();
                loadListener();
            });

            scope.preview.loading = false;
        }

        initialize();
    }
}
