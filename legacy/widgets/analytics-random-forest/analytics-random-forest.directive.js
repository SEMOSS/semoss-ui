/* eslint-disable no-undefined */
'use strict';

import './analytics-random-forest.scss';

export default angular
    .module('app.analytics-random-forest.directive', [])
    .directive('analyticsRandomForest', analyticsRandomForestDirective);

analyticsRandomForestDirective.$inject = ['semossCoreService'];

function analyticsRandomForestDirective() {
    analyticsRandomForestCtrl.$inject = [];
    analyticsRandomForestLink.$inject = ['scope', 'ele', 'attrs', 'ctrl'];

    return {
        scope: {
            data: '=',
        },
        restrict: 'EA',
        controllerAs: 'analyticsRandomForest',
        bindToController: {},
        template: require('./analytics-random-forest.directive.html'),
        controller: analyticsRandomForestCtrl,
        link: analyticsRandomForestLink,
        require: ['^widget'],
    };

    function analyticsRandomForestCtrl() {}

    function analyticsRandomForestLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // listeners
        var analyticsRandomForestUpdateFrameListener,
            analyticsRandomForestUpdateTaskListener,
            updateOrnamentsListener;

        // variables
        scope.analyticsRandomForest.instances = {};
        scope.analyticsRandomForest.instances.options = [];
        scope.analyticsRandomForest.attributes = {};
        scope.analyticsRandomForest.attributes.options = [];
        scope.analyticsRandomForest.attributes.selectedAttributes = [];
        scope.analyticsRandomForest.modelPerformanceVals = '';
        scope.analyticsRandomForest.buildFile = {
            name: '',
            space: 'app',
        };
        scope.analyticsRandomForest.predFile = {
            name: '',
            space: 'app',
        };
        scope.analyticsRandomForest.advancedSettingsStatus = false;
        scope.analyticsRandomForest.isPredictMode = false;
        scope.analyticsRandomForest.sampleBlocks = 100;
        scope.analyticsRandomForest.sampleSize = 1000;
        scope.analyticsRandomForest.treeDepth = 3;
        scope.analyticsRandomForest.nullHandleOptions = [
            'Impute',
            'As_Is',
            'Drop',
        ];
        scope.analyticsRandomForest.nullHandleType =
            scope.analyticsRandomForest.nullHandleOptions[0];

        // functions
        scope.analyticsRandomForest.resetPanel = resetPanel;
        scope.analyticsRandomForest.execute = execute;
        scope.analyticsRandomForest.updateAttributes = updateAttributes;
        scope.analyticsRandomForest.updateInstances = updateInstances;
        scope.analyticsRandomForest.checkRequiredValues = checkRequiredValues;

        /**
         * @name checkRequiredValues
         * @desc function that updates instances available depending on whether the model is being built or predicted from
         * @param {string} mode whether the model if being built or predicted
         * @returns {void}
         */
        function checkRequiredValues(mode) {
            let required = false;
            // warnings for empty fields
            if (mode === 'build') {
                if (
                    scope.analyticsRandomForest.instances.selectedInstance ===
                        undefined ||
                    (scope.analyticsRandomForest.attributes.selectedAttributes
                        .length < 2 &&
                        !scope.analyticsRandomForest.isPredictMode) ||
                    scope.analyticsRandomForest.buildFile.name === '' ||
                    (scope.analyticsRandomForest.advancedSettingsStatus &&
                        scope.analyticsRandomForest.sampleSize === null) ||
                    (scope.analyticsRandomForest.advancedSettingsStatus &&
                        scope.analyticsRandomForest.sampleBlocks === null) ||
                    (scope.analyticsRandomForest.advancedSettingsStatus &&
                        scope.analyticsRandomForest.treeDepth === null)
                ) {
                    required = true;
                }
            } else if (mode === 'predict') {
                if (scope.analyticsRandomForest.predFile.name === '') {
                    required = true;
                }
            }

            return required;
        }

        /**
         * @name updateInstances
         * @desc function that updates instances available depending on whether the model is being built or predicted from
         * @returns {void}
         */
        function updateInstances() {
            if (scope.analyticsRandomForest.isPredictMode) {
                // if predicting, get all table headers from database
                scope.app_id = scope.widgetCtrl.getShared('insight.app_id');
            } else {
                // else, get the instances and attributes from frame
                resetPanel();
            }
        }

        /**
         * @name updateAttributes
         * @desc function that updates attributes list to not include selected instance
         * @param {string} headerToExclude the selected instance to exclude from the list of attributes
         * @returns {void}
         */
        function updateAttributes(headerToExclude) {
            if (!scope.analyticsRandomForest.isPredictMode) {
                // exclude the selected instance from the list of attributes
                var headers = scope.widgetCtrl.getFrame('headers') || [],
                    availableHeaders = [],
                    headerIdx,
                    headerLen;
                for (
                    headerIdx = 0, headerLen = headers.length;
                    headerIdx < headerLen;
                    headerIdx++
                ) {
                    if (
                        availableHeaders.indexOf(headers[headerIdx].alias) ===
                            -1 &&
                        headers[headerIdx].alias !== headerToExclude
                    ) {
                        availableHeaders.push(headers[headerIdx].alias);
                    }
                }
                scope.analyticsRandomForest.attributes.options =
                    availableHeaders;
            }
        }

        /**
         * @name resetPanel
         * @desc function that is resets the panel when the data changes
         * @returns {void}
         */
        function resetPanel() {
            var headers = scope.widgetCtrl.getFrame('headers') || [],
                availableHeaders = [],
                headerIdx,
                headerLen;

            for (
                headerIdx = 0, headerLen = headers.length;
                headerIdx < headerLen;
                headerIdx++
            ) {
                if (availableHeaders.indexOf(headers[headerIdx].alias) === -1) {
                    availableHeaders.push(headers[headerIdx].alias);
                }
            }

            scope.analyticsRandomForest.instances.options = availableHeaders;
            scope.analyticsRandomForest.attributes.options = availableHeaders;

            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: ['InsightPanelIds()'],
                        terminal: true,
                    },
                ],
                function (payload) {
                    scope.analyticsRandomForest.idsUsed =
                        payload.pixelReturn[0].output;
                }
            );

            if (scope.widgetCtrl.getShared('insight.app_id')) {
                scope.analyticsRandomForest.appId =
                    scope.widgetCtrl.getShared('insight.app_id');
            } else {
                scope.widgetCtrl.meta(
                    [
                        {
                            meta: true,
                            type: 'Pixel',
                            components: ['GetQueriedApps()'],
                            terminal: true,
                        },
                    ],
                    function (payload) {
                        scope.analyticsRandomForest.appId =
                            payload.pixelReturn[0].output[0];
                    }
                );
            }
        }

        /**
         * @name execute
         * @desc runs the random forest model and creates panels for variable importance bar chart and model summary visualization
         * @returns {void}
         */
        function execute() {
            var j,
                attributeString,
                randomForestString = '',
                locationToSave,
                name = '';

            if (
                scope.analyticsRandomForest.predFile.name.match(
                    /^(.+)_rf(?:model|param)s\.rds$/
                ) === null
            ) {
                name = scope.analyticsRandomForest.predFile.name;
            } else {
                name = scope.analyticsRandomForest.predFile.name.match(
                    /^(.+)_rf(?:model|param)s\.rds$/
                )[1];
            }

            if (
                (scope.analyticsRandomForest.predFile === undefined &&
                    scope.analyticsRandomForest.isPredictMode) ||
                (scope.analyticsRandomForest.buildFile === undefined &&
                    !scope.analyticsRandomForest.isPredictMode)
            ) {
                scope.widgetCtrl.alert('warn', 'Please select a file.');
                return;
            }

            for (
                j = 0;
                j <
                scope.analyticsRandomForest.attributes.selectedAttributes
                    .length;
                j++
            ) {
                if (j === 0) {
                    attributeString =
                        '"' +
                        scope.analyticsRandomForest.attributes
                            .selectedAttributes[j] +
                        '"';
                } else {
                    attributeString = attributeString.concat(
                        ', "' +
                            scope.analyticsRandomForest.attributes
                                .selectedAttributes[j] +
                            '"'
                    );
                }
            }

            if (!scope.analyticsRandomForest.isPredictMode) {
                // if building model, add visualization panels and call reactor to build model
                locationToSave = scope.analyticsRandomForest.buildFile.space;
                if (scope.analyticsRandomForest.buildFile.space === 'app') {
                    scope.analyticsRandomForest.appId;
                }
                randomForestString =
                    'AddPanel(1); Panel(1) | SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); ';
                randomForestString +=
                    'AddPanel(2); Panel(2) | SetPanelView("visualization", "<encode>{"type":"echarts"}</encode>"); ';
                randomForestString +=
                    scope.widgetCtrl.getFrame('name') +
                    ' | RunRandomForest(classify=["' +
                    scope.analyticsRandomForest.instances.selectedInstance +
                    '"], attributes=[' +
                    attributeString +
                    '], space = ["' +
                    locationToSave +
                    '"], panel = [' +
                    scope.analyticsRandomForest.idsUsed.length +
                    '], settings = [' +
                    scope.analyticsRandomForest.sampleSize +
                    ', ' +
                    scope.analyticsRandomForest.sampleBlocks +
                    ', ' +
                    scope.analyticsRandomForest.treeDepth +
                    '], mode = ["build"], filename = ["' +
                    scope.analyticsRandomForest.buildFile.name +
                    '"], tree_settings = [false, 1, 1]' +
                    ', null_handler = ["' +
                    scope.analyticsRandomForest.nullHandleType +
                    '"]);';
            } else {
                // else if predicting, call the reactor and specify to be predicted
                locationToSave = scope.analyticsRandomForest.predFile.space;
                if (scope.analyticsRandomForest.predFile.space === 'app') {
                    scope.analyticsRandomForest.appId;
                }
                randomForestString =
                    scope.widgetCtrl.getFrame('name') +
                    ' | RunRandomForest(space = ["' +
                    locationToSave +
                    '"], panel = [0], mode = ["predict"],' +
                    ' filename = ["' +
                    name.replace(' ', '_') +
                    '"], null_handler = ["' +
                    scope.analyticsRandomForest.nullHandleType +
                    '"]);';
            }
            scope.widgetCtrl.execute(
                [
                    {
                        type: 'Pixel',
                        components: [randomForestString],
                        terminal: true,
                    },
                ],
                function (payload) {
                    if (!scope.analyticsRandomForest.isPredictMode) {
                        var pxl = '',
                            l,
                            k,
                            matrixDim =
                                payload.pixelReturn[4].output[2].output.matrix
                                    .length;
                        // save model summary metrics to pixel variables
                        pxl +=
                            'predError = [' +
                            payload.pixelReturn[4].output[2].output
                                .predictionError +
                            ']; ';
                        if (
                            payload.pixelReturn[4].output[2].output
                                .matrix[0][0] !== 'Min'
                        ) {
                            // confusion matrix for classification
                            pxl += 'confMatx = (';
                            for (l = 0; l < matrixDim; l++) {
                                pxl += '(';
                                if (l !== matrixDim - 1) {
                                    for (k = 0; k < matrixDim; k++) {
                                        if (k !== matrixDim - 1) {
                                            pxl +=
                                                payload.pixelReturn[4].output[2]
                                                    .output.matrix[l][k] + ', ';
                                        } else {
                                            pxl +=
                                                payload.pixelReturn[4].output[2]
                                                    .output.matrix[l][k];
                                        }
                                    }
                                    pxl += '), ';
                                } else {
                                    for (k = 0; k < matrixDim; k++) {
                                        if (k !== matrixDim - 1) {
                                            pxl +=
                                                payload.pixelReturn[4].output[2]
                                                    .output.matrix[l][k] + ', ';
                                        } else {
                                            pxl +=
                                                payload.pixelReturn[4].output[2]
                                                    .output.matrix[l][k];
                                        }
                                    }
                                    pxl += ')';
                                }
                            }
                            pxl += '); ';
                            pxl +=
                                'confMatxHeaders = (' +
                                payload.pixelReturn[4].output[2].output
                                    .headers +
                                '); ';
                            pxl +=
                                'treeOptions = (' +
                                payload.pixelReturn[4].output[2].output
                                    .tree_options[0] +
                                ', ' +
                                payload.pixelReturn[4].output[2].output
                                    .tree_options[1] +
                                ', "' +
                                payload.pixelReturn[4].output[2].output
                                    .filename +
                                '"); ';
                        } else {
                            // regression information for non-classification
                            scope.analyticsRandomForest.modelPerformanceVals +=
                                payload.pixelReturn[4].output[2].output
                                    .matrix[0][1] +
                                ' , ' +
                                payload.pixelReturn[4].output[2].output
                                    .matrix[1][1] +
                                ' , ' +
                                payload.pixelReturn[4].output[2].output
                                    .matrix[2][1] +
                                ' , ' +
                                payload.pixelReturn[4].output[2].output
                                    .matrix[3][1];
                            pxl +=
                                'confMatx = (' +
                                scope.analyticsRandomForest
                                    .modelPerformanceVals +
                                ' , "Reg"' +
                                '); ';
                            pxl += 'confMatxHeaders = (-1); ';
                            pxl +=
                                'treeOptions = (' +
                                payload.pixelReturn[4].output[2].output
                                    .tree_options[0] +
                                ', ' +
                                payload.pixelReturn[4].output[2].output
                                    .tree_options[1] +
                                ', "' +
                                payload.pixelReturn[4].output[2].output
                                    .filename +
                                '"); ';
                        }
                        pxl +=
                            'AddPanel( 3 ); Panel( 3 ) | SetPanelView("analytics-random-forest-model-summary"); Panel (2) | SetPanelLabel("Dendrogram of Model"); Panel (1) | SetPanelLabel("Importance Values by Variables"); ';
                        pxl +=
                            'SetInsightConfig({"panels":{"0":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"1":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"2":{"config":{"type":"golden","backgroundColor":"","opacity":100}},"3":{"config":{"type":"golden","backgroundColor":"","opacity":100}}},"sheets":{"0":{"golden":{"content":[{"type":"row","content":[{"type":"stack","activeItemIndex":0,"width":45,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"0"}}]},{"type":"column","width":55,"content":[{"type":"stack","activeItemIndex":0,"height":40,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"3"}}]},{"type":"stack","activeItemIndex":0,"width":55,"height":60,"content":[{"type":"component","componentName":"panel","componentState":{"panelId":"1"}},{"type":"component","componentName":"panel","componentState":{"panelId":"2"}}]}]}]}]}}},"sheet":"0"}); ';
                        scope.widgetCtrl.execute([
                            {
                                type: 'Pixel',
                                components: [pxl],
                                terminal: true,
                            },
                        ]);
                    }
                }
            );
        }

        /**
         * @name initialize
         * @desc function that is called on directive load
         * @returns {void}
         */
        function initialize() {
            // listeners
            analyticsRandomForestUpdateFrameListener = scope.widgetCtrl.on(
                'update-frame',
                resetPanel
            );
            analyticsRandomForestUpdateTaskListener = scope.widgetCtrl.on(
                'update-task',
                resetPanel
            );
            updateOrnamentsListener = scope.widgetCtrl.on(
                'update-ornaments',
                resetPanel
            );

            // cleanup
            scope.$on('$destroy', function () {
                analyticsRandomForestUpdateFrameListener();
                analyticsRandomForestUpdateTaskListener();
                updateOrnamentsListener();
            });

            resetPanel();
        }

        initialize();
    }
}
