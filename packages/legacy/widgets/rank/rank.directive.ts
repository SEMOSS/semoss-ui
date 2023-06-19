'use strict';

import './rank.scss';

import angular from 'angular';

interface RankColumn {
    dir: RankDirection;
    header: any;
}
type RankDirection = 'ASC' | 'DESC';

/**
 * @name rank
 * @desc rank directive
 */
export default angular
    .module('app.rank.directive', [])
    .directive('rank', rankDirective);

rankDirective.$inject = [];

function rankDirective() {
    rankCtrl.$inject = [];
    rankLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {},
        restrict: 'EA',
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'rank',
        bindToController: {},
        template: require('./rank.directive.html'),
        controller: rankCtrl,
        link: rankLink,
    };

    function rankCtrl() {}

    function rankLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        //pipe line directive
        scope.pipelineComponentCtrl = ctrl[1];
        scope.rank.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.rank.columns = [];
        scope.rank.availableHeaders = [];
        scope.rank.newCol = '';

        //partition by column
        scope.rank.partitionByColumns = [];

        scope.rank.addRankColumn = addRankColumn;
        scope.rank.removeRank = removeRank;
        scope.rank.executeRank = executeRank;
        scope.rank.updateRankHeader = updateRankHeader;
        scope.rank.updateRankDirection = updateRankDirection;
        scope.rank.removePartitionByColumn = removePartitionByColumn;
        scope.rank.addPartitionByColumn = addPartitionByColumn;
        //pipeline
        scope.rank.cancel = cancel;

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

            if (scope.rank.PIPELINE) {
                scope.rank.columns = [];
                // make sure to grab the right headers for this frame
                const srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    scope.rank.headers = srcComponent.headers;
                }
                // grab the already applied the rank details
                const rankColValue = scope.pipelineComponentCtrl.getComponent(
                    'parameters.RANK_COLUMN.value'
                );
                if (rankColValue) {
                    scope.rank.newCol = rankColValue.newCol;

                    for (let i = 0; i < rankColValue.columns.length; i++) {
                        const obj = scope.rank.headers.find(function (option) {
                            return (
                                option.alias === rankColValue.columns[i].columns
                            );
                        });

                        scope.rank.columns.push({
                            dir: rankColValue.columns[i].rankDir,
                            header: obj,
                        });
                    }
                    // partition column mapping
                    if (
                        rankColValue.partitionByCols &&
                        rankColValue.partitionByCols.length > 0
                    ) {
                        for (
                            let i = 0;
                            i < rankColValue.partitionByCols.length;
                            i++
                        ) {
                            const partitionObj = scope.rank.headers.find(
                                function (option) {
                                    return (
                                        option.alias ===
                                        rankColValue.partitionByCols[i]
                                    );
                                }
                            );
                            scope.rank.partitionByColumns.push({
                                header: partitionObj,
                            });
                        }
                    }
                }
            } else {
                //set the headers
                scope.rank.headers = scope.widgetCtrl.getFrame().headers || [];
            }

            // set available
            setAvailableColumns();

            if (scope.rank.columns.length === 0) {
                addRankColumn();
            }
        }

        /**
         * @name setAvailableColumns
         * @desc Set available headers for selecting a column to rank
         */
        function setAvailableColumns(): void {
            // get selected
            const selected = {};
            for (
                let colIdx = 0, colLen = scope.rank.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                const column = scope.rank.columns[colIdx];

                if (column.header) {
                    selected[column.header.alias] = true;
                }
            }
            // it should not show in dropdown since its selected as partition column
            for (
                let colIdx = 0, colLen = scope.rank.partitionByColumns.length;
                colIdx < colLen;
                colIdx++
            ) {
                const partitionBycolumn = scope.rank.partitionByColumns[colIdx];

                if (partitionBycolumn.header) {
                    selected[partitionBycolumn.header.alias] = true;
                }
            }

            scope.rank.availableHeaders = [];

            for (
                let headerIdx = 0, headerLen = scope.rank.headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                const header = scope.rank.headers[headerIdx];

                if (!selected[header.alias]) {
                    scope.rank.availableHeaders.push(header);
                }
            }
        }

        /**
         * @name addRankColumn
         * @desc add Rank Column
         */
        function addRankColumn(): void {
            scope.rank.columns.push({
                dir: 'ASC', // default direction in backend would be 'ASC'
                header: '',
            });

            setAvailableColumns();
        }

        /**
         * @name addPartitionByColumn
         * @desc add Partition By Column
         */
        function addPartitionByColumn(): void {
            scope.rank.partitionByColumns.push({
                header: '',
            });

            setAvailableColumns();
        }

        /**
         * @name removeRank
         * @param idx - rank to remove
         * @desc remove an existing rank
         */
        function removeRank(idx: number): void {
            if (scope.rank.columns.length > 1) {
                scope.rank.columns.splice(idx, 1);

                // set available
                setAvailableColumns();
            }
        }

        /**
         * @name updateRankHeader
         * @desc Update the rank
         * @param  column - selected column
         */
        function updateRankHeader(column: RankColumn): void {
            // set available
            setAvailableColumns();

            if (!column.dir) {
                return;
            }
        }

        /**
         * @name updateRankDirection
         * @desc Reset values, set direction, and execute rank if column is true
         * @param  column -  Column state
         * @param dir - new direction
         */
        function updateRankDirection(
            column: RankColumn,
            dir: RankDirection
        ): void {
            if (column.dir === dir) {
                return;
            }
            // set the new direction
            column.dir = dir;

            if (!column.header) {
                return;
            }
        }

        /**
         * @name executeRank
         * @desc executes the rank
         */
        function executeRank(): void {
            let query = '';
            // validate the fields
            if (
                !scope.rank.newCol ||
                scope.rank.columns.length === 0 ||
                scope.rank.columns[0].header === ''
            ) {
                scope.widgetCtrl.alert('warn', 'Please enter all the fields.');
                return;
            }

            if (scope.rank.PIPELINE) {
                const components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                // validate the rank column name
                if (validateRankColumName()) {
                    scope.widgetCtrl.alert(
                        'warn',
                        'Entered column already exist.'
                    );
                    return;
                }

                const rankParameters = getRankParameters();
                // rank pixel script
                query =
                    query +
                    'Rank(columns=' +
                    JSON.stringify(rankParameters.columns) +
                    ', newCol=' +
                    JSON.stringify(scope.rank.newCol) +
                    ', sort=' +
                    JSON.stringify(rankParameters.sortValues);

                if (
                    scope.rank.partitionByColumns &&
                    scope.rank.partitionByColumns.length > 0
                ) {
                    query =
                        query +
                        ', partitionByCols=' +
                        JSON.stringify(getPartitionParameters());
                }

                query = query + ')';

                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'variable',
                            components: [scope.widgetCtrl.getFrame('name')],
                        },
                        {
                            type: 'Pixel',
                            components: [query],
                            terminal: true,
                        },
                        {
                            type: 'auto',
                            components: [scope.widgetCtrl.widgetId],
                            terminal: true,
                        },
                    ],
                    function (response: PixelReturnPayload) {
                        let hasErrors = false;

                        for (
                            let outputIdx = 0,
                                outputLen = response.pixelReturn.length;
                            outputIdx < outputLen;
                            outputIdx++
                        ) {
                            if (
                                response.pixelReturn[
                                    outputIdx
                                ].operationType.indexOf('ERROR') > -1
                            ) {
                                hasErrors = true;
                                break;
                            }
                        }

                        if (hasErrors) {
                            // already handled in store service
                        } else {
                            scope.widgetCtrl.alert(
                                'success',
                                'Successfully updated row values.'
                            );
                        }
                    }
                );
            }
        }

        /**
         * @name cancel
         * @desc return back to pipeline
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name buildParams
         * @desc builds params for pipeline
         * @return the params and their values
         */
        function buildParams() {
            const params: any = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
            };

            if (scope.rank.newCol && scope.rank.columns.length > 0) {
                const rankParameters = getRankParameters();

                params.RANK_COLUMN = [
                    { newCol: scope.rank.newCol },
                    { columns: rankParameters.columns },
                    { sortValues: rankParameters.sortValues },
                    {
                        partitionByCols: getPartitionParameters(),
                    },
                ];
            }

            return params;
        }
        /**
         * @name validateRankColumName
         * @desc checks rank column present in headers or not
         * @return {object}
         */
        function validateRankColumName() {
            let cleanName = getCleanName(),
                isExist;
            isExist = scope.rank.headers.find(function (option) {
                return option.alias === cleanName;
            });
            return isExist;
        }

        function getCleanName() {
            let rankColumName = scope.rank.newCol;
            rankColumName = rankColumName.trim();
            rankColumName = rankColumName.split('+').join('');
            rankColumName = rankColumName.split('@').join('');
            rankColumName = rankColumName.split('%').join('');
            rankColumName = rankColumName.split(';').join('');
            return rankColumName.replace(new RegExp('[^a-zA-Z0-9]', 'g'), '_');
        }

        /**
         * @name getRankParameters
         * @desc creates rank parameters
         * @return {Object}
         */
        function getRankParameters() {
            const cols: any[] = [];
            const colSortValues: any[] = [];

            for (
                let colIdx = 0, colLen = scope.rank.columns.length;
                colIdx < colLen;
                colIdx++
            ) {
                const column = scope.rank.columns[colIdx];

                if (column.header) {
                    cols.push(column.header.alias);
                    colSortValues.push(column.dir);
                }
            }

            return { columns: cols, sortValues: colSortValues };
        }

        /**
         * @name getRankParameters
         * @desc creates rank parameters
         * @return {Object}
         */
        function getPartitionParameters() {
            const partitionCols: any[] = [];

            for (
                let colIdx = 0, colLen = scope.rank.partitionByColumns.length;
                colIdx < colLen;
                colIdx++
            ) {
                const partitionColumn = scope.rank.partitionByColumns[colIdx];
                if (partitionColumn.header) {
                    partitionCols.push(partitionColumn.header.alias);
                }
            }

            return partitionCols;
        }

        /**
         * @name removePartitionByColumn
         * @desc Remove partition by column
         */
        function removePartitionByColumn(index) {
            scope.rank.partitionByColumns.splice(index, 1);

            // set available
            setAvailableColumns();
        }
        /**
         * @name loadPreview
         * @desc loads preview
         * @return {void}
         */
        function loadPreview() {
            const pixel = buildParams();
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /** Initialize **/
        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            // for pipeline rank
            if (scope.rank.PIPELINE) {
                const srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (!srcComponent) {
                    scope.pipelineComponentCtrl.closeComponent();
                    return;
                }

                loadPreview();
            }
            // listeners
            const rankUpdateFrameListener = scope.widgetCtrl.on(
                    'update-frame',
                    resetPanel
                ),
                rankupdateTaskListener = scope.widgetCtrl.on(
                    'update-task',
                    resetPanel
                );

            // cleanup
            scope.$on('$destroy', function () {
                rankUpdateFrameListener();
                rankupdateTaskListener();
            });

            resetPanel();
        }

        initialize();
    }
}
