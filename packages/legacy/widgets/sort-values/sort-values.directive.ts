'use strict';

import './sort-values.scss';

import angular from 'angular';

interface SortColumn {
    dir: SortDirection;
    header: any;
    values: { display: string; value: string }[];
    performance: boolean;
}

type SortDirection = 'ASC' | 'DESC' | 'CUSTOM';

/**
 * @name sort-values
 * @desc Sort Values directive used to sort the directive
 */
export default angular
    .module('app.sort-values.directive', [])
    .directive('sortValues', sortValuesDirective);

sortValuesDirective.$inject = [];

function sortValuesDirective() {
    sortValuesCtrl.$inject = [];
    sortValuesLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget'],
        controllerAs: 'sortValues',
        bindToController: {},
        template: require('./sort-values.directive.html'),
        controller: sortValuesCtrl,
        link: sortValuesLink,
    };

    function sortValuesCtrl() {}

    function sortValuesLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.sortValues.columns = [];
        scope.sortValues.availableHeaders = [];
        scope.sortValues.autoRefresh = true;

        // functions
        scope.sortValues.addSort = addSort;
        scope.sortValues.removeSort = removeSort;
        scope.sortValues.updateSortHeader = updateSortHeader;
        scope.sortValues.updateSortDirection = updateSortDirection;
        scope.sortValues.executeSort = executeSort;
        scope.sortValues.continueCustom = continueCustom;
        scope.sortValues.reorderCustom = reorderCustom;
        scope.sortValues.moveCustom = moveCustom;

        /** Panel */
        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         */
        function resetPanel(): void {
            const active = scope.widgetCtrl.getWidget('active'),
                layout = scope.widgetCtrl.getWidget(
                    'view.' + active + '.layout'
                ),
                keys = scope.widgetCtrl.getWidget(
                    'view.' + active + '.keys.' + layout
                );

            //set the headers
            scope.sortValues.headers = keys || [];

            // register function to come back
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                // clear it out
                scope.sortValues.columns = [];

                // add in the frame filters
                if (type.indexOf('ERROR') === -1) {
                    const headers = {};

                    // map the headers, so we can grab by alias
                    for (
                        let headerIdx = 0,
                            headerLen = scope.sortValues.headers.length;
                        headerIdx < headerLen;
                        headerIdx++
                    ) {
                        const header = scope.sortValues.headers[headerIdx];

                        headers[header.alias] = header;
                    }

                    for (
                        let outputIdx = 0, outputLen = output.length;
                        outputIdx < outputLen;
                        outputIdx++
                    ) {
                        const sort = output[outputIdx];

                        let direction: SortDirection | undefined,
                            header: any | undefined,
                            values: any[] = [];

                        if (sort.type === 'CUSTOM') {
                            direction = 'CUSTOM';
                            header =
                                headers[
                                    sort.content.columnToSort.content.alias
                                ];
                            values = sort.content.values.map(function (d) {
                                return {
                                    value: d,
                                    display: String(d).replace(/_/g, ' '),
                                };
                            });
                        } else if (sort.type === 'COLUMN') {
                            direction = sort.content.direction;
                            header = headers[sort.content.alias];
                        }

                        // add it
                        scope.sortValues.columns.push({
                            dir: direction,
                            header: header,
                            values: values,
                            performance: false,
                        });
                    }
                }

                // set available
                setAvailableColumns();

                if (scope.sortValues.columns.length === 0) {
                    addSort();
                }
            };

            const components: PixelCommand[] = [
                {
                    meta: true,
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type: 'getPanelSort',
                    components: [],
                    terminal: true,
                },
            ];

            // execute a meta query
            scope.widgetCtrl.meta(components, callback);
        }

        /**
         * @name setAvailableColumns
         * @desc Set available headers for selecting a column to sort
         */
        function setAvailableColumns(): void {
            // get selected
            const selected = {};
            for (
                let colIdx = 0, colLen = scope.sortValues.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                const column = scope.sortValues.columns[colIdx];

                if (column.header) {
                    selected[column.header.alias] = true;
                }
            }

            scope.sortValues.availableHeaders = [];

            for (
                let headerIdx = 0, headerLen = scope.sortValues.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                const header = scope.sortValues.headers[headerIdx];

                if (!selected[header.alias]) {
                    scope.sortValues.availableHeaders.push(header);
                }
            }
        }

        /** Sort */
        /**
         * @name addSort
         * @desc Adds a column sort state object
         */
        function addSort(): void {
            scope.sortValues.columns.push({
                dir: undefined,
                header: undefined,
                values: [],
                performance: false,
            });
        }

        /**
         * @name removeSort
         * @param idx - sort to remove
         * @desc remove an existing sort
         */
        function removeSort(idx: number): void {
            scope.sortValues.columns.splice(idx, 1);

            // set available
            setAvailableColumns();

            // if (scope.sortValues.autoRefresh) {
            //     executeSort();
            // }
        }

        /**
         * @name updateSortHeader
         * @desc Update the sort
         * @param  column - selected column
         */
        function updateSortHeader(column: SortColumn): void {
            // clear the values
            column.values = [];

            // set available
            setAvailableColumns();

            if (!column.dir) {
                // Setting default to ASC when no sort option is selected
                column.dir = 'ASC';
                return;
            }

            if (column.dir === 'CUSTOM') {
                checkCustom(column);
            }

            // if (column.dir !== 'CUSTOM' && scope.sortValues.autoRefresh) {
            //     executeSort();
            // }
        }

        /**
         * @name updateSortDirection
         * @desc Reset values, set direction, and execute sort if column and auto refresh are true
         * @param  column -  Column state
         * @param dir - new direction
         */
        function updateSortDirection(
            column: SortColumn,
            dir: SortDirection
        ): void {
            if (column.dir === dir) {
                return;
            }

            // turn it off when we are in custom
            if (dir === 'CUSTOM') {
                scope.sortValues.autoRefresh = false;
            }

            // clear the values
            column.values = [];

            // set the new direction
            column.dir = dir;

            if (!column.header) {
                return;
            }

            if (column.dir === 'CUSTOM') {
                checkCustom(column);
            }

            // if (column.dir !== 'CUSTOM' && scope.sortValues.autoRefresh) {
            //     executeSort();
            // }
        }

        /**
         * @name executeSort
         * @desc executes the sort
         */
        function executeSort(): void {
            // execute the valid one
            const options: any[] = [];
            for (
                let colIdx = 0, colLen = scope.sortValues.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                const column = scope.sortValues.columns[colIdx];

                if (column.dir && column.header) {
                    if (column.dir === 'ASC' || column.dir === 'DESC') {
                        options.push({
                            type: 'column',
                            columns: [column.header.alias],
                            sort: [column.dir],
                        });
                    } else if (column.dir === 'CUSTOM') {
                        const values = column.values.map((d) => {
                            return d.value;
                        });

                        options.push({
                            type: 'custom',
                            column: column.header.alias,
                            values: values || [],
                        });
                    }
                }
            }

            scope.widgetCtrl.execute([
                {
                    type: 'panel',
                    components: [scope.widgetCtrl.panelId],
                },
                {
                    type:
                        options.length > 0
                            ? 'setMultiTypePanelSort'
                            : 'unsortPanel',
                    components: [options],
                    terminal: true,
                },
                {
                    type: 'Pixel',
                    components: [
                        `Panel(${scope.widgetCtrl.panelId}) | RefreshPanelTask()`,
                    ],
                    terminal: true,
                },
            ]);
        }

        /** Custom **/
        /**
         * @name checkCustom
         * @desc Get all values of the selected column for custom sorting
         * @param  column - Column state
         */
        function checkCustom(column: SortColumn): void {
            if (!column.header) {
                return;
            }

            // clear it
            column.values = [];

            // first we count
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                const count = output.data.values[0][0];

                // greater than 25, ask the user if they wanna continue
                if (count > 25) {
                    column.performance = true;
                    return;
                }

                // it is good to go
                column.performance = false;

                // get the custom values
                getCustom(column);
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `Frame(${scope.widgetCtrl.getFrame(
                                'name'
                            )}) | Select(UniqueCount(${
                                column.header.alias
                            })) | Collect(-1)`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name continueCustom
         * @desc override the performance check and get the values
         * @param  column - Column state
         */
        function continueCustom(column: SortColumn): void {
            // mark it as good to go
            column.performance = false;

            getCustom(column);
        }

        /**
         * @name getCustom
         * @desc get the custom values
         * @param  column - Column state
         */
        function getCustom(column: SortColumn): void {
            const callback = (response: PixelReturnPayload) => {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('ERROR') > -1) {
                    return;
                }

                // get the values
                column.values = output.data.values.map(function (d) {
                    return {
                        value: d[0],
                        display: String(d[0]).replace(/_/g, ' '),
                    };
                });

                // run the sort
                // if (scope.sortValues.autoRefresh) {
                //     executeSort();
                // }
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [
                            `Frame(${scope.widgetCtrl.getFrame(
                                'name'
                            )}) | Select(${column.header.alias}) | Collect(-1)`,
                        ],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name reorderCustom
         * @desc Moves value to a new position in the array. Executes pixel to sync backend
         * @param column - Column state
         * @param currentIndex - Previous index position in array
         * @param newIndex - New index position in array
         */
        function reorderCustom(
            column: SortColumn,
            currentIndex: number,
            newIndex: number
        ): void {
            // get
            const value = column.values.splice(currentIndex, 1)[0];

            // add
            column.values.splice(newIndex, 0, value);

            //execute it if possible
            // if (scope.sortValues.autoRefresh) {
            //     executeSort();
            // }
        }

        /**
         * Move item up or down list by one. Execute pixel if auto refresh is true
         * @param column - Column state
         * @param idx - Current value index position
         * @param  direction
         */
        function moveCustom(
            column: SortColumn,
            idx: number,
            direction: 'down' | 'up'
        ): void {
            const item = column.values.splice(idx, 1)[0];

            if (direction === 'down') {
                column.values.splice(idx + 1, 0, item);
            } else if (direction === 'up') {
                column.values.splice(idx - 1, 0, item);
            } else {
                return;
            }

            // if (scope.sortValues.autoRefresh) {
            //     executeSort();
            // }
        }

        /** Initialize **/
        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // listeners
            const sortUpdateFrameListener = scope.widgetCtrl.on(
                    'update-frame',
                    resetPanel
                ),
                sortupdateTaskListener = scope.widgetCtrl.on(
                    'update-task',
                    resetPanel
                );

            // cleanup
            scope.$on('$destroy', function () {
                sortUpdateFrameListener();
                sortupdateTaskListener();
            });

            resetPanel();
        }

        initialize();
    }
}
