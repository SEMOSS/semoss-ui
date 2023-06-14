'use strict';

import './analytics-random-forest-model-summary.scss';

export default angular
    .module('app.analytics-random-forest-model-summary.directive', [])
    .directive(
        'analyticsRandomForestModelSummary',
        analyticsRandomForestModelSummaryDirective
    );

analyticsRandomForestModelSummaryDirective.$inject = ['semossCoreService'];

function analyticsRandomForestModelSummaryDirective() {
    analyticsRandomForestModelSummaryCtrl.$inject = [];
    analyticsRandomForestModelSummaryLink.$inject = [
        'scope',
        'ele',
        'attrs',
        'ctrl',
    ];

    return {
        restrict: 'E',
        scope: {
            data: '=',
        },
        require: ['^widget'],
        templateUrl:
            'widgets/analytics-random-forest-model-summary/analytics-random-forest-model-summary.directive.html',
        controller: analyticsRandomForestModelSummaryCtrl,
        controllerAs: 'analyticsRandomForestModelSummary',
        link: analyticsRandomForestModelSummaryLink,
    };

    function analyticsRandomForestModelSummaryCtrl() {}

    function analyticsRandomForestModelSummaryLink(scope, ele, attrs, ctrl) {
        scope.widgetCtrl = ctrl[0];

        // variables
        scope.analyticsRandomForestModelSummary.confMatrix = [];
        scope.analyticsRandomForestModelSummary.colnames = [];
        scope.analyticsRandomForestModelSummary.min;
        scope.analyticsRandomForestModelSummary.max;
        scope.analyticsRandomForestModelSummary.mean;
        scope.analyticsRandomForestModelSummary.stdDev;
        scope.analyticsRandomForestModelSummary.numModels;
        scope.analyticsRandomForestModelSummary.numTrees;
        scope.analyticsRandomForestModelSummary.filename;
        scope.analyticsRandomForestModelSummary.selectedModel = 1;
        scope.analyticsRandomForestModelSummary.selectedTree = 1;
        scope.analyticsRandomForestModelSummary.confMatrixStatus = true;
        scope.analyticsRandomForestModelSummary.updateDendrogram =
            updateDendrogram;

        function updateDendrogram() {
            scope.widgetCtrl.execute([
                {
                    type: 'Pixel',
                    components: [
                        'RunRandomForest(space = ["' +
                            scope.analyticsRandomForestModelSummary.appId +
                            '"], panel = [2], mode = ["updateTree"], ' +
                            ' filename = ["' +
                            scope.analyticsRandomForestModelSummary.filename +
                            '"], tree_settings = [true, ' +
                            scope.analyticsRandomForestModelSummary
                                .selectedModel +
                            ', ' +
                            scope.analyticsRandomForestModelSummary
                                .selectedTree +
                            ']);',
                    ],
                    terminal: true,
                },
            ]);
        }

        /**
         * @name initialize
         * @desc function that is called on directive load to grab all model summary values before painting the visualization
         * @returns {void}
         */
        function initialize() {
            if (scope.widgetCtrl.getShared('insight.app_id')) {
                scope.analyticsRandomForestModelSummary.appId =
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
                        scope.analyticsRandomForestModelSummary.appId =
                            payload.pixelReturn[0].output[0];
                    }
                );
            }
            scope.widgetCtrl.meta(
                [
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            'If ( VariableExists ( "predError" ) , predError )',
                        ],
                        terminal: true,
                    },
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            'If ( VariableExists ( "confMatx" ) , confMatx )',
                        ],
                        terminal: true,
                    },
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            'If ( VariableExists ( "confMatxHeaders" ) , confMatxHeaders )',
                        ],
                        terminal: true,
                    },
                    {
                        meta: true,
                        type: 'Pixel',
                        components: [
                            'If ( VariableExists ( "treeOptions" ) , treeOptions )',
                        ],
                        terminal: true,
                    },
                    {
                        type: 'Pixel',
                        components: [
                            'Panel (3) | SetPanelLabel("Random Forest Model Summary")',
                        ],
                        terminal: true,
                    },
                ],
                function (payload) {
                    scope.analyticsRandomForestModelSummary.predError =
                        payload.pixelReturn[0].output;
                    scope.analyticsRandomForestModelSummary.numModels =
                        payload.pixelReturn[3].output[0].output;
                    scope.analyticsRandomForestModelSummary.numTrees =
                        payload.pixelReturn[3].output[1].output;
                    scope.analyticsRandomForestModelSummary.filename =
                        payload.pixelReturn[3].output[2].output;
                    if (
                        payload.pixelReturn[1].output[4] &&
                        payload.pixelReturn[1].output[4].output === 'Reg'
                    ) {
                        // if model was regression
                        scope.analyticsRandomForestModelSummary.confMatrixStatus = false;
                        scope.analyticsRandomForestModelSummary.min =
                            payload.pixelReturn[1].output[0].output;
                        scope.analyticsRandomForestModelSummary.max =
                            payload.pixelReturn[1].output[1].output;
                        scope.analyticsRandomForestModelSummary.mean =
                            payload.pixelReturn[1].output[2].output;
                        scope.analyticsRandomForestModelSummary.stdDev =
                            payload.pixelReturn[1].output[3].output;
                    } else {
                        // else if it was classification to paint confusion matrix
                        var i,
                            j,
                            k,
                            matrixDim = payload.pixelReturn[1].output.length;
                        scope.analyticsRandomForestModelSummary.confMatrixStatus = true;
                        for (i = 0; i < matrixDim; i++) {
                            scope.analyticsRandomForestModelSummary.confMatrix.push(
                                []
                            );
                            for (j = 0; j < matrixDim; j++) {
                                scope.analyticsRandomForestModelSummary.confMatrix[
                                    i
                                ][j] =
                                    payload.pixelReturn[1].output[i].output[
                                        j
                                    ].output;
                            }
                        }
                        for (
                            k = 0;
                            k < payload.pixelReturn[2].output.length;
                            k++
                        ) {
                            scope.analyticsRandomForestModelSummary.colnames.push(
                                payload.pixelReturn[2].output[k].output
                            );
                        }
                    }
                }
            );
        }

        initialize();
    }
}
