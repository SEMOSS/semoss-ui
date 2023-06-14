'use strict';

import './clean-date-add.scss';

export default angular
    .module('app.clean-date-add.directive', [])
    .directive('cleanDateAdd', cleanDateAddDirective);

cleanDateAddDirective.$inject = [];

function cleanDateAddDirective() {
    cleanDateAddCtrl.$inject = [];
    cleanDateAddLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'cleanDateAdd',
        bindToController: {},
        template: require('./clean-date-add.directive.html'),
        controller: cleanDateAddCtrl,
        link: cleanDateAddLink,
    };

    function cleanDateAddCtrl() {}

    function cleanDateAddLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        // VARIABLES
        scope.cleanDateAdd.PIPELINE = scope.pipelineComponentCtrl !== null;

        scope.cleanDateAdd.headers = [];
        scope.cleanDateAdd.selectedColumn = '';

        scope.cleanDateAdd.units = [
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

        scope.cleanDateAdd.selectedUnit = '';

        scope.cleanDateAdd.createNewCol = false;
        scope.cleanDateAdd.newColName = '';

        scope.cleanDateAdd.value = 0;

        // FUNCTIONS
        scope.cleanDateAdd.submit = submit;
        scope.cleanDateAdd.newColRefresh = newColRefresh;
        scope.cleanDateAdd.loadPreview = loadPreview;
        scope.cleanDateAdd.cancel = cancel;

        /**
         * @name buildParams
         * @desc builds params for pipeline
         * @return {object} the params and their values
         */
        function buildParams() {
            var params = {
                SOURCE: {
                    name: scope.pipelineComponentCtrl.getComponent(
                        'parameters.SOURCE.value.name'
                    ),
                },
            };

            // make sure all required inputs are filled.
            if (
                scope.cleanDateAdd.selectedColumn &&
                scope.cleanDateAdd.selectedUnit &&
                (scope.cleanDateAdd.value || scope.cleanDateAdd.value === 0) &&
                (scope.cleanDateAdd.createNewCol
                    ? scope.cleanDateAdd.newColName
                    : true)
            ) {
                params.DATE_ADD_VALUE = {
                    srcCol: scope.cleanDateAdd.selectedColumn,
                    new_col: scope.cleanDateAdd.newColName,
                    unit: scope.cleanDateAdd.selectedUnit,
                    val_to_add: scope.cleanDateAdd.value,
                };
            }
            return params;
        }

        /**
         * @name cancel
         * @desc closes pipeline component
         * @return {void}
         */
        function cancel() {
            scope.pipelineComponentCtrl.closeComponent();
        }

        /**
         * @name newColRefresh
         * @desc resets the new col name field to '' when the user no longer wants to submit a new column
         * @returns {void}
         */
        function newColRefresh() {
            scope.cleanDateAdd.newColName = '';
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

            if (scope.cleanDateAdd.PIPELINE) {
                components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                pixelComponents.push(
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'dateAddValue',
                        components: [
                            scope.cleanDateAdd.selectedColumn,
                            scope.cleanDateAdd.newColName,
                            scope.cleanDateAdd.selectedUnit,
                            scope.cleanDateAdd.value,
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
                };

                scope.widgetCtrl.execute(pixelComponents, callback);
                resetPanel();
                newColRefresh();
                scope.cleanDateAdd.createNewCol = false;
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
            scope.cleanDateAdd.headers = [];

            if (scope.cleanDateAdd.PIPELINE) {
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
                    scope.cleanDateAdd.headers.push(headers[headerIdx]);
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
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            var updateFrameListener, srcComponent, dateModel;

            if (scope.cleanDateAdd.PIPELINE) {
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                dateModel = scope.pipelineComponentCtrl.getComponent(
                    'parameters.DATE_ADD_VALUE.value'
                );
                if (!srcComponent) {
                    scope.piplineComponentCtrl.closeComponent();
                    return;
                }

                // set the previous state if they exists
                if (dateModel) {
                    if (dateModel.srcCol) {
                        scope.cleanDateAdd.selectedColumn = dateModel.srcCol;
                    }

                    if (dateModel.unit) {
                        scope.cleanDateAdd.selectedUnit = dateModel.unit;
                    }

                    if (dateModel.val_to_add) {
                        scope.cleanDateAdd.value = dateModel.val_to_add;
                    }

                    if (dateModel.new_col) {
                        // toggle on & set value
                        scope.cleanDateAdd.createNewCol = true;
                        scope.cleanDateAdd.newColName = dateModel.new_col;
                    }
                }

                loadPreview();
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
