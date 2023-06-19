'use strict';

import angular from 'angular';

import './clean-update-row.scss';

export default angular
    .module('app.clean-update-row.directive', [])
    .directive('cleanUpdateRow', cleanUpdateRow);

cleanUpdateRow.$inject = [];

function cleanUpdateRow() {
    updateRowLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];
    updateRowCtrl.$inject = [];

    return {
        restrict: 'E',
        template: require('./clean-update-row.directive.html'),
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        bindToController: {},
        controllerAs: 'updateRow',
        controller: updateRowCtrl,
        link: updateRowLink,
    };

    function updateRowCtrl() {}

    function updateRowLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        scope.updateRow.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.updateRow.headers = [];
        scope.updateRow.updateValue = true;
        scope.updateRow.comparisonColumn = '';
        scope.updateRow.comparisonOperator = '==';
        scope.updateRow.comparisonValue = '';
        scope.updateRow.comparisonValueOptions = [];
        scope.updateRow.comparisonValueOptionsCanCollect = true;
        scope.updateRow.comparisonValueLoading = false;
        scope.updateRow.comparisonNewValue = '';
        scope.updateRow.comparisonNewValueOptions = [];
        scope.updateRow.comparisonNewValueOptionsCanCollect = true;
        scope.updateRow.comparisonNewValueLoading = false;
        scope.updateRow.comparisonNewColumn = '';

        scope.updateRow.updateCompareValueOptions = updateCompareValueOptions;
        scope.updateRow.searchCompareValueOptions = searchCompareValueOptions;
        scope.updateRow.getMoreCompareValueOptions = getMoreCompareValueOptions;
        scope.updateRow.updateCompareNewValueOptions =
            updateCompareNewValueOptions;
        scope.updateRow.searchCompareNewValueOptions =
            searchCompareNewValueOptions;
        scope.updateRow.getMoreCompareNewValueOptions =
            getMoreCompareNewValueOptions;

        scope.updateRow.cancel = cancel;
        scope.updateRow.loadPreview = loadPreview;
        scope.updateRow.execute = execute;
        scope.updateRow.setFocus = setFocus;

        /**
         * @name resetPanel
         * @desc updates the initial panel options
         */
        function resetPanel(): void {
            scope.updateRow.oldState = scope.widgetCtrl.getOptions(
                'widgetOptions.cleanUpdateRow.options'
            );
            scope.updateRow.headers =
                scope.widgetCtrl.getFrame('headers') || [];

            if (scope.updateRow.PIPELINE) {
                // make sure to grab the right headers for this frame
                const srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    scope.updateRow.headers = srcComponent.headers;
                }

                // set the initial columns if not set
                if (!scope.updateRow.comparisonColumn) {
                    scope.updateRow.comparisonColumn =
                        scope.updateRow.headers[0].alias;
                }

                if (!scope.updateRow.comparisonNewColumn) {
                    scope.updateRow.comparisonNewColumn =
                        scope.updateRow.headers[0].alias;
                }
            } else {
                scope.updateRow.comparisonColumn =
                    scope.updateRow.headers[0].alias;
                scope.updateRow.comparisonNewColumn =
                    scope.updateRow.headers[0].alias;
            }

            if (
                scope.updateRow.oldState &&
                scope.updateRow.oldState.comparisonColumn
            ) {
                const headerNames = scope.updateRow.headers.map(function (h) {
                    return h.alias;
                });

                if (
                    headerNames.indexOf(
                        scope.updateRow.oldState.comparisonColumn
                    ) > -1
                ) {
                    scope.updateRow.comparisonColumn =
                        scope.updateRow.oldState.comparisonColumn;
                }
                if (
                    scope.updateRow.oldState.comparisonColumn ===
                        scope.updateRow.oldState.comparisonNewColumn ||
                    headerNames.indexOf(
                        scope.updateRow.oldState.comparisonNewColumn
                    ) > -1
                ) {
                    scope.updateRow.comparisonNewColumn =
                        scope.updateRow.oldState.comparisonNewColumn;
                }
            }

            if (
                scope.updateRow.oldState &&
                scope.updateRow.oldState.comparisonOperator
            ) {
                scope.updateRow.comparisonOperator =
                    scope.updateRow.oldState.comparisonOperator;
            }

            updateCompareValueOptions();
        }

        /**
         * @name updateCompareValueOptions
         * @desc updates the comparison value when the comparison column is changed
         */
        function updateCompareValueOptions(): void {
            if (scope.updateRow.updateValue) {
                // only change this if user hasn't edited it
                scope.updateRow.comparisonNewColumn =
                    scope.updateRow.comparisonColumn;
                updateCompareNewValueOptions(false);
            }

            searchCompareValueOptions(scope.updateRow.comparisonValue);
        }

        /**
         * @name searchCompareValueOptions
         * @desc searchs the comparison value when the comparison value is changed
         * @param search - search the options?
         */
        function searchCompareValueOptions(search: string): void {
            let frameName = scope.widgetCtrl.getFrame('name');

            if (scope.updateRow.PIPELINE) {
                const sourceFrame = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value.name'
                );
                if (sourceFrame) {
                    frameName = sourceFrame;
                }
            }

            const pixel =
                'META | ( comparisonValueOptions = Frame (' +
                frameName +
                ') | Select ( ' +
                scope.updateRow.comparisonColumn +
                ' ) | Filter(' +
                scope.updateRow.comparisonColumn +
                ' ?like "' +
                search +
                '") | Sort(columns=[' +
                scope.updateRow.comparisonColumn +
                '], sort=[asc]) | Iterate ( ) ) | Collect ( 50 ) ;';

            // reset
            scope.updateRow.comparisonValueOptions = [];
            scope.updateRow.comparisonValueOptionsCanCollect = true;
            scope.updateRow.comparisonValueLoading = true;

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('TASK_DATA') > -1) {
                    // looking at operationType to figure out how to grab the return data
                    for (
                        let i = 0, len = output.data.values.length;
                        i < len;
                        i++
                    ) {
                        if (output.data.values[i][0] !== null) {
                            scope.updateRow.comparisonValueOptions.push(
                                output.data.values[i][0]
                            );
                        }
                    }
                    scope.updateRow.comparisonValueOptionsCanCollect =
                        output.data.values.length > 0;
                }

                if (
                    scope.updateRow.oldState &&
                    scope.updateRow.oldState.comparisonValue &&
                    scope.updateRow.comparisonValueOptions.indexOf(
                        scope.updateRow.oldState.comparisonValue
                    ) > -1
                ) {
                    scope.updateRow.comparisonValue =
                        scope.updateRow.oldState.comparisonValue;
                    delete scope.updateRow.oldState.comparisonValue;
                }

                scope.updateRow.comparisonValueLoading = false;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getMoreCompareValue
         * @desc gets more of the comparison value when the comparison column
         * @return {void}
         */
        function getMoreCompareValueOptions() {
            if (!scope.updateRow.comparisonValueOptionsCanCollect) {
                return;
            }

            const pixel = 'META | comparisonValueOptions | Collect ( 50 ) ;';

            // reset
            scope.updateRow.comparisonValueLoading = true;
            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('TASK_DATA') > -1) {
                    // looking at operationType to figure out how to grab the return data
                    for (
                        let i = 0, len = output.data.values.length;
                        i < len;
                        i++
                    ) {
                        if (
                            scope.updateRow.comparisonValueOptions.indexOf(
                                output.data.values[i][0]
                            ) === -1
                        ) {
                            scope.updateRow.comparisonValueOptions.push(
                                output.data.values[i][0]
                            );
                        }
                    }
                    scope.updateRow.comparisonValueOptionsCanCollect =
                        output.data.values.length > 0;
                }

                scope.updateRow.comparisonValueLoading = false;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name updateCompareNewValueOptions
         * @param detach - detach from dom
         * @desc updates the comparison value when the comparison column is changed
         */
        function updateCompareNewValueOptions(detach: boolean): void {
            if (detach) {
                scope.updateRow.updateValue = false;
            }

            // scope.updateRow.comparisonNewValue = '';
            searchCompareNewValueOptions('');
        }

        /**
         * @name searchCompareNewValueOptions
         * @desc searchs the new comparison value when the new comparison value is changed
         */
        function searchCompareNewValueOptions(search: string): void {
            let frameName = scope.widgetCtrl.getFrame('name');

            if (scope.updateRow.PIPELINE) {
                const sourceFrame = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value.name'
                );
                if (sourceFrame) {
                    frameName = sourceFrame;
                }
            }
            const pixel =
                'META | ( comparisonNewValueOptions = Frame (' +
                frameName +
                ') | Select ( ' +
                scope.updateRow.comparisonNewColumn +
                ' )  | Filter( ' +
                scope.updateRow.comparisonNewColumn +
                ' ?like "' +
                search +
                '")  | Sort(columns=[' +
                scope.updateRow.comparisonNewColumn +
                '], sort=[asc]) | Iterate ( ) ) | Collect ( 50 ) ;';

            // reset
            scope.updateRow.comparisonNewValueOptions = [];
            scope.updateRow.comparisonNewValueOptionsCanCollect = true;
            scope.updateRow.comparisonNewValueLoading = true;

            // register message to come back to
            const callback = function (response: PixelReturnPayload) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('TASK_DATA') > -1) {
                    // looking at operationType to figure out how to grab the return data
                    for (
                        let i = 0, len = output.data.values.length;
                        i < len;
                        i++
                    ) {
                        if (output.data.values[i][0] !== null) {
                            scope.updateRow.comparisonNewValueOptions.push(
                                output.data.values[i][0]
                            );
                        }
                    }
                    scope.updateRow.comparisonNewValueOptionsCanCollect =
                        output.data.values.length > 0;
                }

                // no need to update new comparison value, user will be typing this in on their own
                //  if (scope.updateRow.oldState && scope.updateRow.oldState.comparisonNewValue && scope.updateRow.comparisonNewValueOptions.indexOf(scope.updateRow.oldState.comparisonNewValue) > -1) {
                //      scope.updateRow.comparisonNewValue = scope.updateRow.oldState.comparisonNewValue;
                //      delete scope.updateRow.oldState.comparisonNewValue;
                //  }

                scope.updateRow.comparisonNewValueLoading = false;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name getMoreCompareNewValueOptions
         * @desc gets more of the comparison value when the comparison column
         * @return {void}
         */
        function getMoreCompareNewValueOptions() {
            if (!scope.updateRow.comparisonNewValueOptionsCanCollect) {
                return;
            }

            const pixel = 'META | comparisonNewValueOptions | Collect ( 50 ) ;';

            // reset
            scope.updateRow.comparisonNewValueLoading = true;

            const callback = function (response) {
                const output = response.pixelReturn[0].output,
                    type = response.pixelReturn[0].operationType;

                if (type.indexOf('TASK_DATA') > -1) {
                    // looking at operationType to figure out how to grab the return data
                    for (
                        let i = 0, len = output.data.values.length;
                        i < len;
                        i++
                    ) {
                        scope.updateRow.comparisonNewValueOptions.push(
                            output.data.values[i][0]
                        );
                    }
                    scope.updateRow.comparisonNewValueOptionsCanCollect =
                        output.data.values.length > 0;
                }

                scope.updateRow.comparisonNewValueLoading = false;
            };

            scope.widgetCtrl.meta(
                [
                    {
                        type: 'Pixel',
                        components: [pixel],
                        terminal: true,
                    },
                ],
                callback
            );
        }

        /**
         * @name buildParams
         * @desc builds params for pipeline
         * @return the params and their values
         */
        function buildParams(): {
            SOURCE: { name: string };
            UPDATE_ROW?: { newCol: string; newVal: any };
            FILTERS?: any[];
        } {
            const params: any = {
                SOURCE: scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                ),
            };

            if (
                scope.updateRow.comparisonNewColumn &&
                scope.updateRow.comparisonColumn &&
                (scope.updateRow.comparisonNewValue ||
                    scope.updateRow.comparisonNewValue === 0) &&
                (scope.updateRow.comparisonOperator ||
                    scope.updateRow.comparisonNewValue === 0)
            ) {
                params.UPDATE_ROW = {
                    newCol: scope.updateRow.comparisonNewColumn,
                    newVal: scope.updateRow.comparisonNewValue,
                };

                if (
                    scope.updateRow.comparisonValue &&
                    !isNaN(Number(scope.updateRow.comparisonValue))
                ) {
                    scope.updateRow.comparisonValue = Number(
                        scope.updateRow.comparisonValue
                    );
                }

                params.FILTERS = [
                    {
                        type: 'value',
                        operator: '',
                        alias: scope.updateRow.comparisonColumn,
                        values: scope.updateRow.comparisonValue,
                        comparator: scope.updateRow.comparisonOperator,
                    },
                ];
            }

            return params;
        }

        /**
         * @name validate
         * @desc valid the form and return true if valid
         * @return boolean if the form is valid
         */
        function validate(): boolean {
            if (!scope.updateRow.comparisonColumn) {
                return false;
            }

            if (!scope.updateRow.comparisonOperator) {
                return false;
            }

            if (!scope.updateRow.comparisonValue) {
                return false;
            }

            if (!scope.updateRow.comparisonNewColumn) {
                return false;
            }

            return true;
        }

        /**
         * @name execute
         * @desc runs the query using all the defined values
         * @return {void}
         */
        function execute(): void {
            // validate
            if (!validate()) {
                scope.widgetCtrl.alert(
                    'warn',
                    'Please make sure all fields are filled out.'
                );
                return;
            }

            if (scope.updateRow.PIPELINE) {
                const components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                let pixel =
                    'UpdateRowValues(' +
                    scope.updateRow.comparisonNewColumn +
                    ',"' +
                    scope.updateRow.comparisonNewValue +
                    '",Filter(' +
                    scope.updateRow.comparisonColumn +
                    scope.updateRow.comparisonOperator;

                if (
                    scope.updateRow.comparisonValue &&
                    (isNaN(Number(scope.updateRow.comparisonValue)) ||
                        scope.updateRow.comparisonValue.length === 0)
                ) {
                    pixel += '"' + scope.updateRow.comparisonValue + '"))';
                } else {
                    pixel += scope.updateRow.comparisonValue + '))';
                }

                scope.widgetCtrl.execute(
                    [
                        {
                            type: 'variable',
                            components: [scope.widgetCtrl.getFrame('name')],
                        },
                        {
                            type: 'Pixel',
                            components: [pixel],
                            terminal: true,
                        },
                        {
                            type: 'refreshInsight',
                            components: [scope.widgetCtrl.insightID],
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

                const options = {
                    comparisonNewColumn: scope.updateRow.comparisonNewColumn,
                    comparisonNewValue: scope.updateRow.comparisonNewValue,
                    comparisonColumn: scope.updateRow.comparisonColumn,
                    comparisonOperator: scope.updateRow.comparisonOperator,
                    comparisonValue: scope.updateRow.comparisonNewValue,
                };
                scope.widgetCtrl.setWidgetState(
                    'cleanUpdateRow',
                    'options',
                    options
                );
                if (options.comparisonNewColumn === options.comparisonColumn) {
                    scope.updateRow.comparisonValue =
                        scope.updateRow.comparisonNewValue;
                }
            }
        }

        /**
         * @name setFocus
         * @param input - name of input
         * @desc sets focus on update input if true
         */
        function setFocus(input: string): void {
            scope.updateRow.updateHasFocus = input === 'updateColumn';
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         */
        function cancel(): void {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name loadPreview
         * @desc loads preview
         */
        function loadPreview(): void {
            const pixel = buildParams();

            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /**
         * @name setPipelineState
         * @desc sets the pipeline existing values
         * @returns {void}
         */
        function setPipelineState(): void {
            //TODO: why is this seperate from initialize?
            let updateRowParam = scope.pipelineComponentCtrl.getComponent(
                    'parameters.UPDATE_ROW.value'
                ),
                filterParam = scope.pipelineComponentCtrl.getComponent(
                    'parameters.FILTERS.value'
                ),
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );

            if (!srcComponent) {
                scope.pipelineComponentCtrl.closeComponent();
                return;
            }

            if (updateRowParam) {
                scope.updateRow.comparisonNewValue = updateRowParam.newVal;

                scope.updateRow.comparisonNewColumn = '';
                for (
                    let headerIdx = 0, headerLen = srcComponent.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header = srcComponent.headers[headerIdx];
                    if (header.alias === updateRowParam.newCol) {
                        scope.updateRow.comparisonNewColumn =
                            updateRowParam.newCol;
                        break;
                    }
                }
            }

            if (filterParam) {
                filterParam = filterParam[0];

                scope.updateRow.comparisonColumn = '';
                for (
                    let headerIdx = 0, headerLen = srcComponent.headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    const header = srcComponent.headers[headerIdx];
                    if (header.alias === filterParam.alias) {
                        scope.updateRow.comparisonColumn = filterParam.alias;
                        break;
                    }
                }

                scope.updateRow.comparisonOperator = filterParam.comparator;
                scope.updateRow.comparisonValue = filterParam.values;
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         */
        function initialize(): void {
            let selectedDataListener: () => {}, updateFrameListener: () => {};

            selectedDataListener = scope.widgetCtrl.on(
                'update-selected',
                function () {
                    const selected = scope.widgetCtrl.getSelected('selected');
                    if (selected && selected.length > 0) {
                        if (scope.updateRow.updateHasFocus) {
                            scope.updateRow.comparisonNewColumn =
                                selected[0].alias;
                        } else {
                            scope.updateRow.comparisonColumn =
                                selected[0].alias;
                            // rebind to comparison column
                            scope.updateRow.updateValue = true;
                            // Make pixel to update values
                            updateCompareValueOptions();
                        }
                    }
                }
            );

            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                updateCompareValueOptions
            );

            // clean up
            scope.$on('$destroy', function () {
                selectedDataListener();
                updateFrameListener();
            });

            resetPanel();
            if (scope.updateRow.PIPELINE) {
                setPipelineState();
            }
        }

        initialize();
    }
}
