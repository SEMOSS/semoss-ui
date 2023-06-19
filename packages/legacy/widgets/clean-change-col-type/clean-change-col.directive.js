/* eslint-disable valid-jsdoc */
'use strict';

import './clean-change-col.scss';

export default angular
    .module('app.clean-change-col.directive', [])
    .directive('cleanChangeCol', cleanChangeColDirective);

cleanChangeColDirective.$inject = [];

function cleanChangeColDirective() {
    cleanChangeColCtrl.$inject = [];
    cleanChangeColLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        restrict: 'EA',
        scope: {},
        require: ['^widget', '?^pipelineComponent'],
        controllerAs: 'cleanChangeCol',
        bindToController: {},
        template: require('./clean-change-col.directive.html'),
        controller: cleanChangeColCtrl,
        link: cleanChangeColLink,
    };

    function cleanChangeColCtrl() {}

    function cleanChangeColLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];
        scope.pipelineComponentCtrl = ctrl[1];

        // VARIABLES]
        scope.cleanChangeCol.PIPELINE = scope.pipelineComponentCtrl !== null;
        scope.cleanChangeCol.headers = [];
        scope.cleanChangeCol.units = ['STRING', 'NUMBER', 'DATE'];
        scope.cleanChangeCol.selectedUnit = '';
        scope.cleanChangeCol.selectedDate = '';
        scope.cleanChangeCol.selectedColumn = '';

        // FUNCTIONS
        scope.cleanChangeCol.handleDefaultDateType = handleDefaultDateType;
        scope.cleanChangeCol.cancel = cancel;
        scope.cleanChangeCol.submit = submit;

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
                scope.cleanChangeCol.selectedColumn &&
                scope.cleanChangeCol.selectedUnit
            ) {
                params.CHANGE_COLUMN_TYPE = {
                    column: scope.cleanChangeCol.selectedColumn,
                    format:
                        scope.cleanChangeCol.selectedDate &&
                        scope.cleanChangeCol.selectedUnit === 'DATE'
                            ? scope.cleanChangeCol.selectedDate
                            : '',
                    dataType: scope.cleanChangeCol.selectedUnit,
                };
            }
            return params;
        }

        /**
         * @name handleDefaultDateType
         * @desc sets default date type
         * @param selectedType - type to convert selected column to
         * @return {void}
         */
        function handleDefaultDateType(selectedType) {
            if (selectedType === 'DATE' && !scope.cleanChangeCol.selectedDate) {
                scope.cleanChangeCol.selectedDate = 'yyyy-MM-dd';
            }
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
         * @name submit
         * @desc build pixel and submit to call.  reset panel
         * @return {void}
         */
        function submit() {
            let pixelComponents = [],
                components,
                callback;

            if (
                scope.cleanChangeCol.selectedUnit === 'DATE' &&
                !scope.cleanChangeCol.selectedDate
            ) {
                scope.widgetCtrl.alert('warn', 'Date format is required.');
                return;
            }

            if (scope.cleanChangeCol.PIPELINE) {
                components = buildParams();
                scope.pipelineComponentCtrl.executeComponent(components, {});
            } else {
                pixelComponents.push(
                    {
                        type: 'variable',
                        components: [scope.widgetCtrl.getFrame('name')],
                    },
                    {
                        type: 'changeColumnType',
                        components: [
                            scope.cleanChangeCol.selectedColumn,
                            scope.cleanChangeCol.selectedUnit,
                            scope.cleanChangeCol.selectedUnit === 'DATE' &&
                            scope.cleanChangeCol.selectedDate
                                ? scope.cleanChangeCol.selectedDate
                                : '',
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
                            'Sucessfully changed column type.'
                        );
                    }
                };
                scope.widgetCtrl.execute(pixelComponents, callback);
                resetPanel();
            }
        }
        /**
         * @name resetPanel
         * @desc reset the panel when the data changes
         * @return {void}
         */
        function resetPanel() {
            var headers = scope.widgetCtrl.getFrame('headers') || [];
            if (scope.cleanChangeCol.PIPELINE) {
                // make sure to grab the right headers for this frame
                let srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (srcComponent.headers && srcComponent.headers.length > 0) {
                    headers = srcComponent.headers;
                }
            }
            scope.cleanChangeCol.headers = headers;
        }

        function loadPreview() {
            let pixel = buildParams();
            scope.pipelineComponentCtrl.previewComponent(pixel);
        }

        function setPipelineState() {
            let colNameComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.colName.value'
                ),
                formatComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.format.value'
                ),
                newTypeComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.newType.value'
                );
            if (colNameComponent) {
                scope.cleanChangeCol.selectedColumn = colNameComponent;
                scope.cleanChangeCol.selectedUnit = newTypeComponent;
                scope.cleanChangeCol.selectedDate = formatComponent || '';
            }
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            let updateFrameListener, srcComponent;

            if (scope.cleanChangeCol.PIPELINE) {
                srcComponent = scope.pipelineComponentCtrl.getComponent(
                    'parameters.SOURCE.value'
                );
                if (!srcComponent) {
                    scope.piplineComponentCtrl.closeComponent();
                    return;
                }
                loadPreview();
                setPipelineState();
            }
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
