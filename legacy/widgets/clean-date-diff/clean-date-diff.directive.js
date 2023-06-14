'use strict';

import './clean-date-diff.scss';

export default angular
    .module('app.clean-date-diff.directive', [])
    .directive('cleanDateDiff', cleanDateDiffDirective);

cleanDateDiffDirective.$inject = [];

function cleanDateDiffDirective() {
    cleanDateDiffCtrl.$inject = [];
    cleanDateDiffLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'cleanDateDiff',
        bindToController: {},
        template: require('./clean-date-diff.directive.html'),
        controller: cleanDateDiffCtrl,
        link: cleanDateDiffLink,
    };

    function cleanDateDiffCtrl() {}

    function cleanDateDiffLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];
        scope.cleanDateDiff.PIPELINE = scope.pipelineComponentCtrl !== null;

        // VARIABLES
        scope.cleanDateDiff.headers = [];
        scope.cleanDateDiff.selectedStartColumn = '';
        scope.cleanDateDiff.selectedEndColumn = '';
        scope.cleanDateDiff.inputDate = null;
        scope.cleanDateDiff.newColName = '';
        scope.cleanDateDiff.selectedUnit = '';
        scope.cleanDateDiff.inputDateUse = 'none';
        scope.cleanDateDiff.options = [
            {
                display: 'Two Columns',
                value: 'none',
            },
            {
                display: 'Start Column, Static End Date',
                value: 'end',
            },
            {
                display: 'Static Start Date, End Column',
                value: 'start',
            },
        ];
        scope.cleanDateDiff.units = [
            {
                display: 'Day',
                value: 'day',
            },
            {
                display: 'Week',
                value: 'week',
            },
            {
                display: 'Month',
                value: 'month',
            },
            {
                display: 'Year',
                value: 'year',
            },
        ];

        // FUNCTIONS
        scope.cleanDateDiff.submit = submit;
        scope.cleanDateDiff.loadPreview = loadPreview;
        scope.cleanDateDiff.cancel = cancel;

        /**
         * @name cancel
         * @desc closes pipeline component
         * @return {void}
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name buildParams
         * @desc build params for pipeline
         * @returns {*} pipeline params
         */
        function buildParams() {
            var params = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
            };

            // TODO: DO I NEED A CONDITIONAL??? flow control? make sure the proper inputs are provided?
            // or just do that in html...make sure you can't 'apply' till everything is provided
            params.DATE_DIFFERENCE = {
                start_column: scope.cleanDateDiff.selectedStartColumn,
                end_column: scope.cleanDateDiff.selectedEndColumn,
                input_use: scope.cleanDateDiff.inputDateUse,
                input_date: scope.cleanDateDiff.inputDate,
                unit: scope.cleanDateDiff.selectedUnit,
                newCol: scope.cleanDateDiff.newColName,
            };

            return params;
        }

        /**
         * @name submit
         * @desc build pixel and submit to call.  reset panel
         * @return {void}
         */
        function submit() {
            var pixelComponents = [],
                components,
                callback;

            if (scope.cleanDateDiff.PIPELINE) {
                components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                pixelComponents.push(
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'dateDifference',
                        components: [
                            scope.cleanDateDiff.selectedStartColumn,
                            scope.cleanDateDiff.selectedEndColumn,
                            scope.cleanDateDiff.inputDateUse,
                            scope.cleanDateDiff.inputDate,
                            scope.cleanDateDiff.selectedUnit,
                            scope.cleanDateDiff.newColName,
                        ],
                        terminal: true,
                    },
                    {
                        type: 'frame',
                        components: [scope.widgetCtrl.getFrame('name')],
                        terminal: false,
                    },
                    {
                        type: 'queryAll',
                        components: [],
                        terminal: false,
                    },
                    {
                        type: 'autoTaskOptions',
                        components: [scope.widgetCtrl.panelId, 'Grid'],
                        terminal: false,
                    },
                    {
                        type: 'collect',
                        components: [2000],
                        terminal: true,
                    }
                );

                callback = function (response) {
                    if (
                        response.pixelReturn[0].operationType.indexOf(
                            'ERROR'
                        ) === -1
                    ) {
                        // success
                        scope.widgetCtrl.alert(
                            'success',
                            'Sucessfully ran date arithmetic.'
                        );
                    }

                    resetPanel();
                };

                scope.widgetCtrl.execute(pixelComponents, callback);
            }
        }

        /**
         * @name resetPanel
         * @desc reset the panel when the data changes
         * @return {void}
         */
        function resetPanel() {
            var headers = scope.widgetCtrl.getFrame('headers') || [],
                headerIdx,
                headerLen;
            scope.cleanDateDiff.headers = [];

            if (scope.cleanDateDiff.PIPELINE) {
                // make sure to grab the right headers for this frame
                let srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    headers = srcComponent.headers;
                }
            }

            for (
                headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (headers[headerIdx].dataType === 'DATE') {
                    scope.cleanDateDiff.headers.push(headers[headerIdx]);
                }
            }
        }

        /**
         * @name loadPreview
         * @desc loads preview
         * @return {void}
         */
        function loadPreview() {
            var pixel;

            pixel = buildParams();
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        /**
         * @name setPipelineState
         * @desc sets the pipeline existing values
         * @returns {void}
         */
        function setPipelineState() {
            let dateDiffParam = scope.pipelineComponentCtrl.getComponent(
                    'parameters.DATE_DIFFERENCE.value'
                ),
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );

            if (!srcComponent) {
                scope.pipelineComponentCtrl.closeComponent();
                return;
            }

            if (dateDiffParam) {
                scope.cleanDateDiff.selectedStartColumn =
                    dateDiffParam.start_column;
                scope.cleanDateDiff.selectedEndColumn =
                    dateDiffParam.end_column;
                scope.cleanDateDiff.inputDateUse = dateDiffParam.input_use;
                scope.cleanDateDiff.inputDate = dateDiffParam.input_date;
                scope.cleanDateDiff.selectedUnit = dateDiffParam.unit;
                scope.cleanDateDiff.newColName = dateDiffParam.newCol;
            }
            loadPreview();
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var updateFrameListener;

            if (scope.cleanDateDiff.PIPELINE) {
                setPipelineState();
            }
            // what is selectedDataListener
            updateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );

            scope.$on('$destroy', function () {
                updateFrameListener();
            });

            resetPanel();
        }
        initialize();
    }
}
